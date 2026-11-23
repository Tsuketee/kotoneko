// แพ็กเนื้อหาเสียเงิน: ตรวจสิทธิ์ ดาวน์โหลด สลับระดับ และหน้าอัปโหลดของผู้ดูแล (ข้อมูลอยู่ใน Supabase ตาราง entitlements / content_packs ดู supabase/schema.sql)
// สถานะล่าสุดจากเซิร์ฟเวอร์เก็บใน localStorage key 'kn_packs' = {ent:[ระดับที่มีสิทธิ์], ver:{ระดับ:เวอร์ชันบนเซิร์ฟเวอร์}, admin:bool, t:เวลาที่ตรวจ,
//   price:{ระดับ:{amount,currency}} (ระดับที่เปิดขายแล้ว), buy:{l,t} (กำลังไปจ่ายเงิน)}
// การซื้อ: Edge Function 'checkout' สร้างหน้าชำระเงิน Stripe → 'stripe-webhook' เพิ่มสิทธิ์ใน entitlements (ดู docs/PAYMENT.md)
const PSK = 'kn_packs';
let PS = readJSON(PSK, {}), RR = null;
const psave = () => writeJSON(PSK, PS);
const PAID = ['n4', 'n3'];  // ระดับเสียเงินที่มีแพ็กเนื้อหาแล้ว
function packLocal(l) { const p = readJSON(PACKK(l), null); return p && p.level === l ? p : null }
const packEnt = l => (PS.ent || []).includes(l);
// พร้อมเรียน = มีแพ็กในเครื่อง หรือมีสิทธิ์ (ผู้ดูแลถือว่ามีสิทธิ์) และมีแพ็กบนเซิร์ฟเวอร์
const packReady = l => !!packLocal(l) || ((packEnt(l) || PS.admin) && !!(PS.ver || {})[l]);
const packWait = l => !packReady(l) && packEnt(l);   // ปลดล็อกแล้ว แต่ผู้ดูแลยังไม่ได้อัปโหลดเนื้อหา
function lvGo(l, msg) { writeStr(LVK, l); if (msg) writeStr('kn_lvmsg', msg, true); location.reload() }

// ---------- การ์ดระดับในหน้าเรียน (เรียกจาก pathHtml ในหน้ารวมของแท็บเรียน) ----------
function lvCard(l) {
  const L = LEVELS[l];
  if (l === 'n5') return `<div class="pc" data-testid="path-n5" onclick="lvSwitch('n5')"><div class="pb"><b>N5</b><div class="st">แตะเพื่อกลับไปเรียน N5 · ความคืบหน้าแต่ละระดับเก็บแยกกัน</div></div><div class="pg2">${L.g}</div></div>`;
  if (PAID.includes(l) && packReady(l)) return `<div class="pc" data-testid="path-${l}" onclick="lvSwitch('${l}')"><div class="pb"><b>${L.n}</b><span class="bd b3">ปลดล็อกแล้ว</span><div class="st">แตะเพื่อเปลี่ยนไปเรียน ${L.n}</div></div><div class="pg2">${L.g}</div></div>`;
  const s = !PAID.includes(l) || !cloudOn() ? 'เนื้อหากำลังมา' : !cloudIn() ? 'เนื้อหาเสียเงิน · เข้าสู่ระบบเพื่อตรวจสิทธิ์' : packWait(l) ? 'ปลดล็อกแล้ว · เนื้อหายังไม่พร้อม รออัปเดตสักครู่นะคะ' : buyPrice(l) ? 'แตะเพื่อปลดล็อก · ' + buyPrice(l) + ' ซื้อครั้งเดียว' : 'เนื้อหาเสียเงิน · เปิดขายเร็วๆ นี้';
  return `<div class="pc lk0" data-testid="path-${l}" onclick="lvLocked('${l}')"><div class="pn">${icx('lock', 16)}</div><div class="pb"><b>${L.n}</b><div class="st">${s}</div></div><div class="pg2">${L.g}</div></div>`;
}
function lvLocked(l) {
  const n = LEVELS[l].n;
  if (!PAID.includes(l) || !cloudOn()) return toast(n + ' กำลังเตรียมเนื้อหาอยู่ค่ะ');
  if (!cloudIn()) { tab = 'me'; meView = 'acct'; render(); setTimeout(() => { const c = document.getElementById('cloud'); if (c) c.scrollIntoView({ block: 'center' }) }, 50); return toast('เข้าสู่ระบบก่อนนะคะ แล้วระบบจะตรวจสิทธิ์ ' + n + ' ให้') }
  if (packWait(l)) return toast('บัญชีนี้ปลดล็อก ' + n + ' แล้ว แต่เนื้อหายังไม่พร้อมบนเซิร์ฟเวอร์ ลองใหม่ภายหลังนะคะ');
  if (buyPrice(l)) return buyAsk(l);
  toast('บัญชีนี้ยังไม่ได้ปลดล็อก ' + n + ' ค่ะ ระบบซื้อกำลังจะเปิดเร็วๆ นี้');
}
let lvBusy = false;
async function lvSwitch(l) {
  if (l === LV) return openLv();
  if (l === 'n5') return lvGo('n5');
  const p = packLocal(l);
  if (p) { try { packParse(p); return lvGo(l) } catch (e) { console.warn('แพ็กในเครื่องเสีย ลบทิ้งแล้วดาวน์โหลดใหม่', e); writeStr(PACKK(l), null) } }
  if (!cloudOn() || !cloudIn()) return lvLocked(l);
  if (lvBusy) return; lvBusy = true;
  toast('กำลังดาวน์โหลดเนื้อหา ' + LEVELS[l].n + '…');
  try { await packFetch(l); lvGo(l, 'เปลี่ยนเป็นระดับ ' + LEVELS[l].n + ' แล้วค่ะ') }
  catch (e) { lvBusy = false; if (e.noEnt) { await packCheck(); return lvLocked(l) } toast('ดาวน์โหลดไม่สำเร็จ: ' + e.message) }
}

