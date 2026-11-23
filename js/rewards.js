// ภารกิจรายวัน · รับ Energy · ความสนิทและร่าง · เหรียญ · ถึงเป้ารายวัน · แยกจาก js/pet.js (ถอนวัชพืชข้อ 13)
const PM=[{id:'rev',n:'ทบทวนให้ถูก',e:20,go:'k',t:()=>M.goal},{id:'neu',n:'เจอคำ/คันจิใหม่',e:20,go:'w',t:()=>Math.max(3,Math.round(M.goal/2))},{id:'dlg',n:'อ่านบทสนทนาจบ 1 บท',e:30,go:'d',t:()=>1}];
// d.done = ภารกิจที่ทำครบแล้ว · d.cl = ภารกิจที่กด "รับ" Energy แล้ว (v71: ทำครบแล้วต้องกดรับเองที่หน้าแรก แมวดีใจตอนกด) · วันเก่าที่ไม่มี cl ได้ Energy ไปตอนทำครบแล้ว จึงนับว่ารับแล้ว
function pens(){const p=M.pet,k=dstr(new Date());if(!p.d||p.d.date!==k)p.d={date:k,rev:0,neu:0,dlg:0,done:{},cl:{},r:[]};else if(!p.d.cl)p.d.cl={...p.d.done}}
function ptrack(k){if(!M.pet||!M.pet.name)return;pens();const p=M.pet;p.d[k]++;PM.forEach(m=>{if(!p.d.done[m.id]&&p.d[m.id]>=m.t()){p.d.done[m.id]=1;toast(IC.ok+' '+m.n+' สำเร็จ · กด "รับ" ที่หน้าแรกได้ +'+m.e+' Energy')}});saveM();if(typeof navUpdate==='function')navUpdate()}
// กดรับ Energy ของภารกิจที่ทำครบ: ความสนิท +2 แมวดีใจ และข้อความเด้งบอกความรู้สึกของสัตว์เลี้ยง
const PFEEL=['ภูมิใจในตัวเธอนะ','มีแรงขึ้นเยอะเลย','ดีใจจนนั่งไม่ติด','รู้สึกอุ่นใจ','อารมณ์ดีขึ้นมาก'];
function pclaim(id){const p=M.pet,m=PM.find(x=>x.id===id);if(!p||!m)return;pens();if(!p.d.done[id]||p.d.cl[id])return;p.d.cl[id]=1;p.energy+=m.e;pbond(2);kbClaim(id);pcue('happy',1800);
 toast(icx('bolt',16)+' +'+m.e+' Energy · '+p.name+PFEEL[Math.floor(Math.random()*PFEEL.length)]);saveM();render()}
const punclaimed=()=>{const p=M.pet;if(!p||!p.name||!p.d||p.d.date!==dstr(new Date()))return 0;const cl=p.d.cl||p.d.done;return PM.filter(m=>p.d.done[m.id]&&!cl[m.id]).length};
function pdd(i){if(!M.pet||!M.pet.name)return;pens();if(!M.pet.d.r.includes(i)){M.pet.d.r.push(i);ptrack('dlg')}render()}
function pfeed(){feedSheet()}
function pmast(){let n=0;for(const k in DS)n+=Object.values(readJSON(DS[k].key,{})||{}).filter(v=>v&&v.b>=MASTERY).length;return n}
// เพิ่มความสนิท ถ้าข้ามไปร่าง 2/3 สัตว์เลี้ยงพูดข้อความเด้ง
function pbond(n){const p=M.pet,a=pstage(p.bond);p.bond+=n;const z=pstage(p.bond);if(z>a){pcue('happy',2400);toast(IC.paw+' '+pline(p,z===2?'lv2':'lv3',false))}}
// เหรียญ 🥉25 🥈100 🥇250 ตามจำนวนที่จำได้แม่นรวม (เรียกหลังตอบข้อ) ครั้งแรกที่เช็กจะจำระดับปัจจุบันไว้เฉยๆ ไม่เด้งย้อนหลัง
function pbadge(){const p=M.pet;if(!p||!p.name)return;kbMast();const n=pmast(),lv=n>=250?3:n>=100?2:n>=25?1:0;
 if(p.bd==null){p.bd=lv;saveM();return}if(lv>p.bd){p.bd=lv;saveM();pcue('happy',2400);toast(IC.medal+' '+pline(p,['','b25','b100','b250'][lv],false))}}
// ถึงเป้ารายวัน: ถ้า streak ครบ 3/7/30 วันใช้ประโยค streak ไม่งั้นใช้ประโยคถึงเป้า
function pgoal(){const p=M.pet;if(!p||!p.name){toast(IC.star+' ถึงเป้าวันนี้แล้ว!');return}kbStreak();pcue('happy',2400);toast(IC.star+' '+pline(p,{3:'s3',7:'s7',30:'s30'}[streak()]||'goal',false))}
