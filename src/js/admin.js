function isAdmin(user) {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return false;
}

function setupAdminTabs() {
    var user = getCurrentUser();
    if (!user || !isAdmin(user)) return;

    var tabsContainer = document.getElementById('account-tabs');
    if (!tabsContainer) return;

    tabsContainer.innerHTML =
        '<button class="account__tab active" data-tab="dashboard">Дашборд</button>' +
        '<button class="account__tab" data-tab="admin-chat">Чат</button>' +
        '<button class="account__tab" data-tab="all-orders">Заказы</button>' +
        '<button class="account__tab" data-tab="admin-promos">Промокоды</button>' +
        '<button class="account__tab" data-tab="users">Пользователи</button>' +
        '<button class="account__tab" data-tab="settings">Настройки</button>';

    document.querySelectorAll('.account__tab-content').forEach(function(c) {
        c.classList.remove('active');
        c.style.display = 'none';
    });
    var dashboard = document.getElementById('tab-dashboard');
    if (dashboard) {
        dashboard.classList.add('active');
        dashboard.style.display = '';
    }

    tabsContainer.querySelectorAll('.account__tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            tabsContainer.querySelectorAll('.account__tab').forEach(function(t) { t.classList.remove('active'); });
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

    renderDashboard();
    renderAdminChat();
    renderAllOrders();
    renderAdminPromos();
    renderUsers();
}

function renderDashboard() {
    var container = document.getElementById('tab-dashboard');

    Promise.all([
        db.collection('projects').get(),
        db.collection('users').get()
    ]).then(function(results) {
        var projects = [];
        results[0].forEach(function(doc) { projects.push(doc.data()); });
        var usersCount = results[1].size;

        var total = projects.length;
        var newCount = projects.filter(function(p) { return p.status === 'new'; }).length;
        var inProgress = projects.filter(function(p) { return p.status === 'in_progress'; }).length;
        var completed = projects.filter(function(p) { return p.status === 'completed'; }).length;

        var typeNames = { fullcycle: 'Полный цикл', print: 'Печать', modeling: 'Моделирование', scanning: 'Сканирование' };
        var types = {};
        projects.forEach(function(p) {
            var t = typeNames[p.type] || p.type;
            types[t] = (types[t] || 0) + 1;
        });

        var recentProjects = projects.slice().sort(function(a, b) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        }).slice(0, 5);

        var statusNames = { new: 'Новый', in_progress: 'В работе', completed: 'Готово', cancelled: 'Отменён' };
        var statusColors = { new: '#e3f2fd', in_progress: '#fff3e0', completed: '#e8f5e9', cancelled: '#fce4ec' };
        var statusTextColors = { new: '#1565c0', in_progress: '#e65100', completed: '#2e7d32', cancelled: '#c62828' };

        var html = '<div class="admin-dashboard">';
        html += '<h2 class="admin-dashboard__title">Панель управления</h2>';
        html += '<div class="admin-stats">';
        html += '<div class="admin-stat admin-stat--total"><div class="admin-stat__number">' + total + '</div><div class="admin-stat__label">Всего заказов</div></div>';
        html += '<div class="admin-stat admin-stat--new"><div class="admin-stat__number">' + newCount + '</div><div class="admin-stat__label">Новых</div></div>';
        html += '<div class="admin-stat admin-stat--progress"><div class="admin-stat__number">' + inProgress + '</div><div class="admin-stat__label">В работе</div></div>';
        html += '<div class="admin-stat admin-stat--done"><div class="admin-stat__number">' + completed + '</div><div class="admin-stat__label">Готово</div></div>';
        html += '<div class="admin-stat admin-stat--users"><div class="admin-stat__number">' + usersCount + '</div><div class="admin-stat__label">Пользователей</div></div>';
        html += '</div>';

        html += '<div class="admin-grid">';
        html += '<div class="admin-block"><h3 class="admin-block__title">По типам услуг</h3><div class="admin-types">';
        for (var type in types) {
            html += '<div class="admin-type-row"><span class="admin-type-row__label">' + escapeHtml(type) + '</span><span class="admin-type-row__value">' + types[type] + '</span></div>';
        }
        html += '</div></div>';

        html += '<div class="admin-block"><h3 class="admin-block__title">Последние заказы</h3><div class="admin-recent">';
        if (recentProjects.length === 0) {
            html += '<p class="admin-recent__empty">Заказов пока нет</p>';
        } else {
            recentProjects.forEach(function(p) {
                html += '<div class="admin-recent-item"><span class="admin-recent-item__id">' + escapeHtml(p.id) + '</span><span class="admin-recent-item__type">' + escapeHtml(typeNames[p.type] || p.type) + '</span><span class="admin-recent-item__status" style="background:' + (statusColors[p.status] || '#f5f5f5') + ';color:' + (statusTextColors[p.status] || '#333') + '">' + escapeHtml(statusNames[p.status] || p.status) + '</span></div>';
            });
        }
        html += '</div></div></div></div>';

        container.innerHTML = html;
        if (typeof renderSalesChart === 'function') {
            renderSalesChart().then(function(chartHtml) {
                if (chartHtml) container.insertAdjacentHTML('beforeend', chartHtml);
            });
        }
    });
}

