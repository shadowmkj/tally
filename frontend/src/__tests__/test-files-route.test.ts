import { describe, test, expect } from 'bun:test';
import { GET, POST } from '../app/api/test-files/route';

describe('Test Files API Route (/api/test-files)', () => {
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

    test('POST /api/test-files saves JSON payload into code_tests directory', async () => {
        const testFileName = `unit-test-${Date.now()}.jsonl`;
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
    });
});
