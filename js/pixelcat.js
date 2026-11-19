// แมวพิกเซล (สัตว์เลี้ยงตัวแรก) · แยกจากร่าง docs/pixel-cat10.html — เอนจินวาด + ตัวควบคุมฉากห้อง 160×90
// ห่อใน IIFE เพื่อไม่ให้ชื่อตัวแปรชนกับสคริปต์อื่น (classic script ใช้ global ร่วมกัน) · ส่งออกเฉพาะ window.PixelCat
// ใช้: PixelCat.mount(canvas, {coat, acc, place, stage, trait, onTip}) · PixelCat.act('happy', 1800) · PixelCat.cue(...) · PixelCat.unmount()
// ถ้าแก้เอนจินที่ร่าง docs/pixel-cat10.html ให้พอร์ตมาที่นี่ด้วย (ดู docs/PET_PIXEL.md)
(function(){
const W=48,H=48;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
// ---------- รูปทรงแบบระยะห่าง (SDF) ทำให้ขอบโค้งมนและหลอมรวมกันนุ่มๆ ----------
const sdEll=(px,py,cx,cy,rx,ry)=>{const x=px-cx,y=py-cy,k0=Math.hypot(x/rx,y/ry),k1=Math.hypot(x/(rx*rx),y/(ry*ry));return k1<1e-6?-Math.min(rx,ry):k0*(k0-1)/k1};
const sdCap=(px,py,ax,ay,bx,by,ra,rb)=>{const pax=px-ax,pay=py-ay,bax=bx-ax,bay=by-ay,h=clamp((pax*bax+pay*bay)/(bax*bax+bay*bay||1),0,1);return Math.hypot(pax-bax*h,pay-bay*h)-(ra+(rb-ra)*h)};
const sdTri=(px,py,a,b,c)=>{const e0=[b[0]-a[0],b[1]-a[1]],e1=[c[0]-b[0],c[1]-b[1]],e2=[a[0]-c[0],a[1]-c[1]],v0=[px-a[0],py-a[1]],v1=[px-b[0],py-b[1]],v2=[px-c[0],py-c[1]];
 const pq=(v,e)=>{const h=clamp((v[0]*e[0]+v[1]*e[1])/(e[0]*e[0]+e[1]*e[1]),0,1);return[v[0]-e[0]*h,v[1]-e[1]*h]};
 const q0=pq(v0,e0),q1=pq(v1,e1),q2=pq(v2,e2),s=Math.sign(e0[0]*e2[1]-e0[1]*e2[0]);
 const d=[[q0[0]**2+q0[1]**2,s*(v0[0]*e0[1]-v0[1]*e0[0])],[q1[0]**2+q1[1]**2,s*(v1[0]*e1[1]-v1[1]*e1[0])],[q2[0]**2+q2[1]**2,s*(v2[0]*e2[1]-v2[1]*e2[0])]];
 const m=[Math.min(d[0][0],d[1][0],d[2][0]),Math.min(d[0][1],d[1][1],d[2][1])];return -Math.sqrt(m[0])*Math.sign(m[1])};
const smin=(a,b,k)=>{const h=clamp(.5+.5*(b-a)/k,0,1);return b+(a-b)*h-k*h*(1-h)};
const ear=(px,py,a,b,c,r=1.3)=>sdTri(px,py,a,b,c)-r;
function spline(P,n=8){const o=[];for(let i=0;i<P.length-1;i++){const p0=P[i-1]||P[i],p1=P[i],p2=P[i+1],p3=P[i+2]||P[i+1];for(let k=0;k<n;k++){const t=k/n,t2=t*t,t3=t2*t;o.push([0,1].map(j=>.5*(2*p1[j]+(-p0[j]+p2[j])*t+(2*p0[j]-5*p1[j]+4*p2[j]-p3[j])*t2+(-p0[j]+3*p1[j]-3*p2[j]+p3[j])*t3)))}}o.push(P[P.length-1]);return o}
// หางเรียว: เส้นโค้งเรียบ ความหนาค่อยๆ เล็กลงถึงปลาย ปลายหางสีครีม
function tail(ctrl,r0,r1,z,o={}){const pts=spline(ctrl,8),L=[0];for(let i=1;i<pts.length;i++)L.push(L[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));const T=L[L.length-1];
 const near=(x,y)=>{let best=1e9,bu=0;for(let i=0;i<pts.length-1;i++){const[ax,ay]=pts[i],[bx,by]=pts[i+1],ra=r0+(r1-r0)*L[i]/T,rb=r0+(r1-r0)*L[i+1]/T,bax=bx-ax,bay=by-ay,pax=x-ax,pay=y-ay,h=clamp((pax*bax+pay*bay)/(bax*bax+bay*bay||1),0,1),d=Math.hypot(pax-bax*h,pay-bay*h)-(ra+(rb-ra)*h);if(d<best){best=d;bu=(L[i]+(L[i+1]-L[i])*h)/T}}return[best,bu]};
 return{z,R:r0+.4,sdf:(x,y)=>near(x,y)[0],mat:(x,y)=>{const u=near(x,y)[1];return u>(o.tip??.78)?P('tip'):P('tail',fr(u*6.5+.1)<.36)},contour:o.contour??((x,y)=>near(x,y)[1]<(o.base??.32)?false:SOFT),name:'tail'}}
// ---------- สี ----------
const RAMP={cream:['#fffbf5','#fff0de','#f4ddc4','#e7c6a6','#d4ab88'],belly:['#ffffff','#fff8f0','#f7e8d6','#ecd5bb','#d9b897'],orange:['#f8b983','#ee9c5e','#dd864c','#c66f3c','#a95a2e'],pink:['#fac6bf','#f5aaa3','#ec928b','#dc7c77','#c56a65']};
let INK,SOFT,SHADOW,DUST;const EYE='#3a2a22',BLUSH='#f6a39d',NOSE='#ec8b86',FX='#9d8069',HEART='#ef7d92';
// เส้นขอบ/เงาแยกตามโหมด: โหมดมืดใช้เส้นขอบสีอ่อน (คอนทราสต์ 8.2:1 บนพื้น #2b241f; เส้นเดิมได้แค่ 1.4:1)
const THEMES={light:{INK:'#4f372b',SOFT:'#86604c',SHADOW:'rgba(90,58,38,.14)',DUST:'#dcc8b0'},dark:{INK:'#d8b898',SOFT:'#a98563',SHADOW:'rgba(0,0,0,.38)',DUST:'#6f5d4d'}};
const applyTheme=t=>{({INK,SOFT,SHADOW,DUST}=THEMES[t])};applyTheme('light');
// ---------- ลายขน: แต่ละแบบบอกว่า "ช่อง" ไหนของตัวใช้ชุดสีใด (อ้างอิงลายของแมวจริง) ----------
Object.assign(RAMP,{
 white:['#ffffff','#f9f6f2','#ece6df','#dad1c7','#c2b6aa'],
 black:['#625d6e','#4a4656','#3a3745','#2d2a36','#211f28'],
 fawn:['#fdf6ec','#f3e6d5','#e6d3bc','#d5bea2','#c0a587'],
 seal:['#8c7262','#745c4d','#604b3f','#4c3b32','#3b2e27'],
 tabby:['#fbbf86','#f3a462','#e58e4b','#cf793b','#b0622e'],
 tabbyS:['#d97a3c','#c4672e','#b05726','#974820','#7c3b1a'],
 silver:['#e8eaee','#d3d7de','#bcc1cb','#a4aab6','#8a909e'],
 silverS:['#7a8190','#656c7a','#545a67','#444955','#353944'],
 korat:['#c3cad6','#a8b1c0','#919bac','#7b8597','#656f82'],
 pinkD:['#d6a3a5','#c38e92','#ac7b80','#93686e','#7a565c']});
// ช่องที่มี: fur ขนหลัก, patch แต้มขวา, patchL แต้มซ้าย, earR/earL หูนอก, inner ในหูและฝ่าเท้า, mask หน้ากาก,
// under อกและท้อง, paw อุ้งเท้า, limb ขา (ท่านอนหงาย มือแตะแก้ม), tail หาง, tip ปลายหาง, stripe สีลายเสือ, eye สีตา
const COATS={
 cream:{name:'ครีมแต้มส้ม',fur:'cream',patch:'orange',earR:'orange',tail:'orange',tip:'cream',under:'belly',paw:'belly'},
 orange:{name:'ส้มลายเสือ',fur:'tabby',stripe:'tabbyS',under:'cream',paw:'cream'},
 silver:{name:'เทาลายเสือ',fur:'silver',stripe:'silverS',under:'white',paw:'white',eye:'#7fae5b'},
 white:{name:'ขาวล้วน',fur:'white',under:'belly',paw:'white'},
 black:{name:'ดำล้วน',fur:'black',inner:'pinkD',eye:'#f2d55e'},
 tuxedo:{name:'ขาวดำ',fur:'black',under:'white',paw:'white',mask:'white',maskShape:'muzzle',inner:'pinkD',eye:'#d5e36c'},
 siamese:{name:'วิเชียรมาศ',fur:'fawn',ear:'seal',earRim:true,mask:'seal',maskShape:'point',paw:'seal',limb:'seal',tail:'seal',inner:'pinkD',eye:'#5aa2e6'},
 calico:{name:'สามสี',fur:'white',patch:'orange',patchL:'black',earR:'orange',earL:'black',earRim:true,tail:'black',under:'white',paw:'white'},
 korat:{name:'สีสวาด',fur:'korat',inner:'pinkD',eye:'#93c96b'}};
let CO=COATS.cream;
const fr=v=>v-Math.floor(v);
// ช่อง → ชุดสี ตามลายขนปัจจุบัน (st = จุดนี้อยู่บนแถบลายเสือ ใช้ได้กับขนหลัก แต้ม และหาง)
const P=(slot,st)=>{if(st&&CO.stripe&&(slot==='fur'||slot==='patch'||slot==='patchL'||slot==='tail'))return CO.stripe;
 switch(slot){case'patch':return CO.patch||CO.fur;case'patchL':return CO.patchL||CO.fur;case'earR':return CO.earR||CO.ear||CO.fur;case'earL':return CO.earL||CO.ear||CO.fur;
 case'tail':return CO.tail||CO.fur;case'tip':return CO.tip||CO.tail||CO.fur;case'under':return CO.under||CO.fur;case'paw':return CO.paw||CO.under||CO.fur;
 case'limb':return CO.limb||CO.fur;case'inner':return CO.inner||'pink';default:return CO.fur}};
// วัสดุของหัว: ในหู → หูนอก → หน้ากาก → ลายหน้าผาก/แก้ม → แต้มขวา/ซ้าย → ขนหลัก (u,v = พิกัดหัวตั้งตรง)
function headMat(u,v,hx,hy,E,pt){
 if(sdTri(u,v,...E.li)<0||sdTri(u,v,...E.ri)<0)return P('inner');
 const rim=CO.earRim?.9:-.2; // earRim: หูทั้งใบรวมขอบเป็นสีหู (วิเชียรมาศ สามสี)
 if(sdTri(u,v,...E.ro)<rim)return P('earR');
 if(sdTri(u,v,...E.lo)<rim)return P('earL');
 if(CO.mask){const m=CO.maskShape==='point'?sdEll(u,v,hx,hy+2.4,7.6,5.6):Math.min(sdEll(u,v,hx,hy+4.6,4.8,3.2),sdBox(u,v,hx,hy-.6,1.1,3.6,.6));if(m<0)return CO.mask}
 if(CO.stripe){const brow=v>hy-9.6&&v<hy-5.6&&[-2.6,0,2.6].some(o=>Math.abs(u-hx-o)<.55),cheek=Math.abs(u-hx)>8.8&&[1.2,3.2].some(o=>Math.abs(v-hy-o)<.5);if(brow||cheek)return CO.stripe}
 if(sdEll(u,v,...pt)<0)return P('patch');
 if(sdEll(u,v,2*hx-pt[0],pt[1],pt[2],pt[3])<0)return P('patchL');
 return CO.fur}
// ตาสีตามลาย และเส้นหน้า (ปาก ตาปิด คิ้ว) เปลี่ยนเป็นสีอ่อนเองเมื่ออยู่บนขนสีเข้ม
const IRIS='iris',LINE_L='#ddd3e3';
// ขอบแขน/อุ้งเท้าบนขนสีเข้ม (ดำ): ใช้ขั้นสว่างสุดของชุดสี ไม่ให้จมหายไปกับตัว
const darkRamp=r=>lumHex(RAMP[r][2])<.06,edge=slot=>darkRamp(P(slot))?RAMP[P(slot)][0]:null;
const lumHex=h=>{if(!h||h[0]!=='#')return 1;const c=[1,3,5].map(i=>{const v=parseInt(h.slice(i,i+2),16)/255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4});return .2126*c[0]+.7152*c[1]+.0722*c[2]};
let ACC='none',IDLE=null; // IDLE: ท่าย่อยชั่วครู่ (blink กะพริบ, twitch หูกระดิก, flick สะบัดหาง)
const L3=(()=>{const v=[-.5,-.72,.62],n=Math.hypot(...v);return v.map(a=>a/n)})();
// ---------- ตัววาด: เลือกชิ้นที่อยู่บนสุด ลงเงานูน เงาตกกระทบ เส้นขอบเลือกสี ----------
function render(pose){
 const parts=pose.parts.slice().sort((a,b)=>a.z-b.z),top=Array.from({length:H},()=>Array(W).fill(-1)),out=Array.from({length:H},()=>Array(W).fill(null));
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)for(let i=parts.length-1;i>=0;i--)if(parts[i].sdf(x+.5,y+.5)<0){top[y][x]=i;break}
 if(pose.shadow){const[cx,cy,rx,ry]=pose.shadow;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(top[y][x]<0&&((x+.5-cx)/rx)**2+((y+.5-cy)/ry)**2<=1)out[y][x]=SHADOW}
 const LV=Array.from({length:H},()=>Array(W).fill(-1));
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=top[y][x];if(i<0)continue;const p=parts[i],cx=x+.5,cy=y+.5,d=p.sdf(cx,cy);
  let gx=p.sdf(cx+.5,cy)-p.sdf(cx-.5,cy),gy=p.sdf(cx,cy+.5)-p.sdf(cx,cy-.5);const gl=Math.hypot(gx,gy)||1;gx/=gl;gy/=gl;
  const s=clamp(1+d/p.R,0,1),nz=Math.sqrt(1-s*s),lum=gx*s*L3[0]+gy*s*L3[1]+nz*L3[2];
  let lv=lum>.9?0:lum>.56?1:lum>.22?2:3;
  if((y>0&&top[y-1][x]>i&&parts[top[y-1][x]].shade!==false)||(y>1&&top[y-2][x]>i&&parts[top[y-2][x]].cast!==false))lv++; // เงาจากชิ้นที่ทับอยู่ด้านบน
  if(pose.ground&&y>=pose.ground-1&&(p.ground!==false))lv++; // เงาใกล้พื้น
  if(p.dim)lv+=p.dim; // ชิ้นที่อยู่ไกล (ขาฝั่งไกลในท่ามุมข้าง) เข้มลงให้เห็นความลึก
  LV[y][x]=Math.min(3,lv)}
 // ลบจุดเงาเดี่ยวที่ดูเป็นฝุ่น
 for(let pass=0;pass<2;pass++)for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=top[y][x];if(i<0)continue;const n=[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>top[y+dy][x+dx]===i).map(([dx,dy])=>LV[y+dy][x+dx]);
  if(n.length>=3&&!n.includes(LV[y][x])){const c={};n.forEach(v=>c[v]=(c[v]||0)+1);const best=+Object.keys(c).sort((a,b)=>c[b]-c[a])[0];if(c[best]>=3||n.length===3&&c[best]>=2)LV[y][x]=best}}
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=top[y][x];if(i<0)continue;const p=parts[i],ramp=p.mat?p.mat(x+.5,y+.5):p.ramp||'cream';let col=RAMP[ramp][LV[y][x]];
  const cc=typeof p.contour==='function'?p.contour(x+.5,y+.5):p.contour;
  if(cc!==false)for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){if(p.skipUp&&dy===-1)continue;const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const q=top[Y][X];if(q>=0&&parts[q].z<p.z){col=cc||RAMP[ramp][p.cIdx??4];break}}
  out[y][x]=col}
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(top[y][x]>=0)continue;let lit=false,dark=false;
  for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=H||top[Y][X]<0)continue;if(dy===1||dx===1)lit=true;else dark=true}
  if(lit||dark)out[y][x]=dark?INK:SOFT}
 const base=out.map(r=>r.slice());
 (pose.decals||[]).forEach(([x,y,c])=>{x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=W||y>=H)return;const dk=lumHex(base[y][x])<.09;
  if(c===IRIS)c=CO.eye||(dk?LINE_L:EYE);else if(c===EYE&&dk)c=LINE_L;out[y][x]=c});
 return out}
// ---------- หน้าตา ----------
const D=[];const put=(a,x,y,pts,c)=>pts.forEach(([u,v])=>a.push([x+u,y+v,c]));
const eyeClosed=(a,x,y)=>put(a,x,y,[[0,0],[1,1],[2,1],[3,0]],EYE);           // ‿ หลับสบาย
const eyeDash=(a,x,y,h=2)=>put(a,x,y,h===2?[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]]:[[0,0],[1,0],[2,0]],EYE); // ขีด
const eyeSleepy=(a,x,y)=>put(a,x,y,[[0,0],[1,0],[2,0],[3,0],[1,1],[2,1]],EYE); // ตาปรือ
const eyeHappy=(a,x,y)=>put(a,x,y,[[0,1],[1,0],[2,0],[3,1]],EYE);            // ⌒ ยิ้มตาปิด
const mouth=(a,x,y)=>{put(a,x,y,[[0,0],[1,1],[2,0],[3,1],[4,0]],EYE);a.push([x+2,y-1,NOSE])}; // ω + จมูก
const blush=(a,x,y)=>put(a,x,y,[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]],BLUSH);
const zz=(a,x,y,big)=>put(a,x,y,big?[[0,0],[1,0],[2,0],[3,0],[2,1],[1,2],[0,3],[1,3],[2,3],[3,3]]:[[0,0],[1,0],[2,0],[1,1],[0,2],[1,2],[2,2]],FX);
const heart=(a,x,y)=>put(a,x,y,[[1,0],[3,0],[0,1],[1,1],[2,1],[3,1],[4,1],[1,2],[2,2],[3,2],[2,3]],HEART);
// ---------- ท่าทาง ----------
// หัวท่านั่งที่เอียงและย่อ (ใช้กับท่านอน) พร้อมตัวช่วยวางหน้า A(dx,dy) และโบว์ที่หมุนตามหัว
function tiltHead(hx,hy,th,sc){const EL=earPts(hx,hy,IDLE==='twitchL'?.8:0,false),ER=earPts(hx,hy,IDLE==='twitchR'?.8:0,true);
 const T=(x,y)=>{const c=Math.cos(-th),s=Math.sin(-th),X=(x-hx)/sc,Y=(y-hy)/sc;return[hx+X*c-Y*s,hy+X*s+Y*c]};
 return{T,head:{z:2,R:7.5,sdf:(x,y)=>{const[u,v]=T(x,y);return sc*smin(sdEll(u,v,hx,hy,12.4,10),Math.min(ear(u,v,...EL.o),ear(u,v,...ER.o)),1.8)},
  mat:(x,y)=>{const[u,v]=T(x,y);return headMat(u,v,hx,hy,{lo:EL.o,ro:ER.o,li:EL.i,ri:ER.i},[hx+5.6,hy-7.6,5.6,3.6])}},
  A:(dx,dy)=>[Math.round(hx+sc*(dx*Math.cos(th)-dy*Math.sin(th))),Math.round(hy+sc*(dx*Math.sin(th)+dy*Math.cos(th)))],
  bow:()=>{const bp=bowPart(hx+7.4,hy-5.6,Math.atan2(5,7.8));return{...bp,sdf:(x,y)=>{const[u,v]=T(x,y);return sc*bp.sdf(u,v)}}}}}
