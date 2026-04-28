# ARP Fullstack (Node.js + SQLite) — Backend & Admin

## 1) Install
```bash
npm install
```

## 2) Create DB tables & seed rooms
```bash
npm run db:init
```

## 3) Run dev
```bash
npm run dev
```
Backend will be on http://localhost:3000

## 4) Configure .env
Edit `.env` (email, password, secret).

## 5) Admin Panel
Open `admin/login.html` in your browser (via Live Server or simple file open).  
Login with credentials from `.env`.

## API
- `POST /api/auth/login` { email, password } → { token }
- `GET  /api/rooms` → list of rooms
- `GET  /api/rooms/:slug` → single room
- `PUT  /api/rooms/:slug` (auth) → upsert room {title, description, image}
- `POST /api/upload` (auth) → form-data file → { url }
- `GET  /api/content/:key` → { key, value|null }
- `PUT  /api/content/:key` (auth) { value } → upsert

## Hook frontend pages

Example (Room page):
```html
<h1 id="room-title"></h1>
<p id="room-desc"></p>
<img id="room-img"/>

<script>
fetch('/api/rooms/standart')
  .then(r=>r.json())
  .then(room => {
    document.getElementById('room-title').textContent = room.title || 'Standard Room';
    document.getElementById('room-desc').textContent = room.description || '';
    document.getElementById('room-img').src = room.image || 'assets/img/placeholder.jpg';
  });
</script>
```
﻿# ARP Fullstack (Antique Roman Palace)

Полноценный (но максимально простой) fullstack‑проект сайта отеля **Antique Roman Palace**:

- **Публичная часть** — статические страницы в `public/` (HTML/CSS/JS).
- **Админ‑панель** — статический UI в `admin/` для управления контентом/переводами/картинками.
- **Backend** — `Express` API + `SQLite` (файл `server/database.sqlite`) + загрузка изображений в `public/uploads`.

## Стек

- Node.js + Express (`server/index.js`)
- SQLite (`sqlite3`, файл БД `server/database.sqlite`)
- Auth: JWT в HttpOnly cookie `arp_token`
- Безопасность: `helmet`, `express-rate-limit`, CORS allowlist
- Upload: `multer` (в память) + сохранение в `public/uploads`
- i18n: плоские ключи (`hero.greeting`) + JSON в `assets/i18n/*.json` + оверлеи из БД

## Структура проекта

- `public/` — публичный сайт (страницы, include‑шаблоны, `/room/*`)
- `assets/` — общий фронтенд (CSS/JS/иконки/картинки) + `assets/i18n/*.json`
- `admin/` — админка (страницы + `admin/js/*`)
- `server/` — backend (API, middleware, модели, SQLite)
- `deploy/` — production‑конфиги (`nginx.conf`, `arp.service`, `ENV.example`)
- `tools/` — утилиты (например, проверка i18n‑ключей)


## Как устроена админка

Админка работает поверх API и хранит данные в SQLite:

- Логин: `POST /api/auth/login` → выставляет HttpOnly cookie `arp_token`
- Проверка сессии: `GET /api/auth/me`
- Выход: `POST /api/auth/logout`

### Preview изменений

Чтобы увидеть изменения из БД на публичных страницах **без экспортирования JSON**, открывайте страницу с параметрами:

- `?preview&lang=ru`

Примеры:
- `/index.html?preview&lang=ru`
- `/about.html?preview&lang=en`

## Upload изображений

Endpoint (оба пути поддерживаются):
- `POST /upload?slot=<category>` (через `/api` вызывается как `/api/upload?...` из админки)

Тело запроса: `multipart/form-data`, поле файла — `file`.

Результат: `{ ok: true, url: "/uploads/<slot>/<filename>" }`.

Поддерживаются слоты/категории (см. `server/routes/upload.js`): `hero`, `welcome`, `comfort`, `taste`, `apartments`, `gallery`, `rooms`, `rest`, `about`, `contact`, `roomslist`, `roomdetail`, `misc`.

## API (коротко)

### Health
- `GET /api/health` → `{ ok: true }`

### Rooms
- `GET /api/rooms`
- `GET /api/rooms/:slug`
- `PUT /api/rooms/:slug` (auth) — upsert по `slug`

### Content (key/value)
- `GET /api/content/:key`
- `PUT /api/content/:key` (auth)

### Translations (i18n)

Чтение (публично):
- `GET /api/translations/main/:lang`
- `GET /api/translations/about/:lang`
- `GET /api/translations/rest/:lang`
- `GET /api/translations/gallery/:lang`
- `GET /api/translations/roomslist/:lang`
- `GET /api/translations/contact/:lang`
- `GET /api/translations/roomdetail/:slug/:lang`

Запись (только админ):
- `PATCH /api/translations/<section>/:lang` (для секций выше)

Экспорт в `assets/i18n/<lang>.json` (только админ):
- `GET /api/translations/export/:lang`
- `POST /api/translations/export/:lang`

## Продакшен

Смотри:
- `docs/PRODUCTION.md`
- `deploy/nginx.conf` (reverse proxy, cache, ограничения для `/uploads`)
- `deploy/arp.service` (systemd unit)
- `deploy/ENV.example` (переменные окружения)

## Полезные утилиты

Проверка, что все `data-i18n*` ключи из `public/*.html` присутствуют во всех языках:

```bash
python tools/check_i18n.py
```
