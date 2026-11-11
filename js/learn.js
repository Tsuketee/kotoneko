// การเรียน: เลือกข้อ/ทบทวนแบบเว้นระยะ, การ์ด/ควิซ/ตารางคานะ, เสียงอ่าน, ที่ตอบผิดบ่อย, แผนที่การเรียนและสถิติรายชุด
const IV=[0,600000,86400000,259200000,604800000,1209600000];
const pool=()=>K.filter(x=>(ds!=='a'||ks==='all'||x.sc===ks)&&(cat==='ทั้งหมด'||(cat==='ผิดบ่อย'?(S[x.k]&&S[x.k].w>=2):x.c===cat)));
const rd=x=>x.o+(x.u!=='-'?' ・ '+x.u:'');
const sh=a=>a.map(v=>[Math.random(),v]).sort((p,q)=>p[0]-q[0]).map(v=>v[1]);
function pick1(){const p=pool(),n=Date.now();
 const due=p.filter(x=>S[x.k]&&S[x.k].d<=n).sort((a,b)=>S[a.k].d-S[b.k].d);
 if(due.length)return due[0];
 const nw=p.filter(x=>!S[x.k]);if(nw.length)return mode==='quiz'?nw[Math.floor(Math.random()*nw.length)]:nw[0];
 return prac?sh(p)[0]:null}
function go(){st=[];ci=0;cur=null;ch=null;ans=null;fl=false;render()}
function allMis(){const o=[];for(const k in DS){let s={};try{s=JSON.parse(localStorage.getItem(DS[k].key)||'{}')}catch(e){}DS[k].d.forEach(x=>{const r=s[x.k];if(r&&r.w>=1)o.push({k,x,w:r.w})})}return o.sort((a,b)=>b.w-a.w)}
function renderMis(){const L=allMis();let h=NAV()+`<h1>ที่ตอบผิดบ่อย</h1><div class="st">รวมทุกแท็บ · ผิดตั้งแต่ 2 ครั้งถือว่าผิดบ่อย · ตอบถูกต่อเนื่องแล้วจะหลุดจากรายการเอง</div>`;
 if(!L.length)h+=`<div class="card" style="margin-top:12px"><div class="k">${ic(P.star,72)}</div><div class="d">ยังไม่มีข้อที่ตอบผิด<br>ไปฝึกก่อนแล้วกลับมาดูนะคะ</div></div>`;
 else{const bs=Object.keys(DN).filter(k=>L.some(o=>o.k===k&&o.w>=2));
  if(bs.length)h+=`<div class="btns" style="margin:12px 0;flex-wrap:wrap">${bs.map(k=>`<button onclick="goMis('${k}')">ฝึก${DN[k]} (${L.filter(o=>o.k===k&&o.w>=2).length})</button>`).join('')}</div>`;
  h+=`<div class="card" style="text-align:left;min-height:0;padding:6px 14px;margin-top:12px">${L.slice(0,50).map(o=>`<div class="mi"><span class="mk">${o.x.k}</span><span class="mt"><b>${rd(o.x)}</b><br>${o.x.m}</span><span class="mw">ผิด ${o.w}</span></div>`).join('')}</div>`}
 document.getElementById('app').innerHTML=h}
function goMis(k){tab='learn';nv(k);mode='card';cat='ผิดบ่อย';go()}
function rec(ok){const nw=!S[cur.k],s=S[cur.k]||{b:0};s.b=ok?Math.min(5,s.b+1):0;if(!ok)s.w=(s.w||0)+1;else if(s.b>=3)s.w=0;s.d=Date.now()+(ok?IV[s.b]:30000);S[cur.k]=s;save();tick();if(ok)ptrack('rev');if(nw)ptrack('neu')}
function grade(ok){rec(ok);go()}
function pick(i){if(ans!==null)return;ans=i;rec(ch[i].ok);render();if(ch[i].ok){const c0=cur;setTimeout(()=>{if(cur===c0&&ans!==null)go()},700)}}
function mkch(){const f=x=>(ds==='a'||qt==='read')?rd(x):x.m;const c=f(cur);
 const o=sh(K.filter(x=>x.k!==cur.k&&f(x)!==c)).filter((x,i,a)=>a.findIndex(y=>f(y)===f(x))===i).slice(0,3);
 ch=sh([{t:c,ok:true},...o.map(x=>({t:f(x),ok:false}))])}
