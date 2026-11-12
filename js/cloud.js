// บัญชีผู้ใช้และซิงก์ความคืบหน้าบนคลาวด์ (Supabase ผ่าน REST ตรงๆ ไม่ใช้ SDK จึงไม่ต้องโหลดไลบรารีเพิ่มและยังใช้ออฟไลน์ได้)
// - เข้าสู่ระบบด้วยรหัส 6 หลักทางอีเมล (ไม่ใช้ลิงก์ เพราะแอปที่เพิ่มลงหน้าจอโฮมของ iPad แยกที่เก็บข้อมูลจาก Safari ลิงก์จะไปเปิดใน Safari แทน)
// - เก็บความคืบหน้าทั้งก้อน (ทุก key ใน PK) เป็นแถวเดียวต่อผู้ใช้ในตาราง progress พร้อมเลขรุ่น rev
// - ส่งขึ้นแบบมีเงื่อนไข "rev ยังเท่าเดิม" ถ้ามีเครื่องอื่นส่งขึ้นก่อนจะรู้ทันที ไม่เขียนทับกันเงียบๆ
// - ถ้าทั้งเครื่องนี้และคลาวด์มีของใหม่ทั้งคู่ ให้ผู้ใช้เลือกเองว่าจะเก็บฝั่งไหน
// สถานะเก็บใน localStorage key 'kn_cloud' (ไม่ใช่ความคืบหน้า จึงไม่อยู่ใน PK และไม่ถูกส่งออก/ซิงก์)
const CK = 'kn_cloud';
let CS = {}; try { CS = JSON.parse(localStorage.getItem(CK) || '{}') } catch (e) { CS = {} }
const csave = () => { try { localStorage.setItem(CK, JSON.stringify(CS)) } catch (e) {} };
const cloudOn = () => !!(typeof CLOUD !== 'undefined' && CLOUD.url && CLOUD.key);
const cloudIn = () => !!(CS.rt && CS.uid);
let CU = { step: 'email', email: '', busy: false, err: '' }, cloudBusy = null, cloudOb = false;

