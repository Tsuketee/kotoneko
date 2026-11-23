// หน้าผิดบ่อย (tab mis) · แยกจาก js/learn.js (ถอนวัชพืชข้อ 14)
function allMis(){const o=[];for(const k in DS){const s=readJSON(DS[k].key,{})||{};DS[k].d.forEach(x=>{const r=s[x.k];if(r&&r.w>=1)o.push({k,x,w:r.w})})}return o.sort((a,b)=>b.w-a.w)}
function renderMis(){const L=allMis();let h=progHead()+`<div class="st" style="margin-top:12px">รวมทุกแท็บ · ผิดตั้งแต่ 2 ครั้งถือว่าผิดบ่อย · ตอบถูกต่อเนื่องแล้วจะหลุดจากรายการเอง</div>`;
 if(!L.length)h+=`<div class="card" style="margin-top:12px"><div class="k">${ic(P.star,72)}</div><div class="d">ยังไม่มีข้อที่ตอบผิด<br>ไปฝึกก่อนแล้วกลับมาดูนะคะ</div></div>`;
 else{const bs=Object.keys(DN).filter(k=>L.some(o=>o.k===k&&o.w>=2));
  if(bs.length)h+=`<div class="btns" style="margin:12px 0;flex-wrap:wrap">${bs.map(k=>`<button onclick="goMis('${k}')">ฝึก${DN[k]} (${L.filter(o=>o.k===k&&o.w>=2).length})</button>`).join('')}</div>`;
  h+=`<div class="card" style="text-align:left;min-height:0;padding:6px 14px;margin-top:12px">${L.slice(0,50).map(o=>`<div class="mi" data-testid="mistake-item"><span class="mk">${o.x.k}</span><span class="mt"><b>${rd(o.x)}</b><br>${o.x.m}</span><span class="mw">ผิด ${o.w}</span></div>`).join('')}</div>`}
 document.getElementById('app').innerHTML=h}
function goMis(k){tab='learn';nv(k);mode='card';cat='ผิดบ่อย';go()}
