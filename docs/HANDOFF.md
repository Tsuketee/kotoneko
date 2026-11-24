# ส่งต่องาน · ถึง 2026-11-23 (main = v185 · ทุก PR merge แล้ว)

อ่านไฟล์นี้ก่อนเริ่ม session ใหม่ แล้วอ่าน `CLAUDE.md` และ `FEATURE_MAP.md` · งานแมวพิกเซล/แผนที่อยู่ใน `docs/PET_PIXEL.md`

## สถานะ (ตรวจ 2026-11-23 หลัง merge ทั้งหมด)
- **main = v185** (`8a0d27f`) · PR [#28](https://github.com/Tsuketee/kotoneko/pull/28) (v137–v167) · [#29](https://github.com/Tsuketee/kotoneko/pull/29) (v168–v169 + hook) · #30 #31 (แผนถอนวัชพืช v170–v185 จาก session `claude/check-pr-29-ci-x8a185`) **merge ครบแล้ว** · ไม่มี PR ค้าง
- **`npm run check` บน main ผ่านทั้ง 12 ขั้น**: type · lint 0 · schema 9/9 · data 0 จุด · determinism · featuremap · version · test-count · unit 12/12 · hooks 20/20 · e2e 67/67 · flows 9/9
- งานใหม่ให้เริ่ม branch จาก main ล่าสุด · push แบบ force ถูกระบบปฏิเสธ ถ้าต้องตามให้ทัน main ให้ใช้ `git merge origin/main`

## hook ใน session ที่เปิดหลาย repo (แก้แล้ว 2026-11-24 · B1)
- session ที่เปิดหลาย repo เริ่มที่ `/home/user` จึงไม่โหลด `kotoneko/.claude/settings.json` (พบ 2026-11-23 · hook ไม่เคยทำงานใน session แบบนี้จนถึง 2026-11-24)
- ทางแก้: setup script ของสภาพแวดล้อม cloud "Kotoneko" (เจ้าของอนุมัติ 2026-11-24) รัน `npm ci` ใน kotoneko และ `node kotoneko/tools/hooks/install-parent.js` ทุกครั้งที่สร้างเครื่องใหม่ → เขียน `/home/user/.claude/settings.json` ที่เรียก hook ชุดเดียวกันด้วย path เต็ม และตั้ง `CLAUDE_PROJECT_DIR` เป็น kotoneko (session ที่เปิดที่ kotoneko เองจะข้าม ไม่รันซ้ำ)
- **มีผลหลัง merge เข้า main** (setup script ข้ามถ้ายังไม่มี `install-parent.js` บน main) · ทดสอบแล้วในเครื่อง 2026-11-24 ด้วย `claude -p` ที่ `/home/user`: SessionStart/UserPromptSubmit เขียน `kotoneko/test-results/` และ Stop ได้ช่อง `last_assistant_message` `transcript_path` จริง · **ยังไม่ได้ทดสอบบนเครื่องใหม่จริงที่ setup script รันเอง**
- เริ่ม session ใหม่ให้ตรวจ: `node kotoneko/tools/hooks/install-parent.js --check` (จาก `/home/user`) และมี `kotoneko/test-results/session-base.json` · ถ้าไม่มี แปลว่า hook ไม่ถูกโหลด ให้รันคำสั่งติดตั้งเอง แล้วบอกเจ้าของ

## เริ่ม session ใหม่ต้องทำก่อน
1. `npm ci` (setup script ของสภาพแวดล้อมรันให้แล้วตั้งแต่ 2026-11-24 · ถ้าไม่มี `node_modules` ให้รันเอง) · Chromium ของ Playwright มีในเครื่องแล้ว
2. `git fetch origin main` ก่อนรัน check (ขั้น version/test-count เทียบกับ `origin/main` ถ้าค้างเก่าจะเทียบผิดฐาน · session นี้เคยเจอ origin/main ค้างที่ v34)
3. hook (`.claude/settings.json` · session หลาย repo ใช้ไฟล์ที่ `install-parent.js` เขียน ดูหัวข้อด้านบน): หลังแก้ไฟล์ = lint/type ของไฟล์นั้น · ข้อความเจ้าของมี "เสนอแผนก่อน/ยังไม่ต้องแก้" หรือจะแก้ `js/data/` โดยไม่มีคำอนุมัติ = ขอให้เจ้าของกดอนุญาต · คำสั่ง git ที่ทับไฟล์ในเครื่อง (checkout -- · reset --hard · restore · clean -f · stash ตอนมีไฟล์ค้าง) = ขอให้เจ้าของกดอนุญาต · ก่อนจบ turn = ต้องรัน `npm run check` กับโค้ดล่าสุด ข้อความสุดท้ายต้องมีผล test และถ้าแก้ `js/` (นอก `js/data/`) หรือ `css/` ต้องอ้างภาพใน `test-results/` หรือส่งภาพให้เจ้าของ · เรียก `/verify-app` ก่อนบอกว่าเสร็จ

## งานที่ทำใน session นี้
| เวอร์ชัน | งาน |
|---|---|
| v137–v142 | (รอบก่อนหน้าใน branch `claude/affectionate-hypatia-hmsdap`) CI ตรวจ VERSION · CLAUDE.md สั้น · FEATURE_MAP · corrections-log · flows แบบผู้ใช้จริง · tsc strict · ESLint กฎแบ่งชั้น · `npm run check` · hook ตรวจไฟล์ |
| v143 | **ฝึกเขียนด้วยนิ้วได้** + กันฝ่ามือ (`PALM_MS` 1 วินาที · ปากกาแตะลงระหว่างนิ้วลากลบเส้นนิ้ว) · flows 06b |
| v144 | corrections-log 1ก–1จ |
| v145 | **Stop hook** ไม่ให้จบ turn ถ้าโค้ดเปลี่ยนหลัง check (`tools/hooks/stop-check.js` · `tests/hooks.js`) |
| v146 | README หัวข้อ "สั่งงาน Claude Code" (plan mode) |
| v147–v148 | ขั้น determinism + แก้ test แมว 3 ข้อให้ผลเท่ากันทุกวัน |
| v149 | FEATURE_MAP อ้าง e2e ด้วยคำในชื่อข้อ + ขั้น featuremap |
| v150 | SKILL verify-app 3ข–3ฉ · console error มี URL ต้นทาง |
| v151–v154 | ESLint `noInlineConfig` · ขั้น version · ลบ DoD ข้อ 1 · ขั้น test-count (`CHECK_BASE`) |
| v155–v159 | **lint 134 → 0** ตาม `docs/LINT_PLAN.md` (ก–จ) · `CLOUD_HOOKS` · ฟังก์ชันที่เก็บข้อมูล `readJSON` `writeJSON` `readStr` `writeStr` ใน `js/level.js` · เขียนในเครื่องไม่ได้แจ้งผู้ใช้ครั้งเดียว · ไม่ไปหน้า Google ถ้าเก็บ code_verifier ไม่ได้ · ฟังเสียงไม่ได้แจ้งผู้ใช้ |
| v160 | **schema ข้อมูล (zod)** `tools/data-schema.js` · `npm run validate:data` · ขั้น schema/data ใน check · เริ่มที่ 972 จุด |
| v161 | คุนแยกโอกุริงานะด้วย `.` (หน้าจอยังแสดงวงเล็บผ่าน `kunShow`) |
| v162–v163 | แหล่งที่มาค่าเริ่มต้นต่อไฟล์ `SRC_KANJI` `SRC_CONTENT` `SRC_EX` (ใส่รายรายการได้) · ห้ามชื่อตำรา Irodori/Minna/Genki |
| v164–v165 | บทสนทนา `ผู้พูด\|ประโยค\|คำแปล` + ปุ่ม "คำแปล" · **คำแปล 116 บรรทัด AI ร่าง เจ้าของอนุมัติ** (`docs/dialogue-translations-draft.md`) |
| v166 | คำตัวอย่าง 39 คำระบุ `เกินระดับ` · คำอ่านวลียอม `、。！？` · 三百 = "300 (สามร้อย)" → validate:data 0 จุด |
| v167 | บันทึกส่งต่องาน (merge ใน PR #28) |
| v168 | corrections-log ก1–ก5 (ขอบเขตงาน 7 · DoD 5 · ห้ามเดา 3 · ทำทีละข้อ 2 · แถวใหม่ห้ามแก้ข้อมูลโดยไม่ถาม) |
| v169 | ค1–ค5: `pet-grid.js` สร้างโฟลเดอร์เอง · SKILL ขั้น 2.5 `git fetch` · e2e `snap()` · SKILL ขั้น 3/4 · **ตัวตรวจ VERSION บังคับเพิ่มเฉพาะเมื่อไฟล์ที่ผู้ใช้โหลด (`FILES` ใน `sw.js`) เปลี่ยน** |
| (ไม่ต้องเพิ่ม VERSION) | ข1–ข3 hook: `prompt-start.js` (UserPromptSubmit) · `approval-gate.js` (PreToolUse ask) · `stop-check.js` บล็อกเมื่อไฟล์/ข้อมูลเปลี่ยนผิดขอบเขต หรือไม่แนบผล test · กติกาคำใน `tools/hooks/gate-rules.js` · ข2(ข) ทุกไฟล์ใน `js/data/` ต้องมีใน NOTICE.md · ง1–ง4 ลบบรรทัด CLAUDE.md ที่ตัวตรวจครอบแล้ว |

## รอเจ้าของตัดสิน
1. **hook ใน session ที่เปิดหลาย repo**: แก้แล้ว รอยืนยันบนเครื่องใหม่หลัง merge (ดูหัวข้อด้านบน) · ตั้ง branch protection ถ้ายังไม่ได้ตั้ง (Settings → Branches → require "npm run check" และ "เพิ่มเลข VERSION แล้ว")
2. ✅ ชื่อช่อง `prompt` (UserPromptSubmit) และ `last_assistant_message` `transcript_path` (Stop) ยืนยันแล้ว 2026-11-24 จากข้อมูลจริงที่ hook ได้รับ
3. **แผน "ถอนวัชพืช" 17 ข้อ: ทำครบแล้ว (2026-11-23 · v170–v185 · เจ้าของอนุมัติทั้งหมด)** ดูตารางด้านล่าง · เจ้าของตัดสิน 2026-11-23: `style.css` ไม่แยก · ไม่ใช้ Prettier
4. เรื่องเดิม: ลองบน iPad จริง (นิ้ว/Pencil/กันฝ่ามือ · โหมดส่วนตัว · เสียงอ่าน · ปุ่มคำแปล) · กติการ้านค้า/ลายขน/เครื่องประดับ (`docs/PET_PIXEL.md`)

### แผนถอนวัชพืช (สรุป)
| # | สิ่งที่ทำ | ความเสี่ยง |
|---|---|---|
| 1 | ✅ ลบโค้ดตาย `goalHtml` `undo` (v170) · ลบ npm script `test` `test:unit` `test:e2e` (README ใช้ `npm run check`) · ไม่ลบ `pvars` (`pline` ยังใช้ · เจ้าของตัดออก 2026-11-23) · เป้ารายวันเหลือตัวเดียว `M.goal` พิมพ์เองได้ 1–200 (v171 · เจ้าของเลือก) · ลบ CSS `.gl` | ต่ำ |
| 2 | ✅ ลบ comment `sw.js:2` (ขั้น version ครอบ) และ `sw.js:71` (เพิ่ม e2e "PWA:" ออฟไลน์เปิด `?paid=n4` ได้ · v172) · `pet-lines.js:11` เก็บไว้ (กฎห้ามใช้ผลงานผู้อื่นตรวจได้แค่รายชื่อต้องห้าม · เจ้าของเลือก 2026-11-23) | ต่ำ |
| 3 | ✅ e2e "โครงสร้าง:" ลำดับ `<script>` (data → level → core → ตรรกะ → main) · ทุกไฟล์ใน `js/` `js/data/` โหลดครั้งเดียว · ชื่อระดับบนสุดไม่ซ้ำข้ามไฟล์ (อ่านด้วย TypeScript parser) · `pet-lines.js:11` ของข้อ 2 เก็บไว้ตามเดิม (เจ้าของเลือก) | ต่ำ |
| 4 | ✅ e2e "iPad กันซูม": meta viewport · html `touch-action:pan-y` ไม่เลื่อน/เด้งแนวนอน · gesture* และสองนิ้วถูกกัน นิ้วเดียวเลื่อนได้ · ช่องเขียน `none` · ฉากแมว `manipulation` (comment เดิมเขียนผิดว่า none) · ลบ comment `main.js:2` `style.css:5` · v173 | ต่ำ |
| 5 | ✅ e2e "แมวพิกเซล: แตะแมวทุกแบบ" (หัว/ตัว/หาง/แตะรัวจนเดินหนี/กดค้าง/ตอนหลับ/Enter) ความสนิท Energy ภารกิจ และค่าที่บันทึกไม่เปลี่ยน · `pixelcat.js:1553` เหลือแค่ "ห้ามขู่/โก่งหลัง" (ไม่มีตัวตรวจ · ข้อ 6) · v174 | ต่ำ |
| 6 | ✅ กติกาการออกแบบที่ test ไม่ได้ 7 ข้อ → `docs/PET_PIXEL.md` หัวข้อ "กติกาการออกแบบที่ test ตรวจไม่ได้" · comment ในโค้ดเหลือตัวชี้ไปหัวข้อนั้น (รวมกฎห้ามขู่ที่เหลือจากข้อ 5) · v175 | ต่ำ |
| 7 | ✅ ขั้น version: `apple-touch-icon-vN.png` เปลี่ยนหน้าตาแต่ชื่อเดิม (เทียบไฟล์กับฐาน) → ไม่ผ่าน · e2e "ไอคอน:" มีไฟล์เดียว ชื่อตรงกันใน index.html sw.js tools/icon.html · hooks 20 ข้อ · ลบ comment `make-icons.js:2` `index.html:12` · v176 | ต่ำ |
| 8 | ✅ `esc` ตัวเดียวใน `js/core.js` (รวม `esc` ของ `cloud.js` `town.js` และ `pesc` ของ `profile.js`) · e2e "ความปลอดภัย:" ห้ามมีตัวแปลง HTML ในไฟล์อื่น + ชื่อที่มีแท็กไม่กลายเป็น HTML · v177 | ต่ำ–กลาง |
| 9 | ✅ อ่านความคืบหน้าวิธีเดียว `snapshot()` ย้ายไป `js/stats.js` ข้าง `PK` · ส่งออกไฟล์และซิงก์ใช้ตัวเดียวกัน · e2e "ส่งออก/นำเข้า:" ตรวจไฟล์ = snapshot และห้ามมีตัวอ่านซ้ำ · v178 | กลาง |
| 10 | ✅ เขียนความคืบหน้าวิธีเดียว `writeProg(d, all)` ใน `js/stats.js` (แทน `applyData` และการเขียนใน `importProg`) · `packs.js` ใช้ `writeJSON`/`writeStr` · ESLint ให้แตะ localStorage ได้แค่ `js/level.js` · e2e "ที่เก็บข้อมูล:" · v179 | กลาง |
| 11 | ✅ `tests/pet-grid.js` เปิดแอปจริงและใช้ `js/pixelcat.js` (ตาราง 2 ภาพ + จำลองฉาก 30 นาทีผ่าน + ฉากกลางวัน/กลางคืน) · ESLint เลิกอ่าน `docs/pixel-cat10.html` · ลบร่างเก่า 9 ไฟล์ใน `docs/` (เจ้าของสั่ง · ดูได้จาก git `b3e20b8`) · v180 | กลาง |
| 12 | ✅ `tests/e2e.js` เหลือแค่ตัวรัน · ข้อทดสอบ 67 ข้อแยกเป็น `tests/e2e/` data main pet places cloud packs device + `harness.js` (ชื่อข้อครบเดิม) · test-count นับชุด e2e รวมกัน · featuremap/determinism อ่านทุกไฟล์ในชุด | ต่ำ |
| 13 | ✅ `pet.js` → `onboard.js` (ตั้งค่าครั้งแรก) + `rewards.js` (ภารกิจ ความสนิท เหรียญ) · ย้ายทั้งคำสั่งด้วย parser ตรวจแล้วบรรทัดครบไม่ซ้ำ · v181 | กลาง |
| 14 | ✅ `learn.js` → `srs.js` (ทบทวนเว้นระยะ) + `quiz.js` (เลือกข้อ/ตอบ/บันทึก) + `mistakes.js` (หน้าผิดบ่อย) + `kanachart.js` (ตารางคานะ) · บรรทัดครบไม่ซ้ำ · v182 | กลาง |
| 15 | ✅ `cloud.js` → `cloud-sync.js` (ซิงก์) · auth กับ API อยู่ `cloud.js` ต่อ (ESLint ให้เรียกเน็ตได้แค่ `cloud.js`) · `packs.js` → `buy.js` (ซื้อ + ขอคืนเงิน) · บรรทัดครบไม่ซ้ำ · v183 | กลาง |
| 16 | ✅ ฉาก 7 สถานที่ (582 บรรทัด) แยกจาก `pixelcat.js` เป็น `js/scenes.js` แบบ factory `PixelScenes(kit)` · บล็อกย้ายมาตรงทุกบรรทัด · เทียบพิกเซล 336 ภาพ (7 ที่ × 4 ฤดู × 4 ช่วงเวลา × 3 เวลา · ตรึงนาฬิกา/สุ่ม/แมวออกนอกเฟรม) ตรงทุกภาพ · v184 | สูง |
| 17 | ✅ `town.js` เหลือแค่แผนที่ `TownMap` · `placeAsk()` ย้ายไป `js/place.js` · v185 · `style.css` ไม่แยก (เจ้าของยืนยัน · ใช้ร่วมกับ about/privacy/terms · ลำดับกฎ CSS ผูกกันทั้งไฟล์) | กลาง |

## ข้อควรระวังที่เจอใน session นี้
- **ข้อมูล (`js/data/`)**: ห้ามแก้เพื่อให้ validate:data ผ่าน และห้ามแต่งคำอ่าน/ความหมาย/คำแปลเอง ต้องถามเจ้าของทุกครั้ง · ร่างใส่ไฟล์แยกให้ตรวจก่อน (แบบ `docs/dialogue-translations-draft.md`)
- zod ไม่รันกฎระดับทั้งระเบียน (`superRefine`) ถ้าช่องอื่นผิดอยู่ → กฎคันจิเกินชุดจึงแยกเป็น `VocabLevel`
- Node 22 อ่าน `.ts` แบบตัด type อย่างเดียว ห้ามใช้ parameter property (`constructor(readonly x)`) · `tests/payment.mjs` จะล้ม
- ESLint ไม่มี formatter `unix` ในตัวแล้ว (grep ผลจะว่างเงียบ) ใช้ `--format json` หรือค่าเริ่มต้น
- `々` เป็น Script=Han แต่ไม่ใช่คันจิที่ต้องเรียน · ตัวตรวจข้อมูลยกเว้นไว้แล้ว
- คำเตือนใน console ที่แอปตั้งใจพิมพ์ (`console.warn` พร้อมบริบท เช่น "อ่านราคา n3 ไม่ได้ ถือว่ายังไม่เปิดขาย") ไม่ใช่ error
- hook ขอบเขตงานจับคำในข้อความล่าสุดของเจ้าของเท่านั้น คำตอบผ่านหน้าต่างถามตัวเลือก (AskUserQuestion) hook มองไม่เห็น ถ้าแก้ `js/data/` ตามคำตอบแบบนั้น จะมีหน้าต่างขออนุญาตขึ้น ให้เจ้าของกดอนุญาต
- typescript-eslint 8.73 รองรับ TypeScript ถึง 6.0 (ใช้ 6.0.3) · `pet-grid.js` ต้องสร้างโฟลเดอร์ผลลัพธ์ก่อน (`mkdir -p`)
- 404/403/409 ใน console ของ e2e ที่ URL `https://sb.test/` มาจาก Supabase จำลองที่ตั้งใจตอบแบบนั้น

## ข้อความเริ่ม session ใหม่
> อ่าน `docs/HANDOFF.md` ก่อน ตรวจว่า hook ถูกโหลด (`node kotoneko/tools/hooks/install-parent.js --check`) รัน `git fetch origin main` แล้วถามผมเรื่องที่ค้างในหัวข้อ "รอเจ้าของตัดสิน"
