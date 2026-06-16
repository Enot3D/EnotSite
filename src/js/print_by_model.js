function initPrintOrder() {
    var submitBtn = document.getElementById('print-submit');
    if (!submitBtn) return;

    var file = null;
    var quantity = 1;

    var qtyDisplay = document.getElementById('qty-display');
    var qtyMinus = document.getElementById('qty-minus');
    var qtyPlus = document.getElementById('qty-plus');

    qtyMinus.addEventListener('click', function() {
        if (quantity > 1) {
            quantity--;
            qtyDisplay.textContent = quantity;
            updateSidebar();
        }
    });

    qtyPlus.addEventListener('click', function() {
        if (quantity < 1000) {
            quantity++;
            qtyDisplay.textContent = quantity;
            updateSidebar();
        }
    });

    document.getElementById('print-color').addEventListener('change', updateSidebar);
    document.getElementById('print-urgency').addEventListener('change', updateSidebar);
    document.getElementById('print-desc').addEventListener('input', updateSidebar);

    var zone = document.getElementById('print-upload-zone');
    var fileInput = document.getElementById('print-file-input');

    zone.addEventListener('click', function() { fileInput.click(); });
    zone.addEventListener('dragover', function(e) { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', function() { zone.classList.remove('dragover'); });
    zone.addEventListener('drop', function(e) {
        e.preventDefault();
        zone.classList.remove('dragover');
        if (e.dataTransfer.files.length) setFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', function() {
        if (fileInput.files.length) setFile(fileInput.files[0]);
        fileInput.value = '';
    });

    document.getElementById('file-remove').addEventListener('click', function() {
        file = null;
        document.getElementById('file-info').style.display = 'none';
        zone.style.display = '';
        updateSidebar();
    });

    function setFile(f) {
        var ext = f.name.split('.').pop().toLowerCase();
        if (['stl', 'obj', '3mf', 'step', 'stp'].indexOf(ext) === -1) {
            alert('Формат не подходит. Принимаем: STL, OBJ, 3MF, STEP');
            return;
        }
        if (f.size > 100 * 1024 * 1024) {
            alert('Файл слишком большой. Максимум 100 МБ.');
            return;
        }
        file = f;
        document.getElementById('file-name').textContent = f.name;
        var size = f.size;
        var sizeText = size < 1024 ? size + ' Б' : size < 1048576 ? (size / 1024).toFixed(1) + ' КБ' : (size / 1048576).toFixed(1) + ' МБ';
        document.getElementById('file-size').textContent = sizeText;
        document.getElementById('file-info').style.display = 'flex';
        zone.style.display = 'none';
        updateSidebar();
    }

    function updateSidebar() {
        var list = document.getElementById('sidebar-list');
        var desc = document.getElementById('print-desc').value;
        var colorEl = document.getElementById('print-color');
        var colorText = colorEl.options[colorEl.selectedIndex].text;
        var urgEl = document.getElementById('print-urgency');
        var urgText = urgEl.options[urgEl.selectedIndex].text;

        var html = '';
        if (file) html += '<div class="sidebar-row"><span class="sidebar-row__label">Файл</span><span class="sidebar-row__value">' + escapeHtml(file.name) + '</span></div>';
        if (desc) html += '<div class="sidebar-row"><span class="sidebar-row__label">Описание</span><span class="sidebar-row__value">' + escapeHtml(desc.substring(0, 25) + (desc.length > 25 ? '...' : '')) + '</span></div>';
        html += '<div class="sidebar-row"><span class="sidebar-row__label">Количество</span><span class="sidebar-row__value">' + quantity + ' шт.</span></div>';
        html += '<div class="sidebar-row"><span class="sidebar-row__label">Цвет</span><span class="sidebar-row__value">' + escapeHtml(colorText) + '</span></div>';
        html += '<div class="sidebar-row"><span class="sidebar-row__label">Срочность</span><span class="sidebar-row__value">' + escapeHtml(urgText) + '</span></div>';

        list.innerHTML = html || '<div class="sidebar-empty">Заполните форму</div>';
    }

    submitBtn.addEventListener('click', function() {
        if (!file) { alert('Загрузите 3D-файл'); return; }
        var desc = document.getElementById('print-desc');
        var descVal = sanitizeInput(desc.value, 2000);
        if (!descVal) { desc.focus(); return; }

        var colorEl = document.getElementById('print-color');
        var urgEl = document.getElementById('print-urgency');

        var orderData = {
            id: 'PRINT-' + Date.now(),
            status: 'new',
            type: 'print',
            createdAt: new Date().toISOString(),
            file: file.name,
            fileSize: file.size,
            description: descVal,
            quantity: quantity,
            color: colorEl.value,
            urgency: urgEl.value,
            price: null,
            messages: [],
            timeline: [{ status: 'new', date: new Date().toISOString(), text: 'Заявка на печать создана' }]
        };

        var user = getCurrentUser();
        if (!user) {
            alert('Войдите в аккаунт, чтобы отслеживать заказ');
            openAuth();
            return;
        }
        orderData.userId = user.id;
        db.collection('projects').add(orderData).catch(function(err) {
            console.error('Ошибка сохранения заказа печати:', err);
        });

        document.querySelector('.print-order__form-wrap').innerHTML =
            '<div style="padding: 40px 0; text-align: center;">' +
            '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4caf50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>' +
            '<polyline points="22 4 12 14.01 9 11.01"/>' +
            '</svg>' +
            '<h2 style="font-size:24px;font-weight:600;color:#1a1a1a;margin:20px 0 12px;">Заявка отправлена!</h2>' +
            '<p style="font-size:15px;color:#666;">Мы проанализируем модель в слайсере и сообщим точную стоимость и сроки.</p>' +
            '<p style="font-size:14px;color:#999;margin-top:12px;">Ожидайте ответ в ближайшее время.</p>' +
            '</div>';
    });

    updateSidebar();
}
