class HeroSubscription extends HTMLElement {
    constructor() {
        super();
        this.listId = '';
        this.successMessage = 'Thank you! Check your email for updates.';
        this.proxyUrl = '';
        this.isSubmitting = false;
    }

    connectedCallback() {
        // Read attributes when component is connected to DOM
        this.listId = this.getAttribute('list-id') || '';
        this.successMessage = this.getAttribute('success-message') || 'Thank you! Check your email for updates.';
        this.proxyUrl = this.getProxyUrl();
        
        this.render();
        this.setupForm();
    }

    getEnvironment() {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'local';
        } else if (hostname.includes('netlify.app') || hostname.includes('netlify.com')) {
            return 'netlify';
        } else {
            return 'production';
        }
    }

    getProxyUrl() {
        // Check if proxy-url is explicitly set in HTML
        const explicitUrl = this.getAttribute('proxy-url');
        if (explicitUrl) {
            return explicitUrl;
        }

        // Auto-detect based on environment
        const environment = this.getEnvironment();
        
        switch (environment) {
            case 'local':
                return 'http://localhost:3001/api/brevo/subscribe';
            case 'netlify':
            case 'production':
            default:
                return '/.netlify/functions/brevo-subscribe';
        }
    }

    render() {
        this.innerHTML = `
            <div class="mt-8 max-w-xl">
                <p class="text-white font-body mb-4 text-lg">
                    Get updates on training events and FIT resources
                </p>
                <form id="hero-subscription-form" class="flex flex-col sm:flex-row gap-3">
                    <input
                        type="email"
                        id="hero-email"
                        name="email"
                        required
                        class="flex-1 px-4 py-3 rounded-sm text-gray-900 placeholder-gray-500 bg-white font-body focus:outline-none focus:ring-2 focus:ring-orange-300"
                        placeholder="Enter your email address"
                    >
                    <button
                        type="submit"
                        id="hero-subscribe-button"
                        class="px-6 py-3 bg-white text-orange-500 font-heading text-lg tracking-wider rounded-sm hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-300"
                    >
                        <span class="button-text">Subscribe</span>
                        <span class="loading-text hidden">Subscribing...</span>
                    </button>
                </form>
                <div id="hero-form-message" class="hidden mt-3 text-sm font-body"></div>
            </div>
        `;
    }

    setupForm() {
        const form = this.querySelector('#hero-subscription-form');
        const button = this.querySelector('#hero-subscribe-button');
        const buttonText = this.querySelector('.button-text');
        const loadingText = this.querySelector('.loading-text');
        const messageDiv = this.querySelector('#hero-form-message');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (this.isSubmitting) return;
            
            const formData = new FormData(form);
            const email = formData.get('email').trim();
            
            if (!email) {
                this.showMessage('Please enter your email address.', 'error');
                return;
            }

            if (!this.isValidEmail(email)) {
                this.showMessage('Please enter a valid email address.', 'error');
                return;
            }

            await this.submitSubscription(email);
        });
    }

    async submitSubscription(email) {
        const button = this.querySelector('#hero-subscribe-button');
        const buttonText = this.querySelector('.button-text');
        const loadingText = this.querySelector('.loading-text');

        try {
            this.isSubmitting = true;
            button.disabled = true;
            buttonText.classList.add('hidden');
            loadingText.classList.remove('hidden');
            this.hideMessage();

            const response = await fetch(this.proxyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    attributes: {}, // No name field in hero form
                    listIds: [parseInt(this.listId)],
                    updateEnabled: true
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success || result.id) {
                this.showMessage(this.successMessage, 'success');
                this.querySelector('#hero-subscription-form').reset();
            } else {
                throw new Error(result.message || 'Subscription failed');
            }

        } catch (error) {
            console.error('Subscription error:', error);
            
            let errorMessage = 'Something went wrong. Please try again.';
            if (error.message.includes('already exists')) {
                errorMessage = 'You are already subscribed!';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            this.showMessage(errorMessage, 'error');
        } finally {
            this.isSubmitting = false;
            button.disabled = false;
            buttonText.classList.remove('hidden');
            loadingText.classList.add('hidden');
        }
    }

    showMessage(message, type) {
        const messageDiv = this.querySelector('#hero-form-message');
        messageDiv.textContent = message;
        messageDiv.className = `mt-3 text-sm font-body ${type === 'success' ? 'text-green-300' : 'text-red-300'}`;
        messageDiv.classList.remove('hidden');
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => this.hideMessage(), 5000);
        }
    }

    hideMessage() {
        const messageDiv = this.querySelector('#hero-form-message');
        messageDiv.classList.add('hidden');
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// Define the custom element
customElements.define('hero-subscription', HeroSubscription);