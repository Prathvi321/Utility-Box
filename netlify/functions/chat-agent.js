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

        // System Instruction for the AI agent
        const systemInstruction = {
            parts: [{
                text: "You are an intelligent, helpful AI Agent for the 'UtilityBox' utility website. " +
                      "Your goal is to assist users by answering general questions on your own OR by calling specialized browser tools to perform tasks for them. " +
                      "If the user asks a normal query (e.g. 'Who is the President of India?' or 'What is 2+2?'), answer directly on your own; DO NOT call any tools. " +
                      "If the user wants to generate a QR code, compress/shrink an image, convert text/script to audio/speech, or merge multiple PDFs, you MUST call the matching tool. " +
                      "Do not try to explain how the tool works or simulate its output textually. Simply call the tool. " +
                      "Even if the user mentions compressing an image or merging PDFs but hasn't uploaded/attached the files yet, call the tool anyway so that the chat can display the interactive widget where the user can upload their files. " +
                      "When you call a tool, the interface will display the interactive widget inside the chat conversation, allowing the user to complete their task. " +
                      "Always respond in a concise, friendly manner."
            }]
        };

        // Formulate the payload for Gemini API
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
                              description: "Target maximum file size of the compressed image in MB. If not specified by user, do not pass so the UI can use defaults."
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
                              description: "The voice to use. Choose one of: 'Zephyr' (bright/energetic), 'Puck' (upbeat/friendly), 'Charon' (informative/smooth), 'Kore' (firm/authoritative), 'Fenrir' (excitable/playful), 'Leda' (youthful/composed), 'Orus' (firm/professional)."
                            }
                          },
                          required: ["text"]
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
