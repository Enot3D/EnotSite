var PAGES = {};

PAGES.auth_modal = `<div class="auth-modal" id="auth-modal">
    <div class="auth-modal__overlay" id="auth-overlay"></div>
    <div class="auth-modal__content">
        <button class="auth-modal__close" id="auth-close">&times;</button>
        <div class="auth-modal__login" id="auth-login-view">
            <h2 class="auth-modal__title">Вход</h2>
            <p class="auth-modal__desc">Войдите, чтобы отслеживать заказы</p>
            <form class="auth-form" id="login-form">
                <div class="auth-form__group">
                    <label class="auth-form__label">Телефон или Email</label>
                    <input class="auth-form__input" type="text" id="login-email" placeholder="+7 (___) ___-__-__ или mail@example.com">
                </div>
                <div class="auth-form__group">
                    <label class="auth-form__label">Пароль</label>
                    <input class="auth-form__input" type="password" id="login-password" placeholder="Введите пароль">
                </div>
                <button type="button" class="auth-form__btn" id="login-submit">Войти</button>
            </form>
            <p class="auth-modal__switch">Нет аккаунта? <a href="#" id="show-register">Зарегистрироваться</a></p>
        </div>
        <div class="auth-modal__register" id="auth-register-view" style="display:none;">
            <h2 class="auth-modal__title">Регистрация</h2>
            <p class="auth-modal__desc">Создайте аккаунт для отслеживания заказов</p>
            <form class="auth-form" id="register-form">
                <div class="auth-form__group">
                    <label class="auth-form__label">Имя *</label>
                    <input class="auth-form__input" type="text" id="reg-name" placeholder="Иван">
                </div>
                <div class="auth-form__group">
                    <label class="auth-form__label">Телефон *</label>
                    <input class="auth-form__input" type="tel" id="reg-phone" placeholder="+7 (___) ___-__-__">
                </div>
                <div class="auth-form__group">
                    <label class="auth-form__label">Email</label>
                    <input class="auth-form__input" type="email" id="reg-email" placeholder="mail@example.com">
                </div>
                <div class="auth-form__group">
                    <label class="auth-form__label">Пароль *</label>
                    <input class="auth-form__input" type="password" id="reg-password" placeholder="Минимум 6 символов">
                </div>
                <button type="button" class="auth-form__btn" id="register-submit">Зарегистрироваться</button>
            </form>
            <p class="auth-modal__switch">Уже есть аккаунт? <a href="#" id="show-login">Войти</a></p>
        </div>
    </div>
</div>`;

PAGES.footer = `<footer class="site-footer">
    <div class="site-footer__container">
        <div class="site-footer__content">
            <p class="site-footer__copy">&copy; 2025 EnotSpace. Все права защищены.</p>
        </div>
    </div>
</footer>`;

