// ร้านค้า (tab shop) ต้นแบบ ข "ตู้สะสมคือร้าน": ของทุกชิ้นอยู่ในตู้เดียว (มีแล้ว/ราคา/เป้า) แตะแล้วขึ้นแผ่นล่าง ลองใส่ แลก หรือใส่
// สมุดโคบังแสดงที่มาทุกครั้ง · อาหารไม่อยู่ในร้าน: กด "ให้อาหาร" ที่การ์ดหน้าแรกแล้วเลือกเมนู · ห้ามมีราคาเงินจริง
const shItem=id=>id==='coat:cream'?{id,t:'coat',k:'cream'}:KBI.find(x=>x.id===id);
let shLog=false;
function shState(it){if(kbOwns(it.id)){const p=M.pet,on=it.t==='coat'?(p.coat||'cream')===it.k:it.t==='acc'?p.acc===it.k:(p.room||[]).includes(it.k);return on?'on':'own'}return it.goal?'goal':'buy'}
const shThumb=(it,cls='pfth')=>it.t==='room'?`<span class="shic">${icx('home',30)}</span>`:`<canvas class="${cls}" data-coat="${it.t==='coat'?it.k:(M.pet.coat||'cream')}" data-acc="${it.t==='acc'?it.k:'none'}" width="48" height="48" aria-hidden="true"></canvas>`;
function shopHtml(){const p=M.pet,L=kbL(),pool=kbPool();
 let h=`<h1>ร้านค้า</h1><div class="st">ทุกชิ้นได้ด้วยโคบังจากการเรียน ไม่ใช้เงินจริง</div>`;
 h+=`<div class="card shwal"><div class="shwt"><span>${icx('koban',28,'kb-i')}</span><div><b data-testid="shop-koban">${kbBal()}</b> โคบัง<div class="st">จำได้แม่น +${KB.mast}/ข้อ · รับภารกิจ +${KB.claim} · ครบ 3 อย่าง +${KB.all3} · ติดกัน 7/30 วัน +${KB.s7}/+${KB.s30}</div></div><button class="mnl" data-testid="shop-log-toggle" onclick="shLog=!shLog;render()">${shLog?'ซ่อน':'ประวัติ'}</button></div>`;
 if(shLog)h+=`<ol class="shlog" data-testid="shop-log">${L.slice(-8).reverse().map(r=>`<li><span>${esc(r[3])}</span><b class="${r[1]<0?'neg':''}">${r[1]>0?'+':''}${r[1]}</b></li>`).join('')||'<li>ยังไม่มี</li>'}</ol>`;
 h+='</div>';
 const groups=[['coat','ลายขน'],['acc','เครื่องประดับ'],['room','ของแต่งห้อง']].filter(([t])=>t==='room'||kbCat());
 h+=`<div class="pfg shg"><button class="pfi shbagt" data-testid="shop-bag-open" onclick="shSheet('bag')"><span class="pft3"><span class="shic">${icx('gift',34)}</span></span><b>ถุงโชคดี 福袋</b><span>${pool.length?`${icx('koban',12,'kb-i')} ${KB.bag} · 1/${pool.length}`:'ครบแล้ว'}</span></button></div>`;
 groups.forEach(([t,n])=>{const items=[...(t==='coat'?[shItem('coat:cream')]:[]),...KBI.filter(it=>it.t===t&&kbFits(it))];const got=items.filter(it=>kbOwns(it.id)).length;
  h+=`<div class="pfk">${n} <span>มีแล้ว ${got}/${items.length}</span></div><div class="pfg">`+items.map(it=>{const s=shState(it),tag=s==='on'?'ใส่อยู่':s==='own'?'มีแล้ว':s==='goal'?`${icx('medal',12,'m3')} แม่น ${it.goal}`:`${icx('koban',12,'kb-i')} ${it.p}`;
   return `<button class="pfi shi${s==='on'?' on':''}${s==='buy'||s==='goal'?' pfo':''}" data-testid="shop-item-${it.id}" onclick="shSheet('${it.id}')"><span class="pft3">${shThumb(it)}${s==='buy'||s==='goal'?icx('lock',16,'pfl'):''}</span><b>${kbName(it)}</b><span>${tag}</span></button>`}).join('')+'</div>'});
 return h+'<div class="st" style="margin:10px 0 16px">ของแต่งห้อง: ต้นแบบยังไม่ได้วาดของในฉาก</div>'}
function shDraw(root){if(!window.PixelCat)return;const T=PixelCat._t,tm=pdark()?'dark':'light';
 (root||document).querySelectorAll('.pfth,.shcv').forEach(c=>{try{T.draw(c.getContext('2d'),T.frame('sit',0,tm,c.dataset.coat,c.dataset.acc||'none'))}catch(e){console.warn('วาดตัวอย่างไม่ได้',e)}})}
