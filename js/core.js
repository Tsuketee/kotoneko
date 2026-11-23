// แกนกลาง: ชุดข้อมูล DS, ตัวแปรสถานะ, ที่เก็บความคืบหน้า (localStorage), ไอคอน, แถบนำทาง, หน้าแรก, ตัวสลับหน้า render()
const PAL=['#e05a5a','#3aa65f','#4a86d8','#e0952f','#9b59b6','#16a5a5','#c2528b','#7a8c2e'];
const DS={a:{n:'ฮิระงะนะ・คะตะคะนะ',d:KA,key:'ka1'},k:{n:'คันจิ '+LEVELS[LV].n,d:K,key:LKEY[LV].k},w:{n:'คำที่เขียนด้วยคันจิ',d:W,key:LKEY[LV].w},v:{n:'คำศัพท์คะนะ',d:V,key:LKEY[LV].v}}; // key ตามระดับ ดู js/level.js
let ks='h',tab='home',ds='k',view='s',fur=true,dl=1,CATS=['ทั้งหมด',...new Set(K.map(x=>x.c))];
function load(){return readJSON(DS[ds].key,{})}
function save(){writeJSON(DS[ds].key,S)}
let S=load(),st=[],lc=0,tool='pen',esz=14,ep=null,wi=0,ci=0,guide=2,cat='ทั้งหมด',mode='card',qt='read',prac=0,cur=null,ch=null,ans=null,fl=false;
document.onselectstart=e=>e.preventDefault();const MK='kn_meta';let M=readJSON(MK,{});M.goal=M.goal||20;M.days=M.days||{};
// แปลงข้อความเป็น HTML ที่ปลอดภัย: ตัวเดียวทั้งแอป (null/undefined = ว่าง)
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const dstr=x=>x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');
function saveM(){writeJSON(MK,M)}
// ข้อความเด้ง: ถ้ามีหลายข้อความพร้อมกันให้ต่อคิวทีละอัน (ข้อความเดี่ยวแสดงทันทีเหมือนเดิม)
let toastFree=0;
function toast(m){const now=Date.now(),at=Math.max(now,toastFree);toastFree=at+2400;
 const show=()=>{const e=document.createElement('div');e.className='toast';e.dataset.testid='toast';e.innerHTML=m;document.body.appendChild(e);setTimeout(()=>e.remove(),2300)};
 if(at<=now)show();else setTimeout(show,at-now)}
function tick(){const k=dstr(new Date());M.days[k]=(M.days[k]||0)+1;saveM();if(M.days[k]===M.goal)pgoal()}
function streak(){let n=0;const d=new Date();if((M.days[dstr(d)]||0)<M.goal)d.setDate(d.getDate()-1);while((M.days[dstr(d)]||0)>=M.goal){n++;d.setDate(d.getDate()-1)}return n}
// เป้าหมายต่อวัน (M.goal) ตัวเดียว ใช้กับวงหน้าแรก วันต่อเนื่อง สถิติ และภารกิจทบทวน · พิมพ์เองได้ GMIN–GMAX · เปิดจากวงหน้าแรก เมนูโปรไฟล์ และหน้าความคืบหน้า
const GMIN=1,GMAX=200,GPRE=[5,10,15,20,30,50];
const goalOk=v=>{const s=String(v).trim();if(!/^\d+$/.test(s))return null;const n=+s;return n>=GMIN&&n<=GMAX?n:null};
function setGoal(){if(document.querySelector('.cov'))return;const o=document.createElement('div');o.className='cov';
 o.innerHTML=`<div class="cdl" role="dialog" aria-modal="true" aria-labelledby="glh"><h2 id="glh" style="margin-top:0">เป้าหมายต่อวัน</h2><div class="st">จำนวนข้อที่ตอบต่อวัน ใช้กับวงบนหน้าแรก วันต่อเนื่อง และภารกิจทบทวน</div><label class="pfl2">จำนวนข้อ (${GMIN}–${GMAX})<input class="fin" id="glin" data-testid="goal-input" type="number" inputmode="numeric" min="${GMIN}" max="${GMAX}" step="1" value="${M.goal}"></label><div class="glp" role="group" aria-label="ตัวเลือกด่วน">${GPRE.map(v=>`<button type="button" data-v="${v}" aria-pressed="${v===M.goal}">${v}</button>`).join('')}</div><div class="gler" id="gler" data-testid="goal-error" role="alert"></div><div class="btns" style="margin-top:12px"><button class="sec" data-x="1">ยกเลิก</button><button class="g" data-s="1" data-testid="goal-save">บันทึก</button></div></div>`;
 const inp=o.querySelector('#glin'),er=o.querySelector('#gler');
 const ok=()=>{const n=goalOk(inp.value);if(n==null){er.textContent=`ใส่จำนวนข้อเป็นตัวเลข ${GMIN}–${GMAX}`;inp.focus();return}M.goal=n;saveM();o.remove();render();toast(icx('flame',16)+' เป้าหมายต่อวัน '+n+' ข้อ')};
 o.onclick=e=>{const b=e.target.closest('button');if(e.target===o||(b&&b.dataset.x))return o.remove();if(b&&b.dataset.v){inp.value=b.dataset.v;er.textContent='';o.querySelectorAll('.glp button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)))}if(b&&b.dataset.s)ok()};
 inp.oninput=()=>{er.textContent='';o.querySelectorAll('.glp button').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.v===inp.value.trim())))};
 inp.onkeydown=e=>{if(e.key==='Enter')ok()};document.body.appendChild(o);inp.focus();inp.select()}
