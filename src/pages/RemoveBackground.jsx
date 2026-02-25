import React, { useState } from 'react';
import { Eraser, Upload, Download, RefreshCw, AlertCircle, Loader2, Image as ImageIcon, Sparkles, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DropZone from '../components/DropZone';

const RemoveBackground = () => {
    const [file, setFile] = useState(null);
    const [originalPreview, setOriginalPreview] = useState(null);
    const [resultImage, setResultImage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('');

    const handleUpload = (selectedFile) => {
        if (selectedFile && selectedFile.type.startsWith('image/')) {
            setFile(selectedFile);
            setOriginalPreview(URL.createObjectURL(selectedFile));
            setResultImage(null);
            setError(null);

            // Check file size warning
            if (selectedFile.size > 12 * 1024 * 1024) {
                setError("Warning: File is large (>12MB). It will be compressed before processing.");
            }
        }
    };

    const compressImage = async (file, targetMB = 8) => {
        const targetBytes = targetMB * 1024 * 1024;
        if (file.size <= targetBytes) return file;

        // Simple compression using canvas
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Scale down if massive
                if (width > 4000 || height > 4000) {
                    const ratio = Math.min(4000 / width, 4000 / height);
                    width *= ratio;
                    height *= ratio;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', 0.8);
            };
            img.src = URL.createObjectURL(file);
        });
    };

    const toBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    const handleRemoveBackground = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError(null);
        setStatus('Analyzing image...');

        try {
            // Compress if needed (API has limits)
            setStatus('Preparing image...');
            const processedFile = await compressImage(file);

            const base64Data = await toBase64(processedFile);
            const base64Content = base64Data.split(',')[1];

            setStatus('Removing background...');
            const response = await fetch('/.netlify/functions/remove-bg', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image_file_b64: base64Content })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to process image');
            }

            const data = await response.json();
            setResultImage(`data:image/png;base64,${data.image_b64}`);
            setStatus('');
        } catch (err) {
            console.error(err);
            setError(err.message || 'An error occurred. Please check if the API Key is configured in Netlify.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setOriginalPreview(null);
        setResultImage(null);
        setError(null);
        setStatus('');
    };

    return (
        <div className="w-full h-full flex flex-col lg:flex-row gap-8 lg:gap-12 animate-in fade-in duration-500">
            {/* Left Pane: Configuration & Upload */}
            <div className="w-full lg:w-[460px] flex-shrink-0 flex flex-col">
                <div className="mb-8">
                    <div className="bg-gradient-to-br from-orange-100 to-red-100 w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-white">
                        <Eraser size={36} className="text-orange-600" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">Background <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">Eraser</span></h1>
                    <p className="text-lg text-gray-600 font-medium">Instantly remove backgrounds from any image using powerful AI.</p>
                </div>

                <div className="bg-white/60 backdrop-blur-2xl p-8 rounded-[2rem] shadow-sm border border-white flex-1 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100/50 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex-1 flex flex-col">
                        <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-6 flex items-center gap-2">
                            <Sparkles size={14} /> AI Processing
                        </h3>

                        <AnimatePresence mode="wait">
                            {!file ? (
                                <motion.div key="upload" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex-1 flex flex-col justify-center">
                                    <DropZone
                                        onFileDrop={handleUpload}
                                        accept="image/*"
                                        icon={Upload}
                                        title="Select Image"
                                        subtitle="JPG, PNG, WebP"
                                        colorClass="orange"
                                    />
                                    <p className="text-xs text-center text-gray-500 font-medium mt-4">For best results, upload images with a clear subject.</p>
                                </motion.div>
                            ) : (
                                <motion.div key="original" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex-1 flex flex-col">
                                    <div className="relative flex-1 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden flex flex-col items-center justify-center p-2 min-h-[240px]">
                                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-600 shadow-sm border border-gray-100 z-10">
                                            Original
                                        </div>
                                        <img src={originalPreview} alt="Original" className="w-full h-full object-contain rounded-xl" />
                                    </div>

                                    <div className="mt-6 space-y-3">
                                        <div className="flex items-center gap-3 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                                            <ImageIcon size={20} className="text-orange-500 min-w-5 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate">{file.name}</p>
                                                <p className="text-xs font-medium text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                            <button
                                                onClick={handleReset}
                                                disabled={isProcessing}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-gray-400 hover:text-red-500 shadow-sm border border-gray-100 transition-colors shrink-0"
                                                title="Change Image"
                                            >
                                                <RefreshCw size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {error && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-4 p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-start gap-3 text-sm font-semibold">
                                    <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="mt-8 relative z-10 border-t border-gray-100/50 pt-8 shrink-0">
                        <button
                            onClick={handleRemoveBackground}
                            disabled={!file || isProcessing || resultImage}
                            className={`w-full py-4 px-6 font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 text-lg group ${file && !isProcessing && !resultImage
                                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-xl shadow-orange-200 hover:shadow-orange-300 scale-100'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed scale-[0.98]'
                                }`}
                        >
                            {isProcessing ? <Loader2 className="animate-spin w-6 h-6" /> : <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                            {isProcessing ? status : resultImage ? 'Processing Complete' : 'Remove Background'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Pane: Result */}
            <div className="flex-1 bg-white/40 backdrop-blur-md rounded-[2.5rem] border-2 border-dashed border-gray-200/80 p-6 lg:p-10 flex flex-col relative overflow-hidden group min-h-[500px]">
                <div className="flex items-center justify-between mb-6 px-2 shrink-0">
                    <h3 className="text-2xl font-bold text-gray-900">Result</h3>
                    {resultImage && (
                        <div className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-black tracking-wide flex items-center gap-2 border border-green-200">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Ready
                        </div>
                    )}
                </div>

                <div className="flex-1 relative bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    {!resultImage && !isProcessing ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/50">
                            <div className="w-24 h-24 rounded-full bg-orange-50 flex items-center justify-center mb-6">
                                <Eraser className="w-12 h-12 text-orange-300" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-800 mb-2">Awaiting Image</h4>
                            <p className="text-gray-500 font-medium max-w-sm">Upload an image and click "Remove Background" to see the magic happen.</p>
                        </div>
                    ) : (
                        <div className="flex-1 relative flex items-center justify-center checkerboard-bg overflow-hidden p-6 group/result">
                            {isProcessing ? (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                                    <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-6 border border-orange-100 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-orange-50 animate-pulse" />
                                        <Loader2 className="w-10 h-10 text-orange-500 animate-spin relative z-10" />
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900 mb-1">AI Magic in Progress</h4>
                                    <p className="text-sm font-medium text-orange-600 animate-pulse">{status}</p>
                                </div>
                            ) : null}

                            <AnimatePresence>
                                {resultImage && (
                                    <motion.img
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        src={resultImage}
                                        alt="Processed"
                                        className="max-w-full max-h-full object-contain relative z-10 drop-shadow-2xl"
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Download Bar for Result */}
                    <AnimatePresence>
                        {resultImage && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white border-t border-gray-100 p-6 flex flex-col sm:flex-row items-center gap-4 shrink-0"
                            >
                                <a
                                    href={resultImage}
                                    download={`nobg_${file?.name?.split('.')[0] || 'image'}.png`}
                                    className="flex-1 w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-3 shadow-xl shadow-gray-900/20 hover:shadow-gray-900/40 hover:-translate-y-1"
                                >
                                    <Download size={20} />
                                    Download Transparent PNG
                                </a>
                                <button
                                    onClick={handleReset}
                                    className="w-full sm:w-auto px-8 py-4 bg-orange-50 text-orange-600 font-bold rounded-2xl hover:bg-orange-100 transition-colors flex items-center justify-center gap-3 border border-orange-200"
                                >
                                    <Plus size={20} />
                                    New Image
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <style>{`
                .checkerboard-bg {
                    background-image: linear-gradient(45deg, #f3f4f6 25%, transparent 25%),
                        linear-gradient(-45deg, #f3f4f6 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #f3f4f6 75%),
                        linear-gradient(-45deg, transparent 75%, #f3f4f6 75%);
                    background-size: 20px 20px;
                    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
                    background-color: white;
                }
            `}</style>
        </div>
    );
};

export default RemoveBackground;
