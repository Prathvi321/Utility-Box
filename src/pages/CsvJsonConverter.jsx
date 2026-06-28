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
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      {/* Compact header row */}
      <div className="compact-service-header">
        <div className="header-icon bg-sage-100 text-sage-600 border border-sage-200">
          <Table2 size={20} />
        </div>
        <div className="min-w-0">
          <h1>CSV ↔ JSON Converter</h1>
          <p>Convert CSV rows into JSON objects and JSON arrays back into CSV.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white/70 rounded-xl border border-stone-100 shadow-sm p-2.5 mb-2 flex flex-wrap gap-2 items-center flex-shrink-0">
        <button onClick={() => setMode('csv-to-json')} className={`px-4 py-2 rounded-xl font-bold text-sm transition ${mode === 'csv-to-json' ? 'bg-sage-500 text-white shadow-lg shadow-sage-200' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>CSV → JSON</button>
        <button onClick={() => setMode('json-to-csv')} className={`px-4 py-2 rounded-xl font-bold text-sm transition ${mode === 'json-to-csv' ? 'bg-sage-500 text-white shadow-lg shadow-sage-200' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>JSON → CSV</button>
        <button onClick={swap} className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sage-100 text-sage-700 font-bold hover:bg-sage-200 text-sm transition"><ArrowLeftRight size={15} /> Use Output</button>
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
              <button onClick={downloadOutput} disabled={!output} className="p-2 rounded-lg bg-stone-100 hover:bg-sage-50 disabled:opacity-40 transition"><Download size={14} /></button>
            </div>
          </div>
          {error && <p className="mb-1 text-red-600 font-semibold text-xs">{error}</p>}
          <textarea readOnly value={output} className="w-full flex-1 p-3 rounded-xl border border-stone-200 bg-stone-50 font-mono text-xs outline-none resize-none min-h-0" placeholder="Converted result appears here..." />
        </section>
      </div>
    </div>
  );
};

export default CsvJsonConverter;
