// ทดสอบ flow หลักแบบผู้ใช้จริง (FEATURE_MAP.md): กดปุ่ม พิมพ์ ลากเส้น และอ่านสิ่งที่ขึ้นบนจอเท่านั้น
// ไม่เรียกฟังก์ชันหรือตัวแปรภายในแอป และไม่ตั้งค่า localStorage เอง ทุกข้อเริ่มจากผู้ใช้ใหม่ที่ตั้งค่าครั้งแรกผ่านหน้าจอ
// รัน: node tests/flows.js [คำในชื่อข้อ]
//      ใช้ dev server ที่เปิดอยู่: BASE_URL=http://localhost:8000/ node tests/flows.js
// หลักฐาน: test-results/flows/ ภาพทุกขั้น + console log ของแต่ละข้อ + summary.md (tests/artifacts.js)
const http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert');
const { chromium } = require('playwright');
const { recorder } = require('./artifacts');
const ROOT = path.join(__dirname, '..');
const VP = { width: 820, height: 1180 }; // iPad Air แนวตั้ง

// เฉลยคำอ่านคันจิจากเนื้อหาที่ผู้เรียนต้องจำ (js/data/kanji-n5.js) ในรูปแบบที่ตัวเลือกควิซแสดง: ออน ・ คุน (ช่อง - = ไม่มีคำอ่านแบบนั้น)
const KEY = (() => {
  const raw = /`([^`]*)`/.exec(fs.readFileSync(path.join(ROOT, 'js/data/kanji-n5.js'), 'utf8'))[1], m = {};
  raw.trim().split('\n').forEach(l => { const [k, o, u] = l.split(','); m[k] = [o, u.replace(/\.([^・/]+)/g, '($1)')].filter(v => v && v !== '-').join(' ・ '); });   // ข้อมูลคุน ひと.つ ผู้เรียนเห็นเป็น ひと(つ)
  return m;
})();
// ตัวอักษรที่ตารางคานะต้องมีครบ: พื้นฐาน 46 · เสียงขุ่น/กึ่งขุ่น 25 · เสียงควบ 33
const HIRA = [...'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん',
  ...'がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ',
  ...'きしちにひみりぎじびぴ'.split('').flatMap(c => ['ゃ', 'ゅ', 'ょ'].map(y => c + y))];
const KATA = HIRA.map(s => [...s].map(c => String.fromCharCode(c.charCodeAt(0) + 0x60)).join(''));

const tests = [];
const test = (id, name, fn) => tests.push({ id, name, fn });
let base, rec;

async function open(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: VP, serviceWorkers: 'block', ...opts });
  const p = await ctx.newPage();
  if (opts.clock) await p.clock.install({ time: opts.clock });
  await p.goto(base);
  return p;
}
// ตั้งค่าครั้งแรกผ่านหน้าจอ: เลือกแมว → ชื่อเพื่อน → ชื่อเรา → N5 → เหตุผล → จำนวนข้อต่อวัน
async function onboard(p, goal = '5 ข้อ') {
  await p.getByRole('heading', { name: 'ยินดีต้อนรับ' }).waitFor();
  await p.getByRole('button', { name: '🐱 แมว', exact: true }).click();
  await p.getByTestId('onboard-name').fill('มะลิ');
  await p.getByRole('button', { name: 'ต่อไป' }).click();
  await p.getByTestId('onboard-name').fill('พอ');
  await p.getByRole('button', { name: 'ต่อไป' }).click();
  await p.getByRole('button', { name: 'N5', exact: true }).click();
  await p.getByRole('button', { name: 'เพื่อไปสอบวัดระดับ JLPT' }).click();
  await p.getByRole('button', { name: goal, exact: true }).click();
  await p.getByTestId('home-greeting').waitFor();
}
// แถบล่าง "เรียน" → การ์ด N5 → หมวดคันจิ
async function openKanji(p) {
  await p.getByTestId('nav-learn').click();
  await p.getByTestId('path-n5').click();
  await p.getByTestId('section-k').click();
}
const term = p => p.getByTestId('study-term').innerText();
const progress = p => p.getByTestId('learn-progress').innerText();
// ตอบควิซ: ok=true เลือกเฉลย · ok=false เลือกตัวเลือกอื่น · คืนคันจิของข้อนั้นและปุ่มที่กด
async function answer(p, ok) {
  const k = (await term(p)).trim(), right = KEY[k];
  assert(right, 'ไม่รู้จักคันจิ ' + k);
  const texts = (await p.getByTestId('quiz-choice').allInnerTexts()).map(s => s.trim());
  const i = ok ? texts.indexOf(right) : texts.findIndex(t => t !== right);
  assert(i >= 0, `ตัวเลือกของ ${k} ไม่มีเฉลย "${right}": ${texts.join(' | ')}`);
  const btn = p.getByTestId('quiz-choice').nth(i);
  await btn.click();
  return { k, btn, right };
}
async function nextTerm(p, prev) {
  await p.waitForFunction(prev => { const e = document.querySelector('[data-testid=study-term]'); return e && e.textContent.trim() !== prev; }, prev);
}
// จำนวนจุดหมึกที่มองเห็นในช่องเขียนช่องที่ i
const ink = (p, i) => p.getByTestId('write-canvas').nth(i).evaluate(c => {
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0;
  for (let k = 3; k < d.length; k += 4) if (d[k] > 0) n++;
  return n;
});
async function inkAfter(p, i, pred, ms = 2000) {
  const t0 = Date.now(); let n;
  while (Date.now() - t0 < ms) { n = await ink(p, i); if (pred(n)) return n; await p.waitForTimeout(50); }
  return n;
}
// เส้นทแยงในช่องเขียนช่องที่ i (พิกัดบนจอ)
async function strokePath(p, i) {
  const c = p.getByTestId('write-canvas').nth(i);
  await c.scrollIntoViewIfNeeded();
  const b = await c.boundingBox();
  return [...Array(12)].map((_, k) => [b.x + b.width * (0.2 + 0.6 * k / 11), b.y + b.height * (0.25 + 0.5 * k / 11)]);
}

// ---------- 1. หน้าแรก ----------
test('01-home', 'หน้าแรก: ผู้ใช้ใหม่ตั้งค่าครั้งแรกจนถึงหน้าแรก ไม่มี error ใน console', async (b) => {
  const p = await open(b);
  await p.getByRole('heading', { name: 'ยินดีต้อนรับ' }).waitFor();
  await rec.shot(p, 'welcome');
  await onboard(p);
  assert.match(await p.getByTestId('home-greeting').innerText(), /สวัสดีค่ะ พอ/);
  for (const t of ['home', 'learn', 'stats', 'shop', 'me']) assert(await p.getByTestId('nav-' + t).isVisible(), 'แถบล่างไม่มี ' + t);
  assert(await p.getByTestId('pet-canvas').isVisible(), 'ไม่เห็นแมวพิกเซล');
  for (const m of ['rev', 'neu', 'dlg']) assert(await p.getByTestId('mission-' + m).isVisible(), 'ไม่เห็นภารกิจ ' + m);
  await rec.shot(p, 'home');
  await p.reload();
  assert.match(await p.getByTestId('home-greeting').innerText(), /สวัสดีค่ะ พอ/, 'เปิดใหม่แล้วต้องเข้าหน้าแรกเลย ไม่ถามตั้งค่าซ้ำ');
  assert.deepStrictEqual(rec.errors(), []);
});

// ---------- 2. เรียนคันจิ → ควิซ → บันทึกผล ----------
test('02-kanji-quiz', 'คันจิ: เรียน 1 ตัวด้วยการ์ด แล้วทำควิซ ผลถูก/ผิดถูกบันทึก และยังอยู่หลังเปิดแอปใหม่', async (b) => {
  const p = await open(b);
  await onboard(p);
  await openKanji(p);
  assert.match(await progress(p), /เจอแล้ว 0\/105/);
  const k1 = (await term(p)).trim();
  await p.getByTestId('study-card').click();
  const ans = await p.getByTestId('card-answer').innerText();
  assert(ans.includes(KEY[k1].split(' ・ ')[0]), `การ์ด ${k1} ไม่แสดงคำอ่าน: ${ans}`);
  await rec.shot(p, 'card-flipped');
  await p.getByTestId('grade-know').click();
  assert.match(await progress(p), /เจอแล้ว 1\/105/);

  await p.getByTestId('mode-quiz').click();
  const r1 = await answer(p, true);
  assert.strictEqual(await r1.btn.getAttribute('data-result'), 'correct');
  await rec.shot(p, 'quiz-correct');
  await nextTerm(p, r1.k);
  const r2 = await answer(p, false);
  assert.strictEqual(await r2.btn.getAttribute('data-result'), 'wrong', 'ตัวเลือกที่กดต้องขึ้นว่าผิด');
  assert.strictEqual(await p.locator('[data-testid=quiz-choice][data-result=correct]').innerText(), r2.right, 'ต้องเฉลยข้อที่ถูก');
  assert(await p.getByTestId('quiz-next').isVisible(), 'ตอบผิดแล้วต้องมีปุ่มข้อต่อไป');
  await rec.shot(p, 'quiz-wrong');
  assert.match(await progress(p), /เจอแล้ว 3\/105/);

  const checkSaved = async (step) => {
    await p.getByTestId('nav-stats').click();
    await p.getByRole('tab', { name: 'ผิดบ่อย' }).click();
    const mis = await p.getByTestId('mistake-item').allInnerTexts();
    assert.strictEqual(mis.length, 1, 'ข้อที่ตอบผิดมีข้อเดียว: ' + mis.join(' | '));
    assert(mis[0].includes(r2.k) && mis[0].includes('ผิด 1'), mis[0]);
    await rec.shot(p, step);
    await p.getByTestId('nav-home').click();
    assert.match(await p.getByTestId('home-today').innerText(), /^3\s*\//, 'วันนี้ตอบไป 3 ข้อ');
    await openKanji(p);
    assert.match(await progress(p), /เจอแล้ว 3\/105/);
  };
  await checkSaved('mistakes');
  await p.reload();
  await checkSaved('mistakes-after-reload');
  assert.deepStrictEqual(rec.errors(), []);
});

// ---------- 3. ทบทวนแบบเว้นระยะ ----------
test('03-srs', 'ทบทวนแบบเว้นระยะ: การ์ดที่ตอบผิดกลับมาก่อน (ราว 30 วินาที) การ์ดที่ตอบถูกรอ 10 นาที', async (b) => {
  const p = await open(b, { clock: new Date('2026-11-23T10:00:00') });
  await onboard(p);
  await openKanji(p);
  const reopen = async () => { await p.getByTestId('nav-back').click(); await p.getByTestId('path-n5').click(); await p.getByTestId('section-k').click(); return (await term(p)).trim(); };
  const A = (await term(p)).trim();
  await p.getByTestId('study-card').click(); await p.getByTestId('grade-unsure').click();
  const B = (await term(p)).trim();
  assert.notStrictEqual(A, B);
  await p.getByTestId('study-card').click(); await p.getByTestId('grade-know').click();
  const C = (await term(p)).trim();
  assert(![A, B].includes(C), 'ยังไม่ถึงเวลา ต้องได้คันจิใหม่');

  await p.clock.fastForward('00:31');
  assert.strictEqual(await reopen(), A, 'ผ่านไป 31 วินาที การ์ดที่ตอบผิดต้องกลับมาก่อน');
  await rec.shot(p, 'wrong-card-back-after-31s');
  await p.getByTestId('study-card').click(); await p.getByTestId('grade-know').click();
  assert.notStrictEqual((await term(p)).trim(), B, 'การ์ดที่ตอบถูกยังไม่ถึง 10 นาที ต้องยังไม่กลับมา');

  await p.clock.fastForward('05:00');
  assert.notStrictEqual(await reopen(), B, 'ผ่านไป 5 นาที การ์ดที่ตอบถูกยังไม่ต้องกลับมา');
  await p.clock.fastForward('05:00');
  assert.strictEqual(await reopen(), B, 'ผ่านไปเกิน 10 นาที การ์ดที่ตอบถูกต้องกลับมาทบทวน');
  await rec.shot(p, 'right-card-back-after-10min');
  assert.deepStrictEqual(rec.errors(), []);
});

// ---------- 4. ตารางคานะ ----------
test('04-kana-chart', 'ตารางคานะ: ฮิระงะนะและคะตะคะนะแสดงครบ 104 ตัวต่อชุด ไม่ซ้ำ และมีคำอ่านทุกตัว', async (b) => {
  const p = await open(b);
  await onboard(p);
  await p.getByTestId('nav-learn').click();
  await p.getByTestId('path-kana').click();
  assert.strictEqual(await p.getByTestId('mode-chart').getAttribute('aria-selected'), 'true', 'คานะเปิดมาเป็นตาราง');
  const script = p.getByRole('group', { name: 'ชุดตัวอักษร' });
  for (const [name, want] of [['ฮิระงะนะ', HIRA], ['คะตะคะนะ', KATA]]) {
    await script.getByRole('button', { name, exact: true }).click();
    const cells = p.getByTestId('kana-cell');
    const got = (await cells.locator('b').allInnerTexts()).map(s => s.trim());
    const missing = want.filter(c => !got.includes(c)), extra = got.filter(c => !want.includes(c));
    assert.deepStrictEqual({ missing, extra }, { missing: [], extra: [] }, name);
    assert.strictEqual(got.length, want.length, name + ' มีตัวซ้ำ');
    const roma = await cells.locator('span').allInnerTexts();
    assert(roma.length === want.length && roma.every(r => /^[a-z]+$/.test(r.trim())), name + ' มีช่องที่ไม่มีคำอ่าน');
    await rec.shot(p, name === 'ฮิระงะนะ' ? 'hiragana' : 'katakana');
  }
  assert.deepStrictEqual(rec.errors(), []);
});

// ---------- 5. ฝึกเขียน ----------
test('05-write-pen', 'ฝึกเขียน: เปิดได้ มีเส้นนำ ลากเส้นด้วยเมาส์และ Apple Pencil แล้วมีหมึก ยางลบลบได้', async (b) => {
  const p = await open(b);
  await onboard(p);
  await openKanji(p);
  await p.getByTestId('mode-write').click();
  await p.getByTestId('write-sheet').waitFor();
  assert.strictEqual(await p.getByTestId('write-canvas').count(), 16);
  assert((await p.getByTestId('write-prompt').innerText()).trim().length > 0, 'ต้องบอกคำอ่านและความหมาย');
  assert(await p.locator('[data-testid=write-sheet] svg path').count() > 0, 'ต้องมีเส้นนำลำดับขีด');
  assert.strictEqual(await ink(p, 0), 0);
  // เมาส์
  const m = await strokePath(p, 0);
  await p.mouse.move(...m[0]); await p.mouse.down();
  for (const pt of m.slice(1)) await p.mouse.move(...pt);
  await p.mouse.up();
  const drawn = await inkAfter(p, 0, n => n > 200);
  assert(drawn > 200, 'ลากเมาส์แล้วต้องมีเส้น: ' + drawn);
  // Apple Pencil (pointerType pen)
  const cdp = await p.context().newCDPSession(p), pen = await strokePath(p, 1);
  const send = (type, [x, y], buttons) => cdp.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons, clickCount: 1, pointerType: 'pen' });
  await send('mousePressed', pen[0], 1);
  for (const pt of pen.slice(1)) await send('mouseMoved', pt, 1);
  await send('mouseReleased', pen[pen.length - 1], 0);
  const penInk = await inkAfter(p, 1, n => n > 200);
  assert(penInk > 200, 'เขียนด้วยปากกาแล้วต้องมีเส้น: ' + penInk);
  await rec.shot(p, 'drawn');
  // ยางลบ
  await p.getByTestId('write-eraser').click();
  const e = await strokePath(p, 0);
  await p.mouse.move(...e[0]); await p.mouse.down();
  for (const pt of e.slice(1)) await p.mouse.move(...pt);
  await p.mouse.up();
  const left = await inkAfter(p, 0, n => n < drawn * 0.1);
  assert(left < drawn * 0.1, `ลบแล้วต้องเหลือหมึกไม่ถึง 10%: ${left}/${drawn}`);
  await rec.shot(p, 'erased');
  assert.deepStrictEqual(rec.errors(), []);
});

test('06-write-finger', 'ฝึกเขียน: ลากเส้นด้วยนิ้วได้ ตามคำแนะนำบนจอ "เขียนตามเส้นจางด้วยนิ้วหรือ Apple Pencil"', async (b) => {
  const p = await open(b, { hasTouch: true });
  await onboard(p);
  await openKanji(p);
  await p.getByTestId('mode-write').click();
  await p.getByTestId('write-sheet').waitFor();
  assert(await p.getByText('เขียนตามเส้นจางด้วยนิ้วหรือ Apple Pencil').isVisible(), 'คำแนะนำบนจอพูดถึงการเขียนด้วยนิ้ว');
  const cdp = await p.context().newCDPSession(p), f = await strokePath(p, 0);
  const touch = (type, pt) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pt ? [{ x: pt[0], y: pt[1] }] : [] });
  await touch('touchStart', f[0]);
  for (const pt of f.slice(1)) await touch('touchMove', pt);
  await touch('touchEnd');
  const n = await inkAfter(p, 0, n => n > 200);
  await rec.shot(p, 'finger');
  assert(n > 200, 'ลากนิ้วแล้วต้องมีเส้น: ' + n);
  assert.deepStrictEqual(rec.errors(), []);
});

test('06b-write-palm', 'ฝึกเขียน: ระหว่างใช้ Apple Pencil ฝ่ามือ/นิ้วที่แตะจอไม่วาด · ปากกาแตะลงระหว่างนิ้วลากจะลบเส้นของนิ้ว · วางปากกาเกิน 1 วินาทีนิ้วกลับมาเขียนได้', async (b) => {
  const p = await open(b, { hasTouch: true });
  await onboard(p);
  await openKanji(p);
  await p.getByTestId('mode-write').click();
  await p.getByTestId('write-sheet').waitFor();
  const cdp = await p.context().newCDPSession(p);
  const pen = (type, [x, y], buttons) => cdp.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons, clickCount: 1, pointerType: 'pen' });
  const touch = (type, pt) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pt ? [{ x: pt[0], y: pt[1] }] : [] });
  const penStroke = async a => { await pen('mousePressed', a[0], 1); for (const pt of a.slice(1)) await pen('mouseMoved', pt, 1); await pen('mouseReleased', a[a.length - 1], 0) };
  const touchStroke = async a => { await touch('touchStart', a[0]); for (const pt of a.slice(1)) await touch('touchMove', pt); await touch('touchEnd') };
  // ปากกาเพิ่งยก แล้วฝ่ามือแตะ
  await penStroke(await strokePath(p, 1));
  assert(await inkAfter(p, 1, n => n > 200) > 200, 'ปากกาต้องวาดได้');
  await touchStroke(await strokePath(p, 2));
  await p.waitForTimeout(300);
  assert.strictEqual(await ink(p, 2), 0, 'แตะด้วยนิ้วทันทีหลังยกปากกาต้องไม่วาด');
  // นิ้วลากอยู่ แล้วปากกาแตะลง
  await p.waitForTimeout(1200);
  const f = await strokePath(p, 3), q = await strokePath(p, 4);
  await touch('touchStart', f[0]);
  for (const pt of f.slice(1)) await touch('touchMove', pt);
  assert(await inkAfter(p, 3, n => n > 200) > 200, 'นิ้วต้องวาดได้เมื่อไม่ได้ใช้ปากกาเกิน 1 วินาที');
  await penStroke(q);
  await touch('touchEnd');
  assert(await inkAfter(p, 4, n => n > 200) > 200, 'ปากกาที่แตะลงระหว่างนิ้วลากต้องวาดได้');
  assert.strictEqual(await inkAfter(p, 3, n => n === 0), 0, 'เส้นของนิ้วต้องถูกลบเมื่อปากกาแตะลง');
  await rec.shot(p, 'palm');
  assert.deepStrictEqual(rec.errors(), []);
});

// ---------- 6. ควิซผ่าน → รางวัล → สัตว์เลี้ยง ----------
test('07-reward', 'รางวัล: ตอบควิซถูกครบเป้า → ภารกิจสำเร็จ → กดรับ → Energy และความสนิทของสัตว์เลี้ยงเพิ่ม', async (b) => {
  const p = await open(b);
  await onboard(p, '5 ข้อ');
  assert.match(await p.getByTestId('mission-rev').innerText(), /0 \/ 5/);
  assert.strictEqual(await p.getByTestId('pet-energy').getAttribute('aria-valuenow'), '0');
  assert.match(await p.getByTestId('pet-bond').innerText(), /0 \/ 120/);
  await openKanji(p);
  await p.getByTestId('mode-quiz').click();
  for (let i = 0; i < 5; i++) {
    const r = await answer(p, true);
    assert.strictEqual(await r.btn.getAttribute('data-result'), 'correct');
    if (i < 4) await nextTerm(p, r.k);
  }
  await p.getByTestId('toast').filter({ hasText: 'ทบทวนให้ถูก สำเร็จ' }).waitFor();
  // คันจิทั้ง 5 ตัวเป็นตัวใหม่ จึงครบภารกิจ "เจอคำ/คันจิใหม่" (3 ตัว) ไปด้วย ป้ายบนแท็บหน้าแรกจึงเป็น 2
  assert.strictEqual(await p.getByTestId('nav-home').getAttribute('aria-label'), 'หน้าแรก มีรางวัลรอรับ 2');
  await p.getByTestId('nav-home').click();
  assert.match(await p.getByTestId('mission-rev').innerText(), /5 \/ 5/);
  await rec.shot(p, 'before-claim');
  await p.getByTestId('mission-claim-rev').click();
  await p.getByTestId('toast').filter({ hasText: '+20 Energy · มะลิ' }).waitFor();
  assert.strictEqual(await p.getByTestId('pet-energy').getAttribute('aria-valuenow'), '20');
  assert.match(await p.getByTestId('pet-bond').innerText(), /2 \/ 120/);
  assert.match(await p.getByTestId('mission-rev').innerText(), /รับแล้ว/);
  assert.strictEqual(await p.getByTestId('mission-claim-rev').count(), 0, 'รับซ้ำไม่ได้');
  await rec.shot(p, 'after-claim');
  assert.deepStrictEqual(rec.errors(), []);
});

// ---------- 8. เป้าหมายต่อวัน ----------
test('08-goal', 'เป้าหมายต่อวัน: คำตอบตอนตั้งค่าครั้งแรกเป็นเป้าของวงหน้าแรกและภารกิจ · แตะวงแล้วพิมพ์ตัวเลขเองได้ · ค่าผิดขึ้นคำเตือน · เปิดแอปใหม่แล้วยังอยู่', async (b) => {
  const p = await open(b);
  await onboard(p, '10 ข้อ');
  assert.match(await p.getByTestId('home-today').innerText(), /0\s*\/\s*10/);
  assert.match(await p.getByTestId('mission-rev').innerText(), /0 \/ 10/);
  await p.getByTestId('home-goal').click();
  await p.getByTestId('goal-input').fill('500');
  await p.getByTestId('goal-save').click();
  await p.getByTestId('goal-error').filter({ hasText: 'ใส่จำนวนข้อเป็นตัวเลข 1–200' }).waitFor();
  await rec.shot(p, 'invalid');
  await p.getByTestId('goal-input').fill('12');
  await rec.shot(p, 'typed');
  await p.getByTestId('goal-save').click();
  await p.getByTestId('toast').filter({ hasText: 'เป้าหมายต่อวัน 12 ข้อ' }).waitFor();
  assert.match(await p.getByTestId('home-today').innerText(), /0\s*\/\s*12/);
  assert.match(await p.getByTestId('mission-rev').innerText(), /0 \/ 12/);
  await p.reload();
  assert.match(await p.getByTestId('home-today').innerText(), /0\s*\/\s*12/, 'เปิดใหม่แล้วเป้าต้องยังเป็น 12');
  await p.getByTestId('nav-stats').click();
  assert.match(await p.getByTestId('stats-goal').locator('xpath=..').innerText(), /12\s*ข้อต่อวัน/);
  await p.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running' || a.effect.getComputedTiming().iterations === Infinity));
  await rec.shot(p, 'stats');
  assert.deepStrictEqual(rec.errors(), []);
});

// ---------- 9. ร้านค้าโคบัง + ตู้กับข้าว ----------
test('09-shop', 'ร้านค้า: รับภารกิจได้ Energy และโคบัง → ประวัติโคบังบอกที่มา → ซื้อนมด้วย Energy เข้าตู้กับข้าว → หน้าแรกกดให้อาหาร เลือกจากรูปอาหาร → ความสนิทเพิ่ม ของในตู้ลด', async b => {
  const p = await open(b);
  await onboard(p, '5 ข้อ');
  await openKanji(p);
  await p.getByTestId('mode-quiz').click();
  for (let i = 0; i < 5; i++) { const r = await answer(p, true); if (i < 4) await nextTerm(p, r.k); }
  await p.getByTestId('toast').filter({ hasText: 'ทบทวนให้ถูก สำเร็จ' }).waitFor();
  await p.getByTestId('nav-home').click();
  await p.getByTestId('mission-claim-rev').click();
  await p.getByTestId('mission-claim-neu').click();
  assert.strictEqual(await p.getByTestId('pet-energy').getAttribute('aria-valuenow'), '40');
  await p.getByTestId('nav-shop').click();
  assert.match(await p.getByTestId('shop-koban').innerText(), /^10$/);
  await p.getByTestId('shop-log-toggle').click();
  assert.strictEqual((await p.getByTestId('shop-log').innerText()).match(/รับภารกิจ/g).length, 2);
  await rec.shot(p, 'shop');
  await p.getByTestId('food-item-milk').click();
  await p.getByTestId('food-buy').click();
  assert.match(await p.getByTestId('shop-sheet').innerText(), /ในตู้ 1/);
  await p.getByTestId('shop-sheet-close').click();
  await p.getByTestId('nav-home').click();
  assert.match(await p.getByTestId('pet-bond').innerText(), /4 \/ 120/);
  await p.getByTestId('pet-feed').click();
  await p.getByTestId('food-img-milk').waitFor();
  await rec.shot(p, 'feed-dialog');
  await p.getByTestId('feed-milk').click();
  await p.getByTestId('feed-dialog').waitFor({ state: 'detached' });
  assert.match(await p.getByTestId('pet-bond').innerText(), /8 \/ 120/);
  await p.getByTestId('pet-feed').click();
  assert.match(await p.getByTestId('feed-milk').innerText(), /×0/);
  assert(await p.getByTestId('feed-milk').isDisabled());
  await rec.shot(p, 'after-feed');
  assert.deepStrictEqual(rec.errors(), []);
});

(async () => {
  let server;
  if (process.env.BASE_URL) base = process.env.BASE_URL;
  else {
    const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
    server = http.createServer((q, r) => {
      let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
      if (f.endsWith(path.sep)) f += 'index.html';
      fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
    });
    await new Promise(r => server.listen(0, r));
    base = `http://localhost:${server.address().port}/`;
  }
  const browser = await chromium.launch();
  rec = recorder(browser, 'flows');
  const only = process.argv[2], run = only ? tests.filter(t => t.name.includes(only) || t.id.includes(only)) : tests;
  let fail = 0;
  for (const t of run) {
    rec.begin(t.id, t.name);
    let ok = true, err;
    try { await Promise.race([t.fn(browser), new Promise((_, j) => setTimeout(() => j(new Error('หมดเวลา 60 วินาที')), 60000))]); }
    catch (e) { ok = false; err = e; fail++; }
    await rec.end(ok, err);
    console.log(ok ? '  ✓' : '  ✗', t.id, t.name, ok ? '' : '\n      ' + String(err && (err.message || err)).split('\n').slice(0, 3).join(' | '));
  }
  rec.finish();
  await browser.close(); if (server) server.close();
  console.log(`\nหลักฐาน: test-results/flows/summary.md`);
  console.log(fail ? `ไม่ผ่าน ${fail}/${run.length}` : `ผ่านทั้งหมด ${run.length} ข้อ`);
  process.exit(fail ? 1 : 0);
})();
