// โคบัง (小判) สกุลเงินซื้อของแต่งสัตว์เลี้ยงและห้อง · ได้จากผลการเรียนเท่านั้น ไม่ได้จากการกดตอบ · ห้ามผูกเงินจริง
// Energy ใช้ซื้ออาหาร (เพิ่มความสนิท ลดความหิว) · ต้นแบบ ก: เก็บยอดคงเหลือ M.kb + ของที่มี M.own + คีย์กันได้ซ้ำ M.kbk
const KB={mast:2,claim:5,all3:5,s7:30,s30:100,bag:150};
const KBI=[
 {id:'coat:orange',t:'coat',k:'orange',p:200},{id:'coat:silver',t:'coat',k:'silver',p:200},{id:'coat:white',t:'coat',k:'white',p:200},
 {id:'coat:black',t:'coat',k:'black',p:200},{id:'coat:tuxedo',t:'coat',k:'tuxedo',p:200},{id:'coat:korat',t:'coat',k:'korat',p:200},
 {id:'coat:siamese',t:'coat',k:'siamese',p:300,r:1},{id:'coat:calico',t:'coat',k:'calico',goal:250,r:1},
 {id:'acc:scarf',t:'acc',k:'scarf',n:'ผ้าพันคอ',p:120},{id:'acc:bow',t:'acc',k:'bow',n:'โบว์',p:120},
 {id:'room:daruma',t:'room',k:'daruma',n:'ตุ๊กตาดารุมะ',p:80},{id:'room:poster',t:'room',k:'poster',n:'โปสเตอร์ภูเขา',p:100},
 {id:'room:plant',t:'room',k:'plant',n:'ต้นไม้กระถางใหญ่',p:120},{id:'room:rug',t:'room',k:'rug',n:'พรมลายคลื่น',p:150}];
const KBT={coat:'ลายขน',acc:'เครื่องประดับ',room:'ของแต่งห้อง'};
const FOOD=[{k:'milk',n:'นมอุ่นๆ',e:15,b:4,h:20},{k:'onigiri',n:'ข้าวปั้นปลา',e:30,b:10,h:40},{k:'fish',n:'ปลาย่าง',e:45,b:16,h:60},{k:'sushi',n:'ซูชิมื้อพิเศษ',e:70,b:26,h:100}];
const kbName=it=>it.t==='coat'?(window.PixelCat&&PixelCat._t.COATS[it.k]?PixelCat._t.COATS[it.k].name:it.k):it.n;
const kbCat=()=>(M.pet.sp||0)===0&&!!window.PixelCat;
const kbFits=it=>it.t==='room'||kbCat();
// ---------- ที่เก็บ (ต้นแบบ ก) ----------
const kbBal=()=>M.kb||0;
const kbOwns=id=>id==='coat:cream'||!!(M.own&&M.own.includes(id))||(KBI.find(x=>x.id===id)||{}).goal<=pmast();
function kbAdd(key,n,why){M.kbk=M.kbk||{};if(M.kbk[key])return 0;M.kbk[key]=dstr(new Date());M.kb=kbBal()+n;saveM();toast(icx('koban',16)+' +'+n+' โคบัง · '+why);return n}
function kbSpend(id,n){if(kbBal()<n)return false;M.kb=kbBal()-n;M.own=[...(M.own||[]),id];saveM();return true}
// ---------- ได้โคบัง ----------
// จำได้แม่นเพิ่ม: จำจุดสูงสุดต่อระดับไว้ ลืมแล้วจำได้ใหม่ไม่ได้ซ้ำ · ครั้งแรกให้ย้อนหลังตามที่จำได้แม่นอยู่แล้ว
function kbMast(){if(!M.pet||!M.pet.name)return;const n=pmast(),lv=LEVELS[LV].n;M.kbm=M.kbm||{};const was=M.kbm[lv]||0;if(n<=was)return;M.kbm[lv]=n;kbAdd('mast:'+lv+':'+n,(n-was)*KB.mast,'จำได้แม่นเพิ่ม '+(n-was)+' ข้อ')}
function kbClaim(id){const d=M.pet.d;kbAdd('m:'+d.date+':'+id,KB.claim,'รับภารกิจ');if(PM.every(m=>d.cl[m.id]))kbAdd('m3:'+d.date,KB.all3,'ภารกิจครบ 3 อย่าง')}
function kbStreak(){const n=streak(),k=dstr(new Date());if(n===7)kbAdd('s7:'+k,KB.s7,'เรียนติดกัน 7 วัน');if(n===30)kbAdd('s30:'+k,KB.s30,'เรียนติดกัน 30 วัน')}
// ---------- ความหิว (0 อิ่ม – 100 หิวมาก) เพิ่มชั่วโมงละ 4 · ไม่ลดความสนิท แค่แมวขออาหาร ----------
function phg(p){if(p.hg==null)return 50;return Math.max(0,Math.min(100,Math.round(p.hg+(Date.now()-p.ht)/36e5*4)))}
const phgN=h=>h<15?'อิ่มแปล้':h<45?'อิ่มกำลังดี':h<75?'เริ่มหิวแล้ว':'หิวมาก';
function pfood(k){const p=M.pet,f=FOOD.find(x=>x.k===k)||FOOD[1],h=phg(p);
 if(h<10){toast(icx('rice',16)+' '+p.name+'อิ่มแล้ว ไว้มื้อหน้านะ');return false}
 if(p.energy<f.e){pcue('beg');toast(icx('rice',16)+' '+pline(p,'hungry',false));return false}
 p.energy-=f.e;p.hg=Math.max(0,h-f.h);p.ht=Date.now();pbond(f.b);pcue('eat',2600);toast(icx('rice',16)+' '+f.n+' · สนิท +'+f.b+' · '+pline(p,'feed',false));saveM();render();return true}
// ---------- ถุงโชคดี 福袋: สุ่มเฉพาะชิ้นที่ยังไม่มีและซื้อได้ ทุกชิ้นโอกาสเท่ากัน ----------
const kbPool=()=>KBI.filter(it=>it.p&&kbFits(it)&&!kbOwns(it.id));
function kbBag(){const pool=kbPool();if(!pool.length||kbBal()<KB.bag)return null;const it=pool[Math.floor(Math.random()*pool.length)];if(!kbSpend(it.id,KB.bag))return null;return it}
