// Example backend proxy for Eventbrite API
// This prevents exposing your API token to the browser
// Deploy this as a serverless function (Vercel, Netlify, AWS Lambda, etc.)

// For Vercel (api/eventbrite.js)
export default async function handler(req, res) {
    const { organizerId } = req.query;
    
    if (!organizerId) {
        return res.status(400).json({ error: 'Organizer ID required' });
    }

    const EVENTBRITE_API_TOKEN = process.env.EVENTBRITE_API_TOKEN;
    
    if (!EVENTBRITE_API_TOKEN) {
        return res.status(500).json({ error: 'API token not configured' });
    }

    try {
        const response = await fetch(
            `https://www.eventbriteapi.com/v3/organizers/${organizerId}/events/?status=live&order_by=start_asc&expand=venue`,
            {
                headers: {
                    'Authorization': `Bearer ${EVENTBRITE_API_TOKEN}`,
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Eventbrite API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching from Eventbrite:', error);
        return res.status(500).json({ error: 'Failed to fetch events' });
    }
}

// For Netlify Functions (netlify/functions/eventbrite.js)
exports.handler = async (event, context) => {
    const { organizerId } = event.queryStringParameters || {};
    
    if (!organizerId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Organizer ID required' })
        };
    }

    const EVENTBRITE_API_TOKEN = process.env.EVENTBRITE_API_TOKEN;
    
    if (!EVENTBRITE_API_TOKEN) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'API token not configured' })
        };
    }

    try {
        const response = await fetch(
            `https://www.eventbriteapi.com/v3/organizers/${organizerId}/events/?status=live&order_by=start_asc&expand=venue`,
            {
                headers: {
                    'Authorization': `Bearer ${EVENTBRITE_API_TOKEN}`,
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Eventbrite API error: ${response.status}`);
        }

        const data = await response.json();
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error('Error fetching from Eventbrite:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch events' })
        };
    }
};

// For Express.js server
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/api/eventbrite', async (req, res) => {
    const { organizerId } = req.query;
    
    if (!organizerId) {
        return res.status(400).json({ error: 'Organizer ID required' });
    }

    const EVENTBRITE_API_TOKEN = process.env.EVENTBRITE_API_TOKEN;
    
    if (!EVENTBRITE_API_TOKEN) {
        return res.status(500).json({ error: 'API token not configured' });
    }

    try {
        const response = await fetch(
            `https://www.eventbriteapi.com/v3/organizers/${organizerId}/events/?status=live&order_by=start_asc&expand=venue`,
            {
                headers: {
                    'Authorization': `Bearer ${EVENTBRITE_API_TOKEN}`,
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Eventbrite API error: ${response.status}`);
        }

        const data = await response.json();
        return res.json(data);
    } catch (error) {
        console.error('Error fetching from Eventbrite:', error);
        return res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Environment variables to set:
// EVENTBRITE_API_TOKEN=your_private_api_token_here