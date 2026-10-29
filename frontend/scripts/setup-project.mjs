import { readFile, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';

const rootDir = fileURLToPath(new URL('../', import.meta.url));

function toPackageName(value) {
    return value
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function escapeHtml(value) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function readProjectFile(relativePath) {
    return readFile(path.join(rootDir, relativePath), 'utf8');
}

async function writeProjectFile(relativePath, content) {
    await writeFile(path.join(rootDir, relativePath), content, 'utf8');
}

/** Creates the local environment file without overwriting an existing one. */
async function createEnvFile(content) {
    try {
        await writeFile(path.join(rootDir, 'env/.env'), content, { encoding: 'utf8', flag: 'wx' });
        console.log('Created env/.env from env/.env.example');
    } catch (error) {
        if (error.code !== 'EEXIST') {
            throw error;
        }

        console.log('Existing env/.env preserved');
    }
}

/** Updates project-specific configuration using the supplied project name. */
async function setupProject(projectName) {
    const packageName = toPackageName(projectName);

    if (!packageName || packageName.length > 214) {
        throw new Error('Project name must produce a valid package name (1–214 characters).');
    }

    const packageJson = JSON.parse(await readProjectFile('package.json'));
    const translations = JSON.parse(await readProjectFile('public/locales/en/common.json'));
    const indexHtml = await readProjectFile('index.html');
    const envExample = await readProjectFile('env/.env.example');

    if (!translations.home || typeof translations.home.title !== 'string') {
        throw new Error('Expected home.title in public/locales/en/common.json.');
    }

    if (!/<title>[\s\S]*?<\/title>/i.test(indexHtml)) {
        throw new Error('Expected a title element in index.html.');
    }

    if (!/^VITE_APP_TITLE=.*$/m.test(envExample)) {
        throw new Error('Expected VITE_APP_TITLE in env/.env.example.');
    }

    packageJson.name = packageName;
    translations.home.title = projectName;

    const updatedHtml = indexHtml.replace(
        /<title>[\s\S]*?<\/title>/i,
        () => `<title>${escapeHtml(projectName)}</title>`,
    );

    const updatedEnv = envExample.replace(
        /^VITE_APP_TITLE=.*$/m,
        () => `VITE_APP_TITLE=${JSON.stringify(projectName)}`,
    );

    await writeProjectFile('package.json', `${JSON.stringify(packageJson, null, 4)}\n`);
    await writeProjectFile('public/locales/en/common.json', `${JSON.stringify(translations, null, 4)}\n`);
    await writeProjectFile('index.html', updatedHtml);
    await writeProjectFile('env/.env.example', updatedEnv);

    // Create the local environment file only when it does not already exist.
    await createEnvFile(updatedEnv);

    console.log(`\nProject initialized: ${projectName}`);
    console.log(`Package name: ${packageName}`);
    console.log('\nRun "pnpm format" to format the updated files.');
}

const prompt = createInterface({ input: process.stdin, output: process.stdout });

try {
    console.log('\nReact Foundation — Project Setup\n');

    const input = await prompt.question('What is your project name? ');
    const projectName = input.trim().replace(/\s+/g, ' ');

    if (!projectName) {
        throw new Error('Project name cannot be empty.');
    }

    await setupProject(projectName);
} catch (error) {
    console.error(`\nSetup failed: ${error.message}`);
    process.exitCode = 1;
} finally {
    prompt.close();
}