function nv(i){if(i==='d'||i==='m'||i==='n5'){view=i}else{view='s';ds=i;K=DS[i].d;CATS=['ทั้งหมด',...new Set(K.map(x=>x.c))];cat='ทั้งหมด';S=load();mode=i==='a'?'chart':'card';wi=0;ci=0;st=[];prac=0;cur=null;ch=null;ans=null;fl=false}render()}
const EXT={o:['ออน','on'],k:['คุน','kun'],s:['พิเศษ','sp']};
function exHtml(c){if(ds!=='k'||!EX[c.k])return'';return `<div class="ex"><div class="exh">ตัวอย่างการใช้</div>${EX[c.k].map(e=>`<div class="er" data-t="${e[1]}" onclick="event.stopPropagation();speak(this.dataset.t)"><span class="et ${EXT[e[3]][1]}">${EXT[e[3]][0]}</span><span class="ew">${e[0]}</span><span class="ed"><b>${e[1]}</b> ${e[2]}</span></div>`).join('')}</div>`}
function speakFor(x){if(ds==='a')return x.k;if(ds==='k')return x.u&&x.u!=='-'?x.u.split('・')[0].replace(/\(.*?\)/g,''):x.o.split('/')[0];return x.o}
function speak(t){if(!t)return;if(!('speechSynthesis' in window))return toast('เครื่องนี้ยังไม่รองรับเสียงอ่าน');try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='ja-JP';u.rate=.85;const v=speechSynthesis.getVoices().find(v=>/^ja/i.test(v.lang));if(v)u.voice=v;speechSynthesis.speak(u)}catch(e){}}
const spHtml=x=>`<button class="sp" data-t="${speakFor(x).replace(/"/g,'')}" onclick="event.stopPropagation();speak(this.dataset.t)">${IC.vol} ฟังเสียง</button>`;
const mnHtml=x=>ds==='a'&&MN[x.k]?`<div class="ex"><div class="exh">เคล็ดจำ</div><div class="mn">${MN[x.k]}</div></div>`:'';
function catOpts(){const o=c=>`<option value="${c}"${c===cat?' selected':''}>${c}</option>`;if(ds!=='a')return[...CATS,'ผิดบ่อย'].map(o).join('');const G={b:'พื้นฐาน',d:'เสียงขุ่น・กึ่งขุ่น',y:'เสียงควบ'};let s=o('ทั้งหมด');for(const g in G){const cs=[...new Set(K.filter(x=>x.g===g).map(x=>x.c))];s+=`<optgroup label="${G[g]}">${cs.map(o).join('')}</optgroup>`}return s+o('ผิดบ่อย')}
const scriptRow=()=>`<div class="seg" style="display:flex;margin-bottom:12px">${[['h','ฮิระงะนะ'],['k','คะตะคะนะ'],['all','ทั้งสองแบบ']].map(x=>`<button style="flex:1" class="${ks===x[0]?'on':''}" onclick="ks='${x[0]}';wi=0;go()">${x[1]}</button>`).join('')}</div>`;
function chartHtml(){const sc=ks==='k'?'k':'h',G={b:'พื้นฐาน',d:'เสียงขุ่น・กึ่งขุ่น',y:'เสียงควบ'},R={};K.filter(x=>x.sc===sc).forEach(x=>{(R[x.c]=R[x.c]||[]).push(x)});
 const tint=x=>{const r=S[x.k];return!r?'':r.w>=2?'background:rgba(239,107,91,.3)':r.b>=3?'background:rgba(92,184,127,.3)':r.b>=1?'background:rgba(224,149,47,.28)':''};
 let h=`<div class="seg" style="display:flex;margin-bottom:12px"><button style="flex:1" class="${sc==='h'?'on':''}" onclick="ks='h';render()">ฮิระงะนะ</button><button style="flex:1" class="${sc==='k'?'on':''}" onclick="ks='k';render()">คะตะคะนะ</button></div><div class="st" style="margin-bottom:8px">แตะตัวอักษรเพื่อฟังเสียง · สีบอกความแม่น</div>`;
 for(const g in G){h+=`<div class="kt">${G[g]}</div>`;Object.keys(R).filter(c=>R[c][0].g===g).forEach(c=>{const cols=g==='y'?3:5;h+=`<div class="kr" style="grid-template-columns:repeat(${cols},1fr)">${R[c].map((x,i)=>`<div class="kc" style="grid-column:${(c==='や/ヤ'||c==='わ/ワ')?[1,3,5][i]:i+1};${tint(x)}" data-t="${x.k}" onclick="speak(this.dataset.t)"><b>${x.k}</b><span>${x.o}</span></div>`).join('')}</div>`})}
 return h+`<div class="lg"><i style="background:rgba(92,184,127,.55)"></i>แม่นแล้ว<i style="background:rgba(224,149,47,.55)"></i>กำลังเรียน<i style="background:rgba(239,107,91,.55)"></i>ผิดบ่อย</div>`}
