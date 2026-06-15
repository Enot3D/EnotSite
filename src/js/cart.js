function initCart() {
    var cart = JSON.parse(localStorage.getItem('enotspace_cart') || '[]');
    var products = [];

    db.collection('products').get().then(function(snapshot) {
        snapshot.forEach(function(doc) {
            products.push(Object.assign({ id: parseInt(doc.id) }, doc.data()));
        });

        localStorage.removeItem('enotspace_promo_applied');
        renderCart(cart, products);

        document.getElementById('cart-go-catalog').addEventListener('click', function() {
            navigate('catalog');
        });

        document.getElementById('cart-checkout').addEventListener('click', function() {
            if (cart.length === 0) return;

            var user = getCurrentUser();
            if (!user) { alert('Войдите, чтобы оформить заказ'); openAuth(); return; }

            if (typeof recordPurchase === 'function') {
                var productIds = cart.map(function(item) { return item.productId; });
                recordPurchase(productIds);
            }

            var promoApplied = JSON.parse(localStorage.getItem('enotspace_promo_applied') || 'null');
            var subtotal = 0;
            cart.forEach(function(item) {
                var p = products.find(function(pr) { return pr.id === item.productId; });
                if (p) subtotal += p.price * item.quantity;
            });
            var delivery = subtotal >= 5000 ? 0 : 350;
            var discount = promoApplied ? promoApplied.discount : 0;
            var total = subtotal + delivery - discount;

            var orderData = {
                userId: user.id,
                contact: { name: user.name, phone: user.phone, email: user.email },
                items: cart.map(function(item) {
                    var p = products.find(function(pr) { return pr.id === item.productId; });
                    return { productId: item.productId, name: p ? p.name : '', quantity: item.quantity, price: p ? p.price : 0 };
                }),
                subtotal: subtotal,
                delivery: delivery,
                discount: discount,
                total: total,
                promoCode: promoApplied ? promoApplied.code : null,
                status: 'new',
                type: 'order',
                createdAt: new Date().toISOString(),
                messages: [],
                timeline: [{ status: 'new', date: new Date().toISOString(), text: 'Заказ оформлен' }]
            };

            db.collection('projects').add(orderData).then(function() {
                alert('Заказ оформлен! Мы свяжемся с вами для подтверждения.');
                localStorage.removeItem('enotspace_cart');
                localStorage.removeItem('enotspace_promo_applied');
                cart = [];
                renderCart(cart, products);
                updateCartCount();
            });
        });

        if (typeof setupPromoCode === 'function') setupPromoCode();
    });
}

function renderCart(cart, products) {
    var itemsEl = document.getElementById('cart-items');
    var summaryEl = document.getElementById('cart-layout');
    var emptyEl = document.getElementById('cart-empty');

    if (!itemsEl || !summaryEl || !emptyEl) return;

    if (cart.length === 0) {
        summaryEl.style.display = 'none';
        emptyEl.style.display = 'block';
        return;
    }

    summaryEl.style.display = '';
    emptyEl.style.display = 'none';

    var html = '';
    var subtotal = 0;

    cart.forEach(function(item, index) {
        var p = products.find(function(pr) { return pr.id === item.productId; });
        if (!p) return;

        var firstImage = p.colors && p.colors[0] ? p.colors[0].images[0] : '';
        var itemTotal = p.price * item.quantity;
        subtotal += itemTotal;

        html += '<div class="cart-item" data-index="' + index + '">' +
            '<div class="cart-item__img"><img src="' + escapeAttr(firstImage) + '" alt="' + escapeAttr(p.name) + '" loading="lazy"></div>' +
            '<div class="cart-item__info">' +
                '<div class="cart-item__name">' + escapeHtml(p.name) + '</div>' +
            '</div>' +
            '<div class="cart-item__actions">' +
                '<div class="cart-item__counter">' +
                    '<button class="cart-item__counter-btn" data-action="minus" data-index="' + index + '">−</button>' +
                    '<span class="cart-item__counter-value">' + item.quantity + '</span>' +
                    '<button class="cart-item__counter-btn" data-action="plus" data-index="' + index + '">+</button>' +
                '</div>' +
                '<div class="cart-item__price">' + itemTotal.toLocaleString('ru-RU') + ' ₽</div>' +
                '<button class="cart-item__remove" data-index="' + index + '">' +
                    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                    '<line x1="18" y1="6" x2="6" y2="18"/>' +
                    '<line x1="6" y1="6" x2="18" y2="18"/>' +
                    '</svg>' +
                '</button>' +
            '</div>' +
        '</div>';
    });

    itemsEl.innerHTML = html;

    var delivery = subtotal >= 5000 ? 0 : 350;
    var total = subtotal + delivery;

    var summaryHtml =
        '<div class="cart-summary__row"><span class="cart-summary__row-label">Товары (' + cart.reduce(function(s, i) { return s + i.quantity; }, 0) + ')</span><span class="cart-summary__row-value">' + subtotal.toLocaleString('ru-RU') + ' ₽</span></div>' +
        '<div class="cart-summary__row' + (delivery === 0 ? ' cart-summary__row--free' : '') + '"><span class="cart-summary__row-label">Доставка</span><span class="cart-summary__row-value">' + (delivery === 0 ? 'Бесплатно' : delivery + ' ₽') + '</span></div>';

    document.getElementById('summary-rows').innerHTML = summaryHtml;
    document.getElementById('summary-total').textContent = total.toLocaleString('ru-RU') + ' ₽';

    itemsEl.querySelectorAll('.cart-item__counter-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var idx = parseInt(btn.dataset.index);
            var action = btn.dataset.action;
            if (action === 'minus') {
                if (cart[idx].quantity > 1) cart[idx].quantity--;
                else cart.splice(idx, 1);
            } else {
                cart[idx].quantity++;
            }
            localStorage.setItem('enotspace_cart', JSON.stringify(cart));
            renderCart(cart, products);
            updateCartCount();
        });
    });

    itemsEl.querySelectorAll('.cart-item__remove').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var idx = parseInt(btn.dataset.index);
            var item = btn.closest('.cart-item');
            item.classList.add('removing');
            setTimeout(function() {
                cart.splice(idx, 1);
                localStorage.setItem('enotspace_cart', JSON.stringify(cart));
                renderCart(cart, products);
                updateCartCount();
            }, 300);
        });
    });
}
