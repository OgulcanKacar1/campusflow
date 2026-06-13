'use client';

import React, { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bold, Italic, List, ListOrdered, Link, Code, Eye, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  mode?: 'edit' | 'view';
  disabled?: boolean;
}

export function MarkdownEditor({ value, onChange, placeholder, className, mode = 'edit', disabled = false }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [internalMode, setInternalMode] = useState<'edit' | 'view'>(mode);

  const insertFormatting = (prefix: string, suffix: string = prefix) => {
    if (disabled || internalMode === 'view') return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + prefix + selectedText + suffix + value.substring(end);
    onChange(newText);

    // Reset cursor position after React re-renders
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const insertLineFormatting = (prefix: string) => {
    if (disabled || internalMode === 'view') return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // Find the start of the current line
    let lineStart = value.lastIndexOf('\n', start - 1) + 1;
    
    const newText = value.substring(0, lineStart) + prefix + value.substring(lineStart);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  // If forced view mode (e.g., user doesn't have permissions)
  if (mode === 'view') {
    return (
      <div className={cn('prose prose-invert max-w-none text-sm text-slate-300 rounded-md border border-slate-700 bg-slate-900/40 p-4', className)}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {value || '*Açıklama bulunmuyor.*'}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col rounded-md border border-slate-700 bg-slate-900/60 overflow-hidden', className, disabled && 'opacity-50 pointer-events-none')}>
      <div className="flex items-center justify-between border-b border-slate-700 bg-slate-800/50 p-1.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => insertFormatting('**')}
            disabled={disabled || internalMode === 'view'}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
            title="Kalın"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('*')}
            disabled={disabled || internalMode === 'view'}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
            title="İtalik"
          >
            <Italic className="h-4 w-4" />
          </button>
          <div className="h-4 w-px bg-slate-700 mx-1" />
          <button
            type="button"
            onClick={() => insertLineFormatting('- ')}
            disabled={disabled || internalMode === 'view'}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
            title="Madde İşaretli Liste"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => insertLineFormatting('1. ')}
            disabled={disabled || internalMode === 'view'}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
            title="Numaralı Liste"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <div className="h-4 w-px bg-slate-700 mx-1" />
          <button
            type="button"
            onClick={() => insertFormatting('[', '](url)')}
            disabled={disabled || internalMode === 'view'}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
            title="Bağlantı Ekle"
          >
            <Link className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('`')}
            disabled={disabled || internalMode === 'view'}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
            title="Kod"
          >
            <Code className="h-4 w-4" />
          </button>
        </div>

        {/* Preview Toggle */}
        <div className="flex items-center mr-1">
          <button
            type="button"
            onClick={() => setInternalMode(internalMode === 'edit' ? 'view' : 'edit')}
            className={cn(
              "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
              internalMode === 'view' ? "bg-indigo-500/20 text-indigo-300" : "text-slate-400 hover:bg-slate-700 hover:text-white"
            )}
          >
            {internalMode === 'edit' ? (
              <><Eye className="h-3.5 w-3.5" /> Önizleme</>
            ) : (
              <><Edit2 className="h-3.5 w-3.5" /> Düzenle</>
            )}
          </button>
        </div>
      </div>
      
      {internalMode === 'edit' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={5}
          disabled={disabled}
          className="w-full bg-transparent p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none resize-y min-h-[120px]"
        />
      ) : (
        <div className="p-4 min-h-[120px] prose prose-invert prose-sm max-w-none text-slate-300">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {value || '*Açıklama bulunmuyor.*'}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