// หน้าอิ่มใจ ⌒ ω ⌒ แก้มแดง (ท่ารัก)
const loveFace=(a,A)=>{eyeHappy(a,...A(-8.2,.4));eyeHappy(a,...A(4,.4));{const[nx,ny]=A(-.2,3.4);a.push([nx,ny,NOSE])}mouth(a,...A(-2.4,4.6));blush(a,...A(-11.6,3.2));blush(a,...A(8.6,3.2))};
const POSES={
 // นอนขดเป็นโดนัท: คางวางบนอุ้งเท้า หางพันมาปิดเท้า ท้องพองยุบ หูกระดิก
 curl(f){const br=[0,.45,.8,.45][f],tw=IDLE==='flick'?1:0,et=IDLE==='twitchR'?1:0,lt=IDLE==='twitchL'?1:0,hy=31+br*.25;const a=[];
  const LO=[[5.6,hy-3],[6.4-lt*1.4,hy-11.2+lt*1.6],[12.2,hy-6.4]],RO=[[17.4,hy-6.6],[22.6+et*1.4,hy-11.4+et*1.6],[23.6,hy-2.6]],LI=[[7.3,hy-4.4],[7.6-lt*1.2,hy-9.2+lt*1.4],[11,hy-6.4]],RI=[[18.9,hy-6.3],[21.8+et*1.2,hy-9.5+et*1.4],[22.3,hy-4.4]];
  const body={z:0,R:9,name:'body',sdf:(x,y)=>Math.max(smin(sdEll(x,y,28.5,33.6-br*.5,15,9.3+br*.5),sdEll(x,y,35,36,10.5,6.8),3),y-41.6),mat:(x,y)=>{const st=y<35&&fr(x/3.2)<.34;return sdEll(x,y,31,25.5,8,4.3)<0?P('patch',st):P('fur',st)}};
  const haunch={z:1,R:5,name:'haunch',ground:false,contour:null,cIdx:3,sdf:(x,y)=>Math.max(sdEll(x,y,35.6,35.8,6.6,5.3),body.sdf(x,y)+.6),mat:(x,y)=>{const d=Math.hypot((x-35.6)/1.1,y-35.8);return P('fur',d>1.3&&fr(d/2.4)<.36)}};
  const foot={z:1.5,R:2,sdf:(x,y)=>sdEll(x,y,30.8,40.3,2.6,1.6),mat:()=>P('paw'),contour:null};
  const paws={z:1.6,R:2,ground:false,sdf:(x,y)=>Math.max(Math.min(sdEll(x,y,12.8,39.9,2.8,2.2),sdEll(x,y,18.6,39.9,2.8,2.2)),y-41.6),mat:()=>P('paw'),contour:null};
  const head={z:2,R:7.5,name:'head',sdf:(x,y)=>smin(sdEll(x,y,15.2,hy,10.4,8.5),Math.min(ear(x,y,...LO),ear(x,y,...RO)),1.6),
   mat:(x,y)=>headMat(x,y,15.2,hy,{lo:LO,ro:RO,li:LI,ri:RI},[20,hy-6.4,5.4,3.6])};
  const tl=tail([[42.4,32.6],[45.4,36],[45.6,40.2],[42.6,43.8],[37.4,45.4],[31.4-tw*.8,45.2-tw*1.8]],2,1.3,3,{tip:.8,base:.16}); // ปลายหางกระตุกขึ้นตอนหลับ (นานๆ ที)
  put(a,8,hy+1,[[0,0],[1,0],[2,0],[3,0]],EYE);put(a,17,hy+1,[[0,0],[1,0],[2,0],[3,0]],EYE);a.push([15,hy+2.8,NOSE]);a.push([15,hy+3.8,EYE]);blush(a,6,hy+2.6);blush(a,21,hy+2.4);
  const t=f%4;zz(a,25+t,15-t,false);if(t>=2)zz(a,31,8,true);
  const parts=[body,haunch,foot,paws,head,tl];
  if(ACC==='scarf')parts.push({z:1.9,R:2.3,ground:false,sdf:(x,y)=>sdCap(x,y,23.2,hy-2.4,25.2,hy+6.6,2.4,2.4),ramp:'scarf',contour:RAMP.scarf[4]}); // ผ้าพันคอโผล่ที่คอหลังหัว
  if(ACC==='bow')parts.push(bowPart(20.5+et*.3,hy-4.6,.57,3,.9));
  return{parts,decals:a,shadow:[26,43.4,21,3],ground:42}},
 // หมอบแบบขนมปัง (ปรับ 2026-11-14): หัวทรงเดียวกับท่านั่ง วางต่ำบนตัวทรงขนมปังที่กว้างกว่าหัว เห็นสะโพกกลมสองข้างและอกสีอ่อน
 // อุ้งเท้าหน้าซุกโผล่แค่ปลาย หางโอบข้างตัวมาด้านหน้า ตาปรือ สัปหงกแล้วสะดุ้ง
 loaf(f){const nod=[0,.6,1.6,0][f],a=[],lt=IDLE==='twitchL'?1:0,rt=IDLE==='twitchR'?1:0,fl=IDLE==='flick'?1:0,hx=24,hy=25.2+nod,hyF=25+Math.round(nod);
  const EL=earPts(hx,hy,.05+lt*.8,false),ER=earPts(hx,hy,.05+rt*.8,true);
  const bodyS=(x,y)=>Math.max(sdBox(x,y,24,36.2,16.4,6.6,5.8),y-42.4);
  const body={z:0,R:9,sdf:bodyS,mat:(x,y)=>{const st=y<36&&Math.abs(x-24)>9&&fr(x/3.2+.3)<.34;return sdEll(x,y,36.4,31.6,5,3.6)<0?P('patch',st):P('fur',st)}};
  const hips={z:.5,R:5,ground:false,contour:null,cIdx:3,sdf:(x,y)=>Math.max(Math.min(sdEll(x,y,12.4,37.6,5.4,4.6),sdEll(x,y,35.6,37.6,5.4,4.6)),bodyS(x,y)+.4),
   mat:(x,y)=>{const c=x<24?12.4:35.6,d=Math.hypot((x-c)/1.15,y-37.6);return P('fur',d>1.5&&fr(d/2.4)<.38)}};
  const chest={z:1,R:5,ground:false,contour:false,sdf:(x,y)=>Math.max(sdEll(x,y,24,38.8,7.4,4.6),bodyS(x,y)+.5),mat:()=>P('under')};
  const paws={z:1.5,R:2,ground:false,contour:null,sdf:(x,y)=>Math.max(Math.min(sdEll(x,y,20.2,41.6,2.7,1.9),sdEll(x,y,27.8,41.6,2.7,1.9)),y-42.6),mat:()=>P('paw')};
  const head={z:2,R:8.5,sdf:(x,y)=>smin(sdEll(x,y,hx,hy,12.4,10),Math.min(ear(x,y,...EL.o),ear(x,y,...ER.o)),1.8),mat:(x,y)=>headMat(x,y,hx,hy,{lo:EL.o,ro:ER.o,li:EL.i,ri:ER.i},[hx+5.6,hy-7.6,5.6,3.6])};
  const tl=tail([[38.6,33.4],[41.6,36.6],[41.4,40.6],[38,43],[33.2-fl*.6,43.4-fl*1.8]],2,1.2,3,{tip:.78,base:.14});
  if(f===2){eyeClosed(a,16.8,hyF+1.4);eyeClosed(a,27.6,hyF+1.4)}else{eyeSleepy(a,16.8,hyF+1.2);eyeSleepy(a,27.6,hyF+1.2)}
  mouth(a,22,hyF+4.6);blush(a,13,hyF+3.4);blush(a,32,hyF+3.4);if(f===1||f===2)zz(a,39,6-f,false); // Zz ห่างจากปลายหู
  const parts=[body,hips,chest,paws,head,tl],sy=hy+10.4;
  if(ACC==='scarf')parts.push({z:1.9,R:2.4,ground:false,sdf:(x,y)=>sdCap(x,y,hx-8.6,sy-.4,hx+8.6,sy-.4,2.5,2.5),ramp:'scarf',contour:RAMP.scarf[4]},
   {z:1.95,R:2,ground:false,skipUp:true,sdf:(x,y)=>sdCap(x,y,hx+5.6,sy+.8,hx+7,sy+4.4,1.9,1.5),ramp:'scarf',contour:RAMP.scarf[4]});
  if(ACC==='bow')parts.push(bowPart(hx+7.4,hy-5.6,Math.atan2(5,7.8)));
  return{parts,decals:a,shadow:[24,43.6,19,2.6],ground:43}},
 // รัก ไว้ใจ (เจ้าของเลือก 2026-11-14 แทนท่านอนหงาย): นอนตะแคงโชว์พุง แก้มวางบนพื้นหันมาหาผู้ชม ขาหน้ายื่นใต้คาง ข้างหนึ่งนวดเบาๆ
 // ขาหลังเหยียด เห็นอุ้งเท้าชมพู หางตั้งแกว่งช้าๆ หน้า ⌒ ω ⌒ อิ่มใจ
 belly(f){const k=[0,1,0,-1][f],br=[0,.4,.7,.4][f],a=[],fl=IDLE==='flick'?1:0,w=(A,l)=>A*Math.sin(2*Math.PI*(f/4-l));
  const body={z:0,R:9,sdf:(x,y)=>Math.max(sdEll(x,y,28.4,37.2-br*.2,13.6,6.2+br*.2),y-43.4),
   mat:(x,y)=>{if(sdEll(x,y,28.6,40.6,9.8,3.4)<0)return P('under');const st=y<36&&fr(x/3.2)<.34;return sdEll(x,y,33,33.4,5.4,3)<0?P('patch',st):P('fur',st)}};
  const H=tiltHead(12.8,33.2,-.3,.86);
  const fp=(cx,cy,z,dim)=>({z,R:2,dim,ground:false,cast:false,shade:false,contour:null,sdf:(x,y)=>Math.max(smin(sdCap(x,y,cx+4.8,cy-1.4,cx+.8,cy,2.2,2),sdEll(x,y,cx,cy,2.7,2),1),y-43.4),mat:(x,y)=>sdEll(x,y,cx,cy,2.7,2)<.3?P('paw'):P('limb')});
  const hip={z:1,R:5,ground:false,contour:null,cIdx:3,sdf:(x,y)=>Math.max(sdEll(x,y,37.2,37.4,5.8,4.8),body.sdf(x,y)+.3),mat:(x,y)=>{const d=Math.hypot((x-37.2)/1.15,y-37.4);return P('fur',d>1.5&&fr(d/2.4)<.38)}};
  const legN={z:1.5,R:2.2,ground:false,cast:false,shade:false,contour:null,sdf:(x,y)=>Math.max(smin(sdCap(x,y,38.4,39,42.6,41,2.3,2.1),sdEll(x,y,43.6,41.2,2.8,1.9),1),y-43.4),mat:(x,y)=>sdEll(x,y,43.6,41.2,2.8,1.9)<.3?P('paw'):P('limb')};
  const pads={z:1.6,R:1,ground:false,cast:false,contour:false,sdf:(x,y)=>sdEll(x,y,45.2,41,.9,1.2),mat:()=>P('inner')};
  const legF={z:-.4,R:2,dim:1,ground:false,sdf:(x,y)=>smin(sdCap(x,y,39,36,43.4,37.6,2.1,1.9),sdEll(x,y,44.2,37.8,2.5,1.8),1),mat:(x,y)=>sdEll(x,y,44.2,37.8,2.5,1.8)<.3?P('paw'):P('limb')};
  const tl=tail([[40.4,35],[43.6,32.6],[45+w(.3,0),28.4],[43.6+w(1.2,.15)+fl*1.4,24.8+w(.4,.25)-fl*1.2]],2,1.2,-.5,{tip:.78});
  loveFace(a,H.A);const t=f%4;heart(a,31+(t%2),18-t);
  const parts=[tl,legF,body,hip,legN,pads,H.head,fp(24.2,41.4,2.2,1),fp(19.6,41.4-(k>0?k:0),2.3,0)];
  if(ACC==='scarf')parts.push({z:1.9,R:2.4,ground:false,sdf:(x,y)=>sdCap(x,y,20.6,31.6,21.6,40.4,2.4,2.4),ramp:'scarf',contour:RAMP.scarf[4]});
  if(ACC==='bow')parts.push(H.bow());
  return{parts,decals:a,shadow:[28,44,19,2.2],ground:43}},

};
// ---------- ตัวประกอบท่านั่งแบบปรับได้ (ใช้ทำอารมณ์ต่างๆ) ----------
RAMP.rice=['#ffffff','#fdfaf3','#f1ece0','#e2dccd','#cfc6b3'];RAMP.scarf=['#f28b82','#e2655d','#cc4d49','#b03d3d','#8f2f33'];RAMP.bow=['#b9d6f5','#97bfec','#78a5dc','#5c8bc4','#4572a8'];RAMP.book=['#8ccbc4','#6ab5ad','#4e9d96','#3b8780','#2d6e68'];
const sdBox=(px,py,cx,cy,hw,hh,r=1.2)=>{const qx=Math.abs(px-cx)-hw+r,qy=Math.abs(py-cy)-hh+r;return Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-r};RAMP.nori=['#62735b','#4f5f49','#43513e','#374433','#2c3729'];
const TEAR='#8cc4ec',GOLD='#f0bb55',RED='#d9625c',SHY='#e7847f';
const sparkle=(a,x,y)=>put(a,x,y,[[0,-1],[-1,0],[0,0],[1,0],[0,1]],GOLD);
const bean=(a,x,y,h=4,hi=false)=>{for(let j=0;j<h;j++){a.push([x,y+j,IRIS]);a.push([x+1,y+j,IRIS])}if(hi)a.push([x,y,'#ffffff'])};
const chevL=(a,x,y)=>put(a,x,y,[[0,0],[1,1],[2,2],[1,3],[0,4],[1,0],[2,1],[3,2],[2,3],[1,4]],EYE);
const chevR=(a,x,y)=>put(a,x,y,[[3,0],[2,1],[1,2],[2,3],[3,4],[2,0],[1,1],[0,2],[1,3],[2,4]],EYE);
const openMouth=(a,x,y,w=5)=>{if(w===5){put(a,x,y,[[0,0],[1,0],[2,0],[3,0],[4,0],[0,1],[4,1],[1,2],[3,2],[2,3]],EYE);put(a,x,y,[[1,1],[2,1],[3,1],[2,2]],RED)}else{put(a,x,y,[[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[0,1],[6,1],[1,2],[5,2],[2,3],[4,3],[3,4]],EYE);put(a,x,y,[[1,1],[2,1],[3,1],[4,1],[5,1],[2,2],[3,2],[4,2],[3,3]],RED)}};
function earPts(hx,hy,droop,right){const U=[[-11.6,-3.6],[-10.8,-13.4],[-3.8,-8.6]],F=[[-11.4,-2.8],[-13.6,-7.6],[-5.2,-8.8]],UI=[[-9.8,-4.8],[-9.2,-10.8],[-5.4,-8.2]],FI=[[-10.4,-4.2],[-12.2,-7.2],[-6.8,-8.2]];
 const m=(A,B)=>A.map((p,k)=>{const x=p[0]+(B[k][0]-p[0])*droop,y=p[1]+(B[k][1]-p[1])*droop;return[hx+(right?-x:x),hy+y]});return{o:m(U,F),i:m(UI,FI)}}
function sitCat(o={}){
 const by=o.dy||0,sq=o.sq||0,hx=24+(o.hxo||0),hy=22.5+by+(o.hy||0)+sq*.8,th=o.tilt||0;
 const hyF=22.5+Math.round(by+(o.hy||0)+sq*.8); // จุดยึดหน้า: ปัดเป็นพิกเซลเต็ม ตา/ปาก/แก้มจะไม่สั่นครึ่งพิกเซลระหว่างเฟรม
 const R=(x,y)=>{const c=Math.cos(-th),s=Math.sin(-th),X=x-hx,Y=y-hy;return[hx+X*c-Y*s,hy+X*s+Y*c]};
 const EL=earPts(hx,hy,(o.earL??o.ear??0)+(IDLE==='twitchL'?.8:0),false),ER=earPts(hx,hy,(o.earR??o.ear??0)+(IDLE==='twitchR'?.8:0),true); // หูกระดิกข้างเดียว: หูข้างนั้นลู่ลงชั่วครู่ (สองทีติดกัน)
 const body={z:0,R:9,sdf:(x,y)=>Math.max(smin(sdEll(x,y,24,35.6+by+sq*.4,12+sq,9.8-sq*.6),sdEll(x,y,24,30+by+sq*.6,8.4,6),3),y-(43.2+by)),mat:(x,y)=>{const st=Math.abs(x-24)>5.4&&fr((y-by)/2.7+.2)<.36;return sdEll(x,y,31.5,30.5+by,4.8,4)<0?P('patch',st):P('fur',st)}};
 const hips={z:1,R:5,ground:false,sdf:(x,y)=>Math.max(Math.min(sdEll(x,y,15.2-sq*.4,38.8+by,5.6,4.8),sdEll(x,y,32.8+sq*.4,38.8+by,5.6,4.8)),body.sdf(x,y)+.4),mat:(x,y)=>{const c=x<24?15.2-sq*.4:32.8+sq*.4,d=Math.hypot((x-c)/1.15,y-38.8-by);return P('fur',d>1.5&&fr(d/2.4)<.38)},contour:null,cIdx:3};
 const chest={z:1.2,R:5,ground:false,contour:false,sdf:(x,y)=>Math.max(sdEll(x,y,24,34.5+by,6.2,6.4),body.sdf(x,y)+.6),mat:()=>P('under')};
 const head={z:2,R:8.5,sdf:(x,y)=>{const[u,v]=R(x,y);return smin(sdEll(u,v,hx,hy,12.4,10),Math.min(ear(u,v,...EL.o),ear(u,v,...ER.o)),1.8)},
  mat:(x,y)=>{const[u,v]=R(x,y);return headMat(u,v,hx,hy,{lo:EL.o,ro:ER.o,li:EL.i,ri:ER.i},[hx+5.6,hy-7.6,5.6,3.6])}};
 const parts=[body,hips,chest,head];
 const acc=o.acc||ACC;
 if(acc==='scarf'){const sy=hy+10.4;parts.push({z:1.9,R:2.4,ground:false,sdf:(x,y)=>sdCap(x,y,hx-8.6,sy-.4,hx+8.6,sy-.4,2.5,2.5),ramp:'scarf',contour:RAMP.scarf[4]});if(o.legs!=='cover')parts.push({z:1.95,R:2,ground:false,skipUp:true,sdf:(x,y)=>sdCap(x,y,hx+5.6,sy+.8,hx+7.6,sy+6.4,1.9,1.5),ramp:'scarf',contour:RAMP.scarf[4]})}
 if(acc==='bow'){const cx=hx+7.4,cy=hy-5.6,ang=Math.atan2(5,7.8),ca=Math.cos(ang),sa=Math.sin(ang); // ตามแนวฐานหูขวา
  const wing=(u,v,o)=>{const X=u-cx-o*ca,Y=v-cy-o*sa;return sdEll(X*ca+Y*sa,-X*sa+Y*ca,0,0,2.5,1.8)};
  parts.push({z:3,R:2.2,ground:false,ramp:'bow',contour:RAMP.bow[4],sdf:(x,y)=>{const[u,v]=R(x,y);return Math.min(wing(u,v,-2.4),wing(u,v,2.4),sdEll(u,v,cx,cy,1.3,1.3))}})}
 const legs=o.legs||'sit',lift=o.lift||0;
 // ขาหน้า: โคนเล็กกลืนกับอก ปลายเป็นอุ้งเท้ากลมนูนพ้นเส้นพื้นหนึ่งแถว เส้นขอบใช้สีที่เข้มกว่าระหว่างอุ้งเท้ากับขน
 const paw=(cx,lf)=>(x,y)=>smin(smin(sdEll(x,y,cx,39.8+by-lf,2.9,3.4),sdEll(x,y,cx,37+by-lf,2.2,2.4),1.2),sdEll(x,y,cx,41.6+by-lf,3.1,2.4),1.0);
 const pawLine=()=>{const a=P('paw'),b=P('fur');if(darkRamp(a)&&darkRamp(b))return RAMP[a][0];return lumHex(RAMP[a][4])<lumHex(RAMP[b][4])?RAMP[a][4]:RAMP[b][4]};
 if(legs==='leglick'){const[lx,ly]=o.foot; // เลียขา: ขาหลังซ้ายจอชูขึ้นอยู่หน้าหัวด้านซ้าย ฝ่าเท้าหันมาหาผู้ชมระดับหน้าผาก หัวก้มเอียงเลียโคนขา
  // ตั้งสมดุล: ขาหน้าทั้งสองค้ำพื้นกางออกเล็กน้อย ขาหลังอีกข้างเหยียดออกไปทางขวาวางราบกับพื้น (ฐานกว้าง ตัวไม่ล้ม)
  parts.push({z:1.5,R:2.9,ground:false,skipUp:true,sdf:paw(21.4,0),mat:()=>P('paw'),contour:(x,y)=>y>39.2+by?pawLine():false},{z:1.55,R:2.9,ground:false,skipUp:true,sdf:paw(28.6,0),mat:()=>P('paw'),contour:(x,y)=>y>39.2+by?pawLine():false});
  const T2=(x,y)=>sdCap(x,y,31,38.8+by,37.2,40.8,4,2.6),F2=(x,y)=>sdEll(x,y,40.4,41.7,3,2);
  parts.push({z:1.45,R:2.8,ground:false,cast:false,shade:false,sdf:(x,y)=>Math.max(smin(T2(x,y),F2(x,y),1),y-43.8),mat:(x,y)=>F2(x,y)<.3?P('paw'):P('limb'),contour:(x,y)=>x>33&&y>37.6?(F2(x,y)<.3?pawLine():null):false});
  // ขาสามท่อนแบบขาแมวจริง: ต้นขาหนาที่สะโพก → แข้งเรียวลง → เท้าเล็ก (เจ้าของบอกว่าขาแท่งเท่ากันดูแปลก)
  const kx=lx+3.6,ky=ly+9,Th=(x,y)=>sdCap(x,y,18.4,37.4+by,kx,ky,5,3.3),Sh=(x,y)=>sdCap(x,y,kx,ky,lx+.2,ly+2.2,2.6,1.7),Ft=(x,y)=>sdEll(x,y,lx,ly,2.5,2.8);
  parts.push({z:2.6,R:3,ground:false,cast:false,shade:false,sdf:(x,y)=>smin(smin(Th(x,y),Sh(x,y),1.2),Ft(x,y),1),
   mat:(x,y)=>{if(Ft(x,y)<.3)return P('paw');if(Th(x,y)<-.6&&y>ky+1.4){const d=Math.hypot(x-17,y-34-by);return P('fur',d>1.6&&fr(d/2.4)<.38)}return P('limb')},
   contour:(x,y)=>y>36+by?false:(darkRamp(P('limb'))?RAMP[P('limb')][0]:SOFT)}, // เส้นขอบเข้มตรงที่ขาทับหัว ให้แยกจากหัวชัด
   {z:2.65,R:1,ground:false,cast:false,contour:false,sdf:(x,y)=>sdEll(x,y,lx,ly+.9,1.5,1.2),mat:()=>P('inner')})}
 else if(legs==='groom'){const[gx,gy]=o.paw;parts.push({z:1.5,R:2.9,ground:false,skipUp:true,sdf:paw(21,0),mat:()=>P('paw'),contour:(x,y)=>y>39.2+by?pawLine():false}); // ขาหน้าอีกข้างยังนั่ง
  const A=(x,y)=>sdCap(x,y,28.6,36.6+by,gx+.4,gy+1.8,2.8,2.5),Pw=(x,y)=>sdEll(x,y,gx,gy,3,2.8);
  parts.push({z:2.55,R:2.7,ground:false,cast:false,shade:false,sdf:(x,y)=>smin(A(x,y),Pw(x,y),1.4),mat:(x,y)=>Pw(x,y)<.4?P('paw'):P('limb'),contour:(x,y)=>y>34.4+by?false:(Pw(x,y)<.4?edge('paw'):edge('limb'))});
  if(o.pads)parts.push({z:2.6,R:1.2,ground:false,cast:false,contour:false,sdf:(x,y)=>sdEll(x,y,gx-1.1,gy+.5,1.2,.9),mat:()=>P('inner')})}
 else if(legs==='sit'){parts.push({z:1.5,R:2.9,ground:false,skipUp:true,sdf:paw(21,0),mat:()=>P('paw'),contour:(x,y)=>y>39.2+by?pawLine():false},{z:1.55,R:2.9,ground:false,skipUp:true,sdf:paw(27,lift),mat:()=>P('paw'),contour:(x,y)=>y>39.2+by-lift?pawLine():false})}
 else{parts.push({z:1.5,R:2,ground:false,sdf:(x,y)=>Math.min(sdEll(x,y,18,41.9+by,3.1,2.2),sdEll(x,y,30,41.9+by,3.1,2.2)),mat:()=>P('paw'),contour:null})}
 if(legs==='cover'){const arm=sx=>{const bx=24+sx*4.8,px=24+sx*3.1,A=(x,y)=>sdCap(x,y,bx,36.4+by,px+sx*.2,31.8+by,2.8,2.6),Pw=(x,y)=>sdEll(x,y,px,30.2+by,3,2.8);
   return{z:sx>0?2.55:2.5,R:2.7,ground:false,cast:false,shade:false,sdf:(x,y)=>smin(A(x,y),Pw(x,y),1.4),mat:(x,y)=>Pw(x,y)<.4?P('paw'):P('limb'),
    contour:(x,y)=>y>34.4+by?false:(Pw(x,y)<.4?edge('paw'):edge('limb'))}};
  parts.push(arm(-1),arm(1))}
 if(legs==='book'){parts.push({z:2.6,R:3,ground:false,contour:INK,sdf:(x,y)=>sdBox(x,y,24,37.2+by,9.4,4.2),mat:(x,y)=>y>39.6+by?'rice':'book'},{z:2.7,R:2,ground:false,contour:null,sdf:(x,y)=>Math.min(sdEll(x,y,15.6,37.2+by,2.8,2.7),sdEll(x,y,32.4,37.2+by,2.8,2.7)),mat:()=>P('paw')})}
 if(legs==='hold'){const oy=by+(o.bite||0)*0;parts.push({z:2.6,R:3.5,ground:false,contour:INK,sdf:(x,y)=>Math.max(sdTri(x,y,[24,28.6+oy],[18.2,37.4+oy],[29.8,37.4+oy])-1.2,-sdEll(x,y,28.4,30,2.4,2.4)),mat:(x,y)=>y>34.4+oy?'nori':'rice'},
  {z:2.7,R:2,ground:false,contour:null,sdf:(x,y)=>Math.min(sdEll(x,y,18.2,35.6+oy,2.8,2.7),sdEll(x,y,29.8,35.6+oy,2.8,2.7)),mat:()=>P('paw')})}
 const fl=IDLE==='flick'&&o.tail?o.tail.length:0; // สะบัดหาง: ขยับสองจุดปลายหางออกด้านนอก
 if(o.tail)parts.push(tail(o.tail.map((p,i)=>[p[0]+(i>=fl-2&&fl?(i===fl-1?2.8:1.3):0),p[1]+by-(i===fl-1&&fl?1.6:0)]),o.tr0||2.1,o.tr1||1.15,o.tailFront?3:-.5,{tip:.8}));
 const a=[],f=[];(o.face||(()=>{}))(f,hx,hyF);
 if(IDLE==='blink'){ // กะพริบตา: แทนตาเม็ดถั่วแต่ละข้างด้วยเส้น 4 พิกเซลที่แถวล่างของตา
  const eyes=[[],[]];f.forEach(p=>{if(p[2]===IRIS)eyes[p[0]<hx?0:1].push(p)});
  const hi=new Set(eyes.flat().map(p=>Math.round(p[0])+','+Math.round(p[1])));
  for(let i=f.length-1;i>=0;i--){const p=f[i];if(p[2]===IRIS||(p[2]==='#ffffff'&&hi.has(Math.round(p[0])+','+Math.round(p[1]))))f.splice(i,1)}
  eyes.forEach(e=>{if(!e.length)return;const xs=e.map(p=>p[0]),ys=e.map(p=>p[1]),y=Math.max(...ys)-.6,x0=Math.min(...xs)-1;put(f,x0,y,[[0,0],[1,0],[2,0],[3,0]],EYE)})}
 f.forEach(([x,y,c])=>{const s=Math.sin(th),cc=Math.cos(th),X=x+.5-hx,Y=y+.5-hyF;a.push([hx+X*cc-Y*s-.5,hyF+X*s+Y*cc-.5,c])});
 (o.fx||(()=>{}))(a,by);
 const lifted=Math.max(0,-by);return{parts,decals:a,shadow:[24,44.4,15-lifted*1.1,2.4-lifted*.15],ground:lifted?0:44}}
Object.assign(POSES,{
 // นั่ง (ค่าเริ่มต้น): ใช้ sitCat ร่วมกับท่าอื่น หางแกว่งช้าๆ การกะพริบ หูกระดิก สะบัดหาง มาจากท่าย่อยแบบสุ่ม (IDLE)
 sit(f){const w=(A,l)=>A*Math.sin(2*Math.PI*(f/8-l)); // 8 เฟรม: หางแกว่งเป็นคลื่นช้าๆ ปลายหางม้วนเข้าออกตามหลังโคน
  return sitCat({tail:[[33,40.6],[40,42],[43.6+w(.25,0),37.4],[43.2+w(.7,.1),31+w(.25,.12)],[40.6+w(1.5,.22),28.6+w(.6,.3)]],
  face:(a,hx,hy)=>{bean(a,17.6,hy+.4,4);bean(a,28.6,hy+.4,4)
   mouth(a,22,hy+4.6);blush(a,13,hy+3.4);blush(a,32,hy+3.4)}})},
 // คิด: เอียงหัวนิดๆ ตามองขึ้นขวา จุดความคิดโผล่ทีละจุด (ระหว่างรอคำตอบควิซ)
 think(f){const n=[1,2,3,3][f];return sitCat({tilt:.1,earL:0,earR:.12,
  tail:[[33,40.6],[39,41.6],[42,36.6],[41.4+(f%2)*.4,31.4]],
  face:(a,hx,hy)=>{bean(a,19,hy-1,4,true);bean(a,30,hy-1,4,true);a.push([24,hy+3.6,NOSE]);put(a,23.6,hy+4.8,[[0,0],[1,0]],EYE);blush(a,12.6,hy+3.6);blush(a,32.4,hy+3.6)},
  fx:(a)=>{for(let i=0;i<n;i++)put(a,[40,42.6,44.6][i],[15,11.4,7.6][i],[[1,0],[0,1],[1,1],[2,1],[1,2]],i===2&&f===3?GOLD:FX)}})}, // จุดความคิดทรงกลม 3×3
 // อ่านหนังสือ: ถือหนังสือสองมือ ตามองลงไล่จากซ้ายไปขวา กะพริบที่เฟรม 3 (เปิดบทเรียน)
 read(f){const ex=[0,.8,1.6,.8][f],b=f%2;return sitCat({hy:.4,legs:'book',
  tail:[[33,40.8],[39,42],[42.6,38.4],[42.4,33.6],[40.4+b*.6,31.6]],
  face:(a,hx,hy)=>{if(f===3){eyeSleepy(a,17.6,hy+1.8);eyeSleepy(a,28.6,hy+1.8)}else{bean(a,17.6+ex,hy+1.6,3);bean(a,28.6+ex,hy+1.6,3)}
   a.push([24,hy+3.8,NOSE]);put(a,23.2,hy+5,[[0,0],[1,0],[2,0]],EYE);blush(a,12.6,hy+3.8);blush(a,32.4,hy+3.8)},
  fx:(a,by)=>{put(a,20,35.2+by,[[0,0],[1,0],[2,0],[3,0],[4,0]],'#e9f6f4');put(a,20,37.2+by,[[0,0],[1,0],[2,0]],'#e9f6f4');if(f===2)put(a,34,34,[[0,0],[1,0],[0,1],[1,1]],FX)}})},
 // ดีใจ: กระโดดเบาๆ หางตั้งตรงปลายงอแกว่ง ตา > < ปากอ้า
 happy(f){const dy=[0,-1.5,-2.6,-1.2][f],sw=[0,1.2,2,1.2][f];return sitCat({dy,ear:-.08,
  tail:[[33,40.6],[38.6,41],[41.6,34.6],[42+sw*.5,27.2],[39.8+sw,24.4]],
  face:(a,hx,hy)=>{chevL(a,16,hy-.4);chevR(a,29,hy-.4);a.push([24,hy+3.6,NOSE]);openMouth(a,22,hy+4.6);blush(a,12.6,hy+3.8);blush(a,32.4,hy+3.8)},
  fx:(a,by)=>{(f%2?[[8,15],[40,11]]:[[6,11],[42,15]]).forEach(([x,y])=>sparkle(a,x,y+by*.5))}})},
 // เสียใจ: หูลู่ หัวก้ม หางแบนราบกับพื้น น้ำตาไหล คิ้วตก
 sad(f){const hy=1.2+(f===2?.6:0);return sitCat({hy,ear:1,
  tail:[[33,41],[38.6,43.4],[43.6,43.8],[46.2,43.2-(f%2)*.5]],
  face:(a,hx,hy)=>{bean(a,18,hy+1.4,3);bean(a,29,hy+1.4,3);put(a,17,hy-.6,[[0,0],[1,-1]],EYE);put(a,30,hy-1.6,[[0,0],[1,1]],EYE);
   a.push([24,hy+4.4,NOSE]);put(a,23,hy+5.6,[[0,1],[1,0],[2,0],[3,1]],EYE);blush(a,12.8,hy+4);blush(a,32.2,hy+4);
   const t=f%4;a.push([18,hy+4.6+t,TEAR]);if(t>0)a.push([18,hy+3.6+t,TEAR]);if(f%2)a.push([30,hy+4.4,TEAR])}})},
 // กินข้าวปั้น: สองมือถือข้าวปั้น (โดนกัดไปคำหนึ่ง) เคี้ยวแก้มตุ่ย ตาปิดอร่อย
 eat(f){const chew=f%2;return sitCat({hy:chew*.6,legs:'hold',
  tail:[[33,40.8],[39,42],[42.6,38.4],[42.4,33.6],[40.4+chew*.6,31.6]],
  face:(a,hx,hy)=>{eyeHappy(a,16.6,hy+1.2);eyeHappy(a,28.6,hy+1.2);a.push([24,hy+3.6,NOSE]);
   if(chew)put(a,22.6,hy+4.8,[[0,0],[1,0],[2,0]],EYE);else mouth(a,22,hy+4.8);
   if(chew){put(a,11.6,hy+3.4,[[0,0],[1,0],[2,0],[3,0],[0,1],[1,1],[2,1],[3,1]],BLUSH);put(a,32.4,hy+3.4,[[0,0],[1,0],[2,0],[3,0],[0,1],[1,1],[2,1],[3,1]],BLUSH)}else{blush(a,12.6,hy+3.8);blush(a,32.4,hy+3.8)}},
  fx:(a)=>{if(f===1||f===2)heart(a,38+(f===2?1:0),10-f,0)}})},
 // เขินอาย: อุ้งเท้าสองข้างปิดปาก แก้มแดงมีขีด /// ตาเหลือบหลบ หางม้วนพันเท้า เหงื่อตก (ไม่วาดปาก เพราะถูกอุ้งเท้าบัง)
 shy(f){const d=f%2;return sitCat({hy:.6,ear:.08,legs:'cover',tailFront:true,
  tail:[[34,41],[38.4,43.2],[33,45],[25,45.2],[19.6+d*.6,44.2]],tr1:1.2,
  face:(a,hx,hy)=>{bean(a,19,hy+1.4,3);bean(a,30,hy+1.4,3);a.push([24,hy+3.8,NOSE]);
   put(a,13,hy+3.2,[[0,0],[1,0],[2,0],[3,0],[0,1],[1,1],[2,1],[3,1]],BLUSH);put(a,31,hy+3.2,[[0,0],[1,0],[2,0],[3,0],[0,1],[1,1],[2,1],[3,1]],BLUSH);
   [[13,hy+4.2],[14,hy+3.2],[15,hy+4.2],[16,hy+3.2]].forEach(([x,y])=>a.push([x,y,SHY]));[[31,hy+4.2],[32,hy+3.2],[33,hy+4.2],[34,hy+3.2]].forEach(([x,y])=>a.push([x,y,SHY]))},
  fx:(a)=>{put(a,10,13+d,[[1,0],[0,1],[1,1],[2,1],[1,2]],TEAR)}})},
 // สงสัย: เอียงหัว หูข้างหนึ่งเอน ยกเท้าหน้าแตะ หางเป็นรูป ?
 curious(f){const t=[.18,.24,.24,.18][f],bob=f===1||f===2?-1:0;return sitCat({tilt:t,earL:0,earR:.32,
  tail:[[33,40.6],[39,41],[41.8,35.4],[41.4,29.2],[38.4,26.8],[36.2,28.4]],tr1:1.2,
  face:(a,hx,hy)=>{bean(a,18,hy-.2,4,true);bean(a,29,hy-.2,4,true);a.push([24,hy+3.6,NOSE]);put(a,23.6,hy+4.8,[[0,0],[1,0]],EYE);blush(a,12.6,hy+3.6);blush(a,32.4,hy+3.6)},
  fx:(a)=>{put(a,38,4+bob,[[1,0],[2,0],[0,1],[3,1],[3,2],[2,3],[2,5]],GOLD)}})}
});
// ---------- ท่ามุมข้าง: เดิน / ยืน (ร่าง 10) ----------
// วาดในพิกัด "หันขวา" ชุดเดียว แล้วกลับรูปทรงเมื่อหันซ้าย แต่ "ช่องลายขน" เลือกตามข้างจริงของร่างกาย ลายที่ไม่สมมาตรจึงไม่สลับข้าง
// ในท่าหันหน้าตรง ช่อง earR/patch (ขวาจอ) คือข้างซ้ายของแมว ดังนั้น
//   หันขวา → ผู้ชมเห็นข้างขวาของแมว: หูใกล้ = earL แต้มใกล้ = patchL ส่วน earR/โบว์ อยู่หูฝั่งไกล
//   หันซ้าย → ผู้ชมเห็นข้างซ้ายของแมว: หูใกล้ = earR (แต้มส้มของลายครีม โบว์) แต้มใกล้ = patch
const flipPose=p=>({...p,parts:p.parts.map(q=>{const r={...q,sdf:(x,y)=>q.sdf(W-x,y)};if(q.mat)r.mat=(x,y)=>q.mat(W-x,y);if(typeof q.contour==='function')r.contour=(x,y)=>q.contour(W-x,y);return r}),
 decals:p.decals.map(([x,y,c])=>[W-1-Math.round(x),y,c]),shadow:p.shadow&&[W-p.shadow[0],...p.shadow.slice(1)]});
// ขาสั้นปลายกลม (ท่ายืน/เดินมุมข้างและสามส่วนสี่): โคนจมในตัว ปลายเป็นอุ้งเท้าทรงรีแตะเส้นพื้นพอดี ขาฝั่งไกลอยู่หลังตัวและเข้มลงหนึ่งขั้น
const pawLine=()=>{const a=P('paw'),b=P('fur');if(darkRamp(a)&&darkRamp(b))return RAMP[a][0];return lumHex(RAMP[a][4])<lumHex(RAMP[b][4])?RAMP[a][4]:RAMP[b][4]};
// ขาสั้นอวบปลายกลม: dx เลื่อนเท้าไปหน้า(+)/หลัง(-) · lift ยกเท้า · bend พับข้อเท้าไปด้านหลังจนเห็นอุ้งเท้าสีชมพู (0–1)
function sideLeg(sx,dx,lift,bend,z,dim,by=0){
 const th=bend*1.3,c=Math.cos(th),s=Math.sin(th),px=sx+dx+.5-bend*1.2,py=41.7-lift-bend*.5;
 const Pw=(x,y)=>{const X=x-px,Y=y-py;return[X*c+Y*s,-X*s+Y*c]},pawD=(x,y)=>{const[u,v]=Pw(x,y);return sdEll(u,v,0,0,3,2.3)};
 const L=(x,y)=>sdCap(x,y,sx,35.4+by,px+bend*.8,py-1.3,2.7,2.4);
 return{z,R:2.7,dim,ground:false,skipUp:true,shade:false,cast:false,sdf:(x,y)=>smin(L(x,y),pawD(x,y),1.1),
  mat:(x,y)=>pawD(x,y)<.35?(bend>.3&&Pw(x,y)[1]>.9?P('inner'):P('paw')):P('limb'),contour:(x,y)=>y>Math.min(38.6+by,py-2.6)?pawLine():false}}
// โบว์ตามแนวฐานหู (ใช้กับท่าที่หัวไม่หมุน): cx,cy กึ่งกลางฐานหู, ang มุมของฐานหู
const bowPart=(cx,cy,ang,z=3,k=1)=>{const ca=Math.cos(ang),sa=Math.sin(ang),wing=(u,v,o)=>{const X=u-cx-o*ca,Y=v-cy-o*sa;return sdEll(X*ca+Y*sa,-X*sa+Y*ca,0,0,2.5*k,1.8*k)};
 return{z,R:2.2,ground:false,ramp:'bow',contour:RAMP.bow[4],sdf:(x,y)=>Math.min(wing(x,y,-2.4*k),wing(x,y,2.4*k),sdEll(x,y,cx,cy,1.3*k,1.3*k))}};
let SIDE_EAR='front'; // หูฝั่งไกลในท่าหันข้าง: front โผล่ด้านหน้า (ค่าเริ่มต้น) / back โผล่ด้านหลัง
// เดินแบบแมวจริง (4 จังหวะ ไม่ใช่ขาทแยงพร้อมกันแบบวิ่งเหยาะ): หลังใกล้ → หน้าใกล้ → หลังไกล → หน้าไกล ห่างกันหนึ่งในสี่รอบ
// แต่ละขาแตะพื้น 5 จาก 8 เฟรม เท้าที่แตะพื้นถอยหลังเฟรมละ WALK_STEP พิกเซล = ระยะที่ตัวเดินไป เท้าจึงไม่ไถล · ตอนยกเท้าพับข้อเท้าเห็นอุ้งเท้าชมพู
const WALK_N=8,WALK_D=.625,WALK_S=4.8,WALK_STEP=WALK_S/(WALK_D*WALK_N);
function walkLeg(ph,h){const p=fr(ph);if(p<WALK_D)return[WALK_S/2-WALK_S*p/WALK_D,0,0];const t=(p-WALK_D+.5/WALK_N)/(1-WALK_D),k=Math.sin(Math.PI*t);return[-WALK_S/2+WALK_S*t,k*h,k]}
// วิ่งดีด (ควบแบบแมว 6 เฟรม): ตัวหดรวบขา → เท้าหลังลง → ถีบ → ตัวยืดลอย → เท้าหน้าลง → ถีบหน้า · e = ตัวยืด(+)/หด(-), by = ลอยจากพื้น
// ขา: [dx, lift, bend] ของ หน้าใกล้ หน้าไกล หลังใกล้ หลังไกล
const RUN=[{e:-1.6,by:-2.2,L:[[-3,3.2,.9],[-2.2,3.6,.8],[3.4,2.6,.4],[2.6,2.8,.5]]},
 {e:-1.2,by:-1.2,L:[[-1.4,3.2,.6],[-.6,3.4,.5],[2.6,0,0],[1.6,.8,.2]],dust:1},
 {e:.4,by:-1.6,L:[[2.6,2.8,.2],[1.6,3,.3],[-1.6,0,0],[-.8,0,0]],dust:2,lines:1},
 {e:2,by:-3,L:[[4.4,3.4,0],[3.6,3.6,0],[-4.6,2.4,.7],[-3.8,2.8,.6]],lines:2},
 {e:1.2,by:-1.4,L:[[2.6,0,0],[3.4,.8,0],[-4,2.2,.8],[-3.2,2.6,.7]],lines:1},
 {e:-.4,by:-1.2,L:[[-1.6,0,0],[-.6,0,0],[0,3,.8],[.8,3.2,.7]]}],RUN_STEP=4.4;
function sideCat(o){
 const dir=o.dir,f=o.f,mode=o.mode||'stand',run=mode==='run',walk=mode==='walk',N=dir>0?'L':'R',F=dir>0?'R':'L',nP=dir>0?'patchL':'patch';
 const R=run?RUN[f]:null,e=run?R.e:0,by=run?R.by:walk?[0,-.3,-.6,-.3,0,-.3,-.6,-.3][f]:0;
 // หัวกลมโตเท่าท่าหันหน้า หูอยู่บนกลางหัว หูฝั่งไกลโผล่ด้านหน้าเล็กน้อย · ตอนเดินหัวนิ่ง (แมวจริงประคองหัวให้นิ่ง) ตอนวิ่งหูลู่ไปด้านหลัง
 const hx=33.4+e*.5,hy=22.8+(run?by*.8:0),hyF=23+Math.round(run?by*.8:0),tw=IDLE==='twitch'+N?1:0,twF=IDLE==='twitch'+F?1:0,eb=run?.7:tw,back=SIDE_EAR==='back';
 const NE=[[hx-7,hy-5.6],[hx-3.6-eb*1.4,hy-15+eb*1.6],[hx+1.4,hy-9]],NI=[[hx-3.8,hy-7.6],[hx-3.4-eb*1.2,hy-12.4+eb*1.4],[hx+.2,hy-8.8]];
 const FE=back?[[hx-10.4,hy-3.6],[hx-9.4-twF*1.2,hy-13+twF*1.4],[hx-4.6,hy-8.6]]:[[hx-.4,hy-8.8],[hx+3.6-(run?.8:0)+twF*1.2,hy-14.2+(run?.8:0)+twF*1.4],[hx+6.6,hy-6.2]];
 const bx=22.6,brx=12.4+e*.6,bry=7.2-e*.3,cx=30.6+e*.5,hip=-e*.5;
 const bodyS=(x,y)=>Math.max(smin(sdEll(x,y,bx,33.8+by,brx,bry),sdEll(x,y,cx,32.4+by,6.6,6.6),3),y-(41.6+by-Math.min(0,e)*.3));
 const flank=(x,y)=>sdEll(x,y,19+hip,30.4+by,6,4.2)<0;
 const body={z:0,R:9,sdf:bodyS,mat:(x,y)=>{if(sdEll(x,y,24,40.6+by,10.5+e*.5,3.2)<0||sdEll(x,y,cx+4.8,35.4+by,3.2,4.6)<0)return P('under');
  const st=y<37.5+by&&x<cx+1.4&&fr(x/3.2+.15)<.34;return flank(x,y)?P(nP,st):P('fur',st)}};
 const haunch={z:1,R:5,ground:false,contour:null,cIdx:3,sdf:(x,y)=>Math.max(sdEll(x,y,15.6+hip,35.4+by,6.2,5.4),bodyS(x,y)+.5),
  mat:(x,y)=>{const d=Math.hypot((x-15.6-hip)/1.15,y-35.4-by),st=d>1.5&&fr(d/2.4)<.38;return flank(x,y)?P(nP,st):P('fur',st)}};
 const head={z:2,R:8.5,sdf:(x,y)=>smin(smin(sdEll(x,y,hx,hy,11.4,9.8),sdEll(x,y,hx+9.4,hy+3.6,2.9,2.5),2),ear(x,y,...NE),1.6),
  mat:(x,y)=>{if(sdTri(x,y,...NI)<0)return P('inner');if(sdTri(x,y,...NE)<(CO.earRim?.9:-.2))return P('ear'+N);
   if(CO.mask){const m=CO.maskShape==='point'?sdEll(x,y,hx+6.4,hy+2.4,6.8,5.8):sdEll(x,y,hx+8.6,hy+3.8,4,3.2);if(m<0)return CO.mask}
   if(CO.stripe){const brow=y>hy-9.4&&y<hy-5.4&&[-.2,2.2].some(d=>Math.abs(x-hx-d)<.55),cheek=x<hx-2&&x>hx-9.5&&[1.4,3.4].some(d=>Math.abs(y-hy-d)<.5);if(brow||cheek)return CO.stripe}
   if(sdEll(x,y,hx-3.2,hy-6.2,5.4,3.4)<0)return P(nP);return CO.fur}};
 const farEar={z:1.8,R:2.5,dim:back?0:1,ground:false,sdf:(x,y)=>ear(x,y,...FE),mat:(x,y)=>back||sdTri(x,y,[hx+.8,hy-8.8],[hx+3.6+twF,hy-12.2+twF*1.2],[hx+5.2,hy-7.2])>0?P('ear'+F):P('inner')};
 // ขา: หน้าใกล้ หน้าไกล หลังใกล้ หลังไกล (ฝั่งไกลอยู่หลังตัว เข้มลงหนึ่งขั้น)
 const ph=f/WALK_N,LG=run?R.L:walk?[walkLeg(ph-.25,2.2),walkLeg(ph-.75,2.2),walkLeg(ph,1.8),walkLeg(ph-.5,1.8)]:[[0,0,0],[0,0,0],[0,0,0],[0,0,0]];
 const legs=[[31.4+e*.5,1.5,0],[28.6+e*.5,-1,1],[16.4+hip,1.45,0],[13.6+hip,-1,1]].map(([sx,z,dim],i)=>sideLeg(sx,LG[i][0],LG[i][1],LG[i][2],z,dim,by));
 // หาง: ยืน/เดินตั้งโค้งปลายแกว่งช้าๆ · วิ่งพองฟู (แมวตื่นเต้น) ชี้ไปด้านหลังเฉียงขึ้น
 const fl=IDLE==='flick'?1:0,tb=11.6+hip*1.2;let tl;
 if(run){const s2=[0,.6,1,.6,0,-.4][f],lag=(RUN[(f+5)%6].by-by)*.9; // หางพองสะบัดตามหลังตัว: ตัวขึ้น ปลายหางยังค้างต่ำกว่าหนึ่งจังหวะ
  tl=tail([[tb,31.6+by],[tb-4.4,30+by+lag*.3],[tb-7.8,27.4+by+lag*.7],[tb-9.2+s2,23.6+by-s2+lag]],2.7,1.9,-.5,{tip:.8})}
 else if(o.up){const w=(A,l)=>A*Math.sin(2*Math.PI*(ph-l)); // หางตั้ง (ทักทาย Cafazzo & Natoli 2009): ตั้งตรงเกือบดิ่ง ปลายงอไปทางหัว แกว่งเบาๆ
  tl=tail([[tb,31.6+by],[tb-1.8,27.4+by],[tb-2.4+w(.15,0),22+by],[tb-1.8+w(.3,.12),16.6+by],[tb+.4+w(.5,.22),13.2+by],[tb+2.4+w(.6,.3),12.8+by]],2.1,1.15,-.5,{tip:.8})}
 else{const q=walk?ph:f/8,k=walk?1.1:.85,w=(A,l)=>k*A*Math.sin(2*Math.PI*(q-l)); // คลื่นจากโคนไปปลาย ปลายหางตามหลัง
  tl=tail([[tb,31.6+by],[tb-4,29.4+by],[tb-6.4+w(.2,0),24.6+by],[tb-5.8+w(.6,.1),19.6+by+w(.2,.15)],[tb-3.4+w(1.2,.22)+fl*2.4,16.6+by+w(.5,.3)-fl*1.4]],2.1,1.15,-.5,{tip:.8})}
 const parts=[body,haunch,head,farEar,...legs,tl];
 const acc=o.acc||ACC;
 if(acc==='scarf'){const fw=run?.6+[0,.4,.8,1.2,.8,.3][f]:walk?.5+.5*Math.sin(2*Math.PI*ph):0,fu=run?1:0; // ชายผ้าปลิวไปด้านหลังตอนวิ่ง
  parts.push({z:1.9,R:2.4,ground:false,sdf:(x,y)=>sdCap(x,y,hx-6.4,hy+6.6,hx+.4,hy+8.8,2.4,2.4),ramp:'scarf',contour:RAMP.scarf[4]},
   {z:1.95,R:2,ground:false,skipUp:true,sdf:(x,y)=>sdCap(x,y,hx-5,hy+9,hx-8.4-fw-fu,hy+13.4-fu,1.9,1.5),ramp:'scarf',contour:RAMP.scarf[4]})}
 if(acc==='bow')parts.push(N==='R'?bowPart(hx-4.8-eb*.4,hy-6.6,-.39):back?bowPart(hx-7.4,hy-6.4,-.5,1.85,.85):bowPart(hx+4.6,hy-8,.55,1.85,.85)); // โบว์อยู่หูซ้ายของแมวเสมอ: หันซ้ายอยู่หูใกล้ หันขวาอยู่หูไกล
 const a=[];
 if(run)put(a,hx+4.4,hyF-.4,[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2],[1,3]],IRIS),a.push([hx+4.4,hyF-.4,'#ffffff']); // ตาโตตื่นเต้น
 else if(IDLE==='blink')put(a,hx+4.4,hyF+2.6,[[0,0],[1,0],[2,0]],EYE);else bean(a,hx+5,hyF,4,true); // ตาเม็ดถั่วเดียวกับท่าหันหน้า ค่อนไปทางหน้า
 a.push([hx+10.6,hyF+2,NOSE]);put(a,hx+9.6,hyF+3.2,[[1,0],[0,1]],EYE);blush(a,hx+2.2,hyF+3.6);   // จมูกที่ปลายหน้า ปากเล็กอยู่ในหน้า ไม่ยื่นออกนอกเส้น
 if(run&&R.lines)put(a,0,34,R.lines>1?[[0,0],[1,0],[2,0],[3,0],[1,3],[2,3],[3,3],[4,3],[5,3]]:[[1,0],[2,0],[3,0],[2,3],[3,3],[4,3]],FX); // เส้นความเร็ว
 if(run&&R.dust)put(a,R.dust>1?5:7,41,R.dust>1?[[1,0],[2,0],[0,1],[1,1],[2,1],[3,1],[5,1],[6,0]]:[[1,0],[0,1],[1,1],[2,1]],DUST); // ฝุ่นตอนเท้าหลังลงพื้น
 const pose={parts,decals:a,shadow:[24,44.4,16+by*1.3,2.4+by*.15],ground:by<-1?0:44};
 return dir>0?pose:flipPose(pose)}

