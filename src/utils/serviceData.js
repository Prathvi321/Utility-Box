import {
    FileStack,
    Images,
    QrCode,
    Minimize2,
    Mic,
    Pipette,
    Stamp,
    RefreshCw,
    FileText,
    MessageCircle,
    Eraser
} from 'lucide-react';

export const services = [
    {
        id: 'pdf-merger',
        title: 'PDF Merger',
        description: 'Combine multiple PDF files into one',
        icon: FileStack,
        color: 'indigo',
        keywords: ['pdf', 'merge', 'combine', 'join', 'unite', 'document', 'file']
    },
    {
        id: 'pdf-to-images',
        title: 'PDF to Images',
        description: 'Convert PDF pages to ZIP file of images',
        icon: Images,
        color: 'green',
        keywords: ['pdf', 'convert', 'image', 'jpg', 'png', 'extract', 'pages', 'zip']
    },
    {
        id: 'qr-generator',
        title: 'QR Code Generator',
        description: 'Generate QR codes for text, URLs, and more',
        icon: QrCode,
        color: 'purple',
        keywords: ['qr', 'code', 'generate', 'barcode', 'url', 'text', 'scan']
    },
    {
        id: 'image-compressor',
        title: 'Image Compressor',
        description: 'Reduce image file sizes without quality loss',
        icon: Minimize2,
        color: 'blue',
        keywords: ['image', 'compress', 'reduce', 'size', 'optimize', 'jpg', 'png', 'quality']
    },
    {
        id: 'text-to-speech',
        title: 'Text to Speech',
        description: 'Convert text into audio files',
        icon: Mic,
        color: 'red',
        keywords: ['text', 'speech', 'audio', 'voice', 'sound', 'read', 'tts', 'convert']
    },
    {
        id: 'color-picker',
        title: 'Color Picker',
        description: 'Pick colors from images and get hex codes',
        icon: Pipette,
        color: 'pink',
        keywords: ['color', 'pick', 'hex', 'rgb', 'palette', 'image', 'eyedropper']
    },
    {
        id: 'watermark-adder',
        title: 'Watermark Adder',
        description: 'Add custom watermarks to your images',
        icon: Stamp,
        color: 'cyan',
        keywords: ['watermark', 'image', 'logo', 'brand', 'overlay', 'protect', 'add']
    },
    {
        id: 'image-converter',
        title: 'Image Converter',
        description: 'Convert images between different formats',
        icon: RefreshCw,
        color: 'teal',
        keywords: ['image', 'convert', 'format', 'jpg', 'png', 'webp', 'ico', 'change']
    },
    {
        id: 'image-to-pdf',
        title: 'Image to PDF',
        description: 'Convert multiple images into a single PDF',
        icon: FileText,
        color: 'amber',
        keywords: ['image', 'pdf', 'convert', 'combine', 'merge', 'document', 'multiple']
    },
    {
        id: 'whatsapp-generator',
        title: 'WhatsApp Generator',
        description: 'Generate WhatsApp links and QR codes',
        icon: MessageCircle,
        color: 'green',
        keywords: ['whatsapp', 'link', 'qr', 'code', 'message', 'chat', 'wa.me', 'pretyped']
    },
    {
        id: 'remove-background',
        title: 'Remove Background',
        description: 'Remove image backgrounds automatically with AI',
        icon: Eraser,
        color: 'orange',
        keywords: ['background', 'remove', 'ai', 'transparent', 'eraser', 'clear', 'cutout']
    }
];
