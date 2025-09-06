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
        
        console.log('DEBUG: Using token:', EVENTBRITE_API_TOKEN);
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

// Brevo API subscription endpoint
app.post('/api/brevo/subscribe', async (req, res) => {
    const { email, attributes, listIds, updateEnabled } = req.body;
    
    console.log('Brevo subscription request received for:', email);
    
    if (!email) {
        return res.status(400).json({ error: 'Email address is required' });
    }

    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    
    if (!BREVO_API_KEY) {
        console.error('BREVO_API_KEY not found in environment variables');
        return res.status(500).json({ 
            error: 'Brevo API key not configured',
            hint: 'Make sure BREVO_API_KEY is set in .env file'
        });
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
                return res.status(200).json({ 
                    success: true, 
                    message: 'Already subscribed',
                    id: 'existing'
                });
            }
            
            throw new Error(responseData.message || `Brevo API error: ${response.status}`);
        }

        console.log(`Successfully subscribed ${email} to Brevo list`);
        
        return res.json({
            success: true,
            message: 'Successfully subscribed',
            id: responseData.id
        });
        
    } catch (error) {
        console.error('Error with Brevo subscription:', error);
        return res.status(500).json({ 
            error: 'Failed to subscribe',
            message: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Eventbrite proxy server running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔑 Eventbrite API Token: ${process.env.EVENTBRITE_API_TOKEN ? '✅ Yes' : '❌ No'}`);
    console.log(`📧 Brevo API Token: ${process.env.BREVO_API_KEY ? '✅ Yes' : '❌ No'}`);
});