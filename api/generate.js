// --- Unified Serverless Function (Vercel & Netlify) ---
// This file exports both a named handler (Netlify) and a default handler (Vercel).
// It acts as a bridge to the Google Gemini API.

// --- CORE LOGIC (Platform Agnostic) ---
async function handleGeminiRequest(bodyObject) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        throw new Error('API key not configured in environment variables.');
    }

    const { type, payload } = bodyObject;
    let apiUrl;

    if (type === 'text') {
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    } else if (type === 'tts') {
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-tts:generateContent?key=${GEMINI_API_KEY}`;
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

// --- NETLIFY HANDLER (Named Export) ---
// Netlify functions use the signature: async (event, context) => { statusCode, body }
export async function handler(event) {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body);
        const data = await handleGeminiRequest(body);
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error('Netlify Handler Error:', error);
        return {
            statusCode: error.message.includes('API key') ? 500 : 400,
            body: JSON.stringify({ error: error.message })
        };
    }
}

// --- VERCEL HANDLER (Default Export) ---
// Vercel functions use the signature: (req, res) => void
export default async function(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        // Vercel usually parses JSON body automatically if Content-Type is application/json
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const data = await handleGeminiRequest(body);
        
        return res.status(200).json(data);
    } catch (error) {
        console.error('Vercel Handler Error:', error);
        return res.status(error.message.includes('API key') ? 500 : 400).json({ error: error.message });
    }
}
