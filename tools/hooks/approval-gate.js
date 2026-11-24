// Hook ของ Claude Code (PreToolUse: Write|Edit|MultiEdit|NotebookEdit|Bash · .claude/settings.json): ขอให้เจ้าของกดอนุมัติก่อน เมื่อ
//   - จะแก้ไฟล์ แต่ข้อความล่าสุดของเจ้าของบอกให้เสนอก่อน/ยังไม่ต้องแก้ (gate-rules.js NO_EDIT)
//   - จะแก้ js/data/ โดยข้อความล่าสุดไม่ได้อนุมัติ หรือบอกว่ายังไม่ต้องแก้ข้อมูล
//   - จะรันคำสั่ง git ที่ทับไฟล์ในเครื่อง (checkout -- <ไฟล์> · checkout -f · reset --hard · restore · clean -f · switch --discard-changes ·
//     stash ตอนมีไฟล์ค้าง) ไม่ขึ้นกับข้อความของเจ้าของ · เคยเกิด 2026-11-24: git stash + git checkout <sha> -- . ไฟล์ในเครื่องถูกแทนด้วยไฟล์รุ่นเก่า
// ตอบ permissionDecision "ask" (เจ้าของกดอนุญาตได้) · การแก้ไฟล์: ไม่มี test-results/turn-start.json = ไม่ตัดสิน · การแก้ผ่าน Bash ตรวจซ้ำที่ stop-check.js
// ทดสอบ: node tests/hooks.js
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const { readJSON, TURN } = require('../fingerprint.js');
const { noEdit, dataAllowed, isData } = require('./gate-rules.js');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.join(__dirname, '..', '..');
const readInput = () => { try { return JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { return {}; } };
const input = readInput(), ti = input.tool_input || {};
const ask = why => { process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'ask', permissionDecisionReason: why } })); process.exit(0); };

// แยกคำสั่งเป็นช่วงตาม && || ; | และขึ้นบรรทัด แล้วแยกคำ (ไม่แยกในเครื่องหมายคำพูด)
function segments(cmd) {
  const out = [];
  let words = [], w = '', q = '', has = false;
  const word = () => { if (has) words.push(w); w = ''; has = false; };
  const seg = () => { word(); if (words.length) out.push(words); words = []; };
  for (let i = 0; i < cmd.length; i++) {
    const c = cmd[i];
    if (q) { if (c === q) q = ''; else w += c; continue; }
    if (c === '"' || c === "'") { q = c; has = true; continue; }
    if (c === '\\' && i + 1 < cmd.length) { w += cmd[++i]; has = true; continue; }
    if (c === ';' || c === '\n' || c === '|' || c === '&') { seg(); continue; }
    if (/\s/.test(c)) { word(); continue; }
    w += c; has = true;
  }
  seg();
  return out;
}
const dirty = dir => { const r = spawnSync('git', ['status', '--porcelain'], { cwd: dir, encoding: 'utf8' }); return r.status !== 0 || r.stdout.trim() !== ''; };
// คืนเหตุผลถ้าคำสั่ง git ช่วงนี้ทับไฟล์ในเครื่อง ไม่งั้นคืน ''
function overwrites(words, cwd) {
  let i = 0;
  while (i < words.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[i])) i++;
  if (words[i] !== 'git') return '';
  let dir = cwd;
  for (i++; i < words.length && words[i].startsWith('-'); i++) {
    if (words[i] === '-C') dir = path.resolve(dir, words[++i] || '');
    else if (words[i] === '-c') i++;
  }
  const sub = words[i], args = words.slice(i + 1), has = (...o) => args.some(a => o.includes(a));
  if (sub === 'checkout' && (has('--', '.', '-f', '--force'))) return 'checkout ที่ระบุไฟล์ (--, .) หรือ -f เอาไฟล์จาก commit มาทับไฟล์ในเครื่อง';
  if (sub === 'switch' && has('--discard-changes', '-f', '--force')) return 'switch --discard-changes ทิ้งไฟล์ที่ยังไม่ commit';
  if (sub === 'reset' && has('--hard')) return 'reset --hard ทิ้งไฟล์ที่ยังไม่ commit';
  if (sub === 'restore' && (!has('--staged', '-S') || has('--worktree', '-W'))) return 'restore เอาไฟล์จาก commit มาทับไฟล์ในเครื่อง';
  if (sub === 'clean' && args.some(a => a === '--force' || /^-[a-z]*f/.test(a))) return 'clean -f ลบไฟล์ที่ยังไม่ได้ add';
  if (sub === 'stash') {
    const s2 = args.find(a => !a.startsWith('-'));
    if ((!s2 || s2 === 'push' || s2 === 'save') && dirty(dir)) return 'stash ย้ายไฟล์ที่ยังไม่ commit ออกจากเครื่อง (ถ้ารันคำสั่ง git อื่นต่อ ไฟล์จะถูกแทนด้วยรุ่นเก่า)';
  }
  return '';
}

if (input.tool_name === 'Bash') {
  const cwd = input.cwd || ROOT;
  for (const words of segments(String(ti.command || ''))) {
    const why = overwrites(words, cwd);
    if (why) ask(`คำสั่ง \`${words.join(' ')}\` ทับไฟล์ในเครื่อง: ${why} · งานที่ยังไม่ commit อาจหาย · ถ้าจะพักงานไว้ให้ commit แทน · ต้องให้เจ้าของอนุญาต`);
  }
  process.exit(0);
}

const turn = readJSON(ROOT, TURN);
if (!turn) process.exit(0);
const file = ti.file_path || ti.notebook_path || '';
if (noEdit(turn.prompt)) ask(`ข้อความล่าสุดของเจ้าของบอกให้เสนอก่อน/ยังไม่ต้องแก้ จะแก้ ${path.relative(ROOT, path.resolve(ROOT, file)) || 'ไฟล์'} ต้องให้เจ้าของอนุญาต`);
if (isData(path.relative(ROOT, path.resolve(ROOT, file))) && !dataAllowed(turn.prompt)) ask(`จะแก้ข้อมูล ${path.relative(ROOT, path.resolve(ROOT, file))} แต่ข้อความล่าสุดของเจ้าของไม่ได้อนุมัติให้แก้ข้อมูล (ห้ามแก้ข้อมูลเพื่อให้ผ่าน validation และห้ามแต่งคำอ่าน/ความหมายเอง) · ต้องให้เจ้าของอนุญาต`);
