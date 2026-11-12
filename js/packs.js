// แพ็กเนื้อหาเสียเงิน: ตรวจสิทธิ์ ดาวน์โหลด สลับระดับ และหน้าอัปโหลดของผู้ดูแล (ข้อมูลอยู่ใน Supabase ตาราง entitlements / content_packs ดู supabase/schema.sql)
// สถานะล่าสุดจากเซิร์ฟเวอร์เก็บใน localStorage key 'kn_packs' = {ent:[ระดับที่มีสิทธิ์], ver:{ระดับ:เวอร์ชันบนเซิร์ฟเวอร์}, admin:bool, t:เวลาที่ตรวจ}
const PSK = 'kn_packs';
let PS = {}; try { PS = JSON.parse(localStorage.getItem(PSK) || '{}') } catch (e) { PS = {} }
const psave = () => { try { localStorage.setItem(PSK, JSON.stringify(PS)) } catch (e) {} };
const PAID = ['n4'];  // ระดับที่มีแพ็กแล้ว (N3 ยังไม่มีเนื้อหา)
function packLocal(l) { try { const p = JSON.parse(localStorage.getItem(PACKK(l)) || 'null'); return p && p.level === l ? p : null } catch (e) { return null } }
const packHas = l => (PS.ent || []).includes(l) || !!packLocal(l);
function lvGo(l, msg) { try { localStorage.setItem(LVK, l); if (msg) sessionStorage.setItem('kn_lvmsg', msg) } catch (e) {} location.reload() }

// ---------- การ์ดระดับในหน้าแรก (เรียกจาก pathHtml) ----------
function lvCard(l) {
  const L = LEVELS[l];
  if (l === 'n5') return `<div class="pc" onclick="lvSwitch('n5')"><div class="pb"><b>N5</b><div class="st">แตะเพื่อกลับไปเรียน N5 · ความคืบหน้าแต่ละระดับเก็บแยกกัน</div></div><div class="pg2">${L.g}</div></div>`;
  if (PAID.includes(l) && packHas(l)) return `<div class="pc" onclick="lvSwitch('${l}')"><div class="pb"><b>${L.n}</b><span class="bd b3">ปลดล็อกแล้ว</span><div class="st">แตะเพื่อเปลี่ยนไปเรียน ${L.n}</div></div><div class="pg2">${L.g}</div></div>`;
  const s = !PAID.includes(l) || !cloudOn() ? 'เนื้อหากำลังมา' : !cloudIn() ? 'เนื้อหาเสียเงิน · เข้าสู่ระบบเพื่อตรวจสิทธิ์' : 'เนื้อหาเสียเงิน · เปิดขายเร็วๆ นี้';
  return `<div class="pc lk0" onclick="lvLocked('${l}')"><div class="pn">${icx('lock', 16)}</div><div class="pb"><b>${L.n}</b><div class="st">${s}</div></div><div class="pg2">${L.g}</div></div>`;
}
function lvLocked(l) {
  const n = LEVELS[l].n;
  if (!PAID.includes(l) || !cloudOn()) return toast(n + ' กำลังเตรียมเนื้อหาอยู่ค่ะ');
  if (!cloudIn()) { tab = 'stats'; render(); setTimeout(() => { const c = document.getElementById('cloud'); if (c) c.scrollIntoView({ block: 'center' }) }, 50); return toast('เข้าสู่ระบบก่อนนะคะ แล้วระบบจะตรวจสิทธิ์ ' + n + ' ให้') }
  toast('บัญชีนี้ยังไม่ได้ปลดล็อก ' + n + ' ค่ะ ระบบซื้อกำลังจะเปิดเร็วๆ นี้');
}
let lvBusy = false;
async function lvSwitch(l) {
  if (l === LV) return openLv();
  if (l === 'n5') return lvGo('n5');
  const p = packLocal(l);
  if (p) { try { packParse(p); return lvGo(l) } catch (e) { localStorage.removeItem(PACKK(l)) } }
  if (!cloudOn() || !cloudIn()) return lvLocked(l);
  if (lvBusy) return; lvBusy = true;
  toast('กำลังดาวน์โหลดเนื้อหา ' + LEVELS[l].n + '…');
  try { await packFetch(l); lvGo(l, 'เปลี่ยนเป็นระดับ ' + LEVELS[l].n + ' แล้วค่ะ') }
  catch (e) { lvBusy = false; toast(e.noEnt ? 'บัญชีนี้ยังไม่ได้ปลดล็อก ' + LEVELS[l].n + ' ค่ะ' : 'ดาวน์โหลดไม่สำเร็จ: ' + e.message) }
}

