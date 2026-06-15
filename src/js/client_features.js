// === FAVORITES ===
function getFavorites() {
    return JSON.parse(localStorage.getItem('enotspace_favorites') || '[]');
}

function toggleFavorite(productId) {
    var favs = getFavorites();
    var idx = favs.indexOf(productId);
    if (idx === -1) {
        favs.push(productId);
    } else {
        favs.splice(idx, 1);
    }
    localStorage.setItem('enotspace_favorites', JSON.stringify(favs));
    return idx === -1;
}

function isFavorite(productId) {
    return getFavorites().indexOf(productId) !== -1;
}

function renderFavoriteButtons() {
    var grid = document.getElementById('products-grid');
    if (!grid) return;

    grid.querySelectorAll('.product-card').forEach(function(card) {
        var id = parseInt(card.dataset.id);
        var imgEl = card.querySelector('.product-card__image');
        if (!imgEl) return;

        var btn = document.createElement('button');
        btn.className = 'product-card__fav-btn' + (isFavorite(id) ? ' active' : '');
        btn.dataset.id = id;
        btn.innerHTML = isFavorite(id) ? '&#9829;' : '&#9825;';
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var added = toggleFavorite(id);
            btn.classList.toggle('active', added);
            btn.innerHTML = added ? '&#9829;' : '&#9825;';
        });
        imgEl.appendChild(btn);
    });
}

// === PROMO CODES ===
function getPromoCodes() {
    var saved = localStorage.getItem('enotspace_promos');
    if (saved) return JSON.parse(saved);
    return [];
}

function applyPromo(code, subtotal) {
    var promos = getPromoCodes();
    var promo = promos.find(function(p) { return p.code.toUpperCase() === code.toUpperCase(); });
    if (!promo) return { valid: false, error: 'Промокод не найден' };

    var discount = 0;
    if (promo.type === 'percent') {
        discount = Math.round(subtotal * promo.discount / 100);
    } else {
        discount = Math.min(promo.discount, subtotal);
    }

    return { valid: true, discount: discount, description: promo.description };
}

function setupPromoCode() {
    var checkoutBtn = document.getElementById('cart-checkout');
    if (!checkoutBtn) return;

    var summary = checkoutBtn.closest('.cart-summary');
    if (!summary) return;

    var promoHtml =
        '<div class="cart-promo">' +
            '<label class="cart-promo__label">Промокод</label>' +
            '<div class="cart-promo__row">' +
                '<input class="cart-promo__input" type="text" id="promo-input" placeholder="Введите код">' +
                '<button class="cart-promo__btn" id="promo-apply">Применить</button>' +
            '</div>' +
            '<div class="cart-promo__result" id="promo-result"></div>' +
        '</div>';

    checkoutBtn.insertAdjacentHTML('beforebegin', promoHtml);

    document.getElementById('promo-apply').addEventListener('click', function() {
        var code = document.getElementById('promo-input').value.trim();
        var resultEl = document.getElementById('promo-result');

        if (!code) {
            resultEl.textContent = 'Введите промокод';
            resultEl.className = 'cart-promo__result error';
            return;
        }

        var cart = JSON.parse(localStorage.getItem('enotspace_cart') || '[]');
        var products = typeof PRODUCTS !== 'undefined' ? PRODUCTS : [];
        var subtotal = 0;
        cart.forEach(function(item) {
            var p = products.find(function(pr) { return pr.id === item.productId; });
            if (p) subtotal += p.price * item.quantity;
        });

        var result = applyPromo(code, subtotal);
        if (result.valid) {
            resultEl.textContent = result.description + ': -' + result.discount.toLocaleString('ru-RU') + ' ₽';
            resultEl.className = 'cart-promo__result success';
            localStorage.setItem('enotspace_promo_applied', JSON.stringify({ code: code, discount: result.discount }));
            recalcCartSummary();
        } else {
            resultEl.textContent = result.error;
            resultEl.className = 'cart-promo__result error';
            localStorage.removeItem('enotspace_promo_applied');
        }
    });
}

