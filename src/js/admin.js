function isAdmin(user) {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.email === 'admin@enotspace.ru') return true;
    if (user.id === 'USR-ADMIN-001') return true;
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
        '<button class="account__tab" data-tab="users">Пользователи</button>' +
        '<button class="account__tab" data-tab="settings">Настройки</button>';

    document.getElementById('tab-dashboard').style.display = '';
    document.getElementById('tab-admin-chat').style.display = '';
    document.getElementById('tab-all-orders').style.display = '';
    document.getElementById('tab-users').style.display = '';

    renderDashboard();
    renderAdminChat();
    renderAllOrders();
    renderUsers();
}

function renderDashboard() {
    var projects = JSON.parse(localStorage.getItem('enotspace_projects') || '[]');
    var users = JSON.parse(localStorage.getItem('enotspace_users') || '[]');

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

    var statusNames = { new: 'Новый', in_progress: 'В работе', completed: 'Готово', cancelled: 'Отменён' };
    var statusColors = { new: '#e3f2fd', in_progress: '#fff3e0', completed: '#e8f5e9', cancelled: '#fce4ec' };
    var statusTextColors = { new: '#1565c0', in_progress: '#e65100', completed: '#2e7d32', cancelled: '#c62828' };

    var recentProjects = projects.slice().sort(function(a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
    }).slice(0, 5);

    var html = '';
    html += '<div class="admin-dashboard">';
    html += '<h2 class="admin-dashboard__title">Панель управления</h2>';

    html += '<div class="admin-stats">';
    html += '<div class="admin-stat admin-stat--total"><div class="admin-stat__number">' + total + '</div><div class="admin-stat__label">Всего заказов</div></div>';
    html += '<div class="admin-stat admin-stat--new"><div class="admin-stat__number">' + newCount + '</div><div class="admin-stat__label">Новых</div></div>';
    html += '<div class="admin-stat admin-stat--progress"><div class="admin-stat__number">' + inProgress + '</div><div class="admin-stat__label">В работе</div></div>';
    html += '<div class="admin-stat admin-stat--done"><div class="admin-stat__number">' + completed + '</div><div class="admin-stat__label">Готово</div></div>';
    html += '<div class="admin-stat admin-stat--users"><div class="admin-stat__number">' + users.length + '</div><div class="admin-stat__label">Пользователей</div></div>';
    html += '</div>';

    html += '<div class="admin-grid">';
    html += '<div class="admin-block">';
    html += '<h3 class="admin-block__title">По типам услуг</h3>';
    html += '<div class="admin-types">';
    for (var type in types) {
        html += '<div class="admin-type-row"><span class="admin-type-row__label">' + escapeHtml(type) + '</span><span class="admin-type-row__value">' + types[type] + '</span></div>';
    }
    html += '</div></div>';

    html += '<div class="admin-block">';
    html += '<h3 class="admin-block__title">Последние заказы</h3>';
    html += '<div class="admin-recent">';
    if (recentProjects.length === 0) {
        html += '<p class="admin-recent__empty">Заказов пока нет</p>';
    } else {
        recentProjects.forEach(function(p) {
            html += '<div class="admin-recent-item">';
            html += '<span class="admin-recent-item__id">' + escapeHtml(p.id) + '</span>';
            html += '<span class="admin-recent-item__type">' + escapeHtml(typeNames[p.type] || p.type) + '</span>';
            html += '<span class="admin-recent-item__status" style="background:' + statusColors[p.status] + ';color:' + statusTextColors[p.status] + '">' + escapeHtml(statusNames[p.status] || p.status) + '</span>';
            html += '</div>';
        });
    }
    html += '</div></div>';
    html += '</div>';
    html += '</div>';

    if (typeof renderSalesChart === 'function') {
        html += renderSalesChart();
    }

    document.getElementById('tab-dashboard').innerHTML = html;
}

