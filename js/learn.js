// การเรียน: หน้ารวมเส้นทางเรียน หน้าเรียน 4 โหมด เสียงอ่าน ตัวอย่าง/เคล็ดจำ · SRS อยู่ js/srs.js · ควิซ js/quiz.js · ผิดบ่อย js/mistakes.js · ตารางคานะ js/kanachart.js
// คำอ่าน: ออน ・ คุน โดยข้ามช่องที่เป็น '-' (เช่น 込 畑 ของ N3 เป็นคันจิที่ญี่ปุ่นคิดเอง จึงไม่มีอ่านแบบออน)
// คุนในข้อมูลแยกโอกุริงานะด้วย . (ひと.つ) แสดงบนจอเป็น ひと(つ) · แพ็กที่ยังใช้วงเล็บแสดงตามเดิม
const kunShow=u=>u&&u.replace(/\.([^・/]+)/g,'($1)');
const rds=x=>[x.o,kunShow(x.u)].filter(v=>v&&v!=='-');
const rd=x=>rds(x).join(' ・ ');
function go(){st=[];ci=0;cur=null;ch=null;ans=null;fl=false;render()}
function nv(i){if(i==='d'||i==='m'||i==='n5'||i==='g'){view=i}else{view='s';ds=i;K=DS[i].d;CATS=['ทั้งหมด',...new Set(K.map(x=>x.c))];cat='ทั้งหมด';S=load();mode=i==='a'?'chart':'card';wi=0;ci=0;st=[];prac=0;cur=null;ch=null;ans=null;fl=false}render()}
const EXT={o:['ออน','on'],k:['คุน','kun'],s:['พิเศษ','sp']};
function exHtml(c){if(ds!=='k'||!EX[c.k])return'';return `<div class="ex"><div class="exh">ตัวอย่างการใช้</div>${EX[c.k].map(e=>`<div class="er" data-t="${e[1]}" onclick="event.stopPropagation();speak(this.dataset.t)"><span class="et ${EXT[e[3]][1]}">${EXT[e[3]][0]}</span><span class="ew">${e[0]}</span><span class="ed"><b>${e[1]}</b> ${e[2]}</span></div>`).join('')}</div>`}
function speakFor(x){if(ds==='a')return x.k;if(ds==='k')return x.u&&x.u!=='-'?x.u.split('・')[0].replace(/\(.*?\)|\..*$/g,''):x.o.split('/')[0];return x.o}
function speak(t){if(!t)return;if(!('speechSynthesis' in window))return toast('เครื่องนี้ยังไม่รองรับเสียงอ่าน');try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='ja-JP';u.rate=.85;const v=speechSynthesis.getVoices().find(v=>/^ja/i.test(v.lang));if(v)u.voice=v;speechSynthesis.speak(u)}catch(e){console.warn('เล่นเสียงอ่านไม่ได้',e);toast('เล่นเสียงไม่ได้ค่ะ')}}
const spHtml=x=>`<button class="sp" data-t="${speakFor(x).replace(/"/g,'')}" onclick="event.stopPropagation();speak(this.dataset.t)">${IC.vol} ฟังเสียง</button>`;
const mnHtml=x=>ds==='a'&&MN[x.k]?`<div class="ex"><div class="exh">เคล็ดจำ</div><div class="mn">${MN[x.k]}</div></div>`:'';
function catOpts(){const o=c=>`<option value="${c}"${c===cat?' selected':''}>${c}</option>`;if(ds!=='a')return[...CATS,'ผิดบ่อย'].map(o).join('');const G={b:'พื้นฐาน',d:'เสียงขุ่น・กึ่งขุ่น',y:'เสียงควบ'};let s=o('ทั้งหมด');for(const g in G){const cs=[...new Set(K.filter(x=>x.g===g).map(x=>x.c))];s+=`<optgroup label="${G[g]}">${cs.map(o).join('')}</optgroup>`}return s+o('ผิดบ่อย')}
// หน้าเรียน 4 โหมด (จัดใหม่ v70 · เจ้าของขอ 2026-11-19): แถบโหมดเป็นตัวนำทางหลัก เต็มแถว ปุ่มสูง 44px มีไอคอน
// ตัวกรองเป็นแถวรองใต้แถบ แสดงเฉพาะที่ใช้ได้ในโหมดนั้น (ตารางไม่มีหมวดและไม่มี "ทั้งสองแบบ") · คำแนะนำหนึ่งบรรทัดต่อโหมด
const MODES=[['chart','ตาราง','grid','แตะตัวอักษรเพื่อฟังเสียง · สีบอกความแม่น'],['card','การ์ด','cards','นึกคำตอบในใจก่อน แล้วแตะการ์ดเพื่อเฉลย'],
 ['quiz','ควิซ','check','เลือกคำตอบ · ถูกแล้วไปข้อต่อไปเอง ผิดจะวนกลับมาอีก'],['write','เขียน','pen','เขียนตามเส้นจางด้วยนิ้วหรือ Apple Pencil · ปุ่มรูปตาซ่อนเส้นนำ']];
