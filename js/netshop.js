// ร้านออนไลน์ ネット通販 (tab shop): หน้าเว็บย้อนยุคในจอคอมพิวเตอร์ในห้องแมว · แบบ ค ที่เจ้าของเลือก 2026-11-24 (หน้าเทียบ https://claude.ai/artifact/VSacbYufXmsaBRnhJGAqLN)
// ตะกร้า → เลือกการส่ง → จ่ายตอนสั่ง → รอส่งตามเวลาจริง → ถึงแล้วกล่องพัสดุโผล่ในฉากห้อง (PixelCat.parcel) และปุ่มเปิดกล่องบนการ์ดหน้าแรก → ได้ของ
// สกุลตามชนิดของ: อาหาร = Energy · ของอื่น = โคบัง (สมุดโคบังคีย์ buy:<รหัส> จ่ายตอนสั่ง จึงนับว่ามีแล้ว แต่ใส่ได้หลังเปิดกล่อง) · ห้ามมีราคาเงินจริง
// คำสั่งซื้อ M.ord = [{id, it:{รหัส: จำนวน}, sh:'std'|'exp', at, eta}] เปิดกล่องแล้วลบออก · รหัสที่มี ':' = ของใน KBI · ไม่มี = ชนิดอาหารใน FOOD
const NS_SHIP={std:{n:'ส่งปกติ',h:4,kb:0,en:0},exp:{n:'ส่งด่วน',h:1,kb:20,en:10}};
const NS_CATS=[['toy','ของเล่น'],['home','ของแต่งบ้าน'],['acc','เครื่องประดับ'],['ffood','อาหารต่างประเทศ'],['old','ของเดิม']];
let nsCat='ffood',nsView='list',nsCart={},nsShip='std',nsTimer=0;
const nsOrd=()=>Array.isArray(M.ord)?M.ord:(M.ord=[]);
const nsIsFood=id=>!id.includes(':');
const nsFood=k=>FOOD.find(f=>f.k===k);
const nsTransit=id=>nsOrd().some(o=>o.it[id]);
const nsDue=o=>o.eta<=Date.now();
const nsArrived=()=>nsOrd().filter(nsDue);
const nsN=()=>Object.values(nsCart).reduce((a,n)=>a+n,0);
const hhmm=ms=>{const d=new Date(ms);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
const nsLeft=ms=>{const m=Math.max(0,Math.ceil((ms-Date.now())/6e4));return m>=60?`${Math.floor(m/60)} ชม. ${m%60} นาที`:`${m} นาที`};
// ของในหมวด: ของเดิม = ลายขน (ย้ายไปศาลเจ้า) + อาหารญี่ปุ่น 8 เมนู (ย้ายไปแมพ) · ลายขน/เครื่องประดับมีเฉพาะแมว
function nsItems(c){const cat=kbCat();
 if(c==='toy')return KBI.filter(x=>x.t==='toy');
 if(c==='home')return KBI.filter(x=>x.t==='room');
 if(c==='acc')return cat?KBI.filter(x=>x.t==='acc'):[];
 if(c==='ffood')return FOOD.filter(f=>f.src==='net');
 return [...(cat?KBI.filter(x=>x.t==='coat'):[]),...FOOD.filter(f=>!f.src)]}
// ยอดรวมแยกสกุล · ค่าส่งด่วนจ่ายสกุลเดียวกับของในกล่อง (มีอาหาร +Energy · มีของอื่น +โคบัง)
function nsSum(sh=nsShip){let kb=0,en=0;for(const[id,n]of Object.entries(nsCart)){if(nsIsFood(id))en+=nsFood(id).e*n;else kb+=kbItem(id).p*n}
 const s=NS_SHIP[sh];return{kb:kb?kb+s.kb:0,en:en?en+s.en:0}}
// ตู้กับข้าวชนิดละไม่เกิน FMAX นับของในตู้ + กำลังส่ง + ในตะกร้า
const nsRoom=k=>FMAX-((M.pet.food||{})[k]||0)-nsOrd().reduce((a,o)=>a+(o.it[k]||0),0)-(nsCart[k]||0);
// สถานะของ KBI ในร้าน: soon goal ship (จ่ายแล้วรอส่ง) on own cart buy
function nsState(it){if(it.soon)return'soon';if(kbOwns(it.id)){if(nsTransit(it.id))return'ship';const p=M.pet;return(it.t==='coat'?(p.coat||'cream')===it.k:it.t==='acc'&&p.acc===it.k)?'on':'own'}if(it.goal)return'goal';return nsCart[it.id]?'cart':'buy'}
const NS_TRUCK=`<svg viewBox="0 0 44 24" shape-rendering="crispEdges" aria-hidden="true"><rect x="0" y="2" width="28" height="16" class="nst1"/><rect x="28" y="8" width="12" height="10" class="nst2"/><rect x="31" y="10" width="6" height="4" class="nst3"/><rect x="4" y="18" width="8" height="6" class="nst4"/><rect x="28" y="18" width="8" height="6" class="nst4"/><rect x="4" y="6" width="18" height="3" class="nst3"/></svg>`;
const NS_BOX=`<svg viewBox="0 0 24 20" shape-rendering="crispEdges" aria-hidden="true"><path class="nsb1" d="M2 6h20v13H2z"/><path class="nsb2" d="M12 6h10v13H12z"/><path class="nsb3" d="M2 4h20v3H2z"/><path class="nsb4" d="M10 4h4v15h-4z"/></svg>`;
const nsCur=(c,n)=>c==='en'?`${n} ${icx('bolt',14,'hl-i')}`:`${n} ${icx('koban',14,'kb-i')}`;
function nsThumb(it){if(it.t==='coat'||it.t==='acc')return shCv(it,'pfth');if(it.t)return `<span class="shic">${icx(it.t==='toy'?'paw':'home',26)}</span>`;return foodImg(it,'fdth')}
function nsRow(it){const food=!it.t,id=food?it.k:it.id;
 if(food){const room=nsRoom(it.k),have=(M.pet.food||{})[it.k]||0,c=nsCart[it.k]||0;
  return `<div class="nsrow"><button class="nsrb" data-testid="food-item-${it.k}" onclick="nsDetail('${id}')" aria-label="${it.n} ${it.e} Energy ในตู้ ${have}${c?' ในตะกร้า '+c:''}"><span class="nsth">${nsThumb(it)}</span><span class="nsnm"><b>${it.n}</b><span class="nssub">${it.from?it.from+' ไม่ปรุงรส':'<span class="nsmv">ย้ายไปแมพเร็วๆ นี้</span>'}${c?` · ในตะกร้า ${c}`:''}</span></span><span class="nspr">${nsCur('en',it.e)}</span></button><button class="nsbtn" data-testid="ns-add-${id}" ${room>0?'':'disabled'} aria-label="ใส่${it.n}ลงตะกร้า" onclick="nsAdd('${id}')">+ ตะกร้า</button></div>`}
 const s=nsState(it),tag={soon:'<span class="nssoon">เร็วๆ นี้</span>',goal:`แม่น ${it.goal} ข้อ`,ship:'<span class="nsship">กำลังส่ง</span>',on:'ใส่อยู่',own:'มีแล้ว',cart:'ในตะกร้า',buy:''}[s];
 return `<div class="nsrow"><button class="nsrb" data-testid="shop-item-${id}" onclick="nsDetail('${id}')" aria-label="${kbName(it)} ${it.p?it.p+' โคบัง':''} ${s==='buy'?'':String(tag).replace(/<[^>]+>/g,'')}"><span class="nsth">${nsThumb(it)}</span><span class="nsnm"><b>${kbName(it)}</b><span class="nssub">${tag}${it.t==='coat'&&!it.goal?' <span class="nsmv">ย้ายไปศาลเจ้าเร็วๆ นี้</span>':''}${it.r?' · หายาก':''}</span></span><span class="nspr">${it.p?nsCur('kb',it.p):''}</span></button>${s==='buy'?`<button class="nsbtn" data-testid="ns-add-${id}" aria-label="ใส่${kbName(it)}ลงตะกร้า" onclick="nsAdd('${id}')">+ ตะกร้า</button>`:''}</div>`}
function nsAdd(id){if(nsIsFood(id)){if(nsRoom(id)<=0)return}else if(nsState(kbItem(id))!=='buy')return;nsCart[id]=(nsCart[id]||0)+1;shClose();render()}
function nsDec(id){if(!nsCart[id])return;if(--nsCart[id]<=0)delete nsCart[id];render()}
const nsGo=(v,c)=>{nsView=v;if(c)nsCat=c;render()};
// หน้าต่างรายละเอียด: ลองใส่ (ลายขน/เครื่องประดับ) · ใส่ตะกร้า · บอกเหตุผลที่สั่งไม่ได้
function nsDetail(id){const food=nsIsFood(id),it=food?nsFood(id):kbItem(id);if(!it)return;const cat=kbCat(),bal=kbBal(),p=M.pet;let note,act;
 if(food){const room=nsRoom(id),have=(p.food||{})[id]||0;note=`ในตู้ ${have}/${FMAX}${nsCart[id]?` · ในตะกร้า ${nsCart[id]}`:''} · มี ${p.energy} Energy${room<=0?' · ตู้กับข้าวเต็มแล้ว (นับของที่กำลังส่งด้วย)':''}`;
  act=`<button class="g" data-testid="shop-add" ${room>0?'':'disabled'} onclick="nsAdd('${id}')">ใส่ตะกร้า · ${it.e} Energy</button>`}
 else{const s=nsState(it),o=nsOrd().find(x=>x.it[id]);
  note={buy:`มี ${bal} โคบัง · จ่ายตอนสั่ง`,cart:'อยู่ในตะกร้าแล้ว',ship:`กำลังส่ง · ถึงประมาณ ${o?hhmm(o.eta):''}`,own:'มีแล้ว · ใส่ได้ที่คลังสะสม',on:'มีแล้ว · ใส่อยู่',goal:`ได้เมื่อจำได้แม่นครบ ${it.goal} ข้อ (ตอนนี้ ${pmast()}) สั่งไม่ได้`,soon:`ยังไม่ได้วาด${KBT[it.t]}ลงในห้อง เร็วๆ นี้`}[s];
  act=s==='buy'?`<button class="g" data-testid="shop-add" onclick="nsAdd('${id}')">ใส่ตะกร้า · ${it.p} โคบัง</button>`:s==='own'||s==='on'?`<button class="g" data-testid="shop-go-col" onclick="shClose();goCol()">ไปที่คลังสะสม</button>`:''}
 const pic=food?foodImg(it,'fdbig'):(cat||it.t==='room'||it.t==='toy')?(it.t==='coat'||it.t==='acc'?shCv(it,'shcv','shop-preview'):`<span class="shic big">${icx(it.t==='toy'?'paw':'home',56)}</span>`):'';
 const sub=food?`${it.from?it.from+' · ไม่ปรุงรส แมวกินได้ปลอดภัย':'อาหารญี่ปุ่น · ย้ายไปขายในแมพเร็วๆ นี้'} · สนิท +${it.b} · หิวลด ${it.h}`:KBT[it.t]+(it.t==='coat'&&!it.goal?' · ย้ายไปขอพรที่ศาลเจ้าเร็วๆ นี้':'');
 shOpen(`<div class="nswin"><div class="nstb">${food?it.n:kbName(it)}</div><div class="shsv">${pic}<div class="shst"><h2>${food?it.n:kbName(it)}</h2>${it.r?'<span class="bd b3">หายาก</span>':''}<div class="st">${sub}</div><div class="nspr nsprb">${food?nsCur('en',it.e):it.p?nsCur('kb',it.p):''}</div><div class="shnote">${note}</div></div></div><div class="btns"><button class="sec" data-x="1" data-testid="shop-sheet-close">ปิด</button>${act}</div></div>`,{tid:'shop-sheet'})}
// สั่งซื้อ: จ่ายทันที (โคบังลงสมุด · Energy หัก) แล้วเริ่มนับเวลาส่ง
function nsPay(){const s=nsSum(),p=M.pet,ids=Object.keys(nsCart);if(!ids.length||s.kb>kbBal()||s.en>p.energy)return;
 if(ids.some(id=>!nsIsFood(id)&&nsState(kbItem(id))!=='cart'))return;
 const now=Date.now(),n=M.ordn=(M.ordn||1040)+1,id='A'+n,sh=NS_SHIP[nsShip];
 for(const k of ids)if(!nsIsFood(k)){const it=kbItem(k);kbL().push(['buy:'+k,-it.p,now,'สั่ง'+kbName(it)])}
 if(s.kb&&sh.kb)kbL().push(['ship:'+id,-sh.kb,now,'ค่าส่งด่วน '+id]);
 p.energy-=s.en;nsOrd().push({id,it:{...nsCart},sh:nsShip,at:now,eta:now+sh.h*36e5});nsCart={};nsView='track';saveM();nsArm();render();
 toast(icx('mail',16)+` สั่งแล้ว ${id} · ถึงประมาณ ${hhmm(now+sh.h*36e5)}`)}
// ตั้งเวลา render ตอนกล่องถัดไปถึง (เปิดแอปค้างไว้ก็เห็นกล่องโผล่)
function nsArm(){clearTimeout(nsTimer);const next=nsOrd().filter(o=>!nsDue(o)).reduce((a,o)=>Math.min(a,o.eta),Infinity);if(next<Infinity)nsTimer=setTimeout(()=>{render();nsArm()},next-Date.now()+50)}
// ฉากห้อง: มีกล่องที่ถึงแล้ว = กล่องพัสดุวางในห้อง (แมวเดินไปดม/นั่งในกล่องเหมือนกล่องกระดาษปกติ)
function nsSync(){if(window.PixelCat&&PixelCat.parcel)PixelCat.parcel(nsArrived().length>0)}
const nsParcelBtn=()=>{const a=nsArrived();return a.length?`<button class="nspop" data-testid="parcel-open" onclick="nsOpenBox()">${NS_BOX}<span>พัสดุ ${a[0].id} มาถึงแล้ว! แตะเพื่อเปิดกล่อง${a.length>1?` (อีก ${a.length-1} กล่อง)`:''}</span></button>`:''};
const nsList=o=>Object.entries(o.it).map(([id,n])=>{const it=nsIsFood(id)?nsFood(id):kbItem(id);return `<span class="nsbx">${nsThumb(it)}<b>${it.t?kbName(it):it.n}</b><span>×${n}</span></span>`}).join('');
function nsOpenBox(){const o=nsArrived()[0];if(!o)return;
 shOpen(`<div class="nswin"><div class="nstb">พัสดุ ${o.id} · ${NS_SHIP[o.sh].n}</div><div class="nsbody"><div class="nsbig">${NS_BOX}</div><h2>เปิดกล่องพัสดุ</h2><div class="nsboxes">${nsList(o)}</div><p class="st">อาหารเข้าตู้กับข้าว · ลายขนและเครื่องประดับไปใส่ที่คลังสะสม</p></div><div class="btns"><button class="sec" data-x="1">ไว้ทีหลัง</button><button class="g" data-testid="parcel-take" onclick="nsTake('${o.id}')">รับของ</button></div></div>`,{tid:'parcel-dialog'})}
function nsTake(id){const o=nsOrd().find(x=>x.id===id);if(!o||!nsDue(o))return;const p=M.pet;p.food=p.food||{};let wear=false;
 for(const[k,n]of Object.entries(o.it)){if(nsIsFood(k))p.food[k]=(p.food[k]||0)+n;else wear=true}
 M.ord=nsOrd().filter(x=>x!==o);saveM();shClose();render();
 toast(icx('gift',16)+' เปิดกล่องแล้ว · '+(wear?'ใส่ได้ที่คลังสะสม':'อาหารเข้าตู้กับข้าวแล้ว'))}
// ---------- หน้าร้าน: จอคอมพิวเตอร์ · แถบหมวดซ้าย · รายการ / ตะกร้า / ติดตามพัสดุ ----------
function nsSide(){const pool=kbPool(),orders=nsOrd(),tabs=NS_CATS.filter(([c])=>c!=='acc'||kbCat());
 return `<div class="nsside" role="tablist">${tabs.map(([c,n])=>`<button role="tab" data-testid="shop-tab-${c}" aria-selected="${nsView==='list'&&nsCat===c}" class="${nsView==='list'&&nsCat===c?'on':''}" onclick="nsGo('list','${c}')">${n}</button>`).join('')}
<hr><button class="nscart" data-testid="ns-cart-open" onclick="nsGo('cart')" aria-pressed="${nsView==='cart'}">${icx('shop',16)} ตะกร้า (${nsN()})</button>${orders.length?`<button data-testid="ns-track-open" onclick="nsGo('track')" aria-pressed="${nsView==='track'}">${icx('mail',16)} พัสดุ (${orders.length})</button>`:''}
<button data-testid="shop-bag-open" ${pool.length?'':'disabled'} onclick="shBagAsk()">${icx('gift',16)} ${pool.length?`ถุงโชคดี ${kbBagPrice()}`:'ถุงโชคดี · สะสมครบแล้ว'}</button><button data-testid="shop-go-col" onclick="goCol()">${icx('paw',16)} คลังสะสม</button></div>`}
function nsCartHtml(){const s=nsSum(),p=M.pet,ids=Object.entries(nsCart),bal=kbBal(),shortK=s.kb-bal,shortE=s.en-p.energy;
 if(!ids.length)return `<div class="nsmain" data-testid="ns-cart"><div class="nsh"><span>ตะกร้า</span></div><p class="st">ตะกร้าว่าง เลือกของจากหมวดด้านซ้าย</p></div>`;
 return `<div class="nsmain" data-testid="ns-cart"><div class="nsh"><span>ตะกร้า · ${nsN()} ชิ้น</span></div>${ids.map(([id,n])=>{const it=nsIsFood(id)?nsFood(id):kbItem(id);return `<div class="nsrow"><span class="nsrb"><span class="nsth">${nsThumb(it)}</span><span class="nsnm"><b>${it.t?kbName(it):it.n}</b><span class="nssub">×${n}</span></span><span class="nspr">${it.t?nsCur('kb',it.p*n):nsCur('en',it.e*n)}</span></span><button class="nsbtn" data-testid="ns-dec-${id}" aria-label="เอา${it.t?kbName(it):it.n}ออก 1 ชิ้น" onclick="nsDec('${id}')">−</button></div>`}).join('')}
<div class="nsships">${Object.entries(NS_SHIP).map(([k,v])=>`<button class="nsship-b${nsShip===k?' on':''}" data-testid="ns-ship-${k}" aria-pressed="${nsShip===k}" onclick="nsShip='${k}';render()"><b>${v.n} ${v.h} ชม.</b><span>${k==='std'?'ฟรี':`+${v.en} Energy ถ้ามีอาหาร · +${v.kb} โคบัง ถ้ามีของอื่น`}</span></button>`).join('')}</div>
<div class="nstot">${s.kb?`<span>รวมโคบัง <b data-testid="ns-total-kb">${s.kb}</b> ${icx('koban',16,'kb-i')}</span>`:''}${s.en?`<span>รวม Energy <b data-testid="ns-total-en">${s.en}</b> ${icx('bolt',16,'hl-i')}</span>`:''}</div>
${shortK>0?`<p class="shnote">มี ${bal} โคบัง · ขาดอีก ${shortK} โคบัง</p>`:''}${shortE>0?`<p class="shnote">Energy ไม่พอ · มี ${p.energy} ขาดอีก ${shortE} · ทำภารกิจรายวันเพื่อรับเพิ่ม</p>`:''}
<p class="st">ถึงบ้านประมาณ ${hhmm(Date.now()+NS_SHIP[nsShip].h*36e5)} · กล่องจะวางไว้ในห้อง</p><div class="nsact"><button class="nsbtn" onclick="nsGo('list')">« เลือกต่อ</button><button class="nsbtn g" data-testid="ns-pay" ${shortK>0||shortE>0?'disabled':''} onclick="nsPay()">สั่งซื้อ »</button></div></div>`}
function nsTrackHtml(){const os=nsOrd();
 return `<div class="nsmain" data-testid="ns-track"><div class="nsh"><span>ติดตามพัสดุ</span></div>${os.length?os.map(o=>{const pr=Math.min(1,(Date.now()-o.at)/(o.eta-o.at)),due=nsDue(o);
  return `<div class="nsord" data-testid="ns-order-${o.id}"><div class="nsh2"><b>${o.id}</b><span>${NS_SHIP[o.sh].n}</span></div><div class="nsmap" aria-hidden="true"><span class="nswh">คลังสินค้า</span><span class="nshm">บ้าน${esc(M.pet.name)}</span><span class="nsrd"></span><span class="nstr" style="left:calc(4px + ${Math.round(pr*78)}%)">${NS_TRUCK}</span></div><p>${due?'<b>ถึงแล้ว</b> · เปิดกล่องที่หน้าแรก':`<b>ถึงประมาณ ${hhmm(o.eta)}</b> (อีก ${nsLeft(o.eta)})`}</p><div class="nsboxes">${nsList(o)}</div></div>`}).join(''):'<p class="st">ยังไม่มีพัสดุ</p>'}</div>`}
function shopHtml(){const p=M.pet,L=kbL(),body=nsView==='cart'?nsCartHtml():nsView==='track'?nsTrackHtml():(()=>{const c=NS_CATS.find(x=>x[0]===nsCat&&(x[0]!=='acc'||kbCat()))||NS_CATS[3];nsCat=c[0];const items=nsItems(nsCat);
  return `<div class="nsmain"><div class="nsh"><span>${c[1]}</span><span class="st">${nsCat==='old'?'ลายขนจะย้ายไปศาลเจ้า อาหารญี่ปุ่นจะย้ายไปแมพ':nsCat==='ffood'?'ไม่ปรุงรส แมวกินได้ปลอดภัย · ราคารวมค่าส่ง':nsCat==='acc'?'ใส่ได้ที่คลังสะสม':'ยังไม่ได้วาดลงในห้อง เร็วๆ นี้'}</span></div>${items.map(nsRow).join('')}</div>`})();
 let h=`<div class="shtop"><h1>ร้านออนไลน์</h1><span class="shchip" title="โคบัง">${icx('koban',20,'kb-i')}<b data-testid="shop-koban">${kbBal()}</b></span><span class="shchip" title="Energy">${icx('bolt',18,'hl-i')}<b>${p.energy}</b></span><button class="shchip shlogb" data-testid="shop-log-toggle" aria-expanded="${shLog}" aria-label="ประวัติโคบัง" onclick="shLog=!shLog;render()">${icx('doc',18)}</button></div>
<div class="st shsub">${esc(p.name)}ช่วยกดสั่งของจากคอมพิวเตอร์ในห้อง · ส่งปกติ 4 ชม. ส่งด่วน 1 ชม. · โคบังจากการเรียน Energy จากภารกิจ ไม่ใช้เงินจริง</div>`;
 if(shLog)h+=`<div class="card shwal"><div class="st">จำได้แม่น +${KB.mast}/ข้อ · รับภารกิจ +${KB.claim} · ครบ 3 อย่าง +${KB.all3} · ติดกัน 7/30 วัน +${KB.s7}/+${KB.s30}</div><ol class="shlog" data-testid="shop-log">${L.slice(-10).reverse().map(r=>`<li><span>${esc(r[3])}</span><b class="${r[1]<0?'neg':''}">${r[1]>0?'+':''}${r[1]}</b></li>`).join('')||'<li><span>ยังไม่มีรายการ เรียนให้จำได้แม่นหรือรับภารกิจเพื่อรับโคบัง</span></li>'}</ol></div>`;
 return h+`<div class="nspc" data-testid="ns-pc"><div class="nswin"><div class="nstb">${icx('paw',14)} ねこ通販 — Neko Browser<i aria-hidden="true"><b></b><b></b></i></div><div class="nsurl" aria-hidden="true"><span>neko-tsuhan.jp/${nsView==='list'?nsCat:nsView}</span></div><div class="nsbd">${nsSide()}${body}</div></div></div>`}
