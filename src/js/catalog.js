let catalog;
let catalogPollingId = null;

class Catalog {
    constructor() {
        this.products = typeof loadProducts === 'function' ? loadProducts() : PRODUCTS;
        this.cart = {};
        this.currentFilter = 'all';
        this.currentColorIndex = {};
        this.modalListenerAttached = false;
        
        this.init();
    }
    
    init() {
        this.waitForGrid();
    }
    
    waitForGrid() {
        if (catalogPollingId) clearTimeout(catalogPollingId);
        const grid = document.getElementById('products-grid');
        if (grid) {
            this.syncCart(JSON.parse(localStorage.getItem('enotspace_cart') || '[]'));
            this.renderProducts();
            this.setupFilters();
            this.setupModal();
        } else {
            catalogPollingId = setTimeout(() => this.waitForGrid(), 100);
        }
    }
    
    reinit() {
        this.products = typeof loadProducts === 'function' ? loadProducts() : PRODUCTS;
        this.currentFilter = 'all';
        this.waitForGrid();
    }
    
    renderProducts() {
        const grid = document.getElementById('products-grid');
        if (!grid) return;
        
        const filtered = this.currentFilter === 'all' 
            ? this.products 
            : this.products.filter(p => p.category === this.currentFilter);
        
        grid.innerHTML = filtered.map(product => this.createCard(product)).join('');
        this.setupCardEvents();
    }
    