const DN={a:'คานะ',k:'คันจิ',w:'คำคันจิ',v:'คำศัพท์'};
const NAV=()=>tab==='learn'?`<div class="top"><button class="bk" data-testid="nav-back" onclick="${view==='gl'?'gBack()':"view='path';render()"}" aria-label="กลับหน้าเรียน">‹</button><b>${view==='d'?'บทสนทนา':view==='n5'?LEVELS[LV].n:view==='g'||view==='gl'?'ไวยากรณ์':DS[ds].n}</b></div>`:'';
const P={grid:'<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',cards:'<rect x="7" y="3" width="13" height="16" rx="2"/><path d="M4 7v12a2 2 0 0 0 2 2h10"/>',pen:'<path d="M16.4 3.6a1.4 1.4 0 0 1 2 2L7.4 16.6a2 2 0 0 1-.9.5l-2.9.8.8-2.9a2 2 0 0 1 .5-.9z"/><path d="M12 21c1.5 0 1.5-1.5 3-1.5s1.5 1.5 3 1.5 1.5-1.5 3-1.5"/>',home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',book:'<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',alert:'<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',chart:'<path d="M5 21v-6"/><path d="M12 21V3"/><path d="M19 21V9"/>',vol:'<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9.5 9.5 0 0 1 0 14"/>',flame:'<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',check:'<path d="M21.8 10A10 10 0 1 1 17 3.3"/><path d="m9 11 3 3L22 4"/>',star:'<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2L5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',eye:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',eyeoff:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/>'
 ,ok:'<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.8 2.8 5.7-5.8"/>',no:'<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
 lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
 rice:'<path d="M12 4.300c-1.700 0-2.800 1.100-3.700 2.600l-3.900 6.900c-1.500 2.700.2 6 3.300 6h8.600c3.100 0 4.800-3.300 3.300-6l-3.900-6.900C14.800 5.400 13.700 4.300 12 4.300Z"/><path d="M9.200 19.800v-4.600h5.600v4.600Z" fill="currentColor"/>',
 medal:'<circle cx="12" cy="9" r="5.500"/><path d="m8.500 13.500-1.800 7.500 5.300-2.500 5.300 2.500-1.800-7.500"/>',
 paw:'<circle cx="6.500" cy="10.500" r="1.700"/><circle cx="10" cy="6.500" r="1.700"/><circle cx="14" cy="6.500" r="1.700"/><circle cx="17.500" cy="10.500" r="1.700"/><path d="M12 11.500c-2.500 0-5 3.200-5 5.200 0 1.800 1.500 2.300 3 2 1-.2 1.500-.4 2-.4s1 .2 2 .4c1.500.3 3-.2 3-2 0-2.500-2.500-5.200-5-5.200Z"/>',
 sparkle:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.500 2.500M15.500 15.500 18 18M18 6l-2.500 2.500M8.500 15.500 6 18"/>',
 sprout:'<path d="M12 21v-8"/><path d="M12 13c0-4 3-6 7-6 0 4-3 6-7 6Z"/><path d="M12 15c0-3-2.500-5-6-5 0 3.500 2.500 5 6 5Z"/>',
 bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
 moon:'<path d="M20 14.500A8 8 0 0 1 9.500 4a8 8 0 1 0 10.500 10.500Z"/>',
 blush:'<circle cx="12" cy="12" r="9"/><path d="M8 15c1.200 1.100 2.400 1.600 4 1.600s2.800-.5 4-1.600"/><path d="M9 10h.01M15 10h.01M5.500 13.500h2M16.500 13.500h2"/>',
 heart:'<path d="M12 20s-7-4.400-7-10a4 4 0 0 1 7-2.500A4 4 0 0 1 19 10c0 5.600-7 10-7 10Z"/>',
 zzz:'<path d="M5 6h5l-5 6h5M13 13h4l-4 5h4M16 4h3l-3 3.500h3"/>',
 smile:'<circle cx="12" cy="12" r="9"/><path d="M8 14c1 2 2.300 3 4 3s3-1 4-3z"/><path d="M8.500 9.500h.01M15.500 9.500h.01"/>',
 search:'<circle cx="11" cy="11" r="6.500"/><path d="m16 16 4.500 4.500"/>',
 ticket:'<path d="M3 6h18v3.500a2.500 2.500 0 0 0 0 5V18H3v-3.500a2.500 2.500 0 0 0 0-5z"/><path d="M9.500 6.500v11" stroke-dasharray="1.600 2.200"/>',
 bow:'<path d="M12 12 4 7v10zM12 12l8-5v10z"/><rect x="10.500" y="10.500" width="3" height="3" rx=".8"/>',
 trend:'<path d="M3.500 3.500v17h17"/><path d="m7.500 14.500 3.500-4 3 2.500 5-6"/>',
 shop:'<path d="M4 9.500 5.500 4h13L20 9.500"/><path d="M4 9.500a2.700 2.700 0 0 0 5.300 0 2.700 2.700 0 0 0 5.400 0 2.700 2.700 0 0 0 5.300 0"/><path d="M5.500 12.500V20h13v-7.500"/><path d="M10 20v-4.500h4V20"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4.500 20.500c.8-3.700 3.800-6 7.500-6s6.700 2.300 7.500 6"/>',
 gift:'<rect x="3.500" y="8" width="17" height="4" rx="1"/><path d="M5 12v8.500h14V12"/><path d="M12 8v12.500"/><path d="M12 8c-1.500-3.500-5.500-4-5.500-1.500S10 8 12 8Zm0 0c1.500-3.500 5.500-4 5.500-1.500S14 8 12 8Z"/>',
 swap:'<path d="M4 8.500h14l-3.500-3.500"/><path d="M20 15.500H6l3.500 3.500"/>',
 share:'<path d="M12 3.500v11"/><path d="m8 7.500 4-4 4 4"/><path d="M8 11H6.500a1.500 1.500 0 0 0-1.500 1.500v6A1.500 1.500 0 0 0 6.500 20h11a1.500 1.500 0 0 0 1.500-1.500v-6a1.500 1.500 0 0 0-1.500-1.500H16"/>',
 edit:'<path d="M15.500 4.500a2.100 2.100 0 0 1 3 3L8 18l-4 1 1-4z"/><path d="m13.500 6.500 3 3"/>',
 menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
 mail:'<rect x="3.500" y="5.500" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>',
 cloud:'<path d="M7 18.500a4.500 4.500 0 0 1-.6-9 6 6 0 0 1 11.400 1.700A3.700 3.700 0 0 1 17 18.500z"/><path d="m9.500 13.500 2.500-2.500 2.500 2.500M12 11v5"/>',
 download:'<path d="M12 4v10.500"/><path d="m7.500 10.500 4.500 4.500 4.500-4.500"/><path d="M5 19.500h14"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5.500"/><path d="M12 7.500h.01"/>',
 shield:'<path d="M12 3 5 6v5.500c0 4.300 3 7.800 7 9.500 4-1.700 7-5.200 7-9.500V6z"/><path d="m9 12 2.200 2.200L15.500 10"/>',
 doc:'<path d="M7 3.500h7l4 4V20a.5.5 0 0 1-.5.5h-10.500A.5.5 0 0 1 6.500 20V4a.5.5 0 0 1 .5-.5Z"/><path d="M13.500 3.500V8h4.500M9.500 12.500h5M9.500 16h5"/>',
 logout:'<path d="M14 4.500H6.500A1.500 1.500 0 0 0 5 6v12a1.500 1.500 0 0 0 1.500 1.500H14"/><path d="M10 12h10"/><path d="m16.500 8.500 3.500 3.500-3.500 3.500"/>'};
