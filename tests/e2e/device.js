// e2e: iPad และ PWA · รันผ่าน node tests/e2e.js [คำในชื่อข้อ]
const { assert, fs, path, ROOT, SEED, test, fresh } = require('./harness');

test('iPad แนวตั้งและแนวนอน: หน้าหลักไม่มีแถบเลื่อนแนวนอน', async (b, base) => {
  for (const vp of [{ width: 820, height: 1180 }, { width: 1180, height: 820 }]) {
    const p = await fresh(b, base, { viewport: vp });
    for (const t of ['home', 'learn', 'stats']) {
      await p.evaluate(t => goTab(t), t);
      const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert(over <= 0, `${t} ${vp.width}px เกิน ${over}px`);
    }
  }
});

test('iPad กันซูม: เลื่อนได้แค่ขึ้นลง · หยิกซูม/สองนิ้ว/แตะสองทีไม่ซูม · นิ้วเดียวยังเลื่อนได้ · ช่องเขียนรับนิ้วเอง · ฉากแมวแตะสองทีไม่ซูม', async (b, base) => {
  const meta = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').match(/<meta name="viewport" content="([^"]+)"/);
  assert(meta && /maximum-scale=1\b/.test(meta[1]) && /user-scalable=no/.test(meta[1]), 'meta viewport ต้องมี maximum-scale=1 และ user-scalable=no: ' + (meta && meta[1]));
  const p = await fresh(b, base, { hasTouch: true });
  const css = await p.evaluate(() => { const h = getComputedStyle(document.documentElement), bd = getComputedStyle(document.body); return { ta: h.touchAction, ox: h.overflowX, ob: h.overscrollBehaviorX, box: bd.overflowX, bob: bd.overscrollBehaviorX }; });
  assert.deepStrictEqual(css, { ta: 'pan-y', ox: 'hidden', ob: 'none', box: 'clip', bob: 'none' }, 'html ต้อง touch-action:pan-y (Safari ไม่สนใจ user-scalable=no · กันแตะสองทีแล้วซูมและเลื่อนด้านข้าง) และไม่เด้ง/เลื่อนแนวนอน');
  const ev = await p.evaluate(() => {
    const r = {};
    for (const t of ['gesturestart', 'gesturechange', 'gestureend']) { const e = new Event(t, { cancelable: true, bubbles: true }); document.body.dispatchEvent(e); r[t] = e.defaultPrevented; }
    const move = n => { const e = new TouchEvent('touchmove', { touches: [...Array(n)].map((_, i) => new Touch({ identifier: i, target: document.body, clientX: 100 + i * 60, clientY: 300 })), cancelable: true, bubbles: true }); document.body.dispatchEvent(e); return e.defaultPrevented; };
    r.twoFingers = move(2); r.oneFinger = move(1);
    return r;
  });
  assert.deepStrictEqual(ev, { gesturestart: true, gesturechange: true, gestureend: true, twoFingers: true, oneFinger: false }, 'js/main.js ต้องกันท่าหยิกซูมของ Safari (gesture*) และนิ้วสองนิ้ว แต่นิ้วเดียวต้องเลื่อนหน้าได้');
  assert.strictEqual(await p.getByTestId('pet-canvas').evaluate(e => getComputedStyle(e).touchAction), 'manipulation', 'ฉากแมวต้อง touch-action:manipulation: แตะสองทีไม่ซูม แต่ลากนิ้วบนฉากแล้วหน้ายังเลื่อนได้');
  await p.evaluate(() => openDs('k'));
  await p.getByTestId('mode-write').click();
  const tas = await p.getByTestId('write-canvas').evaluateAll(cs => [...new Set(cs.map(c => getComputedStyle(c).touchAction))]);
  assert.deepStrictEqual(tas, ['none'], 'ช่องเขียนต้องรับนิ้ว/ปากกาเอง (touch-action:none) ไม่งั้นลากแล้วหน้าเลื่อนแทนการวาด');
  assert.deepStrictEqual(p.errors, []);
});

test('PWA: manifest ถูกต้องและ service worker ติดตั้งแล้วแอปเปิดออฟไลน์ได้', async (b, base) => {
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
  assert(m.name && m.start_url && m.display && m.icons.length >= 2);
  m.icons.forEach(i => assert(fs.existsSync(path.join(ROOT, i.src)), 'ไม่พบไอคอน ' + i.src));
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  await p.addInitScript(s => { if (!localStorage.getItem('kn_meta')) localStorage.setItem('kn_meta', JSON.stringify(s)); }, SEED);
  await p.goto(base);
  await Promise.race([p.evaluate(() => navigator.serviceWorker.ready), new Promise((_, j) => setTimeout(() => j(new Error('service worker ติดตั้งไม่สำเร็จ (ดูว่า sw.js แคชไฟล์ที่ไม่มีอยู่หรือเปล่า)')), 8000))]);
  await p.reload(); // ให้ SW คุมหน้า
  await ctx.setOffline(true);
  await p.reload();
  assert((await p.locator('#app').innerText()).length > 10, 'ออฟไลน์แล้วหน้าว่าง');
  await p.goto(base + '?paid=n4');
  assert((await p.locator('#app').innerText()).length > 10, 'ออฟไลน์แล้วเปิดหน้าแอปที่มี ?… ต่อท้าย (เช่นกลับจากหน้าชำระเงิน ?paid=n4) ไม่ได้ · sw.js ต้องใช้ index.html ในแคชตัวเดียวกัน (ignoreSearch)');
  await ctx.setOffline(false);
});
