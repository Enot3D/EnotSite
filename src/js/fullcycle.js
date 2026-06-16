function initFullcycle() {
    var form = document.getElementById('project-form');
    if (!form) return;

    var currentStep = 1;
    var totalSteps = 4;
    var files = [];
    var objectUrls = [];

    document.getElementById('btn-next').addEventListener('click', nextStep);
    document.getElementById('btn-back').addEventListener('click', prevStep);
    setupUpload();
    setupFAQ();

    function setupUpload() {
        var zone = document.getElementById('upload-zone');
        var input = document.getElementById('file-input');
        if (!zone || !input) return;
        zone.addEventListener('click', function() { input.click(); });
        zone.addEventListener('dragover', function(e) { e.preventDefault(); zone.classList.add('dragover'); });
        zone.addEventListener('dragleave', function() { zone.classList.remove('dragover'); });
        zone.addEventListener('drop', function(e) {
            e.preventDefault(); zone.classList.remove('dragover');
            for (var i = 0; i < e.dataTransfer.files.length && files.length < 10; i++) {
                var f = e.dataTransfer.files[i];
                if (f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024) files.push(f);
            }
            renderPreview();
        });
        input.addEventListener('change', function() {
            for (var i = 0; i < input.files.length && files.length < 10; i++) {
                var f = input.files[i];
                if (f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024) files.push(f);
            }
            input.value = ''; renderPreview();
        });
    }

    function renderPreview() {
        var container = document.getElementById('upload-preview');
        if (!container) return;
        container.innerHTML = '';
        files.forEach(function(file, index) {
            var item = document.createElement('div');
            item.className = 'upload-preview__item';
            var img = document.createElement('img');
            var url = URL.createObjectURL(file);
            objectUrls.push(url);
            img.src = url;
            var btn = document.createElement('button');
            btn.className = 'upload-preview__remove';
            btn.textContent = '\u00d7';
            btn.addEventListener('click', function(e) { e.stopPropagation(); files.splice(index, 1); renderPreview(); });
            item.appendChild(img); item.appendChild(btn); container.appendChild(item);
        });
    }

    function nextStep() {
        if (!validateStep()) return;
        if (currentStep < totalSteps) {
            currentStep++; updateUI();
            if (currentStep === totalSteps) submitProject();
        }
    }

    function prevStep() {
        if (currentStep > 1) { currentStep--; updateUI(); }
    }

    function validateStep() {
        if (currentStep === 2) {
            var desc = document.getElementById('project-desc');
            var val = sanitizeInput(desc.value, 2000);
            if (!val) { desc.focus(); return false; }
        }
        if (currentStep === 3) {
            var name = document.getElementById('contact-name');
            var phone = document.getElementById('contact-phone');
            var nameVal = sanitizeInput(name.value, 100);
            var phoneVal = sanitizeInput(phone.value, 20);
            if (!nameVal) { name.focus(); return false; }
            if (!phoneVal) { phone.focus(); return false; }
            if (!validatePhone(phoneVal)) { alert('Введите корректный номер телефона'); phone.focus(); return false; }
            var email = document.getElementById('contact-email');
            if (email.value.trim() && !validateEmail(sanitizeInput(email.value, 100))) {
                alert('Введите корректный email'); email.focus(); return false;
            }
        }
        return true;
    }

    function updateUI() {
        document.querySelectorAll('.wizard-step').forEach(function(step) { step.classList.remove('active'); });
        document.querySelector('[data-step="' + currentStep + '"]').classList.add('active');
        document.getElementById('progress-bar').style.width = (currentStep / totalSteps * 100) + '%';
        document.getElementById('btn-back').style.visibility = currentStep === 1 ? 'hidden' : 'visible';
        var nextBtn = document.getElementById('btn-next');
        if (currentStep === totalSteps - 1) {
            nextBtn.textContent = 'Отправить';
            nextBtn.classList.add('wizard-btn--submit');
        } else if (currentStep === totalSteps) {
            document.getElementById('wizard-nav').style.display = 'none';
        } else {
            nextBtn.textContent = 'Далее';
            nextBtn.classList.remove('wizard-btn--submit');
        }
        document.querySelectorAll('.step-info').forEach(function(info, i) {
            info.classList.remove('active', 'done');
            if (i + 1 === currentStep) info.classList.add('active');
            else if (i + 1 < currentStep) info.classList.add('done');
        });
    }

    function submitProject() {
        var user = getCurrentUser();
        var projectData = {
            status: 'new',
            type: 'fullcycle',
            createdAt: new Date().toISOString(),
            photos: files.length,
            description: sanitizeInput(document.getElementById('project-desc').value, 2000),
            material: document.getElementById('project-material').value,
            urgency: document.getElementById('project-urgency').value,
            userId: user ? user.id : null,
            contact: {
                name: sanitizeInput(document.getElementById('contact-name').value, 100),
                phone: sanitizeInput(document.getElementById('contact-phone').value, 20),
                telegram: sanitizeInput(document.getElementById('contact-telegram').value, 100),
                email: sanitizeInput(document.getElementById('contact-email').value, 100)
            },
            messages: [],
            timeline: [{ status: 'new', date: new Date().toISOString(), text: 'Заявка создана' }]
        };
        db.collection('projects').add(projectData).catch(function(err) {
            console.error('Ошибка сохранения проекта:', err);
        });
    }

    function setupFAQ() {
        document.querySelectorAll('[data-faq]').forEach(function(item) {
            item.querySelector('.faq-item__question').addEventListener('click', function() {
                item.classList.toggle('open');
            });
        });
    }
}
