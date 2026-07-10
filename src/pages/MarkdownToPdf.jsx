import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    FileText, Upload, Printer, RefreshCw,
    BookOpen, List, AlignJustify, ChevronDown, FileUp, X
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Load external CDN scripts once
   ───────────────────────────────────────────── */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

/* ─────────────────────────────────────────────
   Sample markdown
   ───────────────────────────────────────────── */
const SAMPLE_MD = `# My Document Title
## A short subtitle here

---

## Introduction

Write your **Markdown** here and watch it render live. You can use:

- *Italic* and **bold** text
- [Links](https://example.com) and \`inline code\`
- Tables, blockquotes, and fenced code blocks

> This is a blockquote. Great for callouts and notes.

---

## Code Example

\`\`\`js
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));
\`\`\`

---

## Summary Table

| Feature | Supported |
|---------|-----------|
| Cover page | ✅ |
| Table of contents | ✅ |
| Syntax highlighting | ✅ |
| Page breaks | ✅ |
`;

/* ─────────────────────────────────────────────
   Preview iframe CSS (Ledger theme)
   ───────────────────────────────────────────── */
const PREVIEW_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,700&family=Lora:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  :root{
    --paper:#F6F4EE;--panel:#FFFFFE;--ink:#1E1D1A;--ink-soft:#5B584F;
    --ink-faint:#8C897E;--rule:#E2DDD0;--rule-strong:#CFC8B5;
    --accent:#2F5D45;--accent-soft:#E6EDE6;--gold:#A9762F;
    --code-bg:#1B211D;--code-ink:#E6E3D6;--code-bar:#141814;--radius:3px;
  }
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;background:var(--panel);}
  body{font-family:'Lora',Georgia,serif;font-size:.99rem;line-height:1.75;color:var(--ink);-webkit-font-smoothing:antialiased;padding:4rem 4.6rem;max-width:860px;margin:0 auto;}
  .md-body p{margin:0 0 1.05em;}
  .md-body strong{color:var(--ink);font-weight:600;}
  .md-body a{color:var(--accent);}
  .md-h{font-family:'Fraunces',serif;color:var(--ink);position:relative;}
  .md-h1{font-size:1.85rem;font-weight:700;margin:0 0 1.5rem;padding-bottom:.7rem;border-bottom:3px solid var(--ink);letter-spacing:-.01em;}
  .md-h2{font-size:1.42rem;font-weight:600;margin:2.6rem 0 1.1rem;color:var(--accent);}
  .md-h2::before{content:"";display:block;width:34px;height:2px;background:var(--gold);margin-bottom:.7rem;}
  .md-h3{font-size:1.12rem;font-weight:600;margin:2rem 0 .75rem;}
  .md-h4{font-family:'Inter',sans-serif;font-size:.86rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-soft);margin:1.6rem 0 .6rem;}
  .md-h5,.md-h6{font-family:'Inter',sans-serif;font-size:.8rem;font-weight:600;color:var(--ink-soft);margin:1.3rem 0 .5rem;}
  .md-body ul,.md-body ol{margin:0 0 1.05em;padding-left:1.3em;}
  .md-body li{margin-bottom:.35em;}
  .md-body li::marker{color:var(--gold);}
  .md-quote{margin:1.3em 0;padding:.2em 1.2em;border-left:3px solid var(--gold);background:var(--accent-soft);color:var(--ink-soft);font-style:italic;border-radius:0 var(--radius) var(--radius) 0;}
  .md-quote p{margin:.7em 0;}
  .md-divider{border:none;border-top:1px solid var(--rule);margin:2.6rem 0;}
  .table-wrap{margin:1.4em 0;overflow-x:auto;}
  table{width:100%;border-collapse:collapse;font-size:.86rem;font-family:'Lora',serif;}
  thead th{text-align:left;font-family:'Inter',sans-serif;font-size:.68rem;letter-spacing:.06em;text-transform:uppercase;color:#FBFAF5;background:var(--ink);padding:.6rem .8rem;}
  tbody td{padding:.55rem .8rem;border-bottom:1px solid var(--rule);vertical-align:top;}
  tbody tr:nth-child(even){background:#FAF8F2;}
  .code-block{margin:1.4em 0;border-radius:var(--radius);overflow:hidden;box-shadow:0 8px 22px -14px rgba(0,0,0,.4);}
  .code-bar{background:var(--code-bar);color:#9CA895;font-family:'JetBrains Mono',monospace;font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;padding:.5rem .9rem;display:flex;align-items:center;justify-content:space-between;}
  .code-bar::before{content:"● ● ●";letter-spacing:.2em;color:#3A4038;font-size:.6rem;}
  .code-pre{margin:0;background:var(--code-bg);padding:1.05rem 1.15rem 1.2rem;overflow-x:auto;}
  .code-pre code{font-family:'JetBrains Mono',monospace;font-size:.76rem;line-height:1.62;color:var(--code-ink);background:none;white-space:pre;}
  p code,li code{font-family:'JetBrains Mono',monospace;font-size:.83em;background:var(--accent-soft);color:var(--accent);padding:.12em .38em;border-radius:3px;}
  img{max-width:100%;height:auto;}
  .cover-page{min-height:78vh;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;}
  .cover-mark{font-family:'Fraunces',serif;font-size:2.6rem;color:var(--gold);margin-bottom:1.4rem;line-height:1;}
  .cover-title{font-family:'Fraunces',serif;font-weight:700;font-size:2.7rem;line-height:1.12;letter-spacing:-.01em;margin:0 0 .9rem;max-width:14ch;}
  .cover-subtitle{font-family:'Lora',serif;font-style:italic;font-size:1.18rem;color:var(--ink-soft);margin:0 0 2.4rem;}
  .cover-rule{width:64px;height:3px;background:var(--accent);margin-bottom:1.4rem;}
  .cover-meta{font-family:'Inter',sans-serif;font-size:.74rem;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-faint);}
  .toc-page{min-height:78vh;padding-top:1rem;}
  .toc-title{font-family:'Fraunces',serif;font-weight:600;font-size:1.15rem;letter-spacing:.02em;text-transform:uppercase;color:var(--ink);margin:0 0 1.6rem;padding-bottom:.8rem;border-bottom:2px solid var(--ink);}
  ul.toc-list{list-style:none;margin:0;padding:0;}
  .toc-list li a{display:flex;align-items:baseline;gap:.5rem;text-decoration:none;color:var(--ink);padding:.32rem 0;font-family:'Lora',serif;}
  .toc-list li a::after{content:"";flex:1;border-bottom:1px dotted var(--rule-strong);transform:translateY(-.3em);margin:0 .3em;}
  .toc-list .toc-l1 a{font-weight:600;font-size:1rem;margin-top:.55rem;}
  .toc-list .toc-l2 a{font-size:.92rem;padding-left:1.1rem;color:var(--ink-soft);}
  .toc-list .toc-l3 a{font-size:.84rem;padding-left:2.1rem;color:var(--ink-faint);font-style:italic;}
  @media screen{
    .page-break{position:relative;margin-top:3.4rem!important;padding-top:2.6rem;border-top:1px dashed var(--rule-strong);}
    .page-break::after{content:"◆ new page";position:absolute;top:-.62em;left:0;background:var(--panel);padding:0 .6em 0 0;font-family:'Inter',sans-serif;font-size:.64rem;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);}
    .cover-page{border-bottom:1px dashed var(--rule-strong);padding-bottom:3rem;margin-bottom:3rem;}
    .toc-page{border-bottom:1px dashed var(--rule-strong);padding-bottom:3rem;margin-bottom:3rem;}
  }
  @media print{
    body{padding:0;max-width:none;}
    .cover-page,.toc-page{border-bottom:none!important;margin-bottom:0!important;padding-bottom:0!important;break-after:page;page-break-after:always;}
    .page-break{margin-top:0!important;padding-top:0!important;border-top:none!important;break-before:page;page-break-before:always;}
    .page-break::after,.cover-page::after,.toc-page::after{content:none!important;}
  }
  .hljs-keyword,.hljs-built_in,.hljs-type{color:#8FBF9F;}
  .hljs-string,.hljs-attr{color:#D9B36C;}
  .hljs-number,.hljs-literal{color:#C98B6B;}
  .hljs-comment{color:#6C7268;font-style:italic;}
  .hljs-function,.hljs-title{color:#9FC1E0;}
  .hljs-variable,.hljs-params{color:var(--code-ink);}
  .hljs-meta{color:#7C8A78;}
`;

/* ─────────────────────────────────────────────
   Apply Ledger styling to marked output
   ───────────────────────────────────────────── */
function applyStyles(rawHtml, breakLevel) {
    const div = document.createElement('div');
    div.innerHTML = rawHtml;

    const headingMap = {
        H1: 'md-h md-h1', H2: 'md-h md-h2', H3: 'md-h md-h3',
        H4: 'md-h md-h4', H5: 'md-h md-h5', H6: 'md-h md-h6'
    };

    div.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => {
        h.className = headingMap[h.tagName] || '';
        const level = parseInt(h.tagName[1]);
        if (level <= breakLevel) h.classList.add('page-break');
    });

    div.querySelectorAll('blockquote').forEach(bq => { bq.className = 'md-quote'; });
    div.querySelectorAll('hr').forEach(hr => { hr.className = 'md-divider'; });

    div.querySelectorAll('table').forEach(t => {
        const wrap = document.createElement('div');
        wrap.className = 'table-wrap';
        t.parentNode.insertBefore(wrap, t);
        wrap.appendChild(t);
    });

    div.querySelectorAll('pre code').forEach(code => {
        const pre = code.parentElement;
        const langClass = [...code.classList].find(c => c.startsWith('language-'));
        const lang = langClass ? langClass.replace('language-', '') : '';

        if (window.hljs && lang) {
            try {
                code.innerHTML = window.hljs.highlight(code.textContent, { language: lang, ignoreIllegals: true }).value;
            } catch { /* fallback */ }
        }
        pre.className = 'code-pre';
        code.className = '';

        const block = document.createElement('div');
        block.className = 'code-block';
        const bar = document.createElement('div');
        bar.className = 'code-bar';
        const langLabel = document.createElement('span');
        langLabel.textContent = lang || 'code';
        bar.appendChild(langLabel);

        pre.parentNode.insertBefore(block, pre);
        block.appendChild(bar);
        block.appendChild(pre);
    });

    const body = document.createElement('div');
    body.className = 'md-body';
    body.innerHTML = div.innerHTML;
    return body.outerHTML;
}

function buildTocItems(mdText) {
    const items = [];
    mdText.split('\n').forEach(line => {
        const m = line.match(/^(#{1,3})\s+(.+)/);
        if (m) {
            const level = m[1].length;
            const text = m[2].replace(/\*\*/g, '').replace(/`/g, '').trim();
            const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
            items.push({ level, text, id });
        }
    });
    return items;
}

function buildCoverHtml(mdText) {
    let title = '', subtitle = '';
    for (const line of mdText.split('\n')) {
        const m1 = line.match(/^#\s+(.+)/);
        const m2 = line.match(/^##\s+(.+)/);
        if (m1 && !title) title = m1[1].replace(/\*\*/g, '').trim();
        else if (m2 && !subtitle) { subtitle = m2[1].replace(/\*\*/g, '').trim(); break; }
    }
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    return `<div class="cover-page">
      <div class="cover-mark">§</div>
      <h1 class="cover-title">${title || 'Document'}</h1>
      ${subtitle ? `<p class="cover-subtitle">${subtitle}</p>` : ''}
      <div class="cover-rule"></div>
      <p class="cover-meta">${date}</p>
    </div>`;
}

function buildTocHtml(items) {
    const li = items.map(({ level, text, id }) =>
        `<li class="toc-l${level}"><a href="#${id}">${text}</a></li>`
    ).join('\n');
    return `<div class="toc-page"><p class="toc-title">Contents</p><ul class="toc-list">${li}</ul></div>`;
}

/* ─────────────────────────────────────────────
   Toggle switch
   ───────────────────────────────────────────── */
function Toggle({ id, checked, onChange, label }) {
    return (
        <div className="flex items-center justify-between py-1.5">
            <label htmlFor={id} className="text-sm text-stone-700 font-medium cursor-pointer select-none">{label}</label>
            <button
                id={id}
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:ring-offset-1 ${checked ? 'bg-sage-600' : 'bg-stone-300'}`}
            >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Main component
   ───────────────────────────────────────────── */
const MarkdownToPdf = () => {
    const [mdText, setMdText] = useState(SAMPLE_MD);
    const [pageSize, setPageSize] = useState('A4');
    const [breakLevel, setBreakLevel] = useState(2);
    const [coverOn, setCoverOn] = useState(true);
    const [tocOn, setTocOn] = useState(true);
    const [fileName, setFileName] = useState('');
    const [scriptsReady, setScriptsReady] = useState(false);
    const [activeTab, setActiveTab] = useState('editor');

    const iframeRef = useRef(null);
    const fileInputRef = useRef(null);

    /* Load CDN scripts once */
    useEffect(() => {
        Promise.all([
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/marked/4.3.0/marked.min.js'),
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js'),
        ]).then(() => setScriptsReady(true)).catch(console.error);
    }, []);

    /* Render preview */
    const renderPreview = useCallback(() => {
        if (!scriptsReady || !iframeRef.current || !window.marked) return;
        window.marked.setOptions({ gfm: true, breaks: false });

        const rawHtml = window.marked.parse(mdText);
        const bodyHtml = applyStyles(rawHtml, breakLevel);
        const tocItems = buildTocItems(mdText);
        const coverHtml = coverOn ? buildCoverHtml(mdText) : '';
        const tocHtml = tocOn && tocItems.length > 0 ? buildTocHtml(tocItems) : '';
        const pageSizeCss = `@page{size:${pageSize};margin:20mm 16mm;}`;

        const full = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<style>${PREVIEW_CSS}${pageSizeCss}</style>
</head><body>${coverHtml}${tocHtml}${bodyHtml}</body></html>`;

        const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
        if (!doc) return;
        doc.open(); doc.write(full); doc.close();
    }, [mdText, pageSize, breakLevel, coverOn, tocOn, scriptsReady]);

    useEffect(() => { renderPreview(); }, [renderPreview]);

    /* File upload */
    const handleFile = (file) => {
        if (!file) return;
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (ev) => setMdText(ev.target.result || '');
        reader.readAsText(file, 'utf-8');
    };

    const handleInputChange = (e) => {
        handleFile(e.target.files?.[0]);
        e.target.value = '';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        handleFile(e.dataTransfer.files?.[0]);
    };

    const handlePrint = () => {
        iframeRef.current?.contentWindow?.print();
    };

    const handleSample = () => {
        setMdText(SAMPLE_MD);
        setFileName('');
    };

    return (
        <div className="h-full flex flex-col animate-in fade-in duration-500">
            {/* Compact header */}
            <div className="compact-service-header">
                <div className="header-icon bg-sage-100 text-sage-600 border border-sage-200">
                    <FileText size={20} />
                </div>
                <div className="min-w-0">
                    <h1>Markdown to PDF</h1>
                    <p>Edit or upload a .md file and export it as a print-ready PDF — with cover page, TOC &amp; syntax-highlighted code blocks.</p>
                </div>
            </div>

            {/* Main grid */}
            <div className="grid lg:grid-cols-[340px_1fr] gap-3 flex-1 min-h-0 overflow-hidden">

                {/* ── Left panel ── */}
                <div className="bg-white/70 rounded-2xl border border-stone-100 p-4 flex flex-col gap-3 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sage-100/40 rounded-full blur-3xl pointer-events-none" />

                    {/* Tab switcher */}
                    <div className="relative z-10 flex bg-stone-100 rounded-xl p-0.5 gap-0.5 flex-shrink-0">
                        {[
                            { key: 'editor', label: 'Editor', icon: AlignJustify },
                            { key: 'settings', label: 'Settings', icon: List },
                        ].map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-[10px] text-xs font-bold transition-all duration-200 ${activeTab === key ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                            >
                                <Icon size={13} /> {label}
                            </button>
                        ))}
                    </div>

                    {/* Editor tab */}
                    {activeTab === 'editor' && (
                        <div className="relative z-10 flex flex-col gap-3 flex-1 min-h-0">
                            {/* Drop zone */}
                            <div
                                className="border-2 border-dashed border-stone-200 rounded-xl p-3 text-center cursor-pointer hover:border-sage-400 hover:bg-sage-50/50 transition-all duration-200 flex-shrink-0"
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                            >
                                <input ref={fileInputRef} type="file" accept=".md,.markdown,.txt" className="hidden" onChange={handleInputChange} />
                                <FileUp size={18} className="mx-auto mb-1 text-stone-400" />
                                {fileName ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <p className="text-xs font-bold text-sage-700 truncate max-w-[180px]">{fileName}</p>
                                        <button onClick={(e) => { e.stopPropagation(); setFileName(''); setMdText(SAMPLE_MD); }} className="text-stone-400 hover:text-red-500 transition-colors">
                                            <X size={13} />
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-xs text-stone-500 font-medium">
                                        <span className="font-bold text-stone-700">Drop a .md file</span> or click to browse
                                    </p>
                                )}
                            </div>

                            {/* Textarea */}
                            <div className="flex-1 flex flex-col min-h-0">
                                <label className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-1.5 flex-shrink-0">Edit Source</label>
                                <textarea
                                    value={mdText}
                                    onChange={(e) => setMdText(e.target.value)}
                                    spellCheck={false}
                                    className="flex-1 min-h-0 w-full resize-none bg-stone-900 text-stone-200 rounded-xl border border-stone-700 text-xs leading-relaxed p-3 focus:outline-none focus:ring-2 focus:ring-sage-500/50 services-scrollbar"
                                    style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Settings tab */}
                    {activeTab === 'settings' && (
                        <div className="relative z-10 flex flex-col gap-4 flex-1 overflow-y-auto services-scrollbar pr-1">
                            {/* Page size */}
                            <div>
                                <label className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2 block">Page Size</label>
                                <div className="relative">
                                    <select
                                        value={pageSize}
                                        onChange={(e) => setPageSize(e.target.value)}
                                        className="w-full appearance-none bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-sage-300 pr-8"
                                    >
                                        <option value="A4">A4 (210 × 297 mm)</option>
                                        <option value="Letter">US Letter (8.5 × 11 in)</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Break level */}
                            <div>
                                <label className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2 block">New Page For Heading</label>
                                <div className="relative">
                                    <select
                                        value={breakLevel}
                                        onChange={(e) => setBreakLevel(Number(e.target.value))}
                                        className="w-full appearance-none bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-sage-300 pr-8"
                                    >
                                        <option value={1}>Top-level only (#)</option>
                                        <option value={2}>Headings # and ##</option>
                                        <option value={3}>Headings #, ## and ###</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                                </div>
                                <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">Every heading at this level or above begins on a fresh page.</p>
                            </div>

                            {/* Toggles */}
                            <div className="border border-stone-100 rounded-xl p-3 bg-stone-50/50">
                                <Toggle id="cover-toggle" checked={coverOn} onChange={setCoverOn} label="Cover Page" />
                                <div className="border-t border-stone-100 my-1" />
                                <Toggle id="toc-toggle" checked={tocOn} onChange={setTocOn} label="Table of Contents" />
                            </div>

                            {/* Tip */}
                            <div className="bg-sage-50 border border-sage-200/80 rounded-xl p-3 text-xs text-sage-800 leading-relaxed">
                                <BookOpen size={13} className="inline mr-1 opacity-60" />
                                Code blocks, tables, quotes and images never split across a page break. In the print dialog, choose <strong>Save as PDF</strong> — TOC links stay clickable.
                            </div>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="relative z-10 flex flex-col gap-2 flex-shrink-0 border-t border-stone-100 pt-3">
                        <button
                            id="md2pdf-save-btn"
                            onClick={handlePrint}
                            className="w-full py-2.5 px-4 font-bold rounded-xl bg-sage-900 hover:bg-sage-700 text-white transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-lg shadow-sage-200 group"
                        >
                            <Printer size={15} className="group-hover:-translate-y-0.5 transition-transform" />
                            Save as PDF
                        </button>
                        <button
                            id="md2pdf-reload-btn"
                            onClick={handleSample}
                            className="w-full py-2 px-4 font-bold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-all duration-200 flex items-center justify-center gap-2 text-xs"
                        >
                            <RefreshCw size={13} />
                            Reload Reference Example
                        </button>
                    </div>
                </div>

                {/* ── Right panel: preview ── */}
                <div className="flex flex-col min-h-0 bg-white/40 backdrop-blur-md rounded-2xl border border-stone-200/80 overflow-hidden">
                    {/* Preview toolbar */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-100 bg-white/60 flex-shrink-0">
                        <span className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center gap-2">
                            <BookOpen size={13} /> Live Preview
                        </span>
                        <span className="text-[10px] font-mono text-stone-400 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full">
                            {pageSize} · {scriptsReady ? 'ready' : 'loading…'}
                        </span>
                    </div>

                    {/* iframe */}
                    <div className="flex-1 min-h-0 overflow-hidden bg-stone-100/50 p-3">
                        <iframe
                            ref={iframeRef}
                            id="md2pdf-preview"
                            title="Markdown Preview"
                            className="w-full h-full rounded-xl border border-stone-200 shadow-inner bg-white"
                            style={{ minHeight: 0 }}
                            sandbox="allow-same-origin allow-scripts allow-modals"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarkdownToPdf;