PAGES.catalog = `<section class="catalog">
    <div class="catalog__toolbar">
        <div class="catalog__search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" class="catalog__search-input" id="catalog-search" placeholder="Поиск...">
        </div>
        <button class="catalog__filter-btn" id="catalog-filter-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/><circle cx="6" cy="12" r="2" fill="currentColor"/><circle cx="10" cy="18" r="2" fill="currentColor"/></svg>
            Фильтр
        </button>
    </div>
    <div class="catalog__filters-panel" id="catalog-filters-panel" style="display: none;">
        <button class="catalog__filter active" data-filter="all">Все</button>
    </div>
    <div class="catalog__grid" id="products-grid"></div>
</section>
<div class="product-modal" id="product-modal">
    <div class="product-modal__overlay"></div>
    <div class="product-modal__content">
        <button class="product-modal__close" id="modal-close">✕</button>
        <div class="product-modal__body">
            <div class="product-modal__gallery">
                <div class="product-modal__main-image"><img id="modal-main-image" src="" alt=""></div>
                <div class="product-modal__thumbnails" id="modal-thumbnails"></div>
            </div>
            <div class="product-modal__info">
                <h2 class="product-modal__title" id="modal-title"></h2>
                <div class="product-modal__price-row">
                    <div class="product-modal__price" id="modal-price"></div>
                    <button class="product-modal__add-btn" id="modal-add-to-cart">В корзину</button>
                    <div class="product-modal__cart-counter" id="modal-cart-counter" style="display: none;">
                        <button class="product-modal__cart-btn" id="modal-decrease">−</button>
                        <span class="product-modal__cart-quantity" id="modal-quantity">1</span>
                        <button class="product-modal__cart-btn" id="modal-increase">+</button>
                    </div>
                </div>
                <div class="product-modal__colors" id="modal-colors">
                    <span class="product-modal__colors-label">Выбрать цвет:</span>
                    <div class="product-modal__color-options" id="modal-color-options"></div>
                </div>
                <div class="product-modal__reviews-link" id="modal-reviews-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    <span id="modal-reviews-count">Отзывы</span>
                </div>
                <div class="product-modal__specs" id="modal-specs"></div>
                <div class="product-modal__delivery" id="modal-delivery">
                    <div class="product-modal__delivery-title">Изготовление и доставка:</div>
                    <div class="product-modal__delivery-item" id="modal-stock">
                        <span class="product-modal__delivery-dot product-modal__delivery-dot--green"></span>
                        <span>В наличии — отправка сегодня</span>
                    </div>
                    <div class="product-modal__delivery-item">
                        <span class="product-modal__delivery-dot product-modal__delivery-dot--blue"></span>
                        <span>Доставка по всей России</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>`;

PAGES.services = `<section class="services">
    <div class="services__grid">
        <div class="service-card service-card--light" data-service="fullcycle">
            <div class="service-card__body">
                <div class="service-card__image"><img src="assets/images/services/fullcycle.png" alt="Полный цикл создания изделия"></div>
                <div class="service-card__text">
                    <h2 class="service-card__title">ПОЛНЫЙ ЦИКЛ СОЗДАНИЯ ИЗДЕЛИЯ</h2>
                    <p class="service-card__subtitle-text">От идеи до готовой детали</p>
                    <p class="service-card__description">Создание изделия полностью под ключ: анализ задачи, разработка 3D-модели, подготовка производства, печать и обработка готового изделия.</p>
                    <a href="#" class="service-card__btn" onclick="navigate('fullcycle');return false;">Заказать проект &rarr;</a>
                </div>
            </div>
        </div>
        <div class="service-card service-card--orange" data-service="print">
            <div class="service-card__body">
                <div class="service-card__image"><img src="assets/images/services/print.png" alt="3D-печать по вашей модели"></div>
                <div class="service-card__text">
                    <h2 class="service-card__title">3D-ПЕЧАТЬ ПО ВАШЕЙ МОДЕЛИ</h2>
                    <p class="service-card__subtitle-text">Изготовление деталей из готового файла</p>
                    <p class="service-card__description">Печать изделий по вашим 3D-моделям с подбором материала, настройкой качества и подготовкой модели к производству.</p>
                    <p class="service-card__formats">Работаем с форматами: STL, STEP, OBJ, 3MF</p>
                    <a href="#" class="service-card__btn service-card__btn--white" onclick="navigate('print');return false;">Рассчитать стоимость &rarr;</a>
                </div>
            </div>
        </div>
        <div class="service-card service-card--orange" data-service="modeling">
            <div class="service-card__body">
                <div class="service-card__image"><img src="assets/images/services/modeling.png" alt="3D-моделирование"></div>
                <div class="service-card__text">
                    <h2 class="service-card__title">3D-МОДЕЛИРОВАНИЕ</h2>
                    <p class="service-card__subtitle-text">Создание точных цифровых моделей</p>
                    <p class="service-card__description">Разрабатываем 3D-модели деталей, корпусов и механизмов по чертежам, фотографиям или техническому заданию.</p>
                    <a href="#" class="service-card__btn service-card__btn--white" onclick="navigate('modeling');return false;">Создать модель &rarr;</a>
                </div>
            </div>
        </div>
        <div class="service-card service-card--light" data-service="scanning">
            <div class="service-card__body">
                <div class="service-card__image"><img src="assets/images/services/scanning.png" alt="3D-сканирование"></div>
                <div class="service-card__text">
                    <h2 class="service-card__title">3D-сканирование</h2>
                    <p class="service-card__subtitle-text">Перевод физических объектов в цифровой формат</p>
                    <p class="service-card__description">Получение точной 3D-копии существующих деталей и объектов для дальнейшего моделирования или производства.</p>
                    <a href="#" class="service-card__btn" onclick="navigate('scanning');return false;">Заказать сканирование &rarr;</a>
                </div>
            </div>
        </div>
    </div>
</section>`;

