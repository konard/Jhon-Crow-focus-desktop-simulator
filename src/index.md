# index.html - Документация HTML-структуры интерфейса

## Что это за файл?

`index.html` - это главная веб-страница приложения. Она содержит:
- HTML-разметку интерфейса (меню, панели, модальные окна)
- CSS-стили для оформления элементов
- Подключение библиотек Three.js и PDF.js
- Подключение скриптов renderer.js

**Важно:** Этот файл загружается в Electron BrowserWindow и запускается в рендерер-процессе.

## Основные разделы

### 1. Подключение библиотек (в head)

```html
<!-- Three.js для 3D-графики -->
<script src="lib/three.min.js"></script>

<!-- PDF.js для отображения PDF-файлов -->
<script src="lib/pdf.min.js"></script>
<script src="lib/pdf.worker.min.js"></script>
```

**Что такое Three.js:**
Библиотека для создания 3D-графики в браузере с помощью WebGL.

**Что такое PDF.js:**
Библиотека от Mozilla для отображения PDF-файлов в браузере.

### 2. Контейнер для 3D-сцены

```html
<div id="canvas-container"></div>
```

**Что это:**
В этот контейнер Three.js вставит canvas (холст) для рисования 3D-сцены.

### 3. Боковое меню (строки 32-46)

```html
<div id="menu">
  <div class="menu-header">
    <h2>📦 Add Objects</h2>
  </div>
  <div class="menu-section">
    <h3>Presets</h3>
    <div id="preset-grid" class="preset-grid">
      <!-- Пресеты объектов добавляются JavaScript -->
    </div>
  </div>
</div>
```

**Стили меню:**

```css
#menu {
  position: fixed;
  left: 0;
  top: 0;
  width: 260px;
  height: 100vh;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(10px);  /* Размытие фона */
  transform: translateX(-100%);  /* Скрыто слева */
  transition: transform 0.3s ease;
}

#menu.open {
  transform: translateX(0);  /* Показать */
}
```

**Что такое `backdrop-filter`:**
CSS-свойство, которое размывает всё, что находится за элементом. Создаёт эффект "матового стекла".

**Что такое `transform: translateX(-100%)`:**
Смещает элемент влево на 100% его ширины, то есть полностью скрывает за левым краем экрана.

### 4. Кнопка открытия меню (строки 52-68)

```html
<button id="menu-toggle">
  <span></span>
</button>
```

**Стили для "гамбургер-иконки":**

```css
#menu-toggle span {
  display: block;
  width: 24px;
  height: 2px;
  background: white;
  position: relative;
}

#menu-toggle span::before,
#menu-toggle span::after {
  content: '';
  position: absolute;
  width: 24px;
  height: 2px;
  background: white;
  left: 0;
}

#menu-toggle span::before { top: -7px; }
#menu-toggle span::after { top: 7px; }
```

**Как это работает:**
- Основной `span` - средняя линия
- `::before` псевдоэлемент - верхняя линия
- `::after` псевдоэлемент - нижняя линия
- Вместе они создают иконку ☰

### 5. Сетка пресетов объектов (строки 159-190)

```css
.preset-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);  /* 2 колонки */
  gap: 10px;
}

.preset-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 15px 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-item:hover {
  background: rgba(79, 70, 229, 0.2);
  transform: translateY(-2px);  /* Поднимается при наведении */
}
```

**Что такое CSS Grid:**
Мощная система компоновки CSS. `grid-template-columns: repeat(2, 1fr)` означает "создать 2 колонки одинаковой ширины".

**Что такое `1fr`:**
"Fraction" (доля) - единица измерения в CSS Grid. `1fr` означает "1 часть доступного пространства".

### 6. Контекстное меню (строки 300+)

```html
<div id="context-menu">
  <div class="context-menu-item" data-action="customize">
    🎨 Customize
  </div>
  <div class="context-menu-item" data-action="delete">
    🗑️ Delete
  </div>
</div>
```

**Стили:**

```css
#context-menu {
  position: fixed;
  display: none;  /* Скрыто по умолчанию */
  background: rgba(26, 26, 46, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 5px 0;
  z-index: 1000;
}

.context-menu-item {
  padding: 10px 20px;
  cursor: pointer;
  transition: background 0.2s;
}

.context-menu-item:hover {
  background: rgba(79, 70, 229, 0.3);
}
```

**Как показать:**

```javascript
// В renderer.js
function showContextMenu(x, y) {
  const menu = document.getElementById('context-menu');
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  menu.style.display = 'block';
}
```

### 7. Модальные окна

#### Панель кастомизации (строки 350+)

