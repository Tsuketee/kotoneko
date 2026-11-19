// ร้านค้า (tab shop · v74 · เจ้าของให้แทนหมวด Certificate ในตัวอย่าง UI): ไว้สุ่มหรือแลกของแต่งสัตว์เลี้ยง/ห้องด้วยแต้มจากการเรียน
// ยังเป็นหน้า "เร็วๆ นี้": กติกา (ใช้แต้มอะไร ราคา โอกาสสุ่ม กันของซ้ำ) รอเจ้าของตัดสิน · ห้ามผูกเงินจริง (ROADMAP) · ระดับเสียเงิน N4/N3 อยู่ในแท็บเรียน ไม่ปนกับร้านนี้
function shopHtml(){const p=M.pet,cat=(p.sp||0)===0&&!!window.PixelCat,nc=cat?Object.keys(PixelCat._t.COATS).length-1:0;
 const box=(i,n,d)=>`<div class="shb"><span class="pmi">${icx(i,22)}</span><div><b>${n}</b><div class="st">${d}</div></div></div>`;
 return `<h1>ร้านค้า</h1><div class="st">สุ่มหรือแลกของแต่งสัตว์เลี้ยงด้วยแต้มจากการเรียน ไม่ใช้เงินจริง</div>
<div class="card shc"><span class="bd b1">เร็วๆ นี้</span><b>ร้านกำลังจัดของอยู่</b><div class="st">เรียนสะสมแต้มไว้ก่อนได้เลย เปิดร้านเมื่อไหร่${p.name}จะบอกนะ</div></div>
${box('gift','ตู้สุ่ม','สุ่มของแต่งชิ้นใหม่ให้'+p.name+'และห้อง')}${box('swap','แลกของ','เลือกแลกชิ้นที่อยากได้ตรงๆ')}
<h2>ของที่จะมีในร้าน</h2><div class="card pfx shl">${cat?`<div>${icx('sparkle',18)} ลายขนแมว ${nc} แบบ</div><div>${icx('bow',18)} เครื่องประดับ ผ้าพันคอ และโบว์</div>`:''}<div>${icx('home',18)} ของแต่งห้อง เช่น โคมกระดาษ</div></div>
<button class="mer" onclick="goProf()"><span class="pmi">${icx('paw',22)}</span><span class="mrt"><b>ดูคลังสะสมของ${p.name}</b><span class="st">ของที่มีแล้วและที่ยังล็อกอยู่</span></span><span aria-hidden="true">›</span></button>`}
