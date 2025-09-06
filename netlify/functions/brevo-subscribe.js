// Netlify Function for Brevo API subscription proxy
exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    let requestBody;
    try {
        requestBody = JSON.parse(event.body);
    } catch (error) {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: 'Invalid JSON in request body' })
        };
    }

    const { email, attributes, listIds, updateEnabled } = requestBody;
    
    console.log('Netlify Function - Brevo subscription request for:', email);
    
    if (!email) {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: 'Email address is required' })
        };
    }

    // Get API key from Netlify environment variables
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    
    if (!BREVO_API_KEY) {
        console.error('BREVO_API_KEY not found in environment variables');
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                error: 'Brevo API key not configured',
                hint: 'Set BREVO_API_KEY in Netlify environment variables'
            })
        };
    }

    try {
        const url = 'https://api.brevo.com/v3/contacts';
        console.log('Creating/updating contact in Brevo:', email);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'api-key': BREVO_API_KEY
            },
            body: JSON.stringify({
                email: email,
                attributes: attributes || {},
                listIds: listIds || [],
                updateEnabled: updateEnabled !== false
            })
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.error(`Brevo API error: ${response.status}`, responseData);
            
            // Handle specific Brevo errors
            if (response.status === 400 && responseData.code === 'duplicate_parameter') {
                return {
                    statusCode: 200,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        success: true, 
                        message: 'Already subscribed',
                        id: 'existing'
                    })
                };
            }
            
            throw new Error(responseData.message || `Brevo API error: ${response.status}`);
        }

        console.log(`Successfully subscribed ${email} to Brevo list`);
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                message: 'Successfully subscribed',
                id: responseData.id
            })
        };
        
    } catch (error) {
        console.error('Error with Brevo subscription:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                error: 'Failed to subscribe',
                message: error.message 
            })
        };
    }
};