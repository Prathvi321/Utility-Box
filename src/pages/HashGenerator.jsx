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
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <div className="bg-amber-50 text-amber-600 w-20 h-20 rounded-3xl flex items-center justify-center mb-6 border border-amber-100"><Fingerprint size={38} /></div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">Hash Generator</h1>
        <p className="text-lg text-gray-600 font-medium">Generate browser-supported cryptographic hashes locally with the Web Crypto API.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <section className="bg-white/70 rounded-[2rem] border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-black text-gray-900 mb-4">Text to hash</h2>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} className="w-full min-h-[300px] p-5 rounded-2xl border border-gray-200 bg-gray-50 font-mono text-sm focus:ring-4 focus:ring-amber-100 focus:border-amber-400 outline-none resize-y" />
          <p className="mt-4 text-sm text-gray-500 font-semibold">Note: MD5 is intentionally unavailable in the secure Web Crypto API, so this tool uses SHA-family algorithms supported by modern browsers.</p>
        </section>
        <aside className="bg-white/70 rounded-[2rem] border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-black text-gray-900 mb-4">Algorithm</h2>
          <div className="grid grid-cols-2 gap-3 mb-6">{algorithms.map(item => <button key={item} onClick={() => setAlgorithm(item)} className={`px-4 py-3 rounded-2xl font-bold transition ${algorithm === item ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{item}</button>)}</div>
          <button onClick={generateHash} className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gray-900 text-white font-black hover:bg-amber-600 transition shadow-xl shadow-gray-200"><ShieldCheck /> Generate Hash</button>
          {error && <p className="mt-4 text-red-600 font-semibold">{error}</p>}
        </aside>
      </div>

      <section className="mt-6 bg-white/70 rounded-[2rem] border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-black text-gray-900">Hash Output</h2><button onClick={copyHash} disabled={!hash} className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-100 hover:bg-amber-50 disabled:opacity-40 font-bold">{copied ? <Check className="text-green-600" /> : <Copy />} Copy</button></div>
        <textarea readOnly value={hash} className="w-full min-h-[130px] p-5 rounded-2xl border border-gray-200 bg-gray-50 font-mono text-sm outline-none resize-y" placeholder="Your hash appears here..." />
      </section>
    </div>
  );
};

export default HashGenerator;