// ท่าหันสามส่วนสี่: ยืนสี่ขา ตัวเฉียง หัวหันมาทางผู้ชมครึ่งหนึ่ง ใช้คั่นระหว่างท่าหันหน้าตรง (นั่ง หมอบ) กับท่าหันข้าง (ยืน เดิน)
// ตำแหน่งหูตรงกับท่าหันหน้า: หันขวา หูซ้ายจอ = earL (ใกล้ ใหญ่) หูขวาจอ = earR (ไกล แคบ) · หันซ้ายกลับรูปทรง สีตามข้างจริงเหมือน sideCat
function turnCat(o){
 const dir=o.dir,f=o.f,N=dir>0?'L':'R',F=dir>0?'R':'L',nP=dir>0?'patchL':'patch',fP=dir>0?'patch':'patchL';
 const hx=28.4,hy=22.8,hyF=23,tw=IDLE==='twitch'+N?1:0,twF=IDLE==='twitch'+F?1:0;
 const NE=[[hx-10.4,hy-4.2],[hx-9.4+tw*.6,hy-13.8+tw*2],[hx-2.6,hy-8.8]],NI=[[hx-8.8,hy-5.2],[hx-8.4+tw*.5,hy-11.2+tw*1.6],[hx-4.4,hy-8.4]];
 const FE=[[hx+4.6,hy-8.8],[hx+9.6+twF*1.2,hy-12.8+twF*1.6],[hx+10.2,hy-2.8]],FI=[[hx+6.2,hy-8.2],[hx+8.8+twF,hy-10.6+twF*1.4],[hx+9,hy-4.4]];
 const bodyS=(x,y)=>Math.max(smin(sdEll(x,y,21,35,11,7.8),sdEll(x,y,27.4,33.2,7.4,7),3),y-41.8);
 const flank=(x,y)=>sdEll(x,y,16.8,31.8,5.4,4)<0;
 const body={z:0,R:9,sdf:bodyS,mat:(x,y)=>{if(sdEll(x,y,29.4,36,4.6,5.8)<0||sdEll(x,y,21,41.2,8.6,2.6)<0)return P('under');
  const st=y<37.5&&x<25&&fr(x/3.2+.15)<.34;return flank(x,y)?P(nP,st):P('fur',st)}};
 const haunch={z:1,R:5,ground:false,contour:null,cIdx:3,sdf:(x,y)=>Math.max(sdEll(x,y,14.4,36.4,5.8,5.2),bodyS(x,y)+.5),
  mat:(x,y)=>{const d=Math.hypot((x-14.4)/1.15,y-36.4),st=d>1.5&&fr(d/2.4)<.38;return flank(x,y)?P(nP,st):P('fur',st)}};
 const head={z:2,R:8.5,sdf:(x,y)=>smin(sdEll(x,y,hx,hy,11.8,9.8),Math.min(ear(x,y,...NE),ear(x,y,...FE)),1.8),
  mat:(x,y)=>{if(sdTri(x,y,...NI)<0||sdTri(x,y,...FI)<0)return P('inner');const rim=CO.earRim?.9:-.2;
   if(sdTri(x,y,...NE)<rim)return P('ear'+N);if(sdTri(x,y,...FE)<rim)return P('ear'+F);
   if(CO.mask){const m=CO.maskShape==='point'?sdEll(x,y,hx+2.6,hy+2.4,7.2,5.6):Math.min(sdEll(x,y,hx+2.6,hy+4.6,4.6,3.2),sdBox(x,y,hx+1.8,hy-.6,1.1,3.6,.6));if(m<0)return CO.mask}
   if(CO.stripe){const brow=y>hy-9.6&&y<hy-5.6&&[-.6,1.6,3.6].some(d=>Math.abs(x-hx-d)<.55),cheek=(x<hx-7.6||x>hx+9.4)&&[1.2,3.2].some(d=>Math.abs(y-hy-d)<.5);if(brow||cheek)return CO.stripe}
   if(sdEll(x,y,hx+5.2,hy-7.2,4.8,3.4)<0)return P(fP);if(sdEll(x,y,hx-5.4,hy-7.4,5.6,3.6)<0)return P(nP);return CO.fur}};
 const fl=IDLE==='flick'?1:0,w=(A,l)=>A*Math.sin(2*Math.PI*(f/8-l)); // หางแกว่งเป็นคลื่นช้าๆ 8 เฟรม
 const parts=[body,haunch,head,sideLeg(27.2,0,0,0,1.5,0),sideLeg(31.8,0,0,0,-1,1),sideLeg(14.6,0,0,0,1.45,0),sideLeg(18.8,0,0,0,-1,1),
  tail([[10.8,33.6],[6.8,31.2],[5+w(.2,0),26.2],[5.8+w(.6,.1),21.2+w(.2,.15)],[8.2+w(1.2,.22)+fl*2.4,18.4+w(.5,.3)-fl*1.4]],2.1,1.15,-.5,{tip:.8})];
 const acc=o.acc||ACC;
 if(acc==='scarf'){const sy=hy+10;parts.push({z:1.9,R:2.4,ground:false,sdf:(x,y)=>sdCap(x,y,hx-8.4,sy-.6,hx+7.4,sy+.2,2.5,2.5),ramp:'scarf',contour:RAMP.scarf[4]},
  {z:1.95,R:2,ground:false,skipUp:true,sdf:(x,y)=>sdCap(x,y,hx-5.6,sy+.8,hx-7,sy+6,1.9,1.5),ramp:'scarf',contour:RAMP.scarf[4]})}
 if(acc==='bow')parts.push(N==='R'?bowPart(hx-6.6,hy-6.6,-.52):bowPart(hx+7.4,hy-5.8,.86,3,.9)); // หูซ้ายของแมวเสมอ
 const a=[];
 if(IDLE==='blink'){put(a,hx-5.6,hyF+3.2,[[0,0],[1,0],[2,0],[3,0]],EYE);put(a,hx+4.6,hyF+3.2,[[0,0],[1,0],[2,0]],EYE)}
 else{bean(a,hx-4.8,hyF+.4,4,true);bean(a,hx+5.4,hyF+.4,4,true)}
 mouth(a,hx-.2,hyF+4.6);blush(a,hx-10.2,hyF+3.4);put(a,hx+8.4,hyF+3.4,[[0,0],[1,0],[0,1],[1,1]],BLUSH);
 const pose={parts,decals:a,shadow:[23,44.4,15,2.4],ground:44};
 return dir>0?pose:flipPose(pose)}