// ---------- เซิร์ฟเวอร์ ----------
async function packFetch(l) {
  await cloudToken();
  const r = await sb('/rest/v1/content_packs?select=version,data&level=eq.' + l);
  if (!r || !r.length) { const e = new Error('no entitlement'); e.noEnt = true; throw e }
  const p = r[0].data; packParse(p);   // ตรวจก่อนเก็บ แพ็กเสียจะไม่ถูกบันทึก
  if (!writeJSON(PACKK(l), p)) throw new Error('พื้นที่ในเครื่องไม่พอ');
  return p;
}
async function packCheck() {
  if (!cloudOn() || !cloudIn() || !navigator.onLine) return;
  try {
    await cloudToken();
    const er = await sb('/rest/v1/entitlements?select=level,source,created_at'), ent = er.map(r => r.level), src = {};
    er.forEach(r => src[r.level] = { s: r.source, t: Date.parse(r.created_at) || 0 });
    const ver = {}; (await sb('/rest/v1/content_packs?select=level,version')).forEach(r => ver[r.level] = r.version);
    let admin = false; try { admin = (await sb('/rest/v1/rpc/is_admin', { method: 'POST', body: {} })) === true } catch (e) { console.warn('ตรวจสิทธิ์ผู้ดูแลไม่ได้ ถือว่าไม่ใช่ผู้ดูแล', e) }
    const price = {};   // ราคามาจาก Stripe ผ่าน Edge Function ระดับที่ยังไม่เปิดขาย (หรือยังไม่ติดตั้งฟังก์ชัน) จะไม่มีราคา
    for (const l of PAID) if (!ent.includes(l)) { try { const r = await sb(FN, { method: 'POST', body: { action: 'price', level: l } }); if (r && r.amount > 0) price[l] = { amount: r.amount, currency: r.currency } } catch (e) { console.warn('อ่านราคา ' + l + ' ไม่ได้ ถือว่ายังไม่เปิดขาย', e) } }
    // คำขอคืนเงิน: ผู้ใช้เห็นของตัวเอง ผู้ดูแลเห็นทั้งหมด (เก็บในหน่วยความจำเท่านั้น ไม่ลง localStorage) · ยังไม่รัน schema ใหม่ = ไม่มีตาราง ข้ามไป
    let rr = null; try { rr = await sb('/rest/v1/refund_requests?select=id,user_id,email,level,reason,detail,status,created_at&order=created_at.desc&limit=200') } catch (e) { console.warn('อ่านคำขอคืนเงินไม่ได้', e) }
    const before = JSON.stringify([PS.ent, PS.admin, PS.price, PS.src, RR]);
    RR = rr;
    PS = { ent, src, ver, admin, price, buy: PS.buy, t: Date.now() };
    if (PS.buy && (ent.includes(PS.buy.l) || Date.now() - PS.buy.t > 864e5)) delete PS.buy;
    psave();
    for (const l of PAID) {
      const p = packLocal(l), allowed = ent.includes(l) || (admin && ver[l]);
      if (p && !allowed) {   // ถูกถอนสิทธิ์: ลบแพ็กออกจากเครื่อง
        writeStr(PACKK(l), null);
        if (LV === l) return lvGo('n5', 'บัญชีนี้ไม่มีสิทธิ์ ' + LEVELS[l].n + ' แล้ว จึงกลับมาที่ N5 ค่ะ');
      } else if (p && ver[l] > p.version) {   // มีเวอร์ชันใหม่: ดาวน์โหลดไว้ ใช้เมื่อเปิดแอปครั้งถัดไป
        try { await packFetch(l); if (LV === l) toast('อัปเดตเนื้อหา ' + LEVELS[l].n + ' แล้ว จะใช้เมื่อเปิดแอปครั้งถัดไปค่ะ') } catch (e) { console.warn('ดาวน์โหลดแพ็ก ' + l + ' รุ่นใหม่ไม่ได้ จะลองใหม่ครั้งหน้า', e) }
      }
    }
    if (before !== JSON.stringify([PS.ent, PS.admin, PS.price, PS.src, RR]) && ((tab === 'learn' && view === 'path') || tab === 'me') && !document.querySelector('.cov')) render();
  } catch (e) { console.warn('ตรวจสิทธิ์และแพ็กจากเซิร์ฟเวอร์ไม่ได้ ใช้ข้อมูลเดิม', e) }
}
// ออกจากระบบ / ลบบัญชี / การเข้าสู่ระบบหมดอายุ: แพ็กผูกกับบัญชี จึงลบออกจากเครื่องและกลับไป N5
function packsClear() {
  Object.keys(LEVELS).forEach(l => writeStr(PACKK(l), null));
  PS = {}; RR = null; writeStr(PSK, null);
  if (LV !== 'n5') lvGo('n5', 'ออกจากระบบแล้ว กลับมาที่ N5 ค่ะ');
}
CLOUD_HOOKS.forget.push(packsClear);
CLOUD_HOOKS.verified.push(packCheck);

