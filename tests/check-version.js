// ตรวจว่าเพิ่มเลข VERSION ใน sw.js แล้วเมื่อไฟล์ที่ผู้ใช้โหลด (FILES ใน sw.js และ sw.js เอง) เปลี่ยน ไม่งั้นเครื่องผู้ใช้จะยังเห็นไฟล์เก่าจากแคช
// แก้แค่ไฟล์ที่ไม่ได้ส่งให้ผู้ใช้ (เอกสาร test เครื่องมือ) ไม่ต้องเพิ่ม VERSION
// รัน: node tests/check-version.js <ref ฐาน>   เช่น  node tests/check-version.js origin/main
// GitHub Actions รันให้ทุก PR (.github/workflows/test.yml) โดยเทียบกับ branch ปลายทางของ PR
// npm run check รันให้ทุกครั้ง (ขั้น version ใน tools/check.js · ฐาน = ตัวแปร CHECK_BASE ถ้าไม่ตั้งใช้ origin/main)
// ไม่ผ่าน (exit 1) = ไฟล์ที่ผู้ใช้โหลดเปลี่ยนแต่ VERSION ไม่เพิ่ม · VERSION ลดลง · รูปแบบผิด
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const base = process.argv[2];
if (!base) { console.error('ต้องบอก ref ฐาน เช่น node tests/check-version.js origin/main'); process.exit(2); }
const ROOT = path.join(__dirname, '..');
const git = args => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const ver = (src, where) => {
  const m = /const VERSION = 'v(\d+)'/.exec(src);
  if (!m) { console.error(`✗ หา VERSION ใน sw.js ของ${where} ไม่เจอ (ต้องเป็นรูปแบบ const VERSION = 'v123';)`); process.exit(1); }
  return +m[1];
};
const swNow = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8'), head = ver(swNow, 'งานนี้');
let baseSrc, baseInfo;
try { baseSrc = git(['show', `${base}:sw.js`]); baseInfo = git(['log', '-1', '--format=%h %cd', '--date=format:%Y-%m-%d %H:%M', base]).trim(); }
catch (e) { console.error(`✗ อ่าน sw.js จาก ${base} ไม่ได้ (ลอง git fetch ก่อน): ${String(e.stderr || e.message).trim()}`); process.exit(1); }
const was = ver(baseSrc, ' ' + base);
const label = `${base} (${baseInfo})`;

// ไฟล์ที่ผู้ใช้โหลด: รายการ FILES ใน sw.js ('./' = index.html) และ sw.js เอง
const files = /const FILES = \[([\s\S]*?)\];/.exec(swNow);
if (!files) { console.error('✗ หา const FILES = [...] ใน sw.js ไม่เจอ'); process.exit(1); }
const served = new Set(['sw.js', ...[...files[1].matchAll(/'([^']+)'/g)].map(m => m[1] === './' ? 'index.html' : m[1])]);
const changed = [...new Set([...git(['diff', '--name-only', base, '--']).split('\n'), ...git(['ls-files', '--others', '--exclude-standard']).split('\n')].filter(Boolean))];
const servedChanged = changed.filter(f => served.has(f));

if (head < was) { console.error(`✗ VERSION ลดลง: ${label} เป็น v${was} แต่งานนี้เป็น v${head} (ถ้ามี PR อื่น merge ไปก่อน ให้ merge main เข้ามาแล้วเพิ่มเลขต่อจากนั้น)`); process.exit(1); }
if (!servedChanged.length) { console.log(`✓ ไม่มีไฟล์ที่ผู้ใช้โหลดเปลี่ยนจาก ${label} (ไม่ต้องเพิ่ม VERSION · ตอนนี้ v${head})`); process.exit(0); }
if (head > was) { console.log(`✓ VERSION v${was} → v${head} (ฐาน ${label} · ไฟล์ที่ผู้ใช้โหลดเปลี่ยน ${servedChanged.length} ไฟล์)`); process.exit(0); }
console.error(`✗ VERSION ไม่ได้เพิ่ม: ไฟล์ที่ผู้ใช้โหลดเปลี่ยน (${servedChanged.slice(0, 8).join(' ')}${servedChanged.length > 8 ? ' …' : ''}) แต่ VERSION ยังเป็น v${head} เท่ากับ ${label} · แก้ const VERSION ใน sw.js เป็น 'v${was + 1}'`);
process.exit(1);
