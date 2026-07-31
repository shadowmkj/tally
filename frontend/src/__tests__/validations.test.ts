import { describe, test, expect } from 'bun:test';
import { createCompetitionSchema, problemSchema } from '../lib/validations';

describe('createCompetitionSchema validation', () => {
    test('accepts valid competition input', () => {
        const validPayload = {
            accessCode: 'ABC123',
            title: 'Weekly Contest 42',
            subtitle: 'Compete with top engineers',
            durationMinutes: 120,
        };

        const result = createCompetitionSchema.safeParse(validPayload);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.accessCode).toBe('ABC123');
            expect(result.data.durationMinutes).toBe(120);
        }
    });

    test('rejects access code that is not 6 uppercase alphanumeric characters', () => {
        const invalid1 = createCompetitionSchema.safeParse({
            accessCode: 'abc123', // lowercase
            title: 'Weekly Contest',
            durationMinutes: 60,
        });
        expect(invalid1.success).toBe(false);

        const invalid2 = createCompetitionSchema.safeParse({
            accessCode: 'TOOLONG123',
            title: 'Weekly Contest',
            durationMinutes: 60,
        });
        expect(invalid2.success).toBe(false);

        const invalid3 = createCompetitionSchema.safeParse({
            accessCode: 'SHORT',
            title: 'Weekly Contest',
            durationMinutes: 60,
        });
        expect(invalid3.success).toBe(false);
    });

    test('rejects invalid title length', () => {
        const shortTitle = createCompetitionSchema.safeParse({
            accessCode: 'CODE12',
            title: 'AB', // < 3 chars
            durationMinutes: 60,
        });
        expect(shortTitle.success).toBe(false);

        const longTitle = createCompetitionSchema.safeParse({
            accessCode: 'CODE12',
            title: 'A'.repeat(101),
            durationMinutes: 60,
        });
        expect(longTitle.success).toBe(false);
    });

    test('rejects invalid duration limits', () => {
        const tooShort = createCompetitionSchema.safeParse({
            accessCode: 'CODE12',
            title: 'Valid Title',
            durationMinutes: 5, // < 10 mins
        });
        expect(tooShort.success).toBe(false);

        const tooLong = createCompetitionSchema.safeParse({
            accessCode: 'CODE12',
            title: 'Valid Title',
            durationMinutes: 601, // > 600 mins
        });
        expect(tooLong.success).toBe(false);
    });
});

describe('problemSchema validation', () => {
    test('accepts valid problem input', () => {
        const validProblem = {
            title: 'Two Sum',
            methodName: 'twoSum',
            typeSchema: '[i],i:[i]',
            difficulty: 'Easy',
            points: 100,
            timeLimitMs: 2000,
            memoryLimitMb: 256,
            description: 'Given an array of integers nums and an integer target...',
            sampleInput: 'nums = [2,7,11,15], target = 9',
            sampleOutput: '[0,1]',
        };

        const result = problemSchema.safeParse(validProblem);
        expect(result.success).toBe(true);
    });

    test('rejects invalid problem parameters', () => {
        const invalidDifficulty = problemSchema.safeParse({
            title: 'Two Sum',
            methodName: 'twoSum',
            difficulty: 'SuperHard', // Not in enum
            points: 100,
            timeLimitMs: 2000,
            memoryLimitMb: 256,
            description: 'Given an array of integers...',
            sampleInput: 'input',
            sampleOutput: 'output',
        });
        expect(invalidDifficulty.success).toBe(false);

        const invalidPoints = problemSchema.safeParse({
            title: 'Two Sum',
            methodName: 'twoSum',
            difficulty: 'Medium',
            points: 5000, // Exceeds 2000
            timeLimitMs: 2000,
            memoryLimitMb: 256,
            description: 'Given an array of integers...',
            sampleInput: 'input',
            sampleOutput: 'output',
        });
        expect(invalidPoints.success).toBe(false);

        const invalidTimeLimit = problemSchema.safeParse({
            title: 'Two Sum',
            methodName: 'twoSum',
            difficulty: 'Hard',
            points: 500,
            timeLimitMs: 50, // Less than 100ms
            memoryLimitMb: 256,
            description: 'Given an array of integers...',
            sampleInput: 'input',
            sampleOutput: 'output',
        });
        expect(invalidTimeLimit.success).toBe(false);
    });
});
