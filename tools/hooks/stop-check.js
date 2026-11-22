// Hook ของ Claude Code (Stop · .claude/settings.json): ไม่ให้จบ turn ถ้าโค้ดเปลี่ยนหลัง `npm run check` ครั้งล่าสุด
// ผ่าน (ไม่พิมพ์อะไร) เมื่อโค้ดตอนนี้ตรงกับที่ npm run check ตรวจครั้งล่าสุด (test-results/check-stamp.json)
//   หรือตรงกับตอนเริ่ม session (test-results/session-base.json · tools/hooks/session-base.js) คือยังไม่ได้แก้อะไร
// ไม่ผ่าน → {"decision":"block","reason":...} Claude ต้องรัน npm run check แล้วรายงานผลก่อนจบ
// ถ้าถูกบล็อกไปแล้วรอบหนึ่ง (stop_hook_active) แต่ยังไม่ได้รัน จะปล่อยให้จบ แต่แจ้งเจ้าของทาง systemMessage แทน (กันวนไม่รู้จบ)
// ทดสอบ: node tests/hooks.js
const fs = require('fs'), path = require('path');
const { fingerprint, readJSON, STAMP, BASE } = require('../fingerprint.js');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.join(__dirname, '..', '..');

const readInput = () => { try { return JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { return {}; } };
const input = readInput();

const now = fingerprint(ROOT).hash;
const stamp = readJSON(ROOT, STAMP), base = readJSON(ROOT, BASE);
if ((stamp && stamp.hash === now) || (base && base.hash === now)) process.exit(0);

const last = stamp ? `ครั้งล่าสุดรันเมื่อ ${stamp.at} (${stamp.passed ? 'ผ่านทุกขั้น' : 'ไม่ผ่าน: ' + stamp.failed.join(' ')}) แต่โค้ดเปลี่ยนหลังจากนั้น` : 'ยังไม่เคยรันใน session นี้';
if (input.stop_hook_active) {
  process.stdout.write(JSON.stringify({ systemMessage: `⚠️ โค้ดเปลี่ยนแต่ยังไม่ได้รัน npm run check · ${last}` }));
  process.exit(0);
}
process.stdout.write(JSON.stringify({
  decision: 'block',
  reason: `โค้ดเปลี่ยนแต่ยังไม่ได้รัน npm run check กับโค้ดชุดนี้ (${last}) · รัน npm run check ให้ครบทุกขั้น แล้วรายงานตารางผลให้เจ้าของก่อนจบ ห้ามบอกว่าเสร็จถ้ามีขั้นที่ไม่ผ่าน`,
}));
