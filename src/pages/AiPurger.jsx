import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  Upload, 
  Download, 
  Trash2, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle, 
  Cpu, 
  Camera, 
  MapPin, 
  Clock, 
  Code,
  FileCode
} from 'lucide-react';

const AiPurger = () => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Scanned tags state
  const [tags, setTags] = useState([]);
  const [originalSize, setOriginalSize] = useState(0);
  const [cleanedSize, setCleanedSize] = useState(0);
  const [toast, setToast] = useState(null);
  
  // Accordion state
  const [activeCategory, setActiveCategory] = useState(null);

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const showToast = (title, desc, type = 'info') => {
    setToast({ title, desc, type });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const readFileAsArrayBuffer = (fileToRead) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("File failed to load inside browser space."));
      reader.readAsArrayBuffer(fileToRead);
    });
  };

  // PNG Stripping
  const processPng = (arrayBuffer) => {
    const view = new DataView(arrayBuffer);
    const rawBytes = new Uint8Array(arrayBuffer);
    
    if (view.getUint32(0) !== 0x89504E47 || view.getUint32(4) !== 0x0D0A1A0A) {
      throw new Error("Invalid PNG signature detected.");
    }

    const detectedTags = [];
    const cleanChunks = [rawBytes.slice(0, 8)];
    let offset = 8;

    while (offset < view.byteLength) {
      if (offset + 8 > view.byteLength) break;
      const length = view.getUint32(offset);
      const type = String.fromCharCode(
        view.getUint8(offset + 4),
        view.getUint8(offset + 5),
        view.getUint8(offset + 6),
        view.getUint8(offset + 7)
      );

      const chunkStart = offset;
      const chunkEnd = offset + 12 + length;
      const chunkData = rawBytes.slice(chunkStart, chunkEnd);

      const isEssential = ['IHDR', 'PLTE', 'IDAT', 'IEND', 'tRNS', 'bKGD', 'hIST'].includes(type);

      if (isEssential) {
        cleanChunks.push(chunkData);
      } else {
        let valueDesc = `Raw chunk size: ${length} bytes`;
        let resolvedCategory = 'software';
        let label = type;

        if (type === 'tEXt' || type === 'zTXt' || type === 'iTXt') {
          const rawContent = rawBytes.slice(offset + 8, offset + 8 + length);
          let keyword = "";
          let i = 0;
          while (i < rawContent.length && rawContent[i] !== 0) {
            keyword += String.fromCharCode(rawContent[i]);
            i++;
          }
          
          label = `${type} (${keyword})`;
          
          if (keyword.toLowerCase().includes('parameters') || keyword.toLowerCase().includes('prompt')) {
            resolvedCategory = 'ai';
            try {
              let textVal = new TextDecoder('utf-8').decode(rawContent.slice(i + 1));
              textVal = textVal.replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, "").trim();
              if (textVal.startsWith('eNp')) {
                textVal = "[Compressed AI prompt parameters stripped]";
              }
              valueDesc = textVal;
            } catch (e) {
              valueDesc = "[AI parameters stripped]";
            }
          } else {
            try {
              let textVal = new TextDecoder('utf-8').decode(rawContent.slice(i + 1));
              valueDesc = textVal.replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, "").trim();
            } catch (e) {
              valueDesc = "Binary text metadata stripped";
            }
          }
        } else if (type === 'pHYs') {
          resolvedCategory = 'device';
          valueDesc = "Physical aspect ratios and resolution metrics.";
        } else if (type === 'tIME') {
          resolvedCategory = 'time';
          valueDesc = "Creation/modification timestamp.";
        } else if (type === 'iCCP') {
          resolvedCategory = 'software';
          valueDesc = "ICC Color profile workspace details.";
        }

        detectedTags.push({ label, value: valueDesc, cat: resolvedCategory });
      }
      offset += 12 + length;
    }

    const totalLength = cleanChunks.reduce((acc, curr) => acc + curr.length, 0);
    const cleanedArray = new Uint8Array(totalLength);
    let writePos = 0;
    cleanChunks.forEach(chunk => {
      cleanedArray.set(chunk, writePos);
      writePos += chunk.length;
    });

    return { buffer: cleanedArray.buffer, tags: detectedTags };
  };

  // JPEG Stripping
  const processJpeg = (arrayBuffer) => {
    const view = new DataView(arrayBuffer);
    const rawBytes = new Uint8Array(arrayBuffer);
    
    if (view.getUint16(0) !== 0xFFD8) {
      throw new Error("Invalid JPEG signature.");
    }

    const detectedTags = [];
    const cleanSegments = [new Uint8Array([0xFF, 0xD8])];
    let offset = 2;

    while (offset < view.byteLength - 1) {
      const marker = view.getUint16(offset);
      
      if (marker === 0xFFD9) {
        cleanSegments.push(new Uint8Array([0xFF, 0xD9]));
        break;
      }

      if ((marker & 0xFF00) !== 0xFF00) {
        offset++;
        continue;
      }

      if (marker === 0xFF01 || (marker >= 0xFFD0 && marker <= 0xFFD7)) {
        cleanSegments.push(new Uint8Array([view.getUint8(offset), view.getUint8(offset+1)]));
        offset += 2;
        continue;
      }

      const segmentLength = view.getUint16(offset + 2);
      const segmentData = rawBytes.slice(offset, offset + 2 + segmentLength);
      const isAppSegment = (marker >= 0xFFE0 && marker <= 0xFFEF);
      const shouldPreserve = !isAppSegment || marker === 0xFFE0;

      if (shouldPreserve) {
        cleanSegments.push(segmentData);
      } else {
        let markerName = `APP${marker - 0xFFE0}`;
        let resolvedCategory = 'software';
        let desc = `Stripped metadata segment (${segmentLength} bytes)`;

        if (marker === 0xFFE1) {
          markerName = "APP1 (EXIF / GPS / XMP Data)";
          const strContent = new TextDecoder('utf-8', { fatal: false }).decode(rawBytes.slice(offset + 4, offset + 2 + segmentLength));
          
          if (strContent.includes("GPSInfo") || strContent.includes("GPS Latitude")) {
            resolvedCategory = "location";
            desc = "GPS coordinates telemetry payload.";
            detectedTags.push({ label: "EXIF Location Metadata", value: "GPS Latitude, Longitude, & Bearing Coordinates", cat: "location" });
          }
          
          if (strContent.includes("Camera") || strContent.includes("Apple") || strContent.includes("Canon") || strContent.includes("Nikon") || strContent.includes("Sony")) {
            resolvedCategory = "device";
            desc = "Hardware metadata, camera body model & lens specs.";
            detectedTags.push({ label: "EXIF Hardware Info", value: "Camera Model, Sensoring Data & Lens Apertures", cat: "device" });
          }

          if (strContent.includes("Software") || strContent.includes("Adobe") || strContent.includes("Photoshop") || strContent.includes("GIMP")) {
            desc = "Image processing tool identifiers.";
            detectedTags.push({ label: "EXIF Software Marker", value: "Image processing tool and compiler signatures", cat: "software" });
          }

          if (strContent.includes("Playground") || strContent.includes("Midjourney") || strContent.includes("StableDiffusion")) {
            resolvedCategory = "ai";
            detectedTags.push({ label: "AI Generation Parameters", value: "AI engine prompt variables and network seeds", cat: "ai" });
          }
        } else if (marker === 0xFFE2) {
          markerName = "APP2 (ICC Color Profile)";
          desc = "Device color space translation table.";
          detectedTags.push({ label: markerName, value: desc, cat: 'software' });
        } else if (marker === 0xFFED) {
          markerName = "APP13 (Photoshop IPTC Metadata)";
          desc = "Copyright configurations, creator identifiers, and workflow metadata.";
          detectedTags.push({ label: markerName, value: desc, cat: 'software' });
        } else {
          detectedTags.push({ label: markerName, value: desc, cat: 'software' });
        }
      }

      offset += 2 + segmentLength;
    }

    const totalLength = cleanSegments.reduce((acc, curr) => acc + curr.length, 0);
    const cleanedArray = new Uint8Array(totalLength);
    let writePos = 0;
    cleanSegments.forEach(segment => {
      cleanedArray.set(segment, writePos);
      writePos += segment.length;
    });

    return { buffer: cleanedArray.buffer, tags: detectedTags };
  };

  // WebP Stripping
  const processWebp = (arrayBuffer) => {
    const view = new DataView(arrayBuffer);
    const rawBytes = new Uint8Array(arrayBuffer);
    
    if (view.getUint32(0) !== 0x52494646 || view.getUint32(8) !== 0x57454250) {
      throw new Error("Invalid WebP signature.");
    }
    
    const detectedTags = [];
    const cleanChunks = [];
    let offset = 12;
    
    while (offset < view.byteLength) {
      if (offset + 8 > view.byteLength) break;
      const type = String.fromCharCode(
        view.getUint8(offset),
        view.getUint8(offset + 1),
        view.getUint8(offset + 2),
        view.getUint8(offset + 3)
      );
      const length = view.getUint32(offset + 4, true);
      const pad = length % 2 === 1 ? 1 : 0;
      const chunkEnd = offset + 8 + length + pad;
      
      if (chunkEnd > view.byteLength) break;
      
      const isMetadata = ['EXIF', 'XMP ', 'ICCP'].includes(type);
      
      if (isMetadata) {
        let cat = 'software';
        if (type === 'EXIF') cat = 'location';
        else if (type === 'XMP ') cat = 'ai';
        
        detectedTags.push({
          label: `WebP ${type.trim()} Segment`,
          value: `Wiped: ${length} bytes of raw metadata payloads.`,
          cat
        });
      } else {
        cleanChunks.push(rawBytes.slice(offset, chunkEnd));
      }
      offset = chunkEnd;
    }
    
    const totalPayloadSize = cleanChunks.reduce((acc, curr) => acc + curr.length, 0) + 4;
    const finalBuffer = new Uint8Array(8 + totalPayloadSize);
    
    finalBuffer.set(rawBytes.slice(0, 4), 0);
    const finalView = new DataView(finalBuffer.buffer);
    finalView.setUint32(4, totalPayloadSize, true);
    finalBuffer.set(rawBytes.slice(8, 12), 8);
    
    let writePos = 12;
    cleanChunks.forEach(chunk => {
      finalBuffer.set(chunk, writePos);
      writePos += chunk.length;
    });
    
    return { buffer: finalBuffer.buffer, tags: detectedTags };
  };

  // MP4 Stripping
  const processMp4 = (arrayBuffer) => {
    const view = new DataView(arrayBuffer);
    const rawBytes = new Uint8Array(arrayBuffer);
    const detectedTags = [];
    
    function stripMetadataBoxes(buffer) {
      const bView = new DataView(buffer);
      const bBytes = new Uint8Array(buffer);
      const cleanedList = [];
      let offset = 0;
      
      while (offset < bView.byteLength) {
        if (offset + 8 > bView.byteLength) break;
        const size = bView.getUint32(offset);
        const type = String.fromCharCode(
          bView.getUint8(offset + 4),
          bView.getUint8(offset + 5),
          bView.getUint8(offset + 6),
          bView.getUint8(offset + 7)
        );
        
        if (size < 8 || offset + size > bView.byteLength) break;
        
        const isMetadataBox = ['udta', 'meta', 'uuid'].includes(type);
        
        if (isMetadataBox) {
          detectedTags.push({
            label: `MP4/MOV ${type.toUpperCase()} Box`,
            value: `Removed ${size} bytes of user metadata/device specifications.`,
            cat: 'software'
          });
        } else if (type === 'moov' || type === 'trak') {
          const headerSize = 8;
          const subBuffer = bBytes.slice(offset + headerSize, offset + size).buffer;
          const subCleaned = stripMetadataBoxes(subBuffer);
          
          const newBoxSize = headerSize + subCleaned.byteLength;
          const newBoxBytes = new Uint8Array(newBoxSize);
          const newBoxView = new DataView(newBoxBytes.buffer);
          
          newBoxView.setUint32(0, newBoxSize);
          newBoxBytes.set(bBytes.slice(offset + 4, offset + 8), 4);
          newBoxBytes.set(new Uint8Array(subCleaned), headerSize);
          
          cleanedList.push(newBoxBytes);
        } else {
          cleanedList.push(bBytes.slice(offset, offset + size));
        }
        
        offset += size;
      }
      
      if (cleanedList.length === 0) return new ArrayBuffer(0);
      const totalSize = cleanedList.reduce((acc, curr) => acc + curr.length, 0);
      const finalBytes = new Uint8Array(totalSize);
      let pos = 0;
      cleanedList.forEach(item => {
        finalBytes.set(item, pos);
        pos += item.length;
      });
      return finalBytes.buffer;
    }
    
    const cleanedBuffer = stripMetadataBoxes(arrayBuffer);
    return { buffer: cleanedBuffer, tags: detectedTags };
  };

  const handleFile = async (selectedFile) => {
    setFile(selectedFile);
    setProcessing(true);
    setSuccess(false);
    setTags([]);
    
    // Simulate slight lag for premium UI animations
    setTimeout(async () => {
      try {
        const arrayBuffer = await readFileAsArrayBuffer(selectedFile);
        const ext = selectedFile.name.split('.').pop().toLowerCase();
        let result;

        if (selectedFile.type.startsWith('image/png')) {
          result = processPng(arrayBuffer);
        } else if (selectedFile.type.startsWith('image/jpeg') || selectedFile.type.startsWith('image/jpg') || ext === 'jpg' || ext === 'jpeg') {
          result = processJpeg(arrayBuffer);
        } else if (selectedFile.type.startsWith('image/webp') || ext === 'webp') {
          result = processWebp(arrayBuffer);
        } else if (selectedFile.type.startsWith('video/mp4') || selectedFile.type.startsWith('video/quicktime') || ['mp4', 'mov'].includes(ext)) {
          result = processMp4(arrayBuffer);
        } else {
          throw new Error("Unsupported media format. Please upload JPEG, PNG, WebP, or MP4/MOV files.");
        }

        const blob = new Blob([result.buffer], { type: selectedFile.type });
        setOriginalSize(selectedFile.size);
        setCleanedSize(blob.size);
        setTags(result.tags);
        setSuccess(true);
        showToast("Scanned & Wiped Successfully!", `All ${result.tags.length} metadata parameters have been stripped client-side.`, 'success');
      } catch (err) {
        showToast("Processing Failed", err.message, "error");
        setFile(null);
      } finally {
        setProcessing(false);
      }
    }, 800);
  };

  const handleDownload = () => {
    if (!file || !success) return;
    
    // Reconstruct cleaned file download URL
    const ext = file.name.split('.').pop().toLowerCase();
    const prefix = file.name.substring(0, file.name.lastIndexOf('.'));
    const finalName = `${prefix}_secured.${ext}`;
    
    // Re-verify the blob output
    const blob = new Blob([new Uint8Array(0)], { type: file.type }); // fallback stub
    const fileUrl = success ? URL.createObjectURL(new Blob([cleanedSize], { type: file.type })) : null;
    
    // We already have processedBlob from standard array streams,
    // let's fetch it via file input file context mapping:
    readFileAsArrayBuffer(file).then(buffer => {
      let result;
      if (file.type.startsWith('image/png')) result = processPng(buffer);
      else if (file.type.startsWith('image/jpeg') || file.type.startsWith('image/jpg')) result = processJpeg(buffer);
      else if (file.type.startsWith('image/webp')) result = processWebp(buffer);
      else result = processMp4(buffer);

      const cleanedBlob = new Blob([result.buffer], { type: file.type });
      const downloadUrl = URL.createObjectURL(cleanedBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = finalName;
      a.click();
      URL.revokeObjectURL(downloadUrl);
    });
  };

  const handleReset = () => {
    setFile(null);
    setSuccess(false);
    setTags([]);
    setOriginalSize(0);
    setCleanedSize(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const toggleAccordion = (cat) => {
    setActiveCategory(activeCategory === cat ? null : cat);
  };

  // Grouped Tag lists
  const groupedTags = React.useMemo(() => {
    const categories = {
      ai: [],
      location: [],
      device: [],
      time: [],
      software: []
    };
    tags.forEach(t => {
      if (categories[t.cat]) {
        categories[t.cat].push(t);
      } else {
        categories.software.push(t);
      }
    });
    return categories;
  }, [tags]);

  const riskScore = React.useMemo(() => {
    if (tags.length === 0) return 0;
    let score = 20; // baseline if there are tags
    if (groupedTags.location.length > 0) score += 40; // GPS is highest risk
    if (groupedTags.device.length > 0) score += 20; // Device info
    if (groupedTags.ai.length > 0) score += 10; // AI footprints
    if (groupedTags.software.length > 0) score += 10; // compiler/software
    return Math.min(score, 100);
  }, [tags, groupedTags]);

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 max-h-[82vh] overflow-hidden">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl border flex items-start space-x-3 shadow-lg max-w-sm transition-all duration-300 ${
          toast.type === 'success' ? 'bg-sage-100 border-sage-300 text-sage-800' : 
          toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 
          'bg-stone-100 border-stone-200 text-stone-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-sage-600 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide">{toast.title}</h4>
            <p className="text-[11px] mt-0.5 opacity-90">{toast.desc}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="compact-service-header flex-shrink-0">
        <div className="header-icon bg-sage-100 text-sage-600 border border-sage-200">
          <ShieldCheck size={20} />
        </div>
        <div className="min-w-0">
          <h1>AI Media Purger</h1>
          <p>Strip AI prompt trails, model hashes, EXIF GPS coordinates, and camera metrics from images and videos locally.</p>
        </div>
      </div>

      {/* Layout Split Panels */}
      <div className="grid lg:grid-cols-12 gap-3 flex-1 min-h-0 overflow-hidden">
        
        {/* Left Control Panel */}
        <section className="lg:col-span-5 flex flex-col gap-3 min-h-0 overflow-hidden">
          
          {/* Dropzone */}
          <div 
            onClick={triggerFileSelect}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center relative group min-h-[160px] ${
              dragActive 
                ? 'border-sage-500 bg-sage-50/50' 
                : 'border-stone-200 bg-white/70 hover:border-sage-400 hover:bg-stone-50/30'
            }`}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept="image/png,image/jpeg,image/jpg,image/webp,video/mp4,video/quicktime"
              onChange={handleInputChange}
            />
            
            {processing ? (
              <div className="space-y-4">
                <div className="relative w-12 h-12 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-stone-200"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-sage-600 border-r-sage-400 animate-spin"></div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-700 tracking-wider uppercase">Scrubbing Metadata...</h4>
                  <p className="text-[10px] text-stone-500 mt-1">Executing binary sanitization buffers</p>
                </div>
              </div>
            ) : success ? (
              <div className="space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-sage-100 border border-sage-200 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-sage-600 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-800 tracking-wide uppercase">METADATA PURGED!</h4>
                  <p className="text-[10px] text-stone-500 mt-0.5">Click download below to get your clean media</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 py-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 flex items-center justify-center border border-stone-200 group-hover:scale-105 transition-transform duration-300">
                  <Upload className="w-5 h-5 text-stone-500" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-stone-700 tracking-wide">Upload Image or Video</h4>
                  <p className="text-[10px] text-stone-500 mt-0.5">Supports PNG, JPG, WebP, MP4, MOV</p>
                </div>
              </div>
            )}
          </div>

          {/* Metrics Card */}
          {file && (
            <div className="bg-white/70 rounded-2xl p-4 border border-stone-100 shadow-sm flex flex-col gap-3 flex-shrink-0 animate-in slide-in-from-left duration-300">
              <div className="flex items-center justify-between border-b border-stone-200/50 pb-2">
                <div className="truncate min-w-0 pr-2">
                  <p className="text-xs font-black text-stone-900 truncate">{file.name}</p>
                  <p className="text-[9px] text-stone-400 uppercase tracking-widest font-bold mt-0.5">{file.type || "Media File"}</p>
                </div>
                <button 
                  onClick={handleReset}
                  className="p-1.5 rounded-lg bg-stone-100 hover:bg-red-50 text-stone-500 hover:text-red-600 transition"
                  title="Remove File"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Exposure meter */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-stone-500">Metadata Exposure Risk</span>
                  <span className={riskScore > 50 ? "text-red-600" : riskScore > 0 ? "text-amber-600" : "text-sage-600"}>
                    {success ? "0% Wiped Clean" : `${riskScore}% Threat`}
                  </span>
                </div>
                <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-gradient-to-r from-sage-500 to-emerald-500 transition-all duration-500" 
                    style={{ width: success ? '100%' : `${100 - riskScore}%` }}
                  ></div>
                  <div 
                    className="h-full bg-red-400 transition-all duration-500" 
                    style={{ width: success ? '0%' : `${riskScore}%` }}
                  ></div>
                </div>
                <p className="text-[9px] text-stone-400 font-semibold leading-relaxed">
                  {success 
                    ? "Sanitization completed. File matches full safety standards." 
                    : "Upload file to analyze security coordinates exposure."}
                </p>
              </div>

              {/* Sizes overview */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-stone-50/50 border border-stone-200/40 p-2.5 rounded-xl text-center">
                  <span className="text-[9px] uppercase text-stone-400 font-bold block">Original</span>
                  <span className="text-xs font-black text-stone-700">{formatBytes(originalSize)}</span>
                </div>
                <div className="bg-stone-50/50 border border-stone-200/40 p-2.5 rounded-xl text-center">
                  <span className="text-[9px] uppercase text-stone-400 font-bold block">Sanitized</span>
                  <span className="text-xs font-black text-sage-700">{success ? formatBytes(cleanedSize) : "Pending"}</span>
                </div>
              </div>

              {/* Action Button */}
              {success && (
                <button 
                  onClick={handleDownload}
                  className="w-full py-2.5 bg-sage-900 hover:bg-sage-800 text-white text-xs font-extrabold rounded-xl transition duration-300 flex items-center justify-center gap-1.5 shadow-lg shadow-stone-300"
                >
                  <Download size={14} /> Download Secured Media
                </button>
              )}
            </div>
          )}

        </section>

        {/* Right Dashboard Auditor Panel */}
        <section className="lg:col-span-7 bg-white/70 rounded-2xl p-4 border border-stone-100 shadow-sm flex flex-col min-h-0 overflow-hidden">
          
          <div className="flex justify-between items-center border-b border-stone-200 pb-3 flex-shrink-0">
            <div>
              <h2 className="text-sm font-black text-stone-900">Metadata Auditor</h2>
              <p className="text-[10px] text-stone-400 font-medium">Binary scan logs details</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-sage-50 border border-sage-100 text-sage-700">
              {tags.length} parameters logged
            </span>
          </div>

          {/* Content container */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 py-3 space-y-3 no-scrollbar">
            
            {tags.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <HelpCircle className="w-12 h-12 text-stone-300 mx-auto" />
                <div>
                  <h4 className="text-xs font-bold text-stone-700">Audit Desk Idle</h4>
                  <p className="text-[10px] text-stone-400 max-w-xs mx-auto leading-relaxed mt-0.5">
                    Scan file binary signatures to list hidden prompts, software compiler markers, and EXIF coordinates.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* AI parameters details */}
                {groupedTags.ai.length > 0 && (
                  <div className="bg-sage-50/50 border border-sage-200/50 rounded-xl p-3.5 space-y-2 animate-in fade-in duration-300">
                    <h3 className="text-[10px] font-black text-sage-800 uppercase tracking-wider flex items-center gap-1">
                      <Cpu size={12} /> AI Generation Logs
                    </h3>
                    <div className="space-y-1.5 text-[11px] leading-relaxed text-stone-600 font-mono bg-white/80 p-2.5 rounded-lg border border-stone-200/40">
                      {groupedTags.ai.map((t, idx) => (
                        <div key={idx} className="border-b border-stone-100 pb-1.5 last:border-0 last:pb-0">
                          <span className="font-bold text-sage-700">{t.label}: </span>
                          <span className="break-all">{t.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categories listings */}
                <div className="space-y-2">
                  
                  {/* Category 1: Location */}
                  <div className="border border-stone-200 rounded-xl overflow-hidden">
                    <button 
                      onClick={() => toggleAccordion('location')}
                      className="w-full bg-stone-50/50 p-3 flex justify-between items-center text-left hover:bg-stone-100/50 transition"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className={groupedTags.location.length > 0 ? "text-red-500" : "text-stone-400"} />
                        <div>
                          <h4 className="text-xs font-bold text-stone-800">Location Metadata (GPS)</h4>
                          <p className="text-[9px] text-stone-400 font-semibold">{groupedTags.location.length > 0 ? `${groupedTags.location.length} details detected` : 'No location telemetry found'}</p>
                        </div>
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                        groupedTags.location.length > 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-sage-50 text-sage-600 border border-sage-100'
                      }`}>
                        {groupedTags.location.length > 0 ? 'Exposed' : 'Clean'}
                      </span>
                    </button>
                    {activeCategory === 'location' && groupedTags.location.length > 0 && (
                      <div className="bg-white p-3 border-t border-stone-100 text-[10px] space-y-1 text-stone-600 max-h-[150px] overflow-y-auto">
                        {groupedTags.location.map((t, idx) => (
                          <div key={idx} className="flex justify-between py-1 border-b border-stone-50 last:border-0">
                            <span className="font-bold">{t.label}</span>
                            <span className="text-stone-500">{t.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Category 2: Device */}
                  <div className="border border-stone-200 rounded-xl overflow-hidden">
                    <button 
                      onClick={() => toggleAccordion('device')}
                      className="w-full bg-stone-50/50 p-3 flex justify-between items-center text-left hover:bg-stone-100/50 transition"
                    >
                      <div className="flex items-center gap-2">
                        <Camera size={14} className={groupedTags.device.length > 0 ? "text-amber-500" : "text-stone-400"} />
                        <div>
                          <h4 className="text-xs font-bold text-stone-800">Device Specifications</h4>
                          <p className="text-[9px] text-stone-400 font-semibold">{groupedTags.device.length > 0 ? `${groupedTags.device.length} parameters detected` : 'No camera hardware profile'}</p>
                        </div>
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                        groupedTags.device.length > 0 ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-sage-50 text-sage-600 border border-sage-100'
                      }`}>
                        {groupedTags.device.length > 0 ? 'Exposed' : 'Clean'}
                      </span>
                    </button>
                    {activeCategory === 'device' && groupedTags.device.length > 0 && (
                      <div className="bg-white p-3 border-t border-stone-100 text-[10px] space-y-1 text-stone-600 max-h-[150px] overflow-y-auto">
                        {groupedTags.device.map((t, idx) => (
                          <div key={idx} className="flex justify-between py-1 border-b border-stone-50 last:border-0">
                            <span className="font-bold">{t.label}</span>
                            <span className="text-stone-500 truncate max-w-[200px]">{t.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Category 3: Time */}
                  <div className="border border-stone-200 rounded-xl overflow-hidden">
                    <button 
                      onClick={() => toggleAccordion('time')}
                      className="w-full bg-stone-50/50 p-3 flex justify-between items-center text-left hover:bg-stone-100/50 transition"
                    >
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-stone-400" />
                        <div>
                          <h4 className="text-xs font-bold text-stone-800">Chronological Timestamps</h4>
                          <p className="text-[9px] text-stone-400 font-semibold">{groupedTags.time.length > 0 ? 'Time telemetry identified' : 'No timestamp tags'}</p>
                        </div>
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-sage-50 text-sage-600 border border-sage-100">
                        {groupedTags.time.length > 0 ? 'Stripped' : 'Clean'}
                      </span>
                    </button>
                    {activeCategory === 'time' && groupedTags.time.length > 0 && (
                      <div className="bg-white p-3 border-t border-stone-100 text-[10px] space-y-1 text-stone-600 max-h-[150px] overflow-y-auto">
                        {groupedTags.time.map((t, idx) => (
                          <div key={idx} className="flex justify-between py-1 border-b border-stone-50 last:border-0">
                            <span className="font-bold">{t.label}</span>
                            <span className="text-stone-500">{t.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Category 4: Software */}
                  <div className="border border-stone-200 rounded-xl overflow-hidden">
                    <button 
                      onClick={() => toggleAccordion('software')}
                      className="w-full bg-stone-50/50 p-3 flex justify-between items-center text-left hover:bg-stone-100/50 transition"
                    >
                      <div className="flex items-center gap-2">
                        <Code size={14} className="text-stone-400" />
                        <div>
                          <h4 className="text-xs font-bold text-stone-800">Software Profiles & Signatures</h4>
                          <p className="text-[9px] text-stone-400 font-semibold">{groupedTags.software.length > 0 ? `${groupedTags.software.length} program profiles discarded` : 'No custom compiler logs'}</p>
                        </div>
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-sage-50 text-sage-600 border border-sage-100">
                        {groupedTags.software.length > 0 ? 'Stripped' : 'Clean'}
                      </span>
                    </button>
                    {activeCategory === 'software' && groupedTags.software.length > 0 && (
                      <div className="bg-white p-3 border-t border-stone-100 text-[10px] space-y-1 text-stone-600 max-h-[150px] overflow-y-auto">
                        {groupedTags.software.map((t, idx) => (
                          <div key={idx} className="flex justify-between py-1 border-b border-stone-50 last:border-0">
                            <span className="font-bold truncate max-w-[120px]">{t.label}</span>
                            <span className="text-stone-500 truncate max-w-[200px]">{t.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </>
            )}

          </div>

          {/* Secure status */}
          <div className="border-t border-stone-200 pt-3 flex justify-between items-center text-[10px] text-stone-400 font-bold flex-shrink-0">
            <span>Secure Array Stream Sandbox</span>
            <span className="text-sage-600 flex items-center gap-0.5"><ShieldCheck size={11} /> 100% Client-Side Protection</span>
          </div>

        </section>

      </div>
    </div>
  );
};

export default AiPurger;
