#!/usr/bin/env node

import { KeyExtractor } from './KeyExtractor';

interface ParsedArgs {
    file?: string;
    wmid?: string;
    password?: string;
}

function parseArgs(args: string[]): ParsedArgs {
    const parsed: ParsedArgs = {};

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === '--file' || arg === '-f') {
            if (i + 1 < args.length) {
                parsed.file = args[++i];
            } else {
                throw new Error('--file/-f requires a value');
            }
        } else if (arg === '--wmid' || arg === '-w') {
            if (i + 1 < args.length) {
                parsed.wmid = args[++i];
            } else {
                throw new Error('--wmid/-w requires a value');
            }
        } else if (arg === '--password' || arg === '-p') {
            if (i + 1 < args.length) {
                parsed.password = args[++i];
            } else {
                throw new Error('--password/-p requires a value');
            }
        } else if (arg === '--help' || arg === '-h') {
            printUsage();
            process.exit(0);
        } else if (arg.startsWith('-')) {
            throw new Error(`Unknown option: ${arg}`);
        } else {
            if (!parsed.file) {
                parsed.file = arg;
            } else if (!parsed.wmid) {
                parsed.wmid = arg;
            } else if (!parsed.password) {
                parsed.password = arg;
            }
        }
    }

    return parsed;
}

function printUsage(): void {
    console.error('Usage: keyextractor --file <path> --wmid <wmid> --password <password>');
    console.error('   or: keyextractor -f <path> -w <wmid> -p <password>');
    console.error('');
    console.error('Options:');
    console.error('  -f, --file <path>     Path to the encrypted key file (.kwm)');
    console.error('  -w, --wmid <wmid>     WebMoney ID (12 digits)');
    console.error('  -p, --password <pwd> Password for the key file');
    console.error('  -h, --help            Show this help message');
    console.error('');
    console.error('Examples:');
    console.error(
        '  keyextractor --file /path/to/key.kwm --wmid 123456789012 --password mypassword'
    );
    console.error('  keyextractor -f /path/to/key.kwm -w 123456789012 -p mypassword');
    process.exit(1);
}

async function main(): Promise<void> {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error('Error: No arguments provided');
        console.error('');
        printUsage();
    }

    let parsed: ParsedArgs;
    try {
        parsed = parseArgs(args);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error parsing arguments: ${errorMessage}`);
        console.error('');
        printUsage();
        return;
    }

    if (!parsed.file || !parsed.wmid || !parsed.password) {
        console.error('Error: All required parameters are missing');
        console.error('');
        if (!parsed.file) console.error('  Missing: --file/-f');
        if (!parsed.wmid) console.error('  Missing: --wmid/-w');
        if (!parsed.password) console.error('  Missing: --password/-p');
        console.error('');
        printUsage();
        return;
    }

    try {
        const extractor = new KeyExtractor(parsed.file, parsed.wmid, parsed.password);
        const xmlKey = await extractor.extract();
        console.log(xmlKey);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error: ${errorMessage}`);
        process.exit(1);
    }
}

main().catch((error) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Fatal error: ${errorMessage}`);
    process.exit(1);
});
