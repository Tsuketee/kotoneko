// สัตว์เลี้ยง: ตั้งค่าครั้งแรก (onboarding), ภารกิจรายวัน, ความสนิท, บทพูด
const SPC=[['🐱','แมว'],['🐰','กระต่าย'],['🐶','น้องหมา']];
const OBQ=['ยินดีที่ได้เจอกันนะ! ก่อนเริ่มเรียนด้วยกัน อยากได้เพื่อนตัวไหนไปเป็นเพื่อนเรียนดีนะ','ดีใจจัง! แล้วเธออยากเรียกเราว่าอะไรดีนะ?','ว่าแต่ตอนนี้เธอเรียนญี่ปุ่นมาถึงไหนแล้วเหรอ?','แล้วเรียนไปเพื่ออะไรเหรอ? จะได้คอยเชียร์ถูกทาง','สุดท้ายแล้ว! วันละกี่ข้อกำลังพอดี? เอาแบบสบายๆ ไม่ต้องหักโหมนะ นับเฉพาะข้อที่ตอบถูก'];
const OBO=[SPC.map(s=>s[0]+' '+s[1]),null,['เพิ่งเริ่มเรียนภาษาญี่ปุ่น','N5','N4','N3'],['เพื่อไปสอบวัดระดับ JLPT','ไปอาศัยอยู่ไม่ก็ไปทำงานที่ญี่ปุ่นน่ะ','เรียนเพื่อความบันเทิง อย่างดูหนัง เล่นเกม อนิเมะทำนองนั้นน่ะ'],['5 ข้อ','10 ข้อ','15 ข้อ']];
let ob=0,obl=[],tp={};
function obn(v){obl.push([OBQ[ob],v]);if(ob===0)tp.sp=Math.max(0,SPC.findIndex(s=>v.startsWith(s[0])));if(ob===1)tp.name=v;if(ob===2)tp.lv=v;if(ob===3)tp.goal=v;
 if(ob===4){tp.min=parseInt(v);M.pet={...tp,energy:0,bond:0,d:null,trait:Math.floor(Math.random()*TR.length),rv:dstr(new Date())};saveM();obl=[];ob=0;tab='home';return render()}ob++;render()}
