// ซื้อระดับเสียเงิน (Stripe Checkout ผ่าน Edge Function) และขอคืนเงินภายใน 7 วัน (terms.html ข้อ 4) · แยกจาก js/packs.js (ถอนวัชพืชข้อ 15)
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
const FN = '/functions/v1/checkout';
const ZERO_DEC = ['jpy', 'krw', 'vnd'];   // สกุลเงินที่ Stripe ไม่มีหน่วยย่อย
function buyPrice(l) {
  const p = (PS.price || {})[l]; if (!p) return '';
  const c = String(p.currency || 'thb').toUpperCase(), a = ZERO_DEC.includes(p.currency) ? p.amount : p.amount / 100;
  try { return new Intl.NumberFormat('th-TH', { style: 'currency', currency: c, maximumFractionDigits: a % 1 ? 2 : 0 }).format(a) } catch { return a + ' ' + c }
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
