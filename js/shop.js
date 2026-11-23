// ร้านค้า (tab shop): ตู้สะสมแบบเห็นของทุกชิ้นในหน้าเดียว · แตะของแล้วแผ่นล่างลองใส่และแลกด้วยโคบัง · แลกแล้วไปใส่ที่คลังสะสม (js/profile.js colWear)
// ถุงโชคดี: หน้าต่างบอกรายชื่อและโอกาสก่อนจ่าย → อนิเมชันเปิดถุง → หน้าต่างโชว์ของที่ได้ · อาหารซื้อด้วย Energy เข้าตู้กับข้าว · ห้ามมีราคาเงินจริง
// กติกาและราคา: js/koban.js · แบบที่เจ้าของเลือก (2026-11-23): FEATURE_MAP.md ข้อ 15
let shLog=false;
function shState(it){if(it.soon)return'soon';if(kbOwns(it.id)){const p=M.pet,on=it.t==='coat'?(p.coat||'cream')===it.k:it.t==='acc'?p.acc===it.k:false;return on?'on':'own'}return it.goal?'goal':'buy'}
const shCv=(it,cls,tid)=>`<canvas class="${cls}"${tid?` data-testid="${tid}"`:''} data-coat="${it.t==='coat'?it.k:(M.pet.coat||'cream')}" data-acc="${it.t==='acc'?it.k:(tid?(M.pet.acc||'none'):'none')}" width="48" height="48" ${tid?`role="img" aria-label="${M.pet.name}ลองใส่${kbName(it)}"`:'aria-hidden="true"'}></canvas>`;
const shThumb=(it,big)=>it.t==='room'?`<span class="shic${big?' big':''}">${icx('home',big?56:30)}</span>`:shCv(it,big?'shcv':'pfth',big?'shop-preview':'');
const foodImg=(f,cls,tid)=>`<canvas class="${cls}" data-food="${f.k}"${tid?` data-testid="${tid}"`:''} width="32" height="32" role="img" aria-label="${f.n}"></canvas>`;
function shopHtml(){const p=M.pet,L=kbL(),pool=kbPool(),price=kbBagPrice();
 let h=`<h1>ร้านค้า</h1><div class="st">แลกของแต่งด้วยโคบังจากการเรียน ซื้ออาหารด้วย Energy ไม่ใช้เงินจริง</div>
<div class="card shwal"><div class="shwt"><span class="shkb">${icx('koban',30,'kb-i')}</span><div><div class="shbal"><b data-testid="shop-koban">${kbBal()}</b> โคบัง <span class="shen">${icx('bolt',16,'hl-i')} ${p.energy} Energy</span></div><div class="st">จำได้แม่น +${KB.mast}/ข้อ · รับภารกิจ +${KB.claim} · ครบ 3 อย่าง +${KB.all3} · ติดกัน 7/30 วัน +${KB.s7}/+${KB.s30}</div></div><button class="mnl" data-testid="shop-log-toggle" aria-expanded="${shLog}" onclick="shLog=!shLog;render()">${shLog?'ซ่อน':'ประวัติ'}</button></div>`;
 if(shLog)h+=`<ol class="shlog" data-testid="shop-log">${L.slice(-10).reverse().map(r=>`<li><span>${esc(r[3])}</span><b class="${r[1]<0?'neg':''}">${r[1]>0?'+':''}${r[1]}</b></li>`).join('')||'<li><span>ยังไม่มีรายการ เรียนให้จำได้แม่นหรือรับภารกิจเพื่อรับโคบัง</span></li>'}</ol>`;
 h+=`</div><button class="shbag" data-testid="shop-bag-open" ${pool.length?'':'disabled'} onclick="shBagAsk()"><span class="shbi">${icx('gift',26)}</span><span class="shbt"><b>ถุงโชคดี 福袋</b><span class="st">${pool.length?`สุ่ม 1 ชิ้นจาก ${pool.length} ชิ้นที่ยังไม่มี · โอกาสแต่ละชิ้น 1/${pool.length} · ไม่มีของซ้ำ`:'สะสมครบแล้ว ไม่มีของให้สุ่มเพิ่ม'}</span></span>${pool.length?`<span class="shbp">${icx('koban',16)} ${price}</span>`:''}</button>`;
 [['coat','ลายขน'],['acc','เครื่องประดับ'],['room','ของแต่งห้อง']].filter(([t])=>t==='room'||kbCat()).forEach(([t,n])=>{
  const items=[...(t==='coat'?[kbItem('coat:cream')]:[]),...KBI.filter(it=>it.t===t)],got=items.filter(it=>!it.soon&&kbOwns(it.id)).length;
  h+=`<div class="pfk">${n}${t==='room'?' <span>เร็วๆ นี้</span>':` <span>มีแล้ว ${got}/${items.length}</span>`}</div><div class="pfg">`+items.map(it=>{const s=shState(it);
   const tag={on:'ใส่อยู่',own:'มีแล้ว',soon:'เร็วๆ นี้',goal:`${icx('medal',12,'m3')} แม่น ${it.goal}`,buy:`${icx('koban',12,'kb-i')} ${it.p}`}[s];
   return `<button class="pfi shi${s==='on'?' on':''}${s==='buy'||s==='goal'||s==='soon'?' pfo':''}" data-testid="shop-item-${it.id}" onclick="shSheet('${it.id}')"><span class="pft3">${shThumb(it)}${s==='buy'||s==='goal'?icx('lock',16,'pfl'):''}</span><b>${kbName(it)}</b><span>${tag}</span></button>`}).join('')+'</div>'});
 const fd=p.food||{};
 h+=`<div class="pfk">อาหาร <span>ใช้ Energy · ในตู้กับข้าว ${pfoodN(p)} ชิ้น</span></div><div class="pfg">`+FOOD.map(f=>`<button class="pfi shi" data-testid="food-item-${f.k}" onclick="shFood('${f.k}')"><span class="pft3">${foodImg(f,'fdth')}</span><b>${f.n}</b><span>${icx('bolt',12,'hl-i')} ${f.e} · ในตู้ ${fd[f.k]||0}</span></button>`).join('')+'</div>';
 return h+`<button class="mer" onclick="goCol()"><span class="pmi">${icx('paw',22)}</span><span class="mrt"><b>ใส่ของที่คลังสะสม</b><span class="st">ลายขนและเครื่องประดับที่แลกแล้ว แตะเพื่อใส่หรือถอด</span></span><span aria-hidden="true">›</span></button>`}
