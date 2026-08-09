export interface LanguageConfig {
    id: 'python' | 'cpp' | 'java' | 'c' | 'javascript';
    name: string;
    label: string;
    ext: string;
}

export const SUPPORTED_LANGUAGES: readonly LanguageConfig[] = [
    { id: 'python', name: 'Python', label: 'Python 3', ext: '.py' },
    { id: 'cpp', name: 'C++', label: 'C++ 20', ext: '.cpp' },
    { id: 'java', name: 'Java', label: 'Java 17', ext: '.java' },
    { id: 'c', name: 'C', label: 'C (GCC)', ext: '.c' },
    { id: 'javascript', name: 'JavaScript', label: 'JavaScript (Node.js)', ext: '.js' },
] as const;

export type LanguageId = typeof SUPPORTED_LANGUAGES[number]['id'];

export const LANGUAGE_IDS: readonly LanguageId[] = SUPPORTED_LANGUAGES.map(l => l.id);

export const getLanguageConfig = (id: string): LanguageConfig | undefined => {
    return SUPPORTED_LANGUAGES.find(l => l.id === id);
};
