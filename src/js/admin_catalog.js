function renderCatalogFilters() {
    var container = document.getElementById('catalog-filters');
    if (!container) return;
    loadCategories().then(function(categories) {
        var html = '<button class="catalog__filter active" data-filter="all">Все</button>';
        categories.forEach(function(c) {
            html += '<button class="catalog__filter" data-filter="' + escapeAttr(c.id) + '">' + escapeHtml(c.name) + '</button>';
        });
        container.innerHTML = html;
    });
}

function loadProducts() {
    return db.collection('products').get().then(function(snapshot) {
        var products = [];
        snapshot.forEach(function(doc) {
            products.push(Object.assign({ id: parseInt(doc.id) }, doc.data()));
        });
        return products.length > 0 ? products : PRODUCTS.slice();
    });
}

function saveProducts(products) {
    var batch = db.batch();
    products.forEach(function(p) {
        batch.set(db.collection('products').doc(String(p.id)), p);
    });
    return batch.commit();
}

function saveProduct(product) {
    return db.collection('products').doc(String(product.id)).set(product, { merge: true });
}

function deleteProduct(productId) {
    return db.collection('products').doc(String(productId)).delete();
}

function loadCategories() {
    return db.collection('settings').doc('categories').get().then(function(doc) {
        return doc.exists ? doc.data().categories : [];
    });
}

function saveCategories(cats) {
    return db.collection('settings').doc('categories').set({ categories: cats });
}

function loadServicePrices() {
    return db.collection('settings').doc('servicePrices').get().then(function(doc) {
        return doc.exists ? doc.data() : {};
    });
}

function saveServicePrices(prices) {
    return db.collection('settings').doc('servicePrices').set(prices);
}

function renderCatalogAdminControls() {
    var user = getCurrentUser();
    if (!user || !isAdmin(user)) return;

    var existingBar = document.querySelector('.catalog-admin-bar');
    if (existingBar) return;

    var grid = document.getElementById('products-grid');
    if (!grid) return;

    grid.insertAdjacentHTML('beforebegin',
        '<div class="catalog-admin-bar">' +
            '<button class="catalog-admin-btn" id="admin-add-product">+ Добавить товар</button>' +
            '<button class="catalog-admin-btn catalog-admin-btn--secondary" id="admin-manage-categories">Управление категориями</button>' +
        '</div>'
    );

    document.getElementById('admin-add-product').addEventListener('click', function() {
        openProductEditor(null);
    });

    document.getElementById('admin-manage-categories').addEventListener('click', function() {
        openCategoryManager();
    });

    grid.querySelectorAll('.product-card').forEach(function(card) {
        var id = parseInt(card.dataset.id);
        card.insertAdjacentHTML('beforeend',
            '<div class="product-card__admin-controls">' +
                '<button class="product-card__admin-btn product-card__admin-btn--edit" data-id="' + id + '">✎</button>' +
                '<button class="product-card__admin-btn product-card__admin-btn--delete" data-id="' + id + '">✕</button>' +
            '</div>'
        );
    });

    grid.querySelectorAll('.product-card__admin-btn--edit').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var id = parseInt(btn.dataset.id);
            loadProducts().then(function(products) {
                var product = products.find(function(p) { return p.id === id; });
                if (product) openProductEditor(product);
            });
        });
    });

    grid.querySelectorAll('.product-card__admin-btn--delete').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var id = parseInt(btn.dataset.id);
            if (!confirm('Удалить товар?')) return;
            deleteProduct(id).then(function() {
                if (typeof catalog !== 'undefined') catalog.reinit();
            });
        });
    });
}

