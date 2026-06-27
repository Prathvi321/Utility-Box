import React, { useMemo, useState } from 'react';
import { Table2, Copy, Check, Download, ArrowLeftRight } from 'lucide-react';

const parseCsv = (csv) => {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    const next = csv[i + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += char;
  }
  row.push(cell); rows.push(row);
  const nonEmpty = rows.filter(items => items.some(value => value.trim() !== ''));
  const headers = nonEmpty.shift()?.map(header => header.trim()) || [];
  return nonEmpty.map(values => Object.fromEntries(headers.map((header, index) => [header || `column_${index + 1}`, values[index] ?? ''])));
};

const escapeCsv = (value) => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const jsonToCsv = (json) => {
  const data = JSON.parse(json);
  const rows = Array.isArray(data) ? data : [data];
  if (!rows.length || rows.some(row => row === null || typeof row !== 'object' || Array.isArray(row))) throw new Error('JSON must be an object or an array of objects.');
  const headers = [...new Set(rows.flatMap(row => Object.keys(row)))];
  return [headers.join(','), ...rows.map(row => headers.map(header => escapeCsv(row[header])).join(','))].join('\n');
};

const CsvJsonConverter = () => {
  const [mode, setMode] = useState('csv-to-json');
  const [input, setInput] = useState('name,email,role\nAda Lovelace,ada@example.com,Engineer\nGrace Hopper,grace@example.com,Admiral');
  const [copied, setCopied] = useState(false);

  const { output, error } = useMemo(() => {
    try {
      if (!input.trim()) return { output: '', error: '' };
      if (mode === 'csv-to-json') return { output: JSON.stringify(parseCsv(input), null, 2), error: '' };
      return { output: jsonToCsv(input), error: '' };
    } catch (err) {
      return { output: '', error: err.message || 'Could not convert that data.' };
    }
  }, [input, mode]);

  const copyOutput = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const downloadOutput = () => {
    const blob = new Blob([output], { type: mode === 'csv-to-json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mode === 'csv-to-json' ? 'converted.json' : 'converted.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const swap = () => {
    setInput(output || '');
    setMode(mode === 'csv-to-json' ? 'json-to-csv' : 'csv-to-json');
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <div className="bg-green-50 text-green-600 w-20 h-20 rounded-3xl flex items-center justify-center mb-6 border border-green-100"><Table2 size={38} /></div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">CSV to JSON Converter</h1>
        <p className="text-lg text-gray-600 font-medium">Convert CSV rows into JSON objects and JSON arrays back into CSV.</p>
      </div>

      <div className="bg-white/70 rounded-[2rem] border border-gray-100 shadow-sm p-6 mb-6 flex flex-wrap gap-3 items-center">
        <button onClick={() => setMode('csv-to-json')} className={`px-5 py-3 rounded-2xl font-bold transition ${mode === 'csv-to-json' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>CSV → JSON</button>
        <button onClick={() => setMode('json-to-csv')} className={`px-5 py-3 rounded-2xl font-bold transition ${mode === 'json-to-csv' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>JSON → CSV</button>
        <button onClick={swap} className="ml-auto inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-green-50 text-green-700 font-bold hover:bg-green-100"><ArrowLeftRight size={18} /> Use Output as Input</button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="bg-white/70 rounded-[2rem] border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-black text-gray-900 mb-4">Input</h2>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} className="w-full min-h-[430px] p-5 rounded-2xl border border-gray-200 bg-gray-50 font-mono text-sm focus:ring-4 focus:ring-green-100 focus:border-green-400 outline-none resize-y" />
        </section>
        <section className="bg-white/70 rounded-[2rem] border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-black text-gray-900">Output</h2><div className="flex gap-2"><button onClick={copyOutput} disabled={!output} className="p-3 rounded-xl bg-gray-100 hover:bg-green-50 disabled:opacity-40">{copied ? <Check className="text-green-600" /> : <Copy />}</button><button onClick={downloadOutput} disabled={!output} className="p-3 rounded-xl bg-gray-100 hover:bg-green-50 disabled:opacity-40"><Download /></button></div></div>
          {error && <p className="mb-3 text-red-600 font-semibold">{error}</p>}
          <textarea readOnly value={output} className="w-full min-h-[430px] p-5 rounded-2xl border border-gray-200 bg-gray-50 font-mono text-sm outline-none resize-y" placeholder="Converted result appears here..." />
        </section>
      </div>
    </div>
  );
};

export default CsvJsonConverter;
