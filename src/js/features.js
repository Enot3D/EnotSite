// === DARK THEME ===
function getBrowserTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getTheme() {
    var saved = localStorage.getItem('enotspace_theme');
    if (saved) return saved;
    return getBrowserTheme();
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

function setTheme(theme) {
    localStorage.setItem('enotspace_theme', theme);
    applyTheme(theme);
}

function toggleTheme() {
    var current = getTheme();
    setTheme(current === 'dark' ? 'light' : 'dark');
}

function resetTheme() {
    localStorage.removeItem('enotspace_theme');
    applyTheme(getBrowserTheme());
}

function initTheme() {
    applyTheme(getTheme());

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        var saved = localStorage.getItem('enotspace_theme');
        if (!saved) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });
}

// === NOTIFICATIONS ===
var notifRendered = false;

function renderNotifications() {
    if (notifRendered) return;
    notifRendered = true;

    var user = getCurrentUser();
    if (!user || !isAdmin(user)) {
        var oldBtn = document.getElementById('notif-btn');
        if (oldBtn) oldBtn.remove();
        return;
    }

    var allOld = document.querySelectorAll('#notif-btn');
    allOld.forEach(function(el) { el.remove(); });

    db.collection('projects').where('status', '==', 'new').get().then(function(snapshot) {
        var count = snapshot.size;

        var html = '<button class="admin-notif__btn" id="notif-btn">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' +
            (count > 0 ? '<span class="admin-notif__badge">' + count + '</span>' : '') +
        '</button>';

        var actions = document.querySelector('.header__actions');
        if (actions) {
            actions.insertAdjacentHTML('afterbegin', html);
            document.getElementById('notif-btn').addEventListener('click', function() {
                navigate('account');
                setTimeout(function() {
                    var tab = document.querySelector('[data-tab="all-orders"]');
                    if (tab) tab.click();
                }, 200);
            });
        }
    }).catch(function() {});
}

// === LOADING SKELETONS ===
function showSkeleton(containerId, count) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var html = '';
    for (var i = 0; i < count; i++) {
        html += '<div class="skeleton-card">' +
            '<div class="skeleton-card__image skeleton-pulse"></div>' +
            '<div class="skeleton-card__body">' +
                '<div class="skeleton-card__title skeleton-pulse"></div>' +
                '<div class="skeleton-card__text skeleton-pulse"></div>' +
                '<div class="skeleton-card__text skeleton-pulse" style="width:60%"></div>' +
                '<div class="skeleton-card__footer skeleton-pulse"></div>' +
            '</div>' +
        '</div>';
    }
    el.innerHTML = html;
}

// === EXPORT CSV ===
function exportOrdersCSV() {
    db.collection('projects').orderBy('createdAt', 'desc').get().then(function(snapshot) {
        var projects = [];
        snapshot.forEach(function(doc) { projects.push(doc.data()); });
        var typeNames = { fullcycle: 'Полный цикл', print: 'Печать', modeling: 'Моделирование', scanning: 'Сканирование' };
        var statusNames = { new: 'Новый', in_progress: 'В работе', completed: 'Готово', cancelled: 'Отменён' };

        var header = 'ID,Дата,Тип,Статус,Клиент,Телефон,Email,Описание,Стоимость\n';
        var rows = projects.map(function(p) {
            return [
                p.id || '',
                new Date(p.createdAt).toLocaleDateString('ru-RU'),
                typeNames[p.type] || p.type,
                statusNames[p.status] || p.status,
                p.contact ? p.contact.name : '',
                p.contact ? p.contact.phone : '',
                p.contact ? p.contact.email : '',
                '"' + (p.description || '').replace(/"/g, '""') + '"',
                p.price || ''
            ].join(',');
        }).join('\n');

        var csv = '\uFEFF' + header + rows;
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'enotspace_orders_' + new Date().toISOString().slice(0, 10) + '.csv';
        a.click();
        URL.revokeObjectURL(url);
    });
}

// === SALES CHART ===
function renderSalesChart() {
    var months = {};
    var monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

    return db.collection('projects').get().then(function(snapshot) {
        snapshot.forEach(function(doc) {
            var p = doc.data();
            var d = new Date(p.createdAt);
            var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
            if (!months[key]) months[key] = { count: 0, name: monthNames[d.getMonth()] };
            months[key].count++;
        });

        var sorted = Object.keys(months).sort().slice(-6);
        if (sorted.length === 0) return '';
        var maxCount = Math.max.apply(null, sorted.map(function(k) { return months[k].count; })) || 1;

        var html = '<div class="admin-chart">';
        html += '<h3 class="admin-chart__title">Заказы по месяцам</h3>';
        html += '<div class="admin-chart__bars">';

        sorted.forEach(function(key) {
            var m = months[key];
            var height = Math.round((m.count / maxCount) * 140);
            html += '<div class="admin-chart__bar-wrap">';
            html += '<div class="admin-chart__bar" style="height:' + height + 'px"><span class="admin-chart__bar-value">' + m.count + '</span></div>';
            html += '<span class="admin-chart__bar-label">' + m.name + '</span>';
            html += '</div>';
        });

        html += '</div></div>';
        return html;
    });
}
