// --- Netlify Serverless Function ---
// This function acts as a secure bridge between your app and the Google Gemini API.

// The handler function is the main entry point for the serverless function.
export async function handler(event) {
    // Only allow POST requests.
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Retrieve the secret API key from Netlify's environment variables.
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured.' }) };
    }

    try {
        // Parse the incoming request from your frontend.
        const { type, payload } = JSON.parse(event.body);

        let apiUrl;
        
        // Determine the correct Google API URL based on the request type (text or TTS).
        if (type === 'text') {
            // *** FIX 1: Updated to the stable model alias ***
            apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        } else if (type === 'tts') {
            // *** FIX 2: Updated to the stable TTS model alias ***
            apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-tts:generateContent?key=${GEMINI_API_KEY}`;
        } else {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request type.' }) };
        }

        // Securely call the Google API from the server.
        // We use the built-in fetch, no import needed.
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Google API Error:', errorBody);
            // This will now correctly catch 404 (if not fixed) or 429 (quota issue)
            return { statusCode: response.status, body: JSON.stringify({ error: `Google API failed: ${errorBody}` }) };
        }

        const data = await response.json();
        
        // Send the successful response back to the frontend app.
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Error in serverless function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
}
