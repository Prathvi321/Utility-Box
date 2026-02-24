import React, { useState, useRef } from 'react';
import { MessageCircle, Link as LinkIcon, Download, Share2, AlertCircle } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

const WhatsAppGenerator = () => {
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');
    const [generatedUrl, setGeneratedUrl] = useState('');
    const [showResult, setShowResult] = useState(false);
    const [error, setError] = useState('');
    const qrRef = useRef();

    const validateInput = (value) => {
        // Remove non-digits
        const digits = value.replace(/\D/g, '');
        setPhone(digits);

        if (value.length > 0 && !/^\d+$/.test(value)) {
            setError('Please enter only digits.');
        } else {
            setError('');
        }
    };

    const handleGenerate = () => {
        if (!phone || phone.length < 7) {
            setError('Please enter a valid phone number (min 7 digits)');
            return;
        }

        const encodedMessage = encodeURIComponent(message);
        const url = `https://wa.me/${phone}?text=${encodedMessage}`;
        setGeneratedUrl(url);
        setShowResult(true);
        setError('');
    };

    const handleDownload = () => {
        const canvas = qrRef.current.querySelector('canvas');
        if (canvas) {
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'whatsapp-qr.png';
            link.href = url;
            link.click();
        }
    };

    return (
        <div className="w-full">
            <div className="text-center mb-8">
                <div className="bg-green-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-green-600">
                    <MessageCircle size={32} />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">WhatsApp Generator</h1>
                <p className="text-gray-600">Create links and QR codes instantly</p>
            </div>

            <div className="space-y-6">
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        WhatsApp Number (with country code)
                    </label>
                    <input
                        type="text"
                        id="phone"
                        value={phone}
                        onChange={(e) => validateInput(e.target.value)}
                        placeholder="e.g. 15551234567 (Digits only)"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 transition-colors duration-200"
                    />
                    {error && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle size={14} /> {error}
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                        Pre-filled Message (Optional)
                    </label>
                    <textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Hi! I'm interested in..."
                        rows="3"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 transition-colors duration-200 resize-none"
                    />
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={!phone || !!error}
                    className="w-full py-3 px-6 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <LinkIcon size={20} />
                    Generate Link & QR
                </button>

                {showResult && (
                    <div className="mt-8 pt-8 border-t border-gray-100 animate-fadeIn text-center">
                        <p className="text-sm font-semibold text-gray-500 mb-2">Your Link:</p>
                        <a
                            href={generatedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 font-medium break-all hover:underline mb-6 block bg-green-50 p-3 rounded-lg border border-green-100"
                        >
                            {generatedUrl}
                        </a>

                        <div className="flex flex-col items-center gap-4" ref={qrRef}>
                            <div className="p-4 bg-white border-8 border-white rounded-xl shadow-lg">
                                <QRCodeCanvas
                                    value={generatedUrl}
                                    size={200}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>

                            <button
                                onClick={handleDownload}
                                className="mt-2 flex items-center justify-center gap-2 text-gray-700 font-semibold bg-white border border-gray-300 px-6 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                <Download size={18} />
                                Download QR
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WhatsAppGenerator;