// รูปอาหารแบบพิกเซล: ฟังก์ชันวาดของแต่ละชนิดอยู่ใน FOODPX · ชนิดที่ยังไม่มีรูปวาดจานเปล่าสีตามอาหาร
const FOODPX={};
function foodDraw(c){const f=FOOD.find(x=>x.k===c.dataset.food);if(!f)return;const g=c.getContext('2d');g.clearRect(0,0,32,32);if(FOODPX[f.k])return FOODPX[f.k](g);
 const px=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h)};px(4,20,24,4,'#c9b8a6');px(6,24,20,2,'#a8927c');px(8,12,16,8,f.c);px(10,10,12,2,f.c);px(8,12,16,1,'#ffffff80')}
function shDraw(root){(root||document).querySelectorAll('canvas[data-food]').forEach(foodDraw);if(!window.PixelCat)return;const T=PixelCat._t,tm=pdark()?'dark':'light';
 (root||document).querySelectorAll('canvas[data-coat]').forEach(c=>{try{T.draw(c.getContext('2d'),T.frame('sit',0,tm,c.dataset.coat,c.dataset.acc||'none'))}catch(e){console.warn('วาดตัวอย่างไม่ได้',c.dataset.coat,e)}})}
function shopMount(){shDraw()}
// หน้าต่างกลางจอ (ถุงโชคดี · ของที่ได้ · ให้อาหาร) และแผ่นล่าง (ของในร้าน) ใช้ตัวเดียวกัน · คลิกพื้นหลังหรือปุ่มปิด = ปิด
function shOpen(html,{sheet,tid}={}){document.querySelectorAll('.shov').forEach(x=>x.remove());const o=document.createElement('div');o.className='cov shov'+(sheet?' shsh':'');
 o.innerHTML=`<div class="cdl${sheet?' shsd':''}" role="dialog" aria-modal="true" data-testid="${tid}">${sheet?'<span class="shgrab" aria-hidden="true"></span>':''}${html}</div>`;
 o.onclick=e=>{if(e.target===o||e.target.closest('[data-x]'))o.remove()};o.onkeydown=e=>{if(e.key==='Escape')o.remove()};document.body.appendChild(o);shDraw(o);return o}