function pathHtml(sts){const m=Object.fromEntries(sts),L=['k','w','v'],A=m.a||{lr:0,t:0,due:0},t5=L.reduce((a,k)=>a+m[k].t,0),l5=L.reduce((a,k)=>a+m[k].lr,0),d5=L.reduce((a,k)=>a+m[k].due,0),pa=A.t?A.lr/A.t:0,p5=t5?l5/t5:0,lock=(n,s,g)=>`<div class="pc lk0"><div class="pn">🔒</div><div class="pb"><b>${n}</b><div class="st">${s}</div></div><div class="pg2">${g}</div></div>`;
 return `<div class="path"><div class="pc big1" onclick="openDs('a')"><div class="pn">1</div><div class="pb"><div class="pg">あ ア</div><b>${DS.a.n}</b>${pa>=.8?'<span class="bd b2">ผ่านแล้ว</span>':'<span class="bd b1">เริ่มที่นี่</span>'}<div class="st">ก่อนเริ่ม · เรียนทีละแถว 5 ตัว มีตารางและเสียงอ่าน</div><div class="st">พื้นฐาน ${A.lr}/${A.t} จำได้แม่น${A.due?' · ทบทวน '+A.due:''}</div><div class="bar"><i style="width:${pa*100}%"></i></div></div></div>
 <div class="pc" onclick="openLv()"><div class="pn">2</div><div class="pb"><b>N5</b>${p5>=.8?'<span class="bd b2">ผ่านแล้ว</span>':pa>=.8?'<span class="bd b3">พร้อมแล้ว</span>':''}<div class="st">คำศัพท์ · คันจิ · บทสนทนา · ไวยากรณ์ · ซ้อมสอบ</div><div class="st">${l5}/${t5} จำได้แม่น${d5?' · ทบทวน '+d5:''}</div><div class="bar"><i style="width:${p5*100}%"></i></div></div><div class="pg2">五</div></div>
 ${lock('N4','ปลดล็อกเมื่อ N5 จำได้แม่น 80% · เนื้อหากำลังมา','四')}${lock('N3','เนื้อหากำลังมา','三')}</div>`}
