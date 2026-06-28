import React, { useMemo, useState } from 'react';
import { Binary, Copy, Check, Upload, Download, RotateCcw } from 'lucide-react';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const bytesToBase64 = (bytes) => {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
};

const base64ToBytes = (base64) => {
  const clean = base64.replace(/^data:[^,]+,/, '').replace(/\s/g, '');
  const binary = atob(clean);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
};

const Base64Converter = () => {
  const [mode, setMode] = useState('encode');
  const [input, setInput] = useState('Hello from Utility Box!');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const { output, conversionError } = useMemo(() => {
    try {
      if (!input) return { output: '', conversionError: '' };
      if (mode === 'encode') return { output: bytesToBase64(textEncoder.encode(input)), conversionError: '' };
      return { output: textDecoder.decode(base64ToBytes(input)), conversionError: '' };
    } catch {
      return { output: '', conversionError: 'Invalid Base64 input. Check the text and try again.' };
    }
  }, [input, mode]);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError('');
    try {
      if (mode === 'encode') {
        const buffer = await file.arrayBuffer();
        setInput(bytesToBase64(new Uint8Array(buffer)));
      } else {
        setInput(await file.text());
      }
    } catch {
      setError('Could not read that file.');
    }
  };

  const copyOutput = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const downloadOutput = () => {
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mode === 'encode' ? 'encoded-base64.txt' : 'decoded-text.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      {/* Compact header row */}
      <div className="compact-service-header">
        <div className="header-icon bg-sage-100 text-sage-600 border border-sage-200">
          <Binary size={20} />
        </div>
        <div className="min-w-0">
          <h1>Base64 Encoder / Decoder</h1>
          <p>Encode and decode text or files locally in your browser.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white/70 backdrop-blur-xl rounded-xl border border-stone-100 shadow-sm p-2.5 mb-2 flex flex-wrap gap-2 items-center flex-shrink-0">
        {['encode', 'decode'].map(option => (
          <button key={option} onClick={() => setMode(option)} className={`px-4 py-2 rounded-xl font-bold capitalize text-sm transition ${mode === option ? 'bg-sage-500 text-white shadow-lg shadow-sage-200' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>{option}</button>
        ))}
        <label className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sage-900 text-white font-bold cursor-pointer hover:bg-sage-700 transition text-sm">
          <Upload size={15} /> Upload
          <input type="file" className="hidden" onChange={handleFile} />
        </label>
        {fileName && <span className="text-xs text-stone-500 font-semibold">Loaded: {fileName}</span>}
      </div>

      {/* Input/Output grid — fills remaining space */}
      <div className="grid lg:grid-cols-2 gap-3 flex-1 min-h-0 overflow-hidden">
        <section className="bg-white/70 rounded-xl border border-stone-100 shadow-sm p-3 flex flex-col min-h-0 overflow-hidden">
          <h2 className="text-sm font-black text-sage-900 mb-2">Input</h2>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} className="w-full flex-1 p-3 rounded-xl border border-stone-200 bg-stone-50 font-mono text-xs focus:ring-2 focus:ring-sage-200 focus:border-sage-400 outline-none resize-none min-h-0" placeholder={mode === 'encode' ? 'Text to encode...' : 'Base64 to decode...'} />
        </section>
        <section className="bg-white/70 rounded-xl border border-stone-100 shadow-sm p-3 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-black text-sage-900">Output</h2>
            <div className="flex gap-1.5">
              <button onClick={copyOutput} disabled={!output} className="p-2 rounded-lg bg-stone-100 hover:bg-sage-50 disabled:opacity-40 transition"><span className="sr-only">Copy</span>{copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}</button>
              <button onClick={downloadOutput} disabled={!output} className="p-2 rounded-lg bg-stone-100 hover:bg-sage-50 disabled:opacity-40 transition"><Download size={14} /></button>
              <button onClick={() => setInput('')} className="p-2 rounded-lg bg-stone-100 hover:bg-red-50 transition"><RotateCcw size={14} /></button>
            </div>
          </div>
          {(error || conversionError) && <p className="mb-1 text-red-600 font-semibold text-xs">{error || conversionError}</p>}
          <textarea readOnly value={output} className="w-full flex-1 p-3 rounded-xl border border-stone-200 bg-stone-50 font-mono text-xs outline-none resize-none min-h-0" placeholder="Result appears here..." />
        </section>
      </div>
    </div>
  );
};

export default Base64Converter;
