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
