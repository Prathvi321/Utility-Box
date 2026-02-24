export const handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const API_KEY = process.env.REMOVE_BG_API_KEY;

    if (!API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error: API key missing' }),
        };
    }

    try {
        const { image_file_b64 } = JSON.parse(event.body);

        if (!image_file_b64) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'No image data provided' })
            };
        }

        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: {
                'X-Api-Key': API_KEY,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                image_file_b64: image_file_b64,
                size: 'auto',
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                statusCode: response.status,
                body: JSON.stringify({
                    error: errorData.errors?.[0]?.title || 'Failed to remove background'
                }),
            };
        }

        const data = await response.json();

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image_b64: data.data.result_b64,
            }),
        };
    } catch (error) {
        console.error('Remove BG Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};
