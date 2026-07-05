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
  Plus
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import qrcode from 'qrcode-generator';
import imageCompression from 'browser-image-compression';
import { PDFDocument } from 'pdf-lib';
import DropZone from '../components/DropZone';

// --- Helper Functions for Audio Converter ---
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

// --- Custom Tool Widgets ---

// 1. QR Code Widget
const QrCodeWidget = ({ url }) => {
  const [dataUrl, setDataUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!url) {
      setError('No URL provided for QR code.');
      return;
    }
    try {
      const qr = qrcode(0, 'H');
      qr.addData(url);
      qr.make();
      const qrImage = qr.createDataURL(8, 2);
      setDataUrl(qrImage);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to generate QR code.');
    }
  }, [url]);

  const handleDownload = () => {
    if (dataUrl) {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `qrcode_${Date.now()}.png`;
      link.click();
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm mt-3 max-w-sm">
      <div className="flex items-center gap-2 mb-3 text-sage-800 font-extrabold text-sm border-b border-stone-100 pb-2">
        <QrCode className="w-4 h-4 text-sage-600" />
        <span>QR Code Generator</span>
      </div>
      {error ? (
        <div className="text-red-500 text-xs font-semibold flex items-center gap-1">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      ) : dataUrl ? (
        <div className="flex flex-col items-center">
          <img src={dataUrl} alt="Generated QR Code" className="w-40 h-40 border border-stone-100 rounded-xl mb-4 shadow-inner" />
          <p className="text-[11px] text-stone-500 font-medium text-center break-all mb-3 max-w-full px-2">
            URL: <span className="font-mono text-stone-700 bg-stone-50 px-1 py-0.5 rounded">{url}</span>
          </p>
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-sage-900 text-white font-bold rounded-xl text-xs hover:bg-sage-800 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Download QR Code
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="animate-spin w-5 h-5 text-sage-500" />
        </div>
      )}
    </div>
  );
};

