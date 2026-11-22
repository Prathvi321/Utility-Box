import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Send, 
  Paperclip, 
  Sparkles, 
  Trash2, 
  Download, 
  Loader2, 
  Volume2, 
  FileText, 
  Image as ImageIcon, 
  X, 
  Layers, 
  Settings, 
  AlertCircle, 
  GripVertical,
  QrCode,
  CheckCircle,
  FileUp,
  Sliders,
  FileArchive,
  ArrowRightToLine,
  HelpCircle,
  Plus,
  Link2,
  Binary,
  MessageSquare,
  Globe,
  RefreshCw,
  Eraser,
  ShieldCheck,
  FileSpreadsheet,
  FilePlus,
  Video,
  Pipette,
  Database,
  Play,
  RotateCcw,
  Copy,
  FileCheck2
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import qrcode from 'qrcode-generator';
import imageCompression from 'browser-image-compression';
import { PDFDocument } from 'pdf-lib';
import DropZone from '../components/DropZone';

// --- Audio Base64 Helpers ---
const base64ToArrayBuffer = (base64) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

const pcmToWav = (pcm16, sampleRate) => {
    const dataLength = pcm16.length * 2;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);
    let offset = 0;

    function writeString(str) {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset++, str.charCodeAt(i));
        }
    }

    function writeUint32(val) {
        view.setUint32(offset, val, true);
        offset += 4;
    }

    function writeUint16(val) {
        view.setUint16(offset, val, true);
        offset += 2;
    }

    writeString('RIFF');
    writeUint32(36 + dataLength);
    writeString('WAVE');
    writeString('fmt ');
    writeUint32(16);
    writeUint16(1);
    writeUint16(1);
    writeUint32(sampleRate);
    writeUint32(sampleRate * 2);
    writeUint16(2);
    writeUint16(16);
    writeString('data');
    writeUint32(dataLength);

    const pcmBytes = new Uint8Array(pcm16.buffer);
    for (let i = 0; i < pcmBytes.length; i++) {
        view.setUint8(offset++, pcmBytes[i]);
    }

    return new Blob([view], { type: 'audio/wav' });
};

const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = (error) => reject(error);
    });
};

// --- Custom Interactive Widgets ---

