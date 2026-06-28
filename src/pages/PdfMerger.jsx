import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { FileUp, Trash2, GripVertical, FileText, Download, Loader2, AlertCircle, Settings, FilePlus2, Layers } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import DropZone from '../components/DropZone';

const PdfMerger = () => {
    const [files, setFiles] = useState([]);
    const [isMerging, setIsMerging] = useState(false);
    const [outputName, setOutputName] = useState('Merged_Document.pdf');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleFileChange = (incomingFiles) => {
        const fileArray = incomingFiles instanceof FileList ? Array.from(incomingFiles) : (Array.isArray(incomingFiles) ? incomingFiles : [incomingFiles]);
        const newFiles = fileArray.filter(file => file.type === 'application/pdf');

        if (newFiles.length === 0 && fileArray.length > 0) {
            setError('Please select valid PDF files.');
            setTimeout(() => setError(null), 3000);
        } else {
            setError(null);
            setSuccess(null);
            setFiles(prev => [...prev, ...newFiles.map(file => ({
                id: Math.random().toString(36).substr(2, 9),
                file,
                name: file.name
            }))]);
        }
    };

    const removeFile = (id) => {
        setFiles(prev => prev.filter(f => f.id !== id));
        setError(null);
        setSuccess(null);
    };

    const handleMerge = async () => {
        if (files.length === 0) return;

        setIsMerging(true);
        setError(null);
        setSuccess(null);

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

            const link = document.createElement('a');
            link.href = url;
            link.download = outputName.endsWith('.pdf') ? outputName : `${outputName}.pdf`;
            link.click();

            setSuccess(`Successfully merged ${files.length} document${files.length !== 1 ? 's' : ''}!`);
            setTimeout(() => setSuccess(null), 4000);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Merge error:', err);
            setError('Failed to merge PDFs. The files might be secured or corrupted.');
            setTimeout(() => setError(null), 4000);
        } finally {
            setIsMerging(false);
        }
    };

    return (
        <div className="h-full flex flex-col animate-in fade-in duration-500">
            {/* Compact header row */}
            <div className="compact-service-header">
                <div className="header-icon bg-sage-100 text-sage-600 border border-sage-200">
                    <Layers size={20} />
                </div>
                <div className="min-w-0">
                    <h1>PDF Merger</h1>
                    <p>Combine multiple PDF documents into a single, organized file effortlessly.</p>
                </div>
            </div>

            {/* Main content grid */}
            <div className="grid lg:grid-cols-[380px_1fr] gap-3 flex-1 min-h-0 overflow-hidden">
                {/* Left Pane: Configuration & Upload */}
                <div className="bg-white/70 rounded-2xl border border-stone-100 p-4 flex flex-col justify-between overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sage-100/50 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex-1 flex flex-col min-h-0">
                        <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-3 flex items-center gap-2 flex-shrink-0">
                            <Settings size={13} /> Merge Configuration
                        </h3>

                        <div className="space-y-4 flex-1 flex flex-col min-h-0">
                            <div className="flex-shrink-0">
                                <label className="block text-xs font-bold text-gray-800 mb-1.5">
                                    Output Filename
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={outputName}
                                        onChange={(e) => setOutputName(e.target.value)}
                                        placeholder="Merged_Document.pdf"
                                        className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-sage-200 focus:border-sage-400 outline-none transition text-stone-800 text-sm bg-stone-50"
                                    />
                                    <FilePlus2 className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                                </div>
                            </div>

                            <div className="pt-3 border-t border-stone-100 flex-1 flex flex-col min-h-0">
                                <label className="block text-xs font-bold text-gray-800 mb-1.5 flex-shrink-0">
                                    Add Documents
                                </label>
                                <div className="flex-1 min-h-0 overflow-y-auto services-scrollbar">
                                    <DropZone
                                        onFileDrop={handleFileChange}
                                        accept=".pdf"
                                        multiple={true}
                                        icon={FileUp}
                                        title="Add PDFs"
                                        subtitle="to your merge list"
                                        colorClass="teal"
                                        compact={true}
                                    />
                                </div>
                            </div>
                        </div>

                        <AnimatePresence>
                            {(error || success) && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="pt-3 flex-shrink-0"
                                >
                                    {error && (
                                        <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-center gap-3 text-xs font-semibold">
                                            <AlertCircle size={16} className="flex-shrink-0" />
                                            {error}
                                        </div>
                                    )}
                                    {success && (
                                        <div className="p-3 bg-sage-50 border border-sage-100 text-sage-700 rounded-2xl flex items-center gap-3 text-xs font-semibold">
                                            <Download size={16} className="flex-shrink-0" />
                                            {success}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="mt-3 relative z-10 border-t border-stone-100 pt-3 flex-shrink-0">
                        <button
                            onClick={handleMerge}
                            disabled={isMerging || files.length < 2}
                            className={`w-full py-2.5 px-4 font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm group ${files.length > 1 && !isMerging
                                    ? 'bg-sage-900 text-white hover:bg-sage-700 shadow-xl shadow-sage-200'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {isMerging ? <Loader2 className="animate-spin w-4 h-4" /> : <Layers className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />}
                            {isMerging ? 'Merging PDFs...' : `Merge ${files.length} Document${files.length !== 1 ? 's' : ''}`}
                        </button>
                        {files.length === 1 && !isMerging && (
                            <p className="text-center text-[10px] text-sage-600 font-bold mt-1.5 uppercase tracking-wider">Add at least one more PDF to merge</p>
                        )}
                    </div>
                </div>

                {/* Right Pane: Document List & Reordering */}
                <div className="flex-1 bg-white/40 backdrop-blur-md rounded-2xl border-2 border-dashed border-stone-200/80 p-4 flex flex-col relative overflow-hidden group min-h-0">
                    <AnimatePresence mode="wait">
                        {files.length === 0 ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto my-auto"
                            >
                                <div className="bg-sage-50 w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-sage-100">
                                    <FileText className="w-8 h-8 text-sage-300" />
                                </div>
                                <h3 className="text-base font-bold text-gray-800 mb-1">No Documents Selected</h3>
                                <p className="text-xs text-gray-500 font-medium">Use the upload zone on the left to add PDF documents you want to merge.</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="list"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full h-full flex flex-col min-h-0"
                            >
                                <div className="flex items-center justify-between mb-4 px-1 flex-shrink-0">
                                    <h3 className="text-base font-bold text-gray-800">Merge Order</h3>
                                    <div className="bg-sage-50 text-sage-600 px-3 py-1 rounded-full text-xs font-bold tracking-wide border border-sage-100/50">
                                        {files.length} Files
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                                    <Reorder.Group axis="y" values={files} onReorder={setFiles} className="space-y-3">
                                        <AnimatePresence>
                                            {files.map((file, index) => (
                                                <Reorder.Item
                                                    key={file.id}
                                                    value={file}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    className="bg-white p-3 rounded-xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex items-center gap-3 group/item hover:border-sage-100 transition-colors cursor-grab active:cursor-grabbing relative overflow-hidden"
                                                >
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-sage-300 to-sage-500 opacity-0 group-hover/item:opacity-100 transition-opacity" />

                                                    <div className="p-1 -ml-1 text-gray-400 group-hover/item:text-sage-500 transition-colors">
                                                        <GripVertical size={16} />
                                                    </div>

                                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                                                        <span className="absolute top-1 left-1 bg-white/80 backdrop-blur-sm text-red-600 text-[9px] px-1 font-black rounded-md z-10">{index + 1}</span>
                                                        <FileText className="text-red-400 w-6 h-6" />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-gray-800 truncate text-sm">{file.name}</h4>
                                                        <p className="text-xs text-gray-500 font-medium">{(file.file.size / 1024 / 1024).toFixed(2)} MB PDF Document</p>
                                                    </div>

                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100 flex-shrink-0"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </Reorder.Item>
                                            ))}
                                        </AnimatePresence>
                                    </Reorder.Group>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default PdfMerger;