function renderAllOrders() {
    var container = document.getElementById('tab-all-orders');

    db.collection('projects').orderBy('createdAt', 'desc').get().then(function(snapshot) {
        var projects = [];
        snapshot.forEach(function(doc) {
            projects.push(Object.assign({ _docId: doc.id }, doc.data()));
        });

        var typeNames = { fullcycle: 'Полный цикл', print: 'Печать по модели', modeling: 'Моделирование', scanning: 'Сканирование' };
        var statusNames = { new: 'Новый', in_progress: 'В работе', completed: 'Готово', cancelled: 'Отменён' };
        var statusColors = { new: '#e3f2fd', in_progress: '#fff3e0', completed: '#e8f5e9', cancelled: '#fce4ec' };
        var statusTextColors = { new: '#1565c0', in_progress: '#e65100', completed: '#2e7d32', cancelled: '#c62828' };

        var html = '<div class="admin-orders">';
        html += '<div class="admin-orders__header">';
        html += '<div class="admin-orders__actions">';
        html += '<h2 class="admin-orders__title">Все заказы</h2>';
        html += '<button class="admin-export-btn" id="export-csv-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> CSV</button>';
        html += '</div>';
        html += '<div class="admin-orders__filters">';
        html += '<button class="admin-filter active" data-status="all">Все</button>';
        html += '<button class="admin-filter" data-status="new">Новые</button>';
        html += '<button class="admin-filter" data-status="in_progress">В работе</button>';
        html += '<button class="admin-filter" data-status="completed">Готовые</button>';
        html += '</div></div>';

        html += '<div class="admin-orders__list" id="admin-orders-list">';
        if (projects.length === 0) {
            html += '<p class="admin-orders__empty">Заказов пока нет</p>';
        } else {
            projects.forEach(function(p, idx) {
                var date = new Date(p.createdAt).toLocaleDateString('ru-RU');
                var clientName = p.contact ? p.contact.name : 'Неизвестен';
                html += '<div class="admin-order" data-status="' + p.status + '" data-index="' + idx + '">';
                html += '<div class="admin-order__main">';
                html += '<div class="admin-order__header"><span class="admin-order__id">' + escapeHtml(p.id || p._docId) + '</span><span class="admin-order__date">' + escapeHtml(date) + '</span></div>';
                html += '<div class="admin-order__info"><div class="admin-order__type">' + escapeHtml(typeNames[p.type] || p.type) + '</div><div class="admin-order__client">Клиент: ' + escapeHtml(clientName) + '</div></div>';
                html += '</div>';
                html += '<div class="admin-order__actions">';
                html += '<select class="admin-order__status-select" data-doc-id="' + p._docId + '">';
                ['new', 'in_progress', 'completed', 'cancelled'].forEach(function(s) {
                    html += '<option value="' + s + '"' + (p.status === s ? ' selected' : '') + '>' + escapeHtml(statusNames[s]) + '</option>';
                });
                html += '</select>';
                html += '<button class="admin-order__open-btn" data-index="' + idx + '">Открыть</button>';
                html += '</div></div>';
            });
        }
        html += '</div>';
        html += '<div class="admin-order-detail" id="admin-order-detail" style="display:none;"></div>';
        html += '</div>';

        container.innerHTML = html;

        container.querySelectorAll('.admin-filter').forEach(function(btn) {
            btn.addEventListener('click', function() {
                container.querySelectorAll('.admin-filter').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                var filter = btn.dataset.status;
                container.querySelectorAll('.admin-order').forEach(function(order) {
                    order.style.display = (filter === 'all' || order.dataset.status === filter) ? '' : 'none';
                });
            });
        });

        container.querySelectorAll('.admin-order__status-select').forEach(function(sel) {
            sel.addEventListener('change', function() {
                var docId = sel.dataset.docId;
                db.collection('projects').doc(docId).update({ status: sel.value });
                sel.closest('.admin-order').dataset.status = sel.value;
            });
        });

        container.querySelectorAll('.admin-order__open-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var idx = parseInt(btn.dataset.index);
                showAdminOrderDetail(projects[idx]);
            });
        });

        var csvBtn = document.getElementById('export-csv-btn');
        if (csvBtn) csvBtn.addEventListener('click', exportOrdersCSV);
    });
}

