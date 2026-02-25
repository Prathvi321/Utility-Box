import React, { useState, useRef, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import { QrCode, Download, Plus, Trash2, FileText, Loader2, Link2, Settings2, Sparkles, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QrGenerator = () => {
    const [mode, setMode] = useState('single'); // 'single' or 'multi'
    // Single mode state
    const [singleUrl, setSingleUrl] = useState('');
    const [singleQrValue, setSingleQrValue] = useState('');

    // Multi mode state
    const [multiUrls, setMultiUrls] = useState(['']);
    const [generatedMultiQrs, setGeneratedMultiQrs] = useState([]);

    const singleQrRef = useRef();
    const multiQrRefs = useRef([]);

    // Live update for single mode as user types
    useEffect(() => {
        if (mode === 'single' && singleUrl.trim() !== '') {
            const timeout = setTimeout(() => {
                setSingleQrValue(singleUrl);
            }, 300); // Debounce
            return () => clearTimeout(timeout);
        } else if (mode === 'single') {
            setSingleQrValue('');
        }
    }, [singleUrl, mode]);

    // Single Mode Handlers
    const generateSingle = () => {
        if (!singleUrl.trim()) return;
        setSingleQrValue(singleUrl);
    };

    const downloadSingle = () => {
        if (!singleQrRef.current) return;
        const canvas = singleQrRef.current.querySelector('canvas');
        if (canvas) {
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `qrcode_${Date.now()}.png`;
            link.href = url;
            link.click();
        }
    };

    // Multi Mode Handlers
    const addUrlInput = () => {
        setMultiUrls([...multiUrls, '']);
    };

    const removeUrlInput = (index) => {
        const newUrls = [...multiUrls];
        newUrls.splice(index, 1);
        setMultiUrls(newUrls);
    };

    const updateUrlInput = (index, value) => {
        const newUrls = [...multiUrls];
        newUrls[index] = value;
        setMultiUrls(newUrls);
    };

    const generateMulti = () => {
        const validUrls = multiUrls.filter(url => url.trim() !== '');
        setGeneratedMultiQrs([...validUrls]);
    };

    const downloadAllPdf = () => {
        if (generatedMultiQrs.length === 0) return;

        const doc = new jsPDF('p', 'mm', 'a4');
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        const qrSize = 80;
        const totalVerticalSpace = pageHeight - (2 * qrSize);
        const verticalSpacing = totalVerticalSpace / 3;

        generatedMultiQrs.forEach((url, index) => {
            const qrNumber = index + 1;
            const canvas = multiQrRefs.current[index]?.querySelector('canvas');

            if (canvas) {
                if (qrNumber > 1 && (qrNumber - 1) % 2 === 0) {
                    doc.addPage();
                }

                const isFirstOnPage = (qrNumber - 1) % 2 === 0;
                let y = isFirstOnPage ? verticalSpacing : (2 * verticalSpacing) + qrSize;
                let x = (pageWidth - qrSize) / 2;

                const imageData = canvas.toDataURL('image/png');
                doc.addImage(imageData, 'PNG', x, y, qrSize, qrSize);
            }
        });

        doc.save(`qrcodes_collection_${Date.now()}.pdf`);
    };

    return (
        <div className="w-full h-full flex flex-col lg:flex-row gap-8 lg:gap-12 animate-in fade-in duration-500">
            {/* Left Pane: Configuration */}
            <div className="w-full lg:w-[420px] flex-shrink-0 flex flex-col">
                <div className="mb-8">
                    <div className="bg-gradient-to-br from-fuchsia-100 to-pink-100 w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-white">
                        <QrCode size={36} className="text-fuchsia-600" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">QR <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-pink-600">Generator</span></h1>
                    <p className="text-lg text-gray-600 font-medium">Create beautiful, scannable QR codes instantly from any URL.</p>
                </div>

                <div className="bg-white/60 backdrop-blur-2xl p-8 rounded-[2rem] shadow-sm border border-white flex-1 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-100/50 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10">
                        <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-6 flex items-center gap-2">
                            <Settings2 size={14} /> Generator Settings
                        </h3>

                        <div className="flex bg-gray-100/80 p-1.5 rounded-2xl mb-8">
                            <button
                                onClick={() => { setMode('single'); setGeneratedMultiQrs([]); }}
                                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${mode === 'single' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Single Link
                            </button>
                            <button
                                onClick={() => { setMode('multi'); setSingleQrValue(''); }}
                                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${mode === 'multi' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Multiple Links
                            </button>
                        </div>

                        <AnimatePresence mode="wait">
                            {mode === 'single' && (
                                <motion.div key="single" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                                    <div>
                                        <label className="block text-base font-bold text-gray-800 mb-3">Target URL</label>
                                        <div className="relative group">
                                            <input
                                                type="url"
                                                value={singleUrl}
                                                onChange={(e) => setSingleUrl(e.target.value)}
                                                placeholder="https://example.com"
                                                className="w-full pl-12 pr-5 py-4 bg-white/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 outline-none transition-all duration-300 font-medium text-gray-800"
                                            />
                                            <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-fuchsia-500 transition-colors w-5 h-5" />
                                        </div>
                                    </div>

                                    <div className="bg-fuchsia-50 p-4 rounded-xl border border-fuchsia-100/50 flex items-start gap-3">
                                        <Sparkles className="w-5 h-5 text-fuchsia-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm font-medium text-fuchsia-800">Your QR code updates instantly as you type. Scan it directly from the screen!</p>
                                    </div>
                                </motion.div>
                            )}

                            {mode === 'multi' && (
                                <motion.div key="multi" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 flex flex-col h-full max-h-[400px]">
                                    <div>
                                        <label className="block text-base font-bold text-gray-800 mb-3 flex items-center justify-between">
                                            <span>Target URLs</span>
                                            <span className="text-xs font-bold text-fuchsia-600 bg-fuchsia-50 px-2 py-1 rounded-md">{multiUrls.length}</span>
                                        </label>
                                        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                                            <AnimatePresence>
                                                {multiUrls.map((url, index) => (
                                                    <motion.div key={index} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex gap-2 relative group">
                                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-fuchsia-500 transition-colors pointer-events-none">
                                                            <Link2 size={20} />
                                                        </div>
                                                        <input
                                                            type="url"
                                                            value={url}
                                                            onChange={(e) => updateUrlInput(index, e.target.value)}
                                                            placeholder={`Link #${index + 1}`}
                                                            className="flex-1 pl-12 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 outline-none transition-all duration-300 font-medium text-gray-800 text-sm"
                                                        />
                                                        <button
                                                            onClick={() => removeUrlInput(index)}
                                                            className="w-12 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 flex-shrink-0"
                                                            disabled={multiUrls.length === 1}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    <button
                                        onClick={addUrlInput}
                                        className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 font-bold rounded-xl hover:border-fuchsia-400 hover:text-fuchsia-600 transition-colors flex items-center justify-center gap-2 bg-white/30 hover:bg-white/50 shadow-sm"
                                    >
                                        <Plus size={18} /> Add Another Link
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="mt-8 relative z-10 border-t border-gray-100/50 pt-8">
                        {mode === 'single' ? (
                            <button
                                onClick={generateSingle}
                                disabled={!singleUrl.trim()}
                                className={`w-full py-4 px-6 font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 text-lg group ${singleUrl.trim()
                                        ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-xl shadow-fuchsia-200 hover:shadow-fuchsia-300 scale-100'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed scale-[0.98]'
                                    }`}
                            >
                                <Wand2 className={`w-6 h-6 ${singleUrl.trim() ? 'group-hover:rotate-12 transition-transform' : ''}`} />
                                Generate Output
                            </button>
                        ) : (
                            <button
                                onClick={generateMulti}
                                disabled={!multiUrls.some(url => url.trim() !== '')}
                                className={`w-full py-4 px-6 font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 text-lg group ${multiUrls.some(url => url.trim() !== '')
                                        ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-xl shadow-fuchsia-200 hover:shadow-fuchsia-300 scale-100'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed scale-[0.98]'
                                    }`}
                            >
                                <Wand2 className={`w-6 h-6 ${multiUrls.some(url => url.trim() !== '') ? 'group-hover:rotate-12 transition-transform' : ''}`} />
                                Generate Collection
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Pane: Preview */}
            <div className="flex-1 bg-white/40 backdrop-blur-md rounded-[2.5rem] border-2 border-dashed border-gray-200/80 p-6 lg:p-10 flex flex-col items-center justify-center relative overflow-hidden group min-h-[500px]">
                <AnimatePresence mode="wait">
                    {mode === 'single' && !singleQrValue ? (
                        <motion.div key="empty-single" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="text-center max-w-sm">
                            <div className="bg-fuchsia-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                                <QrCode className="w-12 h-12 text-fuchsia-300" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">Awaiting Link</h3>
                            <p className="text-gray-500 font-medium">Enter a URL in the configuration panel to instantly see your QR code here.</p>
                        </motion.div>
                    ) : mode === 'single' && singleQrValue ? (
                        <motion.div key="preview-single" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-md flex flex-col items-center">
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 relative group/card w-full aspect-square flex items-center justify-center overflow-hidden mb-8">
                                <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-pink-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />

                                <div ref={singleQrRef} className="relative z-10 transition-transform duration-300 group-hover/card:scale-105">
                                    <QRCodeCanvas
                                        value={singleQrValue}
                                        size={280}
                                        level="H"
                                        includeMargin={false}
                                        className="rounded-xl shadow-sm"
                                    />
                                </div>

                                <div className="absolute top-4 right-4 bg-green-100 text-green-700 text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full z-20 shadow-sm border border-green-200">
                                    Quality: High
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 w-full mb-8 flex items-center gap-4">
                                <div className="w-10 h-10 bg-fuchsia-50 rounded-xl flex items-center justify-center text-fuchsia-600 flex-shrink-0">
                                    <Link2 size={20} />
                                </div>
                                <p className="text-sm font-medium text-gray-700 truncate w-full" title={singleQrValue}>{singleQrValue}</p>
                            </div>

                            <button
                                onClick={downloadSingle}
                                className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-3 shadow-xl shadow-gray-900/20 hover:shadow-gray-900/40 hover:-translate-y-1"
                            >
                                <Download size={20} />
                                Download Complete PNG
                            </button>
                        </motion.div>
                    ) : mode === 'multi' && generatedMultiQrs.length === 0 ? (
                        <motion.div key="empty-multi" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="text-center max-w-sm">
                            <div className="bg-fuchsia-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                                <QrCode className="w-12 h-12 text-fuchsia-300" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">Multi-Generation</h3>
                            <p className="text-gray-500 font-medium">Add your list of URLs and click Generate to see your collection.</p>
                        </motion.div>
                    ) : (
                        <motion.div key="preview-multi" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full h-full flex flex-col">
                            <div className="flex items-center justify-between mb-6 px-2 shrink-0">
                                <h3 className="text-2xl font-bold text-gray-900">QR Collection</h3>
                                <div className="bg-fuchsia-100 text-fuchsia-700 px-4 py-1.5 rounded-full text-sm font-black tracking-wide">
                                    {generatedMultiQrs.length} Items
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 pb-4 custom-scrollbar">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {generatedMultiQrs.map((url, index) => (
                                        <div key={index} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-fuchsia-900/5 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center group cursor-default">
                                            <div
                                                ref={el => multiQrRefs.current[index] = el}
                                                className="mb-5 bg-gray-50 p-4 rounded-2xl transition-transform group-hover:scale-105 duration-300"
                                            >
                                                <QRCodeCanvas
                                                    value={url}
                                                    size={120}
                                                    level="M"
                                                    includeMargin={false}
                                                    className="mix-blend-multiply"
                                                />
                                            </div>
                                            <div className="w-full bg-gray-50 rounded-xl p-3 border border-gray-100">
                                                <p className="text-xs font-semibold text-gray-600 truncate w-full" title={url}>{url}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-200/50 shrink-0">
                                <button
                                    onClick={downloadAllPdf}
                                    className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-3 shadow-xl shadow-gray-900/20 hover:shadow-gray-900/40 hover:-translate-y-1"
                                >
                                    <FileText size={20} />
                                    Download Collection as PDF Document
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default QrGenerator;
