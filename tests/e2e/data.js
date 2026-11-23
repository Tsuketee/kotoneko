// e2e: ข้อมูล ไฟล์ ไอคอน ความปลอดภัย โครงสร้างสคริปต์ · รันผ่าน node tests/e2e.js [คำในชื่อข้อ]
const { assert, fs, path, ROOT, test, fresh } = require('./harness');

test('ข้อมูล: คำคันจิใช้เฉพาะคันจิ N5 ที่มีในแอป ไม่มีคำซ้ำ และบทสนทนาครบ', async (b, base) => {
  const p = await fresh(b, base);
  const r = await p.evaluate(() => {
    const ok = new Set(RAW.trim().split('\n').map(l => l.split(',')[0]));
    const kj = s => [...s].filter(c => /[一-鿿]/.test(c));
    const bad = [];
    W.forEach(x => kj(x.k).forEach(c => ok.has(c) || bad.push(x.k + ':' + c)));
    D.forEach(d => d.turns.forEach(t => kj(t[1]).forEach(c => ok.has(c) || bad.push(t[1] + ':' + c))));
    const EXP = { first: 1, morning: 2, noon: 2, evening: 2, night: 2, late: 1, partial: 3, done: 3, back: 2, feed: 6, hungry: 3, lv2: 1, lv3: 1, s3: 1, s7: 1, s30: 1, b25: 1, b100: 1, b250: 1, goal: 1, wrong: 8, pat: 12, spring: 2, summer: 2, autumn: 2, winter: 2 };
    const FORBID = ['อิตาโดริ', 'ลูฟี่', 'โจรสลัด', 'วันพีซ', 'วันพืช', 'Luffy', 'One Piece', 'Itadori'];
    const tbad = [];
    if (TR.length !== 10) tbad.push('จำนวนนิสัย ' + TR.length);
    TR.forEach((t, i) => {
      if (!t.n || /แนว/.test(t.n)) tbad.push('ป้ายชื่อนิสัย ' + i + ' ห้ามอ้างอิงผลงาน/ตัวละครด้วยคำว่า "แนว...": ' + t.n);
      const got = Object.fromEntries(Object.entries(t.s).map(([k, v]) => [k, v.length]));
      if (JSON.stringify(got) !== JSON.stringify(EXP)) tbad.push('ช่อง/จำนวนประโยคนิสัย ' + i + ' ' + JSON.stringify(got));
      const all = [t.n, ...Object.values(t.s).flat()];
      all.forEach(l => { if (!l || !l.trim()) tbad.push('ประโยคว่าง ' + i); FORBID.forEach(w => { if (l.includes(w)) tbad.push('ห้ามใช้ชื่อเฉพาะ "' + w + '" ในนิสัย ' + i); }); });
      if (new Set(Object.values(t.s).flat()).size !== 64) tbad.push('ประโยคซ้ำในนิสัย ' + i);
      // ช่องตัวแปรมีแค่ {n} {kanji} และทุกช่องต้องมีประโยคที่ไม่มีช่องตัวแปร (ไม่งั้นตอนยังไม่มีค่าจะไม่มีประโยคให้เลือก)
      Object.entries(t.s).forEach(([k, v]) => { if (!v.some(l => !/\{/.test(l))) tbad.push('ทุกประโยคในช่อง ' + k + ' มีช่องตัวแปร นิสัย ' + i); v.forEach(l => { if (/\{(?!n\}|kanji\})|(?<!\{n|\{kanji)\}/.test(l)) tbad.push('ช่องตัวแปรผิด นิสัย ' + i + ': ' + l) }) });
      // กฎภาษา (รายงานบทพูดตามนิสัย v62): ไม่มี !! วงเล็บท่าทาง คำทักแปลตรง · "…" ไม่เกิน 1 (ยกเว้นขี้เซา) · ไม่เกิน 60 ตัว · นิสัยเงียบ/ขี้เซา/สุภาพ/นักวิชาการไม่มี ! · คันจิในประโยคต้องเป็น N5
      Object.values(t.s).flat().forEach(l => {
        if (/!!|\(|อรุณสวัสดิ์|ราตรีสวัสดิ์|ยินดีต้อนรับ|ขอบคุณสำหรับ/.test(l)) tbad.push('บทพูดแข็ง/แปลตรง นิสัย ' + i + ': ' + l);
        if ((l.match(/…/g) || []).length > 1 && i !== 4) tbad.push('"…" เกิน 1 ครั้ง นิสัย ' + i + ': ' + l);
        if ([...l].length > 60) tbad.push('ยาวเกิน 60 ตัว นิสัย ' + i + ': ' + l);
        if ([1, 4, 7, 8].includes(i) && /!/.test(l)) tbad.push('นิสัยนี้ไม่ใช้ ! นิสัย ' + i + ': ' + l);
        kj(l).forEach(c => ok.has(c) || tbad.push('คันจิเกิน N5 ในบทพูด นิสัย ' + i + ': ' + c));
      });
    });
    const EMO = /[\u2600-\u27BF\u{1F300}-\u{1FAFF}]|\uFE0F/u;
    TR.forEach((t, i) => { if (!P[t.i]) tbad.push('นิสัย ' + i + ' ไม่มีไอคอน ' + t.i); [t.n, ...Object.values(t.s).flat()].forEach(l => { if (EMO.test(l)) tbad.push('ห้ามมีอิโมจิในบทพูด (ใช้ไอคอนเส้นแทน) นิสัย ' + i + ': ' + l); }); });
    const gbad = [];
    G.forEach((g, i) => {
      const txt = [g.t, g.s, ...g.notes, ...g.ex.flat(), ...g.qs.flatMap(q => [q.q, q.why, ...q.opts])].join('');
      kj(txt).forEach(c => ok.has(c) || bad.push('G' + g.id + ':' + c));
      if (g.id !== i + 1 || g.notes.length < 3 || g.ex.length < 4 || g.qs.length < 4) gbad.push('โครงสร้างบท ' + g.id);
      if ((txt.match(/\{/g) || []).length !== (txt.match(/\}/g) || []).length) gbad.push('วงเล็บฟุริงะนะบท ' + g.id);
      g.ex.forEach(e => { if (!e[0] || !e[1]) gbad.push('ตัวอย่างว่าง ' + g.id); });
      g.qs.forEach(q => {
        if ((q.q.match(/___/g) || []).length !== 1) gbad.push('ช่องว่างโจทย์ ' + g.id + ' ' + q.q);
        if (q.opts.length < 2 || q.opts.length > 4 || new Set(q.opts).size !== q.opts.length || !q.why) gbad.push('ตัวเลือก/คำอธิบาย ' + g.id + ' ' + q.q);
      });
    });
    const noSV = K.filter(x => !SV[x.k]).map(x => x.k), noEX = K.filter(x => !EX[x.k]).map(x => x.k);
    const dupK = K.map(x => x.k).filter((k, i, a) => a.indexOf(k) !== i), badRow = K.filter(x => !x.o || !x.m || !x.c).length;
    const keys = [...W, ...V].map(x => x.k);
    return { tbad, gbad, g: G.length, noSV, noEX, dupK, badRow, bad, dup: keys.filter((k, i) => keys.indexOf(k) !== i), w: W.length, v: V.length, d: D.length, k: K.length,
      emptyV: V.filter(x => !x.m || !x.c).length, emptyW: W.filter(x => !x.o || !x.m || !x.c).length,
      unbalanced: D.filter(d => d.turns.some(t => (t[1].match(/\{/g) || []).length !== (t[1].match(/\}/g) || []).length)).length };
  });
  assert.deepStrictEqual(r.bad, []); assert.deepStrictEqual(r.dup, []);
  assert.deepStrictEqual(r.tbad, [], 'บทพูดสัตว์เลี้ยง'); assert.deepStrictEqual(r.gbad, [], 'เนื้อหาไวยากรณ์'); assert(r.g >= 10);
  assert.deepStrictEqual([r.noSV, r.noEX, r.dupK, r.badRow], [[], [], [], 0], 'คันจิทุกตัวต้องมีลำดับขีดและตัวอย่างคำ และไม่ซ้ำ');
  assert.strictEqual(r.emptyV + r.emptyW + r.unbalanced, 0);
  assert(r.w >= 100 && r.v >= 100 && r.d >= 10 && r.k === 105, JSON.stringify(r));
});

test('ข้อมูล: ไฟล์ที่ index.html โหลดและ sw.js แคชตรงกัน และ VERSION ถูกรูปแบบ', async () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const srcs = [...html.matchAll(/(?:src|href)="((?:js|css|icons)\/[^"]+|manifest\.webmanifest)"/g)].map(m => m[1]);
  srcs.forEach(s => { assert(fs.existsSync(path.join(ROOT, s)), 'ไม่พบไฟล์ ' + s); assert(sw.includes(`'${s}'`), 'sw.js ไม่ได้แคช ' + s); });
  assert(/const VERSION = 'v\d+'/.test(sw));
  assert(!fs.existsSync(path.join(ROOT, 'js/app.js')), 'js/app.js ถูกแยกแล้ว ไม่ควรมีอีก');
});

test('ไอคอน: apple-touch-icon มีไฟล์เดียว ชื่อเดียวกันใน index.html sw.js และ tools/icon.html · ไอคอนใน manifest มีไฟล์จริงและ sw.js แคช', async () => {
  const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
  const files = fs.readdirSync(path.join(ROOT, 'icons')).filter(f => /^apple-touch-icon/.test(f));
  assert.strictEqual(files.length, 1, 'icons/ ต้องมี apple-touch-icon ไฟล์เดียว (ลบชื่อเก่าออก): ' + files.join(' '));
  assert.match(files[0], /^apple-touch-icon-v\d+\.png$/, 'ชื่อต้องเป็น apple-touch-icon-vN.png');
  const refs = { 'index.html': rd('index.html'), 'sw.js': rd('sw.js'), 'tools/icon.html': rd('tools/icon.html') };
  for (const [f, src] of Object.entries(refs)) {
    const names = [...new Set([...src.matchAll(/apple-touch-icon-v\d+\.png/g)].map(m => m[0]))];
    assert.deepStrictEqual(names, [files[0]], `${f} ต้องอ้าง ${files[0]} เท่านั้น (Safari เก็บไอคอนหน้าจอโฮมตามชื่อไฟล์): ${names.join(' ')}`);
  }
  const sw = rd('sw.js');
  JSON.parse(rd('manifest.webmanifest')).icons.forEach(i => { assert(fs.existsSync(path.join(ROOT, i.src)), 'ไม่พบ ' + i.src); assert(sw.includes(`'${i.src}'`), 'sw.js ไม่ได้แคช ' + i.src); });
});

test('ความปลอดภัย: แปลงข้อความเป็น HTML ด้วย esc ใน js/core.js ตัวเดียว · ชื่อที่มีแท็กแสดงเป็นตัวหนังสือ ไม่กลายเป็น HTML', async (b, base) => {
  const others = fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js') && f !== 'core.js' && /&amp;|&lt;|&#39;/.test(fs.readFileSync(path.join(ROOT, 'js', f), 'utf8')));
  assert.deepStrictEqual(others, [], 'ตัวแปลง HTML ต้องมีตัวเดียวคือ esc ใน js/core.js (ใช้ตัวนั้นแทนการเขียนใหม่)');
  const p = await fresh(b, base);
  assert.deepStrictEqual(await p.evaluate(() => [esc(`<a href="x" onclick='y'>&</a>`), esc(null), esc(undefined), esc(0), esc('ねこ')]),
    ['&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;', '', '', '0', 'ねこ']);
  const bad = '<img src=x onerror="window.__x=1">';
  await p.evaluate(b => { M.me = { name: b }; saveM(); goTab('home'); }, bad);
  assert((await p.getByTestId('home-greeting').innerText()).includes(bad), 'คำทักต้องแสดงชื่อเป็นตัวหนังสือ');
  await p.evaluate(() => goTab('me')); await p.evaluate(() => goProf());
  assert.strictEqual(await p.locator('#app img[src="x"]').count(), 0, 'ชื่อเจ้าของต้องไม่กลายเป็นแท็ก img');
  assert.strictEqual(await p.evaluate(() => window.__x), undefined);
  assert.deepStrictEqual(p.errors, []);
});

// ทุกไฟล์เป็น <script> ธรรมดาที่ใช้ตัวแปร global ร่วมกัน: ลำดับโหลดผิดหรือชื่อซ้ำข้ามไฟล์ทำให้ค่าถูกทับเงียบๆ
const scriptOrder = html => [...html.matchAll(/<script src="(js\/[^"]+)"/g)].map(m => m[1]);
function scriptOrderProblems(order, onDisk) {
  const bad = [], at = f => order.indexOf(f), data = order.filter(f => f.startsWith('js/data/')), logic = order.filter(f => !f.startsWith('js/data/') && !['js/level.js', 'js/core.js', 'js/main.js'].includes(f));
  onDisk.forEach(f => { const n = order.filter(x => x === f).length; if (n !== 1) bad.push(`index.html โหลด ${f} ${n} ครั้ง (ต้อง 1)`); });
  data.forEach(f => { if (at(f) > at('js/level.js')) bad.push(`${f} ต้องโหลดก่อน js/level.js (level.js สลับข้อมูลเป็นแพ็กระดับที่เลือก)`); });
  if (!(at('js/level.js') < at('js/core.js'))) bad.push('js/level.js ต้องโหลดก่อน js/core.js (core.js สร้าง DS จากข้อมูลที่ level.js เลือกแล้ว)');
  logic.forEach(f => { if (at(f) < at('js/core.js')) bad.push(`${f} ต้องโหลดหลัง js/core.js`); });
  if (order[order.length - 1] !== 'js/main.js') bad.push('js/main.js ต้องโหลดท้ายสุด');
  return bad;
}
function topLevelDuplicates(files) {
  const ts = require('typescript'), seen = new Map(), dup = [];
  const names = n => ts.isIdentifier(n) ? [n.text] : (n.elements || []).flatMap(e => e.name ? names(e.name) : []);
  for (const [f, src] of files) {
    const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    for (const s of sf.statements) {
      const ns = ts.isFunctionDeclaration(s) || ts.isClassDeclaration(s) ? (s.name ? [s.name.text] : []) : ts.isVariableStatement(s) ? s.declarationList.declarations.flatMap(d => names(d.name)) : [];
      const where = f + ':' + (sf.getLineAndCharacterOfPosition(s.getStart()).line + 1);
      ns.forEach(n => { if (seen.has(n)) dup.push(`${n} ประกาศซ้ำ ${seen.get(n)} และ ${where}`); else seen.set(n, where); });
    }
  }
  return dup;
}
test('โครงสร้าง: ลำดับ <script> ข้อมูล → level → core → ตรรกะ → main · ทุกไฟล์ใน js/ โหลดครั้งเดียว · ชื่อระดับบนสุดไม่ซ้ำข้ามไฟล์', async () => {
  const order = scriptOrder(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'));
  const onDisk = ['js', 'js/data'].flatMap(d => fs.readdirSync(path.join(ROOT, d)).filter(f => f.endsWith('.js')).map(f => d + '/' + f));
  assert.deepStrictEqual(scriptOrderProblems(order, onDisk), []);
  assert.deepStrictEqual(topLevelDuplicates(order.map(f => [f, fs.readFileSync(path.join(ROOT, f), 'utf8')])), []);
  // ตัวตรวจต้องจับลำดับผิดและชื่อซ้ำได้จริง
  const swap = (a, x, y) => a.map(f => f === x ? y : f === y ? x : f);
  assert.match(scriptOrderProblems(swap(order, 'js/level.js', 'js/core.js'), onDisk).join(), /level\.js ต้องโหลดก่อน js\/core\.js/);
  assert.match(scriptOrderProblems(swap(order, 'js/data/places.js', 'js/level.js'), onDisk).join(), /places\.js ต้องโหลดก่อน js\/level\.js/);
  assert.match(scriptOrderProblems(swap(order, 'js/learn.js', 'js/core.js'), onDisk).join(), /learn\.js ต้องโหลดหลัง js\/core\.js/);
  assert.match(scriptOrderProblems(swap(order, 'js/main.js', 'js/packs.js'), onDisk).join(), /main\.js ต้องโหลดท้ายสุด/);
  assert.match(scriptOrderProblems(order.filter(f => f !== 'js/shop.js'), onDisk).join(), /js\/shop\.js 0 ครั้ง/);
  assert.match(scriptOrderProblems([...order, 'js/shop.js'], onDisk).join(), /js\/shop\.js 2 ครั้ง/);
  assert.deepStrictEqual(topLevelDuplicates([['a.js', 'function x(){}\nconst {y, z: [w]} = o;'], ['b.js', 'let q = 1;\nfunction w(){}\nvar x;']]), ['w ประกาศซ้ำ a.js:2 และ b.js:2', 'x ประกาศซ้ำ a.js:1 และ b.js:3']);
});
