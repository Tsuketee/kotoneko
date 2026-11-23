// เลือกข้อ ตอบการ์ด/ควิซ บันทึกผล · แยกจาก js/learn.js (ถอนวัชพืชข้อ 14)
const pool=()=>K.filter(x=>(ds!=='a'||ks==='all'||x.sc===ks)&&(cat==='ทั้งหมด'||(cat==='ผิดบ่อย'?(S[x.k]&&S[x.k].w>=2):x.c===cat)));
const sh=a=>a.map(v=>[Math.random(),v]).sort((p,q)=>p[0]-q[0]).map(v=>v[1]);
function pick1(){const p=pool(),n=Date.now();
 const due=p.filter(x=>S[x.k]&&S[x.k].d<=n).sort((a,b)=>S[a.k].d-S[b.k].d);
 // อยู่ที่สถานที่ไหน (js/place.js) เอาคำในหมวดของที่นั้นขึ้นก่อน ทั้งข้อที่ถึงเวลาทบทวนและข้อใหม่
 const pc=typeof placeCats==='function'?placeCats():null,pf=a=>pc&&a.find(x=>pc.includes(x.c));
 if(due.length)return pf(due)||due[0];
 const nw=p.filter(x=>!S[x.k]);if(nw.length){const pn=pc&&nw.filter(x=>pc.includes(x.c)),L=pn&&pn.length?pn:nw;return mode==='quiz'?L[Math.floor(Math.random()*L.length)]:L[0]}
 return prac?sh(p)[0]:null}
function rec(ok){const nw=!S[cur.k];S[cur.k]=srsNext(S[cur.k],ok);save();tick();pbadge();if(ok){ptrack('rev');if(ds==='k'&&M.pet&&M.pet.d){M.pet.d.lk=cur.k;saveM()}}if(nw)ptrack('neu')} // lk = คันจิที่ตอบถูกล่าสุดวันนี้ ({kanji} ในบทพูด)
function grade(ok){rec(ok);go()}
let cmf=''; // ประโยคปลอบของข้อที่เพิ่งตอบผิด (เลือกครั้งเดียวตอนตอบ ไม่เปลี่ยนตอนวาดหน้าซ้ำ)
function pick(i){if(ans!==null)return;ans=i;rec(ch[i].ok);cmf=pcomfort(cur.k,ch[i].ok);render();if(ch[i].ok){const c0=cur;setTimeout(()=>{if(cur===c0&&ans!==null)go()},700)}}
function mkch(){const f=x=>(ds==='a'||qt==='read')?rd(x):x.m;const c=f(cur);
 const o=sh(K.filter(x=>x.k!==cur.k&&f(x)!==c)).filter((x,i,a)=>a.findIndex(y=>f(y)===f(x))===i).slice(0,3);
 ch=sh([{t:c,ok:true},...o.map(x=>({t:f(x),ok:false}))])}