function openProductEditor(product) {
    var isNew = !product;

    loadCategories().then(function(categories) {
    var images = (product && product.colors && product.colors[0]) ? product.colors[0].images.join('\n') : '';
    var colorNames = (product && product.colors) ? product.colors.map(function(c) { return c.name; }).join(', ') : '';
    var colorHexes = (product && product.colors) ? product.colors.map(function(c) { return c.hex; }).join(', ') : '';

    var catOptions = categories.map(function(c) {
        var sel = (product && product.category === c.id) ? ' selected' : '';
        return '<option value="' + c.id + '"' + sel + '>' + escapeHtml(c.name) + '</option>';
    }).join('');

    var html = '<div class="admin-modal" id="product-editor-modal">' +
        '<div class="admin-modal__overlay" id="editor-overlay"></div>' +
        '<div class="admin-modal__content">' +
            '<button class="admin-modal__close" id="editor-close">&times;</button>' +
            '<h2 class="admin-modal__title">' + (isNew ? 'Новый товар' : 'Редактирование: ' + (product ? product.name : '')) + '</h2>' +
            '<form class="admin-form" id="product-editor-form">' +
                '<div class="admin-form__row">' +
                    '<div class="admin-form__group"><label class="admin-form__label">Название *</label><input class="admin-form__input" type="text" id="ed-name" value="' + escapeAttr(product ? product.name : '') + '" required></div>' +
                    '<div class="admin-form__group"><label class="admin-form__label">Цена (₽) *</label><input class="admin-form__input" type="number" id="ed-price" value="' + (product ? product.price : '') + '" required></div>' +
                '</div>' +
                '<div class="admin-form__group"><label class="admin-form__label">Описание</label><textarea class="admin-form__textarea" id="ed-desc" rows="3">' + escapeHtml(product ? product.description : '') + '</textarea></div>' +
                '<div class="admin-form__row">' +
                    '<div class="admin-form__group"><label class="admin-form__label">Категория</label><select class="admin-form__select" id="ed-category">' + catOptions + '</select></div>' +
                    '<div class="admin-form__group"><label class="admin-form__label">Материал</label><input class="admin-form__input" type="text" id="ed-material" value="' + escapeAttr(product ? product.material : '') + '"></div>' +
                '</div>' +
                '<div class="admin-form__group"><label class="admin-form__label">URL изображений (по одному на строку)</label><textarea class="admin-form__textarea" id="ed-images" rows="3" placeholder="https://...">' + escapeHtml(images) + '</textarea></div>' +
                '<div class="admin-form__row">' +
                    '<div class="admin-form__group"><label class="admin-form__label">Названия цветов (через запятую)</label><input class="admin-form__input" type="text" id="ed-color-names" value="' + escapeAttr(colorNames) + '"></div>' +
                    '<div class="admin-form__group"><label class="admin-form__label">HEX цвета (через запятую)</label><input class="admin-form__input" type="text" id="ed-color-hex" value="' + escapeAttr(colorHexes) + '"></div>' +
                '</div>' +
                '<div class="admin-form__row">' +
                    '<div class="admin-form__group"><label class="admin-form__label">Рейтинг</label><input class="admin-form__input" type="number" step="0.1" min="0" max="5" id="ed-rating" value="' + (product ? product.rating : '4.5') + '"></div>' +
                    '<div class="admin-form__group"><label class="admin-form__label">Отзывов</label><input class="admin-form__input" type="number" id="ed-reviews" value="' + (product ? product.reviews : '0') + '"></div>' +
                '</div>' +
                '<div class="admin-form__group"><label class="admin-form__checkbox"><input type="checkbox" id="ed-stock"' + (product && product.inStock === false ? '' : ' checked') + '> В наличии</label></div>' +
                '<div class="admin-form__actions">' +
                    '<button type="button" class="admin-form__btn admin-form__btn--cancel" id="editor-cancel">Отмена</button>' +
                    '<button type="submit" class="admin-form__btn admin-form__btn--save">Сохранить</button>' +
                '</div>' +
            '</form>' +
        '</div>' +
    '</div>';

    document.body.insertAdjacentHTML('beforeend', html);
    document.body.style.overflow = 'hidden';

    var modal = document.getElementById('product-editor-modal');
    document.getElementById('editor-overlay').addEventListener('click', closeEditor);
    document.getElementById('editor-close').addEventListener('click', closeEditor);
    document.getElementById('editor-cancel').addEventListener('click', closeEditor);

    document.getElementById('product-editor-form').addEventListener('submit', function(e) {
        e.preventDefault();
        var name = sanitizeInput(document.getElementById('ed-name').value, 200);
        var price = parseInt(document.getElementById('ed-price').value);
        if (!name || !price) { alert('Заполните название и цену'); return; }

        var imagesRaw = document.getElementById('ed-images').value.trim().split('\n').filter(function(l) { return l.trim(); });
        var colorNamesRaw = document.getElementById('ed-color-names').value.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
        var colorHexesRaw = document.getElementById('ed-color-hex').value.split(',').map(function(s) { return s.trim(); }).filter(Boolean);

        var colors = [];
        var maxColors = Math.max(colorNamesRaw.length, colorHexesRaw.length, 1);
        for (var i = 0; i < maxColors; i++) {
            colors.push({
                name: colorNamesRaw[i] || 'Цвет ' + (i + 1),
                hex: colorHexesRaw[i] || '#cccccc',
                images: imagesRaw.length ? imagesRaw : ['https://via.placeholder.com/800']
            });
        }

        var productData = {
            id: product ? product.id : Date.now(),
            name: name,
            description: sanitizeInput(document.getElementById('ed-desc').value, 1000),
            price: price,
            category: document.getElementById('ed-category').value,
            material: sanitizeInput(document.getElementById('ed-material').value, 200),
            colors: colors,
            inStock: document.getElementById('ed-stock').checked,
            rating: parseFloat(document.getElementById('ed-rating').value) || 4.5,
            reviews: parseInt(document.getElementById('ed-reviews').value) || 0
        };

        saveProduct(productData).then(function() {
            closeEditor();
            if (typeof catalog !== 'undefined') catalog.reinit();
        }).catch(function(err) {
            console.error('Ошибка сохранения товара:', err);
            alert('Ошибка сохранения: ' + err.message);
        });
    });

    function closeEditor() {
        modal.remove();
        document.body.style.overflow = '';
    }
    }); // end loadCategories().then
}
            });
        });

        list.querySelectorAll('.cat-item__delete').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var idx = parseInt(btn.dataset.index);
                if (!confirm('Удалить категорию "' + categories[idx].name + '"?')) return;
                categories.splice(idx, 1);
                saveCategories(categories);
                renderCatList();
            });
        });
    }

    var html = '<div class="admin-modal" id="cat-manager-modal">' +
        '<div class="admin-modal__overlay" id="cat-overlay"></div>' +
        '<div class="admin-modal__content">' +
            '<button class="admin-modal__close" id="cat-close">&times;</button>' +
            '<h2 class="admin-modal__title">Управление категориями</h2>' +
            '<div class="cat-add">' +
                '<input class="admin-form__input" type="text" id="new-cat-name" placeholder="Название новой категории">' +
                '<input class="admin-form__input" type="text" id="new-cat-id" placeholder="ID (latin)">' +
                '<button class="admin-form__btn admin-form__btn--save" id="add-cat-btn">Добавить</button>' +
            '</div>' +
            '<div class="cat-list" id="cat-manager-list"></div>' +
        '</div>' +
    '</div>';

    document.body.insertAdjacentHTML('beforeend', html);
    document.body.style.overflow = 'hidden';

    var modal = document.getElementById('cat-manager-modal');
    document.getElementById('cat-overlay').addEventListener('click', closeCatMgr);
    document.getElementById('cat-close').addEventListener('click', closeCatMgr);
    document.getElementById('add-cat-btn').addEventListener('click', function() {
        var name = sanitizeInput(document.getElementById('new-cat-name').value, 50);
        var id = sanitizeInput(document.getElementById('new-cat-id').value, 30).toLowerCase().replace(/[^a-z0-9_-]/g, '');
        if (!name || !id) { alert('Заполните оба поля'); return; }
        if (categories.some(function(c) { return c.id === id; })) { alert('Категория с таким ID уже есть'); return; }
        categories.push({ id: id, name: name });
        saveCategories(categories);
        document.getElementById('new-cat-name').value = '';
        document.getElementById('new-cat-id').value = '';
        renderCatList();
    });

    renderCatList();

    function closeCatMgr() {
        modal.remove();
        document.body.style.overflow = '';
    }
    }); // end loadCategories().then
}

