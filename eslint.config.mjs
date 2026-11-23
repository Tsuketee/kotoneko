// ESLint (npm run lint) · ปรับตามโครงสร้างจริงของแอป: classic script ไม่มี import ทุกไฟล์ใช้ตัวแปร global ร่วมกัน (ลำดับใน index.html)
// แทน "ห้าม import ข้ามชั้น" ด้วยการจำกัดว่าชั้นไหนแตะของอะไรได้:
//   ชั้นข้อมูล   js/data/*        ห้ามแตะหน้าจอ ที่เก็บข้อมูล และเน็ต
//   ชั้นเก็บข้อมูล STORAGE_LAYER   เท่านั้นที่อ่าน/เขียน localStorage ได้ ไฟล์อื่นต้องเรียกผ่านฟังก์ชันของชั้นนี้
//   ชั้น API     API_LAYER       เท่านั้นที่เรียกเน็ต (fetch) ได้
// ชื่อ global ของแต่ละไฟล์คำนวณจากการ parse ไฟล์อื่นในแอปจริง no-undef จึงจับชื่อที่ไม่มีอยู่ในแอปได้
import fs from 'node:fs';
import * as espree from 'espree';
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const STORAGE_LAYER = ['js/level.js'];
const API_LAYER = ['js/cloud.js'];
const NO_STORAGE = ['localStorage', 'sessionStorage', 'indexedDB'].map(name => ({ name, message: 'เข้าถึงที่เก็บข้อมูลได้เฉพาะไฟล์ชั้นเก็บข้อมูล (' + STORAGE_LAYER.join(' ') + ') ให้เรียกผ่าน readJSON/writeJSON/readStr/writeStr ใน js/level.js' }));
const NO_NET = ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource'].map(name => ({ name, message: 'เรียกเน็ตได้เฉพาะชั้น API (' + API_LAYER.join(' ') + ')' }));
const NO_DOM = ['document', 'window', 'navigator', 'location'].map(name => ({ name, message: 'ไฟล์ข้อมูล (js/data) ต้องเป็นข้อมูลล้วน ไม่แตะหน้าจอหรือเบราว์เซอร์' }));
const NO_WINDOW_STORAGE = ['localStorage', 'sessionStorage', 'indexedDB'].map(property => ({ object: 'window', property, message: NO_STORAGE[0].message }));

// ไฟล์ของแอปตามลำดับใน index.html และชื่อระดับบนสุดที่แต่ละไฟล์ประกาศ (const/function = readonly · let/var = writable)
const APP = [...fs.readFileSync('index.html', 'utf8').matchAll(/<script src="(js\/[^"]+)"/g)].map(m => m[1]);
const declared = f => {
  const out = {};
  for (const n of espree.parse(fs.readFileSync(f, 'utf8'), { ecmaVersion: 'latest', sourceType: 'script' }).body) {
    if (n.type === 'FunctionDeclaration' || n.type === 'ClassDeclaration') out[n.id.name] = 'readonly';
    if (n.type === 'VariableDeclaration') for (const d of n.declarations) if (d.id.type === 'Identifier') out[d.id.name] = n.kind === 'const' ? 'readonly' : 'writable';
  }
  return out;
};
const OWN = Object.fromEntries(APP.map(f => [f, declared(f)]));
const EXPORTED = { PixelCat: 'readonly', TownMap: 'readonly' }; // window.PixelCat (js/pixelcat.js) · window.TownMap (js/town.js)
const othersOf = f => Object.assign({}, EXPORTED, ...APP.filter(g => g !== f).map(g => OWN[g]));
const ALL_APP = Object.assign({}, EXPORTED, ...APP.map(f => OWN[f]));

export default tseslint.config(
  { ignores: ['node_modules/**', 'test-results/**', 'docs/**', 'icons/**', 'fonts/**', 'img/**'] },
  // ปิดกฎในโค้ดไม่ได้: comment แบบ eslint-disable / eslint <กฎ>: off / global ไม่มีผล ต้องแก้ที่ต้นเหตุ หรือแก้ไฟล์นี้ให้เห็นใน diff
  { linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: 'error' } },

  // ---------- แอป (ship ให้ผู้ใช้) ----------
  ...APP.map(f => ({
    files: [f],
    ...js.configs.recommended,
    languageOptions: { ecmaVersion: 'latest', sourceType: 'script', globals: { ...globals.browser, ...othersOf(f) } },
    rules: {
      ...js.configs.recommended.rules,
      // ฟังก์ชันระดับบนสุดถูกเรียกจากไฟล์อื่นและจาก onclick ใน HTML ที่ ESLint มองไม่เห็น จึงตรวจตัวแปรที่ไม่ได้ใช้เฉพาะในฟังก์ชัน
      'no-unused-vars': ['error', { vars: 'local' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-restricted-globals': ['error', ...(f.startsWith('js/data/') ? [...NO_DOM, ...NO_STORAGE, ...NO_NET] : [
        ...(STORAGE_LAYER.includes(f) ? [] : NO_STORAGE),
        ...(API_LAYER.includes(f) ? [] : NO_NET)])],
      'no-restricted-properties': ['error', ...(STORAGE_LAYER.includes(f) ? [] : NO_WINDOW_STORAGE)],
    },
  })),
  // ไฟล์ใน js/ ที่ยังไม่อยู่ใน index.html (เช่นไฟล์ใหม่) ใช้กฎเดียวกับแอป เห็นชื่อ global ของทุกไฟล์ และห้ามแตะที่เก็บข้อมูล/เน็ตเหมือนไฟล์ทั่วไป
  {
    files: ['js/**/*.js'],
    ignores: APP,
    ...js.configs.recommended,
    languageOptions: { ecmaVersion: 'latest', sourceType: 'script', globals: { ...globals.browser, ...ALL_APP } },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { vars: 'local' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-restricted-globals': ['error', ...NO_STORAGE, ...NO_NET],
      'no-restricted-properties': ['error', ...NO_WINDOW_STORAGE],
    },
  },
  {
    files: ['sw.js'],
    ...js.configs.recommended,
    languageOptions: { ecmaVersion: 'latest', sourceType: 'script', globals: globals.serviceworker },
    rules: { ...js.configs.recommended.rules, 'no-console': ['error', { allow: ['warn', 'error'] }] },
  },

  // ---------- Edge Function ชำระเงิน (TypeScript · ship บน Supabase) ----------
  ...tseslint.configs.recommended.map(c => ({ ...c, files: ['supabase/functions/**/*.ts'] })),
  {
    files: ['supabase/functions/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },

  // ---------- ชุดทดสอบและเครื่องมือ (Node · ไม่ ship) ----------
  // โค้ดใน page.evaluate() รันในหน้าแอป จึงเห็นชื่อ global ของแอปและเบราว์เซอร์ด้วย
  {
    files: ['tests/**/*.js', 'tools/**/*.js'],
    ...js.configs.recommended,
    languageOptions: { ecmaVersion: 'latest', sourceType: 'commonjs', globals: { ...globals.node, ...globals.browser, ...ALL_APP } },
    rules: { ...js.configs.recommended.rules },
  },
  {
    files: ['tests/**/*.mjs', 'eslint.config.mjs'],
    ...js.configs.recommended,
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: globals.node },
    rules: { ...js.configs.recommended.rules },
  },
);
