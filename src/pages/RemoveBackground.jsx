import React, { useState } from 'react';
import { Eraser, Upload, Download, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';

const RemoveBackground = () => {
    const [file, setFile] = useState(null);
    const [originalPreview, setOriginalPreview] = useState(null);
    const [resultImage, setResultImage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('');

    const handleUpload = (e) => {
        const selectedFile = e.target.files[0];
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
    };

    return (
        <div className="w-full">
            <div className="text-center mb-8">
                <div className="bg-orange-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-orange-600">
                    <Eraser size={32} />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Remove Background</h1>
                <p className="text-gray-600">Automatically remove image backgrounds with AI</p>
            </div>

            <div className="max-w-6xl mx-auto space-y-8">
                {/* Upload Section */}
                {!file && (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-12 hover:border-orange-500 hover:bg-orange-50 transition-all text-center">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleUpload}
                            id="upload-bg"
                            className="hidden"
                        />
                        <label htmlFor="upload-bg" className="cursor-pointer">
                            <Upload className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                            <h3 className="text-xl font-bold text-gray-700 mb-2">Upload Image</h3>
                            <p className="text-gray-500">JPG, PNG, WebP supported</p>
                        </label>
                    </div>
                )}

                {/* Edit Section */}
                {file && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Original */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-gray-700">Original</h3>
                                <button onClick={handleReset} className="text-sm text-red-500 hover:underline">
                                    Change Image
                                </button>
                            </div>
                            <div className="relative aspect-square md:aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                <img src={originalPreview} alt="Original" className="max-w-full max-h-full object-contain" />
                            </div>
                        </div>

                        {/* Result */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="font-semibold text-gray-700 mb-4 flex justify-between items-center">
                                Result
                                {isProcessing && <span className="text-sm font-normal text-orange-600 animate-pulse">{status}</span>}
                            </h3>

                            <div className="relative aspect-square md:aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden checkerboard-bg">
                                {resultImage ? (
                                    <img src={resultImage} alt="No Background" className="max-w-full max-h-full object-contain z-10" />
                                ) : (
                                    <div className="text-gray-400 flex flex-col items-center">
                                        {isProcessing ? (
                                            <Loader2 className="animate-spin mb-2" size={32} />
                                        ) : (
                                            <div className="text-center p-6">
                                                <p>Preview will appear here</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                {file && (
                    <div className="flex flex-col items-center gap-4">
                        {error && (
                            <div className="p-4 bg-red-100 text-red-700 rounded-xl flex items-center gap-2 max-w-2xl text-center">
                                <AlertCircle size={20} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        {!resultImage ? (
                            <button
                                onClick={handleRemoveBackground}
                                disabled={isProcessing}
                                className="px-8 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isProcessing ? <Loader2 className="animate-spin" /> : <Eraser />}
                                Remove Background
                            </button>
                        ) : (
                            <div className="flex gap-4">
                                <a
                                    href={resultImage}
                                    download={`nobg_${file.name.split('.')[0]}.png`}
                                    className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg flex items-center gap-2"
                                >
                                    <Download /> Download HD
                                </a>
                                <button
                                    onClick={handleReset}
                                    className="px-8 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
                                >
                                    <RefreshCw size={20} /> Start Over
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                .checkerboard-bg {
                    background-image: linear-gradient(45deg, #e5e7eb 25%, transparent 25%),
                        linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #e5e7eb 75%),
                        linear-gradient(-45deg, transparent 75%, #e5e7eb 75%);
                    background-size: 20px 20px;
                    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
                }
            `}</style>
        </div>
    );
};

export default RemoveBackground;