const seg=(lbl,opts,on,act)=>`<div class="seg" role="group" aria-label="${lbl}">${opts.map(([v,n])=>`<button class="${on===v?'on':''}" aria-pressed="${on===v}" onclick="${act(v)}">${n}</button>`).join('')}</div>`;
function modeBar(){const L=MODES.filter(m=>m[0]!=='chart'||ds==='a'),m=MODES.find(x=>x[0]===mode)||MODES[1];
 let h=`<div class="mtab" role="tablist" aria-label="โหมดการเรียน">${L.map(([k,n,i])=>`<button role="tab" data-testid="mode-${k}" aria-selected="${mode===k}" class="${mode===k?'on':''}" onclick="mode='${k}';go()">${icx(i,20)}<span>${n}</span></button>`).join('')}</div><div class="flt">`;
 if(mode!=='chart')h+=`<select aria-label="หมวด" onchange="cat=this.value;prac=0;wi=0;go()">${catOpts()}</select>`;
 if(ds==='a')h+=mode==='chart'?seg('ชุดตัวอักษร',[['h','ฮิระงะนะ'],['k','คะตะคะนะ']],ks==='k'?'k':'h',v=>`ks='${v}';go()`):seg('ชุดตัวอักษร',[['h','ฮิระงะนะ'],['k','คะตะคะนะ'],['all','ทั้งสองแบบ']],ks,v=>`ks='${v}';wi=0;go()`);
 if(mode==='quiz'&&ds!=='a')h+=seg('แบบคำถาม',[['read','ตอบคำอ่าน'],['mean','ตอบความหมาย']],qt,v=>`qt='${v}';go()`);
 return h+`</div><div class="mhint">${m[3]}</div>`}
function pathHtml(sts){const m=Object.fromEntries(sts),L=['k','w','v'],A=m.a||{lr:0,t:0,due:0},t5=L.reduce((a,k)=>a+m[k].t,0),l5=L.reduce((a,k)=>a+m[k].lr,0),d5=L.reduce((a,k)=>a+m[k].due,0),pa=A.t?A.lr/A.t:0,p5=t5?l5/t5:0;
 return `<div class="path"><div class="pc big1" data-testid="path-kana" onclick="openDs('a')"><div class="pn">1</div><div class="pb"><div class="pg">あ ア</div><b>${DS.a.n}</b>${pa>=.8?'<span class="bd b2">ผ่านแล้ว</span>':'<span class="bd b1">เริ่มที่นี่</span>'}<div class="st">ก่อนเริ่ม · เรียนทีละแถว 5 ตัว มีตารางและเสียงอ่าน</div><div class="st">พื้นฐาน ${A.lr}/${A.t} จำได้แม่น${A.due?' · ทบทวน '+A.due:''}</div><div class="bar"><i style="width:${pa*100}%"></i></div></div></div>
 ${['n5','n4','n3'].map(l=>l!==LV?lvCard(l):`<div class="pc" data-testid="path-${l}" onclick="openLv()"><div class="pn">2</div><div class="pb"><b>${LEVELS[LV].n}</b>${LV!=='n5'?'<span class="bd b1">กำลังเรียน</span>':''}${p5>=.8?'<span class="bd b2">ผ่านแล้ว</span>':pa>=.8?'<span class="bd b3">พร้อมแล้ว</span>':''}<div class="st">คำศัพท์ · คันจิ · บทสนทนา · ไวยากรณ์ · ซ้อมสอบ</div><div class="st">${l5}/${t5} จำได้แม่น${d5?' · ทบทวน '+d5:''}</div><div class="bar"><i style="width:${p5*100}%"></i></div></div><div class="pg2">${LEVELS[LV].g}</div></div>`).join('')}</div>`}
function openLv(){tab='learn';nv('n5');window.scrollTo(0,0)}
// หน้ารวมของแท็บเรียน (view='path'): ปุ่มเรียนต่อจากหมวดล่าสุด + เส้นทางเรียน (คานะ → ระดับที่เรียน → ระดับอื่น) · เดิมเส้นทางเรียนอยู่หน้าแรก ย้ายมา v73
function renderPath(){const sts=Object.keys(DS).map(k=>[k,dsStat(k)]),due=sts.reduce((a,x)=>a+x[1].due,0),ln={...DN,d:'บทสนทนา',g:'ไวยากรณ์'}[M.last]||DN.k;
 document.getElementById('app').innerHTML=`<h1>เรียน</h1><div class="st">กำลังเรียนระดับ ${LEVELS[LV].n}${due?' · ถึงเวลาทบทวน '+due+' ข้อ':''}</div><button class="big" style="margin-top:12px" onclick="resume()">${due>0?'ทบทวน '+due+' ข้อที่ถึงเวลา':'เรียนต่อ · '+ln} →</button><h2>เส้นทางเรียน</h2>${pathHtml(sts)}`}
