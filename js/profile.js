// หน้าโปรไฟล์สัตว์เลี้ยง (tab='prof' · เปิดจากปุ่ม "โปรไฟล์" บนการ์ดสัตว์เลี้ยงหน้าแรก · แนวจากตัวอย่าง UI ที่เจ้าของส่งมา 2026-11-19 ข้อ 2)
// อายุนับจาก M.pet.rv (สัตว์เลี้ยงรุ่นเก่าที่ไม่มี rv ใช้วันแรกที่มีใน M.days) · ความสนิทและร่าง · นิสัย · การ์ดสตรีค · คลังสะสม (เหรียญ ลายขน เครื่องประดับ)
// ลายขนและเครื่องประดับ: เจ้าของให้ "โชว์ล็อกไว้ก่อน" (2026-11-19) ยังไม่มีกติกาปลดล็อก มีแค่ลายที่ใส่อยู่ (ค่าเริ่มต้นครีมแต้มส้ม) · ห้ามผูกเงินจริง
const PACC=[['scarf','ผ้าพันคอ'],['bow','โบว์']];
const PSTG=[[1,0],[2,40],[3,120]]; // ร่าง, ความสนิทขั้นต่ำ (ตรงกับ pstage() ใน js/pet.js)
function goProf(){tab='prof';render();window.scrollTo(0,0)}
// วันที่ 'YYYY-MM-DD' (เวลาท้องถิ่น) → จำนวนวันที่อยู่ด้วยกัน นับวันแรกเป็นวันที่ 1
function pdays(rv){const m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(rv||'');if(!m)return 1;const a=new Date(+m[1],m[2]-1,+m[3]),b=new Date(),t=new Date(b.getFullYear(),b.getMonth(),b.getDate());return Math.max(1,Math.round((t-a)/864e5)+1)}
// สตรีคยาวที่สุดและจำนวนวันที่ถึงเป้า (เทียบกับเป้าปัจจุบัน เหมือน streak())
function pbest(){const g=M.goal,ks=Object.keys(M.days).filter(k=>M.days[k]>=g).sort();let best=0,run=0,prev=null;
 ks.forEach(k=>{const[y,mo,d]=k.split('-').map(Number),t=new Date(y,mo-1,d);run=prev&&Math.round((t-prev)/864e5)===1?run+1:1;prev=t;if(run>best)best=run});
 return{best:Math.max(best,streak()),hit:ks.length}}
