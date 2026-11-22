// เจ้าเหมียวเที่ยวญี่ปุ่น: ฉากหลังของการ์ดสัตว์เลี้ยงตามสถานที่ (ข้อมูลใน js/data/places.js · สีใน css/style.css หัวข้อ "ฉากสถานที่")
// สถานะเก็บใน M.place = {at: ที่ที่อยู่ตอนนี้, got: [ที่ที่ปลดล็อกแล้ว นอกจากที่ฟรี], fam: {ที่: [จำนวนวันที่เคยอยู่, วันล่าสุด]}} อยู่ใน kn_meta จึงส่งออกและซิงก์ไปพร้อมความคืบหน้า
// อยู่ที่ไหน ปุ่มทบทวนจะเอาคำในหมวดของที่นั้นขึ้นก่อน (placeCats ใช้ใน pick1 ของ js/learn.js)
const placeOf = id => PLACES.find(p => p.id === id) || PLACES[0];
// ยังไม่เคยเลือก/ปลดล็อก: ใช้ค่าเริ่มต้นโดยไม่เขียนลง M (ไม่ให้ข้อมูลเปลี่ยนแค่เพราะเปิดหน้าแรก ซึ่งจะทำให้ซิงก์ส่งรุ่นใหม่ขึ้นเปล่าๆ)
// fam = {ที่: [จำนวนวันที่แมวเคยอยู่ที่นั้น, วันล่าสุด]} ไว้ทำช่วงปรับตัวในที่ไม่คุ้น (plVisit)
function plState() { const m = M.place && typeof M.place === 'object' ? M.place : {}, st = { at: PLACES.some(p => p.id === m.at) ? m.at : 'room', got: Array.isArray(m.got) ? m.got.filter(id => PLACES.some(p => p.id === id)) : [] }; if (m.fam && typeof m.fam === 'object') st.fam = m.fam; return st }
function plSave(st) { M.place = st; saveM() }
const plHas = p => !!p.free || plState().got.includes(p.id);
// นับวันที่แมวอยู่ที่นั้น (เรียกจาก petMount ตอนวาดหน้าแรก เขียนลง M วันละครั้งต่อที่) คืนจำนวนวันรวมวันนี้ ให้แมวพิกเซลระวังตัวในที่ใหม่ช่วงไม่กี่วันแรก (รายงานพฤติกรรมข้อ 10 · v83)
// ห้องอ่านหนังสือคือบ้าน ไม่นับ · ผู้ใช้เดิมที่อยู่ที่อื่นอยู่แล้วตอนอัปเดต (ยังไม่มี fam) ถือว่าคุ้นแล้ว แมวจะได้ไม่กลับมาระวังตัวในที่ที่อยู่มาเป็นเดือน
function plVisit() {
  const st = plState();
  if (st.at === 'room') return 99; // อยู่บ้านไม่เขียนอะไรลง M (ซิงก์จะได้ไม่ส่งรุ่นใหม่ขึ้นเปล่าๆ)
  if (!st.fam) st.fam = { [st.at]: [3, ''] }; // ครั้งแรกหลังอัปเดต: ที่ที่อยู่ตอนนี้ถือว่าคุ้นแล้ว (ไปที่ใหม่จาก placeAsk จะมี fam แล้ว)
  const k = dstr(new Date()), v = Array.isArray(st.fam[st.at]) ? st.fam[st.at] : [0, ''];
  if (v[1] !== k) { st.fam[st.at] = [v[0] + 1, k]; plSave(st) }
  return st.fam[st.at][0];
}
const placeCats = () => { if (!M.pet || !M.pet.name) return null; const c = placeOf(plState().at).cats; return c.length ? c : null };
// จำนวนคำในหมวดที่ระบุที่จำได้แม่น (คำคันจิ + คำศัพท์คะนะ ของระดับที่เปิดอยู่)
function plCount(cats) {
  let n = 0;
  ['w', 'v'].forEach(k => { let s = {}; try { s = JSON.parse(localStorage.getItem(DS[k].key) || '{}') } catch (e) {} DS[k].d.forEach(x => { if (cats.includes(x.c) && s[x.k] && s[x.k].b >= MASTERY) n++ }) });
  return n;
}
// ปลดล็อกที่ใหม่เมื่อถึงเกณฑ์ (เรียกตอนวาดหน้าแรก) · ปลดล็อกแล้วเก็บถาวร เปลี่ยนระดับก็ไม่หาย
function plCheck() {
  const st = plState(); let nw = null;
  PLACES.forEach(p => { if (!plHas(p) && p.unlock && plCount(p.unlock.cats) >= p.unlock.n) { st.got.push(p.id); nw = p } });
  if (nw) { plSave(st); toast(icx('sparkle', 16) + ' ได้ตั๋วไป' + nw.n + 'แล้ว! แตะตั๋ว "ไปเที่ยว" บนการ์ดเจ้าตัวน้อยได้เลย') }
}
// ประโยคในกล่องคำพูด: ถ้าไม่ใช่ห้อง ทุกชั่วโมงคู่จะใช้ประโยคประจำสถานที่แทนประโยคตามช่วงเวลา (ประโยคเหตุการณ์สำคัญยังขึ้นตามเดิม)
function plSay(say, generic) {
  const at = plState().at, L = PLACE_LINES[at];
  if (!L || !generic || new Date().getHours() % 2) return say;
  return rb(L[(new Date().getDate() + new Date().getHours()) % L.length]);
}
// px = แมวพิกเซล: ใช้ฉากพิกเซล 160×90 ของสถานที่นั้น (SCENES ใน js/pixelcat.js) แทนภาพ SVG กับอิโมจิ ผืนผ้าใบ #petcv ถูกใส่แมวใน petMount()
// กระต่าย/หมายังใช้ฉาก SVG กับอิโมจิ
// กลางวัน/กลางคืนของฉากตามเวลาจริง (ใช้เกณฑ์เดียวกับแมวพิกเซล) สีของฉากอยู่ใน css หัวข้อ "ฉากสถานที่" (.scn[data-tod])
const plTod = () => window.PixelCat ? PixelCat.tod() : (h => h >= 5 && h < 7 ? 'dawn' : h >= 7 && h < 17 ? 'day' : h >= 17 && h < 19 ? 'dusk' : 'night')(new Date().getHours());
function placeHero(say, pet, size, px) {
  const p = placeOf(plState().at), tk = `<button class="scgo" onclick="placeAsk()" title="เลือกสถานที่">${icx('ticket', 18)}<span>ไปเที่ยว</span></button>`;
  // ฉากพิกเซล: ตั๋วอยู่แถวชื่อสถานที่ใต้ฉาก เพราะกล่องคำพูดลอยตามแมวไปทั่วฉาก
  return `<div class="scn${px ? ' px' : ''}" data-place="${p.id}" data-tod="${plTod()}">${px ? '<canvas id="petcv"></canvas>' : `<svg viewBox="0 0 820 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${p.svg}</svg>`}
<div class="pzb scb ${p.bub === 'r' && !px ? 'r' : ''}">${say}</div>
${px ? '' : `<div class="scp" style="left:${p.pet[0]}%;top:${p.pet[1]}%"><span class="pet" style="font-size:${size}px">${pet}</span></div>`}
${px ? '' : tk}</div>
<div class="st scl${px ? ' px' : ''}"><span><span class="scj">${rb(p.jp)}</span> ${p.n}${p.cats.length ? ' · ทบทวนคำหมวด' + p.note + 'ก่อน' : ' · ' + p.note}</span>${px ? tk : ''}</div>`;
}
// หน้าต่างเลือกที่เที่ยว placeAsk() เป็นแผนที่เมืองพิกเซล อยู่ใน js/town.js
