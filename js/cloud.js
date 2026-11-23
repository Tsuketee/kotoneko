// บัญชีผู้ใช้และซิงก์ความคืบหน้าบนคลาวด์ (Supabase ผ่าน REST ตรงๆ ไม่ใช้ SDK จึงไม่ต้องโหลดไลบรารีเพิ่ม · v77 เพิ่มปุ่ม Google ดูหัวข้อ OAuth ด้านล่างและยังใช้ออฟไลน์ได้)
// - เข้าสู่ระบบด้วยรหัส 6 หลักทางอีเมล (ไม่ใช้ลิงก์ เพราะแอปที่เพิ่มลงหน้าจอโฮมของ iPad แยกที่เก็บข้อมูลจาก Safari ลิงก์จะไปเปิดใน Safari แทน)
// - เก็บความคืบหน้าทั้งก้อน (ทุก key ใน PK) เป็นแถวเดียวต่อผู้ใช้ในตาราง progress พร้อมเลขรุ่น rev
// - ส่งขึ้นแบบมีเงื่อนไข "rev ยังเท่าเดิม" ถ้ามีเครื่องอื่นส่งขึ้นก่อนจะรู้ทันที ไม่เขียนทับกันเงียบๆ
// - ถ้าทั้งเครื่องนี้และคลาวด์มีของใหม่ทั้งคู่ ให้ผู้ใช้เลือกเองว่าจะเก็บฝั่งไหน
// สถานะเก็บใน localStorage key 'kn_cloud' (ไม่ใช่ความคืบหน้า จึงไม่อยู่ใน PK และไม่ถูกส่งออก/ซิงก์)
const CK = 'kn_cloud';
let CS = readJSON(CK, {});
const csave = () => writeJSON(CK, CS);
const cloudOn = () => !!(typeof CLOUD !== 'undefined' && CLOUD.url && CLOUD.key);
const cloudIn = () => !!(CS.rt && CS.uid);
let CU = { step: 'email', email: '', busy: false, err: '' }, cloudBusy = null, cloudOb = false;
// ---------- เข้าสู่ระบบด้วย Google (OAuth แบบ PKCE · v77 เจ้าของขอ 2026-11-19 · Apple/LINE ไว้ทีหลัง) ----------
// ปุ่มขึ้นเฉพาะผู้ให้บริการที่เปิดใน Supabase แล้ว (อ่านจาก /auth/v1/settings เก็บสำเนาใน 'kn_auth') จึงไม่มีปุ่มที่กดแล้วเจอหน้า error
// ขาไป: เก็บ code_verifier ใน 'kn_pkce' แล้วพาไปหน้า Google ในหน้าต่างเดิม (แอปบนหน้าจอโฮมของ iPad จะได้กลับมาที่เดิม) · ขากลับ: ?code= แลกเป็น session
// 'kn_auth' 'kn_pkce' ไม่ใช่ความคืบหน้า (ไม่อยู่ใน PK) · client secret ของ Google อยู่ในหน้าตั้งค่า Supabase เท่านั้น
const AK = 'kn_auth', PKK = 'kn_pkce', OAP = ['google', 'apple']; // ลำดับปุ่ม · LINE ต้องทำ Edge Function เอง ยังไม่ทำ
let CA = readJSON(AK, null), cloudAuthAsked = false;
const cloudPv = () => OAP.filter(k => CA && CA[k]);
async function cloudAuthCfg() {
  try {
    const j = await sb('/auth/v1/settings', { auth: false }), x = (j && j.external) || {}, n = {};
    OAP.forEach(k => { n[k] = !!x[k] });
    const ch = JSON.stringify(n) !== JSON.stringify(CA); CA = n; writeJSON(AK, n);
    if (ch && !cloudIn() && !document.querySelector('.cov') && (cloudOb || (tab === 'me' && meView === 'acct'))) render();
  } catch (e) { console.warn('อ่านการตั้งค่าผู้ให้บริการเข้าสู่ระบบไม่ได้ ใช้ค่าเดิม', e) }
}
const b64u = a => btoa(String.fromCharCode(...new Uint8Array(a))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
async function cloudOAuth(pv) {
  if (!window.crypto || !crypto.subtle) { CU.err = 'เบราว์เซอร์นี้ใช้วิธีนี้ไม่ได้ ลองใช้อีเมลแทนนะคะ'; return render() }
  CU = { ...CU, busy: true, err: '' }; render();
  const v = b64u(crypto.getRandomValues(new Uint8Array(32))), ch = b64u(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v)));
  if (!writeJSON(PKK, { v, pv, t: Date.now(), ob: cloudOb })) { CU = { ...CU, busy: false, err: 'เข้าสู่ระบบด้วย Google ไม่ได้ในโหมดนี้ ลองใช้รหัสทางอีเมลแทนนะคะ' }; return render() }
  location.href = CLOUD.url.replace(/\/$/, '') + '/auth/v1/authorize?' + new URLSearchParams({ provider: pv, redirect_to: location.origin + location.pathname, code_challenge: ch, code_challenge_method: 's256' });
}
// ขากลับจากหน้า Google: ลบ ?code ออกจากแถบที่อยู่ก่อน แลกเป็น session แล้วซิงก์ (เหมือนเข้าสู่ระบบด้วยอีเมล) · ชื่อจากบัญชีใช้เป็นชื่อเจ้าของถ้ายังไม่ได้ตั้ง
async function cloudOAuthBack() {
  const q = new URLSearchParams(location.search), code = q.get('code'), er = q.get('error_description') || q.get('error');
  if (!code && !er) return false;
  ['code', 'error', 'error_code', 'error_description', 'state'].forEach(k => q.delete(k));
  try { history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash) } catch (e) { console.warn('ลบ ?code ออกจากแถบที่อยู่ไม่ได้', e) }
  const s = readJSON(PKK, null); writeStr(PKK, null);
  if (er) { toast('เข้าสู่ระบบไม่สำเร็จ: ' + esc(er)); return true }
  if (!s || !s.v || Date.now() - s.t > 15 * 60000) { toast('เข้าสู่ระบบไม่สำเร็จ ลองกดเข้าสู่ระบบจากในแอปอีกครั้ง หรือใช้อีเมลแทนนะคะ'); return true }
  cloudOb = !!s.ob && !(M.pet && M.pet.name); CU = { ...CU, busy: true, err: '' }; render();
  try {
    const j = await sb('/auth/v1/token?grant_type=pkce', { method: 'POST', body: { auth_code: code, code_verifier: s.v }, auth: false });
    cloudSetSession(j); CS.via = s.pv; delete CS.rev; delete CS.hash; csave();
    CU = { step: 'email', email: '', busy: false, err: '' };
    toast('เข้าสู่ระบบแล้วค่ะ'); render();
    const r = await cloudSync(true, { loud: true });
    if (r === 'empty' && cloudOb) { cloudOb = false; toast('ยังไม่มีข้อมูลบนคลาวด์ เริ่มตั้งค่าใหม่ได้เลยค่ะ') }
    const um = (j.user && j.user.user_metadata) || {}, nm = String(um.full_name || um.name || '').replace(/[<>&"']/g, '').trim().slice(0, 20);
    if (nm && !(M.me && M.me.name)) { M.me = { ...(M.me || {}), name: nm }; saveM(); render() }
  } catch (e) { CU.busy = false; toast('เข้าสู่ระบบไม่สำเร็จ: ' + esc(e.message)); render() }
  return true;
}

// ---------- เรียก API ----------
async function sb(path, { method = 'GET', body, auth = true, prefer, keepalive } = {}) {
  const h = { apikey: CLOUD.key, 'Content-Type': 'application/json' };
  if (auth) h.Authorization = 'Bearer ' + CS.at;
  if (prefer) h.Prefer = prefer;
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), 15000);
  try {
    const r = await fetch(CLOUD.url.replace(/\/$/, '') + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body), signal: ac.signal, keepalive: !!keepalive && (body === undefined || JSON.stringify(body).length < 60000) });
    let j = null; try { j = await r.json() } catch (e) { console.warn('คำตอบจากเซิร์ฟเวอร์ไม่ใช่ JSON', r.status, e) }
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
    if (e.status >= 400 && e.status < 500) { cloudForget(); toast('การเข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบใหม่นะคะ'); if (tab === 'me') render() }
    throw e;
  }
}

