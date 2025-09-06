# Eventbrite API Integration Setup

## Overview
The site uses a custom Web Component to display live events from Eventbrite using their API. Since the Eventbrite API requires authentication and faces CORS restrictions, you'll need to set up a backend proxy for production.

## Current Implementation

### 1. Web Component
- File: `components/eventbrite-events.js`
- Creates responsive event cards with date, time, and venue
- Includes loading states and error handling
- Falls back to mock data in development

### 2. Usage in HTML
```html
<eventbrite-events 
    organizer-id="YOUR_ORGANIZER_ID"
    api-token="YOUR_API_TOKEN"
    max-events="6">
</eventbrite-events>
```

## Setup Instructions

### Step 1: Get Your Eventbrite Credentials

1. Log into your Eventbrite account
2. Go to Account Settings → Developer → App Management
3. Create a new app or use existing
4. Copy your **Private Token** (API Token)
5. Find your **Organizer ID** in your Eventbrite profile URL

### Step 2: Development Setup

For local development, the component will show mock data due to CORS restrictions.

To test with real data locally:
1. Use a CORS proxy service (temporary solution)
2. Or set up a local backend proxy

### Step 3: Production Setup

Choose one of these deployment options:

#### Option A: Vercel
1. Copy `api/eventbrite-proxy.example.js` to `api/eventbrite.js`
2. Add environment variable: `EVENTBRITE_API_TOKEN`
3. Deploy to Vercel
4. Update component to use proxy URL

#### Option B: Netlify Functions
1. Create `netlify/functions/eventbrite.js`
2. Use the Netlify example from the proxy file
3. Add environment variable in Netlify dashboard
4. Deploy

#### Option C: Your Own Server
1. Use the Express.js example
2. Set up CORS and environment variables
3. Deploy to your hosting

### Step 4: Update the Component

In `index.html`, update the component attributes:
```html
<eventbrite-events 
    organizer-id="12345678"  <!-- Your actual organizer ID -->
    proxy-url="/api/eventbrite"  <!-- Your proxy endpoint -->
    max-events="6">
</eventbrite-events>
```

Then modify `eventbrite-events.js` to use the proxy:
```javascript
async fetchEventsDirectly() {
    const url = `${this.proxyUrl}?organizerId=${this.organizerId}`;
    const response = await fetch(url);
    // ... rest of the code
}
```

## Security Notes

- **Never expose your API token in client-side code**
- Always use a backend proxy in production
- Consider rate limiting your proxy endpoint
- Add additional validation if needed

## Customization

### Styling
Event cards use Tailwind classes and can be customized in the `createEventCard()` method.

### Event Display
- Adjust `max-events` attribute to show more/fewer events
- Modify date/time formatting in `formatDate()` and `formatTime()` methods
- Customize the "no events" message in `getNoEventsMessage()`

## Troubleshooting

### Events not showing?
1. Check browser console for errors
2. Verify organizer ID is correct
3. Ensure API token is valid
4. Check that events are published and "live" on Eventbrite

### CORS errors?
- This is expected in development
- Must use backend proxy for production
- Component will show mock data as fallback

### API Rate Limits
Eventbrite API has rate limits. Consider caching responses in your proxy.