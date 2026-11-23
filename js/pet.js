// สัตว์เลี้ยง: ตั้งค่าครั้งแรก (onboarding), ภารกิจรายวัน, ความสนิท, บทพูด
const SPC=[['🐱','แมว'],['🐰','กระต่าย'],['🐶','น้องหมา']];
const OBQ=['ยินดีที่ได้เจอกันนะ! ก่อนเริ่มเรียนด้วยกัน อยากได้เพื่อนตัวไหนไปเป็นเพื่อนเรียนดีนะ','ดีใจจัง! แล้วเธออยากเรียกเราว่าอะไรดีนะ?','ชื่อน่ารักจัง! แล้วเธอล่ะ ชื่ออะไรเหรอ? ใส่ชื่อเล่นก็ได้นะ','ว่าแต่ตอนนี้เธอเรียนญี่ปุ่นมาถึงไหนแล้วเหรอ?','แล้วเรียนไปเพื่ออะไรเหรอ? จะได้คอยเชียร์ถูกทาง','สุดท้ายแล้ว! วันละกี่ข้อกำลังพอดี? เอาแบบสบายๆ ไม่ต้องหักโหมนะ นับเฉพาะข้อที่ตอบถูก'];
const OBO=[SPC.map(s=>s[0]+' '+s[1]),null,null,['เพิ่งเริ่มเรียนภาษาญี่ปุ่น','N5','N4','N3'],['เพื่อไปสอบวัดระดับ JLPT','ไปอาศัยอยู่ไม่ก็ไปทำงานที่ญี่ปุ่นน่ะ','เรียนเพื่อความบันเทิง อย่างดูหนัง เล่นเกม อนิเมะทำนองนั้นน่ะ'],['5 ข้อ','10 ข้อ','15 ข้อ']];
let ob=0,obl=[],tp={};
// ขั้นตั้งค่า: 0 ชนิด · 1 ชื่อสัตว์เลี้ยง · 2 ชื่อเจ้าของ (ข้ามได้ เก็บใน M.me.name · v77) · 3 ระดับ · 4 เหตุผล · 5 จำนวนข้อต่อวัน
function obn(v){obl.push([OBQ[ob],v]);if(ob===0)tp.sp=Math.max(0,SPC.findIndex(s=>v.startsWith(s[0])));if(ob===1)tp.name=v;if(ob===2)tp.owner=v===OBSKIP?'':v;if(ob===3)tp.lv=v;if(ob===4)tp.goal=v;
 if(ob===5){M.goal=goalOk(parseInt(v))||M.goal;const{owner,...pt}=tp;M.pet={...pt,energy:0,bond:0,d:null,trait:Math.floor(Math.random()*TR.length),rv:dstr(new Date())};if(owner||!(M.me&&M.me.name))M.me={...(M.me||{}),name:owner||''};saveM();obl=[];ob=0;tab='home';return render()}ob++;render()}
