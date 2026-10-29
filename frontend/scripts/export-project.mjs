/** Export this React project as a clean source ZIP for AI review.
 * Run from anywhere: node scripts/export-project.mjs
 * Requires Node.js 18+; no npm dependencies or external ZIP tools.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deflateRawSync } from "node:zlib";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "exports");

const skipDirs = new Set([
    ".git", ".hg", ".svn", ".idea", ".venv", "venv", "virtualenv", ".virtualenv",
    "__pycache__", ".pytest_cache", ".mypy_cache", ".ruff_cache", ".ty_cache",
    ".tox", ".nox", ".hypothesis", ".cache", ".uv", "site-packages",
    "node_modules", ".pnpm-store", ".yarn", ".next", ".nuxt", ".output",
    ".turbo", ".vite", ".parcel-cache", ".svelte-kit", ".angular",
    "dist", "build", "out", "coverage", "htmlcov", "test-results", "playwright-report",
    "storybook-static", "exports",
]);

const skipFiles = new Set([
    ".ds_store", "thumbs.db", "desktop.ini", ".envrc", ".npmrc", ".pypirc", ".netrc",
    "credentials.json", "secrets.json", "service-account.json", "service_account.json",
    "id_rsa", "id_ed25519", "id_ecdsa", ".coverage",
]);

const skipExtensions = new Set([
    ".pyc", ".pyo", ".log", ".whl", ".egg", ".exe", ".dll", ".so", ".dylib",
    ".class", ".o", ".obj", ".map", ".pem", ".key", ".p12", ".pfx", ".jks",
    ".keystore", ".sqlite", ".sqlite3", ".db",
]);

const envExamples = new Set([".env.example", ".env.sample", ".env.template"]);
const largeFileBytes = 20 * 1024 * 1024;

function environmentSecret(name) {
    const lower = name.toLowerCase();

    if (envExamples.has(lower) || (lower.startsWith(".env.") && /\.(example|sample|template)$/.test(lower))) {
        return false;
    }

    return lower === ".env" || lower.startsWith(".env.") || lower.endsWith(".env");
}

function excludedFile(name) {
    const lower = name.toLowerCase();

    return skipFiles.has(lower) || environmentSecret(lower) || skipExtensions.has(path.extname(lower)) || lower.endsWith(".egg-info");
}

function projectName() {
    try {
        const { name } = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

        if (typeof name === "string" && name.trim()) {
            const finalName = name.split("/").at(-1);
            return finalName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^[._-]+|[._-]+$/g, "") || "project";
        }
    } catch {
        // The directory name is the fallback for projects without package.json.
    }

    const folderName = path.basename(root);
    return folderName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^[._-]+|[._-]+$/g, "") || "project";
}

function listFiles(directory, files, counts) {
    const entries = fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        const lower = entry.name.toLowerCase();

        if (entry.isSymbolicLink()) {
            counts.skipped++;
        } else if (entry.isDirectory()) {
            if (skipDirs.has(lower) || lower.endsWith(".egg-info")) {
                counts.skipped++;
            } else {
                listFiles(fullPath, files, counts);
            }
        } else if (entry.isFile()) {
            if (excludedFile(entry.name)) {
                counts.skipped++;
            } else {
                files.push(fullPath);
            }
        } else {
            counts.skipped++;
        }
    }
}

// Minimal ZIP writer using Node's built-in raw DEFLATE (no archiver dependency).
const crcTable = Uint32Array.from({ length: 256 }, (_, i) => {
    let crc = i;

    for (let bit = 0; bit < 8; bit++) {
        crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
    }

    return crc >>> 0;
});

function crc32(data) {
    let crc = 0xffffffff;

    for (const byte of data) {
        crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    }

    return (crc ^ 0xffffffff) >>> 0;
}

function dosTimestamp(date) {
    const year = Math.min(2107, Math.max(1980, date.getUTCFullYear()));

    return {
        time: (date.getUTCHours() << 11) | (date.getUTCMinutes() << 5) | (date.getUTCSeconds() >>> 1),
        date: ((year - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate(),
    };
}

function writeZip(filePath, files, topDirectory, large) {
    if (files.length > 0xffff) {
        throw new Error("More than 65,535 source files: ZIP64 is not supported.");
    }

    const handle = fs.openSync(filePath, "wx");
    let offset = 0;
    const centralHeaders = [];
    let uncompressedBytes = 0;

    const write = (data) => {
        let written = 0;

        while (written < data.length) {
            const count = fs.writeSync(handle, data, written, data.length - written);

            if (count <= 0) {
                throw new Error("Unable to write the ZIP archive.");
            }

            written += count;
        }

        offset += written;
    };

    try {
        for (const file of files) {
            const raw = fs.readFileSync(file);
            const info = fs.statSync(file);
            const name = Buffer.from(`${topDirectory}/${path.relative(root, file).split(path.sep).join("/")}`, "utf8");
            const compressed = deflateRawSync(raw, { level: 6 });
            const crc = crc32(raw);
            const stamp = dosTimestamp(info.mtime);

            if (raw.length > 0xffffffff || compressed.length > 0xffffffff || offset > 0xffffffff) {
                throw new Error("Source exceeds ZIP32 limits; split the project or exclude large binary files.");
            }

            if (name.length > 0xffff) {
                throw new Error(`Path is too long for ZIP: ${file}`);
            }

            if (raw.length > largeFileBytes) {
                large.push(path.relative(root, file));
            }

            uncompressedBytes += raw.length;

            const local = Buffer.alloc(30);
            local.writeUInt32LE(0x04034b50, 0);
            local.writeUInt16LE(20, 4);
            local.writeUInt16LE(0x0800, 6); // UTF-8 names
            local.writeUInt16LE(8, 8); // DEFLATE
            local.writeUInt16LE(stamp.time, 10);
            local.writeUInt16LE(stamp.date, 12);
            local.writeUInt32LE(crc, 14);
            local.writeUInt32LE(compressed.length, 18);
            local.writeUInt32LE(raw.length, 22);
            local.writeUInt16LE(name.length, 26);

            const localOffset = offset;

            write(local);
            write(name);
            write(compressed);

            const central = Buffer.alloc(46);
            central.writeUInt32LE(0x02014b50, 0);
            central.writeUInt16LE(20, 4);
            central.writeUInt16LE(20, 6);
            central.writeUInt16LE(0x0800, 8);
            central.writeUInt16LE(8, 10);
            central.writeUInt16LE(stamp.time, 12);
            central.writeUInt16LE(stamp.date, 14);
            central.writeUInt32LE(crc, 16);
            central.writeUInt32LE(compressed.length, 20);
            central.writeUInt32LE(raw.length, 24);
            central.writeUInt16LE(name.length, 28);
            central.writeUInt32LE(localOffset, 42);

            centralHeaders.push(central, name);
        }

        const centralStart = offset;

        for (const part of centralHeaders) {
            write(part);
        }

        const centralSize = offset - centralStart;

        if (centralSize > 0xffffffff || centralStart > 0xffffffff) {
            throw new Error("ZIP32 size exceeded.");
        }

        const end = Buffer.alloc(22);
        end.writeUInt32LE(0x06054b50, 0);
        end.writeUInt16LE(files.length, 8);
        end.writeUInt16LE(files.length, 10);
        end.writeUInt32LE(centralSize, 12);
        end.writeUInt32LE(centralStart, 16);

        write(end);
    } finally {
        fs.closeSync(handle);
    }

    return uncompressedBytes;
}

const name = projectName();

fs.mkdirSync(outputDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15);

let output = path.join(outputDir, `${name}-ai-source-${timestamp}.zip`);

for (let index = 2; fs.existsSync(output); index++) {
    output = path.join(outputDir, `${name}-ai-source-${timestamp}-${index}.zip`);
}

const files = [];
const counts = { skipped: 0 };

listFiles(root, files, counts);

const large = [];
const tempOutput = `${output}.tmp`;

let totalBytes;

try {
    totalBytes = writeZip(tempOutput, files, name, large);
    fs.renameSync(tempOutput, output);
} catch (error) {
    if (fs.existsSync(tempOutput)) {
        fs.rmSync(tempOutput);
    }

    throw error;
}

console.log(`Created: ${output}`);
console.log(`Included: ${files.length} files (${(totalBytes / 1048576).toFixed(2)} MiB before compression)`);
console.log(`Excluded: ${counts.skipped} generated, sensitive, or linked entries`);
console.log(`ZIP size: ${(fs.statSync(output).size / 1048576).toFixed(2)} MiB`);

if (large.length) {
    console.log(`Large files included (review before sharing):\n  ${large.join("\n  ")}`);
}

console.log("Review the ZIP for any other project-specific secrets before uploading to an AI service.");