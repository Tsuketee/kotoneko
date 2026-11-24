// ร้านสะดวกซื้อในฉาก (ต้นแบบ): อาหารพร้อมทานซื้อด้วย Energy เข้าตู้กับข้าว · 22:00–05:00 ของสดติดป้ายลด 20–30% แบบคอนบินิจริง แต่ความสนิทที่ได้ลด 20%
// อาหารของร้านอยู่ใน FOOD (js/koban.js) ช่อง src:'konbini' · ของลดราคาเก็บแยกกองในตู้ด้วยคีย์ <ชนิด>~
const KB_NIGHT=h=>h>=22||h<5;
const kbnItems=()=>{const m=new Date().getMonth();return FOOD.filter(f=>f.src==='konbini'&&(!f.season||f.season.includes(m)))};
// อัตราลดของแต่ละชิ้นคงที่ทั้งคืน (คำนวณจากวันที่ + ชนิด) · ของแห้ง (fresh:0) ไม่ลด
function kbnDisc(f,d=new Date()){if(!f.fresh||!KB_NIGHT(d.getHours()))return 0;const day=new Date(d.getTime()-(d.getHours()<5?864e5:0)),s=dstr(day)+f.k;let x=0;for(const ch of s)x=(x*31+ch.charCodeAt(0))>>>0;return x%3===0?0:x%3===1?20:30}
const kbnPrice=f=>Math.ceil(f.e*(100-kbnDisc(f))/100);
function kbnBuy(k){const p=M.pet,f=FOOD.find(x=>x.k===k);if(!f)return false;const r=kbnDisc(f),c=kbnPrice(f),key=r?k+'~':k;p.food=p.food||{};
 if(p.energy<c||(p.food[key]||0)>=FMAX)return false;p.energy-=c;p.food[key]=(p.food[key]||0)+1;saveM();return {f,r,c}}

// ---------- ต้นแบบ ก "ชั้นวาง": แตะชิ้นไหนซื้อชิ้นนั้นทันที ----------
const kbnJp=f=>`<span class="kbj" lang="ja">${f.jp}</span>`;
function kbnOpen(){const p=M.pet,h=new Date().getHours(),night=KB_NIGHT(h),fd=p.food||{},items=kbnItems();
 const row=f=>{const r=kbnDisc(f),c=kbnPrice(f),n=(fd[f.k]||0)+(fd[f.k+'~']||0);return `<button class="kbi" data-testid="kbn-${f.k}" ${p.energy<c?'disabled':''} onclick="kbnTap('${f.k}')">${foodImg(f,'fdpx')}${r?`<span class="kbst kbtag">${r}%引</span>`:''}<span class="kbt">${kbnJp(f)}<b>${f.n}</b><span class="st">สนิท +${r?Math.round(f.b*.8):f.b}${r?' (ลดราคา ไม่สดเท่าเดิม)':''} · หิวลด ${f.h} · ในตู้ ${n}</span></span><span class="kbp">${r?`<s>${f.e}</s> `:''}${icx('bolt',13)} ${c}</span></button>`};
 shOpen(`<div class="kbhd"><span class="kbclerk" lang="ja">いらっしゃいませ！</span><span class="st">ยินดีต้อนรับค่ะ · มี ${icx('bolt',14,'hl-i')} ${p.energy} Energy</span></div>${night?'<p class="kbnight">ช่วงดึก 22:00–05:00 ของสดบางชิ้นติดป้ายลดราคา 値引き</p>':''}
<div class="pfk">ของแมว</div><div class="kbg">${items.filter(f=>!f.fresh).map(row).join('')}</div>
<div class="pfk">อาหารพร้อมทาน</div><div class="kbg">${items.filter(f=>f.fresh).map(row).join('')}</div>
<div class="btns"><button class="sec" data-x="1" data-testid="kbn-close">ออกจากร้าน</button></div>`,{sheet:1,tid:'kbn-sheet'})}
function kbnTap(k){const r=kbnBuy(k);if(!r)return;toast(icx('rice',16)+' ซื้อ'+r.f.n+(r.r?' ลด '+r.r+'%':'')+' เก็บเข้าตู้กับข้าวแล้ว');render();kbnOpen()}
