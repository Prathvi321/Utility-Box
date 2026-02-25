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
        <div className="w-full h-full flex flex-col lg:flex-row gap-8 lg:gap-12 animate-in fade-in duration-500">
            {/* Left Pane: Configuration & Upload */}
            <div className="w-full lg:w-[420px] flex-shrink-0 flex flex-col">
                <div className="mb-8">
                    <div className="bg-gradient-to-br from-indigo-100 to-violet-100 w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-white">
                        <Layers size={36} className="text-indigo-600" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">PDF Merger</h1>
                    <p className="text-lg text-gray-600 font-medium">Combine multiple PDF documents into a single, organized file effortlessly.</p>
                </div>

                <div className="bg-white/60 backdrop-blur-2xl p-8 rounded-[2rem] shadow-sm border border-white flex-1 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10">
                        <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-6 flex items-center gap-2">
                            <Settings size={14} /> Merge Configuration
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-base font-bold text-gray-800 mb-3">
                                    Output Filename
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={outputName}
                                        onChange={(e) => setOutputName(e.target.value)}
                                        placeholder="Merged_Document.pdf"
                                        className="w-full px-5 py-4 bg-white/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all duration-300 font-medium text-gray-800"
                                    />
                                    <FilePlus2 className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100/50">
                                <label className="block text-base font-bold text-gray-800 mb-3">
                                    Add Documents
                                </label>
                                <DropZone
                                    onFileDrop={handleFileChange}
                                    accept=".pdf"
                                    multiple={true}
                                    icon={FileUp}
                                    title="Add PDFs"
                                    subtitle="to your merge list"
                                    colorClass="indigo"
                                />
                            </div>
                        </div>

                        <AnimatePresence>
                            {(error || success) && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="pt-6"
                                >
                                    {error && (
                                        <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-center gap-3 text-sm font-semibold">
                                            <AlertCircle size={18} className="flex-shrink-0" />
                                            {error}
                                        </div>
                                    )}
                                    {success && (
                                        <div className="p-4 bg-green-50 border border-green-100 text-green-700 rounded-2xl flex items-center gap-3 text-sm font-semibold">
                                            <Download size={18} className="flex-shrink-0" />
                                            {success}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="mt-8 relative z-10 border-t border-gray-100/50 pt-8">
                        <button
                            onClick={handleMerge}
                            disabled={isMerging || files.length < 2}
                            className={`w-full py-4 px-6 font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 text-lg group ${files.length > 1 && !isMerging
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200 hover:shadow-indigo-300 scale-100'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed scale-[0.98]'
                                }`}
                        >
                            {isMerging ? <Loader2 className="animate-spin w-6 h-6" /> : <Layers className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />}
                            {isMerging ? 'Merging PDFs...' : `Merge ${files.length} Document${files.length !== 1 ? 's' : ''}`}
                        </button>
                        {files.length === 1 && !isMerging && (
                            <p className="text-center text-xs text-indigo-500 font-bold mt-4 uppercase tracking-wider">Add at least one more PDF to merge</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Pane: Document List & Reordering */}
            <div className="flex-1 bg-white/40 backdrop-blur-md rounded-[2.5rem] border-2 border-dashed border-gray-200/80 p-6 lg:p-10 flex flex-col relative overflow-hidden group min-h-[500px]">
                <AnimatePresence mode="wait">
                    {files.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto my-auto"
                        >
                            <div className="bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center mb-6">
                                <FileText className="w-12 h-12 text-indigo-300" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Documents Selected</h3>
                            <p className="text-gray-500 font-medium">Use the upload zone on the left to add PDF documents you want to merge.</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-full flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-6 px-2">
                                <h3 className="text-xl font-bold text-gray-800">Merge Order</h3>
                                <div className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide border border-indigo-100/50">
                                    {files.length} Files
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                <Reorder.Group axis="y" values={files} onReorder={setFiles} className="space-y-4">
                                    <AnimatePresence>
                                        {files.map((file, index) => (
                                            <Reorder.Item
                                                key={file.id}
                                                value={file}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex items-center gap-5 group/item hover:border-indigo-100 transition-colors cursor-grab active:cursor-grabbing relative overflow-hidden"
                                            >
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-300 to-indigo-500 opacity-0 group-hover/item:opacity-100 transition-opacity" />

                                                <div className="p-2 -ml-2 text-gray-400 group-hover/item:text-indigo-500 transition-colors">
                                                    <GripVertical size={20} />
                                                </div>

                                                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                                                    <span className="absolute top-1 left-1 bg-white/80 backdrop-blur-sm text-red-600 text-[10px] px-1.5 font-black rounded-md z-10">{index + 1}</span>
                                                    <FileText className="text-red-400 w-8 h-8" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-gray-800 truncate text-base">{file.name}</h4>
                                                    <p className="text-sm text-gray-500 font-medium">{(file.file.size / 1024 / 1024).toFixed(2)} MB PDF Document</p>
                                                </div>

                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100 flex-shrink-0"
                                                >
                                                    <Trash2 size={18} />
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
    );
};

export default PdfMerger;