function renderServicePriceEditor() {
    var user = getCurrentUser();
    if (!user || !isAdmin(user)) return;

    loadServicePrices().then(function(prices) {
        var sections = document.querySelectorAll('.sp-sidebar__list');
        sections.forEach(function(list) {
            list.insertAdjacentHTML('afterend', '<button class="sp-price-edit-btn" data-service-edit>✎ Редактировать цены</button>');
        });

        document.querySelectorAll('[data-service-edit]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                openServicePriceEditor(prices);
            });
        });
    });
}

function openServicePriceEditor(prices) {
    if (!prices) prices = {};

    var html = '<div class="admin-modal" id="price-editor-modal">' +
        '<div class="admin-modal__overlay" id="price-overlay"></div>' +
        '<div class="admin-modal__content">' +
            '<button class="admin-modal__close" id="price-close">&times;</button>' +
            '<h2 class="admin-modal__title">Редактирование цен услуг</h2>' +
            '<form class="admin-form" id="price-editor-form">';

    var labels = {
        'modeling.modeling': 'Моделирование', 'modeling.repair': 'Доработка', 'modeling.deadline': 'Сроки',
        'scanning.scanning': 'Сканирование', 'scanning.processing': 'Обработка скана', 'scanning.accuracy': 'Точность', 'scanning.deadline': 'Сроки',
        'print.base': 'Базовая цена печати', 'print.note': 'Примечание',
        'fullcycle.modeling': 'Моделирование', 'fullcycle.printing': 'Печать', 'fullcycle.total': 'Итого'
    };

    for (var service in prices) {
        html += '<div class="price-section"><h3 class="price-section__title">' + escapeHtml(service) + '</h3>';
        for (var key in prices[service]) {
            var label = labels[service + '.' + key] || key;
            html += '<div class="admin-form__group"><label class="admin-form__label">' + escapeHtml(label) + '</label>' +
                '<input class="admin-form__input" type="text" data-service="' + service + '" data-key="' + key + '" value="' + escapeAttr(prices[service][key]) + '"></div>';
        }
        html += '</div>';
    }

    html += '<div class="admin-form__actions">' +
        '<button type="button" class="admin-form__btn admin-form__btn--cancel" id="price-cancel">Отмена</button>' +
        '<button type="submit" class="admin-form__btn admin-form__btn--save">Сохранить</button>' +
        '</div></form></div></div>';

    document.body.insertAdjacentHTML('beforeend', html);
    document.body.style.overflow = 'hidden';

    var modal = document.getElementById('price-editor-modal');
    document.getElementById('price-overlay').addEventListener('click', closePriceEditor);
    document.getElementById('price-close').addEventListener('click', closePriceEditor);
    document.getElementById('price-cancel').addEventListener('click', closePriceEditor);

    document.getElementById('price-editor-form').addEventListener('submit', function(e) {
        e.preventDefault();
        var updated = {};
        modal.querySelectorAll('input[data-service]').forEach(function(inp) {
            var s = inp.dataset.service;
            var k = inp.dataset.key;
            if (!updated[s]) updated[s] = {};
            updated[s][k] = sanitizeInput(inp.value, 200);
        });
        saveServicePrices(updated);
        closePriceEditor();
        alert('Цены обновлены! Обновите страницу чтобы увидеть изменения.');
    });

    function closePriceEditor() {
        modal.remove();
        document.body.style.overflow = '';
    }
}
