function hashPassword(password) {
    var hash = 0;
    for (var i = 0; i < password.length; i++) {
        var chr = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return 'h_' + Math.abs(hash).toString(36) + '_' + password.length;
}

function validatePhone(phone) {
    return /^[\+]?[\d\s\-\(\)]{7,20}$/.test(phone);
}

function validateEmail(email) {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function checkAndSetFirstAdmin(userId) {
    return db.collection('users').where('role', '==', 'admin').limit(1).get().then(function(snapshot) {
        if (snapshot.empty) {
            return db.collection('users').doc(userId).update({ role: 'admin' }).then(function() {
                return true;
            });
        }
        return false;
    });
}

function initAuth() {
    var modal = document.getElementById('auth-modal');
    if (!modal) return;

    var overlay = document.getElementById('auth-overlay');
    var closeBtn = document.getElementById('auth-close');
    var loginView = document.getElementById('auth-login-view');
    var registerView = document.getElementById('auth-register-view');

    document.getElementById('show-register').addEventListener('click', function(e) {
        e.preventDefault();
        loginView.style.display = 'none';
        registerView.style.display = 'block';
    });

    document.getElementById('show-login').addEventListener('click', function(e) {
        e.preventDefault();
        registerView.style.display = 'none';
        loginView.style.display = 'block';
    });

    overlay.addEventListener('click', closeAuth);
    closeBtn.addEventListener('click', closeAuth);

    document.getElementById('login-submit').addEventListener('click', function() {
        var email = document.getElementById('login-email').value.trim();
        var pass = document.getElementById('login-password').value;
        if (!email || !pass) { alert('Заполните все поля'); return; }

        auth.signInWithEmailAndPassword(email, pass).then(function(cred) {
            return db.collection('users').doc(cred.user.uid).get().then(function(doc) {
                if (doc.exists) {
                    var userData = doc.data();
                    userData.id = cred.user.uid;
                    userData.email = cred.user.email;

                    return checkAndSetFirstAdmin(cred.user.uid).then(function(wasAdmin) {
                        if (wasAdmin) {
                            userData.role = 'admin';
                            db.collection('users').doc(cred.user.uid).update({ role: 'admin' });
                        }
                        localStorage.setItem('enotspace_current_user', JSON.stringify(userData));
                        closeAuth();
                        updateAuthUI();
                        if (wasAdmin) alert('Вы назначены администратором!');
                    });
                } else {
                    alert('Профиль не найден в базе данных');
                }
            });
        }).catch(function(err) {
            alert('Ошибка входа: ' + err.message);
        });
    });

    document.getElementById('register-submit').addEventListener('click', function() {
        var name = sanitizeInput(document.getElementById('reg-name').value, 100);
        var phone = sanitizeInput(document.getElementById('reg-phone').value, 20);
        var email = sanitizeInput(document.getElementById('reg-email').value, 100);
        var pass = document.getElementById('reg-password').value;

        if (!name || !phone || !pass) { alert('Заполните обязательные поля'); return; }
        if (name.length < 2) { alert('Имя слишком короткое'); return; }
        if (!validatePhone(phone)) { alert('Введите корректный номер телефона'); return; }
        if (email && !validateEmail(email)) { alert('Введите корректный email'); return; }
        if (pass.length < 6) { alert('Пароль минимум 6 символов'); return; }

        if (!email) email = phone + '@enotspace.local';

        auth.createUserWithEmailAndPassword(email, pass).then(function(cred) {
            var userProfile = {
                name: name,
                phone: phone,
                email: email,
                role: 'client',
                createdAt: new Date().toISOString(),
                purchased: [],
                favorites: []
            };
            return db.collection('users').doc(cred.user.uid).set(userProfile).then(function() {
                return checkAndSetFirstAdmin(cred.user.uid);
            }).then(function(wasAdmin) {
                if (wasAdmin) userProfile.role = 'admin';
                userProfile.id = cred.user.uid;
                localStorage.setItem('enotspace_current_user', JSON.stringify(userProfile));
                closeAuth();
                updateAuthUI();
                if (wasAdmin) alert('Вы назначены администратором!');
            });
        }).catch(function(err) {
            if (err.code === 'auth/email-already-in-use') {
                alert('Пользователь с таким email уже существует');
            } else {
                alert('Ошибка регистрации: ' + err.message);
            }
        });
    });
}

function openAuth() {
    var modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeAuth() {
    var modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function getCurrentUser() {
    var data = localStorage.getItem('enotspace_current_user');
    return data ? JSON.parse(data) : null;
}

function logout() {
    auth.signOut().then(function() {
        localStorage.removeItem('enotspace_current_user');
        notifRendered = false;
        var oldBtn = document.getElementById('notif-btn');
        if (oldBtn) oldBtn.remove();
        updateAuthUI();
        navigate('catalog');
    });
}

function updateAuthUI() {
    var user = getCurrentUser();
    var loginBtn = document.querySelector('.header__login-btn');
    if (!loginBtn) return;

    if (user) {
        loginBtn.textContent = escapeHtml(user.name.charAt(0).toUpperCase());
        loginBtn.style.borderRadius = '50%';
        loginBtn.style.width = '40px';
        loginBtn.style.height = '40px';
        loginBtn.style.padding = '0';
        loginBtn.style.fontSize = '16px';
        loginBtn.onclick = function() { navigate('account'); };
    } else {
        loginBtn.textContent = 'Вход';
        loginBtn.style.borderRadius = '10px';
        loginBtn.style.width = '';
        loginBtn.style.height = '';
        loginBtn.style.padding = '10px 24px';
        loginBtn.style.fontSize = '14px';
        loginBtn.onclick = function() { openAuth(); };
    }
}

function initAccount() {
    var user = getCurrentUser();
    if (!user) { navigate('catalog'); openAuth(); return; }

    document.getElementById('account-name').textContent = user.name;
    document.getElementById('account-avatar').textContent = escapeHtml(user.name.charAt(0).toUpperCase());
    document.getElementById('account-contact').textContent = user.phone + (user.email ? ' | ' + user.email : '');

    document.getElementById('settings-name').value = user.name || '';
    document.getElementById('settings-phone').value = user.phone || '';
    document.getElementById('settings-email').value = user.email || '';
    document.getElementById('settings-telegram').value = user.telegram || '';

    document.getElementById('account-logout').addEventListener('click', logout);

    var goCatalogBtn = document.getElementById('go-catalog');
    if (goCatalogBtn) {
        goCatalogBtn.addEventListener('click', function() { navigate('catalog'); });
    }

    if (isAdmin(user)) {
        setupAdminTabs();
        setTimeout(renderNotifications, 100);
    }

    var tabs = document.querySelectorAll('.account__tab');
    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            tabs.forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            document.querySelectorAll('.account__tab-content').forEach(function(c) {
                c.classList.remove('active');
                c.style.display = 'none';
            });
            var target = document.getElementById('tab-' + tab.dataset.tab);
            if (target) {
                target.classList.add('active');
                target.style.display = '';
            }
        });
    });

    document.getElementById('settings-save').addEventListener('click', function() {
        var newName = sanitizeInput(document.getElementById('settings-name').value, 100);
        var newPhone = sanitizeInput(document.getElementById('settings-phone').value, 20);
        var newEmail = sanitizeInput(document.getElementById('settings-email').value, 100);
        var newTelegram = sanitizeInput(document.getElementById('settings-telegram').value, 100);

        if (!newName || !newPhone) { alert('Имя и телефон обязательны'); return; }
        if (!validatePhone(newPhone)) { alert('Введите корректный номер телефона'); return; }
        if (newEmail && !validateEmail(newEmail)) { alert('Введите корректный email'); return; }

        user.name = newName;
        user.phone = newPhone;
        user.email = newEmail;
        user.telegram = newTelegram;

        localStorage.setItem('enotspace_current_user', JSON.stringify(user));

        db.collection('users').doc(user.id).update({
            name: newName,
            phone: newPhone,
            email: newEmail,
            telegram: newTelegram
        });

        document.getElementById('account-name').textContent = user.name;
        document.getElementById('account-avatar').textContent = escapeHtml(user.name.charAt(0).toUpperCase());
        document.getElementById('account-contact').textContent = user.phone + (user.email ? ' | ' + user.email : '');
        updateAuthUI();
        alert('Данные сохранены');
    });

    if (!isAdmin(user)) {
        renderOrders();
    }
}