```html
<div id="customize-panel" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h2>🎨 Customize Object</h2>
      <button class="close-btn">&times;</button>
    </div>

    <div class="modal-body">
      <!-- Выбор цветов -->
      <div class="color-picker-group">
        <label>Main Color</label>
        <input type="color" id="main-color">
      </div>

      <div class="color-picker-group">
        <label>Accent Color</label>
        <input type="color" id="accent-color">
      </div>
    </div>
  </div>
</div>
```

**Стили модального окна:**

```css
.modal {
  position: fixed;
  inset: 0;  /* Эквивалентно top: 0; right: 0; bottom: 0; left: 0; */
  background: rgba(0, 0, 0, 0.7);
  display: none;  /* Скрыто по умолчанию */
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal.active {
  display: flex;
}

.modal-content {
  background: #1a1a2e;
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}
```

**Что такое `inset`:**
Короткая запись для `top`, `right`, `bottom`, `left`. `inset: 0` растягивает элемент на весь экран.

#### Интерактивная панель (строки 400+)

```html
<div id="interaction-modal" class="modal">
  <!-- Содержимое меняется в зависимости от объекта -->
  <div id="interaction-content"></div>
</div>
```

**Динамический контент для таймера:**

```javascript
// В renderer.js
function showTimerInterface(timerObject) {
  const content = document.getElementById('interaction-content');
  content.innerHTML = `
    <h2>⏲️ Timer</h2>
    <div>
      <label>Minutes:</label>
      <input type="number" id="timer-minutes" min="0" max="1440" value="25">
    </div>
    <button id="start-timer-btn">Start</button>
  `;
}
```

### 8. Range Slider (ползунок)

```css
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  background: rgba(79, 70, 229, 0.3);
  border-radius: 3px;
  height: 6px;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #818cf8;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid #4f46e5;
  transition: all 0.2s ease;
}

input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.1);  /* Увеличивается при наведении */
}
```

**Зачем `:-webkit-slider-thumb`:**
Стилизует саму "ручку" ползунка. По умолчанию выглядит по-разному в разных браузерах, поэтому нужно стилизовать вручную.

### 9. Автоматизация кривых (FL Studio-style)

```html
<div class="automation-curve-editor">
  <div class="editor-header">
    <div class="editor-title">🎵 Pitch Curve</div>
    <button class="editor-btn">ON/OFF</button>
  </div>

  <div class="time-labels">
    <span>0s</span>
    <span>30s</span>
    <span>60s</span>
  </div>

  <div class="automation-curve-canvas-container">
    <canvas class="automation-curve-canvas" width="220" height="120"></canvas>
  </div>

  <div class="curve-type-selector">
    <button class="curve-type-btn active" data-curve-type="smooth">Smooth</button>
    <button class="curve-type-btn" data-curve-type="linear">Linear</button>
    <button class="curve-type-btn" data-curve-type="step">Step</button>
    <button class="curve-type-btn" data-curve-type="sine">Sine</button>
  </div>
</div>
```

**Стили canvas:**

```css
.automation-curve-canvas {
  width: 100%;
  height: 120px;
  cursor: crosshair;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.3);
}

.automation-curve-canvas.dragging {
  cursor: grabbing;
}
```

**Курсоры:**
- `crosshair` - крестик (для добавления точек)
- `grab` - открытая рука (можно схватить)
- `grabbing` - закрытая рука (перетаскивание)

### 10. Оверлей загрузки аудио

```html
<div id="audio-loading-overlay">
  <div class="loading-content">
    <div class="spinner"></div>
    <p>Loading audio...</p>
    <button id="audio-loading-cancel">Cancel</button>
  </div>
</div>
```

**Стили спиннера (крутящийся индикатор):**

```css
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: #818cf8;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Как это работает:**
- Элемент с круглой границей
- Верхняя граница другого цвета
- Вращается бесконечно
- Создаёт иллюзию загрузки

### 11. Цветовая палитра

```css
:root {
  --primary-color: #4f46e5;
  --primary-hover: #6366f1;
  --background: #1a1a2e;
  --surface: rgba(26, 26, 46, 0.95);
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.6);
  --border: rgba(255, 255, 255, 0.1);
}
```

**Зачем CSS-переменные:**
Можно изменить цвет всего приложения в одном месте!

**Использование:**

```css
.button {
  background: var(--primary-color);
  color: var(--text-primary);
}
```

**Изменение темы динамически:**

```javascript
document.documentElement.style.setProperty('--primary-color', '#ff0000');
```

## Адаптивность

### Media queries

```css
@media (max-width: 768px) {
  #menu {
    width: 100%;  /* На мобильных - во весь экран */
  }

  .preset-grid {
    grid-template-columns: repeat(3, 1fr);  /* 3 колонки */
  }
}

