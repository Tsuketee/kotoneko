// บทสนทนา: ฟุริงะนะ/โรมะจิ, ตัวละคร, หน้าอ่านบทสนทนา
const rb=s=>s.replace(/\{([^|}]*)\|([^}]*)\}/g,fur?'<ruby>$1<rt>$2</rt></ruby>':'$1');
let di=0,rom=true;const DIMG={};
const AVC=['#c9674f','#c98a2c','#5c8f70','#5a82a6','#8a77a8','#b9708c','#4f9494','#a07a56'];
const avc=n=>{let s=0;for(const c of n)s=(s*31+c.charCodeAt(0))%97;return AVC[s%AVC.length]};
const dpl=s=>s.replace(/\{([^|}]*)\|[^}]*\}/g,'$1');
const sp2=t=>{const m=t.match(/(^|[^0-9A-Za-z])([A-Za-z].*)$/);return m?[t.slice(0,t.length-m[2].length).trim(),m[2].trim()]:[t,'']};
function dgo(n){di=Math.max(0,Math.min(D.length-1,n));dl=D[di].l;render();window.scrollTo(0,0)}
function renderDlg(){const g=D[di],ls=[...new Set(D.map(x=>x.l))].sort((a,b)=>a-b),same=D.map((x,i)=>x.l===g.l?i:-1).filter(i=>i>=0),pos=same.indexOf(di)+1,names=[];
 g.turns.forEach(t=>{const n=dpl(t[0]);if(!names.includes(n))names.push(n)});
 const bub=g.turns.map(t=>{const n=dpl(t[0]),R=names.length<=2&&names.indexOf(n)===1,[jp,ro]=sp2(t[1]);return `<div class="dr${R?' r':''}"><div class="av" style="background:${avc(n)}">${n[0]}</div><div><div class="dn">${rb(t[0])}</div><div class="db"><div class="dj">${rb(jp)}</div>${rom&&ro?`<div class="dro">${ro}</div>`:''}</div></div></div>`}).join('');
 const img=DIMG[g.l+'-'+g.p],done=M.pet&&M.pet.d&&M.pet.d.date===dstr(new Date())&&M.pet.d.r.includes(di);
 document.getElementById('app').innerHTML=NAV()+`<div class="row" style="margin-top:6px"><select onchange="dgo(D.findIndex(x=>x.l===+this.value))">${ls.map(l=>`<option value="${l}"${l===g.l?' selected':''}>${DT[l]||'บทที่ '+l}</option>`).join('')}</select><div class="seg"><button class="${fur?'on':''}" onclick="fur=!fur;render()">ふりがな</button></div><div class="seg"><button class="${rom?'on':''}" onclick="rom=!rom;render()">Romaji</button></div></div>
 <div class="st" style="margin-top:8px">บทสนทนาที่ ${pos} / ${same.length} ของบทนี้ · ${g.t||''}</div>
 <div class="dimg">${img?`<img src="${img}" alt="">`:''}<div class="dcast">${names.map(n=>`<span><i class="av s" style="background:${avc(n)}">${n[0]}</i>${n}</span>`).join('')}</div></div>
 ${bub}${done?`<div class="st" style="text-align:center">${icx('ok',16,'ok-i')} อ่านแล้ววันนี้</div>`:`<button class="lk" style="display:block;margin:10px auto" onclick="pdd(${di})">อ่านจบแล้ว ${icx('check',16)} (นับเป็นภารกิจ)</button>`}
 <div class="dnav"><button ${di?'':'disabled'} onclick="dgo(di-1)">← ก่อนหน้า</button><button ${di<D.length-1?'':'disabled'} onclick="dgo(di+1)">ถัดไป →</button></div>`}
