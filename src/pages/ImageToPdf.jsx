import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { FileDown, Upload, Trash2, GripVertical, FileImage } from 'lucide-react';
import { Reorder } from 'framer-motion';

const ImageToPdf = () => {
    const [images, setImages] = useState([]);
    const [pdfName, setPdfName] = useState('images.pdf');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleUpload = (e) => {
        const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
        const newImages = files.map(file => ({
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
        <div className="w-full">
            <div className="text-center mb-8">
                <div className="bg-red-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-600">
                    <FileImage size={32} />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Image to PDF</h1>
                <p className="text-gray-600">Convert multiple images into a single PDF document</p>
            </div>

            <div className="space-y-8">
                {/* Upload Area */}
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-8 hover:border-red-500 hover:bg-red-50 transition-all text-center">
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleUpload}
                        id="img-pdf-upload"
                        className="hidden"
                    />
                    <label htmlFor="img-pdf-upload" className="cursor-pointer block">
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-700">Drop images here or click to upload</p>
                    </label>
                </div>

                {/* Controls & List */}
                {images.length > 0 && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-gray-200">
                            <input
                                type="text"
                                value={pdfName}
                                onChange={(e) => setPdfName(e.target.value)}
                                placeholder="Filename"
                                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                            />
                            <button
                                onClick={generatePdf}
                                disabled={isGenerating}
                                className="w-full sm:w-auto px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                            >
                                {isGenerating ? 'Generating...' : <><FileDown size={20} /> Convert to PDF</>}
                            </button>
                        </div>

                        <Reorder.Group axis="y" values={images} onReorder={setImages} className="space-y-3">
                            {images.map((img) => (
                                <Reorder.Item key={img.id} value={img} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                                    <GripVertical className="text-gray-400 cursor-grab" />
                                    <img src={img.preview} alt="preview" className="w-16 h-16 object-cover rounded-lg bg-gray-100" />
                                    <span className="flex-1 font-medium truncate">{img.file.name}</span>
                                    <button onClick={() => removeImage(img.id)} className="p-2 text-gray-400 hover:text-red-500">
                                        <Trash2 size={20} />
                                    </button>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageToPdf;
