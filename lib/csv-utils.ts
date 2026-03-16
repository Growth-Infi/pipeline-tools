import Papa from 'papaparse';
import { RowData } from './store';

export const parseCSV = (file: File): Promise<RowData[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                resolve(results.data as RowData[]);
            },
            error: (error) => {
                reject(error);
            },
        });
    });
};

export const exportCSV = (data: RowData[], filename: string = 'data.csv') => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export interface cleanCompanyNameResult {
    cleaned: string;
    needsLLM: boolean;
}

const LEGAL_SUFFIXES = [
    'pvt ltd', 'pvt. ltd', 'pvt. ltd.', 'private limited', 'private ltd',
    'ltd', 'ltd.', 'limited', 'inc', 'inc.', 'incorporated',
    'llc', 'llc.', 'l.l.c', 'corp', 'corp.', 'corporation',
    'gmbh', 'ag', 'sas', 'bv', 'nv', 'pty', 'pty ltd',
    'plc', 'lp', 'llp', 'co.', '& co', '& co.', 'co'
];

const COUNTRY_SUFFIXES = [
    'india', 'usa', 'uk', 'us', 'canada', 'australia',
    'singapore', 'uae', 'germany', 'france', 'netherlands'
];

const JUNK_WORDS = [
    'app', 'platform', 'marketplace', 'network', 'portal',
    'dating', 'social', 'startup', 'venture', 'digital services'
];

export const cleanCompanyName = (input: string): cleanCompanyNameResult => {
    let cleaned = input.trim();

    // 1. Split on separators, take left side
    cleaned = cleaned.split(/[-|:•—]/)[0].trim();

    // 2. Strip bracket/paren content e.g. "Acme (India)" → "Acme"
    cleaned = cleaned.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();

    // 3. Strip legal suffixes (case insensitive, from the end)
    const sortedSuffixes = LEGAL_SUFFIXES.sort((a, b) => b.length - a.length);
    for (const suffix of sortedSuffixes) {
        const regex = new RegExp(`[,.]?\\s*${suffix}[,.]?$`, 'i');
        if (regex.test(cleaned)) {
            cleaned = cleaned.replace(regex, '').trim();
            break;
        }
    }

    // 4. Strip country suffixes
    for (const country of COUNTRY_SUFFIXES) {
        const regex = new RegExp(`[,.]?\\s*${country}[,.]?$`, 'i');
        cleaned = cleaned.replace(regex, '').trim();
    }

    // 5. Clean leftover punctuation
    cleaned = cleaned.replace(/[,.\-|:]+$/, '').trim();

    // 6. Check for junk words
    const lower = cleaned.toLowerCase();
    const hasJunk = JUNK_WORDS.some(word => lower.includes(word));

    if (hasJunk || cleaned.length === 0) {
        return { cleaned: input, needsLLM: true };
    }

    return { cleaned, needsLLM: false };
}