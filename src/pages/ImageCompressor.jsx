import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { Image as ImageIcon, Upload, Download, Loader2, AlertCircle } from 'lucide-react';

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

    const handleImageUpload = (e) => {
        const imageFile = e.target.files[0];
        if (!imageFile) return;

        setOriginalImage(imageFile);
        setOriginalPreview(URL.createObjectURL(imageFile));
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
        <div className="w-full">
            <div className="text-center mb-8">
                <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
                    <ImageIcon size={32} />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Image Compressor</h1>
                <p className="text-gray-600">Reduce image file size while maintaining quality</p>
            </div>

            <div className="space-y-6">
                {!originalImage && (
                    <div className="relative text-center">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            id="image-upload"
                            className="hidden"
                        />
                        <label
                            htmlFor="image-upload"
                            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200"
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-12 h-12 mb-4 text-gray-400" />
                                <p className="mb-2 text-sm text-gray-500">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-500">PNG, JPG, WebP supported</p>
                            </div>
                        </label>
                    </div>
                )}

                {originalImage && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Original Image */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <h3 className="font-semibold text-gray-700 mb-2">Original</h3>
                            <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden mb-2 flex items-center justify-center">
                                <img src={originalPreview} alt="Original" className="max-h-full max-w-full object-contain" />
                            </div>
                            <p className="text-sm text-gray-500">
                                Size: {(originalImage.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>

                        {/* Controls & Result */}
                        <div className="space-y-6">
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                <h3 className="font-semibold text-gray-700 mb-4">Compression Settings</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Max Size (MB)
                                        </label>
                                        <input
                                            type="number"
                                            value={options.maxSizeMB}
                                            onChange={(e) => setOptions({ ...options, maxSizeMB: parseFloat(e.target.value) })}
                                            min="0.1"
                                            step="0.1"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Max Width/Height (px)
                                        </label>
                                        <input
                                            type="number"
                                            value={options.maxWidthOrHeight}
                                            onChange={(e) => setOptions({ ...options, maxWidthOrHeight: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleCompress}
                                    disabled={isCompressing}
                                    className="w-full mt-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    {isCompressing ? <Loader2 className="animate-spin" /> : 'Compress Image'}
                                </button>
                            </div>

                            {compressedImage && (
                                <div className="bg-green-50 p-4 rounded-xl border border-green-200 animate-fadeIn">
                                    <h3 className="font-semibold text-green-800 mb-2">Compressed Result</h3>
                                    <p className="text-sm text-green-700 mb-4">
                                        New Size: {(compressedImage.size / 1024 / 1024).toFixed(2)} MB
                                        <span className="font-bold ml-2">
                                            (-{((1 - compressedImage.size / originalImage.size) * 100).toFixed(0)}%)
                                        </span>
                                    </p>
                                    <button
                                        onClick={handleDownload}
                                        className="w-full py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Download size={18} /> Download
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {originalImage && (
                    <button
                        onClick={() => {
                            setOriginalImage(null);
                            setOriginalPreview(null);
                            setCompressedImage(null);
                            setCompressedPreview(null);
                        }}
                        className="text-gray-500 hover:text-red-500 text-sm font-medium transition-colors mx-auto block"
                    >
                        Upload Different Image
                    </button>
                )}
            </div>
        </div>
    );
};

export default ImageCompressor;
