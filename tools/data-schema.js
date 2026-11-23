// schema ของข้อมูลหลัก (คันจิ คำศัพท์ บทสนทนา) ใช้ใน tools/validate-data.js (npm run validate:data) และ tests/data-schema.js
// โหลดไฟล์ข้อมูลในแอป (classic script) แล้วแปลงเป็นระเบียนมาตรฐานก่อนตรวจ · ช่องที่ไฟล์ข้อมูลยังไม่มี (เช่น แหล่งที่มา) จะเป็น undefined และไม่ผ่าน
const fs = require('fs'), path = require('path'), vm = require('vm');
const { z } = require('zod');

// ---------- ตัวอักษร ----------
const KANJI1 = /^\p{Script=Han}$/u;                       // คันจิ 1 ตัว (1 code point)
const KATA = /^[ァ-ヺー]+$/u;                 // คาตากานะ + ー
const HIRA_KUN = /^[ぁ-ゖ.-]+$/u;                 // ฮิรางานะ + . (แยกโอกุริงานะ) + - (หน่วยคำต่อหน้า/หลัง)
const KANA = /^[ぁ-ゖァ-ヺー]+$/u;    // ฮิรางานะหรือคาตากานะ (+ ー)
const KANA_PHRASE = /^[ぁ-ゖァ-ヺー、。！？]+$/u;   // คำอ่านคำศัพท์: คานะ + เครื่องหมายวรรคตอนญี่ปุ่นของวลี (เจ้าของอนุมัติ 2026-11-23)
const HAS_KANA = /[ぁ-ゖァ-ヺ]/u;
const THAI = /[ก-๛]/u;
const SEP = /[・/]/u;                                      // ตัวคั่นหลายคำอ่านในช่องเดียว
const NONE = '-';                                          // ไม่มีคำอ่านแบบนี้

const thai = z.string().trim().min(1, 'ความหมายภาษาไทยว่าง').regex(THAI, 'ความหมายต้องมีภาษาไทย');
// ตำราเชิงพาณิชย์ที่ห้ามใช้เนื้อหา (CLAUDE.md · NOTICE.md) ชื่อเหล่านี้จึงเป็นแหล่งที่มาไม่ได้
const BANNED = /irodori|いろどり|minna\s*no\s*nihongo|みんなの日本語|genki|げんき/iu;
const source = z.string({ error: 'ไม่มีแหล่งที่มา' }).trim().min(1, 'แหล่งที่มาว่าง')
  .refine(s => !BANNED.test(s), 'แหล่งที่มาเป็นตำราที่ห้ามใช้เนื้อหา (Irodori · Minna no Nihongo · Genki) ต้องเขียนเองหรือใช้ข้อมูลเปิดที่อนุญาตเชิงพาณิชย์');
const readings = (re, msg) => z.string().min(1, 'คำอ่านว่าง').refine(s => s === NONE || s.split(SEP).every(r => re.test(r)), msg);

const Kanji = z.object({
  id: z.string().regex(KANJI1, 'ต้องเป็นคันจิ 1 ตัว'),
  on: readings(KATA, 'อ่านแบบออนต้องเป็นคาตากานะเท่านั้น'),
  kun: readings(HIRA_KUN, 'อ่านแบบคุนต้องเป็นฮิรางานะ (อนุญาต . และ - เท่านั้น)'),
  meaning: thai,
  jlpt: z.enum(['N5', 'N4', 'N3', 'N2', 'N1'], { error: 'ระดับ JLPT ไม่ถูกต้อง' }),
  strokes: z.number({ error: 'ไม่มีจำนวนขีด' }).int().positive('จำนวนขีดต้องมากกว่า 0'),
  source,
});

const Vocab = z.object({
  word: z.string().trim().min(1, 'คำว่าง'),
  reading: z.string().regex(KANA_PHRASE, 'คำอ่านต้องเป็นคานะเท่านั้น (อนุญาต 、。！？ ของวลี)').regex(HAS_KANA, 'คำอ่านต้องมีคานะ'),
  meaning: thai,
  beyondLevel: z.boolean().optional(),
  source,
});
// แยกจาก Vocab เพราะ zod ไม่รันกฎระดับทั้งระเบียนเมื่อช่องอื่นผิดอยู่ (เช่น ไม่มีแหล่งที่มา) กฎนี้จะถูกซ่อน
const VocabLevel = kanjiSet => z.object({ word: z.string(), beyondLevel: z.boolean().optional() }).superRefine((v, ctx) => {
  const out = [...v.word].filter(c => c !== '々' && KANJI1.test(c) && !kanjiSet.has(c));   // 々 = เครื่องหมายซ้ำตัวหน้า ไม่ใช่คันจิที่ต้องเรียน
  if (out.length && !v.beyondLevel) ctx.addIssue({ code: 'custom', path: ['word'], message: `ใช้คันจิที่ไม่มีในชุดคันจิ: ${[...new Set(out)].join(' ')} (หรือระบุว่าเกินระดับ)` });
});