PAGES.cart = `<section class="cart-page">
    <div class="cart-page__hero"><h1 class="cart-page__title">Корзина</h1></div>
    <div class="cart-page__layout" id="cart-layout">
        <div class="cart-page__items" id="cart-items"></div>
        <div class="cart-page__summary" id="cart-summary">
            <div class="cart-summary">
                <h3 class="cart-summary__title">Итого</h3>
                <div class="cart-summary__rows" id="summary-rows"></div>
                <div class="cart-summary__total"><span>К оплате</span><span id="summary-total">0 ₽</span></div>
                <button class="cart-summary__btn" id="cart-checkout">Оформить заказ</button>
                <p class="cart-summary__hint">Бесплатная доставка от 5 000 ₽</p>
            </div>
        </div>
    </div>
    <div class="cart-empty" id="cart-empty" style="display: none;">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        <h2>Корзина пуста</h2>
        <p>Добавьте товары из каталога, чтобы оформить заказ</p>
        <button class="cart-empty__btn" id="cart-go-catalog">Перейти в каталог</button>
    </div>
</section>`;

PAGES.fullcycle = `<section class="project-wizard">
    <div class="project-wizard__hero"><h1 class="project-wizard__title">Полный цикл</h1><p class="project-wizard__subtitle">От сломанной детали до готовой замены — мы сделаем всё</p></div>
    <div class="project-wizard__steps-info">
        <div class="step-info"><div class="step-info__number">1</div><div class="step-info__text"><strong>Фото</strong><span>Загрузите фото детали</span></div></div>
        <div class="step-info__arrow">&rarr;</div>
        <div class="step-info"><div class="step-info__number">2</div><div class="step-info__text"><strong>Описание</strong><span>Расскажите о задаче</span></div></div>
        <div class="step-info__arrow">&rarr;</div>
        <div class="step-info"><div class="step-info__number">3</div><div class="step-info__text"><strong>Контакты</strong><span>Как с вами связаться</span></div></div>
        <div class="step-info__arrow">&rarr;</div>
        <div class="step-info"><div class="step-info__number">4</div><div class="step-info__text"><strong>Готово</strong><span>Мы свяжемся с вами</span></div></div>
    </div>
    <div class="project-wizard__form-wrap">
        <div class="project-wizard__progress"><div class="project-wizard__progress-bar" id="progress-bar" style="width: 25%"></div></div>
        <form class="project-wizard__form" id="project-form" novalidate>
            <div class="wizard-step active" data-step="1">
                <h2 class="wizard-step__title">Загрузите фото детали</h2>
                <p class="wizard-step__desc">Чем больше фото — тем точнее мы сможем оценить задачу.</p>
                <div class="upload-zone" id="upload-zone">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <p class="upload-zone__text">Перетащите фото сюда</p>
                    <p class="upload-zone__subtext">или</p>
                    <label class="upload-zone__btn">Выберите файлы<input type="file" id="file-input" multiple accept="image/*" hidden></label>
                </div>
                <div class="upload-preview" id="upload-preview"></div>
            </div>
            <div class="wizard-step" data-step="2">
                <h2 class="wizard-step__title">Опишите задачу</h2>
                <p class="wizard-step__desc">Расскажите что сломалось, какой результат ожидаете.</p>
                <div class="form-group"><label class="form-label">Что нужно сделать? *</label><textarea class="form-textarea" id="project-desc" rows="5" placeholder="Например: Сломалась ручка дверцы шкафа."></textarea></div>
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Желаемый материал</label><select class="form-select" id="project-material"><option value="">Не знаю — подскажете</option><option value="pla">PLA (пластик)</option><option value="petg">PETG</option><option value="abs">ABS</option><option value="resin">Смола</option><option value="nylon">Нейлон</option><option value="metal">Металл</option></select></div>
                    <div class="form-group"><label class="form-label">Срочность</label><select class="form-select" id="project-urgency"><option value="standard">Стандарт (5-7 дней)</option><option value="fast">Быстро (2-3 дня)</option><option value="express">Экспресс (1 день)</option></select></div>
                </div>
            </div>
            <div class="wizard-step" data-step="3">
                <h2 class="wizard-step__title">Контактные данные</h2>
                <p class="wizard-step__desc">Мы свяжемся с вами для уточнения деталей.</p>
                <div class="form-group"><label class="form-label">Ваше имя *</label><input class="form-input" type="text" id="contact-name" placeholder="Иван"></div>
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Телефон *</label><input class="form-input" type="tel" id="contact-phone" placeholder="+7 (___) ___-__-__"></div>
                    <div class="form-group"><label class="form-label">Telegram</label><input class="form-input" type="text" id="contact-telegram" placeholder="@username"></div>
                </div>
                <div class="form-group"><label class="form-label">Email</label><input class="form-input" type="email" id="contact-email" placeholder="mail@example.com"></div>
            </div>
            <div class="wizard-step" data-step="4">
                <div class="wizard-step__success">
                    <div class="wizard-step__success-icon"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4caf50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
                    <h2 class="wizard-step__title">Заявка отправлена!</h2>
                    <p class="wizard-step__desc">Мы изучим вашу задачу и свяжемся в ближайшее время.</p>
                    <p class="wizard-step__hint">После регистрации вы сможете отслеживать статус проекта в личном кабинете.</p>
                </div>
            </div>
        </form>
        <div class="project-wizard__nav" id="wizard-nav">
            <button class="wizard-btn wizard-btn--back" id="btn-back" style="visibility: hidden;">Назад</button>
            <button class="wizard-btn wizard-btn--next" id="btn-next">Далее</button>
        </div>
    </div>
</section>`;

