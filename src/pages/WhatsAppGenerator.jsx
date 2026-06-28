import React, { useState, useRef } from 'react';
import { MessageCircle, Link as LinkIcon, Download, AlertCircle } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

const countryCodesList = [
    { code: '91', name: 'India (+91)' },
    { code: '1', name: 'USA/Canada (+1)' },
    { code: '44', name: 'United Kingdom (+44)' },
    { code: '61', name: 'Australia (+61)' },
    { code: '49', name: 'Germany (+49)' },
    { code: '33', name: 'France (+33)' },
    { code: '55', name: 'Brazil (+55)' },
    { code: 'custom', name: 'Custom (+...)' }
];

const WhatsAppGenerator = () => {
    const [selectedCode, setSelectedCode] = useState('91');
    const [customCode, setCustomCode] = useState('');
    const [localNumber, setLocalNumber] = useState('');
    const [message, setMessage] = useState('');
    const [generatedUrl, setGeneratedUrl] = useState('');
    const [showResult, setShowResult] = useState(false);
    const [error, setError] = useState('');
    const qrRef = useRef();

    const getFullPhone = () => {
        const actualCode = selectedCode === 'custom' ? customCode : selectedCode;
        return actualCode.replace(/\D/g, '') + localNumber.replace(/\D/g, '');
    };

    const handleLocalNumberChange = (value) => {
        const digits = value.replace(/\D/g, '');
        setLocalNumber(digits);
        if (value.length > 0 && !/^\d+$/.test(value)) {
            setError('Please enter only digits.');
        } else {
            setError('');
        }
    };

    const handleCustomCodeChange = (value) => {
        const digits = value.replace(/\D/g, '');
        setCustomCode(digits);
        if (value.length > 0 && !/^\d+$/.test(value)) {
            setError('Please enter only digits for country code.');
        } else {
            setError('');
        }
    };

    const handleGenerate = () => {
        const fullPhone = getFullPhone();
        const activeCode = selectedCode === 'custom' ? customCode : selectedCode;

        if (!activeCode) {
            setError('Please enter or select a country code.');
            return;
        }
        if (!localNumber || localNumber.length < 5) {
            setError('Please enter a valid phone number (min 5 digits).');
            return;
        }
        if (fullPhone.length < 7) {
            setError('Please enter a valid phone number (min 7 total digits).');
            return;
        }

        const encodedMessage = encodeURIComponent(message);
        const url = `https://wa.me/${fullPhone}?text=${encodedMessage}`;
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

    const fullPhoneForValidation = getFullPhone();

    return (
        <div className="h-full flex flex-col animate-in fade-in duration-500">
            {/* Compact header row */}
            <div className="compact-service-header">
                <div className="header-icon bg-sage-100 text-sage-600 border border-sage-200">
                    <MessageCircle size={20} />
                </div>
                <div className="min-w-0">
                    <h1>WhatsApp Link Generator</h1>
                    <p>Create direct WhatsApp links and QR codes instantly.</p>
                </div>
            </div>

            {/* Horizontal layout: inputs left, output right */}
            <div className="grid lg:grid-cols-2 gap-3 flex-1 min-h-0 overflow-hidden">
                {/* Left: Inputs */}
                <div className="bg-white/70 rounded-xl border border-stone-100 shadow-sm p-3 flex flex-col overflow-hidden">
                    <div className="flex-1 flex flex-col gap-3">
                        <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">
                                WhatsApp Number
                            </label>
                            <div className="flex gap-2">
                                <div className="w-1/3 flex flex-col">
                                    <select
                                        value={selectedCode}
                                        onChange={(e) => {
                                            setSelectedCode(e.target.value);
                                            setError('');
                                        }}
                                        className="w-full px-2 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-200 transition bg-stone-50"
                                    >
                                        {countryCodesList.map((item) => (
                                            <option key={item.code} value={item.code}>
                                                {item.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={localNumber}
                                        onChange={(e) => handleLocalNumberChange(e.target.value)}
                                        placeholder="Phone number (digits only)"
                                        className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-200 transition bg-stone-50"
                                    />
                                </div>
                            </div>

                            {selectedCode === 'custom' && (
                                <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <label className="block text-[11px] font-bold text-stone-600 mb-0.5">
                                        Custom Country Code Prefix (digits only)
                                    </label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-3 text-stone-400 text-sm font-semibold">+</span>
                                        <input
                                            type="text"
                                            value={customCode}
                                            onChange={(e) => handleCustomCodeChange(e.target.value)}
                                            placeholder="e.g. 91"
                                            className="w-full pl-6 pr-3 py-1.5 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-sage-500 focus:ring-1 focus:ring-sage-200 transition bg-stone-50"
                                        />
                                    </div>
                                </div>
                            )}

                            {error && (
                                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                    <AlertCircle size={11} /> {error}
                                </p>
                            )}
                        </div>

                        <div className="flex-1 flex flex-col min-h-0">
                            <label htmlFor="message" className="block text-xs font-bold text-stone-700 mb-1">
                                Pre-filled Message (Optional)
                            </label>
                            <textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Hi! I'm interested in..."
                                className="w-full flex-1 px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-200 transition resize-none bg-stone-50 min-h-[60px]"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={!localNumber || !!error || (selectedCode === 'custom' && !customCode)}
                        className="w-full py-2.5 px-4 bg-sage-500 text-white font-bold rounded-xl hover:bg-sage-600 transition text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-3 shadow-lg shadow-sage-200 flex-shrink-0"
                    >
                        <LinkIcon size={15} />
                        Generate Link & QR
                    </button>
                </div>

                {/* Right: Output */}
                <div className="bg-white/70 rounded-xl border border-stone-100 shadow-sm p-3 flex flex-col items-center justify-center min-h-0 overflow-y-auto services-scrollbar">
                    {!showResult ? (
                        <div className="text-center">
                            <div className="bg-sage-50 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-2">
                                <MessageCircle size={24} className="text-sage-300" />
                            </div>
                            <h3 className="text-sm font-bold text-stone-700 mb-1">Awaiting Input</h3>
                            <p className="text-xs text-stone-400 font-medium">Enter a phone number and generate to see your QR code here.</p>
                        </div>
                    ) : (
                        <div className="text-center w-full flex flex-col items-center gap-2">
                            <p className="text-xs font-semibold text-stone-500">Your Link:</p>
                            <a
                                href={generatedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sage-600 font-medium text-xs break-all hover:underline bg-sage-50 p-2 rounded-lg border border-sage-100 w-full"
                            >
                                {generatedUrl}
                            </a>

                            <div className="flex flex-col items-center gap-2" ref={qrRef}>
                                <div className="p-2 bg-white border-4 border-white rounded-xl shadow-lg">
                                    <QRCodeCanvas
                                        value={generatedUrl}
                                        size={130}
                                        level="H"
                                        includeMargin={true}
                                    />
                                </div>

                                <button
                                    onClick={handleDownload}
                                    className="flex items-center justify-center gap-1.5 text-stone-700 font-semibold bg-white border border-stone-200 px-4 py-1.5 rounded-xl hover:bg-stone-50 transition text-xs"
                                >
                                    <Download size={13} />
                                    Download QR
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WhatsAppGenerator;
