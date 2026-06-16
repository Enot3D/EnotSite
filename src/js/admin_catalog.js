function renderCatalogFilters() {
    var container = document.getElementById('catalog-filters-panel');
    if (!container) return;
    loadCategories().then(function(categories) {
        var html = '<button class="catalog__filter active" data-filter="all">Все</button>';
        categories.forEach(function(c) {
            html += '<button class="catalog__filter" data-filter="' + escapeAttr(c.id) + '">' + escapeHtml(c.name) + '</button>';
        });
        container.innerHTML = html;
        if (typeof catalog !== 'undefined') catalog.setupFilters();
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
    var defaultPrices = {
        modeling: { modeling: 'от 500 ₽', repair: 'от 300 ₽', deadline: '1-5 дней' },
        scanning: { scanning: 'от 1 500 ₽', processing: 'от 500 ₽', accuracy: 'до 0.05 мм', deadline: '1-3 дня' },
        print: { base: 'от 750 ₽', note: 'Рассчитывается индивидуально' },
        fullcycle: { modeling: 'от 500 ₽', printing: 'от 750 ₽', total: 'от 1 250 ₽' }
    };
    return db.collection('settings').doc('servicePrices').get().then(function(doc) {
        if (doc.exists && doc.data() && Object.keys(doc.data()).length > 0) {
            return doc.data();
        }
        return db.collection('settings').doc('servicePrices').set(defaultPrices).then(function() {
            return defaultPrices;
        });
    });
}

function saveServicePrices(prices) {
    return db.collection('settings').doc('servicePrices').set(prices);
}

function renderCatalogAdminControls() {
    var user = getCurrentUser();
    if (!user || !isAdmin(user)) return;

    var grid = document.getElementById('products-grid');
    if (!grid) return;

    var existingBar = document.querySelector('.catalog-admin-bar');
    if (!existingBar) {
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
    }

    grid.querySelectorAll('.product-card').forEach(function(card) {
        if (card.querySelector('.product-card__admin-controls')) return;
        var id = parseInt(card.dataset.id);
        card.insertAdjacentHTML('beforeend',
            '<div class="product-card__admin-controls">' +
                '<button class="product-card__admin-btn product-card__admin-btn--edit" data-id="' + id + '">✎</button>' +
                '<button class="product-card__admin-btn product-card__admin-btn--delete" data-id="' + id + '">✕</button>' +
            '</div>'
        );
    });

    grid.querySelectorAll('.product-card__admin-btn--edit').forEach(function(btn) {
        btn.removeEventListener('click', btn._handler);
        btn._handler = function(e) {
            e.stopPropagation();
            var id = parseInt(btn.dataset.id);
            loadProducts().then(function(products) {
                var product = products.find(function(p) { return p.id === id; });
                if (product) openProductEditor(product);
            });
        };
        btn.addEventListener('click', btn._handler);
    });

    grid.querySelectorAll('.product-card__admin-btn--delete').forEach(function(btn) {
        btn.removeEventListener('click', btn._handler);
        btn._handler = function(e) {
            e.stopPropagation();
            var id = parseInt(btn.dataset.id);
            if (!confirm('Удалить товар?')) return;
            deleteProduct(id).then(function() {
                if (typeof catalog !== 'undefined') catalog.reinit();
            });
        };
        btn.addEventListener('click', btn._handler);
    });
}

function openProductEditor(product) {
    var isNew = !product;

    loadCategories().then(function(categories) {
        var images = (product && product.colors && product.colors[0]) ? product.colors[0].images.join('\n') : '';
        var colorNames = (product && product.colors) ? product.colors.map(function(c) { return c.name; }).join(', ') : '';
        var colorHexes = (product && product.colors) ? product.colors.map(function(c) { return c.hex; }).join(', ') : '';
        var specs = (product && product.specs) ? product.specs : [];

        var catOptions = categories.map(function(c) {
            var sel = (product && product.category === c.id) ? ' selected' : '';
            return '<option value="' + c.id + '"' + sel + '>' + escapeHtml(c.name) + '</option>';
        }).join('');

        var specsHtml = '<div id="specs-list">';
        if (specs.length) {
            specs.forEach(function(s, i) {
                specsHtml += '<div class="admin-form__row specs-row" style="margin-bottom:8px;">' +
                    '<div class="admin-form__group"><input class="admin-form__input" type="text" placeholder="Название (напр. Материал)" data-spec-key="' + i + '" value="' + escapeAttr(s.key) + '"></div>' +
                    '<div class="admin-form__group" style="display:flex;gap:8px;"><input class="admin-form__input" type="text" placeholder="Значение (напр. PLA)" data-spec-val="' + i + '" value="' + escapeAttr(s.value) + '">' +
                    '<button type="button" class="admin-form__btn admin-form__btn--cancel specs-remove" data-spec-remove="' + i + '" style="flex-shrink:0;padding:8px 12px;">✕</button></div>' +
                '</div>';
            });
        }
        specsHtml += '</div>';

        var html = '<div class="admin-modal" id="product-editor-modal">' +
            '<div class="admin-modal__overlay" id="editor-overlay"></div>' +
            '<div class="admin-modal__content" style="max-width:700px;">' +
                '<button class="admin-modal__close" id="editor-close">&times;</button>' +
                '<h2 class="admin-modal__title">' + (isNew ? 'Новый товар' : 'Редактирование: ' + (product ? product.name : '')) + '</h2>' +
                '<form class="admin-form" id="product-editor-form">' +
                    '<div class="admin-form__group"><label class="admin-form__label">Название *</label><input class="admin-form__input" type="text" id="ed-name" value="' + escapeAttr(product ? product.name : '') + '" required></div>' +
                    '<div class="admin-form__group"><label class="admin-form__label">Описание</label><textarea class="admin-form__textarea" id="ed-desc" rows="3">' + escapeHtml(product ? product.description : '') + '</textarea></div>' +
                    '<div class="admin-form__row">' +
                        '<div class="admin-form__group"><label class="admin-form__label">Цена со скидкой (₽) *</label><input class="admin-form__input" type="number" id="ed-price" value="' + (product ? product.price : '') + '" required></div>' +
                        '<div class="admin-form__group"><label class="admin-form__label">Цена без скидки (₽)</label><input class="admin-form__input" type="number" id="ed-old-price" value="' + (product && product.oldPrice ? product.oldPrice : '') + '" placeholder="Оставьте пустым если нет скидки"></div>' +
                    '</div>' +
                    '<div class="admin-form__row">' +
                        '<div class="admin-form__group"><label class="admin-form__label">Категория</label><select class="admin-form__select" id="ed-category">' + catOptions + '</select></div>' +
                        '<div class="admin-form__group"><label class="admin-form__label">Материал</label><input class="admin-form__input" type="text" id="ed-material" value="' + escapeAttr(product ? product.material : '') + '"></div>' +
                    '</div>' +
                    '<div class="admin-form__group"><label class="admin-form__label"><input type="checkbox" id="ed-stock"' + (product && product.inStock === false ? '' : ' checked') + '> В наличии</label></div>' +
                    '<div class="admin-form__row">' +
                        '<div class="admin-form__group"><label class="admin-form__label">Количество на складе</label><input class="admin-form__input" type="number" id="ed-stock-qty" min="0" value="' + (product && product.stockQty != null ? product.stockQty : '') + '" placeholder="0"></div>' +
                        '<div class="admin-form__group"><label class="admin-form__label">Рейтинг</label><input class="admin-form__input" type="number" id="ed-rating" min="0" max="5" step="0.1" value="' + (product && product.rating ? product.rating : '') + '" placeholder="4.5"></div>' +
                    '</div>' +
                    '<div class="admin-form__group"><label class="admin-form__label">Изображения товара</label>' +
                        '<div class="ed-upload-zone" id="ed-upload-zone">' +
                            '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
                            '<p>Перетащите фото сюда</p>' +
                            '<p style="font-size:12px;color:#999;">или</p>' +
                            '<label class="ed-upload-btn">Выберите файлы<input type="file" id="ed-file-input" multiple accept="image/*" hidden></label>' +
                        '</div>' +
                        '<div class="ed-upload-previews" id="ed-upload-previews"></div>' +
                        '<textarea class="admin-form__textarea" id="ed-images" rows="2" style="margin-top:8px;" placeholder="Или вставьте URL изображений (по одному на строку)">' + escapeHtml(images) + '</textarea>' +
                    '</div>' +
                    '<div class="admin-form__row">' +
                        '<div class="admin-form__group"><label class="admin-form__label">Названия цветов (через запятую)</label><input class="admin-form__input" type="text" id="ed-color-names" value="' + escapeAttr(colorNames) + '"></div>' +
                        '<div class="admin-form__group"><label class="admin-form__label">HEX цвета (через запятую)</label><input class="admin-form__input" type="text" id="ed-color-hex" value="' + escapeAttr(colorHexes) + '"></div>' +
                    '</div>' +
                    '<div class="admin-form__group">' +
                        '<label class="admin-form__label">Характеристики</label>' +
                        specsHtml +
                        '<button type="button" class="admin-form__btn admin-form__btn--cancel" id="add-spec-btn" style="margin-top:8px;">+ Добавить характеристику</button>' +
                    '</div>' +
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

        document.getElementById('add-spec-btn').addEventListener('click', function() {
            var list = document.getElementById('specs-list');
            var idx = list.querySelectorAll('.specs-row').length;
            var row = document.createElement('div');
            row.className = 'admin-form__row specs-row';
            row.style.marginBottom = '8px';
            row.innerHTML = '<div class="admin-form__group"><input class="admin-form__input" type="text" placeholder="Название (напр. Материал)" data-spec-key="' + idx + '"></div>' +
                '<div class="admin-form__group" style="display:flex;gap:8px;"><input class="admin-form__input" type="text" placeholder="Значение (напр. PLA)" data-spec-val="' + idx + '">' +
                '<button type="button" class="admin-form__btn admin-form__btn--cancel specs-remove" style="flex-shrink:0;padding:8px 12px;">✕</button></div>';
            list.appendChild(row);
            row.querySelector('.specs-remove').addEventListener('click', function() { row.remove(); });
        });

        var uploadZone = document.getElementById('ed-upload-zone');
        var fileInput = document.getElementById('ed-file-input');
        var previewsContainer = document.getElementById('ed-upload-previews');
        var imagesTextarea = document.getElementById('ed-images');

        function handleFiles(files) {
            Array.from(files).forEach(function(file) {
                if (!file.type.startsWith('image/')) return;
                var preview = document.createElement('div');
                preview.className = 'ed-upload-preview ed-upload-preview--loading';
                preview.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f0f0f0;"><span style="font-size:11px;color:#999;">...</span></div><button type="button" class="ed-upload-preview__remove">&times;</button>';
                previewsContainer.appendChild(preview);

                var path = 'products/' + Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                var ref = storage.ref(path);
                ref.put(file).then(function(snapshot) {
                    return snapshot.ref.getDownloadURL();
                }).then(function(url) {
                    preview.classList.remove('ed-upload-preview--loading');
                    preview.querySelector('div').innerHTML = '<img src="' + url + '" alt="">';
                    var currentVal = imagesTextarea.value.trim();
                    imagesTextarea.value = currentVal ? currentVal + '\n' + url : url;
                    preview.querySelector('.ed-upload-preview__remove').addEventListener('click', function() {
                        preview.remove();
                        var lines = imagesTextarea.value.split('\n').filter(function(l) { return l.trim() !== url; });
                        imagesTextarea.value = lines.join('\n');
                        storage.refFromURL(url).delete().catch(function() {});
                    });
                }).catch(function(err) {
                    preview.remove();
                    alert('Ошибка загрузки: ' + err.message);
                });
            });
        }

        fileInput.addEventListener('change', function() {
            handleFiles(fileInput.files);
            fileInput.value = '';
        });

        uploadZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadZone.classList.add('ed-upload-zone--active');
        });

        uploadZone.addEventListener('dragleave', function() {
            uploadZone.classList.remove('ed-upload-zone--active');
        });

        uploadZone.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadZone.classList.remove('ed-upload-zone--active');
            handleFiles(e.dataTransfer.files);
        });

        if (images) {
            images.split('\n').forEach(function(url) {
                url = url.trim();
                if (!url) return;
                var preview = document.createElement('div');
                preview.className = 'ed-upload-preview';
                preview.innerHTML = '<img src="' + url + '" alt=""><button type="button" class="ed-upload-preview__remove">&times;</button>';
                preview.querySelector('.ed-upload-preview__remove').addEventListener('click', function() {
                    preview.remove();
                    var lines = imagesTextarea.value.split('\n').filter(function(l) { return l.trim() !== url; });
                    imagesTextarea.value = lines.join('\n');
                });
                previewsContainer.appendChild(preview);
            });
        }

        modal.querySelectorAll('.specs-remove').forEach(function(btn) {
            btn.addEventListener('click', function() {
                btn.closest('.specs-row').remove();
            });
        });

        document.getElementById('product-editor-form').addEventListener('submit', function(e) {
            e.preventDefault();
            var name = sanitizeInput(document.getElementById('ed-name').value, 200);
            var price = parseInt(document.getElementById('ed-price').value);
            if (!name || !price) { alert('Заполните название и цену'); return; }

            var oldPrice = parseInt(document.getElementById('ed-old-price').value) || null;

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

            var specKeys = modal.querySelectorAll('[data-spec-key]');
            var specsData = [];
            specKeys.forEach(function(keyEl) {
                var valEl = modal.querySelector('[data-spec-val="' + keyEl.dataset.specKey + '"]');
                var k = sanitizeInput(keyEl.value, 100);
                var v = valEl ? sanitizeInput(valEl.value, 200) : '';
                if (k && v) specsData.push({ key: k, value: v });
            });

            var productData = {
                id: product ? product.id : Date.now(),
                name: name,
                description: sanitizeInput(document.getElementById('ed-desc').value, 1000),
                price: price,
                oldPrice: oldPrice,
                category: document.getElementById('ed-category').value,
                material: sanitizeInput(document.getElementById('ed-material').value, 200),
                colors: colors,
                inStock: document.getElementById('ed-stock').checked,
                stockQty: parseInt(document.getElementById('ed-stock-qty').value) || 0,
                rating: parseFloat(document.getElementById('ed-rating').value) || 0,
                reviews: parseInt(document.getElementById('ed-reviews') ? document.getElementById('ed-reviews').value : 0) || 0,
                specs: specsData
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
    }).catch(function(err) {
        console.error('Ошибка загрузки категорий:', err);
        alert('Не удалось загрузить категории');
    });
}

function openCategoryManager() {
    loadCategories().then(function(categories) {

        function renderCatList() {
            var list = document.getElementById('cat-manager-list');
            if (!list) return;
            list.innerHTML = categories.map(function(c, i) {
                return '<div class="cat-item">' +
                    '<span class="cat-item__name" data-index="' + i + '">' + escapeHtml(c.name) + '</span>' +
                    '<span class="cat-item__id">' + escapeHtml(c.id) + '</span>' +
                    '<button class="cat-item__edit" data-index="' + i + '">✎</button>' +
                    '<button class="cat-item__delete" data-index="' + i + '">✕</button>' +
                '</div>';
            }).join('');

            list.querySelectorAll('.cat-item__edit').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var idx = parseInt(btn.dataset.index);
                    var newName = prompt('Название категории:', categories[idx].name);
                    if (newName && newName.trim()) {
                        categories[idx].name = newName.trim();
                        saveCategories(categories);
                        renderCatList();
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
    }).catch(function(err) {
        console.error('Ошибка загрузки категорий:', err);
        alert('Не удалось загрузить категории');
    });
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
