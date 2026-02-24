import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Upload, Download, Loader2, Repeat } from 'lucide-react';
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
        <div className="w-full">
            <div className="text-center mb-8">
                <div className="bg-purple-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple-600">
                    <Repeat size={32} />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Image Converter</h1>
                <p className="text-gray-600">Convert images between different formats easily</p>
            </div>

            <div className="space-y-8 max-w-3xl mx-auto">
                {/* Upload Section */}
                {!file ? (
                    <DropZone
                        onFileDrop={handleUpload}
                        accept="image/*"
                        icon={Upload}
                        description="Convert and download formats easily."
                        colorClass="purple"
                    />
                ) : (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            {/* Preview */}
                            <div className="w-full md:w-1/2">
                                <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center p-4">
                                    <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain" />
                                </div>
                                <button
                                    onClick={() => { setFile(null); setPreview(null); }}
                                    className="mt-4 text-sm text-gray-500 hover:text-red-500 w-full text-center"
                                >
                                    Change Image
                                </button>
                            </div>

                            {/* Controls */}
                            <div className="w-full md:w-1/2 space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Convert to Format:
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['png', 'jpg', 'webp', 'ico'].map((fmt) => (
                                            <button
                                                key={fmt}
                                                onClick={() => setFormat(fmt)}
                                                className={`py-3 px-4 rounded-xl border-2 font-medium transition-all ${format === fmt
                                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                    : 'border-gray-200 hover:border-purple-200 text-gray-600'
                                                    }`}
                                            >
                                                {fmt.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleConvert}
                                    disabled={isConverting}
                                    className="w-full py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-200"
                                >
                                    {isConverting ? <Loader2 className="animate-spin" /> : <Download />}
                                    Convert & Download
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
            </div>
        </div>
    );
};

export default ImageConverter;
