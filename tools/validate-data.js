// npm run validate:data: ตรวจข้อมูลคันจิ คำศัพท์ บทสนทนา ตาม schema ใน tools/data-schema.js
// พิมพ์ตาราง ไฟล์ | รายการ | ผิดกฎข้อไหน + สรุปจำนวนต่อกฎ · รายงานเต็มอยู่ที่ test-results/validate-data.md · ผิดแม้ข้อเดียว → exit 1
// สคริปต์นี้ไม่แก้ข้อมูล
const fs = require('fs'), path = require('path');
const { loadApp, records, validate } = require('./data-schema.js');
const ROOT = path.join(__dirname, '..');

const recs = records(loadApp(ROOT)), errs = validate(recs);
const n = { kanji: recs.kanji.length, vocab: recs.vocab.length, dialogues: recs.dialogues.length };
const head = `ตรวจคันจิ ${n.kanji} ตัว · คำศัพท์ ${n.vocab} คำ · บทสนทนา ${n.dialogues} บท`;
const byRule = {};
for (const e of errs) { const k = e.file + ' | ' + e.rule.replace(/:.*?\(/, ' ('); byRule[k] = (byRule[k] || 0) + 1 }   // รวมกฎเดียวกันที่ต่างแค่รายละเอียด (เช่น คันจิตัวไหน)
const summary = ['| ไฟล์ | ผิดกฎข้อไหน | จำนวน |', '|---|---|---|', ...Object.entries(byRule).sort((a, b) => b[1] - a[1]).map(([k, c]) => `| ${k} | ${c} |`)];
const table = ['| ไฟล์ | รายการ | ผิดกฎข้อไหน |', '|---|---|---|', ...errs.map(e => `| ${e.file} | ${e.item.replace(/\|/g, '/')} | ${e.rule} |`)];
const report = [`# รายงานตรวจข้อมูล (npm run validate:data)`, '', head, '', errs.length ? `ไม่ผ่าน ${errs.length} จุด` : 'ผ่านทั้งหมด', '', '## สรุปตามกฎ', '', ...summary, '', '## ทุกจุด', '', ...table, ''].join('\n');
fs.mkdirSync(path.join(ROOT, 'test-results'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'test-results', 'validate-data.md'), report);
console.log(head);
if (!errs.length) { console.log('✓ ผ่านทั้งหมด'); process.exit(0) }
const LIMIT = 40;
console.log('\n' + summary.join('\n') + '\n\n' + table.slice(0, LIMIT + 2).join('\n') + (errs.length > LIMIT ? `\n… อีก ${errs.length - LIMIT} จุด` : ''));
console.error(`\n✗ ไม่ผ่าน ${errs.length} จุด · รายงานเต็ม: test-results/validate-data.md`);
process.exit(1);
