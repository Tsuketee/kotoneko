// ร้านสะดวกซื้อในฉาก (ต้นแบบ): อาหารพร้อมทานซื้อด้วย Energy เข้าตู้กับข้าว · 22:00–05:00 ของสดติดป้ายลด 20–30% แบบคอนบินิจริง แต่ความสนิทที่ได้ลด 20%
// อาหารของร้านอยู่ใน FOOD (js/koban.js) ช่อง src:'konbini' · ของลดราคาเก็บแยกกองในตู้ด้วยคีย์ <ชนิด>~
const KB_NIGHT=h=>h>=22||h<5;
const kbnItems=()=>{const m=new Date().getMonth();return FOOD.filter(f=>f.src==='konbini'&&(!f.season||f.season.includes(m)))};
// อัตราลดของแต่ละชิ้นคงที่ทั้งคืน (คำนวณจากวันที่ + ชนิด) · ของแห้ง (fresh:0) ไม่ลด
function kbnDisc(f,d=new Date()){if(!f.fresh||!KB_NIGHT(d.getHours()))return 0;const day=new Date(d.getTime()-(d.getHours()<5?864e5:0)),s=dstr(day)+f.k;let x=0;for(const ch of s)x=(x*31+ch.charCodeAt(0))>>>0;return x%3===0?0:x%3===1?20:30}
const kbnPrice=f=>Math.ceil(f.e*(100-kbnDisc(f))/100);
function kbnBuy(k){const p=M.pet,f=FOOD.find(x=>x.k===k);if(!f)return false;const r=kbnDisc(f),c=kbnPrice(f),key=r?k+'~':k;p.food=p.food||{};
 if(p.energy<c||(p.food[key]||0)>=FMAX)return false;p.energy-=c;p.food[key]=(p.food[key]||0)+1;saveM();return {f,r,c}}

// ---------- ต้นแบบ ข "ตะกร้า + แคชเชียร์": หยิบใส่ตะกร้า แล้วไปจ่ายที่เคาน์เตอร์ พนักงานถามประโยคจริงแบบคอนบินิ ----------
const kbnJp=f=>`<span class="kbj" lang="ja">${f.jp}</span>`;
let kbnCart={};
const kbnTotal=()=>Object.entries(kbnCart).reduce((a,[k,n])=>a+kbnPrice(FOOD.find(f=>f.k===k))*n,0);
function kbnOpen(){const p=M.pet,night=KB_NIGHT(new Date().getHours()),items=kbnItems(),tot=kbnTotal(),cnt=Object.values(kbnCart).reduce((a,n)=>a+n,0);
 const row=f=>{const r=kbnDisc(f),c=kbnPrice(f),n=kbnCart[f.k]||0;return `<div class="kbi" data-testid="kbn-${f.k}">${foodImg(f,'fdpx')}${r?`<span class="kbst kbtag">${r}%引</span>`:''}<span class="kbt">${kbnJp(f)}<b>${f.n}</b><span class="st">${r?`<s>${f.e}</s> `:''}${icx('bolt',12)} ${c} · สนิท +${r?Math.round(f.b*.8):f.b}${r?' (ไม่สดเท่าเดิม)':''}</span></span><span class="kbq"><button aria-label="เอาออก" ${n?'':'disabled'} onclick="kbnAdd('${f.k}',-1)">−</button><b>${n}</b><button aria-label="หยิบใส่ตะกร้า" data-testid="kbn-add-${f.k}" ${p.energy<tot+c?'disabled':''} onclick="kbnAdd('${f.k}',1)">+</button></span></div>`};
 shOpen(`<div class="kbhd"><span class="kbclerk" lang="ja">いらっしゃいませ！</span><span class="st">หยิบของใส่ตะกร้า แล้วไปจ่ายที่แคชเชียร์</span></div>${night?'<p class="kbnight">ช่วงดึก 22:00–05:00 ของสดบางชิ้นติดป้ายลดราคา 値引き</p>':''}
<div class="pfk">ของแมว</div><div class="kbg">${items.filter(f=>!f.fresh).map(row).join('')}</div>
<div class="pfk">อาหารพร้อมทาน</div><div class="kbg">${items.filter(f=>f.fresh).map(row).join('')}</div>
<div class="kbbar"><span>${icx('shop',18)} ตะกร้า ${cnt} ชิ้น · ${icx('bolt',14,'hl-i')} ${tot} / ${p.energy}</span><button class="g" data-testid="kbn-pay" ${cnt?'':'disabled'} onclick="kbnPay(0)">ไปจ่ายที่แคชเชียร์</button></div>
<div class="btns"><button class="sec" data-x="1" data-testid="kbn-close" onclick="kbnCart={}">ออกจากร้าน</button></div>`,{sheet:1,tid:'kbn-sheet'})}
function kbnAdd(k,d){kbnCart[k]=Math.max(0,(kbnCart[k]||0)+d);if(!kbnCart[k])delete kbnCart[k];kbnOpen()}
// แคชเชียร์: ขั้น 0 อุ่นไหม (เฉพาะของที่อุ่นได้) → ขั้น 1 รับถุงไหม → จ่าย
function kbnPay(step){const warmable=Object.keys(kbnCart).some(k=>FOOD.find(f=>f.k===k).warm);if(step===0&&!warmable)step=1;
 const ask=(jp,th,next)=>shOpen(`<div class="kbreg">${icx('shop',28)}<div><span class="kbclerk" lang="ja">${jp}</span><div class="st">${th}</div></div></div><div class="btns"><button class="sec" data-testid="kbn-no" onclick="${next}(false)" lang="ja">いいえ</button><button class="g" data-testid="kbn-yes" onclick="${next}(true)" lang="ja">はい</button></div>`,{tid:'kbn-register'});
 if(step===0)return ask('あたためますか？','อุ่นให้ไหมคะ','kbnWarm');
 return ask('ふくろは いりますか？','รับถุงไหมคะ','kbnBag')}
function kbnWarm(){kbnPay(1)}
function kbnBag(){const got=[];for(const [k,n] of Object.entries(kbnCart))for(let i=0;i<n;i++){const r=kbnBuy(k);if(r)got.push(r)}kbnCart={};shClose();render();
 shOpen(`<div class="kbreg">${icx('ok',28)}<div><span class="kbclerk" lang="ja">ありがとうございました！</span><div class="st">ขอบคุณค่ะ · ได้ ${got.length} ชิ้น ใช้ ${got.reduce((a,r)=>a+r.c,0)} Energy เก็บเข้าตู้กับข้าวแล้ว</div></div></div><div class="btns"><button class="g" data-x="1" data-testid="kbn-done">ออกจากร้าน</button></div>`,{tid:'kbn-register'})}
