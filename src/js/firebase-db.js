// === FIRESTORE INIT ===
function initFirestore() {
    return db.collection('settings').doc('init').get().then(function(doc) {
        if (doc.exists) return false;

        var batch = db.batch();

        batch.set(db.collection('settings').doc('init'), { created: true, createdAt: new Date().toISOString() });
        batch.set(db.collection('settings').doc('categories'), { categories: [] });
        batch.set(db.collection('settings').doc('about'), {
            blocks: [
                { icon: 'layers', title: 'О компании', text: 'Заполните информацию о вашей компании.' },
                { icon: 'users', title: 'Команда', text: 'Расскажите о вашей команде.' },
                { icon: 'clock', title: 'Сроки', text: 'Укажите ваши сроки работы.' },
                { icon: 'shield', title: 'Гарантии', text: 'Опишите ваши гарантии качества.' }
            ],
            stats: [
                { number: '0', label: 'Заказов' },
                { number: '0', label: 'Клиентов' },
                { number: '0', label: 'Лет опыта' },
                { number: '0', label: 'На связи' }
            ],
            equipment: [],
            contact: { phone: '', email: '', address: '' }
        });
        batch.set(db.collection('settings').doc('servicePrices'), {
            modeling: { modeling: 'от 500 ₽', repair: 'от 300 ₽', deadline: '1-5 дней' },
            scanning: { scanning: 'от 1 500 ₽', processing: 'от 500 ₽', accuracy: 'до 0.05 мм', deadline: '1-3 дня' },
            print: { base: 'от 750 ₽', note: 'Рассчитывается индивидуально' },
            fullcycle: { modeling: 'от 500 ₽', printing: 'от 750 ₽', total: 'от 1 250 ₽' }
        });

        return batch.commit().then(function() { return true; });
    });
}

// === FIRESTORE HELPERS ===

// Users
function firebaseSaveUser(userId, userData) {
    return db.collection('users').doc(userId).set(userData, { merge: true });
}

function firebaseGetUser(userId) {
    return db.collection('users').doc(userId).get().then(function(doc) {
        return doc.exists ? doc.data() : null;
    });
}

function firebaseGetAllUsers() {
    return db.collection('users').get().then(function(snapshot) {
        var users = [];
        snapshot.forEach(function(doc) {
            users.push(Object.assign({ id: doc.id }, doc.data()));
        });
        return users;
    });
}

// Projects (Orders)
function firebaseSaveProject(projectId, projectData) {
    return db.collection('projects').doc(projectId).set(projectData, { merge: true });
}

function firebaseGetAllProjects() {
    return db.collection('projects').orderBy('createdAt', 'desc').get().then(function(snapshot) {
        var projects = [];
        snapshot.forEach(function(doc) {
            projects.push(Object.assign({ id: doc.id }, doc.data()));
        });
        return projects;
    });
}

function firebaseGetProjectsByUser(userId) {
    return db.collection('projects').where('userId', '==', userId).orderBy('createdAt', 'desc').get().then(function(snapshot) {
        var projects = [];
        snapshot.forEach(function(doc) {
            projects.push(Object.assign({ id: doc.id }, doc.data()));
        });
        return projects;
    });
}

function firebaseUpdateProject(projectId, data) {
    return db.collection('projects').doc(projectId).update(data);
}

// Products
function firebaseSaveProduct(productId, productData) {
    return db.collection('products').doc(String(productId)).set(productData, { merge: true });
}

function firebaseDeleteProduct(productId) {
    return db.collection('products').doc(String(productId)).delete();
}

function firebaseGetAllProducts() {
    return db.collection('products').get().then(function(snapshot) {
        var products = [];
        snapshot.forEach(function(doc) {
            products.push(Object.assign({ id: parseInt(doc.id) }, doc.data()));
        });
        return products;
    });
}

// Categories
function firebaseSaveCategories(categories) {
    return db.collection('settings').doc('categories').set({ categories: categories });
}

function firebaseGetCategories() {
    return db.collection('settings').doc('categories').get().then(function(doc) {
        return doc.exists ? doc.data().categories : [];
    });
}

// Reviews
function firebaseSaveReview(reviewId, reviewData) {
    return db.collection('reviews').doc(reviewId).set(reviewData);
}

function firebaseGetAllReviews() {
    return db.collection('reviews').orderBy('date', 'desc').get().then(function(snapshot) {
        var reviews = [];
        snapshot.forEach(function(doc) {
            reviews.push(Object.assign({ id: doc.id }, doc.data()));
        });
        return reviews;
    });
}

function firebaseGetReviewsByProduct(productId) {
    return db.collection('reviews').where('productId', '==', productId).orderBy('date', 'desc').get().then(function(snapshot) {
        var reviews = [];
        snapshot.forEach(function(doc) {
            reviews.push(Object.assign({ id: doc.id }, doc.data()));
        });
        return reviews;
    });
}

// Promo Codes
function firebaseSavePromo(promoId, promoData) {
    return db.collection('promos').doc(promoId).set(promoData, { merge: true });
}

function firebaseGetAllPromos() {
    return db.collection('promos').get().then(function(snapshot) {
        var promos = [];
        snapshot.forEach(function(doc) {
            promos.push(Object.assign({ id: doc.id }, doc.data()));
        });
        return promos;
    });
}

function firebaseDeletePromo(promoId) {
    return db.collection('promos').doc(promoId).delete();
}

function firebaseUpdatePromo(promoId, data) {
    return db.collection('promos').doc(promoId).update(data);
}

// About Page
function firebaseSaveAbout(data) {
    return db.collection('settings').doc('about').set(data);
}

function firebaseGetAbout() {
    return db.collection('settings').doc('about').get().then(function(doc) {
        return doc.exists ? doc.data() : null;
    });
}

// Service Prices
function firebaseSaveServicePrices(prices) {
    return db.collection('settings').doc('servicePrices').set(prices);
}

function firebaseGetServicePrices() {
    return db.collection('settings').doc('servicePrices').get().then(function(doc) {
        return doc.exists ? doc.data() : null;
    });
}

// Purchased Products
function firebaseSavePurchased(userId, productIds) {
    return db.collection('users').doc(userId).update({ purchased: productIds });
}

function firebaseGetPurchased(userId) {
    return db.collection('users').doc(userId).get().then(function(doc) {
        return doc.exists ? (doc.data().purchased || []) : [];
    });
}

// Favorites
function firebaseSaveFavorites(userId, favorites) {
    return db.collection('users').doc(userId).update({ favorites: favorites });
}

function firebaseGetFavorites(userId) {
    return db.collection('users').doc(userId).get().then(function(doc) {
        return doc.exists ? (doc.data().favorites || []) : [];
    });
}
