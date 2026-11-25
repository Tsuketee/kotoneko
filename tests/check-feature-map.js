// บรรทัด **test** ของ FEATURE_MAP.md ต้องชี้ไปที่ข้อทดสอบที่มีอยู่จริง:
//   - `e2e.js "<คำ>"` ต้องมีข้อใน tests/e2e.js หรือ tests/e2e/*.js ที่ชื่อมีคำนั้น (ใช้คำเดียวกันรันได้: node tests/e2e.js "<คำ>")
//   - `flows.js` ตามด้วยรหัสข้อ เช่น 05-write-pen ต้องมีข้อนั้นใน tests/flows.js
//   - ห้ามอ้างด้วยเลขบรรทัด (`e2e.js:123`) เพราะเลื่อนทุกครั้งที่แก้ไฟล์
// ตัวเลขเกม (ราคาอาหาร กติกาโคบัง ราคาของ ฯลฯ) ที่ FEATURE_MAP เขียนไว้ต้องตรงกับ KB KBI FOOD FMAX (js/koban.js) และ KBN_BAG (js/konbini.js) · ทดสอบใน tests/hooks.js
// รัน: node tests/check-feature-map.js [FEATURE_MAP.md]
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const map = process.argv[2] || path.join(ROOT, 'FEATURE_MAP.md');
const names = file => [...fs.readFileSync(path.join(ROOT, 'tests', file), 'utf8').matchAll(/^test\('([^']+)'/gm)].map(m => m[1]);
const e2e = [...names('e2e.js'), ...fs.readdirSync(path.join(ROOT, 'tests', 'e2e')).filter(f => f.endsWith('.js')).flatMap(f => names('e2e/' + f))], flows = names('flows.js');
const bad = [];
let refs = 0;
fs.readFileSync(map, 'utf8').split('\n').forEach((line, i) => {
  if (!line.startsWith('- **test**')) return;
  const at = `${path.basename(map)}:${i + 1}`;
  for (const m of line.matchAll(/`(?:e2e\.js)?:\d+`/g)) bad.push(`${at} อ้างด้วยเลขบรรทัด ${m[0]} · ให้ใช้ \`e2e.js "<คำในชื่อข้อ>"\` แทน`);
  for (const [, word] of line.matchAll(/`e2e\.js "([^"]+)"`/g)) {
    refs++;
    if (!e2e.some(n => n.includes(word))) bad.push(`${at} ไม่มีข้อใน tests/e2e.js ที่ชื่อมีคำว่า "${word}" (ชื่อข้อถูกเปลี่ยนหรือข้อถูกลบ?)`);
  }
  const fl = line.split('`flows.js`')[1];
  if (fl) for (const [id] of fl.matchAll(/\b\d\d[a-z]?-[a-z0-9-]+/g)) {
    refs++;
    if (!flows.includes(id)) bad.push(`${at} ไม่มีข้อ ${id} ใน tests/flows.js`);
  }
});

// ---------- ตัวเลขเกมที่ FEATURE_MAP เขียนไว้ต้องตรงกับโค้ด: KB KBI FOOD FMAX (js/koban.js) · KBN_BAG (js/konbini.js) ----------
const vm = require('vm');
const ctx = vm.createContext({ window: {} });
for (const f of ['js/koban.js', 'js/konbini.js', 'js/netshop.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
const { KB, KBI, FOOD, FMAX, KBN_BAG, NS_SHIP } = vm.runInContext('({ KB, KBI, FOOD, FMAX, KBN_BAG, NS_SHIP })', ctx);
const lines = fs.readFileSync(map, 'utf8').split('\n'), base = path.basename(map);
const fixRe = `ถ้าเปลี่ยนถ้อยคำใน FEATURE_MAP ให้แก้ NUMS ใน tests/check-feature-map.js ตาม`;
let nums = 0;
// หาทุกบรรทัดที่ตรง re (ต้องเจออย่างน้อย 1) แล้วส่ง [ตำแหน่ง, ผลจับ] ให้ fn
const each = (desc, re, fn) => {
  const hits = lines.flatMap((l, i) => [...l.matchAll(new RegExp(re.source, 'gu'))].map(m => [`${base}:${i + 1}`, m]));
  if (!hits.length) return bad.push(`หาไม่เจอใน ${base}: ${desc} ${re} · ${fixRe}`);
  for (const [at, m] of hits) { nums++; fn(at, m); }
};
const coat = id => KBI.find(x => x.id === id);
const prices = t => [...new Set(KBI.filter(x => x.t === t && x.p && !x.r && !x.goal).map(x => x.p))];
const range = t => { const p = KBI.filter(x => x.t === t && x.p).map(x => x.p); return `${Math.min(...p)}–${Math.max(...p)}`; };
const NUMS = [
  // [ชื่อค่าในโค้ด, ค่าในโค้ด, ประโยคใน FEATURE_MAP (กลุ่มที่ 1 = ตัวเลข)]
  ['KB.mast', KB.mast, /จำได้แม่นข้อใหม่ \+(\d+)/],
  ['KB.claim', KB.claim, /รับภารกิจ \+(\d+)/],
  ['KB.claim', KB.claim, /ความสนิท \+(\d+) โคบัง/],
  ['KB.all3', KB.all3, /ครบ 3 อย่างในวันเดียว \+(\d+)/],
  ['KB.s7', KB.s7, /สตรีค 7 วัน \+(\d+)/],
  ['KB.s30', KB.s30, /และ 30 วัน \+(\d+)/],
  ['KB.keep', KB.keep, /ยาวเกิน (\d+) รายการ/],
  ['KB.days', KB.days, /เก่ากว่า (\d+) วัน/],
  ['KB.bag', KB.bag, /ถุงโชคดีราคา (\d+)/],
  ['FMAX', FMAX, /ชนิดละไม่เกิน (\d+)/],
  ['KBN_BAG', KBN_BAG, /\(ถุง (\d+) Energy\)/],
  ['KBI coat:siamese p', coat('coat:siamese').p, /หายาก วิเชียรมาศ (\d+)/],
  ['KBI coat:calico goal', coat('coat:calico').goal, /สามสีได้เมื่อจำได้แม่นครบ (\d+) ข้อ/],
  ['KBI ลายขนทั่วไป (coat ที่ไม่หายาก) p', prices('coat').join('/'), /\*\*ราคา\*\*: ลายขน (\d+)/],
  ['KBI เครื่องประดับ (acc) p', prices('acc').join('/'), /เครื่องประดับ (\d+)/],
  ['KBI ของแต่งห้อง (room) p', range('room'), /ของแต่งห้อง (\d+–\d+)/],
  // ร้านออนไลน์ (js/netshop.js): เวลาส่ง ค่าส่งด่วน ราคาของเล่น และอาหารต่างประเทศ (เจ้าของตอบ 2026-11-24)
  ['NS_SHIP.std.h', NS_SHIP.std.h, /ส่งปกติ (\d+) ชม\./],
  ['NS_SHIP.exp.h', NS_SHIP.exp.h, /ส่งด่วน (\d+) ชม\./],
  ['NS_SHIP.exp.en', NS_SHIP.exp.en, /\+(\d+) Energy ถ้ามีอาหาร/],
  ['NS_SHIP.exp.kb', NS_SHIP.exp.kb, /\+(\d+) โคบัง ถ้ามีของอื่น/],
  ...KBI.filter(x => x.t === 'toy').map(x => [`KBI ${x.id} p`, x.p, new RegExp(x.n + ' (\\d+) โคบัง')]),
  ...FOOD.filter(f => f.src === 'net').map(f => [`FOOD ${f.k} e`, f.e, new RegExp(f.n + ' (\\d+) Energy')]),
];
for (const [name, val, re] of NUMS) each(name, re, (at, m) => { if (m[1] !== String(val)) bad.push(`${at} "${m[0]}" ไม่ตรงโค้ด: ${name} = ${val}`); });
// อาหารในร้านค้าแอป (FOOD ที่ไม่มี src) ตามลำดับ: "<ชื่อ> <Energy> (สนิท +<ความสนิท> หิว −<ความหิวที่ลด>)"
const app = FOOD.filter(f => !f.src);
each('รายการอาหาร', /\*\*Energy และอาหาร\*\*: (.+)/, (at, m) => {
  const fm = m[1].split(' · ').map(s => /(?:^|: )([^:]+?) (\d+) \((?:สนิท )?\+(\d+) (?:หิว )?−(\d+)\)$/.exec(s)).filter(Boolean);
  if (fm.length !== app.length) bad.push(`${at} เขียนราคาอาหารไว้ ${fm.length} ชนิด แต่โค้ด FOOD (ร้านค้าแอป · ไม่นับ src) มี ${app.length} ชนิด: ${app.map(f => f.n).join(' ')}`);
  fm.forEach((x, i) => {
    const f = app[i];
    if (!f) return;
    if (!f.n.startsWith(x[1])) bad.push(`${at} อาหารลำดับที่ ${i + 1} "${x[1]}" แต่โค้ด FOOD ลำดับนี้คือ ${f.k} (${f.n})`);
    else if ([x[2], x[3], x[4]].join() !== [f.e, f.b, f.h].join()) bad.push(`${at} "${x[0].replace(/^: /, '')}" ไม่ตรงโค้ด: FOOD ${f.k} (${f.n}) e = ${f.e} b = +${f.b} h = −${f.h}`);
  });
});
if (bad.length) {
  console.error('FEATURE_MAP.md ไม่ตรงกับ test หรือโค้ด:\n  ' + bad.join('\n  ') + `\n\nไม่ผ่าน ${bad.length} จุด`);
  process.exit(1);
}
console.log(`ผ่านทั้งหมด ${refs} จุด (ทุกข้อที่ FEATURE_MAP อ้างมีอยู่จริงใน tests/e2e.js และ tests/flows.js) · ตัวเลขเกม ${nums} จุดตรงกับ js/koban.js และ js/konbini.js`);