// ---------- เรียก API ----------
async function sb(path, { method = 'GET', body, auth = true, prefer, keepalive } = {}) {
  const h = { apikey: CLOUD.key, 'Content-Type': 'application/json' };
  if (auth) h.Authorization = 'Bearer ' + CS.at;
  if (prefer) h.Prefer = prefer;
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), 15000);
  try {
    const r = await fetch(CLOUD.url.replace(/\/$/, '') + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body), signal: ac.signal, keepalive: !!keepalive && (body === undefined || JSON.stringify(body).length < 60000) });
    let j = null; try { j = await r.json() } catch (e) {}
    if (!r.ok) { const e = new Error((j && (j.msg || j.message || j.error_description || j.error)) || ('HTTP ' + r.status)); e.status = r.status; e.code = j && (j.error_code || j.code); throw e }
    return j;
  } finally { clearTimeout(t) }
}
function cloudSetSession(j) {
  CS.at = j.access_token; CS.rt = j.refresh_token;
  CS.exp = Date.now() + (j.expires_in || 3600) * 1000;
  if (j.user) { CS.uid = j.user.id; CS.email = j.user.email || CS.email }
  csave();
}
async function cloudToken() {
  if (CS.at && CS.exp - 60000 > Date.now()) return;
  try { cloudSetSession(await sb('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: CS.rt }, auth: false })) }
  catch (e) {
    if (e.status >= 400 && e.status < 500) { cloudForget(); toast('การเข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบใหม่นะคะ'); if (tab === 'stats') render() }
    throw e;
  }
}

// ---------- ข้อมูลในเครื่อง ----------
// เรียง key ก่อนแปลงเป็นข้อความ เพื่อให้ข้อมูลเดียวกันได้ค่าเดียวกันเสมอ (ฐานข้อมูล jsonb สลับลำดับ key ได้)
const canon = v => Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : v && typeof v === 'object' ? '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}' : JSON.stringify(v);
// ไม่นับ pet.lastTs (เวลาที่เปิดหน้าแรกล่าสุด เปลี่ยนทุกครั้งที่เปิดแอป) ไม่งั้นแค่เปิดแอปก็กลายเป็น "มีของใหม่" แล้วส่งขึ้น/ถามซ้ำไม่จบ
function chash(o) { let x = o; if (o && o[MK] && o[MK].pet && 'lastTs' in o[MK].pet) { const { lastTs, ...pet } = o[MK].pet; x = { ...o, [MK]: { ...o[MK], pet } } } const s = canon(x); let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return (h >>> 0).toString(36) + '.' + s.length }
function snapshot() { const d = {}; PK.forEach(k => { try { const v = localStorage.getItem(k); if (v) d[k] = JSON.parse(v) } catch (e) {} }); return d }
const hasPet = d => !!(d && d[MK] && d[MK].pet && d[MK].pet.name);
function applyData(d) {
  PK.forEach(k => { if (d[k] && typeof d[k] === 'object' && !Array.isArray(d[k])) localStorage.setItem(k, JSON.stringify(d[k])); else localStorage.removeItem(k) });
}
function sumOf(d) {
  let lr = 0; for (const k in DS) lr += Object.values((d && d[DS[k].key]) || {}).filter(v => v && v.b >= MASTERY).length;
  const days = (d && d[MK] && d[MK].days) || {}, tot = Object.values(days).reduce((a, b) => a + (+b || 0), 0), last = Object.keys(days).sort().pop();
  return { lr, tot, last, pet: hasPet(d) ? d[MK].pet.name : '' };
}

// ---------- ซิงก์ ----------
// full=true: ซิงก์ครบ (ดึงของใหม่จากคลาวด์ได้ ซึ่งต้องโหลดหน้าใหม่) ใช้ตอนเปิดแอป กลับเข้าแอป และกดซิงก์เอง
// full=false: ส่งขึ้นอย่างเดียว ใช้ระหว่างเรียนและตอนสลับออกจากแอป ไม่รบกวนหน้าจอ
function cloudSync(full = true, opt = {}) {
  if (!cloudOn() || !cloudIn() || !navigator.onLine) return Promise.resolve('skip');
  if (cloudBusy) return cloudBusy;
  cloudBusy = cloudRun(full, opt).catch(e => { if (opt.loud) toast('ซิงก์ไม่สำเร็จ: ' + e.message); return 'error' }).finally(() => { cloudBusy = null; if (tab === 'stats' && !document.querySelector('.cov') && !opt.quiet) render() });
  return cloudBusy;
}
async function cloudRun(full, opt) {
  await cloudToken();
  const local = snapshot(), lh = chash(local);
  const dirty = CS.hash ? lh !== CS.hash : hasPet(local); // เครื่องที่ยังไม่เคยซิงก์: มีข้อมูลก็ถือว่ามีของใหม่
  if (!full && !dirty) return 'clean';
  const rows = await sb('/rest/v1/progress?select=data,rev,updated_at&user_id=eq.' + CS.uid);
  const row = rows && rows[0];
  if (!row) {
    if (!hasPet(local)) { done(null, lh); return 'empty' }
    const r = await sb('/rest/v1/progress', { method: 'POST', body: { user_id: CS.uid, data: local, rev: 1 }, prefer: 'return=representation', keepalive: opt.keepalive });
    done(r[0].rev, lh); return 'pushed';
  }
  if (row.rev === CS.rev) {
    if (!dirty) { done(row.rev, lh); return 'clean' }
    return push(local, lh, row.rev, opt);
  }
  // คลาวด์มีรุ่นใหม่กว่าที่เครื่องนี้รู้จัก
  if (!full) return 'later'; // ไว้ตัดสินตอนซิงก์ครบครั้งถัดไป
  if (!dirty || chash(row.data) === lh) return pull(row);
  return new Promise(res => cloudAsk(local, row, async pick => {
    try { res(pick === 'cloud' ? pull(row) : await push(local, lh, row.rev, opt)) } catch (e) { toast('ซิงก์ไม่สำเร็จ: ' + e.message); res('error') }
  }));
}
function done(rev, hash) { CS.rev = rev; CS.hash = hash; CS.last = Date.now(); csave() }
async function push(local, lh, rev, opt) {
  const r = await sb('/rest/v1/progress?user_id=eq.' + CS.uid + '&rev=eq.' + rev, { method: 'PATCH', body: { data: local, rev: rev + 1 }, prefer: 'return=representation', keepalive: opt.keepalive });
  if (!r || !r.length) { CS.rev = -1; csave(); throw new Error('มีเครื่องอื่นอัปเดตพร้อมกัน ลองซิงก์อีกครั้งนะคะ') }
  done(r[0].rev, lh); return 'pushed';
}
function pull(row) {
  applyData(row.data || {});
  done(row.rev, chash(snapshot()));
  try { sessionStorage.setItem('kn_pulled', '1') } catch (e) {}
  location.reload();
  return 'pulled';
}

// หน้าต่างให้เลือกเมื่อทั้งสองฝั่งมีของใหม่
function cloudAsk(local, row, cb) {
  const a = sumOf(local), b = sumOf(row.data), dt = s => s ? new Date(s).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '-';
  const box = (t, s, extra) => `<div class="cbx"><b>${t}</b><div>จำได้แม่น ${s.lr} ข้อ</div><div>ตอบไปทั้งหมด ${s.tot} ข้อ</div><div class="st">${extra}</div></div>`;
  const o = document.createElement('div'); o.className = 'cov';
  o.innerHTML = `<div class="cdl" role="dialog" aria-modal="true"><h2 style="margin-top:0">ความคืบหน้าไม่ตรงกัน</h2><div class="st">เครื่องนี้และคลาวด์มีข้อมูลใหม่ทั้งคู่ เลือกฝั่งที่จะเก็บไว้ อีกฝั่งจะถูกแทนที่</div><div class="cbs">${box('เครื่องนี้', a, 'เรียนล่าสุด ' + (a.last || '-'))}${box('บนคลาวด์', b, 'อัปเดต ' + dt(row.updated_at))}</div><div class="btns"><button data-p="local">ใช้ของเครื่องนี้</button><button data-p="cloud" class="g">ใช้ของคลาวด์</button></div></div>`;
  o.querySelectorAll('button').forEach(x => x.onclick = () => { o.remove(); cb(x.dataset.p) });
  document.body.appendChild(o);
}

// ---------- เข้าสู่ระบบ / ออกจากระบบ ----------
async function cloudSend() {
  const el = document.getElementById('cem'), email = (el ? el.value : CU.email).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { CU.err = 'รูปแบบอีเมลไม่ถูกต้อง'; return render() }
  CU = { ...CU, email, busy: true, err: '' }; render();
  try { await sb('/auth/v1/otp', { method: 'POST', body: { email, create_user: true }, auth: false }); CU.step = 'code'; toast('ส่งรหัสไปที่อีเมลแล้วค่ะ') }
  catch (e) { CU.err = e.status === 429 ? 'ขอรหัสถี่เกินไป รอสักครู่แล้วลองใหม่นะคะ' : 'ส่งรหัสไม่สำเร็จ: ' + e.message }
  CU.busy = false; render();
}
async function cloudVerify() {
  const el = document.getElementById('ccd'), token = el ? el.value.replace(/\D/g, '') : '';
  if (token.length < 6) { CU.err = 'กรอกรหัสตัวเลขจากอีเมลให้ครบนะคะ'; return render() }
  CU = { ...CU, busy: true, err: '' }; render();
  try {
    cloudSetSession(await sb('/auth/v1/verify', { method: 'POST', body: { type: 'email', email: CU.email, token }, auth: false }));
    CS.email = CU.email; delete CS.rev; delete CS.hash; csave(); // บัญชีใหม่ในเครื่องนี้: เริ่มนับซิงก์ใหม่
    CU = { step: 'email', email: '', busy: false, err: '' };
    toast('เข้าสู่ระบบแล้วค่ะ');
    const r = await cloudSync(true, { loud: true });
    if (r === 'empty' && cloudOb) { cloudOb = false; toast('ยังไม่มีข้อมูลบนคลาวด์ เริ่มตั้งค่าใหม่ได้เลยค่ะ') }
  } catch (e) { CU.busy = false; CU.err = /expired|invalid/i.test(e.message) || e.status === 403 ? 'รหัสไม่ถูกต้องหรือหมดอายุแล้ว' : 'ยืนยันไม่สำเร็จ: ' + e.message }
  render();
}
function cloudForget() { CS = {}; csave() }
async function cloudLogout() {
  if (!confirm('ออกจากระบบ? ความคืบหน้ายังอยู่ในเครื่องนี้ แต่จะไม่ซิงก์จนกว่าจะเข้าสู่ระบบอีกครั้ง')) return;
  await cloudSync(false, { quiet: true });
  const at = CS.at; cloudForget(); render();
  try { await fetch(CLOUD.url.replace(/\/$/, '') + '/auth/v1/logout', { method: 'POST', headers: { apikey: CLOUD.key, Authorization: 'Bearer ' + at } }) } catch (e) {}
}
const cloudBack = () => { CU = { ...CU, step: 'email', err: '' }; render() };

// ---------- หน้าจอ ----------
const INP = 'width:100%;box-sizing:border-box;padding:11px;border-radius:10px;border:1px solid var(--bd);background:var(--card);color:var(--fg);font-size:16px';
const PRIV = `<div class="st" style="margin-top:10px">การเข้าสู่ระบบถือว่ารับทราบ<a href="terms.html" target="_blank" rel="noopener" style="color:var(--ac)">ข้อกำหนดการใช้งาน</a>และ<a href="privacy.html" target="_blank" rel="noopener" style="color:var(--ac)">นโยบายความเป็นส่วนตัว</a></div>`;
function cloudFormHtml() { return cloudFormInner() + PRIV }
function cloudFormInner() {
  const dis = CU.busy ? ' disabled' : '', err = CU.err ? `<div class="cer">${CU.err}</div>` : '';
  if (CU.step === 'code') return `<div class="st">ส่งรหัสไปที่ <b>${esc(CU.email)}</b> แล้ว กรอกรหัสตัวเลขจากอีเมล</div><input id="ccd" inputmode="numeric" autocomplete="one-time-code" maxlength="10" placeholder="รหัสจากอีเมล" style="${INP};margin-top:10px;letter-spacing:4px;text-align:center" onkeydown="if(event.key==='Enter')cloudVerify()">${err}<div class="btns" style="margin-top:10px"><button${dis} onclick="cloudVerify()">${CU.busy ? 'กำลังตรวจ…' : 'ยืนยัน'}</button></div><button class="lk" onclick="cloudBack()">เปลี่ยนอีเมล / ส่งรหัสใหม่</button>`;
  return `<div class="st">ใช้อีเมลเข้าสู่ระบบ เราจะส่งรหัสไปให้ ไม่ต้องตั้งรหัสผ่าน</div><input id="cem" type="email" inputmode="email" autocomplete="email" autocapitalize="off" placeholder="อีเมล" value="${esc(CU.email)}" style="${INP};margin-top:10px" onkeydown="if(event.key==='Enter')cloudSend()">${err}<div class="btns" style="margin-top:10px"><button${dis} onclick="cloudSend()">${CU.busy ? 'กำลังส่ง…' : 'ส่งรหัส'}</button></div>`;
}
const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function cloudHtml() {
  if (!cloudOn()) return '';
  let b;
  if (!cloudIn()) b = `<div class="st" style="margin-bottom:6px">เข้าสู่ระบบเพื่อเก็บความคืบหน้าไว้บนคลาวด์ และใช้ต่อบนเครื่องอื่นได้</div>${cloudFormHtml()}`;
  else {
    const last = CS.last ? new Date(CS.last).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : 'ยังไม่เคย';
    b = `<div class="mi" style="padding:0"><span class="mt" style="flex:1"><b>${esc(CS.email)}</b><div class="st">ซิงก์ล่าสุด: ${last}${navigator.onLine ? '' : ' · ออฟไลน์อยู่'}</div></span></div><div class="btns"><button${cloudBusy ? ' disabled' : ''} onclick="cloudSync(true,{loud:true}).then(r=>{if(r==='pushed'||r==='clean'||r==='empty')toast('ซิงก์แล้วค่ะ')})">${cloudBusy ? 'กำลังซิงก์…' : 'ซิงก์ตอนนี้'}</button><button class="g" onclick="cloudLogout()">ออกจากระบบ</button></div>`;
  }
  return `<h2>บัญชีและซิงก์</h2><div class="card" id="cloud" style="min-height:0;text-align:left;padding:14px">${b}</div>`;
}
// หน้าเข้าสู่ระบบระหว่างตั้งค่าครั้งแรก (เครื่องใหม่ที่มีบัญชีอยู่แล้ว)
function cloudObHtml() {
  return `<h1>เข้าสู่ระบบ</h1><div class="st">ดึงความคืบหน้าและเพื่อนสัตว์เลี้ยงจากเครื่องเดิมมาใช้ต่อ</div><div class="card" style="min-height:0;text-align:left;padding:14px;margin-top:14px">${cloudIn() ? '<div class="st">กำลังดึงข้อมูล…</div>' : cloudFormHtml()}</div><button class="lk" onclick="cloudOb=false;CU.err='';render()">‹ กลับไปตั้งค่าใหม่</button>`;
}
const cloudObLink = () => cloudOn() ? `<button class="lk" onclick="cloudOb=true;render()">มีบัญชีอยู่แล้ว? เข้าสู่ระบบ</button>` : '';

// ---------- เริ่มทำงาน ----------
function cloudStart() {
  try { if (sessionStorage.getItem('kn_pulled')) { sessionStorage.removeItem('kn_pulled'); toast('ดึงความคืบหน้าล่าสุดจากคลาวด์แล้วค่ะ') } } catch (e) {}
  if (!cloudOn()) return;
  cloudSync(true, { quiet: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') cloudSync(false, { keepalive: true, quiet: true });
    else cloudSync(true, { quiet: true });
  });
  addEventListener('online', () => cloudSync(true, { quiet: true }));
  setInterval(() => { if (document.visibilityState === 'visible') cloudSync(false, { quiet: true }) }, 120000);
}