function renderOrders() {
    var user = getCurrentUser();
    if (!user) return;

    var container = document.getElementById('account-orders');
    var detail = document.getElementById('order-detail');
    if (detail) detail.style.display = 'none';
    if (container) container.style.display = '';

    db.collection('projects').where('userId', '==', user.id).orderBy('createdAt', 'desc').get().then(function(snapshot) {
        var projects = [];
        snapshot.forEach(function(doc) {
            projects.push(Object.assign({ id: doc.id }, doc.data()));
        });

        if (projects.length === 0) {
            container.innerHTML =
                '<div class="account-empty">' +
                '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
                '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
                '<polyline points="14 2 14 8 20 8"/>' +
                '</svg>' +
                '<p>У вас пока нет заказов</p>' +
                '<button class="account-empty__btn" id="go-catalog">Перейти в каталог</button>' +
                '</div>';
            document.getElementById('go-catalog').addEventListener('click', function() { navigate('catalog'); });
            return;
        }

        var statusNames = { new: 'Новый', in_progress: 'В работе', completed: 'Готово', cancelled: 'Отменён' };
        var typeNames = { fullcycle: 'Полный цикл', print: 'Печать по модели', modeling: 'Моделирование', scanning: 'Сканирование' };

        var html = '';
        projects.forEach(function(project, index) {
            var statusClass = 'order-card__status--' + project.status;
            var date = new Date(project.createdAt).toLocaleDateString('ru-RU');

            html += '<div class="order-card" data-order="' + index + '">';
            html += '<div class="order-card__header">';
            html += '<span class="order-card__id">' + escapeHtml(project.id) + '</span>';
            html += '<span class="order-card__date">' + escapeHtml(date) + '</span>';
            html += '</div>';
            html += '<span class="order-card__status ' + statusClass + '">' + escapeHtml(statusNames[project.status] || project.status) + '</span>';
            html += '<div class="order-card__type">' + escapeHtml(typeNames[project.type] || project.type || 'Заказ') + '</div>';

            if (project.timeline && project.timeline.length) {
                html += '<div class="order-card__timeline">';
                project.timeline.forEach(function(item) {
                    var itemDate = new Date(item.date).toLocaleString('ru-RU');
                    html += '<div class="timeline-item">';
                    html += '<div class="timeline-item__text">' + escapeHtml(item.text) + '</div>';
                    html += '<div class="timeline-item__date">' + escapeHtml(itemDate) + '</div>';
                    html += '</div>';
                });
                html += '</div>';
            }

            html += '<div class="order-card__hint">Нажмите для подробностей &rarr;</div>';

            if (project.status === 'completed') {
                html += '<button class="order-card__repeat-btn" data-order="' + index + '">Заказать снова</button>';
            }

            html += '</div>';
        });

        container.innerHTML = html;

        container.querySelectorAll('.order-card[data-order]').forEach(function(card) {
            card.addEventListener('click', function(e) {
                if (e.target.closest('.order-card__repeat-btn')) return;
                var idx = parseInt(card.dataset.order);
                showOrderDetail(idx);
            });
        });

        container.querySelectorAll('.order-card__repeat-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                repeatOrder(parseInt(btn.dataset.order));
            });
        });
    });
}

