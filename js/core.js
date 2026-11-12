// แกนกลาง: ชุดข้อมูล DS, ตัวแปรสถานะ, ที่เก็บความคืบหน้า (localStorage), ไอคอน, แถบนำทาง, หน้าแรก, ตัวสลับหน้า render()
const PAL=['#e05a5a','#3aa65f','#4a86d8','#e0952f','#9b59b6','#16a5a5','#c2528b','#7a8c2e'];
const DS={a:{n:'ฮิระงะนะ・คะตะคะนะ',d:KA,key:'ka1'},k:{n:'คันจิ '+LEVELS[LV].n,d:K,key:LKEY[LV].k},w:{n:'คำที่เขียนด้วยคันจิ',d:W,key:LKEY[LV].w},v:{n:'คำศัพท์คะนะ',d:V,key:LKEY[LV].v}}; // key ตามระดับ ดู js/level.js
let ks='h',tab='home',ds='k',view='s',fur=true,dl=1,CATS=['ทั้งหมด',...new Set(K.map(x=>x.c))];
function load(){try{return JSON.parse(localStorage.getItem(DS[ds].key)||'{}')}catch(e){return{}}}
function save(){try{localStorage.setItem(DS[ds].key,JSON.stringify(S))}catch(e){}}
let S=load(),st=[],lc=0,tool='pen',esz=14,ep=null,wi=0,ci=0,guide=2,cat='ทั้งหมด',mode='card',qt='read',prac=0,cur=null,ch=null,ans=null,fl=false;
document.onselectstart=e=>e.preventDefault();const MK='kn_meta';let M={};try{M=JSON.parse(localStorage.getItem(MK)||'{}')}catch(e){}M.goal=M.goal||20;M.days=M.days||{};
const dstr=x=>x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');
function saveM(){try{localStorage.setItem(MK,JSON.stringify(M))}catch(e){}}
// ข้อความเด้ง: ถ้ามีหลายข้อความพร้อมกันให้ต่อคิวทีละอัน (ข้อความเดี่ยวแสดงทันทีเหมือนเดิม)
let toastFree=0;
function toast(m){const now=Date.now(),at=Math.max(now,toastFree);toastFree=at+2400;
 const show=()=>{const e=document.createElement('div');e.className='toast';e.innerHTML=m;document.body.appendChild(e);setTimeout(()=>e.remove(),2300)};
 if(at<=now)show();else setTimeout(show,at-now)}
function tick(){const k=dstr(new Date());M.days[k]=(M.days[k]||0)+1;saveM();if(M.days[k]===M.goal)pgoal()}
function streak(){let n=0;const d=new Date();if((M.days[dstr(d)]||0)<M.goal)d.setDate(d.getDate()-1);while((M.days[dstr(d)]||0)>=M.goal){n++;d.setDate(d.getDate()-1)}return n}
function setGoal(){const g=[10,20,30,50,100];M.goal=g[(g.indexOf(M.goal)+1)%g.length];saveM();render()}
function goalHtml(){const t=M.days[dstr(new Date())]||0,g=M.goal;return `<div class="gl" onclick="setGoal()"><span>${IC.flame} ${streak()} วัน</span><div class="bar"><i style="width:${Math.min(100,t/g*100)}%"></i></div><span>${t}/${g}${t>=g?' '+IC.check:''}</span></div>`}
const DN={a:'คานะ',k:'คันจิ',w:'คำคันจิ',v:'คำศัพท์'};
const NAV=()=>tab==='learn'?`<div class="top"><button class="bk" onclick="${view==='gl'?'gBack()':"tab='home';render()"}">‹</button><b>${view==='d'?'บทสนทนา':view==='n5'?LEVELS[LV].n:view==='g'||view==='gl'?'ไวยากรณ์':DS[ds].n}</b></div>`:'';
const P={home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',book:'<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',alert:'<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',chart:'<path d="M5 21v-6"/><path d="M12 21V3"/><path d="M19 21V9"/>',vol:'<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9.5 9.5 0 0 1 0 14"/>',flame:'<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',check:'<path d="M21.8 10A10 10 0 1 1 17 3.3"/><path d="m9 11 3 3L22 4"/>',star:'<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2L5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',eye:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',eyeoff:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/>'
 ,ok:'<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.8 2.8 5.7-5.8"/>',no:'<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
 lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
 rice:'<path d="M10.600 5.200 3.800 16.700c-.8 1.400.2 3 1.800 3h12.800c1.600 0 2.600-1.600 1.800-3L13.400 5.200a1.600 1.600 0 0 0-2.800 0Z"/><path d="M9.500 19.700v-4.200h5v4.200"/>',
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
 bow:'<path d="M12 12 4 7v10zM12 12l8-5v10z"/><rect x="10.500" y="10.500" width="3" height="3" rx=".8"/>'};
