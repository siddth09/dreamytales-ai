// --- Vercel Serverless Function ---
// This function acts as a secure backend to handle API calls to Google Gemini.
// It retrieves the secret API key from environment variables and forwards the request.
// It no longer needs the 'node-fetch' package as modern Node.js includes fetch.

export default async function handler(req, res) {
    // 1. Check for the correct request method
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 2. Retrieve the secret API key from Vercel's environment variables
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    // 3. Extract the type ('text' or 'tts') and payload from the request body
    const { type, payload } = req.body;

    // 4. Determine the correct Gemini API URL based on the request type
    let apiUrl;
    if (type === 'text') {
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
    } else if (type === 'tts') {
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_API_KEY}`;
    } else {
        return res.status(400).json({ error: 'Invalid API request type' });
    }

    // 5. Make the secure, server-to-server call to the Gemini API
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error:', errorText);
            return res.status(response.status).json({ error: 'Failed to fetch from Gemini API', details: errorText });
        }

        const data = await response.json();
        
        // 6. Send the successful response from Gemini back to the frontend
        return res.status(200).json(data);

    } catch (error) {
        console.error('Error in serverless function:', error);
        return res.status(500).json({ error: 'An internal server error occurred.' });
    }
}
