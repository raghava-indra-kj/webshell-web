import { readFile, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));

export async function setupProject(projectName, root = projectRoot) {
    const appName = projectName.trim().replace(/\s+/g, ' ');
    const packageName = appName
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    if (!packageName || appName.length > 80) {
        throw new Error(
            'Project name must contain letters or numbers and be at most 80 characters.',
        );
    }
    const packagePath = path.join(root, 'package.json');
    const examplePath = path.join(root, 'env/.env.example');
    const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
    const example = await readFile(examplePath, 'utf8');
    if (!/^APP_NAME=.*$/m.test(example)) throw new Error('Expected APP_NAME in env/.env.example.');
    const updatedEnv = example.replace(
        /^APP_NAME=.*$/m,
        () => `APP_NAME=${JSON.stringify(appName)}`,
    );
    packageJson.name = packageName;
    await writeFile(packagePath, `${JSON.stringify(packageJson, null, 4)}\n`);
    await writeFile(examplePath, updatedEnv);
    let envCreated = true;
    try {
        await writeFile(path.join(root, 'env/.env'), updatedEnv, { flag: 'wx' });
    } catch (error) {
        if (error.code !== 'EEXIST') throw error;
        envCreated = false;
    }
    return { packageName, envCreated };
}

async function main() {
    let name = process.argv.slice(2).join(' ');
    if (name === '--help') {
        console.log('Usage: pnpm setup:project [project name]');
        return;
    }
    if (!name) {
        const prompt = createInterface({ input: process.stdin, output: process.stdout });
        try {
            name = await prompt.question('Project name: ');
        } finally {
            prompt.close();
        }
    }
    const result = await setupProject(name);
    console.log(
        `Initialized ${result.packageName}. ${result.envCreated ? 'Created env/.env.' : 'Preserved existing env/.env.'}`,
    );
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
    main().catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    });
}
