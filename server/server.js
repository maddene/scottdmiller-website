const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for your frontend
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:3000']
}));

app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'Eventbrite Proxy Server Running',
        status: 'healthy',
        endpoints: ['/api/eventbrite']
    });
});

// Eventbrite API proxy endpoint
app.get('/api/eventbrite', async (req, res) => {
    const { organizerId } = req.query;
    
    console.log('Proxy request received for organizer:', organizerId);
    
    if (!organizerId) {
        return res.status(400).json({ error: 'Organizer ID required' });
    }

    const EVENTBRITE_API_TOKEN = process.env.EVENTBRITE_API_TOKEN;
    
    if (!EVENTBRITE_API_TOKEN) {
        console.error('EVENTBRITE_API_TOKEN not found in environment variables');
        return res.status(500).json({ 
            error: 'API token not configured',
            hint: 'Make sure EVENTBRITE_API_TOKEN is set in .env file'
        });
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
        
        return res.json(data);
    } catch (error) {
        console.error('Error fetching from Eventbrite:', error);
        return res.status(500).json({ 
            error: 'Failed to fetch events',
            details: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Eventbrite proxy server running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔑 API Token configured: ${process.env.EVENTBRITE_API_TOKEN ? '✅ Yes' : '❌ No'}`);
});