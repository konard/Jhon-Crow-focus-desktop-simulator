# renderer.js - Документация 3D-рендеринга и взаимодействия

## Что это за файл?

`renderer.js` - это "мозг" визуальной части приложения. Он отвечает за:
- 3D-графику (рендеринг стола и объектов через Three.js)
- Взаимодействие с мышью и клавиатурой
- Анимацию объектов
- Физику (гравитация, коллизии, складывание объектов)
- Все интерактивные функции (плееры, часы, ноутбук, редактор заметок и т.д.)

**Размер:** 19,622 строк кода
**Важно:** Этот файл работает в веб-странице (рендерер-процесс), не имеет прямого доступа к файлам.

## Структура файла

### 1. Обработка ошибок (строки 8-14)

```javascript
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error || event.message);
});
```

**Зачем это нужно:**
Перехватывает все необработанные ошибки для отладки.

### 2. Конфигурация (CONFIG, строки 19-58)

```javascript
const CONFIG = {
  camera: {
    fov: 75,  // Field of View - угол обзора камеры
    position: { x: 0, y: 4.5, z: 5.5 },  // Позиция камеры
    lookAt: { x: 0, y: 0, z: -1.5 }  // Куда смотрит камера
  },
  desk: {
    width: 10,
    depth: 7,
    height: 0.1,
    color: 0x8b6914  // Цвет стола в HEX
  },
  physics: {
    liftHeight: 0.5,  // На какую высоту поднимаются объекты при перетаскивании
    liftSpeed: 0.15,  // Скорость поднятия
    dropSpeed: 0.2,   // Скорость опускания
    gravity: 0.02     // Гравитация
  }
};
```

**Как изменить:**
- Увеличьте `fov` для более широкого обзора
- Измените `camera.position.y` для изменения высоты взгляда
- Увеличьте `liftHeight` для более выраженного поднятия объектов

### 3. Глобальное состояние (строки 62-76)

```javascript
let scene, camera, renderer;  // Основные объекты Three.js
let deskObjects = [];  // Массив всех объектов на столе
let selectedObject = null;  // Выбранный объект
let isDragging = false;  // Идёт ли перетаскивание
let raycaster;  // Для определения клика по 3D-объектам
let mouse;  // Координаты мыши
```

**Что такое Raycaster:**
Представьте луч света от камеры через курсор мыши. Raycaster находит все объекты, которые пересекает этот луч.

### 4. Основные системы

#### 4.1. Загрузка аудио (строки 126-614)

**Критически важные функции:**

##### `preValidateAudioFile(file)` (строки 162-214)

**Что делает:**
Быстро проверяет, может ли браузер воспроизвести аудиофайл.

