import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';
import { auth } from '@/lib/auth';
import type { SampleTestCase, TestCase } from '@/context/CompetitionContext';

async function getCodeTestsDir(): Promise<string> {
    const dir = process.env.CODE_TESTS_DIR || path.resolve(process.cwd(), '../code_tests');
    await fs.mkdir(dir, { recursive: true });
    return dir;
}

interface TestCasesParseResult {
    sampleTestCases: SampleTestCase[];
    hiddenTestCases: TestCase[];
    rawItems: any[];
    parseErrors: string[];
}

function parseTestCasesContent(content: string): TestCasesParseResult {
    const sampleTestCases: SampleTestCase[] = [];
    const hiddenTestCases: TestCase[] = [];
    const items: any[] = [];
    const parseErrors: string[] = [];

    const trimmed = content.trim();
    let rawArray: any[] = [];

    if (trimmed.startsWith('[')) {
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                rawArray = parsed;
            }
        } catch {
            parseErrors.push("Invalid JSON array structure");
        }
    } else {
        const lines = trimmed.split(/\r?\n/).filter(line => line.trim() !== '');
        lines.forEach((line, index) => {
            try {
                rawArray.push(JSON.parse(line));
            } catch {
                parseErrors.push(`Line ${index + 1}: Invalid JSON structure`);
            }
        });
    }

    rawArray.forEach((item, index) => {
        items.push(item);
        const inputStr = typeof item.input === 'string' ? item.input : JSON.stringify(item.input ?? '');
        const outputStr = typeof item.expected === 'string' ? item.expected : JSON.stringify(item.expected ?? '');
        const isHidden = item.is_hidden === true || item.hidden === true;
        const explanation = item.explanation || undefined;

        if (!isHidden) {
            sampleTestCases.push({
                id: `st-${index + 1}`,
                input: inputStr,
                output: outputStr,
                explanation: explanation || '',
            });
        }

        hiddenTestCases.push({
            id: `tc-${index + 1}`,
            input: inputStr,
            output: outputStr,
            hidden: isHidden,
        });
    });

    return { sampleTestCases, hiddenTestCases, rawItems: items, parseErrors };
}

async function checkAdminAuth(reqHeaders: Headers) {
    try {
        const session = await auth.api.getSession({ headers: reqHeaders });
        if (!session || !session.user) {
            return false;
        }
        const user = session.user as any;
        if (user.role && user.role !== 'admin') {
            return false;
        }
        return true;
    } catch (err) {
        console.error('Error verifying admin session:', err);
        return false;
    }
}

const SAFE_FILENAME_REGEX = /^[a-zA-Z0-9_-]+\.(jsonl|json|txt)$/;

function isValidFileName(name: string): boolean {
    if (!name || name.startsWith('.') || name.includes('/') || name.includes('\\') || name.includes('..')) {
        return false;
    }
    return SAFE_FILENAME_REGEX.test(name);
}

// GET: List existing files in code_tests or read specific file content
export async function GET(req: Request) {
    try {
        let reqHeaders: Headers;
        try {
            reqHeaders = await headers();
        } catch {
            reqHeaders = req.headers;
        }
        const isAdmin = await checkAdminAuth(reqHeaders);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 401 });
        }

        const dir = await getCodeTestsDir();
        const { searchParams } = new URL(req.url);
        const fileName = searchParams.get('file');

        if (fileName) {
            if (!isValidFileName(fileName)) {
                return NextResponse.json({ error: 'Invalid filename or unsupported extension' }, { status: 400 });
            }
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
                console.error(`Failed to read test file '${safeName}':`, err);
                return NextResponse.json({ error: 'Failed to read test file' }, { status: 500 });
            }
        }

        const allFiles = await fs.readdir(dir);
        const files = allFiles.filter(f => f.endsWith('.jsonl') || f.endsWith('.json') || f.endsWith('.txt'));

        return NextResponse.json({ files });
    } catch (err: any) {
        console.error('Failed in GET /api/test-files:', err);
        return NextResponse.json({ error: 'Failed to access code_tests' }, { status: 500 });
    }
}

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10MB (sufficient for 500+ test cases)

// POST: Upload or write a test case file into code_tests directory
export async function POST(req: Request) {
    try {
        let reqHeaders: Headers;
        try {
            reqHeaders = await headers();
        } catch {
            reqHeaders = req.headers;
        }
        const isAdmin = await checkAdminAuth(reqHeaders);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 401 });
        }

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

            if (file.size > MAX_UPLOAD_SIZE_BYTES) {
                return NextResponse.json({ error: 'File size exceeds maximum allowed limit (10MB)' }, { status: 400 });
            }

            const rawName = (customName?.trim() || file.name).trim();
            if (!isValidFileName(rawName)) {
                return NextResponse.json({ error: 'Invalid filename. Must be an alphanumeric name ending with .jsonl, .json, or .txt' }, { status: 400 });
            }

            fileName = rawName;
            fileContent = await file.text();
        } else {
            let body: any;
            try {
                body = await req.json();
            } catch {
                return NextResponse.json({ error: 'Invalid or malformed JSON payload' }, { status: 400 });
            }

            if (!body || typeof body !== 'object' || Array.isArray(body)) {
                return NextResponse.json({ error: 'Request body must be a JSON object' }, { status: 400 });
            }

            if (typeof body.filename !== 'string' || typeof body.content !== 'string' || !body.filename.trim() || !body.content.trim()) {
                return NextResponse.json({ error: 'Missing or invalid filename or content in JSON request' }, { status: 400 });
            }

            if (Buffer.byteLength(body.content, 'utf-8') > MAX_UPLOAD_SIZE_BYTES) {
                return NextResponse.json({ error: 'File size exceeds maximum allowed limit (10MB)' }, { status: 400 });
            }

            const rawName = body.filename.trim();
            if (!isValidFileName(rawName)) {
                return NextResponse.json({ error: 'Invalid filename. Must be an alphanumeric name ending with .jsonl, .json, or .txt' }, { status: 400 });
            }

            fileName = rawName;
            fileContent = body.content;
        }

        const filePath = path.join(dir, fileName);

        try {
            await fs.writeFile(filePath, fileContent, { encoding: 'utf-8', flag: 'wx' });
        } catch (err: any) {
            if (err?.code === 'EEXIST') {
                return NextResponse.json({ error: `File '${fileName}' already exists in code_tests directory` }, { status: 409 });
            }
            throw err;
        }

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
        return NextResponse.json({ error: 'Failed to save test file' }, { status: 500 });
    }
}