PAGES.print = `<section class="print-order">
    <div class="print-order__hero"><h1 class="print-order__title">3D-печать по модели</h1><p class="print-order__subtitle">Загрузите готовый 3D-файл — мы напечатаем</p></div>
    <div class="print-order__layout">
        <div class="print-order__form-wrap">
            <div class="print-section">
                <h2 class="print-section__title">3D-файл</h2>
                <div class="upload-zone" id="print-upload-zone">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <p class="upload-zone__text">Перетащите 3D-файл сюда</p>
                    <p class="upload-zone__subtext">или</p>
                    <label class="upload-zone__btn">Выберите файл<input type="file" id="print-file-input" accept=".stl,.obj,.3mf,.step,.stp" hidden></label>
                </div>
                <div class="file-info" id="file-info" style="display: none;">
                    <div class="file-info__icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f98130" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
                    <div class="file-info__details"><span class="file-info__name" id="file-name"></span><span class="file-info__size" id="file-size"></span></div>
                    <button type="button" class="file-info__remove" id="file-remove">Удалить</button>
                </div>
                <p class="formats-hint">Форматы: STL, OBJ, 3MF, STEP — до 100 МБ</p>
            </div>
            <div class="print-section">
                <h2 class="print-section__title">Описание модели</h2>
                <div class="form-group"><label class="form-label">Опишите деталь и её применение *</label><textarea class="form-textarea" id="print-desc" rows="4" placeholder="Например: Кронштейн для полки."></textarea></div>
            </div>
            <div class="print-section">
                <h2 class="print-section__title">Параметры</h2>
                <div class="print-params">
                    <div class="form-group"><label class="form-label">Количество</label><div class="quantity-selector"><button type="button" class="quantity-btn" id="qty-minus">−</button><span class="quantity-value" id="qty-display">1</span><button type="button" class="quantity-btn" id="qty-plus">+</button></div></div>
                    <div class="form-group"><label class="form-label">Цвет</label><select class="form-select" id="print-color"><option value="any">Любой</option><option value="white">Белый</option><option value="black">Чёрный</option><option value="gray">Серый</option><option value="red">Красный</option><option value="blue">Синий</option><option value="green">Зелёный</option><option value="orange">Оранжевый</option><option value="yellow">Жёлтый</option></select></div>
                    <div class="form-group"><label class="form-label">Срочность</label><select class="form-select" id="print-urgency"><option value="standard">Стандарт (5-7 дней)</option><option value="fast">Быстро (2-3 дня)</option><option value="express">Экспресс (1 день)</option></select></div>
                </div>
            </div>
            <button class="print-submit-btn" id="print-submit">Отправить на оценку</button>
        </div>
        <div class="print-order__sidebar">
            <div class="sidebar-card"><h3 class="sidebar-card__title">Ваш заказ</h3><div class="sidebar-card__list" id="sidebar-list"><div class="sidebar-empty">Заполните форму</div></div></div>
            <div class="sidebar-card sidebar-card--note"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f98130" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg><div><strong>Стоимость рассчитывается индивидуально</strong><p>Мы проанализируем модель в слайсере и сообщим точную цену.</p></div></div>
        </div>
    </div>
</section>`;

