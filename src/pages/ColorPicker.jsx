import React, { useState, useRef, useEffect } from 'react';
import { Palette, Upload, Copy, Check, Info } from 'lucide-react';

const ColorPicker = () => {
    const [image, setImage] = useState(null);
    const [color, setColor] = useState('#FFFFFF');
    const [rgb, setRgb] = useState('rgb(255, 255, 255)');
    const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });
    const [showPreview, setShowPreview] = useState(false);
    const [copied, setCopied] = useState(false);

    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    const handleUpload = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    setImage(img);
                    drawListImage(img);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    const drawListImage = (img) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const container = containerRef.current;
        const ctx = canvas.getContext('2d');

        // Fit to container
        const maxWidth = container.clientWidth;
        const maxHeight = 500;

        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
        }
        if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
    };

    const pickColor = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ctx = canvas.getContext('2d');
        const pixel = ctx.getImageData(x, y, 1, 1).data;

        const r = pixel[0];
        const g = pixel[1];
        const b = pixel[2];

        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
        const rgbVal = `rgb(${r}, ${g}, ${b})`;

        setColor(hex);
        setRgb(rgbVal);
        setPreviewPos({ x, y });
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(color);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Handle window resize to redraw image
    useEffect(() => {
        const handleResize = () => {
            if (image) drawListImage(image);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [image]);

    return (
        <div className="w-full">
            <div className="text-center mb-8">
                <div className="bg-pink-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-pink-600">
                    <Palette size={32} />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Image Color Picker</h1>
                <p className="text-gray-600">Upload an image and pick any color from it</p>
            </div>

            <div className="max-w-5xl mx-auto">
                {!image ? (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-12 hover:border-pink-500 hover:bg-pink-50 transition-all text-center">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleUpload}
                            id="color-upload"
                            className="hidden"
                        />
                        <label htmlFor="color-upload" className="cursor-pointer">
                            <Upload className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                            <h3 className="text-xl font-bold text-gray-700 mb-2">Upload Image</h3>
                            <p className="text-gray-500">Supported formats: PNG, JPG, WebP</p>
                        </label>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Canvas Area */}
                        <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-sm border border-gray-200 relative" ref={containerRef}>
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                    <Info size={14} /> Click image to pick color
                                </p>
                                <button
                                    onClick={() => setImage(null)}
                                    className="text-sm text-red-500 hover:underline"
                                >
                                    Change Image
                                </button>
                            </div>
                            <div className="relative overflow-hidden rounded-lg cursor-crosshair flex justify-center bg-gray-100">
                                <canvas
                                    ref={canvasRef}
                                    onClick={pickColor}
                                    onMouseMove={(e) => {
                                        pickColor(e);
                                        setShowPreview(true);
                                    }}
                                    onMouseLeave={() => setShowPreview(false)}
                                    className="max-w-full"
                                />
                                {/* Magnifier/Preview could go here if we wanted to get fancy */}
                            </div>
                        </div>

                        {/* Info Panel */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit lg:sticky lg:top-8">
                            <h3 className="font-bold text-gray-800 mb-6 text-lg">Selected Color</h3>

                            <div className="flex flex-col items-center mb-8">
                                <div
                                    className="w-32 h-32 rounded-full shadow-inner border-4 border-white ring-2 ring-gray-100 mb-4 transition-colors duration-200"
                                    style={{ backgroundColor: color }}
                                />
                                <div className="text-center">
                                    <h4 className="text-2xl font-mono font-bold text-gray-800">{color}</h4>
                                    <p className="text-gray-500 font-mono text-sm">{rgb}</p>
                                </div>
                            </div>

                            <button
                                onClick={copyToClipboard}
                                className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${copied
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-900 text-white hover:bg-gray-800'
                                    }`}
                            >
                                {copied ? <Check size={20} /> : <Copy size={20} />}
                                {copied ? 'Copied!' : 'Copy Hex Code'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ColorPicker;