const ic=(p,s=18)=>`<svg class="ic2" viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const IC={};for(const k in P)IC[k]=ic(P[k]);
const icx=(k,s=18,c='')=>ic(P[k],s).replace('class="ic2"','class="ic2'+(c?' '+c:'')+'"');
const IPEN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16.4 3.6a1.4 1.4 0 0 1 2 2L7.4 16.6a2 2 0 0 1-.9.5l-2.9.8.8-2.9a2 2 0 0 1 .5-.9z"/><path d="M12 21c1.5 0 1.5-1.5 3-1.5s1.5 1.5 3 1.5 1.5-1.5 3-1.5"/></svg>',IER='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>';
function goTab(t){if(t==='learn'){if(tab!=='learn')resume();return}tab=t;render();window.scrollTo(0,0)}
function navUpdate(){document.getElementById('nav').innerHTML=[['home','home','หน้าแรก'],['learn','book','เรียน'],['mis','alert','ผิดบ่อย'],['stats','chart','สถิติ']].map(([t,i,n])=>`<button class="${tab===t?'on':''}" onclick="goTab('${t}')"><span>${ic(P[i],24)}</span>${n}</button>`).join('')}
function homeHtml(){const t=M.days[dstr(new Date())]||0,g=M.goal,n=streak(),C=2*Math.PI*34,f=Math.min(1,t/g),ic={a:'あ',k:'漢',w:'語',v:'文'};
 const sts=Object.keys(DS).map(k=>[k,dsStat(k)]),due=sts.reduce((a,x)=>a+x[1].due,0);
 return `<div class="hero"><div class="ring"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" class="rb"/><circle cx="40" cy="40" r="34" class="rf" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-f)}" transform="rotate(-90 40 40)"/></svg><div class="rt"><b>${t}</b>/${g}</div></div><div class="hm"><div class="hi">สวัสดีค่ะ</div><div class="hs">${IC.flame} ต่อเนื่อง ${n} วัน</div><div class="hs">${t>=g?'ครบเป้าวันนี้แล้ว '+IC.check:'อีก '+(g-t)+' ข้อถึงเป้าวันนี้'}</div></div></div>${petHtml()}<button class="big" onclick="resume()">${due>0?'ทบทวน '+due+' ข้อที่ถึงเวลา':'เรียนต่อ'} →</button><h2>เส้นทางเรียน</h2>${pathHtml(sts)}`}
function render(){const a=document.getElementById('app');if(!(M.pet&&M.pet.name)){a.innerHTML=cloudOb?cloudObHtml():obHtml();document.getElementById('nav').innerHTML='';return}if(tab==='home')a.innerHTML=homeHtml();else if(tab==='stats')a.innerHTML=statsHtml();else if(tab==='mis')renderMis();else if(view==='d')renderDlg();else if(view==='n5')renderLv();else if(view==='g')renderGrammar();else if(view==='gl')renderGL();else renderLearn();navUpdate()}
