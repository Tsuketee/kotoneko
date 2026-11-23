// แท็บโปรไฟล์ (tab='me'): หน้าแรกของแท็บคือเมนู (v123 เจ้าของขอสลับ 2026-11-22 · เดิมเป็นบัตร) กด "ดูโปรไฟล์" ไปบัตรโปรไฟล์สัตว์เลี้ยง + คลังสะสม · เมนูมีรายการ (บัญชีและซิงก์ สำรองข้อมูล เครดิต นโยบาย เวอร์ชัน)
// v76 ตามตัวอย่างที่เจ้าของส่งมา 2026-11-19 · meView: card | menu | acct | backup | credits · ปุ่มโปรไฟล์บนการ์ดหน้าแรกพามาที่นี่
// อายุนับจาก M.pet.rv (สัตว์เลี้ยงรุ่นเก่าที่ไม่มี rv ใช้วันแรกที่มีใน M.days) · ความสนิทและร่าง · นิสัย · การ์ดสตรีค · คลังสะสม (เหรียญ ลายขน เครื่องประดับ)
// ลายขนและเครื่องประดับ (โชว์ล็อกไว้ก่อน · มีแค่ลายที่ใส่อยู่): docs/PET_PIXEL.md หัวข้อ "กติกาการออกแบบที่ test ตรวจไม่ได้"
const PACC=[['scarf','ผ้าพันคอ'],['bow','โบว์']];
let meView='menu';
function goMe(v){tab='me';meView=v||'menu';render();window.scrollTo(0,0)}
// ธีมของแอป (v123 เจ้าของถามหาปุ่มสลับ): auto ตามเครื่อง | light | dark · เก็บใน localStorage kn_theme (ค่าของเครื่องนี้ ไม่ใช่ความคืบหน้า จึงไม่ซิงก์)
// ใส่ data-theme บน <html> ซึ่ง css/style.css และแมวพิกเซลอ่านอยู่แล้ว · ใช้ทันทีตอนโหลดไฟล์ จะได้ไม่กะพริบเป็นอีกธีมก่อน
const THN={auto:'ตามเครื่อง',light:'สว่าง',dark:'มืด'};
const thGet=()=>{const v=readStr('kn_theme');return v==='light'||v==='dark'?v:'auto'};
function thApply(){const v=thGet(),r=document.documentElement;if(v==='auto')delete r.dataset.theme;else r.dataset.theme=v;
 document.querySelectorAll('meta[name=theme-color]').forEach(m=>{if(!m.dataset.c)m.dataset.c=m.content;m.content=v==='auto'?m.dataset.c:v==='dark'?'#1f1a16':'#fff8ef'})}
