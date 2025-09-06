class EventbriteEvents extends HTMLElement {
    constructor() {
        super();
        // Configuration - You'll need to set these
        this.organizerId = this.getAttribute('organizer-id') || '';
        this.apiToken = this.getAttribute('api-token') || '';
        this.maxEvents = parseInt(this.getAttribute('max-events')) || 6;
        this.proxyUrl = this.getAttribute('proxy-url') || '/api/eventbrite'; // For production
    }

    connectedCallback() {
        this.render();
        if (this.organizerId) {
            this.loadEvents();
        }
    }

    render() {
        this.innerHTML = `
            <div class="eventbrite-container">
                <div id="events-grid" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${this.getLoadingPlaceholders()}
                </div>
            </div>
        `;
    }

    getLoadingPlaceholders() {
        return Array(3).fill('').map(() => `
            <div class="animate-pulse">
                <div class="bg-gray-200 h-48 rounded-t-lg"></div>
                <div class="p-4 border border-gray-200 rounded-b-lg">
                    <div class="h-4 bg-gray-200 rounded mb-2"></div>
                    <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div class="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>
        `).join('');
    }

    async loadEvents() {
        const container = this.querySelector('#events-grid');
        
        try {
            // For development - using direct API (will face CORS issues)
            // For production - use a backend proxy endpoint
            const events = await this.fetchEventsDirectly();
            
            if (events && events.length > 0) {
                container.innerHTML = events.map(event => this.createEventCard(event)).join('');
            } else {
                container.innerHTML = this.getNoEventsMessage();
            }
        } catch (error) {
            console.error('Error loading Eventbrite events:', error);
            container.innerHTML = this.getFallbackMessage();
        }
    }

    async fetchEventsDirectly() {
        // NOTE: This will face CORS issues when called from browser
        // You need to either:
        // 1. Set up a backend proxy endpoint
        // 2. Use a serverless function (Netlify/Vercel)
        // 3. Use a CORS proxy service (for development only)
        
        const url = `https://www.eventbriteapi.com/v3/organizers/${this.organizerId}/events/?status=live&order_by=start_asc&expand=venue`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch events');
            
            const data = await response.json();
            return data.events.slice(0, this.maxEvents);
        } catch (error) {
            // For development, we'll return mock data
            console.warn('Using mock data due to CORS restrictions');
            return this.getMockEvents();
        }
    }

    createEventCard(event) {
        const startDate = new Date(event.start.local || event.start.utc);
        const formattedDate = this.formatDate(startDate);
        const formattedTime = this.formatTime(startDate);
        
        return `
            <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                ${event.logo ? `
                    <div class="h-48 bg-gray-100">
                        <img src="${event.logo.url}" alt="${event.name.text}" class="w-full h-full object-cover">
                    </div>
                ` : `
                    <div class="h-48 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                        <span class="text-white font-heading text-3xl">FIT</span>
                    </div>
                `}
                <div class="p-4">
                    <h3 class="font-heading text-xl mb-2 line-clamp-2">
                        ${event.name.text}
                    </h3>
                    <div class="text-gray-600 text-sm font-body mb-3">
                        <div class="flex items-center mb-1">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            ${formattedDate}
                        </div>
                        <div class="flex items-center mb-1">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            ${formattedTime}
                        </div>
                        ${event.venue ? `
                            <div class="flex items-center">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                                ${event.venue.name || event.venue.address.city || 'Online'}
                            </div>
                        ` : ''}
                    </div>
                    <a href="${event.url}" 
                       target="_blank" 
                       class="inline-block w-full text-center px-4 py-2 font-heading tracking-wider rounded-sm text-white bg-orange-500 hover:bg-orange-600 transition-colors">
                        Register Now
                    </a>
                </div>
            </div>
        `;
    }

    formatDate(date) {
        const options = { month: 'long', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    formatTime(date) {
        const options = { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' };
        return date.toLocaleTimeString('en-US', options);
    }

    getNoEventsMessage() {
        return `
            <div class="col-span-full text-center py-12">
                <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <h3 class="text-xl font-heading mb-2">No Upcoming Events</h3>
                <p class="text-gray-600 font-body mb-4">Check back soon for new training opportunities.</p>
                <a href="mailto:contact@scottdmiller.com" 
                   class="inline-block px-6 py-2 font-heading tracking-wider rounded-sm text-white bg-orange-500 hover:bg-orange-600 transition-colors">
                    Contact for Private Training
                </a>
            </div>
        `;
    }

    getFallbackMessage() {
        return `
            <div class="col-span-full text-center py-8">
                <p class="text-gray-600 font-body mb-4">
                    Unable to load events at this time.
                </p>
                <a href="https://www.eventbrite.com/o/${this.organizerId}" 
                   target="_blank" 
                   class="inline-block px-6 py-2 font-heading tracking-wider rounded-sm text-orange-500 border border-orange-500 hover:bg-orange-500 hover:text-white transition-colors">
                    View Events on Eventbrite
                </a>
            </div>
        `;
    }

    getMockEvents() {
        // Mock data for development
        return [
            {
                name: { text: "Introduction to Feedback Informed Treatment" },
                start: { local: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
                url: "https://www.eventbrite.com/e/example",
                venue: { name: "Online Workshop" },
                logo: null
            },
            {
                name: { text: "Advanced FIT Implementation Strategies" },
                start: { local: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString() },
                url: "https://www.eventbrite.com/e/example",
                venue: { name: "Chicago, IL" },
                logo: null
            },
            {
                name: { text: "Deliberate Practice for Therapists" },
                start: { local: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() },
                url: "https://www.eventbrite.com/e/example",
                venue: { name: "New York, NY" },
                logo: null
            }
        ];
    }
}

// Define the custom element
customElements.define('eventbrite-events', EventbriteEvents);