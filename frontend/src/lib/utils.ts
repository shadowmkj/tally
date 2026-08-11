import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a raw testcase input or output string into clean, human-readable format.
 * - JSON Objects: formatted as `key = value` lines (e.g. `nums = [2, 7, 11, 15]\ntarget = 9`)
 * - JSON Arrays: formatted as clean indented JSON arrays
 * - Raw Strings / Multiline text: stripped of quotes and formatted cleanly
 */
export function formatTestCaseValue(val: any): string {
    if (val === null || val === undefined) return '';

    let parsed = val;

    if (typeof val === 'string') {
        const trimmed = val.trim();
        if (
            (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
            (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
            (trimmed.startsWith('"') && trimmed.endsWith('"'))
        ) {
            try {
                parsed = JSON.parse(trimmed);
            } catch {
                parsed = val;
            }
        }
    }

    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return Object.entries(parsed)
            .map(([k, v]) => `${k} = ${typeof v === 'object' ? JSON.stringify(v) : v}`)
            .join('\n');
    }

    if (Array.isArray(parsed)) {
        return JSON.stringify(parsed, null, 2);
    }

    return String(parsed);
}