// 2. Image Compressor Widget
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

  // Pre-load file if user attached an image to their message
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
          subtitle="or click to browse"
          colorClass="emerald"
          compact={true}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
            <div className="flex items-center gap-2 min-w-0">
              <ImageIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span className="text-xs font-bold text-stone-700 truncate">{imageFile.name}</span>
            </div>
            <button 
              onClick={() => { setImageFile(null); setPreview(null); setCompressedFile(null); setCompressedPreview(null); }}
              className="text-stone-400 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 bg-stone-50/50 p-3 rounded-xl border border-stone-200/50">
            <h4 className="text-[10px] uppercase tracking-widest font-black text-stone-400">Settings</h4>
            <div>
              <div className="flex justify-between text-xs font-bold text-stone-700 mb-1">
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
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCompress}
              disabled={isCompressing}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-sage-950 hover:bg-sage-800 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-colors"
            >
              {isCompressing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightToLine className="w-3.5 h-3.5" />}
              {isCompressing ? 'Compressing...' : 'Compress Image'}
            </button>
          </div>

          {compressedFile && (
            <div className="border-t border-stone-100 pt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-stone-50 p-2 rounded-xl">
                  <p className="text-[10px] text-stone-400 font-bold">Original</p>
                  <p className="font-mono font-bold text-stone-700">{(imageFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <div className="bg-sage-50/50 border border-sage-100 p-2 rounded-xl">
                  <p className="text-[10px] text-sage-500 font-bold">Compressed</p>
                  <p className="font-mono font-bold text-sage-700">{(compressedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <div className="text-center text-[10px] text-emerald-600 font-extrabold uppercase tracking-wide">
                Reduced by {(((imageFile.size - compressedFile.size) / imageFile.size) * 100).toFixed(0)}% !
              </div>
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" /> Download Compressed Image
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 3. Text to Speech Widget
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

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

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

  const handleDownload = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `audio_${Date.now()}.wav`;
      link.click();
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm mt-3 w-full max-w-sm">
      <div className="flex items-center justify-between mb-3 border-b border-stone-100 pb-2">
        <div className="flex items-center gap-2 text-sage-800 font-extrabold text-sm">
          <Volume2 className="w-4 h-4 text-sage-600" />
          <span>Speech Synthesizer</span>
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] font-bold text-stone-500">Voice:</label>
          <select 
            value={voiceUsed} 
            onChange={(e) => setVoiceUsed(e.target.value)}
            className="text-[10px] font-bold text-stone-700 bg-stone-50 border border-stone-200 rounded px-1 py-0.5 focus:outline-none"
          >
            {['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir', 'Leda', 'Orus'].map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {isGenerating ? (
        <div className="flex flex-col items-center justify-center py-6 text-stone-500 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-sage-600" />
          <span className="text-xs font-medium">Synthesizing audio...</span>
        </div>
      ) : error ? (
        <div className="text-red-500 text-xs font-semibold flex flex-col gap-2">
          <div className="flex items-center gap-1">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
          <button 
            onClick={executeTts}
            className="w-full text-center py-1.5 border border-red-200 bg-red-50 text-red-700 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors"
          >
            Retry Generation
          </button>
        </div>
      ) : audioUrl ? (
        <div className="space-y-3">
          <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-150">
            <p className="text-[11px] text-stone-600 font-medium italic mb-2 line-clamp-3">"{args?.text}"</p>
            <audio src={audioUrl} controls className="w-full h-8" />
          </div>
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-sage-905 hover:bg-sage-800 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Download Audio File (.wav)
          </button>
        </div>
      ) : null}
    </div>
  );
};

// 4. PDF Merger Widget
const MergePdfWidget = ({ args, initialFiles }) => {
  const [files, setFiles] = useState([]);
  const [outputName, setOutputName] = useState(args?.outputName || 'Merged_Document.pdf');
  const [isMerging, setIsMerging] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [mergedUrl, setMergedUrl] = useState(null);

  // Pre-load PDFs if attached to the message
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
      setErrorMsg('Failed to merge PDFs. Secured or corrupted files?');
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
              <button 
                onClick={() => setFiles([])}
                className="text-[10px] font-bold text-red-500 hover:underline flex items-center gap-0.5"
              >
                Clear all
              </button>
            </div>
            
            {/* Draggable reordering container using framer-motion */}
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
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                      className="text-stone-400 hover:text-red-500 flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>

            {/* Dragzone to add more PDFs */}
            <div className="border border-dashed border-stone-200 rounded-xl p-1 text-center bg-stone-50/50 hover:bg-stone-50 transition-colors">
              <input 
                type="file" 
                multiple 
                accept=".pdf" 
                onChange={(e) => { if (e.target.files) handleFileDrop(e.target.files); }} 
                id="add-more-pdfs" 
                className="hidden" 
              />
              <label htmlFor="add-more-pdfs" className="text-[10px] font-bold text-sage-700 hover:text-sage-900 cursor-pointer flex items-center justify-center gap-1 py-1.5">
                <Plus className="w-3.5 h-3.5" /> Add more PDF files
              </label>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wide">Output Filename</label>
              <input
                type="text"
                value={outputName}
                onChange={(e) => setOutputName(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs focus:ring-2 focus:ring-sage-200 focus:outline-none"
                placeholder="Merged_Document.pdf"
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

        {mergedUrl && (
          <button
            onClick={triggerDownload}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-md"
          >
            <Download className="w-4 h-4" /> Download Merged PDF
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
      content: 'Hello! I am your UtilityBox AI Assistant. I can help answer questions or execute tools for you such as Compressing Images, Generating QR codes, Merging PDFs, or Synthesizing Text-to-Speech audio. How can I help you today?',
      type: 'text'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef(null);
  const threadEndRef = useRef(null);

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

    // 1. Add User Message to UI
    const userMsgId = Math.random().toString(36).substr(2, 9);
    const userMessageObj = {
      id: userMsgId,
      role: 'user',
      content: userText,
      files: sentFiles,
      type: 'text'
    };
    setMessages(prev => [...prev, userMessageObj]);

    // 2. Format query prompt context with attachment tags
    let formattedText = '';
    if (sentFiles.length > 0) {
      const fileLabels = sentFiles.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`).join(', ');
      formattedText += `[User attached files: ${fileLabels}]\n\n`;
    }
    formattedText += userText;

    // 3. Construct Gemini History Payload
    // Map current local messages (text-only representation for safety in proxy)
    const historyPayload = messages.map(m => {
      // Map attached files info if they were sent
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

    // Add current user prompt
    historyPayload.push({
      role: 'user',
      parts: [{ text: formattedText }]
    });

    // 4. Query Netlify backend agent endpoint
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
          content: textResponse || `I'm opening the ${name.replace('_', ' ')} tool for you...`,
          type: 'tool-call',
          toolCall: { name, args },
          parentUserFiles: sentFiles // Link the files sent by user in this prompt to this tool call
        }]);
      } else {
        // Simple Conversational Response
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
        content: 'Sorry, I encountered an error communicating with the agent server. Please verify your connection and try again.',
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
      case 'generate_qr_code':
        return <QrCodeWidget url={args?.url} />;
      case 'compress_image':
        return <CompressImageWidget args={args} initialFiles={msg.parentUserFiles} />;
      case 'text_to_speech':
        return <TextToSpeechWidget args={args} />;
      case 'merge_pdf':
        return <MergePdfWidget args={args} initialFiles={msg.parentUserFiles} />;
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
          <h1 className="text-stone-900 font-black tracking-tight leading-none text-xl sm:text-2xl">AI Mode Assistant</h1>
          <p className="text-xs text-stone-500 font-semibold leading-tight mt-1">Prompt the AI to do tasks, generate assets, or execute core tools inline.</p>
        </div>
      </div>

      {/* Main Chat Layout container */}
      <div className="flex-1 min-h-0 bg-white border border-stone-200 rounded-[2rem] flex flex-col shadow-sm relative overflow-hidden">
        
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
                <span className="text-xs font-bold tracking-tight">AI is thinking and choosing tools...</span>
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

export default AiChat;