function showAdminOrderDetail(p) {
    var container = document.getElementById('admin-orders-list');
    var detail = document.getElementById('admin-order-detail');
    if (!container || !detail) return;

    container.style.display = 'none';
    detail.style.display = 'block';

    var typeNames = { fullcycle: 'Полный цикл', print: 'Печать по модели', modeling: 'Моделирование', scanning: 'Сканирование' };
    var statusNames = { new: 'Новый', in_progress: 'В работе', completed: 'Готово', cancelled: 'Отменён' };
    var statusColors = { new: '#e3f2fd', in_progress: '#fff3e0', completed: '#e8f5e9', cancelled: '#fce4ec' };
    var statusTextColors = { new: '#1565c0', in_progress: '#e65100', completed: '#2e7d32', cancelled: '#c62828' };
    var urgencyNames = { standard: 'Стандарт', fast: 'Быстро', express: 'Экспресс' };

    var html = '<button class="order-detail__back" id="admin-order-back">&larr; Назад к списку</button>';
    html += '<div class="order-detail__card">';
    html += '<div class="order-detail__header"><div><h2 class="order-detail__id">' + escapeHtml(p.id || '') + '</h2><span class="order-detail__date">' + escapeHtml(new Date(p.createdAt).toLocaleString('ru-RU')) + '</span></div>';
    html += '<span class="order-card__status" style="background:' + (statusColors[p.status] || '#f5f5f5') + ';color:' + (statusTextColors[p.status] || '#333') + '">' + escapeHtml(statusNames[p.status] || p.status) + '</span></div>';

    html += '<div class="order-detail__info"><h3>Информация</h3><div class="order-detail__grid">';
    html += '<div class="order-detail__field"><span>Тип</span><strong>' + escapeHtml(typeNames[p.type] || p.type) + '</strong></div>';
    if (p.urgency) html += '<div class="order-detail__field"><span>Срочность</span><strong>' + escapeHtml(urgencyNames[p.urgency] || p.urgency) + '</strong></div>';
    if (p.quantity) html += '<div class="order-detail__field"><span>Количество</span><strong>' + p.quantity + ' шт.</strong></div>';
    if (p.material) html += '<div class="order-detail__field"><span>Материал</span><strong>' + escapeHtml(p.material) + '</strong></div>';
    if (p.file) html += '<div class="order-detail__field"><span>Файл</span><strong>' + escapeHtml(p.file) + '</strong></div>';
    if (p.price) html += '<div class="order-detail__field"><span>Стоимость</span><strong>' + escapeHtml(p.price) + ' ₽</strong></div>';
    html += '</div></div>';

    if (p.description) html += '<div class="order-detail__section"><h3>Описание</h3><p>' + escapeHtml(p.description) + '</p></div>';

    if (p.photos && Array.isArray(p.photos) && p.photos.length) {
        html += '<div class="order-detail__section"><h3>Фото (' + p.photos.length + ')</h3>';
        html += '<div style="display:flex;flex-wrap:wrap;gap:8px;">';
        p.photos.forEach(function(photo) {
            html += '<img src="' + photo + '" style="max-width:200px;max-height:200px;border-radius:8px;cursor:pointer;" onclick="window.open(this.src)">';
        });
        html += '</div></div>';
    }

    if (p.contact) {
        html += '<div class="order-detail__section"><h3>Контакты клиента</h3><div class="order-detail__grid">';
        if (p.contact.name) html += '<div class="order-detail__field"><span>Имя</span><strong>' + escapeHtml(p.contact.name) + '</strong></div>';
        if (p.contact.phone) html += '<div class="order-detail__field"><span>Телефон</span><strong>' + escapeHtml(p.contact.phone) + '</strong></div>';
        if (p.contact.telegram) html += '<div class="order-detail__field"><span>Telegram</span><strong>' + escapeHtml(p.contact.telegram) + '</strong></div>';
        if (p.contact.email) html += '<div class="order-detail__field"><span>Email</span><strong>' + escapeHtml(p.contact.email) + '</strong></div>';
        html += '</div></div>';
    }

    if (p.timeline && p.timeline.length) {
        html += '<div class="order-detail__section"><h3>Хроника</h3><div class="order-detail__timeline">';
        p.timeline.forEach(function(item) {
            html += '<div class="timeline-item"><div class="timeline-item__text">' + escapeHtml(item.text) + '</div><div class="timeline-item__date">' + escapeHtml(new Date(item.date).toLocaleString('ru-RU')) + '</div></div>';
        });
        html += '</div></div>';
    }

    html += '<div class="order-detail__section"><h3>Чат с клиентом</h3>';
    html += '<div class="order-detail__chat" id="admin-chat-messages">';
    if (p.messages && p.messages.length) {
        p.messages.forEach(function(msg) {
            var isAdminMsg = msg.from === 'admin';
            html += '<div class="chat-msg ' + (isAdminMsg ? 'chat-msg--admin' : 'chat-msg--user') + '">';
            html += '<div class="chat-msg__text">' + escapeHtml(msg.text) + '</div>';
            html += '<div class="chat-msg__date">' + escapeHtml(new Date(msg.date).toLocaleString('ru-RU')) + '</div>';
            html += '</div>';
        });
    }
    html += '</div>';
    html += '<div class="order-detail__chat-input">';
    html += '<input type="text" class="order-detail__chat-field" id="admin-chat-input" placeholder="Ответ клиенту...">';
    html += '<button class="order-detail__chat-send" id="admin-chat-send">Отправить</button>';
    html += '</div></div></div>';

    detail.innerHTML = html;

    document.getElementById('admin-order-back').addEventListener('click', function() {
        detail.style.display = 'none';
        container.style.display = '';
    });

    var chatInput = document.getElementById('admin-chat-input');
    var chatSend = document.getElementById('admin-chat-send');
    if (chatSend && chatInput) {
        chatSend.addEventListener('click', function() {
            var text = sanitizeInput(chatInput.value, 500);
            if (!text) return;
            if (!p.messages) p.messages = [];
            p.messages.push({ from: 'admin', text: text, date: new Date().toISOString() });
            db.collection('projects').doc(p._docId || p.id).update({ messages: p.messages });
            chatInput.value = '';
            showAdminOrderDetail(p);
        });
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') chatSend.click();
        });
    }
}

