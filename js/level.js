// ระดับเนื้อหา: N5 อยู่ในแอป (ฟรี) ส่วนระดับเสียเงิน (N4 …) เป็น "แพ็ก" ที่ดาวน์โหลดหลังได้สิทธิ์ เก็บใน localStorage key kn_pack_<ระดับ>
// ⚠️ ไฟล์นี้ต้องโหลดหลังไฟล์ใน js/data/ ทั้งหมด และก่อน core.js: ถ้าผู้ใช้เลือกระดับเสียเงินไว้ จะสลับข้อมูล K W V EX SV G D DT
//    เป็นของแพ็กก่อนที่ core.js สร้าง DS แอปจึงทำงานทีละระดับด้วยโค้ดเดิม (เปลี่ยนระดับ = โหลดหน้าใหม่)
// ความคืบหน้าแต่ละระดับแยก key กัน (LKEY) ทุก key อยู่ใน PK (stats.js) เพื่อส่งออกและซิงก์ ส่วน kn_level / kn_pack_* / kn_packs ไม่ใช่ความคืบหน้า
const LEVELS = { n5: { n: 'N5', g: '五' }, n4: { n: 'N4', g: '四' }, n3: { n: 'N3', g: '三' } };
const LKEY = { n5: { k: 'kn5', w: 'kw1', v: 'kv1', g: 'kg1' }, n4: { k: 'kn4', w: 'kw4', v: 'kv4', g: 'kg4' }, n3: { k: 'kn3', w: 'kw3', v: 'kv3', g: 'kg3' } };
const LVK = 'kn_level', PACKK = l => 'kn_pack_' + l;
let LV = 'n5';

// แปลงแพ็ก (ข้อความดิบรูปแบบเดียวกับไฟล์ข้อมูล N5) เป็นข้อมูลที่แอปใช้ ด้วยตัวแปลงเดียวกับ N5 · ไม่สมบูรณ์จะโยน error
function packParse(p) {
  if (!p || p.format !== 1 || !LKEY[p.level] || p.level === 'n5' || !Number.isInteger(p.version)) throw new Error('รูปแบบแพ็กไม่ถูกต้อง');
  const txt = s => String(s || '').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#')).join('\n');
  const rows = s => txt(s) ? txt(s).split('\n') : [];
  const K2 = rows(p.kanji).map(l => { const [k, o, u, m, c] = l.split(','); return { k, o, u, m, c } });
  const EX2 = {}; rows(p.examples).forEach(l => { const i = l.indexOf(':'); EX2[l.slice(0, i)] = l.slice(i + 1).split(';').map(s => s.split('|')) });
  const x = { K: K2, EX: EX2, W: rows(p.vocabW).length ? parseW(txt(p.vocabW)) : [], V: rows(p.vocabV).length ? parseV(txt(p.vocabV)) : [],
    G: rows(p.grammar).length ? parseG(txt(p.grammar)) : [], D: rows(p.dialogue).length ? parseD(txt(p.dialogue)) : [], DT: p.topics || {}, SV: p.strokes || {} };
  const ok = x.K.length && x.K.every(r => r.k && r.o && r.m) && x.W.length && x.W.every(r => r.k && r.o && r.m)
    && x.V.length && x.V.every(r => r.k && r.m) && x.G.length && x.G.every(g => g.id && g.qs.length) && x.D.length && x.D.every(d => d.turns.length);
  if (!ok) throw new Error('แพ็กไม่มีเนื้อหาครบ');
  return x;
}
// ใส่ข้อมูลแพ็กแทนที่ข้อมูล N5 (W V G D เป็น const จึงแก้ในที่ ส่วน K เป็น let)
function packApply(x) {
  K = x.K;
  for (const [a, b] of [[W, x.W], [V, x.V], [G, x.G], [D, x.D]]) { a.length = 0; a.push(...b) }
  Object.assign(EX, x.EX); Object.assign(SV, x.SV);
  for (const k in DT) delete DT[k];
  Object.assign(DT, x.DT);
}
try {
  const lv = localStorage.getItem(LVK);
  if (lv && lv !== 'n5') { packApply(packParse(JSON.parse(localStorage.getItem(PACKK(lv)) || 'null'))); LV = lv }
} catch (e) { try { localStorage.setItem(LVK, 'n5') } catch (_) {} }
