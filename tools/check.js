// npm run check: รันทุกการตรวจตามลำดับ type → lint → unit → hooks → e2e → flows แล้วสรุปเป็นตาราง
// รันครบทุกขั้นแม้ขั้นก่อนหน้าไม่ผ่าน จะได้เห็นปัญหาทั้งหมดในรอบเดียว · มีขั้นไหนไม่ผ่าน → exit 1 (CI แดง)
// รันเฉพาะบางขั้น: node tools/check.js lint unit
// รันครบทุกขั้นแล้วบันทึกลายนิ้วมือของโค้ดที่ตรวจและผลไว้ใน test-results/check-stamp.json ให้ hook Stop (tools/hooks/stop-check.js) เทียบ
const { spawnSync } = require('child_process');
const { fingerprint, writeJSON, STAMP } = require('./fingerprint.js');
const STEPS = [
  ['type', 'npx', ['tsc', '-p', 'tsconfig.json']],
  ['lint', 'npx', ['eslint', '.']],
  ['unit', 'node', ['tests/payment.mjs']],
  ['hooks', 'node', ['tests/hooks.js']],
  ['e2e', 'node', ['tests/e2e.js']],
  ['flows', 'node', ['tests/flows.js']],
];
const only = process.argv.slice(2);
const unknown = only.filter(n => !STEPS.some(s => s[0] === n));
if (unknown.length) { console.error('ไม่รู้จักขั้น: ' + unknown.join(' ') + ' · มี: ' + STEPS.map(s => s[0]).join(' ')); process.exit(2); }
const rows = [], fp = only.length ? null : fingerprint(process.cwd());
for (const [name, cmd, args] of STEPS.filter(s => !only.length || only.includes(s[0]))) {
  console.log(`\n━━━ ${name}: ${cmd} ${args.join(' ')}`);
  const t0 = Date.now();
  const r = spawnSync(cmd, args, { stdio: 'inherit' });
  rows.push([name, r.status === 0, ((Date.now() - t0) / 1000).toFixed(1), r.status ?? r.signal]);
}
console.log('\n━━━ สรุป npm run check');
console.log('| ขั้น | ผล | เวลา (วินาที) | exit |\n|---|---|---|---|');
for (const [n, ok, s, code] of rows) console.log(`| ${n} | ${ok ? '✅ ผ่าน' : '❌ ไม่ผ่าน'} | ${s} | ${code} |`);
const bad = rows.filter(r => !r[1]).map(r => r[0]);
console.log(bad.length ? `\nไม่ผ่าน ${bad.length}/${rows.length} ขั้น: ${bad.join(' ')}` : `\nผ่านทั้งหมด ${rows.length} ขั้น`);
if (fp) writeJSON(process.cwd(), STAMP, { ...fp, at: new Date().toISOString(), passed: !bad.length, failed: bad });
process.exit(bad.length ? 1 : 0);