function renderUsers() {
    var container = document.getElementById('tab-users');

    db.collection('users').get().then(function(snapshot) {
        var html = '<div class="admin-users"><h2 class="admin-users__title">Пользователи</h2>';

        if (snapshot.empty) {
            html += '<p class="admin-users__empty">Пользователей пока нет</p>';
        } else {
            html += '<div class="admin-users__list">';
            snapshot.forEach(function(doc) {
                var u = doc.data();
                var roleLabel = u.role === 'admin' ? 'Админ' : 'Клиент';
                var roleClass = u.role === 'admin' ? 'admin-role--admin' : 'admin-role--client';
                var date = u.createdAt ? new Date(u.createdAt).toLocaleDateString('ru-RU') : '';

                html += '<div class="admin-user">';
                html += '<div class="admin-user__avatar">' + escapeHtml((u.name || '?').charAt(0).toUpperCase()) + '</div>';
                html += '<div class="admin-user__info">';
                html += '<div class="admin-user__name">' + escapeHtml(u.name || 'Без имени') + ' <span class="admin-role ' + roleClass + '">' + roleLabel + '</span></div>';
                html += '<div class="admin-user__contact">' + escapeHtml(u.phone || '') + (u.email ? ' · ' + escapeHtml(u.email) : '') + '</div>';
                html += '<div class="admin-user__meta">Регистрация: ' + escapeHtml(date) + '</div>';
                html += '</div></div>';
            });
            html += '</div>';
        }
        html += '</div>';
        container.innerHTML = html;
    });
}

