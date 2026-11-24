// โคบัง (小判) เหรียญทองรูปไข่สมัยเอโดะ: สกุลเงินซื้อของแต่งสัตว์เลี้ยงและห้อง · ได้จากผลการเรียนเท่านั้น ไม่ได้จากการกดตอบ · ห้ามผูกเงินจริง
// Energy (จากภารกิจรายวัน) ซื้ออาหารเข้าตู้กับข้าว M.pet.food = {ชนิด: จำนวน} · ป้อนจากหน้าต่างให้อาหารที่หน้าแรก: ความสนิทเพิ่ม ความหิวลด
// สมุดโคบัง M.kbl = [[คีย์, จำนวน, เวลา ms, เหตุผล]] · ยอดคงเหลือและของที่มี (คีย์ buy:/bag:<รหัส>) คำนวณจากสมุด · คีย์ซ้ำไม่บันทึก จึงไม่มีทางได้ซ้ำ
// กติกาที่เจ้าของเลือก 2026-11-23: FEATURE_MAP.md ข้อ 15 และ docs/PET_PIXEL.md หัวข้อ "กติกาการออกแบบที่ test ตรวจไม่ได้"
const KB={mast:2,claim:5,all3:5,s7:30,s30:100,bag:150,keep:300,days:40};
// t = ชนิด (coat ลายขน · acc เครื่องประดับ · room ของแต่งห้อง) · p = ราคาโคบัง · goal = ได้เมื่อจำได้แม่นครบ (ซื้อไม่ได้) · r = หายาก · soon = ยังไม่ได้วาดในฉาก ซื้อไม่ได้
const KBI=[
 {id:'coat:orange',t:'coat',k:'orange',p:200},{id:'coat:silver',t:'coat',k:'silver',p:200},{id:'coat:white',t:'coat',k:'white',p:200},
 {id:'coat:black',t:'coat',k:'black',p:200},{id:'coat:tuxedo',t:'coat',k:'tuxedo',p:200},{id:'coat:korat',t:'coat',k:'korat',p:200},
 {id:'coat:siamese',t:'coat',k:'siamese',p:300,r:1},{id:'coat:calico',t:'coat',k:'calico',goal:250,r:1},
 {id:'acc:scarf',t:'acc',k:'scarf',n:'ผ้าพันคอ',p:120},{id:'acc:bow',t:'acc',k:'bow',n:'โบว์',p:120},
 {id:'room:daruma',t:'room',k:'daruma',n:'ตุ๊กตาดารุมะ',p:80,soon:1},{id:'room:poster',t:'room',k:'poster',n:'โปสเตอร์ภูเขา',p:100,soon:1},
 {id:'room:plant',t:'room',k:'plant',n:'ต้นไม้กระถางใหญ่',p:120,soon:1},{id:'room:rug',t:'room',k:'rug',n:'พรมลายคลื่น',p:150,soon:1}];
