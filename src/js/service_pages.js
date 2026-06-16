function initServiceForms() {
    setupServiceForm('modeling');
    setupServiceForm('scanning');
}

function setupServiceForm(type) {
    var form = document.getElementById(type + '-form');
    if (!form) return;

    var uploadZone = document.getElementById(type + '-upload-zone');
    var fileInput = document.getElementById(type + '-file-input');
    var preview = document.getElementById(type + '-preview');
    var files = [];
    var objectUrls = [];

    if (uploadZone && fileInput) {
        uploadZone.addEventListener('click', function() { fileInput.click(); });
        uploadZone.addEventListener('dragover', function(e) { e.preventDefault(); uploadZone.classList.add('dragover'); });
        uploadZone.addEventListener('dragleave', function() { uploadZone.classList.remove('dragover'); });
        uploadZone.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            addFiles(e.dataTransfer.files);
        });
        fileInput.addEventListener('change', function() {
            addFiles(fileInput.files);
            fileInput.value = '';
        });
    }

    function addFiles(fileList) {
        for (var i = 0; i < fileList.length && files.length < 10; i++) {
            if (fileList[i].type.startsWith('image/') && fileList[i].size <= 10 * 1024 * 1024) {
                files.push(fileList[i]);
            }
        }
        renderPreview();
    }

    function renderPreview() {
        if (!preview) return;
        preview.innerHTML = '';
        files.forEach(function(file, index) {
            var item = document.createElement('div');
            item.className = 'sp-preview__item';
            var img = document.createElement('img');
            var url = URL.createObjectURL(file);
            objectUrls.push(url);
            img.src = url;
            var btn = document.createElement('button');
            btn.className = 'sp-preview__remove';
            btn.textContent = '\u00d7';
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                files.splice(index, 1);
                renderPreview();
            });
            item.appendChild(img);
            item.appendChild(btn);
            preview.appendChild(item);
        });
    }

    var submitBtn = document.getElementById(type + '-submit');
    if (submitBtn) {
        submitBtn.addEventListener('click', function() {
            var desc = document.getElementById(type + '-desc');
            var name = document.getElementById(type + '-name');
            var phone = document.getElementById(type + '-phone');

            var descVal = sanitizeInput(desc.value, 2000);
            var nameVal = sanitizeInput(name.value, 100);
            var phoneVal = sanitizeInput(phone.value, 20);

            if (!descVal) { desc.focus(); return; }
            if (!nameVal) { name.focus(); return; }
            if (!phoneVal) { phone.focus(); return; }
            if (!validatePhone(phoneVal)) { alert('Введите корректный номер телефона'); phone.focus(); return; }

            var data = {
                id: type.toUpperCase() + '-' + Date.now(),
                status: 'new',
                type: type,
                createdAt: new Date().toISOString(),
                description: descVal,
                contact: {
                    name: nameVal,
                    phone: phoneVal,
                    telegram: sanitizeInput(document.getElementById(type + '-telegram').value, 100)
                },
                files: files.length,
                price: null,
                messages: [],
                timeline: [{ status: 'new', date: new Date().toISOString(), text: 'Заявка создана' }]
            };

            var user = getCurrentUser();
            if (!user) {
                alert('Войдите в аккаунт, чтобы отслеживать заявку');
                openAuth();
                return;
            }
            data.userId = user.id;
            db.collection('projects').add(data).catch(function(err) {
                console.error('Ошибка сохранения заявки:', err);
            });

            var wrap = form.closest('.sp-form-wrap');
            wrap.innerHTML =
                '<div style="padding:32px 0;text-align:center;">' +
                '<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#4caf50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>' +
                '<polyline points="22 4 12 14.01 9 11.01"/>' +
                '</svg>' +
                '<h3 style="font-size:20px;font-weight:600;color:#1a1a1a;margin:16px 0 8px;">Заявка отправлена!</h3>' +
                '<p style="font-size:14px;color:#888;">Мы свяжемся с вами в ближайшее время</p>' +
                '</div>';
        });
    }
}