const shClose=()=>document.querySelectorAll('.shov').forEach(x=>x.remove());
function shSheet(id){const it=kbItem(id);if(!it)return;const s=shState(it),cat=kbCat(),bal=kbBal();
 const act={buy:`<button class="g" data-testid="shop-buy" ${bal<it.p?'disabled':''} onclick="shBuy('${id}')">แลก ${it.p} โคบัง</button>`,
  own:`<button class="g" data-testid="shop-go-col" onclick="shClose();goCol()">ไปใส่ที่คลังสะสม</button>`,on:`<button class="g" data-testid="shop-go-col" onclick="shClose();goCol()">ไปที่คลังสะสม</button>`,goal:'',soon:''}[s];
 const note={buy:bal<it.p?`มี ${bal} โคบัง · ขาดอีก ${it.p-bal} โคบัง`:`มี ${bal} โคบัง · แลกแล้วเหลือ ${bal-it.p}`,own:'มีแล้ว · ใส่ได้ที่คลังสะสม',on:'มีแล้ว · ใส่อยู่',goal:`ได้เมื่อจำได้แม่นครบ ${it.goal} ข้อ (ตอนนี้ ${pmast()}) ซื้อไม่ได้`,soon:'กำลังวาดของชิ้นนี้ลงในห้อง เร็วๆ นี้'}[s];
 shOpen(`<div class="shsv">${cat||it.t==='room'?shThumb(it,1):''}<div class="shst"><h2>${kbName(it)}</h2>${it.r?'<span class="bd b3">หายาก</span>':''}<div class="st">${KBT[it.t]}</div><div class="shnote">${note}</div></div></div><div class="btns"><button class="sec" data-x="1" data-testid="shop-sheet-close">ปิด</button>${act}</div>`,{sheet:1,tid:'shop-sheet'})}
function shBuy(id){const it=kbItem(id);if(!kbSpend(id,it.p,'buy'))return;render();shSheet(id);toast(icx('gift',16)+' ได้'+kbName(it)+'แล้ว ใส่ได้ที่คลังสะสม')}
function shFood(k){const p=M.pet,f=FOOD.find(x=>x.k===k),n=(p.food||{})[k]||0,full=n>=FMAX,lo=p.energy<f.e;
 shOpen(`<div class="shsv">${foodImg(f,'fdbig')}<div class="shst"><h2>${f.n}</h2><div class="st">สนิท +${f.b} · หิวลด ${f.h}</div><div class="shnote">ในตู้ ${n}/${FMAX} · มี ${p.energy} Energy${lo?' · Energy ไม่พอ ทำภารกิจรายวันเพื่อรับเพิ่ม':full?' · ตู้กับข้าวเต็มแล้ว':''}</div></div></div><div class="btns"><button class="sec" data-x="1" data-testid="shop-sheet-close">ปิด</button><button class="g" data-testid="food-buy" ${lo||full?'disabled':''} onclick="if(fbuy('${k}')){render();shFood('${k}')}">ซื้อ 1 ชิ้น · ${f.e} Energy</button></div>`,{sheet:1,tid:'shop-sheet'})}