var adminChatData = { clients: [], allProjects: [] };
var adminChatUnsubscribe = null;
var adminActiveClientIndex = -1;

function renderAdminChat() {
    var container = document.getElementById('tab-admin-chat');
    if (!container) return;

    if (adminChatUnsubscribe) { adminChatUnsubscribe(); adminChatUnsubscribe = null; }
    adminActiveClientIndex = -1;

    container.innerHTML = '<div class="admin-chat">' +
        '<div class="admin-chat__sidebar" id="admin-chat-sidebar"><div class="admin-chat__empty"><p>Загрузка...</p></div></div>' +
        '<div class="admin-chat__main" id="admin-chat-main"><div class="admin-chat__placeholder"><p>Выберите клиента</p></div></div>' +
        '</div>';

    adminChatUnsubscribe = db.collection('projects').orderBy('createdAt', 'desc').onSnapshot(function(snapshot) {
        var allProjects = [];
        snapshot.forEach(function(doc) {
            allProjects.push(Object.assign({ _docId: doc.id }, doc.data()));
        });
        adminChatData.allProjects = allProjects;

        var clientsMap = {};
        allProjects.forEach(function(p) {
            var uid = p.userId || (p.contact ? p.contact.phone : 'unknown');
            if (!clientsMap[uid]) {
                clientsMap[uid] = {
                    userId: uid,
                    name: p.contact ? p.contact.name : 'Клиент',
                    phone: p.contact ? p.contact.phone : '',
                    email: p.contact ? p.contact.email : '',
                    orders: [],
                    allMessages: [],
                    lastDate: p.createdAt
                };
            }
            clientsMap[uid].orders.push(p);
            if (p.messages && p.messages.length) {
                clientsMap[uid].allMessages = clientsMap[uid].allMessages.concat(p.messages);
            }
            if (new Date(p.createdAt) > new Date(clientsMap[uid].lastDate)) {
                clientsMap[uid].lastDate = p.createdAt;
            }
        });

        var clients = Object.values(clientsMap).sort(function(a, b) {
            return new Date(b.lastDate) - new Date(a.lastDate);
        });
        adminChatData.clients = clients;

        renderChatSidebar(clients);

        if (adminActiveClientIndex >= 0 && adminActiveClientIndex < clients.length) {
            showClientChat(clients[adminActiveClientIndex]);
        }
    }).catch(function(err) {
        console.error('Ошибка загрузки чатов:', err);
        container.querySelector('#admin-chat-sidebar').innerHTML = '<div class="admin-chat__empty"><p>Ошибка загрузки</p></div>';
    });
}

function renderChatSidebar(clients) {
    var sidebar = document.getElementById('admin-chat-sidebar');
    if (!sidebar) return;

    if (clients.length === 0) {
        sidebar.innerHTML = '<div class="admin-chat__empty"><p>Нет клиентов</p></div>';
        return;
    }

    var html = '<div class="admin-chat__sidebar-header"><h3>Клиенты</h3></div>';
    html += '<div class="admin-chat__client-list">';
    clients.forEach(function(c, i) {
        var sortedMsgs = c.allMessages.slice().sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
        var lastMsg = sortedMsgs.length ? sortedMsgs[0] : null;
        var preview = lastMsg ? lastMsg.text.substring(0, 40) + (lastMsg.text.length > 40 ? '...' : '') : 'Нет сообщений';
        var date = lastMsg ? new Date(lastMsg.date).toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'}) : '';

        html += '<div class="admin-chat__client' + (i === adminActiveClientIndex ? ' active' : '') + '" data-index="' + i + '">';
        html += '<div class="admin-chat__client-avatar">' + escapeHtml(c.name.charAt(0).toUpperCase()) + '</div>';
        html += '<div class="admin-chat__client-info">';
        html += '<div class="admin-chat__client-name">' + escapeHtml(c.name) + '</div>';
        html += '<div class="admin-chat__client-last">' + escapeHtml(preview) + '</div>';
        html += '</div>';
        html += '<div class="admin-chat__client-meta">';
        html += '<div class="admin-chat__client-date">' + escapeHtml(date) + '</div>';
        html += '</div>';
        html += '</div>';
    });
    html += '</div>';

    sidebar.innerHTML = html;

    sidebar.querySelectorAll('.admin-chat__client').forEach(function(item) {
        item.addEventListener('click', function() {
            sidebar.querySelectorAll('.admin-chat__client').forEach(function(el) { el.classList.remove('active'); });
            item.classList.add('active');
            var idx = parseInt(item.dataset.index);
            adminActiveClientIndex = idx;
            showClientChat(clients[idx]);
        });
    });
}

