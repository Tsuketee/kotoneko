// ทดสอบ hook ของ Claude Code ใน repo git ชั่วคราว: node tests/hooks.js
// - Stop (tools/hooks/stop-check.js): ไม่ให้จบ turn ถ้าโค้ดเปลี่ยนหลัง npm run check ครั้งล่าสุด
// - SessionStart (tools/hooks/session-base.js): จำโค้ดตอนเริ่ม session
// - tools/check.js ที่รันแค่บางขั้นต้องไม่บันทึก check-stamp.json
const assert = require('assert'), fs = require('fs'), os = require('os'), path = require('path'), { execFileSync, spawnSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const { fingerprint, writeJSON, STAMP, BASE } = require('../tools/fingerprint.js');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kn-hooks-'));
const git = (...a) => execFileSync('git', a, { cwd: tmp, stdio: 'pipe' });
git('init', '-q');
fs.writeFileSync(path.join(tmp, '.gitignore'), 'node_modules/\n');
fs.writeFileSync(path.join(tmp, 'app.js'), 'let a = 1;\n');
fs.writeFileSync(path.join(tmp, 'README.md'), 'อ่านก่อน\n');
git('add', '.');

const hook = (file, input = {}) => {
  const r = spawnSync('node', [path.join(ROOT, 'tools/hooks', file)], { input: JSON.stringify(input), env: { ...process.env, CLAUDE_PROJECT_DIR: tmp }, encoding: 'utf8' });
  assert.strictEqual(r.status, 0, file + ' ต้อง exit 0: ' + r.stderr);
  return r.stdout.trim() ? JSON.parse(r.stdout) : null;
};
const stop = input => hook('stop-check.js', input);
const check = passed => writeJSON(tmp, STAMP, { ...fingerprint(tmp), at: 'ทดสอบ', passed, failed: passed ? [] : ['lint'] });
let n = 0;
const test = (name, fn) => { fn(); n++; console.log('  ✓ ' + name); };

test('ไม่มีบันทึกอะไรเลยและยังไม่ได้แก้: บล็อก (ไม่รู้ว่าตรวจแล้วหรือยัง)', () => {
  assert.strictEqual(stop().decision, 'block');
});
test('เริ่ม session แล้วยังไม่ได้แก้อะไร: จบได้', () => {
  hook('session-base.js');
  assert(fs.existsSync(path.join(tmp, BASE)));
  assert.strictEqual(stop(), null);
});
test('แก้ไฟล์ .md อย่างเดียว: จบได้', () => {
  fs.appendFileSync(path.join(tmp, 'README.md'), 'เพิ่ม\n');
  assert.strictEqual(stop(), null);
});
test('แก้โค้ดแล้วยังไม่ได้รัน check: บล็อก และบอกให้รัน npm run check', () => {
  fs.writeFileSync(path.join(tmp, 'app.js'), 'let a = 2;\n');
  const r = stop();
  assert.strictEqual(r.decision, 'block');
  assert.match(r.reason, /npm run check/);
  assert.match(r.reason, /ยังไม่เคยรัน/);
});
test('ไฟล์ใหม่ที่ยังไม่ได้ git add ก็นับ', () => {
  check(true);
  fs.writeFileSync(path.join(tmp, 'new.js'), 'x\n');
  assert.strictEqual(stop().decision, 'block');
  fs.rmSync(path.join(tmp, 'new.js'));
  assert.strictEqual(stop(), null);
});
test('ไฟล์ใน .gitignore และ test-results/ ไม่นับ', () => {
  fs.mkdirSync(path.join(tmp, 'node_modules'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'node_modules/x.js'), 'x\n');
  fs.writeFileSync(path.join(tmp, 'test-results/shot.log'), 'x\n');
  assert.strictEqual(stop(), null);
});
test('รัน check แล้วไม่ผ่าน: จบได้ (ต้องรายงานว่าไม่ผ่านเอง) · แก้ต่อหลังจากนั้น: บล็อก และบอกผลครั้งล่าสุด', () => {
  check(false);
  assert.strictEqual(stop(), null);
  fs.writeFileSync(path.join(tmp, 'app.js'), 'let a = 3;\n');
  const r = stop();
  assert.strictEqual(r.decision, 'block');
  assert.match(r.reason, /ไม่ผ่าน: lint/);
});
test('ลบไฟล์ที่ git ติดตามอยู่: บล็อก', () => {
  check(true);
  fs.rmSync(path.join(tmp, 'app.js'));
  assert.strictEqual(stop().decision, 'block');
  fs.writeFileSync(path.join(tmp, 'app.js'), 'let a = 3;\n');
  assert.strictEqual(stop(), null);
});
test('ถูกบล็อกไปแล้วรอบหนึ่ง (stop_hook_active): ปล่อยให้จบแต่เตือนเจ้าของ ไม่วนไม่รู้จบ', () => {
  fs.writeFileSync(path.join(tmp, 'app.js'), 'let a = 4;\n');
  const r = stop({ stop_hook_active: true });
  assert.strictEqual(r.decision, undefined);
  assert.match(r.systemMessage, /ยังไม่ได้รัน npm run check/);
});
test('tools/check.js ที่รันแค่บางขั้นไม่บันทึก check-stamp.json', () => {
  fs.rmSync(path.join(tmp, STAMP));
  spawnSync('node', [path.join(ROOT, 'tools/check.js'), 'unit'], { cwd: tmp, encoding: 'utf8' });
  assert(!fs.existsSync(path.join(tmp, STAMP)));
});

// ---------- ขอบเขตงาน · ข้อมูล · แนบหลักฐาน (prompt-start.js → approval-gate.js / stop-check.js) ----------
const { TURN } = require('../tools/fingerprint.js');
fs.mkdirSync(path.join(tmp, 'js/data'), { recursive: true }); fs.writeFileSync(path.join(tmp, 'js/data/k.js'), 'const K=1;\n');
const turnStart = prompt => hook('prompt-start.js', { prompt });
const gate = file => hook('approval-gate.js', { tool_name: 'Edit', tool_input: { file_path: path.join(tmp, file) } });
const asked = r => r && r.hookSpecificOutput && r.hookSpecificOutput.permissionDecision === 'ask';
test('UserPromptSubmit จำข้อความล่าสุดและลายนิ้วมือโค้ด/ข้อมูลตอนเริ่ม turn', () => {
  turnStart('ทำต่อเลย');
  const t = JSON.parse(fs.readFileSync(path.join(tmp, TURN), 'utf8'));
  assert.strictEqual(t.prompt, 'ทำต่อเลย'); assert.strictEqual(t.hash, fingerprint(tmp).hash); assert.strictEqual(t.data, fingerprint(tmp, 'js/data/').hash);
});
test('ก่อนแก้ไฟล์: ข้อความบอกให้เสนอก่อน/ยังไม่ต้องแก้ → ขอให้เจ้าของอนุญาต (ask) · ข้อความปกติ → ไม่ตัดสิน', () => {
  turnStart('ทำต่อเลย'); assert.strictEqual(gate('app.js'), null);
  for (const p of ['เสนอแผนก่อน ยังไม่ต้องแก้', 'แสดงเป็นรายการให้ผมอนุมัติก่อนแก้', 'ยังไม่ต้องแก้นะ']) { turnStart(p); assert(asked(gate('app.js')), p); }
  fs.rmSync(path.join(tmp, TURN)); assert.strictEqual(gate('app.js'), null, 'ไม่มี turn-start = ไม่ตัดสิน');
});
test('ก่อนแก้ js/data/: ต้องมีคำอนุมัติ · "ยังไม่ต้องแก้ข้อมูล" ถามแค่ไฟล์ข้อมูล ไม่ถามไฟล์โค้ด', () => {
  turnStart('ทำต่อเลย'); assert(asked(gate('js/data/k.js')));
  turnStart('อนุมัติคำแปลทั้งหมด นำเข้าได้เลย'); assert.strictEqual(gate('js/data/k.js'), null);
  turnStart('ทำ validate:data ยังไม่ต้องแก้ข้อมูล ผมจะเลือกเอง'); assert(asked(gate('js/data/k.js'))); assert.strictEqual(gate('app.js'), null);
});
test('ก่อนจบ turn: บอกให้เสนอก่อนแต่ไฟล์เปลี่ยน (แม้แก้ผ่าน Bash) → บล็อก · ไม่เปลี่ยน → จบได้', () => {
  check(true); turnStart('เสนอแผนก่อน ยังไม่ต้องแก้'); assert.strictEqual(stop(), null);
  fs.writeFileSync(path.join(tmp, 'app.js'), 'let a = 10;\n'); check(true);
  const r = stop({ last_assistant_message: 'ผ่านทั้งหมด 3 ข้อ' }); assert.strictEqual(r.decision, 'block'); assert.match(r.reason, /เสนอก่อน/);
});
test('ก่อนจบ turn: js/data/ เปลี่ยนโดยไม่มีคำอนุมัติ → บล็อก · มีคำอนุมัติ → จบได้', () => {
  turnStart('ทำต่อเลย'); fs.writeFileSync(path.join(tmp, 'js/data/k.js'), 'const K=2;\n'); check(true);
  assert.match(stop({ last_assistant_message: 'ผ่านทั้งหมด 3 ข้อ' }).reason, /js\/data/);
  fs.writeFileSync(path.join(tmp, 'js/data/k.js'), 'const K=1;\n'); turnStart('อนุมัติ แก้ข้อมูลได้'); fs.writeFileSync(path.join(tmp, 'js/data/k.js'), 'const K=3;\n'); check(true);
  assert.strictEqual(stop({ last_assistant_message: 'ผ่านทั้งหมด 3 ข้อ' }), null);
});
test('ก่อนจบ turn: โค้ดเปลี่ยนแต่ข้อความสุดท้ายไม่มีผล test → บล็อก · มีบรรทัดสรุปหรือตารางขั้น → จบได้ · ไม่ส่งข้อความมา = ไม่ตรวจ', () => {
  turnStart('ทำต่อเลย'); fs.writeFileSync(path.join(tmp, 'app.js'), 'let a = 11;\n'); check(true);
  assert.match(stop({ last_assistant_message: 'เสร็จแล้วค่ะ' }).reason, /ผล test/);
  assert.strictEqual(stop({ last_assistant_message: '| e2e | ✅ ผ่าน |' }), null);
  assert.strictEqual(stop({ last_assistant_message: 'e2e ไม่ผ่าน 1/60' }), null);
  assert.strictEqual(stop({}), null);
  const r = stop({ last_assistant_message: 'เสร็จแล้วค่ะ', stop_hook_active: true }); assert.strictEqual(r.decision, undefined); assert.match(r.systemMessage, /ผล test/);
});
const EV = 'ผ่านทั้งหมด 3 ข้อ';
const transcript = rows => { const f = path.join(os.tmpdir(), 'kn-tr-' + process.pid + '.jsonl'); fs.writeFileSync(f, rows.map(r => JSON.stringify(r)).join('\n') + '\n'); return f; };
const prompt = text => ({ type: 'user', message: { role: 'user', content: text } });
const sent = files => ({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', name: 'SendUserFile', input: { files } }] } });
const toolResult = { type: 'user', message: { role: 'user', content: [{ type: 'tool_result', content: 'ok' }] } };
test('ก่อนจบ turn: แก้ css/ หรือ js/ (นอก js/data/) แต่ข้อความสุดท้ายไม่อ้างภาพใน test-results/ และไม่ได้ส่งภาพ → บล็อก · อ้างภาพแล้ว → จบได้', () => {
  fs.mkdirSync(path.join(tmp, 'css'), { recursive: true });
  turnStart('ทำต่อเลย'); fs.writeFileSync(path.join(tmp, 'css/a.css'), 'a{}\n'); check(true);
  const r = stop({ last_assistant_message: EV }); assert.strictEqual(r.decision, 'block'); assert.match(r.reason, /ภาพหน้าจอ/); assert.match(r.reason, /test-results\//);
  assert.strictEqual(stop({ last_assistant_message: EV + ' · ภาพ `test-results/e2e/09-shop-end-p1.png`' }), null);
  assert.match(stop({ last_assistant_message: EV + ' · ภาพ shot.png' }).reason, /ภาพหน้าจอ/, 'ต้องเป็นภาพใน test-results/');
  turnStart('ทำต่อเลย'); fs.writeFileSync(path.join(tmp, 'js/ui.js'), 'let u = 1;\n'); check(true);
  assert.match(stop({ last_assistant_message: EV }).reason, /ภาพหน้าจอ/);
  const w = stop({ last_assistant_message: EV, stop_hook_active: true }); assert.strictEqual(w.decision, undefined); assert.match(w.systemMessage, /ภาพหน้าจอ/);
});
test('ก่อนจบ turn: ส่งภาพให้เจ้าของ (SendUserFile) หลังข้อความล่าสุดของเจ้าของ = มีภาพแล้ว · ส่งก่อนข้อความล่าสุด หรือส่งไฟล์ที่ไม่ใช่ภาพ = ยังไม่มี', () => {
  turnStart('ทำต่อเลย'); fs.writeFileSync(path.join(tmp, 'js/ui.js'), 'let u = 2;\n'); check(true);
  assert.strictEqual(stop({ last_assistant_message: EV, transcript_path: transcript([prompt('ทำต่อเลย'), toolResult, sent(['test-results/flows/09-shop-end-p1.png'])]) }), null);
  assert.match(stop({ last_assistant_message: EV, transcript_path: transcript([sent(['a.png']), prompt('ทำต่อเลย'), toolResult]) }).reason, /ภาพหน้าจอ/);
  assert.match(stop({ last_assistant_message: EV, transcript_path: transcript([prompt('ทำต่อเลย'), sent(['report.md'])]) }).reason, /ภาพหน้าจอ/);
  assert.match(stop({ last_assistant_message: EV, transcript_path: path.join(tmp, 'ไม่มีไฟล์.jsonl') }).reason, /ภาพหน้าจอ/);
});
test('ก่อนจบ turn: แก้ไฟล์ที่ไม่ใช่หน้าจอ (โค้ดนอก js/ css/ หรือ js/data/ ที่อนุมัติแล้ว) → ไม่ต้องมีภาพ · turn-start รุ่นเก่าที่ไม่มีลายนิ้วมือหน้าจอ → ไม่ตรวจภาพ', () => {
  turnStart('ทำต่อเลย'); fs.writeFileSync(path.join(tmp, 'app.js'), 'let a = 12;\n'); check(true);
  assert.strictEqual(stop({ last_assistant_message: EV }), null);
  turnStart('อนุมัติ แก้ข้อมูลได้'); fs.writeFileSync(path.join(tmp, 'js/data/k.js'), 'const K=4;\n'); check(true);
  assert.strictEqual(stop({ last_assistant_message: EV }), null);
  turnStart('ทำต่อเลย'); const t = JSON.parse(fs.readFileSync(path.join(tmp, TURN), 'utf8')); delete t.ui; fs.writeFileSync(path.join(tmp, TURN), JSON.stringify(t));
  fs.writeFileSync(path.join(tmp, 'css/a.css'), 'b{}\n'); check(true);
  assert.strictEqual(stop({ last_assistant_message: EV }), null);
});

fs.rmSync(tmp, { recursive: true, force: true });

// ---------- ก่อนรันคำสั่ง git ที่ทับไฟล์ในเครื่อง (approval-gate.js · PreToolUse Bash) · เคยเกิด 2026-11-24: git stash + git checkout <sha> -- . ไฟล์ในเครื่องถูกแทนด้วยไฟล์รุ่นเก่า ----------
const repo = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'kn-git-')); const g = (...a) => execFileSync('git', a, { cwd: d, stdio: 'pipe' }); g('init', '-q'); fs.writeFileSync(path.join(d, 'a.js'), '1\n'); g('add', '.'); g('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'base'); return d; };
const gDirty = repo(), gClean = repo();
const bash = (command, cwd = gClean) => hook('approval-gate.js', { tool_name: 'Bash', tool_input: { command }, cwd });
const askedWhy = r => asked(r) && r.hookSpecificOutput.permissionDecisionReason;
test('ก่อนรัน git ที่ทับไฟล์ในเครื่อง (checkout <ref> -- . · checkout -- <ไฟล์> · checkout -f · reset --hard · restore · clean -f · switch --discard-changes) → ขอให้เจ้าของอนุญาต แม้ไม่มีไฟล์ค้างและไม่มี turn-start', () => {
  for (const c of ['git checkout abc123 -- .', 'git checkout -- a.js', 'git checkout .', 'git checkout -f main', 'git reset --hard', 'git reset --hard origin/main', 'git restore a.js', 'git restore --worktree --staged a.js', 'git clean -fd', 'git clean -xdf', 'git switch --discard-changes main', 'git status && git checkout 1234abc -- .', 'cd /x; git -C /y reset --hard HEAD~1', 'GIT_PAGER=cat git -c core.x=1 reset --hard']) {
    const why = askedWhy(bash(c)); assert(why, c); assert.match(why, /ทับไฟล์ในเครื่อง/, c); assert.match(why, /commit/, c);
  }
});
test('ก่อนรัน git stash (ไม่ระบุคำสั่งย่อย · push · save): มีไฟล์ค้าง → ขออนุญาต · ไม่มีไฟล์ค้าง → ไม่ถาม · ดูที่ -C <โฟลเดอร์> ถ้ามี · stash list/show/pop → ไม่ถาม', () => {
  assert.strictEqual(bash('git stash'), null, 'ไม่มีไฟล์ค้าง');
  fs.writeFileSync(path.join(gDirty, 'a.js'), '2\n');
  for (const c of ['git stash', 'git stash -u', 'git stash push -m x', 'git stash save x']) assert(askedWhy(bash(c, gDirty)), c);
  assert(askedWhy(bash(`git -C "${gDirty}" stash`, gClean)), '-C ชี้ไป repo ที่มีไฟล์ค้าง');
  assert.strictEqual(bash(`git -C "${gClean}" stash`, gDirty), null, '-C ชี้ไป repo ที่ไม่มีไฟล์ค้าง');
  for (const c of ['git stash list', 'git stash show -p', 'git stash pop']) assert.strictEqual(bash(c, gDirty), null, c);
});
test('คำสั่งที่ไม่ทับไฟล์ในเครื่อง (status diff log add commit push fetch checkout <branch> checkout -b reset --soft restore --staged clean -n) และข้อความในเครื่องหมายคำพูด → ไม่ถาม', () => {
  for (const c of ['git status', 'git diff --stat', 'git log --oneline -3', 'git add -A && git commit -qm "ย้อน git checkout -- . ไม่ได้"', 'git push -u origin x', 'git fetch -q origin main', 'git checkout main', 'git checkout -b new', 'git switch main', 'git reset --soft HEAD~1', 'git reset HEAD a.js', 'git restore --staged a.js', 'git clean -n', 'npm run check', 'echo "git reset --hard"', "grep -n 'git stash' docs/x.md"]) assert.strictEqual(bash(c, gDirty), null, c);
});
test('.claude/settings.json: approval-gate.js รับทั้งการแก้ไฟล์และ Bash', () => {
  const s = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude/settings.json'), 'utf8'));
  const m = s.hooks.PreToolUse.filter(h => h.hooks.some(x => x.command.includes('approval-gate.js'))).map(h => h.matcher).join('|').split('|');
  for (const t of ['Write', 'Edit', 'MultiEdit', 'NotebookEdit', 'Bash']) assert(m.includes(t), t);
});
for (const d of [gDirty, gClean]) fs.rmSync(d, { recursive: true, force: true });

// ---------- tests/check-version.js: ต้องเพิ่ม VERSION เมื่อไฟล์ที่ผู้ใช้โหลดเปลี่ยนเท่านั้น ----------
const vt = fs.mkdtempSync(path.join(os.tmpdir(), 'kn-ver-'));
const vgit = (...a) => execFileSync('git', a, { cwd: vt, stdio: 'pipe', encoding: 'utf8' });
const sw = v => `const VERSION = 'v${v}';\nconst FILES = [\n  './',\n  'js/app.js',\n];\n`;
fs.mkdirSync(path.join(vt, 'tests')); fs.mkdirSync(path.join(vt, 'js')); fs.mkdirSync(path.join(vt, 'docs')); fs.mkdirSync(path.join(vt, 'icons')); fs.writeFileSync(path.join(vt, 'icons/apple-touch-icon-v1.png'), 'a');
fs.copyFileSync(path.join(ROOT, 'tests/check-version.js'), path.join(vt, 'tests/check-version.js'));
fs.writeFileSync(path.join(vt, 'sw.js'), sw(5)); fs.writeFileSync(path.join(vt, 'index.html'), 'a'); fs.writeFileSync(path.join(vt, 'js/app.js'), 'a'); fs.writeFileSync(path.join(vt, 'docs/x.md'), 'a');
vgit('init', '-q'); vgit('add', '.'); vgit('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'base');
const base = vgit('rev-parse', 'HEAD').trim();
const ver = () => spawnSync('node', ['tests/check-version.js', base], { cwd: vt, encoding: 'utf8' });
const reset = () => { vgit('checkout', '-q', '--', '.'); vgit('clean', '-qfd', '-e', 'tests'); };
test('VERSION: ไม่ได้แก้อะไร หรือแก้แค่เอกสาร → ผ่านโดยไม่ต้องเพิ่ม', () => {
  assert.strictEqual(ver().status, 0);
  fs.writeFileSync(path.join(vt, 'docs/x.md'), 'b'); fs.writeFileSync(path.join(vt, 'docs/new.md'), 'b');
  const r = ver(); assert.strictEqual(r.status, 0, r.stderr); assert.match(r.stdout, /ไม่ต้องเพิ่ม VERSION/); reset();
});
test('VERSION: ไฟล์ที่ผู้ใช้โหลดเปลี่ยน (รวม ./ = index.html และ sw.js เอง) แต่ไม่เพิ่ม → ไม่ผ่าน · เพิ่มแล้วผ่าน', () => {
  for (const f of ['js/app.js', 'index.html']) { fs.writeFileSync(path.join(vt, f), 'b'); const r = ver(); assert.strictEqual(r.status, 1, f); assert.match(r.stderr, new RegExp(f.replace('.', '\\.'))); reset(); }
  fs.appendFileSync(path.join(vt, 'sw.js'), '// x\n'); assert.strictEqual(ver().status, 1, 'sw.js'); reset();
  fs.writeFileSync(path.join(vt, 'js/app.js'), 'b'); fs.writeFileSync(path.join(vt, 'sw.js'), sw(6));
  const r = ver(); assert.strictEqual(r.status, 0, r.stderr); assert.match(r.stdout, /v5 → v6/); reset();
});
test('VERSION: ลดลง → ไม่ผ่าน · รายงานบอก sha และวันที่ของฐาน', () => {
  fs.writeFileSync(path.join(vt, 'sw.js'), sw(4));
  const r = ver(); assert.strictEqual(r.status, 1); assert.match(r.stderr, /ลดลง/); assert.match(r.stderr, new RegExp(base.slice(0, 7))); reset();
});
test('ไอคอน: apple-touch-icon-vN.png เปลี่ยนหน้าตาแต่ชื่อเดิม → ไม่ผ่าน (แม้เพิ่ม VERSION) · เปลี่ยนชื่อเป็น v2 แล้วผ่าน', () => {
  fs.writeFileSync(path.join(vt, 'icons/apple-touch-icon-v1.png'), 'b'); fs.writeFileSync(path.join(vt, 'sw.js'), sw(6));
  let r = ver(); assert.strictEqual(r.status, 1); assert.match(r.stderr, /apple-touch-icon-v1\.png เปลี่ยนหน้าตาแต่ชื่อเดิม/); reset();
  fs.rmSync(path.join(vt, 'icons/apple-touch-icon-v1.png')); fs.writeFileSync(path.join(vt, 'icons/apple-touch-icon-v2.png'), 'b'); fs.writeFileSync(path.join(vt, 'sw.js'), sw(6));
  r = ver(); assert.strictEqual(r.status, 0, r.stderr); reset();
});
fs.rmSync(vt, { recursive: true, force: true });

// ---------- tests/check-feature-map.js: ตัวเลขเกม (อาหาร โคบัง ราคา) ใน FEATURE_MAP.md ต้องตรงกับ KB KBI FOOD FMAX KBN_BAG ในโค้ด ----------
const fmDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kn-fm-'));
const FM = fs.readFileSync(path.join(ROOT, 'FEATURE_MAP.md'), 'utf8');
const fmCheck = (from, to) => {
  const s = from ? FM.replace(from, to) : FM;
  assert(!from || s !== FM, 'ไม่เจอข้อความ "' + from + '" ใน FEATURE_MAP.md');
  fs.writeFileSync(path.join(fmDir, 'FEATURE_MAP.md'), s);
  return spawnSync('node', [path.join(ROOT, 'tests/check-feature-map.js'), path.join(fmDir, 'FEATURE_MAP.md')], { encoding: 'utf8' });
};
const fmBad = (from, to, re) => { const r = fmCheck(from, to); assert.strictEqual(r.status, 1, `"${from}" → "${to}" ต้องไม่ผ่าน: ${r.stdout}`); assert.match(r.stderr, re, from); };
test('FEATURE_MAP: ตัวเลขเกมตรงกับโค้ด → ผ่าน', () => {
  const r = fmCheck(); assert.strictEqual(r.status, 0, r.stderr); assert.match(r.stdout, /ตัวเลขเกม/);
});
test('FEATURE_MAP: ราคา Energy / ความสนิท / ความหิวของอาหารไม่ตรง FOOD → ไม่ผ่าน และบอกชื่ออาหารกับค่าในโค้ด', () => {
  fmBad('ปลาย่าง 45 (+16 −60)', 'ปลาย่าง 40 (+16 −60)', /ปลาย่าง.*45/);
  fmBad('นม 15 (สนิท +4 หิว −20)', 'นม 15 (สนิท +5 หิว −20)', /นม.*\+4/);
  fmBad('ซูชิ 70 (+26 −100)', 'ซูชิ 70 (+26 −90)', /ซูชิ.*100/);
  fmBad('· ซูชิ 70 (+26 −100)', '', /อาหาร.*8/);
});
test('FEATURE_MAP: กติกาโคบังไม่ตรง KB → ไม่ผ่าน', () => {
  fmBad('จำได้แม่นข้อใหม่ +2', 'จำได้แม่นข้อใหม่ +3', /KB\.mast = 2/);
  fmBad('รับภารกิจ +5', 'รับภารกิจ +10', /KB\.claim = 5/);
  fmBad('+20 Energy +2 ความสนิท +5 โคบัง', '+20 Energy +2 ความสนิท +6 โคบัง', /KB\.claim = 5/);
  fmBad('สตรีค 7 วัน +30', 'สตรีค 7 วัน +35', /KB\.s7 = 30/);
  fmBad('30 วัน +100', '30 วัน +150', /KB\.s30 = 100/);
  fmBad('ยาวเกิน 300 รายการ', 'ยาวเกิน 500 รายการ', /KB\.keep = 300/);
});
test('FEATURE_MAP: ราคาของในร้านโคบังไม่ตรง KBI / KB.bag → ไม่ผ่าน', () => {
  fmBad('ลายขน 200', 'ลายขน 180', /ลายขน.*200/);
  fmBad('หายาก วิเชียรมาศ 300', 'หายาก วิเชียรมาศ 350', /coat:siamese.*300/);
  fmBad('ครบ 250 ข้อ', 'ครบ 200 ข้อ', /coat:calico.*250/);
  fmBad('เครื่องประดับ 120', 'เครื่องประดับ 100', /เครื่องประดับ.*120/);
  fmBad('ของแต่งห้อง 80–150', 'ของแต่งห้อง 80–200', /ของแต่งห้อง.*80–150/);
  fmBad('ถุงโชคดีราคา 150', 'ถุงโชคดีราคา 120', /KB\.bag = 150/);
});
test('FEATURE_MAP: ตู้กับข้าวชนิดละ / ค่าถุงคอนบินิไม่ตรง FMAX / KBN_BAG → ไม่ผ่าน · ประโยคที่มีตัวเลขหายไป → ไม่ผ่านและบอกให้แก้ตัวตรวจ', () => {
  fmBad('(ชนิดละไม่เกิน 9)', '(ชนิดละไม่เกิน 10)', /FMAX = 9/);
  fmBad('(ถุง 1 Energy)', '(ถุง 2 Energy)', /KBN_BAG = 1/);
  fmBad('สตรีค 7 วัน +30', 'สตรีคเจ็ดวันได้สามสิบ', /หาไม่เจอ.*tests\/check-feature-map\.js/);
});
fs.rmSync(fmDir, { recursive: true, force: true });
console.log(`\nผ่านทั้งหมด ${n} ข้อ`);