**Почему это важно:**
Некоторые файлы могут "повесить" браузер при загрузке (см. issue #66). Эта функция предотвращает зависания.

**Таймаут:** 3 секунды - если файл не загружается за это время, он считается проблемным.

##### `decodeAudioBuffer(arrayBuffer, fileName)` (строки 224-340)

**Что делает:**
Декодирует аудио для воспроизведения через Web Audio API.

**КРИТИЧЕСКИ ВАЖНО:**
- Использует таймаут 5 секунд
- Можно отменить через кнопку "Cancel"
- Не поддерживает форматы: WMA, WV, APE, RA, MIDI, AMR

**Неподдерживаемые форматы:**
```javascript
const UNSUPPORTED_AUDIO_FORMATS = ['wma', 'wv', 'ape', 'ra', 'ram', 'mid', 'midi', 'amr', 'mka'];
```

**Как работает таймаут:**
```javascript
const DECODE_TIMEOUT_MS = 5000;
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => {
    reject(new Error('Audio decoding timed out'));
  }, DECODE_TIMEOUT_MS);
});
return Promise.race([decodePromise, timeoutPromise]);
```

**Примечание:** `Promise.race()` возвращает результат первого завершившегося промиса.

##### `transcodeToWav(inputBuffer, fileName, maxDuration)` (строки 471-503)

**Что делает:**
Конвертирует аудио в стандартный WAV формат для совместимости.

**Параметры:**
- `maxDuration: 10` - обрезает до 10 секунд (для экономии памяти)

#### 4.2. Система автоматизации (FL Studio-style, строки 751-1500)

**Класс `AutomationCurveEditor`**

**Что это:**
Редактор кривых изменения параметров во времени (высота тона, темп метронома).

**Примеры использования:**
- Постепенное увеличение темпа метронома с 60 до 120 BPM за 60 секунд
- Изменение высоты тона звуков по синусоиде

**Ключевые методы:**

##### `addPoint(x, y)` (строки 1141-1171)

**Что делает:**
Добавляет контрольную точку на кривую.

**Параметры:**
- `x` - позиция во времени (0-1, где 0 = начало, 1 = конец)
- `y` - значение параметра (например, 100 = 100% высоты тона)

##### `getValueAtProgress(progress)` (строки 1274-1302)

**Что делает:**
Вычисляет значение параметра в определённый момент времени.

**Интерполяция:**
```javascript
interpolate(v1, v2, t, curveType, tension) {
  switch (curveType) {
    case 'linear':  // Прямая линия
      return v1 + (v2 - v1) * t;
    case 'smooth':  // Плавная S-кривая
      const smoothT = this.smoothstep(t, tension);
      return v1 + (v2 - v1) * smoothT;
    case 'sine':    // Синусоида
      const sineT = (1 - Math.cos(t * Math.PI)) / 2;
      return v1 + (v2 - v1) * sineT;
  }
}
```

**Что такое интерполяция:**
Вычисление промежуточных значений между двумя точками. Например, между 60 BPM и 120 BPM в середине будет 90 BPM (при линейной интерполяции).

## Физика и коллизии

### Система складывания объектов (issue #30)

**КРИТИЧЕСКИ ВАЖНО:** Объекты можно класть друг на друга, и они взаимодействуют по физике!

**Ключевые параметры (в userData объекта):**

```javascript
object.userData = {
  mass: 5,  // Масса объекта (влияет на силу трения)
  friction: 0.8,  // Коэффициент трения (0-1)
  stackable: true,  // Можно ли складывать другие объекты сверху
  collisionRadius: 0.5  // Радиус коллизии для стека
};
```

**Проблема из issue #39:**
У некоторых объектов не должно быть коллизии стека:
- Круглые часы (clock-round)
- Фоторамка (photo-frame)
- Глобус (globe)

**Решение:**
```javascript
if (type === 'clock-round' || type === 'photo-frame') {
  object.userData.stackable = false;
  object.userData.stackCollision = false;
}
```

**Коллизии ноутбука (issue #66):**
У ноутбука должны быть несколько высоких коллизий по длине монитора:

```javascript
if (type === 'laptop') {
  object.userData.stackCollisionPoints = [
    { x: -0.3, z: -0.2, radius: 0.1, height: 0.4 },
    { x: 0, z: -0.2, radius: 0.1, height: 0.4 },
    { x: 0.3, z: -0.2, radius: 0.1, height: 0.4 }
  ];
}
```

### Физика перетаскивания

**Функция (поиск по коду):**

```javascript
function updateObjectPhysics() {
  deskObjects.forEach(obj => {
    // Если объект не перетаскивается и не лежит на столе
    if (!obj.userData.isDragging && obj.position.y > CONFIG.desk.height) {
      // Применяем гравитацию
      obj.userData.velocity = obj.userData.velocity || 0;
      obj.userData.velocity -= CONFIG.physics.gravity;
      obj.position.y += obj.userData.velocity;

      // Проверяем коллизию со столом
      if (obj.position.y <= CONFIG.desk.height + obj.userData.baseHeight) {
        obj.position.y = CONFIG.desk.height + obj.userData.baseHeight;
        obj.userData.velocity = 0;
      }
    }
  });
}
```

**Что происходит:**
1. Объект не перетаскивается? Проверяем, висит ли он в воздухе
2. Применяем гравитацию (velocity уменьшается)
3. Двигаем объект вниз
4. Если достиг стола - останавливаем

## Интерактивные объекты

### Таймер и будильник

**Состояние таймера (строки 92-109):**

```javascript
let timerState = {
  active: false,  // Таймер активен?
  running: false,  // Таймер запущен?
  remainingSeconds: 0,  // Оставшееся время
  intervalId: null,  // ID интервала для отсчёта
  // Будильник
  alarmEnabled: false,
  alarmHours: 0,
  alarmMinutes: 0,
  // Звуковой сигнал
  alertVolume: 0.5,  // Громкость (0-1)
  alertPitch: 800,  // Частота в Герцах
  customSoundDataUrl: null  // Пользовательский звук
};
```

**Как работает отсчёт:**

```javascript
function startTimer(seconds) {
  timerState.remainingSeconds = seconds;
  timerState.running = true;

  timerState.intervalId = setInterval(() => {
    timerState.remainingSeconds--;

    if (timerState.remainingSeconds <= 0) {
      // Таймер завершён - проигрываем сигнал
      playTimerAlert();
      clearInterval(timerState.intervalId);
      timerState.running = false;
    }

    // Обновляем UI
    updateTimerDisplay();
  }, 1000);  // Каждую секунду
}
```

### Метроном

**Критические параметры:**

```javascript
object.userData = {
  isRunning: false,  // Метроном работает?
  bpm: 120,  // Удары в минуту (Beats Per Minute)
  tickPitch: 100,  // Высота тона тика (100 = normal)
  // Кривые автоматизации
  pitchCurveEnabled: false,
  pitchCurvePoints: [
    { x: 0, y: 100, curveType: 'smooth', tension: 0.5 },
    { x: 1, y: 100, curveType: 'smooth', tension: 0.5 }
  ],
  tempoCurveEnabled: false,
  tempoCurvePoints: [...]
};
```

**Как проигрывается тик:**

```javascript
function playMetronomeTick(bpm, pitch) {
  const audioCtx = getSharedAudioContext();

  // Создаём звук через Web Audio API
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  // Частота звука (в Герцах)
  const baseFrequency = 800;
  oscillator.frequency.value = baseFrequency * (pitch / 100);

  // Форма волны (sine = синусоида, чистый тон)
  oscillator.type = 'sine';

  // Громкость (fade in/out для избежания щелчков)
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.01);
  gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);

  // Подключаем oscillator → gain → speakers
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  // Проигрываем
  oscillator.start(audioCtx.currentTime);
  oscillator.stop(audioCtx.currentTime + 0.1);
}
```

**Что такое Web Audio API:**
Это мощный инструмент для создания и обработки звука в браузере. Работает как виртуальный синтезатор.

**Узлы (Nodes):**
- `OscillatorNode` - генератор звуковых волн
- `GainNode` - регулятор громкости
- `destination` - колонки/наушники

### Кассетный плеер

**КРИТИЧЕСКИ ВАЖНО (issue #66):**
При смене папки с музыкой во время воспроизведения должен начинаться первый файл!

**Состояние плеера:**

```javascript
object.userData = {
  musicFolderPath: null,  // Путь к папке с музыкой
  audioFiles: [],  // Список файлов
  currentTrackIndex: 0,  // Текущий трек
  isPlaying: false,  // Проигрывается?
  currentAudio: null,  // HTML5 Audio элемент
  volume: 0.5,  // Громкость (0-1)
  // Позиционный звук (3D audio)
  usePanning: false,
  panningStrength: 0.5
};
```

**Функция смены папки:**

```javascript
async function changeMusicFolder(player) {
  const result = await window.electronAPI.selectMusicFolder();

  if (result.success && !result.canceled) {
    // ВАЖНО: Останавливаем текущее воспроизведение
    if (player.userData.currentAudio) {
      player.userData.currentAudio.pause();
      player.userData.currentAudio = null;
    }

    // Обновляем данные
    player.userData.musicFolderPath = result.folderPath;
    player.userData.audioFiles = result.audioFiles;
    player.userData.currentTrackIndex = 0;  // Сбрасываем на первый трек

    // Начинаем воспроизведение первого файла
    if (player.userData.autoplay) {
      playTrack(player, 0);
    }

    saveState();  // Сохраняем
  }
}
```

**3D позиционирование звука:**

```javascript
function setupPanningForAudio(audio, player, panningStrength) {
  const audioCtx = getSharedAudioContext();

  // Создаём источник из HTML5 Audio
  const source = audioCtx.createMediaElementSource(audio);

  // Создаём панорамирование
  const panner = audioCtx.createStereoPanner();

  // Вычисляем положение плеера относительно камеры
  const playerWorldPos = new THREE.Vector3();
  player.getWorldPosition(playerWorldPos);

  // Конвертируем в диапазон -1 (левый динамик) to 1 (правый динамик)
  const pan = Math.max(-1, Math.min(1, playerWorldPos.x * panningStrength * 0.5));
  panner.pan.value = pan;

  // Подключаем: source → panner → speakers
  source.connect(panner);
  panner.connect(audioCtx.destination);
}
```

### Диктофон

**Запись с микрофона:**

```javascript
async function startRecording(dictaphone) {
  try {
    // Запрашиваем доступ к микрофону
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,  // Подавление эха
        noiseSuppression: true,  // Шумоподавление
        autoGainControl: true    // Автоматическая регулировка громкости
      }
    });

    // Создаём MediaRecorder для записи
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm'  // Формат записи
    });

    const audioChunks = [];

    // Собираем данные
    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    // Когда запись остановлена
    mediaRecorder.onstop = async () => {
      // Собираем все части в один Blob
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

      // Конвертируем в base64 для отправки в main.js
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64 = reader.result.split(',')[1];

        // Сохраняем через IPC
        const result = await window.electronAPI.saveRecording(
          folderPath, recordingNumber, base64, format, 'webm'
        );
      };
    };

    mediaRecorder.start();
    dictaphone.userData.mediaRecorder = mediaRecorder;
    dictaphone.userData.stream = stream;

  } catch (error) {
    console.error('Не удалось получить доступ к микрофону:', error);
    alert('Доступ к микрофону запрещён. Разрешите доступ в настройках браузера.');
  }
}
```

**КРИТИЧЕСКИ ВАЖНО:**
- Всегда останавливайте stream после записи: `stream.getTracks().forEach(track => track.stop())`
- Иначе микрофон останется занятым!

### Ноутбук

**Виртуальный рабочий стол:**

Ноутбук имеет canvas (512x384px) с симуляцией рабочего стола.

**Иконки:**

```javascript
const desktopIcons = [
  { name: 'Documents', x: 32, y: 32, icon: '📄' },
  { name: 'Photos', x: 32, y: 128, icon: '🖼️' },
  { name: 'Music', x: 32, y: 224, icon: '🎵' },
  { name: 'Settings', x: 32, y: 320, icon: '⚙️' }
];
```

**Рисование иконки:**

```javascript
function drawIcon(ctx, icon, isSelected) {
  const iconSize = 64;

  // Фон иконки (если выбрана)
  if (isSelected) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(icon.x - 4, icon.y - 4, iconSize + 8, iconSize + 24);
  }

  // Эмодзи иконки
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(icon.icon, icon.x + iconSize / 2, icon.y);

  // Текст под иконкой
  ctx.font = '12px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText(icon.name, icon.x + iconSize / 2, icon.y + 52);
}
```

**Обработка кликов:**

```javascript
function handleLaptopClick(laptop, x, y) {
  // Конвертируем координаты клика в координаты canvas
  const canvasX = x * 512;
  const canvasY = y * 384;

  // Проверяем клик по иконкам
  for (const icon of desktopIcons) {
    if (canvasX >= icon.x && canvasX <= icon.x + 64 &&
        canvasY >= icon.y && canvasY <= icon.y + 64) {
      openApplication(icon.name);
      return;
    }
  }

  // Проверяем клик по кнопке "Start"
  if (canvasY >= 384 - 32 && canvasX <= 100) {
    toggleStartMenu();
  }
}
```

## Сохранение состояния

**КРИТИЧЕСКИ ВАЖНО:** Используется debounce для предотвращения частых сохранений!

```javascript
let saveStateDebounceTimer = null;

function saveState() {
  // Если уже идёт сохранение - пропускаем
  if (isSavingState) return;

  // Отменяем предыдущий таймер
  if (saveStateDebounceTimer) {
    clearTimeout(saveStateDebounceTimer);
  }

  // Запускаем новый таймер (сохранение через 500ms)
  saveStateDebounceTimer = setTimeout(async () => {
    isSavingState = true;

    const state = {
      objects: deskObjects.map(obj => ({
        id: obj.userData.id,
        type: obj.userData.type,
        position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
        rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
        scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z },
        userData: obj.userData  // Все пользовательские данные
      }))
    };

    await window.electronAPI.saveState(state);
    isSavingState = false;
  }, 500);  // 500ms задержка
}
```

**Что такое debounce:**
Если функция вызывается много раз подряд, выполняется только последний вызов (через задержку). Это предотвращает сотни сохранений в секунду при перетаскивании!

## Как внести изменения

### Добавить новый тип объекта

1. Создайте функцию создания объекта:

```javascript
function createMyObject() {
  const group = new THREE.Group();

  // Создайте геометрию (форму объекта)
  const geometry = new THREE.BoxGeometry(1, 0.5, 0.8);
  const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const mesh = new THREE.Mesh(geometry, material);

  group.add(mesh);

  // Настройте userData
  group.userData = {
    id: 'desk-obj-' + (objectIdCounter++),
    type: 'my-object',
    baseHeight: 0.25,  // Половина высоты
    mass: 3,
    friction: 0.7,
    stackable: true,
    collisionRadius: 0.5
  };

  return group;
}
```

2. Добавьте в панель пресетов:

```javascript
const presets = [
  // ... существующие пресеты
  { type: 'my-object', label: 'My Object', icon: '🎁', create: createMyObject }
];
```

### Изменить физику

Увеличьте гравитацию для более быстрого падения:

```javascript
const CONFIG = {
  physics: {
    gravity: 0.05  // Было 0.02
  }
};
```

Изменить силу трения между объектами:

```javascript
// В функции расчёта физики стека
const dragForce = topObject.userData.mass * bottomObject.userData.friction * 2.0;
// Увеличьте множитель (2.0) для более сильного трения
```

### Добавить новую кнопку в UI

```javascript
// В HTML (index.html)
<button id="my-button">My Action</button>

// В renderer.js
document.getElementById('my-button').addEventListener('click', () => {
  console.log('Button clicked!');
  // Ваш код
});
```

## Оптимизация и производительность

### 1. Лимит FPS

Three.js рендерит каждый кадр. Для экономии ресурсов можно ограничить FPS:

```javascript
let lastFrameTime = 0;
const targetFPS = 60;
const frameInterval = 1000 / targetFPS;

function animate(currentTime) {
  requestAnimationFrame(animate);

  const deltaTime = currentTime - lastFrameTime;

  if (deltaTime >= frameInterval) {
    lastFrameTime = currentTime;
    render();  // Рендерим только если прошло достаточно времени
  }
}
```

### 2. Object Pooling

Вместо создания/удаления объектов, переиспользуйте:

```javascript
const objectPool = [];

function getPooledObject() {
  if (objectPool.length > 0) {
    return objectPool.pop();
  }
  return createNewObject();
}

function returnToPool(object) {
  object.visible = false;
  objectPool.push(object);
}
```

### 3. Уменьшение коллизий

Не проверяйте коллизии между всеми объектами:

```javascript
// ПЛОХО - O(n²)
for (let i = 0; i < objects.length; i++) {
  for (let j = 0; j < objects.length; j++) {
    checkCollision(objects[i], objects[j]);
  }
}

// ХОРОШО - Spatial hashing
const grid = {};
objects.forEach(obj => {
  const cellKey = getCellKey(obj.position);
  if (!grid[cellKey]) grid[cellKey] = [];
  grid[cellKey].push(obj);
});

// Проверяем коллизии только внутри ячеек
for (const cell of Object.values(grid)) {
  for (let i = 0; i < cell.length; i++) {
    for (let j = i + 1; j < cell.length; j++) {
      checkCollision(cell[i], cell[j]);
    }
  }
}
```

## Отладка

### Визуализация коллизий

```javascript
let debugState = {
  showCollisionRadii: false,
  collisionHelpers: []
};

function toggleCollisionDebug() {
  debugState.showCollisionRadii = !debugState.showCollisionRadii;

  if (debugState.showCollisionRadii) {
    deskObjects.forEach(obj => {
      // Создаём визуальный круг для радиуса коллизии
      const geometry = new THREE.CircleGeometry(obj.userData.collisionRadius, 32);
      const material = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      const helper = new THREE.Mesh(geometry, material);
      helper.rotation.x = -Math.PI / 2;  // Поворачиваем горизонтально
      helper.position.copy(obj.position);
      scene.add(helper);
      debugState.collisionHelpers.push(helper);
    });
  } else {
    // Удаляем визуализацию
    debugState.collisionHelpers.forEach(helper => scene.remove(helper));
    debugState.collisionHelpers = [];
  }
}
```

### Логирование производительности

```javascript
function measurePerformance(label, fn) {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${label}: ${(end - start).toFixed(2)}ms`);
}

// Использование
measurePerformance('Render', () => renderer.render(scene, camera));
```

## Связанные файлы

- [main.js](main.md) - главный процесс, предоставляет IPC функции
- [preload.js](preload.md) - мост для безопасного взаимодействия
- [index.html](index.md) - HTML структура интерфейса
- [Three.js документация](https://threejs.org/docs/)
