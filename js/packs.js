// แพ็กเนื้อหาเสียเงิน: ตรวจสิทธิ์ ดาวน์โหลด สลับระดับ และหน้าอัปโหลดของผู้ดูแล (ข้อมูลอยู่ใน Supabase ตาราง entitlements / content_packs ดู supabase/schema.sql)
// สถานะล่าสุดจากเซิร์ฟเวอร์เก็บใน localStorage key 'kn_packs' = {ent:[ระดับที่มีสิทธิ์], ver:{ระดับ:เวอร์ชันบนเซิร์ฟเวอร์}, admin:bool, t:เวลาที่ตรวจ,
//   price:{ระดับ:{amount,currency}} (ระดับที่เปิดขายแล้ว), buy:{l,t} (กำลังไปจ่ายเงิน)}
// การซื้อ: Edge Function 'checkout' สร้างหน้าชำระเงิน Stripe → 'stripe-webhook' เพิ่มสิทธิ์ใน entitlements (ดู docs/PAYMENT.md)
const PSK = 'kn_packs';
let PS = {}, RR = null; try { PS = JSON.parse(localStorage.getItem(PSK) || '{}') } catch (e) { PS = {} }
const psave = () => { try { localStorage.setItem(PSK, JSON.stringify(PS)) } catch (e) {} };
const PAID = ['n4', 'n3'];  // ระดับเสียเงินที่มีแพ็กเนื้อหาแล้ว
function packLocal(l) { try { const p = JSON.parse(localStorage.getItem(PACKK(l)) || 'null'); return p && p.level === l ? p : null } catch (e) { return null } }
const packEnt = l => (PS.ent || []).includes(l);
// พร้อมเรียน = มีแพ็กในเครื่อง หรือมีสิทธิ์ (ผู้ดูแลถือว่ามีสิทธิ์) และมีแพ็กบนเซิร์ฟเวอร์
const packReady = l => !!packLocal(l) || ((packEnt(l) || PS.admin) && !!(PS.ver || {})[l]);
const packWait = l => !packReady(l) && packEnt(l);   // ปลดล็อกแล้ว แต่ผู้ดูแลยังไม่ได้อัปโหลดเนื้อหา
function lvGo(l, msg) { try { localStorage.setItem(LVK, l); if (msg) sessionStorage.setItem('kn_lvmsg', msg) } catch (e) {} location.reload() }