// ---------- ข้อมูลในเครื่อง ----------
// เรียง key ก่อนแปลงเป็นข้อความ เพื่อให้ข้อมูลเดียวกันได้ค่าเดียวกันเสมอ (ฐานข้อมูล jsonb สลับลำดับ key ได้)
const canon = v => Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : v && typeof v === 'object' ? '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}' : JSON.stringify(v);
// ไม่นับ pet.lastTs (เวลาที่เปิดหน้าแรกล่าสุด เปลี่ยนทุกครั้งที่เปิดแอป) ไม่งั้นแค่เปิดแอปก็กลายเป็น "มีของใหม่" แล้วส่งขึ้น/ถามซ้ำไม่จบ
function chash(o) { let x = o; if (o && o[MK] && o[MK].pet && 'lastTs' in o[MK].pet) { const pet = { ...o[MK].pet }; delete pet.lastTs; x = { ...o, [MK]: { ...o[MK], pet } } } const s = canon(x); let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return (h >>> 0).toString(36) + '.' + s.length }
function snapshot() { const d = {}; PK.forEach(k => { const v = readJSON(k); if (v !== undefined) d[k] = v }); return d }
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
  cloudBusy = cloudRun(full, opt).catch(e => { if (opt.loud) toast('ซิงก์ไม่สำเร็จ: ' + e.message); return 'error' }).finally(() => { cloudBusy = null; if (tab === 'me' && !document.querySelector('.cov') && !opt.quiet) render() });
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
  writeStr('kn_pulled', '1', true);
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
// ไฟล์ที่โหลดหลัง cloud.js (เช่น js/packs.js) ลงทะเบียนงานที่ต้องทำต่อ: forget = หลังลืมสถานะเข้าสู่ระบบ · verified = หลังกดยืนยันรหัสอีเมล (เรียกเฉพาะเมื่อเข้าสู่ระบบอยู่)
const CLOUD_HOOKS = { forget: [], verified: [] };
async function cloudVerify() { await cloudVerifyCode(); if (cloudIn()) CLOUD_HOOKS.verified.forEach(f => f()) }
async function cloudVerifyCode() {
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
function cloudForget() { CS = {}; csave(); CLOUD_HOOKS.forget.forEach(f => f()) }
async function cloudLogout() {
  if (!confirm('ออกจากระบบ? ความคืบหน้ายังอยู่ในเครื่องนี้ แต่จะไม่ซิงก์จนกว่าจะเข้าสู่ระบบอีกครั้ง')) return;
  await cloudSync(false, { quiet: true });
  const at = CS.at; cloudForget(); render();
  try { await fetch(CLOUD.url.replace(/\/$/, '') + '/auth/v1/logout', { method: 'POST', headers: { apikey: CLOUD.key, Authorization: 'Bearer ' + at } }) } catch (e) { console.warn('แจ้งเซิร์ฟเวอร์ว่าออกจากระบบไม่ได้ (ในเครื่องออกแล้ว)', e) }
}
// ลบบัญชี: เรียกฟังก์ชัน delete_my_account (ดู supabase/schema.sql) ข้อมูลในเครื่องนี้ไม่ถูกลบ
let cloudDeleting = false;
function cloudDelAsk() {
  if (cloudDeleting || document.querySelector('.cov')) return;
  const o = document.createElement('div'); o.className = 'cov';
  o.innerHTML = `<div class="cdl" role="dialog" aria-modal="true"><h2 style="margin-top:0">ลบบัญชีถาวร?</h2><div class="st" style="line-height:1.7">บัญชี <b>${esc(CS.email)}</b> และความคืบหน้าที่ซิงก์ไว้บนคลาวด์จะถูกลบทันที <b>กู้คืนไม่ได้</b><br>ความคืบหน้าในเครื่องนี้ยังอยู่ และใช้งานต่อแบบไม่มีบัญชีได้ (แนะนำให้กด "ส่งออก" สำรองไว้ก่อน)${typeof PS !== 'undefined' && (PS.ent || []).length ? `<br><b style="color:var(--err)">ระดับที่ปลดล็อกไว้ (${PS.ent.map(l => (LEVELS[l] || { n: l }).n).join(', ')}) ผูกกับบัญชีนี้ จะหายไปด้วยและย้ายไปบัญชีอื่นไม่ได้</b>` : ''}</div><div class="btns"><button data-p="no">ยกเลิก</button><button data-p="yes" style="background:var(--err)">ลบบัญชีถาวร</button></div></div>`;
  o.querySelectorAll('button').forEach(x => x.onclick = () => { if (x.dataset.p === 'yes') { x.disabled = true; x.textContent = 'กำลังลบ…'; cloudDelete(o) } else o.remove() });
  document.body.appendChild(o);
}
async function cloudDelete(o) {
  cloudDeleting = true;
  try {
    if (cloudBusy) await cloudBusy.catch(() => {}); // รอซิงก์ที่ค้างอยู่ให้จบก่อน
    await cloudToken();
    await sb('/rest/v1/rpc/delete_my_account', { method: 'POST', body: {} });
    const at = CS.at; cloudForget();
    try { await fetch(CLOUD.url.replace(/\/$/, '') + '/auth/v1/logout', { method: 'POST', headers: { apikey: CLOUD.key, Authorization: 'Bearer ' + at } }) } catch (e) { console.warn('แจ้งเซิร์ฟเวอร์ว่าออกจากระบบไม่ได้ (ในเครื่องออกแล้ว)', e) }
    o.remove(); CU = { step: 'email', email: '', busy: false, err: '' };
    toast('ลบบัญชีแล้วค่ะ'); render();
  } catch (e) {
    o.remove();
    toast(e.status === 404 || e.code === 'PGRST202' ? 'ยังลบไม่ได้: เซิร์ฟเวอร์ยังไม่ได้ติดตั้งฟังก์ชันลบบัญชี' : 'ลบบัญชีไม่สำเร็จ: ' + e.message);
  }
  cloudDeleting = false;
}
const cloudBack = () => { CU = { ...CU, step: cloudPv().length ? 'mail' : 'email', err: '' }; render() };

// ---------- หน้าจอ ----------
const INP = 'width:100%;box-sizing:border-box;padding:11px;border-radius:10px;border:1px solid var(--bd);background:var(--card);color:var(--fg);font-size:16px';
const PRIV = `<div class="st" style="margin-top:10px">การเข้าสู่ระบบถือว่ารับทราบ<a href="terms.html" target="_blank" rel="noopener" style="color:var(--ac)">ข้อกำหนดการใช้งาน</a>และ<a href="privacy.html" target="_blank" rel="noopener" style="color:var(--ac)">นโยบายความเป็นส่วนตัว</a></div>`;
function cloudFormHtml() { return cloudFormInner() + PRIV }
const GLOGO = '<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.540 0 6.710 1.220 9.210 3.600l6.850-6.850C35.900 2.380 30.470 0 24 0 14.620 0 6.510 5.380 2.560 13.220l7.980 6.190C12.430 13.720 17.740 9.500 24 9.500z"/><path fill="#4285F4" d="M46.980 24.550c0-1.570-.150-3.090-.380-4.550H24v9.020h12.940c-.580 2.960-2.260 5.480-4.780 7.180l7.730 6c4.510-4.180 7.090-10.360 7.090-17.650z"/><path fill="#FBBC05" d="M10.530 28.590c-.480-1.450-.760-2.990-.760-4.590s.270-3.140.760-4.590l-7.980-6.190C.920 16.460 0 20.120 0 24c0 3.880.920 7.540 2.560 10.780l7.970-6.190z"/><path fill="#34A853" d="M24 48c6.480 0 11.930-2.130 15.890-5.810l-7.730-6c-2.150 1.450-4.920 2.300-8.160 2.300-6.260 0-11.570-4.220-13.470-9.910l-7.980 6.190C6.510 42.620 14.620 48 24 48z"/></svg>';
const ALOGO = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor"><path d="M16.400 12.600c0-2.400 2-3.600 2.100-3.700-1.100-1.700-2.900-1.900-3.500-1.900-1.500-.200-2.900.900-3.700.900-.800 0-1.900-.900-3.200-.800-1.600 0-3.200 1-4 2.400-1.700 3-.400 7.400 1.200 9.800.800 1.200 1.800 2.500 3 2.400 1.200 0 1.700-.800 3.100-.800 1.500 0 1.900.800 3.200.800 1.300 0 2.200-1.200 3-2.400.900-1.400 1.300-2.700 1.300-2.800-.100 0-2.500-1-2.500-3.900zM14 5.500c.700-.800 1.100-1.900 1-3-1 0-2.100.700-2.800 1.500-.600.700-1.100 1.800-1 2.900 1.100.100 2.100-.600 2.800-1.400z"/></svg>';
function cloudFormInner() {
  if (!cloudAuthAsked) { cloudAuthAsked = true; setTimeout(cloudAuthCfg, 0) } // ถามว่าเปิดผู้ให้บริการไหนไว้ เฉพาะตอนฟอร์มเข้าสู่ระบบแสดง (ครั้งเดียวต่อการเปิดแอป)
  const dis = CU.busy ? ' disabled' : '', err = CU.err ? `<div class="cer">${CU.err}</div>` : '', pv = cloudPv();
  // หน้าเลือกวิธี (แนวจากตัวอย่างที่เจ้าของส่งมา): ปุ่มผู้ให้บริการ + ลิงก์อีเมลล่างสุด · ยังไม่รู้ว่าเปิดอะไรไว้ หรือเลือกอีเมลแล้ว → ฟอร์มอีเมลแบบเดิม
  if (pv.length && CU.step === 'email') return `<div class="sgn"><b class="sgt">เข้าสู่ระบบ</b><div class="st">ด้วยบัญชีที่มีอยู่แล้ว เก็บความคืบหน้าไว้บนคลาวด์ ใช้ต่อบนเครื่องอื่นได้</div>${pv.map(k => k === 'google' ? `<button class="sgb sgg"${dis} onclick="cloudOAuth('google')">${GLOGO}<span>${CU.busy ? 'กำลังไปหน้า Google…' : 'ลงชื่อเข้าใช้ด้วย Google'}</span></button>` : `<button class="sgb sga"${dis} onclick="cloudOAuth('apple')">${ALOGO}<span>ลงชื่อเข้าใช้ด้วย Apple</span></button>`).join('')}${err}<button class="sgm" onclick="CU={...CU,step:'mail',err:''};render()">${icx('mail', 18)}<span>ใช้อีเมลแทน</span></button></div>`;
  const back = pv.length ? `<button class="lk" onclick="CU={...CU,step:'email',err:''};render()">‹ เลือกวิธีอื่น</button>` : '';
  if (CU.step === 'code') return `<div class="st">ส่งรหัสไปที่ <b>${esc(CU.email)}</b> แล้ว กรอกรหัสตัวเลขจากอีเมล</div><input id="ccd" inputmode="numeric" autocomplete="one-time-code" maxlength="10" placeholder="รหัสจากอีเมล" style="${INP};margin-top:10px;letter-spacing:4px;text-align:center" onkeydown="if(event.key==='Enter')cloudVerify()">${err}<div class="btns" style="margin-top:10px"><button${dis} onclick="cloudVerify()">${CU.busy ? 'กำลังตรวจ…' : 'ยืนยัน'}</button></div><button class="lk" onclick="cloudBack()">เปลี่ยนอีเมล / ส่งรหัสใหม่</button>`;
  return `<div class="st">ใช้อีเมลเข้าสู่ระบบ เราจะส่งรหัสไปให้ ไม่ต้องตั้งรหัสผ่าน</div><input id="cem" type="email" inputmode="email" autocomplete="email" autocapitalize="off" placeholder="อีเมล" value="${esc(CU.email)}" style="${INP};margin-top:10px" onkeydown="if(event.key==='Enter')cloudSend()">${err}<div class="btns" style="margin-top:10px"><button${dis} onclick="cloudSend()">${CU.busy ? 'กำลังส่ง…' : 'ส่งรหัส'}</button></div>${back}`;
}
const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function cloudHtml() {
  if (!cloudOn()) return '';
  let b;
  if (!cloudIn()) b = (cloudPv().length && CU.step === 'email' ? '' : `<div class="st" style="margin-bottom:6px">เข้าสู่ระบบเพื่อเก็บความคืบหน้าไว้บนคลาวด์ และใช้ต่อบนเครื่องอื่นได้</div>`) + cloudFormHtml(); // หน้าเลือกวิธีมีคำอธิบายในตัวแล้ว
  else {
    const last = CS.last ? new Date(CS.last).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : 'ยังไม่เคย';
    b = `<div class="mi" style="padding:0"><span class="mt" style="flex:1"><b>${esc(CS.email)}</b><div class="st">ซิงก์ล่าสุด: ${last}${navigator.onLine ? '' : ' · ออฟไลน์อยู่'}</div></span></div><div class="btns"><button${cloudBusy ? ' disabled' : ''} onclick="cloudSync(true,{loud:true}).then(r=>{if(r==='pushed'||r==='clean'||r==='empty')toast('ซิงก์แล้วค่ะ')})">${cloudBusy ? 'กำลังซิงก์…' : 'ซิงก์ตอนนี้'}</button><button class="g" onclick="cloudLogout()">ออกจากระบบ</button></div><button class="lk" style="color:var(--err)" onclick="cloudDelAsk()">ลบบัญชี</button>${typeof packAcctHtml === 'function' ? packAcctHtml() : ''}`;
  }
  return `<h2>บัญชีและซิงก์</h2><div class="card" id="cloud" style="min-height:0;text-align:left;padding:14px">${b}</div>`;
}
// หน้าเข้าสู่ระบบระหว่างตั้งค่าครั้งแรก (เครื่องใหม่ที่มีบัญชีอยู่แล้ว)
function cloudObHtml() {
  return `<h1>เข้าสู่ระบบ</h1><div class="st">ดึงความคืบหน้าและเพื่อนสัตว์เลี้ยงจากเครื่องเดิมมาใช้ต่อ</div><div class="card" style="min-height:0;text-align:left;padding:14px;margin-top:14px">${cloudIn() ? '<div class="st">กำลังดึงข้อมูล…</div>' : cloudFormHtml()}</div><button class="lk" onclick="cloudOb=false;CU.err='';render()">‹ กลับไปตั้งค่าใหม่</button>`;
}
const cloudObLink = () => cloudOn() ? `<button class="lk" onclick="cloudOb=true;render()">มีบัญชีอยู่แล้ว? เข้าสู่ระบบ</button>` : '';

// ---------- เริ่มทำงาน ----------
async function cloudStart() {
  if (readStr('kn_pulled', true)) { writeStr('kn_pulled', null, true); toast('ดึงความคืบหน้าล่าสุดจากคลาวด์แล้วค่ะ') }
  if (!cloudOn()) return;
  if (!(await cloudOAuthBack())) cloudSync(true, { quiet: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') cloudSync(false, { keepalive: true, quiet: true });
    else cloudSync(true, { quiet: true });
  });
  addEventListener('online', () => cloudSync(true, { quiet: true }));
  setInterval(() => { if (document.visibilityState === 'visible') cloudSync(false, { quiet: true }) }, 120000);
}
