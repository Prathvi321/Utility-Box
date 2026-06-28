import https from 'https';

// Simplified list of services for the prompt to keep token count low and execution fast
const servicesMetadata = [
    { id: 'pdf-merger', title: 'PDF Merger', description: 'Combine multiple PDF files into one', keywords: ['pdf', 'merge', 'combine', 'join', 'document'] },
    { id: 'pdf-to-images', title: 'PDF to Images', description: 'Convert PDF pages to ZIP file of images', keywords: ['pdf', 'convert', 'image', 'jpg', 'png', 'extract'] },
    { id: 'qr-generator', title: 'QR Code Generator', description: 'Generate QR codes for text, URLs, and more', keywords: ['qr', 'code', 'generate', 'barcode', 'url', 'scan'] },
    { id: 'image-compressor', title: 'Image Compressor', description: 'Reduce image file sizes without quality loss', keywords: ['image', 'compress', 'reduce', 'size', 'optimize'] },
    { id: 'text-to-speech', title: 'Text to Speech', description: 'Convert text into audio files', keywords: ['text', 'speech', 'audio', 'voice', 'sound', 'tts'] },
    { id: 'color-picker', title: 'Color Picker', description: 'Pick colors from images and get hex codes', keywords: ['color', 'pick', 'hex', 'rgb', 'palette', 'eyedropper'] },
    { id: 'watermark-adder', title: 'Watermark Adder', description: 'Add custom watermarks to your images', keywords: ['watermark', 'image', 'logo', 'brand', 'overlay'] },
    { id: 'image-converter', title: 'Image Converter', description: 'Convert images between different formats', keywords: ['image', 'convert', 'format', 'jpg', 'png', 'webp', 'ico'] },
    { id: 'image-to-pdf', title: 'Image to PDF', description: 'Convert multiple images into a single PDF', keywords: ['image', 'pdf', 'convert', 'combine', 'merge'] },
    { id: 'whatsapp-generator', title: 'WhatsApp Generator', description: 'Generate WhatsApp links and QR codes', keywords: ['whatsapp', 'link', 'qr', 'code', 'message', 'chat'] },
    { id: 'remove-background', title: 'Remove Background', description: 'Remove image backgrounds automatically with AI', keywords: ['background', 'remove', 'ai', 'transparent', 'eraser', 'clear'] },
    { id: 'invoice-generator', title: 'Invoice Generator', description: 'Generate professional GST invoices instantly', keywords: ['invoice', 'gst', 'bill', 'receipt', 'generator'] },
    { id: 'framesnap', title: 'FrameSnap', description: 'Extract high-quality frames from any video instantly.', keywords: ['video', 'frame', 'extract', 'snapshot', 'images', 'framesnap'] },
    { id: 'database-converter', title: 'Database Converter', description: 'Convert SQL ↔ JSON instantly in your browser.', keywords: ['database', 'sql', 'json', 'convert', 'data'] },
    { id: 'base64-converter', title: 'Base64 Encoder/Decoder', description: 'Encode and decode text or file contents locally in your browser.', keywords: ['base64', 'encode', 'decode', 'text', 'file', 'binary'] },
    { id: 'url-encoder', title: 'URL Encoder/Decoder', description: 'Encode and decode URLs, query strings, and URL components.', keywords: ['url', 'encode', 'decode', 'uri', 'query'] },
    { id: 'hash-generator', title: 'Hash Generator', description: 'Generate secure SHA hashes from text in your browser.', keywords: ['hash', 'sha', 'sha-256', 'checksum', 'crypto'] },
    { id: 'csv-json-converter', title: 'CSV to JSON Converter', description: 'Convert CSV data into JSON and JSON arrays back into CSV.', keywords: ['csv', 'json', 'convert', 'table', 'data'] },
    { id: 'dns-tracker', title: 'DNS Tracker', description: 'Track and verify DNS records globally.', keywords: ['dns', 'domain', 'tracker', 'records', 'whois', 'lookup'] }
];

export async function handler(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== "POST") {
        return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
    }

    try {
        let body;
        try {
            body = JSON.parse(event.body);
        } catch (e) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON body" }) };
        }

        const { query } = body;
        if (!query || query.trim() === "") {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing query" }) };
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("Missing GEMINI_API_KEY environment variable");
            return { statusCode: 500, headers, body: JSON.stringify({ error: "Server configuration error: Missing API Key" }) };
        }

        // Formulate the structured query for Gemini
        const systemInstruction = 
            "You are a routing system for a utility website. The user will specify a task they want to perform. " +
            "Based on the task, return ONLY a JSON list containing the exact IDs of the matching service(s) from the catalog. " +
            "If multiple services apply (e.g. compressing an image and converting it), return all matching IDs. " +
            "If no service matches, return an empty array []. " +
            "Your output must be ONLY the raw JSON array (no markdown code blocks, no explanation). Example: [\"pdf-merger\", \"image-to-pdf\"]";

        const promptText = `User task query: "${query}"\n\nCatalog:\n${JSON.stringify(servicesMetadata, null, 2)}`;

        const postData = JSON.stringify({
            contents: [{
                parts: [{ text: `${systemInstruction}\n\n${promptText}` }]
            }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        return new Promise((resolve) => {
            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const result = JSON.parse(data);
                            const textResponse = result?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
                            // Parse it again to ensure it's a valid list
                            const serviceIds = JSON.parse(textResponse.trim());
                            resolve({
                                statusCode: 200,
                                headers,
                                body: JSON.stringify({ matches: serviceIds })
                            });
                        } catch (err) {
                            console.error("Failed to parse Gemini response:", data, err);
                            resolve({
                                statusCode: 200,
                                headers,
                                body: JSON.stringify({ matches: [] }) // Fallback to empty list
                            });
                        }
                    } else {
                        console.error("Gemini API Error:", res.statusCode, data);
                        resolve({
                            statusCode: res.statusCode || 500,
                            headers,
                            body: JSON.stringify({ error: `Upstream API Error: ${data}` })
                        });
                    }
                });
            });

            req.on('error', (e) => {
                console.error("Request Error:", e);
                resolve({
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ error: `Request Error: ${e.message}` })
                });
            });

            req.write(postData);
            req.end();
        });

    } catch (error) {
        console.error("Function Error:", error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: `Internal Server Error: ${error.message}` }) };
    }
}