function gsec(){const s=gstat();return `<div class="pc" data-testid="section-g" onclick="openDs('g')"><div class="pb"><b>ไวยากรณ์</b><div class="st">${s.lr}/${s.t} บทจำได้แม่น${s.due?' · ทบทวน '+s.due:''}</div><div class="bar"><i style="width:${s.t?s.lr/s.t*100:0}%"></i></div></div><div class="pg2">法</div></div>`}
function renderLv(){const m=Object.fromEntries(Object.keys(DS).map(k=>[k,dsStat(k)])),L=['k','w','v'],t=L.reduce((a,k)=>a+m[k].t,0),l=L.reduce((a,k)=>a+m[k].lr,0);
 const sec=(k,s,g)=>`<div class="pc" data-testid="section-${k}" onclick="openDs('${k}')"><div class="pb"><b>${k==='d'?'บทสนทนา':DS[k].n}</b><div class="st">${k==='d'?D.length+' บทสนทนา':m[k].lr+'/'+m[k].t+' จำได้แม่น'+(m[k].due?' · ทบทวน '+m[k].due:'')}</div>${k==='d'?'':`<div class="bar"><i style="width:${m[k].t?m[k].lr/m[k].t*100:0}%"></i></div>`}</div><div class="pg2">${g}</div></div>`,
 soon=(n,s,g)=>`<div class="pc lk0"><div class="pb"><b>${icx('lock',15)} ${n}</b><div class="st">${s}</div></div><div class="pg2">${g}</div></div>`;
 document.getElementById('app').innerHTML=NAV()+`<div class="st">จำได้แม่นรวม ${l}/${t} · เนื้อหาเขียนเอง</div><div class="bar"><i style="width:${t?l/t*100:0}%"></i></div><div class="path" style="margin-top:14px">${sec('k','','漢')}${sec('w','','語')}${sec('v','','文')}${sec('d','','話')}${gsec()}${soon('ซ้อมสอบ '+LEVELS[LV].n,'ปลดล็อกเมื่อเรียนครบทุกหมวด','試')}</div>`}