// เลียขน (ปรับ 2026-11-14 ให้เห็นลิ้นชัด): ยกอุ้งเท้าขึ้นชิดปาก อุ้งเท้าชมพูหันเข้าหาปาก แลบลิ้นชมพูเข้มยาวแตะอุ้งเท้า
// เลีย 2 รอบ (ลิ้นออก → ลากลิ้นขึ้นตามอุ้งเท้า → หุบปาก) แล้วเอาอุ้งเท้าเช็ดแก้มถึงโคนหู
const TONGUE='#ff8aa0',TONGUE_D='#d85c78';
const GL={paw:[27.2,31.4],hy:1,tilt:.1,pads:1},GU={paw:[27.4,29.8],hy:.6,tilt:.1,pads:1},GC={paw:[27.2,31.2],hy:.8,tilt:.08,pads:1};
const GROOM=[{...GL,lick:'out'},{...GU,lick:'up'},{...GC},{...GL,lick:'out'},{...GU,lick:'up'},{...GC},{paw:[30.6,25.4],wash:1,hy:0,tilt:.14},{paw:[31.2,20.8],wash:1,hy:0,tilt:.2,earR:.45}];
POSES.groom=f=>{const G=GROOM[f];return sitCat({legs:'groom',paw:G.paw,pads:G.pads,hy:G.hy,tilt:G.tilt,earR:G.earR||0,
  tail:[[33,40.8],[39,42],[42.6,38.4],[42.4,33.6],[40.4+(f%2)*.5,31.6]],
  face:(a,hx,hy)=>{eyeClosed(a,16.6,hy+1.6);if(!G.wash)eyeClosed(a,28.4,hy+1.6);a.push([24,hy+3.6,NOSE]);
   if(G.lick==='out'){put(a,22.6,hy+4.6,[[0,0],[1,0],[2,0]],EYE);put(a,23,hy+5.6,[[0,0],[1,0],[2,0],[1,1]],TONGUE);put(a,25,hy+6.6,[[0,0]],TONGUE_D)} // ปากอ้า แลบลิ้นสั้นๆ 2 แถว ปลายลิ้นแตะขอบอุ้งเท้า
   else if(G.lick==='up'){put(a,22.6,hy+4.6,[[0,0],[1,0],[2,0]],EYE);put(a,23.4,hy+5.6,[[0,0],[1,0]],TONGUE);put(a,25.4,hy+4.6,[[0,0]],TONGUE_D)} // ลิ้นสั้น ปลายม้วนขึ้นตามอุ้งเท้า
   else put(a,22.6,hy+4.8,[[0,0],[1,1],[2,0]],EYE);
   blush(a,12.8,hy+3.6);if(!G.wash)blush(a,32.2,hy+3.6)},
  fx:(a)=>{if(G.wash)put(a,36,7+f,[[1,0],[0,1],[1,1],[2,1],[1,2]],FX)}})};
// เลียขา (สลับกับเลียแขน · เจ้าของขอขาซ้ายจอและขาสั้นลง): นั่งก้น ยกขาหลังชูขึ้นข้างหัว เห็นอุ้งเท้าชมพูกับเม็ดถั่ว ก้มหน้าเอียงไปเลียโคนขา (ลิ้นสั้น 2 แถวเหมือนเลียแขน)
// เลีย 2 ที นิ้วเท้ากางหุบตามจังหวะ แล้วเงยหน้าลืมตามองแป๊บหนึ่ง
// จังหวะเลีย (เจ้าของขอให้หัวขยับมากขึ้น ไม่ใช่แค่เอาลิ้นแตะ): ก้มลงแลบลิ้น → ลากลิ้นขึ้นตามต้นขา → เงยสุดหุบปาก → ก้มกลับ
const LSTROKE=[{hy:4.8,hxo:-.6,tilt:.48,lick:1,toe:0},{hy:3.4,hxo:-.2,tilt:.4,lick:1,toe:1},{hy:2,hxo:.4,tilt:.3,toe:1},{hy:3.4,hxo:0,tilt:.4,toe:0}];
const LEGLICK=[...LSTROKE,...LSTROKE,{hy:2.4,hxo:.4,tilt:.16,look:1},{hy:2.4,hxo:.4,tilt:.16,look:1}];
POSES.groomLeg=f=>{const G=LEGLICK[f],foot=[9.6,20.8-(G.toe||0)*.4];return sitCat({legs:'leglick',hxo:G.hxo,hy:G.hy,tilt:G.tilt,foot,
  tail:[[32,39.4],[37.8,38.8],[42.4,36.8],[44.8,33.4-(f%2)*.4],[45.2-(f%2)*.6,30.2-(f%2)*.4]], // หางโค้งต่ำด้านขวาหลังเท้าที่เหยียด ปลายงอขึ้น
  face:(a,hx,hy)=>{if(G.look){bean(a,hx-6.4,hy+.4,4,true);bean(a,hx+4.6,hy+.4,4,true)}else eyeClosed(a,hx+4.4,hy+1.6); // ตาซ้ายถูกขาบังตอนก้มเลีย
   a.push([hx,hy+3.6,NOSE]);
   if(G.lick){put(a,hx-1.4,hy+4.6,[[0,0],[1,0],[2,0]],EYE);put(a,hx-4.4,hy+5.6,[[0,0],[1,0],[2,0],[3,0]],TONGUE);put(a,hx-4.4,hy+5.6,[[0,0]],TONGUE_D)}else put(a,hx-1.4,hy+4.8,[[0,0],[1,1],[2,0]],EYE);
   blush(a,hx+8.2,hy+3.6)}, // แก้มซ้ายอยู่หลังขา
  fx:(a,by)=>{const c=RAMP[P('inner')][1],g=(G.toe||0)*.5;put(a,foot[0]-2-g,foot[1]-2.4,[[0,0]],c);put(a,foot[0],foot[1]-3,[[0,0]],c);put(a,foot[0]+2+g,foot[1]-2.4,[[0,0]],c)}})}; // เม็ดถั่วนิ้วเท้า
