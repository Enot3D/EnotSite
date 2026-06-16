let catalog;
let catalogPollingId = null;

class Catalog {
    constructor() {
        this.products = PRODUCTS.slice();
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
            this.setupSearch();
            this.setupModal();
        } else {
            catalogPollingId = setTimeout(() => this.waitForGrid(), 100);
        }
    }
    
    reinit() {
        var self = this;
        if (typeof loadProducts === 'function') {
            loadProducts().then(function(products) {
                self.products = products;
                self.currentFilter = 'all';
                self.waitForGrid();
            }).catch(function() {
                self.products = PRODUCTS.slice();
                self.currentFilter = 'all';
                self.waitForGrid();
            });
        } else {
            self.currentFilter = 'all';
            self.waitForGrid();
        }
    }
    
    renderProducts() {
        const grid = document.getElementById('products-grid');
        if (!grid) return;
        
        var filtered = this.currentFilter === 'all' 
            ? this.products 
            : this.products.filter(p => p.category === this.currentFilter);

        if (this.currentSearch) {
            filtered = filtered.filter(p => 
                p.name.toLowerCase().indexOf(this.currentSearch) !== -1 ||
                (p.description && p.description.toLowerCase().indexOf(this.currentSearch) !== -1) ||
                (p.material && p.material.toLowerCase().indexOf(this.currentSearch) !== -1)
            );
        }
        
        grid.innerHTML = filtered.map(product => this.createCard(product)).join('');
        this.setupCardEvents();
        if (typeof renderFavoriteButtons === 'function') renderFavoriteButtons();
        if (typeof renderCatalogAdminControls === 'function') renderCatalogAdminControls();
    }
    
    createCard(product) {
        var localCart = JSON.parse(localStorage.getItem('enotspace_cart') || '[]');
        var existing = localCart.find(function(i) { return i.productId === product.id; });
        const inCart = existing ? existing.quantity : 0;
        const firstImage = product.colors && product.colors[0] ? product.colors[0].images[0] : '';
        const hasDiscount = product.oldPrice && product.oldPrice > product.price;
        
        return `
            <div class="product-card" data-id="${product.id}">
                <div class="product-card__image">
                    <img src="${firstImage}" alt="${escapeAttr(product.name)}" loading="lazy">
                    ${hasDiscount ? '<span class="product-card__badge product-card__badge--sale">-' + Math.round((1 - product.price / product.oldPrice) * 100) + '%</span>' : (!product.inStock ? '<span class="product-card__badge">Нет в наличии</span>' : '')}
                </div>
                <div class="product-card__body">
                    <div class="product-card__price-row">
                        <div class="product-card__price">
                            ${hasDiscount ? '<span class="product-card__price-old">' + product.oldPrice.toLocaleString('ru-RU') + ' ₽</span>' : ''}
                            ${product.price.toLocaleString('ru-RU')} ₽
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
                    <div class="product-card__title">${escapeHtml(product.name)}</div>
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
                if (e.target.closest('.product-card__cart-btn') || e.target.closest('.product-card__cart-wrap') || e.target.closest('.product-card__fav-btn')) {
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
        var self = this;
        var filterBtn = document.getElementById('catalog-filter-btn');
        var filterPanel = document.getElementById('catalog-filters-panel');
        
        if (filterBtn && filterPanel) {
            filterBtn.addEventListener('click', function() {
                var isVisible = filterPanel.style.display !== 'none';
                filterPanel.style.display = isVisible ? 'none' : 'flex';
            });
        }
        
        document.querySelectorAll('.catalog__filter').forEach(filter => {
            filter.addEventListener('click', () => {
                document.querySelectorAll('.catalog__filter').forEach(f => f.classList.remove('active'));
                filter.classList.add('active');
                this.currentFilter = filter.dataset.filter;
                this.currentSearch = '';
                var searchInput = document.getElementById('catalog-search');
                if (searchInput) searchInput.value = '';
                this.renderProducts();
            });
        });
    }

    setupSearch() {
        var self = this;
        var searchInput = document.getElementById('catalog-search');
        if (!searchInput) return;
        var debounceTimer;
        searchInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function() {
                self.currentSearch = searchInput.value.trim().toLowerCase();
                self.renderProducts();
            }, 200);
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
        const images = product.colors && product.colors[colorIndex] ? product.colors[colorIndex].images : [];
        
        document.getElementById('modal-main-image').src = images[0] || '';
        document.getElementById('modal-main-image').alt = product.name;
        document.getElementById('modal-title').textContent = product.name;

        const hasDiscount = product.oldPrice && product.oldPrice > product.price;
        const priceEl = document.getElementById('modal-price');
        priceEl.innerHTML = (hasDiscount ? '<span class="product-modal__price-old">' + product.oldPrice.toLocaleString('ru-RU') + ' ₽</span> ' : '') + product.price.toLocaleString('ru-RU') + ' ₽';
        
        const reviewsCount = product.reviews || 0;
        document.getElementById('modal-reviews-count').textContent = 'Отзывы (' + reviewsCount + ')';
        
        const stockEl = document.getElementById('modal-stock');
        if (stockEl) {
            if (product.inStock !== false) {
                stockEl.innerHTML = '<span class="product-modal__delivery-dot product-modal__delivery-dot--green"></span><span><strong style="color:#4caf50;">В наличии</strong> — отправка сегодня</span>';
            } else {
                stockEl.innerHTML = '<span class="product-modal__delivery-dot" style="background:#e53935;"></span><span><strong style="color:#e53935;">Нет в наличии</strong></span>';
            }
        }

        var specsEl = document.getElementById('modal-specs');
        if (specsEl) {
            var specsHtml = '';
            if (product.specs && product.specs.length) {
                product.specs.forEach(function(s) {
                    specsHtml += '<div class="product-modal__spec-row"><span class="product-modal__spec-key">' + escapeHtml(s.key) + ':</span><span class="product-modal__spec-val">' + escapeHtml(s.value) + '</span></div>';
                });
            }
            specsEl.innerHTML = specsHtml;
        }
        
        this.renderThumbnails(images);
        this.renderColors(product, colorIndex);
        
        this.updateModalCart(productId);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        var reviewsHtml = renderProductReviews(productId);
        var deliverySection = modal.querySelector('.product-modal__delivery');
        var existingReviews = modal.querySelector('.product-reviews');
        if (deliverySection && reviewsHtml && !existingReviews) {
            deliverySection.insertAdjacentHTML('afterend', reviewsHtml);
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
