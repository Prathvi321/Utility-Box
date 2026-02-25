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
        <div className="w-full h-full flex flex-col lg:flex-row gap-8 lg:gap-12 animate-in fade-in duration-500">
            {/* Left Pane: Configuration & Upload */}
            <div className="w-full lg:w-[420px] flex-shrink-0 flex flex-col">
                <div className="mb-8">
                    <div className="bg-gradient-to-br from-rose-100 to-orange-100 w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-white">
                        <FileType2 size={36} className="text-rose-600" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">Image to PDF</h1>
                    <p className="text-lg text-gray-600 font-medium">Merge beautiful images into a single professional PDF document effortlessly.</p>
                </div>

                <div className="bg-white/60 backdrop-blur-2xl p-8 rounded-[2rem] shadow-sm border border-white flex-1 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-100/50 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10">
                        <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-6 flex items-center gap-2">
                            <Settings size={14} /> PDF Configuration
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-base font-bold text-gray-800 mb-3">
                                    Document Name
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={pdfName}
                                        onChange={(e) => setPdfName(e.target.value)}
                                        placeholder="My_Images.pdf"
                                        className="w-full px-5 py-4 bg-white/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all duration-300 font-medium text-gray-800"
                                    />
                                    <FilePlus2 className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100/50">
                                <label className="block text-base font-bold text-gray-800 mb-3">
                                    Quick Add More
                                </label>
                                <DropZone
                                    onFileDrop={handleUpload}
                                    accept="image/*"
                                    multiple={true}
                                    icon={Upload}
                                    title="Add images"
                                    subtitle="to your PDF"
                                    colorClass="rose"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 relative z-10 border-t border-gray-100/50 pt-8">
                        <button
                            onClick={generatePdf}
                            disabled={isGenerating || images.length === 0}
                            className={`w-full py-4 px-6 font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 text-lg group ${images.length > 0 && !isGenerating
                                    ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-xl shadow-rose-200 hover:shadow-rose-300 scale-100'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed scale-[0.98]'
                                }`}
                        >
                            {isGenerating ? <Loader2 className="animate-spin w-6 h-6" /> : <FileDown className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />}
                            {isGenerating ? 'Generating PDF...' : `Merge ${images.length} Image${images.length !== 1 ? 's' : ''}`}
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Pane: Image List & Reordering */}
            <div className="flex-1 bg-white/40 backdrop-blur-md rounded-[2.5rem] border-2 border-dashed border-gray-200/80 p-6 lg:p-10 flex flex-col relative overflow-hidden group min-h-[500px]">
                <AnimatePresence mode="wait">
                    {images.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto my-auto"
                        >
                            <div className="bg-rose-50 w-24 h-24 rounded-full flex items-center justify-center mb-6">
                                <FileImage className="w-12 h-12 text-rose-300" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Images Selected</h3>
                            <p className="text-gray-500 font-medium">Use the upload zone on the left to add images you want to combine into a PDF.</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-full flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-6 px-2">
                                <h3 className="text-xl font-bold text-gray-800">Page Order</h3>
                                <div className="bg-rose-50 text-rose-600 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide border border-rose-100/50">
                                    {images.length} Pages
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                <Reorder.Group axis="y" values={images} onReorder={setImages} className="space-y-4">
                                    <AnimatePresence>
                                        {images.map((img, index) => (
                                            <Reorder.Item
                                                key={img.id}
                                                value={img}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex items-center gap-5 group/item hover:border-rose-100 transition-colors cursor-grab active:cursor-grabbing relative overflow-hidden"
                                            >
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-200 to-rose-400 opacity-0 group-hover/item:opacity-100 transition-opacity" />

                                                <div className="p-2 -ml-2 text-gray-400 group-hover/item:text-rose-500 transition-colors">
                                                    <GripVertical size={20} />
                                                </div>

                                                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                                                    <span className="absolute top-1 left-1 bg-gray-900/60 backdrop-blur-md text-white text-[10px] px-1.5 font-bold rounded-md z-10">{index + 1}</span>
                                                    <img src={img.preview} alt="preview" className="w-full h-full object-cover" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-gray-800 truncate text-base">{img.file.name}</h4>
                                                    <p className="text-sm text-gray-500 font-medium">{(img.file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>

                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100 flex-shrink-0"
                                                >
                                                    <Trash2 size={18} />
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
    );
};

export default ImageToPdf;
