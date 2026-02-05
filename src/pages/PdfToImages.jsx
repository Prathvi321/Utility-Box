import React, { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
// Import worker directly to ensure correct version and bundling
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import JSZip from 'jszip';
import { Images, FileUp, Download, Loader2, AlertCircle } from 'lucide-react';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const PdfToImages = () => {
    const [file, setFile] = useState(null);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState(null);

    // Options
    const [mode, setMode] = useState('single'); // 'single', 'range', 'all'
    const [singlePage, setSinglePage] = useState(1);
    const [rangeStart, setRangeStart] = useState(1);
    const [rangeEnd, setRangeEnd] = useState(1);

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile || selectedFile.type !== 'application/pdf') {
            setError('Please select a valid PDF file.');
            return;
        }

        setFile(selectedFile);
        setError(null);
        setStatus('Loading PDF...');

        try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            // Use standard promise pattern for v5+
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const loadedPdf = await loadingTask.promise;

            setPdfDoc(loadedPdf);
            setRangeEnd(loadedPdf.numPages);
            setStatus(`PDF loaded successfully. Total pages: ${loadedPdf.numPages}`);
        } catch (err) {
            console.error('PDF Load Error details:', err);
            setError(`Failed to load PDF: ${err.message || 'Unknown error'}. Check console for details.`);
            setFile(null);
            setPdfDoc(null);
        }
    };

    const getPageImage = async (pageNumber) => {
        if (!pdfDoc) return null;

        const page = await pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 2.0 }); // Set scale for better quality
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;

        return canvas.toDataURL('image/png');
    };

    const downloadSinglePage = async () => {
        if (!pdfDoc) return;

        setIsProcessing(true);
        setStatus(`Processing page ${singlePage}...`);

        try {
            const imageUrl = await getPageImage(singlePage);
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = `${file.name.replace('.pdf', '')}_page_${singlePage}.png`;
            link.click();
            setStatus(`Page ${singlePage} downloaded.`);
        } catch (err) {
            setError('Failed to process page.');
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadZip = async (start, end) => {
        if (!pdfDoc) return;

        setIsProcessing(true);
        const zip = new JSZip();
        const folder = zip.folder("images");

        try {
            for (let i = start; i <= end; i++) {
                setStatus(`Processing page ${i} of ${pdfDoc.numPages}...`);
                const imageUrl = await getPageImage(i);
                const base64Data = imageUrl.split(',')[1];
                folder.file(`page_${i}.png`, base64Data, { base64: true });
            }

            setStatus('Generating ZIP file...');
            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${file.name.replace('.pdf', '')}_images.zip`;
            link.click();

            setStatus('Download complete!');
            setTimeout(() => setStatus(`PDF loaded. Total pages: ${pdfDoc.numPages}`), 3000);
        } catch (err) {
            console.error(err);
            setError('Failed to generate ZIP.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!pdfDoc) return;

        if (mode === 'single') {
            if (singlePage < 1 || singlePage > pdfDoc.numPages) {
                setError('Invalid page number.');
                return;
            }
            downloadSinglePage();
        } else if (mode === 'range') {
            if (rangeStart < 1 || rangeEnd > pdfDoc.numPages || rangeStart > rangeEnd) {
                setError('Invalid page range.');
                return;
            }
            downloadZip(rangeStart, rangeEnd);
        } else if (mode === 'all') {
            downloadZip(1, pdfDoc.numPages);
        }
    };

    return (
        <div className="w-full">
            <div className="text-center mb-8">
                <div className="bg-green-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-green-600">
                    <Images size={32} />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">PDF to Images</h1>
                <p className="text-gray-600">Convert PDF pages to high-quality images</p>
            </div>

            <div className="space-y-6">
                {/* Upload Area */}
                {!file && (
                    <div className="relative text-center">
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            id="pdf-upload"
                            className="hidden"
                        />
                        <label
                            htmlFor="pdf-upload"
                            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all duration-200"
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <FileUp className="w-12 h-12 mb-4 text-gray-400" />
                                <p className="mb-2 text-sm text-gray-500">
                                    <span className="font-semibold">Click to upload</span> PDF
                                </p>
                            </div>
                        </label>
                    </div>
                )}

                {/* Options Area */}
                {file && pdfDoc && (
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                                    <FileUp size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{file.name}</h3>
                                    <p className="text-sm text-gray-500">{pdfDoc.numPages} Pages</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setFile(null); setPdfDoc(null); }}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                                disabled={isProcessing}
                            >
                                Change File
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${mode === 'single' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-200'}`}>
                                <input type="radio" name="mode" value="single" checked={mode === 'single'} onChange={(e) => setMode(e.target.value)} className="hidden" />
                                <span className="font-semibold block mb-1">Single Page</span>
                                <span className="text-sm text-gray-500">Extract one specific page</span>
                            </label>

                            <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${mode === 'range' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}>
                                <input type="radio" name="mode" value="range" checked={mode === 'range'} onChange={(e) => setMode(e.target.value)} className="hidden" />
                                <span className="font-semibold block mb-1">Page Range</span>
                                <span className="text-sm text-gray-500">Extract a range of pages</span>
                            </label>

                            <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${mode === 'all' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-200'}`}>
                                <input type="radio" name="mode" value="all" checked={mode === 'all'} onChange={(e) => setMode(e.target.value)} className="hidden" />
                                <span className="font-semibold block mb-1">All Pages</span>
                                <span className="text-sm text-gray-500">Extract entire document</span>
                            </label>
                        </div>

                        {/* Dynamic Inputs */}
                        <div className="mb-6">
                            {mode === 'single' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Page Number</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={pdfDoc.numPages}
                                        value={singlePage}
                                        onChange={(e) => setSinglePage(parseInt(e.target.value) || 1)}
                                        className="w-full md:w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>
                            )}

                            {mode === 'range' && (
                                <div className="flex gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Page</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max={pdfDoc.numPages}
                                            value={rangeStart}
                                            onChange={(e) => setRangeStart(parseInt(e.target.value) || 1)}
                                            className="w-full md:w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">End Page</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max={pdfDoc.numPages}
                                            value={rangeEnd}
                                            onChange={(e) => setRangeEnd(parseInt(e.target.value) || 1)}
                                            className="w-full md:w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleDownload}
                            disabled={isProcessing}
                            className={`w-full py-3 px-6 text-white font-semibold rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed
                ${mode === 'single' ? 'bg-green-600 hover:bg-green-700' :
                                    mode === 'range' ? 'bg-blue-600 hover:bg-blue-700' :
                                        'bg-purple-600 hover:bg-purple-700'}`}
                        >
                            {isProcessing ? <Loader2 className="animate-spin" /> : <Download />}
                            {isProcessing ? 'Processing...' : 'Download Images'}
                        </button>
                    </div>
                )}

                {/* Status Messages */}
                {status && (
                    <div className="text-center text-sm font-medium text-gray-600 animate-fadeIn">
                        {status}
                    </div>
                )}
                {error && (
                    <div className="p-4 bg-red-100 text-red-700 rounded-xl flex items-center justify-center gap-2">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PdfToImages;
