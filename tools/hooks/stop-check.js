// Hook ของ Claude Code (Stop · .claude/settings.json) ตรวจก่อนจบ turn ทีละข้อ ข้อแรกที่ไม่ผ่านจะบล็อก ({"decision":"block","reason":...})
//  1. โค้ดเปลี่ยนหลัง `npm run check` ครั้งล่าสุด (test-results/check-stamp.json) และไม่ใช่โค้ดตอนเริ่ม session (session-base.json) → ต้องรัน check
//  2. ข้อความล่าสุดของเจ้าของบอกให้เสนอก่อน/ยังไม่ต้องแก้ แต่โค้ดเปลี่ยนใน turn นี้ (turn-start.json · prompt-start.js)
//  3. js/data/ เปลี่ยนใน turn นี้ แต่ข้อความล่าสุดของเจ้าของไม่ได้อนุมัติให้แก้ข้อมูล
//  4. โค้ดเปลี่ยนใน turn นี้ แต่ข้อความสุดท้าย (last_assistant_message) ไม่มีผล test (gate-rules.js EVIDENCE)
//  5. ไฟล์หน้าจอ (js/ นอก js/data/ และ css/) เปลี่ยนใน turn นี้ แต่ข้อความสุดท้ายไม่อ้างภาพใน test-results/ (gate-rules.js SHOT) และไม่ได้ส่งภาพให้เจ้าของ (SendUserFile ใน transcript หลังข้อความล่าสุดของเจ้าของ)
// ถ้าถูกบล็อกไปแล้วรอบหนึ่ง (stop_hook_active) จะปล่อยให้จบ แต่แจ้งเจ้าของทาง systemMessage แทน (กันวนไม่รู้จบ)
// ทดสอบ: node tests/hooks.js
const fs = require('fs'), path = require('path');
const { fingerprint, readJSON, STAMP, BASE, TURN } = require('../fingerprint.js');
const { noEdit, dataAllowed, isUi, EVIDENCE, SHOT } = require('./gate-rules.js');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.join(__dirname, '..', '..');

const readInput = () => { try { return JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { return {}; } };
const input = readInput();
// ส่งภาพให้เจ้าของแล้วหรือยัง: หา SendUserFile ที่มีไฟล์ภาพ ย้อนจากท้าย transcript จนถึงข้อความล่าสุดของเจ้าของ
const sentImage = file => {
  let rows;
  try { rows = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return {}; } }); } catch { return false; }
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i], c = r.message && r.message.content;
    if (r.type === 'user' && !r.isMeta && (typeof c === 'string' || (Array.isArray(c) && !c.some(x => x.type === 'tool_result')))) return false;
    if (r.type === 'assistant' && Array.isArray(c) && c.some(x => x.type === 'tool_use' && x.name === 'SendUserFile' && ((x.input || {}).files || []).some(f => /\.(png|jpe?g|webp)$/i.test(f)))) return true;
  }
  return false;
};

const now = fingerprint(ROOT).hash;
const stamp = readJSON(ROOT, STAMP), base = readJSON(ROOT, BASE), turn = readJSON(ROOT, TURN);
const problems = [];

if (!((stamp && stamp.hash === now) || (base && base.hash === now))) {
  const last = stamp ? `ครั้งล่าสุดรันเมื่อ ${stamp.at} (${stamp.passed ? 'ผ่านทุกขั้น' : 'ไม่ผ่าน: ' + stamp.failed.join(' ')}) แต่โค้ดเปลี่ยนหลังจากนั้น` : 'ยังไม่เคยรันใน session นี้';
  problems.push(`โค้ดเปลี่ยนแต่ยังไม่ได้รัน npm run check กับโค้ดชุดนี้ (${last}) · รัน npm run check ให้ครบทุกขั้น แล้วรายงานตารางผลให้เจ้าของก่อนจบ ห้ามบอกว่าเสร็จถ้ามีขั้นที่ไม่ผ่าน`);
} else if (turn) {
  const changed = turn.hash !== now, dataChanged = turn.data !== fingerprint(ROOT, 'js/data/').hash;
  if (changed && noEdit(turn.prompt))
    problems.push('ข้อความล่าสุดของเจ้าของบอกให้เสนอก่อน/ยังไม่ต้องแก้ แต่ไฟล์เปลี่ยนใน turn นี้ · บอกเจ้าของตรงๆ ว่าแก้ไฟล์ไหนไป แล้วถามว่าจะเก็บหรือย้อนกลับ');
  else if (dataChanged && !dataAllowed(turn.prompt))
    problems.push('ข้อมูลใน js/data/ เปลี่ยนใน turn นี้ แต่ข้อความล่าสุดของเจ้าของไม่ได้อนุมัติให้แก้ข้อมูล · บอกเจ้าของว่าแก้รายการไหน และอ้างคำอนุมัติของเจ้าของ (ห้ามแต่งคำอ่าน/ความหมายเอง)');
  else if (changed && typeof input.last_assistant_message === 'string' && !EVIDENCE.test(input.last_assistant_message))
    problems.push('โค้ดเปลี่ยนใน turn นี้ แต่ข้อความสุดท้ายไม่มีผล test · แนบบรรทัดสรุปจริง (เช่น `ผ่านทั้งหมด 60 ข้อ` หรือตารางขั้นของ npm run check) ตาม Definition of Done');
  else if (turn.ui && turn.ui !== fingerprint(ROOT, isUi).hash && typeof input.last_assistant_message === 'string' && !SHOT.test(input.last_assistant_message) && !sentImage(input.transcript_path))
    problems.push('แก้หน้าจอ (js/ หรือ css/) ใน turn นี้ แต่ข้อความสุดท้ายไม่มีภาพหน้าจอ · เปิดภาพใน test-results/ ด้วย Read แล้วอ้างชื่อไฟล์ (เช่น `test-results/e2e/09-shop-end-p1.png`) หรือส่งภาพให้เจ้าของด้วย SendUserFile ตาม Definition of Done');
}

if (!problems.length) process.exit(0);
if (input.stop_hook_active) {
  process.stdout.write(JSON.stringify({ systemMessage: '⚠️ ' + problems.join(' · ') }));
  process.exit(0);
}
process.stdout.write(JSON.stringify({ decision: 'block', reason: problems.join('\n') }));