@media (max-width: 480px) {
  .preset-grid {
    grid-template-columns: repeat(2, 1fr);  /* 2 колонки */
  }
}
```

**Как это работает:**
- Если ширина экрана ≤ 768px - применяются стили для планшетов
- Если ширина ≤ 480px - применяются стили для телефонов

## Доступность (Accessibility)

### ARIA-атрибуты

```html
<button id="menu-toggle" aria-label="Toggle menu" aria-expanded="false">
  <span></span>
</button>
```

**Зачем это нужно:**
Screen readers (программы для слабовидящих) читают `aria-label` вслух.

### Фокус для клавиатуры

```css
button:focus-visible {
  outline: 2px solid #818cf8;
  outline-offset: 2px;
}
```

**Что такое `:focus-visible`:**
Показывает outline только при навигации клавиатурой (Tab), но не при клике мышью.

## Производительность

### will-change

```css
.preset-item {
  will-change: transform;
  transition: transform 0.2s ease;
}
```

**Зачем `will-change`:**
Подсказывает браузеру, что свойство будет меняться. Браузер может оптимизировать рендеринг (использовать GPU).

**ВАЖНО:** Не используйте везде! Только на элементах, которые действительно часто меняются.

### Избегайте layout thrashing

```javascript
// ПЛОХО - вызывает многократный reflow
for (let i = 0; i < elements.length; i++) {
  const height = elements[i].offsetHeight;  // Чтение - вызывает reflow
  elements[i].style.height = (height + 10) + 'px';  // Запись - вызывает reflow
}

// ХОРОШО - читаем всё, потом пишем всё
const heights = [];
for (let i = 0; i < elements.length; i++) {
  heights[i] = elements[i].offsetHeight;
}
for (let i = 0; i < elements.length; i++) {
  elements[i].style.height = (heights[i] + 10) + 'px';
}
```

## Распространённые ошибки

### 1. Z-index не работает

```css
/* ПЛОХО - z-index не работает без position */
.element {
  z-index: 100;
}

/* ХОРОШО */
.element {
  position: relative;  /* или absolute, fixed */
  z-index: 100;
}
```

### 2. Flexbox выравнивание

```css
/* Центрирование по горизонтали и вертикали */
.container {
  display: flex;
  align-items: center;      /* Вертикальное выравнивание */
  justify-content: center;  /* Горизонтальное выравнивание */
}
```

### 3. Переполнение текста

```css
/* Обрезать длинный текст с многоточием */
.text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

## Как внести изменения

### Добавить новый модальный диалог

1. HTML:

```html
<div id="my-modal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h2>My Dialog</h2>
      <button class="close-btn">&times;</button>
    </div>
    <div class="modal-body">
      <!-- Содержимое -->
    </div>
  </div>
</div>
```

2. JavaScript:

```javascript
function showMyModal() {
  document.getElementById('my-modal').classList.add('active');
}

function hideMyModal() {
  document.getElementById('my-modal').classList.remove('active');
}

// Закрытие по клику на фон
document.getElementById('my-modal').addEventListener('click', (e) => {
  if (e.target.id === 'my-modal') {
    hideMyModal();
  }
});
```

### Изменить цвета темы

```css
:root {
  --primary-color: #ff0000;  /* Красный вместо фиолетового */
  --background: #000000;     /* Чёрный фон */
}
```

### Добавить анимацию

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.element {
  animation: fadeIn 0.3s ease;
}
```

## Отладка

### Просмотр структуры DOM

```javascript
// В консоли DevTools (F12)
console.log(document.getElementById('menu'));
console.log(document.querySelectorAll('.preset-item'));
```

### Проверка стилей

```javascript
// Получить все CSS-свойства элемента
const element = document.getElementById('menu');
const styles = window.getComputedStyle(element);
console.log(styles.backgroundColor);
console.log(styles.transform);
```

### Измерение производительности рендеринга

```javascript
// В DevTools → Performance → Record
// Или в коде:
performance.mark('render-start');
// ... рендеринг ...
performance.mark('render-end');
performance.measure('render', 'render-start', 'render-end');
console.log(performance.getEntriesByName('render')[0].duration);
```

## Связанные файлы

- [renderer.js](renderer.md) - JavaScript-логика, управляющая элементами UI
- [main.css](#) - дополнительные стили (если есть отдельный файл)
- [Официальная документация CSS](https://developer.mozilla.org/en-US/docs/Web/CSS)
- [Flexbox Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
- [CSS Grid Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)
