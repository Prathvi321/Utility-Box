import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { Image as ImageIcon, Upload, Download, Loader2, FileArchive, AlertCircle, SlidersHorizontal, ArrowRightToLine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DropZone from '../components/DropZone';

const ImageCompressor = () => {
    const [originalImage, setOriginalImage] = useState(null);
    const [originalPreview, setOriginalPreview] = useState(null);
    const [compressedImage, setCompressedImage] = useState(null);
    const [compressedPreview, setCompressedPreview] = useState(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [options, setOptions] = useState({
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
    });

    const handleImageUpload = (file) => {
        if (!file || !file.type.startsWith('image/')) return;
        setOriginalImage(file);
        setOriginalPreview(URL.createObjectURL(file));
        setCompressedImage(null);
        setCompressedPreview(null);
    };

    const handleCompress = async () => {
        if (!originalImage) return;

        setIsCompressing(true);
        try {
            const compressedFile = await imageCompression(originalImage, options);
            setCompressedImage(compressedFile);
            setCompressedPreview(URL.createObjectURL(compressedFile));
        } catch (error) {
            console.error(error);
        } finally {
            setIsCompressing(false);
        }
    };

    const handleDownload = () => {
        if (!compressedImage) return;
        const link = document.createElement('a');
        link.href = compressedPreview;
        link.download = `compressed_${originalImage.name}`;
        link.click();
    };

    return (
        <div className="w-full h-full flex flex-col lg:flex-row gap-8 lg:gap-12 animate-in fade-in duration-500">
            {/* Left Pane: Controls */}
            <div className="w-full lg:w-[420px] flex-shrink-0 flex flex-col">
                <div className="mb-8">
                    <div className="bg-gradient-to-br from-indigo-100 to-blue-100 w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-white">
                        <FileArchive size={36} className="text-indigo-600" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">Compressor</h1>
                    <p className="text-lg text-gray-600 font-medium">Shrink image files quickly without losing visible quality.</p>
                </div>

                <div className="bg-white/60 backdrop-blur-2xl p-8 rounded-[2rem] shadow-sm border border-white flex-1 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10">
                        <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-6 flex items-center gap-2">
                            <SlidersHorizontal size={14} /> Optimization Settings
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <label className="flex items-center justify-between text-base font-bold text-gray-800 mb-3">
                                    <span>Target Max Size</span>
                                    <span className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg font-mono text-sm">{options.maxSizeMB} MB</span>
                                </label>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="5"
                                    step="0.1"
                                    value={options.maxSizeMB}
                                    onChange={(e) => setOptions({ ...options, maxSizeMB: parseFloat(e.target.value) })}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
                                    <span>Extreme (0.1MB)</span>
                                    <span>Light (5MB)</span>
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center justify-between text-base font-bold text-gray-800 mb-3">
                                    <span>Max Resolution</span>
                                    <span className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg font-mono text-sm">{options.maxWidthOrHeight} px</span>
                                </label>
                                <input
                                    type="range"
                                    min="800"
                                    max="3840"
                                    step="100"
                                    value={options.maxWidthOrHeight}
                                    onChange={(e) => setOptions({ ...options, maxWidthOrHeight: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
                                    <span>Web (800px)</span>
                                    <span>4K (3840px)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 relative z-10 space-y-4">
                        <button
                            onClick={handleCompress}
                            disabled={isCompressing || !originalImage}
                            className={`w-full py-4 px-6 font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 text-lg group ${originalImage && !isCompressing
                                    ? 'bg-gray-900 text-white hover:bg-indigo-600 shadow-xl shadow-gray-200 hover:shadow-indigo-200 scale-100'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed scale-[0.98]'
                                }`}
                        >
                            {isCompressing ? <Loader2 className="animate-spin w-6 h-6" /> : <ArrowRightToLine className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                            {isCompressing ? 'Compressing...' : 'Compress Image'}
                        </button>

                        {originalImage && (
                            <button
                                onClick={() => {
                                    setOriginalImage(null);
                                    setOriginalPreview(null);
                                    setCompressedImage(null);
                                    setCompressedPreview(null);
                                }}
                                className="w-full py-3 text-gray-500 hover:text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-colors"
                            >
                                Start Over
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Pane: Document/Preview */}
            <div className="flex-1 bg-white/40 backdrop-blur-md rounded-[2.5rem] border-2 border-dashed border-gray-200/80 p-6 lg:p-8 flex items-center justify-center relative overflow-hidden group min-h-[500px]">
                <AnimatePresence mode="wait">
                    {!originalImage ? (
                        <motion.div
                            key="dropzone"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className="w-full max-w-lg"
                        >
                            <DropZone
                                onFileDrop={handleImageUpload}
                                accept="image/*"
                                icon={ImageIcon}
                                title="Upload Heavy Image"
                                subtitle="to drastically shrink it"
                                description="PNG, JPG, WebP supported"
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
                            className="w-full h-full flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch pt-4"
                        >
                            {/* Original */}
                            <div className="flex-1 bg-white rounded-[2rem] p-4 shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col relative overflow-hidden">
                                <span className="absolute top-4 left-4 bg-gray-900/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-bold tracking-wide z-10 shadow-sm border border-white/20">Original</span>
                                <div className="flex-1 bg-gray-50/50 rounded-xl overflow-hidden flex items-center justify-center mb-4 min-h-[250px]">
                                    <img src={originalPreview} alt="Original" className="w-full object-contain max-h-[50vh]" />
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-100/80">
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">File Size</p>
                                        <p className="text-lg font-black text-gray-800">{(originalImage.size / 1024 / 1024).toFixed(2)} <span className="text-sm font-medium text-gray-500">MB</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Compressed */}
                            <div className={`flex-1 bg-white rounded-[2rem] p-4 shadow-xl border flex flex-col relative overflow-hidden transition-all duration-500 ${compressedImage ? 'border-indigo-100 shadow-indigo-100/50' : 'border-gray-100 shadow-gray-200/50 opacity-60'}`}>
                                <span className={`absolute top-4 left-4 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-bold tracking-wide z-10 shadow-sm border border-white/20 ${compressedImage ? 'bg-indigo-600/90' : 'bg-gray-400/60'}`}>
                                    {compressedImage ? 'Compressed' : 'Awaiting Compression'}
                                </span>

                                <div className="flex-1 bg-gray-50/50 rounded-xl overflow-hidden flex items-center justify-center mb-4 min-h-[250px] relative">
                                    {compressedImage ? (
                                        <img src={compressedPreview} alt="Compressed" className="w-full object-contain max-h-[50vh]" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-gray-300">
                                            {isCompressing ? <Loader2 className="animate-spin w-12 h-12 mb-4" /> : <FileArchive className="w-16 h-16 mb-4 stroke-[1.5]" />}
                                            <p className="font-medium text-gray-400 text-center px-4">Click "Compress Image" <br /> on the left</p>
                                        </div>
                                    )}
                                </div>

                                <div className={`rounded-xl p-4 flex items-center justify-between border ${compressedImage ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-50 border-gray-100/80'}`}>
                                    <div>
                                        <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${compressedImage ? 'text-indigo-600' : 'text-gray-500'}`}>New File Size</p>
                                        <p className={`text-lg font-black ${compressedImage ? 'text-indigo-900' : 'text-gray-800'}`}>
                                            {compressedImage ? (compressedImage.size / 1024 / 1024).toFixed(2) : '--'}
                                            <span className="text-sm font-medium opacity-60 ml-1">MB</span>
                                        </p>
                                    </div>
                                    {compressedImage && (
                                        <div className="flex flex-col items-end">
                                            <span className="text-green-600 font-bold bg-green-100 px-2.5 py-1 rounded-lg text-xs tracking-wide">
                                                -{((1 - compressedImage.size / originalImage.size) * 100).toFixed(0)}%
                                            </span>
                                            <button
                                                onClick={handleDownload}
                                                className="mt-2 text-indigo-700 bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                                            >
                                                <Download size={14} /> Save
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ImageCompressor;