function thSet(v){writeStr('kn_theme',v==='auto'?null:v);thApply();render()}
thApply();
function goProf(){goMe('card')} // บัตรโปรไฟล์ (จากปุ่มบนการ์ดหน้าแรก และ "ดูโปรไฟล์" ในเมนู)
function goCol(){goMe('card');setTimeout(()=>{const e=document.getElementById('pfcol');if(e)e.scrollIntoView({block:'start'})},30)} // ไปที่คลังสะสม
// วันที่ 'YYYY-MM-DD' (เวลาท้องถิ่น) → จำนวนวันที่อยู่ด้วยกัน นับวันแรกเป็นวันที่ 1
function pdays(rv){const m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(rv||'');if(!m)return 1;const a=new Date(+m[1],m[2]-1,+m[3]),b=new Date(),t=new Date(b.getFullYear(),b.getMonth(),b.getDate());return Math.max(1,Math.round((t-a)/864e5)+1)}
// ร่าง v75 (เจ้าของส่งตัวอย่างบัตรโปรไฟล์ 2026-11-19 "ลองร่างมาก่อน"): บัตรประจำตัวมีคลิปหนีบ ภาพในกรอบ ชื่อ + ปุ่มแชร์/แก้ชื่อ แถวข้อมูล และแท็บ เกี่ยวกับ/นิสัย
//  หยิบแค่รูปแบบ ไม่ลอกภาพ · ช่องที่แอปไม่มีข้อมูล (ชื่อเจ้าของ friend code น้ำหนัก/ส่วนสูง) ใช้ข้อมูลที่มีจริงแทน: วันเกิด ความสนิท เรียนเพื่อ ระดับ Energy สตรีค จำได้แม่น
const PFL=[[0,'เพิ่งรู้จัก'],[20,'เริ่มคุ้นเคย'],[40,'เพื่อนกัน'],[80,'เพื่อนสนิท'],[120,'คู่หูรู้ใจ']]; // ระดับความสนิท (ขั้น 40 และ 120 ตรงกับร่าง 2 และ 3)
const PTD=['ตื่นเต้นกับทุกข้อใหม่ เชียร์เสียงดัง พร้อมลุยตลอดเวลา','พูดน้อยแต่ตั้งใจฟัง อยู่ข้างๆ เงียบๆ ให้เรียนได้สบายใจ','พูดไม่ค่อยเก่ง แต่อยากเป็นกำลังใจให้มากที่สุด','ทำเป็นไม่สนใจ แต่แอบดีใจทุกครั้งที่เธอมาเรียน','ไม่รีบ ไม่กดดัน เรียนไปพักไปตามสบาย','ชอบแหย่ให้หัวเราะ แต่เชียร์จริงจังตอนสำคัญ','ชอบถามว่าคำนี้มาจากไหน อยากรู้ไปพร้อมกับเธอ','พูดจานุ่มนวล ใส่ใจรายละเอียด ให้กำลังใจอย่างสุภาพ','ชอบเกร็ดความรู้ จำเก่ง ชวนทบทวนอย่างมีหลักการ','ตัวเล็กแต่ใจสู้ ค่อยๆ เก็บทีละข้อไปด้วยกัน']; // คำอธิบายนิสัยตามลำดับ TR (เขียนเอง)
const PWHY={'เพื่อไปสอบวัดระดับ JLPT':'สอบวัดระดับ JLPT','ไปอาศัยอยู่ไม่ก็ไปทำงานที่ญี่ปุ่นน่ะ':'ไปอยู่หรือทำงานที่ญี่ปุ่น','เรียนเพื่อความบันเทิง อย่างดูหนัง เล่นเกม อนิเมะทำนองนั้นน่ะ':'ดูหนัง เล่นเกม อนิเมะ'};
let pfTab='about';
const page=d=>d<14?d+' วัน':d<60?Math.floor(d/7)+' สัปดาห์':d<365?Math.floor(d/30)+' เดือน':Math.floor(d/365)+' ปี'+(Math.floor(d%365/30)?' '+Math.floor(d%365/30)+' เดือน':'');
const pbday=k=>{const m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(k||'');if(!m)return'วันนี้';try{return new Date(+m[1],m[2]-1,+m[3]).toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'numeric'})}catch{return k}};
const pdark=()=>{const t=document.documentElement.dataset.theme;return t?t==='dark':typeof matchMedia==='function'&&matchMedia('(prefers-color-scheme: dark)').matches};
function pfT(t){pfTab=t;render()}
function profHtml(){pens();const p=M.pet,sp=SPC[p.sp||0],cat=(p.sp||0)===0&&!!window.PixelCat,tr=ptr(p),st=pstage(p.bond),tot=pmast(),since=p.rv||Object.keys(M.days).sort()[0]||'',age=pdays(since),n=streak(),dd=Object.values(M.days).filter(v=>v>0).length;
 const fi=PFL.filter(x=>p.bond>=x[0]).length-1,fn=PFL[fi+1];
 const row=(k,v,s)=>`<div class="idr"><span>${k}</span><div><b>${v}</b>${s?`<small>${s}</small>`:''}</div></div>`;
 const own=M.me&&M.me.name,about=row('เจ้าของ',own?esc(own):`<button class="mnl" onclick="pfEdit()">ตั้งชื่อของเธอ</button>`)+row('อายุ',page(age))+row('วันเกิด',pbday(since))+row('ความสนิท',`${PFL[fi][1]} <span class="idhb" aria-hidden="true">${icx('heart',14)}</span>`,`ร่าง ${st} · ${fn?'อีก '+(fn[0]-p.bond)+' แต้มถึง'+fn[1]:'สนิทกันที่สุดแล้ว'}`)+row('นาฬิกาชีวิต',PCTN[pchrono(p)+1],PCTS[pchrono(p)+1])+row('เรียนเพื่อ',esc(PWHY[p.goal]||p.goal||'-'))+row('ระดับ',LEVELS[LV].n)
  +`<div class="ids"><span title="Energy">${icx('bolt',18,'hl-i')}<b>${p.energy}</b> Energy</span><span title="สตรีค">${icx('flame',18,'hl-i')}<b>${n}</b> วันติด</span><span title="จำได้แม่น">${icx('medal',18,'m3')}<b>${tot}</b> แม่นแล้ว</span></div>`;
 const trait=`<div class="idtr"><span class="pmi">${icx(tr.i,24)}</span><div><b>${tr.n}</b><div class="st">${PTD[p.trait]||''}</div></div></div><div class="idq"><span>ชอบพูดว่า</span><p>“${pline(p,'pat')}”</p><p>“${pline(p,'goal')}”</p></div>`;
 let h=`<div class="top"><button class="bk" onclick="goMe()" aria-label="กลับหน้าโปรไฟล์">‹</button><b>บัตรของ${p.name}</b></div>
<div class="idc"><span class="idclip" aria-hidden="true"></span><svg class="idst" viewBox="0 0 120 80" aria-hidden="true"><circle cx="84" cy="40" r="30"/><circle cx="84" cy="40" r="23" stroke-dasharray="3 4"/><path d="M4 26c8-6 16 6 24 0s16 6 24 0M4 40c8-6 16 6 24 0s16 6 24 0M4 54c8-6 16 6 24 0s16 6 24 0"/><g transform="translate(74 30) scale(.85)">${P.paw}</g></svg>
<div class="idtop"><div class="idph">${cat?'<canvas class="pfc" id="pfcv" width="48" height="48" role="img" aria-label="'+p.name+'"></canvas>':`<div class="pfe" aria-hidden="true">${sp[0]}</div>`}</div><div class="idrc"><div class="idact"><button class="ida" onclick="pfShare()" aria-label="แชร์">${icx('share',20)}</button><button class="ida" onclick="pfEdit()" aria-label="แก้ชื่อ">${icx('edit',20)}</button></div><div class="idnm"><b>${p.name}</b><span>${sp[1]} · ${dd?'เรียนด้วยกัน '+dd+' วัน':'เพิ่งเริ่มเรียนด้วยกัน'}</span></div></div></div>
<div class="idbd" role="tabpanel">${pfTab==='trait'?trait:about}</div>
<div class="idtb" role="tablist">${[['about','เกี่ยวกับ'],['trait','นิสัย']].map(([k,t])=>`<button role="tab" aria-selected="${pfTab===k}" class="${pfTab===k?'on':''}" onclick="pfT('${k}')">${t}</button>`).join('')}</div></div>
<h2 id="pfcol">คลังสะสม</h2><div class="pfk">เหรียญ</div><div class="pfg">`;
 [[25,1,'ทองแดง'],[100,2,'เงิน'],[250,3,'ทอง']].forEach(([t,lv,nm])=>{const ok=tot>=t;
  h+=`<div class="pfi${ok?'':' pfo'}" aria-label="เหรียญ${nm} ${ok?'ได้แล้ว':'ยังไม่ได้'}">${icx('medal',30,'m'+lv)}<b>เหรียญ${nm}</b><span>${ok?'ได้แล้ว':Math.min(tot,t)+' / '+t}</span></div>`});
 h+='</div>';
 if(cat){const co=PixelCat._t.COATS,on=co[p.coat]?p.coat:'cream';
  h+='<div class="pfk">ลายขน</div><div class="pfg">'+Object.keys(co).map(k=>{const ok=k===on,own=typeof kbOwns==='function'&&kbOwns('coat:'+k);return `<div class="pfi${ok?' on':own?'':' pfo'}" aria-label="ลาย${co[k].name} ${ok?'ใส่อยู่':own?'มีแล้ว':'ยังล็อกอยู่'}"><span class="pft3"><canvas class="pfth" data-coat="${k}" width="48" height="48" aria-hidden="true"></canvas>${ok||own?'':icx('lock',16,'pfl')}</span><b>${co[k].name}</b><span>${ok?'ใส่อยู่':own?'มีแล้ว':'ยังล็อก'}</span></div>`}).join('')+'</div>';
  h+='<div class="pfk">เครื่องประดับ</div><div class="pfg">'+PACC.map(([k,nm])=>{const ok=p.acc===k;return `<div class="pfi${ok?' on':' pfo'}" aria-label="${nm} ${ok?'ใส่อยู่':'ยังล็อกอยู่'}"><span class="pft3"><canvas class="pfth" data-coat="${on}" data-acc="${k}" width="48" height="48" aria-hidden="true"></canvas>${ok?'':icx('lock',16,'pfl')}</span><b>${nm}</b><span>${ok?'ใส่อยู่':'ยังล็อก'}</span></div>`}).join('')+'</div>';
  h+='<div class="st" style="margin:10px 0 16px">ลายขนและเครื่องประดับจะเปิดให้สะสมจากการเรียนเร็วๆ นี้ ไม่ต้องใช้เงินจริง</div>'}
 else h+=`<div class="st" style="margin:10px 0 16px">ลายขนและเครื่องประดับมีให้แมวก่อน ${sp[1]}จะตามมาทีหลังนะ</div>`;
 return h}
