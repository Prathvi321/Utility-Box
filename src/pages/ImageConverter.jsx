import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Upload, Download, Loader2, Repeat, FileImage } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DropZone from '../components/DropZone';

const ImageConverter = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [format, setFormat] = useState('png');
    const [isConverting, setIsConverting] = useState(false);

    // Hidden canvas for conversion
    const canvasRef = useRef(null);

    const handleUpload = (selectedFile) => {
        if (selectedFile && selectedFile.type.startsWith('image/')) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const handleConvert = async () => {
        if (!file || !canvasRef.current) return;
        setIsConverting(true);

        const img = new Image();
        img.src = preview;

        img.onload = () => {
            const canvas = canvasRef.current;
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            // Determine mime type
            let mimeType = 'image/png';
            if (format === 'jpg' || format === 'jpeg') mimeType = 'image/jpeg';
            if (format === 'webp') mimeType = 'image/webp';
            if (format === 'ico') mimeType = 'image/x-icon';

            // Convert
            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.download = `converted_${file.name.split('.')[0]}.${format}`;
                    link.href = url;
                    link.click();
                    URL.revokeObjectURL(url);
                }
                setIsConverting(false);
            }, mimeType);
        };
    };

    return (
        <div className="w-full h-full flex flex-col lg:flex-row gap-8 lg:gap-12 animate-in fade-in duration-500">
            {/* Left Pane: Controls */}
            <div className="w-full lg:w-[420px] flex-shrink-0 flex flex-col">
                <div className="mb-8">
                    <div className="bg-gradient-to-br from-indigo-100 to-purple-100 w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-white">
                        <Repeat size={36} className="text-indigo-600" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">Image Converter</h1>
                    <p className="text-lg text-gray-600 font-medium">Easily shift image formats while keeping quality pristine. Local processing, instantly fast.</p>
                </div>

                <div className="bg-white/60 backdrop-blur-2xl p-8 rounded-[2rem] shadow-sm border border-white flex-1 flex flex-col justify-between relative overflow-hidden">
                    {/* Ambient Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

                    <div className="relative z-10">
                        <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-6">Configuration</h3>

                        <label className="block text-base font-bold text-gray-800 mb-4">
                            Select Output Format
                        </label>
                        <div className="grid grid-cols-2 gap-3 mb-8">
                            {['png', 'jpg', 'webp', 'ico'].map((fmt) => (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    key={fmt}
                                    onClick={() => setFormat(fmt)}
                                    className={`py-4 px-4 rounded-xl border-2 font-bold transition-all duration-300 ${format === fmt
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md shadow-indigo-100/50'
                                            : 'border-gray-100 hover:border-indigo-200 text-gray-400 hover:text-indigo-500 bg-white/50'
                                        }`}
                                >
                                    {fmt.toUpperCase()}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 relative z-10">
                        <button
                            onClick={handleConvert}
                            disabled={isConverting || !file}
                            className={`w-full py-4 px-6 font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 text-lg group ${file && !isConverting
                                    ? 'bg-gray-900 text-white hover:bg-indigo-600 shadow-xl shadow-gray-200 hover:shadow-indigo-200 scale-100'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed scale-[0.98]'
                                }`}
                        >
                            {isConverting ? <Loader2 className="animate-spin w-6 h-6" /> : <Download className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />}
                            {isConverting ? 'Processing...' : 'Convert & Download'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Pane: Document/Preview */}
            <div className="flex-1 bg-white/40 backdrop-blur-md rounded-[2.5rem] border-2 border-dashed border-gray-200/80 p-6 lg:p-10 flex flex-col items-center justify-center relative overflow-hidden group min-h-[500px]">
                <AnimatePresence mode="wait">
                    {!file ? (
                        <motion.div
                            key="dropzone"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className="w-full max-w-lg"
                        >
                            <DropZone
                                onFileDrop={handleUpload}
                                accept="image/*"
                                icon={FileImage}
                                title="Select an image file"
                                subtitle="to convert format"
                                description="Supports PNG, JPG, WEBP, and more"
                                colorClass="indigo"
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="w-full h-full flex flex-col items-center justify-center"
                        >
                            <div className="bg-white p-4 rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-gray-100 relative group/image max-w-full">
                                <div className="absolute inset-0 bg-gray-900/60 rounded-[2rem] opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10 backdrop-blur-sm">
                                    <button
                                        onClick={() => { setFile(null); setPreview(null); }}
                                        className="px-6 py-3 bg-white text-gray-900 font-bold rounded-xl shadow-xl hover:bg-red-50 hover:text-red-600 hover:scale-105 transition-all duration-300"
                                    >
                                        Remove Image
                                    </button>
                                </div>
                                <div className="bg-gray-50/50 rounded-2xl overflow-hidden flex items-center justify-center" style={{ maxHeight: '60vh' }}>
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="max-h-full max-w-full object-contain"
                                    />
                                </div>
                            </div>
                            <div className="mt-8 flex items-center justify-center gap-4 px-6 py-3 bg-white rounded-full shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-gray-100">
                                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                                    <FileImage className="text-indigo-600 w-5 h-5" />
                                </div>
                                <span className="font-bold text-gray-800 truncate max-w-[200px] sm:max-w-xs">{file.name}</span>
                                <span className="text-indigo-600 font-bold text-sm px-4 py-1.5 bg-indigo-50 rounded-lg">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <canvas ref={canvasRef} className="hidden" />
            </div>
        </div>
    );
};

export default ImageConverter;