// 1. Upgraded Canvas-based QR Code Generator with Logo Overlay
const QrCodeWidget = ({ url }) => {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // States
  const [text, setText] = useState(url || 'https://utilityboxy.netlify.app');
  const [dotStyle, setDotStyle] = useState('square'); // 'square', 'rounded', 'circle'
  const [dotScale, setDotScale] = useState(0.9);
  const [qrColor, setQrColor] = useState('#0f172a');
  const [qrBg, setQrBg] = useState('#ffffff');
  
  // Logo States
  const [logoActive, setLogoActive] = useState(true);
  const [logoShape, setLogoShape] = useState('circle'); // 'circle', 'rounded', 'square'
  const [logoScale, setLogoScale] = useState(0.22);
  const [logoBorderWidth, setLogoBorderWidth] = useState(4);
  const [logoBorderColor, setLogoBorderColor] = useState('#ffffff');
  const [logoImg, setLogoImg] = useState(null); // HTMLImageElement
  const [logoFileName, setLogoFileName] = useState('');

  // Load default logo on mount
  useEffect(() => {
    const img = new Image();
    img.src = '/Utility.png';
    img.onload = () => {
      setLogoImg(img);
      setLogoFileName('Utility.png');
    };
  }, []);

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result;
        img.onload = () => setLogoImg(img);
      };
      reader.readAsDataURL(file);
    }
  };

  // Re-draw canvas whenever any settings change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const qr = qrcode(0, 'H'); // Use high error correction to sustain logo overlay
      qr.addData(text || ' ');
      qr.make();

      const moduleCount = qr.getModuleCount();
      canvas.width = 450;
      canvas.height = 450;

      const margin = 3;
      const cellSize = canvas.width / (moduleCount + margin * 2);
      const marginOffset = margin * cellSize;

      // Draw background
      ctx.fillStyle = qrBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Finder corner checker
      const isFinder = (row, col) => {
        if (row < 7 && col < 7) return true;
        if (row < 7 && col >= moduleCount - 7) return true;
        if (row >= moduleCount - 7 && col < 7) return true;
        return false;
      };

      // Inside logo bounds checker
      const isInsideLogo = (row, col) => {
        if (!logoActive || !logoImg) return false;
        const center = moduleCount / 2;
        const halfSize = (moduleCount * logoScale) / 2;
        return (
          row >= center - halfSize - 1 &&
          row <= center + halfSize &&
          col >= center - halfSize - 1 &&
          col <= center + halfSize
        );
      };

      // Draw QR modules
      ctx.fillStyle = qrColor;
      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (qr.isDark(r, c)) {
            if (isInsideLogo(r, c)) continue;

            const x = c * cellSize + marginOffset;
            const y = r * cellSize + marginOffset;
            const size = cellSize * dotScale;
            const offset = (cellSize - size) / 2;

            ctx.beginPath();
            if (dotStyle === 'circle') {
              ctx.arc(x + cellSize / 2, y + cellSize / 2, size / 2, 0, 2 * Math.PI);
              ctx.fill();
            } else if (dotStyle === 'rounded') {
              ctx.roundRect(x + offset, y + offset, size, size, size * 0.35);
              ctx.fill();
            } else {
              ctx.fillRect(x + offset, y + offset, size, size);
            }
          }
        }
      }

      // Draw Logo
      if (logoActive && logoImg) {
        const logoSize = canvas.width * logoScale;
        const lx = (canvas.width - logoSize) / 2;
        const ly = (canvas.height - logoSize) / 2;

        // Draw border
        if (logoBorderWidth > 0) {
          ctx.fillStyle = logoBorderColor;
          ctx.beginPath();
          if (logoShape === 'circle') {
            ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2 + logoBorderWidth, 0, 2 * Math.PI);
            ctx.fill();
          } else if (logoShape === 'rounded') {
            ctx.roundRect(lx - logoBorderWidth, ly - logoBorderWidth, logoSize + logoBorderWidth * 2, logoSize + logoBorderWidth * 2, logoSize * 0.25);
            ctx.fill();
          } else {
            ctx.fillRect(lx - logoBorderWidth, ly - logoBorderWidth, logoSize + logoBorderWidth * 2, logoSize + logoBorderWidth * 2);
          }
        }

        // Draw logo image clipped
        ctx.save();
        ctx.beginPath();
        if (logoShape === 'circle') {
          ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2, 0, 2 * Math.PI);
          ctx.clip();
        } else if (logoShape === 'rounded') {
          ctx.roundRect(lx, ly, logoSize, logoSize, logoSize * 0.2);
          ctx.clip();
        } else {
          ctx.rect(lx, ly, logoSize, logoSize);
          ctx.clip();
        }
        ctx.drawImage(logoImg, lx, ly, logoSize, logoSize);
        ctx.restore();
      }
    } catch (err) {
      console.error("QR draw error:", err);
    }
  }, [text, dotStyle, dotScale, qrColor, qrBg, logoActive, logoImg, logoScale, logoShape, logoBorderWidth, logoBorderColor]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `qrcode_${Date.now()}.png`;
      link.click();
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm mt-3 w-full max-w-md">
      <div className="flex items-center gap-2 mb-3 text-sage-800 font-extrabold text-sm border-b border-stone-100 pb-2">
        <QrCode className="w-4 h-4 text-sage-600" />
        <span>Custom QR Code Generator</span>
      </div>

      <div className="space-y-4">
        {/* URL Input */}
        <div>
          <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1">QR Code Data</label>
          <input 
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs focus:ring-2 focus:ring-sage-200 focus:outline-none font-medium"
            placeholder="https://..."
          />
        </div>

        {/* QR Preview Canvas */}
        <div className="flex justify-center p-3 bg-stone-50 rounded-2xl border border-stone-150">
          <canvas ref={canvasRef} className="w-40 h-40 object-contain bg-white rounded-xl shadow-inner border border-stone-100" />
        </div>

        {/* Design Customizations */}
        <div className="grid grid-cols-2 gap-3 text-xs bg-stone-50/50 p-3 rounded-xl border border-stone-150">
          <div>
            <label className="block text-[9px] font-black text-stone-400 uppercase tracking-wider mb-1">Dot Style</label>
            <select 
              value={dotStyle}
              onChange={(e) => setDotStyle(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded p-1"
            >
              <option value="square">Square</option>
              <option value="circle">Circle</option>
              <option value="rounded">Rounded</option>
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black text-stone-400 uppercase tracking-wider mb-1">Dot Color</label>
            <input 
              type="color"
              value={qrColor}
              onChange={(e) => setQrColor(e.target.value)}
              className="w-full h-7 rounded border border-stone-200 cursor-pointer p-0.5 bg-white"
            />
          </div>
        </div>

        {/* Logo Configuration */}
        <div className="bg-stone-50/50 p-3 rounded-xl border border-stone-150 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-700">Center Logo Overlay</span>
            <input 
              type="checkbox"
              checked={logoActive}
              onChange={(e) => setLogoActive(e.target.checked)}
              className="rounded text-sage-600 focus:ring-sage-200 cursor-pointer w-4 h-4"
            />
          </div>

          {logoActive && (
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-stone-400 uppercase">Logo Shape</label>
                  <select 
                    value={logoShape}
                    onChange={(e) => setLogoShape(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded p-1 mt-0.5 text-xs"
                  >
                    <option value="circle">Circle</option>
                    <option value="rounded">Rounded</option>
                    <option value="square">Square</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-stone-400 uppercase">Logo Size</label>
                  <input 
                    type="range"
                    min="0.15"
                    max="0.28"
                    step="0.01"
                    value={logoScale}
                    onChange={(e) => setLogoScale(parseFloat(e.target.value))}
                    className="w-full mt-2 accent-sage-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-stone-400 uppercase mb-1">Logo Image File</label>
                <input 
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-1.5 border border-dashed border-stone-300 rounded bg-white text-stone-600 text-[10px] font-bold hover:bg-stone-50"
                >
                  {logoFileName ? `Change: ${logoFileName.substring(0, 15)}...` : 'Upload Custom Logo'}
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-sage-900 text-white font-bold rounded-xl text-xs hover:bg-sage-800 transition-colors shadow-sm"
        >
          <Download className="w-3.5 h-3.5" /> Download QR Code
        </button>
      </div>
    </div>
  );
};

// 2. [NEW] PDF Page Extractor Widget
const ExtractPdfPagesWidget = ({ args, initialFiles }) => {
  const [pdfFile, setPdfFile] = useState(null);
  const [pagesText, setPagesText] = useState(args?.pageRanges || '');
  const [outputName, setOutputName] = useState(args?.outputName || 'Extracted_Pages.pdf');
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [maxPages, setMaxPages] = useState(0);

  // Parse total pages on load
  const loadPdfMetadata = async (file) => {
    try {
      const buffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buffer);
      setMaxPages(pdf.getPageCount());
      setErrorMsg('');
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to read PDF file properties.');
    }
  };

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      const pdf = initialFiles.find(f => f.file.type === 'application/pdf');
      if (pdf) {
        setPdfFile(pdf.file);
        loadPdfMetadata(pdf.file);
      }
    }
  }, [initialFiles]);

  const handleFileDrop = (incoming) => {
    const file = incoming instanceof FileList ? incoming[0] : incoming;
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      loadPdfMetadata(file);
      setDownloadUrl(null);
      setSuccessMsg('');
    } else {
      setErrorMsg('Only PDF documents are allowed.');
    }
  };

  const handleExtract = async () => {
    if (!pdfFile) {
      setErrorMsg('Please select a PDF file.');
      return;
    }
    if (!pagesText.trim()) {
      setErrorMsg('Please specify target page numbers.');
      return;
    }

    setIsExtracting(true);
    setErrorMsg('');
    setSuccessMsg('');
    setDownloadUrl(null);

    try {
      const buffer = await pdfFile.arrayBuffer();
      const srcPdf = await PDFDocument.load(buffer);
      const totalCount = srcPdf.getPageCount();

      // Parse range string (e.g., '4, 6, 8, 10' or '1-3, 5')
      const targetIndices = [];
      const parts = pagesText.split(',');

      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [startStr, endStr] = trimmed.split('-');
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          if (!isNaN(start) && !isNaN(end)) {
            const min = Math.min(start, end);
            const max = Math.max(start, end);
            for (let i = min; i <= max; i++) {
              if (i >= 1 && i <= totalCount) {
                targetIndices.push(i - 1);
              }
            }
          }
        } else {
          const val = parseInt(trimmed, 10);
          if (!isNaN(val) && val >= 1 && val <= totalCount) {
            targetIndices.push(val - 1);
          }
        }
      }

      // Deduplicate and sort
      const uniqueIndices = [...new Set(targetIndices)].sort((a, b) => a - b);

      if (uniqueIndices.length === 0) {
        throw new Error('No valid pages found in range. Check your range format.');
      }

      // Create new PDF and copy pages
      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(srcPdf, uniqueIndices);
      copiedPages.forEach(p => newPdf.addPage(p));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);
      setSuccessMsg(`Extracted ${uniqueIndices.length} page(s) successfully!`);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error occurred during extraction.');
    } finally {
      setIsExtracting(false);
    }
  };

  const triggerDownload = () => {
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = outputName.endsWith('.pdf') ? outputName : `${outputName}.pdf`;
      link.click();
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm mt-3 w-full max-w-md">
      <div className="flex items-center gap-2 mb-3 text-sage-800 font-extrabold text-sm border-b border-stone-100 pb-2">
        <FileText className="w-4 h-4 text-sage-600" />
        <span>PDF Page Extractor Widget</span>
      </div>

      <div className="space-y-4">
        {!pdfFile ? (
          <DropZone
            onFileDrop={handleFileDrop}
            accept=".pdf"
            multiple={false}
            title="Upload source PDF"
            subtitle="or drag and drop document"
            colorClass="rose"
            compact={true}
          />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 bg-stone-50 p-2.5 rounded-xl border border-stone-100 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div className="truncate">
                  <p className="font-bold text-stone-700 truncate">{pdfFile.name}</p>
                  <p className="text-[10px] text-stone-400 font-medium">{maxPages > 0 ? `${maxPages} pages` : 'Reading size...'} • {(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button 
                onClick={() => { setPdfFile(null); setDownloadUrl(null); setSuccessMsg(''); setMaxPages(0); }}
                className="text-stone-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Pages to Extract (e.g. 4, 6, 8, 10 or 1-3, 5)</label>
              <input 
                type="text"
                value={pagesText}
                onChange={(e) => setPagesText(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs focus:ring-2 focus:ring-sage-200 focus:outline-none font-medium"
                placeholder="4, 6, 8, 10"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Output Filename</label>
              <input 
                type="text"
                value={outputName}
                onChange={(e) => setOutputName(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs focus:ring-2 focus:ring-sage-200 focus:outline-none font-medium"
              />
            </div>

            <button
              onClick={handleExtract}
              disabled={isExtracting || !pagesText.trim()}
              className="w-full py-2 bg-sage-955 text-white font-bold rounded-xl text-xs hover:bg-sage-800 disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
              {isExtracting ? 'Extracting Pages...' : 'Extract & Download Pages'}
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-2.5 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-2 text-xs font-semibold">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-2.5 bg-sage-50 border border-sage-100 text-sage-800 rounded-xl flex items-center gap-2 text-xs font-semibold">
            <CheckCircle size={15} className="flex-shrink-0 text-sage-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {downloadUrl && (
          <button
            onClick={triggerDownload}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-md"
          >
            <Download className="w-4 h-4" /> Download Extracted Document
          </button>
        )}
      </div>
    </div>
  );
};

// 3. Base64 & URL Encoder/Decoder Widget
const CodecWidget = ({ title, icon: Icon, defaultText, mode, onProcess }) => {
  const [inputVal, setInputVal] = useState(defaultText || '');
  const [outputVal, setOutputVal] = useState('');
  const [activeMode, setActiveMode] = useState(mode || 'encode');

  const executeCodec = () => {
    try {
      const result = onProcess(inputVal, activeMode);
      setOutputVal(result);
    } catch (err) {
      setOutputVal(`Error: ${err.message}`);
    }
  };

  useEffect(() => {
    if (inputVal) executeCodec();
  }, [inputVal, activeMode]);

  const handleCopy = () => {
    if (outputVal) {
      navigator.clipboard.writeText(outputVal);
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm mt-3 w-full max-w-md text-xs">
      <div className="flex items-center gap-2 mb-3 text-sage-800 font-extrabold text-sm border-b border-stone-100 pb-2">
        <Icon className="w-4 h-4 text-sage-600" />
        <span>{title} Widget</span>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={() => setActiveMode('encode')}
            className={`flex-1 py-1 rounded-lg border font-bold text-[10px] uppercase tracking-wide transition-colors ${activeMode === 'encode' ? 'bg-sage-900 border-sage-950 text-white' : 'bg-stone-50 border-stone-200 text-stone-650'}`}
          >
            Encode
          </button>
          <button 
            type="button"
            onClick={() => setActiveMode('decode')}
            className={`flex-1 py-1 rounded-lg border font-bold text-[10px] uppercase tracking-wide transition-colors ${activeMode === 'decode' ? 'bg-sage-900 border-sage-950 text-white' : 'bg-stone-50 border-stone-200 text-stone-650'}`}
          >
            Decode
          </button>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Input Text</label>
          <textarea 
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            rows={2.5}
            className="w-full px-2.5 py-1.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sage-500 font-mono text-[11px] bg-stone-50"
            placeholder="Type text here..."
          />
        </div>

        {outputVal && (
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] font-bold text-stone-500 uppercase">Processed Output</label>
              <button onClick={handleCopy} className="text-[10px] text-sage-700 hover:text-sage-900 font-bold flex items-center gap-0.5">
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
            <pre className="w-full p-2 bg-stone-50 border border-stone-250 rounded-lg font-mono text-[11px] break-all whitespace-pre-wrap max-h-[100px] overflow-y-auto">
              {outputVal}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

// 4. WhatsApp Generator Widget
const WhatsAppWidget = ({ args }) => {
  const [phone, setPhone] = useState(args?.phone || '');
  const [message, setMessage] = useState(args?.text || '');
  const [linkUrl, setLinkUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[+\s-]/g, '');
    const encodedMsg = encodeURIComponent(message);
    const link = `https://wa.me/${cleanPhone}${message ? `?text=${encodedMsg}` : ''}`;
    setLinkUrl(link);

    const qr = qrcode(0, 'L');
    qr.addData(link);
    qr.make();
    setQrCodeUrl(qr.createDataURL(6, 1));
  }, [phone, message]);

  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm mt-3 w-full max-w-sm text-xs">
      <div className="flex items-center gap-2 mb-3 text-sage-800 font-extrabold text-sm border-b border-stone-100 pb-2">
        <MessageSquare className="w-4 h-4 text-sage-600" />
        <span>WhatsApp Link Generator</span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-[9px] font-bold text-stone-400 uppercase mb-0.5">Phone Number (with country code)</label>
          <input 
            type="text" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+919876543210"
            className="w-full px-2.5 py-1.5 border border-stone-200 rounded-lg focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[9px] font-bold text-stone-400 uppercase mb-0.5">Pretyped Message</label>
          <input 
            type="text" 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional message..."
            className="w-full px-2.5 py-1.5 border border-stone-200 rounded-lg focus:outline-none"
          />
        </div>

        {linkUrl && (
          <div className="flex flex-col items-center bg-stone-50 p-2.5 rounded-xl border border-stone-150 space-y-2.5">
            <img src={qrCodeUrl} alt="WhatsApp Link QR" className="w-24 h-24 border border-stone-100 rounded-lg bg-white" />
            <span className="font-mono text-[9px] text-stone-500 break-all text-center max-w-full">{linkUrl}</span>
            <div className="flex gap-2 w-full">
              <button 
                onClick={() => navigator.clipboard.writeText(linkUrl)}
                className="flex-1 py-1.5 bg-stone-100 border border-stone-200 rounded-lg font-bold text-[10px] hover:bg-stone-200 text-stone-700"
              >
                Copy Link
              </button>
              <a 
                href={linkUrl} 
                target="_blank" 
                rel="noreferrer"
                className="flex-1 py-1.5 bg-green-600 text-white rounded-lg font-bold text-[10px] hover:bg-green-700 text-center"
              >
                Open WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 5. Hash Generator Widget
const HashWidget = ({ args }) => {
  const [text, setText] = useState(args?.text || '');
  const [algorithm, setAlgorithm] = useState(args?.algorithm || 'SHA-256');
  const [hash, setHash] = useState('');

  useEffect(() => {
    const calculateHash = async () => {
      if (!text) {
        setHash('');
        return;
      }
      try {
        const msgUint8 = new TextEncoder().encode(text);
        const algoName = algorithm === 'SHA-512' ? 'SHA-512' : algorithm === 'SHA-1' ? 'SHA-1' : 'SHA-256';
        const hashBuffer = await crypto.subtle.digest(algoName, msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        setHash(hashHex);
      } catch (err) {
        console.error(err);
        setHash('Hash calculation error');
      }
    };
    calculateHash();
  }, [text, algorithm]);

  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm mt-3 w-full max-w-sm text-xs">
      <div className="flex items-center gap-2 mb-3 text-sage-800 font-extrabold text-sm border-b border-stone-100 pb-2">
        <Sliders className="w-4 h-4 text-sage-600" />
        <span>Secure Hash Generator</span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-[9px] font-bold text-stone-400 uppercase mb-0.5">Algorithm</label>
          <select 
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded p-1"
          >
            <option value="SHA-256">SHA-256</option>
            <option value="SHA-512">SHA-512</option>
            <option value="SHA-1">SHA-1 (Legacy)</option>
          </select>
        </div>

        <div>
          <label className="block text-[9px] font-bold text-stone-400 uppercase mb-0.5">Input Script</label>
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            className="w-full px-2 py-1 border border-stone-200 rounded-lg focus:outline-none bg-stone-50 font-mono"
            placeholder="Enter text to hash..."
          />
        </div>

        {hash && (
          <div className="space-y-1 bg-stone-50 p-2 rounded-lg border border-stone-200">
            <div className="flex justify-between items-center text-[10px] text-stone-400">
              <span className="font-bold">{algorithm} Hash</span>
              <button 
                onClick={() => navigator.clipboard.writeText(hash)}
                className="text-sage-700 hover:text-sage-900 font-bold"
              >
                Copy
              </button>
            </div>
            <pre className="font-mono text-[10px] text-stone-700 break-all whitespace-pre-wrap">{hash}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

// 6. CSV to JSON Converter Widget
const CsvJsonWidget = ({ args }) => {
  const [data, setData] = useState(args?.data || '');
  const [direction, setDirection] = useState(args?.direction || 'csv-to-json');
  const [output, setOutput] = useState('');

  useEffect(() => {
    if (!data.trim()) {
      setOutput('');
      return;
    }
    try {
      if (direction === 'csv-to-json') {
        const lines = data.trim().split('\n');
        if (lines.length === 0) return;
        const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
        const result = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const currentline = lines[i].split(',');
          const obj = {};
          for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentline[j]?.trim().replace(/^["']|["']$/g, '') || '';
          }
          result.push(obj);
        }
        setOutput(JSON.stringify(result, null, 2));
      } else {
        const json = JSON.parse(data);
        const array = Array.isArray(json) ? json : [json];
        if (array.length === 0) return;
        const headers = Object.keys(array[0]);
        const csvRows = [headers.join(',')];
        for (const row of array) {
          const values = headers.map(header => {
            const escaped = ('' + (row[header] || '')).replace(/"/g, '\\"');
            return `"${escaped}"`;
          });
          csvRows.push(values.join(','));
        }
        setOutput(csvRows.join('\n'));
      }
    } catch (err) {
      setOutput(`Error parsing data: ${err.message}`);
    }
  }, [data, direction]);

  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm mt-3 w-full max-w-md text-xs">
      <div className="flex items-center gap-2 mb-3 text-sage-800 font-extrabold text-sm border-b border-stone-100 pb-2">
        <FileSpreadsheet className="w-4 h-4 text-sage-600" />
        <span>CSV ↔ JSON Converter</span>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <button 
            onClick={() => setDirection('csv-to-json')}
            className={`flex-1 py-1 rounded-lg border font-bold text-[10px] uppercase transition-colors ${direction === 'csv-to-json' ? 'bg-sage-900 border-sage-950 text-white' : 'bg-stone-50 border-stone-200 text-stone-600'}`}
          >
            CSV to JSON
          </button>
          <button 
            onClick={() => setDirection('json-to-csv')}
            className={`flex-1 py-1 rounded-lg border font-bold text-[10px] uppercase transition-colors ${direction === 'json-to-csv' ? 'bg-sage-900 border-sage-950 text-white' : 'bg-stone-50 border-stone-200 text-stone-600'}`}
          >
            JSON to CSV
          </button>
        </div>

        <div>
          <textarea 
            value={data}
            onChange={(e) => setData(e.target.value)}
            rows={3}
            className="w-full px-2.5 py-1.5 border border-stone-200 rounded-lg focus:outline-none font-mono text-[10px] bg-stone-50"
            placeholder={direction === 'csv-to-json' ? 'name,age,city\nJohn,30,New York' : '[\n  {"name": "John", "age": 30}\n]'}
          />
        </div>

        {output && (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-stone-400 font-bold">Output</span>
              <button 
                onClick={() => navigator.clipboard.writeText(output)}
                className="text-sage-700 hover:text-sage-900 font-bold"
              >
                Copy
              </button>
            </div>
            <pre className="w-full p-2 bg-stone-50 border border-stone-250 rounded-lg font-mono text-[10px] overflow-y-auto max-h-[100px] break-all whitespace-pre-wrap">{output}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

// 7. DNS Lookup Tracker Widget
const DnsLookupWidget = ({ args }) => {
  const [domain, setDomain] = useState(args?.domain || '');
  const [records, setRecords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lookupDomain = async () => {
    if (!domain) return;
    setLoading(true);
    setError('');
    setRecords(null);
    try {
      // Query Google DNS over HTTPS JSON API (100% free, real-time public endpoint)
      const res = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
      const resMX = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
      
      const dataA = await res.json();
      const dataMX = await resMX.json();

      const lookupResults = [];
      if (dataA.Answer) {
        dataA.Answer.forEach(ans => {
          lookupResults.push({ type: 'A', data: ans.data, ttl: ans.TTL });
        });
      }
      if (dataMX.Answer) {
        dataMX.Answer.forEach(ans => {
          lookupResults.push({ type: 'MX', data: ans.data, ttl: ans.TTL });
        });
      }

      if (lookupResults.length === 0) {
        setError('No A or MX records found for this domain.');
      } else {
        setRecords(lookupResults);
      }
    } catch (err) {
      console.error(err);
      setError('DNS Track lookup query failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (args?.domain) lookupDomain();
  }, [args?.domain]);

  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm mt-3 w-full max-w-sm text-xs">
      <div className="flex items-center gap-2 mb-3 text-sage-800 font-extrabold text-sm border-b border-stone-100 pb-2">
        <Globe className="w-4 h-4 text-sage-600" />
        <span>DNS Track Domain Query</span>
      </div>

      <div className="space-y-3">
        <div className="flex gap-1.5">
          <input 
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="flex-1 px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs"
            placeholder="google.com"
          />
          <button 
            onClick={lookupDomain}
            disabled={loading || !domain}
            className="px-3 bg-sage-900 text-white rounded-lg text-xs font-bold hover:bg-sage-800 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Query'}
          </button>
        </div>

        {error && <p className="text-red-500 font-bold text-[10px]">{error}</p>}

        {records && (
          <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-150 space-y-1.5 font-mono text-[10px]">
            <div className="grid grid-cols-3 font-bold border-b border-stone-200 pb-1 text-[9px] text-stone-400 uppercase">
              <span>Type</span>
              <span>TTL</span>
              <span>Address/Value</span>
            </div>
            {records.map((rec, i) => (
              <div key={i} className="grid grid-cols-3 text-stone-700 py-0.5">
                <span className="font-bold text-sage-700">{rec.type}</span>
                <span>{rec.ttl}</span>
                <span className="truncate">{rec.data}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// 8. Image Format Converter Widget
const ImageConvertWidget = ({ initialFiles }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [format, setFormat] = useState('png');
  const [converting, setConverting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      const img = initialFiles.find(f => f.file.type.startsWith('image/'));
      if (img) {
        setFile(img.file);
        setPreview(URL.createObjectURL(img.file));
      }
    }
  }, [initialFiles]);

  const handleFileDrop = (incoming) => {
    const f = incoming instanceof FileList ? incoming[0] : incoming;
    if (f && f.type.startsWith('image/')) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setDownloadUrl('');
    }
  };

  const convertImage = () => {
    if (!file) return;
    setConverting(true);
    setDownloadUrl('');

    const img = new Image();
    img.src = preview;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);

      const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
      const outputUrl = canvas.toDataURL(mimeType);
      setDownloadUrl(outputUrl);
      setConverting(false);
    };
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm mt-3 w-full max-w-sm text-xs">
      <div className="flex items-center gap-2 mb-3 text-sage-800 font-extrabold text-sm border-b border-stone-100 pb-2">
        <RefreshCw className="w-4 h-4 text-sage-600" />
        <span>Image Format Converter</span>
      </div>

      {!file ? (
        <DropZone 
          onFileDrop={handleFileDrop}
          accept="image/*"
          multiple={false}
          title="Upload image"
          colorClass="teal"
          compact={true}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-stone-50 p-2.5 rounded-xl border border-stone-150">
            <span className="truncate max-w-[200px] font-bold text-stone-700">{file.name}</span>
            <button onClick={() => { setFile(null); setPreview(''); setDownloadUrl(''); }} className="text-stone-400 hover:text-red-500">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-bold text-stone-400 uppercase">Target Format</label>
              <select 
                value={format} 
                onChange={(e) => setFormat(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded p-1 mt-0.5 text-xs font-bold"
              >
                <option value="png">PNG</option>
                <option value="jpg">JPG</option>
                <option value="webp">WebP</option>
              </select>
            </div>
            <button 
              onClick={convertImage}
              disabled={converting}
              className="mt-4 px-3 bg-sage-900 text-white rounded-lg text-xs font-bold hover:bg-sage-800 disabled:opacity-50"
            >
              {converting ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Convert'}
            </button>
          </div>

          {downloadUrl && (
            <a 
              href={downloadUrl}
              download={`converted_${file.name.substring(0, file.name.lastIndexOf('.'))}.${format}`}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-center mt-2 shadow-sm"
            >
              <Download className="w-4 h-4" /> Download Image ({format.toUpperCase()})
            </a>
          )}
        </div>
      )}
    </div>
  );
};

// 9. Remove Background Widget
const RemoveBgWidget = ({ initialFiles }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [processing, setProcessing] = useState(false);
  const [resultB64, setResultB64] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      const img = initialFiles.find(f => f.file.type.startsWith('image/'));
      if (img) {
        setFile(img.file);
        setPreview(URL.createObjectURL(img.file));
      }
    }
  }, [initialFiles]);

  const handleFileDrop = (incoming) => {
    const f = incoming instanceof FileList ? incoming[0] : incoming;
    if (f && f.type.startsWith('image/')) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setResultB64('');
      setError('');
    }
  };

  const handleRemoveBg = async () => {
    if (!file) return;
    setProcessing(true);
    setError('');
    setResultB64('');

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const b64Data = reader.result.split(',')[1];
        const res = await fetch('/.netlify/functions/remove-bg', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_file_b64: b64Data })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'API background removal failure');
        }

        const data = await res.json();
        setResultB64(data.image_b64);
      };
    } catch (err) {
      console.error(err);
      setError(err.message || 'Background removal request failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm mt-3 w-full max-w-sm text-xs">
      <div className="flex items-center gap-2 mb-3 text-sage-800 font-extrabold text-sm border-b border-stone-100 pb-2">
        <Eraser className="w-4 h-4 text-sage-600" />
        <span>AI Background Remover</span>
      </div>

      {!file ? (
        <DropZone 
          onFileDrop={handleFileDrop}
          accept="image/*"
          multiple={false}
          title="Upload image"
          colorClass="orange"
          compact={true}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-stone-50 p-2.5 rounded-xl border border-stone-150">
            <span className="truncate max-w-[200px] font-bold text-stone-700">{file.name}</span>
            <button onClick={() => { setFile(null); setPreview(''); setResultB64(''); setError(''); }} className="text-stone-400 hover:text-red-500">
              <X className="w-4 h-4" />
            </button>
          </div>

          {!resultB64 ? (
            <button 
              onClick={handleRemoveBg}
              disabled={processing}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-sage-900 hover:bg-sage-800 text-white rounded-xl font-bold"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eraser className="w-4 h-4" />}
              {processing ? 'Removing Background...' : 'Erase Background with AI'}
            </button>
          ) : (
            <a 
              href={`data:image/png;base64,${resultB64}`}
              download={`nobg_${file.name.substring(0, file.name.lastIndexOf('.'))}.png`}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm"
            >
              <Download className="w-4 h-4" /> Download Transformed PNG
            </a>
          )}

          {error && <p className="text-red-500 font-bold text-[10px]">{error}</p>}
        </div>
      )}
    </div>
  );
};

// 10. AI Media Purger Widget (EXIF Cleaner)
const AiPurgeWidget = ({ initialFiles }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [cleanedUrl, setCleanedUrl] = useState('');
  const [purging, setPurging] = useState(false);

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      const img = initialFiles.find(f => f.file.type.startsWith('image/'));
      if (img) {
        setFile(img.file);
        setPreview(URL.createObjectURL(img.file));
      }
    }
  }, [initialFiles]);

  const handleFileDrop = (incoming) => {
    const f = incoming instanceof FileList ? incoming[0] : incoming;
    if (f && f.type.startsWith('image/')) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setCleanedUrl('');
    }
  };

  const handlePurge = () => {
    if (!file) return;
    setPurging(true);
    
    // Canvas drawing strips all EXIF metadata binary headers!
    const img = new Image();
    img.src = preview;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d')?.drawImage(img, 0, 0);
      
      const cleaned = canvas.toDataURL('image/jpeg', 0.95);
      setCleanedUrl(cleaned);
      setPurging(false);
    };
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm mt-3 w-full max-w-sm text-xs">
      <div className="flex items-center gap-2 mb-3 text-sage-800 font-extrabold text-sm border-b border-stone-100 pb-2">
        <ShieldCheck className="w-4 h-4 text-sage-600" />
        <span>AI Media Metadata Purger</span>
      </div>

      {!file ? (
        <DropZone 
          onFileDrop={handleFileDrop}
          accept="image/*"
          multiple={false}
          title="Upload image file"
          colorClass="emerald"
          compact={true}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-stone-50 p-2.5 rounded-xl border border-stone-150">
            <span className="truncate max-w-[200px] font-bold text-stone-700">{file.name}</span>
            <button onClick={() => { setFile(null); setPreview(''); setCleanedUrl(''); }} className="text-stone-400 hover:text-red-500">
              <X className="w-4 h-4" />
            </button>
          </div>

          {!cleanedUrl ? (
            <button 
              onClick={handlePurge}
              disabled={purging}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-sage-900 hover:bg-sage-800 text-white rounded-xl font-bold"
            >
              {purging ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {purging ? 'Purging Metadata...' : 'Purge AI & EXIF Metadata'}
            </button>
          ) : (
            <a 
              href={cleanedUrl}
              download={`purged_${file.name}`}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm"
            >
              <Download className="w-4 h-4" /> Download Metadata-Cleaned JPG
            </a>
          )}
        </div>
      )}
    </div>
  );
};

// 11. Database SQL ↔ JSON Converter
const DatabaseConvertWidget = ({ args }) => {
  const [sql, setSql] = useState(args?.sqlData || '');
  const [jsonOutput, setJsonOutput] = useState('');

  const handleConvert = () => {
    if (!sql.trim()) return;
    try {
      // Regex insert parser
      const insertRegex = /INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i;
      const match = sql.match(insertRegex);
      if (match) {
        const columns = match[2].split(',').map(c => c.trim().replace(/[`"']/g, ''));
        const values = match[3].split(',').map(v => v.trim().replace(/^['"]|['"]$/g, ''));
        const obj = {};
        columns.forEach((col, i) => {
          obj[col] = values[i] || '';
        });
        setJsonOutput(JSON.stringify(obj, null, 2));
      } else {
        setJsonOutput('Error: SQL INSERT statement could not be parsed. Make sure it has INSERT INTO table (cols) VALUES (vals) formatting.');
      }
    } catch (err) {
      setJsonOutput(`Error: ${err.message}`);
    }
  };

  useEffect(() => {
    if (args?.sqlData) handleConvert();
  }, [args?.sqlData]);

  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm mt-3 w-full max-w-sm text-xs">
      <div className="flex items-center gap-2 mb-3 text-sage-800 font-extrabold text-sm border-b border-stone-100 pb-2">
        <Database className="w-4 h-4 text-sage-600" />
        <span>SQL Database Converter</span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-[9px] font-bold text-stone-400 uppercase mb-0.5">Insert Statement</label>
          <textarea 
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            rows={2}
            className="w-full px-2 py-1 border border-stone-200 rounded-lg focus:outline-none bg-stone-50 font-mono text-[10px]"
            placeholder="INSERT INTO users (id, name) VALUES (1, 'Alice');"
          />
        </div>

        <button 
          onClick={handleConvert}
          className="w-full py-1.5 bg-sage-900 hover:bg-sage-800 text-white rounded-lg font-bold"
        >
          Convert SQL
        </button>

        {jsonOutput && (
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] text-stone-400">
              <span className="font-bold">JSON Result</span>
              <button 
                onClick={() => navigator.clipboard.writeText(jsonOutput)}
                className="text-sage-700 hover:text-sage-900 font-bold"
              >
                Copy
              </button>
            </div>
            <pre className="p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono text-[10px] max-h-[80px] overflow-y-auto whitespace-pre-wrap">{jsonOutput}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

// 12. FrameSnap (Video Frame Extractor) Widget
const FrameSnapWidget = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [success, setSuccess] = useState(false);

  const handleFileDrop = (incoming) => {
    const f = incoming instanceof FileList ? incoming[0] : incoming;
    if (f && f.type.startsWith('video/')) {
      setVideoFile(f);
      setVideoUrl(URL.createObjectURL(f));
      setSuccess(false);
    }
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `frame_${Date.now()}.png`;
      link.click();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm mt-3 w-full max-w-sm text-xs">
      <div className="flex items-center gap-2 mb-3 text-sage-800 font-extrabold text-sm border-b border-stone-100 pb-2">
        <Video className="w-4 h-4 text-sage-600" />
        <span>FrameSnap Frame Extractor</span>
      </div>

      {!videoFile ? (
        <DropZone 
          onFileDrop={handleFileDrop}
          accept="video/*"
          multiple={false}
          title="Upload video file"
          colorClass="indigo"
          compact={true}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-stone-50 p-2 rounded-lg border border-stone-200">
            <span className="truncate font-bold text-stone-700">{videoFile.name}</span>
            <button onClick={() => { setVideoFile(null); setVideoUrl(''); }} className="text-stone-400 hover:text-red-500">
              <X className="w-4 h-4" />
            </button>
          </div>

          <video ref={videoRef} src={videoUrl} controls className="w-full rounded-xl border border-stone-200 shadow-inner bg-black max-h-[140px]" />
          <canvas ref={canvasRef} className="hidden" />

          <button 
            onClick={handleCapture}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-sage-900 hover:bg-sage-800 text-white rounded-xl font-bold shadow-sm"
          >
            Snap Current Frame
          </button>

          {success && (
            <p className="text-emerald-600 font-bold text-[10px] text-center">✓ Frame snapshot downloaded successfully!</p>
          )}
        </div>
      )}
    </div>
  );
};

// 13. Image to PDF Compiler
const ImageToPdfWidget = () => {
  const [images, setImages] = useState([]);
  const [outputName, setOutputName] = useState('compiled_images.pdf');
  const [compiling, setCompiling] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');

  const handleFileDrop = (incoming) => {
    const list = incoming instanceof FileList ? Array.from(incoming) : (Array.isArray(incoming) ? incoming : [incoming]);
    const imgs = list.filter(f => f.type.startsWith('image/'));
    if (imgs.length > 0) {
      setImages(prev => [...prev, ...imgs.map(file => ({
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name
      }))]);
      setDownloadUrl('');
    }
  };

  const handleCompile = async () => {
    if (images.length === 0) return;
    setCompiling(true);
    setDownloadUrl('');

    try {
      const pdfDoc = await PDFDocument.create();
      for (const item of images) {
        const arrayBuffer = await item.file.arrayBuffer();
        let pdfImg;
        if (item.file.type === 'image/png') {
          pdfImg = await pdfDoc.embedPng(arrayBuffer);
        } else {
          pdfImg = await pdfDoc.embedJpg(arrayBuffer);
        }

        const page = pdfDoc.addPage([pdfImg.width, pdfImg.height]);
        page.drawImage(pdfImg, { x: 0, y: 0, width: pdfImg.width, height: pdfImg.height });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error(err);
    } finally {
      setCompiling(false);
    }
  };

  const triggerDownload = () => {
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = outputName.endsWith('.pdf') ? outputName : `${outputName}.pdf`;
      link.click();
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm mt-3 w-full max-w-md text-xs">
      <div className="flex items-center gap-2 mb-3 text-sage-800 font-extrabold text-sm border-b border-stone-100 pb-2">
        <FilePlus className="w-4 h-4 text-sage-600" />
        <span>Image to PDF Compiler</span>
      </div>

      <div className="space-y-3">
        {images.length === 0 ? (
          <DropZone 
            onFileDrop={handleFileDrop}
            accept="image/*"
            multiple={true}
            title="Upload images"
            colorClass="amber"
            compact={true}
          />
        ) : (
          <div className="space-y-3">
            <div className="max-h-[100px] overflow-y-auto pr-1 services-scrollbar space-y-1.5">
              {images.map(img => (
                <div key={img.id} className="flex justify-between items-center p-2 bg-stone-50 rounded-lg border border-stone-200 text-[10px]">
                  <span className="truncate max-w-[200px] font-bold text-stone-700">{img.name}</span>
                  <button onClick={() => setImages(prev => prev.filter(x => x.id !== img.id))} className="text-stone-400 hover:text-red-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-[9px] font-bold text-stone-400 uppercase">Output PDF Name</label>
              <input 
                type="text" 
                value={outputName}
                onChange={(e) => setOutputName(e.target.value)}
                className="w-full px-2 py-1 border border-stone-200 rounded-lg mt-0.5"
              />
            </div>

            <button 
              onClick={handleCompile}
              disabled={compiling}
              className="w-full py-2 bg-sage-900 text-white rounded-lg font-bold hover:bg-sage-800"
            >
              {compiling ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Compile Images to PDF'}
            </button>

            {downloadUrl && (
              <button 
                onClick={triggerDownload}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Download compiled PDF
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// 14. Color Picker Widget
const ColorPickerWidget = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const canvasRef = useRef(null);
  const [pickedColor, setPickedColor] = useState('');

  const handleFileDrop = (incoming) => {
    const f = incoming instanceof FileList ? incoming[0] : incoming;
    if (f && f.type.startsWith('image/')) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setPickedColor('');
    }
  };

  useEffect(() => {
    if (!preview) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = preview;
    img.onload = () => {
      canvas.width = canvas.parentElement.clientWidth || 300;
      canvas.height = (img.height / img.width) * canvas.width;
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  }, [preview]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height);

    const ctx = canvas.getContext('2d');
    const data = ctx?.getImageData(x, y, 1, 1).data;
    if (data) {
      const hex = "#" + ((1 << 24) + (data[0] << 16) + (data[1] << 8) + data[2]).toString(16).slice(1);
      setPickedColor(hex);
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm mt-3 w-full max-w-sm text-xs">
      <div className="flex items-center gap-2 mb-3 text-sage-800 font-extrabold text-sm border-b border-stone-100 pb-2">
        <Pipette className="w-4 h-4 text-sage-600" />
        <span>Canvas Color Picker</span>
      </div>

      {!file ? (
        <DropZone 
          onFileDrop={handleFileDrop}
          accept="image/*"
          multiple={false}
          title="Upload image"
          colorClass="pink"
          compact={true}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-stone-50 p-2 rounded-lg border border-stone-200">
            <span className="truncate font-bold text-stone-700">{file.name}</span>
            <button onClick={() => { setFile(null); setPreview(''); setPickedColor(''); }} className="text-stone-400 hover:text-red-500">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-stone-200 shadow-inner bg-stone-50">
            <canvas ref={canvasRef} onClick={handleCanvasClick} className="w-full cursor-crosshair" />
          </div>

          {pickedColor && (
            <div className="flex items-center gap-3 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
              <div className="w-8 h-8 rounded-lg shadow-sm border border-stone-300" style={{ backgroundColor: pickedColor }} />
              <div className="flex-1 font-mono">
                <p className="text-[10px] font-bold text-stone-400">PICKED COLOR</p>
                <p className="text-xs font-black text-stone-850 uppercase">{pickedColor}</p>
              </div>
              <button 
                onClick={() => navigator.clipboard.writeText(pickedColor)}
                className="px-2.5 py-1.5 bg-stone-100 border border-stone-200 hover:bg-stone-200 rounded-lg font-bold"
              >
                Copy
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 15. Text-to-PDF Generator Widget
const GeneratePdfFromTextWidget = ({ args }) => {
  const [text, setText] = useState(args?.text || '');
  const [title, setTitle] = useState(args?.title || 'Document');
  const [outputName, setOutputName] = useState(args?.outputName || 'Document.pdf');
  const [fontSize, setFontSize] = useState(11);
  const [margins, setMargins] = useState(15); // mm margins
  const [generating, setGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');

  const generatePdf = async () => {
    setGenerating(true);
    setDownloadUrl('');
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const printableWidth = pageWidth - (margins * 2);

      // Split text into lines that wrap nicely within margins
      doc.setFont('Courier', 'normal');
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, printableWidth);

      let cursorY = margins + 10; // Start below the header
      const lineHeight = fontSize * 0.45; // Rough font-size ratio to mm height

      lines.forEach(line => {
        // If line cursor exceeds printable area, add new page
        if (cursorY > pageHeight - margins - 5) {
          doc.addPage();
          cursorY = margins + 10;
        }
        doc.text(line, margins, cursorY);
        cursorY += lineHeight + 1.5; // Line height spacing
      });

      // Pass 2: Header and Footer Indexing
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);

        // Header (Running title & Divider)
        if (title) {
          doc.setFont('Courier', 'bold');
          doc.text(title.toUpperCase(), margins, margins);
          doc.setDrawColor(230, 230, 230);
          doc.line(margins, margins + 2, pageWidth - margins, margins + 2);
        }

        // Footer Page Indexing (Page X of Y)
        doc.setFont('Courier', 'normal');
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margins - 25, pageHeight - margins + 5);
      }

      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setDownloadUrl(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (args?.text) {
      generatePdf();
    }
  }, [args?.text]);

  const handleDownload = () => {
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = outputName.endsWith('.pdf') ? outputName : `${outputName}.pdf`;
      link.click();
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm mt-3 w-full max-w-md text-xs">
      <div className="flex items-center gap-2 mb-3 text-sage-800 font-extrabold text-sm border-b border-stone-100 pb-2">
        <FileText className="w-4 h-4 text-sage-600" />
        <span>Text to PDF Generator</span>
      </div>

      <div className="space-y-4">
        {/* Editable Preview text */}
        <div>
          <label className="block text-[9px] font-bold text-stone-400 uppercase mb-1">Text Content</label>
          <textarea 
            value={text}
            onChange={(e) => { setText(e.target.value); setDownloadUrl(''); }}
            rows={5}
            className="w-full p-2.5 bg-stone-50 border border-stone-255 rounded-xl font-mono text-[10px] focus:outline-none focus:ring-1 focus:ring-sage-500 max-h-[160px] services-scrollbar"
            placeholder="Pasted data table or document text..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs bg-stone-50/50 p-3 rounded-xl border border-stone-150">
          <div>
            <label className="block text-[9px] font-bold text-stone-400 uppercase">Document Title</label>
            <input 
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setDownloadUrl(''); }}
              className="w-full px-2 py-1 mt-1 border border-stone-200 rounded bg-white"
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-stone-400 uppercase">Output Name</label>
            <input 
              type="text"
              value={outputName}
              onChange={(e) => setOutputName(e.target.value)}
              className="w-full px-2 py-1 mt-1 border border-stone-200 rounded bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs bg-stone-50/50 p-3 rounded-xl border border-stone-150">
          <div>
            <label className="block text-[9px] font-bold text-stone-400 uppercase">Font Size</label>
            <select 
              value={fontSize}
              onChange={(e) => { setFontSize(parseInt(e.target.value)); setDownloadUrl(''); }}
              className="w-full bg-white border border-stone-200 rounded p-1 mt-1 text-xs font-bold"
            >
              <option value="9">Small (9pt)</option>
              <option value="11">Normal (11pt)</option>
              <option value="13">Large (13pt)</option>
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-bold text-stone-400 uppercase">Margins (mm)</label>
            <select 
              value={margins}
              onChange={(e) => { setMargins(parseInt(e.target.value)); setDownloadUrl(''); }}
              className="w-full bg-white border border-stone-200 rounded p-1 mt-1 text-xs font-bold"
            >
              <option value="10">Narrow (10mm)</option>
              <option value="15">Normal (15mm)</option>
              <option value="20">Wide (20mm)</option>
            </select>
          </div>
        </div>

        {!downloadUrl ? (
          <button
            onClick={generatePdf}
            disabled={generating || !text.trim()}
            className="w-full py-2 bg-sage-950 text-white font-bold rounded-xl text-xs hover:bg-sage-800 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {generating ? 'Generating PDF...' : 'Compile to PDF'}
          </button>
        ) : (
          <button
            onClick={handleDownload}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-md"
          >
            <Download className="w-4 h-4" /> Download PDF Document
          </button>
        )}
      </div>
    </div>
  );
};

// --- Main AI Chat Component ---
const AiChat = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'model',
      content: 'Hello! I am your Utility box AI Assistant. I can help answer questions or execute tools for you such as PDF Page Extraction, QR Code Generation (with custom logos!), Image Compression, PDF Merging, Text-to-Speech audio, or any other platform utility. How can I help you today?',
      type: 'text'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const threadEndRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const list = Array.from(e.dataTransfer.files);
      const validFiles = list.filter(f => f.type.startsWith('image/') || f.type === 'application/pdf');
      if (validFiles.length > 0) {
        const newFiles = validFiles.map(f => ({
          id: Math.random().toString(36).substr(2, 9),
          file: f,
          name: f.name,
          size: f.size,
          type: f.type,
          previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : null
        }));
        setAttachedFiles(prev => [...prev, ...newFiles]);
      }
    }
  };

  // Scroll to bottom of message logs when a new one is added
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleAttachmentBtnClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const list = Array.from(e.target.files);
      const newFiles = list.map(f => ({
        id: Math.random().toString(36).substr(2, 9),
        file: f,
        name: f.name,
        size: f.size,
        type: f.type,
        previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : null
      }));
      setAttachedFiles(prev => [...prev, ...newFiles]);
      e.target.value = null; // Reset file input
    }
  };

  const removeAttachedFile = (id) => {
    setAttachedFiles(prev => {
      const target = prev.find(f => f.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && attachedFiles.length === 0) return;
    if (isLoading) return;

    const userText = inputText;
    const sentFiles = [...attachedFiles];

    // Reset inputs
    setInputText('');
    setAttachedFiles([]);
    setIsLoading(true);

    // Add User Message to UI
    const userMsgId = Math.random().toString(36).substr(2, 9);
    const userMessageObj = {
      id: userMsgId,
      role: 'user',
      content: userText,
      files: sentFiles,
      type: 'text'
    };
    setMessages(prev => [...prev, userMessageObj]);

    // Format query prompt context with attachment tags
    let formattedText = '';
    if (sentFiles.length > 0) {
      const fileLabels = sentFiles.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`).join(', ');
      formattedText += `[User attached files: ${fileLabels}]\n\n`;
    }
    formattedText += userText;

    // Construct Gemini History Payload
    const historyPayload = messages.map(m => {
      let textContent = '';
      if (m.role === 'user' && m.files && m.files.length > 0) {
        const fileLabels = m.files.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`).join(', ');
        textContent += `[User attached files: ${fileLabels}]\n\n`;
      }
      textContent += m.content;
      return {
        role: m.role,
        parts: [{ text: textContent }]
      };
    });

    // Convert current turn attached images to base64 inlineData parts for multimodal support
    const imageFiles = sentFiles.filter(f => f.file.type.startsWith('image/'));
    const imageParts = [];
    for (const img of imageFiles) {
      try {
        const b64 = await fileToBase64(img.file);
        imageParts.push({
          inlineData: {
            mimeType: img.file.type,
            data: b64
          }
        });
      } catch (err) {
        console.error("Failed to convert attached image to base64:", err);
      }
    }

    // Add current user prompt with multimodal parts
    historyPayload.push({
      role: 'user',
      parts: [
        { text: formattedText },
        ...imageParts
      ]
    });

    // Query Netlify backend agent endpoint
    try {
      const response = await fetch('/.netlify/functions/chat-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historyPayload })
      });

      if (!response.ok) {
        throw new Error(`Agent API request failed: ${response.status}`);
      }

      const data = await response.json();
      const candidate = data?.candidates?.[0];
      const parts = candidate?.content?.parts || [];

      // Check if response contains a tool call request
      const functionCallPart = parts.find(p => p.functionCall);
      const textPart = parts.find(p => p.text);
      const textResponse = textPart?.text || '';

      const modelMsgId = Math.random().toString(36).substr(2, 9);

      if (functionCallPart) {
        const { name, args } = functionCallPart.functionCall;
        
        // Append model response with tool details
        setMessages(prev => [...prev, {
          id: modelMsgId,
          role: 'model',
          content: textResponse || `Opening the ${name.replace(/_/g, ' ')} tool...`,
          type: 'tool-call',
          toolCall: { name, args },
          parentUserFiles: sentFiles // Link uploaded files to this tool call
        }]);
      } else {
        // Conversational Response
        setMessages(prev => [...prev, {
          id: modelMsgId,
          role: 'model',
          content: textResponse || "I didn't quite get that. Could you describe your goal differently?",
          type: 'text'
        }]);
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'model',
        content: 'Sorry, Utility box AI encountered an error communicating with the agent server. Please verify your connection and try again.',
        type: 'text',
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderToolWidget = (msg) => {
    const { name, args } = msg.toolCall;
    switch (name) {
      // PDF & Documents
      case 'convert_document_to_pdf':
        return <DocumentToPdfWidget initialFiles={msg.parentUserFiles} />;
      case 'merge_pdf':
        return <MergePdfWidget args={args} initialFiles={msg.parentUserFiles} />;
      case 'extract_pdf_pages':
        return <ExtractPdfPagesWidget args={args} initialFiles={msg.parentUserFiles} />;
      case 'generate_pdf_from_text':
        return <GeneratePdfFromTextWidget args={args} />;
      case 'pdf_to_images':
        return <p className="text-[10px] text-stone-500 italic">Open the page tool or upload your PDF below to render pages to images.</p>;

      // QR Code
      case 'generate_qr_code':
        return <QrCodeWidget url={args?.url} />;

      // Compression & Conversion
      case 'compress_image':
        return <CompressImageWidget args={args} initialFiles={msg.parentUserFiles} />;
      case 'image_convert':
        return <ImageConvertWidget initialFiles={msg.parentUserFiles} />;
      case 'image_to_pdf':
        return <ImageToPdfWidget />;

      // Text-to-Speech
      case 'text_to_speech':
        return <TextToSpeechWidget args={args} />;

      // WhatsApp Generator
      case 'whatsapp_generate':
        return <WhatsAppWidget args={args} />;

      // Base64, URL & Hashes
      case 'base64_convert':
        return (
          <CodecWidget 
            title="Base64 Codec" 
            icon={Binary} 
            defaultText={args?.text} 
            mode={args?.mode} 
            onProcess={(text, mode) => {
              if (mode === 'encode') return window.btoa(text);
              return window.atob(text);
            }} 
          />
        );
      case 'url_encode_decode':
        return (
          <CodecWidget 
            title="URL Codec" 
            icon={Link2} 
            defaultText={args?.text} 
            mode={args?.mode} 
            onProcess={(text, mode) => {
              if (mode === 'encode') return encodeURIComponent(text);
              return decodeURIComponent(text);
            }} 
          />
        );
      case 'hash_generate':
        return <HashWidget args={args} />;
      case 'csv_json_convert':
        return <CsvJsonWidget args={args} />;

      // Specialized Utilities
      case 'dns_lookup':
        return <DnsLookupWidget args={args} />;
      case 'remove_background':
        return <RemoveBgWidget initialFiles={msg.parentUserFiles} />;
      case 'ai_purge_metadata':
        return <AiPurgeWidget initialFiles={msg.parentUserFiles} />;
      case 'database_convert':
        return <DatabaseConvertWidget args={args} />;
      case 'framesnap':
        return <FrameSnapWidget />;
      case 'color_picker':
        return <ColorPickerWidget />;

      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-stone-50/20">
      {/* Service Header Row */}
      <div className="compact-service-header pb-3 border-b border-stone-200/50 mb-3 flex-shrink-0">
        <div className="header-icon bg-gradient-to-br from-sage-100 to-sage-200 text-sage-700 border border-sage-300/40">
          <Sparkles size={20} className="animate-pulse" />
        </div>
        <div className="min-w-0">
          <h1 className="text-stone-900 font-black tracking-tight leading-none text-xl sm:text-2xl">Utility box AI</h1>
          <p className="text-xs text-stone-500 font-semibold leading-tight mt-1">Prompt the AI to do tasks, generate assets, or execute core tools inline.</p>
        </div>
      </div>

      {/* Main Chat Layout container */}
      <div 
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="flex-1 min-h-0 bg-white border border-stone-200 rounded-[2rem] flex flex-col shadow-sm relative overflow-hidden"
      >
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-sage-900/50 backdrop-blur-md border-4 border-dashed border-sage-500 rounded-[2rem] z-50 flex flex-col items-center justify-center text-white pointer-events-none"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mb-4 shadow-xl backdrop-blur-lg"
              >
                <FileUp size={32} className="text-white" />
              </motion.div>
              <h3 className="text-xl font-black tracking-tight">Drop files to attach</h3>
              <p className="text-sm font-semibold text-sage-200 mt-1.5">Attach images and PDF documents instantly</p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Messages Log Panel */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 services-scrollbar bg-stone-50/20">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div 
                key={msg.id} 
                className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div className={`max-w-[85%] sm:max-w-[75%] rounded-[1.5rem] p-4 flex flex-col ${
                  isUser 
                    ? 'bg-sage-900 text-white rounded-tr-none shadow-md shadow-sage-900/10' 
                    : msg.isError 
                      ? 'bg-red-50 text-red-800 border border-red-200 rounded-tl-none font-medium'
                      : 'bg-white text-stone-850 border border-stone-200 shadow-sm rounded-tl-none'
                }`}>
                  {/* File Attachment previews in User bubble */}
                  {isUser && msg.files && msg.files.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {msg.files.map(f => (
                        <div key={f.id} className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/15 px-2 py-1 rounded-lg text-[10px] font-bold">
                          {f.type.startsWith('image/') ? (
                            <ImageIcon className="w-3.5 h-3.5 text-sage-200 flex-shrink-0" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-red-200 flex-shrink-0" />
                          )}
                          <span className="truncate max-w-[120px] text-white/95">{f.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Message body text */}
                  <p className="text-sm font-semibold leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                  {/* Inline Tool Widget if model called a tool */}
                  {msg.type === 'tool-call' && msg.toolCall && (
                    <div className="w-full mt-2">
                      {renderToolWidget(msg)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* AI Loader bubble */}
          {isLoading && (
            <div className="flex w-full justify-start animate-pulse">
              <div className="bg-white text-stone-500 border border-stone-200 shadow-sm rounded-[1.5rem] rounded-tl-none p-4 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-sage-600" />
                <span className="text-xs font-bold tracking-tight">Utility box AI is thinking and preparing tools...</span>
              </div>
            </div>
          )}
          <div ref={threadEndRef} />
        </div>

        {/* Input Control Console */}
        <div className="border-t border-stone-200/80 p-3 sm:p-4 bg-white flex-shrink-0">
          <form onSubmit={handleSend} className="space-y-3">
            {/* Attachment preview tray */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 bg-stone-50 border border-stone-200/50 rounded-2xl animate-in fade-in slide-in-from-bottom-1 duration-200">
                {attachedFiles.map(f => (
                  <div key={f.id} className="relative group flex items-center gap-2 bg-white border border-stone-200 pl-2 pr-7 py-1.5 rounded-xl text-xs font-bold shadow-sm">
                    {f.previewUrl ? (
                      <img src={f.previewUrl} alt={f.name} className="w-5 h-5 rounded object-cover flex-shrink-0" />
                    ) : f.type === 'application/pdf' ? (
                      <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-stone-400 flex-shrink-0" />
                    )}
                    <span className="truncate max-w-[150px] text-stone-700 font-bold">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachedFile(f.id)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-stone-100 hover:bg-red-50 text-stone-400 hover:text-red-500 flex items-center justify-center border border-transparent hover:border-red-100 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input fields row */}
            <div className="flex items-center gap-2 relative bg-stone-50 border border-stone-200 rounded-2xl group focus-within:border-sage-500 focus-within:ring-4 focus-within:ring-sage-200 transition-all p-1">
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,.pdf"
                className="hidden"
              />
              <button
                type="button"
                onClick={handleAttachmentBtnClick}
                disabled={isLoading}
                className="p-3 text-stone-500 hover:text-sage-750 hover:bg-stone-100 rounded-xl transition-colors disabled:opacity-50"
                title="Attach Images or PDFs"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isLoading}
                placeholder="Ask AI anything, or request image compression, QR generation, speech synthesis..."
                className="flex-1 bg-transparent py-2.5 px-1 text-sm font-semibold focus:outline-none placeholder-stone-400 text-stone-800 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={isLoading || (!inputText.trim() && attachedFiles.length === 0)}
                className="p-3 bg-sage-900 text-white rounded-xl hover:bg-sage-800 disabled:opacity-40 transition-all shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Inherited / Reused Widgets from first layout to avoid multiple imports (Merge and Compress) ---

const MergePdfWidget = ({ args, initialFiles }) => {
  const [files, setFiles] = useState([]);
  const [outputName, setOutputName] = useState(args?.outputName || 'Merged_Document.pdf');
  const [isMerging, setIsMerging] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [mergedUrl, setMergedUrl] = useState(null);

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      const pdfs = initialFiles.filter(f => f.file.type === 'application/pdf');
      if (pdfs.length > 0) {
        setFiles(pdfs.map(f => ({
          id: Math.random().toString(36).substr(2, 9),
          file: f.file,
          name: f.file.name
        })));
      }
    }
  }, [initialFiles]);

  const handleFileDrop = (incoming) => {
    const fileList = incoming instanceof FileList ? Array.from(incoming) : (Array.isArray(incoming) ? incoming : [incoming]);
    const pdfs = fileList.filter(file => file.type === 'application/pdf');

    if (pdfs.length > 0) {
      setFiles(prev => [...prev, ...pdfs.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        name: file.name
      }))]);
      setErrorMsg('');
      setSuccessMsg('');
    } else {
      setErrorMsg('Only PDF documents are allowed.');
    }
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setSuccessMsg('');
    setMergedUrl(null);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setErrorMsg('Add at least 2 PDFs to merge.');
      return;
    }
    setIsMerging(true);
    setErrorMsg('');
    setSuccessMsg('');
    setMergedUrl(null);

    try {
      const mergedPdf = await PDFDocument.create();
      for (const item of files) {
        const arrayBuffer = await item.file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setMergedUrl(url);
      setSuccessMsg('Successfully merged documents!');
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to merge PDFs.');
    } finally {
      setIsMerging(false);
    }
  };

  const triggerDownload = () => {
    if (mergedUrl) {
      const link = document.createElement('a');
      link.href = mergedUrl;
      link.download = outputName.endsWith('.pdf') ? outputName : `${outputName}.pdf`;
      link.click();
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm mt-3 w-full max-w-md">
      <div className="flex items-center gap-2 mb-3 text-sage-800 font-extrabold text-sm border-b border-stone-100 pb-2">
        <Layers className="w-4 h-4 text-sage-600" />
        <span>PDF Merger Drag-&-Drop Canvas</span>
      </div>

      <div className="space-y-4">
        {files.length === 0 ? (
          <DropZone
            onFileDrop={handleFileDrop}
            accept=".pdf"
            multiple={true}
            title="Upload PDF files"
            subtitle="or drag and drop multiple"
            colorClass="teal"
            compact={true}
          />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 justify-between flex-shrink-0">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Drag to reorder PDF merging sequence</span>
              <button onClick={() => setFiles([])} className="text-[10px] font-bold text-red-500 hover:underline">Clear all</button>
            </div>
            
            <div className="max-h-[160px] overflow-y-auto pr-1 services-scrollbar space-y-2">
              <Reorder.Group axis="y" values={files} onReorder={setFiles} className="space-y-1.5">
                {files.map((file, idx) => (
                  <Reorder.Item
                    key={file.id}
                    value={file}
                    className="flex items-center justify-between gap-2 p-2 bg-stone-50 rounded-xl border border-stone-150 text-xs font-medium cursor-grab active:cursor-grabbing hover:border-sage-200 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <GripVertical className="w-3.5 h-3.5 text-stone-400 cursor-grab" />
                      <span className="bg-stone-200 text-stone-700 font-bold px-1.5 py-0.5 rounded-[5px] text-[10px]">{idx + 1}</span>
                      <FileText className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span className="text-stone-700 truncate max-w-[200px]">{file.name}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); removeFile(file.id); }} className="text-stone-400 hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wide">Output Filename</label>
              <input
                type="text"
                value={outputName}
                onChange={(e) => setOutputName(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs focus:ring-2 focus:ring-sage-200 focus:outline-none"
              />
            </div>

            <button
              onClick={handleMerge}
              disabled={isMerging || files.length < 2}
              className="w-full py-2 bg-sage-950 text-white font-bold rounded-xl text-xs hover:bg-sage-800 disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {isMerging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
              {isMerging ? 'Merging PDF Files...' : `Merge ${files.length} PDF Documents`}
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-2.5 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-2 text-xs font-semibold">
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-2.5 bg-sage-50 border border-sage-100 text-sage-800 rounded-xl flex items-center gap-2 text-xs font-semibold">
            <CheckCircle size={15} className="text-sage-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {mergedUrl && (
          <button onClick={triggerDownload} className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2">
            <Download className="w-4 h-4" /> Download Merged PDF
          </button>
        )}
      </div>
    </div>
  );
};

const CompressImageWidget = ({ args, initialFiles }) => {
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [compressedFile, setCompressedFile] = useState(null);
  const [compressedPreview, setCompressedPreview] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [options, setOptions] = useState({
    maxSizeMB: args?.maxSizeMB || 1,
    maxWidthOrHeight: args?.maxWidthOrHeight || 1920,
    useWebWorker: true
  });

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      const img = initialFiles.find(f => f.file.type.startsWith('image/'));
      if (img) {
        setImageFile(img.file);
        setPreview(URL.createObjectURL(img.file));
      }
    }
  }, [initialFiles]);

  const handleFileDrop = (incoming) => {
    const file = incoming instanceof FileList ? incoming[0] : incoming;
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
      setCompressedFile(null);
      setCompressedPreview(null);
    }
  };

  const handleCompress = async () => {
    if (!imageFile) return;
    setIsCompressing(true);
    try {
      const compressed = await imageCompression(imageFile, options);
      setCompressedFile(compressed);
      setCompressedPreview(URL.createObjectURL(compressed));
    } catch (err) {
      console.error(err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDownload = () => {
    if (compressedFile) {
      const link = document.createElement('a');
      link.href = compressedPreview;
      link.download = `compressed_${imageFile.name}`;
      link.click();
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm mt-3 w-full max-w-md">
      <div className="flex items-center gap-2 mb-3 text-sage-800 font-extrabold text-sm border-b border-stone-100 pb-2">
        <FileArchive className="w-4 h-4 text-sage-600" />
        <span>Image Compressor</span>
      </div>

      {!imageFile ? (
        <DropZone
          onFileDrop={handleFileDrop}
          accept="image/*"
          multiple={false}
          title="Drag image here"
          colorClass="emerald"
          compact={true}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
            <div className="flex items-center gap-2 min-w-0">
              <ImageIcon className="w-5 h-5 text-emerald-500" />
              <span className="text-xs font-bold text-stone-700 truncate">{imageFile.name}</span>
            </div>
            <button onClick={() => { setImageFile(null); setPreview(null); setCompressedFile(null); setCompressedPreview(null); }} className="text-stone-450">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 bg-stone-50/50 p-3 rounded-xl border border-stone-200/50">
            <div className="flex justify-between text-xs font-bold text-stone-750">
              <span>Max Target Size</span>
              <span className="text-sage-600">{options.maxSizeMB} MB</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={options.maxSizeMB}
              onChange={(e) => setOptions({ ...options, maxSizeMB: parseFloat(e.target.value) })}
              className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-sage-600"
            />
          </div>

          <button onClick={handleCompress} disabled={isCompressing} className="w-full py-2 bg-sage-950 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2">
            {isCompressing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightToLine className="w-4 h-4" />}
            {isCompressing ? 'Compressing...' : 'Compress Image'}
          </button>

          {compressedFile && (
            <div className="border-t border-stone-100 pt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-stone-50 p-2 rounded-xl">
                  <p className="text-[10px] text-stone-400 font-bold">Original</p>
                  <p className="font-mono font-bold">{(imageFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <div className="bg-sage-50/50 border border-sage-100 p-2 rounded-xl">
                  <p className="text-[10px] text-sage-500 font-bold">Compressed</p>
                  <p className="font-mono font-bold">{(compressedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button onClick={handleDownload} className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl">
                Download Compressed Image
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const TextToSpeechWidget = ({ args }) => {
  const [audioUrl, setAudioUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [voiceUsed, setVoiceUsed] = useState(args?.voice || 'Zephyr');

  const executeTts = async () => {
    if (!args?.text) {
      setError('No text script provided.');
      return;
    }
    setIsGenerating(true);
    setError('');
    setAudioUrl(null);

    try {
      const response = await fetch('/.netlify/functions/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: args.text, voice: voiceUsed })
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const result = await response.json();
      const part = result?.candidates?.[0]?.content?.parts?.[0];
      const audioData = part?.inlineData?.data;
      const mimeType = part?.inlineData?.mimeType;

      if (audioData && mimeType && mimeType.startsWith("audio/")) {
        const sampleRate = parseInt(mimeType.match(/rate=(\d+)/)[1], 10);
        const pcmData = base64ToArrayBuffer(audioData);
        const pcm16 = new Int16Array(pcmData);
        const wavBlob = pcmToWav(pcm16, sampleRate);
        const url = URL.createObjectURL(wavBlob);
        setAudioUrl(url);
      } else {
        throw new Error("Invalid audio response formatting.");
      }
    } catch (err) {
      console.error(err);
      setError('Failed to convert text to speech.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    executeTts();
  }, [args?.text, voiceUsed]);

  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm mt-3 w-full max-w-sm">
      <div className="flex items-center justify-between mb-3 border-b border-stone-100 pb-2">
        <div className="flex items-center gap-2 text-sage-800 font-extrabold text-sm">
          <Volume2 className="w-4 h-4 text-sage-600" />
          <span>Speech Synthesizer</span>
        </div>
        <select 
          value={voiceUsed} 
          onChange={(e) => setVoiceUsed(e.target.value)}
          className="text-[10px] font-bold text-stone-700 bg-stone-50 border border-stone-200 rounded px-1 py-0.5"
        >
          {['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir', 'Leda', 'Orus'].map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>

      {isGenerating ? (
        <div className="flex items-center justify-center py-6 text-stone-500 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-sage-600" />
          <span className="text-xs">Synthesizing...</span>
        </div>
      ) : error ? (
        <div className="text-red-500 text-xs font-semibold">{error}</div>
      ) : audioUrl ? (
        <div className="space-y-3">
          <audio src={audioUrl} controls className="w-full h-8" />
          <a href={audioUrl} download="audio.wav" className="w-full flex items-center justify-center gap-2 py-2 bg-sage-900 hover:bg-sage-800 text-white rounded-xl text-xs font-bold">
            <Download className="w-3.5 h-3.5" /> Download Audio
          </a>
        </div>
      ) : null}
    </div>
  );
};

// --- Document to PDF Widget ---
const DocumentToPdfWidget = ({ initialFiles }) => {
  const [files, setFiles] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      const docs = initialFiles.filter(f => {
        const name = (f.file?.name || f.name || '').toLowerCase();
        return name.endsWith('.docx') || name.endsWith('.pptx') || name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv') || name.endsWith('.txt') || name.endsWith('.md');
      });
      if (docs.length > 0) {
        setFiles(docs.map(f => ({
          id: Math.random().toString(36).substr(2, 9),
          file: f.file || f,
          name: f.file?.name || f.name
        })));
      }
    }
  }, [initialFiles]);

  const handleFileDrop = (incoming) => {
    const list = incoming instanceof FileList ? Array.from(incoming) : (Array.isArray(incoming) ? incoming : [incoming]);
    const docs = list.filter(f => {
      const name = (f.name || '').toLowerCase();
      return name.endsWith('.docx') || name.endsWith('.pptx') || name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv') || name.endsWith('.txt') || name.endsWith('.md');
    });

    if (docs.length > 0) {
      setFiles(prev => [...prev, ...docs.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        name: file.name
      }))]);
      setErrorMsg('');
    } else {
      setErrorMsg('Please select Word (.docx), PowerPoint (.pptx), Excel (.xlsx, .csv), or Text files.');
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm mt-3 w-full max-w-md">
      <div className="flex items-center justify-between mb-3 text-sage-800 font-extrabold text-sm border-b border-stone-100 pb-2">
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-sage-600" />
          <span>Universal Document to PDF Studio</span>
        </div>
        <Link to="/document-to-pdf" className="text-xs text-sage-600 hover:text-sage-800 underline font-bold">
          Open Full Studio →
        </Link>
      </div>

      <div className="space-y-3">
        {files.length === 0 ? (
          <DropZone
            onFileDrop={handleFileDrop}
            accept=".docx,.pptx,.xlsx,.xls,.csv,.txt,.md"
            multiple={true}
            title="Drop Word, PowerPoint, Excel, or Text"
            subtitle="or click to browse"
          />
        ) : (
          <div className="space-y-2">
            <div className="max-h-36 overflow-y-auto services-scrollbar space-y-1.5">
              {files.map(item => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold">
                  <span className="truncate max-w-[240px] text-stone-700">{item.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles(prev => prev.filter(f => f.id !== item.id))}
                    className="text-stone-400 hover:text-red-500 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <Link
              to="/document-to-pdf"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-sage-900 hover:bg-sage-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Zap className="w-3.5 h-3.5" />
              Open Document Studio with {files.length} Document{files.length !== 1 ? 's' : ''}
            </Link>
          </div>
        )}

        {errorMsg && <p className="text-xs text-red-600 font-semibold">{errorMsg}</p>}
      </div>
    </div>
  );
};

export default AiChat;
