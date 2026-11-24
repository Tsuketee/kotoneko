// session ของ Claude Code ที่เปิดหลาย repo จะเริ่มที่โฟลเดอร์แม่ (เช่น /home/user ที่มี kotoneko และ kotoneko-content) จึงไม่โหลด .claude/settings.json ของ repo นี้
// สคริปต์นี้เขียน <โฟลเดอร์แม่>/.claude/settings.json ให้เรียก hook ชุดเดียวกันด้วย path เต็ม และตั้ง CLAUDE_PROJECT_DIR เป็น repo นี้
// session ที่เปิดที่ repo นี้เองจะข้าม (hook ของ repo ทำงานอยู่แล้ว) · คีย์อื่นในไฟล์เดิมคงไว้ แทนเฉพาะ hooks
// setup script ของสภาพแวดล้อม cloud รันจากโฟลเดอร์แม่: node kotoneko/tools/hooks/install-parent.js
// ตรวจว่าไฟล์ของโฟลเดอร์แม่มี hook ครบ: node tools/hooks/install-parent.js --check · ทดสอบ: node tests/hooks.js
const fs = require('fs'), path = require('path');
const HERE = path.join(__dirname, '..', '..');
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? path.resolve(process.argv[i + 1]) : null; };
const project = arg('--project') || HERE, parent = arg('--parent') || path.dirname(project);
const out = path.join(parent, '.claude', 'settings.json');
const own = JSON.parse(fs.readFileSync(path.join(HERE, '.claude', 'settings.json'), 'utf8'));
const q = s => `"${s.replace(/(["\\$`])/g, '\\$1')}"`;
const hooks = {};
for (const [ev, list] of Object.entries(own.hooks)) hooks[ev] = list.map(h => ({ ...h, hooks: h.hooks.map(x => ({
  ...x,
  command: `[ "$CLAUDE_PROJECT_DIR" = ${q(project)} ] || CLAUDE_PROJECT_DIR=${q(project)} ${x.command.replace(/"\$CLAUDE_PROJECT_DIR\/([^"]+)"/g, (_, rel) => q(path.join(HERE, rel)))}`,
})) }));
const key = (ev, h, x) => `${ev} · matcher ${h.matcher || '(ทุกอย่าง)'} · ${(x.command.match(/tools\/hooks\/[\w-]+\.js/) || [x.command])[0]}`;
const keys = hs => new Set(Object.entries(hs || {}).flatMap(([ev, list]) => (list || []).flatMap(h => (h.hooks || []).map(x => key(ev, h, x)))));

if (process.argv.includes('--check')) {
  let cur;
  try { cur = JSON.parse(fs.readFileSync(out, 'utf8')); } catch (e) { console.error(`ไม่มีไฟล์หรืออ่านไม่ได้: ${out} (${e.message.split('\n')[0]}) · รัน node ${path.relative(process.cwd(), __filename)} เพื่อเขียนใหม่`); process.exit(1); }
  const have = keys(cur.hooks), miss = [...keys(hooks)].filter(k => !have.has(k));
  const stale = Object.values(cur.hooks || {}).flat().flatMap(h => h.hooks || []).map(x => (x.command.match(/"([^"]+\/tools\/hooks\/[\w-]+\.js)"/) || [])[1]).filter(f => f && !fs.existsSync(f));
  if (miss.length || stale.length) {
    console.error(`${out} ไม่ครบตาม .claude/settings.json ของ ${project}:\n  ` + [...miss.map(m => 'ขาด ' + m), ...stale.map(f => 'ไม่มีไฟล์ ' + f)].join('\n  ') + `\nรัน node ${path.relative(process.cwd(), __filename)} เพื่อเขียนใหม่`);
    process.exit(1);
  }
  console.log(`✓ ${out} มี hook ครบ ${have.size} ตัว ชี้ไปที่ ${project}`);
  process.exit(0);
}

const cur = (() => { try { return JSON.parse(fs.readFileSync(out, 'utf8')); } catch { return {}; } })();
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ ...cur, hooks }, null, 2) + '\n');
console.log(`✓ เขียน hook ${keys(hooks).size} ตัวลง ${out} (ชี้ไปที่ ${project})`);
