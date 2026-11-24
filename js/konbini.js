// ร้านสะดวกซื้อในแมพ (コンビニ): ปุ่ม "เข้าร้าน" ที่ฉากคอนบินิ → ตะกร้าแบบสมุดเมนู 4 หมวด → แคชเชียร์ถามเป็นประโยคญี่ปุ่น
// แบบที่เจ้าของเลือก 2026-11-24 (ต้นแบบ ข): ช่องสินค้าเหมือนหน้าร้าน (แถวละ 3 รูป ราคาใต้รูป ×จำนวนในตะกร้า) · ซื้อด้วย Energy เข้าตู้กับข้าว
// ของจริงในญี่ปุ่น (รายงาน "ข้อมูลสถานที่ญี่ปุ่น 5 แห่ง"): ลดราคาของใกล้หมดเวลาขายแบบเบาๆ 20–30% ตอนดึก ของยังปลอดภัย แค่ไม่สดเท่าเดิม · ถุงพลาสติกคิดเงิน (レジ袋 有料 ตั้งแต่ ก.ค. 2020)
// สินค้าอยู่ใน FOOD (js/koban.js) ช่อง src:'konbini' · ทุกชิ้นแมวกินได้ ไม่มีหอม/กระเทียม/ช็อกโกแลต/โมจิ
const KBN_TABS=[['snack','ขนมทานเล่น'],['light','อาหารรองท้อง'],['frozen','อาหารแช่แข็ง'],['sweet','ของหวาน']];
const KBN_BAG=1;
const kbnNight=d=>d.getHours()>=22||d.getHours()<5;
// อัตราลดของแต่ละชิ้นคงที่ทั้งคืน: คำนวณจากวันที่ของคืนนั้น (หลังเที่ยงคืนนับเป็นคืนก่อน) + ชนิด · ไม่ใช่ของสด = ไม่ลด
function kbnDisc(f,d=new Date()){if(!f.fresh||!kbnNight(d))return 0;const s=dstr(new Date(d.getTime()-(d.getHours()<5?864e5:0)))+f.k;let x=7;for(const ch of s)x=(x*31+ch.charCodeAt(0))>>>0;return [0,20,30][x%3]}
const kbnPrice=f=>Math.ceil(f.e*(100-kbnDisc(f))/100);
let kbnTab='snack',kbnCart={};
const kbnFood=k=>FOOD.find(f=>f.k===k);
const kbnTotal=()=>Object.entries(kbnCart).reduce((a,[k,n])=>a+kbnPrice(kbnFood(k))*n,0);
const kbnCount=()=>Object.values(kbnCart).reduce((a,n)=>a+n,0);
const kbnHave=k=>Object.entries(M.pet.food||{}).filter(([key])=>key.replace(/[~^]+$/,'')===k).reduce((a,[,n])=>a+n,0);
function kbnHtml(){const p=M.pet,night=kbnNight(new Date()),tot=kbnTotal(),items=FOOD.filter(f=>f.src==='konbini'&&f.c===kbnTab);
 const cell=f=>{const r=kbnDisc(f),c=kbnPrice(f),n=kbnCart[f.k]||0,full=kbnHave(f.k)+n>=FMAX;
  return `<button class="shcell" data-testid="kbn-item-${f.k}" ${p.energy<tot+c||full?'disabled':''} onclick="kbnAdd('${f.k}')" aria-label="${f.n} ${c} Energy${r?' ลด '+r+'%':''}${n?' ในตะกร้า '+n:''}"><span class="shart">${foodImg(f,'fdth')}${r?`<span class="kbst kbtag">${r}%引</span>`:''}${n?`<span class="shcnt">×${n}</span>`:''}</span><span class="kbj" lang="ja">${f.jp}</span><b>${f.n}</b><span class="shpr">${r?`<s>${f.e}</s> `:''}${c} <span class="shcoin en">${icx('bolt',13)}</span></span></button>`};
 const rows=[];for(let i=0;i<items.length;i+=3)rows.push(items.slice(i,i+3).map(cell).join(''));
 const cart=Object.entries(kbnCart).map(([k,n])=>`<span class="kbchip" data-testid="kbn-cart-${k}">${kbnFood(k).n} ×${n}<button aria-label="เอา${kbnFood(k).n}ออก 1 ชิ้น" data-testid="kbn-cart-dec-${k}" onclick="kbnAdd('${k}',-1)">−</button></span>`).join('');
 return `<span class="shgrab" aria-hidden="true"></span><div class="kbhd"><span class="kbclerk" lang="ja">いらっしゃいませ！</span><span class="st">ยินดีต้อนรับค่ะ · มี ${icx('bolt',14,'hl-i')} ${p.energy} Energy · หยิบของใส่ตะกร้าแล้วไปจ่ายที่แคชเชียร์</span></div>
${night?'<p class="kbnight">ช่วงดึก 22:00–05:00 ของสดบางชิ้นติดป้ายลดราคา (値引き) แต่ไม่สดเท่าเดิม ความสนิทที่ได้ลดลงนิดหน่อย</p>':''}
<div class="shbook"><div class="shtabs" role="tablist">${KBN_TABS.map(([t,n])=>`<button role="tab" data-testid="kbn-tab-${t}" aria-selected="${kbnTab===t}" class="${kbnTab===t?'on':''}" onclick="kbnT('${t}')">${n}</button>`).join('')}</div>
<div class="shpaper" role="tabpanel"><div class="shnote">${kbnTab==='frozen'?'มื้อหลัก ให้พนักงานอุ่นได้ตอนจ่ายเงิน':kbnTab==='sweet'?'ของหวานสูตรสำหรับแมว':kbnTab==='snack'?'ของแห้ง ไม่มีลดราคา':'ของสด ลดราคาตอนดึก'}</div>${rows.map(r=>`<div class="shrow">${r}</div>`).join('')}</div></div>
<div class="kbbar" data-testid="kbn-basket"><div class="kbbt"><b>${icx('shop',16)} ตะกร้า ${kbnCount()} ชิ้น</b> · รวม <b data-testid="kbn-total">${tot}</b> Energy<div class="kbchips">${cart}</div></div><button class="g" data-testid="kbn-pay" ${kbnCount()?'':'disabled'} onclick="kbnPay()">ไปจ่ายที่แคชเชียร์</button></div>
<div class="btns"><button class="sec" data-testid="kbn-close" onclick="kbnCart={};shClose()">ออกจากร้าน</button></div>`}
// วาดใหม่ในหน้าต่างเดิม (ไม่ปิดเปิด) ตำแหน่งเลื่อนจึงไม่กระโดด
function kbnDraw(){const d=document.querySelector('[data-testid="kbn-sheet"]');if(!d)return kbnOpen();const y=d.scrollTop;d.innerHTML=kbnHtml();shDraw(d);d.scrollTop=y}
function kbnOpen(){kbnCart={};const o=shOpen(kbnHtml().replace('<span class="shgrab" aria-hidden="true"></span>',''),{sheet:1,tid:'kbn-sheet'});o.querySelector('.cdl').classList.add('kbn-sheet')}
function kbnT(t){kbnTab=t;kbnDraw()}
function kbnAdd(k,d=1){const f=kbnFood(k),n=(kbnCart[k]||0)+d;if(d>0&&(M.pet.energy<kbnTotal()+kbnPrice(f)||kbnHave(k)+n>FMAX))return;if(n>0)kbnCart[k]=n;else delete kbnCart[k];kbnDraw()}
// แคชเชียร์: อุ่นไหม (มีของอุ่นได้) → รับถุงไหม → จ่าย · ทุกประโยคเป็นภาษาญี่ปุ่นพร้อมคำแปลไทย
let kbnWarm=false;
function kbnAsk(jp,th,yes,no){const tot=kbnTotal();shOpen(`<div class="kbreg">${icx('shop',30)}<div><span class="kbclerk" lang="ja">${jp}</span><div class="st">${th}</div></div></div><p class="st">ตะกร้า ${kbnCount()} ชิ้น · รวม ${tot} Energy</p><div class="btns"><button class="sec" data-testid="kbn-no" lang="ja" onclick="${no}">いいえ</button><button class="g" data-testid="kbn-yes" lang="ja" onclick="${yes}">はい</button></div>`,{tid:'kbn-register'})}
function kbnPay(){if(!kbnCount())return;kbnWarm=false;if(Object.keys(kbnCart).some(k=>kbnFood(k).warm))return kbnAsk('あたためますか？','อุ่นให้ไหมคะ (อาหารแช่แข็ง/ข้าวกล่อง · อุ่นแล้วความสนิท +2)','kbnWarm=true;kbnBagAsk()','kbnBagAsk()');kbnBagAsk()}
function kbnBagAsk(){const p=M.pet,can=p.energy>=kbnTotal()+KBN_BAG;kbnAsk('ふくろは いりますか？','รับถุงไหมคะ (ถุงละ '+KBN_BAG+' Energy)',can?'kbnDone(true)':'kbnDone(false)','kbnDone(false)')}
function kbnDone(bag){const p=M.pet;p.food=p.food||{};let spent=0,got=0;
 for(const [k,n] of Object.entries(kbnCart)){const f=kbnFood(k),r=kbnDisc(f),c=kbnPrice(f),key=k+(r?'~':'')+(kbnWarm&&f.warm?'^':'');
  for(let i=0;i<n;i++){if(p.energy<c)break;p.energy-=c;spent+=c;p.food[key]=(p.food[key]||0)+1;got++}}
 if(bag&&p.energy>=KBN_BAG){p.energy-=KBN_BAG;spent+=KBN_BAG}
 kbnCart={};saveM();render();
 shOpen(`<div class="kbreg">${icx('ok',30)}<div><span class="kbclerk" lang="ja">ありがとうございました！</span><div class="st">ขอบคุณค่ะ · ได้ ${got} ชิ้น ใช้ ${spent} Energy เก็บเข้าตู้กับข้าวแล้ว</div></div></div><div class="btns"><button class="g" data-x="1" data-testid="kbn-done">ออกจากร้าน</button></div>`,{tid:'kbn-register'})}
