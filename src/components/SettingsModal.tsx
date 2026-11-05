import React, { useEffect } from 'react';
import { X, Palette, Type, Sliders } from 'lucide-react';

export type ThemeType = 'obsidian' | 'slate' | 'paper' | 'minimal' | 'nordic';
export type FontType = 'sans' | 'serif' | 'mono' | 'arabic';
export type WidthType = 'standard' | 'wide' | 'full';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeType;
  onChangeTheme: (theme: ThemeType) => void;
  font: FontType;
  onChangeFont: (font: FontType) => void;
  fontSize: number;
  onChangeFontSize: (size: number) => void;
  editorWidth: WidthType;
  onChangeEditorWidth: (width: WidthType) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  onChangeTheme,
  font,
  onChangeFont,
  fontSize,
  onChangeFontSize,
  editorWidth,
  onChangeEditorWidth,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const themes: { id: ThemeType; label: string; desc: string; bg: string; text: string }[] = [
    { id: 'obsidian', label: 'Obsidian OLED', desc: 'Pitch black, high contrast', bg: 'bg-black', text: 'text-neutral-100' },
    { id: 'slate', label: 'Modern Slate', desc: 'Balanced dark blue/slate', bg: 'bg-slate-950', text: 'text-slate-100' },
    { id: 'paper', label: 'Paper Sepia', desc: 'Warm bookish cream tone', bg: 'bg-[#f8f5ee]', text: 'text-[#2b2723]' },
    { id: 'minimal', label: 'Minimalist Clean', desc: 'Pure white reader', bg: 'bg-white', text: 'text-neutral-900' },
    { id: 'nordic', label: 'Nordic Frost', desc: 'Subtle arctic charcoal', bg: 'bg-[#1e232a]', text: 'text-[#eceff4]' },
  ];

  const fonts: { id: FontType; label: string; fontClass: string; sample: string }[] = [
    { id: 'sans', label: 'Inter Sans', fontClass: 'font-sans', sample: 'Modern, clean & legible' },
    { id: 'arabic', label: 'Vazirmatn (وزیرمتن - Persian / Arabic)', fontClass: 'font-vazirmatn', sample: 'قلم استاندارد وزیرمتن برای متون فارسی و عربی' },
    { id: 'serif', label: 'Lora Literary Serif', fontClass: 'font-serif', sample: 'Editorial elegance' },
    { id: 'mono', label: 'Fira Code Monospace', fontClass: 'font-mono', sample: 'Developer precision' },
  ];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
    >
      <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl text-neutral-100">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2 font-bold text-neutral-100">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <span>Editor & Reader Preferences</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Close settings modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-5 text-sm">
          {/* Themes */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2.5">
              <Palette className="w-4 h-4 text-indigo-400" />
              <span>Theme Appearance</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onChangeTheme(t.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                    theme === t.id
                      ? 'border-indigo-500 bg-neutral-800/90 shadow-xs ring-1 ring-indigo-500'
                      : 'border-neutral-800 bg-neutral-950/50 hover:bg-neutral-800/50'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-xs text-white">{t.label}</div>
                    <div className="text-[10px] text-neutral-400">{t.desc}</div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border border-neutral-700 ${t.bg}`}></div>
                </button>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2.5">
              <Type className="w-4 h-4 text-indigo-400" />
              <span>Typography Family</span>
            </div>
            <div className="space-y-1.5">
              {fonts.map((f) => (
                <button
                  key={f.id}
                  onClick={() => onChangeFont(f.id)}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                    font === f.id
                      ? 'border-indigo-500 bg-neutral-800/90 shadow-xs ring-1 ring-indigo-500'
                      : 'border-neutral-800 bg-neutral-950/50 hover:bg-neutral-800/50'
                  }`}
                >
                  <span className="text-xs font-medium text-white">{f.label}</span>
                  <span className={`text-xs text-neutral-400 ${f.fontClass}`}>{f.sample}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-300 mb-2">
              <span>Font Size</span>
              <span className="font-mono text-indigo-400">{fontSize}px</span>
            </div>
            <input
              type="range"
              min={13}
              max={22}
              value={fontSize}
              onChange={(e) => onChangeFontSize(parseInt(e.target.value))}
              className="w-full accent-indigo-500 bg-neutral-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono mt-1">
              <span>13px (Compact)</span>
              <span>16px (Default)</span>
              <span>22px (Large)</span>
            </div>
          </div>

          {/* Editor Width */}
          <div>
            <div className="text-xs font-semibold text-neutral-300 mb-2">
              Reading Container Width
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['standard', 'wide', 'full'] as WidthType[]).map((w) => (
                <button
                  key={w}
                  onClick={() => onChangeEditorWidth(w)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium capitalize border transition-all ${
                    editorWidth === w
                      ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
                      : 'border-neutral-800 bg-neutral-950/50 text-neutral-400 hover:text-white'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