function shopMount(){shDraw()}
// แผ่นล่าง (bottom sheet) ใช้ร่วมกัน: ของในร้าน · ถุงโชคดี · เมนูอาหาร
function shOpen(html){document.querySelectorAll('.shsh').forEach(x=>x.remove());const o=document.createElement('div');o.className='cov shsh';o.innerHTML=`<div class="cdl shsd" role="dialog" aria-modal="true"><span class="shgrab" aria-hidden="true"></span>${html}</div>`;
 o.onclick=e=>{if(e.target===o||e.target.closest('[data-x]'))o.remove()};document.body.appendChild(o);shDraw(o);return o}
function shSheet(id){const p=M.pet;
 if(id==='bag'){const pool=kbPool();return shOpen(`<h2>ถุงโชคดี 福袋</h2><p>ใช้ ${KB.bag} โคบัง สุ่ม 1 ชิ้นจาก ${pool.length} ชิ้นที่ยังไม่มี</p><p class="st" data-testid="shop-bag-odds">โอกาสได้แต่ละชิ้น 1/${pool.length} (${(100/Math.max(1,pool.length)).toFixed(1)}%) · ไม่มีของซ้ำ</p><div class="shbl">${pool.map(it=>`<span>${kbName(it)}</span>`).join('')}</div><div class="btns"><button class="sec" data-x="1">ปิด</button><button class="g" data-testid="shop-confirm" ${!pool.length||kbBal()<KB.bag?'disabled':''} onclick="shBagGo()">เปิดถุง ${KB.bag}</button></div>`)}
 const it=shItem(id),s=shState(it),cat=kbCat();
 const pv=it.t==='room'?`<span class="shic big">${icx('home',60)}</span>`:`<canvas class="shcv" data-coat="${it.t==='coat'?it.k:(p.coat||'cream')}" data-acc="${it.t==='acc'?it.k:(p.acc||'none')}" width="48" height="48" role="img" aria-label="${p.name}ลองใส่"></canvas>`;
 const btn=s==='on'?`<button class="sec" onclick="shWear('${id}')">${it.t==='coat'?'ใส่อยู่':'ถอด'}</button>`:s==='own'?`<button class="g" onclick="shWear('${id}')">ใส่เลย</button>`:s==='goal'?`<div class="st">ได้เมื่อจำได้แม่นครบ ${it.goal} ข้อ (ตอนนี้ ${pmast()})</div>`:`<button class="g" data-testid="shop-buy" ${kbBal()<it.p?'disabled':''} onclick="shBuy('${id}')">แลก ${it.p} โคบัง</button>`;
 shOpen(`<div class="shsv">${cat||it.t==='room'?pv:''}<div><h2>${kbName(it)}</h2>${it.r?'<span class="bd b3">หายาก</span>':''}<div class="st">${KBT[it.t]}${s==='buy'?` · มี ${kbBal()} โคบัง${kbBal()<it.p?` (ขาดอีก ${it.p-kbBal()})`:''}`:''}</div></div></div><div class="btns"><button class="sec" data-x="1">ปิด</button>${btn}</div>`)}
function shBuy(id){const it=shItem(id);if(kbSpend(id,it.p)){shWear(id,1);toast(icx('gift',16)+' ได้'+kbName(it)+'แล้ว');shSheet(id)}}
function shWear(id,quiet){const it=shItem(id),p=M.pet;if(!it||!kbOwns(id))return;
 if(it.t==='coat')p.coat=it.k;else if(it.t==='acc')p.acc=p.acc===it.k&&!quiet?'none':it.k;else{const r=p.room||[];p.room=r.includes(it.k)&&!quiet?r.filter(x=>x!==it.k):[...new Set([...r,it.k])]}
 saveM();render();if(!quiet)document.querySelectorAll('.shsh').forEach(x=>x.remove())}
function shBagGo(){const it=kbBag();if(!it)return;shWear(it.id,1);shSheet(it.id);toast(icx('gift',16)+' ถุงโชคดีได้'+kbName(it)+'!')}
// เมนูอาหาร (เปิดจากปุ่ม "ให้อาหาร" บนการ์ดหน้าแรก)
function feedSheet(){const p=M.pet,h=phg(p);
 shOpen(`<h2>ให้อาหาร${p.name}</h2><div class="pbd"><span>${p.name}${phgN(h)}</span><span>${icx('bolt',14,'hl-i')} ${p.energy} Energy</span></div><div class="bar" data-testid="pet-hunger" role="progressbar" aria-label="ความหิว" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${h}"><i style="width:${h}%"></i></div><div class="shf">`+FOOD.map(f=>`<div class="pzm" data-testid="food-${f.k}"><span class="pmi">${icx('rice',22)}</span><div class="pmb"><b>${f.n}</b><div class="st">สนิท +${f.b} · หิวลด ${f.h}</div></div><button class="pcl" ${p.energy<f.e?'disabled':''} onclick="if(pfood('${f.k}'))document.querySelectorAll('.shsh').forEach(x=>x.remove())">${icx('bolt',14)} ${f.e}</button></div>`).join('')+'</div><div class="btns"><button class="sec" data-x="1">ปิด</button></div>')}
