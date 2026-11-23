// สร้างไอคอนแอปทั้งหมดใน icons/ จากต้นฉบับ tools/icon.html (พิกเซล 64×64 แมวจาก js/pixelcat.js)
// ใช้: node tools/make-icons.js  (ต้องมี playwright เหมือนชุดทดสอบ) · แก้หน้าตาไอคอนที่ drawIcon() ใน tools/icon.html แล้วรันใหม่ อย่าแก้ไฟล์ใน icons/ มือ
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png' };
const server = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(ROOT)) { r.writeHead(403); return r.end(); }
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
});
server.listen(0, async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(`http://localhost:${server.address().port}/tools/icon.html`);
    const out = await p.evaluate(() => window.EXPORT());
    if (errs.length) throw new Error(errs.join('\n'));
    for (const [name, v] of Object.entries(out)) {
      const buf = name.endsWith('.svg') ? Buffer.from(v) : Buffer.from(v.split(',')[1], 'base64');
      fs.writeFileSync(path.join(ROOT, 'icons', name), buf); console.log('icons/' + name, buf.length, 'bytes');
    }
  } finally { await b.close(); server.close(); }
});
