function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function escapeAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/'/g, '&#39;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function sanitizeInput(value, maxLength) {
    var val = (value || '').trim();
    if (maxLength && val.length > maxLength) val = val.substring(0, maxLength);
    return val;
}

function compressImage(file, maxWidth, quality) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var img = new Image();
            img.onload = function() {
                var canvas = document.createElement('canvas');
                var w = img.width;
                var h = img.height;
                if (w > maxWidth) {
                    h = Math.round(h * maxWidth / w);
                    w = maxWidth;
                }
                canvas.width = w;
                canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', quality || 0.7));
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

var _lightboxEl = null;
var _lightboxImg = null;
var _lightboxScale = 1;
var _lightboxTranslateX = 0;
var _lightboxTranslateY = 0;
var _lightboxDragging = false;
var _lightboxDragStartX = 0;
var _lightboxDragStartY = 0;

function openChatLightbox(src) {
    if (!_lightboxEl) {
        _lightboxEl = document.createElement('div');
        _lightboxEl.className = 'chat-lightbox';
        _lightboxEl.innerHTML = '<button class="chat-lightbox__close">&times;</button>' +
            '<img class="chat-lightbox__img">' +
            '<div class="chat-lightbox__zoom-hint">Колёсико мыши для масштабирования</div>';
        document.body.appendChild(_lightboxEl);

        _lightboxImg = _lightboxEl.querySelector('.chat-lightbox__img');

        _lightboxEl.querySelector('.chat-lightbox__close').addEventListener('click', closeChatLightbox);
        _lightboxEl.addEventListener('click', function(e) {
            if (e.target === _lightboxEl) closeChatLightbox();
        });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && _lightboxEl.classList.contains('active')) closeChatLightbox();
        });

        _lightboxEl.addEventListener('wheel', function(e) {
            e.preventDefault();
            var delta = e.deltaY > 0 ? -0.15 : 0.15;
            _lightboxScale = Math.max(0.5, Math.min(5, _lightboxScale + delta));
            updateLightboxTransform();
        }, { passive: false });

        _lightboxImg.addEventListener('mousedown', function(e) {
            _lightboxDragging = true;
            _lightboxDragStartX = e.clientX - _lightboxTranslateX;
            _lightboxDragStartY = e.clientY - _lightboxTranslateY;
            e.preventDefault();
        });
        document.addEventListener('mousemove', function(e) {
            if (!_lightboxDragging) return;
            _lightboxTranslateX = e.clientX - _lightboxDragStartX;
            _lightboxTranslateY = e.clientY - _lightboxDragStartY;
            updateLightboxTransform();
        });
        document.addEventListener('mouseup', function() {
            _lightboxDragging = false;
        });

        var lastTouchDist = 0;
        _lightboxImg.addEventListener('touchstart', function(e) {
            if (e.touches.length === 1) {
                _lightboxDragging = true;
                _lightboxDragStartX = e.touches[0].clientX - _lightboxTranslateX;
                _lightboxDragStartY = e.touches[0].clientY - _lightboxTranslateY;
            } else if (e.touches.length === 2) {
                lastTouchDist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
            }
        });
        _lightboxImg.addEventListener('touchmove', function(e) {
            e.preventDefault();
            if (e.touches.length === 1 && _lightboxDragging) {
                _lightboxTranslateX = e.touches[0].clientX - _lightboxDragStartX;
                _lightboxTranslateY = e.touches[0].clientY - _lightboxDragStartY;
                updateLightboxTransform();
            } else if (e.touches.length === 2) {
                var dist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                var scaleDelta = (dist - lastTouchDist) * 0.005;
                _lightboxScale = Math.max(0.5, Math.min(5, _lightboxScale + scaleDelta));
                lastTouchDist = dist;
                updateLightboxTransform();
            }
        }, { passive: false });
        _lightboxImg.addEventListener('touchend', function() {
            _lightboxDragging = false;
        });
    }

    _lightboxScale = 1;
    _lightboxTranslateX = 0;
    _lightboxTranslateY = 0;
    _lightboxImg.src = src;
    _lightboxImg.style.transform = '';
    _lightboxEl.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeChatLightbox() {
    if (_lightboxEl) {
        _lightboxEl.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function updateLightboxTransform() {
    if (_lightboxImg) {
        _lightboxImg.style.transform = 'translate(' + _lightboxTranslateX + 'px, ' + _lightboxTranslateY + 'px) scale(' + _lightboxScale + ')';
    }
}
