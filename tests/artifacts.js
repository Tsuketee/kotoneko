// เก็บหลักฐานของทุกข้อทดสอบไว้ใน test-results/<ชุด>/ (อยู่ใน .gitignore · CI อัปโหลดเป็น artifact)
// - <ข้อ>-<ขั้น>.png  ภาพที่ข้อทดสอบสั่งถ่ายเอง (shot)
// - <ข้อ>-end-p<หน้า>.png  ภาพสุดท้ายของทุกหน้าที่ข้อนั้นเปิด ถ่ายให้เองตอนจบข้อ ทั้งผ่านและไม่ผ่าน
// - <ข้อ>.console.log  console ทุกระดับ + JavaScript error ของทุกหน้าในข้อนั้น
// - summary.md  ตารางสรุป ข้อ | ผล | ภาพ | console error
// ถ่ายด้วย animations: 'disabled' ให้แอนิเมชันค่อยๆ ปรากฏของแอปจบก่อน ภาพจึงตรงกับที่ผู้ใช้เห็นเมื่อหน้านิ่งแล้ว
// ใช้: const rec = recorder(browser, 'e2e') ก่อนรัน → rec.begin(id, name) → test → await rec.end(ok, err) → rec.finish()
// รับหน้าทุกหน้าที่เปิดผ่าน browser.newContext() ระหว่างข้อ แล้วปิด context ให้ตอนจบข้อ
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'test-results');

function recorder(browser, suite) {
  const dir = path.join(ROOT, suite);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const rows = [];
  let cur = null;
  const newContext = browser.newContext.bind(browser);
  browser.newContext = async (o) => {
    const ctx = await newContext(o), t = cur;
    if (t) { t.ctx.push(ctx); ctx.on('page', p => watch(p, t)); }
    return ctx;
  };
  function watch(p, t) {
    const n = t.pages.push(p);
    p.on('console', m => t.log.push({ n, type: m.type(), text: m.text() }));
    p.on('pageerror', e => t.log.push({ n, type: 'pageerror', text: e.message }));
  }
  const file = (t, s) => `${t.id}-${s}.png`;
  return {
    dir,
    begin(id, name) { cur = { id, name, ctx: [], pages: [], log: [], shots: [], t0: Date.now() }; return cur; },
    // ภาพหน้าจอระหว่างข้อ ตั้งชื่อตามขั้น เช่น shot(p, 'quiz-wrong')
    async shot(p, step) {
      const f = file(cur, step);
      await p.screenshot({ path: path.join(dir, f), timeout: 10000, animations: 'disabled' });
      cur.shots.push(f);
      return f;
    },
    // console error + JavaScript error ของข้อปัจจุบัน (ไว้ assert ว่าว่าง)
    errors() { return cur.log.filter(l => l.type === 'error' || l.type === 'pageerror').map(l => l.text); },
    async end(ok, err) {
      const t = cur; cur = null;
      for (const p of t.pages) {
        if (p.isClosed()) continue;
        const f = file(t, 'end-p' + (t.pages.indexOf(p) + 1));
        try { await p.screenshot({ path: path.join(dir, f), timeout: 10000, animations: 'disabled' }); t.shots.push(f); }
        catch (e) { t.log.push({ n: t.pages.indexOf(p) + 1, type: 'screenshot-failed', text: e.message.split('\n')[0] }); }
      }
      const head = [`# ${t.id} ${t.name}`, `ผล: ${ok ? 'ผ่าน' : 'ไม่ผ่าน'} · ${((Date.now() - t.t0) / 1000).toFixed(1)} วินาที`];
      if (!ok) head.push('ข้อผิดพลาด: ' + String((err && (err.stack || err.message)) || err).split('\n').slice(0, 6).join('\n  '));
      fs.writeFileSync(path.join(dir, t.id + '.console.log'), head.concat('', t.log.map(l => `[p${l.n} ${l.type}] ${l.text}`)).join('\n') + '\n');
      const errs = t.log.filter(l => l.type === 'error' || l.type === 'pageerror').length;
      rows.push({ id: t.id, name: t.name, ok, shots: t.shots, errs });
      await Promise.all(t.ctx.map(c => c.close().catch(() => {})));
    },
    finish() {
      const md = [`# ${suite} · ${new Date().toISOString()}`, '', `ผ่าน ${rows.filter(r => r.ok).length}/${rows.length}`, '',
        '| ข้อ | ชื่อ | ผล | ภาพ | console error |', '|---|---|---|---|---|',
        ...rows.map(r => `| ${r.id} | ${r.name.replace(/\|/g, '/')} | ${r.ok ? '✅ ผ่าน' : '❌ ไม่ผ่าน'} | ${r.shots.join('<br>')} | ${r.errs} (${r.id}.console.log) |`)];
      fs.writeFileSync(path.join(dir, 'summary.md'), md.join('\n') + '\n');
    },
  };
}

module.exports = { recorder };
