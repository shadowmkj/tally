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
