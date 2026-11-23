// ตั้งค่าครั้งแรก (onboarding): เลือกสัตว์เลี้ยง ชื่อ ระดับ เหตุผล และเป้าหมายต่อวัน · แยกจาก js/pet.js (ถอนวัชพืชข้อ 13)
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
