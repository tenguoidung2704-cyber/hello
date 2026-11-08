// Server đồng bộ cho Rạp Party: mỗi ?room=ten là một phòng riêng.
const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 8080;
const ORIGIN = process.env.ORIGIN || ''; // vd https://tenban.github.io (bỏ trống = cho mọi nơi)
const MAX_PER_ROOM = 40;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end('rap-party ok');
});
const wss = new WebSocketServer({ server, maxPayload: 4096 });
const rooms = new Map();
let counter = 0;

const num = v => (Number.isFinite(+v) ? +v : 0);
function getRoom(code) {
  let r = rooms.get(code);
  if (!r) { r = { clients: new Map(), dirty: false, screen: null }; rooms.set(code, r); }
  return r;
}
function broadcast(room, obj) {
  const s = JSON.stringify(obj);
  for (const c of room.clients.values()) if (c.ws.readyState === 1) c.ws.send(s);
}

wss.on('connection', (ws, req) => {
  if (ORIGIN && req.headers.origin !== ORIGIN) { ws.close(1008); return; }
  const u = new URL(req.url, 'http://x');
  const code = (u.searchParams.get('room') || 'lobby').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32) || 'lobby';
  const room = getRoom(code);
  if (room.clients.size >= MAX_PER_ROOM) { ws.close(1013); return; }

  const id = 'p' + (++counter).toString(36) + Math.random().toString(36).slice(2, 6);
  const c = { ws, p: {}, tokens: 30 };
  room.clients.set(id, c);
  ws.send(JSON.stringify({ t: 'hello', id, screen: room.screen }));
  room.dirty = true;

  ws.on('message', buf => {
    if (c.tokens <= 0) return;
    c.tokens--;
    let m;
    try { m = JSON.parse(buf.toString()); } catch { return; }
    if (m.t === 'presence' && m.d && typeof m.d === 'object') {
      const d = m.d;
      c.p = {
        n: String(d.n || '').slice(0, 14),
        c: String(d.c || '').slice(0, 7),
        x: num(d.x), z: num(d.z), r: num(d.r),
        s: Number.isInteger(d.s) ? d.s : -1,
        e: String(d.e || '').slice(0, 4),
        et: num(d.et),
      };
      room.dirty = true;
    } else if (m.t === 'emit' && (m.topic === 'chat' || m.topic === 'screen')) {
      const src = m.data || {};
      let data;
      if (m.topic === 'chat') {
        data = { t: String(src.t || '').slice(0, 120) };
      } else {
        data = { t: String(src.t || '').slice(0, 60), u: String(src.u || '').slice(0, 300) };
        room.screen = data;
      }
      broadcast(room, { t: 'emit', topic: m.topic, data, id });
    }
  });

  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('close', () => {
    room.clients.delete(id);
    room.dirty = true;
    if (!room.clients.size) {
      setTimeout(() => {
        const r = rooms.get(code);
        if (r && !r.clients.size) rooms.delete(code);
      }, 10 * 60 * 1000);
    }
  });
});

// gửi danh sách người trong phòng ~10 lần/giây khi có thay đổi
setInterval(() => {
  for (const room of rooms.values()) {
    if (!room.dirty) continue;
    room.dirty = false;
    const peers = [];
    for (const [id, c] of room.clients) if (c.p.n) peers.push({ id, p: c.p });
    broadcast(room, { t: 'peers', peers });
  }
}, 100);

// giới hạn tốc độ + giữ kết nối sống
setInterval(() => { for (const room of rooms.values()) for (const c of room.clients.values()) c.tokens = 30; }, 1000);
setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) { ws.terminate(); continue; }
    ws.isAlive = false;
    ws.ping();
  }
}, 25000);

server.listen(PORT, () => console.log('rap-party server on :' + PORT));
