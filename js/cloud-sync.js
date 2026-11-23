// ซิงก์ความคืบหน้ากับคลาวด์: ลายนิ้วมือข้อมูล ส่งขึ้น/ดึงลง ถามเมื่อแก้พร้อมกัน · แยกจาก js/cloud.js (ถอนวัชพืชข้อ 15)
// เรียง key ก่อนแปลงเป็นข้อความ เพื่อให้ข้อมูลเดียวกันได้ค่าเดียวกันเสมอ (ฐานข้อมูล jsonb สลับลำดับ key ได้)
const canon = v => Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : v && typeof v === 'object' ? '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}' : JSON.stringify(v);
// ไม่นับ pet.lastTs (เวลาที่เปิดหน้าแรกล่าสุด เปลี่ยนทุกครั้งที่เปิดแอป) ไม่งั้นแค่เปิดแอปก็กลายเป็น "มีของใหม่" แล้วส่งขึ้น/ถามซ้ำไม่จบ
function chash(o) { let x = o; if (o && o[MK] && o[MK].pet && 'lastTs' in o[MK].pet) { const pet = { ...o[MK].pet }; delete pet.lastTs; x = { ...o, [MK]: { ...o[MK], pet } } } const s = canon(x); let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return (h >>> 0).toString(36) + '.' + s.length }
const hasPet = d => !!(d && d[MK] && d[MK].pet && d[MK].pet.name);
function sumOf(d) {
  let lr = 0; for (const k in DS) lr += Object.values((d && d[DS[k].key]) || {}).filter(v => v && v.b >= MASTERY).length;
  const days = (d && d[MK] && d[MK].days) || {}, tot = Object.values(days).reduce((a, b) => a + (+b || 0), 0), last = Object.keys(days).sort().pop();
  return { lr, tot, last, pet: hasPet(d) ? d[MK].pet.name : '' };
}
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
  if (!writeProg(row.data || {}, true)) throw new Error('พื้นที่ในเครื่องไม่พอ ดึงข้อมูลจากคลาวด์ไม่สำเร็จ');
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
