import React, { useState, useRef, useEffect } from 'react';
import { Stamp, Upload, Download, Sliders, Image as ImageIcon, X, Layers, Settings2, Sparkles, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DropZone from '../components/DropZone';

const WatermarkAdder = () => {
    const [baseImage, setBaseImage] = useState(null);
    const [watermarkImage, setWatermarkImage] = useState(null);
    const [options, setOptions] = useState({
        size: 30,
        opacity: 50,
        greyscale: false,
        position: 'bottom-right'
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
        let requestId;
        const render = () => {
            draw();
            requestId = requestAnimationFrame(render);
        }
        render();
        return () => cancelAnimationFrame(requestId);
    }, [baseImage, watermarkImage, options]);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas || !baseImage) return;

        // Set canvas sizing on first load or if size changed
        if (canvas.width !== baseImage.width || canvas.height !== baseImage.height) {
            canvas.width = baseImage.width;
            canvas.height = baseImage.height;
        }

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
                case 'top-center':
                    x = (canvas.width - wmWidth) / 2;
                    y = padding;
                    break;
                case 'top-right':
                    x = canvas.width - wmWidth - padding;
                    y = padding;
                    break;
                case 'center-left':
                    x = padding;
                    y = (canvas.height - wmHeight) / 2;
                    break;
                case 'center':
                    x = (canvas.width - wmWidth) / 2;
                    y = (canvas.height - wmHeight) / 2;
                    break;
                case 'center-right':
                    x = canvas.width - wmWidth - padding;
                    y = (canvas.height - wmHeight) / 2;
                    break;
                case 'bottom-left':
                    x = padding;
                    y = canvas.height - wmHeight - padding;
                    break;
                case 'bottom-center':
                    x = (canvas.width - wmWidth) / 2;
                    y = canvas.height - wmHeight - padding;
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
        link.download = `watermarked_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const handleReset = () => {
        setBaseImage(null);
        setWatermarkImage(null);
        setOptions({
            size: 30,
            opacity: 50,
            greyscale: false,
            position: 'bottom-right'
        });
    };

    return (
        <div className="w-full h-full flex flex-col lg:flex-row gap-8 lg:gap-12 animate-in fade-in duration-500">
            {/* Left Pane: Configuration */}
            <div className="w-full lg:w-[460px] flex-shrink-0 flex flex-col">
                <div className="mb-8">
                    <div className="bg-gradient-to-br from-indigo-100 to-blue-100 w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-white">
                        <Stamp size={36} className="text-indigo-600" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">Add <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">Watermark</span></h1>
                    <p className="text-lg text-gray-600 font-medium">Protect your images with custom, perfectly placed watermarks.</p>
                </div>

                <div className="bg-white/60 backdrop-blur-2xl p-8 rounded-[2rem] shadow-sm border border-white flex-1 flex flex-col justify-between relative overflow-hidden custom-scrollbar max-h-full overflow-y-auto">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex-1 flex flex-col space-y-8">
                        {/* Layers Section */}
                        <div className="space-y-4">
                            <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 flex items-center gap-2">
                                <Layers size={14} /> Images
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-bold text-gray-800">Base Image</label>
                                    </div>
                                    <AnimatePresence mode="wait">
                                        {baseImage ? (
                                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative group rounded-2xl overflow-hidden border-2 border-indigo-100 bg-gray-50 h-24 flex items-center justify-center hover:border-indigo-300 transition-colors">
                                                <img src={baseImage.src} alt="Base" className="h-full w-full object-contain p-2" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button
                                                        onClick={() => setBaseImage(null)}
                                                        className="p-2 bg-white text-red-500 rounded-full hover:bg-red-50 transition-colors shadow-lg"
                                                        title="Remove Image"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                                                <DropZone
                                                    onFileDrop={handleBaseUpload}
                                                    accept="image/*"
                                                    icon={ImageIcon}
                                                    title="Select Base Image"
                                                    subtitle=""
                                                    colorClass="indigo"
                                                    className="py-4"
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-bold text-gray-800">Watermark Image</label>
                                    </div>
                                    <AnimatePresence mode="wait">
                                        {watermarkImage ? (
                                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative group rounded-2xl overflow-hidden border-2 border-blue-100 bg-gray-50 h-24 flex items-center justify-center hover:border-blue-300 transition-colors">
                                                <img src={watermarkImage.src} alt="Watermark" className="h-full w-full object-contain p-2" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button
                                                        onClick={() => setWatermarkImage(null)}
                                                        className="p-2 bg-white text-red-500 rounded-full hover:bg-red-50 transition-colors shadow-lg"
                                                        title="Remove Image"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                                                <DropZone
                                                    onFileDrop={handleWatermarkUpload}
                                                    accept="image/*"
                                                    icon={Stamp}
                                                    title="Select Watermark Logo"
                                                    subtitle=""
                                                    colorClass="blue"
                                                    className="py-4"
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        {/* Adjustments Section */}
                        <div className="space-y-4 pt-6 border-t border-gray-100/50">
                            <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 flex items-center gap-2">
                                <Settings2 size={14} /> Adjustments
                            </h3>

                            <div className="space-y-5 bg-white/50 p-5 rounded-2xl border border-gray-100">
                                {/* Size */}
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-bold text-gray-700">Size</label>
                                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">{options.size}%</span>
                                    </div>
                                    <input
                                        type="range" min="5" max="80"
                                        value={options.size}
                                        onChange={(e) => setOptions({ ...options, size: Number(e.target.value) })}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                </div>

                                {/* Opacity */}
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-bold text-gray-700">Opacity</label>
                                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">{options.opacity}%</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="100"
                                        value={options.opacity}
                                        onChange={(e) => setOptions({ ...options, opacity: Number(e.target.value) })}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                </div>

                                {/* Position Grid */}
                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-3 block">Placement</label>
                                    <div className="grid grid-cols-3 gap-2 p-3 bg-white rounded-xl border border-gray-200 aspect-square max-w-[200px] mx-auto shadow-sm">
                                        {['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'].map(pos => (
                                            <button
                                                key={pos}
                                                onClick={() => setOptions({ ...options, position: pos })}
                                                className={`rounded-lg transition-all duration-200 flex items-center justify-center group ${options.position === pos
                                                    ? 'bg-indigo-600 shadow-md shadow-indigo-500/30 ring-2 ring-indigo-600 ring-offset-1'
                                                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                                                    }`}
                                                title={pos.replace('-', ' ').toUpperCase()}
                                            >
                                                <div className={`w-3 h-3 rounded-full transition-colors ${options.position === pos ? 'bg-white' : 'bg-gray-300 group-hover:bg-indigo-400'}`}></div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Greyscale Toggle */}
                                <div className="flex items-center gap-3 pt-2">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={options.greyscale}
                                            onChange={(e) => setOptions({ ...options, greyscale: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 shadow-inner"></div>
                                        <span className="ml-3 text-sm font-bold text-gray-700">Greyscale Mask</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Pane: Preview & Export */}
            <div className="flex-1 bg-white/40 backdrop-blur-md rounded-[2.5rem] border-2 border-dashed border-gray-200/80 p-6 lg:p-10 flex flex-col relative overflow-hidden group min-h-[500px]">
                <div className="flex items-center justify-between mb-6 px-2 shrink-0">
                    <h3 className="text-2xl font-bold text-gray-900">Preview</h3>
                    {baseImage && watermarkImage && (
                        <div className="flex gap-3">
                            <button
                                onClick={handleReset}
                                className="px-4 py-1.5 rounded-full text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-red-500 transition-colors flex items-center gap-2"
                            >
                                <RefreshCw size={14} /> Reset
                            </button>
                            <div className="bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-black tracking-wide flex items-center gap-2 border border-indigo-200">
                                <Sparkles size={14} className="text-indigo-500 animate-pulse" />
                                Interactive
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 relative bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col items-center justify-center p-6 checkerboard-bg">
                    {!baseImage ? (
                        <div className="flex flex-col items-center justify-center text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-xl max-w-sm">
                            <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center mb-6">
                                <ImageIcon className="w-12 h-12 text-indigo-300" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-800 mb-2">Upload Base Image</h4>
                            <p className="text-gray-500 font-medium">Your preview will appear here once you select a base image.</p>
                        </div>
                    ) : (
                        <div className="relative w-full h-full flex items-center justify-center">
                            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain shadow-2xl rounded-lg ring-1 ring-gray-900/10 transition-all duration-300" />

                            {!watermarkImage && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-[1px] rounded-lg">
                                    <div className="bg-white/95 backdrop-blur-md px-6 py-4 rounded-xl shadow-xl border border-indigo-100 flex items-center gap-3 animate-bounce">
                                        <Stamp className="text-indigo-500" size={24} />
                                        <span className="font-bold text-gray-800">Now add a watermark</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Download Bar */}
                    <AnimatePresence>
                        {baseImage && watermarkImage && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute bottom-6 left-6 right-6"
                            >
                                <div className="bg-white/90 backdrop-blur-xl border border-gray-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 shadow-2xl">
                                    <button
                                        onClick={handleDownload}
                                        className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-3 shadow-xl shadow-gray-900/20 hover:shadow-gray-900/40 hover:-translate-y-1"
                                    >
                                        <Download size={20} />
                                        Export Watermarked Image
                                    </button>
                                </div>
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

export default WatermarkAdder;