function dsStat(k){const s=readJSON(DS[k].key,{})||{};const n=Date.now();let seen=0,lr=0,due=0;const L=k==='a'?DS[k].d.filter(x=>x.g==='b'):DS[k].d;L.forEach(x=>{const r=s[x.k];if(r){seen++;if(r.b>=MASTERY)lr++;if(r.d<=n)due++}});return{seen,lr,due,t:L.length}}
function openDs(k){M.last=k;saveM();tab='learn';nv(k);window.scrollTo(0,0)}
function resume(){openDs(M.last&&(DS[M.last]||M.last==='d'||M.last==='g')?M.last:'k')}
function renderLearn(){
 const p=pool(),seen=p.filter(x=>S[x.k]).length,lr=p.filter(x=>S[x.k]&&S[x.k].b>=MASTERY).length;
 if(!cur)cur=pick1();
 if(cur&&mode==='quiz'&&!ch)mkch();
 let h=NAV()+`<div class="st" data-testid="learn-progress">เจอแล้ว ${seen}/${p.length} · จำได้แม่น ${lr}</div><div class="bar"><i style="width:${p.length?lr/p.length*100:0}%"></i></div>`;
 h+=modeBar();
 if(mode==='chart'&&ds==='a'){h+=chartHtml()}
 else if(mode==='write'&&p.length){const x=p[wi%p.length],cs=[...x.k].filter(c=>SV[c]),c0=cs.length?cs[ci%cs.length]:x.k[0];
  h+=`<div class="wi" data-testid="write-prompt"><div class="d" style="margin:0"><b>${rds(x)[0]}</b>${rds(x)[1]?' ・ '+rds(x)[1]:''}<br>${x.m}</div>${spHtml(x)}</div><div class="tb"><div class="seg"><button class="${tool==='pen'?'on':''}" data-testid="write-pen" onclick="tool='pen';render()">${IPEN}</button><button class="${tool==='er'?'on':''}" data-testid="write-eraser" onclick="tool='er';render()">${IER}</button></div>${tool==='er'?`<input type="range" min="6" max="40" value="${esz}" oninput="esz=+this.value">`:`<span style="flex:1"></span>`}<button class="ic" data-testid="write-guide" onclick="guide=guide?0:1;render()">${guide?IC.eye:IC.eyeoff}</button></div><div class="card nw" style="padding:10px;min-height:0"><div class="sheet" data-testid="write-sheet">${CELLS.map((sp,i)=>`<div class="cell">${cellSvg(c0,sp)}<canvas data-testid="write-canvas" data-c="${i}" width="200" height="200"></canvas></div>`).join('')}</div>${cs.length>1?`<div class="btns" style="margin-top:10px">${cs.map((c,i)=>`<button style="background:${c===c0?'var(--ac)':'var(--mut)'};font-size:22px;padding:8px" onclick="ci=${i};st=[];render()">${c}</button>`).join('')}</div>`:''}</div><button class="big" data-testid="write-next" onclick="tick();wi++;ci=0;st=[];render()">ตัวต่อไป →</button>`}
 else if(!cur){h+=`<div class="card"><div class="k">${ic(P.star,72)}</div><div class="d">ทบทวนครบตามรอบแล้ว<br>กลับมาใหม่ทีหลังได้เลย</div><button class="lk" onclick="prac=1;go()">ฝึกสุ่มต่ออีกนิด</button></div>`}
 else if(mode==='card'){
  h+=`<div class="card" data-testid="study-card" ${fl?'':'onclick="fl=true;render()"'}><div class="k" data-testid="study-term" style="${cur.k.length>2?'font-size:'+Math.max(34,Math.floor(200/cur.k.length))+'px':''}">${cur.k}</div>`;
  if(!fl)h+=`<div class="hint">แตะเพื่อดูคำอ่านและความหมาย</div>`;
  else h+=`<div class="d" data-testid="card-answer"><b>${rds(cur)[0]}</b><br>${rds(cur)[1]?rds(cur)[1]+'<br>':''}${cur.m}${cur.s==='c'?' *':''}<div class="st">หมวด: ${cur.c}</div></div>${spHtml(cur)}${mnHtml(cur)}${exHtml(cur)}<div class="btns"><button data-testid="grade-unsure" onclick="event.stopPropagation();grade(false)">ยังไม่แน่ใจ</button><button class="g" data-testid="grade-know" onclick="event.stopPropagation();grade(true)">จำได้</button></div>`;
  h+=`</div>`}
 else{
  h+=`<div class="card" data-testid="quiz-card"><div class="k" data-testid="study-term" style="${cur.k.length>2?'font-size:'+Math.max(34,Math.floor(200/cur.k.length))+'px':''}">${cur.k}</div><div class="q">${(ds==='a'||qt==='read')?'คำอ่านคือข้อไหน':'ความหมายคือข้อไหน'}</div><div class="ch${ch.every(c=>[...c.t].length<=12)?' ch2':''}">`;
  ch.forEach((c,i)=>{const s=ans===null?'':c.ok?'r':(ans===i?'w':'');h+=`<button class="${s}" data-testid="quiz-choice"${s?` data-result="${s==='r'?'correct':'wrong'}"`:''} onclick="pick(${i})">${c.t}</button>`});
  h+=`</div>`;
  if(ans!==null&&!ch[ans].ok)h+=pcmHtml(cmf)+`<div class="btns"><button class="nx" data-testid="quiz-next" onclick="go()">ข้อต่อไป</button></div>`;
  h+=`</div>`}
 h+=`<details class="ft"><summary>ระบบทบทวนทำงานอย่างไร</summary><p>ระบบทบทวนแบบเว้นระยะ: ตอบถูกต่อเนื่องจะห่างขึ้นเรื่อยๆ (10 นาที → 1 → 3 → 7 → 16 → 35 → 75 → 150 วัน) ตอบผิดจะกลับมาเร็วขึ้น · &quot;จำได้แม่น&quot; = ตอบถูกจนช่วงห่างถึง 7 วัน · ความคืบหน้าเก็บในเบราว์เซอร์เครื่องนี้<br>ข้อมูลเวอร์ชันทดลอง ควรตรวจกับตำราที่ใช้อยู่อีกครั้ง<br>คำศัพท์ บทสนทนา และไวยากรณ์เขียนขึ้นเองสำหรับแอปนี้</p></details><div class="ft" style="margin-top:6px">ลำดับขีดจาก <a href="https://kanjivg.tagaini.net" target="_blank" rel="noopener">KanjiVG</a> (CC BY-SA 3.0) · ดูเครดิตเต็มในหน้าสถิติ</div>`;
 document.getElementById('app').innerHTML=h;if(mode==='write')initCv()}
