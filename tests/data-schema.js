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
console.log(`\nผ่านทั้งหมด ${n} ข้อ`);
