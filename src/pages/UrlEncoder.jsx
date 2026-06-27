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
    <div className="h-full min-h-0 flex flex-col max-w-6xl mx-auto w-full animate-in fade-in duration-500">
      <div className="mb-4">
        <div className="bg-purple-50 text-purple-600 w-14 h-14 rounded-2xl flex items-center justify-center mb-3 border border-purple-100"><Link2 size={28} /></div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">URL Encoder/Decoder</h1>
        <p className="text-base text-gray-600 font-medium">Safely encode and decode URLs, query strings, and individual URL components.</p>
      </div>

      <div className="bg-white/70 rounded-[2rem] border border-gray-100 shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
        {['encode', 'decode'].map(option => <button key={option} onClick={() => setMode(option)} className={`px-5 py-3 rounded-2xl font-bold capitalize transition ${mode === option ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{option}</button>)}
        <div className="w-px h-10 bg-gray-200 mx-1" />
        <button onClick={() => setScope('component')} className={`px-5 py-3 rounded-2xl font-bold transition ${scope === 'component' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Component</button>
        <button onClick={() => setScope('full')} className={`px-5 py-3 rounded-2xl font-bold transition ${scope === 'full' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Full URL</button>
        <button onClick={swap} className="ml-auto inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-purple-50 text-purple-700 font-bold hover:bg-purple-100"><ArrowLeftRight size={18} /> Swap</button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 flex-1 min-h-0">
        <section className="bg-white/70 rounded-[2rem] border border-gray-100 shadow-sm p-4 flex flex-col min-h-0">
          <h2 className="text-xl font-black text-gray-900 mb-4">Input</h2>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} className="w-full flex-1 min-h-0 p-5 rounded-2xl border border-gray-200 bg-gray-50 font-mono text-sm focus:ring-4 focus:ring-purple-100 focus:border-purple-400 outline-none resize-y" />
        </section>
        <section className="bg-white/70 rounded-[2rem] border border-gray-100 shadow-sm p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-black text-gray-900">Output</h2><div className="flex gap-2"><button onClick={copyOutput} disabled={!output} className="p-3 rounded-xl bg-gray-100 hover:bg-purple-50 disabled:opacity-40">{copied ? <Check className="text-green-600" /> : <Copy />}</button><button onClick={() => setInput('')} className="p-3 rounded-xl bg-gray-100 hover:bg-red-50"><RotateCcw /></button></div></div>
          {error && <p className="mb-3 text-red-600 font-semibold">{error}</p>}
          <textarea readOnly value={output} className="w-full flex-1 min-h-0 p-5 rounded-2xl border border-gray-200 bg-gray-50 font-mono text-sm outline-none resize-y" />
        </section>
      </div>
    </div>
  );
};

export default UrlEncoder;
