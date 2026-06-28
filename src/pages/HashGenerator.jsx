import React, { useState } from 'react';
import { Fingerprint, Copy, Check, ShieldCheck } from 'lucide-react';

const algorithms = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

const HashGenerator = () => {
  const [input, setInput] = useState('Utility Box');
  const [algorithm, setAlgorithm] = useState('SHA-256');
  const [hash, setHash] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const generateHash = async () => {
    setError('');
    try {
      const data = new TextEncoder().encode(input);
      const buffer = await crypto.subtle.digest(algorithm, data);
      setHash([...new Uint8Array(buffer)].map(byte => byte.toString(16).padStart(2, '0')).join(''));
    } catch {
      setError('This browser does not support the selected hash algorithm.');
      setHash('');
    }
  };

  const copyHash = async () => {
    if (!hash) return;
    await navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      {/* Compact header row */}
      <div className="compact-service-header">
        <div className="header-icon bg-sage-100 text-sage-600 border border-sage-200">
          <Fingerprint size={20} />
        </div>
        <div className="min-w-0">
          <h1>Hash Generator</h1>
          <p>Generate cryptographic hashes locally with the Web Crypto API.</p>
        </div>
      </div>

      {/* Horizontal layout: Input left, Controls+Output right */}
      <div className="grid lg:grid-cols-[1fr_1fr] gap-3 flex-1 min-h-0">
        {/* Left: Input textarea */}
        <section className="bg-white/70 rounded-xl border border-stone-100 shadow-sm p-3 flex flex-col min-h-0">
          <h2 className="text-sm font-black text-sage-900 mb-2">Text to Hash</h2>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} className="w-full flex-1 p-3 rounded-xl border border-stone-200 bg-stone-50 font-mono text-xs focus:ring-2 focus:ring-sage-200 focus:border-sage-400 outline-none resize-none min-h-0" />
          <p className="mt-1.5 text-[10px] text-stone-400 font-medium leading-tight">MD5 is unavailable in Web Crypto API. Uses SHA-family algorithms.</p>
        </section>

        {/* Right: Algorithm + Generate + Output stacked */}
        <div className="flex flex-col gap-3 min-h-0">
          {/* Algorithm buttons + Generate in one card */}
          <aside className="bg-white/70 rounded-xl border border-stone-100 shadow-sm p-3 flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-sm font-black text-sage-900">Algorithm</h2>
              <div className="flex gap-1.5 ml-auto">
                {algorithms.map(item => (
                  <button key={item} onClick={() => setAlgorithm(item)} className={`px-2.5 py-1.5 rounded-lg font-bold text-xs transition ${algorithm === item ? 'bg-sage-500 text-white shadow shadow-sage-200' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>{item}</button>
                ))}
              </div>
            </div>
            <button onClick={generateHash} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sage-900 text-white font-black text-sm hover:bg-sage-700 transition shadow-lg shadow-sage-200">
              <ShieldCheck size={15} /> Generate Hash
            </button>
            {error && <p className="mt-1.5 text-red-600 font-semibold text-xs">{error}</p>}
          </aside>

          {/* Output */}
          <section className="bg-white/70 rounded-xl border border-stone-100 shadow-sm p-3 flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-black text-sage-900">Hash Output</h2>
              <button onClick={copyHash} disabled={!hash} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-sage-50 disabled:opacity-40 font-bold text-xs transition">
                {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />} Copy
              </button>
            </div>
            <textarea readOnly value={hash} className="w-full flex-1 p-3 rounded-xl border border-stone-200 bg-stone-50 font-mono text-xs outline-none resize-none min-h-0" placeholder="Your hash appears here..." />
          </section>
        </div>
      </div>
    </div>
  );
};

export default HashGenerator;