// ---------- ท่าตอนถูกแตะ (รายงานพฤติกรรมข้อ 4 · v60) ----------
// ตาครึ่งปิดแบบเบื่อๆ: เปลือกตาเป็นเส้นทับครึ่งบนของตาเม็ดถั่ว
const eyeMeh=(a,x,y)=>{bean(a,x,y+1,2);put(a,x-1,y,[[0,0],[1,0],[2,0],[3,0]],EYE)};
Object.assign(POSES,{
 // ถูกลูบหัว: ดันหัวขึ้นหามือแล้วเอียงถูไปมา หูเอนนิดๆ ใต้มือ ตา ⌒ ปิดสบาย หางตั้งปลายงอ (หางตั้ง = เป็นมิตร)
 // เส้นโค้งเล็กๆ ข้างหูสองข้างสลับกันทุกเฟรม = ลูบ/คราง (นอกขอบหัว ไม่ดันกล่องคำพูด)
 pet(f){const t=[.04,.12,.16,.08][f],up=[-.4,-.9,-.9,-.4][f],sw=[0,.6,1,.6][f];return sitCat({hy:up,tilt:t,ear:.24,
  tail:[[33,40.6],[38.6,41],[41.4,34.6],[41.8+sw*.4,27.6],[39.8+sw,25]],
  face:(a,hx,hy)=>{eyeHappy(a,16.6,hy+.8);eyeHappy(a,28.6,hy+.8);mouth(a,22,hy+4.6);blush(a,12.6,hy+3.4);blush(a,32.4,hy+3.4)},
  fx:(a)=>{const o=f%2;put(a,6,15+o,[[1,0],[0,1],[0,2],[1,3]],FX);put(a,41,15+1-o,[[0,0],[1,1],[1,2],[0,3]],FX)}})},
 // ขั้นที่ 1 (แตะถี่/แตะหาง): หูเอนออกข้าง ตาครึ่งปิด ปากแบน ปลายหางสะบัดเร็ว (ยังนั่งอยู่ ไม่ขู่ ไม่โก่งหลัง)
 annoyed(f){const tip=[[43,30.8],[45.4,31.4],[43.2,30.6],[45.2,32.8]][f];return sitCat({ear:.3,
  tail:[[33,40.6],[40,42],[43.8,38],[44.6,34],tip],
  face:(a,hx,hy)=>{eyeMeh(a,17.6,hy+.6);eyeMeh(a,28.6,hy+.6);a.push([24,hy+3.6,NOSE]);put(a,23,hy+4.8,[[0,0],[1,0],[2,0]],EYE);blush(a,12.6,hy+3.6);blush(a,32.4,hy+3.6)}})},
 // ขั้นที่ 2: หูลู่ไปข้างหลังมากขึ้น คิ้วขมวด หางฟาดกว้างและเร็วจนกระทบพื้นมีฝุ่น (สัญญาณเตือนก่อนเดินหนี)
 lash(f){const T=[[[44,36.4],[45.2,30.8],[44.4,26.8]],[[44.2,39.6],[45.4,37.4],[45.2,34.4]],[[43.6,43.2],[45.2,42.2],[45.4,40.2]],[[44.2,39.6],[45.4,37.4],[45.2,34.4]]][f];
  return sitCat({ear:.55,tail:[[33,40.6],[40,41.8],...T],
  face:(a,hx,hy)=>{eyeMeh(a,17.6,hy+.8);eyeMeh(a,28.6,hy+.8);put(a,16,hy-1.4,[[0,0],[1,0],[2,1]],EYE);put(a,29,hy-.4,[[0,0],[1,-1],[2,-1]],EYE);
   a.push([24,hy+3.6,NOSE]);put(a,22.6,hy+5,[[0,1],[1,0],[2,0],[3,1]],EYE);blush(a,12.6,hy+3.6);blush(a,32.4,hy+3.6)},
  fx:(a)=>{if(f===2)put(a,40,43,[[0,0],[1,-1],[5,-1],[6,0]],DUST)}})},
 // กะพริบตาช้า (slow blink · Humphrey et al. 2020 · รายงานข้อ 5): หรี่ตาครึ่งหนึ่ง ลืม หรี่อีกครั้งแล้วหลับตาค้างราว 1 วิ ค่อยๆ ลืม หน้าอิ่มใจ หูตั้งสบาย หางแกว่งเบาๆ
 slowBlink(f){const E=['half','open','half','shut','half','open'][f],w=[0,.3,.6,.9,.6,.3][f];return sitCat({ear:.04,
  tail:[[33,40.6],[40,42],[43.6,37.4],[43.2+w*.4,31],[40.6+w*1.2,28.6+w*.4]],
  face:(a,hx,hy)=>{const eye=x=>E==='open'?bean(a,x,hy+.4,4):E==='half'?eyeSleepy(a,x-1,hy+1.6):eyeClosed(a,x-1,hy+1.6);eye(17.6);eye(28.6);
   mouth(a,22,hy+4.6);blush(a,13,hy+3.4);blush(a,32,hy+3.4)}})}});
Object.assign(POSES,{turnR:f=>turnCat({dir:1,f}),turnL:f=>turnCat({dir:-1,f}),walkR:f=>sideCat({dir:1,f,mode:'walk'}),walkL:f=>sideCat({dir:-1,f,mode:'walk'}),walkUpR:f=>sideCat({dir:1,f,mode:'walk',up:1}),walkUpL:f=>sideCat({dir:-1,f,mode:'walk',up:1}),runR:f=>sideCat({dir:1,f,mode:'run'}),runL:f=>sideCat({dir:-1,f,mode:'run'}),standR:f=>sideCat({dir:1,f}),standL:f=>sideCat({dir:-1,f})});
const INFO=[['sit','นั่งรอ','สะโพกกลม ขาหน้า U U หางเรียวโค้งขึ้นปลายแกว่ง ตาเม็ดถั่ว กะพริบ หูกระดิก สะบัดหางแบบสุ่มจังหวะ (ค่าเริ่มต้น รอเรียนด้วยกัน)',Array(8).fill(340)],
 ['think','คิด รอคำตอบ','เอียงหัวนิดๆ ตามองขึ้น จุดความคิดโผล่ทีละจุด (ระหว่างทำควิซ รอผู้ใช้ตอบ)',[500,500,500,700]],
 ['read','อ่านหนังสือ','ถือหนังสือสองมือ ตามองลงไล่จากซ้ายไปขวา กะพริบเป็นระยะ (เปิดบทเรียน ไวยากรณ์)',[420,420,420,300]],
 ['happy','ดีใจ','กระโดดเบาๆ หางตั้งตรงปลายงอแกว่งไปมา (แมวดีใจหางจะตั้ง) ตา > < ปากอ้า (ตอบถูก ได้เหรียญ ครบสตรีค โตเป็นร่างใหม่)',[180,120,160,120]],
 ['sad','เสียใจ','หูลู่ หัวก้ม หางแบนราบกับพื้น น้ำตาไหล คิ้วตก (ตอบผิด หายไปนาน)',[450,450,550,450]],
 ['curl','นอนหลับ','นอนขดเป็นโดนัท คางวางบนอุ้งเท้า หางโค้งเลียบก้นมาด้านหน้า หน้า - . - ท้องพองยุบ (ดึก)',[650,650,650,650]],
 ['loaf','ง่วง เคลิ้ม','หมอบแบบขนมปัง ซุกเท้าใต้อก ตาปรือ สัปหงกแล้วสะดุ้ง (ใกล้ดึก ไม่ได้เรียนนาน)',[650,500,450,350]],
 ['eat','กินข้าวปั้น','สองมือถือข้าวปั้นที่ถูกกัดไปคำหนึ่ง เคี้ยวแก้มตุ่ย ตาปิดอร่อย (ตอนให้อาหาร)',[300,260,300,260]],
 ['shy','เขินอาย','อุ้งเท้าสองข้างปิดปาก แก้มแดงมีขีด /// ตาเหลือบหลบ หางม้วนพันเท้า เหงื่อตก (ถูกชม แตะเล่น)',[400,400,400,400]],
 ['curious','สงสัย','เอียงหัว หูข้างหนึ่งเอน นั่งขาหน้าเท่ากัน หางเป็นรูปเครื่องหมาย ? (เจอคำใหม่ เปิดบทไวยากรณ์)',[400,400,400,400]],
 ['belly','รัก ไว้ใจ','นอนตะแคงโชว์พุง แก้มวางพื้นหันมาหาผู้ชม หน้า ⌒ ω ⌒ ขาหน้านวดเบาๆ ขาหลังเหยียดเห็นอุ้งเท้าชมพู หางตั้งแกว่งช้า มีหัวใจลอย (ความสนิทเพิ่ม รัก)',[330,330,330,330]],
 ['groomLeg','เลียขา','นั่งก้น ยกขาหลังซ้ายชูเฉียงขึ้น ขาที่เหลือกางค้ำพื้นตั้งสมดุล หัวไล่เลียตามต้นขาขึ้นลงเป็นจังหวะ 2 รอบ แล้วเงยหน้ามอง (สลับกับเลียแขน)',[200,170,180,170,200,170,180,170,520,420]],
 ['groom','เลียแขน','ยกอุ้งเท้าขึ้นเลีย แลบลิ้น ตาปิด แล้วเอาอุ้งเท้าเช็ดแก้มถึงโคนหู (นานๆ ที และหลังตื่นนอน)',[240,200,220,240,200,220,340,380]],
 ['walkUpR','เดินหางตั้ง (ขวา)','ทักทายตอนเปิดแอป: หางตั้งตรง ปลายงอเป็นตะขอ (สัญญาณเป็นมิตร)',Array(8).fill(85)],
 ['walkUpL','เดินหางตั้ง (ซ้าย)','เหมือนหันขวา กลับด้าน ลายไม่สลับ',Array(8).fill(85)],
 ['walkR','เดิน (หันขวา)','เดิน 4 จังหวะแบบแมวจริง 8 เฟรม (หลังใกล้ → หน้าใกล้ → หลังไกล → หน้าไกล) ยกเท้าพับข้อเห็นอุ้งเท้าชมพู หัวนิ่ง หางตั้งแกว่งช้า เห็นข้างขวาของแมว',Array(8).fill(85)],
 ['walkL','เดิน (หันซ้าย)','รูปทรงเดียวกันกลับด้าน แต่สีเลือกตามข้างซ้ายของแมว แต้มหู แต้มตัว และโบว์จึงอยู่ข้างเดิม ไม่สลับ',Array(8).fill(85)],
 ['runR','วิ่งดีด (หันขวา)','ควบแบบแมว 6 เฟรม ตัวหดรวบขาแล้วยืดลอย ตาโต หูลู่ หางพองฟู มีเส้นความเร็วและฝุ่น (แมวดีดวิ่งรอบห้อง)',Array(6).fill(52)],
 ['runL','วิ่งดีด (หันซ้าย)','เหมือนวิ่งหันขวา ลายและเครื่องประดับอยู่ข้างเดิม',Array(6).fill(52)],
 ['turnR','หันสามส่วนสี่ (ขวา)','ท่าคั่นระหว่างนั่งหันหน้ากับยืนหันข้าง ตัวเฉียง หัวหันมาหาผู้ชมครึ่งหนึ่ง หูข้างไกลแคบลง ลายและโบว์อยู่ข้างเดิม',Array(8).fill(300)],
 ['turnL','หันสามส่วนสี่ (ซ้าย)','เหมือนหันขวา กลับรูปทรง สีตามข้างจริงของแมว',Array(8).fill(300)],
 ['standR','ยืนหันข้าง (ขวา)','ท่าเปลี่ยนระหว่างนั่งกับเดิน ยืนสี่ขา หางแกว่งช้า กะพริบ หูกระดิก สะบัดหางแบบสุ่ม',Array(8).fill(300)],
 ['standL','ยืนหันข้าง (ซ้าย)','เหมือนท่ายืนหันขวา แต่เห็นข้างซ้ายของแมว',Array(8).fill(300)],
 ['pet','ถูกลูบหัว','ดันหัวขึ้นหามือ เอียงถูไปมา ตา ⌒ หูเอนนิดๆ หางตั้งปลายงอ มีเส้นโค้งข้างหู (แตะโซนหัว + ฟอง ゴロゴロ)',[260,260,260,260]],
 ['annoyed','รำคาญ ขั้น 1','หูเอนออกข้าง ตาครึ่งปิด ปากแบน ปลายหางสะบัดเร็ว (แตะถี่เกินไป หรือแตะหาง)',[110,110,110,110]],
 ['slowBlink','กะพริบตาช้า','หรี่ตา ลืม หรี่อีกครั้งแล้วหลับตาค้างราว 1 วิ ค่อยๆ ลืม (แมวบอกว่าไว้ใจ · ตอบเมื่อผู้ใช้กดค้างที่หน้า และทำเองบ่อยขึ้นตามความสนิท)',[320,260,340,1100,380,500]],
 ['lash','รำคาญ ขั้น 2','หูลู่ไปข้างหลัง คิ้วขมวด หางฟาดกว้างและเร็วจนกระทบพื้น (เตือนก่อนเดินหนี ไม่ขู่ ไม่โก่งหลัง)',[90,80,130,80]]];
const KEYS=INFO.map(i=>i[0]);
function draw(ctx,g){ctx.clearRect(0,0,W,H);for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(g[y][x]){ctx.fillStyle=g[y][x];ctx.fillRect(x,y,1,1)}}
// ---------- แกนของแอป: ไม่มีปุ่มหรือหน้าเดโม ----------
const S={theme:'light',coat:'cream',acc:'none',stage:1}; // stage = ร่างตามความสนิท 1–3 (จาก js/pet.js)
const cache={};
function frame(k,f,tm,coat=S.coat,acc=S.acc,idle=null){const key=[tm,coat,acc,k,f,idle].join('|');if(cache[key])return cache[key];
 applyTheme(tm);CO=COATS[coat]||COATS.cream;ACC=acc;IDLE=idle;try{return cache[key]=render(POSES[k](f))}finally{IDLE=null}}
const RM=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches; // ผู้ใช้ปิดแอนิเมชันในระบบ: นั่งนิ่ง (ยังแตะได้)
let playing=!RM;
// ท่าที่ใช้ท่าย่อยแบบสุ่มได้ (สร้างจาก sitCat) และช่วงเวลาสุ่มของแต่ละท่าย่อย (ms)
// ท่าย่อยแบบสุ่ม: blink กะพริบ · twitchL/twitchR หูกระดิกข้างเดียว สองทีติดกันแบบแมวจริง (สุ่มข้าง) · flick สะบัดปลายหาง
// ตอนนอน (ขด หมอบ นอนหงาย) มีแค่หูกระดิกกับปลายหางกระตุก และนานกว่าตอนตื่น
const AWAKE=['sit','think','read','happy','sad','eat','shy','curious','standR','standL','turnR','turnL'],ASLEEP=['curl','loaf','belly'];
const IDLES={blink:{every:[2500,6500],len:140},twitch:{every:[9000,20000],sleep:[12000,28000],len:300,on:[[0,90],[170,280]]},flick:{every:[4500,10000],sleep:[15000,32000],len:320}};
const IDLE_FOR=Object.fromEntries([...AWAKE.map(k=>[k,['blink','twitch','flick']]),...ASLEEP.map(k=>[k,['twitch','flick']])]),IDLE_NAMES=['blink','twitchL','twitchR','flick'];
const rnd=([a,b])=>a+Math.random()*(b-a);
// เลือกท่าย่อยของผืนผ้าใบนี้ตามเวลาจริง: แต่ละผืนสุ่มของตัวเอง แมวจึงไม่กะพริบพร้อมกันทุกตัว
function idleAt(o,now){const ok=IDLE_FOR[o.k];if(!ok||!playing)return null;const sl=ASLEEP.includes(o.k);o.ev=o.ev||{};
 const sched=n=>{o.ev[n]=now+rnd(sl&&IDLES[n].sleep||IDLES[n].every);if(n==='twitch')o.side=Math.random()<.5?'L':'R'};
 for(const n of ok){const c=IDLES[n];if(o.ev[n]==null)sched(n);const t=o.ev[n];
  if(now>=t+c.len){sched(n);if(n==='blink'&&Math.random()<.25)o.ev[n]=now+180}
  else if(now>=t){if(c.on&&!c.on.some(([a,b])=>now-t>=a&&now-t<b))continue;return n==='twitch'?'twitch'+o.side:n}}
 return null}
const frameAt=(dur,t)=>{const T=dur.reduce((a,b)=>a+b,0);t%=T;for(let i=0;i<dur.length;i++){if(t<dur[i])return i;t-=dur[i]}return 0};
const SW=160,SH=90,FLOOR=85,CY=FLOOR-44,XMIN=-2,XMAX=SW-46,CUSH=12,GAIT={walk:{v:12,step:WALK_STEP,n:WALK_N},run:{v:84,step:RUN_STEP,n:RUN.length}}; // step: ระยะต่อเฟรม (เดิน = ระยะที่เท้าบนพื้นถอย เท้าจึงไม่ไถล)
const SCOL={light:{paper:'#fbf1df',lit:null,trunk:'#9a7250',clk:'#fffaf0',hand:'#4f372b',bob:'#e8b04a',glass:'#f3e3cc',wall:'#fff3e3',wall2:'#fbe7cf',trim:'#e5c9a8',floor:'#efd6b5',floor2:'#e4c6a0',seam:'#d8b68e',sky:'#cfe9f7',sky2:'#e8f6fc',frame:'#c49a73',frame2:'#a97e58',cloud:'#ffffff',
  cush:'#f3a8a0',cush2:'#de8a83',cush3:'#fbc9c2',pot:'#dd9264',pot2:'#bf744b',pot3:'#efb08a',leaf:'#86b96f',leaf2:'#65985a',leaf3:'#a8d48f',line:'#7a5a43',shade:'rgba(90,58,38,.14)',moon:null},
 dark:{paper:'#6a5a4a',lit:'#ffd98a',trunk:'#6b5040',clk:'#d9ccb4',hand:'#2e221c',bob:'#b88a3a',glass:'#3a2f27',wall:'#2c2520',wall2:'#27211c',trim:'#3d332b',floor:'#3a3029',floor2:'#342a23',seam:'#2a221c',sky:'#1e2b47',sky2:'#273860',frame:'#7d604a',frame2:'#634a37',cloud:null,
  cush:'#a6625c',cush2:'#864d48',cush3:'#bd7a73',pot:'#9a6544',pot2:'#7b4f34',pot3:'#b07a57',leaf:'#5f8c52',leaf2:'#4a7040',leaf3:'#79a868',line:'#b8987a',shade:'rgba(0,0,0,.3)',moon:'#f4e4a6'}};
const rect=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h)};
const blob=(c,cx,cy,rx,ry,col)=>{c.fillStyle=col;for(let y=Math.floor(cy-ry);y<=cy+ry;y++)for(let x=Math.floor(cx-rx);x<=cx+rx;x++)if(((x+.5-cx)/rx)**2+((y+.5-cy)/ry)**2<=1)c.fillRect(x,y,1,1)};
const canv=()=>{const v=document.createElement('canvas');v.width=SW;v.height=SH;return v};
function roomBg(c,k){
 rect(c,0,0,SW,SH,k.wall);rect(c,0,52,SW,17,k.wall2);rect(c,0,51,SW,1,k.trim);rect(c,0,69,SW,2,k.trim);          // ผนัง ไม้บัวกลาง บัวเชิงผนัง
 rect(c,0,71,SW,SH-71,k.floor);rect(c,0,80,SW,1,k.floor2);[0,40,80,120].forEach(x=>rect(c,x,71,1,SH-71,k.seam)); // พื้นเสื่อ
 rect(c,92,8,40,32,k.frame2);rect(c,93,9,38,30,k.frame);rect(c,95,11,34,26,k.sky);rect(c,95,11,34,7,k.sky2);      // หน้าต่าง
 if(k.moon){blob(c,122,17,3,3,k.moon);[[99,14],[104,31],[117,29],[100,22],[126,32]].forEach(([x,y])=>rect(c,x,y,1,1,k.moon))}
 else if(k.sunY){blob(c,122,k.sunY,4.5,4.5,k.sun);blob(c,102,16,3.5,1.6,k.cloud);blob(c,105,15.4,2.6,1.6,k.cloud)} // รุ่งเช้า/พลบค่ำ: พระอาทิตย์ต่ำใกล้ขอบหน้าต่าง
 else{blob(c,101,15.5,3.5,2,k.cloud);blob(c,104,14.5,3,2.5,k.cloud);blob(c,120,31,3,1.6,k.cloud);blob(c,122.5,30.4,2.4,2,k.cloud)}
 rect(c,111,11,2,26,k.frame);rect(c,95,23,34,2,k.frame);rect(c,90,40,44,2,k.frame2);
 roomLamp(c,k);
 blob(c,38,84.4,24,4.6,k.cush2);blob(c,38,83.4,23.4,4,k.cush);blob(c,33,81.8,12,1.3,k.cush3);[[14,83],[61,83]].forEach(([x,y])=>rect(c,x,y,1,2,k.cush2)); // เบาะนอน (ซาบุตง) กว้างพอให้ท่าขดนอนอยู่บนเบาะ
 blob(c,147,88.6,10,1.6,k.shade)}
