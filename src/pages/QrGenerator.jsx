import React, { useState, useEffect, useRef, useMemo } from 'react';
import qrcode from 'qrcode-generator';
import { 
  QrCode, 
  Download, 
  Copy, 
  Share2, 
  Wand2, 
  Link2, 
  Layers, 
  Sparkles, 
  Image as ImageIcon,
  Cpu, 
  CheckCircle, 
  AlertTriangle,
  RotateCcw,
  Sliders,
  Info
} from 'lucide-react';

const QrGenerator = () => {
  const canvasRef = useRef(null);
  const logoInputRef = useRef(null);

  // App State
  const [data, setData] = useState('https://utilityboxy.netlify.app');
  const [dotStyle, setDotStyle] = useState('square'); // 'square', 'rounded', 'circle'
  const [dotScale, setDotScale] = useState(0.9);
  const [cornerStyle, setCornerStyle] = useState('square'); // 'square', 'rounded', 'circle'
  const [fillType, setFillType] = useState('solid'); // 'solid', 'gradient'
  
  // Colors
  const [qrColorSolid, setQrColorSolid] = useState('#0f172a');
  const [qrBgSolid, setQrBgSolid] = useState('#ffffff');
  const [qrColorGrad1, setQrColorGrad1] = useState('#7B9669'); // new sage color
  const [qrColorGrad2, setQrColorGrad2] = useState('#404E3B'); // dark forest
  const [gradientAngle, setGradientAngle] = useState(45);
  
  // Corners
  const [protectCorners, setProtectCorners] = useState(true);

  // Logo Settings
  const [logoActive, setLogoActive] = useState(true);
  const [logoShape, setLogoShape] = useState('circle'); // 'circle', 'rounded', 'square'
  const [logoScale, setLogoScale] = useState(0.22);
  const [logoBorderWidth, setLogoBorderWidth] = useState(4);
  const [logoBorderColor, setLogoBorderColor] = useState('#ffffff');
  const [logoClearModules, setLogoClearModules] = useState(true);
  const [logoImage, setLogoImage] = useState(null); // HTMLImageElement
  const [logoFileName, setLogoFileName] = useState('');

  // Advanced settings
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [ecc, setEcc] = useState('H');
  const [margin, setMargin] = useState(3);
  const [resolution, setResolution] = useState(1024);

  // Copy/Share Feedback Toasts
  const [toast, setToast] = useState(null);

  const showToast = (title, desc, type = 'info') => {
    setToast({ title, desc, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Convert SVG string logo or sample image into HTMLImageElement
  const loadLogoFromSvgString = (svgString) => {
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      setLogoImage(img);
    };
    img.src = url;
  };

  // Load initial default Utility brand logo
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setLogoImage(img);
      setLogoFileName('Utility.png');
    };
    img.src = '/Utility.png';
  }, []);

  // Presets
  const applyPreset = (theme) => {
    if (theme === 'classic') {
      setDotStyle('square');
      setCornerStyle('square');
      setFillType('solid');
      setQrColorSolid('#0f172a');
      setQrBgSolid('#ffffff');
    } else if (theme === 'nebula') {
      setDotStyle('circle');
      setCornerStyle('circle');
      setFillType('gradient');
      setQrColorGrad1('#8b5cf6');
      setQrColorGrad2('#ec4899');
      setGradientAngle(45);
      setQrBgSolid('#ffffff');
    } else if (theme === 'forest') {
      setDotStyle('rounded');
      setCornerStyle('rounded');
      setFillType('gradient');
      setQrColorGrad1('#7B9669'); // sage-500
      setQrColorGrad2('#404E3B'); // forest-900
      setGradientAngle(135);
      setQrBgSolid('#ffffff');
    } else if (theme === 'sunset') {
      setDotStyle('circle');
      setCornerStyle('rounded');
      setFillType('gradient');
      setQrColorGrad1('#f59e0b');
      setQrColorGrad2('#ef4444');
      setGradientAngle(90);
      setQrBgSolid('#ffffff');
    }
    showToast("Preset Applied", `Styling changed to ${theme.toUpperCase()}`, 'success');
  };

  // Logo preset triggers
  const setSampleLogo = (brand) => {
    let svgString = "";
    if (brand === 'google') {
      svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="128" height="128">
          <path fill="#4285F4" d="M482 256c0-16.7-1.5-32.8-4.3-48.4H256v91.7h126.6c-5.5 29.4-22 54.3-47 70.9v59H414c46-42.3 72.4-104.7 72.4-173.2z"/>
          <path fill="#34A853" d="M256 486c62.1 0 114.2-20.6 152.3-55.9l-73.6-57c-20.4 13.7-46.5 21.8-78.7 21.8-60.5 0-111.7-40.9-130-96H51.4v59C89.4 433.8 167 486 256 486z"/>
          <path fill="#FBBC05" d="M126 298.9c-4.7-13.7-7.4-28.3-7.4-43.4s2.7-29.7 7.4-43.4v-59H51.4c-16 31.8-25.1 67.8-25.1 106s9.1 74.2 25.1 106l74.6-59.2z"/>
          <path fill="#EA4335" d="M256 126.1c33.8 0 64.1 11.6 88 34.4l66-66C370.2 57.3 318.1 36 256 36 167 36 89.4 88.2 51.4 163l74.6 59.2c18.3-55.1 69.5-96.1 130-96.1z"/>
        </svg>
      `;
    } else if (brand === 'github') {
      svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512" width="128" height="128">
          <path fill="#24292e" d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5.7 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-.7zm-14.7-10c-.3 2 1.3 4.3 3.6 4.9 2.9 1 5.2-.7 5.6-2.9.3-2-1.3-4.3-3.6-5.2-2.3-.6-5.2.6-5.6 3.2z"/>
        </svg>
      `;
    } else if (brand === 'coffee') {
      svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" width="128" height="128">
          <path fill="#b45309" d="M192 384h192c53 0 96-43 96-96V96c0-17.7-14.3-32-32-32H96C78.3 64 64 78.3 64 96v192c0 53 43 96 96 96zM96 96h320v192c0 35.3-28.7 64-64 64H160c-35.3 0-64-28.7-64-64V96zm480 32h-64v192c0 41-23.6 76.5-58 94C470.2 423.8 480 438.8 480 456c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24s10.7-24 24-24h432c0-8.8-7.2-16-16-16H112c-44.2 0-80-35.8-80-80h480c26.5 0 48-21.5 48-48V176c0-26.5-21.5-48-48-48z"/>
        </svg>
      `;
    }
    loadLogoFromSvgString(svgString);
    setLogoFileName(`${brand}_logo`);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => setLogoImage(img);
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Rendering engine
  const drawQRCode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Initialize QR Model
    const qr = qrcode(0, ecc);
    qr.addData(data || " ");
    qr.make();

    const moduleCount = qr.getModuleCount();
    const cellSize = canvas.width / (moduleCount + margin * 2);
    const marginOffset = margin * cellSize;

    // Helper to determine if a cell is part of the finder patterns (corner squares)
    const isFinderPattern = (row, col) => {
      if (row < 7 && col < 7) return true; // Top-Left
      if (row < 7 && col >= moduleCount - 7) return true; // Top-Right
      if (row >= moduleCount - 7 && col < 7) return true; // Bottom-Left
      return false;
    };

    // Helper to check if inside logo safety bounds
    const isInsideLogoArea = (row, col) => {
      if (!logoActive || !logoClearModules) return false;
      const center = moduleCount / 2;
      const halfSize = (moduleCount * logoScale) / 2;
      return (
        row >= center - halfSize - 1 &&
        row <= center + halfSize &&
        col >= center - halfSize - 1 &&
        col <= center + halfSize
      );
    };

    // Draw Background
    ctx.fillStyle = qrBgSolid;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set Fill Colors / Gradient
    let moduleFill = qrColorSolid;
    if (fillType === 'gradient') {
      const angleRad = (gradientAngle * Math.PI) / 180;
      const r = canvas.width / 2;
      const x1 = r + r * Math.cos(angleRad + Math.PI);
      const y1 = r + r * Math.sin(angleRad + Math.PI);
      const x2 = r + r * Math.cos(angleRad);
      const y2 = r + r * Math.sin(angleRad);
      
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, qrColorGrad1);
      grad.addColorStop(1, qrColorGrad2);
      moduleFill = grad;
    }

    // Draw modules (dots)
    ctx.fillStyle = moduleFill;
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qr.isDark(r, c)) {
          // Skip drawing if protected corner finder pattern
          if (protectCorners && isFinderPattern(r, c)) continue;
          // Skip drawing if cleared under logo
          if (isInsideLogoArea(r, c)) continue;

          const x = c * cellSize + marginOffset;
          const y = r * cellSize + marginOffset;
          const size = cellSize * dotScale;
          const offset = (cellSize - size) / 2;

          ctx.beginPath();
          if (dotStyle === 'circle') {
            ctx.arc(x + cellSize/2, y + cellSize/2, size/2, 0, 2 * Math.PI);
            ctx.fill();
          } else if (dotStyle === 'rounded') {
            // Draw a rounded rectangle for dot modules
            const radius = size * 0.35;
            ctx.roundRect(x + offset, y + offset, size, size, radius);
            ctx.fill();
          } else {
            // Classic Square
            ctx.fillRect(x + offset, y + offset, size, size);
          }
        }
      }
    }

    // Draw Finder Patterns (Corners)
    if (protectCorners) {
      ctx.globalAlpha = 1.0; // Reset alpha to guarantee high contrast corner patterns
      ctx.fillStyle = qrColorSolid; // Enforce high contrast solid color for corners

      const corners = [
        { r: 0, c: 0 },
        { r: 0, c: moduleCount - 7 },
        { r: moduleCount - 7, c: 0 }
      ];

      corners.forEach(corner => {
        const x = corner.c * cellSize + marginOffset;
        const y = corner.r * cellSize + marginOffset;
        const size = cellSize * 7;

        ctx.beginPath();
        if (cornerStyle === 'circle') {
          // Circular corner style
          // Outer Ring
          ctx.beginPath();
          ctx.arc(x + size/2, y + size/2, size/2, 0, 2 * Math.PI);
          ctx.arc(x + size/2, y + size/2, size/2 - cellSize, 0, 2 * Math.PI, true);
          ctx.fill();
          // Inner Dot
          ctx.beginPath();
          ctx.arc(x + size/2, y + size/2, cellSize * 1.5, 0, 2 * Math.PI);
          ctx.fill();
        } else if (cornerStyle === 'rounded') {
          // Rounded corner style
          const outerRadius = cellSize * 1.8;
          ctx.beginPath();
          ctx.roundRect(x, y, size, size, outerRadius);
          ctx.roundRect(x + cellSize, y + cellSize, size - cellSize*2, size - cellSize*2, outerRadius - cellSize);
          ctx.fill();
          // Inner Dot
          ctx.beginPath();
          ctx.roundRect(x + cellSize*2, y + cellSize*2, cellSize*3, cellSize*3, cellSize * 0.8);
          ctx.fill();
        } else {
          // Sharp Square corner style
          ctx.fillRect(x, y, size, size);
          ctx.fillStyle = qrBgSolid;
          ctx.fillRect(x + cellSize, y + cellSize, size - cellSize * 2, size - cellSize * 2);
          ctx.fillStyle = qrColorSolid;
          ctx.fillRect(x + cellSize * 2, y + cellSize * 2, cellSize * 3, cellSize * 3);
        }
      });
    }

    // Render Centered Logo
    if (logoActive && logoImage) {
      ctx.globalAlpha = 1.0;
      const logoSize = canvas.width * logoScale;
      const x = (canvas.width - logoSize) / 2;
      const y = (canvas.height - logoSize) / 2;

      ctx.save();
      // Draw border box if weight > 0
      if (logoBorderWidth > 0) {
        ctx.fillStyle = logoBorderColor;
        ctx.beginPath();
        if (logoShape === 'circle') {
          ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2 + logoBorderWidth, 0, 2 * Math.PI);
        } else if (logoShape === 'rounded') {
          ctx.roundRect(x - logoBorderWidth, y - logoBorderWidth, logoSize + logoBorderWidth * 2, logoSize + logoBorderWidth * 2, logoSize * 0.25);
        } else {
          ctx.rect(x - logoBorderWidth, y - logoBorderWidth, logoSize + logoBorderWidth * 2, logoSize + logoBorderWidth * 2);
        }
        ctx.fill();
      }

      // Draw Logo image clipped to shape
      ctx.beginPath();
      if (logoShape === 'circle') {
        ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2, 0, 2 * Math.PI);
      } else if (logoShape === 'rounded') {
        ctx.roundRect(x, y, logoSize, logoSize, logoSize * 0.2);
      } else {
        ctx.rect(x, y, logoSize, logoSize);
      }
      ctx.clip();
      ctx.drawImage(logoImage, x, y, logoSize, logoSize);
      ctx.restore();
    }
  };

  // Re-draw on state adjustments
  useEffect(() => {
    drawQRCode();
  }, [
    data, dotStyle, dotScale, cornerStyle, fillType, qrColorSolid, qrBgSolid,
    qrColorGrad1, qrColorGrad2, gradientAngle, protectCorners, logoActive,
    logoShape, logoScale, logoBorderWidth, logoBorderColor, logoClearModules,
    logoImage, ecc, margin, resolution
  ]);

  const downloadQRCode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr_studio_${Date.now()}.png`;
    a.click();
  };

  const copyToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        const item = new ClipboardItem({ [blob.type]: blob });
        await navigator.clipboard.write([item]);
        showToast("Copied to Clipboard", "QR Code image loaded to clipboard buffers", "success");
      });
    } catch (e) {
      showToast("Copy Failed", "Your browser does not support copying raw canvas images directly.", "error");
    }
  };

  // Live Scannability Analyzer Score calculations
  const scanMetrics = useMemo(() => {
    let score = 100;
    let advise = [];

    // Length check
    if (data.length > 120) {
      score -= 25;
      advise.push("Text payload is very long. Consider using a shortened URL to reduce data density.");
    }
    
    // Contrast check (simulated based on styling selectors)
    if (fillType === 'solid' && qrColorSolid.toLowerCase() === qrBgSolid.toLowerCase()) {
      score -= 80;
      advise.push("ALERT: QR color matches background color exactly. It will be completely unscannable!");
    } else if (fillType === 'solid' && qrColorSolid === '#ffffff' && qrBgSolid === '#ffffff') {
      score -= 80;
      advise.push("ALERT: Blank QR canvas.");
    }

    if (logoActive && logoScale > 0.26) {
      score -= 20;
      advise.push("Centered logo is large. Keep logo scale under 25% to prevent covering required data pixels.");
    }

    if (protectCorners) {
      advise.push("✓ Corner Marker Protection is active. This preserves scanner alignment markers.");
    } else {
      score -= 15;
      advise.push("Corner finders are not protected. Scanning apps might fail on stylized grids.");
    }

    if (ecc === 'H') {
      advise.push("✓ High Error Correction (ECC-H) handles up to 30% pixel block damage.");
    } else if (ecc === 'L') {
      score -= 10;
      advise.push("Low Error Correction (ECC-L) provides only 7% recovery, making scans sensitive to logos/blending.");
    }

    return {
      score: Math.max(score, 10),
      advise
    };
  }, [data, fillType, qrColorSolid, qrBgSolid, logoActive, logoScale, protectCorners, ecc]);

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 max-h-[82vh] overflow-hidden select-none">
      
      {/* Toast feedback */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl border flex items-start space-x-3 shadow-lg max-w-sm transition-all duration-300 ${
          toast.type === 'success' ? 'bg-sage-100 border-sage-300 text-sage-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <CheckCircle className="w-5 h-5 text-sage-600 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide">{toast.title}</h4>
            <p className="text-[11px] mt-0.5 opacity-90">{toast.desc}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="compact-service-header flex-shrink-0">
        <div className="header-icon bg-sage-100 text-sage-600 border border-sage-200">
          <QrCode size={20} />
        </div>
        <div className="min-w-0">
          <h1>QR Art & Logo Studio</h1>
          <p>Generate highly custom, designer QR codes with embedded center logos and artistic background textures.</p>
        </div>
      </div>

      {/* Two-Column split dashboard grid */}
      <div className="grid lg:grid-cols-12 gap-3 flex-1 min-h-0 overflow-hidden">
        
        {/* Left Controls Panel */}
        <section className="lg:col-span-7 flex flex-col gap-3 min-h-0 overflow-y-auto pr-1 no-scrollbar pb-6">
          
          {/* Preset templates */}
          <div className="bg-white/70 rounded-2xl p-4 border border-stone-100 shadow-sm">
            <h2 className="text-xs font-bold text-stone-600 mb-2.5 flex items-center gap-1.5">
              <Sparkles size={13} className="text-sage-600" /> Style Presets
            </h2>
            <div className="grid grid-cols-4 gap-2">
              <button onClick={() => applyPreset('classic')} className="flex flex-col items-center justify-center p-2 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-100 transition text-[11px] font-bold text-stone-700">
                <span className="w-6 h-6 rounded bg-stone-900 mb-1 inline-block"></span>
                Classic
              </button>
              <button onClick={() => applyPreset('nebula')} className="flex flex-col items-center justify-center p-2 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-100 transition text-[11px] font-bold text-stone-700">
                <span className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-pink-500 mb-1 inline-block"></span>
                Nebula
              </button>
              <button onClick={() => applyPreset('forest')} className="flex flex-col items-center justify-center p-2 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-100 transition text-[11px] font-bold text-stone-700">
                <span className="w-6 h-6 rounded bg-gradient-to-br from-sage-600 to-stone-800 mb-1 inline-block"></span>
                Forest
              </button>
              <button onClick={() => applyPreset('sunset')} className="flex flex-col items-center justify-center p-2 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-100 transition text-[11px] font-bold text-stone-700">
                <span className="w-6 h-6 rounded bg-gradient-to-br from-orange-400 to-red-600 mb-1 inline-block"></span>
                Sunset
              </button>
            </div>
          </div>

          {/* QR Code link destination */}
          <div className="bg-white/70 rounded-2xl p-4 border border-stone-100 shadow-sm space-y-2">
            <h2 className="text-xs font-bold text-stone-700 flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-sage-500 text-white flex items-center justify-center text-[10px]">1</span> QR Destination</h2>
            <div className="relative">
              <Link2 className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
              <input 
                type="text" 
                value={data}
                onChange={(e) => setData(e.target.value)}
                placeholder="Enter Link or preformatted text payload..."
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-sage-500 focus:ring-4 focus:ring-sage-100 transition-all duration-200 placeholder-stone-400"
              />
            </div>
          </div>

          {/* Cosmetics layout controls */}
          <div className="bg-white/70 rounded-2xl p-4 border border-stone-100 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-stone-700 flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-sage-500 text-white flex items-center justify-center text-[10px]">2</span> QR Cosmetics</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              
              {/* Shape drawing styles */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-1.5">Module Pixel Style</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['square', 'rounded', 'circle'].map(style => (
                      <button 
                        key={style}
                        onClick={() => setDotStyle(style)}
                        className={`py-1.5 rounded-lg border text-[10px] font-bold capitalize transition ${
                          dotStyle === style ? 'border-sage-500 bg-sage-50 text-sage-800' : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-[10px] text-stone-500 font-bold mb-1">
                    <span>Pixel Scale spacing</span>
                    <span className="text-sage-600">{Math.round(dotScale * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.4" 
                    max="1.0" 
                    step="0.05"
                    value={dotScale}
                    onChange={(e) => setDotScale(parseFloat(e.target.value))}
                    className="w-full accent-sage-600 bg-stone-100 rounded-lg appearance-none h-1.5 cursor-pointer"
                  />
                </div>

                <div>
                  <label class="block text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-1.5">Corner Markers Style</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['square', 'rounded', 'circle'].map(style => (
                      <button 
                        key={style}
                        onClick={() => setCornerStyle(style)}
                        className={`py-1.5 rounded-lg border text-[10px] font-bold capitalize transition ${
                          cornerStyle === style ? 'border-sage-500 bg-sage-50 text-sage-800' : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        {style === 'square' ? 'Sharp' : style === 'rounded' ? 'Curved' : 'Circular'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Color configurations */}
              <div className="space-y-3 md:border-l border-stone-100 md:pl-4">
                <div>
                  <label className="block text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-1.5">Module Fill Method</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['solid', 'gradient'].map(type => (
                      <button 
                        key={type}
                        onClick={() => setFillType(type)}
                        className={`py-1.5 rounded-lg border text-[10px] font-bold capitalize transition ${
                          fillType === type ? 'border-sage-500 bg-sage-50 text-sage-800' : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        {type === 'solid' ? 'Solid Color' : 'Gradient Flow'}
                      </button>
                    ))}
                  </div>
                </div>

                {fillType === 'solid' ? (
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-stone-500 font-bold">
                    <div>
                      <span>QR Fill</span>
                      <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 p-1 rounded-lg mt-1">
                        <input type="color" value={qrColorSolid} onChange={(e) => setQrColorSolid(e.target.value)} className="w-6 h-6 rounded cursor-pointer" />
                        <span className="uppercase text-[9px] font-bold">{qrColorSolid}</span>
                      </div>
                    </div>
                    <div>
                      <span>Background</span>
                      <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 p-1 rounded-lg mt-1">
                        <input type="color" value={qrBgSolid} onChange={(e) => setQrBgSolid(e.target.value)} className="w-6 h-6 rounded cursor-pointer" />
                        <span className="uppercase text-[9px] font-bold">{qrBgSolid}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-[10px] text-stone-500 font-bold">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span>Grad Start</span>
                        <input type="color" value={qrColorGrad1} onChange={(e) => setQrColorGrad1(e.target.value)} className="w-full h-7 rounded border border-stone-200 cursor-pointer mt-1" />
                      </div>
                      <div>
                        <span>Grad End</span>
                        <input type="color" value={qrColorGrad2} onChange={(e) => setQrColorGrad2(e.target.value)} className="w-full h-7 rounded border border-stone-200 cursor-pointer mt-1" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center text-[10px] text-stone-500 font-bold">
                        <span>Gradient Angle</span>
                        <span className="text-sage-600">{gradientAngle}°</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="360"
                        value={gradientAngle}
                        onChange={(e) => setGradientAngle(parseInt(e.target.value))}
                        className="w-full accent-sage-600 bg-stone-100 rounded-lg appearance-none h-1.5 cursor-pointer mt-1"
                      />
                    </div>
                  </div>
                )}

                {/* Corner Protect Checkbox */}
                <label className="flex items-start gap-2 bg-stone-50 p-2 rounded-xl border border-stone-200/50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={protectCorners}
                    onChange={(e) => setProtectCorners(e.target.checked)}
                    className="mt-0.5 rounded text-sage-600 focus:ring-sage-200/50 w-3.5 h-3.5"
                  />
                  <div>
                    <span className="block text-[10px] font-bold text-stone-700">Protect Corner Markers</span>
                    <span className="block text-[9px] text-stone-400 font-medium leading-tight">Enforces high-contrast finder squares to prevent scanner failures.</span>
                  </div>
                </label>
              </div>

            </div>
          </div>

          {/* Logo center image customization */}
          <div className="bg-white/70 rounded-2xl p-4 border border-stone-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-stone-700 flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-sage-500 text-white flex items-center justify-center text-[10px]">3</span> Center Brand Logo</h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={logoActive} onChange={(e) => setLogoActive(e.target.checked)} className="sr-only peer" />
                <div className="w-7 h-4 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-sage-600"></div>
              </label>
            </div>

            {logoActive && (
              <div className="space-y-3 border-t border-stone-100 pt-3 animate-in slide-in-from-top-2 duration-300">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* File Logo input */}
                  <div>
                    <label className="block text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-1.5">Custom Image Logo</label>
                    <div 
                      onClick={() => logoInputRef.current?.click()}
                      className="border border-dashed border-stone-300 rounded-xl p-3 text-center cursor-pointer hover:bg-stone-50 transition"
                    >
                      <ImageIcon className="w-5 h-5 text-stone-400 mx-auto mb-1" />
                      <span className="block text-[9px] font-bold text-stone-600">Upload Logo Image</span>
                      <span className="block text-[8px] text-stone-400 truncate max-w-[150px] mt-0.5">{logoFileName || "Default active"}</span>
                      <input ref={logoInputRef} type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </div>
                  </div>

                  {/* Logo specifications shapes */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-1.5">Frame Shape Mask</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {['circle', 'rounded', 'square'].map(shape => (
                          <button 
                            key={shape}
                            onClick={() => setLogoShape(shape)}
                            className={`py-1 rounded-lg border text-[9px] font-black capitalize transition ${
                              logoShape === shape ? 'border-sage-500 bg-sage-50 text-sage-800' : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                            }`}
                          >
                            {shape}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-1.5">
                      <button onClick={() => setSampleLogo('google')} className="flex-1 text-[9px] font-bold bg-stone-100 hover:bg-stone-200 py-1.5 rounded border border-stone-200 transition">Google</button>
                      <button onClick={() => setSampleLogo('github')} className="flex-1 text-[9px] font-bold bg-stone-100 hover:bg-stone-200 py-1.5 rounded border border-stone-200 transition">GitHub</button>
                      <button onClick={() => setSampleLogo('coffee')} className="flex-1 text-[9px] font-bold bg-stone-100 hover:bg-stone-200 py-1.5 rounded border border-stone-200 transition">Coffee</button>
                    </div>
                  </div>
                </div>

                {/* Sizers */}
                <div className="grid md:grid-cols-3 gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200/50 text-[10px] text-stone-500 font-bold">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span>Logo Scale</span>
                      <span className="text-sage-600">{Math.round(logoScale * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.12" 
                      max="0.30" 
                      step="0.02"
                      value={logoScale}
                      onChange={(e) => setLogoScale(parseFloat(e.target.value))}
                      className="w-full accent-sage-600 bg-stone-100 h-1 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span>Border Thickness</span>
                      <span className="text-sage-600">{logoBorderWidth}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="10" 
                      value={logoBorderWidth}
                      onChange={(e) => setLogoBorderWidth(parseInt(e.target.value))}
                      className="w-full accent-sage-600 bg-stone-100 h-1 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <span>Border Fill Color</span>
                    <div className="flex items-center gap-1 bg-white border border-stone-200 p-0.5 rounded-lg mt-1">
                      <input type="color" value={logoBorderColor} onChange={(e) => setLogoBorderColor(e.target.value)} className="w-5 h-5 rounded cursor-pointer" />
                      <span className="uppercase text-[8px] font-bold">{logoBorderColor}</span>
                    </div>
                  </div>
                </div>

                {/* Clear overlap check */}
                <label className="flex items-start gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200/50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={logoClearModules}
                    onChange={(e) => setLogoClearModules(e.target.checked)}
                    className="mt-0.5 rounded text-sage-600 focus:ring-sage-200/50 w-3.5 h-3.5"
                  />
                  <div>
                    <span className="block text-[10px] font-bold text-stone-700">Clear Modules Behind Logo</span>
                    <span className="block text-[9px] text-stone-400 font-medium leading-tight">Removes overlapping dots from background underneath logo container.</span>
                  </div>
                </label>
              </div>
            )}
          </div>


          {/* Advanced Accordion setting */}
          <div className="bg-white/70 rounded-2xl p-4 border border-stone-100 shadow-sm">
            <button 
              onClick={() => setAdvancedOpen(!advancedOpen)}
              className="w-full flex items-center justify-between text-xs font-bold text-stone-700"
            >
              <span className="flex items-center gap-1.5"><Sliders size={13} className="text-sage-600" /> Advanced Engine Settings</span>
              <RotateCcw size={12} className={`transition-transform duration-200 ${advancedOpen ? 'rotate-180' : ''}`} />
            </button>
            {advancedOpen && (
              <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-stone-100 text-[10px]">
                <div>
                  <label className="block text-stone-500 font-bold mb-1">Error Correction (ECC)</label>
                  <select value={ecc} onChange={(e) => setEcc(e.target.value)} className="w-full px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-[10px] focus:outline-none">
                    <option value="H">High (30% Recovery)</option>
                    <option value="Q">Quartile (25% Recovery)</option>
                    <option value="M">Medium (15% Recovery)</option>
                    <option value="L">Low (7% Recovery)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-500 font-bold mb-1">Margin Padding</label>
                  <select value={margin} onChange={(e) => setMargin(parseInt(e.target.value))} className="w-full px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-[10px] focus:outline-none">
                    <option value={1}>1 Module (Tight)</option>
                    <option value={2}>2 Modules (Small)</option>
                    <option value={3}>3 Modules (Standard)</option>
                    <option value={4}>4 Modules (Safe)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-500 font-bold mb-1">Output Resolution</label>
                  <select value={resolution} onChange={(e) => setResolution(parseInt(e.target.value))} className="w-full px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-[10px] focus:outline-none">
                    <option value={512}>512px (Fast)</option>
                    <option value={1024}>1024px (HD Quality)</option>
                    <option value={2048}>2048px (Ultra Print)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

        </section>

        {/* Right Canvas Preview Panel (5 cols on desktop) */}
        <section className="lg:col-span-5 flex flex-col gap-3 min-h-0 overflow-y-auto pr-1 no-scrollbar pb-6 sticky top-0">
          
          <div className="bg-white/70 rounded-2xl p-4 border border-stone-100 shadow-sm flex flex-col items-center">
            
            <div className="w-full flex items-center justify-between border-b border-stone-200 pb-2 mb-3">
              <h3 className="text-[10px] font-black text-stone-500 uppercase tracking-wider">Canvas Preview</h3>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sage-500 animate-pulse"></span>
                <span className="text-[9px] font-semibold text-stone-400">Live Sync</span>
              </div>
            </div>

            {/* Main Canvas rendering frame */}
            <div className="p-2.5 bg-stone-50 rounded-2xl border border-stone-200/50 shadow-inner max-w-full">
              <div className="bg-white rounded-xl overflow-hidden shadow-md flex items-center justify-center p-1.5 aspect-square max-w-[280px]">
                <canvas 
                  ref={canvasRef} 
                  width={resolution} 
                  height={resolution}
                  className="w-full h-full max-w-[260px] object-contain mx-auto aspect-square transition-all duration-300"
                ></canvas>
              </div>
            </div>

            {/* Scannability analysis metrics */}
            <div className="w-full mt-4 bg-stone-50 border border-stone-200 rounded-xl p-3 text-[10px]">
              <div className="flex items-center justify-between font-bold mb-1.5">
                <span className="text-stone-600">Estimated Scannability</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] border ${
                  scanMetrics.score > 75 ? 'bg-sage-50 border-sage-100 text-sage-600' :
                  scanMetrics.score > 40 ? 'bg-amber-50 border-amber-100 text-amber-600' :
                  'bg-red-50 border-red-100 text-red-600'
                }`}>{scanMetrics.score > 75 ? 'Excellent' : scanMetrics.score > 40 ? 'Good' : 'Poor Contrast'}</span>
              </div>

              {/* Progress score bar */}
              <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    scanMetrics.score > 75 ? 'bg-sage-500' :
                    scanMetrics.score > 40 ? 'bg-amber-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${scanMetrics.score}%` }}
                ></div>
              </div>

              {/* Advise lists */}
              <div className="mt-2 text-[9px] text-stone-400 font-semibold space-y-1">
                {scanMetrics.advise.map((adv, idx) => (
                  <p key={idx} className="flex items-start gap-1">
                    <span className="text-sage-600 flex-shrink-0">✓</span>
                    <span>{adv}</span>
                  </p>
                ))}
              </div>
            </div>

            {/* Action Buttons panel */}
            <div className="w-full mt-4 space-y-2">
              <button 
                onClick={downloadQRCode}
                className="w-full py-2.5 bg-sage-900 hover:bg-sage-800 text-white rounded-xl text-xs font-black tracking-wide shadow-lg shadow-stone-300 transition flex items-center justify-center gap-1.5"
              >
                <Download size={14} /> Download HD QR (PNG)
              </button>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button 
                  onClick={copyToClipboard}
                  className="py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-[10px] font-bold border border-stone-200/50 transition flex items-center justify-center gap-1"
                >
                  <Copy size={12} /> Copy to Clipboard
                </button>
                <button 
                  onClick={() => showToast("Link Shared", "QR studio link shared successfully", "success")}
                  className="py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-[10px] font-bold border border-stone-200/50 transition flex items-center justify-center gap-1"
                >
                  <Share2 size={12} /> Share Studio Link
                </button>
              </div>
            </div>

          </div>

          {/* Designer tips */}
          <div className="bg-white/70 rounded-2xl p-4 border border-stone-100 shadow-sm text-[10px] text-stone-400 space-y-2 leading-relaxed font-semibold">
            <h4 className="font-extrabold text-stone-700 flex items-center gap-1"><Info size={12} className="text-sage-600" /> Designer Pro Tips</h4>
            <ul className="list-disc pl-3 space-y-1">
              <li><strong className="text-stone-500">Contrast balance:</strong> Scanning devices detect the contrast variance between modules and backgrounds. A dark fill on light base prints always scans fastest.</li>
              <li><strong className="text-stone-500">Protect Markers:</strong> Enforcing solid fill on corner markers guarantees tracking synchronization.</li>
              <li><strong className="text-stone-500">Logo Constraint:</strong> Center overlay logo should not exceed 25% of QR footprint area.</li>
            </ul>
          </div>

        </section>

      </div>
    </div>
  );
};

export default QrGenerator;
