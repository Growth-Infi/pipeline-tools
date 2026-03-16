'use client';

import { useAppStore } from '@/lib/store';
import { useState, memo } from 'react';
import { GripHorizontal, Trash2, ChevronDown } from 'lucide-react';

function DataTable() {
    const { csvData, columnOrder, setColumnOrder, updateCell, setCsvData, hiddenCols } = useAppStore();
    const [draggedCol, setDraggedCol] = useState<string | null>(null);
    const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
    const [editValue, setEditValue] = useState('');
    const [activeMenuValues, setActiveMenuValues] = useState<string | null>(null);

    if (csvData.length === 0) return null;

    let headers = (columnOrder.length > 0 ? columnOrder : Object.keys(csvData[0]))
        .filter(h => !hiddenCols.includes(h));

    // Sync headers if new columns appear
    const allKeys = Object.keys(csvData[0]);
    const missingKeys = allKeys.filter(k => !headers.includes(k));
    if (missingKeys.length > 0) {
        headers = [...headers, ...missingKeys];
    }

    const previewData = csvData.slice(0, 500);

    const handleDragStart = (e: React.DragEvent, col: string) => {
        setDraggedCol(col);
        e.dataTransfer.setData('text/plain', col);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, col: string) => {
        e.preventDefault();
        if (!draggedCol || draggedCol === col) return;
    };

    const handleDrop = (e: React.DragEvent, targetCol: string) => {
        e.preventDefault();
        const sourceCol = e.dataTransfer.getData('text/plain');
        if (sourceCol === targetCol) return;

        const newOrder = [...headers];
        const sourceIdx = newOrder.indexOf(sourceCol);
        const targetIdx = newOrder.indexOf(targetCol);

        newOrder.splice(sourceIdx, 1);
        newOrder.splice(targetIdx, 0, sourceCol);

        setColumnOrder(newOrder);
        setDraggedCol(null);
    };

    const startEditing = (rowIndex: number, col: string, value: any) => {
        setEditingCell({ row: rowIndex, col });
        setEditValue(value === null ? '' : String(value));
    };

    const saveEdit = () => {
        if (editingCell) {
            updateCell(editingCell.row, editingCell.col, editValue);
            setEditingCell(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') saveEdit();
        if (e.key === 'Escape') setEditingCell(null);
    };

    const handleDeleteColumn = (col: string) => {
        if (confirm(`Permanently delete column "${col}"?`)) {
            // Remove from columnOrder if present
            const newOrder = headers.filter(h => h !== col);
            setColumnOrder(newOrder);

            // Update underlying data to remove the key (optional but cleaner)
            const newData = csvData.map(row => {
                const newRow = { ...row };
                delete newRow[col];
                return newRow;
            });
            setCsvData(newData);
            setActiveMenuValues(null);
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-[#050505]">
            <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                <table className="w-full text-sm text-left border-collapse relative table-fixed min-w-max">
                    <thead className="text-xs text-zinc-500 font-mono uppercase bg-[#0a0a0a] sticky top-0 z-20 shadow-sm ring-1 ring-white/5">
                        <tr>
                            <th className="w-12 text-center font-bold border-b border-white/5 sticky left-0 z-30 bg-[#0a0a0a] border-r border-white/5 text-zinc-700 select-none">#</th>
                            {headers.map((header) => (
                                <th
                                    key={header}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, header)}
                                    onDragOver={(e) => handleDragOver(e, header)}
                                    onDrop={(e) => handleDrop(e, header)}
                                    className={`
                        w-[200px] px-4 py-3 font-semibold border-b border-white/5 group relative
                        ${draggedCol === header ? 'opacity-50 bg-white/10' : 'hover:bg-white/5'}
                        border-r border-white/5
                    `}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 overflow-hidden w-full">
                                            <GripHorizontal className="w-3 h-3 text-zinc-700 group-hover:text-zinc-500 cursor-grab active:cursor-grabbing shrink-0" />
                                            <span className="text-zinc-300 group-hover:text-white transition-colors truncate select-none block" title={header}>{header}</span>
                                        </div>

                                        {/* Header Menu Trigger */}
                                        <div className="relative shrink-0 ml-2">
                                            <button
                                                onClick={() => setActiveMenuValues(activeMenuValues === header ? null : header)}
                                                className={`p-1 rounded hover:bg-white/10 transition-colors ${activeMenuValues === header ? 'text-emerald-500' : 'text-transparent group-hover:text-zinc-500'}`}
                                            >
                                                <ChevronDown className="w-3 h-3" />
                                            </button>

                                            {/* Dropdown Menu */}
                                            {activeMenuValues === header && (
                                                <div className="absolute right-0 top-6 w-48 bg-[#111] border border-white/10 rounded-lg shadow-xl z-50 py-1">
                                                    <button
                                                        onClick={() => handleDeleteColumn(header)}
                                                        className="w-full text-left px-3 py-2 text-[10px] text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                        Delete Column
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {previewData.map((row, index) => (
                            <tr
                                key={index}
                                className="group bg-transparent hover:bg-white/[0.02] transition-colors"
                            >
                                <td className="px-4 py-2 text-zinc-700 text-[10px] text-center border-r border-white/5 sticky left-0 z-10 bg-[#050505] group-hover:bg-[#0a0a0a] transition-colors font-mono select-none border-b border-white/5">{index + 1}</td>
                                {headers.map((header) => (
                                    <td
                                        key={`${index}-${header}`}
                                        className="px-4 py-2 border-r border-white/5 last:border-r-0 max-w-xs truncate text-zinc-400 font-mono text-xs cursor-text relative hover:bg-white/5 transition-colors border-b border-white/5"
                                        onClick={() => startEditing(index, header, row[header])}
                                    >
                                        {editingCell?.row === index && editingCell?.col === header ? (
                                            <input
                                                autoFocus
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onBlur={saveEdit}
                                                onKeyDown={handleKeyDown}
                                                className="absolute inset-0 w-full h-full bg-[#111] text-white border-2 border-emerald-500/50 px-2 outline-none font-mono"
                                            />
                                        ) : (
                                            row[header] !== null && row[header] !== undefined && row[header] !== '' ? (
                                                <span className="truncate block">{row[header]?.toString()}</span>
                                            ) : (
                                                <span className="text-zinc-800 italic text-[10px] select-none">null</span>
                                            )
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {csvData.length > 500 && (
                    <div className="py-4 text-center text-zinc-600 text-xs italic bg-[#0a0a0a] border-t border-white/5">
                        Rendering first 500 rows for performance. Full dataset ({csvData.length} rows) is in memory.
                    </div>
                )}
            </div>

            {/* Footer Info */}
            <div className="px-6 py-2 border-t border-white/5 bg-[#0a0a0a] text-[10px] text-zinc-500 flex justify-between items-center z-20 font-mono tracking-wide uppercase shrink-0">
                <div className="flex gap-4">
                    <span>Rows: <strong className="text-zinc-300">{csvData.length}</strong></span>
                    <span>Cols: <strong className="text-zinc-300">{headers.length}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-emerald-500/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    LIVE INTERPRETER
                </div>
            </div>

            {activeMenuValues && (
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setActiveMenuValues(null)} />
            )}
        </div>
    );
}

export default memo(DataTable);