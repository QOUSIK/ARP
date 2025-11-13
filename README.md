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
