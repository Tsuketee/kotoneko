// ฝึกเขียน: ช่องเขียน, ลายเส้นแนะนำ (KanjiVG), วาดด้วยนิ้ว/Apple Pencil, ยางลบ
const CELLS=[{m:.3,n:1,ar:1},{m:.3,n:1,ar:1},{m:.3,n:1,ar:1},{m:.3,n:1},{m:.3},{m:.3},{m:.3},{m:.3},{},{},{},{},{},{},{},{}];
function cellSvg(ch,sp){if(!guide||!sp.m)return'';const d=SV[ch];
 if(!d)return `<div class="gd" style="opacity:${sp.m};font-size:70px">${ch}</div>`;
 let s=`<svg viewBox="0 0 109 109"${sp.ar?' data-ar="1"':''} style="color:var(--fg)">`;
 d.s.forEach((p,i)=>{s+=`<path d="${p}" data-i="${i}" fill="none" stroke="currentColor" stroke-opacity="${sp.m}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`});
 if(sp.n)d.n.forEach((n,i)=>{s+=`<text x="${n[0]}" y="${n[1]}" font-size="10" font-weight="700" font-family="sans-serif" fill="currentColor" fill-opacity=".7">${i+1}</text>`});
 return s+'</svg>'}
function addArrows(){document.querySelectorAll('svg[data-ar] path[data-i]').forEach(p=>{const L=p.getTotalLength(),e=p.getPointAtLength(L),b=p.getPointAtLength(Math.max(0,L-5)),s=p.getPointAtLength(0),a=Math.atan2(e.y-b.y,e.x-b.x)*180/Math.PI;p.ownerSVGElement.insertAdjacentHTML('beforeend',`<circle cx="${s.x}" cy="${s.y}" r="2" fill="currentColor" fill-opacity=".7"/><polygon points="0,0 -6,-3.2 -6,3.2" transform="translate(${e.x},${e.y}) rotate(${a})" fill="currentColor" fill-opacity=".7"/>`)})}
function draw(c,i){const g=c.getContext('2d');g.clearRect(0,0,200,200);g.lineWidth=7;g.lineCap=g.lineJoin='round';g.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--fg')||'#222';
 (st[i]||[]).forEach(s=>{g.beginPath();g.moveTo(s[0][0],s[0][1]);if(s.length===1)g.lineTo(s[0][0]+.1,s[0][1]);else{for(let k=1;k<s.length-1;k++)g.quadraticCurveTo(s[k][0],s[k][1],(s[k][0]+s[k+1][0])/2,(s[k][1]+s[k+1][1])/2);g.lineTo(s[s.length-1][0],s[s.length-1][1])}g.stroke()});
 if(ep&&ep.i===i){g.beginPath();g.lineWidth=1.5;g.strokeStyle='#e0952f';g.arc(ep.x,ep.y,esz,0,7);g.stroke()}}
function hit(s,p,r){for(let k=0;k<s.length;k++){const a=s[k],b=s[k+1]||a,dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy;let t=l?((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l:0;t=Math.max(0,Math.min(1,t));if(Math.hypot(a[0]+t*dx-p[0],a[1]+t*dy-p[1])<=r)return true}return false}
function erase(i,p){st[i]=(st[i]||[]).filter(s=>!hit(s,p,esz))}
function initCv(){const sh=document.querySelector('.sheet'),cv=[...document.querySelectorAll('canvas[data-c]')];if(!sh)return;
 let d=null,R=[],t0=0,cc=-1,lp=null,raf=0;const dirty=new Set();
 const loc=(k,x,y)=>[(x-R[k].left)*200/R[k].width,(y-R[k].top)*200/R[k].height];
 const cellOf=(x,y)=>{const p=R[1].left-R[0].left,q=R[4].top-R[0].top;return Math.max(0,Math.min(3,Math.floor((y-R[0].top)/q)))*4+Math.max(0,Math.min(3,Math.floor((x-R[0].left)/p)))};
 const flush=()=>{raf=0;dirty.forEach(k=>draw(cv[k],k));dirty.clear()};
 const sched=()=>{if(!raf)raf=requestAnimationFrame(flush)};
 const add=(x,y)=>{const n=cellOf(x,y);
  if(tool==='er'){const l=loc(n,x,y);ep={i:n,x:l[0],y:l[1]};cv.forEach((c,k)=>{const rp=esz*R[k].width/200;if(x>=R[k].left-rp&&x<=R[k].right+rp&&y>=R[k].top-rp&&y<=R[k].bottom+rp){erase(k,loc(k,x,y));dirty.add(k)}});dirty.add(n);return}
  if(n!==cc){if(cc>=0){const a=st[cc];if(a&&a.length)a[a.length-1].push(loc(cc,x,y));dirty.add(cc)}
   cc=n;(st[n]=st[n]||[]).push([loc(n,lp[0],lp[1]),loc(n,x,y)]);dirty.add(n)}
  else{const s=st[n][st[n].length-1],p=loc(n,x,y),l=s[s.length-1];if(Math.abs(p[0]-l[0])+Math.abs(p[1]-l[1])>.4){s.push(p);dirty.add(n)}}
  lp=[x,y]};
 sh.onpointerdown=e=>{if(e.pointerType==='touch')return;e.preventDefault();R=cv.map(c=>c.getBoundingClientRect());d=e.pointerId;t0=e.timeStamp;try{sh.setPointerCapture(d)}catch(x){}
  const n=cellOf(e.clientX,e.clientY);cc=n;lp=[e.clientX,e.clientY];
  if(tool==='er')add(e.clientX,e.clientY);else{(st[n]=st[n]||[]).push([loc(n,e.clientX,e.clientY)]);dirty.add(n)}sched()};
 sh.onpointermove=e=>{if(d!==e.pointerId)return;e.preventDefault();let ev=e.getCoalescedEvents?e.getCoalescedEvents().filter(x=>x.timeStamp>=t0-1&&(x.pressure>0||x.buttons>0)):[];if(!ev.length)ev=[e];ev.forEach(x=>add(x.clientX,x.clientY));sched()};
 sh.onpointerup=sh.onpointercancel=sh.onlostpointercapture=e=>{if(d===e.pointerId){d=null;ep=null;cv.forEach((c,k)=>dirty.add(k));sched()}};
 sh.oncontextmenu=e=>e.preventDefault();sh.onselectstart=e=>e.preventDefault();sh.ondragstart=e=>e.preventDefault();document.onselectstart=e=>e.preventDefault();
 cv.forEach((c,k)=>draw(c,k));addArrows()}
function undo(){if(st[lc])st[lc].pop();render()}
