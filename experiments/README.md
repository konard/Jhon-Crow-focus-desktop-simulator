# Experiments - Тестовые скрипты и примеры

## Что это за папка?

`experiments/` содержит тестовые скрипты для проверки новых функций и отладки проблем перед добавлением в основное приложение.

**Аналогия:** Это "лаборатория" разработчика - здесь тестируются идеи, прежде чем они попадут в готовый продукт.

## Список файлов

### 1. test-audio-loading.html

**Назначение:** Тестирование загрузки и декодирования аудиофайлов.

**Что проверяет:**
- Поддержка различных форматов аудио
- Скорость декодирования
- Работу Web Audio API
- Таймауты и отмену загрузки

**Как использовать:**
1. Откройте файл в браузере
2. Выберите аудиофайл через input
3. Смотрите результаты в консоли

**Связанные issues:** #66 (зависание при загрузке некоторых файлов)

### 2. test-camera-angles.js

**Назначение:** Тестирование различных углов и позиций камеры для лучшего вида стола.

**Что проверяет:**
- Положение камеры (x, y, z)
- Угол обзора (FOV)
- Точка фокуса (lookAt)

**Как использовать:**
```javascript
node test-camera-angles.js
```

Или подключить в renderer.js для визуального тестирования.

**Примеры позиций:**
```javascript
const cameraPositions = [
  { x: 0, y: 4.5, z: 5.5 },  // Текущая (первое лицо)
  { x: 0, y: 8, z: 8 },      // Изометрический вид
  { x: 5, y: 5, z: 5 },      // Боковой угол
];
```

### 3. test-camera-flip-fix.js

**Назначение:** Исправление проблемы переворота камеры при вращении.

**Проблема:**
При вращении камеры вокруг объекта она могла "перевернуться" вверх ногами.

**Решение:**
Ограничение углов вращения (pitch clamping).

**Код:**
```javascript
// Ограничиваем вертикальный угол
pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, pitch));
```

**Связанные issues:** #26 (Camera bug)

### 4. test-collision-changes.js

**Назначение:** Тестирование изменений в системе коллизий объектов.

**Что проверяет:**
- Обнаружение столкновений между объектами
- Радиусы коллизий для разных типов объектов
- Реалистичность физики

**Примеры тестов:**
```javascript
// Тест 1: Круглые часы не должны иметь stack collision
testNoStackCollision('clock-round');

// Тест 2: У ноутбука множественные точки коллизии
testLaptopCollisions();

// Тест 3: Большой плеер должен удерживать ноутбук
testBigPlayerStacking();
```

**Связанные issues:** #39 (Delete unrealistic collision), #66 (fix player collisions)

### 5. test-panning-fix.js

**Назначение:** Исправление позиционного звука (3D audio panning).

**Проблема:**
Звук не менялся в зависимости от положения объекта на столе.

**Решение:**
Правильный расчёт панорамирования на основе мировых координат объекта.

**Код:**
```javascript
function calculatePan(objectWorldPos, cameraPos, strength) {
  const relativeX = objectWorldPos.x - cameraPos.x;
  // -1 (левый динамик) до 1 (правый динамик)
  return Math.max(-1, Math.min(1, relativeX * strength * 0.5));
}
```

**Связанные issues:** #45 (добавь позиционирование звука)

### 6. test-panning-math.js

**Назначение:** Математические тесты для расчётов панорамирования.

**Что проверяет:**
- Корректность формул расчёта панорамирования
- Граничные случаи (объект очень далеко слева/справа)
- Влияние силы панорамирования (strength parameter)

**Примеры тестов:**
```javascript
// Объект в центре → pan = 0
assert(calculatePan({x: 0}, {x: 0}, 1.0) === 0);

// Объект слева → pan < 0
assert(calculatePan({x: -5}, {x: 0}, 1.0) < 0);

// Объект справа → pan > 0
assert(calculatePan({x: 5}, {x: 0}, 1.0) > 0);
```

### 7. test-recursive-folder-scan.js

**Назначение:** Тестирование рекурсивного сканирования папок для поиска аудиофайлов.

**Что проверяет:**
- Поиск файлов в подпапках
- Фильтрация по расширениям
- Корректность путей
- Производительность на больших папках

**Примеры:**
```javascript
// Структура папки:
// Music/
//   ├── Album1/
//   │   ├── track1.mp3
//   │   └── track2.mp3
//   └── Album2/
//       └── track3.flac

const files = findAudioFilesRecursively('Music/');
console.log(files);
// [
//   { name: 'Album1/track1', path: 'Music/Album1/track1.mp3' },
//   { name: 'Album1/track2', path: 'Music/Album1/track2.mp3' },
//   { name: 'Album2/track3', path: 'Music/Album2/track3.flac' }
// ]
```

**Связанные issues:** #20 (Add music player)

### 8. test-stacking-physics.js

**Назначение:** Тестирование физики складывания объектов друг на друга.

**Что проверяет:**
- Стабильность стопок объектов
- Влияние массы и трения
- Перетаскивание объектов вместе (если один лежит на другом)
- Опрокидывание объектов

**Тестовые сценарии:**
```javascript
// 1. Положить лёгкий объект на тяжёлый
// Ожидание: Лёгкий остаётся на месте

// 2. Положить тяжёлый объект на лёгкий
// Ожидание: Лёгкий может сдвинуться

// 3. Потянуть нижний объект
// Ожидание: Верхний объект движется вместе (из-за трения)

// 4. Резко сдвинуть нижний объект
// Ожидание: Верхний объект может упасть
```

