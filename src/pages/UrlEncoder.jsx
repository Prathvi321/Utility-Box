import React, { useMemo, useState } from 'react';
import { Link2, Copy, Check, RotateCcw, ArrowLeftRight } from 'lucide-react';

const UrlEncoder = () => {
  const [mode, setMode] = useState('encode');
  const [scope, setScope] = useState('component');
  const [input, setInput] = useState('https://example.com/search?q=utility box&sort=newest');
  const [copied, setCopied] = useState(false);

  const { output, error } = useMemo(() => {
    try {
      if (!input) return { output: '', error: '' };
      if (mode === 'encode') {
        return { output: scope === 'full' ? encodeURI(input) : encodeURIComponent(input), error: '' };
      }
      return { output: scope === 'full' ? decodeURI(input) : decodeURIComponent(input), error: '' };
    } catch {
      return { output: '', error: 'Invalid URL encoding. Check for incomplete percent escapes like %E0.' };
    }
  }, [input, mode, scope]);

  const copyOutput = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const swap = () => {
    setInput(output || input);
    setMode(mode === 'encode' ? 'decode' : 'encode');
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      {/* Compact header row */}
      <div className="compact-service-header">
        <div className="header-icon bg-stone-100 text-stone-600 border border-stone-200">
          <Link2 size={20} />
        </div>
        <div className="min-w-0">
          <h1>URL Encoder / Decoder</h1>
          <p>Safely encode and decode URLs, query strings, and URL components.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white/70 rounded-xl border border-stone-100 shadow-sm p-2.5 mb-2 flex flex-wrap gap-2 items-center flex-shrink-0">
        {['encode', 'decode'].map(option => (
          <button key={option} onClick={() => setMode(option)} className={`px-4 py-2 rounded-xl font-bold capitalize text-sm transition ${mode === option ? 'bg-sage-500 text-white shadow-lg shadow-sage-200' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>{option}</button>
        ))}
        <div className="w-px h-8 bg-stone-200 mx-1" />
        <button onClick={() => setScope('component')} className={`px-4 py-2 rounded-xl font-bold text-sm transition ${scope === 'component' ? 'bg-sage-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>Component</button>
        <button onClick={() => setScope('full')} className={`px-4 py-2 rounded-xl font-bold text-sm transition ${scope === 'full' ? 'bg-sage-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>Full URL</button>
        <button onClick={swap} className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sage-100 text-sage-700 font-bold hover:bg-sage-200 text-sm transition"><ArrowLeftRight size={15} /> Swap</button>
      </div>

      {/* Input/Output grid — fills remaining space */}
      <div className="grid lg:grid-cols-2 gap-3 flex-1 min-h-0">
        <section className="bg-white/70 rounded-xl border border-stone-100 shadow-sm p-3 flex flex-col min-h-0">
          <h2 className="text-sm font-black text-sage-900 mb-2">Input</h2>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} className="w-full flex-1 p-3 rounded-xl border border-stone-200 bg-stone-50 font-mono text-xs focus:ring-2 focus:ring-sage-200 focus:border-sage-400 outline-none resize-none min-h-0" />
        </section>
        <section className="bg-white/70 rounded-xl border border-stone-100 shadow-sm p-3 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-black text-sage-900">Output</h2>
            <div className="flex gap-1.5">
              <button onClick={copyOutput} disabled={!output} className="p-2 rounded-lg bg-stone-100 hover:bg-sage-50 disabled:opacity-40 transition">{copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}</button>
              <button onClick={() => setInput('')} className="p-2 rounded-lg bg-stone-100 hover:bg-red-50 transition"><RotateCcw size={14} /></button>
            </div>
          </div>
          {error && <p className="mb-1 text-red-600 font-semibold text-xs">{error}</p>}
          <textarea readOnly value={output} className="w-full flex-1 p-3 rounded-xl border border-stone-200 bg-stone-50 font-mono text-xs outline-none resize-none min-h-0" />
        </section>
      </div>
    </div>
  );
};

export default UrlEncoder;