function recalcCartSummary() {
    var applied = JSON.parse(localStorage.getItem('enotspace_promo_applied') || 'null');
    if (!applied) return;

    var totalEl = document.getElementById('summary-total');
    if (!totalEl) return;

    var currentText = totalEl.textContent.replace(/\s/g, '').replace('₽', '');
    var current = parseInt(currentText) || 0;
    var newTotal = Math.max(0, current - applied.discount);
    totalEl.textContent = newTotal.toLocaleString('ru-RU') + ' ₽';

    var rowsEl = document.getElementById('summary-rows');
    if (rowsEl) {
        rowsEl.insertAdjacentHTML('beforeend',
            '<div class="cart-summary__row cart-summary__row--promo">' +
                '<span class="cart-summary__row-label">Промокод (' + applied.code + ')</span>' +
                '<span class="cart-summary__row-value">-' + applied.discount.toLocaleString('ru-RU') + ' ₽</span>' +
            '</div>'
        );
    }
}

// === REVIEWS ===
function getPurchasedProducts() {
    return JSON.parse(localStorage.getItem('enotspace_purchased') || '[]');
}

function recordPurchase(productIds) {
    var user = getCurrentUser();
    if (!user) return;
    var purchased = getPurchasedProducts();
    productIds.forEach(function(id) {
        if (purchased.indexOf(id) === -1) purchased.push(id);
    });
    localStorage.setItem('enotspace_purchased', JSON.stringify(purchased));
}

function hasPurchased(productId) {
    return getPurchasedProducts().indexOf(productId) !== -1;
}

function getReviews() {
    var saved = localStorage.getItem('enotspace_reviews');
    if (saved) return JSON.parse(saved);
    return [];
}

function saveReviews(reviews) {
    localStorage.setItem('enotspace_reviews', JSON.stringify(reviews));
}

function getProductReviews(productId) {
    return getReviews().filter(function(r) { return r.productId === productId; });
}

function addReview(productId, rating, text) {
    var user = getCurrentUser();
    if (!user) return false;

    var reviews = getReviews();
    var newReview = {
        id: 'rev-' + Date.now(),
        productId: productId,
        userId: user.id,
        userName: user.name,
        rating: rating,
        text: sanitizeInput(text, 1000),
        date: new Date().toISOString()
    };
    reviews.push(newReview);
    saveReviews(reviews);
    return true;
}

function renderProductReviews(productId) {
    var reviews = getProductReviews(productId);
    var user = getCurrentUser();
    var hasReviewed = user && reviews.some(function(r) { return r.userId === user.id; });

    var html = '<div class="product-reviews">';

    var avgRating = 0;
    if (reviews.length) {
        avgRating = reviews.reduce(function(s, r) { return s + r.rating; }, 0) / reviews.length;
    }

    html += '<div class="product-reviews__header">';
    html += '<h3 class="product-reviews__title">Отзывы (' + reviews.length + ')</h3>';
    if (reviews.length) {
        html += '<div class="product-reviews__avg">';
        html += '<span class="product-reviews__avg-stars">' + renderStars(avgRating) + '</span>';
        html += '<span class="product-reviews__avg-number">' + avgRating.toFixed(1) + '</span>';
        html += '</div>';
    }
    html += '</div>';

    if (user && !hasReviewed && hasPurchased(productId)) {
        html += '<div class="product-reviews__form">';
        html += '<div class="product-reviews__rating-select" id="review-rating-select">';
        for (var i = 1; i <= 5; i++) {
            html += '<span class="product-reviews__star" data-rating="' + i + '">&#9734;</span>';
        }
        html += '</div>';
        html += '<textarea class="product-reviews__textarea" id="review-text" rows="3" placeholder="Напишите ваш отзыв..."></textarea>';
        html += '<button class="product-reviews__submit" id="review-submit">Оставить отзыв</button>';
        html += '</div>';
    } else if (user && !hasReviewed && !hasPurchased(productId)) {
        html += '<p class="product-reviews__login-hint">Купить товар, чтобы оставить отзыв</p>';
    } else if (!user) {
        html += '<p class="product-reviews__login-hint">Войдите, чтобы оставить отзыв</p>';
    }

    html += '<div class="product-reviews__list">';
    reviews.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
    reviews.forEach(function(r) {
        html += '<div class="product-reviews__item">';
        html += '<div class="product-reviews__item-header">';
        html += '<span class="product-reviews__author">' + escapeHtml(r.userName) + '</span>';
        html += '<span class="product-reviews__item-stars">' + renderStars(r.rating) + '</span>';
        html += '<span class="product-reviews__date">' + escapeHtml(new Date(r.date).toLocaleDateString('ru-RU')) + '</span>';
        html += '</div>';
        html += '<p class="product-reviews__text">' + escapeHtml(r.text) + '</p>';
        html += '</div>';
    });
    html += '</div>';
    html += '</div>';

    return html;
}