// ---------- การ์ดระดับในหน้าแรก (เรียกจาก pathHtml) ----------
function lvCard(l) {
  const L = LEVELS[l];
  if (l === 'n5') return `<div class="pc" onclick="lvSwitch('n5')"><div class="pb"><b>N5</b><div class="st">แตะเพื่อกลับไปเรียน N5 · ความคืบหน้าแต่ละระดับเก็บแยกกัน</div></div><div class="pg2">${L.g}</div></div>`;
  if (PAID.includes(l) && packReady(l)) return `<div class="pc" onclick="lvSwitch('${l}')"><div class="pb"><b>${L.n}</b><span class="bd b3">ปลดล็อกแล้ว</span><div class="st">แตะเพื่อเปลี่ยนไปเรียน ${L.n}</div></div><div class="pg2">${L.g}</div></div>`;
  const s = !PAID.includes(l) || !cloudOn() ? 'เนื้อหากำลังมา' : !cloudIn() ? 'เนื้อหาเสียเงิน · เข้าสู่ระบบเพื่อตรวจสิทธิ์' : packWait(l) ? 'ปลดล็อกแล้ว · เนื้อหายังไม่พร้อม รออัปเดตสักครู่นะคะ' : buyPrice(l) ? 'แตะเพื่อปลดล็อก · ' + buyPrice(l) + ' ซื้อครั้งเดียว' : 'เนื้อหาเสียเงิน · เปิดขายเร็วๆ นี้';
  return `<div class="pc lk0" onclick="lvLocked('${l}')"><div class="pn">${icx('lock', 16)}</div><div class="pb"><b>${L.n}</b><div class="st">${s}</div></div><div class="pg2">${L.g}</div></div>`;
}
function lvLocked(l) {
  const n = LEVELS[l].n;
  if (!PAID.includes(l) || !cloudOn()) return toast(n + ' กำลังเตรียมเนื้อหาอยู่ค่ะ');
  if (!cloudIn()) { tab = 'stats'; render(); setTimeout(() => { const c = document.getElementById('cloud'); if (c) c.scrollIntoView({ block: 'center' }) }, 50); return toast('เข้าสู่ระบบก่อนนะคะ แล้วระบบจะตรวจสิทธิ์ ' + n + ' ให้') }
  if (packWait(l)) return toast('บัญชีนี้ปลดล็อก ' + n + ' แล้ว แต่เนื้อหายังไม่พร้อมบนเซิร์ฟเวอร์ ลองใหม่ภายหลังนะคะ');
  if (buyPrice(l)) return buyAsk(l);
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
  catch (e) { lvBusy = false; if (e.noEnt) { await packCheck(); return lvLocked(l) } toast('ดาวน์โหลดไม่สำเร็จ: ' + e.message) }
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
    const er = await sb('/rest/v1/entitlements?select=level,source,created_at'), ent = er.map(r => r.level), src = {};
    er.forEach(r => src[r.level] = { s: r.source, t: Date.parse(r.created_at) || 0 });
    const ver = {}; (await sb('/rest/v1/content_packs?select=level,version')).forEach(r => ver[r.level] = r.version);
    let admin = false; try { admin = (await sb('/rest/v1/rpc/is_admin', { method: 'POST', body: {} })) === true } catch (e) {}
    const price = {};   // ราคามาจาก Stripe ผ่าน Edge Function ระดับที่ยังไม่เปิดขาย (หรือยังไม่ติดตั้งฟังก์ชัน) จะไม่มีราคา
    for (const l of PAID) if (!ent.includes(l)) { try { const r = await sb(FN, { method: 'POST', body: { action: 'price', level: l } }); if (r && r.amount > 0) price[l] = { amount: r.amount, currency: r.currency } } catch (e) {} }
    // คำขอคืนเงิน: ผู้ใช้เห็นของตัวเอง ผู้ดูแลเห็นทั้งหมด (เก็บในหน่วยความจำเท่านั้น ไม่ลง localStorage) · ยังไม่รัน schema ใหม่ = ไม่มีตาราง ข้ามไป
    let rr = null; try { rr = await sb('/rest/v1/refund_requests?select=id,user_id,email,level,reason,detail,status,created_at&order=created_at.desc&limit=200') } catch (e) {}
    const before = JSON.stringify([PS.ent, PS.admin, PS.price, PS.src, RR]);
    RR = rr;
    PS = { ent, src, ver, admin, price, buy: PS.buy, t: Date.now() };
    if (PS.buy && (ent.includes(PS.buy.l) || Date.now() - PS.buy.t > 864e5)) delete PS.buy;
    psave();
    for (const l of PAID) {
      const p = packLocal(l), allowed = ent.includes(l) || (admin && ver[l]);
      if (p && !allowed) {   // ถูกถอนสิทธิ์: ลบแพ็กออกจากเครื่อง
        localStorage.removeItem(PACKK(l));
        if (LV === l) return lvGo('n5', 'บัญชีนี้ไม่มีสิทธิ์ ' + LEVELS[l].n + ' แล้ว จึงกลับมาที่ N5 ค่ะ');
      } else if (p && ver[l] > p.version) {   // มีเวอร์ชันใหม่: ดาวน์โหลดไว้ ใช้เมื่อเปิดแอปครั้งถัดไป
        try { await packFetch(l); if (LV === l) toast('อัปเดตเนื้อหา ' + LEVELS[l].n + ' แล้ว จะใช้เมื่อเปิดแอปครั้งถัดไปค่ะ') } catch (e) {}
      }
    }
    if (before !== JSON.stringify([PS.ent, PS.admin, PS.price, PS.src, RR]) && (tab === 'home' || tab === 'stats') && !document.querySelector('.cov')) render();
  } catch (e) {}
}
// ออกจากระบบ / ลบบัญชี / การเข้าสู่ระบบหมดอายุ: แพ็กผูกกับบัญชี จึงลบออกจากเครื่องและกลับไป N5
function packsClear() {
  Object.keys(LEVELS).forEach(l => { try { localStorage.removeItem(PACKK(l)) } catch (e) {} });
  PS = {}; RR = null; try { localStorage.removeItem(PSK) } catch (e) {}
  if (LV !== 'n5') lvGo('n5', 'ออกจากระบบแล้ว กลับมาที่ N5 ค่ะ');
}
const _cloudForget = cloudForget;
cloudForget = function () { _cloudForget(); packsClear() };
const _cloudVerify = cloudVerify;
cloudVerify = async function () { await _cloudVerify(); if (cloudIn()) packCheck() };

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