function renderAllOrders() {
    var projects = JSON.parse(localStorage.getItem('enotspace_projects') || '[]');
    var typeNames = { fullcycle: 'Полный цикл', print: 'Печать по модели', modeling: 'Моделирование', scanning: 'Сканирование' };
    var statusNames = { new: 'Новый', in_progress: 'В работе', completed: 'Готово', cancelled: 'Отменён' };
    var statusColors = { new: '#e3f2fd', in_progress: '#fff3e0', completed: '#e8f5e9', cancelled: '#fce4ec' };
    var statusTextColors = { new: '#1565c0', in_progress: '#e65100', completed: '#2e7d32', cancelled: '#c62828' };

    var html = '';
    html += '<div class="admin-orders">';
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
            html += '<div class="admin-order__header">';
            html += '<span class="admin-order__id">' + escapeHtml(p.id) + '</span>';
            html += '<span class="admin-order__date">' + escapeHtml(date) + '</span>';
            html += '</div>';
            html += '<div class="admin-order__info">';
            html += '<div class="admin-order__type">' + escapeHtml(typeNames[p.type] || p.type) + '</div>';
            html += '<div class="admin-order__client">Клиент: ' + escapeHtml(clientName) + '</div>';
            html += '</div>';
            html += '</div>';
            html += '<div class="admin-order__actions">';
            html += '<select class="admin-order__status-select" data-index="' + idx + '">';
            ['new', 'in_progress', 'completed', 'cancelled'].forEach(function(s) {
                html += '<option value="' + s + '"' + (p.status === s ? ' selected' : '') + '>' + escapeHtml(statusNames[s]) + '</option>';
            });
            html += '</select>';
            html += '<button class="admin-order__open-btn" data-index="' + idx + '">Открыть</button>';
            html += '</div>';
            html += '</div>';
        });
    }

    html += '</div>';
    html += '<div class="admin-order-detail" id="admin-order-detail" style="display:none;"></div>';
    html += '</div>';

    document.getElementById('tab-all-orders').innerHTML = html;

    document.querySelectorAll('.admin-filter').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.admin-filter').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            var filter = btn.dataset.status;
            document.querySelectorAll('.admin-order').forEach(function(order) {
                order.style.display = (filter === 'all' || order.dataset.status === filter) ? '' : 'none';
            });
        });
    });

    var csvBtn = document.getElementById('export-csv-btn');
    if (csvBtn) csvBtn.addEventListener('click', exportOrdersCSV);

    document.querySelectorAll('.admin-order__status-select').forEach(function(sel) {
        sel.addEventListener('change', function() {
            var idx = parseInt(sel.dataset.index);
            var projects = JSON.parse(localStorage.getItem('enotspace_projects') || '[]');
            projects[idx].status = sel.value;
            localStorage.setItem('enotspace_projects', JSON.stringify(projects));
            sel.closest('.admin-order').dataset.status = sel.value;
        });
    });

    document.querySelectorAll('.admin-order__open-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            showAdminOrderDetail(parseInt(btn.dataset.index));
        });
    });
}

