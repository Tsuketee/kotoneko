// ตรวจภาพแมวพิกเซล: node tests/pet-grid.js [โฟลเดอร์ผลลัพธ์]   (ต้องติดตั้ง playwright ก่อน: npm install)
// เปิดร่าง docs/pixel-cat10.html แล้วเรนเดอร์ทุกท่า × ทุกลายขน เป็นภาพตาราง PNG ทั้งโหมดสว่างและมืด
// แถว = ลายขน, คอลัมน์ = ท่า (เฟรม 1 รวมท่าหันสามส่วนสี่ และท่าเดิน/ยืนมุมข้างทั้งสองทิศ) และคอลัมน์ท้ายคือท่าย่อย กะพริบ/หูกระดิก/สะบัดหาง ของท่านั่ง
// ฉาก: จำลองตัวควบคุมสถานะ 30 นาที ต้องไม่ออกนอกขอบฉากและผ่านทุกสถานะ แล้วบันทึกภาพฉาก (เดินผ่านหลังกระถาง นอนบนเบาะ) ทั้งสองโหมด
// ถ้าหน้าเว็บมีข้อผิดพลาด JavaScript หรือการจำลองฉากไม่ผ่าน สคริปต์จะจบด้วย exit code 1
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const SRC = path.join(__dirname, '..', 'docs', 'pixel-cat10.html');
const OUT = path.resolve(process.argv[2] || '.');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 820, height: 1180 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('file://' + SRC);
  for (const theme of ['light', 'dark']) {
    const url = await page.evaluate((theme) => {
      const Z = 2, coats = Object.keys(COATS), cols = KEYS.map(k => [k, 1, null]).concat(Object.keys(IDLES).map(n => ['sit', 0, n]));
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
    const seen = new Set(); let out = 0;
    for (let i = 0; i < 36000; i++) { step(50); seen.add(cat.mode); if (cat.x < XMIN || cat.x > XMAX) out++; }
    return { seen: [...seen], out };
  });
  const need = ['sit', 'turnOut', 'rise', 'walk', 'halt', 'turnIn', 'run', 'skid', 'loaf', 'curl', 'wake'];
  const miss = need.filter(m => !sim.seen.includes(m));
  if (sim.out) errors.push(`ฉาก: แมวออกนอกขอบ ${sim.out} ครั้ง`);
  if (miss.length) errors.push('ฉาก: ไม่ผ่านสถานะ ' + miss.join(', '));
  console.log('จำลองฉาก 30 นาที: ผ่านสถานะ', sim.seen.join(' '));

  const el = await page.$('#scene'); await el.scrollIntoViewIfNeeded();
  const shots = [['walk', { x: 100, mode: 'walk', dir: 1, dist: 2.4, target: 114 }], ['sleep', { x: 12, mode: 'curl' }]];
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') await page.click('#th');
    for (const [n, s] of shots) {
      await page.evaluate(s => { playing = false; Object.assign(cat, s, { t: 0, dur: 1e9 }); sLast = '' }, s);
      await page.waitForTimeout(80);
      const file = path.join(OUT, `pet-scene-${n}-${theme}.png`);
      await el.screenshot({ path: file });
      console.log('เขียนแล้ว', file);
    }
  }
  await browser.close();
  if (errors.length) { console.error('พบข้อผิดพลาด:\n' + errors.join('\n')); process.exit(1); }
})();
