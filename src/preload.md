# preload.js - Документация безопасного моста IPC

## Что это за файл?

`preload.js` - это "мост" между главным процессом Electron (main.js) и веб-страницей (renderer.js).

**Простыми словами:** Веб-страница не может напрямую обращаться к файлам на компьютере из соображений безопасности. Этот файл создаёт безопасный "API" (набор команд), которые страница может использовать.

**Аналогия:** Представьте библиотеку. Вы не можете сами зайти в хранилище книг (это небезопасно). Вместо этого есть библиотекарь (preload.js), которому вы говорите "мне нужна книга X", и он безопасно передаёт вам её.

## Структура файла

### 1. Подключение модулей (строка 1)

```javascript
const { contextBridge, ipcRenderer } = require('electron');
```

**Что это:**
- `contextBridge` - инструмент для безопасной передачи функций в веб-страницу
- `ipcRenderer` - инструмент для отправки команд главному процессу

### 2. Создание API для веб-страницы (строки 3-29)

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  // Функции здесь
});
```

**Что это значит:**
Создаётся глобальный объект `window.electronAPI` на веб-странице, который содержит все разрешённые функции.

**КРИТИЧЕСКИ ВАЖНО:**
- Использование `contextBridge` - единственный безопасный способ передачи функций!
- Без `contextBridge` злоумышленник мог бы получить доступ ко всем функциям Node.js через веб-страницу!

## Доступные функции API

### Работа с состоянием стола

#### `saveState(state)` (строка 4)

**Что делает:**
Сохраняет текущее расположение объектов на столе.

**Параметры:**
- `state` - объект JavaScript с информацией о всех объектах (позиции, цвета, настройки)

**Как использовать из renderer.js:**
```javascript
await window.electronAPI.saveState({
  objects: [ /* массив объектов */ ],
  camera: { /* настройки камеры */ }
});
```

#### `loadState()` (строка 5)

**Что делает:**
Загружает сохранённое расположение объектов.

**Возвращает:**
```javascript
{
  success: true,  // успешно ли выполнено
  state: { /* данные стола */ } или null
}
```

### Работа с большими данными

#### `saveObjectData(objectId, dataType, dataUrl)` (строка 7)

**Что делает:**
Сохраняет большие данные объекта отдельно (PDF файлы, обложки музыки, изображения).

**Параметры:**
- `objectId` - уникальный номер объекта (например, "desk-obj-42")
- `dataType` - тип данных ("pdf", "cover-image", "texture")
- `dataUrl` - данные в формате data URL (base64)

**Зачем это нужно:**
Если бы PDF и изображения сохранялись вместе с позициями объектов, сохранение занимало бы много времени при каждом перемещении!

**Пример data URL:**
```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA...
```

#### `loadObjectData(objectId, dataType)` (строка 8)

**Что делает:**
Загружает сохранённые большие данные объекта.

**Возвращает:**
```javascript
{
  success: true,
  data: "data:image/png;base64,..." или null
}
```

### Работа с FFmpeg

#### `getFfmpegStatus()` (строка 10)

**Что делает:**
Проверяет, установлена ли программа FFmpeg на компьютере.

**Возвращает:**
```javascript
{ available: true } // или false
```

**Зачем нужно:**
FFmpeg используется для конвертации аудио. Приложение может работать без него, но с ограниченной функциональностью.

#### `onFfmpegStatus(callback)` (строка 12)

**Что делает:**
Подписывается на обновления статуса FFmpeg.

**Как использовать:**
```javascript
window.electronAPI.onFfmpegStatus((available) => {
  if (available) {
    console.log('FFmpeg установлен!');
  } else {
    console.log('FFmpeg не найден');
  }
});
```

**Зачем нужно:**
FFmpeg может быть установлен автоматически после запуска приложения - эта функция уведомит об этом.

#### `transcodeAudio(audioDataBase64, fileName)` (строка 14)

**Что делает:**
Конвертирует аудиофайл в формат WAV через FFmpeg.

**Параметры:**
- `audioDataBase64` - аудио в формате base64
- `fileName` - имя файла (используется для определения формата)

**Возвращает:**
```javascript
{
  success: true,
  wavDataBase64: "..." // сконвертированный аудио в WAV
}
// или
{
  success: false,
  error: "текст ошибки",
  ffmpegMissing: true // если FFmpeg не установлен
}
```

### Музыкальный плеер

#### `selectMusicFolder()` (строка 16)

**Что делает:**
Открывает диалог выбора папки с музыкой и сканирует её на наличие аудиофайлов.

**Возвращает:**
```javascript
{
  success: true,
  folderPath: "C:\\Музыка",
  audioFiles: [
    { name: "Song 1", fullName: "Song 1.mp3", path: "C:\\Музыка\\Song 1.mp3" },
    { name: "Song 2", fullName: "Song 2.mp3", path: "C:\\Музыка\\Song 2.mp3" }
  ]
}
// или если пользователь отменил выбор:
{
  success: true,
  canceled: true
}
```

#### `readAudioFile(filePath)` (строка 17)

**Что делает:**
Читает аудиофайл с диска и возвращает его как data URL.

**Параметры:**
- `filePath` - полный путь к файлу (например, `"C:\\Музыка\\song.mp3"`)

**Возвращает:**
```javascript
{
  success: true,
  dataUrl: "data:audio/mpeg;base64,...",
  fileName: "song.mp3"
}
```

**КРИТИЧЕСКИ ВАЖНО:** При смене папки с музыкой должен начинаться первый файл (issue #66)!

#### `refreshMusicFolder(folderPath)` (строка 18)

**Что делает:**
Повторно сканирует папку с музыкой (если добавились новые файлы).

**Параметры:**
- `folderPath` - путь к папке с музыкой

### Диктофон

#### `selectRecordingsFolder(format)` (строка 20)

**Что делает:**
Открывает диалог выбора папки для сохранения записей.

**Параметры:**
- `format` - желаемый формат ('wav', 'mp3', 'webm')

**Возвращает:**
```javascript
{
  success: true,
  folderPath: "C:\\Записи",
  nextRecordingNumber: 5 // следующий номер записи
}
```

**Примечание:** Нумерация записей автоматическая: "Запись 1.wav", "Запись 2.wav" и т.д.

#### `saveRecording(folderPath, recordingNumber, audioDataBase64, format, dataFormat)` (строка 23)

**Что делает:**
Сохраняет аудиозапись с микрофона в файл.

**Параметры:**
- `folderPath` - папка для сохранения
- `recordingNumber` - номер записи (1, 2, 3...)
- `audioDataBase64` - аудио в base64
- `format` - желаемый формат вывода ('wav', 'mp3', 'webm')
- `dataFormat` - формат входных данных ('webm' или 'wav')

**Возвращает:**
```javascript
{
  success: true,
  filePath: "C:\\Записи\\Запись 5.wav",
  fileName: "Запись 5.wav",
  actualFormat: "wav" // фактический формат (может отличаться если нет FFmpeg)
}
```

**КРИТИЧЕСКИ ВАЖНО:**
- Функция всегда сохранит запись, даже если FFmpeg не установлен!
- Если FFmpeg нет - сохранит в формате WebM вместо WAV/MP3
- Это предотвращает потерю записи!

#### `getNextRecordingNumber(folderPath)` (строка 24)

**Что делает:**
Определяет номер следующей записи в папке.

**Параметры:**
- `folderPath` - папка с записями

**Возвращает:**
```javascript
{
  success: true,
  nextNumber: 6
}
```

### Редактор заметок (Markdown)

#### `getDefaultNotesFolder()` (строка 26)

**Что делает:**
Возвращает путь к папке для заметок по умолчанию и создаёт её, если не существует.

**Возвращает:**
```javascript
{
  success: true,
  folderPath: "C:\\Users\\ИМЯ\\AppData\\Roaming\\Focus Desktop Simulator\\notes"
}
```

#### `selectNotesFolder()` (строка 27)

**Что делает:**
Открывает диалог выбора пользовательской папки для заметок.

**Возвращает:**
```javascript
{
  success: true,
  folderPath: "C:\\Мои документы\\Заметки"
}
```

#### `saveMarkdownFile(folderPath, fileName, content)` (строка 28)

**Что делает:**
Сохраняет текст заметки в .md файл.

**Параметры:**
- `folderPath` - папка для сохранения
- `fileName` - имя файла (расширение .md добавится автоматически)
- `content` - текст заметки в формате Markdown

**Возвращает:**
```javascript
{
  success: true,
  filePath: "C:\\Заметки\\моя_заметка.md"
}
```

**Безопасность:** Расширение .md добавляется автоматически, если его нет!

## Принципы безопасности

### 1. Валидация входных данных

**ВАЖНО:** Всегда проверяйте данные, которые приходят от веб-страницы!

**Плохо (небезопасно):**
```javascript
// НЕ ДЕЛАЙТЕ ТАК!
saveFile: (path, data) => ipcRenderer.invoke('save-file', path, data)
// Злоумышленник может передать путь "../../../system32/important.dll"
```

**Хорошо (безопасно):**
```javascript
// Проверка в main.js
ipcMain.handle('save-file', async (event, path, data) => {
  // Проверяем, что путь находится в разрешённой папке
  const userDataPath = app.getPath('userData');
  const fullPath = path.join(userDataPath, path);

  if (!fullPath.startsWith(userDataPath)) {
    return { success: false, error: 'Invalid path' };
  }

  // Безопасно сохраняем
});
```

### 2. Только необходимые функции

**КРИТИЧЕСКИ ВАЖНО:** Не предоставляйте больше функций, чем необходимо!

**Плохо:**
```javascript
// НЕ ДЕЛАЙТЕ ТАК!
executeCommand: (cmd) => ipcRenderer.invoke('exec', cmd)
// Злоумышленник может выполнить любую команду!
```

**Хорошо:**
```javascript
// Конкретные, ограниченные функции
selectMusicFolder: () => ipcRenderer.invoke('select-music-folder')
```

### 3. Проверка типов данных

```javascript
// В main.js всегда проверяйте типы
ipcMain.handle('save-state', async (event, state) => {
  // Проверка
  if (typeof state !== 'object' || state === null) {
    return { success: false, error: 'Invalid state object' };
  }

  // Обработка
});
```

## Как добавить новую функцию

### Шаг 1: Добавить в preload.js

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  // ... существующие функции ...

  моя_новая_функция: (параметр1, параметр2) =>
    ipcRenderer.invoke('имя-команды', параметр1, параметр2)
});
```