function showAdminOrderDetail(index) {
    var projects = JSON.parse(localStorage.getItem('enotspace_projects') || '[]');
    var p = projects[index];
    if (!p) return;

    var typeNames = { fullcycle: 'Полный цикл', print: 'Печать по модели', modeling: 'Моделирование', scanning: 'Сканирование' };
    var statusNames = { new: 'Новый', in_progress: 'В работе', completed: 'Готово', cancelled: 'Отменён' };
    var statusColors = { new: '#e3f2fd', in_progress: '#fff3e0', completed: '#e8f5e9', cancelled: '#fce4ec' };
    var statusTextColors = { new: '#1565c0', in_progress: '#e65100', completed: '#2e7d32', cancelled: '#c62828' };
    var urgencyNames = { standard: 'Стандарт', fast: 'Быстро', express: 'Экспресс' };

    var detail = document.getElementById('admin-order-detail');
    var list = document.getElementById('admin-orders-list');
    list.style.display = 'none';
    detail.style.display = 'block';

    var html = '';
    html += '<button class="order-detail__back" id="admin-order-back">&larr; Назад к списку</button>';
    html += '<div class="order-detail__card">';

    html += '<div class="order-detail__header">';
    html += '<div><h2 class="order-detail__id">' + escapeHtml(p.id) + '</h2>';
    html += '<span class="order-detail__date">' + escapeHtml(new Date(p.createdAt).toLocaleString('ru-RU')) + '</span></div>';
    html += '<span class="order-card__status" style="background:' + statusColors[p.status] + ';color:' + statusTextColors[p.status] + '">' + escapeHtml(statusNames[p.status] || p.status) + '</span>';
    html += '</div>';

    html += '<div class="order-detail__info">';
    html += '<h3>Информация</h3>';
    html += '<div class="order-detail__grid">';
    html += '<div class="order-detail__field"><span>Тип</span><strong>' + escapeHtml(typeNames[p.type] || p.type) + '</strong></div>';
    if (p.urgency) html += '<div class="order-detail__field"><span>Срочность</span><strong>' + escapeHtml(urgencyNames[p.urgency] || p.urgency) + '</strong></div>';
    if (p.quantity) html += '<div class="order-detail__field"><span>Количество</span><strong>' + p.quantity + ' шт.</strong></div>';
    if (p.material) html += '<div class="order-detail__field"><span>Материал</span><strong>' + escapeHtml(p.material) + '</strong></div>';
    if (p.file) html += '<div class="order-detail__field"><span>Файл</span><strong>' + escapeHtml(p.file) + '</strong></div>';
    if (p.price) html += '<div class="order-detail__field"><span>Стоимость</span><strong>' + escapeHtml(p.price) + ' ₽</strong></div>';
    html += '</div></div>';

    if (p.description) {
        html += '<div class="order-detail__section"><h3>Описание</h3><p>' + escapeHtml(p.description) + '</p></div>';
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

    html += '<div class="order-detail__section">';
    html += '<h3>Чат с клиентом</h3>';
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
    html += '</div></div>';

    html += '</div>';

    detail.innerHTML = html;

    document.getElementById('admin-order-back').addEventListener('click', function() {
        detail.style.display = 'none';
        list.style.display = '';
    });

    var chatInput = document.getElementById('admin-chat-input');
    var chatSend = document.getElementById('admin-chat-send');
    if (chatSend && chatInput) {
        chatSend.addEventListener('click', function() {
            var text = sanitizeInput(chatInput.value, 500);
            if (!text) return;
            if (!p.messages) p.messages = [];
            p.messages.push({ from: 'admin', text: text, date: new Date().toISOString() });
            localStorage.setItem('enotspace_projects', JSON.stringify(projects));
            chatInput.value = '';
            showAdminOrderDetail(index);
        });
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') chatSend.click();
        });
    }
}

function renderUsers() {
    var users = JSON.parse(localStorage.getItem('enotspace_users') || '[]');
    var projects = JSON.parse(localStorage.getItem('enotspace_projects') || '[]');

    var html = '';
    html += '<div class="admin-users">';
    html += '<h2 class="admin-users__title">Пользователи</h2>';

    if (users.length === 0) {
        html += '<p class="admin-users__empty">Пользователей пока нет</p>';
    } else {
        html += '<div class="admin-users__list">';
        users.forEach(function(u) {
            var userOrders = projects.filter(function(p) {
                return p.contact && p.contact.phone === u.phone;
            }).length;
            var roleLabel = u.role === 'admin' ? 'Админ' : 'Клиент';
            var roleClass = u.role === 'admin' ? 'admin-role--admin' : 'admin-role--client';
            var date = new Date(u.createdAt).toLocaleDateString('ru-RU');

            html += '<div class="admin-user">';
            html += '<div class="admin-user__avatar">' + escapeHtml(u.name.charAt(0).toUpperCase()) + '</div>';
            html += '<div class="admin-user__info">';
            html += '<div class="admin-user__name">' + escapeHtml(u.name) + ' <span class="admin-role ' + roleClass + '">' + roleLabel + '</span></div>';
            html += '<div class="admin-user__contact">' + escapeHtml(u.phone) + (u.email ? ' · ' + escapeHtml(u.email) : '') + '</div>';
            html += '<div class="admin-user__meta">Регистрация: ' + escapeHtml(date) + ' · Заказов: ' + userOrders + '</div>';
            html += '</div>';
            html += '</div>';
        });
        html += '</div>';
    }

    html += '</div>';
    document.getElementById('tab-users').innerHTML = html;
}