const OBSKIP='ขอข้ามไปก่อนนะ';
function obt(){const v=document.getElementById('nm').value.replace(/[<>&"']/g,'').trim();if(v)obn(v)}
function obHtml(){let h='<h1>ยินดีต้อนรับ</h1><div class="st">ตั้งค่าครั้งแรก ใช้เวลาไม่ถึงนาที</div>';
 obl.forEach(([q,a])=>{h+=`<div class="pzb">${q}</div><div class="pzb me">${a}</div>`});
 h+=`<div class="pzb">${SPC[tp.sp||0][0]} ${OBQ[ob]}</div>`;
 h+=ob===1||ob===2?`<div class="row"><input id="nm" data-testid="onboard-name" maxlength="${ob===1?12:20}" placeholder="${ob===1?'ชื่อเพื่อน':'ชื่อของเธอ'}" value="${ob===2&&M.me&&M.me.name?M.me.name:''}" style="flex:1;padding:11px;border-radius:10px;border:1px solid var(--bd);background:var(--card);color:var(--fg);font-size:16px"><button style="padding:11px 16px;border:0;border-radius:12px;background:var(--ac);color:#fff;font-size:15px" onclick="obt()">ต่อไป</button></div>${ob===2?`<button class="lk" style="margin-top:0" onclick="obn(OBSKIP)">ข้ามไปก่อน</button>`:''}`:`<div class="ch">${OBO[ob].map(o=>`<button onclick="obn('${o}')">${o}</button>`).join('')}</div>`;
if(ob===0)h+=cloudObLink()+'<div class="st" style="margin-top:14px"><a href="about.html" target="_blank" rel="noopener" style="color:var(--ac)">ดูแนะนำแอป</a></div>';
 return h}
const PM=[{id:'rev',n:'ทบทวนให้ถูก',e:20,go:'k',t:()=>M.goal},{id:'neu',n:'เจอคำ/คันจิใหม่',e:20,go:'w',t:()=>Math.max(3,Math.round(M.goal/2))},{id:'dlg',n:'อ่านบทสนทนาจบ 1 บท',e:30,go:'d',t:()=>1}];
// d.done = ภารกิจที่ทำครบแล้ว · d.cl = ภารกิจที่กด "รับ" Energy แล้ว (v71: ทำครบแล้วต้องกดรับเองที่หน้าแรก แมวดีใจตอนกด) · วันเก่าที่ไม่มี cl ได้ Energy ไปตอนทำครบแล้ว จึงนับว่ารับแล้ว
function pens(){const p=M.pet,k=dstr(new Date());if(!p.d||p.d.date!==k)p.d={date:k,rev:0,neu:0,dlg:0,done:{},cl:{},r:[]};else if(!p.d.cl)p.d.cl={...p.d.done}}
function ptrack(k){if(!M.pet||!M.pet.name)return;pens();const p=M.pet;p.d[k]++;PM.forEach(m=>{if(!p.d.done[m.id]&&p.d[m.id]>=m.t()){p.d.done[m.id]=1;toast(IC.ok+' '+m.n+' สำเร็จ · กด "รับ" ที่หน้าแรกได้ +'+m.e+' Energy')}});saveM();if(typeof navUpdate==='function')navUpdate()}
// กดรับ Energy ของภารกิจที่ทำครบ: ความสนิท +2 แมวดีใจ และข้อความเด้งบอกความรู้สึกของสัตว์เลี้ยง
const PFEEL=['ภูมิใจในตัวเธอนะ','มีแรงขึ้นเยอะเลย','ดีใจจนนั่งไม่ติด','รู้สึกอุ่นใจ','อารมณ์ดีขึ้นมาก'];
function pclaim(id){const p=M.pet,m=PM.find(x=>x.id===id);if(!p||!m)return;pens();if(!p.d.done[id]||p.d.cl[id])return;p.d.cl[id]=1;p.energy+=m.e;pbond(2);pcue('happy',1800);
 toast(icx('bolt',16)+' +'+m.e+' Energy · '+p.name+PFEEL[Math.floor(Math.random()*PFEEL.length)]);saveM();render()}
const punclaimed=()=>{const p=M.pet;if(!p||!p.name||!p.d||p.d.date!==dstr(new Date()))return 0;const cl=p.d.cl||p.d.done;return PM.filter(m=>p.d.done[m.id]&&!cl[m.id]).length};
function pdd(i){if(!M.pet||!M.pet.name)return;pens();if(!M.pet.d.r.includes(i)){M.pet.d.r.push(i);ptrack('dlg')}render()}
function pfeed(){const p=M.pet;if(p.energy<30){pcue('beg');toast(IC.rice+' '+pline(p,'hungry',false))}else{p.energy-=30;pbond(10);pcue('eat',2600);toast(IC.rice+' '+pline(p,'feed',false))}saveM();render()}
function pgo(x){tab='learn';nv(x)}
function pmast(){let n=0;for(const k in DS)n+=Object.values(readJSON(DS[k].key,{})||{}).filter(v=>v&&v.b>=MASTERY).length;return n}
function ptr(p){if(p.trait==null||!TR[p.trait]){p.trait=Math.floor(Math.random()*TR.length);p.rv=dstr(new Date());saveM()}return TR[p.trait]}
// เลือกประโยคของสัตว์เลี้ยงตามช่วง/เหตุการณ์ (key ดูใน js/data/pet-lines.js)
// stable=true: เลือกให้คงที่ภายใน 1 ชั่วโมง (ใช้กับกล่องคำพูดที่วาดซ้ำบ่อย) / false: สุ่มทุกครั้ง (ใช้กับข้อความเด้งตอนเกิดเหตุการณ์)
// สุ่มแบบไม่ซ้ำ N ประโยคล่าสุดของช่องเดียวกัน (N = ครึ่งหนึ่งของคลัง ไม่เกิน 5 · รายงานบทพูด: ห้ามซ้ำ N ครั้งล่าสุด)
// ช่องตัวแปร: {n} = จำนวนข้อที่ตอบถูกวันนี้ · {kanji} = คันจิที่ตอบถูกล่าสุดวันนี้ (หน้าทำข้อส่งตัวที่เพิ่งตอบผิดมาแทน)
//  ประโยคที่มีช่องตัวแปรแต่ยังไม่มีค่า ({n} = 0 หรือยังไม่มีคันจิ) จะไม่ถูกเลือก
const plLast={};
const pvars=p=>({n:(p.d&&p.d.rev)||0,kanji:(p.d&&p.d.lk)||''});
const pfill=(l,v)=>l.replace(/\{n\}/g,v.n).replace(/\{kanji\}/g,v.kanji);
function pline(p,key,stable=true,vo){const V={...pvars(p),...vo},v=(ptr(p).s[key]||[]).filter(l=>(!l.includes('{n}')||V.n>0)&&(!l.includes('{kanji}')||V.kanji));if(!v.length)return'';let i;
 if(stable){const d=new Date(),h=dstr(d)+d.getHours()+key+p.trait;let x=0;for(const c of h)x=(x*31+c.charCodeAt(0))>>>0;i=x%v.length}
 else{const H=plLast[key]||(plLast[key]=[]),N=Math.min(5,Math.floor(v.length/2)),ok=v.map((l,j)=>j).filter(j=>!H.slice(-N).includes(v[j]));i=ok.length?ok[Math.floor(Math.random()*ok.length)]:Math.floor(Math.random()*v.length);H.push(v[i]);if(H.length>8)H.shift()}
 return pfill(v[i],V)}
// โหมดปลอบหลังตอบผิด (รายงานบทพูด: หลังตอบผิด ทุกนิสัยสลับเป็นโหมดปลอบ รวมปากแข็งและขี้เล่น) ขึ้นใต้ข้อที่เพิ่งตอบผิด
// ไม่ขึ้นทุกข้อ: ผิดครั้งแรกตั้งแต่เปิดแอป, ผิดติดกันตั้งแต่ 2 ข้อ หรือสุ่มครึ่งหนึ่ง · ตอบถูกแล้วนับใหม่ · k = ข้อที่เพิ่งตอบ (ใส่ใน {kanji})
let pwr=0,pwn=0;
function pcomfort(k,ok){const p=M.pet;if(!p||!p.name)return'';if(ok){pwr=0;return''}pwr++;pwn++;
 if(!(pwn===1||pwr>=2||Math.random()<.5))return'';return pline(p,'wrong',false,{kanji:k||''})}
const pcmHtml=t=>t?`<div class="pcm" role="status">${icx('paw',18)}<span><b>${M.pet.name}</b> ${t}</span></div>`:'';
const pstage=b=>b<40?1:b<120?2:3;
// เพิ่มความสนิท ถ้าข้ามไปร่าง 2/3 สัตว์เลี้ยงพูดข้อความเด้ง
function pbond(n){const p=M.pet,a=pstage(p.bond);p.bond+=n;const z=pstage(p.bond);if(z>a){pcue('happy',2400);toast(IC.paw+' '+pline(p,z===2?'lv2':'lv3',false))}}
// เหรียญ 🥉25 🥈100 🥇250 ตามจำนวนที่จำได้แม่นรวม (เรียกหลังตอบข้อ) ครั้งแรกที่เช็กจะจำระดับปัจจุบันไว้เฉยๆ ไม่เด้งย้อนหลัง
function pbadge(){const p=M.pet;if(!p||!p.name)return;const n=pmast(),lv=n>=250?3:n>=100?2:n>=25?1:0;
 if(p.bd==null){p.bd=lv;saveM();return}if(lv>p.bd){p.bd=lv;saveM();pcue('happy',2400);toast(IC.medal+' '+pline(p,['','b25','b100','b250'][lv],false))}}
// ถึงเป้ารายวัน: ถ้า streak ครบ 3/7/30 วันใช้ประโยค streak ไม่งั้นใช้ประโยคถึงเป้า
function pgoal(){const p=M.pet;if(!p||!p.name){toast(IC.star+' ถึงเป้าวันนี้แล้ว!');return}pcue('happy',2400);toast(IC.star+' '+pline(p,{3:'s3',7:'s7',30:'s30'}[streak()]||'goal',false))}
let psayG=false; // ประโยคล่าสุดเป็นแบบทั่วไปตามช่วงเวลา (ไม่ใช่เหตุการณ์) → ใช้ประโยคประจำสถานที่แทนได้ (js/place.js)
function psay(p,dn){const k=dstr(new Date()),hr=new Date().getHours();ptr(p);psayG=false;
 if(p.last!==k){if(p.lastTs&&(Date.now()-p.lastTs)/864e5>=3)p.back=k;p.last=k}
 p.lastTs=Date.now();saveM();
 if(dn>=3)return pline(p,'done');if(dn===0){if(p.rv===k)return pline(p,'first');if(p.back===k)return pline(p,'back')}
 if(dn>0)return pline(p,'partial');
 return pgen(p,hr)}
// ประโยคทั่วไป (ไม่มีเหตุการณ์): ตามช่วงเวลา · ชั่วโมง 05 09 13 17 21 ใช้ประโยคตามฤดูแบบญี่ปุ่นแทน (v116 · ROADMAP เฟส 3) ไม่ชนกับประโยคประจำสถานที่ที่ใช้ชั่วโมงคู่ (plSay)
const pseason=()=>window.PixelCat&&PixelCat.season?PixelCat.season():['spring','summer','autumn','winter'][((new Date().getMonth()+10)%12)/3|0];
function pgen(p,hr){if(hr>=5&&hr%4===1){const l=pline(p,pseason());if(l){psayG=false;return l}}
 psayG=true;return pline(p,hr<5?'late':hr<11?'morning':hr<15?'noon':hr<21?'evening':'night')}
function petHtml(cta=''){pens();if(pAway==null)pAway=M.pet.lastTs?Date.now()-M.pet.lastTs:0;const p=M.pet,st=pstage(p.bond),dn=Object.keys(p.d.done).length,sp=SPC[p.sp||0],md=dn>=3?'ดีใจมาก':dn?'อารมณ์ดี':'ง่วงๆ รอเรียนด้วยกันอยู่นะ',say=psay(p,dn),g=M.goal,tot=pmast(),bd=tot>=250?icx('medal',18,'m3'):tot>=100?icx('medal',18,'m2'):tot>=25?icx('medal',18,'m1'):'';
 const wk=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return `<div class="${i==6?'on':''}">${['อา','จ','อ','พ','พฤ','ศ','ส'][d.getDay()]}<br><b>${d.getDate()}</b><br>${(M.days[dstr(d)]||0)>=g?icx('flame',14,'hl-i'):'·'}</div>`}).join('');
 plCheck();
 let h=`<div class="card pz" style="text-align:center">${placeHero(plSay(say,psayG),sp[0],28+st*14,(p.sp||0)===0&&!!window.PixelCat)}<div class="pin"><div class="pnm"><b>${p.name}</b><span class="pch">ร่าง ${st}</span><span class="pch">${icx(ptr(p).i,14)} ${ptr(p).n}</span><button class="pch ppf" onclick="goProf()">${icx('paw',14)} โปรไฟล์</button></div><div class="st">${md}</div>
<div class="pbd" data-testid="pet-bond"><span>ความสนิท</span><span>${p.bond} / 120</span></div><div class="bar pbar"><i style="width:${Math.min(100,p.bond/1.2)}%;background:var(--ac)"></i></div>
<div class="pft"><div class="pen"><div class="pel">${icx('bolt',16,'hl-i')} Energy <b>${p.energy}</b><span>${p.energy>=30?'ให้อาหารได้ '+Math.floor(p.energy/30)+' มื้อ':'อีก '+(30-p.energy)+' ถึงมื้อถัดไป'}</span></div><div class="bar ebar" data-testid="pet-energy" role="progressbar" aria-label="Energy ถึงมื้อถัดไป" aria-valuemin="0" aria-valuemax="30" aria-valuenow="${Math.min(30,p.energy)}"><i style="width:${Math.min(100,p.energy/30*100)}%"></i></div></div><button class="pfd${p.energy<30?' lo':''}" onclick="pfeed()">${icx('rice',18)} ให้อาหาร <span>30 Energy · สนิท +10</span></button></div></div></div>${cta}<div class="pzw">${wk}</div><h2>ภารกิจวันนี้</h2>`;
 // การ์ดภารกิจ: ไอคอน หลอดความคืบหน้า และปุ่ม "รับ" เมื่อทำครบ (v71 · แนวจากตัวอย่าง UI ที่เจ้าของส่งมา) · ยังไม่ครบ แตะการ์ด = ไปทำ
 const PMI={rev:'check',neu:'sprout',dlg:'book'},cl=p.d.cl||{};
 PM.forEach(m=>{const t=m.t(),c=Math.min(p.d[m.id],t),ok=p.d.done[m.id],got=ok&&cl[m.id];
  const end=got?`<span class="pzp pzg">${icx('ok',14)} รับแล้ว</span>`:ok?`<button class="pcl" data-testid="mission-claim-${m.id}" onclick="pclaim('${m.id}')">รับ +${m.e}</button>`:`<span class="pzp">+${m.e} Energy</span>`;
  h+=`<div class="pzm${ok&&!got?' cl':''}${got?' got':''}" data-testid="mission-${m.id}"${ok?'':` role="button" tabindex="0" onclick="pgo('${m.go}')" onkeydown="if(event.key==='Enter')pgo('${m.go}')"`}><span class="pmi">${icx(PMI[m.id],22)}</span><div class="pmb"><b>${m.n}</b><div class="bar"><i style="width:${t?c/t*100:0}%"></i></div><div class="st">${c} / ${t}${m.id==='rev'?' (นับเฉพาะข้อที่ตอบถูก)':''}</div></div>${end}</div>`});
 return h+`<div class="st" style="margin:8px 0 14px">กำลังเรียนระดับ ${LEVELS[LV].n} · จำได้แม่นรวม ${tot} ข้อ ${bd} (${icx('medal',14,'m1')}25 ${icx('medal',14,'m2')}100 ${icx('medal',14,'m3')}250)</div>`}
// แมวพิกเซล (js/pixelcat.js): สัตว์เลี้ยงตัวแรกที่มีภาพจริง กระต่าย/หมายังเป็นอิโมจิ
// ท่าอารมณ์ตามเหตุการณ์ ถ้าไม่ได้อยู่หน้าหลัก แมวจะเล่นท่านั้นให้ดูตอนกลับมา
function pcue(k,ms){if(window.PixelCat&&M.pet&&(M.pet.sp||0)===0)PixelCat.cue(k,ms)}
// เวลาที่ผู้ใช้หายไป ไว้ให้แมวทักทาย (คำนวณครั้งเดียวตอนเปิดแอป ก่อน psay() อัปเดต lastTs) · กลับมาจากพื้นหลัง (iPad พับแอปไว้) นับจากตอนซ่อน
let pAway=null,pHid=0;
document.addEventListener('visibilitychange',()=>{if(document.hidden){pHid=Date.now();return}if(!pHid)return;const g=Date.now()-pHid;pHid=0;if(window.PixelCat&&M.pet&&(M.pet.sp||0)===0)PixelCat.greet(g)});
// คำแนะนำครั้งเดียว (เก็บใน M.pet.tip): ลูบหัวครบ 3 ครั้งแล้วบอกว่ากดค้างที่หัวได้ (แมวกะพริบตาช้าตอบ)
function ptip(k){const p=M.pet;if(!p||(p.tip&&p.tip[k]))return;p.tip={...(p.tip||{}),[k]:1};saveM();if(k==='blink')toast(IC.paw+' ลองกดค้างที่หัว'+p.name+'ดูสิ แมวจะกะพริบตาช้าๆ ตอบ แปลว่าไว้ใจเธอนะ')}
// นาฬิกาชีวิตประจำตัว (v119 · รายงานพฤติกรรมข้อ 13 นิสัยประจำตัว): -1 ตื่นเช้า · 0 ตามปกติ · 1 นอนดึก คิดจากวันเกิด (rv) กับนิสัย จึงคงที่ ไม่ต้องเก็บข้อมูลเพิ่ม
// แมวพิกเซลเลื่อนช่วงคึก/ง่วงของวันไป 2 ชม. (ตื่นเช้า: คึกตอนตี 3–7 ง่วงตั้งแต่ 1 ทุ่ม · นอนดึก: คึกถึง 5 ทุ่ม ง่วงถึง 7 โมง) · โอกาส (ตื่นเช้า, นอนดึก) ตามนิสัย ค่าของเกม
const PCT={0:[.4,.15],4:[.1,.45],8:[.15,.4],9:[.35,.15]},PCTN=['ตื่นเช้า','ตามเวลาปกติ','นอนดึก'],PCTS=['คึกตอนเช้ามืด ง่วงเร็วตั้งแต่หัวค่ำ','คึกตอนเช้ากับตอนเย็น งีบตอนเที่ยง','ตื่นสาย คึกยาวถึงสี่ห้าทุ่ม'];
function pchrono(p){const[e,l]=PCT[p.trait]||[.25,.25];let x=7;for(const c of String(p.rv||'')+'|'+p.trait)x=(x*31+c.charCodeAt(0))>>>0;const r=(x%1000)/1000;return r<e?-1:r<e+l?1:0}
function petMount(){const c=document.getElementById('petcv');if(!c||!window.PixelCat)return;ptr(M.pet);const ct=pchrono(M.pet),h=(new Date().getHours()-2*ct+24)%24;PixelCat.mount(c,{coat:M.pet.coat,acc:M.pet.acc,label:M.pet.name,place:plState().at,fam:plVisit(),sleepy:h>=22||h<5,chrono:ct,stage:pstage(M.pet.bond||0),trait:ptr(M.pet)&&M.pet.trait,onTip:ptip,line:k=>pline(M.pet,k,false),bubble:c.parentElement.querySelector('.scb')});if(pAway){PixelCat.greet(pAway);pAway=0}}