function renderStars(rating) {
    var full = Math.floor(rating);
    var half = rating % 1 >= 0.5;
    var html = '';
    for (var i = 0; i < full; i++) html += '<span class="star filled">&#9733;</span>';
    if (half) html += '<span class="star half">&#9733;</span>';
    var empty = 5 - full - (half ? 1 : 0);
    for (var j = 0; j < empty; j++) html += '<span class="star empty">&#9734;</span>';
    return html;
}

function setupReviewForm() {
    var submitBtn = document.getElementById('review-submit');
    if (!submitBtn) return;

    var selectedRating = 0;
    var stars = document.querySelectorAll('#review-rating-select .product-reviews__star');

    stars.forEach(function(star) {
        star.addEventListener('click', function() {
            selectedRating = parseInt(star.dataset.rating);
            stars.forEach(function(s, i) {
                s.innerHTML = i < selectedRating ? '&#9733;' : '&#9734;';
                s.classList.toggle('active', i < selectedRating);
            });
        });
    });

    submitBtn.addEventListener('click', function() {
        var text = document.getElementById('review-text').value.trim();
        if (!selectedRating) { alert('Выберите оценку'); return; }
        if (!text) { alert('Напишите отзыв'); return; }

        var modal = document.getElementById('product-modal');
        var productId = parseInt(modal.dataset.productId);

        if (addReview(productId, selectedRating, text)) {
            var reviewsContainer = modal.querySelector('.product-reviews');
            if (reviewsContainer) {
                reviewsContainer.outerHTML = renderProductReviews(productId);
                setupReviewForm();
            }
            alert('Спасибо за отзыв!');
        }
    });
}

// === REPEAT ORDER ===
function repeatOrder(orderIndex) {
    var projects = JSON.parse(localStorage.getItem('enotspace_projects') || '[]');
    var project = projects[orderIndex];
    if (!project) return;

    var products = typeof loadProducts === 'function' ? loadProducts() : PRODUCTS;
    var cart = JSON.parse(localStorage.getItem('enotspace_cart') || '[]');

    if (project.file) {
        alert('Заказ содержит 3D-файл "' + project.file + '". Для повтора перейдите на страницу "3D-печать по модели".');
        return;
    }

    if (project.type === 'fullcycle') {
        navigate('fullcycle');
        return;
    }

    if (project.type === 'modeling' || project.type === 'scanning') {
        navigate(project.type);
        return;
    }

    alert('Заказ добавлен! Оформите его в корзине.');
    navigate('cart');
}