const ic=(p,s=18)=>`<svg class="ic2" viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const IC={};for(const k in P)IC[k]=ic(P[k]);
const icx=(k,s=18,c='')=>ic(P[k],s).replace('class="ic2"','class="ic2'+(c?' '+c:'')+'"');
const IPEN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16.4 3.6a1.4 1.4 0 0 1 2 2L7.4 16.6a2 2 0 0 1-.9.5l-2.9.8.8-2.9a2 2 0 0 1 .5-.9z"/><path d="M12 21c1.5 0 1.5-1.5 3-1.5s1.5 1.5 3 1.5 1.5-1.5 3-1.5"/></svg>',IER='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>';
function goTab(t){if(t==='learn')view='path';if(t==='me')meView='menu';tab=t;render();window.scrollTo(0,0)} // แท็บเรียน = หน้ารวมเส้นทางเรียน (v73 · เจ้าของขอย้ายจากหน้าแรก) แตะซ้ำตอนอยู่ในหมวดย่อยก็กลับหน้ารวม
function navUpdate(){const un=typeof punclaimed==='function'?punclaimed():0;document.getElementById('nav').innerHTML=[['home','home','หน้าแรก'],['learn','book','เรียน'],['stats','trend','ความคืบหน้า'],['shop','shop','ร้านค้า'],['me','user','โปรไฟล์']].map(([t,i,n])=>`<button class="${tab===t||(t==='stats'&&tab==='mis')?'on':''}" data-testid="nav-${t}" onclick="goTab('${t}')"${t==='home'&&un?` aria-label="หน้าแรก มีรางวัลรอรับ ${un}"`:''}><span>${ic(P[i],24)}${t==='home'&&un?`<i class="nb">${un}</i>`:''}</span>${n}</button>`).join('')} // nb = จำนวนภารกิจที่ทำครบแต่ยังไม่กดรับ · แถบล่าง 5 หมวด (v74 · เจ้าของจัดใหม่): หน้าแรก=สัตว์เลี้ยง+ภารกิจ · เรียน=เส้นทาง+เนื้อหา · ความคืบหน้า=สถิติ+ผิดบ่อย (tab stats/mis) · ร้านค้า · โปรไฟล์=บัญชี (tab me)
function homeHtml(){const t=M.days[dstr(new Date())]||0,g=M.goal,n=streak(),C=2*Math.PI*34,f=Math.min(1,t/g);
 const sts=Object.keys(DS).map(k=>[k,dsStat(k)]),due=sts.reduce((a,x)=>a+x[1].due,0);
 return `<div class="hero"><div class="ring" role="button" tabindex="0" data-testid="home-goal" aria-label="เป้าหมายต่อวัน ${g} ข้อ แตะเพื่อเปลี่ยน" onclick="setGoal()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();setGoal()}"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" class="rb"/><circle cx="40" cy="40" r="34" class="rf" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-f)}" transform="rotate(-90 40 40)"/></svg><div class="rt" data-testid="home-today"><b>${t}</b>/${g}</div></div><div class="hm"><div class="hi" data-testid="home-greeting">สวัสดีค่ะ${M.me&&M.me.name?' '+esc(M.me.name):''}</div><div class="hs">${IC.flame} ต่อเนื่อง ${n} วัน</div><div class="hs">${t>=g?'ครบเป้าวันนี้แล้ว '+IC.check:'อีก '+(g-t)+' ข้อถึงเป้าวันนี้'}</div></div></div>${petHtml(`<button class="big" data-testid="home-review" onclick="resume()">${due>0?'ทบทวน '+due+' ข้อที่ถึงเวลา':'เรียนต่อ'} →</button>`)}`}
function render(){const a=document.getElementById('app');if(!(M.pet&&M.pet.name)){a.innerHTML=cloudOb?cloudObHtml():obHtml();document.getElementById('nav').innerHTML='';return}if(tab==='home'){a.innerHTML=homeHtml();petMount()}else if(tab==='stats')a.innerHTML=statsHtml();else if(tab==='shop')a.innerHTML=shopHtml();else if(tab==='me'){a.innerHTML=meHtml();profMount();if(meView==='menu')mnVer()}else if(tab==='mis')renderMis();else if(view==='path')renderPath();else if(view==='d')renderDlg();else if(view==='n5')renderLv();else if(view==='g')renderGrammar();else if(view==='gl')renderGL();else renderLearn();navUpdate()}
