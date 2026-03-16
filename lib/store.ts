import { create } from 'zustand';

export interface RowData {
    [key: string]: string | number | boolean | null;
}

interface AppState {
    // CSV Data
    csvData: RowData[];
    setCsvData: (data: RowData[]) => void;

    // Column order for the table
    columnOrder: string[];
    setColumnOrder: (order: string[]) => void;

    // OpenAI API key
    apiKey: string | null;
    setApiKey: (key: string) => void;

    // Cell editing
    updateCell: (rowIndex: number, column: string, value: string | number | boolean | null) => void;

    // Hidden columns
    hiddenCols: string[];
    setHiddenCols: (cols: string[]) => void;

}


export const useAppStore = create<AppState>((set) => ({
    csvData: [],
    setCsvData: (data) => set({ csvData: data }),

    columnOrder: [],
    setColumnOrder: (order) => set({ columnOrder: order }),

    apiKey: typeof window !== 'undefined' ? localStorage.getItem('openai_api_key') : null,
    setApiKey: (key) => {
        localStorage.setItem('openai_api_key', key);
        set({ apiKey: key });
    },

    updateCell: (rowIndex, column, value) => set((state) => {
        const newData = [...state.csvData];
        if (newData[rowIndex]) {
            newData[rowIndex] = { ...newData[rowIndex], [column]: value };
        }
        return { csvData: newData };
    }),

    hiddenCols: [],
    setHiddenCols: (cols) => set({ hiddenCols: cols }),
}));