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
    <div className="h-full min-h-0 flex flex-col max-w-7xl mx-auto w-full animate-in fade-in duration-500">
      <div className="mb-4">
        <div className="bg-blue-50 text-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center mb-3 border border-blue-100">
          <Binary size={28} />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Base64 Encoder/Decoder</h1>
        <p className="text-base text-gray-600 font-medium">Encode and decode text or file contents locally in your browser.</p>
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-gray-100 shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
        {['encode', 'decode'].map(option => (
          <button key={option} onClick={() => setMode(option)} className={`px-5 py-3 rounded-2xl font-bold capitalize transition ${mode === option ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{option}</button>
        ))}
        <label className="ml-auto inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gray-900 text-white font-bold cursor-pointer hover:bg-blue-600 transition">
          <Upload size={18} /> Upload File
          <input type="file" className="hidden" onChange={handleFile} />
        </label>
        {fileName && <span className="text-sm text-gray-500 font-semibold">Loaded: {fileName}</span>}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 flex-1 min-h-0">
        <section className="bg-white/70 rounded-[2rem] border border-gray-100 shadow-sm p-4 flex flex-col min-h-0">
          <h2 className="text-xl font-black text-gray-900 mb-4">Input</h2>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} className="w-full flex-1 min-h-0 p-5 rounded-2xl border border-gray-200 bg-gray-50 font-mono text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none resize-y" placeholder={mode === 'encode' ? 'Text to encode...' : 'Base64 to decode...'} />
        </section>
        <section className="bg-white/70 rounded-[2rem] border border-gray-100 shadow-sm p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-gray-900">Output</h2>
            <div className="flex gap-2">
              <button onClick={copyOutput} disabled={!output} className="p-3 rounded-xl bg-gray-100 hover:bg-blue-50 disabled:opacity-40">{copied ? <Check className="text-green-600" /> : <Copy />}</button>
              <button onClick={downloadOutput} disabled={!output} className="p-3 rounded-xl bg-gray-100 hover:bg-blue-50 disabled:opacity-40"><Download /></button>
              <button onClick={() => setInput('')} className="p-3 rounded-xl bg-gray-100 hover:bg-red-50"><RotateCcw /></button>
            </div>
          </div>
          {(error || conversionError) && <p className="mb-3 text-red-600 font-semibold">{error || conversionError}</p>}
          <textarea readOnly value={output} className="w-full flex-1 min-h-0 p-5 rounded-2xl border border-gray-200 bg-gray-50 font-mono text-sm outline-none resize-y" placeholder="Result appears here..." />
        </section>
      </div>
    </div>
  );
};

export default Base64Converter;
