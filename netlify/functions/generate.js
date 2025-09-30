// This is your secure serverless function.
// It runs on Netlify's servers, not in the user's browser.

exports.handler = async function (event, context) {
    // Only allow POST requests.
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Get the API key from the secret environment variables.
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return { statusCode: 500, body: 'API key not found.' };
    }

    try {
        const { type, payload } = JSON.parse(event.body);

        let apiUrl = '';
        if (type === 'text') {
            apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent';
        } else if (type === 'tts') {
            apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent';
        } else {
            return { statusCode: 400, body: 'Invalid request type.' };
        }
        
        // We are using 'node-fetch' which is available in Netlify functions.
        const fetch = (await import('node-fetch')).default;

        // Call the Google API from the server, including the secret key.
        const response = await fetch(`${apiUrl}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Google API Error:', errorBody);
            return { statusCode: response.status, body: `Google API Error: ${errorBody}` };
        }

        const data = await response.json();

        // Send the result from Google back to the browser.
        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };

    } catch (error) {
        console.error('Error in serverless function:', error);
        return { statusCode: 500, body: error.toString() };
    }
};
