import React, { useState, useRef, useEffect } from 'react';
import { Palette, Upload, Copy, Check, Info, Pipette, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DropZone from '../components/DropZone';

const ColorPicker = () => {
    const [image, setImage] = useState(null);
    const [color, setColor] = useState('#FFFFFF');
    const [rgb, setRgb] = useState('rgb(255, 255, 255)');
    const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });
    const [showPreview, setShowPreview] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isHoveringImage, setIsHoveringImage] = useState(false);

    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    const handleUpload = (file) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    setImage(img);
                    // Defer drawing slightly to ensure container is attached and sized
                    setTimeout(() => drawListImage(img), 50);
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
        const maxHeight = window.innerHeight * 0.7; // Responsive max height

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
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        // Correctly scale pointer coordinates relative to canvas internal resolution
        const x = Math.floor(e.nativeEvent.offsetX * scaleX);
        const y = Math.floor(e.nativeEvent.offsetY * scaleY);

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
        <div className="w-full h-full flex flex-col lg:flex-row gap-8 lg:gap-12 animate-in fade-in duration-500">
            {/* Left Pane: Controls & Color Info */}
            <div className="w-full lg:w-[420px] flex-shrink-0 flex flex-col">
                <div className="mb-8">
                    <div className="bg-gradient-to-br from-pink-100 to-rose-100 w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-white">
                        <Pipette size={36} className="text-pink-600" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">Color Picker</h1>
                    <p className="text-lg text-gray-600 font-medium">Extract the exact hex codes from any image instantly. Perfect for design.</p>
                </div>

                <div className="bg-white/60 backdrop-blur-2xl p-8 rounded-[2rem] shadow-sm border border-white flex-1 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-pink-100/50 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex-1 flex flex-col justify-center">
                        <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-8 flex items-center gap-2">
                            <Palette size={14} /> Selected Color
                        </h3>

                        <div className="flex flex-col items-center">
                            <motion.div
                                animate={{ backgroundColor: color }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                className="w-40 h-40 rounded-full shadow-[inset_0_4px_20px_rgb(0,0,0,0.1),0_10px_30px_rgb(0,0,0,0.05)] border-8 border-white mb-8 relative group"
                            >
                                <div className="absolute inset-0 rounded-full ring-1 ring-black/5 pointer-events-none" />
                            </motion.div>

                            <div className="text-center w-full bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <h4 className="text-4xl font-mono font-black text-gray-800 mb-2 tracking-tighter">{color}</h4>
                                <p className="text-gray-500 font-mono text-sm font-semibold">{rgb}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 relative z-10 space-y-4">
                        <button
                            onClick={copyToClipboard}
                            disabled={!image}
                            className={`w-full py-4 px-6 font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 text-lg ${image
                                    ? copied
                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                        : 'bg-gray-900 text-white hover:bg-pink-600 shadow-xl shadow-gray-200 hover:shadow-pink-200'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {copied ? <Check size={24} className="stroke-[3]" /> : <Copy size={20} />}
                            {copied ? 'Hex Copied!' : 'Copy Hex Code'}
                        </button>

                        {image && (
                            <button
                                onClick={() => {
                                    setImage(null);
                                    setColor('#FFFFFF');
                                    setRgb('rgb(255, 255, 255)');
                                }}
                                className="w-full py-3 text-gray-500 hover:text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-colors"
                            >
                                Upload Different Image
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Pane: Canvas */}
            <div className="flex-1 bg-white/40 backdrop-blur-md rounded-[2.5rem] border-2 border-dashed border-gray-200/80 p-6 lg:p-8 flex items-center justify-center relative overflow-hidden group min-h-[500px]">
                <AnimatePresence mode="wait">
                    {!image ? (
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
                                icon={ImageIcon}
                                title="Snap a Color"
                                subtitle="Upload an image"
                                description="Supported formats: PNG, JPG, WebP"
                                colorClass="pink"
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="canvas-area"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="w-full h-full flex flex-col items-center justify-center relative"
                            ref={containerRef}
                        >
                            <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
                                <div className="bg-gray-900/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-bold tracking-wide shadow-sm border border-white/20 flex items-center gap-2 shadow-lg">
                                    <Info size={16} />
                                    Hover & Click to extract color
                                </div>
                            </div>

                            <div
                                className={`bg-gray-50/50 rounded-[2rem] p-4 shadow-2xl shadow-gray-200/50 border border-gray-100 relative group/canvas transition-all duration-300 ${isHoveringImage ? 'ring-4 ring-pink-500/20 shadow-pink-200/50' : ''}`}
                            >
                                <div className="relative overflow-hidden rounded-2xl flex justify-center bg-[#e5e7eb] checkerboard-bg cursor-crosshair">
                                    <canvas
                                        ref={canvasRef}
                                        onClick={pickColor}
                                        onMouseEnter={() => setIsHoveringImage(true)}
                                        onMouseMove={(e) => {
                                            if (e.buttons === 1) { // Allow dragging to pick color
                                                pickColor(e);
                                            } else {
                                                pickColor(e); // Also pick on hover for instant feedback
                                            }
                                        }}
                                        onMouseLeave={() => setIsHoveringImage(false)}
                                        className="max-w-full touch-none"
                                        style={{ touchAction: 'none' }}
                                    />

                                    {/* Mouse Tracker Ring */}
                                    {isHoveringImage && (
                                        <div
                                            className="absolute w-12 h-12 rounded-full border-[3px] border-white shadow-[0_0_10px_rgba(0,0,0,0.5),inset_0_0_4px_rgba(0,0,0,0.5)] pointer-events-none -translate-x-1/2 -translate-y-1/2 z-30 transition-none"
                                            style={{
                                                left: previewPos.x,
                                                top: previewPos.y,
                                                backgroundColor: color
                                            }}
                                        />
                                    )}
                                </div>
                            </div>

                            <style jsx>{`
                                .checkerboard-bg {
                                    background-image: linear-gradient(45deg, #f0f0f0 25%, transparent 25%), 
                                                      linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), 
                                                      linear-gradient(45deg, transparent 75%, #f0f0f0 75%), 
                                                      linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
                                    background-size: 20px 20px;
                                    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
                                }
                            `}</style>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ColorPicker;
