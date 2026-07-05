import https from 'https';

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

        const { messages } = body;
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing or invalid messages" }) };
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("Missing GEMINI_API_KEY environment variable");
            return { statusCode: 500, headers, body: JSON.stringify({ error: "Server configuration error: Missing API Key" }) };
        }

        // System Instruction for the AI agent (configuring its name and response style)
        const systemInstruction = {
            parts: [{
                text: "You are an intelligent, helpful AI Agent named 'Utility box AI' for the 'UtilityBox' utility website. " +
                      "When the user asks you about your name (e.g., 'what is your name?' or 'who are you?'), you MUST respond 'I am Utility box AI'. " +
                      "Your goal is to assist users by answering general questions on your own OR by calling specialized browser tools to perform tasks for them. " +
                      "If the user asks a normal query (e.g. 'Who is the President of India?' or 'What is 2+2?'), answer directly on your own; DO NOT call any tools. " +
                      "If the user wants to perform a specific action available as a tool, you MUST call the matching tool. " +
                      "Do not try to explain how the tool works or simulate its output textually. Simply call the tool. " +
                      "When you call a tool, the interface will display the interactive widget inside the chat conversation, allowing the user to complete their task. " +
                      "Always respond in a concise, friendly manner."
            }]
        };

        // Formulate the payload for Gemini API with all catalog tools
        const postData = JSON.stringify({
            contents: messages,
            systemInstruction: systemInstruction,
            tools: [{
                functionDeclarations: [
                    {
                        name: "compress_image",
                        description: "Trigger the image compression tool. Call this when the user asks to compress, shrink, optimize, or resize an image.",
                        parameters: {
                          type: "OBJECT",
                          properties: {
                            maxSizeMB: {
                              type: "NUMBER",
                              description: "Target maximum file size of the compressed image in MB."
                            },
                            maxWidthOrHeight: {
                              type: "NUMBER",
                              description: "Target maximum resolution width/height in pixels. Default is 1920."
                            }
                          }
                        }
                    },
                    {
                        name: "generate_qr_code",
                        description: "Trigger the QR Code generator tool. Call this when the user requests a QR code for a URL or text input.",
                        parameters: {
                          type: "OBJECT",
                          properties: {
                            url: {
                              type: "STRING",
                              description: "The exact URL or text to encode in the QR code."
                            }
                          },
                          required: ["url"]
                        }
                    },
                    {
                        name: "merge_pdf",
                        description: "Trigger the PDF merger tool. Call this when the user asks to merge, combine, or join multiple PDF files.",
                        parameters: {
                          type: "OBJECT",
                          properties: {
                            outputName: {
                              type: "STRING",
                              description: "Suggested output filename for the merged PDF. E.g., 'Merged_Document.pdf'."
                            }
                          }
                        }
                    },
                    {
                        name: "extract_pdf_pages",
                        description: "Trigger the PDF page extractor tool. Call this when the user asks to extract specific pages from a PDF document.",
                        parameters: {
                          type: "OBJECT",
                          properties: {
                            pageRanges: {
                              type: "STRING",
                              description: "The page numbers or ranges to extract (e.g., '4, 6, 8, 10' or '1-3, 5')."
                            },
                            outputName: {
                              type: "STRING",
                              description: "Suggested output filename for the extracted PDF."
                            }
                          },
                          required: ["pageRanges"]
                        }
                    },
                    {
                        name: "generate_pdf_from_text",
                        description: "Trigger the Text-to-PDF Generator tool. Call this when the user pastes text (like student tables, reports, notes, lists) and requests to compile, render, or generate a PDF file from it.",
                        parameters: {
                          type: "OBJECT",
                          properties: {
                            text: {
                              type: "STRING",
                              description: "The formatted text content. AI should format raw tables or layout cleanly before providing it to the tool."
                            },
                            title: {
                              type: "STRING",
                              description: "An optional document title to print in the running header of each page."
                            },
                            outputName: {
                              type: "STRING",
                              description: "Suggested output filename. E.g., 'document.pdf'."
                            }
                          },
                          required: ["text"]
                        }
                    },
                    {
                        name: "text_to_speech",
                        description: "Trigger the Text-to-Speech tool. Call this when the user asks to convert text/script/message to audio/speech/voice.",
                        parameters: {
                          type: "OBJECT",
                          properties: {
                            text: {
                              type: "STRING",
                              description: "The text to convert to audio."
                            },
                            voice: {
                              type: "STRING",
                              description: "The voice to use. Choose one of: 'Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir', 'Leda', 'Orus'."
                            }
                          },
                          required: ["text"]
                        }
                    },
                    {
                        name: "whatsapp_generate",
                        description: "Trigger WhatsApp Link & QR Generator tool. Call this when the user wants to generate a WhatsApp link or QR code with a phone number and message.",
                        parameters: {
                          type: "OBJECT",
                          properties: {
                            phone: {
                              type: "STRING",
                              description: "The phone number with country code (e.g. '+919876543210')."
                            },
                            text: {
                              type: "STRING",
                              description: "Pre-typed WhatsApp text message."
                            }
                          },
                          required: ["phone"]
                        }
                    },
                    {
                        name: "base64_convert",
                        description: "Trigger Base64 Encoder/Decoder. Call this when the user wants to encode text to Base64 or decode Base64 back to text.",
                        parameters: {
                          type: "OBJECT",
                          properties: {
                            text: {
                              type: "STRING",
                              description: "The input text."
                            },
                            mode: {
                              type: "STRING",
                              description: "Choose either 'encode' or 'decode'."
                            }
                          },
                          required: ["text", "mode"]
                        }
                    },
                    {
                        name: "url_encode_decode",
                        description: "Trigger URL Encoder/Decoder. Call this when the user wants to encode query strings or decode URI components.",
                        parameters: {
                          type: "OBJECT",
                          properties: {
                            text: {
                              type: "STRING",
                              description: "The input URL or text."
                            },
                            mode: {
                              type: "STRING",
                              description: "Choose either 'encode' or 'decode'."
                            }
                          },
                          required: ["text", "mode"]
                        }
                    },
                    {
                        name: "hash_generate",
                        description: "Trigger Secure Hash Generator. Call this when the user wants to generate secure cryptographic SHA hashes (like SHA-256) from text.",
                        parameters: {
                          type: "OBJECT",
                          properties: {
                            text: {
                              type: "STRING",
                              description: "The text to hash."
                            },
                            algorithm: {
                              type: "STRING",
                              description: "The hash algorithm (e.g., 'SHA-256', 'SHA-1', 'SHA-512')."
                            }
                          },
                          required: ["text"]
                        }
                    },
                    {
                        name: "csv_json_convert",
                        description: "Trigger CSV-to-JSON and JSON-to-CSV Converter. Call this when the user wants to convert spreadsheet tabular data to JSON, or JSON back to CSV.",
                        parameters: {
                          type: "OBJECT",
                          properties: {
                            data: {
                              type: "STRING",
                              description: "CSV or JSON text."
                            },
                            direction: {
                              type: "STRING",
                              description: "Direction of conversion: 'csv-to-json' or 'json-to-csv'."
                            }
                          },
                          required: ["data"]
                        }
                    },
                    {
                        name: "dns_lookup",
                        description: "Trigger DNS Tracker and domain lookup tool. Call this when the user wants to query DNS records or perform WHOIS queries for a domain.",
                        parameters: {
                          type: "OBJECT",
                          properties: {
                            domain: {
                              type: "STRING",
                              description: "The domain name (e.g. 'google.com')."
                            }
                          },
                          required: ["domain"]
                        }
                    },
                    {
                        name: "image_convert",
                        description: "Trigger Image Format Converter. Call this when the user wants to convert images between different extensions like PNG, JPG, WebP, ICO.",
                        parameters: {
                          type: "OBJECT",
                          properties: {
                            targetFormat: {
                              type: "STRING",
                              description: "Target image format: 'png', 'jpg', 'webp', or 'ico'."
                            }
                          }
                        }
                    },
                    {
                        name: "remove_background",
                        description: "Trigger Background Eraser tool. Call this when the user wants to remove the background of an image using AI.",
                        parameters: {
                          type: "OBJECT"
                        }
                    },
                    {
                        name: "ai_purge_metadata",
                        description: "Trigger AI Media Purger metadata cleaning tool. Call this when the user wants to strip EXIF, prompt trails, or privacy metadata from files.",
                        parameters: {
                          type: "OBJECT"
                        }
                    },
                    {
                        name: "pdf_to_images",
                        description: "Trigger PDF-to-Images converter. Call this when the user wants to extract frames/pages from a PDF as images.",
                        parameters: {
                          type: "OBJECT"
                        }
                    },
                    {
                        name: "image_to_pdf",
                        description: "Trigger Image-to-PDF compiler. Call this when the user wants to compile multiple images into a single PDF document.",
                        parameters: {
                          type: "OBJECT"
                        }
                    },
                    {
                        name: "color_picker",
                        description: "Trigger Color Palette Picker. Call this when the user wants to pick hex or RGB color codes from an image.",
                        parameters: {
                          type: "OBJECT"
                        }
                    },
                    {
                        name: "database_convert",
                        description: "Trigger SQL-to-JSON database converter. Call this when the user wants to convert SQL schemas or insert scripts to JSON.",
                        parameters: {
                          type: "OBJECT",
                          properties: {
                            sqlData: {
                              type: "STRING",
                              description: "The SQL script."
                            }
                          }
                        }
                    },
                    {
                        name: "framesnap",
                        description: "Trigger FrameSnap tool. Call this when the user wants to snapshot or extract high-quality frames from a video.",
                        parameters: {
                          type: "OBJECT"
                        }
                    }
                ]
            }]
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
                            resolve({
                                statusCode: 200,
                                headers,
                                body: JSON.stringify(result)
                            });
                        } catch (err) {
                            console.error("Failed to parse Gemini response:", data, err);
                            resolve({
                                statusCode: 500,
                                headers,
                                body: JSON.stringify({ error: "Failed to parse API response", details: err.message })
                            });
                        }
                    } else {
                        console.error("Gemini API Error Status:", res.statusCode, "Response Data:", data);
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
