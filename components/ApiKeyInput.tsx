'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Eye, EyeOff, Key, Check } from 'lucide-react';

export default function ApiKeyInput() {
    const { apiKey, setApiKey } = useAppStore();
    const [isVisible, setIsVisible] = useState(false);
    const [inputValue, setInputValue] = useState(apiKey || '');
    const [isEditing, setIsEditing] = useState(!apiKey);

    const handleSave = () => {
        if (inputValue.trim().startsWith('sk-')) {
            setApiKey(inputValue.trim());
            setIsEditing(false);
        } else {
            alert("Please enter a valid OpenAI API key starting with 'sk-'");
        }
    };

    if (!isEditing && apiKey) {
        return (
            <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-full hover:border-blue-400 dark:hover:border-blue-500 transition-colors group"
            >
                <div className="w-6 h-6 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center border border-green-200 dark:border-green-800">
                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">API Key Active</span>
            </button>
        )
    }

    return (
        <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="relative group">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                    type={isVisible ? 'text' : 'password'}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="sk-..."
                    className="w-64 pl-9 pr-8 py-1.5 text-sm border-b-2 border-gray-200 dark:border-zinc-700 bg-transparent focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-zinc-600 font-mono text-gray-700 dark:text-gray-200"
                    autoFocus
                />
                <button
                    onClick={() => setIsVisible(!isVisible)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    tabIndex={-1}
                >
                    {isVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
            </div>
            <button
                onClick={handleSave}
                disabled={!inputValue}
                className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                Save
            </button>
            {apiKey && (
                <button
                    onClick={() => setIsEditing(false)}
                    className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                    Cancel
                </button>
            )}
        </div>
    );
}
