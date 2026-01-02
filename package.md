# package.json - Документация конфигурации проекта

## Что это за файл?

`package.json` - это "паспорт" Node.js/Electron проекта. Он содержит:
- Информацию о проекте (название, версия, описание)
- Список зависимостей (библиотек, которые нужны приложению)
- Скрипты для запуска и сборки приложения
- Настройки сборки установочного файла

**Формат:** JSON (JavaScript Object Notation) - текстовый формат для хранения данных.

## Структура файла

### 1. Основная информация (строки 2-11)

```json
{
  "name": "focus-desktop-simulator",
  "version": "1.0.0",
  "description": "A high-performance desktop simulator...",
  "main": "src/main.js",
  "scripts": { ... },
  "keywords": [...],
  "author": "Jhon-Crow",
  "license": "Unlicense"
}
```

**Поля:**

- **name**: Имя пакета (используется npm). Должно быть lowercase, без пробелов
- **version**: Версия проекта в формате [SemVer](https://semver.org/) (MAJOR.MINOR.PATCH)
  - MAJOR (1) - несовместимые изменения API
  - MINOR (0) - новые функции (совместимые)
  - PATCH (0) - исправления багов
- **description**: Краткое описание проекта
- **main**: Точка входа приложения (первый файл, который запускается)
- **author**: Автор проекта
- **license**: [Unlicense](https://unlicense.org/) - public domain (свободное использование)

### 2. Скрипты (строки 6-10)

```json
"scripts": {
  "start": "electron .",
  "dev": "electron . --dev",
  "build": "electron-builder --win --publish never",
  "build:dir": "electron-builder --win --dir"
}
```

**Как использовать:**
```bash
npm start        # Запустить приложение
npm run dev      # Запустить с DevTools
npm run build    # Собрать установщик (.exe)
npm run build:dir # Собрать только папку (без установщика)
```

**Объяснение:**

#### `start`: Запуск приложения

```bash
electron .
```

- `electron` - запускает Electron
- `.` - текущая папка (electron ищет package.json и читает поле `main`)

#### `dev`: Запуск с DevTools

```bash
electron . --dev
```

- `--dev` - флаг для разработки
- В `src/main.js` есть проверка: `if (process.argv.includes('--dev'))`
- Открывает DevTools автоматически

#### `build`: Сборка установщика

```bash
electron-builder --win --publish never
```

- `--win` - собрать для Windows
- `--publish never` - не публиковать автоматически (на GitHub Releases и т.п.)

#### `build:dir`: Сборка без установщика

```bash
electron-builder --win --dir
```

- `--dir` - создать только распакованную папку (быстрее, для тестирования)
- Результат: `dist/win-unpacked/`

### 3. Зависимости (dependencies, строки 26-28)

```json
"dependencies": {
  "three": "^0.160.0"
}
```

**Что это:**
Библиотеки, которые нужны приложению для работы. Включаются в финальную сборку.

**Установка:**
```bash
npm install
```

**Символ `^` (карет):**
- `^0.160.0` означает "0.160.0 или новее, но не 1.0.0"
- Разрешает обновления MINOR и PATCH, но не MAJOR
- Примеры: `0.160.1` ✅, `0.161.0` ✅, `1.0.0` ❌

### 4. Зависимости для разработки (devDependencies, строки 22-25)

```json
"devDependencies": {
  "electron": "^28.0.0",
  "electron-builder": "^24.9.1"
}
```

**Что это:**
Библиотеки, нужные только для разработки и сборки. Не включаются в финальную сборку.

**Зачем:**
- `electron` - фреймворк для создания десктопных приложений
- `electron-builder` - инструмент для сборки установочных файлов

**ВАЖНО:** В production Electron встраивается в приложение, поэтому пользователю не нужно его устанавливать.

### 5. Настройки сборки (build, строки 29-68)

#### Основные настройки (строки 30-40)

```json
"build": {
  "appId": "com.jhoncrow.focus-desktop-simulator",
  "productName": "Focus Desktop Simulator",
  "icon": "assets/icon.png",
  "directories": {
    "output": "dist"
  },
  "files": [
    "src/**/*",
    "assets/**/*",
    "package.json"
  ]
}
```

**Поля:**

- **appId**: Уникальный идентификатор приложения (обратный DNS)
  - Формат: `com.автор.название-приложения`
  - Используется Windows для регистрации приложения
- **productName**: Имя приложения, показываемое пользователю
- **icon**: Путь к иконке (.png, .ico, .icns)
- **directories.output**: Папка для готовой сборки
- **files**: Какие файлы включить в сборку
  - `src/**/*` - все файлы в папке src (рекурсивно)
  - `assets/**/*` - все ресурсы
  - `package.json` - файл конфигурации

**Паттерн `**/*`:**
- `**` - любая вложенность папок
- `*` - любое имя файла
- `src/**/*` = все файлы в src и всех подпапках

#### Windows-специфичные настройки (строки 41-53)

```json
"win": {
  "target": [
    {
      "target": "nsis",
      "arch": ["x64"]
    },
    {
      "target": "portable",
      "arch": ["x64"]
    }
  ],
  "icon": "assets/icon.png"
}
```

**Поля:**

- **target**: Типы сборок для создания
  - **nsis**: NSIS-установщик (.exe с мастером установки)
  - **portable**: Portable-версия (запускается без установки)
- **arch**: Архитектуры процессора
  - **x64**: 64-битные процессоры (современные компьютеры)
  - Можно добавить `"ia32"` для 32-битных систем

**Что такое NSIS:**
Nullsoft Scriptable Install System - популярная программа для создания установщиков Windows.

#### NSIS-настройки (строки 60-63)

```json
"nsis": {
  "oneClick": false,
  "allowToChangeInstallationDirectory": true
}
```

**Поля:**

- **oneClick**: `false` - показывать мастер установки (а не "одним кликом")
- **allowToChangeInstallationDirectory**: `true` - разрешить выбрать папку установки

**По умолчанию:**
Приложение устанавливается в `C:\Program Files\Focus Desktop Simulator\`

#### Portable-настройки (строки 64-66)

```json
"portable": {
  "artifactName": "${productName}-${version}-portable.${ext}"
}
```

**Поля:**

- **artifactName**: Шаблон имени файла
  - `${productName}` - заменится на "Focus Desktop Simulator"
  - `${version}` - заменится на "1.0.0"
  - `${ext}` - расширение (.exe)
  - Результат: `Focus Desktop Simulator-1.0.0-portable.exe`

## Как внести изменения

### Обновить версию приложения

```json
{
  "version": "1.1.0"
}
```

**Когда увеличивать:**
- **PATCH** (1.0.1): Исправлен баг
- **MINOR** (1.1.0): Добавлена новая функция
- **MAJOR** (2.0.0): Несовместимые изменения

### Добавить новую зависимость

#### Через командную строку (рекомендуется):

```bash
npm install название-библиотеки --save
```

Автоматически добавит в `dependencies`.

#### Вручную:

```json
"dependencies": {
  "three": "^0.160.0",
  "моя-библиотека": "^1.0.0"
}
```

Затем выполните:
```bash
npm install
```

### Добавить зависимость для разработки

```bash
npm install название-библиотеки --save-dev
```

Или вручную в `devDependencies`.

### Изменить название приложения

```json
{
  "name": "my-app",
  "productName": "My Awesome App"
}
```

**ВАЖНО:**
- `name` используется npm (lowercase, без пробелов)
- `productName` показывается пользователю (можно с пробелами и заглавными)

### Собрать для Linux

Добавьте скрипт:

```json
"scripts": {
  "build:linux": "electron-builder --linux --publish never"
}
```

И настройки:

```json
"build": {
  "linux": {
    "target": ["AppImage", "deb"],
    "icon": "assets/icon.png"
  }
}
```

Форматы:
- **AppImage**: Универсальный формат (работает везде)
- **deb**: Для Debian/Ubuntu
- **rpm**: Для RedHat/Fedora
- **snap**: Для Ubuntu Snap Store

### Собрать для macOS

```json
"scripts": {
  "build:mac": "electron-builder --mac --publish never"
}
```

```json
"build": {
  "mac": {
    "target": ["dmg", "zip"],
    "icon": "assets/icon.icns"
  }
}
```

**ВАЖНО:**
- Для macOS нужна иконка в формате `.icns`
- Подпись приложения требует Apple Developer Account

## Ключевые слова (keywords, строки 12-19)

```json
"keywords": [
  "focus",
  "productivity",
  "desktop",
  "simulator",
  "3d",
  "isometric"
]
```

**Зачем:**
Если опубликовать проект на npm, по этим словам его можно будет найти через поиск.

## Управление версиями зависимостей

### package-lock.json

При первой установке создаётся `package-lock.json` с точными версиями всех зависимостей.

**Зачем:**
Гарантирует, что у всех разработчиков будут одинаковые версии библиотек.

**ВАЖНО:** Добавляйте `package-lock.json` в git!

### Обновление зависимостей

Проверить устаревшие пакеты:

```bash
npm outdated
```

Обновить все в пределах, разрешённых package.json:

```bash
npm update
```

Обновить конкретный пакет до последней версии:

```bash
npm install three@latest --save
```

## Публикация обновлений

### GitHub Releases + Auto-Update

Настройте автоматические обновления:

```json
"build": {
  "publish": {
    "provider": "github",
    "owner": "Jhon-Crow",
    "repo": "focus-desktop-simulator"
  }
}
```

```bash
# Собрать и опубликовать
npm run build -- --publish always
```

Electron Builder автоматически:
1. Соберёт установщики
2. Создаст GitHub Release
3. Загрузит файлы

В приложении добавьте проверку обновлений:

```javascript
const { autoUpdater } = require('electron-updater');

autoUpdater.checkForUpdatesAndNotify();
```

## Отладка сборки

### Просмотр конфигурации

```bash
npx electron-builder --help
```

### Детальный вывод

```bash
DEBUG=electron-builder npm run build
```

### Проверка размера сборки

```bash
npm run build:dir
du -sh dist/win-unpacked/
```

### Анализ зависимостей

```bash
npm install -g depcheck
depcheck
```

Показывает:
- Неиспользуемые зависимости
- Отсутствующие зависимости

## Распространённые проблемы

### 1. "Cannot find module"

**Проблема:** Библиотека не установлена.

**Решение:**
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

### 2. Большой размер сборки

**Проблема:** Установщик слишком большой.

**Решение:**

Исключите ненужные файлы:

```json
"build": {
  "files": [
    "src/**/*",
    "assets/**/*",
    "!**/*.md",
    "!experiments/**/*"
  ]
}
```

`!` означает исключение.

### 3. Иконка не применяется

**Проблема:** В приложении стандартная иконка Electron.

**Решение:**

1. Убедитесь, что иконка существует
2. Для Windows нужен `.ico` (256x256px)
3. Конвертировать PNG → ICO:

```bash
npm install -g pngtoico
pngtoico assets/icon.png assets/icon.ico
```

4. Обновите package.json:

```json
"build": {
  "win": {
    "icon": "assets/icon.ico"
  }
}
```

## Полезные команды

### Установка зависимостей

```bash
npm install          # Установить всё из package.json
npm ci               # Чистая установка (удаляет node_modules)
```

### Запуск скриптов

```bash
npm start            # Запустить приложение
npm run dev          # Запустить с DevTools
npm test             # Запустить тесты (если настроены)
```

### Информация о пакете

```bash
npm list             # Дерево зависимостей
npm list --depth=0   # Только прямые зависимости
npm view three       # Информация о пакете three
```

### Удаление зависимости

```bash
npm uninstall название-пакета --save
```

## Связанные файлы

- [main.js](src/main.md) - точка входа приложения (указана в поле `main`)
- [electron-builder.yml](#) - дополнительная конфигурация сборки (опционально)
- [Официальная документация npm](https://docs.npmjs.com/cli/v9/configuring-npm/package-json)
- [Документация electron-builder](https://www.electron.build/)
- [SemVer - правила версионирования](https://semver.org/)
