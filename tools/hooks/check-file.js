// Hook ของ Claude Code (PostToolUse · .claude/settings.json): หลัง Claude แก้หรือสร้างไฟล์ ให้รัน lint/type ของไฟล์นั้นทันที
// รับ JSON ทาง stdin (tool_input.file_path) · ผ่าน → ไม่พิมพ์อะไร
// ไม่ผ่าน → พิมพ์ {"decision":"block","reason":...} ข้อความใน reason ถูกส่งกลับไปให้ Claude เห็นและแก้ต่อ
// - .js .mjs .cjs .ts → npx eslint <ไฟล์>
// - .ts ที่อยู่ใน tsconfig.json → tsc -p tsconfig.json (ทั้งโปรเจกต์ ใช้เวลาไม่ถึง 2 วินาที)
// ทดสอบเอง: echo '{"tool_input":{"file_path":"js/core.js"}}' | node tools/hooks/check-file.js
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.join(__dirname, '..', '..');
const MAX_LINES = 60;

let input = {};
try { input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); }
catch (e) { report(`อ่านข้อมูลจาก Claude Code ไม่ได้: ${e.message}`); }
const given = (input.tool_input && input.tool_input.file_path) || (input.tool_response && input.tool_response.filePath);
if (!given) process.exit(0);
const file = path.resolve(ROOT, given), rel = path.relative(ROOT, file);
if (rel.startsWith('..') || path.isAbsolute(rel) || !/\.(m?js|cjs|ts)$/.test(rel) || !fs.existsSync(file)) process.exit(0);

const bin = n => path.join(ROOT, 'node_modules', '.bin', n);
if (!fs.existsSync(bin('eslint'))) {
  process.stdout.write(JSON.stringify({ systemMessage: 'hook ตรวจไฟล์ข้ามไป: ยังไม่ได้ติดตั้ง devDependencies (รัน npm ci ที่ ' + ROOT + ')' }));
  process.exit(0);
}
const run = (cmd, args) => { const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8' }); return { ok: r.status === 0, out: (r.stdout || '') + (r.stderr || '') }; };
const parts = [];
const lint = run(bin('eslint'), ['--no-warn-ignored', '--format', 'stylish', rel]);
if (!lint.ok) parts.push(`ESLint (${rel}):\n${lint.out.trim()}`);
if (rel.endsWith('.ts')) {
  const tsc = run(bin('tsc'), ['-p', 'tsconfig.json']);
  if (!tsc.ok) parts.push(`TypeScript (tsc -p tsconfig.json):\n${tsc.out.trim()}`);
}
if (parts.length) report(parts.join('\n\n'));

function report(text) {
  const lines = text.split('\n');
  const body = lines.length > MAX_LINES ? lines.slice(0, MAX_LINES).concat(`… อีก ${lines.length - MAX_LINES} บรรทัด (รัน npx eslint ${rel} ดูทั้งหมด)`).join('\n') : text;
  process.stdout.write(JSON.stringify({
    decision: 'block',
    reason: `ไฟล์ที่เพิ่งแก้ยังผิดกฎตรวจอัตโนมัติ แก้ให้ผ่านก่อนทำต่อ (แผนแก้ของโค้ดเดิมอยู่ใน docs/LINT_PLAN.md):\n${body}`,
  }));
  process.exit(0);
}