function showOrderDetail(index) {
    var user = getCurrentUser();
    if (!user) return;

    db.collection('projects').where('userId', '==', user.id).orderBy('createdAt', 'desc').get().then(function(snapshot) {
        var projects = [];
        snapshot.forEach(function(doc) {
            projects.push(Object.assign({ id: doc.id }, doc.data()));
        });

        var project = projects[index];
        if (!project) return;

        var container = document.getElementById('account-orders');
        var detail = document.getElementById('order-detail');
        container.style.display = 'none';
        detail.style.display = 'block';

        var statusNames = { new: 'Новый', in_progress: 'В работе', completed: 'Готово', cancelled: 'Отменён' };
        var typeNames = { fullcycle: 'Полный цикл', print: 'Печать по модели', modeling: 'Моделирование', scanning: 'Сканирование' };
        var urgencyNames = { standard: 'Стандарт (5-7 дней)', fast: 'Быстро (2-3 дня)', express: 'Экспресс (1 день)' };
        var statusClass = 'order-card__status--' + project.status;
        var date = new Date(project.createdAt).toLocaleString('ru-RU');

        var html = '';
        html += '<button class="order-detail__back" id="order-back">&larr; Назад</button>';

        html += '<div class="order-detail__card">';
        html += '<div class="order-detail__header">';
        html += '<div><h2 class="order-detail__id">' + escapeHtml(project.id) + '</h2>';
        html += '<span class="order-detail__date">' + escapeHtml(date) + '</span></div>';
        html += '<span class="order-card__status ' + statusClass + '">' + escapeHtml(statusNames[project.status] || project.status) + '</span>';
        html += '</div>';

        html += '<div class="order-detail__info">';
        html += '<h3>Информация о заказе</h3>';
        html += '<div class="order-detail__grid">';
        html += '<div class="order-detail__field"><span>Тип</span><strong>' + escapeHtml(typeNames[project.type] || project.type || 'Заказ') + '</strong></div>';
        if (project.urgency) html += '<div class="order-detail__field"><span>Срочность</span><strong>' + escapeHtml(urgencyNames[project.urgency] || project.urgency) + '</strong></div>';
        if (project.quantity) html += '<div class="order-detail__field"><span>Количество</span><strong>' + parseInt(project.quantity) + ' шт.</strong></div>';
        if (project.material) html += '<div class="order-detail__field"><span>Материал</span><strong>' + escapeHtml(project.material) + '</strong></div>';
        if (project.file) html += '<div class="order-detail__field"><span>Файл</span><strong>' + escapeHtml(project.file) + '</strong></div>';
        if (project.price) html += '<div class="order-detail__field"><span>Стоимость</span><strong>' + escapeHtml(String(project.price)) + ' ₽</strong></div>';
        html += '</div></div>';

        if (project.description) {
            html += '<div class="order-detail__section"><h3>Описание</h3><p>' + escapeHtml(project.description) + '</p></div>';
        }

        if (project.contact) {
            html += '<div class="order-detail__section"><h3>Контакты</h3><div class="order-detail__grid">';
            if (project.contact.name) html += '<div class="order-detail__field"><span>Имя</span><strong>' + escapeHtml(project.contact.name) + '</strong></div>';
            if (project.contact.phone) html += '<div class="order-detail__field"><span>Телефон</span><strong>' + escapeHtml(project.contact.phone) + '</strong></div>';
            if (project.contact.telegram) html += '<div class="order-detail__field"><span>Telegram</span><strong>' + escapeHtml(project.contact.telegram) + '</strong></div>';
            if (project.contact.email) html += '<div class="order-detail__field"><span>Email</span><strong>' + escapeHtml(project.contact.email) + '</strong></div>';
            html += '</div></div>';
        }

        if (project.timeline && project.timeline.length) {
            html += '<div class="order-detail__section"><h3>Хроника заказа</h3><div class="order-detail__timeline">';
            project.timeline.forEach(function(item) {
                var itemDate = new Date(item.date).toLocaleString('ru-RU');
                html += '<div class="timeline-item"><div class="timeline-item__text">' + escapeHtml(item.text) + '</div><div class="timeline-item__date">' + escapeHtml(itemDate) + '</div></div>';
            });
            html += '</div></div>';
        }

        if (project.messages && project.messages.length) {
            html += '<div class="order-detail__section"><h3>Сообщения</h3><div class="order-detail__chat">';
            project.messages.forEach(function(msg) {
                var isUser = msg.from === 'user';
                html += '<div class="chat-msg ' + (isUser ? 'chat-msg--user' : 'chat-msg--admin') + '">';
                html += '<div class="chat-msg__text">' + escapeHtml(msg.text) + '</div>';
                html += '<div class="chat-msg__date">' + escapeHtml(new Date(msg.date).toLocaleString('ru-RU')) + '</div>';
                html += '</div>';
            });
            html += '</div>';
            html += '<div class="order-detail__chat-input">';
            html += '<input type="text" class="order-detail__chat-field" id="chat-input" placeholder="Сообщение...">';
            html += '<button class="order-detail__chat-send" id="chat-send">Отправить</button>';
            html += '</div></div>';
        } else {
            html += '<div class="order-detail__section"><h3>Сообщения</h3>';
            html += '<div class="order-detail__chat" id="chat-messages"></div>';
            html += '<div class="order-detail__chat-input">';
            html += '<input type="text" class="order-detail__chat-field" id="chat-input" placeholder="Сообщение...">';
            html += '<button class="order-detail__chat-send" id="chat-send">Отправить</button>';
            html += '</div></div>';
        }

        html += '</div>';

        detail.innerHTML = html;

        document.getElementById('order-back').addEventListener('click', function() {
            detail.style.display = 'none';
            container.style.display = '';
        });

        var chatInput = document.getElementById('chat-input');
        var chatSend = document.getElementById('chat-send');
        if (chatSend && chatInput) {
            chatSend.addEventListener('click', function() {
                var text = sanitizeInput(chatInput.value, 500);
                if (!text) return;
                if (!project.messages) project.messages = [];
                project.messages.push({ from: 'user', text: text, date: new Date().toISOString() });
                db.collection('projects').doc(project.id).update({ messages: project.messages });
                chatInput.value = '';
                showOrderDetail(index);
            });
            chatInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') chatSend.click();
            });
        }
    });
}