**Связанные issues:** #30 (Добавить возможность класть объекты друг поверх друга)

### 9. thickness-comparison.js

**Назначение:** Сравнение толщины объектов для правильного отображения.

**Что проверяет:**
- Соотношение размеров объектов
- Реалистичность толщины книг, журналов, ноутбуков
- Визуальную согласованность

**Примеры:**
```javascript
const objectThickness = {
  'notebook': 0.02,    // Тонкий блокнот
  'book': 0.05,        // Книга
  'thick-book': 0.08,  // Толстая книга
  'magazine': 0.01,    // Журнал
  'laptop-closed': 0.02 // Закрытый ноутбук
};
```

**Связанные issues:** #33 (fix magazine), #27 (Add magazine)

### 10. verify-fix.js

**Назначение:** Общий скрипт проверки исправлений.

**Что делает:**
- Запускает все тесты из других файлов
- Проверяет, не сломалось ли что-то после изменений
- Генерирует отчёт

**Как использовать:**
```bash
node verify-fix.js
```

**Вывод:**
```
Running tests...
✓ Audio loading test passed
✓ Camera flip fix verified
✓ Collision system working
✓ Panning calculations correct
✓ Recursive folder scan working
✓ Stacking physics stable

All tests passed! ✓
```

## Как создать новый тестовый скрипт

### 1. Создайте файл

```bash
touch experiments/test-my-feature.js
```

### 2. Добавьте базовую структуру

```javascript
/**
 * Test: My New Feature
 * Purpose: Test description
 * Related issues: #XX
 */

console.log('=== Testing My Feature ===\n');

// Тестовые данные
const testData = { /* ... */ };

// Функция для тестирования
function testMyFeature(input) {
  try {
    // Ваш код
    const result = myFunction(input);

    // Проверка результата
    if (result === expected) {
      console.log('✓ Test passed');
      return true;
    } else {
      console.log('✗ Test failed:', result, 'expected:', expected);
      return false;
    }
  } catch (error) {
    console.error('✗ Error:', error.message);
    return false;
  }
}

// Запуск тестов
const tests = [
  testMyFeature(testData1),
  testMyFeature(testData2),
  testMyFeature(testData3)
];

const passed = tests.filter(t => t).length;
console.log(`\n${passed}/${tests.length} tests passed`);
```

### 3. Запустите тест

```bash
node experiments/test-my-feature.js
```

## Интеграция с основным приложением

После успешного тестирования перенесите код в основное приложение:

### 1. Скопируйте рабочий код

Из `experiments/test-my-feature.js` в соответствующее место в `src/`:

```javascript
// Было в experiments/test-my-feature.js
function myNewFunction() {
  // код
}

// Стало в src/renderer.js
function myNewFunction() {
  // тот же код
}
```

### 2. Удалите тестовый код

```javascript
// Уберите console.log для отладки
// Уберите тестовые данные
```

### 3. Сохраните тестовый скрипт

Не удаляйте файл из experiments/ - он может пригодиться для регрессионного тестирования.

## Лучшие практики

### 1. Документируйте назначение

В начале файла:

```javascript
/**
 * Test: [Название]
 * Purpose: [Что тестируется]
 * Related issues: #XX, #YY
 * Date: 2024-01-01
 */
```

### 2. Используйте говорящие имена

```javascript
// ПЛОХО
function test1() { }

// ХОРОШО
function testCollisionBetweenLaptopAndPlayer() { }
```

### 3. Проверяйте граничные случаи

```javascript
// Проверьте не только нормальные случаи
testMyFunction(normalValue);

// Но и граничные
testMyFunction(null);
testMyFunction(undefined);
testMyFunction(0);
testMyFunction(Infinity);
testMyFunction('');
```

### 4. Изолируйте тесты

Каждый тест должен быть независимым:

```javascript
// ПЛОХО - тесты зависят друг от друга
let globalState = 0;
function test1() { globalState++; }
function test2() { console.log(globalState); } // Зависит от test1

// ХОРОШО - каждый тест независим
function test1() {
  const localState = 0;
  // тест
}
function test2() {
  const localState = 0;
  // тест
}
```

## Полезные утилиты для тестирования

### Простой assert

```javascript
function assert(condition, message) {
  if (!condition) {
    throw new Error('Assertion failed: ' + (message || ''));
  }
}

// Использование
assert(1 + 1 === 2, '1 + 1 should equal 2');
```

### Сравнение объектов

```javascript
function assertEqual(actual, expected) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);

  if (actualStr !== expectedStr) {
    console.error('✗ Expected:', expectedStr);
    console.error('  Actual:', actualStr);
    return false;
  }
  console.log('✓ Test passed');
  return true;
}
```

### Измерение производительности

```javascript
function benchmark(fn, iterations = 1000) {
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    fn();
  }

  const end = performance.now();
  const avg = (end - start) / iterations;

  console.log(`Average time: ${avg.toFixed(3)}ms`);
}

// Использование
benchmark(() => {
  findAudioFilesRecursively('./test-folder');
}, 100);
```

## Связанные файлы и ресурсы

- [src/renderer.js](../src/renderer.md) - основной код приложения
- [src/main.js](../src/main.md) - главный процесс
- [Все закрытые issues](https://github.com/Jhon-Crow/focus-desktop-simulator/issues?q=is%3Aissue+is%3Aclosed) - источник идей для тестов