// === FAVORITES PAGE ===
function renderFavoritesPage() {
    var favIds = getFavorites();
    var products = typeof loadProducts === 'function' ? loadProducts() : PRODUCTS;
    var favProducts = products.filter(function(p) { return favIds.indexOf(p.id) !== -1; });

    var html = '<section class="catalog">';
    html += '<div class="catalog__header"><h1 class="catalog__title">Избранное</h1></div>';

    if (favProducts.length === 0) {
        html += '<div class="cart-empty" style="display:block;">';
        html += '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
        html += '<h2>Избранное пусто</h2>';
        html += '<p>Добавляйте товары, нажимая на сердечко</p>';
        html += '<button class="cart-empty__btn" onclick="navigate(\'catalog\')">Перейти в каталог</button>';
        html += '</div>';
    } else {
        html += '<div class="catalog__grid" id="products-grid">';
        favProducts.forEach(function(product) {
            var firstImage = product.colors[0].images[0];
            html += '<div class="product-card" data-id="' + product.id + '">';
            html += '<div class="product-card__image"><img src="' + firstImage + '" alt="' + escapeAttr(product.name) + '" loading="lazy">';
            html += '<button class="product-card__fav-btn active" data-id="' + product.id + '">&#9829;</button>';
            if (!product.inStock) html += '<span class="product-card__badge">Нет в наличии</span>';
            html += '</div>';
            html += '<div class="product-card__body">';
            html += '<h3 class="product-card__title">' + escapeHtml(product.name) + '</h3>';
            html += '<p class="product-card__description">' + escapeHtml(product.description) + '</p>';
            html += '<div class="product-card__footer">';
            html += '<div class="product-card__price">' + product.price.toLocaleString('ru-RU') + ' <span>&#8381;</span></div>';
            html += '<div class="product-card__cart-wrap">';
            html += '<button class="product-card__add-btn">В корзину</button>';
            html += '<div class="product-card__cart-counter">';
            html += '<button class="product-card__cart-btn" data-action="decrease">&minus;</button>';
            html += '<span class="product-card__cart-quantity"></span>';
            html += '<button class="product-card__cart-btn" data-action="increase">+</button>';
            html += '</div></div></div></div></div>';
        });
        html += '</div>';
    }

    html += '</section>';
    return html;
}

function setupFavoritesNav() {
    // Favorites link is now in HTML directly
}

// === ABOUT PAGE ===
function loadAboutData() {
    var saved = localStorage.getItem('enotspace_about');
    if (saved) return JSON.parse(saved);
    return {
        blocks: [
            { icon: 'layers', title: 'О компании', text: 'Заполните информацию о вашей компании.' },
            { icon: 'users', title: 'Команда', text: 'Расскажите о вашей команде.' },
            { icon: 'clock', title: 'Сроки', text: 'Укажите ваши сроки работы.' },
            { icon: 'shield', title: 'Гарантии', text: 'Опишите ваши гарантии качества.' }
        ],
        stats: [
            { number: '0', label: 'Заказов' },
            { number: '0', label: 'Клиентов' },
            { number: '0', label: 'Лет опыта' },
            { number: '0', label: 'На связи' }
        ],
        equipment: [
            { title: 'Оборудование 1', text: 'Описание оборудования.' },
            { title: 'Оборудование 2', text: 'Описание оборудования.' },
            { title: 'Оборудование 3', text: 'Описание оборудования.' }
        ],
        contact: {
            phone: '',
            email: '',
            address: ''
        }
    };
}

function saveAboutData(data) {
    localStorage.setItem('enotspace_about', JSON.stringify(data));
}

