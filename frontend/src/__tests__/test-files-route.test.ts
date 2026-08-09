import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, mock } from 'bun:test';
import { GET, POST } from '../app/api/test-files/route';
import { auth } from '../lib/auth';
import fs from 'fs/promises';
import path from 'path';

describe('Test Files API Route (/api/test-files)', () => {
    const testDir = path.resolve(process.cwd(), 'tmp/unit_test_code_tests');
    const createdFiles: string[] = [];

    beforeAll(async () => {
        process.env.CODE_TESTS_DIR = testDir;
        await fs.mkdir(testDir, { recursive: true });

        const sourcePath = path.resolve(process.cwd(), '../code_tests/two-sum.jsonl');
        try {
            const content = await fs.readFile(sourcePath, 'utf-8');
            await fs.writeFile(path.join(testDir, 'two-sum.jsonl'), content, 'utf-8');
        } catch {
            await fs.writeFile(path.join(testDir, 'two-sum.jsonl'), '{"id": 1, "input": [2, 7], "expected": [0, 1]}', 'utf-8');
        }
    });

    beforeEach(() => {
        (auth.api as any).getSession = mock(() => Promise.resolve({
            user: { id: 'test-user-1', email: 'admin@example.com', name: 'Admin User', role: 'admin' },
            session: { id: 'test-session-1', userId: 'test-user-1' },
        }));
    });

    afterEach(async () => {
        while (createdFiles.length > 0) {
            const filePath = createdFiles.pop();
            if (filePath) {
                try {
                    await fs.rm(filePath, { force: true });
                } catch {
                    // Ignore missing file error during cleanup
                }
            }
        }
    });

    afterAll(async () => {
        try {
            await fs.rm(testDir, { recursive: true, force: true });
        } catch {
            // Ignore cleanup error
        }
        delete process.env.CODE_TESTS_DIR;
    });

    test('GET /api/test-files returns 401 Unauthorized when session is missing', async () => {
        (auth.api as any).getSession = mock(() => Promise.resolve(null));

        const req = new Request('http://localhost:3000/api/test-files');
        const res = await GET(req);
        expect(res.status).toBe(401);

        const data = await res.json();
        expect(data.error).toContain('Unauthorized');
    });

    test('POST /api/test-files returns 401 Unauthorized when session is missing', async () => {
        (auth.api as any).getSession = mock(() => Promise.resolve(null));

        const req = new Request('http://localhost:3000/api/test-files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: 'test.jsonl', content: '[]' }),
        });
        const res = await POST(req);
        expect(res.status).toBe(401);

        const data = await res.json();
        expect(data.error).toContain('Unauthorized');
    });

    test('GET /api/test-files returns 401 Unauthorized when user is authenticated but not an admin', async () => {
        (auth.api as any).getSession = mock(() => Promise.resolve({
            user: { id: 'test-user-2', email: 'student@example.com', name: 'Student User', role: 'user' },
            session: { id: 'test-session-2', userId: 'test-user-2' },
        }));

        const req = new Request('http://localhost:3000/api/test-files');
        const res = await GET(req);
        expect(res.status).toBe(401);

        const data = await res.json();
        expect(data.error).toContain('Unauthorized');
    });

    test('POST /api/test-files returns 401 Unauthorized when user is authenticated but not an admin', async () => {
        (auth.api as any).getSession = mock(() => Promise.resolve({
            user: { id: 'test-user-2', email: 'student@example.com', name: 'Student User', role: 'user' },
            session: { id: 'test-session-2', userId: 'test-user-2' },
        }));

        const req = new Request('http://localhost:3000/api/test-files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: 'test.jsonl', content: '[]' }),
        });
        const res = await POST(req);
        expect(res.status).toBe(401);

        const data = await res.json();
        expect(data.error).toContain('Unauthorized');
    });
    test('GET /api/test-files lists existing test files in code_tests directory', async () => {
        const req = new Request('http://localhost:3000/api/test-files');
        const res = await GET(req);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(Array.isArray(data.files)).toBe(true);
        expect(data.files.length).toBeGreaterThan(0);
        expect(data.files).toContain('two-sum.jsonl');
    });

    test('GET /api/test-files?file=two-sum.jsonl parses test cases correctly', async () => {
        const req = new Request('http://localhost:3000/api/test-files?file=two-sum.jsonl');
        const res = await GET(req);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.filename).toBe('two-sum.jsonl');
        expect(data.sampleTestCases.length).toBeGreaterThan(0);
        expect(data.hiddenTestCases.length).toBeGreaterThan(0);
        expect(data.count).toBe(data.hiddenTestCases.length);
    });

    test('GET /api/test-files?file=nonexistent-file.jsonl returns 404', async () => {
        const req = new Request('http://localhost:3000/api/test-files?file=nonexistent-file.jsonl');
        const res = await GET(req);
        expect(res.status).toBe(404);

        const data = await res.json();
        expect(data.error).toContain('not found');
    });

    test('POST /api/test-files saves JSON payload into code_tests directory', async () => {
        const testFileName = `unit-test-${Date.now()}.jsonl`;
        const testFilePath = path.join(testDir, testFileName);
        createdFiles.push(testFilePath);

        const testContent = JSON.stringify([
            { id: 1, input: { n: 5 }, expected: 8, is_hidden: false, explanation: 'Sample case' },
            { id: 2, input: { n: 10 }, expected: 89, is_hidden: true, explanation: 'Hidden case' }
        ], null, 2);

        const req = new Request('http://localhost:3000/api/test-files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filename: testFileName,
                content: testContent,
            }),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.filename).toBe(testFileName);
        expect(data.sampleTestCases.length).toBe(1);
        expect(data.hiddenTestCases.length).toBe(2);
        expect(Array.isArray(data.parseErrors)).toBe(true);
        expect(data.parseErrors.length).toBe(0);
    });

    test('POST /api/test-files returns parseErrors when file content contains malformed JSONL', async () => {
        const testFileName = `unit-test-malformed-${Date.now()}.jsonl`;
        const testFilePath = path.join(testDir, testFileName);
        createdFiles.push(testFilePath);

        const testContent = `{"id": 1, "input": 1, "expected": 2}\nINVALID_JSON_LINE\n{"id": 2, "input": 2, "expected": 4}`;

        const req = new Request('http://localhost:3000/api/test-files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filename: testFileName,
                content: testContent,
            }),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.parseErrors.length).toBe(1);
        expect(data.parseErrors[0]).toContain('Line 2');
    });

    test('POST /api/test-files returns 400 when file content exceeds 10MB limit', async () => {
        const testFileName = `unit-test-oversized-${Date.now()}.jsonl`;
        const oversizedContent = 'a'.repeat(10 * 1024 * 1024 + 1);

        const req = new Request('http://localhost:3000/api/test-files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filename: testFileName,
                content: oversizedContent,
            }),
        });

        const res = await POST(req);
        expect(res.status).toBe(400);

        const data = await res.json();
        expect(data.error).toContain('exceeds maximum allowed limit');
    });

    test('POST /api/test-files returns 400 for invalid filenames or path traversal attempts', async () => {
        const invalidNames = ['.hidden.jsonl', '../traversal.jsonl', 'invalid.exe', 'file;bad.jsonl'];

        for (const filename of invalidNames) {
            const req = new Request('http://localhost:3000/api/test-files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename,
                    content: '[]',
                }),
            });

            const res = await POST(req);
            expect(res.status).toBe(400);

            const data = await res.json();
            expect(data.error).toContain('Invalid filename');
        }
    });

    test('POST /api/test-files returns 409 Conflict when file already exists', async () => {
        const testFileName = `unit-test-duplicate-${Date.now()}.jsonl`;
        const payload = JSON.stringify({ filename: testFileName, content: '[]' });

        const req1 = new Request('http://localhost:3000/api/test-files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
        });

        const res1 = await POST(req1);
        expect(res1.status).toBe(200);

        const req2 = new Request('http://localhost:3000/api/test-files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
        });

        const res2 = await POST(req2);
        expect(res2.status).toBe(409);

        const data2 = await res2.json();
        expect(data2.error).toContain('already exists');
    });

    test('POST /api/test-files returns 400 when filename or content is missing in JSON request', async () => {
        const missingFilenameReq = new Request('http://localhost:3000/api/test-files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: '[]' }),
        });
        const res1 = await POST(missingFilenameReq);
        expect(res1.status).toBe(400);
        const data1 = await res1.json();
        expect(data1.error).toContain('Missing filename or content');

        const missingContentReq = new Request('http://localhost:3000/api/test-files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: 'test.jsonl' }),
        });
        const res2 = await POST(missingContentReq);
        expect(res2.status).toBe(400);
        const data2 = await res2.json();
        expect(data2.error).toContain('Missing filename or content');

        const emptyBodyReq = new Request('http://localhost:3000/api/test-files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });
        const res3 = await POST(emptyBodyReq);
        expect(res3.status).toBe(400);
        const data3 = await res3.json();
        expect(data3.error).toContain('Missing filename or content');
    });

    test('POST /api/test-files returns 400 when multipart form upload is missing file', async () => {
        const formData = new FormData();
        formData.append('filename', 'test.jsonl');

        const req = new Request('http://localhost:3000/api/test-files', {
            method: 'POST',
            body: formData,
        });

        const res = await POST(req);
        expect(res.status).toBe(400);

        const data = await res.json();
        expect(data.error).toContain('No file provided');
    });

    test('POST /api/test-files returns 500 when JSON body is malformed', async () => {
        const req = new Request('http://localhost:3000/api/test-files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: 'invalid-json{{{',
        });

        const res = await POST(req);
        expect(res.status).toBe(500);

        const data = await res.json();
        expect(data.error).toBe('Failed to save test file');
    });
});
