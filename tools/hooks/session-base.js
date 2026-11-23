// Hook ของ Claude Code (SessionStart · .claude/settings.json): จำลายนิ้วมือของโค้ดตอนเริ่ม session ไว้ใน test-results/session-base.json
// hook Stop (tools/hooks/stop-check.js) ใช้ค่านี้แยกว่าโค้ดเปลี่ยนใน session นี้หรือไม่
const path = require('path');
const { fingerprint, writeJSON, BASE } = require('../fingerprint.js');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.join(__dirname, '..', '..');

writeJSON(ROOT, BASE, { ...fingerprint(ROOT), at: new Date().toISOString() });