function renderAboutPage() {
    var user = getCurrentUser();
    var data = loadAboutData();
    var isAdminUser = isAdmin(user);

    var html = '<section class="about-page">';
    html += '<div class="about-page__hero">';
    html += '<h1 class="about-page__title">О нас</h1>';
    html += '<p class="about-page__subtitle">Команда профессионалов в мире 3D-технологий</p>';
    if (isAdminUser) html += '<button class="about-edit-btn" id="about-edit-btn">✎ Редактировать</button>';
    html += '</div>';

    html += '<div class="about-page__content">';
    data.blocks.forEach(function(block) {
        html += '<div class="about-page__block">';
        html += '<div class="about-page__icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f98130" stroke-width="1.5">';
        if (block.icon === 'layers') html += '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>';
        else if (block.icon === 'users') html += '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>';
        else if (block.icon === 'clock') html += '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>';
        else if (block.icon === 'shield') html += '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>';
        html += '</svg></div>';
        html += '<h2 class="about-page__block-title">' + escapeHtml(block.title) + '</h2>';
        html += '<p class="about-page__text">' + escapeHtml(block.text) + '</p>';
        html += '</div>';
    });
    html += '</div>';

    html += '<div class="about-page__stats-row">';
    data.stats.forEach(function(s) {
        html += '<div class="about-page__stat"><div class="about-page__stat-number">' + escapeHtml(s.number) + '</div><div class="about-page__stat-label">' + escapeHtml(s.label) + '</div></div>';
    });
    html += '</div>';

    html += '<div class="about-page__equipment">';
    html += '<h2 class="about-page__section-title">Оборудование</h2>';
    html += '<div class="about-page__equip-grid">';
    data.equipment.forEach(function(e) {
        html += '<div class="about-page__equip-card"><h3>' + escapeHtml(e.title) + '</h3><p>' + escapeHtml(e.text) + '</p></div>';
    });
    html += '</div></div>';

    html += '<div class="about-page__contact-block">';
    html += '<h2 class="about-page__section-title">Контакты</h2>';
    html += '<div class="about-page__contact-grid">';
    html += '<div class="about-page__contact-item"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f98130" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg><div><strong>Телефон</strong><p>' + escapeHtml(data.contact.phone) + '</p></div></div>';
    html += '<div class="about-page__contact-item"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f98130" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg><div><strong>Email</strong><p>' + escapeHtml(data.contact.email) + '</p></div></div>';
    html += '<div class="about-page__contact-item"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f98130" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><div><strong>Адрес</strong><p>' + escapeHtml(data.contact.address) + '</p></div></div>';
    html += '</div></div>';

    html += '</section>';
    return html;
}

