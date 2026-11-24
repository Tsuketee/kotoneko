// กติกาขอบเขตงานจากข้อความล่าสุดของเจ้าของ ใช้ร่วมกันระหว่าง approval-gate.js (ก่อนแก้ไฟล์) และ stop-check.js (ก่อนจบ turn)
// corrections-log: "ขอบเขตงาน: เสนอก่อนรออนุมัติ" (7 ครั้ง) · "ห้ามแก้ข้อมูลเพื่อให้ validation ผ่านโดยไม่ถาม"
const NO_EDIT = /ยังไม่ต้องแก้(?!ข้อมูล)|ยังไม่ต้องทำ|เสนอ(?:แผน)?ก่อน|ให้ผมอนุมัติก่อน|อนุมัติก่อน(?:แก้|ทำ)|ห้ามแก้(?:ไฟล์|โค้ด)/u;
const DATA_NO = /ยังไม่ต้องแก้ข้อมูล|ห้ามแก้ข้อมูล|ผมจะเลือกเอง/u;
const DATA_OK = /อนุมัติ|นำเข้า|แก้ข้อมูล/u;
const isData = f => /(^|\/)js\/data\//.test(String(f || '').replace(/\\/g, '/'));
// ข้อความสุดท้ายที่ถือว่าแนบผล test แล้ว: บรรทัดสรุปของชุด test หรือตารางขั้นของ npm run check
const EVIDENCE = /ผ่านทั้งหมด \d+|ไม่ผ่าน \d+|\|\s*(?:type|lint|e2e|flows)\s*\|/u;
// ไฟล์หน้าจอ: js/ (ไม่นับ js/data/ ซึ่งมีตัวตรวจข้อมูลและคำอนุมัติของตัวเอง) และ css/ · แก้แล้วข้อความสุดท้ายต้องอ้างภาพใน test-results/ (หรือส่งภาพให้เจ้าของ)
const isUi = f => (f.startsWith('js/') && !f.startsWith('js/data/')) || f.startsWith('css/');
const SHOT = /test-results\/[^\s`'")]+\.png\b/u;
const noEdit = prompt => NO_EDIT.test(prompt || '');
const dataAllowed = prompt => !DATA_NO.test(prompt || '') && DATA_OK.test(prompt || '');
module.exports = { noEdit, dataAllowed, isData, isUi, EVIDENCE, SHOT, NO_EDIT, DATA_NO, DATA_OK };