// === ADMIN CHAT ===
var currentChatClient = null;

function getConversations() {
    var projects = JSON.parse(localStorage.getItem('enotspace_projects') || '[]');
    var clients = {};

    projects.forEach(function(p) {
        if (!p.contact || !p.contact.phone) return;
        var phone = p.contact.phone;
        if (!clients[phone]) {
            clients[phone] = {
                phone: phone,
                name: p.contact.name || 'Клиент',
                telegram: p.contact.telegram || '',
                email: p.contact.email || '',
                messages: [],
                orders: [],
                lastDate: null
            };
        }
        clients[phone].orders.push({ id: p.id, type: p.type, status: p.status });
        if (p.messages && p.messages.length) {
            p.messages.forEach(function(m) {
                clients[phone].messages.push({ from: m.from, text: m.text, date: m.date, orderId: p.id });
            });
        }
    });

    var list = Object.values(clients);
    list.forEach(function(c) {
        if (c.messages.length) {
            c.messages.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
            c.lastDate = c.messages[0].date;
            c.lastMessage = c.messages[0].text;
        } else {
            c.lastDate = c.orders.length ? '2025-01-01' : '';
            c.lastMessage = 'Нет сообщений';
        }
    });

    list.sort(function(a, b) {
        if (!a.lastDate) return 1;
        if (!b.lastDate) return -1;
        return new Date(b.lastDate) - new Date(a.lastDate);
    });

    return list;
}

function renderAdminChat() {
    var conversations = getConversations();
    var typeNames = { fullcycle: 'Полный цикл', print: 'Печать', modeling: 'Моделирование', scanning: 'Сканирование' };

    var html = '<div class="admin-chat">';

    html += '<div class="admin-chat__sidebar">';
    html += '<div class="admin-chat__sidebar-header"><h3>Клиенты</h3></div>';
    html += '<div class="admin-chat__client-list">';

    if (conversations.length === 0) {
        html += '<div class="admin-chat__empty">Нет диалогов</div>';
    }

    conversations.forEach(function(c) {
        var initials = c.name.charAt(0).toUpperCase();
        var lastOrder = c.orders.length ? typeNames[c.orders[c.orders.length - 1].type] || '' : '';
        var dateStr = c.lastDate ? new Date(c.lastDate).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) : '';
        var unread = c.messages.filter(function(m) { return m.from === 'user'; }).length;

        html += '<div class="admin-chat__client' + (currentChatClient === c.phone ? ' active' : '') + '" data-phone="' + escapeAttr(c.phone) + '">';
        html += '<div class="admin-chat__client-avatar">' + escapeHtml(initials) + '</div>';
        html += '<div class="admin-chat__client-info">';
        html += '<div class="admin-chat__client-name">' + escapeHtml(c.name) + '</div>';
        html += '<div class="admin-chat__client-last">' + escapeHtml(c.lastMessage.substring(0, 50)) + '</div>';
        html += '</div>';
        html += '<div class="admin-chat__client-meta">';
        html += '<span class="admin-chat__client-date">' + escapeHtml(dateStr) + '</span>';
        if (unread > 0) html += '<span class="admin-chat__client-unread">' + unread + '</span>';
        html += '</div>';
        html += '</div>';
    });

    html += '</div></div>';

    html += '<div class="admin-chat__main">';
    if (currentChatClient) {
        var conv = conversations.find(function(c) { return c.phone === currentChatClient; });
        if (conv) {
            html += renderChatWindow(conv, typeNames);
        } else {
            html += '<div class="admin-chat__placeholder">Выберите клиента</div>';
        }
    } else {
        html += '<div class="admin-chat__placeholder">';
        html += '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
        html += '<p>Выберите клиента слева</p>';
        html += '</div>';
    }
    html += '</div>';

    html += '</div>';

    document.getElementById('tab-admin-chat').innerHTML = html;

    document.querySelectorAll('.admin-chat__client').forEach(function(el) {
        el.addEventListener('click', function() {
            currentChatClient = el.dataset.phone;
            renderAdminChat();
        });
    });

    if (currentChatClient) {
        var sendBtn = document.getElementById('chat-send-btn');
        var chatInput = document.getElementById('chat-message-input');
        if (sendBtn && chatInput) {
            sendBtn.addEventListener('click', function() { sendAdminMessage(); });
            chatInput.addEventListener('keypress', function(e) { if (e.key === 'Enter') sendAdminMessage(); });
            setTimeout(function() {
                var mc = document.getElementById('chat-messages-container');
                if (mc) mc.scrollTop = mc.scrollHeight;
            }, 50);
            chatInput.focus();
        }
    }
}