function openAboutEditor() {
    var data = loadAboutData();

    var html = '<div class="admin-modal" id="about-editor-modal">';
    html += '<div class="admin-modal__overlay" id="about-overlay"></div>';
    html += '<div class="admin-modal__content">';
    html += '<button class="admin-modal__close" id="about-close">&times;</button>';
    html += '<h2 class="admin-modal__title">Редактирование "О нас"</h2>';
    html += '<form class="admin-form" id="about-editor-form">';

    html += '<h3 class="about-editor-section">Блоки информации</h3>';
    data.blocks.forEach(function(block, i) {
        html += '<div class="about-editor-block">';
        html += '<div class="admin-form__row">';
        html += '<div class="admin-form__group"><label class="admin-form__label">Иконка</label><select class="admin-form__select" data-block="' + i + '" data-field="icon"><option value="layers"' + (block.icon === 'layers' ? ' selected' : '') + '>layers</option><option value="users"' + (block.icon === 'users' ? ' selected' : '') + '>users</option><option value="clock"' + (block.icon === 'clock' ? ' selected' : '') + '>clock</option><option value="shield"' + (block.icon === 'shield' ? ' selected' : '') + '>shield</option></select></div>';
        html += '<div class="admin-form__group"><label class="admin-form__label">Заголовок</label><input class="admin-form__input" type="text" data-block="' + i + '" data-field="title" value="' + escapeAttr(block.title) + '"></div>';
        html += '</div>';
        html += '<div class="admin-form__group"><label class="admin-form__label">Текст</label><textarea class="admin-form__textarea" data-block="' + i + '" data-field="text" rows="2">' + escapeHtml(block.text) + '</textarea></div>';
        html += '</div>';
    });

    html += '<h3 class="about-editor-section">Статистика</h3>';
    data.stats.forEach(function(s, i) {
        html += '<div class="admin-form__row">';
        html += '<div class="admin-form__group"><label class="admin-form__label">Число</label><input class="admin-form__input" type="text" data-stat="' + i + '" data-field="number" value="' + escapeAttr(s.number) + '"></div>';
        html += '<div class="admin-form__group"><label class="admin-form__label">Подпись</label><input class="admin-form__input" type="text" data-stat="' + i + '" data-field="label" value="' + escapeAttr(s.label) + '"></div>';
        html += '</div>';
    });

    html += '<h3 class="about-editor-section">Оборудование</h3>';
    data.equipment.forEach(function(e, i) {
        html += '<div class="admin-form__row">';
        html += '<div class="admin-form__group"><label class="admin-form__label">Название</label><input class="admin-form__input" type="text" data-equip="' + i + '" data-field="title" value="' + escapeAttr(e.title) + '"></div>';
        html += '</div>';
        html += '<div class="admin-form__group"><label class="admin-form__label">Описание</label><textarea class="admin-form__textarea" data-equip="' + i + '" data-field="text" rows="2">' + escapeHtml(e.text) + '</textarea></div>';
    });

    html += '<h3 class="about-editor-section">Контакты</h3>';
    html += '<div class="admin-form__group"><label class="admin-form__label">Телефон</label><input class="admin-form__input" type="text" data-contact="phone" value="' + escapeAttr(data.contact.phone) + '"></div>';
    html += '<div class="admin-form__group"><label class="admin-form__label">Email</label><input class="admin-form__input" type="text" data-contact="email" value="' + escapeAttr(data.contact.email) + '"></div>';
    html += '<div class="admin-form__group"><label class="admin-form__label">Адрес</label><input class="admin-form__input" type="text" data-contact="address" value="' + escapeAttr(data.contact.address) + '"></div>';

    html += '<div class="admin-form__actions">';
    html += '<button type="button" class="admin-form__btn admin-form__btn--cancel" id="about-cancel">Отмена</button>';
    html += '<button type="submit" class="admin-form__btn admin-form__btn--save">Сохранить</button>';
    html += '</div></form></div></div>';

    document.body.insertAdjacentHTML('beforeend', html);
    document.body.style.overflow = 'hidden';

    var modal = document.getElementById('about-editor-modal');
    document.getElementById('about-overlay').addEventListener('click', closeAboutEditor);
    document.getElementById('about-close').addEventListener('click', closeAboutEditor);
    document.getElementById('about-cancel').addEventListener('click', closeAboutEditor);

    document.getElementById('about-editor-form').addEventListener('submit', function(e) {
        e.preventDefault();

        modal.querySelectorAll('[data-block]').forEach(function(inp) {
            var i = parseInt(inp.dataset.block);
            var field = inp.dataset.field;
            data.blocks[i][field] = field === 'text' ? sanitizeInput(inp.value, 2000) : sanitizeInput(inp.value, 200);
        });

        modal.querySelectorAll('[data-stat]').forEach(function(inp) {
            var i = parseInt(inp.dataset.stat);
            var field = inp.dataset.field;
            data.stats[i][field] = sanitizeInput(inp.value, 100);
        });

        modal.querySelectorAll('[data-equip]').forEach(function(inp) {
            var i = parseInt(inp.dataset.equip);
            var field = inp.dataset.field;
            data.equipment[i][field] = field === 'text' ? sanitizeInput(inp.value, 2000) : sanitizeInput(inp.value, 200);
        });

        modal.querySelectorAll('[data-contact]').forEach(function(inp) {
            var field = inp.dataset.contact;
            data.contact[field] = sanitizeInput(inp.value, 200);
        });

        saveAboutData(data);
        closeAboutEditor();
        navigate('about');
    });

    function closeAboutEditor() {
        modal.remove();
        document.body.style.overflow = '';
    }
}