PAGES.modeling = `<section class="sp">
    <div class="sp__hero"><h1 class="sp__title">3D-моделирование</h1><p class="sp__subtitle">Создадим 3D-модель с нуля по вашему описанию, чертежу или эскизу</p></div>
    <div class="sp__content">
        <div class="sp__main">
            <div>
                <h2 class="sp-section__title">Что мы делаем</h2>
                <div class="sp-features">
                    <div class="sp-feature"><div class="sp-feature__icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f98130" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></div><div><h3>По чертежу</h3><p>Точное воссоздание по размерам</p></div></div>
                    <div class="sp-feature"><div class="sp-feature__icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f98130" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></div><div><h3>По фото</h3><p>Восстанавливаем 3D-модель по фото</p></div></div>
                    <div class="sp-feature"><div class="sp-feature__icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f98130" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg></div><div><h3>С нуля</h3><p>От идеи до готового файла</p></div></div>
                    <div class="sp-feature"><div class="sp-feature__icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f98130" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></div><div><h3>Доработка</h3><p>Исправляем и улучшаем модели</p></div></div>
                </div>
            </div>
            <div>
                <h2 class="sp-section__title">Оформите заявку</h2>
                <div class="sp-form-wrap">
                    <form class="sp-form" id="modeling-form">
                        <div class="fg"><label class="fl">Опишите задачу *</label><textarea class="ft" id="modeling-desc" rows="5" placeholder="Что нужно смоделировать?"></textarea></div>
                        <div class="fr"><div class="fg"><label class="fl">Ваше имя *</label><input class="fi" type="text" id="modeling-name" placeholder="Иван"></div><div class="fg"><label class="fl">Телефон *</label><input class="fi" type="tel" id="modeling-phone" placeholder="+7 (___) ___-__-__"></div></div>
                        <div class="fg"><label class="fl">Telegram</label><input class="fi" type="text" id="modeling-telegram" placeholder="@username"></div>
                        <div class="fg"><label class="fl">Приложите чертежи или фото</label><div class="sp-upload" id="modeling-upload-zone"><p class="sp-upload__text">Перетащите файлы сюда</p><label class="sp-upload__btn">Выберите<input type="file" id="modeling-file-input" multiple accept="image/*,.pdf,.dwg,.dxf" hidden></label></div><div class="sp-preview" id="modeling-preview"></div></div>
                        <button type="button" class="sp-submit" id="modeling-submit">Отправить заявку</button>
                    </form>
                </div>
            </div>
        </div>
        <div class="sp__sidebar">
            <div class="sp-sidebar"><h3 class="sp-sidebar__title">Стоимость</h3><div class="sp-sidebar__list"><div class="sp-sidebar__row"><span class="sp-sidebar__row-label">Моделирование</span><span class="sp-sidebar__row-value">от 500 ₽</span></div><div class="sp-sidebar__row"><span class="sp-sidebar__row-label">Доработка</span><span class="sp-sidebar__row-value">от 300 ₽</span></div><div class="sp-sidebar__row"><span class="sp-sidebar__row-label">Сроки</span><span class="sp-sidebar__row-value">1-5 дней</span></div></div></div>
            <div class="sp-sidebar sp-sidebar--note"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f98130" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg><div><strong>Бесплатная консультация</strong><p>Оценим задачу и скажем стоимость</p></div></div>
        </div>
    </div>
</section>`;