const KBT={coat:'ลายขน',acc:'เครื่องประดับ',room:'ของแต่งห้อง'};
// อาหาร: e = ราคา Energy · b = ความสนิทที่ได้ · h = ความหิวที่ลด · รูปพิกเซลอยู่ใน FOODART (js/shop.js)
const FOOD=[{k:'milk',n:'นมอุ่นๆ',e:15,b:4,h:20},{k:'katsuo',n:'ข้าวโรยปลาโอแห้ง',e:20,b:6,h:25},{k:'dango',n:'ดังโงะ 3 สี',e:20,b:6,h:20},{k:'tamago',n:'ไข่ม้วนทามาโกะยากิ',e:25,b:8,h:30},{k:'onigiri',n:'ข้าวปั้นปลา',e:30,b:10,h:40},{k:'fish',n:'ปลาย่าง',e:45,b:16,h:60},{k:'udon',n:'อุด้งร้อน',e:55,b:20,h:80},{k:'sushi',n:'ซูชิมื้อพิเศษ',e:70,b:26,h:100}];
const FMAX=9;
const kbCat=()=>(M.pet.sp||0)===0&&!!window.PixelCat;
const kbFits=it=>it.t==='room'||kbCat();
const kbItem=id=>id==='coat:cream'?{id,t:'coat',k:'cream'}:KBI.find(x=>x.id===id);
const kbName=it=>it.t==='coat'?(window.PixelCat&&PixelCat._t.COATS[it.k]?PixelCat._t.COATS[it.k].name:it.k):it.n;
// ---------- สมุดโคบัง ----------
const kbL=()=>Array.isArray(M.kbl)?M.kbl:(M.kbl=[]);
const kbBal=()=>kbL().reduce((a,r)=>a+(+r[1]||0),0);
const kbHas=key=>kbL().some(r=>r[0]===key);
function kbOwns(id){if(id==='coat:cream')return true;const it=KBI.find(x=>x.id===id);if(!it)return false;return it.goal?pmast()>=it.goal:kbHas('buy:'+id)||kbHas('bag:'+id)}
function kbAdd(key,n,why,quiet){if(kbHas(key))return 0;kbL().push([key,n,Date.now(),why]);saveM();if(!quiet)toast(icx('koban',16,'kb-i')+' +'+n+' โคบัง · '+why);return n}
function kbSpend(id,n,how){const it=KBI.find(x=>x.id===id);if(!it||n>kbBal()||kbOwns(id))return false;kbL().push([how+':'+id,-n,Date.now(),(how==='bag'?'ถุงโชคดีได้':'แลก')+kbName(it)]);saveM();return true}
// ---------- ได้โคบัง ----------
// จำได้แม่นเพิ่ม: เทียบกับจุดสูงสุดที่เคยให้ของระดับนั้น (ลืมแล้วจำได้ใหม่ไม่ได้ซ้ำ) · ครั้งแรกให้ย้อนหลังตามที่จำได้แม่นอยู่แล้ว
const kbMastAt=lv=>kbL().reduce((a,r)=>{const m=/^mast:([^:]+):(\d+)$/.exec(r[0]);return m&&m[1]===lv?Math.max(a,+m[2]):a},0);
function kbMast(quiet){const n=pmast(),lv=LEVELS[LV].n,was=kbMastAt(lv);return n>was?kbAdd('mast:'+lv+':'+n,(n-was)*KB.mast,'จำได้แม่นเพิ่ม '+(n-was)+' ข้อ',quiet):0}
// รับภารกิจ: คืนจำนวนโคบังที่ได้ ให้ข้อความเด้งตอนกดรับรวมไว้ในข้อความเดียว
function kbClaim(id){const d=M.pet.d;return kbAdd('m:'+d.date+':'+id,KB.claim,'รับภารกิจ',1)+(PM.every(m=>d.cl[m.id])?kbAdd('m3:'+d.date,KB.all3,'ภารกิจครบ 3 อย่าง',1):0)}
// สตรีค: คีย์ตามวันแรกของรอบ จึงได้ครั้งเดียวต่อรอบ · ขาดแล้วเริ่มรอบใหม่ถึง 7/30 วันก็ได้อีก
function kbStreak(){const n=streak();if(n<7)return;const d=new Date();if((M.days[dstr(d)]||0)<M.goal)d.setDate(d.getDate()-1);d.setDate(d.getDate()-(n-1));const k=dstr(d);
 kbAdd('s7:'+k,KB.s7,'เรียนติดกัน 7 วัน');if(n>=30)kbAdd('s30:'+k,KB.s30,'เรียนติดกัน 30 วัน')}
