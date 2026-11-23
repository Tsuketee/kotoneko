// ร้านค้า (tab shop) ต้นแบบ ก "แคตตาล็อก + ลองใส่": แท็บหมวด ลายขน/เครื่องประดับ/ของแต่งห้อง/อาหาร · แตะของแล้วแมวด้านบนลองใส่ให้ดูก่อนแลก
// โคบังซื้อของแต่ง · Energy ซื้ออาหาร · ถุงโชคดีสุ่มเฉพาะชิ้นที่ยังไม่มี · ห้ามมีราคาเงินจริง
let shTab='coat',shSel=null;
function shT(t){shTab=t;shSel=null;render()}
function shPick(id){shSel=id;render()}
const shItem=id=>KBI.find(x=>x.id===id);
function shState(it){if(kbOwns(it.id)){const p=M.pet,on=it.t==='coat'?(p.coat||'cream')===it.k:it.t==='acc'?p.acc===it.k:(p.room||[]).includes(it.k);return on?'on':'own'}return it.goal?'goal':'buy'}
function shopHtml(){const p=M.pet,cat=kbCat();
 const items=KBI.filter(it=>it.t===shTab&&kbFits(it)),pool=kbPool();
 const cream={id:'coat:cream',t:'coat',k:'cream'};
 const list=shTab==='coat'&&cat?[cream,...items]:items;
 const sel=shSel?(shSel==='coat:cream'?cream:shItem(shSel)):null;
 let h=`<h1>ร้านค้า</h1><div class="shw"><span data-testid="shop-koban">${icx('koban',20,'kb-i')} <b>${kbBal()}</b> โคบัง</span><span data-testid="shop-energy">${icx('bolt',20,'hl-i')} <b>${p.energy}</b> Energy</span></div>`;
 // ตัวอย่างด้านบน: แมวใส่ของที่เลือก (ลองใส่) หรือของที่ใส่อยู่
 const pc=sel&&sel.t==='coat'?sel.k:(p.coat||'cream'),pa=sel&&sel.t==='acc'?sel.k:(p.acc||'none');
 let act='';
 if(sel){const s=shState(sel),nm=kbName(sel);
  act=s==='on'?`<button class="sec" onclick="shWear('${sel.id}')">${sel.t==='coat'?'ใส่อยู่':'ถอด'}</button>`:s==='own'?`<button class="g" onclick="shWear('${sel.id}')">ใส่</button>`:s==='goal'?`<div class="st">ได้เมื่อจำได้แม่นครบ ${sel.goal} ข้อ (ตอนนี้ ${pmast()})</div>`:`<button class="g" data-testid="shop-buy" ${kbBal()<sel.p?'disabled':''} onclick="shBuy('${sel.id}')">แลก ${icx('koban',16)} ${sel.p}</button>${kbBal()<sel.p?`<div class="st">ขาดอีก ${sel.p-kbBal()} โคบัง</div>`:''}`;
  act=`<b>${nm}</b>${sel.r?'<span class="bd b3">หายาก</span>':''}${act}`}
 else act=shTab==='food'?`<b>${p.name}${phgN(phg(p))}</b><div class="bar" data-testid="pet-hunger" role="progressbar" aria-label="ความหิว" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${phg(p)}"><i style="width:${phg(p)}%"></i></div>`:`<div class="st">แตะของด้านล่างเพื่อลองใส่ให้${p.name}ดูก่อน</div>`;
 h+=`<div class="card shp">${cat?`<canvas class="shcv" id="shcv" width="48" height="48" data-coat="${pc}" data-acc="${pa}" role="img" aria-label="${p.name}ลองใส่"></canvas>`:`<div class="pfe">${SPC[p.sp||0][0]}</div>`}${sel&&sel.t==='room'?`<div class="shro">${icx('home',40)}</div>`:''}<div class="sha">${act}</div></div>`;
 // ถุงโชคดี
 h+=`<div class="shbag"><span class="pmi">${icx('gift',24)}</span><div><b>ถุงโชคดี 福袋</b><div class="st" data-testid="shop-bag-odds">${pool.length?`สุ่ม 1 ชิ้นจาก ${pool.length} ชิ้นที่ยังไม่มี · โอกาสแต่ละชิ้น 1/${pool.length} · ไม่มีของซ้ำ`:'สะสมครบทุกชิ้นที่สุ่มได้แล้ว'}</div></div><button class="pcl" data-testid="shop-bag" ${!pool.length||kbBal()<KB.bag?'disabled':''} onclick="shBag()">${icx('koban',16)} ${KB.bag}</button></div>`;
 h+=`<div class="seg shs" role="tablist">${[['coat','ลายขน'],['acc','เครื่องประดับ'],['room','ห้อง'],['food','อาหาร']].filter(([t])=>cat||t==='room'||t==='food').map(([t,n])=>`<button role="tab" data-testid="shop-tab-${t}" aria-selected="${shTab===t}" class="${shTab===t?'on':''}" onclick="shT('${t}')">${n}</button>`).join('')}</div>`;
 if(shTab==='food'){h+='<div class="shf">'+FOOD.map(f=>`<div class="pzm" data-testid="food-${f.k}"><span class="pmi">${icx('rice',22)}</span><div class="pmb"><b>${f.n}</b><div class="st">สนิท +${f.b} · หิวลด ${f.h}</div></div><button class="pcl" ${p.energy<f.e?'disabled':''} onclick="pfood('${f.k}')">${icx('bolt',14)} ${f.e}</button></div>`).join('')+'</div><div class="st">Energy ได้จากภารกิจรายวัน · แมวอิ่มแล้วจะยังไม่กิน</div>';return h}
 h+='<div class="pfg">'+list.map(it=>{const s=shState(it),nm=kbName(it);
  const tag=s==='on'?'ใส่อยู่':s==='own'?'มีแล้ว':s==='goal'?`${icx('medal',12,'m3')} แม่น ${it.goal}`:`${icx('koban',12,'kb-i')} ${it.p}`;
  const th=it.t==='room'?`<span class="shic">${icx('home',30)}</span>`:`<canvas class="pfth" data-coat="${it.t==='coat'?it.k:(p.coat||'cream')}" data-acc="${it.t==='acc'?it.k:'none'}" width="48" height="48" aria-hidden="true"></canvas>`;
  return `<button class="pfi shi${s==='on'?' on':''}${shSel===it.id?' sel':''}${s==='buy'||s==='goal'?' pfo':''}" data-testid="shop-item-${it.id}" onclick="shPick('${it.id}')"><span class="pft3">${th}</span><b>${nm}</b><span>${tag}</span></button>`}).join('')+'</div>';
 if(shTab==='room')h+='<div class="st" style="margin-top:8px">ของแต่งห้องวางในห้องอ่านหนังสือ (ต้นแบบ: ยังไม่ได้วาดของในฉาก)</div>';
 return h+`<button class="mer" onclick="goCol()"><span class="pmi">${icx('paw',22)}</span><span class="mrt"><b>ดูคลังสะสมของ${p.name}</b><span class="st">ของที่มีแล้วและที่ยังล็อกอยู่</span></span><span aria-hidden="true">›</span></button>`}
