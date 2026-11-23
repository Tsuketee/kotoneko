// จำนวนข้อทดสอบของแต่ละไฟล์ใน tests/ ต้องไม่น้อยกว่าของฐาน (ลบ ข้าม หรือ comment ข้อทดสอบทิ้งแล้วจะไม่ผ่าน)
// นับบรรทัดที่ขึ้นต้นด้วย test( ในไฟล์ tests/*.js tests/*.mjs ของงานนี้ เทียบกับ git show <ฐาน>:tests/<ไฟล์>
// รัน: node tests/check-test-count.js <ref ฐาน>   เช่น  node tests/check-test-count.js origin/main
// npm run check รันให้ทุกครั้ง (ขั้น test-count ใน tools/check.js · ฐาน = ตัวแปร CHECK_BASE ถ้าไม่ตั้งใช้ origin/main)
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const base = process.argv[2];
if (!base) { console.error('ต้องบอก ref ฐาน เช่น node tests/check-test-count.js origin/main'); process.exit(2); }
const ROOT = path.join(__dirname, '..');
const isTest = f => /^tests\/[^/]+\.m?js$/.test(f);
const names = src => [...src.matchAll(/^test\(\s*(['"`])(.*?)\1/gm)].map(m => m[2]);
const git = args => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

let baseFiles;
try { baseFiles = git(['ls-tree', '-r', '--name-only', base, 'tests/']).split('\n').filter(isTest); }
catch (e) { console.error(`✗ อ่าน tests/ จาก ${base} ไม่ได้ (ลอง git fetch ก่อน): ${String(e.stderr || e.message).trim()}`); process.exit(1); }
const files = [...new Set([...baseFiles, ...fs.readdirSync(path.join(ROOT, 'tests')).map(f => 'tests/' + f).filter(isTest)])].sort();

const rows = [], bad = [];
for (const f of files) {
  const was = baseFiles.includes(f) ? names(git(['show', `${base}:${f}`])) : [];
  const now = fs.existsSync(path.join(ROOT, f)) ? names(fs.readFileSync(path.join(ROOT, f), 'utf8')) : [];
  if (!was.length && !now.length) continue;
  rows.push(`| ${f} | ${was.length} | ${now.length} |`);
  if (now.length < was.length) {
    const gone = was.filter(n => !now.includes(n));
    bad.push(`${f}: ${base} มี ${was.length} ข้อ แต่งานนี้เหลือ ${now.length} ข้อ` + (gone.length ? '\n    ข้อที่หายไป: ' + gone.map(n => `"${n}"`).join('\n                 ') : ''));
  }
}
console.log(`| ไฟล์ | ${base} | งานนี้ |\n|---|---|---|\n` + rows.join('\n'));
if (bad.length) {
  console.error('\n✗ จำนวนข้อทดสอบลดลง (ห้ามลบ ข้าม หรือ comment ข้อทดสอบเพื่อให้ผ่าน · ถ้าตั้งใจรวม/ย้ายข้อ ให้เจ้าของอนุมัติก่อน):\n  ' + bad.join('\n  '));
  process.exit(1);
}
console.log('\n✓ จำนวนข้อทดสอบไม่ลดลงทุกไฟล์');
