// ตรวจภาพแมวพิกเซล: node tests/pet-grid.js [โฟลเดอร์ผลลัพธ์]   (ต้องติดตั้ง playwright ก่อน: npm install)
// เปิดร่าง docs/pixel-cat9.html แล้วเรนเดอร์ทุกท่า × ทุกลายขน เป็นภาพตาราง PNG ทั้งโหมดสว่างและมืด
// แถว = ลายขน, คอลัมน์ = ท่า (เฟรม 1) และคอลัมน์ท้ายคือท่าย่อย กะพริบ/หูกระดิก/สะบัดหาง ของท่านั่ง
// ถ้าหน้าเว็บมีข้อผิดพลาด JavaScript สคริปต์จะจบด้วย exit code 1
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const SRC = path.join(__dirname, '..', 'docs', 'pixel-cat9.html');
const OUT = path.resolve(process.argv[2] || '.');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
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
  await browser.close();
  if (errors.length) { console.error('พบข้อผิดพลาดในหน้า:\n' + errors.join('\n')); process.exit(1); }
})();