// ---------- ส่วนบัญชี (เรียกจาก js/cloud.js): ขอคืนเงิน + ผู้ดูแล ----------
const packAcctHtml = () => refundHtml() + packAdminHtml();

// ---------- ผู้ดูแล: อัปโหลดแพ็ก (ไฟล์ packs/<ระดับ>.json จาก repo เนื้อหา) และดูคำขอคืนเงิน ----------
function packAdminHtml() {
  if (!PS.admin) return '';
  const v = Object.entries(PS.ver || {}).map(([l, n]) => (LEVELS[l] ? LEVELS[l].n : l) + ' v' + n).join(' · ') || 'ยังไม่มีแพ็กบนเซิร์ฟเวอร์';
  return `<div class="st" style="margin-top:14px;border-top:1px solid var(--bd);padding-top:12px"><b>ผู้ดูแล</b> · แพ็กบนเซิร์ฟเวอร์: ${v}</div><div class="btns" style="margin-top:8px"><button onclick="document.getElementById('pku').click()">อัปโหลดแพ็กเนื้อหา</button></div><input id="pku" type="file" accept="application/json,.json" style="display:none" onchange="packUpload(this)">${refundAdminHtml()}`;
}
// คำขอคืนเงินทั้งหมด: รายการที่รอคืน + สรุปเหตุผล (คืนเงินจริงทำใน Stripe แล้ว webhook เปลี่ยนสถานะให้เอง)
function refundAdminHtml() {
  if (!Array.isArray(RR)) return '<div class="st" style="margin-top:10px">คำขอคืนเงิน: ยังไม่มีตาราง refund_requests (รัน supabase/schema.sql ใหม่ 1 ครั้ง)</div>';
  const day = t => new Date(t).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
  const pend = RR.filter(r => r.status === 'pending'), cnt = {};
  RR.forEach(r => cnt[r.reason] = (cnt[r.reason] || 0) + 1);
  const sum = RF.filter(([k]) => cnt[k]).sort((a, b) => cnt[b[0]] - cnt[a[0]]).map(([k, t]) => `${t} <b>${cnt[k]}</b>`).join('<br>');
  const list = pend.map(r => `<div class="st" style="margin-top:6px;padding:8px 10px;border:1px solid var(--bd);border-radius:10px">${day(r.created_at)} · <b>${esc(r.email || '-')}</b> · ${(LEVELS[r.level] || { n: r.level }).n}<br>เหตุผล: ${esc(rfLabel(r.reason))}${r.detail ? '<br>“' + esc(r.detail) + '”' : ''}</div>`).join('');
  return `<div class="st" style="margin-top:12px"><b>คำขอคืนเงินที่รอดำเนินการ (${pend.length})</b>${pend.length ? ' · คืนเงินใน Stripe → Payments แล้วสถานะจะเปลี่ยนเอง' : ''}</div>${list}<div class="st" style="margin-top:10px"><b>สรุปเหตุผลทั้งหมด (${RR.length} คำขอ)</b><br>${sum || 'ยังไม่มีคำขอ'}</div>`;
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

// ---------- เริ่มทำงาน (ซื้อและขอคืนเงินอยู่ js/buy.js) ----------

function packStart() {
  const m = readStr('kn_lvmsg', true); if (m) { writeStr('kn_lvmsg', null, true); toast(m) }
  const q = new URLSearchParams(location.search), paid = q.get('paid'), cancel = q.get('buy') === 'cancel';
  if (paid || cancel) { q.delete('paid'); q.delete('buy'); history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash) }
  if (cancel) { delete PS.buy; psave(); toast('ยกเลิกการชำระเงินแล้ว ยังไม่มีการตัดเงินค่ะ') }
  // กลับเข้าแอปหลังไปจ่ายเงินในหน้าต่างอื่น: ตรวจสิทธิ์ให้ทันที
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && PS.buy && !packEnt(PS.buy.l)) buyWatch(PS.buy.l, 5) });
  if (paid && LEVELS[paid] && PAID.includes(paid) && cloudOn()) { toast('ขอบคุณค่ะ กำลังตรวจสิทธิ์ ' + LEVELS[paid].n + '…'); return buyWatch(paid) }
  packCheck();
}
