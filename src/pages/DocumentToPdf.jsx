import React, { useState, useEffect, useRef } from 'react';
import {
    FileCheck2, UploadCloud, FolderPlus, Trash2, Archive, Zap,
    FileText, Presentation, FileSpreadsheet, FileType, Check,
    AlertCircle, Eye, Download, X, Loader2, ShieldCheck
} from 'lucide-react';
import JSZip from 'jszip';
import DropZone from '../components/DropZone';

/* ─────────────────────────────────────────────
   Load external CDN scripts dynamically
   ───────────────────────────────────────────── */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => resolve();
        s.onerror = (err) => reject(err);
        document.head.appendChild(s);
    });
}

const SUPPORTED_FORMATS = {
    docx: { type: 'word', label: 'Word', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200', icon: FileText },
    pptx: { type: 'ppt', label: 'PowerPoint', badgeClass: 'bg-orange-50 text-orange-700 border-orange-200', icon: Presentation },
    xlsx: { type: 'excel', label: 'Excel', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: FileSpreadsheet },
    xls:  { type: 'excel', label: 'Excel', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: FileSpreadsheet },
    csv:  { type: 'excel', label: 'CSV', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: FileSpreadsheet },
    txt:  { type: 'text', label: 'Text', badgeClass: 'bg-stone-100 text-stone-700 border-stone-200', icon: FileType },
    md:   { type: 'text', label: 'Markdown', badgeClass: 'bg-stone-100 text-stone-700 border-stone-200', icon: FileType }
};

function formatBytes(bytes, decimals = 1) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function getPdfFilename(originalName) {
    const lastDotIndex = originalName.lastIndexOf('.');
    const baseName = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;
    return `${baseName}.pdf`;
}

function getFileExtension(filename) {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex !== -1 ? filename.substring(lastDotIndex + 1).toLowerCase() : '';
}

export default function DocumentToPdf() {
    const [filesQueue, setFilesQueue] = useState([]);
    const [isBatchConverting, setIsBatchConverting] = useState(false);
    const [overallProgress, setOverallProgress] = useState({ visible: false, label: '', percent: 0 });
    const [previewModal, setPreviewModal] = useState({ open: false, title: '', url: '', itemId: null });
    const [scriptsLoaded, setScriptsLoaded] = useState(false);
    const [notification, setNotification] = useState(null);

    const stagingRef = useRef(null);

    // Preload conversion libraries
    useEffect(() => {
        let mounted = true;
        Promise.all([
            loadScript('https://cdn.jsdelivr.net/npm/docx-preview@0.3.2/dist/docx-preview.min.js'),
            loadScript('https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js'),
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js')
        ]).then(() => {
            if (mounted) setScriptsLoaded(true);
        }).catch(err => {
            console.error('Failed to load document conversion scripts:', err);
        });

        return () => {
            mounted = false;
        };
    }, []);

    const showNotification = (title, message, type = 'info') => {
        setNotification({ title, message, type });
        setTimeout(() => setNotification(null), 5000);
    };

    const handleFilesAdded = (incomingFiles) => {
        const fileList = incomingFiles instanceof FileList 
            ? Array.from(incomingFiles) 
            : (Array.isArray(incomingFiles) ? incomingFiles : [incomingFiles]);

        let validCount = 0;
        let legacyOfficeCount = 0;
        let invalidCount = 0;
        const newItems = [];

        fileList.forEach(file => {
            const ext = getFileExtension(file.name);
            if (SUPPORTED_FORMATS[ext]) {
                const id = 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
                newItems.push({
                    id,
                    file,
                    ext,
                    formatInfo: SUPPORTED_FORMATS[ext],
                    originalName: file.name,
                    pdfName: getPdfFilename(file.name),
                    sizeFormatted: formatBytes(file.size),
                    status: 'pending',
                    pdfBlob: null,
                    pdfUrl: null,
                    errorMsg: null
                });
                validCount++;
            } else if (ext === 'doc' || ext === 'ppt') {
                legacyOfficeCount++;
            } else {
                invalidCount++;
            }
        });

        if (legacyOfficeCount > 0) {
            showNotification(
                'Legacy .doc / .ppt format skipped',
                `${legacyOfficeCount} legacy binary file(s) were skipped. Please save them as modern .docx or .pptx files to preserve exact formatting.`,
                'warning'
            );
        } else if (invalidCount > 0 && validCount === 0) {
            showNotification(
                'Unsupported file format',
                'Supported formats: Word (.docx), PowerPoint (.pptx), Excel (.xlsx, .xls, .csv), and Text (.txt, .md).',
                'error'
            );
        }

        if (newItems.length > 0) {
            setFilesQueue(prev => [...prev, ...newItems]);
        }
    };

    /* ── Renderers ── */
    const renderDocxToHost = async (file, docHost) => {
        const arrayBuffer = await file.arrayBuffer();
        await window.docx.renderAsync(arrayBuffer, docHost, null, {
            className: 'docx',
            inWrapper: false,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            ignoreLastRenderedPageBreak: false,
            experimental: false,
            trimXmlDeclaration: true,
            useBase64URL: true
        });

        await new Promise(resolve => setTimeout(resolve, 180));

        const firstSection = docHost.querySelector('section.docx') || docHost.firstElementChild;
        let pageWidthPt = 595.28;
        let pageHeightPt = 841.89;

        if (firstSection) {
            const rect = firstSection.getBoundingClientRect();
            if (rect.width > 50 && rect.height > 50) {
                pageWidthPt = rect.width * 0.75;
                pageHeightPt = rect.height * 0.75;
            }
        }
        return { pageWidthPt, pageHeightPt };
    };

    const renderExcelToHost = async (file, docHost) => {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = window.XLSX.read(arrayBuffer, { type: 'array', cellStyles: true });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error('No sheets found in workbook.');
        }

        let maxCols = 1;
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const ref = worksheet['!ref'];
            if (ref) {
                const range = window.XLSX.utils.decode_range(ref);
                const cols = range.e.c - range.s.c + 1;
                if (cols > maxCols) maxCols = cols;
            }

            const pageDiv = document.createElement('div');
            pageDiv.className = 'excel-sheet-page';

            if (workbook.SheetNames.length > 1) {
                const titleEl = document.createElement('div');
                titleEl.className = 'excel-sheet-title';
                titleEl.textContent = sheetName;
                pageDiv.appendChild(titleEl);
            }

            const htmlTable = window.XLSX.utils.sheet_to_html(worksheet, { editable: false });
            const tableWrapper = document.createElement('div');
            tableWrapper.innerHTML = htmlTable;
            pageDiv.appendChild(tableWrapper);
            docHost.appendChild(pageDiv);
        });

        const isLandscape = maxCols > 6;
        const targetWidthPx = isLandscape ? 1122 : 794;
        docHost.style.width = `${targetWidthPx}px`;

        await new Promise(resolve => setTimeout(resolve, 100));

        return {
            pageWidthPt: isLandscape ? 841.89 : 595.28,
            pageHeightPt: isLandscape ? 595.28 : 841.89
        };
    };

    const renderPptxToHost = async (file, docHost) => {
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        const parser = new DOMParser();

        let slideWidthPx = 960;
        let slideHeightPx = 540;
        const presFile = zip.file('ppt/presentation.xml');
        if (presFile) {
            const presXml = parser.parseFromString(await presFile.async('text'), 'application/xml');
            const sldSz = presXml.getElementsByTagName('p:sldSz')[0];
            if (sldSz) {
                const cx = parseInt(sldSz.getAttribute('cx'), 10);
                const cy = parseInt(sldSz.getAttribute('cy'), 10);
                if (cx > 0 && cy > 0) {
                    slideWidthPx = Math.round((cx / 914400) * 96);
                    slideHeightPx = Math.round((cy / 914400) * 96);
                }
            }
        }

        const slidePaths = Object.keys(zip.files)
            .filter(name => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
            .sort((a, b) => {
                const numA = parseInt(a.match(/slide(\d+)\.xml/i)[1], 10);
                const numB = parseInt(b.match(/slide(\d+)\.xml/i)[1], 10);
                return numA - numB;
            });

        if (slidePaths.length === 0) {
            throw new Error('No slides found in PowerPoint presentation.');
        }

        const mediaCache = {};
        async function getMediaDataUrl(targetPath) {
            if (mediaCache[targetPath]) return mediaCache[targetPath];
            const mediaFile = zip.file(targetPath);
            if (!mediaFile) return null;
            const ext = targetPath.split('.').pop().toLowerCase();
            const mimeMap = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp' };
            const mime = mimeMap[ext] || 'image/png';
            const base64 = await mediaFile.async('base64');
            const dataUrl = `data:${mime};base64,${base64}`;
            mediaCache[targetPath] = dataUrl;
            return dataUrl;
        }

        for (let i = 0; i < slidePaths.length; i++) {
            const slidePath = slidePaths[i];
            const slideXmlText = await zip.file(slidePath).async('text');
            const slideDoc = parser.parseFromString(slideXmlText, 'application/xml');

            const slideFileName = slidePath.split('/').pop();
            const relsPath = `ppt/slides/_rels/${slideFileName}.rels`;
            const relMap = {};
            if (zip.file(relsPath)) {
                const relsDoc = parser.parseFromString(await zip.file(relsPath).async('text'), 'application/xml');
                const rels = relsDoc.getElementsByTagName('Relationship');
                for (let r = 0; r < rels.length; r++) {
                    const rId = rels[r].getAttribute('Id');
                    const target = rels[r].getAttribute('Target');
                    if (target) {
                        const normalizedTarget = target.startsWith('../')
                            ? 'ppt/' + target.replace(/^\.\.\//, '')
                            : target;
                        relMap[rId] = normalizedTarget;
                    }
                }
            }

            const slideDiv = document.createElement('div');
            slideDiv.className = 'pptx-slide-page';
            slideDiv.style.width = `${slideWidthPx}px`;
            slideDiv.style.height = `${slideHeightPx}px`;

            const bgNode = slideDoc.getElementsByTagName('p:bg')[0];
            if (bgNode) {
                const srgb = bgNode.getElementsByTagName('a:srgbClr')[0];
                if (srgb && srgb.getAttribute('val')) {
                    slideDiv.style.backgroundColor = `#${srgb.getAttribute('val')}`;
                }
            }

            const spTree = slideDoc.getElementsByTagName('p:spTree')[0];
            if (spTree) {
                const children = Array.from(spTree.children);
                for (const node of children) {
                    const tagName = node.tagName;

                    if (tagName === 'p:sp') {
                        const xfrm = node.getElementsByTagName('a:xfrm')[0];
                        if (!xfrm) continue;
                        const off = xfrm.getElementsByTagName('a:off')[0];
                        const ext = xfrm.getElementsByTagName('a:ext')[0];
                        if (!off || !ext) continue;

                        const left = (parseInt(off.getAttribute('x') || '0', 10) / 914400) * 96;
                        const top = (parseInt(off.getAttribute('y') || '0', 10) / 914400) * 96;
                        const width = (parseInt(ext.getAttribute('cx') || '0', 10) / 914400) * 96;
                        const height = (parseInt(ext.getAttribute('cy') || '0', 10) / 914400) * 96;

                        const box = document.createElement('div');
                        box.style.position = 'absolute';
                        box.style.left = `${left}px`;
                        box.style.top = `${top}px`;
                        box.style.width = `${width}px`;
                        box.style.minHeight = `${height}px`;
                        box.style.boxSizing = 'border-box';
                        box.style.padding = '4px 8px';
                        box.style.display = 'flex';
                        box.style.flexDirection = 'column';
                        box.style.justifyContent = 'center';

                        const spPr = node.getElementsByTagName('p:spPr')[0];
                        if (spPr) {
                            const solidFill = spPr.getElementsByTagName('a:solidFill')[0];
                            const srgb = solidFill?.getElementsByTagName('a:srgbClr')[0];
                            if (srgb && srgb.getAttribute('val')) {
                                box.style.backgroundColor = `#${srgb.getAttribute('val')}`;
                            }
                        }

                        const paragraphs = Array.from(node.getElementsByTagName('a:p'));
                        let hasText = false;

                        paragraphs.forEach(p => {
                            const pEl = document.createElement('p');
                            pEl.style.margin = '0 0 4px 0';
                            pEl.style.lineHeight = '1.25';

                            const pPr = p.getElementsByTagName('a:pPr')[0];
                            const algn = pPr?.getAttribute('algn');
                            if (algn === 'ctr') pEl.style.textAlign = 'center';
                            else if (algn === 'r') pEl.style.textAlign = 'right';
                            else if (algn === 'just') pEl.style.textAlign = 'justify';

                            const runs = Array.from(p.getElementsByTagName('a:r'));
                            runs.forEach(r => {
                                const tNode = r.getElementsByTagName('a:t')[0];
                                if (!tNode || !tNode.textContent) return;
                                hasText = true;

                                const span = document.createElement('span');
                                span.textContent = tNode.textContent;

                                const rPr = r.getElementsByTagName('a:rPr')[0];
                                if (rPr) {
                                    const sz = rPr.getAttribute('sz');
                                    if (sz) span.style.fontSize = `${(parseInt(sz, 10) / 100) * 1.333}px`;
                                    else span.style.fontSize = '18px';

                                    if (rPr.getAttribute('b') === '1') span.style.fontWeight = '700';
                                    if (rPr.getAttribute('i') === '1') span.style.fontStyle = 'italic';
                                    if (rPr.getAttribute('u') && rPr.getAttribute('u') !== 'none') span.style.textDecoration = 'underline';

                                    const colorSrgb = rPr.getElementsByTagName('a:srgbClr')[0];
                                    if (colorSrgb && colorSrgb.getAttribute('val')) {
                                        span.style.color = `#${colorSrgb.getAttribute('val')}`;
                                    } else {
                                        span.style.color = '#0f172a';
                                    }
                                } else {
                                    span.style.fontSize = '18px';
                                    span.style.color = '#0f172a';
                                }

                                pEl.appendChild(span);
                            });

                            if (pEl.childNodes.length > 0) {
                                box.appendChild(pEl);
                            }
                        });

                        if (hasText || box.style.backgroundColor) {
                            slideDiv.appendChild(box);
                        }
                    }

                    if (tagName === 'p:pic') {
                        const xfrm = node.getElementsByTagName('a:xfrm')[0];
                        const blip = node.getElementsByTagName('a:blip')[0];
                        if (!xfrm || !blip) continue;

                        const rEmbed = blip.getAttribute('r:embed');
                        const mediaTarget = relMap[rEmbed];
                        if (!mediaTarget) continue;

                        const dataUrl = await getMediaDataUrl(mediaTarget);
                        if (!dataUrl) continue;

                        const off = xfrm.getElementsByTagName('a:off')[0];
                        const ext = xfrm.getElementsByTagName('a:ext')[0];
                        if (!off || !ext) continue;

                        const left = (parseInt(off.getAttribute('x') || '0', 10) / 914400) * 96;
                        const top = (parseInt(off.getAttribute('y') || '0', 10) / 914400) * 96;
                        const width = (parseInt(ext.getAttribute('cx') || '0', 10) / 914400) * 96;
                        const height = (parseInt(ext.getAttribute('cy') || '0', 10) / 914400) * 96;

                        const img = document.createElement('img');
                        img.src = dataUrl;
                        img.style.position = 'absolute';
                        img.style.left = `${left}px`;
                        img.style.top = `${top}px`;
                        img.style.width = `${width}px`;
                        img.style.height = `${height}px`;
                        img.style.objectFit = 'contain';
                        slideDiv.appendChild(img);
                    }
                }
            }

            docHost.appendChild(slideDiv);
        }

        await new Promise(resolve => setTimeout(resolve, 150));

        return {
            pageWidthPt: slideWidthPx * 0.75,
            pageHeightPt: slideHeightPx * 0.75
        };
    };

    const renderTextToHost = async (file, docHost) => {
        const textContent = await file.text();
        const pageDiv = document.createElement('div');
        pageDiv.className = 'txt-doc-page';
        pageDiv.textContent = textContent || ' ';
        docHost.appendChild(pageDiv);

        await new Promise(resolve => setTimeout(resolve, 50));

        return {
            pageWidthPt: 595.28,
            pageHeightPt: 841.89
        };
    };

    const processFileToPdfBlob = async (item) => {
        const stagingArea = stagingRef.current;
        const docHost = document.createElement('div');
        docHost.style.background = '#ffffff';
        docHost.style.display = 'inline-block';
        stagingArea.innerHTML = '';
        stagingArea.appendChild(docHost);

        let dimensions = { pageWidthPt: 595.28, pageHeightPt: 841.89 };

        if (item.formatInfo.type === 'word') {
            dimensions = await renderDocxToHost(item.file, docHost);
        } else if (item.formatInfo.type === 'excel') {
            dimensions = await renderExcelToHost(item.file, docHost);
        } else if (item.formatInfo.type === 'ppt') {
            dimensions = await renderPptxToHost(item.file, docHost);
        } else if (item.formatInfo.type === 'text') {
            dimensions = await renderTextToHost(item.file, docHost);
        }

        const orientation = dimensions.pageWidthPt > dimensions.pageHeightPt ? 'landscape' : 'portrait';

        const opt = {
            margin: 0,
            filename: item.pdfName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                letterRendering: true,
                logging: false,
                backgroundColor: '#ffffff'
            },
            jsPDF: {
                unit: 'pt',
                format: [dimensions.pageWidthPt, dimensions.pageHeightPt],
                orientation: orientation,
                compress: true
            },
            pagebreak: { mode: ['css', 'legacy'] }
        };

        const pdfBlob = await window.html2pdf().set(opt).from(docHost).outputPdf('blob');
        stagingArea.innerHTML = '';
        return pdfBlob;
    };

    const convertSingleItem = async (id) => {
        const item = filesQueue.find(f => f.id === id);
        if (!item || item.status === 'converting') return;

        setFilesQueue(prev => prev.map(f => f.id === id ? { ...f, status: 'converting', errorMsg: null } : f));

        try {
            const pdfBlob = await processFileToPdfBlob(item);
            const pdfUrl = URL.createObjectURL(pdfBlob);

            setFilesQueue(prev => prev.map(f => {
                if (f.id === id) {
                    if (f.pdfUrl) URL.revokeObjectURL(f.pdfUrl);
                    return { ...f, status: 'done', pdfBlob, pdfUrl, errorMsg: null };
                }
                return f;
            }));
        } catch (err) {
            console.error('Conversion error for', item.originalName, err);
            setFilesQueue(prev => prev.map(f => f.id === id ? {
                ...f,
                status: 'error',
                errorMsg: `Could not parse ${f.formatInfo.label} file. Ensure it is not corrupted or password-protected.`
            } : f));
        }
    };

    const convertAll = async () => {
        if (isBatchConverting) return;

        const toConvert = filesQueue.filter(f => f.status === 'pending' || f.status === 'error');
        if (toConvert.length === 0) return;

        setIsBatchConverting(true);
        setOverallProgress({ visible: true, label: 'Starting conversion...', percent: 0 });

        let processed = 0;
        const total = toConvert.length;

        for (const item of toConvert) {
            const pctStart = Math.round((processed / total) * 100);
            setOverallProgress({
                visible: true,
                label: `Converting (${processed + 1}/${total}): ${item.originalName}`,
                percent: pctStart
            });

            await convertSingleItem(item.id);
            processed++;
        }

        setOverallProgress({
            visible: true,
            label: `Completed converting ${processed} file(s)!`,
            percent: 100
        });

        setIsBatchConverting(false);

        setTimeout(() => {
            setOverallProgress({ visible: false, label: '', percent: 0 });
        }, 3000);

        showNotification(
            'Batch Conversion Complete',
            `${processed} PDF file(s) generated with original filenames.`,
            'success'
        );
    };

    const downloadSinglePdf = (id) => {
        const item = filesQueue.find(f => f.id === id);
        if (!item || !item.pdfUrl) return;

        const link = document.createElement('a');
        link.href = item.pdfUrl;
        link.download = item.pdfName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadZip = async () => {
        const completedItems = filesQueue.filter(f => f.status === 'done' && f.pdfBlob);
        if (completedItems.length === 0) return;

        try {
            const zip = new JSZip();
            const usedNames = new Map();

            completedItems.forEach(item => {
                let fileName = item.pdfName;
                if (usedNames.has(fileName)) {
                    const count = usedNames.get(fileName) + 1;
                    usedNames.set(fileName, count);
                    const base = fileName.replace(/\.pdf$/i, '');
                    fileName = `${base} (${count}).pdf`;
                } else {
                    usedNames.set(fileName, 1);
                }
                zip.file(fileName, item.pdfBlob);
            });

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const zipUrl = URL.createObjectURL(zipBlob);
            const link = document.createElement('a');
            link.href = zipUrl;
            link.download = 'Converted_Documents_PDF.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(zipUrl), 5000);
        } catch (err) {
            console.error('ZIP error:', err);
            showNotification('ZIP Creation Failed', 'Unable to create ZIP archive. You can download individual PDFs.', 'error');
        }
    };

    const removeItem = (id) => {
        setFilesQueue(prev => {
            const target = prev.find(f => f.id === id);
            if (target?.pdfUrl) URL.revokeObjectURL(target.pdfUrl);
            return prev.filter(f => f.id !== id);
        });
    };

    const clearAll = () => {
        if (isBatchConverting) return;
        filesQueue.forEach(item => {
            if (item.pdfUrl) URL.revokeObjectURL(item.pdfUrl);
        });
        setFilesQueue([]);
    };

    const openPreview = (item) => {
        if (!item.pdfUrl) return;
        setPreviewModal({ open: true, title: item.pdfName, url: item.pdfUrl, itemId: item.id });
    };

    const closePreview = () => {
        setPreviewModal({ open: false, title: '', url: '', itemId: null });
    };

    const completedCount = filesQueue.filter(f => f.status === 'done').length;
    const pendingCount = filesQueue.filter(f => f.status === 'pending' || f.status === 'error').length;

    return (
        <div className="h-full flex flex-col animate-in fade-in duration-500">
            {/* Header row */}
            <div className="compact-service-header justify-between">
                <div className="flex items-center gap-3">
                    <div className="header-icon bg-sage-100 text-sage-600 border border-sage-200">
                        <FileCheck2 size={22} />
                    </div>
                    <div className="min-w-0">
                        <h1>Document to PDF</h1>
                        <p>Convert Word (.docx), PowerPoint (.pptx), Excel (.xlsx, .csv), and Text files to PDF</p>
                    </div>
                </div>

                <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>100% Private • Local Browser Conversion</span>
                </div>
            </div>

            {/* Notification alert */}
            {notification && (
                <div className={`mb-3 p-3 rounded-xl border flex items-center justify-between text-xs font-semibold animate-in fade-in duration-200 ${
                    notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
                    notification.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                    'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}>
                    <div className="flex items-center gap-2">
                        {notification.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
                        <span><strong>{notification.title}:</strong> {notification.message}</span>
                    </div>
                    <button onClick={() => setNotification(null)} className="p-1 hover:bg-black/5 rounded">
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Main grid */}
            <div className="grid lg:grid-cols-[380px_1fr] gap-3 flex-1 min-h-0 overflow-hidden">
                {/* Left Pane: Dropzone & Global Controls */}
                <div className="bg-white/70 rounded-2xl border border-stone-100 p-4 flex flex-col justify-between overflow-hidden relative">
                    <div className="space-y-4 flex flex-col min-h-0 flex-1">
                        <div>
                            <h3 className="text-xs uppercase tracking-widest font-bold text-stone-400 mb-2 flex items-center gap-1.5">
                                <UploadCloud size={14} /> Upload Documents
                            </h3>
                            <DropZone
                                onFileDrop={handleFilesAdded}
                                accept=".docx,.pptx,.xlsx,.xls,.csv,.txt,.md,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain,text/markdown"
                                multiple={true}
                                icon={FolderPlus}
                                title="Click or Drop Documents"
                                subtitle="Word, PowerPoint, Excel, CSV, Text"
                            />
                        </div>

                        {/* Format badges */}
                        <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold text-stone-600">
                            <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">Word (.docx)</span>
                            <span className="px-2 py-0.5 rounded-lg bg-orange-50 text-orange-700 border border-orange-200">PowerPoint (.pptx)</span>
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">Excel (.xlsx, .csv)</span>
                            <span className="px-2 py-0.5 rounded-lg bg-stone-100 text-stone-700 border border-stone-200">Text (.txt, .md)</span>
                        </div>

                        {/* Action buttons */}
                        {filesQueue.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-stone-100">
                                <button
                                    onClick={convertAll}
                                    disabled={isBatchConverting || pendingCount === 0}
                                    className="w-full py-2.5 px-4 bg-sage-900 hover:bg-sage-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                                >
                                    {isBatchConverting ? (
                                        <>
                                            <Loader2 size={15} className="animate-spin" />
                                            <span>Converting Files...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Zap size={15} />
                                            <span>Convert {pendingCount > 0 ? `(${pendingCount})` : 'All'} to PDF</span>
                                        </>
                                    )}
                                </button>

                                {completedCount >= 2 && (
                                    <button
                                        onClick={downloadZip}
                                        className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-stone-200 transition-all"
                                    >
                                        <Archive size={15} className="text-sage-600" />
                                        <span>Download All as ZIP</span>
                                    </button>
                                )}

                                <button
                                    onClick={clearAll}
                                    disabled={isBatchConverting}
                                    className="w-full py-2 px-3 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                                >
                                    <Trash2 size={14} />
                                    <span>Clear Queue</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <p className="text-[11px] text-stone-400 text-center mt-3 pt-2 border-t border-stone-100">
                        Files never leave your machine • Clean layout preservation
                    </p>
                </div>

                {/* Right Pane: Conversion Queue List */}
                <div className="bg-white/70 rounded-2xl border border-stone-100 p-4 flex flex-col min-h-0 overflow-hidden">
                    <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-2">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-stone-900">Conversion Queue</h3>
                            <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-xs font-semibold">
                                {filesQueue.length} {filesQueue.length === 1 ? 'file' : 'files'}
                            </span>
                        </div>
                        <span className="text-xs text-stone-400">
                            {completedCount} converted
                        </span>
                    </div>

                    {/* Overall Progress Bar */}
                    {overallProgress.visible && (
                        <div className="mb-3 p-2.5 bg-sage-50 border border-sage-200 rounded-xl">
                            <div className="flex justify-between text-xs font-bold text-sage-800 mb-1">
                                <span className="truncate max-w-[250px]">{overallProgress.label}</span>
                                <span>{overallProgress.percent}%</span>
                            </div>
                            <div className="w-full bg-sage-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-sage-600 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${overallProgress.percent}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {filesQueue.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-stone-400">
                            <FileCheck2 size={40} className="stroke-1 mb-2 text-stone-300" />
                            <p className="text-sm font-semibold text-stone-600">No files in queue</p>
                            <p className="text-xs text-stone-400 max-w-xs mt-1">
                                Upload Word, PowerPoint, Excel, or Text files on the left to convert them to PDFs.
                            </p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto services-scrollbar space-y-2 pr-1">
                            {filesQueue.map(item => {
                                const IconComponent = item.formatInfo.icon;

                                return (
                                    <div
                                        key={item.id}
                                        className="p-3 bg-white border border-stone-200/80 rounded-xl flex items-center justify-between gap-3 shadow-sm hover:border-sage-300 transition-all"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                                item.status === 'done' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                                item.formatInfo.badgeClass
                                            }`}>
                                                <IconComponent size={18} />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-xs font-bold text-stone-800 truncate max-w-[200px] sm:max-w-xs" title={item.status === 'done' ? item.pdfName : item.originalName}>
                                                        {item.status === 'done' ? item.pdfName : item.originalName}
                                                    </span>
                                                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${item.formatInfo.badgeClass}`}>
                                                        {item.formatInfo.label}
                                                    </span>

                                                    {/* Status indicator */}
                                                    {item.status === 'converting' && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sage-600 bg-sage-50 px-2 py-0.5 rounded-full">
                                                            <Loader2 size={11} className="animate-spin" /> Rendering...
                                                        </span>
                                                    )}
                                                    {item.status === 'done' && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                            <Check size={11} /> Ready
                                                        </span>
                                                    )}
                                                    {item.status === 'error' && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                                            <AlertCircle size={11} /> Failed
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
                                                    <span>{item.sizeFormatted}</span>
                                                    <span>•</span>
                                                    <span className="truncate">Output: <strong className="text-stone-600">{item.pdfName}</strong></span>
                                                </div>

                                                {item.status === 'error' && item.errorMsg && (
                                                    <p className="text-[11px] text-red-600 mt-1">{item.errorMsg}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {item.status === 'pending' && (
                                                <button
                                                    onClick={() => convertSingleItem(item.id)}
                                                    disabled={isBatchConverting}
                                                    className="px-2.5 py-1 text-xs font-bold text-sage-700 bg-sage-50 hover:bg-sage-100 rounded-lg transition-colors"
                                                >
                                                    Convert
                                                </button>
                                            )}

                                            {item.status === 'done' && (
                                                <>
                                                    <button
                                                        onClick={() => openPreview(item)}
                                                        className="p-1.5 text-stone-500 hover:text-sage-700 hover:bg-stone-100 rounded-lg transition-colors"
                                                        title="Preview PDF"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => downloadSinglePdf(item.id)}
                                                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1 transition-all"
                                                        title="Download PDF"
                                                    >
                                                        <Download size={13} />
                                                        <span>Download</span>
                                                    </button>
                                                </>
                                            )}

                                            {item.status === 'error' && (
                                                <button
                                                    onClick={() => convertSingleItem(item.id)}
                                                    className="px-2.5 py-1 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                >
                                                    Retry
                                                </button>
                                            )}

                                            <button
                                                onClick={() => removeItem(item.id)}
                                                disabled={isBatchConverting}
                                                className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Remove"
                                            >
                                                <X size={15} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Modal */}
            {previewModal.open && (
                <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden border border-stone-200">
                        <div className="px-5 py-3 border-b border-stone-200 flex items-center justify-between bg-stone-50">
                            <div className="flex items-center gap-2 truncate">
                                <FileText size={18} className="text-sage-600 shrink-0" />
                                <span className="font-bold text-sm text-stone-800 truncate">{previewModal.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => downloadSinglePdf(previewModal.itemId)}
                                    className="px-3 py-1.5 bg-sage-900 hover:bg-sage-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                                >
                                    <Download size={14} /> Download PDF
                                </button>
                                <button
                                    onClick={closePreview}
                                    className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-200 rounded-lg transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-stone-100 p-2 sm:p-4">
                            <iframe
                                src={previewModal.url}
                                title={previewModal.title}
                                className="w-full h-full rounded-xl bg-white shadow-inner border border-stone-300"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Off-screen staging container for docx/pptx/xlsx/txt renderers */}
            <div id="render-staging-area" ref={stagingRef} aria-hidden="true" />
        </div>
    );
}
