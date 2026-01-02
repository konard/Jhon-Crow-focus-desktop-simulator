# Focus Desktop Simulator

A high-performance desktop simulator - a focus tool for Windows with an isometric 3D desk and interactive objects.

![Focus Desktop Simulator](https://img.shields.io/badge/Platform-Windows-blue) ![License](https://img.shields.io/badge/License-Unlicense-green)

## Features

- **Isometric 3D Desk View**: Beautiful rendered desk with realistic lighting and shadows
- **Drag & Drop Objects**: Move objects around your virtual desk - objects lift when dragged and settle when dropped
- **Preset Object Library**: Choose from various desk accessories:
  - Clock (shows real time with animated hands)
  - Desk Lamp (with glowing light effect)
  - Potted Plant
  - Coffee Mug
  - Laptop (with glowing screen)
  - Notebook
  - Pen Holder
  - Books
  - Photo Frame
  - Globe (animated rotation)
  - Trophy
  - Hourglass
- **Object Customization**: Right-click any object to customize:
  - Main color
  - Accent color
  - Delete objects
- **State Persistence**: Your desk layout is automatically saved and restored
- **Real-time Clock Display**: Shows current time in the corner

## Installation

### From Release

1. Download the latest `.exe` installer from the [Releases](https://github.com/Jhon-Crow/focus-desktop-simulator/releases) page
2. Run the installer
3. Launch "Focus Desktop Simulator" from your Start menu

### From Source

```bash
# Clone the repository
git clone https://github.com/Jhon-Crow/focus-desktop-simulator.git
cd focus-desktop-simulator

# Install dependencies
npm install

# Run in development mode
npm start

# Build Windows executable
npm run build
```

## Usage

1. **Add Objects**: Click the menu button (top-left) to open the object preset panel
2. **Move Objects**: Click and drag objects to reposition them on the desk
3. **Customize Objects**: Right-click on any object to open the customization panel
4. **Delete Objects**: Right-click an object and click "Delete Object"

## Tech Stack

- **Electron**: Cross-platform desktop application framework
- **Three.js**: 3D graphics library for WebGL rendering
- **electron-builder**: Packaging and building for Windows

## Development

```bash
# Run with DevTools
npm run dev

# Build directory only (no installer)
npm run build:dir
```

## 📚 Документация / Documentation

Подробная документация для разработчиков и тех, кто хочет разобраться в коде (на русском языке):

Detailed documentation for developers and those who want to understand the code (in Russian):

### Структура проекта / Project Structure

```
focus-desktop-simulator/
├── src/                      # Исходный код / Source code
│   ├── main.js              # Главный процесс Electron / Electron main process
│   ├── renderer.js          # 3D-рендеринг и логика / 3D rendering and logic
│   ├── preload.js           # Безопасный мост IPC / Secure IPC bridge
│   ├── index.html           # HTML-интерфейс / HTML interface
│   └── lib/                 # Библиотеки (Three.js, PDF.js)
├── assets/                   # Ресурсы (иконки, изображения)
├── experiments/              # Тестовые скрипты / Test scripts
├── package.json              # Конфигурация проекта / Project configuration
└── README.md                # Этот файл / This file
```

### Документация по файлам / File Documentation

#### Основные файлы / Core Files

- **[src/main.md](src/main.md)** - Документация главного процесса Electron
  - Создание окна приложения
  - Работа с файловой системой
  - Обработка аудио и FFmpeg
  - Сохранение/загрузка состояния
  - **Критически важные моменты из закрытых issues**

- **[src/renderer.md](src/renderer.md)** - Документация 3D-рендеринга и взаимодействия
  - Three.js и 3D-графика
  - Физика объектов и коллизии
  - Интерактивные объекты (таймер, метроном, плеер)
  - Система автоматизации (FL Studio-style)
  - Оптимизация производительности

- **[src/preload.md](src/preload.md)** - Документация безопасного моста IPC
  - Принципы безопасности
  - API для взаимодействия с главным процессом
  - Как добавить новые функции

- **[src/index.md](src/index.md)** - Документация HTML-структуры
  - CSS-стили и анимации
  - Модальные окна
  - Адаптивность и доступность

#### Конфигурация / Configuration

- **[package.md](package.md)** - Документация конфигурации проекта
  - Управление зависимостями
  - Скрипты сборки
  - Настройки electron-builder
  - Публикация обновлений

#### Тестирование / Testing

- **[experiments/README.md](experiments/README.md)** - Тестовые скрипты
  - Тестирование новых функций
  - Проверка исправлений
  - Примеры использования

### Ключевые концепции / Key Concepts

#### Для начинающих / For Beginners

Если вы впервые видите эти технологии, начните с:

1. **[src/main.md](src/main.md)** - Понимание структуры Electron-приложения
2. **[src/preload.md](src/preload.md)** - Как безопасно общаются части приложения
3. **[package.md](package.md)** - Как установить зависимости и запустить проект

#### Критически важные моменты / Critical Points

**Из закрытых issues / From closed issues:**

- **Коллизии объектов (#39, #30, #66):**
  - У некоторых объектов нет коллизии стека (круглые часы, фоторамка)
  - У ноутбука несколько точек коллизии по длине монитора
  - Большой плеер должен удерживать ноутбук сверху

- **Музыкальный плеер (#66):**
  - При смене папки с музыкой должен начинаться первый файл
  - Текущее воспроизведение должно останавливаться

- **Производительность (#20, #25):**
  - Большие данные (PDF, обложки) сохраняются отдельно
  - Используется debounce для сохранения состояния
  - Предотвращение зависаний при перетаскивании

- **FFmpeg:**
  - Приложение работает без FFmpeg, но с ограничениями
  - Всегда есть fallback (сохранение в WebM)

### Как внести изменения / How to Make Changes

Каждый файл документации содержит раздел "Как внести изменения" с примерами:

Each documentation file contains a "How to Make Changes" section with examples:

- Добавление нового типа объекта / Adding new object type
- Изменение физики / Modifying physics
- Добавление новых функций / Adding new features
- Изменение UI / Modifying UI

### Отладка / Debugging

Инструкции по отладке в каждом файле документации:

Debugging instructions in each documentation file:

- Визуализация коллизий / Collision visualization
- Логирование производительности / Performance logging
- Проверка состояния / State inspection

## Inspiration

Inspired by [gogh: Focus with Your Avatar](https://store.steampowered.com/app/3213850/gogh_Focus_with_Your_Avatar/) - but focusing on just the desk experience without the avatar.

## License

This project is released into the public domain under the [Unlicense](LICENSE).
