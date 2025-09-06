class BrevoSubscription extends HTMLElement {
    constructor() {
        super();
        this.listId = '';
        this.successMessage = 'Thank you for subscribing!';
        this.proxyUrl = '';
        this.isSubmitting = false;
    }

    connectedCallback() {
        // Read attributes when component is connected to DOM
        this.listId = this.getAttribute('list-id') || '';
        this.successMessage = this.getAttribute('success-message') || 'Thank you for subscribing!';
        this.proxyUrl = this.getProxyUrl();
        
        console.log('BrevoSubscription component connected', {
            listId: this.listId,
            proxyUrl: this.proxyUrl,
            environment: this.getEnvironment()
        });
        
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
            <form id="subscription-form" class="space-y-4">
                <div>
                    <label for="subscriber-name" class="block text-sm font-medium text-gray-700 mb-1">
                        Name
                    </label>
                    <input
                        type="text"
                        id="subscriber-name"
                        name="name"
                        required
                        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Your full name"
                    >
                </div>
                
                <div>
                    <label for="subscriber-email" class="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                    </label>
                    <input
                        type="email"
                        id="subscriber-email"
                        name="email"
                        required
                        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        placeholder="your.email@example.com"
                    >
                </div>

                <button
                    type="submit"
                    id="subscribe-button"
                    class="w-full bg-orange-500 hover:bg-orange-600 text-white font-heading py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                    <span class="button-text">Subscribe to Updates</span>
                    <span class="loading-text hidden">Subscribing...</span>
                </button>

                <div id="form-message" class="hidden text-sm text-center py-2"></div>
            </form>
        `;
    }

    setupForm() {
        const form = this.querySelector('#subscription-form');
        const button = this.querySelector('#subscribe-button');
        const buttonText = this.querySelector('.button-text');
        const loadingText = this.querySelector('.loading-text');
        const messageDiv = this.querySelector('#form-message');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (this.isSubmitting) return;
            
            const formData = new FormData(form);
            const name = formData.get('name').trim();
            const email = formData.get('email').trim();
            
            if (!name || !email) {
                this.showMessage('Please fill in all fields.', 'error');
                return;
            }

            if (!this.isValidEmail(email)) {
                this.showMessage('Please enter a valid email address.', 'error');
                return;
            }

            await this.submitSubscription(name, email);
        });
    }

    async submitSubscription(name, email) {
        const button = this.querySelector('#subscribe-button');
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
                    attributes: {
                        NAME: name.split(' ')[0],
                        SURNAME: name.split(' ').slice(1).join(' ') || ''
                    },
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
                this.querySelector('#subscription-form').reset();
            } else {
                throw new Error(result.message || 'Subscription failed');
            }

        } catch (error) {
            console.error('Subscription error:', error);
            
            let errorMessage = 'Something went wrong. Please try again.';
            if (error.message.includes('already exists')) {
                errorMessage = 'You are already subscribed to our mailing list.';
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
        const messageDiv = this.querySelector('#form-message');
        messageDiv.textContent = message;
        messageDiv.className = `text-sm text-center py-2 ${type === 'success' ? 'text-green-600' : 'text-red-600'}`;
        messageDiv.classList.remove('hidden');
    }

    hideMessage() {
        const messageDiv = this.querySelector('#form-message');
        messageDiv.classList.add('hidden');
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// Define the custom element
customElements.define('brevo-subscription', BrevoSubscription);