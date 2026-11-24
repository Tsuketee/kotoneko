// Hook ของ Claude Code (UserPromptSubmit · .claude/settings.json): จำข้อความล่าสุดของเจ้าของ และลายนิ้วมือของโค้ด/ข้อมูลตอนเริ่ม turn
// ไว้ที่ test-results/turn-start.json ให้ approval-gate.js และ stop-check.js ใช้ · ไม่บล็อกอะไร
const fs = require('fs'), path = require('path');
const { fingerprint, writeJSON, TURN } = require('../fingerprint.js');
const { isUi } = require('./gate-rules.js');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.join(__dirname, '..', '..');
const readInput = () => { try { return JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { return {}; } };
const input = readInput();
writeJSON(ROOT, TURN, { prompt: String(input.prompt || ''), hash: fingerprint(ROOT).hash, data: fingerprint(ROOT, 'js/data/').hash, ui: fingerprint(ROOT, isUi).hash, at: new Date().toISOString() });
