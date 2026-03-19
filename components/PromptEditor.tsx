import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PromptEditorProps {
    value: string;
    onChange: (val: string) => void;
    columns: string[];
    placeholder?: string;
    className?: string;
}

export function PromptEditor({ value, onChange, columns, placeholder, className }: PromptEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dropdown, setDropdown] = useState<{ open: boolean; query: string; top: number; left: number }>({
        open: false, query: '', top: 0, left: 0,
    });
    const [activeIdx, setActiveIdx] = useState(0);

    const filtered = columns.filter(c =>
        c.toLowerCase().includes(dropdown.query.toLowerCase())
    );

    // Detect slash and position dropdown
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const ta = e.target;
        onChange(ta.value);

        const cursor = ta.selectionStart;
        const textBefore = ta.value.slice(0, cursor);
        const slashMatch = textBefore.match(/\/(\w*)$/);

        if (slashMatch) {
            // Get caret pixel position
            const { top, left } = getCaretCoords(ta, cursor);
            setDropdown({ open: true, query: slashMatch[1], top, left });
            setActiveIdx(0);
        } else {
            setDropdown(d => ({ ...d, open: false }));
        }
    };

    const insertField = useCallback((col: string) => {
        const ta = textareaRef.current;
        if (!ta) return;
        const cursor = ta.selectionStart;
        const textBefore = ta.value.slice(0, cursor);
        const slashIdx = textBefore.lastIndexOf('/');
        const newVal = ta.value.slice(0, slashIdx) + `{${col}}` + ta.value.slice(cursor);
        onChange(newVal);
        setDropdown(d => ({ ...d, open: false }));
        // restore focus & move cursor after inserted token
        setTimeout(() => {
            ta.focus();
            const pos = slashIdx + col.length + 2; // +2 for { }
            ta.setSelectionRange(pos, pos);
        }, 0);
    }, [onChange]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!dropdown.open) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            if (filtered[activeIdx]) insertField(filtered[activeIdx]);
        }
        if (e.key === 'Escape') setDropdown(d => ({ ...d, open: false }));
    };

    // Render field references as highlighted chips inside the textarea overlay
    // (We use a simple highlight approach: the actual textarea is transparent text,
    //  a div behind mirrors the content with colored spans)
    const parts = value.split(/(\{[^}]+\})/g);

    return (
        <div ref={containerRef} className={`relative ${className ?? ''}`}>
            {/* Mirror div for highlighted tokens — sits behind textarea */}
            <div
                aria-hidden
                className="absolute inset-0 p-4 text-xs font-mono leading-relaxed pointer-events-none overflow-hidden whitespace-pre-wrap break-words"
                style={{ color: 'transparent' }}
            >
                {parts.map((part, i) =>
                    /^\{[^}]+\}$/.test(part)
                        ? <mark key={i} className="bg-violet-500/25 text-violet-300 rounded px-0.5" style={{ color: 'rgb(167,139,250)' }}>{part}</mark>
                        : <span key={i}>{part}</span>
                )}
            </div>

            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="relative w-full h-52 bg-transparent border border-white/10 rounded-xl p-4 text-xs font-mono text-zinc-300 focus:outline-none focus:border-violet-500/50 resize-none leading-relaxed z-10"
                style={{ caretColor: 'white' }}
            />

            {/* Char count */}
            <div className="absolute bottom-3 right-3 text-[10px] text-zinc-600 bg-[#0a0a0a] px-1.5 py-0.5 rounded border border-white/5 z-20">
                {value.length} chars
            </div>

            {/* Slash dropdown */}
            <AnimatePresence>
                {dropdown.open && filtered.length > 0 && (
                    <motion.ul
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.1 }}
                        className="absolute z-50 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[160px] max-h-48 overflow-y-auto"
                        style={{ top: dropdown.top + 20, left: dropdown.left }}
                    >
                        <li className="px-3 py-1.5 text-[9px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">
                            CSV Fields
                        </li>
                        {filtered.map((col, i) => (
                            <li
                                key={col}
                                onMouseDown={e => { e.preventDefault(); insertField(col); }}
                                onMouseEnter={() => setActiveIdx(i)}
                                className={`px-3 py-2 text-xs font-mono cursor-pointer flex items-center gap-2 transition-colors ${i === activeIdx ? 'bg-violet-500/20 text-violet-300' : 'text-zinc-300 hover:bg-white/5'}`}
                            >
                                <span className="text-zinc-600 text-[9px]">/</span>
                                {col}
                            </li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
}

function getCaretCoords(textarea: HTMLTextAreaElement, pos: number) {
    const div = document.createElement('div');
    const style = window.getComputedStyle(textarea);
    ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'padding', 'border', 'boxSizing', 'whiteSpace', 'wordBreak', 'overflowWrap', 'width'].forEach(p => {
        (div.style as any)[p] = (style as any)[p];
    });
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.textContent = textarea.value.slice(0, pos);
    const span = document.createElement('span');
    span.textContent = '|';
    div.appendChild(span);
    document.body.appendChild(div);
    const taRect = textarea.getBoundingClientRect();
    const spanRect = span.getBoundingClientRect();
    const divRect = div.getBoundingClientRect();
    document.body.removeChild(div);
    return {
        top: spanRect.top - divRect.top - textarea.scrollTop,
        left: spanRect.left - divRect.left,
    };
}