function obt(){const v=document.getElementById('nm').value.replace(/[<>&"']/g,'').trim();if(v)obn(v)}
function obHtml(){let h='<h1>ยินดีต้อนรับ</h1><div class="st">ตั้งค่าครั้งแรก ใช้เวลาไม่ถึงนาที</div>';
 obl.forEach(([q,a])=>{h+=`<div class="pzb">${q}</div><div class="pzb me">${a}</div>`});
 h+=`<div class="pzb">${SPC[tp.sp||0][0]} ${OBQ[ob]}</div>`;
 h+=ob===1?`<div class="row"><input id="nm" maxlength="12" placeholder="ชื่อเพื่อน" style="flex:1;padding:11px;border-radius:10px;border:1px solid var(--bd);background:var(--card);color:var(--fg);font-size:16px"><button style="padding:11px 16px;border:0;border-radius:12px;background:var(--ac);color:#fff;font-size:15px" onclick="obt()">ต่อไป</button></div>`:`<div class="ch">${OBO[ob].map(o=>`<button onclick="obn('${o}')">${o}</button>`).join('')}</div>`;
 return h}
const PM=[{id:'rev',n:'ทบทวนให้ถูก',e:20,go:'k',t:()=>M.pet.min},{id:'neu',n:'เจอคำ/คันจิใหม่',e:20,go:'w',t:()=>Math.max(3,Math.round(M.pet.min/2))},{id:'dlg',n:'อ่านบทสนทนาจบ 1 บท',e:30,go:'d',t:()=>1}];
function pens(){const p=M.pet,k=dstr(new Date());if(!p.d||p.d.date!==k)p.d={date:k,rev:0,neu:0,dlg:0,done:{},r:[]}}
function ptrack(k){if(!M.pet||!M.pet.name)return;pens();const p=M.pet;p.d[k]++;PM.forEach(m=>{if(!p.d.done[m.id]&&p.d[m.id]>=m.t()){p.d.done[m.id]=1;p.energy+=m.e;p.bond+=2;toast('✅ '+m.n+' สำเร็จ +'+m.e+' Energy')}});saveM()}
function pdd(i){if(!M.pet||!M.pet.name)return;pens();if(!M.pet.d.r.includes(i)){M.pet.d.r.push(i);ptrack('dlg')}render()}
function pfeed(){const p=M.pet;if(p.energy<30){toast('Energy ไม่พอ ไปเรียนเก็บเพิ่มก่อนนะ')}else{p.energy-=30;p.bond+=10;toast('🍙 '+ptr(p)[7])}saveM();render()}
function pgo(x){tab='learn';nv(x)}
function pmast(){let n=0;for(const k in DS){try{n+=Object.values(JSON.parse(localStorage.getItem(DS[k].key)||'{}')).filter(v=>v.b>=MASTERY).length}catch(e){}}return n}
function ptr(p){if(p.trait==null||!TR[p.trait]){p.trait=Math.floor(Math.random()*TR.length);p.rv=dstr(new Date());saveM()}return TR[p.trait]}
function psay(p,dn){const t=ptr(p),k=dstr(new Date()),hr=new Date().getHours();
 if(p.last!==k){if(p.lastTs&&(Date.now()-p.lastTs)/864e5>=3)p.back=k;p.last=k}
 p.lastTs=Date.now();saveM();
 if(dn>=3)return t[8];if(dn===0){if(p.rv===k)return t[1];if(p.back===k)return t[6]}
 return hr>=5&&hr<11?t[2]:hr>=11&&hr<15?t[3]:hr>=15&&hr<21?t[4]:t[5]}
function petHtml(){pens();const p=M.pet,st=p.bond<40?1:p.bond<120?2:3,dn=Object.keys(p.d.done).length,sp=SPC[p.sp||0],md=dn>=3?'ดีใจมาก':dn?'อารมณ์ดี':'ง่วงๆ รอเรียนด้วยกันอยู่นะ',say=psay(p,dn),g=M.goal,tot=pmast(),bd=tot>=250?'🥇':tot>=100?'🥈':tot>=25?'🥉':'';
 const wk=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return `<div class="${i==6?'on':''}">${['อา','จ','อ','พ','พฤ','ศ','ส'][d.getDay()]}<br><b>${d.getDate()}</b><br>${(M.days[dstr(d)]||0)>=g?'🔥':'·'}</div>`}).join('');
 let h=`<div class="card pz" style="text-align:center"><div class="pzb" style="margin:0 auto 10px">${say}</div><div class="pet" style="font-size:${40+st*24}px">${sp[0]}</div><div><b>${p.name}</b> · ร่าง ${st}</div><div class="st">${ptr(p)[0]}</div><div class="st">${md}</div><div class="bar"><i style="width:${Math.min(100,p.bond/1.2)}%;background:var(--ac)"></i></div><div class="st">ความสนิท ${p.bond} / 120 · ⚡ Energy ${p.energy}</div><button class="lk" onclick="pfeed()">🍙 ให้อาหาร (30 Energy → สนิท +10)</button></div><div class="pzw">${wk}</div><h2>ภารกิจวันนี้</h2>`;
 PM.forEach(m=>{const c=Math.min(p.d[m.id],m.t()),ok=p.d.done[m.id];h+=`<div class="pzm" onclick="pgo('${m.go}')"><div><b>${ok?'✅ ':''}${m.n}</b><div class="st">${c} / ${m.t()}${m.id==='rev'?' (นับเฉพาะข้อที่ตอบถูก)':''}</div></div><span class="pzp">+${m.e} Energy</span></div>`});
 return h+`<div class="st" style="margin:8px 0 14px">ระดับตอนนี้: ${p.lv} · จำได้แม่นรวม ${tot} ข้อ ${bd} (🥉25 🥈100 🥇250)</div>`}
