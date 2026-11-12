// ไวยากรณ์: รายการบทเรียน, หน้าบทเรียน (คำอธิบาย+ตัวอย่าง), แบบฝึกหัดเลือกคำตอบ, ความคืบหน้าแบบทบทวนเว้นระยะ
// ความคืบหน้าเก็บใน localStorage key 'kg1' รูปแบบ {เลขบท:{b,w,d,best}} เหมือนชุดข้อมูลอื่น (ใช้ srsNext จาก learn.js)
const GK=LKEY[LV].g; // N5 = 'kg1' · N4 = 'kg4' (ดู js/level.js)
let GS={};try{GS=JSON.parse(localStorage.getItem(GK)||'{}')}catch(e){GS={}}
function gsave(){try{localStorage.setItem(GK,JSON.stringify(GS))}catch(e){}}
function gstat(){let lr=0,due=0,seen=0;const n=Date.now();G.forEach(g=>{const r=GS[g.id];if(r){seen++;if(r.b>=MASTERY)lr++;if(r.d<=n)due++}});return{seen,lr,due,t:G.length}}
let gi=0,gq=null,gqi=0,gans=null,gscore=0;
const gpass=n=>n-1; // ผ่านเมื่อผิดได้ไม่เกิน 1 ข้อ
const gblank=s=>rb(s).replace('___','<span class="gb">＿＿＿</span>');
function gOpen(i){gi=i;gq=null;view='gl';render();window.scrollTo(0,0)}
function gBack(){gq=null;nv('g')}
function gstart(){gq=G[gi].qs.map(q=>({q:q.q,why:q.why,opts:sh(q.opts.map((t,i)=>({t,ok:i===0})))}));gqi=0;gans=null;gscore=0;render();window.scrollTo(0,0)}
function gpick(i){if(gans!==null)return;gans=i;const ok=gq[gqi].opts[i].ok;if(ok)gscore++;tick();if(ok)ptrack('rev');render()}
function gnext(){gqi++;gans=null;if(gqi>=gq.length)gfinish();render();window.scrollTo(0,0)}
function gfinish(){const g=G[gi],pass=gscore>=gpass(gq.length),nw=!GS[g.id];
 const s=srsNext(GS[g.id],pass);if(!pass)s.d=Date.now(); // บทที่ไม่ผ่านถือว่าถึงกำหนดทบทวนทันที ลองใหม่แล้วผ่านต้องนับ
 s.best=Math.max(gscore,(GS[g.id]&&GS[g.id].best)||0);GS[g.id]=s;gsave();if(nw)ptrack('neu')}
function ghead(g){return `<div class="gp">${g.s}</div>`}
function renderGrammar(){const st=gstat(),n=Date.now();
 const rows=G.map((g,i)=>{const r=GS[g.id],tag=!r?'ยังไม่ได้เรียน':r.d<=n?'ถึงเวลาทบทวน':r.b>=MASTERY?'จำได้แม่น':'กำลังเรียน';
  return `<div class="pc" onclick="gOpen(${i})"><div class="pn">${g.id}</div><div class="pb"><b>${rb(g.t)}</b><div class="gp">${g.s}</div><div class="st">${tag}${r&&r.best!=null?' · ทำได้ '+r.best+'/'+g.qs.length:''}</div></div></div>`}).join('');
 document.getElementById('app').innerHTML=NAV()+`<div class="st">${st.lr}/${st.t} บทจำได้แม่น${st.due?' · ทบทวน '+st.due+' บท':''} · เนื้อหาเขียนเอง</div><div class="bar"><i style="width:${st.t?st.lr/st.t*100:0}%"></i></div><div class="path" style="margin-top:14px">${rows}</div>`}
function renderGL(){const g=G[gi];let h=NAV();
 if(!gq){
  h+=`<div class="row" style="margin-top:6px"><div class="seg"><button class="${fur?'on':''}" onclick="fur=!fur;render()">ふりがな</button></div></div>${ghead(g)}<h1 style="font-size:20px">บทที่ ${g.id} ${rb(g.t)}</h1>`;
  g.notes.forEach(t=>{h+=`<p class="gn">${rb(t)}</p>`});
  h+=`<div class="ex"><div class="exh">ตัวอย่างประโยค (แตะเพื่อฟังเสียง)</div>${g.ex.map(e=>`<div class="er ge" data-t="${dpl(e[0]).replace(/"/g,'')}" onclick="speak(this.dataset.t)"><span class="ew">${rb(e[0])}</span><span class="ed">${e[1]}</span></div>`).join('')}</div>`;
  h+=`<button class="lk" style="display:block;margin:18px auto" onclick="gstart()">ลองทำแบบฝึกหัด (${g.qs.length} ข้อ) →</button>`;
  h+=`<div class="dnav"><button ${gi?'':'disabled'} onclick="gOpen(gi-1)">← บทก่อนหน้า</button><button ${gi<G.length-1?'':'disabled'} onclick="gOpen(gi+1)">บทถัดไป →</button></div>`}
 else if(gqi<gq.length){const q=gq[gqi];
  h+=`<div class="st" style="margin-top:6px">${g.t.replace(/\{([^|}]*)\|[^}]*\}/g,'$1')} · ข้อ ${gqi+1}/${gq.length}</div><div class="bar"><i style="width:${gqi/gq.length*100}%"></i></div>
  <div class="card" style="min-height:0"><div class="k gq">${gblank(q.q)}</div><div class="ch">${q.opts.map((o,i)=>`<button class="${gans===null?'':o.ok?'r':gans===i?'w':''}" onclick="gpick(${i})">${rb(o.t)}</button>`).join('')}</div>
  ${gans!==null?`<div class="d gw">${q.opts[gans].ok?icx('ok',18,'ok-i')+' <b>ถูกต้อง!</b> ':icx('no',18,'no-i')+' <b>ยังไม่ถูก</b> '}${rb(q.why)}</div><div class="btns"><button class="nx" onclick="gnext()">${gqi+1<gq.length?'ข้อต่อไป':'ดูผล'}</button></div>`:''}</div>`}
 else{const pass=gscore>=gpass(gq.length),r=GS[g.id];
  h+=`<div class="card" style="min-height:0"><div class="k">${pass?icx('sparkle',44,'hl-i big'):icx('sprout',44,'ok-i big')}</div><div class="d"><b>${gscore}/${gq.length} ข้อ</b><br>${pass?'ผ่านแล้ว!':'เกือบแล้ว ทบทวนบทเรียนแล้วลองใหม่นะ'}</div>
  <div class="st" style="margin-top:8px">${pass&&r?(r.b>=MASTERY?'จำได้แม่นแล้ว':'ขั้นการทบทวน '+r.b+'/'+(IV.length-1))+' · ทบทวนอีกครั้งใน '+gnextTxt(r.d):'ต้องตอบถูกอย่างน้อย '+gpass(gq.length)+' ข้อ'}</div>
  <div class="btns"><button onclick="gq=null;render()">อ่านบทเรียน</button><button class="g" onclick="gstart()">ทำอีกครั้ง</button></div>
  ${gi<G.length-1?`<button class="lk" style="display:block;margin:14px auto 0" onclick="gOpen(gi+1)">บทถัดไป →</button>`:''}</div>`}
 document.getElementById('app').innerHTML=h}
function gnextTxt(d){const m=Math.max(0,d-Date.now())/6e4;return m<2?'ไม่กี่นาที':m<90?Math.round(m)+' นาที':m<2880?Math.round(m/60)+' ชั่วโมง':Math.round(m/1440)+' วัน'}