PAGES.scanning = `<section class="sp">
    <div class="sp__hero"><h1 class="sp__title">3D-сканирование</h1><p class="sp__subtitle">Оцифруем реальный объект — получите точную 3D-модель</p></div>
    <div class="sp__content">
        <div class="sp__main">
            <div>
                <h2 class="sp-section__title">Что мы делаем</h2>
                <div class="sp-features">
                    <div class="sp-feature"><div class="sp-feature__icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f98130" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></div><div><h3>Сканирование объектов</h3><p>Любые размеры</p></div></div>
                    <div class="sp-feature"><div class="sp-feature__icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f98130" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div><div><h3>Высокая точность</h3><p>Точность до 0.05 мм</p></div></div>
                    <div class="sp-feature"><div class="sp-feature__icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f98130" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div><div><h3>Готовые файлы</h3><p>STL, OBJ, STEP</p></div></div>
                    <div class="sp-feature"><div class="sp-feature__icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f98130" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></div><div><h3>Печать по скану</h3><p>Напечатаем копию объекта</p></div></div>
                </div>
            </div>
            <div>
                <h2 class="sp-section__title">Оформите заявку</h2>
                <div class="sp-form-wrap">
                    <form class="sp-form" id="scanning-form">
                        <div class="fg"><label class="fl">Что нужно отсканировать? *</label><textarea class="ft" id="scanning-desc" rows="4" placeholder="Опишите объект"></textarea></div>
                        <div class="fg"><label class="fl">Фото объекта</label><div class="sp-upload" id="scanning-upload-zone"><p class="sp-upload__text">Перетащите фото сюда</p><label class="sp-upload__btn">Выберите<input type="file" id="scanning-file-input" multiple accept="image/*" hidden></label></div><div class="sp-preview" id="scanning-preview"></div></div>
                        <div class="fr"><div class="fg"><label class="fl">Ваше имя *</label><input class="fi" type="text" id="scanning-name" placeholder="Иван"></div><div class="fg"><label class="fl">Телефон *</label><input class="fi" type="tel" id="scanning-phone" placeholder="+7 (___) ___-__-__"></div></div>
                        <div class="fg"><label class="fl">Telegram</label><input class="fi" type="text" id="scanning-telegram" placeholder="@username"></div>
                        <button type="button" class="sp-submit" id="scanning-submit">Отправить заявку</button>
                    </form>
                </div>
            </div>
        </div>
        <div class="sp__sidebar">
            <div class="sp-sidebar"><h3 class="sp-sidebar__title">Стоимость</h3><div class="sp-sidebar__list"><div class="sp-sidebar__row"><span class="sp-sidebar__row-label">Сканирование</span><span class="sp-sidebar__row-value">от 1 500 ₽</span></div><div class="sp-sidebar__row"><span class="sp-sidebar__row-label">Обработка скана</span><span class="sp-sidebar__row-value">от 500 ₽</span></div><div class="sp-sidebar__row"><span class="sp-sidebar__row-label">Точность</span><span class="sp-sidebar__row-value">до 0.05 мм</span></div><div class="sp-sidebar__row"><span class="sp-sidebar__row-label">Сроки</span><span class="sp-sidebar__row-value">1-3 дня</span></div></div></div>
            <div class="sp-sidebar sp-sidebar--note"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f98130" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg><div><strong>Привезите объект к нам</strong><p>Или выезд на место для крупных объектов</p></div></div>
        </div>
    </div>
</section>`;