function openLv(){tab='learn';nv('n5');window.scrollTo(0,0)}
function renderLv(){const m=Object.fromEntries(Object.keys(DS).map(k=>[k,dsStat(k)])),L=['k','w','v'],t=L.reduce((a,k)=>a+m[k].t,0),l=L.reduce((a,k)=>a+m[k].lr,0);
 const sec=(k,s,g)=>`<div class="pc" onclick="openDs('${k}')"><div class="pb"><b>${k==='d'?'บทสนทนา':DS[k].n}</b><div class="st">${k==='d'?D.length+' บทสนทนา':m[k].lr+'/'+m[k].t+' จำได้แม่น'+(m[k].due?' · ทบทวน '+m[k].due:'')}</div>${k==='d'?'':`<div class="bar"><i style="width:${m[k].t?m[k].lr/m[k].t*100:0}%"></i></div>`}</div><div class="pg2">${g}</div></div>`,
 soon=(n,s,g)=>`<div class="pc lk0"><div class="pb"><b>🔒 ${n}</b><div class="st">${s}</div></div><div class="pg2">${g}</div></div>`;
 document.getElementById('app').innerHTML=NAV()+`<div class="st">จำได้แม่นรวม ${l}/${t} · เนื้อหาเขียนเอง</div><div class="bar"><i style="width:${t?l/t*100:0}%"></i></div><div class="path" style="margin-top:14px">${sec('k','','漢')}${sec('w','','語')}${sec('v','','文')}${sec('d','','話')}${soon('ไวยากรณ์','เนื้อหากำลังมา','法')}${soon('ซ้อมสอบ N5','ปลดล็อกเมื่อเรียนครบทุกหมวด','試')}</div>`}