// ---------- ถุงโชคดี ----------
function shBagAsk(){const pool=kbPool(),c=kbBagPrice(),bal=kbBal();if(!pool.length)return;
 shOpen(`<h2>เปิดถุงโชคดี 福袋</h2><p>ใช้ <b data-testid="shop-bag-price">${c}</b> โคบัง สุ่ม 1 ชิ้นจาก ${pool.length} ชิ้นที่ยังไม่มี</p><p class="st" data-testid="shop-bag-odds">โอกาสได้แต่ละชิ้น 1/${pool.length} (${(100/pool.length).toFixed(1)}%) · ไม่มีของซ้ำ</p><div class="shbl">${pool.map(it=>`<span>${kbName(it)}</span>`).join('')}</div>${bal<c?`<p class="shnote">มี ${bal} โคบัง · ขาดอีก ${c-bal} โคบัง</p>`:''}<div class="btns"><button class="sec" data-x="1">ยกเลิก</button><button class="g" data-testid="shop-bag-confirm" ${bal<c?'disabled':''} onclick="shBagGo()">เปิดถุง</button></div>`,{tid:'shop-bag-dialog'})}
const BAGSVG=`<svg viewBox="0 0 64 64" aria-hidden="true"><path class="bgb" d="M14 30c0-8 8-12 18-12s18 4 18 12l2 20c0 6-8 9-20 9s-20-3-20-9z"/><path class="bgt" d="M20 22c4-3 20-3 24 0l-2 5c-6-2-14-2-20 0z"/><path class="bgk" d="M24 14c2 4 4 6 8 8 4-2 6-4 8-8-3 1-5 3-8 5-3-2-5-4-8-5z"/><circle class="bgc" cx="32" cy="40" r="7"/><path class="bgs" d="M29 40h6M32 37v6"/></svg>`;
function shBagGo(){const it=kbBag();shClose();if(!it)return;render();
 const show=()=>{const big=it.t==='room'?`<span class="shic big">${icx('home',60)}</span>`:shCv(it,'shcv shpop');
  shOpen(`<div class="shrev">${big}<h2>ได้<span data-testid="bag-reveal-name">${kbName(it)}</span>!</h2><div class="st">${KBT[it.t]}${it.r?' · หายาก':''} · ใส่ได้ที่คลังสะสม</div></div><div class="btns"><button class="sec" data-x="1" data-testid="bag-reveal-close">เก็บไว้ก่อน</button><button class="g" onclick="shClose();goCol()">ไปใส่ที่คลังสะสม</button></div>`,{tid:'bag-reveal'})};
 if(typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches)return show();
 const a=document.createElement('div');a.className='cov shov bganim';a.dataset.testid='bag-anim';a.setAttribute('aria-label','กำลังเปิดถุงโชคดี');a.innerHTML=`<div class="bgw">${BAGSVG}<span class="bgf" aria-hidden="true"></span></div>`;
 document.body.appendChild(a);setTimeout(()=>{a.remove();show()},1500)}
// ---------- หน้าต่างให้อาหาร (ปุ่ม "ให้อาหาร" บนการ์ดหน้าแรก) ----------
function feedOpen(){const p=M.pet,fd=p.food||{},none=!pfoodN(p),h=phg(p);if(none){pcue('beg');toast(IC.rice+' '+pline(p,'hungry',false))}
 shOpen(`<h2>ให้อาหาร${p.name}</h2><div class="st">${p.name}${phgN(h)} · ความหิว ${h}/100</div>${none?'<p class="shnote">ตู้กับข้าวว่าง ซื้ออาหารด้วย Energy ที่ร้านค้า</p>':''}<div class="fdg">`+FOOD.map(f=>{const n=fd[f.k]||0;
  return `<button class="fdi" data-testid="feed-${f.k}" ${n?'':'disabled'} onclick="if(pfood('${f.k}'))shClose()">${foodImg(f,'fdpx','food-img-'+f.k)}<b>${f.n}</b><span class="fdn">×${n}</span><span class="st">สนิท +${f.b} · หิวลด ${f.h}</span></button>`}).join('')+
  `</div><div class="btns"><button class="sec" data-x="1" data-testid="feed-close">ปิด</button><button class="g" data-testid="feed-go-shop" onclick="shClose();goTab('shop')">ซื้ออาหารที่ร้าน</button></div>`,{tid:'feed-dialog'})}
