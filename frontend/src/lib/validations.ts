import { z } from 'zod';

export const createCompetitionSchema = z.object({
    accessCode: z
        .string({ error: 'Access code is required' })
        .trim()
        .min(1, 'Access code is required')
        .length(6, 'Access code must be exactly 6 characters long')
        .regex(/^[A-Z0-9]+$/, 'Access code must only contain uppercase letters and numbers'),
    title: z
        .string({ error: 'Competition title is required' })
        .trim()
        .min(3, 'Competition title must be at least 3 characters long')
        .max(100, 'Competition title cannot exceed 100 characters'),
    subtitle: z
        .string()
        .trim()
        .max(150, 'Subtitle cannot exceed 150 characters')
        .optional(),
    durationMinutes: z
        .number({ error: 'Duration is required' })
        .min(10, 'Duration must be at least 10 minutes')
        .max(600, 'Duration cannot exceed 600 minutes (10 hours)'),
});

export type CreateCompetitionInput = z.infer<typeof createCompetitionSchema>;

export const problemSchema = z.object({
    title: z
        .string({ error: 'Problem title is required' })
        .trim()
        .min(3, 'Problem title must be at least 3 characters long')
        .max(120, 'Problem title cannot exceed 120 characters'),
    difficulty: z.enum(['Easy', 'Medium', 'Hard'], {
        error: 'Difficulty must be Easy, Medium, or Hard',
    }),
    points: z
        .number({ error: 'Points is required' })
        .min(1, 'Points must be at least 1')
        .max(2000, 'Points cannot exceed 2000'),
    timeLimitMs: z
        .number({ error: 'Time limit is required' })
        .min(100, 'Time limit must be at least 100ms')
        .max(10000, 'Time limit cannot exceed 10000ms'),
    memoryLimitMb: z
        .number({ error: 'Memory limit is required' })
        .min(16, 'Memory limit must be at least 16MB')
        .max(2048, 'Memory limit cannot exceed 2048MB'),
    description: z
        .string({ error: 'Description is required' })
        .trim()
        .min(10, 'Description must be at least 10 characters long'),
    sampleInput: z
        .string({ error: 'Sample input is required' })
        .trim()
        .min(1, 'Sample input is required'),
    sampleOutput: z
        .string({ error: 'Sample output is required' })
        .trim()
        .min(1, 'Sample output is required'),
});

export type ProblemInput = z.infer<typeof problemSchema>;