// สมุดยาวเกิน KB.keep รายการ: รวมรายการเก่ากว่า KB.days วันเป็น "ยอดยกมา" · เก็บคีย์ที่ยังต้องใช้ (ของที่มี สตรีค และจุดสูงสุดของจำได้แม่นแต่ละระดับ)
function kbCompact(){const L=kbL();if(L.length<=KB.keep)return;const cut=Date.now()-KB.days*864e5,top={};
 L.forEach(r=>{const m=/^mast:([^:]+):(\d+)$/.exec(r[0]);if(m&&(!top[m[1]]||+m[2]>top[m[1]][1]))top[m[1]]=[r[0],+m[2]]});
 const keep=r=>/^(buy|bag|s7|s30):/.test(r[0])||Object.values(top).some(t=>t[0]===r[0])||(!/^mast:/.test(r[0])&&r[2]>=cut);
 const out=L.filter(keep),carry=L.filter(r=>!keep(r)).reduce((a,r)=>a+(+r[1]||0),0);
 M.kbl=carry?[['carry:'+Date.now(),carry,Date.now(),'ยอดยกมา'],...out]:out;saveM()}
// ตอนเปิดแอป: ให้โคบังที่ค้าง (ย้อนหลัง/สตรีค) · ย่อสมุด · เริ่มนับความหิว
function kbCheck(){const p=M.pet;if(!p||!p.name)return;kbCompact();kbMast();kbStreak();if(p.hg==null){p.hg=50;p.ht=Date.now();saveM()}}
// ---------- ถุงโชคดี 福袋: สุ่มเฉพาะชิ้นที่ยังไม่มีและซื้อได้ ทุกชิ้นโอกาสเท่ากัน · ราคา 150 หรือค่าเฉลี่ยของที่เหลือลบ 10% แล้วแต่อันไหนต่ำกว่า ----------
const kbPool=()=>KBI.filter(it=>it.p&&!it.soon&&kbFits(it)&&!kbOwns(it.id));
function kbBagPrice(){const pool=kbPool();if(!pool.length)return 0;return Math.min(KB.bag,Math.floor(pool.reduce((a,it)=>a+it.p,0)/pool.length*.9))}
function kbBag(){const pool=kbPool(),c=kbBagPrice();if(!pool.length||c>kbBal())return null;const it=pool[Math.floor(Math.random()*pool.length)];return kbSpend(it.id,c,'bag')?it:null}
// ---------- ความหิว 0 (อิ่ม) – 100 (หิวมาก) เพิ่มชั่วโมงละ 4 · ไม่ทำให้ความสนิทลด · หิวน้อยกว่า 10 = อิ่มแล้วไม่กิน ----------
function phg(p){if(p.hg==null)return 50;return Math.max(0,Math.min(100,Math.round(p.hg+(Date.now()-(p.ht||Date.now()))/36e5*4)))}
const phgN=h=>h<10?'อิ่มแปล้':h<45?'อิ่มกำลังดี':h<75?'เริ่มหิวแล้ว':'หิวมาก';
const pfoodN=p=>FOOD.reduce((a,f)=>a+((p.food||{})[f.k]||0),0);
function fbuy(k){const p=M.pet,f=FOOD.find(x=>x.k===k);if(!f)return false;p.food=p.food||{};const n=p.food[k]||0;
 if(n>=FMAX||p.energy<f.e)return false;p.energy-=f.e;p.food[k]=n+1;saveM();toast(icx('rice',16)+' เก็บ'+f.n+'เข้าตู้กับข้าวแล้ว (มี '+(n+1)+')');return true}
function pfood(k){const p=M.pet,f=FOOD.find(x=>x.k===k);if(!f)return false;p.food=p.food||{};const h=phg(p);
 if(!(p.food[k]>0)){pcue('beg');toast(IC.rice+' '+pline(p,'hungry',false));return false}
 if(h<10){toast(IC.rice+' '+p.name+'อิ่มแล้ว ไว้มื้อหน้านะ');return false}
 p.food[k]--;p.hg=Math.max(0,h-f.h);p.ht=Date.now();pbond(f.b);pcue('eat',2600);toast(IC.rice+' '+f.n+' · สนิท +'+f.b+' · '+pline(p,'feed',false));saveM();render();return true}
