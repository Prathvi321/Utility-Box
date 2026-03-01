import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Video, UploadCloud, Settings, Sparkles, DownloadCloud, Archive, Eye, Download, AlertCircle, Images } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';

const FrameSnap = () => {
    const [videoFile, setVideoFile] = useState(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [extractMode, setExtractMode] = useState('interval');
    const [timeStep, setTimeStep] = useState(0.5);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [extractedFrames, setExtractedFrames] = useState([]);
    const [rangeStart, setRangeStart] = useState(1);
    const [rangeEnd, setRangeEnd] = useState(1);

    const [previewModalFrame, setPreviewModalFrame] = useState(null);

    const sourceVideoRef = useRef(null);
    const dropZoneRef = useRef(null);

    // Prevent default drag behaviors
    useEffect(() => {
        const preventDefault = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };
        const events = ['dragenter', 'dragover', 'dragleave', 'drop'];
        events.forEach(eventName => {
            document.addEventListener(eventName, preventDefault, false);
        });
        return () => {
            events.forEach(eventName => {
                document.removeEventListener(eventName, preventDefault, false);
            });
        };
    }, []);

    const handleVideoSelect = (file) => {
        if (file && file.type.startsWith('video/')) {
            setVideoFile(file);
            setVideoUrl(URL.createObjectURL(file));
        } else {
            alert('Please select a valid video file.');
        }
    };

    const handleDrop = (e) => {
        const file = e.dataTransfer.files[0];
        handleVideoSelect(file);
    };

    const resetApp = () => {
        if (isProcessing && !window.confirm("Stop extraction and change video?")) return;
        setVideoFile(null);
        setVideoUrl('');
        setExtractedFrames([]);
        setProgress(0);
    };

    const getFrameDiff = (ctx1, ctx2, width, height) => {
        const data1 = ctx1.getImageData(0, 0, width, height).data;
        const data2 = ctx2.getImageData(0, 0, width, height).data;
        let diff = 0;
        // Sample pixels for performance (every 10th pixel roughly => 40 bytes)
        for (let i = 0; i < data1.length; i += 40) {
            diff += Math.abs(data1[i] - data2[i]);
            diff += Math.abs(data1[i + 1] - data2[i + 1]);
            diff += Math.abs(data1[i + 2] - data2[i + 2]);
        }
        return diff / (width * height);
    };

    const runExtraction = async () => {
        if (isProcessing || !sourceVideoRef.current || !videoUrl) return;

        setIsProcessing(true);
        setExtractedFrames([]);
        setProgress(0);

        const video = sourceVideoRef.current;
        const duration = video.duration || 0;
        if (duration === 0) {
            setIsProcessing(false);
            alert("Video duration is 0, cannot extract frames.");
            return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const prevCanvas = document.createElement('canvas');
        const prevCtx = prevCanvas.getContext('2d', { willReadFrequently: true });

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        prevCanvas.width = video.videoWidth;
        prevCanvas.height = video.videoHeight;

        let currentTime = 0;
        let step = parseFloat(timeStep);
        let count = 0;
        const autoThreshold = 1.5; // Visual difference sensitivity
        const frames = [];

        try {
            while (currentTime <= duration) {
                video.currentTime = currentTime;

                await new Promise(resolve => {
                    const onSeeked = () => {
                        video.removeEventListener('seeked', onSeeked);
                        resolve();
                    };
                    video.addEventListener('seeked', onSeeked);
                });

                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                let shouldSnap = true;
                if (extractMode === 'auto' && count > 0) {
                    const diff = getFrameDiff(ctx, prevCtx, canvas.width, canvas.height);
                    shouldSnap = diff > autoThreshold;
                }

                if (shouldSnap) {
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                    const blob = await (await fetch(dataUrl)).blob();
                    count++;
                    const frameData = {
                        id: count,
                        dataUrl: dataUrl,
                        blob: blob,
                        timestamp: currentTime.toFixed(2)
                    };
                    frames.push(frameData);
                    setExtractedFrames([...frames]);
                    setRangeEnd(count);

                    // Update prev canvas only when we snap
                    prevCtx.drawImage(canvas, 0, 0);
                }

                currentTime += (extractMode === 'auto') ? 0.2 : step;
                const p = Math.min(100, (currentTime / duration) * 100);
                setProgress(p);

                // Allow UI to breathe
                await new Promise(r => setTimeout(r, 0));
            }
        } catch (error) {
            console.error("Extraction error:", error);
        } finally {
            setIsProcessing(false);
            setProgress(100);
            if (frames.length === 0) {
                alert("No frames extracted.");
            }
        }
    };

    const downloadSingleFrame = (frame) => {
        const link = document.createElement('a');
        link.href = frame.dataUrl;
        link.download = `frame_${String(frame.id).padStart(5, '0')}.jpg`;
        link.click();
    };

    const createZipContent = async (framesToZip) => {
        if (framesToZip.length === 0) return;
        const zip = new JSZip();
        const folder = zip.folder("video_frames");
        framesToZip.forEach(frame => {
            const filename = `frame_${String(frame.id).padStart(5, '0')}.jpg`;
            folder.file(filename, frame.blob);
        });
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `frames_${new Date().getTime()}.zip`;
        link.click();
    };

    const downloadAll = () => createZipContent(extractedFrames);

    const downloadRange = () => {
        const start = parseInt(rangeStart, 10);
        const end = parseInt(rangeEnd, 10);
        if (isNaN(start) || isNaN(end) || start < 1 || end > extractedFrames.length || start > end) {
            alert("Invalid range selected.");
            return;
        }
        createZipContent(extractedFrames.filter(f => f.id >= start && f.id <= end));
    };

    return (
        <div className="w-full h-full animate-in fade-in duration-500">
            {!videoFile ? (
                /* Initial Upload State (Centered full box) */
                <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto py-12 px-4">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold mb-6">
                            <Video className="w-5 h-5 text-blue-500" />
                            <span>Video Frame Extractor</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
                            Extract frames with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">precision</span>
                        </h1>
                        <p className="text-lg text-gray-600 font-medium max-w-lg mx-auto">
                            Upload your video to extract every single frame or key intervals in high quality, right in your browser.
                        </p>
                    </div>

                    <div
                        ref={dropZoneRef}
                        onDrop={handleDrop}
                        className="relative w-full border-[3px] border-dashed border-gray-300 rounded-[3rem] p-16 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer group shadow-sm bg-white/50 backdrop-blur-sm"
                    >
                        <input
                            type="file"
                            onChange={(e) => handleVideoSelect(e.target.files[0])}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            accept="video/*"
                        />
                        <div className="flex flex-col items-center">
                            <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-xl shadow-blue-100">
                                <UploadCloud className="w-12 h-12" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900 mb-3 block">Drop your video here</span>
                            <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-4 py-2 rounded-full border border-gray-200">Supports MP4, MOV, WebM</span>
                        </div>
                    </div>
                </div>
            ) : (
                /* Split Pane Layout */
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 h-full">

                    {/* Left Pane: Configuration */}
                    <div className="w-full lg:w-[420px] shrink-0 flex flex-col gap-6">
                        <div className="bg-white/60 backdrop-blur-2xl rounded-[2rem] shadow-sm border border-white p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />

                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <h3 className="font-bold flex items-center gap-2 text-gray-800">
                                    <Settings className="w-5 h-5 text-blue-500" /> Settings
                                </h3>
                                <button onClick={resetApp} disabled={isProcessing} className="text-[10px] text-gray-400 hover:text-rose-500 font-bold uppercase tracking-widest transition-colors disabled:opacity-50">
                                    Change Video
                                </button>
                            </div>

                            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg border border-gray-800 relative z-10 mb-6">
                                <video ref={sourceVideoRef} src={videoUrl} className="w-full h-full" controls playsInline></video>
                            </div>

                            <div className="space-y-6 relative z-10">
                                <div className="space-y-4">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Extraction Method</label>

                                    {/* Interval Option */}
                                    <label className={`block p-4 border-2 rounded-2xl cursor-pointer transition-all ${extractMode === 'interval' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-100 bg-white/50 hover:border-gray-300'}`}>
                                        <div className="flex items-center gap-3">
                                            <input type="radio" value="interval" checked={extractMode === 'interval'} onChange={(e) => setExtractMode(e.target.value)} className="w-5 h-5 text-blue-600" />
                                            <span className="font-bold text-gray-800">Custom Interval</span>
                                        </div>
                                        <AnimatePresence>
                                            {extractMode === 'interval' && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pl-8 pt-4 space-y-2 overflow-hidden">
                                                    <div className="flex justify-between text-xs font-bold text-gray-500">
                                                        <span>Snap every:</span>
                                                        <span className="text-blue-600">{Number(timeStep).toFixed(2)}s</span>
                                                    </div>
                                                    <input type="range" min="0.01" max="1.00" step="0.01" value={timeStep} onChange={(e) => setTimeStep(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </label>

                                    {/* Auto Option */}
                                    <label className={`block p-4 border-2 rounded-2xl cursor-pointer transition-all ${extractMode === 'auto' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-100 bg-white/50 hover:border-gray-300'}`}>
                                        <div className="flex items-center gap-3">
                                            <input type="radio" value="auto" checked={extractMode === 'auto'} onChange={(e) => setExtractMode(e.target.value)} className="w-5 h-5 text-blue-600" />
                                            <div>
                                                <span className="font-bold text-gray-800 block">Identify Key Frames</span>
                                                <span className="text-[10px] text-gray-500 leading-tight block mt-1">Automatically detects large visual changes.</span>
                                            </div>
                                        </div>
                                    </label>
                                </div>

                                {isProcessing && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                                            <span>Processing...</span>
                                            <span>{Math.round(progress)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-200">
                                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={runExtraction}
                                    disabled={isProcessing}
                                    className="w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:grayscale"
                                >
                                    {isProcessing ? <Sparkles className="w-5 h-5 animate-pulse" /> : <Sparkles className="w-5 h-5" />}
                                    {isProcessing ? 'Extracting...' : 'Extract Frames'}
                                </button>
                            </div>
                        </div>

                        {/* Bulk Controls (only show if frames exist) */}
                        <AnimatePresence>
                            {extractedFrames.length > 0 && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/60 backdrop-blur-2xl rounded-[2rem] shadow-sm border border-white p-6 space-y-4">
                                    <h3 className="font-bold text-xs uppercase tracking-widest text-gray-400">Bulk Download</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">From Frame</label>
                                            <input type="number" min="1" max={extractedFrames.length} value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">To Frame</label>
                                            <input type="number" min="1" max={extractedFrames.length} value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                                        </div>
                                    </div>
                                    <button onClick={downloadRange} className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg">
                                        <Archive className="w-4 h-4" />
                                        Download ZIP (Range)
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Pane: Gallery */}
                    <div className="flex-1 bg-white/40 backdrop-blur-md rounded-[2.5rem] border-2 border-dashed border-gray-200/80 p-6 lg:p-8 flex flex-col relative overflow-hidden group min-h-[600px] lg:max-h-full">
                        {/* Header */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 shrink-0 relative z-10">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">Extracted Sequence</h3>
                                <p className="text-sm text-gray-500 font-medium">
                                    {extractedFrames.length > 0 ? `${extractedFrames.length} frames found` : 'No frames yet'}
                                </p>
                            </div>
                            {extractedFrames.length > 0 && (
                                <button onClick={downloadAll} className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2">
                                    <DownloadCloud className="w-5 h-5" /> Download All
                                </button>
                            )}
                        </div>

                        {/* Gallery Grid */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar -mr-4 pr-4 relative z-10">
                            {extractedFrames.length === 0 ? (
                                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center">
                                    <div className="bg-white/50 p-8 rounded-full shadow-sm mb-6 border border-white">
                                        <Images className="w-16 h-16 text-gray-300" />
                                    </div>
                                    <p className="text-lg font-bold text-gray-500">Awaiting Extraction</p>
                                    <p className="text-sm max-w-sm mx-auto mt-2 text-gray-400 font-medium">
                                        Select an extraction method and compile your video to see frames appear here in high quality.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8 border-t border-gray-100/50 pt-4">
                                    {extractedFrames.map((frame) => (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            key={frame.id}
                                            className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group flex flex-col"
                                        >
                                            <div className="aspect-video relative overflow-hidden bg-gray-100 cursor-pointer" onClick={() => setPreviewModalFrame(frame)}>
                                                <img src={frame.dataUrl} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={`Frame ${frame.id}`} loading="lazy" />
                                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                                                    <div className="bg-white/20 backdrop-blur-md text-white p-3 rounded-full border border-white/30 transform scale-50 group-hover:scale-100 transition-all duration-300">
                                                        <Eye className="w-6 h-6" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-4 flex items-center justify-between bg-white border-t border-gray-50">
                                                <div className="min-w-0 pr-4">
                                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1 mt-0.5">F#{frame.id}</p>
                                                    <p className="text-sm font-bold text-gray-700 truncate">{frame.timestamp}s</p>
                                                </div>
                                                <button
                                                    onClick={() => downloadSingleFrame(frame)}
                                                    className="shrink-0 bg-blue-50 p-2.5 rounded-xl text-blue-600 hover:text-white hover:bg-blue-600 transition-colors shadow-sm active:scale-95"
                                                    title="Download Frame"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {previewModalFrame && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
                            onClick={() => setPreviewModalFrame(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="bg-white rounded-[2rem] shadow-2xl overflow-hidden max-w-4xl w-full flex flex-col relative"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">Frame Preview</h3>
                                        <p className="text-sm font-medium text-gray-500 mt-1">Found at {previewModalFrame.timestamp}s</p>
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-3 rounded-full transition-colors active:scale-95" onClick={() => setPreviewModalFrame(null)}>
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                </div>
                                <div className="bg-gray-50/50 p-6 flex items-center justify-center min-h-[40vh] max-h-[60vh] overflow-hidden">
                                    <img
                                        src={previewModalFrame.dataUrl}
                                        className="max-w-full max-h-full object-contain rounded-xl shadow-sm border border-gray-200/50 bg-white"
                                        alt="Frame Preview"
                                    />
                                </div>
                                <div className="p-6 bg-white border-t border-gray-100 flex justify-end gap-3">
                                    <button onClick={() => setPreviewModalFrame(null)} className="px-6 py-3 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors active:scale-95">
                                        Close
                                    </button>
                                    <button onClick={() => downloadSingleFrame(previewModalFrame)} className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2 active:scale-95 shadow-lg shadow-blue-500/20">
                                        <Download className="w-5 h-5" /> Download Frame
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

        </div>
    );
};

export default FrameSnap;