### Шаг 2: Создать handler в main.js

```javascript
ipcMain.handle('имя-команды', async (event, параметр1, параметр2) => {
  try {
    // Валидация параметров
    if (!параметр1 || typeof параметр2 !== 'number') {
      return { success: false, error: 'Invalid parameters' };
    }

    // Ваша логика
    const result = /* обработка */;

    return { success: true, data: result };
  } catch (error) {
    console.error('Error in имя-команды:', error);
    return { success: false, error: error.message };
  }
});
```

### Шаг 3: Использовать из renderer.js

```javascript
async function myFunction() {
  const result = await window.electronAPI.моя_новая_функция('значение', 42);

  if (result.success) {
    console.log('Успех!', result.data);
  } else {
    console.error('Ошибка:', result.error);
  }
}
```

## Распространённые ошибки

### 1. Забыли await

```javascript
// ПЛОХО - результат будет Promise, а не данные!
const result = window.electronAPI.loadState();

// ХОРОШО
const result = await window.electronAPI.loadState();
```

### 2. Не проверили success

```javascript
// ПЛОХО - может упасть при ошибке!
const data = result.data;

// ХОРОШО
if (result.success) {
  const data = result.data;
} else {
  console.error('Ошибка:', result.error);
}
```

### 3. Передача функций через IPC

```javascript
// ПЛОХО - функции нельзя передавать через IPC!
window.electronAPI.saveState({
  callback: () => console.log('done')
});

// ХОРОШО - только данные
window.electronAPI.saveState({
  objects: [...]
});
```

## Связанные файлы

- [main.js](main.md) - содержит IPC handlers (обработчики команд)
- [renderer.js](renderer.md) - использует electronAPI для работы с файлами
- [Официальная документация Electron Context Bridge](https://www.electronjs.org/docs/latest/api/context-bridge)

## Отладка

### Просмотр доступных функций

В DevTools (F12) выполните:
```javascript
console.log(window.electronAPI);
```

### Тестирование функции

```javascript
// В консоли DevTools
const result = await window.electronAPI.getFfmpegStatus();
console.log(result);
```

### Логирование в main.js

Логи из main.js видны в терминале, а не в DevTools!

```javascript
// В main.js
console.log('Этот текст появится в терминале');

// В renderer.js
console.log('Этот текст появится в DevTools');
```