function showClientChat(client) {
    var main = document.getElementById('admin-chat-main');
    if (!main) return;

    var typeNames = { fullcycle: 'Полный цикл', print: 'Печать по модели', modeling: 'Моделирование', scanning: 'Сканирование', order: 'Заказ из каталога' };
    var statusNames = { new: 'Новый', in_progress: 'В работе', completed: 'Готово', cancelled: 'Отменён' };
    var statusColors = { new: '#1565c0', in_progress: '#e65100', completed: '#2e7d32', cancelled: '#c62828' };

    var html = '<div class="admin-chat__header">';
    html += '<div class="admin-chat__header-info">';
    html += '<div class="admin-chat__header-avatar">' + escapeHtml(client.name.charAt(0).toUpperCase()) + '</div>';
    html += '<div><div class="admin-chat__header-name">' + escapeHtml(client.name) + '</div>';
    html += '<div class="admin-chat__header-contact">' + escapeHtml(client.phone) + (client.email ? ' · ' + escapeHtml(client.email) : '') + '</div></div>';
    html += '</div>';
    html += '<div class="admin-chat__header-orders">';
    client.orders.forEach(function(p) {
        var color = statusColors[p.status] || '#666';
        html += '<span class="admin-chat__order-badge" style="background:' + color + '22;color:' + color + ';">' + escapeHtml(typeNames[p.type] || p.type || 'Заказ') + '</span>';
    });
    html += '</div></div>';

    var sortedMessages = client.allMessages.slice().sort(function(a, b) { return new Date(a.date) - new Date(b.date); });

    html += '<div class="admin-chat__messages" id="admin-chat-messages">';
    if (sortedMessages.length === 0) {
        html += '<div class="admin-chat__no-messages"><p>Нет сообщений</p></div>';
    } else {
        sortedMessages.forEach(function(msg) {
            var isAdmin = msg.from === 'admin';
            html += '<div class="admin-chat__msg ' + (isAdmin ? 'admin-chat__msg--admin' : 'admin-chat__msg--user') + '">';
            html += '<div class="admin-chat__msg-bubble">' + escapeHtml(msg.text) + '</div>';
            html += '<div class="admin-chat__msg-meta">';
            html += '<span class="admin-chat__msg-date">' + escapeHtml(new Date(msg.date).toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'})) + '</span>';
            html += '</div></div>';
        });
    }
    html += '</div>';

    html += '<div class="admin-chat__input-area">';
    html += '<input type="text" id="admin-chat-input" placeholder="Сообщение..." class="admin-chat__input">';
    html += '<button id="admin-chat-send" class="admin-chat__send-btn">Отправить</button>';
    html += '</div>';

    main.innerHTML = html;

    var messagesEl = document.getElementById('admin-chat-messages');
    messagesEl.scrollTop = messagesEl.scrollHeight;

    var chatInput = document.getElementById('admin-chat-input');
    var chatSend = document.getElementById('admin-chat-send');

    function sendMessage() {
        var text = sanitizeInput(chatInput.value, 500);
        if (!text) return;

        var targetProject = client.orders.find(function(p) {
            return p.messages && p.messages.length < 50;
        }) || client.orders[0];
        if (!targetProject) return;

        var currentMessages = targetProject.messages || [];
        currentMessages.push({ from: 'admin', text: text, date: new Date().toISOString() });

        db.collection('projects').doc(targetProject._docId).update({ messages: currentMessages });

        chatInput.value = '';
    }

    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendMessage();
    });
}