function initAboutPage() {
    var editBtn = document.getElementById('about-edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', openAboutEditor);
    }
}

// === REVIEWS PAGE ===
function initReviewsPage() {
    var reviews = getReviews();
    var products = typeof loadProducts === 'function' ? loadProducts() : PRODUCTS;

    var avgRating = reviews.length ? (reviews.reduce(function(s, r) { return s + r.rating; }, 0) / reviews.length) : 0;
    var stars5 = reviews.filter(function(r) { return r.rating === 5; }).length;
    var stars4 = reviews.filter(function(r) { return r.rating === 4; }).length;
    var stars3 = reviews.filter(function(r) { return r.rating === 3; }).length;

    var statsHtml = '<div class="reviews-stats__overall">';
    statsHtml += '<div class="reviews-stats__number">' + avgRating.toFixed(1) + '</div>';
    statsHtml += '<div class="reviews-stats__stars">' + renderStars(avgRating) + '</div>';
    statsHtml += '<div class="reviews-stats__count">' + reviews.length + ' отзывов</div>';
    statsHtml += '</div>';
    statsHtml += '<div class="reviews-stats__bars">';
    statsHtml += '<div class="reviews-stats__bar"><span>5 ★</span><div class="reviews-stats__bar-track"><div class="reviews-stats__bar-fill" style="width:' + (reviews.length ? Math.round(stars5 / reviews.length * 100) : 0) + '%"></div></div><span>' + stars5 + '</span></div>';
    statsHtml += '<div class="reviews-stats__bar"><span>4 ★</span><div class="reviews-stats__bar-track"><div class="reviews-stats__bar-fill" style="width:' + (reviews.length ? Math.round(stars4 / reviews.length * 100) : 0) + '%"></div></div><span>' + stars4 + '</span></div>';
    statsHtml += '<div class="reviews-stats__bar"><span>3 ★</span><div class="reviews-stats__bar-track"><div class="reviews-stats__bar-fill" style="width:' + (reviews.length ? Math.round(stars3 / reviews.length * 100) : 0) + '%"></div></div><span>' + stars3 + '</span></div>';
    statsHtml += '</div>';

    document.getElementById('reviews-stats').innerHTML = statsHtml;

    renderReviewsList(reviews, products);

    document.querySelectorAll('.reviews-filter').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.reviews-filter').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            var rating = btn.dataset.rating;
            var filtered = rating === 'all' ? reviews : reviews.filter(function(r) { return r.rating === parseInt(rating); });
            renderReviewsList(filtered, products);
        });
    });
}

function renderReviewsList(reviews, products) {
    var list = document.getElementById('reviews-list');
    if (!list) return;

    reviews.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });

    if (reviews.length === 0) {
        list.innerHTML = '<div class="reviews-page__empty">Отзывов пока нет</div>';
        return;
    }

    var html = '';
    reviews.forEach(function(r) {
        var product = products.find(function(p) { return p.id === r.productId; });
        var productName = product ? product.name : 'Товар';

        html += '<div class="review-card">';
        html += '<div class="review-card__header">';
        html += '<div class="review-card__avatar">' + escapeHtml(r.userName.charAt(0).toUpperCase()) + '</div>';
        html += '<div class="review-card__info">';
        html += '<div class="review-card__name">' + escapeHtml(r.userName) + '</div>';
        html += '<div class="review-card__product">Товар: ' + escapeHtml(productName) + '</div>';
        html += '</div>';
        html += '<div class="review-card__meta">';
        html += '<div class="review-card__stars">' + renderStars(r.rating) + '</div>';
        html += '<div class="review-card__date">' + escapeHtml(new Date(r.date).toLocaleDateString('ru-RU')) + '</div>';
        html += '</div>';
        html += '</div>';
        html += '<p class="review-card__text">' + escapeHtml(r.text) + '</p>';
        html += '</div>';
    });

    list.innerHTML = html;
}
