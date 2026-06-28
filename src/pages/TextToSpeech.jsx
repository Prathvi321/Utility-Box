import React, { useState, useEffect, useRef } from 'react';
import { Mic, Download, Loader2, PlayCircle, AlertCircle } from 'lucide-react';

const languages = {
    'en-US': {
        name: 'English (US)',
        voices: [
            { name: 'Zephyr', description: 'Bright, energetic' },
            { name: 'Puck', description: 'Upbeat, friendly' },
            { name: 'Charon', description: 'Informative, smooth' },
            { name: 'Kore', description: 'Firm, authoritative' },
            { name: 'Fenrir', description: 'Excitable, playful' },
            { name: 'Leda', description: 'Youthful, composed' },
            { name: 'Orus', description: 'Firm, professional' },
        ]
    },
    'es-US': {
        name: 'Spanish (US)',
        voices: [
            { name: 'Zephyr', description: 'Bright, energetic' },
            { name: 'Puck', description: 'Upbeat, friendly' },
            { name: 'Charon', description: 'Informative, smooth' },
            { name: 'Kore', description: 'Firm, authoritative' },
        ]
    },
    'de-DE': {
        name: 'German (DE)',
        voices: [
            { name: 'Zephyr', description: 'Bright, energetic' },
            { name: 'Puck', description: 'Upbeat, friendly' },
            { name: 'Charon', description: 'Informative, smooth' },
            { name: 'Kore', description: 'Firm, authoritative' },
        ]
    },
    'fr-FR': {
        name: 'French (FR)',
        voices: [
            { name: 'Zephyr', description: 'Bright, energetic' },
            { name: 'Puck', description: 'Upbeat, friendly' },
            { name: 'Charon', description: 'Informative, smooth' },
            { name: 'Kore', description: 'Firm, authoritative' },
        ]
    },
    'ja-JP': {
        name: 'Japanese (JP)',
        voices: [
            { name: 'Zephyr', description: 'Bright, energetic' },
            { name: 'Puck', description: 'Upbeat, friendly' },
            { name: 'Charon', description: 'Informative, smooth' },
            { name: 'Kore', description: 'Firm, authoritative' },
        ]
    },
    'hi-IN': {
        name: 'Hindi (IN)',
        voices: [
            { name: 'Zephyr', description: 'Bright, energetic' },
            { name: 'Puck', description: 'Upbeat, friendly' },
            { name: 'Charon', description: 'Informative, smooth' },
            { name: 'Kore', description: 'Firm, authoritative' },
        ]
    }
};