function shopMount(){if(!window.PixelCat)return;const T=PixelCat._t,tm=pdark()?'dark':'light';
 document.querySelectorAll('#shcv,.shi .pfth').forEach(c=>{try{T.draw(c.getContext('2d'),T.frame('sit',0,tm,c.dataset.coat,c.dataset.acc||'none'))}catch(e){console.warn('วาดตัวอย่างไม่ได้',e)}})}
function shAsk(html,yes,ok){const o=document.createElement('div');o.className='cov';o.innerHTML=`<div class="cdl" role="dialog" aria-modal="true">${html}<div class="btns" style="margin-top:14px"><button class="sec" data-x="1">ยกเลิก</button><button class="g" data-s="1" data-testid="shop-confirm">${yes}</button></div></div>`;
 o.onclick=e=>{const b=e.target.closest('button');if(e.target===o||(b&&b.dataset.x))return o.remove();if(b&&b.dataset.s){o.remove();ok()}};document.body.appendChild(o)}
function shBuy(id){const it=shItem(id);if(!it||!it.p||kbOwns(id))return;
 shAsk(`<h2 style="margin-top:0">แลก${kbName(it)}</h2><p>ใช้ ${it.p} โคบัง เหลือ ${kbBal()-it.p} โคบัง</p>`,'แลกเลย',()=>{if(kbSpend(id,it.p)){shWear(id,1);toast(icx('gift',16)+' ได้'+kbName(it)+'แล้ว')}})}
function shWear(id,quiet){const it=id==='coat:cream'?{t:'coat',k:'cream'}:shItem(id),p=M.pet;if(!it||!kbOwns(id))return;
 if(it.t==='coat')p.coat=it.k;else if(it.t==='acc')p.acc=p.acc===it.k&&!quiet?'none':it.k;else{const r=p.room||[];p.room=r.includes(it.k)&&!quiet?r.filter(x=>x!==it.k):[...new Set([...r,it.k])]}
 saveM();render()}
function shBag(){const pool=kbPool();if(!pool.length)return;
 shAsk(`<h2 style="margin-top:0">เปิดถุงโชคดี 福袋</h2><p>ใช้ ${KB.bag} โคบัง สุ่ม 1 ชิ้นจาก ${pool.length} ชิ้นที่ยังไม่มี</p><p class="st">โอกาสได้แต่ละชิ้น 1/${pool.length} (${(100/pool.length).toFixed(1)}%) · ไม่มีของซ้ำ</p><div class="shbl">${pool.map(it=>`<span>${kbName(it)}</span>`).join('')}</div>`,'เปิดถุง',()=>{const it=kbBag();if(!it)return;shSel=it.id;shTab=it.t;shWear(it.id,1);toast(icx('gift',16)+' ถุงโชคดีได้'+kbName(it)+'!')})}
