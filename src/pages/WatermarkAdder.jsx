import React, { useState, useRef, useEffect } from 'react';
import { Stamp, Upload, Download, Sliders, Image as ImageIcon } from 'lucide-react';
import DropZone from '../components/DropZone';

const WatermarkAdder = () => {
    const [baseImage, setBaseImage] = useState(null);
    const [watermarkImage, setWatermarkImage] = useState(null);
    const [options, setOptions] = useState({
        size: 30,
        opacity: 50,
        greyscale: false,
        position: 'bottom-right' // top-left, top-right, bottom-left, bottom-right, center
    });

    const canvasRef = useRef(null);

    const handleBaseUpload = (file) => {
        if (file && file.type.startsWith('image/')) {
            const img = new Image();
            img.onload = () => {
                setBaseImage(img);
            };
            img.src = URL.createObjectURL(file);
        }
    };

    const handleWatermarkUpload = (file) => {
        if (file && file.type.startsWith('image/')) {
            const img = new Image();
            img.onload = () => {
                setWatermarkImage(img);
            };
            img.src = URL.createObjectURL(file);
        }
    };

    useEffect(() => {
        draw();
    }, [baseImage, watermarkImage, options]);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas || !baseImage) return;

        // Set canvas sizing
        canvas.width = baseImage.width;
        canvas.height = baseImage.height;
        const ctx = canvas.getContext('2d');

        // Draw base image
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(baseImage, 0, 0);

        if (watermarkImage) {
            const { size, opacity, greyscale, position } = options;

            // Calculate watermark dimensions relative to base image
            const scale = size / 100;
            const wmWidth = baseImage.width * scale;
            const wmHeight = (wmWidth / watermarkImage.width) * watermarkImage.height;

            // Calculate position
            const padding = baseImage.width * 0.02; // 2% padding
            let x, y;

            switch (position) {
                case 'top-left':
                    x = padding;
                    y = padding;
                    break;
                case 'top-right':
                    x = canvas.width - wmWidth - padding;
                    y = padding;
                    break;
                case 'bottom-left':
                    x = padding;
                    y = canvas.height - wmHeight - padding;
                    break;
                case 'center':
                    x = (canvas.width - wmWidth) / 2;
                    y = (canvas.height - wmHeight) / 2;
                    break;
                case 'bottom-right':
                default:
                    x = canvas.width - wmWidth - padding;
                    y = canvas.height - wmHeight - padding;
                    break;
            }

            // Apply styles
            ctx.globalAlpha = opacity / 100;
            ctx.filter = greyscale ? 'grayscale(100%)' : 'none';

            ctx.drawImage(watermarkImage, x, y, wmWidth, wmHeight);

            // Reset context
            ctx.globalAlpha = 1.0;
            ctx.filter = 'none';
        }
    };

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = 'watermarked_image.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    return (
        <div className="w-full">
            <div className="text-center mb-8">
                <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                    <Stamp size={32} />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Watermark Adder</h1>
                <p className="text-gray-600">Add custom watermarks to your images professionally</p>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls Column */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Uploads */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                            <Upload size={18} /> Upload Images
                        </h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Base Image</label>
                            {baseImage ? (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                                    <span className="text-sm font-semibold text-blue-700">Base Image Loaded</span>
                                    <button onClick={() => setBaseImage(null)} className="text-sm text-red-500 hover:underline">Change</button>
                                </div>
                            ) : (
                                <DropZone
                                    onFileDrop={handleBaseUpload}
                                    accept="image/*"
                                    icon={ImageIcon}
                                    title="Click to select base"
                                    subtitle="or drag & drop"
                                    colorClass="blue"
                                />
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Watermark Image</label>
                            {watermarkImage ? (
                                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between">
                                    <span className="text-sm font-semibold text-indigo-700">Watermark Loaded</span>
                                    <button onClick={() => setWatermarkImage(null)} className="text-sm text-red-500 hover:underline">Change</button>
                                </div>
                            ) : (
                                <DropZone
                                    onFileDrop={handleWatermarkUpload}
                                    accept="image/*"
                                    icon={Stamp}
                                    title="Click to select watermark"
                                    subtitle="or drag & drop"
                                    colorClass="indigo"
                                />
                            )}
                        </div>
                    </div>

                    {/* Settings */}
                    {baseImage && watermarkImage && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Sliders size={18} /> Adjustments
                            </h3>

                            <div>
                                <div className="flex justify-between mb-1">
                                    <label className="text-sm text-gray-600">Size</label>
                                    <span className="text-sm font-mono text-gray-500">{options.size}%</span>
                                </div>
                                <input
                                    type="range" min="5" max="80"
                                    value={options.size}
                                    onChange={(e) => setOptions({ ...options, size: Number(e.target.value) })}
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between mb-1">
                                    <label className="text-sm text-gray-600">Opacity</label>
                                    <span className="text-sm font-mono text-gray-500">{options.opacity}%</span>
                                </div>
                                <input
                                    type="range" min="0" max="100"
                                    value={options.opacity}
                                    onChange={(e) => setOptions({ ...options, opacity: Number(e.target.value) })}
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-gray-600 mb-2 block">Position</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'].map(pos => (
                                        <button
                                            key={pos}
                                            onClick={() => setOptions({ ...options, position: pos })}
                                            className={`p-2 text-xs rounded border ${options.position === pos ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                                        >
                                            {pos.replace('-', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="greyscale"
                                    checked={options.greyscale}
                                    onChange={(e) => setOptions({ ...options, greyscale: e.target.checked })}
                                    className="rounded text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="greyscale" className="text-sm text-gray-700">Greyscale Watermark</label>
                            </div>

                            <button
                                onClick={handleDownload}
                                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Download size={18} /> Download
                            </button>
                        </div>
                    )}
                </div>

                {/* Preview Column */}
                <div className="lg:col-span-2 bg-gray-100 rounded-xl overflow-hidden shadow-inner flex items-center justify-center p-4 min-h-[400px]">
                    {baseImage ? (
                        <canvas ref={canvasRef} className="max-w-full max-h-[70vh] shadow-lg rounded" />
                    ) : (
                        <div className="text-center text-gray-400">
                            <ImageIcon size={64} className="mx-auto mb-4 opacity-50" />
                            <p>Upload a base image to start</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WatermarkAdder;