function renderChatWindow(conv, typeNames) {
    var html = '';
    html += '<div class="admin-chat__header">';
    html += '<div class="admin-chat__header-info">';
    html += '<div class="admin-chat__header-avatar">' + escapeHtml(conv.name.charAt(0).toUpperCase()) + '</div>';
    html += '<div>';
    html += '<div class="admin-chat__header-name">' + escapeHtml(conv.name) + '</div>';
    html += '<div class="admin-chat__header-contact">' + escapeHtml(conv.phone) + (conv.telegram ? ' · ' + escapeHtml(conv.telegram) : '') + '</div>';
    html += '</div>';
    html += '</div>';
    html += '<div class="admin-chat__header-orders">';
    conv.orders.forEach(function(o) {
        var statusColors = { new: '#e3f2fd', in_progress: '#fff3e0', completed: '#e8f5e9', cancelled: '#fce4ec' };
        var statusTextColors = { new: '#1565c0', in_progress: '#e65100', completed: '#2e7d32', cancelled: '#c62828' };
        var statusNames = { new: 'Новый', in_progress: 'В работе', completed: 'Готово', cancelled: 'Отменён' };
        html += '<span class="admin-chat__order-badge" style="background:' + (statusColors[o.status] || '#f5f5f5') + ';color:' + (statusTextColors[o.status] || '#333') + '">';
        html += escapeHtml(o.id) + ' · ' + escapeHtml(typeNames[o.type] || o.type);
        html += '</span>';
    });
    html += '</div>';
    html += '</div>';

    html += '<div class="admin-chat__messages" id="chat-messages-container">';
    if (conv.messages.length === 0) {
        html += '<div class="admin-chat__no-messages">Нет сообщений. Начните диалог!</div>';
    } else {
        conv.messages.slice().reverse().forEach(function(m) {
            var isAdmin = m.from === 'admin';
            html += '<div class="admin-chat__msg ' + (isAdmin ? 'admin-chat__msg--admin' : 'admin-chat__msg--user') + '">';
            html += '<div class="admin-chat__msg-bubble">' + escapeHtml(m.text) + '</div>';
            html += '<div class="admin-chat__msg-meta">';
            html += '<span class="admin-chat__msg-sender">' + (isAdmin ? 'Вы' : escapeHtml(conv.name)) + '</span>';
            html += '<span class="admin-chat__msg-date">' + escapeHtml(new Date(m.date).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })) + '</span>';
            html += '</div>';
            html += '</div>';
        });
    }
    html += '</div>';

    html += '<div class="admin-chat__input-area">';
    html += '<input type="text" class="admin-chat__input" id="chat-message-input" placeholder="Введите сообщение...">';
    html += '<button class="admin-chat__send-btn" id="chat-send-btn">Отправить</button>';
    html += '</div>';

    return html;
}

function sendAdminMessage() {
    var input = document.getElementById('chat-message-input');
    if (!input) return;
    var text = sanitizeInput(input.value, 500);
    if (!text) return;

    var projects = JSON.parse(localStorage.getItem('enotspace_projects') || '[]');
    var targetProjects = projects.filter(function(p) {
        return p.contact && p.contact.phone === currentChatClient;
    });

    if (targetProjects.length === 0) return;

    var targetProject = targetProjects[targetProjects.length - 1];
    if (!targetProject.messages) targetProject.messages = [];
    targetProject.messages.push({ from: 'admin', text: text, date: new Date().toISOString() });

    localStorage.setItem('enotspace_projects', JSON.stringify(projects));
    input.value = '';
    renderAdminChat();
}
