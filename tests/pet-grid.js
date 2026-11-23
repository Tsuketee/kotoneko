// ตรวจภาพแมวพิกเซล: node tests/pet-grid.js [โฟลเดอร์ผลลัพธ์]   (ต้องติดตั้ง playwright ก่อน: npm install)
// เปิดแอปจริง (index.html + js/pixelcat.js ผ่าน http server เล็กๆ) แล้วเรนเดอร์ทุกท่า × ทุกลายขน เป็นภาพตาราง PNG ทั้งโหมดสว่างและมืด
// แถว = ลายขน, คอลัมน์ = ท่า (เฟรม 1 ของทุกท่า แล้วตามด้วยท่าพักแต่ละแบบ) · pet-grid-light.png / pet-grid-dark.png
// ฉาก: จำลองตัวควบคุมสถานะ 30 นาที (ปิดอารมณ์รายวัน ตรึงนาฬิกาฉาก) ต้องไม่ออกนอกขอบฉากและผ่านทุกสถานะ แล้วถ่ายฉากห้องจริงบนหน้าแรก (เดิน/หลับ × กลางวัน/กลางคืน)
// ถ้าหน้าเว็บมีข้อผิดพลาด JavaScript หรือการจำลองฉากไม่ผ่าน สคริปต์จะจบด้วย exit 1
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const OUT = path.resolve(process.argv[2] || '.');
fs.mkdirSync(OUT, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((q, r) => {
  let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(ROOT)) { r.writeHead(403); return r.end(); }
  if (f.endsWith(path.sep)) f += 'index.html';
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
});
const SEED = { goal: 20, days: {}, pet: { name: 'กริด', sp: 0, energy: 0, bond: 0, d: null, trait: 0, lv: 'N5', goal: 'x' } };

(async () => {
  await new Promise(r => server.listen(0, r));
  const base = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 820, height: 1180 }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.addInitScript(s => { if (!localStorage.getItem('kn_meta')) localStorage.setItem('kn_meta', JSON.stringify(s)); }, SEED);
  await page.goto(base);
  await page.waitForFunction(() => window.PixelCat && document.getElementById('petcv'));
  for (const theme of ['light', 'dark']) {
    const url = await page.evaluate((theme) => {
      const { COATS, KEYS, IDLE_NAMES, W, H, frame, draw } = PixelCat._t;
      const Z = 2, coats = Object.keys(COATS), cols = KEYS.map(k => [k, 1, null]).concat(IDLE_NAMES.map(n => ['sit', 0, n]));
      const c = document.createElement('canvas'); c.width = cols.length * W * Z; c.height = coats.length * H * Z;
      const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = theme === 'dark' ? '#2b241f' : '#ffffff'; x.fillRect(0, 0, c.width, c.height);
      const t = document.createElement('canvas'); t.width = W; t.height = H;
      coats.forEach((co, r) => cols.forEach(([k, f, idle], i) => { draw(t.getContext('2d'), frame(k, f, theme, co, 'none', idle)); x.drawImage(t, i * W * Z, r * H * Z, W * Z, H * Z) }));
      return c.toDataURL('image/png');
    }, theme);
    const file = path.join(OUT, `pet-grid-${theme}.png`);
    fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
    console.log('เขียนแล้ว', file);
  }

  // ฉาก: จำลองทีละ 50 ms เป็นเวลา 30 นาที
  const sim = await page.evaluate(() => {
    const { step, cat, XMIN, XMAX, setJit, setNow } = PixelCat._t;
    setJit(false); setNow(new Date('2026-11-22T12:00:00').getTime());
    Object.assign(cat, { mode: 'sit', t: 0, dur: 100 });
    const seen = new Set(); let out = 0;
    for (let i = 0; i < 36000; i++) { step(50); seen.add(cat.mode); if (cat.x < XMIN || cat.x > XMAX) out++; }
    return { seen: [...seen], out };
  });
  const need = ['sit', 'turnOut', 'rise', 'walk', 'halt', 'turnIn', 'run', 'skid', 'groom', 'loaf', 'curl', 'wake'];
  const miss = need.filter(m => !sim.seen.includes(m));
  if (sim.out) errors.push(`ฉาก: แมวออกนอกขอบ ${sim.out} ครั้ง`);
  if (miss.length) errors.push('ฉาก: ไม่ผ่านสถานะ ' + miss.join(', '));
  console.log('จำลองฉาก 30 นาที: ผ่านสถานะ', sim.seen.join(' '));

  const shots = [['walk', { x: 100, mode: 'walk', dir: 1, dist: 2.4, target: 114 }], ['sleep', { x: 12, mode: 'curl' }]];
  const el = await page.$('.scn.px'); await el.scrollIntoViewIfNeeded();
  for (const tod of ['day', 'night']) {   // ฉากเปลี่ยนตามช่วงเวลาของวัน (ไม่ใช่ธีมของแอป)
    for (const [n, s] of shots) {
      await page.evaluate(([s, tod]) => { const { cat, setTod } = PixelCat._t; setTod(tod); Object.assign(cat, s, { t: 0, dur: 1e9 }); }, [s, tod]);
      await page.waitForTimeout(150);
      const file = path.join(OUT, `pet-scene-${n}-${tod}.png`);
      await el.screenshot({ path: file, animations: 'disabled' });
      console.log('เขียนแล้ว', file);
    }
  }
  await browser.close(); server.close();
  if (errors.length) { console.error('พบข้อผิดพลาด:\n' + errors.join('\n')); process.exit(1); }
})();
