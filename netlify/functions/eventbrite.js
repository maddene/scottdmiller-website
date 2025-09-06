// Netlify Function for Eventbrite API proxy
exports.handler = async (event, context) => {
    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    const { organizerId } = event.queryStringParameters || {};
    
    console.log('Netlify Function - Eventbrite proxy request for organizer:', organizerId);
    
    if (!organizerId) {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: 'Organizer ID required' })
        };
    }

    // Get API token from Netlify environment variables
    const EVENTBRITE_API_TOKEN = process.env.EVENTBRITE_API_TOKEN;
    
    if (!EVENTBRITE_API_TOKEN) {
        console.error('EVENTBRITE_API_TOKEN not found in environment variables');
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                error: 'API token not configured',
                hint: 'Set EVENTBRITE_API_TOKEN in Netlify environment variables'
            })
        };
    }

    try {
        const url = `https://www.eventbriteapi.com/v3/organizers/${organizerId}/events/?status=live&order_by=start_asc&expand=venue`;
        console.log('Fetching from Eventbrite API:', url);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${EVENTBRITE_API_TOKEN}`,
                'User-Agent': 'ScottDMiller-Website/1.0'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Eventbrite API error: ${response.status}`, errorText);
            throw new Error(`Eventbrite API error: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Successfully fetched ${data.events?.length || 0} events`);
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
            },
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error('Error fetching from Eventbrite:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                error: 'Failed to fetch events',
                details: error.message 
            })
        };
    }
};