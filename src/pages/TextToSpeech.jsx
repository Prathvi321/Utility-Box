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
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }

    const audioRef = useRef(null);

    useEffect(() => {
        // Reset voice when language changes (default to first voice)
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
        <div className="w-full">
            <div className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
                    <Mic className="text-red-600" size={32} />
                    AI Text-to-Speech
                </h1>
                <p className="text-gray-600">Enter your text and select a voice to generate high-quality audio</p>
            </div>

            <div className="space-y-6">
                {/* Text Input */}
                <div>
                    <label htmlFor="textInput" className="block text-sm font-medium text-gray-700 mb-2">Text to Convert</label>
                    <textarea
                        id="textInput"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full h-32 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors duration-200 resize-none"
                        placeholder="Enter the text you want to convert to speech..."
                    />
                </div>

                {/* Voice Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="languageSelect" className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                        <select
                            id="languageSelect"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors duration-200 bg-white"
                        >
                            {Object.entries(languages).map(([code, lang]) => (
                                <option key={code} value={code}>{lang.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="voiceSelect" className="block text-sm font-medium text-gray-700 mb-2">Voice</label>
                        <select
                            id="voiceSelect"
                            value={voice}
                            onChange={(e) => setVoice(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors duration-200 bg-white"
                        >
                            {languages[language]?.voices.map(v => (
                                <option key={v.name} value={v.name}>{v.name} ({v.description})</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className={`w-full py-3 px-6 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                    {isGenerating ? <Loader2 className="animate-spin" /> : <PlayCircle />}
                    {isGenerating ? 'Generating...' : 'Generate Speech'}
                </button>

                {/* Message Box */}
                {message && (
                    <div className={`p-4 rounded-xl flex items-center gap-2 ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {message.type === 'error' && <AlertCircle size={20} />}
                        {message.text}
                    </div>
                )}

                {/* Audio Player and Download */}
                {audioUrl && (
                    <div className={`bg-gray-50 p-6 rounded-xl border border-gray-100 animate-fadeIn`}>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Generated Audio</h3>
                        <audio ref={audioRef} controls src={audioUrl} className="w-full mb-4"></audio>
                        <button
                            onClick={handleDownload}
                            className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                            <Download size={20} />
                            Download Audio
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TextToSpeech;
