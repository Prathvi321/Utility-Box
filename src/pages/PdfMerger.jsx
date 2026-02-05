import React, { useState, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import { FileUp, Trash2, GripVertical, FileText, Download, Loader2, AlertCircle } from 'lucide-react';
import { motion, Reorder } from 'framer-motion';

const PdfMerger = () => {
    const [files, setFiles] = useState([]);
    const [isMerging, setIsMerging] = useState(false);
    const [outputName, setOutputName] = useState('merged.pdf');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleFileChange = (e) => {
        const newFiles = Array.from(e.target.files).filter(file => file.type === 'application/pdf');
        if (newFiles.length === 0 && e.target.files.length > 0) {
            setError('Please select valid PDF files.');
        } else {
            setError(null);
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

            setSuccess(`Successfully merged ${files.length} files!`);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Merge error:', err);
            setError('Failed to merge PDFs. Please try again with different files.');
        } finally {
            setIsMerging(false);
        }
    };

    // Drag and drop handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const droppedFiles = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');

        if (droppedFiles.length > 0) {
            setFiles(prev => [...prev, ...droppedFiles.map(file => ({
                id: Math.random().toString(36).substr(2, 9),
                file,
                name: file.name
            }))]);
            setError(null);
        }
    };

    return (
        <div className="w-full">
            <div className="text-center mb-8">
                <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
                    <FileText size={32} />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">PDF Merger</h1>
                <p className="text-gray-600">Drag and drop files to reorder them, then merge and download</p>
            </div>

            <div className="space-y-6">
                {/* Upload Area */}
                <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="relative text-center"
                >
                    <input
                        type="file"
                        multiple
                        accept=".pdf"
                        onChange={handleFileChange}
                        id="file-upload"
                        className="hidden"
                    />
                    <label
                        htmlFor="file-upload"
                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200"
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <FileUp className="w-12 h-12 mb-4 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">Multiple PDF files supported</p>
                        </div>
                    </label>
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div className="p-4 bg-red-100 text-red-700 rounded-xl flex items-center gap-2">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}
                {success && (
                    <div className="p-4 bg-green-100 text-green-700 rounded-xl flex items-center gap-2">
                        <Download size={20} />
                        {success}
                    </div>
                )}

                {/* File List */}
                {files.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-700">Selected Files ({files.length})</h3>
                        <Reorder.Group axis="y" values={files} onReorder={setFiles} className="space-y-2">
                            {files.map((file) => (
                                <Reorder.Item
                                    key={file.id}
                                    value={file}
                                    className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm cursor-grab active:cursor-grabbing"
                                >
                                    <div className="flex items-center gap-4 overflow-hidden">
                                        <GripVertical className="text-gray-400" size={20} />
                                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <FileText className="text-red-600" size={20} />
                                        </div>
                                        <span className="font-medium text-gray-800 truncate">{file.name}</span>
                                    </div>
                                    <button
                                        onClick={() => removeFile(file.id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors p-2"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>

                        {/* Merge Controls */}
                        <div className="pt-6 border-t border-gray-200">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <input
                                    type="text"
                                    value={outputName}
                                    onChange={(e) => setOutputName(e.target.value)}
                                    placeholder="Enter filename..."
                                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors duration-200"
                                />
                                <button
                                    onClick={handleMerge}
                                    disabled={isMerging}
                                    className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[200px]"
                                >
                                    {isMerging ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} /> Merging...
                                        </>
                                    ) : (
                                        <>
                                            <Download size={20} /> Merge & Download
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PdfMerger;