    createCard(product) {
        var localCart = JSON.parse(localStorage.getItem('enotspace_cart') || '[]');
        var existing = localCart.find(function(i) { return i.productId === product.id; });
        const inCart = existing ? existing.quantity : 0;
        const firstImage = product.colors[0].images[0];
        
        return `
            <div class="product-card" data-id="${product.id}">
                <div class="product-card__image">
                    <img src="${firstImage}" alt="${escapeAttr(product.name)}" loading="lazy">
                    ${!product.inStock ? '<span class="product-card__badge">Нет в наличии</span>' : ''}
                </div>
                <div class="product-card__body">
                    <h3 class="product-card__title">${escapeHtml(product.name)}</h3>
                    <p class="product-card__description">${escapeHtml(product.description)}</p>
                    <div class="product-card__footer">
                        <div class="product-card__price">
                            ${product.price.toLocaleString('ru-RU')} <span>₽</span>
                        </div>
                        <div class="product-card__cart-wrap">
                            <button class="product-card__add-btn">В корзину</button>
                            <div class="product-card__cart-counter">
                                <button class="product-card__cart-btn" data-action="decrease">−</button>
                                <span class="product-card__cart-quantity">${inCart || ''}</span>
                                <button class="product-card__cart-btn" data-action="increase">+</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    setupCardEvents() {
        document.querySelectorAll('.product-card').forEach(card => {
            const productId = parseInt(card.dataset.id);
            const wrap = card.querySelector('.product-card__cart-wrap');
            const addBtn = wrap.querySelector('.product-card__add-btn');
            const counter = wrap.querySelector('.product-card__cart-counter');
            const quantityEl = wrap.querySelector('.product-card__cart-quantity');
            
            var localCart = JSON.parse(localStorage.getItem('enotspace_cart') || '[]');
            var existing = localCart.find(function(i) { return i.productId === productId; });
            const inCart = existing ? existing.quantity : 0;
            if (inCart > 0) {
                addBtn.classList.add('hidden');
                counter.classList.add('visible');
                quantityEl.textContent = inCart;
            }
            
            card.addEventListener('click', (e) => {
                if (e.target.closest('.product-card__cart-btn') || e.target.closest('.product-card__cart-wrap')) {
                    return;
                }
                this.openModal(productId);
            });
            
            addBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.addToCart(productId);
            });
            
            counter.querySelector('[data-action="increase"]').addEventListener('click', (e) => {
                e.stopPropagation();
                this.addToCart(productId);
            });
            
            counter.querySelector('[data-action="decrease"]').addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFromCart(productId);
            });
        });
    }
    
    setupFilters() {
        document.querySelectorAll('.catalog__filter').forEach(filter => {
            filter.addEventListener('click', () => {
                document.querySelectorAll('.catalog__filter').forEach(f => f.classList.remove('active'));
                filter.classList.add('active');
                this.currentFilter = filter.dataset.filter;
                this.renderProducts();
            });
        });
    }
    
    setupModal() {
        const modal = document.getElementById('product-modal');
        if (!modal) return;
        
        modal.querySelector('.product-modal__overlay').addEventListener('click', () => this.closeModal());
        document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
        
        if (!this.modalListenerAttached) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') this.closeModal();
            });
            this.modalListenerAttached = true;
        }
        
        document.getElementById('modal-add-to-cart').addEventListener('click', () => {
            const productId = parseInt(modal.dataset.productId);
            this.addToCart(productId);
            this.updateModalCart(productId);
        });
        
        document.getElementById('modal-increase').addEventListener('click', () => {
            const productId = parseInt(modal.dataset.productId);
            this.addToCart(productId);
            this.updateModalCart(productId);
        });
        
        document.getElementById('modal-decrease').addEventListener('click', () => {
            const productId = parseInt(modal.dataset.productId);
            this.removeFromCart(productId);
            this.updateModalCart(productId);
        });
    }
    
    openModal(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        const modal = document.getElementById('product-modal');
        modal.dataset.productId = productId;
        
        const colorIndex = this.currentColorIndex[productId] || 0;
        const images = product.colors[colorIndex].images;
        
        document.getElementById('modal-main-image').src = images[0];
        document.getElementById('modal-main-image').alt = product.name;
        document.getElementById('modal-title').textContent = product.name;
        document.getElementById('modal-description').textContent = product.description;
        document.getElementById('modal-material').textContent = product.material;
        document.getElementById('modal-price').textContent = product.price.toLocaleString('ru-RU') + ' ₽';
        
        const fullStars = Math.floor(product.rating);
        const halfStar = product.rating % 1 >= 0.5;
        let starsHtml = '';
        for (let i = 0; i < fullStars; i++) starsHtml += '\u2605';
        if (halfStar) starsHtml += '\u2606';
        document.getElementById('modal-stars').textContent = starsHtml;
        document.getElementById('modal-reviews').textContent = '(' + product.reviews + ' отзывов)';
        
        this.renderThumbnails(images);
        this.renderColors(product, colorIndex);
        
        this.updateModalCart(productId);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        var reviewsHtml = renderProductReviews(productId);
        var cartSection = modal.querySelector('.product-modal__cart');
        if (cartSection && reviewsHtml) {
            cartSection.insertAdjacentHTML('afterend', reviewsHtml);
            setupReviewForm();
        }
    }
    
    renderThumbnails(images) {
        const container = document.getElementById('modal-thumbnails');
        container.innerHTML = images.map((img, i) => `
            <div class="product-modal__thumbnail ${i === 0 ? 'active' : ''}" data-index="${i}">
                <img src="${img}" alt="Фото ${i + 1}" loading="lazy">
            </div>
        `).join('');
        
        container.querySelectorAll('.product-modal__thumbnail').forEach(thumb => {
            thumb.addEventListener('click', () => {
                container.querySelectorAll('.product-modal__thumbnail').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
                document.getElementById('modal-main-image').src = images[parseInt(thumb.dataset.index)];
            });
        });
    }
    
    renderColors(product, activeIndex) {
        const container = document.getElementById('modal-color-options');
        const colorsSection = document.getElementById('modal-colors');
        
        if (product.colors.length <= 1) {
            colorsSection.style.display = 'none';
            return;
        }
        
        colorsSection.style.display = 'flex';
        container.innerHTML = product.colors.map((color, i) => `
            <div class="product-modal__color-option ${i === activeIndex ? 'active' : ''}" data-index="${i}">
                <span class="product-modal__color-swatch" style="background-color: ${color.hex}"></span>
                <span class="product-modal__color-name">${escapeHtml(color.name)}</span>
            </div>
        `).join('');
        
        container.querySelectorAll('.product-modal__color-option').forEach(opt => {
            opt.addEventListener('click', () => {
                container.querySelectorAll('.product-modal__color-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                const idx = parseInt(opt.dataset.index);
                const images = product.colors[idx].images;
                this.currentColorIndex[product.id] = idx;
                this.renderThumbnails(images);
                document.getElementById('modal-main-image').src = images[0];
            });
        });
    }
    
    closeModal() {
        const modal = document.getElementById('product-modal');
        if (!modal) return;
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    addToCart(productId) {
        var localCart = JSON.parse(localStorage.getItem('enotspace_cart') || '[]');
        var existing = localCart.find(function(i) { return i.productId === productId; });
        if (existing) {
            existing.quantity++;
        } else {
            localCart.push({ productId: productId, quantity: 1 });
        }
        localStorage.setItem('enotspace_cart', JSON.stringify(localCart));
        this.syncCart(localCart);
        this.updateCardButton(productId);
        this.updateCartCount();
    }
    
    removeFromCart(productId) {
        var localCart = JSON.parse(localStorage.getItem('enotspace_cart') || '[]');
        var existing = localCart.find(function(i) { return i.productId === productId; });
        if (existing) {
            if (existing.quantity > 1) {
                existing.quantity--;
            } else {
                localCart = localCart.filter(function(i) { return i.productId !== productId; });
            }
        }
        localStorage.setItem('enotspace_cart', JSON.stringify(localCart));
        this.syncCart(localCart);
        this.updateCardButton(productId);
        this.updateCartCount();
    }
    
    syncCart(localCart) {
        this.cart = {};
        var self = this;
        localCart.forEach(function(item) {
            self.cart[item.productId] = item.quantity;
        });
    }
    
    updateCardButton(productId) {
        const card = document.querySelector('.product-card[data-id="' + productId + '"]');
        if (!card) return;
        
        const addBtn = card.querySelector('.product-card__add-btn');
        const counter = card.querySelector('.product-card__cart-counter');
        const quantityEl = card.querySelector('.product-card__cart-quantity');
        var localCart = JSON.parse(localStorage.getItem('enotspace_cart') || '[]');
        var existing = localCart.find(function(i) { return i.productId === productId; });
        const inCart = existing ? existing.quantity : 0;
        
        if (inCart > 0) {
            addBtn.classList.add('hidden');
            counter.classList.add('visible');
            quantityEl.textContent = inCart;
        } else {
            addBtn.classList.remove('hidden');
            counter.classList.remove('visible');
        }
    }
    
    updateModalCart(productId) {
        var localCart = JSON.parse(localStorage.getItem('enotspace_cart') || '[]');
        var existing = localCart.find(function(i) { return i.productId === productId; });
        var quantity = existing ? existing.quantity : 0;
        const addBtn = document.getElementById('modal-add-to-cart');
        const counter = document.getElementById('modal-cart-counter');
        
        if (quantity > 0) {
            addBtn.style.display = 'none';
            counter.style.display = 'flex';
            document.getElementById('modal-quantity').textContent = quantity;
        } else {
            addBtn.style.display = 'block';
            counter.style.display = 'none';
        }
    }
    
    updateCartCount() {
        var localCart = JSON.parse(localStorage.getItem('enotspace_cart') || '[]');
        var total = localCart.reduce(function(sum, item) { return sum + item.quantity; }, 0);
        var cartCountEl = document.getElementById('cart-count');
        if (cartCountEl) {
            cartCountEl.textContent = total;
            cartCountEl.style.display = total > 0 ? 'flex' : 'none';
        }
    }
}

catalog = new Catalog();
