import React, { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import { QrCode, Download, Plus, Trash2, FileText, Loader2 } from 'lucide-react';

const QrGenerator = () => {
    const [mode, setMode] = useState('single'); // 'single' or 'multi'
    // Single mode state
    const [singleUrl, setSingleUrl] = useState('');
    const [singleQrValue, setSingleQrValue] = useState('');

    // Multi mode state
    const [multiUrls, setMultiUrls] = useState(['']);
    const [generatedMultiQrs, setGeneratedMultiQrs] = useState([]);

    const singleQrRef = useRef();
    const multiQrRefs = useRef([]);

    // Single Mode Handlers
    const generateSingle = () => {
        if (!singleUrl.trim()) return;
        setSingleQrValue(singleUrl);
    };

    const downloadSingle = () => {
        const canvas = singleQrRef.current.querySelector('canvas');
        if (canvas) {
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'qrcode.png';
            link.href = url;
            link.click();
        }
    };

    // Multi Mode Handlers
    const addUrlInput = () => {
        setMultiUrls([...multiUrls, '']);
    };

    const removeUrlInput = (index) => {
        const newUrls = [...multiUrls];
        newUrls.splice(index, 1);
        setMultiUrls(newUrls);
    };

    const updateUrlInput = (index, value) => {
        const newUrls = [...multiUrls];
        newUrls[index] = value;
        setMultiUrls(newUrls);
    };

    const generateMulti = () => {
        const validUrls = multiUrls.filter(url => url.trim() !== '');
        setGeneratedMultiQrs(validUrls);
    };

    const downloadAllPdf = () => {
        if (generatedMultiQrs.length === 0) return;

        const doc = new jsPDF('p', 'mm', 'a4');
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        const qrSize = 80;
        const totalVerticalSpace = pageHeight - (2 * qrSize);
        const verticalSpacing = totalVerticalSpace / 3;

        generatedMultiQrs.forEach((url, index) => {
            const qrNumber = index + 1;
            const canvas = multiQrRefs.current[index]?.querySelector('canvas');

            if (canvas) {
                if (qrNumber > 1 && (qrNumber - 1) % 2 === 0) {
                    doc.addPage();
                }

                const isFirstOnPage = (qrNumber - 1) % 2 === 0;
                let y = isFirstOnPage ? verticalSpacing : (2 * verticalSpacing) + qrSize;
                let x = (pageWidth - qrSize) / 2;

                const imageData = canvas.toDataURL('image/png');
                doc.addImage(imageData, 'PNG', x, y, qrSize, qrSize);
            }
        });

        doc.save('qr-codes.pdf');
    };

    return (
        <div className="w-full">
            <div className="text-center mb-8">
                <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
                    <QrCode size={32} />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">QR Code Generator</h1>
                <p className="text-gray-600">Choose your mode and get your QR codes instantly</p>
            </div>

            {/* Mode Selection */}
            <div className="flex justify-center gap-4 mb-8">
                <button
                    onClick={() => setMode('single')}
                    className={`px-6 py-3 font-semibold rounded-xl transition-colors duration-200 ${mode === 'single'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    Single URL
                </button>
                <button
                    onClick={() => setMode('multi')}
                    className={`px-6 py-3 font-semibold rounded-xl transition-colors duration-200 ${mode === 'multi'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    Multiple URLs
                </button>
            </div>

            {/* Single URL Mode */}
            {mode === 'single' && (
                <div className="max-w-md mx-auto space-y-6">
                    <div className="flex flex-col gap-4">
                        <input
                            type="url"
                            value={singleUrl}
                            onChange={(e) => setSingleUrl(e.target.value)}
                            placeholder="Enter URL (e.g., https://example.com)"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                        <button
                            onClick={generateSingle}
                            disabled={!singleUrl}
                            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Generate QR
                        </button>
                    </div>

                    {singleQrValue && (
                        <div className="flex flex-col items-center animate-fadeIn p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
                            <div ref={singleQrRef} className="p-4 bg-white border-4 border-white rounded-xl shadow-lg mb-4">
                                <QRCodeCanvas
                                    value={singleQrValue}
                                    size={200}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>
                            <button
                                onClick={downloadSingle}
                                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <Download size={18} /> Download PNG
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Multi URL Mode */}
            {mode === 'multi' && (
                <div className="max-w-2xl mx-auto space-y-6">
                    <div className="space-y-3">
                        {multiUrls.map((url, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => updateUrlInput(index, e.target.value)}
                                    placeholder={`URL #${index + 1}`}
                                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                                <button
                                    onClick={() => removeUrlInput(index)}
                                    className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                    disabled={multiUrls.length === 1}
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={addUrlInput}
                            className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={18} /> Add URL
                        </button>
                        <button
                            onClick={generateMulti}
                            className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                        >
                            Generate All
                        </button>
                    </div>

                    {generatedMultiQrs.length > 0 && (
                        <div className="space-y-6 pt-6 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-800">Generated QR Codes</h3>
                                <button
                                    onClick={downloadAllPdf}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    <FileText size={18} /> Download PDF
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {generatedMultiQrs.map((url, index) => (
                                    <div key={index} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
                                        <div
                                            ref={el => multiQrRefs.current[index] = el}
                                            className="mb-3"
                                        >
                                            <QRCodeCanvas
                                                value={url}
                                                size={150}
                                                level="H"
                                                includeMargin={true}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 max-w-full truncate px-2">{url}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default QrGenerator;