PAGES.reviews = `<section class="reviews-page">
    <div class="reviews-page__hero">
        <h1 class="reviews-page__title">Отзывы клиентов</h1>
        <p class="reviews-page__subtitle">Что говорят о нас наши покупатели</p>
    </div>
    <div class="reviews-page__stats" id="reviews-stats"></div>
    <div class="reviews-page__filters">
        <button class="reviews-filter active" data-rating="all">Все</button>
        <button class="reviews-filter" data-rating="5">5 ★</button>
        <button class="reviews-filter" data-rating="4">4 ★</button>
        <button class="reviews-filter" data-rating="3">3 ★</button>
    </div>
    <div class="reviews-page__list" id="reviews-list"></div>
</section>`;

PAGES.about = '<div id="about-placeholder"></div>';

PAGES.account = `<section class="account">
    <div class="account__header">
        <div class="account__user"><div class="account__avatar" id="account-avatar">И</div><div class="account__user-info"><h1 class="account__name" id="account-name">Пользователь</h1><p class="account__contact" id="account-contact"></p></div></div>
        <button class="account__logout" id="account-logout">Выйти</button>
    </div>
    <div class="account__tabs" id="account-tabs">
        <button class="account__tab active" data-tab="orders">Мои заказы</button>
        <button class="account__tab" data-tab="client-chat">Чат</button>
        <button class="account__tab" data-tab="settings">Настройки</button>
    </div>
    <div class="account__tab-content active" id="tab-orders">
        <div class="account__orders" id="account-orders"></div>
        <div class="order-detail" id="order-detail" style="display:none;"></div>
    </div>
    <div class="account__tab-content" id="tab-client-chat"></div>
    <div class="account__tab-content" id="tab-settings">
        <div class="account-settings">
            <h3 class="account-settings__title">Личные данные</h3>
            <form class="account-settings__form" id="settings-form">
                <div class="account-settings__row">
                    <div class="account-settings__field"><label class="account-settings__label">Имя</label><input class="account-settings__input" type="text" id="settings-name"></div>
                    <div class="account-settings__field"><label class="account-settings__label">Телефон</label><input class="account-settings__input" type="tel" id="settings-phone"></div>
                </div>
                <div class="account-settings__row">
                    <div class="account-settings__field"><label class="account-settings__label">Email</label><input class="account-settings__input" type="email" id="settings-email"></div>
                    <div class="account-settings__field"><label class="account-settings__label">Telegram</label><input class="account-settings__input" type="text" id="settings-telegram"></div>
                </div>
                <button type="button" class="account-settings__btn" id="settings-save">Сохранить</button>
            </form>
        </div>
    </div>
    <div class="account__tab-content" id="tab-dashboard" style="display:none;"></div>
    <div class="account__tab-content" id="tab-admin-chat" style="display:none;"></div>
    <div class="account__tab-content" id="tab-all-orders" style="display:none;"></div>
    <div class="account__tab-content" id="tab-admin-promos" style="display:none;"></div>
    <div class="account__tab-content" id="tab-users" style="display:none;"></div>
</section>`;