// ---------- ขอคืนเงิน (terms.html ข้อ 4): ภายใน 7 วันหลังซื้อผ่าน Stripe เลือกเหตุผลก่อนส่ง เหตุผลไม่มีผลต่อการคืนเงิน ----------
const RF = [['content', 'เนื้อหาไม่ตรงกับที่คาดไว้'], ['level', 'ยากหรือง่ายเกินไปสำหรับฉัน'], ['error', 'เจอเนื้อหาผิด หรือแอปมีปัญหา'], ['price', 'ไม่คุ้มกับราคา'], ['mistake', 'ซื้อผิดระดับ หรือกดซื้อโดยไม่ตั้งใจ'], ['other', 'อื่นๆ']];
const rfLabel = k => (RF.find(r => r[0] === k) || [k, k])[1];
const REFUND_DAYS = 7;
function rfLeft(l) {   // เหลือกี่วันที่ขอคืนเงินได้ (0 = หมดเวลา หรือไม่ได้ซื้อผ่าน Stripe)
  const s = (PS.src || {})[l]; if (!s || s.s !== 'stripe' || !s.t) return 0;
  return Math.max(0, Math.ceil((s.t + REFUND_DAYS * 864e5 - Date.now()) / 864e5));
}
const rfPending = l => Array.isArray(RR) && RR.some(r => r.level === l && r.status === 'pending' && r.user_id === CS.uid);
function refundHtml() {
  const rows = PAID.filter(l => packEnt(l) && (rfLeft(l) || rfPending(l))).map(l => {
    const n = LEVELS[l].n;
    return rfPending(l) ? `<div class="st" style="margin-top:6px">ส่งคำขอคืนเงิน ${n} แล้ว รอดำเนินการ เมื่อคืนเงินแล้ว ${n} จะถูกล็อกอีกครั้ง</div>`
      : `<button class="lk" onclick="refundAsk('${l}')">ขอคืนเงิน ${n} (เหลืออีก ${rfLeft(l)} วัน)</button>`;
  }).join('');
  return rows ? `<div style="margin-top:10px">${rows}</div>` : '';
}
function refundAsk(l) {
  if (document.querySelector('.cov') || !rfLeft(l)) return;
  const n = LEVELS[l].n, o = document.createElement('div'); o.className = 'cov';
  const opts = RF.map(([k, t]) => `<label style="display:flex;gap:8px;align-items:center;padding:6px 0;cursor:pointer"><input type="radio" name="rfr" value="${k}"> ${t}</label>`).join('');
  o.innerHTML = `<div class="cdl" role="dialog" aria-modal="true"><h2 style="margin-top:0">ขอคืนเงิน ${n}</h2><div class="st" style="line-height:1.7">ช่วยบอกเหตุผลหน่อยนะคะ เราจะนำไปปรับปรุงแอป <b>เหตุผลไม่มีผลต่อการคืนเงิน</b> คืนเต็มจำนวนผ่านช่องทางที่จ่าย และ ${n} จะถูกล็อกเมื่อคืนเงินแล้ว</div><div style="margin-top:8px">${opts}</div><textarea id="rfd" maxlength="1000" rows="3" placeholder="เล่าเพิ่มเติม (ไม่บังคับ ถ้าเลือก &quot;อื่นๆ&quot; กรุณาเล่าสั้นๆ)" style="width:100%;box-sizing:border-box;margin-top:6px;padding:10px;border:1px solid var(--bd);border-radius:10px;font:inherit;font-size:16px;background:var(--card);color:var(--fg)"></textarea><div class="st rfe" style="color:var(--err);min-height:1.2em"></div><div class="btns" style="margin-top:8px"><button data-p="go">ส่งคำขอคืนเงิน</button><button data-p="no" class="g">ยกเลิก</button></div></div>`;
  o.querySelectorAll('button').forEach(x => x.onclick = () => {
    if (x.dataset.p !== 'go') return o.remove();
    const c = o.querySelector('input[name=rfr]:checked'), d = o.querySelector('#rfd').value.trim(), er = o.querySelector('.rfe');
    if (!c) return er.textContent = 'เลือกเหตุผลก่อนนะคะ';
    if (c.value === 'other' && !d) return er.textContent = 'เลือก "อื่นๆ" แล้ว ช่วยเล่าสั้นๆ ด้วยนะคะ';
    x.disabled = true; x.textContent = 'กำลังส่ง…'; refundSend(l, c.value, d, o);
  });
  document.body.appendChild(o);
}
async function refundSend(l, reason, detail, o) {
  const n = LEVELS[l].n;
  try {
    await cloudToken();
    await sb('/rest/v1/refund_requests', { method: 'POST', body: { level: l, reason, detail: detail || null }, prefer: 'return=minimal' });
    o.remove(); toast('ส่งคำขอคืนเงิน ' + n + ' แล้วค่ะ จะคืนเงินให้โดยเร็ว และแจ้งทางอีเมลของบัญชีนี้'); await packCheck(); render();
  } catch (e) {
    o.remove();
    if (e.status === 409) { await packCheck(); render(); return toast('ส่งคำขอคืนเงิน ' + n + ' ไว้แล้ว รอดำเนินการอยู่ค่ะ') }
    if (e.status === 401) return toast('การเข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบใหม่นะคะ');
    if (e.status === 403) { await packCheck(); render(); return toast('ขอคืนเงินผ่านแอปได้ภายใน 7 วันหลังซื้อค่ะ ถ้ามีปัญหา ติดต่อทางอีเมลตามข้อกำหนดการใช้งานนะคะ') }
    toast('ส่งคำขอไม่สำเร็จ ลองใหม่ หรือติดต่อทางอีเมลตามข้อกำหนดการใช้งานนะคะ');
  }
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

// ---------- ซื้อ (Stripe Checkout) ----------
const FN = '/functions/v1/checkout';
const ZERO_DEC = ['jpy', 'krw', 'vnd'];   // สกุลเงินที่ Stripe ไม่มีหน่วยย่อย
function buyPrice(l) {
  const p = (PS.price || {})[l]; if (!p) return '';
  const c = String(p.currency || 'thb').toUpperCase(), a = ZERO_DEC.includes(p.currency) ? p.amount : p.amount / 100;
  try { return new Intl.NumberFormat('th-TH', { style: 'currency', currency: c, maximumFractionDigits: a % 1 ? 2 : 0 }).format(a) } catch (e) { return a + ' ' + c }
}
function buyAsk(l) {
  if (document.querySelector('.cov')) return;
  const n = LEVELS[l].n, o = document.createElement('div'); o.className = 'cov';
  o.innerHTML = `<div class="cdl" role="dialog" aria-modal="true"><h2 style="margin-top:0">ปลดล็อก ${n}</h2><div style="font-size:28px;font-weight:700;color:var(--ac)">${buyPrice(l)}</div><div class="st" style="line-height:1.7;margin-top:6px">คันจิ คำศัพท์ ไวยากรณ์ และบทสนทนาระดับ ${n} ทั้งหมด<br><b>ซื้อครั้งเดียว ไม่มีค่ารายเดือน</b> ผูกกับบัญชี <b>${esc(CS.email)}</b> เข้าสู่ระบบบัญชีนี้บนเครื่องไหนก็เรียนได้<br>ชำระเงินผ่าน Stripe (บัตร หรือ PromptPay) แอปไม่เห็นและไม่เก็บข้อมูลบัตร</div><div class="st" style="margin-top:8px">การซื้อถือว่ายอมรับ<a href="terms.html" target="_blank" rel="noopener" style="color:var(--ac)">ข้อกำหนดการใช้งาน</a> (รวมเงื่อนไขการคืนเงิน)</div><div class="btns" style="margin-top:12px"><button data-p="go">ไปหน้าชำระเงิน</button><button data-p="no" class="g">ไว้ก่อน</button></div></div>`;
  o.querySelectorAll('button').forEach(x => x.onclick = () => { if (x.dataset.p === 'go') { x.disabled = true; x.textContent = 'กำลังเปิดหน้าชำระเงิน…'; buyGo(l, o) } else o.remove() });
  document.body.appendChild(o);
}
async function buyGo(l, o) {
  try {
    await cloudToken();
    const r = await sb(FN, { method: 'POST', body: { action: 'checkout', level: l } });
    if (!r || !/^https:\/\/checkout\.stripe\.com\//.test(r.url)) throw new Error('ไม่ได้รับลิงก์ชำระเงิน');
    PS.buy = { l, t: Date.now() }; psave();
    location.href = r.url;   // ไปหน้าของ Stripe จ่ายเสร็จจะกลับมาที่ ?paid=<ระดับ>
  } catch (e) {
    o.remove();
    if (e.status === 409) { await packCheck(); return toast('บัญชีนี้ปลดล็อก ' + LEVELS[l].n + ' อยู่แล้วค่ะ') }
    if (e.status === 401) return toast('การเข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบใหม่นะคะ');
    if (e.status === 404) { delete (PS.price || {})[l]; psave(); render(); return toast('ยังไม่เปิดขาย ' + LEVELS[l].n + ' ค่ะ') }
    toast('เปิดหน้าชำระเงินไม่สำเร็จ ลองใหม่อีกครั้งนะคะ');
  }
}
// หลังจ่ายเงิน: webhook อาจมาช้ากว่าการกลับเข้าแอปเล็กน้อย จึงตรวจสิทธิ์ซ้ำเป็นระยะจนเห็นสิทธิ์ (สูงสุดประมาณ 1 นาที)
let buyTimer = null;
function buyWatch(l, tries = 20) {
  clearTimeout(buyTimer);
  if (!cloudIn()) return;
  packCheck().then(() => {
    if (packEnt(l)) return toast('ปลดล็อก ' + LEVELS[l].n + ' แล้ว ขอบคุณนะคะ แตะการ์ด ' + LEVELS[l].n + ' ในหน้าแรกเพื่อเริ่มเรียนได้เลย');
    if (tries > 1) buyTimer = setTimeout(() => buyWatch(l, tries - 1), 3000);
    else toast('ยังไม่เห็นการชำระเงิน ถ้าจ่ายแล้ว ลองเปิดแอปใหม่อีกครั้งภายหลังนะคะ');
  });
}

function packStart() {
  try { const m = sessionStorage.getItem('kn_lvmsg'); if (m) { sessionStorage.removeItem('kn_lvmsg'); toast(m) } } catch (e) {}
  const q = new URLSearchParams(location.search), paid = q.get('paid'), cancel = q.get('buy') === 'cancel';
  if (paid || cancel) { q.delete('paid'); q.delete('buy'); history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash) }
  if (cancel) { delete PS.buy; psave(); toast('ยกเลิกการชำระเงินแล้ว ยังไม่มีการตัดเงินค่ะ') }
  // กลับเข้าแอปหลังไปจ่ายเงินในหน้าต่างอื่น: ตรวจสิทธิ์ให้ทันที
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && PS.buy && !packEnt(PS.buy.l)) buyWatch(PS.buy.l, 5) });
  if (paid && LEVELS[paid] && PAID.includes(paid) && cloudOn()) { toast('ขอบคุณค่ะ กำลังตรวจสิทธิ์ ' + LEVELS[paid].n + '…'); return buyWatch(paid) }
  packCheck();
}
