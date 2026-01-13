// --- Unified Serverless Function (Vercel & Netlify) ---

async function handleGeminiRequest(bodyObject) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        throw new Error('API key not configured in environment variables.');
    }

    const { type, payload } = bodyObject;
    let apiUrl;

    if (type === 'text') {
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    } else if (type === 'image') {
        // Using Imagen 4 (or 3) via the standard Generative Language API
        // This endpoint requires the payload to have { instances: [...], parameters: ... }
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${GEMINI_API_KEY}`;
    } else {
        throw new Error('Invalid request type.');
    }

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Google API failed (${response.status}): ${errorBody}`);
    }

    return await response.json();
}

// --- NETLIFY HANDLER ---
export async function handler(event) {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        const body = JSON.parse(event.body);
        const data = await handleGeminiRequest(body);
        return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
}

// --- VERCEL HANDLER ---
export default async function(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const data = await handleGeminiRequest(body);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
