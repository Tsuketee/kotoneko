// ทดสอบตัวตรวจข้อมูล (tools/data-schema.js) ด้วยข้อมูลที่ผิดโดยตั้งใจ: node tests/data-schema.js
const assert = require('assert');
const { Kanji, Vocab, VocabLevel, Dialogue, validate } = require('../tools/data-schema.js');
let n = 0;
const test = (name, fn) => { fn(); n++; console.log('  ✓ ' + name); };
const rules = (schema, rec) => { const r = schema.safeParse(rec); return r.success ? [] : r.error.issues.map(i => i.message) };
const has = (list, part) => assert(list.some(m => m.includes(part)), `ต้องมี "${part}" ใน ${JSON.stringify(list)}`);

const K = { id: '日', on: 'ニチ/ジツ', kun: 'ひ・-か', meaning: 'วัน', jlpt: 'N5', strokes: 4, source: 'เขียนเอง' };
test('คันจิที่ถูกต้องผ่าน (คั่นหลายคำอ่านด้วย ・ หรือ / · คุนมี . และ - ได้ · ออนไม่มีใช้ -)', () => {
  assert.deepStrictEqual(rules(Kanji, K), []);
  assert.deepStrictEqual(rules(Kanji, { ...K, kun: 'ひと.つ' }), []);
  assert.deepStrictEqual(rules(Kanji, { ...K, on: '-' }), []);
});
test('คันจิผิด: ไม่ใช่คันจิ 1 ตัว · ออนเป็นฮิรางานะ · คุนเป็นคาตากานะหรือมีวงเล็บ · ความหมายว่าง/ไม่ใช่ไทย · ไม่มีระดับ/จำนวนขีด/แหล่งที่มา', () => {
  has(rules(Kanji, { ...K, id: '日本' }), 'คันจิ 1 ตัว');
  has(rules(Kanji, { ...K, id: 'に' }), 'คันจิ 1 ตัว');
  has(rules(Kanji, { ...K, on: 'にち' }), 'คาตากานะ');
  has(rules(Kanji, { ...K, kun: 'ヒ' }), 'ฮิรางานะ');
  has(rules(Kanji, { ...K, kun: 'ひと(つ)' }), 'ฮิรางานะ');
  has(rules(Kanji, { ...K, meaning: ' ' }), 'ความหมาย');
  has(rules(Kanji, { ...K, meaning: 'day' }), 'ภาษาไทย');
  has(rules(Kanji, { ...K, jlpt: 'N6' }), 'JLPT');
  has(rules(Kanji, { ...K, strokes: undefined }), 'จำนวนขีด');
  has(rules(Kanji, { ...K, strokes: 0 }), 'จำนวนขีด');
  has(rules(Kanji, { ...K, source: undefined }), 'แหล่งที่มา');
});
test('แหล่งที่มาเป็นตำราที่ห้ามใช้ ไม่ผ่าน (ทุกประเภทข้อมูล · ไม่สนตัวพิมพ์เล็กใหญ่ · ชื่อญี่ปุ่นด้วย) · แหล่งอื่นผ่าน', () => {
  for (const s of ['Irodori Starter บทที่ 3', 'いろどり 初級1', 'Minna no Nihongo I', 'みんなの日本語 第5課', 'GENKI II', 'げんき 3'])
    for (const [schema, rec] of [[Kanji, K], [Vocab, { word: '日本', reading: 'にほん', meaning: 'ญี่ปุ่น' }], [Dialogue, { title: 'ทัก (สุภาพ)', register: 'สุภาพ', lines: [{ speaker: 'a', text: 'b', translation: 'แปล' }] }]])
      has(rules(schema, { ...rec, source: s }), 'ห้ามใช้');
  assert.deepStrictEqual(rules(Kanji, { ...K, source: 'KANJIDIC2 (EDRDG) · ความหมายไทยเขียนเอง' }), []);
});
const W = { word: '日本', reading: 'にほん', meaning: 'ญี่ปุ่น', source: 'เขียนเอง' }, set = new Set(['日', '本', '時']);
test('คำศัพท์: ถูกต้องผ่าน · คำอ่านมีคันจิ/ตัวโรมัน/เครื่องหมายไม่ผ่าน · ความหมายไม่ใช่ไทยไม่ผ่าน', () => {
  assert.deepStrictEqual(rules(Vocab, W), []);
  has(rules(Vocab, { ...W, reading: '日ほん' }), 'คานะ');
  has(rules(Vocab, { ...W, reading: 'nihon' }), 'คานะ');
  has(rules(Vocab, { ...W, reading: 'じゃあ、また' }), 'คานะ');
  has(rules(Vocab, { ...W, meaning: '300' }), 'ภาษาไทย');
  has(rules(Vocab, { ...W, source: '' }), 'แหล่งที่มา');
});
test('คำศัพท์: คันจินอกชุดไม่ผ่าน เว้นแต่ระบุว่าเกินระดับ · 々 ไม่นับเป็นคันจิ · ยังจับได้แม้ช่องอื่นผิด', () => {
  assert.deepStrictEqual(rules(VocabLevel(set), W), []);
  has(rules(VocabLevel(set), { ...W, word: '日曜日' }), '曜');
  assert.deepStrictEqual(rules(VocabLevel(set), { ...W, word: '日曜日', beyondLevel: true }), []);
  assert.deepStrictEqual(rules(VocabLevel(set), { ...W, word: '時々' }), []);
  const out = validate({ kanji: [], vocab: [{ file: 'f', label: 'x', rec: { ...W, word: '港', source: undefined } }], dialogues: [] });
  has(out.map(e => e.rule), 'แหล่งที่มา'); has(out.map(e => e.rule), '港');
});
const D = { title: 'ทักทาย (สุภาพ)', register: 'สุภาพ', lines: [{ speaker: 'けん', text: '{今日|きょう}は。', translation: 'สวัสดี' }], source: 'เขียนเอง' };
test('บทสนทนา: ถูกต้องผ่าน · ไม่ระบุสุภาพ/กันเอง · บรรทัดไม่มีคำแปล · ฟุริงะนะไม่ใช่คานะ · ไม่มีบทพูด ไม่ผ่าน', () => {
  assert.deepStrictEqual(rules(Dialogue, D), []);
  has(rules(Dialogue, { ...D, register: undefined }), 'สุภาพ/กันเอง');
  has(rules(Dialogue, { ...D, lines: [{ speaker: 'けん', text: 'はい。' }] }), 'คำแปล');
  has(rules(Dialogue, { ...D, lines: [{ speaker: 'けん', text: '{今日|kyou}は。', translation: 'วันนี้' }] }), 'ฟุริงะนะ');
  has(rules(Dialogue, { ...D, lines: [] }), 'บทพูด');
  has(rules(Dialogue, { ...D, source: undefined }), 'แหล่งที่มา');
});
test('id คันจิซ้ำ และคำศัพท์ซ้ำ ถูกรายงาน', () => {
  const k = l => ({ file: 'js/data/kanji-n5.js', label: l, rec: K });
  const v = l => ({ file: 'js/data/content.js', label: l, rec: W });
  const out = validate({ kanji: [k('a'), k('b')], vocab: [v('c'), v('d')], dialogues: [] }).map(e => e.rule);
  has(out, 'id คันจิซ้ำ'); has(out, 'คำศัพท์ซ้ำ');
});
test('แหล่งที่มา: ใช้ค่าเริ่มต้นของไฟล์ · รายการที่ใส่เองใช้ค่าของรายการ · ไฟล์ไม่มีค่าเริ่มต้นและรายการไม่ใส่ → ไม่ผ่าน', () => {
  const { records } = require('../tools/data-schema.js');
  const app = { K: [{ k: '日', o: 'ニチ', u: 'ひ', m: 'วัน' }, { k: '本', o: 'ホン', u: 'もと', m: 'หนังสือ', src: 'อื่น' }], SV: { '日': { s: [1, 2, 3, 4] }, '本': { s: [1, 2, 3, 4, 5] } },
    W: [{ k: '日本', o: 'にほん', m: 'ญี่ปุ่น' }], V: [], D: [{ l: 1, t: 'ทัก (สุภาพ)', turns: [['a', 'b', 'แปล']] }], EX: { '日': [['日本', 'にほん', 'ญี่ปุ่น', 'o'], ['本日', 'ほんじつ', 'วันนี้', 'o', 'อื่น']] },
    SRC_KANJI: 'ค่าเริ่มต้น', SRC_CONTENT: 'เขียนเอง' };
  const r = records(app);
  assert.deepStrictEqual(r.kanji.map(k => k.rec.source), ['ค่าเริ่มต้น', 'อื่น']);
  assert.deepStrictEqual([r.vocab[0].rec.source, r.dialogues[0].rec.source], ['เขียนเอง', 'เขียนเอง']);
  assert.deepStrictEqual(r.vocab.slice(1).map(v => v.rec.source), [undefined, 'อื่น'], 'examples ไม่มีค่าเริ่มต้น (SRC_EX) ใช้ได้แค่ค่าที่ใส่เอง');
  has(validate(r).map(e => e.rule), 'ไม่มีแหล่งที่มา');
});
console.log(`\nผ่านทั้งหมด ${n} ข้อ`);
