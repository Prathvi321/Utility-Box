import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { FileDown, Upload, Trash2, GripVertical, FileImage, Settings, FilePlus2, FileType2 } from 'lucide-react';
import { Reorder, motion, AnimatePresence } from 'framer-motion';
import DropZone from '../components/DropZone';

const ImageToPdf = () => {
    const [images, setImages] = useState([]);
    const [pdfName, setPdfName] = useState('My_Images.pdf');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleUpload = (files) => {
        const fileArray = files instanceof FileList ? Array.from(files) : (Array.isArray(files) ? files : [files]);
        const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));
        const newImages = imageFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            preview: URL.createObjectURL(file)
        }));
        setImages(prev => [...prev, ...newImages]);
    };

    const removeImage = (id) => {
        setImages(prev => prev.filter(img => img.id !== id));
    };

    const generatePdf = async () => {
        if (images.length === 0) return;
        setIsGenerating(true);

        const doc = new jsPDF();
        const margin = 10;

        for (let i = 0; i < images.length; i++) {
            if (i > 0) doc.addPage();

            const imgItem = images[i];
            const img = new Image();
            img.src = imgItem.preview;

            await new Promise(resolve => {
                img.onload = resolve;
            });

            // Calculate dimensions
            const pageWidth = doc.internal.pageSize.getWidth() - (margin * 2);
            const pageHeight = doc.internal.pageSize.getHeight() - (margin * 2);
            const imgRatio = img.width / img.height;
            const pageRatio = pageWidth / pageHeight;

            let finalWidth, finalHeight;
            if (imgRatio > pageRatio) {
                finalWidth = pageWidth;
                finalHeight = pageWidth / imgRatio;
            } else {
                finalHeight = pageHeight;
                finalWidth = pageHeight * imgRatio;
            }

            const x = (doc.internal.pageSize.getWidth() - finalWidth) / 2;
            const y = (doc.internal.pageSize.getHeight() - finalHeight) / 2;

            doc.addImage(img, 'JPEG', x, y, finalWidth, finalHeight);
        }

        doc.save(pdfName.endsWith('.pdf') ? pdfName : `${pdfName}.pdf`);
        setIsGenerating(false);
    };

    return (
        <div className="h-full flex flex-col animate-in fade-in duration-500">
            {/* Compact header row */}
            <div className="compact-service-header">
                <div className="header-icon bg-sage-100 text-sage-600 border border-sage-200">
                    <FileType2 size={20} />
                </div>
                <div className="min-w-0">
                    <h1>Image to PDF</h1>
                    <p>Merge beautiful images into a single professional PDF document effortlessly.</p>
                </div>
            </div>

            {/* Main content grid */}
            <div className="grid lg:grid-cols-[380px_1fr] gap-3 flex-1 min-h-0 overflow-hidden">
                {/* Left Pane: Configuration & Upload */}
                <div className="bg-white/70 rounded-2xl border border-stone-100 p-4 flex flex-col justify-between overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sage-100/50 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex-1 flex flex-col min-h-0">
                        <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-3 flex items-center gap-2 flex-shrink-0">
                            <Settings size={13} /> PDF Configuration
                        </h3>

                        <div className="space-y-4 flex-1 flex flex-col min-h-0">
                            <div className="flex-shrink-0">
                                <label className="block text-xs font-bold text-gray-800 mb-1.5">
                                    Document Name
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={pdfName}
                                        onChange={(e) => setPdfName(e.target.value)}
                                        placeholder="My_Images.pdf"
                                        className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-sage-200 focus:border-sage-400 outline-none transition text-stone-800 text-sm bg-stone-50"
                                    />
                                    <FilePlus2 className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                                </div>
                            </div>

                            <div className="pt-3 border-t border-stone-100 flex-1 flex flex-col min-h-0">
                                <label className="block text-xs font-bold text-gray-800 mb-1.5 flex-shrink-0">
                                    Quick Add More
                                </label>
                                <div className="flex-1 min-h-0 overflow-y-auto services-scrollbar">
                                    <DropZone
                                        onFileDrop={handleUpload}
                                        accept="image/*"
                                        multiple={true}
                                        icon={Upload}
                                        title="Add images"
                                        subtitle="to your PDF"
                                        colorClass="teal"
                                        compact={true}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 relative z-10 border-t border-stone-100 pt-3 flex-shrink-0">
                        <button
                            onClick={generatePdf}
                            disabled={isGenerating || images.length === 0}
                            className={`w-full py-2.5 px-4 font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm group ${images.length > 0 && !isGenerating
                                    ? 'bg-sage-900 text-white hover:bg-sage-700 shadow-xl shadow-sage-200'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {isGenerating ? <Loader2 className="animate-spin w-4 h-4" /> : <FileDown className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />}
                            {isGenerating ? 'Generating PDF...' : `Merge ${images.length} Image${images.length !== 1 ? 's' : ''}`}
                        </button>
                    </div>
                </div>

                {/* Right Pane: Image List & Reordering */}
                <div className="flex-1 bg-white/40 backdrop-blur-md rounded-2xl border-2 border-dashed border-stone-200/80 p-4 flex flex-col relative overflow-hidden group min-h-0">
                    <AnimatePresence mode="wait">
                        {images.length === 0 ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto my-auto"
                            >
                                <div className="bg-sage-50 w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-sage-100">
                                    <FileImage className="w-8 h-8 text-sage-300" />
                                </div>
                                <h3 className="text-base font-bold text-gray-800 mb-1">No Images Selected</h3>
                                <p className="text-xs text-gray-500 font-medium">Use the configuration pane on the left to add photos/screenshots you want to compile.</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="list"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full h-full flex flex-col min-h-0"
                            >
                                <div className="flex items-center justify-between mb-4 px-1 flex-shrink-0">
                                    <h3 className="text-base font-bold text-gray-800">Selected Images</h3>
                                    <div className="bg-sage-50 text-sage-600 px-3 py-1 rounded-full text-xs font-bold tracking-wide border border-sage-100/50">
                                        {images.length} Items
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                                    <Reorder.Group axis="y" values={images} onReorder={setImages} className="space-y-3">
                                        <AnimatePresence>
                                            {images.map((img, index) => (
                                                <Reorder.Item
                                                    key={img.id}
                                                    value={img}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    className="bg-white p-3 rounded-xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex items-center gap-3 group/item hover:border-sage-100 transition-colors cursor-grab active:cursor-grabbing relative overflow-hidden"
                                                >
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-sage-300 to-sage-500 opacity-0 group-hover/item:opacity-100 transition-opacity" />

                                                    <div className="p-1 -ml-1 text-gray-400 group-hover/item:text-sage-500 transition-colors">
                                                        <GripVertical size={16} />
                                                    </div>

                                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-stone-50 border border-stone-100 flex items-center justify-center flex-shrink-0">
                                                        <span className="absolute top-1 left-1 bg-white/80 backdrop-blur-sm text-sage-700 text-[9px] px-1 font-black rounded-md z-10">{index + 1}</span>
                                                        <img src={img.preview} alt="Thumbnail" className="w-full h-full object-cover" />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-gray-800 truncate text-sm">{img.file.name}</h4>
                                                        <p className="text-xs text-gray-500 font-medium">{(img.file.size / 1024 / 1024).toFixed(2)} MB Image File</p>
                                                    </div>

                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100 flex-shrink-0"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </Reorder.Item>
                                            ))}
                                        </AnimatePresence>
                                    </Reorder.Group>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default ImageToPdf;