// โคมกระดาษตั้งพื้น (อันด้ง) ข้างเบาะ (เจ้าของขอ 2026-11-19 · ของตกแต่งชิ้นแรก) ไฟติดตอนรุ่งเช้า พลบค่ำ และกลางคืน (k.lit)
// แสงบนผนัง/พื้นวาดในฉากหลัง ส่วนแสงที่ตกบนตัวแมววาดทับทีหลังใน roomLight()
function roomLamp(c,k){const L=k.lit;if(L){blob(c,72,62,30,22,'rgba(255,200,120,.10)');blob(c,72,62,19,14,'rgba(255,205,130,.12)');blob(c,72,79,26,4,'rgba(255,200,120,.16)')}
 rect(c,66,50,13,2,k.frame2);rect(c,67,52,11,19,k.frame2);rect(c,68,53,9,17,L||k.paper);if(L)rect(c,69,55,7,13,'#fff2c8'); // โครงไม้ + กระดาษ (ติดไฟ = กลางสว่างกว่า)
 rect(c,72,53,1,17,k.frame);rect(c,68,61,9,1,k.frame);rect(c,67,71,1,6,k.frame2);rect(c,77,71,1,6,k.frame2);rect(c,66,76,13,1,k.frame2)} // ตาราง + ขา
// แสงโคมตกบนทุกอย่างรวมตัวแมว (บวกแสงแบบ lighter) ใช้เมื่อโคมติด
function roomLight(c,k){if(!k.lit)return;c.save();c.globalCompositeOperation='lighter';blob(c,72,64,24,20,'rgba(255,170,90,.07)');blob(c,72,64,14,12,'rgba(255,170,90,.06)');c.restore()}
function roomFg(c,k){
 rect(c,146,58,3,14,k.trunk);rect(c,145,70,5,2,k.trunk);rect(c,149,63,3,1,k.trunk);rect(c,151,61,1,2,k.trunk);rect(c,143,62,3,1,k.trunk); // ลำต้นกับกิ่งแตกสองข้าง (เจ้าของขอ 2026-11-18)
 [[147,51,6.5,8.5],[140.5,57,5,6],[153.5,57,5,6],[147,43,3.8,5]].forEach(([x,y,a,b])=>blob(c,x,y,a,b,k.leaf2));     // พุ่มใบ (ยกขึ้นให้เห็นลำต้น)
 [[146,50,5,7],[140,56,3.8,4.6],[153,56,3.8,4.6],[146.5,42.5,2.8,3.8]].forEach(([x,y,a,b])=>blob(c,x,y,a,b,k.leaf));
 [[144,46],[145,47],[139,54],[151,54],[145,41]].forEach(([x,y])=>rect(c,x,y,1,1,k.leaf3));
 for(let y=72;y<=88;y++){const h=y<75?8:7-(y-75)*.2;rect(c,Math.round(147-h),y,Math.round(h*2),1,y<75?k.pot3:k.pot)}rect(c,141,76,1,10,k.pot3);rect(c,152,77,2,10,k.pot2); // กระถาง
}
// ---------- ฉากพิกเซลตามสถานที่ (เจ้าเหมียวเที่ยวญี่ปุ่น · js/data/places.js) ----------
// ทุกฉากขนาด 160×90 เส้นพื้น y=85 เหมือนกัน · มีที่นอน (bed: เบาะ x=12) เฉพาะห้องอ่านหนังสือ (เจ้าของขอ 2026-11-19: ไปเที่ยวแล้วมีเบาะดูแปลก)
// ที่อื่น bed = null: แมวไม่เดินไปขดหลับลึก แต่งีบหมอบตรงที่อยู่แทน (แมวระวังตัวในที่ไม่คุ้น)
// ฉากหลัง (bg) อยู่หลังแมว ฉากหน้า (fg) บังแมวได้และมีเส้นขอบอัตโนมัติ · โหมดมืด = กลางคืน
// วาดเองทั้งหมด (ต้นฉบับ) · มุมซ้ายบนเว้นโล่งไว้ให้กล่องคำพูด
const poly=(c,P,col)=>{c.fillStyle=col;const xs=P.map(p=>p[0]),ys=P.map(p=>p[1]);
 for(let y=Math.floor(Math.min(...ys));y<=Math.max(...ys);y++)for(let x=Math.floor(Math.min(...xs));x<=Math.max(...xs);x++){const px=x+.5,py=y+.5;let ins=false;
  for(let i=0,j=P.length-1;i<P.length;j=i++){const[xi,yi]=P[i],[xj,yj]=P[j];if((yi>py)!==(yj>py)&&px<(xj-xi)*(py-yi)/(yj-yi)+xi)ins=!ins}if(ins)c.fillRect(x,y,1,1)}};
const sky=(c,k,y2)=>{rect(c,0,0,SW,y2,k.sky);rect(c,0,y2-16,SW,16,k.sky2);
 if(k.moon){blob(c,132,13,3,3,k.moon);[[78,8],[104,20],[146,26],[90,30],[120,6]].forEach(([x,y])=>rect(c,x,y,1,1,k.moon))}
 else{blob(c,130,k.sunY||12,k.sunY?5:4,k.sunY?5:4,k.sun);blob(c,78,14,3.5,2,k.cloud);blob(c,81,13,3,2.5,k.cloud);blob(c,106,24,3,1.6,k.cloud);blob(c,108.5,23.4,2.4,2,k.cloud)}};

// สวนญี่ปุ่น (庭): ภูเขาไกล รั้วไม้ไผ่ สนาม ทางกรวดคราด โคมหิน ต้นไม้ นอนบนหินแบน · ฉากหน้า: พุ่มอาซาเลีย
const GCOL={light:{sky:'#cfe9f7',sky2:'#e6f4fb',sun:'#ffd987',cloud:'#ffffff',mtn:'#b7d1c6',mtn2:'#a3c2b6',fence:'#d2b07a',fence2:'#ad8a55',grass:'#b4d68f',grass2:'#9cc579',
  gravel:'#efe8da',gravel2:'#dcd1bc',stone:'#c9c3b8',stone2:'#aaa294',stone3:'#e2ddd4',lan:'#c2bbaf',lan2:'#9e9688',lwin:'#f6e7c0',glow:null,trunk:'#8a6a4a',
  leaf:'#86b96f',leaf2:'#65985a',leaf3:'#a8d48f',flower:'#f2a0b4',line:'#5f6e4a',shade:'rgba(70,80,50,.16)',moon:null},
 dark:{sky:'#1e2b47',sky2:'#273860',moon:'#f4e4a6',mtn:'#2f3f4a',mtn2:'#28363f',fence:'#6e5a40',fence2:'#57462f',grass:'#3f5a3a',grass2:'#354d31',
  gravel:'#4c4741',gravel2:'#403b36',stone:'#625d57',stone2:'#4c4843',stone3:'#736e67',lan:'#5d5952',lan2:'#4a4741',lwin:'#f6d27a',glow:'rgba(246,210,122,.16)',trunk:'#5a4636',
  leaf:'#5f8c52',leaf2:'#4a7040',leaf3:'#79a868',flower:'#b8738a',line:'#a9b893',shade:'rgba(0,0,0,.3)'}};
function gardenBg(c,k){sky(c,k,52);
 poly(c,[[0,44],[18,34],[34,41],[58,27],[82,42],[102,35],[126,46],[160,36],[160,52],[0,52]],k.mtn);poly(c,[[0,50],[30,42],[60,49],[96,43],[132,50],[160,45],[160,52],[0,52]],k.mtn2);
 rect(c,0,47,SW,15,k.fence);for(let x=1;x<SW;x+=4)rect(c,x,47,1,15,k.fence2);rect(c,0,46,SW,1,k.fence2);rect(c,0,50,SW,1,k.fence2);rect(c,0,57,SW,1,k.fence2); // รั้วไม้ไผ่
 rect(c,0,62,SW,10,k.grass);[[6,64],[22,67],[48,63],[70,66],[88,64],[118,67],[136,63],[152,66]].forEach(([x,y])=>{rect(c,x,y,1,2,k.grass2);rect(c,x+2,y+1,1,1,k.grass2)});
 rect(c,0,72,SW,18,k.gravel);for(let y=75;y<90;y+=4)for(let x=0;x<SW;x++)if((x+y)%14<10)rect(c,x,y+(x%28<14?0:1),1,1,k.gravel2); // ทางกรวดคราดเป็นลอน
 rect(c,123,26,3,40,k.trunk);rect(c,119,40,5,2,k.trunk);[[116,24,9,5],[131,20,11,6],[124,31,8,4],[112,36,6,3]].forEach(([x,y,a,b])=>blob(c,x,y,a,b,k.leaf2));
 [[116,23,7,3.5],[131,19,9,4.5],[124,30,6,3]].forEach(([x,y,a,b])=>blob(c,x,y,a,b,k.leaf));[[113,21],[128,16],[136,18],[121,28]].forEach(([x,y])=>rect(c,x,y,1,1,k.leaf3)); // ต้นสน
 if(k.glow)blob(c,105,54,11,9,k.glow);
 rect(c,98,69,14,3,k.lan2);rect(c,103,59,4,10,k.lan);rect(c,99,57,12,2,k.lan2);rect(c,100,50,10,7,k.lan);rect(c,103,52,4,4,k.lwin);
 poly(c,[[96,51],[105,44],[114,51]],k.lan2);rect(c,104,42,2,2,k.lan2); // โคมหิน (โทโร)
 blob(c,147,88.6,11,1.6,k.shade)}
function gardenFg(c,k){[[147,79,12,9],[137,83,7,6],[157,82,7,7]].forEach(([x,y,a,b])=>blob(c,x,y,a,b,k.leaf2));[[146,78,10,7],[137,82,5,4.5],[156,81,5,5]].forEach(([x,y,a,b])=>blob(c,x,y,a,b,k.leaf));
 [[141,75],[148,72],[154,76],[145,80],[151,79],[136,80],[158,79],[143,84]].forEach(([x,y])=>{rect(c,x,y,2,2,k.flower)});[[150,74],[139,78],[156,84]].forEach(([x,y])=>rect(c,x,y,1,1,k.leaf3))}

// คาเฟ่ (喫茶店): ผนังไม้ กระดานเมนูชอล์ก โคมไฟห้อย ชั้นโหลกาแฟ พื้นตาหมากรุก นอนในตะกร้า · ฉากหน้า: โต๊ะกลมกับกาแฟและโดรายากิ
const KCOL={light:{wall:'#f1dcc0',wall2:'#e5caa6',trim:'#b9875c',wains:'#cfa274',wains2:'#b98c60',floor:'#ead2b2',floor2:'#dcbf98',board:'#4d6656',frame:'#a97e58',chalk:'#f3efe4',
  shelf:'#a97e58',jar:'#e9f1f2',beans:'#7a4f34',dora:'#d39a58',dora2:'#b97b3c',cup:'#ffffff',cup2:'#e2d8cc',lamp:'#e08a5e',lamp2:'#c46f45',glow:'rgba(255,214,150,.32)',
  plant:'#86b96f',bed:'#c08b5c',bed2:'#9f6c3d',bed3:'#f6e6cf',table:'#a97e58',table2:'#8a6040',line:'#7a5a43',shade:'rgba(90,58,38,.14)'},
 dark:{wall:'#3a2e26',wall2:'#33281f',trim:'#5a4331',wains:'#4a3a2c',wains2:'#3f3125',floor:'#3d3128',floor2:'#352a22',board:'#2c3a32',frame:'#7d604a',chalk:'#c9c4b6',
  shelf:'#7d604a',jar:'#8a9799',beans:'#4d3222',dora:'#9a6c3c',dora2:'#7f5530',cup:'#d8d2ca',cup2:'#a9a197',lamp:'#f0a070',lamp2:'#c47a4e',glow:'rgba(255,190,120,.2)',
  plant:'#5f8c52',bed:'#86603f',bed2:'#6b4b30',bed3:'#b9a68b',table:'#7d604a',table2:'#634a37',line:'#b8987a',shade:'rgba(0,0,0,.3)'}};
function cafeBg(c,k){rect(c,0,0,SW,52,k.wall);for(let x=9;x<SW;x+=10)rect(c,x,0,1,51,k.wall2);
 const bx=50;rect(c,bx,14,36,24,k.frame);rect(c,bx+1,15,34,22,k.board);rect(c,bx+4,18,18,1,k.chalk);
 [[23,12],[27,9],[31,13]].forEach(([y,w])=>{rect(c,bx+4,y,w,1,k.chalk);rect(c,bx+26,y,5,1,k.chalk)});rect(c,bx+27,17,2,2,k.chalk); // เมนูชอล์ก (เส้นแทนตัวหนังสือ)
 blob(c,94,20,16,12,k.glow);rect(c,94,0,1,7,k.trim);poly(c,[[88,13],[90,7],[99,7],[101,13]],k.lamp);rect(c,88,13,13,1,k.lamp2);rect(c,93,14,3,1,k.cup); // โคมไฟห้อย
 rect(c,100,22,54,2,k.shelf);rect(c,100,41,54,2,k.shelf);
 rect(c,102,13,8,9,k.jar);rect(c,102,17,8,5,k.beans);rect(c,101,12,10,2,k.shelf);rect(c,114,14,7,8,k.jar);rect(c,114,18,7,4,k.dora);rect(c,113,13,9,2,k.shelf);
 [128,135,142].forEach(x=>{rect(c,x,17,5,5,k.cup);rect(c,x+5,18,1,2,k.cup2)});
 rect(c,104,35,6,6,k.lamp2);blob(c,107,31,4,4,k.plant);[37,39].forEach(y=>rect(c,118,y,11,1,k.cup2));rect(c,119,36,9,1,k.cup);rect(c,136,31,11,10,k.beans);rect(c,138,34,7,3,k.bed3); // ชั้นของ
 rect(c,0,52,SW,17,k.wains);for(let x=19;x<SW;x+=20)rect(c,x,53,1,16,k.wains2);rect(c,0,51,SW,1,k.trim);rect(c,0,69,SW,2,k.trim);
 for(let y=71;y<SH;y+=5)for(let x=0;x<SW;x+=8)rect(c,x,y,8,5,((x/8+(y-71)/5)&1)?k.floor2:k.floor); // พื้นตาหมากรุก
 blob(c,146,88.6,10,1.4,k.shade)}
function cafeFg(c,k){rect(c,128,63,32,3,k.table);rect(c,128,66,32,1,k.table2);rect(c,144,67,4,19,k.table);rect(c,138,86,16,2,k.table2);
 rect(c,133,62,10,1,k.cup2);rect(c,135,57,6,5,k.cup);rect(c,141,58,1,3,k.cup2);rect(c,136,57,4,1,k.beans); // กาแฟ
 rect(c,147,62,11,1,k.cup2);blob(c,152.5,60.4,4.6,1.8,k.dora2);blob(c,152.5,59.6,4.4,1.6,k.dora)} // โดรายากิ

// สถานีรถไฟ (駅): หลังคาชานชาลา เมืองไกล ป้ายสถานี ตู้กดน้ำ ม้านั่ง แถบเบรลล์สีเหลือง นอนบนผ้าห่มพับ · ฉากหน้า: เสาชานชาลากับนาฬิกา
const TCOL={light:{sky:'#cfe9f7',sky2:'#e6f4fb',sun:'#ffd987',cloud:'#ffffff',city:'#b8c6d4',city2:'#a6b5c4',cwin:null,roof:'#6f6a73',roof2:'#5a5660',beam:'#8b8590',sign:'#ffffff',signb:'#4f8fd6',ink:'#3b3540',
  wall:'#ddd8cf',wall2:'#cbc5bb',vm:'#d9625c',vm2:'#b84c47',vmg:'#eef4f6',vglow:null,d1:'#5b9bd6',d2:'#f0bb55',d3:'#86c49b',bench:'#c49a73',bench2:'#a97e58',plat:'#d8d3cb',plat2:'#c4beb4',edge:'#f0c84a',edge2:'#d4a92c',
  mat:'#7fb0d8',mat2:'#5f93c0',mat3:'#a9cbe8',pil:'#9aa0a8',pil2:'#80868f',pil3:'#b8bec5',clock:'#ffffff',line:'#5a5660',shade:'rgba(60,60,70,.16)',moon:null},
 dark:{sky:'#1e2b47',sky2:'#273860',moon:'#f4e4a6',city:'#2b3446',city2:'#252d3d',cwin:'#f4d27a',roof:'#2e2b31',roof2:'#25232a',beam:'#3e3a42',sign:'#cfcac2',signb:'#3b6aa0',ink:'#2a2530',
  wall:'#3a3631',wall2:'#322e2a',vm:'#9c4744',vm2:'#7e3936',vmg:'#f2f0d8',vglow:'rgba(242,240,216,.14)',d1:'#4a7fae',d2:'#c49a45',d3:'#6d9c7c',bench:'#7d604a',bench2:'#634a37',plat:'#47433e',plat2:'#3c3834',edge:'#b8952f',edge2:'#987a22',
  mat:'#4f6f8c',mat2:'#3f5a73',mat3:'#6585a2',pil:'#4e535a',pil2:'#41454b',pil3:'#5e636a',clock:'#e8e4dc',line:'#9aa0a8',shade:'rgba(0,0,0,.3)'}};
function stationBg(c,k){sky(c,k,54);
 [[0,36,14],[16,30,10],[28,40,16],[46,34,9],[57,42,13],[72,31,10],[84,38,17],[103,33,9],[114,41,14],[130,29,11],[143,37,17]].forEach(([x,y,w],i)=>{rect(c,x,y,w,54-y,i%2?k.city2:k.city);
  if(k.cwin)for(let wy=y+3;wy<50;wy+=5)for(let wx=x+2;wx<x+w-2;wx+=4)if((wx*7+wy*3+i)%5<2)rect(c,wx,wy,1,2,k.cwin)}); // เมืองไกล กลางคืนเปิดไฟ
 rect(c,0,0,SW,6,k.roof);rect(c,0,6,SW,1,k.roof2);rect(c,0,7,SW,2,k.beam); // หลังคาชานชาลา
 rect(c,100,9,1,5,k.beam);rect(c,128,9,1,5,k.beam);rect(c,92,14,45,15,k.ink);rect(c,93,15,43,13,k.sign);rect(c,93,24,43,4,k.signb);
 [[109,17,2,2],[112,15,2,2],[116,15,2,2],[119,17,2,2],[112,19,6,3],[111,20,8,1]].forEach(([x,y,w,h])=>rect(c,x,y,w,h,k.ink)); // ป้ายสถานีเป็นรูปอุ้งเท้า (ไม่ใช้ตัวอักษรปลอม)
 rect(c,95,25,3,1,k.sign);rect(c,131,25,3,1,k.sign);
 rect(c,0,54,SW,16,k.wall);rect(c,0,54,SW,1,k.wall2);for(let x=39;x<SW;x+=40)rect(c,x,55,1,15,k.wall2);
 if(k.vglow)blob(c,13,54,15,15,k.vglow);
 rect(c,4,40,18,30,k.vm);rect(c,4,40,18,2,k.vm2);rect(c,6,43,14,13,k.vmg);[[0,k.d1],[1,k.d2],[2,k.d3],[3,k.d1]].forEach(([i,col])=>{rect(c,7+i*3.5|0,45,2,4,col);rect(c,7+((i+2)%4)*3.5|0,51,2,4,i%2?k.d3:k.d2)});
 rect(c,9,61,8,3,k.vm2);rect(c,18,58,2,2,k.vmg); // ตู้กดน้ำ
 rect(c,96,56,32,2,k.bench);rect(c,96,62,32,2,k.bench);rect(c,98,58,1,4,k.bench2);rect(c,125,58,1,4,k.bench2);rect(c,98,64,2,6,k.bench2);rect(c,124,64,2,6,k.bench2); // ม้านั่ง
 rect(c,0,70,SW,20,k.plat);rect(c,0,70,SW,1,k.plat2);rect(c,0,76,SW,3,k.edge);for(let x=1;x<SW;x+=3)rect(c,x,77,1,1,k.edge2);for(let x=31;x<SW;x+=32)rect(c,x,79,1,11,k.plat2); // ชานชาลา + แถบเบรลล์
 blob(c,150,88.6,7,1.4,k.shade)}
function stationFg(c,k){rect(c,146,9,8,81,k.pil);rect(c,146,9,2,81,k.pil3);rect(c,152,9,2,81,k.pil2);rect(c,145,86,10,4,k.pil2);
 blob(c,150,30,5,5,k.ink);blob(c,150,30,4,4,k.clock);rect(c,150,27,1,3,k.ink);rect(c,150,30,2,1,k.ink)} // เสากับนาฬิกา

// นาฬิกาลูกตุ้มติดผนังในห้อง: เข็มชั่วโมง/นาทีตามเวลาจริงของเครื่อง ลูกตุ้มแกว่งรอบละ 2 วินาที (ปิดแอนิเมชัน = ลูกตุ้มนิ่ง)
// วาดทับฉากหลังทุกครั้งที่วาดใหม่ (ฉากหลังแคชไว้ จึงวาดนาฬิกาแยก) หน้าปัดกลางพิกเซล (39,17)
const hand=(c,a,len,col,w=0)=>{c.fillStyle=col;for(let t=0;t<=len;t+=.25)for(const o of w?[-.45,.45]:[0])c.fillRect(Math.floor(39.5+Math.sin(a)*t+Math.cos(a)*o),Math.floor(17.5-Math.cos(a)*t+Math.sin(a)*o),1,1)}; // w = เข็มหนา (ชั่วโมง)
function roomClock(c,k,d,sw){rect(c,37,4,5,2,k.frame2);rect(c,30,6,19,2,k.frame2);rect(c,31,8,17,35,k.frame2);rect(c,32,8,15,34,k.frame);rect(c,31,42,17,1,k.frame2);
 blob(c,39.5,17.5,6.6,6.6,k.frame2);blob(c,39.5,17.5,5.7,5.7,k.clk);[[39,12],[44,17],[39,22],[34,17]].forEach(([x,y])=>rect(c,x,y,1,1,k.frame2));
 const m=d.getMinutes(),h=d.getHours()%12+m/60;hand(c,h/12*2*Math.PI,3,k.hand,1);hand(c,m/60*2*Math.PI,4.8,k.hand);rect(c,39,17,1,1,k.hand);
 rect(c,35,27,9,13,k.glass);const a=sw*.32,ex=39.5+Math.sin(a)*8,ey=27+Math.cos(a)*8;c.fillStyle=k.frame2;for(let t=0;t<=8;t+=.5)c.fillRect(Math.floor(39.5+Math.sin(a)*t),Math.floor(27+Math.cos(a)*t),1,1);blob(c,ex,ey,1.7,1.7,k.bob)}