const TextToSpeech = () => {
    const [text, setText] = useState('');
    const [language, setLanguage] = useState('en-US');
    const [voice, setVoice] = useState('Zephyr');
    const [isGenerating, setIsGenerating] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const [message, setMessage] = useState(null);

    const audioRef = useRef(null);

    useEffect(() => {
        if (languages[language]) {
            setVoice(languages[language].voices[0].name);
        }
    }, [language]);

    const base64ToArrayBuffer = (base64) => {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    };

    const pcmToWav = (pcm16, sampleRate) => {
        const dataLength = pcm16.length * 2;
        const buffer = new ArrayBuffer(44 + dataLength);
        const view = new DataView(buffer);
        let offset = 0;

        function writeString(str) {
            for (let i = 0; i < str.length; i++) {
                view.setUint8(offset++, str.charCodeAt(i));
            }
        }

        function writeUint32(val) {
            view.setUint32(offset, val, true);
            offset += 4;
        }

        function writeUint16(val) {
            view.setUint16(offset, val, true);
            offset += 2;
        }

        writeString('RIFF');
        writeUint32(36 + dataLength);
        writeString('WAVE');
        writeString('fmt ');
        writeUint32(16);
        writeUint16(1);
        writeUint16(1);
        writeUint32(sampleRate);
        writeUint32(sampleRate * 2);
        writeUint16(2);
        writeUint16(16);
        writeString('data');
        writeUint32(dataLength);

        const pcmBytes = new Uint8Array(pcm16.buffer);
        for (let i = 0; i < pcmBytes.length; i++) {
            view.setUint8(offset++, pcmBytes[i]);
        }

        return new Blob([view], { type: 'audio/wav' });
    };

    const handleGenerate = async () => {
        if (!text.trim()) {
            setMessage({ type: 'error', text: 'Please enter some text to generate speech.' });
            return;
        }

        setIsGenerating(true);
        setMessage(null);
        setAudioUrl(null);

        const apiUrl = '/.netlify/functions/tts';
        const payload = { text, voice };
        const maxRetries = 3;
        const baseDelay = 1000;
        let retries = 0;

        while (retries < maxRetries) {
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`API error: ${response.status} ${response.statusText}`);
                }

                const result = await response.json();
                const part = result?.candidates?.[0]?.content?.parts?.[0];
                const audioData = part?.inlineData?.data;
                const mimeType = part?.inlineData?.mimeType;

                if (audioData && mimeType && mimeType.startsWith("audio/")) {
                    const sampleRate = parseInt(mimeType.match(/rate=(\d+)/)[1], 10);
                    const pcmData = base64ToArrayBuffer(audioData);
                    const pcm16 = new Int16Array(pcmData);
                    const wavBlob = pcmToWav(pcm16, sampleRate);
                    const url = URL.createObjectURL(wavBlob);

                    setAudioUrl(url);
                    setMessage({ type: 'success', text: 'Audio generated successfully!' });
                    setIsGenerating(false);
                    return;
                } else {
                    throw new Error("Invalid audio data from API.");
                }
            } catch (error) {
                console.error("Generation failed:", error);
                retries++;
                if (retries < maxRetries) {
                    const delay = baseDelay * Math.pow(2, retries);
                    await new Promise(res => setTimeout(res, delay));
                } else {
                    setMessage({ type: 'error', text: 'Failed to generate audio. Please try again later.' });
                    setIsGenerating(false);
                }
            }
        }
    };

    const handleDownload = () => {
        if (audioUrl) {
            const link = document.createElement('a');
            link.href = audioUrl;
            link.download = 'generated-speech.wav';
            link.click();
        }
    };

    return (
        <div className="h-full flex flex-col animate-in fade-in duration-500">
            {/* Compact header row */}
            <div className="compact-service-header">
                <div className="header-icon bg-sage-100 text-sage-600 border border-sage-200">
                    <Mic size={20} />
                </div>
                <div className="min-w-0">
                    <h1>AI Text-to-Speech</h1>
                    <p>Enter text and select a voice to generate high-quality audio.</p>
                </div>
            </div>

            {/* Horizontal layout: text+options left, output right */}
            <div className="grid lg:grid-cols-[1fr_300px] gap-3 flex-1 min-h-0 overflow-hidden">
                {/* Left: Text Input + Voice Options */}
                <div className="bg-white/70 rounded-xl border border-stone-100 shadow-sm p-3 flex flex-col min-h-0 overflow-hidden">
                    <label htmlFor="textInput" className="block text-xs font-bold text-stone-700 mb-1">Text to Convert</label>
                    <textarea
                        id="textInput"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full flex-1 px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-200 transition resize-none bg-stone-50 min-h-0"
                        placeholder="Enter the text you want to convert to speech..."
                    />

                    {/* Voice Options inline row */}
                    <div className="grid grid-cols-2 gap-2 mt-2 flex-shrink-0">
                        <div>
                            <label htmlFor="languageSelect" className="block text-[11px] font-bold text-stone-600 mb-0.5">Language</label>
                            <select
                                id="languageSelect"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full px-2 py-1.5 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-200 transition bg-white"
                            >
                                {Object.entries(languages).map(([code, lang]) => (
                                    <option key={code} value={code}>{lang.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="voiceSelect" className="block text-[11px] font-bold text-stone-600 mb-0.5">Voice</label>
                            <select
                                id="voiceSelect"
                                value={voice}
                                onChange={(e) => setVoice(e.target.value)}
                                className="w-full px-2 py-1.5 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-200 transition bg-white"
                            >
                                {languages[language]?.voices.map(v => (
                                    <option key={v.name} value={v.name}>{v.name} ({v.description})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Right: Generate + Output */}
                <div className="bg-white/70 rounded-xl border border-stone-100 shadow-sm p-3 flex flex-col justify-center">
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full py-2.5 px-4 bg-sage-500 text-white font-bold rounded-xl hover:bg-sage-600 transition text-sm focus:outline-none focus:ring-2 focus:ring-sage-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-sage-200"
                    >
                        {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <PlayCircle size={16} />}
                        {isGenerating ? 'Generating...' : 'Generate Speech'}
                    </button>

                    {/* Message Box */}
                    {message && (
                        <div className={`mt-2 p-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-sage-50 text-sage-700 border border-sage-100'}`}>
                            {message.type === 'error' && <AlertCircle size={13} />}
                            {message.text}
                        </div>
                    )}

                    {/* Audio Player and Download */}
                    {audioUrl && (
                        <div className="mt-3 bg-stone-50 p-3 rounded-xl border border-stone-100">
                            <h3 className="text-xs font-bold text-stone-800 mb-1.5">Generated Audio</h3>
                            <audio ref={audioRef} controls src={audioUrl} className="w-full mb-2" style={{ height: '32px' }}></audio>
                            <button
                                onClick={handleDownload}
                                className="w-full py-2 px-3 bg-sage-900 text-white font-bold rounded-xl hover:bg-sage-700 transition text-xs flex items-center justify-center gap-1.5"
                            >
                                <Download size={13} />
                                Download Audio
                            </button>
                        </div>
                    )}

                    {!audioUrl && !message && (
                        <div className="mt-4 text-center">
                            <div className="bg-sage-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <Mic size={20} className="text-sage-300" />
                            </div>
                            <p className="text-xs text-stone-400 font-medium">Enter text and click Generate to create audio.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TextToSpeech;
