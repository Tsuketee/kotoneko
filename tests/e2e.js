// ชุดทดสอบอัตโนมัติ: node tests/e2e.js [คำในชื่อข้อ]  (ต้องติดตั้ง playwright ก่อน: npm install)
// ไม่ต้อง build แอป สคริปต์นี้เปิด http server เล็กๆ เองแล้วรันทดสอบด้วย Chromium · ข้อทดสอบแยกตามหมวดอยู่ใน tests/e2e/*.js (ส่วนกลางใน tests/e2e/harness.js)
const { chromium } = require('playwright');
const { recorder } = require('./artifacts');
const { server, tests, setRec } = require('./e2e/harness');
for (const f of ['data', 'main', 'pet', 'shop', 'konbini', 'places', 'cloud', 'packs', 'device']) require('./e2e/' + f);

(async () => {
  await new Promise(r => server.listen(0, r));
  const base = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch();
  const rec = recorder(browser, 'e2e'); setRec(rec);
  let fail = 0;
  const only = process.argv[2], run = only ? tests.filter(([n]) => n.includes(only)) : tests; // node tests/e2e.js <คำในชื่อข้อ> = รันเฉพาะข้อที่ชื่อมีคำนั้น
  for (const [name, fn] of run) {
    rec.begin(String(tests.findIndex(t => t[0] === name) + 1).padStart(2, '0'), name);
    let ok = true, err;
    try { await Promise.race([fn(browser, base), new Promise((_, j) => setTimeout(() => j(new Error('หมดเวลา 30 วินาที')), 30000))]); console.log('  ✓', name); }
    catch (e) { ok = false; err = e; fail++; console.log('  ✗', name, '\n     ', (e.stack || e.message || e).split("\n").slice(0, 4).join(" | ")); }
    await rec.end(ok, err);
  }
  rec.finish();
  await browser.close(); server.close();
  console.log('หลักฐาน: test-results/e2e/summary.md');
  console.log(fail ? `\nไม่ผ่าน ${fail}/${run.length}` : `\nผ่านทั้งหมด ${run.length} ข้อ`);
  process.exit(fail ? 1 : 0);
})();
