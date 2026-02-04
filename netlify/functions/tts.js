const https = require('https');

exports.handler = async function (event, context) {
    // CORS Handling (Optional: Netlify handles this if on same domain, but good for safety)
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

        const { text, voice } = body;

        if (!text) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing text" }) };
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("Missing GEMINI_API_KEY environment variable");
            return { statusCode: 500, headers, body: JSON.stringify({ error: "Server configuration error: Missing API Key" }) };
        }

        const postData = JSON.stringify({
            contents: [{
                parts: [{ text: text }]
            }],
            generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voice || "Zephyr" }
                    }
                }
            },
            model: "gemini-2.5-flash-preview-tts"
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({
                            statusCode: 200,
                            headers,
                            body: data
                        });
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
};
