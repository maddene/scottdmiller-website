class NavMenu extends HTMLElement {
    constructor() {
        super();
        this.currentPage = window.location.pathname.split('/').pop() || 'index.html';
    }

    connectedCallback() {
        this.render();
        this.setupMobileMenu();
    }

    render() {
        this.innerHTML = `
            <nav class="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center h-16">
                        <div class="flex-shrink-0">
                            <h1 class="text-xl font-heading tracking-heading leading-heading text-black">
                                <a href="${this.getPath('index.html')}" class="hover:opacity-70">Scott D. Miller, PhD</a>
                            </h1>
                        </div>
                        
                        <!-- Desktop Navigation -->
                        <div class="hidden md:block">
                            <div class="ml-10 flex items-baseline space-x-6">
                                ${this.getMenuItems()}
                            </div>
                        </div>
                        
                        <!-- Mobile menu button -->
                        <div class="md:hidden">
                            <button id="mobile-menu-button" class="p-2 rounded-md text-black hover:bg-gray-100">
                                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path class="menu-open" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                                    <path class="menu-close hidden" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Mobile Navigation -->
                    <div id="mobile-menu" class="hidden md:hidden">
                        <div class="px-2 pt-2 pb-3 space-y-1">
                            ${this.getMobileMenuItems()}
                        </div>
                    </div>
                </div>
            </nav>
        `;
    }

    getPath(page) {
        // Handle navigation between pages
        if (this.currentPage === 'index.html') {
            return page === 'index.html' ? '#' : page;
        } else if (this.currentPage === 'about-scott.html') {
            return page === 'index.html' ? 'index.html' : page;
        }
        return page;
    }

    getMenuItems() {
        const items = [
            { href: 'index.html#training', text: 'Training', external: false },
            { href: 'https://scott-d-miller-ph-d.myshopify.com/', text: 'Shop', external: true },
            { href: 'index.html#systems', text: 'ORS & SRS', external: false },
            { href: 'index.html#publications', text: 'Publications', external: false },
            { href: 'index.html#contact', text: 'Contact', external: false }
        ];

        return items.map(item => {
            const target = item.external ? 'target="_blank"' : '';
            const href = item.external ? item.href : this.formatHref(item.href);
            return `<a href="${href}" ${target} class="text-black hover:opacity-70 font-body">${item.text}</a>`;
        }).join('');
    }

    getMobileMenuItems() {
        const items = [
            { href: 'index.html#training', text: 'Training', external: false },
            { href: 'https://scott-d-miller-ph-d.myshopify.com/', text: 'Shop', external: true },
            { href: 'index.html#systems', text: 'ORS & SRS', external: false },
            { href: 'index.html#publications', text: 'Publications', external: false },
            { href: 'index.html#contact', text: 'Contact', external: false }
        ];

        return items.map(item => {
            const target = item.external ? 'target="_blank"' : '';
            const href = item.external ? item.href : this.formatHref(item.href);
            return `<a href="${href}" ${target} class="block px-3 py-2 text-black hover:bg-gray-100 font-body">${item.text}</a>`;
        }).join('');
    }

    formatHref(href) {
        // If we're on about-scott.html and linking to index sections
        if (this.currentPage === 'about-scott.html' && href.startsWith('index.html')) {
            return href;
        }
        // If we're on index.html and linking to index sections
        if (this.currentPage === 'index.html' && href.startsWith('index.html#')) {
            return href.replace('index.html', '');
        }
        return href;
    }

    setupMobileMenu() {
        const button = this.querySelector('#mobile-menu-button');
        const menu = this.querySelector('#mobile-menu');
        const openIcon = this.querySelector('.menu-open');
        const closeIcon = this.querySelector('.menu-close');

        if (button && menu) {
            button.addEventListener('click', () => {
                const isHidden = menu.classList.contains('hidden');
                
                if (isHidden) {
                    menu.classList.remove('hidden');
                    openIcon?.classList.add('hidden');
                    closeIcon?.classList.remove('hidden');
                } else {
                    menu.classList.add('hidden');
                    openIcon?.classList.remove('hidden');
                    closeIcon?.classList.add('hidden');
                }
            });

            // Close mobile menu when clicking on a link
            const links = menu.querySelectorAll('a');
            links.forEach(link => {
                link.addEventListener('click', () => {
                    menu.classList.add('hidden');
                    openIcon?.classList.remove('hidden');
                    closeIcon?.classList.add('hidden');
                });
            });
        }
    }
}

// Define the custom element
customElements.define('nav-menu', NavMenu);