const SCENES={room:{pal:SCOL,bg:roomBg,fg:roomFg,bed:CUSH,live:roomClock,over:roomLight},garden:{pal:GCOL,bg:gardenBg,fg:gardenFg,bed:null},cafe:{pal:KCOL,bg:cafeBg,fg:cafeFg,bed:null},station:{pal:TCOL,bg:stationBg,fg:stationFg,bed:null}};
let PLACE='room';const SCN=()=>SCENES[PLACE]||SCENES.room;
// รุ่งเช้า (05–07) / พลบค่ำ (17–19): ใช้ชุดสีกลางวัน เปลี่ยนฟ้าเป็นชมพูอมพีช/ส้ม พระอาทิตย์ลอยต่ำ แล้วย้อมทั้งภาพด้วยสีอุ่น (WARM, multiply) ให้แมวอมแสงเดียวกัน
// ฟ้าห้อง: sky = ฟ้าในหน้าต่าง sky2 = แถบบนสุด · ฉากกลางแจ้ง (sky()): sky = ฟ้าด้านบน sky2 = แถบใกล้ขอบฟ้า
const TWI={dawn:{room:{sky:'#ffd2b8',sky2:'#c9b3e0',sun:'#ffc07a',cloud:'#ffe6dc',sunY:33},out:{sky:'#c9b6e6',sky2:'#ffcfb4',sun:'#ffbf80',cloud:'#ffe3d6',sunY:44},lit:'#ffe2a0'},
 dusk:{room:{sky:'#ffae6e',sky2:'#c9798f',sun:'#ff7a45',cloud:'#ffc49e',sunY:33},out:{sky:'#d58aa0',sky2:'#ffb070',sun:'#ff7845',cloud:'#ffc0a0',sunY:42},lit:'#ffd98a'}};
const WARM={dawn:'#f6e2ee',dusk:'#ffd6b8'};
function palOf(s,sk){if(s.pal[sk])return s.pal[sk];const t=TWI[sk];if(!t)return s.pal.light;return s.pal[sk]={...s.pal.light,...(s===SCENES.room?t.room:t.out),moon:null,lit:t.lit}}
const bgC={},fgC={};
function sceneBg(tm){const id=PLACE+'|'+tm;if(bgC[id])return bgC[id];const s=SCN(),v=canv(),c=v.getContext('2d');s.bg(c,palOf(s,tm));return bgC[id]=v}
function sceneFg(tm){const id=PLACE+'|'+tm;if(fgC[id])return fgC[id];const s=SCN(),k=palOf(s,tm),v=canv(),c=v.getContext('2d');s.fg(c,k);
 // เส้นขอบรอบฉากหน้า ให้เข้าชุดกับแมว
 const d=c.getImageData(0,0,SW,SH),A=(x,y)=>x>=0&&y>=0&&x<SW&&y<SH&&d.data[(y*SW+x)*4+3]>0,o=[];
 for(let y=0;y<SH;y++)for(let x=0;x<SW;x++)if(!A(x,y)&&(A(x+1,y)||A(x-1,y)||A(x,y+1)||A(x,y-1)))o.push([x,y]);o.forEach(([x,y])=>rect(c,x,y,1,1,k.line));return fgC[id]=v}
const cat={x:52,dir:1,mode:'sit',t:0,dur:2500,dist:0,target:52,then:null,k:'sit'};
const rr=(a,b)=>a+Math.random()*(b-a),DUR=Object.fromEntries(INFO.map(i=>[i[0],i[3]]));
function setMode(m,dur=0){if(m==='sit')dur*=pk('sit');else if(m==='nap'||m==='curl')dur*=pk('nap');cat.mode=m;cat.t=0;cat.dur=dur;cat.ev=null} // นิสัยยืด/ย่อเวลานั่งและงีบ
function goTo(tx,then,run=false){cat.target=Math.round(clamp(tx,XMIN,XMAX));cat.then=then;cat.run=run;if(cat.target===Math.round(cat.x)){cat.x=cat.target;arrive();return}cat.dir=cat.target>cat.x?1:-1;setMode('turnOut',run?120:260)}
// วิ่งดีด: วิ่งไปเกือบสุดอีกฝั่งของห้อง แล้ววิ่งกลับมาครึ่งทาง
function zoom(){const far=cat.x<(XMIN+XMAX)/2?XMAX-rr(0,8):XMIN+rr(0,8);goTo(far,'zoom2',true)}
function arrive(){if(cat.then==='zoom2'){cat.then='sit';const tx=(XMIN+XMAX)/2+rr(-20,20);cat.target=Math.round(tx);cat.dir=cat.target>cat.x?1:-1;setMode('skid',220);return}
 if(cat.then==='greet'){cat.then='sit';const g=cat.greet||1;act('happy',g>1?2800:1600);say(g>1?[['ニャー！ ニャー！',1300],['ゴロゴロ…',1700]]:[['ニャッ♪',1500]]);return}
 if(cat.then==='come'){cat.then='sit';return setMode('sit',rr(5000,9000))} // มานั่งใกล้ๆ แล้วอยู่นานหน่อย
 if(cat.then==='leave'){cat.then='sit';cat.cool=rr(15000,20000)*pk('cool');return groom()} // เดินหนีแล้วเลียขน พักราว 15–20 วิ
 if(cat.then==='sleep')setMode('loaf',rr(3000,4500));else setMode('sit',rr(3000,7000))}
// ทักทายตามเวลาที่หายไป (Eriksson 2017: หายนานทักแรงขึ้น · หางตั้งเดินเข้าหา = ทักทายเป็นมิตร)
// ไม่ถึง 30 นาที: ไม่ทำอะไรพิเศษ · 30 นาที–4 ชม.: เดินหางตั้งมากลางห้อง ดีใจ ฟอง ニャッ♪ (ถ้าหลับอยู่ ปล่อยหลับต่อ) · 4 ชม.ขึ้นไป: หลับอยู่ก็ตื่นก่อน แล้วเดินหางตั้งมา ดีใจนานขึ้น ニャー！→ゴロゴロ…
// ปิดแอนิเมชัน: ไม่เดิน แค่ขึ้นฟองคำพูด
function greet(ms){if(!(ms>=18e5))return;const g=ms>=144e5?2:1,asleep=cat.mode==='curl'||cat.mode==='loaf'||cat.mode==='nap';cat.greet=g;
 if(!cv||!cv.isConnected){pendGreet=ms;return}
 if(!playing)return say(g>1?[['ニャー！',1500]]:[['ニャッ♪',1500]]);
 if(asleep){if(g<2)return;cat.after='greet';return setMode('wake',1400)}greetGo()}
function greetGo(){goTo((XMIN+XMAX)/2+rr(-14,14),'greet')}
const GT=k=>DUR[k].reduce((a,b)=>a+b,0),GROOM_T=GT('groom');function groom(k='groom'){cat.gk=k;setMode('groom',GT(k)*2)} // เริ่มที่อุ้งเท้าหน้า/หน้าเสมอ แล้วต่อขาหลัง 60% (เลียไล่จากหัวลงหาง Eckstein & Hart 2000)
// เล่นท่าใดก็ได้ใน INFO ตามเวลาที่กำหนด แล้วกลับมานั่ง (ไว้ผูกกับเหตุการณ์ในแอป เช่น ตอบถูก = act('happy',1600))
function act(k,ms){cat.pose=k;setMode('pose',ms)}
// น้ำหนักการตัดสินใจตามช่วงเวลาจริงของเครื่อง (รายงาน reports/พฤติกรรมแมวบ้าน… 2026-11-19): แมวจริงคึกช่วงเช้า/เย็น ง่วงช่วงเที่ยงและกลางคืน
// วิ่งดีดเป็นเหตุการณ์นานๆ ครั้ง · งีบอยู่กับที่ (nap = ท่าหมอบ 8–14 วิ) เพิ่มเวลาพักโดยไม่ต้องเดินไปเบาะบ่อย · นั่งมอง (watch = ท่าสงสัย)
// ทิศทางมีหลักฐานระดับปานกลาง ส่วนตัวเลขเป็นค่าของเกม (บีบเวลา: งีบจริง ~79 นาที → curl 24–36 วิ)
const DAYW={day:{bed:9,nap:14,zoom:2,groom:14,walk:31,watch:8,come:3,sit:19},tw:{bed:5,nap:9,zoom:6,groom:12,walk:37,watch:9,come:4,sit:18},
 noon:{bed:14,nap:20,zoom:1,groom:14,walk:22,watch:8,come:2,sit:19},night:{bed:25,nap:20,zoom:1,groom:13,walk:16,watch:5,come:1,sit:19}}; // come = เดินมานั่งใกล้ๆ ผู้ใช้เอง
// ---------- นิสัย → พฤติกรรม (v63 · รายงาน "บทพูดสัตว์เลี้ยงตามนิสัย 10 แบบ" หัวข้อ Feline Five) ----------
// บุคลิกแมวจริงมีแกนซ้ำกันข้ามงานวิจัย: กระตือรือร้น ความกลัว ความเป็นมิตรกับคน ความหุนหัน (Litchfield 2017 แมว 2,802 ตัว · Salonen 2019) ความกระตือรือร้นต่างกันมากที่สุด
// ลำดับตรงกับ TR ใน js/data/pet-lines.js · ตัวคูณทุกตัวเป็นค่าของเกม (แมวกลาง = 1) · ผูกกับมิติจริงได้มั่นใจ: พลังล้น ขี้เซา ขี้สงสัย (สูง) เงียบสงบ ขี้อาย ตัวน้อย (กลาง) ที่เหลือเป็นกรอบทางสังคม
// w = น้ำหนัก decide() · sit/nap = เวลานั่ง/งีบ · tol = ความทนลูบ (ขี้อายโตตามร่าง) · shy = โอกาสเขินตอนลูบหัว · sb = กะพริบตาช้าเอง · cool = เวลาพักหลังเดินหนี · voc = ร้องเอง · hide = ไปแอบหลังของ
const PERS=[
 {w:{zoom:2,nap:.6,bed:.7,walk:1.2,watch:.6},sit:.8,voc:1.2,sb:.8,mw:'ニャッ！'},                         // 0 พลังล้น: E สูง วิ่งพล่าน นั่งไม่ติด
 {w:{zoom:.4,nap:1.5,walk:.8},sit:1.3,tol:1.2,shy:.5,sb:1.3,voc:.5,mw:'…ニャ'},                 // 1 เงียบสงบ: N ต่ำ I ต่ำ หมอบนาน กะพริบตาช้าบ่อย พูดน้อย
 {w:{come:.4,zoom:.6},tol:[.6,.8,1],shy:2,sb:.7,cool:1.3,hide:.35,mw:'にゃ…'},                  // 2 ขี้อาย: N สูง แอบหลังของ ทนลูบน้อยแล้วโตตามร่าง เขินบ่อย
 {w:{come:2.2},tol:.7,shy:1.5,voc:.7,mw:'ニャ'},                                                // 3 ปากแข็งแต่ใจดี: เดินมานั่งข้างๆ เอง แต่ทนการลูบที่ผู้ใช้เริ่มสั้นกว่า (ให้แมวเลือก Haywood 2021)
 {w:{nap:2,bed:1.6,zoom:.3,walk:.7},nap:1.4,sit:1.2,tol:1.4,sb:1.2,voc:.6,mw:'ふにゃ…'},          // 4 ชิลๆ ขี้เซา: E ต่ำ งีบบ่อยและนาน ทนลูบ
 {w:{zoom:1.6,walk:1.1,nap:.7},sit:.7,tol:.9,voc:1.1,mw:'ニャ〜'},                                      // 5 ขี้เล่นจอมแซว: E สูง I สูง พุ่งกะทันหัน เปลี่ยนท่าไว
 {w:{watch:2.8,walk:1.3,nap:.8},voc:1,mw:'ンニャ？'},                                             // 6 ขี้สงสัย: E สูง N ต่ำ นั่งจ้องสงสัยบ่อย เดินสำรวจ
 {w:{come:1.6,groom:1.3,zoom:.5},tol:1.1,sb:1.2,voc:.6,mw:'ニャン'},                            // 7 สุภาพเรียบร้อย: A สูง I ต่ำ เดินหางตั้งมาทัก เลียขนเรียบร้อย ไม่เรียกร้อง
 {w:{watch:2,zoom:.5},sit:1.2,voc:.8,mw:'ニャ。'},                                              // 8 นักวิชาการ: นั่งเฝ้ามอง (แมวจริงไม่มีมิติวิชาการ ความมั่นใจต่ำ)
 {w:{walk:1.3,zoom:1.2},cool:.6,voc:1.1,mw:'ニャッ'}];                                          // 9 ตัวน้อยขยันสู้: N ต่ำ กล้า เดินสำรวจ ฟื้นไวหลังเดินหนี
let PS={};const pk=(k,d=1)=>PS[k]??d;
// อารมณ์รายวัน ±15% ต่อพฤติกรรม (คงที่ทั้งวัน) ให้แต่ละวันไม่เหมือนกันเป๊ะ
const jit=k=>{const d=new Date();let x=0;for(const c of d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate()+k)x=(x*31+c.charCodeAt(0))>>>0;return .85+(x%1000)/1000*.3};
// ร้องเองนานๆ ครั้งตอนจบช่วงนั่ง เสียงตามนิสัย (Fe-BARQ วัดการส่งเสียงแยกจากความกระตือรือร้น) ไม่ทับฟองที่กำลังพูดอยู่
function meow(){if(sayOrig==null&&cv&&cv.isConnected)say([[pk('mw','ニャ'),1100]])}
let PART=null;const dayPart=(h=new Date().getHours())=>PART||(h>=21||h<5?'night':h<9||h>=17?'tw':h>=11&&h<15?'noon':'day'); // tw = เช้า 05–09 / เย็น 17–21
function decide(){if(Math.random()<(SBP[S.stage]||0)*pk('sb'))return slowBlink();if(Math.random()<.03*pk('voc'))meow();
 const W=Object.entries(DAYW[dayPart()]).map(([k,v])=>[k,v*((PS.w||{})[k]??1)*jit(k)]);let r=Math.random()*W.reduce((a,b)=>a+b[1],0); // น้ำหนักตามช่วงเวลา × นิสัย × อารมณ์รายวัน
 for(const[k,v]of W){if((r-=v)>=0)continue;
  if(k==='come')return goTo((XMIN+XMAX)/2+rr(-10,10),'come');
  if(k==='bed'&&SCN().bed!=null)return goTo(SCN().bed,'sleep');if(k==='nap'||k==='bed')return setMode('nap',rr(8000,14000));if(k==='zoom')return zoom();if(k==='groom')return groom();
  if(k==='watch'){cat.pose='curious';return setMode('pose',rr(3000,6000))}
  if(k==='walk'){if(Math.random()<pk('hide',0))return goTo(XMAX-rr(0,6),'sit'); // ขี้อาย: ไปแอบหลังของฉากหน้าฝั่งขวา (กระถาง พุ่มไม้ โต๊ะ เสา) โผล่แค่หัว
   let tx,n=0;do tx=rr(XMIN,XMAX);while(Math.abs(tx-cat.x)<24&&++n<20);return goTo(tx,'sit')}break}
 setMode('sit',rr(2500,5000))}
function step(dt){const m=cat.mode;if(cat.tol>0)cat.tol=Math.max(0,cat.tol-TOL_DECAY*dt/1000);if(cat.cool>0&&(cat.cool-=dt)<=0){cat.cool=0;cat.tol=0} // มาตรวัดความทนค่อยๆ ลด · พักครบแล้วกลับมาเล่นได้ตามปกติ
 if(!playing&&!TAPM[m])return;cat.t+=dt;
 if(m==='walk'||m==='run'){const d=GAIT[m].v*dt/1000,left=cat.target-cat.x;if(Math.abs(left)<=d){cat.x=cat.target;if(m==='run'&&cat.then==='zoom2')arrive();else setMode('halt',m==='run'?240:300)}else{cat.x+=Math.sign(left)*d;cat.dist+=d}return}
 if(!cat.dur||cat.t<cat.dur)return;
 ({sit:decide,turnOut:()=>cat.run?setMode('run'):setMode('rise',260),skid:()=>setMode('run'),rise:()=>setMode('walk'),halt:()=>setMode('turnIn',260),turnIn:arrive,loaf:()=>setMode('curl',rr(24000,36000)),curl:()=>setMode('wake',1500),nap:()=>setMode('sit',rr(2500,5000)),
  wake:()=>{if(cat.after==='greet'){cat.after=null;return greetGo()}Math.random()<.35?groom():setMode('sit',rr(3000,6000))},
  groom:()=>cat.gk==='groom'&&Math.random()<.6?groom('groomLeg'):setMode('sit',rr(2500,5000)),
  pose:()=>cat.pose==='eat'&&Math.random()<.6?groom():setMode('sit',rr(2500,5000)), // หลังกินมักเลียขน
  shy:()=>setMode('sit',rr(2000,4000)),pet:()=>setMode('sit',rr(2500,5000)),notice:()=>setMode('sit',rr(2000,4000)),annoy:()=>{cat.lv=0;setMode('sit',rr(2500,4500))},sblink:()=>setMode('sit',rr(2500,5000))})[m]()}
function catPose(){const m=cat.mode,D=cat.dir>0?'R':'L';if(m==='walk'||m==='run')return[(m==='walk'&&(cat.then==='greet'||cat.then==='come')?'walkUp':m)+D,Math.floor(cat.dist/GAIT[m].step)%GAIT[m].n];if(m==='skid')return['stand'+(cat.dir>0?'L':'R'),0]; // หยุดกึกยังหันทางเดิมก่อนกลับตัว
 const k=m==='rise'||m==='halt'?'stand'+D:m==='turnOut'||m==='turnIn'?'turn'+D:(m==='pose'?cat.pose:{sit:'sit',loaf:'loaf',nap:'loaf',wake:'loaf',curl:'curl',shy:'shy',groom:cat.gk||'groom',pet:'pet',notice:'curious',annoy:cat.lv>1?'lash':'annoyed',sblink:'slowBlink'}[m]);return[k,playing?frameAt(DUR[k],cat.t):0]}
const sprC={};function sprite(k,f,tm,coat,acc,idle){const key=[k,f,tm,coat,acc,idle].join('|');let v=sprC[key];if(!v){v=document.createElement('canvas');v.width=W;v.height=H;draw(v.getContext('2d'),frame(k,f,tm,coat,acc,idle));sprC[key]=v}return v}
// ---------- ผูกกับแอป ----------
// ท่าอารมณ์ตามเหตุการณ์: ถ้าแมวกำลังเดิน/หันตัวอยู่ให้รอจบก่อน (ไม่ให้ท่าสะดุด) แล้วค่อยเล่นตอนนั่งพัก
const CALM={sit:1,pose:1,shy:1,groom:1,wake:1,loaf:1,curl:1,nap:1,pet:1,notice:1,annoy:1,sblink:1},SLEEPM={curl:1,loaf:1,nap:1,wake:1},TAPM={shy:1,wake:1,pet:1,notice:1,annoy:1,sblink:1}; // TAPM = ท่าตอบการแตะ เดินต่อได้แม้ปิดแอนิเมชัน
// ---------- แตะแมว: แยกโซน + มาตรวัดความทน (รายงานพฤติกรรมข้อ 4 · v60) ----------
// แมวชอบให้ลูบหัว/ขมับที่สุด ไม่ชอบโคนหางที่สุด (Soennichsen & Chamove 2002, Ellis 2015) · ให้แมวได้เลือกเอง แตะถี่เกินไปแมวเตือนเป็นขั้นแล้วเดินหนี (Haywood 2021)
// ไม่มีงานวิจัยบอกว่าลูบได้กี่ครั้ง ตัวเลขทั้งหมดเป็นค่าของเกม: มาตรวัดเพิ่มตามน้ำหนักของโซน ลดลง 0.2 ต่อวิ
//   แตะหัวห่างกัน ~2 วิ: ราวครั้งที่ 6 เริ่มเตือน · แตะรัว: ครั้งที่ 4 เตือน ครั้งที่ 7 เดินหนี · โซนตัว/หางทนได้น้อยกว่า · ร่าง 2/3 (สนิทขึ้น) ทนได้มากขึ้น
// ห้ามผูกการแตะกับความสนิทหรือรางวัล (กดรัวเก็บแต้มได้) · ห้ามให้แมวขู่หรือโก่งหลังใส่ผู้ใช้
const TAPW={head:1,body:1.5,tail:2.5,belly:2,sleep:.5,move:.5},TOL=[3.5,5,6.5],TOL_DECAY=.2,TOLK=[1,1,1.15,1.3],SHYP=[0,.4,.15,0]; // SHYP = โอกาสเขินแทนถูกลูบ ตามร่าง (ยังไม่สนิทเขินบ่อย)
cat.tol=0;cat.cool=0;cat.lv=0;
// โซนจากจุดที่แตะ (พิกัดฉาก): ท่านั่งหันหน้า หัว = ครึ่งบน · หาง = ขอบขวา · ที่เหลือ = ตัว · ท่าโชว์พุง หัวอยู่ซ้าย
function zoneAt(x,y){const sx=x-Math.round(cat.x),sy=y-CY,m=cat.mode;if(SLEEPM[m])return'sleep';if(!CALM[m])return'move';
 if(cat.k==='belly')return sx<20?'head':'belly';if(sy<31&&Math.abs(sx-24)<15)return'head';return sx>=37?'tail':'body'}
