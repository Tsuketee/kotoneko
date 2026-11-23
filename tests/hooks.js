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

fs.rmSync(tmp, { recursive: true, force: true });

// ---------- tests/check-version.js: ต้องเพิ่ม VERSION เมื่อไฟล์ที่ผู้ใช้โหลดเปลี่ยนเท่านั้น ----------
const vt = fs.mkdtempSync(path.join(os.tmpdir(), 'kn-ver-'));
const vgit = (...a) => execFileSync('git', a, { cwd: vt, stdio: 'pipe', encoding: 'utf8' });
const sw = v => `const VERSION = 'v${v}';\nconst FILES = [\n  './',\n  'js/app.js',\n];\n`;
fs.mkdirSync(path.join(vt, 'tests')); fs.mkdirSync(path.join(vt, 'js')); fs.mkdirSync(path.join(vt, 'docs'));
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
fs.rmSync(vt, { recursive: true, force: true });
console.log(`\nผ่านทั้งหมด ${n} ข้อ`);