const pdark=()=>{const t=document.documentElement.dataset.theme;return t?t==='dark':typeof matchMedia==='function'&&matchMedia('(prefers-color-scheme: dark)').matches};
function profHtml(){pens();const p=M.pet,sp=SPC[p.sp||0],cat=(p.sp||0)===0&&!!window.PixelCat,tr=ptr(p),st=pstage(p.bond),tot=pmast(),since=p.rv||Object.keys(M.days).sort()[0]||'',age=pdays(since),{best,hit}=pbest(),n=streak();
 const nx=PSTG.find(s=>s[1]>p.bond),lo=PSTG[st-1][1],bp=nx?Math.min(100,(p.bond-lo)/(nx[1]-lo)*100):100;
 const sm=[3,7,30].find(x=>x>n);
 let h=`<div class="top"><button class="bk" onclick="goTab('home')" aria-label="กลับหน้าแรก">‹</button><b>โปรไฟล์ของ${p.name}</b></div>
<div class="card pfh">${cat?'<canvas class="pfc" id="pfcv" width="48" height="48" role="img" aria-label="'+p.name+'"></canvas>':`<div class="pfe" aria-hidden="true">${sp[0]}</div>`}
<div class="pnm"><b>${p.name}</b><span class="pch">${sp[1]}</span><span class="pch">ร่าง ${st}</span></div>
<div class="st">อยู่ด้วยกันมา ${age} วัน · เริ่ม ${since?since.split('-').reverse().join('/'):'วันนี้'}</div></div>
<div class="kp"><div><b>${age}</b><span>วันที่อยู่ด้วยกัน</span></div><div><b>${p.bond}</b><span>ความสนิท</span></div><div><b>${tot}</b><span>จำได้แม่น</span></div></div>
<h2>ความสนิท</h2><div class="card pfx"><div class="pbd"><span>ร่าง ${st}${nx?' → ร่าง '+nx[0]:' (ร่างสุดท้าย)'}</span><span>${nx?'อีก '+(nx[1]-p.bond)+' แต้ม':'โตเต็มที่แล้ว'}</span></div><div class="bar pbar" role="progressbar" aria-label="ความสนิทถึงร่างถัดไป" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(bp)}"><i style="width:${bp}%;background:var(--ac)"></i></div>
<div class="st">ให้อาหาร +10 · รับรางวัลภารกิจ +2</div></div>
<h2>นิสัย</h2><div class="card pfx pft2"><span class="pmi">${icx(tr.i,22)}</span><div><b>${tr.n}</b><div class="st">“${pline(p,'pat')}”</div></div></div>
<h2>สตรีค</h2><div class="card pfx"><div class="pfs"><div>${icx('flame',22,'hl-i')}<b>${n}</b><span>วันต่อเนื่อง</span></div><div><b>${best}</b><span>ต่อเนื่องนานสุด</span></div><div><b>${hit}</b><span>วันที่ถึงเป้า</span></div></div>
<div class="st">${sm?'อีก '+(sm-n)+' วันถึงสตรีค '+sm+' วัน':'สตรีคเกิน 30 วันแล้ว เก่งมาก'} · เป้าวันละ ${M.goal} ข้อ</div></div>
<h2>คลังสะสม</h2><div class="pfk">เหรียญ</div><div class="pfg">`;
 [[25,1,'ทองแดง'],[100,2,'เงิน'],[250,3,'ทอง']].forEach(([t,lv,nm])=>{const ok=tot>=t;
  h+=`<div class="pfi${ok?'':' pfo'}" aria-label="เหรียญ${nm} ${ok?'ได้แล้ว':'ยังไม่ได้'}">${icx('medal',30,'m'+lv)}<b>เหรียญ${nm}</b><span>${ok?'ได้แล้ว':Math.min(tot,t)+' / '+t}</span></div>`});
 h+='</div>';
 if(cat){const co=PixelCat._t.COATS,on=co[p.coat]?p.coat:'cream';
  h+='<div class="pfk">ลายขน</div><div class="pfg">'+Object.keys(co).map(k=>{const ok=k===on;return `<div class="pfi${ok?' on':' pfo'}" aria-label="ลาย${co[k].name} ${ok?'ใส่อยู่':'ยังล็อกอยู่'}"><span class="pft3"><canvas class="pfth" data-coat="${k}" width="48" height="48" aria-hidden="true"></canvas>${ok?'':icx('lock',16,'pfl')}</span><b>${co[k].name}</b><span>${ok?'ใส่อยู่':'ยังล็อก'}</span></div>`}).join('')+'</div>';
  h+='<div class="pfk">เครื่องประดับ</div><div class="pfg">'+PACC.map(([k,nm])=>{const ok=p.acc===k;return `<div class="pfi${ok?' on':' pfo'}" aria-label="${nm} ${ok?'ใส่อยู่':'ยังล็อกอยู่'}"><span class="pft3"><canvas class="pfth" data-coat="${on}" data-acc="${k}" width="48" height="48" aria-hidden="true"></canvas>${ok?'':icx('lock',16,'pfl')}</span><b>${nm}</b><span>${ok?'ใส่อยู่':'ยังล็อก'}</span></div>`}).join('')+'</div>';
  h+='<div class="st" style="margin:10px 0 16px">ลายขนและเครื่องประดับจะเปิดให้สะสมจากการเรียนเร็วๆ นี้ ไม่ต้องใช้เงินจริง</div>'}
 else h+=`<div class="st" style="margin:10px 0 16px">ลายขนและเครื่องประดับมีให้แมวก่อน ${sp[1]}จะตามมาทีหลังนะ</div>`;
 return h}
// วาดภาพแมวท่านั่ง (ไม่ขยับ) ลงผืนผ้าใบในหน้าโปรไฟล์ · ชุดสีตามโหมดมืด/สว่างของแอป เพราะพื้นการ์ดเปลี่ยนตามโหมด
function profMount(){if(!window.PixelCat)return;const T=PixelCat._t,tm=pdark()?'dark':'light',p=M.pet,on=T.COATS[p.coat]?p.coat:'cream';
 const dw=(c,coat,acc)=>{try{T.draw(c.getContext('2d'),T.frame('sit',0,tm,coat,acc||'none'))}catch(e){}};
 const hc=document.getElementById('pfcv');if(hc)dw(hc,on,p.acc);
 document.querySelectorAll('.pfth').forEach(c=>dw(c,c.dataset.coat,c.dataset.acc))}
