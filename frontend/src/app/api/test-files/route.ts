import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

async function getCodeTestsDir(): Promise<string> {
    if (process.env.CODE_TESTS_DIR) {
        const customPath = path.resolve(process.env.CODE_TESTS_DIR);
        await fs.mkdir(customPath, { recursive: true });
        return customPath;
    }
    const parentPath = path.resolve(process.cwd(), '../code_tests');
    try {
        await fs.stat(parentPath);
        return parentPath;
    } catch {
        const currentPath = path.resolve(process.cwd(), 'code_tests');
        await fs.mkdir(currentPath, { recursive: true });
        return currentPath;
    }
}

function parseTestCasesContent(rawContent: string) {
    const trimmed = rawContent.trim();
    let items: any[] = [];
    const parseErrors: string[] = [];

    if (trimmed.startsWith('[')) {
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                items = parsed;
            } else {
                parseErrors.push('Failed to parse JSON array: Expected top-level JSON array');
            }
        } catch (e: any) {
            parseErrors.push(`Failed to parse JSON array: ${e?.message || String(e)}`);
        }
    } else {
        // Line by line JSONL parsing
        const lines = trimmed.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const l = line.trim();
            if (!l) continue;
            try {
                items.push(JSON.parse(l));
            } catch (e: any) {
                parseErrors.push(`Line ${i + 1}: ${e?.message || String(e)}`);
            }
        }
    }

    const sampleTestCases: Array<{ id: string; input: string; output: string; explanation: string }> = [];
    const hiddenTestCases: Array<{ id: string; input: string; output: string; hidden: boolean }> = [];

    items.forEach((item, idx) => {
        const id = item.id ? String(item.id) : `tc-${idx + 1}`;
        const rawInput = typeof item.input === 'object' ? JSON.stringify(item.input, null, 2) : String(item.input ?? '');
        const rawOutput = item.expected !== undefined
            ? (typeof item.expected === 'object' ? JSON.stringify(item.expected) : String(item.expected))
            : (typeof item.output === 'object' ? JSON.stringify(item.output) : String(item.output ?? ''));
        const explanation = item.explanation ? String(item.explanation) : '';
        const isHidden = Boolean(item.is_hidden ?? item.hidden ?? false);

        if (!isHidden) {
            sampleTestCases.push({
                id: `st-${id}`,
                input: rawInput,
                output: rawOutput,
                explanation,
            });
        }

        hiddenTestCases.push({
            id: `ht-${id}`,
            input: rawInput,
            output: rawOutput,
            hidden: isHidden,
        });
    });

    return { sampleTestCases, hiddenTestCases, rawItems: items, parseErrors };
}

// GET: List existing files in code_tests or read specific file content
export async function GET(req: Request) {
    try {
        const dir = await getCodeTestsDir();
        const { searchParams } = new URL(req.url);
        const fileName = searchParams.get('file');

        if (fileName) {
            const safeName = path.basename(fileName);
            const filePath = path.join(dir, safeName);

            try {
                const rawContent = await fs.readFile(filePath, 'utf-8');
                const parsed = parseTestCasesContent(rawContent);

                return NextResponse.json({
                    filename: safeName,
                    rawContent,
                    sampleTestCases: parsed.sampleTestCases,
                    hiddenTestCases: parsed.hiddenTestCases,
                    count: parsed.hiddenTestCases.length,
                    parseErrors: parsed.parseErrors,
                });
            } catch (err: any) {
                if (err?.code === 'ENOENT') {
                    return NextResponse.json({ error: `File '${safeName}' not found in code_tests directory` }, { status: 404 });
                }
                throw err;
            }
        }

        const allFiles = await fs.readdir(dir);
        const files = allFiles.filter(f => f.endsWith('.jsonl') || f.endsWith('.json') || f.endsWith('.txt'));

        return NextResponse.json({ files });
    } catch (err: any) {
        console.error('Failed in GET /api/test-files:', err);
        return NextResponse.json({ error: err?.message || 'Failed to access code_tests' }, { status: 500 });
    }
}

// POST: Upload or write a test case file into code_tests directory
export async function POST(req: Request) {
    try {
        const dir = await getCodeTestsDir();
        const contentType = req.headers.get('content-type') || '';

        let fileName = '';
        let fileContent = '';

        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            const file = formData.get('file') as File | null;
            const customName = formData.get('filename') as string | null;

            if (!file) {
                return NextResponse.json({ error: 'No file provided in form upload' }, { status: 400 });
            }

            const name = customName?.trim() || file.name;
            fileName = path.basename(name);
            fileContent = await file.text();
        } else {
            const body = await req.json();
            if (!body.filename || !body.content) {
                return NextResponse.json({ error: 'Missing filename or content in JSON request' }, { status: 400 });
            }
            fileName = path.basename(body.filename);
            fileContent = body.content;
        }

        // Ensure valid extension
        if (!fileName.endsWith('.jsonl') && !fileName.endsWith('.json') && !fileName.endsWith('.txt')) {
            fileName += '.jsonl';
        }

        const filePath = path.join(dir, fileName);
        await fs.writeFile(filePath, fileContent, 'utf-8');

        const parsed = parseTestCasesContent(fileContent);

        return NextResponse.json({
            success: true,
            filename: fileName,
            rawContent: fileContent,
            sampleTestCases: parsed.sampleTestCases,
            hiddenTestCases: parsed.hiddenTestCases,
            count: parsed.hiddenTestCases.length,
            parseErrors: parsed.parseErrors,
            message: `File '${fileName}' successfully saved to code_tests folder.`,
        });
    } catch (err: any) {
        console.error('Failed in POST /api/test-files:', err);
        return NextResponse.json({ error: err?.message || 'Failed to save test file' }, { status: 500 });
    }
}