// วาดภาพแมวท่านั่ง (ไม่ขยับ) ลงผืนผ้าใบในหน้าโปรไฟล์ · ชุดสีตามโหมดมืด/สว่างของแอป เพราะพื้นการ์ดเปลี่ยนตามโหมด
function profMount(){if(!window.PixelCat)return;const T=PixelCat._t,tm=pdark()?'dark':'light',p=M.pet,on=T.COATS[p.coat]?p.coat:'cream';
 const dw=(c,coat,acc)=>{try{T.draw(c.getContext('2d'),T.frame('sit',0,tm,coat,acc||'none'))}catch(e){console.warn('วาดตัวอย่างลายขนไม่ได้',coat,acc,e)}};
 const hc=document.getElementById('pfcv');if(hc)dw(hc,on,p.acc);
 document.querySelectorAll('.pfth').forEach(c=>dw(c,c.dataset.coat,c.dataset.acc))}
// แก้ชื่อสัตว์เลี้ยง (ปุ่มดินสอบนบัตร) · ตัดอักขระ HTML แบบเดียวกับตอนตั้งชื่อครั้งแรก (obt() ใน js/pet.js)
function pfEdit(){if(document.querySelector('.cov'))return;const o=document.createElement('div'),f='width:100%;box-sizing:border-box;padding:11px;border-radius:10px;border:1px solid var(--bd);background:var(--bg);color:var(--fg);font-size:16px';o.className='cov';
 o.innerHTML=`<div class="cdl" role="dialog" aria-modal="true"><h2 style="margin-top:0">แก้ไขชื่อ</h2><label class="pfl2">ชื่อ${SPC[M.pet.sp||0][1]}<input id="pfnm" maxlength="12" value="${M.pet.name}" style="${f}"></label><label class="pfl2">ชื่อของเธอ (เจ้าของ)<input id="pfow" maxlength="20" value="${esc(M.me&&M.me.name)}" placeholder="ใส่ชื่อเล่นก็ได้" style="${f}"></label><div class="btns" style="margin-top:12px"><button class="sec" data-x="1">ยกเลิก</button><button class="g" data-s="1">บันทึก</button></div></div>`;
 const cl=v=>v.replace(/[<>&"']/g,'').trim();
 const ok=()=>{const v=cl(o.querySelector('#pfnm').value),w=cl(o.querySelector('#pfow').value);if(!v)return;const ch=v!==M.pet.name;M.pet.name=v;M.me={...(M.me||{}),name:w};saveM();o.remove();render();toast(icx('paw',16)+(ch?' ต่อไปนี้เรียกว่า'+v+'นะ':' บันทึกแล้ว'+(w?' ยินดีที่ได้รู้จักนะ '+w:'')))};
 o.onclick=e=>{const b=e.target.closest('button');if(e.target===o||(b&&b.dataset.x))return o.remove();if(b&&b.dataset.s)ok()};
 o.querySelectorAll('input').forEach(x=>x.onkeydown=e=>{if(e.key==='Enter')ok()});document.body.appendChild(o);o.querySelector('#pfnm').focus()}
// แชร์บัตร (ตอนนี้เป็นข้อความ ยังไม่มีภาพบัตร) · ไม่มี Web Share ให้คัดลอกแทน
function pfShare(){const p=M.pet,t=p.name+' เพื่อนเรียนภาษาญี่ปุ่นของฉัน อยู่ด้วยกันมา '+page(pdays(p.rv||Object.keys(M.days).sort()[0]))+' นิสัย'+ptr(p).n+' · Kotoneko';
 if(navigator.share)navigator.share({title:'Kotoneko',text:t}).catch(()=>{});else if(navigator.clipboard)navigator.clipboard.writeText(t).then(()=>toast('คัดลอกข้อความแล้ว'),()=>toast(t));else toast(t)}
// ---------- เมนูของแท็บโปรไฟล์ (หน้ารวมรายการ) และหน้าย่อย ----------
const mnRow=(i,t,go,v)=>{const tail=`${v?`<span class="mnx">${v}</span>`:''}<span class="mnc" aria-hidden="true">›</span>`;
 return /\.html$/.test(go)?`<a class="mnr" href="${go}" target="_blank" rel="noopener"><span class="mni">${icx(i,22)}</span><span class="mnt">${t}</span>${tail}</a>`:`<button class="mnr" onclick="${go}"><span class="mni">${icx(i,22)}</span><span class="mnt">${t}</span>${tail}</button>`};
function menuHtml(){const p=M.pet,sp=SPC[p.sp||0],cat=(p.sp||0)===0&&!!window.PixelCat,on=cloudOn(),inn=on&&cloudIn();
 const tile=(i,t,go)=>`<button class="mnq" onclick="${go}"><span>${icx(i,26)}</span>${t}</button>`;
 return `<div class="mehd"><h1>โปรไฟล์</h1></div>
<div class="mnh"><div class="idph sm">${cat?'<canvas class="pfc" id="pfcv" width="48" height="48" aria-hidden="true"></canvas>':`<div class="pfe" aria-hidden="true">${sp[0]}</div>`}</div><div class="mrt"><b>${M.me&&M.me.name?esc(M.me.name):'ยังไม่ได้ตั้งชื่อ'}</b><span class="st">เจ้าของ${p.name}</span><button class="mnl" onclick="goProf()">ดูโปรไฟล์</button></div><button class="mne" onclick="pfEdit()">แก้ไข ${icx('edit',18)}</button></div>
<div class="mnqs">${on?tile('cloud','ซิงก์ข้อมูล',"goMe('acct')"):tile('download','สำรองข้อมูล',"goMe('backup')")}${tile('gift','ร้านค้า',"goTab('shop')")}${tile('medal','คลังสะสม','goCol()')}</div>
<h2>บัญชีและข้อมูล</h2><div class="mng">${on?mnRow('user','บัญชีและซิงก์',"goMe('acct')",inn?esc(CS.email):'ยังไม่เข้าสู่ระบบ'):''}${mnRow('download','สำรองข้อมูล',"goMe('backup')")}${mnRow('book','ระดับที่เรียน',"goTab('learn')",LEVELS[LV].n)}${mnRow('flame','เป้าหมายต่อวัน','setGoal()',M.goal+' ข้อ')}</div>
<h2>การแสดงผล</h2><div class="mng"><div class="mnr mnth"><span class="mni">${icx('moon',22)}</span><span class="mnt">ธีม</span><span class="seg2" role="group" aria-label="ธีม">${Object.entries(THN).map(([k,t])=>`<button aria-pressed="${thGet()===k}" onclick="thSet('${k}')">${t}</button>`).join('')}</span></div></div>
<h2>ช่วยเหลือและข้อมูล</h2><div class="mng">${mnRow('info','แนะนำแอป','about.html')}${mnRow('sparkle','ลิขสิทธิ์และเครดิต',"goMe('credits')")}${mnRow('shield','นโยบายความเป็นส่วนตัว','privacy.html')}${mnRow('doc','ข้อกำหนดการใช้งาน','terms.html')}</div>
<div class="mnv" id="mnv"></div>${inn?`<button class="mno" onclick="cloudLogout()">${icx('logout',20)} ออกจากระบบ</button>`:''}`}
// เวอร์ชันอ่านจากชื่อแคชของ service worker (ไม่ต้องจำเลขไว้สองที่) · ไม่มี service worker ก็ไม่แสดง
function mnVer(){try{if(!window.caches)return;caches.keys().then(k=>{const v=(k.find(x=>/^kotoneko-v\d+$/.test(x))||'').slice(9),e=document.getElementById('mnv');if(v&&e)e.textContent='เวอร์ชัน '+v}).catch(()=>{})}catch(err){console.warn('อ่านเลขเวอร์ชันจากแคชไม่ได้',err)}}
function meHtml(){if(meView==='menu')return menuHtml();if(meView==='card')return profHtml();
 const T={acct:'บัญชีและซิงก์',backup:'สำรองข้อมูล',credits:'ลิขสิทธิ์และเครดิต'},b={acct:()=>cloudHtml().replace(/^<h2>[^<]*<\/h2>/,'')||'<div class="st">ยังไม่ได้ตั้งค่าการซิงก์</div>',backup:backupHtml,credits:()=>creditsHtml().replace(/^<h2>[^<]*<\/h2>/,'').replace('<details class="card" id="credits"','<details open class="card" id="credits"')}[meView];
 if(!b){meView='card';return profHtml()}
 return `<div class="top"><button class="bk" onclick="goMe('menu')" aria-label="กลับเมนู">‹</button><b>${T[meView]}</b></div>${b()}`}
