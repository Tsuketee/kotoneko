// ลายนิ้วมือของโค้ดใน repo: sha1 ของชื่อและเนื้อหาไฟล์ที่ git ติดตามหรือยังไม่ได้ add (ไม่นับไฟล์ใน .gitignore, test-results/ และ *.md)
// ใช้ร่วมกันระหว่าง tools/check.js (บันทึกว่าตรวจโค้ดชุดไหน) กับ hook Stop/SessionStart (เทียบว่าโค้ดเปลี่ยนหลังตรวจหรือไม่)
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { execFileSync } = require('child_process');

const STAMP = path.join('test-results', 'check-stamp.json');
const BASE = path.join('test-results', 'session-base.json');
const TURN = path.join('test-results', 'turn-start.json');   // ข้อความล่าสุดของเจ้าของ + ลายนิ้วมือตอนเริ่ม turn (tools/hooks/prompt-start.js)

// only = นับเฉพาะไฟล์ที่ขึ้นต้นด้วยค่านี้ (เช่น 'js/data/') หรือฟังก์ชันเลือกไฟล์ (เช่น isUi ใน tools/hooks/gate-rules.js)
function fingerprint(root, only = '') {
  const out = execFileSync('git', ['ls-files', '-z', '-co', '--exclude-standard'], { cwd: root, encoding: 'utf8', maxBuffer: 64 << 20 });
  const keep = typeof only === 'function' ? only : f => f.startsWith(only);
  const files = [...new Set(out.split('\0').filter(f => f && keep(f) && !f.startsWith('test-results/') && !f.endsWith('.md')))].sort();
  const h = crypto.createHash('sha1');
  for (const f of files) {
    h.update(f + '\0');
    const p = path.join(root, f);
    h.update(fs.existsSync(p) && fs.statSync(p).isFile() ? fs.readFileSync(p) : '<ไม่มีไฟล์>');
    h.update('\0');
  }
  return { hash: h.digest('hex'), files: files.length };
}

function readJSON(root, rel) {
  try { return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')); }
  catch { return null; }
}

function writeJSON(root, rel, data) {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), JSON.stringify(data, null, 2) + '\n');
}

module.exports = { fingerprint, readJSON, writeJSON, STAMP, BASE, TURN };