const tolLv=()=>{const t=pk('tol'),k=(TOLK[S.stage]||1)*(Array.isArray(t)?t[S.stage-1]:t);return cat.tol>=TOL[2]*k?3:cat.tol>=TOL[1]*k?2:cat.tol>=TOL[0]*k?1:0};
// ตำแหน่งหัวในฉาก (ขอบบนของภาพเฟรมปัจจุบัน) ไว้วางเอฟเฟกต์
function headAt(){const c=cur||{k:'sit',f:0,tm:'light',idle:null},b=bbox(c.k,c.f,c.tm,c.idle);return{x:Math.round(cat.x)+b.cx,y:CY+b.t}}
const forceIdle=(n,side)=>{cat.ev=cat.ev||{};cat.ev[n]=performance.now();if(side)cat.side=side}; // หูกระดิก/หางสะบัดทันที (ผ่าน idleAt)
// แตะแมว: z = โซน (head body tail belly sleep move) · x,y = จุดที่แตะในฉาก (ไม่ส่ง = กลางหัว เช่น กด Enter)
function poke(z,x,y){const m=cat.mode,h=headAt();z=z||(SLEEPM[m]?'sleep':CALM[m]?'head':'move');if(x==null){x=h.x;y=h.y+8}const side=x<h.x?'L':'R';
 if(cat.cool>0||cat.then==='leave'){fx('tap',x,y,{c:FX});if(!FXS.some(e=>e.type==='dots'))fx('dots',h.x>SW-34?h.x-22:h.x+13,h.y+6);return forceIdle('twitch',side)} // เพิ่งหนีไป: ยังไม่อยากเล่น แค่หูกระดิก …
 cat.tol+=TAPW[z]||1;const lv=tolLv();
 if(z==='sleep'){fx('tap',x,y);if(m!=='wake')setMode('wake',1400);return} // หลับ/งีบ: ตื่น
 if(z==='move')return fx('tap',x,y); // กำลังเดิน/วิ่ง/หันตัว: ไม่ตัดกลางก้าว
 if(lv>=3)return leave(h);
 if(lv>=1||z==='tail'||z==='belly'){fx('tap',x,y,{c:FX});if(cat.k==='belly'&&lv<2)return forceIdle('flick'); // แตะพุงตอนโชว์พุง: ปลายหางสะบัด (โชว์พุง = ทักทาย ไม่ใช่ให้ลูบพุง)
  const a=Math.max(1,lv);if(a>1&&!(m==='annoy'&&cat.lv>1)){fx('vein',h.x+15,h.y+3);say([['ムッ',1100]])}cat.lv=a;return setMode('annoy',a>1?1600:1300)}
 const busy=m==='pose'&&cat.pose!=='curious'; // กำลังเล่นท่าตามเหตุการณ์ (กิน ดีใจ): ไม่ขัด มีแค่เอฟเฟกต์
 if(z==='head'){fx('tap',x,y,{c:HEART});hearts(h);if(++pets===3&&TIP)TIP('blink');if(busy)return;if(m==='pet'){cat.dur=cat.t+2200;return}
  if(Math.random()<Math.min(.8,(SHYP[S.stage]||0)*pk('shy')))return setMode('shy',1600);setMode('pet',2200);return say([['ゴロゴロ…',1800]])}
 fx('tap',x,y);if(busy)return;if(m!=='notice')say([['ニャ？',900]]);setMode('notice',1300)} // แตะตัว: หันมอง หูกระดิก
// ขั้นที่ 3: ぷいっ แล้วเดินหนีไปอีกฝั่ง เลียขน (เลียขนหลังเครียด) พักราว 15–20 วิ · ปิดแอนิเมชัน: ไม่เดิน แค่ทำหน้ารำคาญแล้วพัก
function leave(h){say([['ぷいっ',1300]]);cat.lv=0;cat.pend=null;
 if(!playing){cat.cool=rr(15000,20000)*pk('cool');return setMode('annoy',1300)}
 goTo(cat.x<(XMIN+XMAX)/2?XMAX-rr(0,10):XMIN+rr(0,10),'leave')}
// ---------- กะพริบตาช้า (รายงานพฤติกรรมข้อ 5 · v61) ----------
// แมวกะพริบตาช้าตอบเมื่อคนกะพริบตาช้าใส่ และเดินเข้าหาคนแปลกหน้าที่ทำแบบนี้มากขึ้น (Humphrey et al. 2020 หลักฐานแข็ง)
// ในแอป: กดค้างที่หัวแมว ~0.65 วิ (ผู้ใช้ "กะพริบตาช้า" ใส่แมว) → แมวกะพริบตาช้าตอบ + หัวใจหนึ่งดวงตอนหลับตา · ทำให้ใจเย็นลง: มาตรวัดความทนลด 1.5 และช่วงพักหลังเดินหนีสั้นลงครึ่งหนึ่ง
// แมวทำเองตอนนั่งหันหน้า (จบช่วงนั่ง) บ่อยขึ้นตามร่าง: ร่าง 1 4% ร่าง 2 8% ร่าง 3 14% (ค่าของเกม) · ไม่ผูกกับความสนิท/รางวัล
const SBP=[0,.04,.08,.14],SB_T=GT('slowBlink'),HOLD=650;let pets=0,TIP=null;
function slowBlink(by){if(SLEEPM[cat.mode]||!CALM[cat.mode])return false;setMode('sblink',SB_T);
 if(by){cat.tol=Math.max(0,cat.tol-1.5);if(cat.cool>0)cat.cool=Math.max(1,cat.cool/2);const h=headAt(),d=h.x>SW-40?-1:1;fx('heart',h.x+d*16,h.y+3,{d,t:-920})} // หัวใจขึ้นตอนหลับตา
 return true}
// ---------- เอฟเฟกต์พิกเซลตอนแตะ (พิกัดฉาก 160×90 วาดทับแมวและฉากหน้า) ----------
// tap = ประกายเล็กๆ ตรงจุดที่แตะ (หัว = ชมพู ตัว = ทอง รำคาญ = เทา) · heart = หัวใจลอยขึ้นข้างหัว (ไม่ให้กล่องคำพูดบัง) · vein = 💢 ขั้นที่ 2 · dots = … ข้างหัวตอนพักหลังเดินหนี
// ปิดแอนิเมชันในระบบ = ไม่มีเอฟเฟกต์ (เหลือฟองคำพูด)
const FXL={tap:240,heart:1300,vein:1000,dots:1200,hold:HOLD};let FXS=[];
const FXP={plus:[[1,0],[0,1],[1,1],[2,1],[1,2]],ring:[[2,0],[0,2],[4,2],[2,4],[1,1],[3,1],[1,3],[3,3]],far:[[3,0],[0,3],[6,3],[3,6]],
 heart:[[1,0],[3,0],[0,1],[1,1],[2,1],[3,1],[4,1],[1,2],[2,2],[3,2],[2,3]],heartS:[[0,0],[2,0],[0,1],[1,1],[2,1],[1,2]],
 vein:[[1,0],[0,1],[1,1],[5,0],[5,1],[6,1],[0,5],[1,5],[1,6],[5,5],[6,5],[5,6]],veinS:[[1,0],[0,1],[3,0],[4,1],[0,3],[1,4],[4,3],[3,4]]};
function fx(type,x,y,o={}){if(!playing)return;FXS.push({type,x:Math.round(x),y:Math.round(y),t:0,s:Math.random()*6.28,...o});if(FXS.length>24)FXS.shift()}
function hearts(h){const n=FXS.filter(e=>e.type==='heart').length;if(n>=6)return;const d=Math.random()<.5?-1:1;fx('heart',h.x+d*rr(15,18),h.y+rr(1,4),{d});if(!n)fx('heart',h.x-d*rr(15,18),h.y+rr(3,6),{d:-d,t:-200})}
function fxStep(dt){if(!FXS.length)return;const n=FXS.length;FXS.forEach(e=>e.t+=dt);FXS=FXS.filter(e=>e.t<FXL[e.type]);if(FXS.length!==n)sLast=''}
function fxDraw(c,tm){const P=(pts,ox,oy,col)=>{c.fillStyle=col;pts.forEach(([u,v])=>c.fillRect(ox+u,oy+v,1,1))};
 for(const e of FXS){const t=e.t;if(t<0)continue;
  if(e.type==='tap'){const col=e.c||GOLD;if(t<80)P(FXP.plus,e.x-1,e.y-1,col);else if(t<160)P(FXP.ring,e.x-2,e.y-2,col);else P(FXP.far,e.x-3,e.y-3,col)}
  else if(e.type==='heart'){const L=FXL.heart;if(t>L-320&&Math.floor(t/70)%2)continue;const k=t/L,x=Math.round(e.x+e.d*k*4+Math.sin(t/170+e.s)),y=Math.round(e.y-k*13); // ลอยขึ้นเฉียงออกข้าง ส่ายเบาๆ กะพริบหายตอนท้าย
   if(t<110)P(FXP.heartS,x-1,y-1,HEART);else{P(FXP.heart,x-2,y-2,HEART);P([[1,1]],x-2,y-2,'#ffd3dc')}}
  else if(e.type==='vein'){if(t>FXL.vein-250&&Math.floor(t/70)%2)continue;if(Math.floor(t/140)%2)P(FXP.veinS,e.x-2,e.y-2,RED);else P(FXP.vein,e.x-3,e.y-3,RED)} // เต้นตุบๆ
  else if(e.type==='hold'){const n=Math.min(8,1+Math.floor(t/HOLD*8));P([[0,-3],[2,-2],[3,0],[2,2],[0,3],[-2,2],[-3,0],[-2,-2]].slice(0,n),e.x,e.y,HEART)} // วงแหวนค่อยๆ เต็มตอนกดค้าง
  else if(e.type==='dots'){const n=Math.min(3,1+Math.floor(t/220));for(let i=0;i<n;i++)P([[0,0],[1,0],[0,1],[1,1]],e.x+i*3,e.y,tm==='dark'?'#e3c9ab':'#86604c')}}} // … จุด 2×2 สีตามกลางวัน/กลางคืน
function doAct(k,ms){if(!POSES[k])return;if(CALM[cat.mode]){cat.pend=null;act(k,ms)}else cat.pend={k,ms}}
let cv=null,io=null,raf=0,last=0,vis=true,sLast='',pending=null,booted=false;
// กลางวัน/กลางคืนของฉากตามเวลาจริงของเครื่อง (06:00–17:59 = กลางวัน) ไม่ผูกกับโหมดมืดของแอป (เจ้าของขอ 2026-11-19: เช้าแล้วห้องยังมืด)
// ภาพแมวใช้ชุดสีตามฉาก (กลางคืน = เส้นขอบสว่าง) หน้าแอปยังมืด/สว่างตามเครื่องเหมือนเดิม
// 4 ช่วง (เจ้าของขอ 2026-11-19): รุ่งเช้า 05:00–06:59 · กลางวัน 07:00–16:59 · พลบค่ำ 17:00–18:59 · กลางคืน 19:00–04:59
let TOD=null;const tod=(d=new Date())=>{if(TOD)return TOD;const h=d.getHours();return h>=5&&h<7?'dawn':h>=7&&h<17?'day':h>=17&&h<19?'dusk':'night'};
const thm=()=>tod()==='night'?'dark':'light'; // ชุดสีของภาพแมว (กลางคืน = เส้นขอบสว่าง)
const skey=t=>t==='day'?'light':t==='night'?'dark':t; // ชุดสีฉาก
function paint(){if(FXS.length)sLast='';const td=tod(),tm=thm(),sk=skey(td),[k,f]=catPose();cat.k=k;const now=performance.now(),idle=idleAt(cat,now),X=Math.round(cat.x),s=SCN(),live=s.live,d=new Date(),
  sw=live&&playing?Math.round(Math.sin(now/1000*Math.PI)*3)/3:0,key=[k,f,idle,X,sk,S.coat,S.acc,PLACE,live?d.getHours()*60+d.getMinutes()+'|'+sw:''].join('|');
 cur={k,f,idle,X,tm};if(key===sLast)return;sLast=key;const sx=cv.getContext('2d'),pal=palOf(s,sk);sx.clearRect(0,0,SW,SH);sx.drawImage(sceneBg(sk),0,0);if(live)live(sx,pal,d,sw);
 sx.drawImage(sprite(k,f,tm,S.coat,S.acc,idle),X,CY);sx.drawImage(sceneFg(sk),0,0);if(FXS.length)fxDraw(sx,tm);
 if(WARM[td]){sx.save();sx.globalCompositeOperation='multiply';sx.fillStyle=WARM[td];sx.fillRect(0,0,SW,SH);sx.restore()} // แสงอุ่นทั้งภาพ
 if(s.over)s.over(sx,pal)}
// กล่องคำพูดลอยเหนือหัวสัตว์เลี้ยงและเลื่อนตามเวลาเดิน (เจ้าของขอ 2026-11-18): หาขอบบนของภาพเฟรมปัจจุบัน แล้วค่อยๆ ไล่ตาม ไม่ให้กระตุก
// ไม่ให้ล้นขอบฉาก ถ้าชิดขอบ หางกล่องยังชี้ที่หัว · ไม่มีที่ว่างเหนือหัว (หัวสูง/กล่องสูง) จะชิดขอบบนแทน
const BB={};function bbox(k,f,tm,idle){const key=[k,f,tm,S.coat,S.acc,idle].join('|');if(BB[key])return BB[key];const g=frame(k,f,tm,S.coat,S.acc,idle);let t=H,l=W,r=-1;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(g[y][x]){if(y<t)t=y;if(x<l)l=x;if(x>r)r=x}return BB[key]={t:t<H?t:20,cx:r>=0?(l+r+1)/2:24}}
let cur=null,bub=null,bx=null,by=null,bw=0,bh=0,bLast='',ro=null,sayT=0,sayOrig=null,pendGreet=0;
// ฟองคำพูดชั่วคราว (เสียงแมวภาษาญี่ปุ่น) แล้วคืนประโยคเดิม: seq = [[ข้อความ, ms], ...]
function say(seq){if(!bub)return;if(sayOrig==null)sayOrig=bub.innerHTML;clearTimeout(sayT);const next=i=>{if(!bub)return;if(i>=seq.length){bub.innerHTML=sayOrig;sayOrig=null;bw=0;return}bub.textContent=seq[i][0];bw=0;sayT=setTimeout(()=>next(i+1),seq[i][1])};next(0)}
function bubble(dt){if(!bub||!cur)return;const b=bbox(cur.k,cur.f,cur.tm,cur.idle),tx=cur.X+b.cx,ty=CY+b.t-2;
 if(bx==null){bx=tx;by=ty}else{const a=Math.min(1,dt/140);bx+=(tx-bx)*a;by+=(ty-by)*a}
 const W2=cv.clientWidth,H2=cv.clientHeight;if(!W2)return;if(!bw){bw=bub.offsetWidth;bh=bub.offsetHeight;bLast=''}
 const px=bx/SW*W2,L=clamp(px,bw/2+6,W2-bw/2-6),T=Math.max(by/SH*H2-8,bh+6),tl=clamp(px-L+bw/2,16,bw-16),key=Math.round(L)+'|'+Math.round(T)+'|'+Math.round(tl);
 if(key===bLast)return;bLast=key;bub.style.transform=`translate(${Math.round(L-bw/2)}px,${Math.round(T-bh)}px)`;bub.style.setProperty('--tl',Math.round(tl)+'px');bub.style.visibility='visible'}
function loop(now){if(!cv||!cv.isConnected){stop();return}const dt=Math.min(now-last,100);last=now;
 if(vis&&!document.hidden){if(cat.pend&&CALM[cat.mode]){const p=cat.pend;cat.pend=null;act(p.k,p.ms)}step(dt);fxStep(dt);paint();bubble(dt)}
 raf=requestAnimationFrame(loop)}
let hold=null;const dropHold=()=>{FXS=FXS.filter(f=>f.type!=='hold');sLast=''};
function endHold(tap){if(!hold)return;clearTimeout(hold.tm);const h=hold;hold=null;dropHold();if(tap&&!h.done)poke('head',h.x,h.y)}
function stop(){endHold(false);cancelAnimationFrame(raf);raf=0;if(io){io.disconnect();io=null}if(ro){ro.disconnect();ro=null}cv=null;bub=null}
function fit(){if(!cv||!cv.parentElement||cv.closest('.scn'))return; // อยู่ในฉากสถานที่: CSS ขยายเต็มการ์ดเอง
 const w=cv.parentElement.clientWidth||SW*2,s=w>=SW*2?Math.min(5,Math.floor(w/SW)):w/SW;cv.style.width=SW*s+'px';cv.style.height=SH*s+'px'}
// ใส่แมวลงผืนผ้าใบ (เรียกทุกครั้งที่วาดหน้าหลักใหม่ สถานะแมวต่อเนื่องจากครั้งก่อน)
function mount(canvas,o={}){stop();cv=canvas;S.coat=COATS[o.coat]?o.coat:'cream';S.acc=o.acc||'none';S.stage=o.stage||1;PS=PERS[o.trait]||{};FXS=[];TIP=o.onTip||null;pets=0;hold=null;PLACE=SCENES[o.place]?o.place:'room';sLast='';vis=true;clearTimeout(sayT);sayOrig=null;bub=o.bubble||null;bx=by=null;bw=0;cur=null;
 if(bub&&'ResizeObserver'in window){ro=new ResizeObserver(()=>{bw=0});ro.observe(bub);ro.observe(cv)} // ขนาดกล่อง/ฉากเปลี่ยน (ฟอนต์โหลดเสร็จ หมุนจอ) วัดใหม่
 cv.width=SW;cv.height=SH;cv.tabIndex=0;cv.setAttribute('role','button');cv.setAttribute('aria-label',(o.label||'แมว')+' แตะหัวเพื่อลูบ กดค้างที่หัวเพื่อกะพริบตาช้าใส่');
 // นิ้ว เมาส์ Apple Pencil ใช้ pointer event เดียวกัน · โซนอื่นตอบทันทีตอนแตะลง · หัวรอดูว่าแตะ (ลูบหัวตอนยกนิ้ว) หรือกดค้าง (กะพริบตาช้า) มีวงแหวนชมพูค่อยๆ เต็มให้รู้ว่ากำลังกดค้าง
 const pt=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)/r.width*SW,(e.clientY-r.top)/r.height*SH]};
 cv.addEventListener('pointerdown',e=>{const[x,y]=pt(e),X=Math.round(cat.x);if(!(x>=X+4&&x<=X+44&&y>=CY+4&&y<=CY+46))return;const z=zoneAt(x,y);
  if(z!=='head'||cat.k==='belly'||cat.cool>0)return poke(z,x,y);
  endHold(false);fx('hold',x,y);hold={x,y,tm:setTimeout(()=>{if(!hold)return;hold.done=1;dropHold();if(!slowBlink(1))poke('head',hold.x,hold.y)},HOLD)};
  try{cv.setPointerCapture(e.pointerId)}catch(_){}});
 cv.addEventListener('pointerup',()=>endHold(true));cv.addEventListener('pointercancel',()=>endHold(false));
 cv.addEventListener('pointermove',e=>{if(!hold||hold.done)return;const[x,y]=pt(e);if(Math.hypot(x-hold.x,y-hold.y)>6)endHold(true)}); // ลากออกไป = นับเป็นแตะ
 cv.addEventListener('contextmenu',e=>e.preventDefault()); // กดค้างไม่ให้เมนูของระบบเด้ง
 cv.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();poke()}});
 if('IntersectionObserver'in window){io=new IntersectionObserver(es=>{vis=es[0].isIntersecting;sLast=''});io.observe(cv)} // ไม่อยู่บนจอ = ไม่คำนวณ ไม่วาด
 if(!booted){booted=true;if(o.sleepy){if(SCN().bed!=null){cat.x=SCN().bed;cat.dir=1;setMode('curl',rr(24000,36000))}else setMode('nap',rr(8000,14000))}} // เปิดแอปดึกๆ: ในห้องหลับอยู่บนเบาะ ที่อื่นงีบหมอบ
 fit();paint();bubble(0);
 if(pendGreet){const g=pendGreet;pendGreet=0;greet(g)}
 if(pending&&Date.now()-pending.t<6e5){doAct(pending.k,pending.ms)}pending=null; // ท่าอารมณ์ที่เกิดตอนไม่ได้อยู่หน้าหลัก เล่นให้ดูตอนกลับมา (ไม่เกิน 10 นาที)
 last=performance.now();raf=requestAnimationFrame(loop)}
// ส่งท่าตามเหตุการณ์ในแอป: อยู่หน้าหลักเล่นทันที ไม่อยู่ก็เก็บไว้เล่นตอนกลับมา
function cue(k,ms=1800){if(cv&&cv.isConnected)doAct(k,ms);else pending={k,ms,t:Date.now()}}
addEventListener('resize',fit);
document.addEventListener('visibilitychange',()=>{last=performance.now();sLast=''});
window.PixelCat={mount,unmount:stop,cue,act:doAct,poke,greet,say,tod,coats:Object.keys(COATS),poses:KEYS,places:Object.keys(SCENES),
 _t:{step,cat,sceneBg,sceneFg,SW,SH,CY,bbox,bubblePos:()=>bub&&bub.style.transform,XMIN,XMAX,frame,draw,W,H,COATS,KEYS,IDLE_NAMES,setPlaying:v=>{playing=v},setPart:v=>{PART=v},dayPart,setTod:v=>{TOD=v},setTrait:i=>{PS=PERS[i]||{}},PERS,slowBlink,zoneAt,tolLv,headAt,fxs:()=>FXS,TOL,TOLK,palOf:(id,sk)=>palOf(SCENES[id],sk)}};
})();