function dsStat(k){let s={};try{s=JSON.parse(localStorage.getItem(DS[k].key)||'{}')}catch(e){}const n=Date.now();let seen=0,lr=0,due=0;const L=k==='a'?DS[k].d.filter(x=>x.g==='b'):DS[k].d;L.forEach(x=>{const r=s[x.k];if(r){seen++;if(r.b>=3)lr++;if(r.d<=n)due++}});return{seen,lr,due,t:L.length}}
function openDs(k){M.last=k;saveM();tab='learn';nv(k);window.scrollTo(0,0)}
function resume(){openDs(M.last&&(DS[M.last]||M.last==='d')?M.last:'k')}
function renderLearn(){
 const p=pool(),seen=p.filter(x=>S[x.k]).length,lr=p.filter(x=>S[x.k]&&S[x.k].b>=3).length;
 if(!cur)cur=pick1();
 if(cur&&mode==='quiz'&&!ch)mkch();
 let h=NAV()+`<div class="st">เจอแล้ว ${seen}/${p.length} · จำได้แม่น ${lr}</div><div class="bar"><i style="width:${p.length?lr/p.length*100:0}%"></i></div>`;
 h+=`<div class="row"><select onchange="cat=this.value;prac=0;wi=0;go()">${catOpts()}</select><div class="seg">${ds==='a'?`<button class="${mode==='chart'?'on':''}" onclick="mode='chart';go()">ตาราง</button>`:''}<button class="${mode==='card'?'on':''}" onclick="mode='card';go()">การ์ด</button><button class="${mode==='quiz'?'on':''}" onclick="mode='quiz';go()">ควิซ</button><button class="${mode==='write'?'on':''}" onclick="mode='write';go()">เขียน</button></div></div>${ds==='a'?scriptRow():''}`;
 if(mode==='quiz'&&ds!=='a')h+=`<div class="row"><div class="seg" style="flex:1"><button style="flex:1" class="${qt==='read'?'on':''}" onclick="qt='read';go()">ตอบคำอ่าน</button><button style="flex:1" class="${qt==='mean'?'on':''}" onclick="qt='mean';go()">ตอบความหมาย</button></div></div>`;
 if(mode==='chart'&&ds==='a'){h+=chartHtml()}
 else if(mode==='write'&&p.length){const x=p[wi%p.length],cs=[...x.k].filter(c=>SV[c]),c0=cs.length?cs[ci%cs.length]:x.k[0];
  h+=`<div class="wi"><div class="d" style="margin:0"><b>${x.o}</b>${x.u!=='-'?' ・ '+x.u:''}<br>${x.m}</div>${spHtml(x)}</div><div class="tb"><div class="seg"><button class="${tool==='pen'?'on':''}" onclick="tool='pen';render()">${IPEN}</button><button class="${tool==='er'?'on':''}" onclick="tool='er';render()">${IER}</button></div>${tool==='er'?`<input type="range" min="6" max="40" value="${esz}" oninput="esz=+this.value">`:`<span style="flex:1"></span>`}<button class="ic" onclick="guide=guide?0:1;render()">${guide?IC.eye:IC.eyeoff}</button></div><div class="card nw" style="padding:10px;min-height:0"><div class="sheet">${CELLS.map((sp,i)=>`<div class="cell">${cellSvg(c0,sp)}<canvas data-c="${i}" width="200" height="200"></canvas></div>`).join('')}</div>${cs.length>1?`<div class="btns" style="margin-top:10px">${cs.map((c,i)=>`<button style="background:${c===c0?'var(--ac)':'var(--mut)'};font-size:22px;padding:8px" onclick="ci=${i};st=[];render()">${c}</button>`).join('')}</div>`:''}</div><button class="big" onclick="tick();wi++;ci=0;st=[];render()">ตัวต่อไป →</button>`}
 else if(!cur){h+=`<div class="card"><div class="k">${ic(P.star,72)}</div><div class="d">ทบทวนครบตามรอบแล้ว<br>กลับมาใหม่ทีหลังได้เลย</div><button class="lk" onclick="prac=1;go()">ฝึกสุ่มต่ออีกนิด</button></div>`}
 else if(mode==='card'){
  h+=`<div class="card" ${fl?'':'onclick="fl=true;render()"'}><div class="k" style="${cur.k.length>2?'font-size:'+Math.max(34,Math.floor(200/cur.k.length))+'px':''}">${cur.k}</div>`;
  if(!fl)h+=`<div class="hint">แตะเพื่อดูคำอ่านและความหมาย</div>`;
  else h+=`<div class="d"><b>${cur.o}</b><br>${cur.u!=='-'?cur.u+'<br>':''}${cur.m}${cur.s==='c'?' *':''}<div class="st">หมวด: ${cur.c}</div></div>${spHtml(cur)}${mnHtml(cur)}${exHtml(cur)}<div class="btns"><button onclick="event.stopPropagation();grade(false)">ยังไม่แน่ใจ</button><button class="g" onclick="event.stopPropagation();grade(true)">จำได้</button></div>`;
  h+=`</div>`}
 else{
  h+=`<div class="card"><div class="k" style="${cur.k.length>2?'font-size:'+Math.max(34,Math.floor(200/cur.k.length))+'px':''}">${cur.k}</div><div class="q">${(ds==='a'||qt==='read')?'คำอ่านคือข้อไหน':'ความหมายคือข้อไหน'}</div><div class="ch">`;
  ch.forEach((c,i)=>{const s=ans===null?'':c.ok?'r':(ans===i?'w':'');h+=`<button class="${s}" onclick="pick(${i})">${c.t}</button>`});
  h+=`</div>`;
  if(ans!==null&&!ch[ans].ok)h+=`<div class="btns"><button class="nx" onclick="go()">ข้อต่อไป</button></div>`;
  h+=`</div>`}
 h+=`<div class="ft">ระบบทบทวนแบบเว้นระยะ: ข้อที่ตอบผิดจะกลับมาเร็วขึ้น · ความคืบหน้าเก็บในเบราว์เซอร์เครื่องนี้<br>ข้อมูลเวอร์ชันทดลอง ควรตรวจกับตำราที่ใช้อยู่อีกครั้ง<br>คำศัพท์และบทสนทนาเขียนขึ้นเองสำหรับแอปนี้<br>ลำดับขีดจาก <a href="https://kanjivg.tagaini.net" target="_blank" rel="noopener">KanjiVG</a> (CC BY-SA 3.0) · ดูเครดิตเต็มในหน้าสถิติ</div>`;
 document.getElementById('app').innerHTML=h;if(mode==='write')initCv()}