const FURI = /\{([^|}]+)\|([^}]*)\}/gu;
const Line = z.object({
  speaker: z.string().trim().min(1, 'ไม่มีชื่อผู้พูด'),
  text: z.string().trim().min(1, 'ประโยคว่าง').refine(t => [...t.matchAll(FURI)].every(m => KANA.test(m[2])), 'ฟุริงะนะต้องเป็นคานะ'),
  translation: z.string({ error: 'ไม่มีคำแปล' }).trim().min(1, 'คำแปลว่าง').regex(THAI, 'คำแปลต้องมีภาษาไทย'),
});
const Dialogue = z.object({
  title: z.string().trim().min(1, 'ไม่มีชื่อบท'),
  register: z.enum(['สุภาพ', 'กันเอง'], { error: 'ไม่ได้ระบุแบบสุภาพ/กันเอง' }),
  lines: z.array(Line).min(1, 'ไม่มีบทพูด'),
  source,
});

// ---------- โหลดไฟล์ข้อมูลของแอป ----------
const DATA = ['js/data/kanji-n5.js', 'js/data/content.js', 'js/data/examples.js', 'js/data/strokes.js'];
function loadApp(root) {
  const ctx = vm.createContext({});
  for (const f of DATA) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
  const src = n => `typeof ${n} === 'undefined' ? undefined : ${n}`;
  return vm.runInContext(`({ K, W, V, D, EX, SV, SRC_KANJI: ${src('SRC_KANJI')}, SRC_CONTENT: ${src('SRC_CONTENT')}, SRC_EX: ${src('SRC_EX')} })`, ctx);
}

// แปลงข้อมูลแอปเป็นระเบียนมาตรฐาน · file = ไฟล์ต้นทาง · label = ใช้อ้างในรายงาน
function records(app, level = 'N5') {
  const kanji = app.K.map((k, i) => ({
    file: 'js/data/kanji-n5.js', label: `แถว ${i + 1} ${k.k}`,
    rec: { id: k.k, on: k.o, kun: k.u, meaning: k.m, jlpt: level, strokes: app.SV[k.k] ? app.SV[k.k].s.length : undefined, source: k.src || app.SRC_KANJI },
  }));
  const vocab = [
    ...app.W.map((w, i) => ({ file: 'js/data/content.js', label: `W แถว ${i + 1} ${w.k}`, rec: { word: w.k, reading: w.o, meaning: w.m, source: w.src || app.SRC_CONTENT } })),
    ...app.V.map((v, i) => ({ file: 'js/data/content.js', label: `V แถว ${i + 1} ${v.k}`, rec: { word: v.k, reading: v.o, meaning: v.m, source: v.src || app.SRC_CONTENT } })),
    ...Object.entries(app.EX).flatMap(([k, xs]) => xs.map(([word, reading, meaning, , src, flag], j) => ({ file: 'js/data/examples.js', label: `${k} ตัวอย่างที่ ${j + 1} ${word}`, rec: { word, reading, meaning, source: src || app.SRC_EX, ...(flag ? { beyondLevel: flag === 'เกินระดับ' } : {}) } }))),
  ];
  const dialogues = app.D.map((d, i) => {
    const m = /\((สุภาพ|กันเอง)\)\s*$/u.exec(d.t || '');
    return {
      file: 'js/data/content.js', label: `บทที่ ${i + 1} (หมวด ${d.l}) ${d.t}`,
      rec: { title: d.t, register: m ? m[1] : undefined, lines: d.turns.map(([speaker, text, translation]) => ({ speaker, text, translation })), source: d.src || app.SRC_CONTENT },
    };
  });
  return { kanji, vocab, dialogues };
}

// ตรวจทั้งหมด → [{file, item, rule}]
function validate({ kanji, vocab, dialogues }) {
  const out = [], kanjiSet = new Set(kanji.map(k => k.rec.id)), VL = VocabLevel(kanjiSet);
  const check = (schema, { file, label, rec }) => {
    const r = schema.safeParse(rec);
    if (!r.success) for (const is of r.error.issues) out.push({ file, item: label + (is.path.length ? ' · ' + is.path.join('.') : ''), rule: is.message });
  };
  const dup = (list, key, what) => {
    const seen = new Map();
    for (const x of list) { const k = key(x); if (seen.has(k)) out.push({ file: x.file, item: x.label, rule: `${what}ซ้ำกับ ${seen.get(k)}` }); else seen.set(k, x.label) }
  };
  kanji.forEach(k => check(Kanji, k)); dup(kanji, k => k.rec.id, 'id คันจิ');
  vocab.forEach(v => { check(Vocab, v); check(VL, v) }); dup(vocab.filter(v => v.file === 'js/data/content.js'), v => v.rec.word, 'คำศัพท์');
  dialogues.forEach(d => check(Dialogue, d));
  return out;
}

module.exports = { Kanji, Vocab, VocabLevel, Dialogue, loadApp, records, validate, DATA };