// ---------- เซิร์ฟเวอร์ ----------
async function packFetch(l) {
  await cloudToken();
  const r = await sb('/rest/v1/content_packs?select=version,data&level=eq.' + l);
  if (!r || !r.length) { const e = new Error('no entitlement'); e.noEnt = true; throw e }
  const p = r[0].data; packParse(p);   // ตรวจก่อนเก็บ แพ็กเสียจะไม่ถูกบันทึก
  try { localStorage.setItem(PACKK(l), JSON.stringify(p)) } catch (e) { throw new Error('พื้นที่ในเครื่องไม่พอ') }
  return p;
}
async function packCheck() {
  if (!cloudOn() || !cloudIn() || !navigator.onLine) return;
  try {
    await cloudToken();
    const ent = (await sb('/rest/v1/entitlements?select=level')).map(r => r.level);
    const ver = {}; (await sb('/rest/v1/content_packs?select=level,version')).forEach(r => ver[r.level] = r.version);
    let admin = false; try { admin = (await sb('/rest/v1/rpc/is_admin', { method: 'POST', body: {} })) === true } catch (e) {}
    const before = JSON.stringify([PS.ent, PS.admin]);
    PS = { ent, ver, admin, t: Date.now() }; psave();
    for (const l of PAID) {
      const p = packLocal(l), allowed = ent.includes(l) || (admin && ver[l]);
      if (p && !allowed) {   // ถูกถอนสิทธิ์: ลบแพ็กออกจากเครื่อง
        localStorage.removeItem(PACKK(l));
        if (LV === l) return lvGo('n5', 'บัญชีนี้ไม่มีสิทธิ์ ' + LEVELS[l].n + ' แล้ว จึงกลับมาที่ N5 ค่ะ');
      } else if (p && ver[l] > p.version) {   // มีเวอร์ชันใหม่: ดาวน์โหลดไว้ ใช้เมื่อเปิดแอปครั้งถัดไป
        try { await packFetch(l); if (LV === l) toast('อัปเดตเนื้อหา ' + LEVELS[l].n + ' แล้ว จะใช้เมื่อเปิดแอปครั้งถัดไปค่ะ') } catch (e) {}
      }
    }
    if (before !== JSON.stringify([PS.ent, PS.admin]) && (tab === 'home' || tab === 'stats') && !document.querySelector('.cov')) render();
  } catch (e) {}
}
// ออกจากระบบ / ลบบัญชี / การเข้าสู่ระบบหมดอายุ: แพ็กผูกกับบัญชี จึงลบออกจากเครื่องและกลับไป N5
function packsClear() {
  Object.keys(LEVELS).forEach(l => { try { localStorage.removeItem(PACKK(l)) } catch (e) {} });
  PS = {}; try { localStorage.removeItem(PSK) } catch (e) {}
  if (LV !== 'n5') lvGo('n5', 'ออกจากระบบแล้ว กลับมาที่ N5 ค่ะ');
}
const _cloudForget = cloudForget;
cloudForget = function () { _cloudForget(); packsClear() };
const _cloudVerify = cloudVerify;
cloudVerify = async function () { await _cloudVerify(); if (cloudIn()) packCheck() };

// ---------- ผู้ดูแล: อัปโหลดแพ็ก (ไฟล์ packs/<ระดับ>.json จาก repo เนื้อหา) ----------
function packAdminHtml() {
  if (!PS.admin) return '';
  const v = Object.entries(PS.ver || {}).map(([l, n]) => (LEVELS[l] ? LEVELS[l].n : l) + ' v' + n).join(' · ') || 'ยังไม่มีแพ็กบนเซิร์ฟเวอร์';
  return `<div class="st" style="margin-top:14px;border-top:1px solid var(--bd);padding-top:12px"><b>ผู้ดูแล</b> · แพ็กบนเซิร์ฟเวอร์: ${v}</div><div class="btns" style="margin-top:8px"><button onclick="document.getElementById('pku').click()">อัปโหลดแพ็กเนื้อหา</button></div><input id="pku" type="file" accept="application/json,.json" style="display:none" onchange="packUpload(this)">`;
}
function packUpload(el) {
  const f = el.files[0]; el.value = ''; if (!f) return;
  const r = new FileReader();
  r.onload = async () => {
    let p; try { p = JSON.parse(r.result); packParse(p) } catch (e) { return toast('ไฟล์แพ็กไม่ถูกต้อง: ' + e.message) }
    const n = LEVELS[p.level].n, old = (PS.ver || {})[p.level];
    if (old && p.version <= old && !confirm(`เวอร์ชันบนเซิร์ฟเวอร์ (${old}) ใหม่กว่าหรือเท่ากับไฟล์นี้ (${p.version}) ต้องการอัปโหลดทับไหมคะ?`)) return;
    if (!confirm(`อัปโหลดแพ็ก ${n} เวอร์ชัน ${p.version} ใช่ไหมคะ? ผู้ที่มีสิทธิ์จะได้เนื้อหานี้`)) return;
    try {
      await cloudToken();
      await sb('/rest/v1/content_packs', { method: 'POST', body: { level: p.level, version: p.version, data: p }, prefer: 'resolution=merge-duplicates,return=minimal' });
      toast('อัปโหลดแพ็ก ' + n + ' แล้วค่ะ'); await packCheck(); render();
    } catch (e) { toast('อัปโหลดไม่สำเร็จ: ' + e.message) }
  };
  r.onerror = () => toast('อ่านไฟล์ไม่สำเร็จ'); r.readAsText(f);
}

function packStart() {
  try { const m = sessionStorage.getItem('kn_lvmsg'); if (m) { sessionStorage.removeItem('kn_lvmsg'); toast(m) } } catch (e) {}
  packCheck();
}
