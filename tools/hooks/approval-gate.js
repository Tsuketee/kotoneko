// Hook ของ Claude Code (PreToolUse: Write|Edit|MultiEdit|NotebookEdit · .claude/settings.json): ขอให้เจ้าของกดอนุมัติก่อนแก้ไฟล์ เมื่อ
//   - ข้อความล่าสุดของเจ้าของบอกให้เสนอก่อน/ยังไม่ต้องแก้ (gate-rules.js NO_EDIT)
//   - จะแก้ js/data/ โดยข้อความล่าสุดไม่ได้อนุมัติ หรือบอกว่ายังไม่ต้องแก้ข้อมูล
// ตอบ permissionDecision "ask" (เจ้าของกดอนุญาตได้) · ไม่มี test-results/turn-start.json = ไม่ตัดสิน · การแก้ผ่าน Bash ตรวจซ้ำที่ stop-check.js
const fs = require('fs'), path = require('path');
const { readJSON, TURN } = require('../fingerprint.js');
const { noEdit, dataAllowed, isData } = require('./gate-rules.js');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.join(__dirname, '..', '..');
const readInput = () => { try { return JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { return {}; } };
const input = readInput(), turn = readJSON(ROOT, TURN);
if (!turn) process.exit(0);
const ti = input.tool_input || {}, file = ti.file_path || ti.notebook_path || '';
const ask = why => { process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'ask', permissionDecisionReason: why } })); process.exit(0); };
if (noEdit(turn.prompt)) ask(`ข้อความล่าสุดของเจ้าของบอกให้เสนอก่อน/ยังไม่ต้องแก้ จะแก้ ${path.relative(ROOT, path.resolve(ROOT, file)) || 'ไฟล์'} ต้องให้เจ้าของอนุญาต`);
if (isData(path.relative(ROOT, path.resolve(ROOT, file))) && !dataAllowed(turn.prompt)) ask(`จะแก้ข้อมูล ${path.relative(ROOT, path.resolve(ROOT, file))} แต่ข้อความล่าสุดของเจ้าของไม่ได้อนุมัติให้แก้ข้อมูล (ห้ามแก้ข้อมูลเพื่อให้ผ่าน validation และห้ามแต่งคำอ่าน/ความหมายเอง) · ต้องให้เจ้าของอนุญาต`);
