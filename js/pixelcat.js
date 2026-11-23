// แมวพิกเซล (สัตว์เลี้ยงตัวแรก) · แยกจากร่าง docs/pixel-cat10.html — เอนจินวาด + ตัวควบคุมฉากห้อง 160×90
// ห่อใน IIFE เพื่อไม่ให้ชื่อตัวแปรชนกับสคริปต์อื่น (classic script ใช้ global ร่วมกัน) · ส่งออกเฉพาะ window.PixelCat
// ใช้: PixelCat.mount(canvas, {coat, acc, place, fam, stage, trait, onTip}) · PixelCat.act('happy', 1800) · PixelCat.cue(...) · PixelCat.unmount()
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
const put=(a,x,y,pts,c)=>pts.forEach(([u,v])=>a.push([x+u,y+v,c]));
const eyeClosed=(a,x,y)=>put(a,x,y,[[0,0],[1,1],[2,1],[3,0]],EYE);           // ‿ หลับสบาย
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
 else if(legs==='knead'){const[l0,l1]=o.lift; // นวด: อุ้งเท้าหน้ายกสลับซ้ายขวา (ยกข้างหนึ่ง อีกข้างกดลง)
  parts.push({z:1.5,R:2.9,ground:false,skipUp:true,sdf:paw(21,l0),mat:()=>P('paw'),contour:(x,y)=>y>39.2+by-l0?pawLine():false},{z:1.55,R:2.9,ground:false,skipUp:true,sdf:paw(27,l1),mat:()=>P('paw'),contour:(x,y)=>y>39.2+by-l1?pawLine():false})}
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
  fx:(a)=>{put(a,38,4+bob,[[1,0],[2,0],[0,1],[3,1],[3,2],[2,3],[2,5]],GOLD)}})},
 // มองนก (ห้อง · v97): เงยหน้ามองหน้าต่างขวาบน ตาเม็ดถั่วเหลือบขึ้น หูตั้งไปหน้า ปากสั่นแกะๆ (เปิดปิดเล็กๆ) (chattering ตอนเห็นเหยื่อที่เอื้อมไม่ถึง) ปลายหางกระตุก
 birdwatch(f){const ch=f%2,tw=[0,1,0,-1][f];return sitCat({hy:-2.2,ear:-.15,
  tail:[[33,40.6],[39.4,42.2],[44.2,41.6],[47.2+tw*.4,39.6-tw*1.2]],
  face:(a,hx,hy)=>{bean(a,19,hy-1.2,4,true);bean(a,30,hy-1.2,4,true);a.push([24,hy+3.6,NOSE]); // ตาเม็ดถั่วแบบท่าอื่น เหลือบมองขึ้นขวา (เจ้าของบอกตากลมโตดูแปลก)
   if(ch)put(a,23,hy+4.8,[[0,0],[1,0],[2,0],[1,1]],EYE);else put(a,23.6,hy+4.8,[[0,0],[1,0]],EYE);blush(a,12.6,hy+3.6);blush(a,32.4,hy+3.6)}})},
 // สะดุ้ง (สถานี · v97 ตอนรถไฟผ่าน): กระโดดตัวลอย หูลู่ ตาโตกลม ปากอ้านิด หางพองตั้งเป็นแปรง มี ! → ลงมาย่อตัวนิ่ง 1 วิ → หูค่อยกลับ หางยุบ
 startle(f){const S=[{dy:-2.8,ear:.75,puff:1},{dy:.4,sq:.35,ear:.75,puff:1},{dy:.4,sq:.35,ear:.7,puff:.9},{dy:0,ear:.3,puff:.4}][f];return sitCat({dy:S.dy,sq:S.sq||0,ear:S.ear,
  tail:[[33,40.6],[38.4,40.4],[40.6,34.4],[41+S.puff*.4,27.6],[40.2+S.puff*.4,22.6+(1-S.puff)*3]],tr0:2.1+S.puff*1.3,tr1:1.15+S.puff*1.5,
  face:(a,hx,hy)=>{if(f<3){[[17.4,hy-.6],[28.4,hy-.6]].forEach(([x,y])=>{put(a,x,y,[[1,0],[2,0],[0,1],[3,1],[0,2],[3,2],[1,3],[2,3]],EYE);put(a,x+1,y+1,[[0,0],[1,0],[0,1],[1,1]],IRIS)});
    a.push([24,hy+3.6,NOSE]);put(a,23.4,hy+4.8,[[0,0],[1,0],[0,1],[1,1]],EYE)}else{bean(a,18,hy+.2,4,true);bean(a,29,hy+.2,4,true);a.push([24,hy+3.6,NOSE]);put(a,23.6,hy+4.8,[[0,0],[1,0]],EYE)}
   blush(a,12.6,hy+3.6);blush(a,32.4,hy+3.6)},
  fx:(a,by)=>{if(f<2){put(a,38,6+by,[[0,0],[0,1],[0,2],[0,4]],GOLD);put(a,39,6+by,[[0,0],[0,1],[0,2],[0,4]],GOLD)}if(f===0)[[8,14],[6,18],[40,14],[42,18]].forEach(([x,y],i)=>put(a,x,y+by,i%2?[[0,0],[1,0]]:[[0,0],[1,1]],FX))}})}, // เส้นสะดุ้งรอบหัว
});
// นอนอาบแดด (ห้อง · v97 ตามภาพตัวอย่างของเจ้าของ): หมอบตะแคง ตัวกลมนุ่มไปทางซ้าย หัวตั้งตรงหันมาหาผู้ชม หลับตาเป็นขีด - - ระดับเดียวกัน อิ่มแดด
// ขาหน้าเหยียดไปข้างหน้าวางซ้อนกันบนพื้น ขาหลังพับใต้สะโพก หางโอบเลียบพื้นด้านหน้า หายใจช้า
POSES.bask=f=>{const br=[0,.4,.7,.4][f],a=[],fl=IDLE==='flick'?1:0;
 // ตัวทรงถั่วกลมนุ่ม สั้นกว่าเดิม ไม่มีแถบลาย (เจ้าของบอกตัวยาว แถบลายดูแปลก อยากได้กลมๆ นุ่มๆ)
 const bodyS=(x,y)=>Math.max(smin(sdEll(x,y,20.8,37.2-br*.2,11.6,6.6+br*.3),sdEll(x,y,28.4,35.4,6.4,6.4),3.4),y-43.4);
 const body={z:0,R:9,sdf:bodyS,mat:(x,y)=>{if(sdEll(x,y,29.6,40.8,4.6,2.4)<0)return P('under');return sdEll(x,y,17,33.2,5.2,3)<0?P('patch'):P('fur')}};
 const hip={z:.5,R:5,ground:false,contour:null,cIdx:3,sdf:(x,y)=>Math.max(sdEll(x,y,13,37.6,5.8,5.2),bodyS(x,y)+.3),mat:(x,y)=>{const d=Math.hypot((x-13)/1.15,y-37.6);return P('fur',d>1.6&&fr(d/2.4)<.36)}};
 const hpaw={z:.6,R:2,ground:false,contour:null,sdf:(x,y)=>Math.max(sdEll(x,y,18,42.4,2.6,1.6),y-43.6),mat:()=>P('paw')};
 // ขาหน้าเรียวสั้น ปลายอุ้งเท้ากลมวางซ้อนกัน (เดิมหนาและยาวเป็นแท่ง)
 const leg=(x0,y0,px,py,z,dim)=>({z,R:2,dim,ground:false,cast:false,shade:false,contour:null,sdf:(x,y)=>Math.max(smin(sdCap(x,y,x0,y0,px-1.2,py,1.9,1.6),sdEll(x,y,px,py,2.5,1.8),1),y-43.6),mat:(x,y)=>sdEll(x,y,px,py,2.5,1.8)<.3?P('paw'):P('limb')});
 const H=tiltHead(33,27.6,0,.88); // หัวตั้งตรง ตาสองข้างระดับเดียวกัน (เจ้าของขอ) · v101 ขยับ x 32.8→33 ให้ขอบหูเรียบ: ปลายหูไม่เป็นพิกเซลเดี่ยว และไม่มีจุดนูนตรงโคนหูซ้าย
 // หางออกจากโคนก้นด้านล่าง โค้งกว้างแนบสะโพกลงพื้น แล้ววางเลียบพื้นมาด้านหน้า เรียวลงถึงปลาย
 // (v101 เจ้าของขอให้สมจริง: เดิมโค้งแคบยื่นออกไปด้านหลังจนเป็นก้อน หนาเท่ากันทั้งเส้น)
 const tl=tail([[9.6,40.8],[7,41.9],[5.8,43.4],[7.8,44.3],[12.6,44.2],[17.6,44.2],[21.6+fl*.6,43.6-fl*1.4]],1.6,.85,3,{tip:.78,base:.12});
 const A=H.A;put(a,...A(-8.6,1),[[0,0],[1,0],[2,0],[3,0]],EYE);put(a,...A(3.8,1),[[0,0],[1,0],[2,0],[3,0]],EYE); // หลับตาเป็นขีด - -
 {const[nx,ny]=A(-.2,3.6);a.push([nx,ny,NOSE])}put(a,...A(-1,4.8),[[0,0],[1,0]],EYE);blush(a,...A(-11.6,3.2));blush(a,...A(8.6,3.2));
 const parts=[leg(30.6,40.4,39.4,42.2,-.4,1),body,hip,hpaw,leg(28.6,41,35.8,42.6,1.6,0),H.head,tl];
 if(ACC==='scarf')parts.push({z:1.9,R:2.4,ground:false,sdf:(x,y)=>sdCap(x,y,27.2,34.8,36,36.2,2.4,2.4),ramp:'scarf',contour:RAMP.scarf[4]});
 if(ACC==='bow')parts.push(H.bow());
 return{parts,decals:a,shadow:[24,44,18,2.2],ground:43}};
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
function sideLeg(sx,dx,lift,bend,z,dim,by=0,cy=by,ps=1,rp=0){ // ps = ขนาดอุ้งเท้า (ยืดตัว: ขาหน้าเรียวลง) · rp = ขาหลังตอนยืดตัว: อุ้งเท้ารีแบนกว้างกว่าข้อเท้านิดหน่อย มุมมน (เจ้าของ: มน ไม่เอากลม) ไม่เป็นแท่งตัดเหลี่ยม // cy = จุดเริ่มเส้นขอบ (ยืดตัว: ขาหลังยาวขึ้นแต่เส้นขอบเริ่มที่ใต้ท้องเท่าเดิม ไม่ลากขึ้นไปบนสะโพก)
 const th=bend*1.3,c=Math.cos(th),s=Math.sin(th),px=sx+dx+.5-bend*1.2,py=41.7-lift-bend*.5+rp*.4;
 const Pw=(x,y)=>{const X=x-px,Y=y-py;return[X*c+Y*s,-X*s+Y*c]},pawD=(x,y)=>{const[u,v]=Pw(x,y);return sdEll(u,v,0,0,3*ps+rp*.5,2.3*ps-rp*.4)};
 const L=(x,y)=>sdCap(x,y,sx,35.4+by,px+bend*.8,py-1.3*ps-rp*.3,2.7,2.4*ps-rp*.3);
 return{z,R:2.7,dim,ground:false,skipUp:true,shade:false,cast:false,sdf:(x,y)=>smin(L(x,y),pawD(x,y),1.1),
  mat:(x,y)=>pawD(x,y)<.35?(bend>.3&&Pw(x,y)[1]>.9?P('inner'):P('paw')):P('limb'),contour:(x,y)=>y>Math.min(38.6+cy,py-2.6)?pawLine():false}}
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
 const cr=o.cr||0,wig=o.wig||0,rch=o.reach||0,hs=o.hs||0,sn=o.sn||0; // hs = ยืดขาหลัง 0–1 (v117 · o.hl 0 ขาใกล้ 1 ขาไกล) · sn = ก้มดมพื้น 0–1 (v117) // cr = หมอบซุ่ม 0–1 (ตัวต่ำ ขาพับ หัวต่ำยื่นไปหน้า) · wig = ก้นส่ายก่อนกระโจน · reach = ขาหน้าเหยียดไปตะปบ
 const R=run?(o.R||RUN[f]):null,e=run?R.e:0,by=run?R.by:walk?[0,-.3,-.6,-.3,0,-.3,-.6,-.3][f]:cr*3.4;
 // bw = ยืดตัวโค้งคำนับ 0–1 (ท่ายืน): อกต่ำลงแนบพื้น ขาหน้าเหยียดไปข้างหน้า สะโพกยกขึ้น หัวต่ำลงเหนือขาหน้า หูเอนไปหลัง หางตั้ง · rb = สะโพกยก
 const bw=o.bow||0,rb=-bw*5-cr*1.4-wig*.9+hs*.6-sn*1.4,hd=bw*8.4+cr*1.6+rch*.4+sn*(9.4+(o.nb||0)*.5)+hs*1.2,sc=sn*2.4; // ดม: สะโพกยกนิด อกต่ำลง (ศอกงอ) หัวก้มต่ำกว่าไหล่ เส้นหลังลาดลงหาหัว // v88 ตามภาพตัวอย่างของเจ้าของ: ก้นเป็นจุดสูงสุด ขาหลังยืดตรงยาว หลังลาดลงเป็นทางลาดถึงอก หัวต่ำระดับขาหน้า
 // หัวกลมโตเท่าท่าหันหน้า หูอยู่บนกลางหัว หูฝั่งไกลโผล่ด้านหน้าเล็กน้อย · ตอนเดินหัวนิ่ง (แมวจริงประคองหัวให้นิ่ง) ตอนวิ่งหูลู่ไปด้านหลัง
 const hx=33.4+e*.5-bw*.6+cr*2.4+sn*2.4+hs*1,hy=22.8+(run?by*.8:cr*3.4)+hd,hyF=23+Math.round((run?by*.8:cr*3.4)+hd),tw=IDLE==='twitch'+N?1:0,twF=IDLE==='twitch'+F?1:0,eb=run?.7:Math.max(tw,bw*1.1,hs*.8),back=SIDE_EAR==='back';
 const NE=[[hx-7,hy-5.6],[hx-3.6-eb*1.4,hy-15+eb*1.6],[hx+1.4,hy-9]],NI=[[hx-3.8,hy-7.6],[hx-3.4-eb*1.2,hy-12.4+eb*1.4],[hx+.2,hy-8.8]];
 const FE=back?[[hx-10.4,hy-3.6],[hx-9.4-twF*1.2,hy-13+twF*1.4],[hx-4.6,hy-8.6]]:[[hx-.4,hy-8.8],[hx+3.6-(run?.8:0)-bw*2+twF*1.2,hy-14.2+(run?.8:0)+bw*1.8+twF*1.4],[hx+6.6,hy-6.2]]; // ยืดตัว: หูลู่ไปด้านหลัง (เจ้าของขอ 2026-11-20)
 const bx=22.6-bw*5,brx=12.4+e*.6-bw*4.4,bry=7.2-e*.3-bw,cx=30.6+e*.5+cr*.8,hip=-e*.5+wig*.5; // ยืดตัว: ตัวส่วนหลังหดเหลือแค่ก้น
 const ccx=cx+bw*.6,ccy=32.4+by+bw*4.6+sc; // อก
 const bodyS=(x,y)=>Math.max(smin(smin(sdEll(x,y,bx,33.8+by+rb,brx,bry),sdEll(x,y,ccx,ccy,6.6,6.6-bw*1.4),3),sdCap(x,y,bx,33.8+by+rb,ccx,ccy,bw*5.6,bw*4.8),2),y-Math.min(42.6,41.6+by-Math.min(0,e)*.3)); // หมอบ: ท้องแตะพื้นแต่ไม่ล้นเส้นพื้น // ยืดตัว: แท่งเชื่อมก้นกับอกเป็นหลังลาด
 const flank=(x,y)=>sdEll(x,y,19+hip,30.4+by+rb,6,4.2)<0;
 const body={z:0,R:9,sdf:bodyS,mat:(x,y)=>{if(sdEll(x,y,24,40.6+by,10.5+e*.5,3.2)<0||sdEll(x,y,ccx+4.2,ccy+3,3.2,4.6-bw)<0)return P('under');
  const st=y<37.5+by&&x<cx+1.4&&fr(x/3.2+.15)<.34;return flank(x,y)?P(nP,st):P('fur',st)}};
 const haunch={z:1,R:5,ground:false,contour:false,sdf:(x,y)=>Math.max(sdEll(x,y,15.6+hip,35.4+by+rb,6.2,5.4),bodyS(x,y)+.5), // ไม่มีเส้นขอบรอบสะโพก (เจ้าของบอก 2026-11-20 ดูเหมือนเอาขามาแปะ) ใช้แค่เงานูนให้เห็นต้นขา
  mat:(x,y)=>{const d=Math.hypot((x-15.6-hip)/1.15,y-35.4-by-rb),st=d>1.5&&fr(d/2.4)<.38;return flank(x,y)?P(nP,st):P('fur',st)}};
 const head={z:2,R:8.5,sdf:(x,y)=>smin(smin(sdEll(x,y,hx,hy,11.4,9.8),sdEll(x,y,hx+9.4,hy+3.6,2.9,2.5),2),ear(x,y,...NE),1.6),
  mat:(x,y)=>{if(sdTri(x,y,...NI)<0)return P('inner');if(sdTri(x,y,...NE)<(CO.earRim?.9:-.2))return P('ear'+N);
   if(CO.mask){const m=CO.maskShape==='point'?sdEll(x,y,hx+6.4,hy+2.4,6.8,5.8):sdEll(x,y,hx+8.6,hy+3.8,4,3.2);if(m<0)return CO.mask}
   if(CO.stripe){const brow=y>hy-9.4&&y<hy-5.4&&[-.2,2.2].some(d=>Math.abs(x-hx-d)<.55),cheek=x<hx-2&&x>hx-9.5&&[1.4,3.4].some(d=>Math.abs(y-hy-d)<.5);if(brow||cheek)return CO.stripe}
   if(sdEll(x,y,hx-3.2,hy-6.2,5.4,3.4)<0)return P(nP);return CO.fur}};
 const farEar={z:1.8,R:2.5,dim:back?0:1,ground:false,sdf:(x,y)=>ear(x,y,...FE),mat:(x,y)=>back||sdTri(x,y,[hx+.8,hy-8.8],[hx+3.6+twF,hy-12.2+twF*1.2],[hx+5.2,hy-7.2])>0?P('ear'+F):P('inner')};
 // ขา: หน้าใกล้ หน้าไกล หลังใกล้ หลังไกล (ฝั่งไกลอยู่หลังตัว เข้มลงหนึ่งขั้น)
 const ph=f/WALK_N,LG=run?R.L:walk?[walkLeg(ph-.25,2.2),walkLeg(ph-.75,2.2),walkLeg(ph,1.8),walkLeg(ph-.5,1.8)]:[[0,0,0],[0,0,0],[0,0,0],[0,0,0]];
 if(bw)LG.forEach((g,i)=>{if(i<2)g[0]=bw*(i?10.4:11.4)}); // ขาหน้าเหยียดไปข้างหน้าเกือบราบกับพื้น
 if(cr&&!run)LG.forEach((g,i)=>{g[0]=i<2?rch*(i?.85:1)+cr*.8:-cr*1.2});
 if(hs){const i=2+(o.hl||0);LG[i]=[-11*hs,4.6*hs,.4*hs];LG[5-i][0]+=.8*hs;LG[0][0]-=.5*hs;LG[1][0]-=.5*hs} // ยืดขาหลัง: ขาข้างหนึ่งเหยียดตรงไปด้านหลัง ปลายเท้าชี้ เห็นอุ้งเท้าชมพู ตัวโน้มไปหน้า // หมอบ: ขาหลังรวบใต้ตัว · ตะปบ: ขาหน้ายื่นไปข้างหน้า
 const legs=[[31.4+e*.5,1.5,0],[28.6+e*.5,-1,1],[16.4+hip+bw*.6,bw?.9:1.45,0],[13.6+hip-bw*.6,-1,1]].map( // ยืดตัว: ขาหลังกางออกนิดหน่อยให้เห็นทั้งสองข้าง และขาใกล้อยู่ใต้ต้นขา (z ต่ำกว่า haunch) โผล่ออกมาใต้สะโพกแบบขาแมวจริง ไม่เป็นแถบแปะทับสะโพก (เจ้าของบอก 2026-11-20 ขาดูแปลก/ไม่เท่ากัน)
 ([sx,z,dim],i)=>sideLeg(sx,LG[i][0],LG[i][1],LG[i][2],z,dim,by+(i<2?bw*3.4+sc:rb),i<2?by+bw*3.4+sc:by-bw*3.6,i<2?1-bw*.25:1,i<2?0:bw));
 // หาง: ยืน/เดินตั้งโค้งปลายแกว่งช้าๆ · วิ่งพองฟู (แมวตื่นเต้น) ชี้ไปด้านหลังเฉียงขึ้น
 const fl=IDLE==='flick'?1:0,tb=11.6+hip*1.2;let tl;const ty=by+rb; // หางยกตามสะโพก
 if(run){const s2=[0,.6,1,.6,0,-.4][f],lag=(RUN[(f+5)%6].by-by)*.9; // หางพองสะบัดตามหลังตัว: ตัวขึ้น ปลายหางยังค้างต่ำกว่าหนึ่งจังหวะ
  tl=tail([[tb,31.6+by],[tb-4.4,30+by+lag*.3],[tb-7.8,27.4+by+lag*.7],[tb-9.2+s2,23.6+by-s2+lag]],2.7,1.9,-.5,{tip:.8})}
 else if(cr){const t=o.tf||0; // หมอบซุ่ม: หางต่ำเหยียดไปด้านหลังเกือบติดพื้น ปลายหางกระตุก
  tl=tail([[tb,31.6+ty],[tb-4.4,33.4+ty],[tb-8.6,35+ty],[tb-11.8,35.6+ty-t*.8],[tb-13.6+t*.4,34.4+ty-t*2]],2.1,1.15,-.5,{tip:.8})}
 else if(hs){const w=(A,l)=>A*Math.sin(2*Math.PI*(f/8-l)); // ยืดขาหลัง: หางยกเหยียดไปด้านหลังเฉียงขึ้น ปลายงอนิดๆ
  tl=tail([[tb,31.6+ty],[tb-3.2,28.8+ty-hs*.4],[tb-5.8,25.4+ty-hs*.8],[tb-7.4+w(.2,0),21.6+ty-hs],[tb-7.6+w(.4,.15),18.4+ty-hs]],2.1,1.15,-.5,{tip:.8})}
 else if(o.up||bw){const w=(A,l)=>A*Math.sin(2*Math.PI*(ph-l)); // หางตั้ง (ทักทาย Cafazzo & Natoli 2009): ตั้งตรงเกือบดิ่ง ปลายงอไปทางหัว แกว่งเบาๆ
  tl=tail([[tb,31.6+ty],[tb-1.8,27.4+ty],[tb-2.4+w(.15,0),22+ty],[tb-1.8+w(.3,.12),16.6+ty],[tb+.4+w(.5,.22),13.2+ty],[tb+2.4+w(.6,.3),12.8+ty]],2.1,1.15,-.5,{tip:.8})}
 else{const q=walk?ph:f/8,k=walk?1.1:.85,w=(A,l)=>k*A*Math.sin(2*Math.PI*(q-l)); // คลื่นจากโคนไปปลาย ปลายหางตามหลัง
  tl=tail([[tb,31.6+ty],[tb-4,29.4+ty],[tb-6.4+w(.2,0),24.6+ty],[tb-5.8+w(.6,.1),19.6+ty+w(.2,.15)],[tb-3.4+w(1.2,.22)+fl*2.4,16.6+ty+w(.5,.3)-fl*1.4]],2.1,1.15,-.5,{tip:.8})}
 const parts=[body,haunch,head,farEar,...legs,tl];
 const acc=o.acc||ACC;
 if(acc==='scarf'){const fw=run?.6+[0,.4,.8,1.2,.8,.3][f]:walk?.5+.5*Math.sin(2*Math.PI*ph):0,fu=run?1:0; // ชายผ้าปลิวไปด้านหลังตอนวิ่ง
  const sy=hy-sn*5.4-hs*.6; // ดม: ผ้าพันคออยู่ที่คอระหว่างอกกับหัว ไม่ห้อยลงใต้พื้น
  parts.push({z:1.9,R:2.4,ground:false,sdf:(x,y)=>sdCap(x,y,hx-6.4-sn*1.4,sy+6.6,hx+.4-sn*2,sy+8.8,2.4,2.4),ramp:'scarf',contour:RAMP.scarf[4]},
   {z:1.95,R:2,ground:false,skipUp:true,sdf:(x,y)=>sdCap(x,y,hx-5-sn*1.6,sy+9,hx-8.4-fw-fu-bw*1.8-sn*1.6,sy+13.4-fu-bw*2.6-sn*2.4,1.9,1.5),ramp:'scarf',contour:RAMP.scarf[4]})}
 if(acc==='bow')parts.push(N==='R'?bowPart(hx-4.8-eb*.4,hy-6.6,-.39):back?bowPart(hx-7.4,hy-6.4,-.5,1.85,.85):bowPart(hx+4.6,hy-8,.55,1.85,.85)); // โบว์อยู่หูซ้ายของแมวเสมอ: หันซ้ายอยู่หูใกล้ หันขวาอยู่หูไกล
 const a=[];
 if(run||o.wide)put(a,hx+4.4,hyF-.4,[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2],[1,3]],IRIS),a.push([hx+4.4,hyF-.4,'#ffffff']); // ตาโตตื่นเต้น (วิ่ง ซุ่ม กระโจน)
 else if(o.shut)put(a,hx+4,hyF+2,[[0,0],[1,1],[2,1],[3,0]],EYE); // หลับตาอิ่มใจ (ยืดตัวสุด)
 else if(IDLE==='blink')put(a,hx+4.4,hyF+2.6,[[0,0],[1,0],[2,0]],EYE);else bean(a,hx+5,hyF,4,true); // ตาเม็ดถั่วเดียวกับท่าหันหน้า ค่อนไปทางหน้า
 a.push([hx+10.6,hyF+2,NOSE]);put(a,hx+9.6,hyF+3.2,[[1,0],[0,1]],EYE);blush(a,hx+2.2,hyF+3.6);
 if(sn)put(a,hx+11.4,hyF+4,o.nb?[[0,0],[0,2],[1,4]]:[[0,1],[1,3]],FX); // ดมฟุดฟิด: จุดเล็กใต้ปลายจมูกสลับตำแหน่ง   // จมูกที่ปลายหน้า ปากเล็กอยู่ในหน้า ไม่ยื่นออกนอกเส้น
 if(run&&R.lines&&!o.R)put(a,0,34,R.lines>1?[[0,0],[1,0],[2,0],[3,0],[1,3],[2,3],[3,3],[4,3],[5,3]]:[[1,0],[2,0],[3,0],[2,3],[3,3],[4,3]],FX); // เส้นความเร็ว
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
  fx:a=>{const c=RAMP[P('inner')][1],g=(G.toe||0)*.5;put(a,foot[0]-2-g,foot[1]-2.4,[[0,0]],c);put(a,foot[0],foot[1]-3,[[0,0]],c);put(a,foot[0]+2+g,foot[1]-2.4,[[0,0]],c)}})}; // เม็ดถั่วนิ้วเท้า
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
// ---------- ตื่นนอน / ก่อนนอน (รายงานพฤติกรรมข้อ 6–7 · v83) ----------
// หาว: เงยหน้า หลับตาแน่น หูเอนไปหลัง อ้าปากเห็นลิ้น แล้วหุบปากเลียริมฝีปาก (หาว+ยืดตัวมักเกิดตอนเปลี่ยนจากหลับเป็นตื่น)
// ปากหาวกว้างสุดแค่ 5×4 (เจ้าของ 2026-11-20 เห็นว่าปาก 7×6 ที่เห็นเขี้ยวมากไป จึงตัดเฟรมนั้นออก)
const YM={1:{l:[[1,0],[0,1],[2,1],[1,2]],r:[[1,1]]},2:{l:[[1,0],[2,0],[3,0],[0,1],[4,1],[0,2],[4,2],[1,3],[2,3],[3,3]],r:[[1,1],[2,1],[3,1]],t:[[1,2],[2,2],[3,2]]}};
const yawnMouth=(a,cx,y,n)=>{const m=YM[n],x=cx-(n===2?2:1);put(a,x,y,m.l,EYE);put(a,x,y,m.r,RED);if(m.t)put(a,x,y,m.t,TONGUE)};
const YAWN=[{m:1,e:'sl',up:-.4,ear:.1},{m:2,e:'sq',up:-1,ear:.25},{m:2,e:'sq',up:-.6,ear:.18},{m:0,e:'sl',up:0,ear:.05,lick:1}];
// นวด (ふみふみ): นั่งย่อตัวนิดๆ อุ้งเท้าหน้ายกกดสลับซ้ายขวา ตาหรี่อิ่มใจ คราง (ก่อนนอนบนเบาะนุ่ม หรือตอนสนิทกัน · ยังไม่มีงานวิจัยเชิงลึก ใช้เป็นลูกเล่นตอนผ่อนคลาย)
const KNEAD=[[3.4,0],[1,1],[0,3.4],[1,1]];
Object.assign(POSES,{
 yawn(f){const Y=YAWN[f],w=[0,.4,.8,.4][f];return sitCat({hy:Y.up,ear:Y.ear,tilt:Y.m>1?-.04:0,
  tail:[[33,40.6],[40,42],[43.6,37.4],[43.2+w*.4,31],[40.6+w*1.2,28.6+w*.4]],
  face:(a,hx,hy)=>{if(Y.e==='sl'){eyeSleepy(a,16.6,hy+1.6);eyeSleepy(a,27.6,hy+1.6)}else{put(a,16.6,hy+1,[[0,0],[1,0],[2,1],[3,1]],EYE);put(a,27.6,hy+1,[[0,1],[1,1],[2,0],[3,0]],EYE)} // หลับตาแน่นตอนอ้าปาก
   a.push([24,hy+3.6,NOSE]);if(Y.m)yawnMouth(a,24,hy+4.6,Y.m);else{mouth(a,22,hy+4.6);if(Y.lick)a.push([24,hy+5.8,TONGUE])}
   blush(a,12.6,hy+3.4);blush(a,32.4,hy+3.4)}})},
 knead(f){const[l0,l1]=KNEAD[f],b=f%2?.5:0;return sitCat({hy:.8+b,sq:.35,ear:.1,legs:'knead',lift:[l0,l1],
  tail:[[33,40.6],[40,42],[43.6,37.4],[43.4,31.4+b],[41.2,29+b]],
  face:(a,hx,hy)=>{eyeSleepy(a,16.6,hy+1.6);eyeSleepy(a,27.6,hy+1.6);mouth(a,22,hy+4.6);blush(a,12.6,hy+3.4);blush(a,32.4,hy+3.4)},
  fx:(a,by)=>{const o=f>>1;put(a,6,16+o,[[1,0],[0,1],[0,2],[1,3]],FX);put(a,41,17-o,[[0,0],[1,1],[1,2],[0,3]],FX); // เส้นโค้งข้างหู = คราง
   if(!(f%2)){const x=l0?27:21;put(a,x-4,43+by,[[0,0]],FX);put(a,x+4,43+by,[[0,0]],FX)}}})} // ขีดเล็กข้างอุ้งเท้าที่กำลังกดลง
});
// ง่วงเคลิ้ม = นั่งสัปหงก (v86 · เจ้าของเลือกจากร่าง 3 แบบใน docs/loaf-drafts.js 2026-11-20 แทนท่าหมอบ loaf ที่ตาและตัวดูใหญ่กว้างไป)
// นั่งตัวปกติ หางโค้งมนโอบมาหน้าเท้า หัวค่อยๆ ก้มทีละนิด ตาปรือเล็ก → เหลือแค่เปลือกตา → หลับ ‿ มี Zz → สะดุ้งเงยหน้าลืมตา → ปรือใหม่
// หัวไม่เอียง (เอียงแล้วหน้าที่หมุนทำให้ปากเบี้ยวที่ขนาดพิกเซลนี้) · ตาเล็ก 3 px (ตาปรือเดิมกว้าง 4 px หนา 2 แถวดูใหญ่)
const lid3=(a,x,y,o=1)=>{put(a,x,y,[[0,0],[1,0],[2,0]],EYE);if(o)put(a,x+1,y+1,[[0,0]],IRIS)},shut3=(a,x,y)=>put(a,x,y,[[0,0],[1,1],[2,0]],EYE);
const DOZE=[{hy:0,e:1,ear:.04},{hy:.4,e:1,ear:.06},{hy:.9,e:0,ear:.09},{hy:1.4,e:-1,ear:.12,z:1},{hy:1.9,e:-1,ear:.15,z:2},{hy:2.2,e:-1,ear:.17,z:3},{hy:-.4,e:2,ear:0},{hy:0,e:1,ear:.03}];
POSES.doze=f=>{const D=DOZE[f],sw=[0,.2,.4,.6,.8,.6,0,-.2][f];return sitCat({hy:D.hy,ear:D.ear,tailFront:true,
  tail:[[35.4,41],[37.4,42.6],[37.2,44.4],[34.6,45.5],[29.6,45.8],[24.6+sw*.3,45.4],[20.8+sw*.6,44.6-sw*.3]],tr0:2,tr1:1.25, // โผล่จากหลังสะโพกที่ระดับพื้น โค้งมนเป็นเส้นเดียว ไม่หักที่โคน
  face:(a,hx,y)=>{[17,28].forEach(x=>D.e===2?bean(a,x+.6,y+.4,3):D.e<0?shut3(a,x,y+1.6):lid3(a,x,y+1,D.e)); // สะดุ้ง = ตาเม็ดถั่วสั้น
   mouth(a,22,y+4.6);blush(a,13,y+3.4);blush(a,32,y+3.4)},
  fx:a=>{if(D.z)zz(a,38+(D.z>2?1:0),10-D.z*1.6,D.z>2)}})};
// ยืดตัวโค้งคำนับ: จากท่ายืนหันข้าง ค่อยๆ ก้มอกลงแนบพื้น เหยียดขาหน้า สะโพกยก หลับตา (หาวไปด้วยตอนสุด) แล้วกลับมายืน · ต่อด้วยเดินได้เลย
const STRETCH=[0,.55,1,1,.55,0];
const stretchCat=(dir,f)=>{const b=STRETCH[f];return sideCat({dir,f:f+2,bow:b,shut:b>.9})}; // ส่ง dir ให้ sideCat เลือกช่องลายตามข้างจริง (หันซ้ายลายไม่สลับข้าง)
Object.assign(POSES,{stretchR:f=>stretchCat(1,f),stretchL:f=>stretchCat(-1,f)});
// ยืดขาหลัง (v117 · ต่อจากโค้งคำนับ · รายงานข้อ 6): ตัวโน้มไปหน้า เหยียดขาหลังทีละข้างตรงไปด้านหลัง ปลายเท้าชี้ เห็นอุ้งเท้าชมพู หลับตาตอนยืดสุด หางยกเหยียด · ขาใกล้ก่อนแล้วขาไกล
const HIND=[[.4,0],[.8,0],[1,0],[1,0],[.3,0],[.6,1],[1,1],[.4,1]];
const hindCat=(dir,f)=>{const[h,l]=HIND[f];return sideCat({dir,f,hs:h,hl:l,shut:h>.9})};
// ดม (v117): ยืนหันข้าง ก้มหัวลงชิดพื้น จมูกฟุดฟิด (เดินไปดมของในฉาก · ดมเบาะก่อนนอน)
const sniffCat=(dir,f)=>sideCat({dir,f:f*2,sn:1,nb:f%2});
Object.assign(POSES,{hindR:f=>hindCat(1,f),hindL:f=>hindCat(-1,f),sniffR:f=>sniffCat(1,f),sniffL:f=>sniffCat(-1,f)});
// ---------- ท่าที่ใช้ของในฉาก (v97) ----------
// ซุ่มผีเสื้อ (สวน): หมอบต่ำ ตาโต ก้นส่ายซ้ายขวา ปลายหางกระตุก → กระโจน (ถีบขาหลัง ลอยยืดตัว) → ตะปบ ขาหน้าเหยียดกดพื้น หัวก้มดูใต้อุ้งเท้า
const PNC=[{e:1.2,by:-2,L:[[3,5.6,.2],[2.2,5.8,.2],[-1.6,2.4,0],[-.8,2.8,.2]]},{e:2.2,by:-6.4,L:[[3.6,9.4,0],[2.8,9.6,0],[-3.4,8.6,.4],[-2.6,9,.3]]}]; // ขายกตามตัว ขาจึงสั้นเท่าเดิม แค่ยื่นไปหน้า/หลัง (เจ้าของขอ: ขาไม่ยืดยาว)
Object.assign(POSES,{crouchR:f=>sideCat({dir:1,f,cr:1,wig:[0,1,0,-1][f],tf:f%2,wide:1}),crouchL:f=>sideCat({dir:-1,f,cr:1,wig:[0,1,0,-1][f],tf:f%2,wide:1}),
 pounceR:f=>sideCat({dir:1,f,mode:'run',R:PNC[f],wide:1}),pounceL:f=>sideCat({dir:-1,f,mode:'run',R:PNC[f],wide:1}),
 pinR:f=>sideCat({dir:1,f,cr:.85,reach:6.4,tf:f,wide:1}),pinL:f=>sideCat({dir:-1,f,cr:.85,reach:6.4,tf:f,wide:1})});
Object.assign(POSES,{turnR:f=>turnCat({dir:1,f}),turnL:f=>turnCat({dir:-1,f}),walkR:f=>sideCat({dir:1,f,mode:'walk'}),walkL:f=>sideCat({dir:-1,f,mode:'walk'}),walkUpR:f=>sideCat({dir:1,f,mode:'walk',up:1}),walkUpL:f=>sideCat({dir:-1,f,mode:'walk',up:1}),runR:f=>sideCat({dir:1,f,mode:'run'}),runL:f=>sideCat({dir:-1,f,mode:'run'}),standR:f=>sideCat({dir:1,f}),standL:f=>sideCat({dir:-1,f})});
const INFO=[['sit','นั่งรอ','สะโพกกลม ขาหน้า U U หางเรียวโค้งขึ้นปลายแกว่ง ตาเม็ดถั่ว กะพริบ หูกระดิก สะบัดหางแบบสุ่มจังหวะ (ค่าเริ่มต้น รอเรียนด้วยกัน)',Array(8).fill(340)],
 ['think','คิด รอคำตอบ','เอียงหัวนิดๆ ตามองขึ้น จุดความคิดโผล่ทีละจุด (ระหว่างทำควิซ รอผู้ใช้ตอบ)',[500,500,500,700]],
 ['read','อ่านหนังสือ','ถือหนังสือสองมือ ตามองลงไล่จากซ้ายไปขวา กะพริบเป็นระยะ (เปิดบทเรียน ไวยากรณ์)',[420,420,420,300]],
 ['happy','ดีใจ','กระโดดเบาๆ หางตั้งตรงปลายงอแกว่งไปมา (แมวดีใจหางจะตั้ง) ตา > < ปากอ้า (ตอบถูก ได้เหรียญ ครบสตรีค โตเป็นร่างใหม่)',[180,120,160,120]],
 ['sad','เสียใจ','หูลู่ หัวก้ม หางแบนราบกับพื้น น้ำตาไหล คิ้วตก (ตอบผิด หายไปนาน)',[450,450,550,450]],
 ['curl','นอนหลับ','นอนขดเป็นโดนัท คางวางบนอุ้งเท้า หางโค้งเลียบก้นมาด้านหน้า หน้า - . - ท้องพองยุบ (ดึก)',[650,650,650,650]],
 ['doze','ง่วง สัปหงก','นั่งตัวตรง หางโค้งโอบหน้าเท้า หัวค่อยๆ ก้ม ตาปรือเล็ก → หลับ มี Zz → สะดุ้งเงยหน้าลืมตา แล้วปรือใหม่ (งีบ ก่อนนอน ตอนตื่น · แทนท่าหมอบตั้งแต่ v86)',[620,480,420,420,460,640,260,520]],
 ['loaf','หมอบ (ไม่ได้ใช้แล้ว)','หมอบแบบขนมปัง ซุกเท้าใต้อก ตาปรือ สัปหงกแล้วสะดุ้ง (ใกล้ดึก ไม่ได้เรียนนาน)',[650,500,450,350]],
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
 ['yawn','หาว','เงยหน้า หลับตาแน่น หูเอนไปหลัง อ้าปากเห็นลิ้น แล้วหุบปากเลียริมฝีปาก (ตื่นนอน งีบเสร็จ)',[280,760,400,460]],
 ['stretchR','ยืดตัว (ขวา)','จากท่ายืน ก้มอกแนบพื้น เหยียดขาหน้าไปข้างหน้า สะโพกยก หางตั้ง หลับตาตอนยืดสุด แล้วกลับมายืน (ตื่นนอนก่อนเดิน)',[240,300,900,820,300,240]],
 ['stretchL','ยืดตัว (ซ้าย)','เหมือนยืดตัวหันขวา กลับรูปทรง ลายไม่สลับ',[240,300,900,820,300,240]],
 ['hindR','ยืดขาหลัง (ขวา)','ต่อจากยืดตัว ตัวโน้มไปหน้า เหยียดขาหลังทีละข้างไปด้านหลัง ปลายเท้าชี้ เห็นอุ้งเท้าชมพู หลับตาตอนยืดสุด',[200,240,620,480,200,240,520,220]],
 ['hindL','ยืดขาหลัง (ซ้าย)','เหมือนยืดขาหลังหันขวา กลับรูปทรง ลายไม่สลับ',[200,240,620,480,200,240,520,220]],
 ['sniffR','ดม (ขวา)','ยืนก้มหัวลงชิดพื้น จมูกฟุดฟิด (ดมของในฉาก ดมเบาะก่อนนอน)',[220,160,220,160]],
 ['sniffL','ดม (ซ้าย)','เหมือนดมหันขวา กลับรูปทรง',[220,160,220,160]],
 ['knead','นวด ふみふみ','นั่งย่อตัว อุ้งเท้าหน้ายกกดสลับซ้ายขวา ตาหรี่อิ่มใจ คราง (ก่อนนอนบนเบาะ)',[260,200,260,200]],
 ['birdwatch','มองนก','เงยหน้ามองหน้าต่าง ตาโต หูตั้ง ปากสั่นแกะๆ ปลายหางกระตุก (นกชิมะเอนางะมาเกาะหน้าต่างห้อง)',[200,130,200,130]],
 ['startle','สะดุ้ง','กระโดดตัวลอย หูลู่ ตาโตกลม หางพองเป็นแปรง มี ! แล้วย่อตัวนิ่ง หูค่อยกลับ (รถไฟผ่านที่สถานี)',[180,260,900,600]],
 ['bask','นอนอาบแดด','หมอบตะแคงในแดดบนพื้น ตัวกลมนุ่ม หัวตั้งตรง หลับตาเป็นขีด - - ขาหน้าเรียววางซ้อนกัน หางโอบเลียบพื้น หายใจช้า (กลางวันในห้อง)',[900,900,900,900]],
 ['crouchR','หมอบซุ่ม (ขวา)','หมอบต่ำ ตาโต ก้นส่าย ปลายหางกระตุก (ซุ่มผีเสื้อในสวน)',[170,170,170,170]],
 ['crouchL','หมอบซุ่ม (ซ้าย)','เหมือนหมอบซุ่มหันขวา กลับรูปทรง',[170,170,170,170]],
 ['pounceR','กระโจน (ขวา)','ถีบขาหลังแล้วลอยยืดตัว ขาหน้าเหยียดไปข้างหน้า',[150,270]],
 ['pounceL','กระโจน (ซ้าย)','เหมือนกระโจนหันขวา กลับรูปทรง',[150,270]],
 ['pinR','ตะปบ (ขวา)','ลงพื้นหมอบ ขาหน้าเหยียดกดพื้น หัวก้มดูใต้อุ้งเท้า',[350,350]],
 ['pinL','ตะปบ (ซ้าย)','เหมือนตะปบหันขวา กลับรูปทรง',[350,350]],
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
const AWAKE=['sit','think','read','happy','sad','eat','shy','curious','standR','standL','turnR','turnL'],ASLEEP=['curl','loaf','belly','doze','bask'];
const IDLES={blink:{every:[2500,6500],len:140},twitch:{every:[9000,20000],sleep:[12000,28000],len:300,on:[[0,90],[170,280]]},flick:{every:[4500,10000],sleep:[15000,32000],len:320}};
const IDLE_FOR=Object.fromEntries([...AWAKE.map(k=>[k,['blink','twitch','flick']]),...ASLEEP.map(k=>[k,k==='doze'?['twitch']:['twitch','flick']])]),IDLE_NAMES=['blink','twitchL','twitchR','flick']; // สัปหงก: หางโอบหน้าเท้า ไม่สะบัด
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
const SCOL={light:{fj:'#a9bfd6',fjs:'#f6f9fc',paper:'#fbf1df',lit:null,trunk:'#9a7250',clk:'#fffaf0',hand:'#4f372b',bob:'#e8b04a',glass:'#f3e3cc',wall:'#fff3e3',wall2:'#fbe7cf',trim:'#e5c9a8',floor:'#efd6b5',floor2:'#e4c6a0',seam:'#d8b68e',sky:'#cfe9f7',sky2:'#e8f6fc',frame:'#c49a73',frame2:'#a97e58',cloud:'#ffffff',cloud2:'#d5e2ee',
  cush:'#f3a8a0',cush2:'#de8a83',cush3:'#fbc9c2',pot:'#dd9264',pot2:'#bf744b',pot3:'#efb08a',leaf:'#86b96f',leaf2:'#65985a',leaf3:'#a8d48f',line:'#7a5a43',shade:'rgba(90,58,38,.14)',moon:null,
  cork:'#dcb98f',cork2:'#c9a277',note:'#fffaf0',note2:'#fde9a6',note3:'#d6ebf6',ink:'#c7b196',shin:'#8a6446',b1:'#e58f7d',b2:'#7ea9cd',b3:'#ebc66b',b4:'#93bf8c',b5:'#b89acb',spine:'rgba(255,255,255,.38)',mk:'#fffaf2',
  hill:'#b9d9c3',house:'#f2e3d0',roof:'#cf8f72',lwin:null,cur:'#f6cdbd',cur2:'#e6b09d',cur3:'#d98f7c',bird:'#ffffff',bird2:'#e1e6ec',bird4:'#2c2830',bird5:'#b3bdc9',bird6:'#d9a49c',eye:'#1b181e',glare:'rgba(255,255,255,.45)',fshd:'rgba(60,70,90,.10)',curH:'#fde4d9',trunk2:'#b88f6a',leaf4:'#4c7c45',soil:'#6b4a35',pilP:'#f6f1e8',pilP2:'#d8cfc1',box:'#d6a868',box2:'#b4884f',box3:'#ebc98f',box4:'#7d5a35',tape:'#efe3c6'},
 dark:{fj:'#34435c',fjs:'#8d9bb0',paper:'#6a5a4a',lit:'#ffd98a',trunk:'#6b5040',clk:'#d9ccb4',hand:'#2e221c',bob:'#b88a3a',glass:'#3a2f27',wall:'#2c2520',wall2:'#27211c',trim:'#3d332b',floor:'#3a3029',floor2:'#342a23',seam:'#2a221c',sky:'#1e2b47',sky2:'#273860',frame:'#7d604a',frame2:'#634a37',cloud:null,
  cush:'#a6625c',cush2:'#864d48',cush3:'#bd7a73',pot:'#9a6544',pot2:'#7b4f34',pot3:'#b07a57',leaf:'#5f8c52',leaf2:'#4a7040',leaf3:'#79a868',line:'#b8987a',shade:'rgba(0,0,0,.3)',moon:'#f4e4a6',
  cork:'#5d4835',cork2:'#4f3d2d',note:'#7a6e60',note2:'#7f6f45',note3:'#5b6a74',ink:'#544638',shin:'#3f2f24',b1:'#8f5a4f',b2:'#4f6a82',b3:'#8f7a45',b4:'#5d7a58',b5:'#6e5d7c',spine:'rgba(255,255,255,.12)',mk:'#cfc6b8',
  hill:'#18233a',house:'#262c3d',roof:'#352f44',lwin:'#f6d27a',cur:'#5c4340',cur2:'#4b3634',cur3:'#6e4d47',bird:'#ffffff',bird2:'#e1e6ec',bird4:'#2c2830',bird5:'#b3bdc9',bird6:'#d9a49c',eye:'#1b181e',glare:'rgba(255,255,255,.12)',fshd:'rgba(0,0,0,.15)',curH:'#6e5250',trunk2:'#86664e',leaf4:'#3a5a33',soil:'#3a2a20',pilP:'#8a8378',pilP2:'#6e685f',box:'#806849',box2:'#64523c',box3:'#9a8062',box4:'#352a21',tape:'#958b74'}};
const rect=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h)};
const blob=(c,cx,cy,rx,ry,col)=>{c.fillStyle=col;for(let y=Math.floor(cy-ry);y<=cy+ry;y++)for(let x=Math.floor(cx-rx);x<=cx+rx;x++)if(((x+.5-cx)/rx)**2+((y+.5-cy)/ry)**2<=1)c.fillRect(x,y,1,1)};
const canv=()=>{const v=document.createElement('canvas');v.width=SW;v.height=SH;return v};
// ---------- ฉากพิกเซลตามสถานที่ (เจ้าเหมียวเที่ยวญี่ปุ่น · js/data/places.js) ----------
// ทุกฉากขนาด 160×90 เส้นพื้น y=85 เหมือนกัน · มีที่นอน (bed: เบาะ x=12) เฉพาะห้องอ่านหนังสือ (เจ้าของขอ 2026-11-19: ไปเที่ยวแล้วมีเบาะดูแปลก)
// ที่อื่น bed = null: แมวไม่เดินไปขดหลับลึก แต่งีบหมอบตรงที่อยู่แทน (แมวระวังตัวในที่ไม่คุ้น)
// กติกาการวาดฉาก (ต้นฉบับ ไม่มีตัวหนังสือ ไม่มีแบรนด์จริง): docs/PET_PIXEL.md หัวข้อ "กติกาการออกแบบที่ test ตรวจไม่ได้"
// ชั้นภาพ (v92 ยกระดับฉาก): far (แคช: ฟ้า ภูเขา เมือง) → air (ขยับ: เมฆลอย) → mid (แคช: ราง สายไฟ) → back (ขยับ: รถไฟ) → bg (แคช: ของในฉาก) → live (ขยับ หลังแมว: นาฬิกา แดด นก กระบอกไม้ไผ่)
//  → แมว → fg (แคช บังแมวได้ มีเส้นขอบอัตโนมัติ) → front (ขยับ หน้าแมว: ไอกาแฟ ผีเสื้อ หิ่งห้อย เข็มนาฬิกาเสา)
// ชั้นที่ขยับรับ A = {t: performance.now(), ms: Date.now(), d: Date, P: เล่นแอนิเมชันได้, td: ช่วงเวลา} · tick(A) คืนสตริงสถานะ (เปลี่ยนเมื่อไหร่ค่อยวาดใหม่)
// ตารางเวลาของสิ่งที่ขยับใช้นาฬิกาจริง (Date.now()) เปิดแอปกี่ครั้งก็ตรงกัน · ผู้ใช้ปิดแอนิเมชัน (P = false): เมฆนิ่ง ไม่มีรถไฟ นก ผีเสื้อ หิ่งห้อย ไอกาแฟ
const poly=(c,P,col)=>{c.fillStyle=col;const xs=P.map(p=>p[0]),ys=P.map(p=>p[1]);
 for(let y=Math.floor(Math.min(...ys));y<=Math.max(...ys);y++)for(let x=Math.floor(Math.min(...xs));x<=Math.max(...xs);x++){const px=x+.5,py=y+.5;let ins=false;
  for(let i=0,j=P.length-1;i<P.length;j=i++){const[xi,yi]=P[i],[xj,yj]=P[j];if((yi>py)!==(yj>py)&&px<(xj-xi)*(py-yi)/(yj-yi)+xi)ins=!ins}if(ins)c.fillRect(x,y,1,1)}};
const dot=(c,x,y,col)=>{c.fillStyle=col;c.fillRect(Math.floor(x),Math.floor(y),1,1)};
// ---------- ฤดูตามญี่ปุ่นจริง (v109 เจ้าของขอ · เลือก "ตามญี่ปุ่นจริง" 2026-11-20) ----------
// ใบไม้ผลิ มี.ค.–พ.ค. (เมเปิลในสวนเป็นซากุระ กลีบปลิว) · ร้อน มิ.ย.–ส.ค. (เมเปิลเขียว หิ่งห้อย) · ใบไม้ร่วง ก.ย.–พ.ย. (เมเปิลแดง ใบร่วง) · หนาว ธ.ค.–ก.พ. (กิ่งโล่ง หิมะ)
// คิดจากเดือนของนาฬิกาฉาก (NOW หรือเวลาเครื่อง) · ชุดสีของฉากรวมสีตามฤดูจาก SCENES[ที่].sea · ภาพแคชแยกตามฤดู · _t.setSeason() ตรึงฤดูไว้ทดสอบ/พรีวิว
let SEAS=null;const SEASONS=['spring','summer','autumn','winter'],season=(ms=NOW??Date.now())=>SEAS||SEASONS[((new Date(ms).getMonth()+10)%12)/3|0];
// หิมะตกเฉพาะบางวัน (v114 · เดิมตกทุกวันของหน้าหนาว): สุ่มกำหนดตามวันที่ของเครื่อง ทั้งวันจึงตกหรือไม่ตกเหมือนกันทุกครั้งที่เปิด
// โอกาส ธ.ค. 35% · ม.ค. 50% · ก.พ. 45% (ค่าของเกม · ต้นหนาวยังตกน้อย) · หิมะบนพื้นและหลังคายังอยู่ทั้งหน้าหนาว · _t.setSnow(true/false) ตรึงไว้ทดสอบ/พรีวิว
let SNOWF=null;const SNOWP={11:.35,0:.5,1:.45},
 snowDay=(ms=NOW??Date.now())=>{if(SNOWF!=null)return SNOWF;const d=new Date(ms),pr=SNOWP[d.getMonth()];if(!pr)return false;
  let h=(d.getFullYear()*372+d.getMonth()*31+d.getDate())*2654435761>>>0;h^=h>>>15;h=Math.imul(h,2246822519)>>>0;h^=h>>>13;return(h>>>0)/4294967296<pr},
 falling=(se,ms)=>se==='spring'||se==='autumn'||(se==='winter'&&snowDay(ms)); // วันนี้มีของตกไหม (กลีบ/ใบตกทุกวันของฤดู)
// กล่องกระดาษในห้อง (v118 · รายงานข้อ 11 กล่องหลบ): โผล่มาบางวัน ราว 40% (ของใหม่ให้แมวไปดมแล้วมุดเข้าไปนั่ง) สุ่มกำหนดตามวันที่ · _t.setBox(true/false) ตรึงไว้ทดสอบ/พรีวิว
let BOXF=null;const BOXP=.4,BOX={x0:58,x1:86,top:74,cx:48,dy:6},
 boxDay=(ms=NOW??Date.now())=>{if(BOXF!=null)return BOXF;const d=new Date(ms);let h=(d.getFullYear()*389+d.getMonth()*37+d.getDate()*7+3)*2246822519>>>0;h^=h>>>13;h=Math.imul(h,3266489917)>>>0;h^=h>>>16;return(h>>>0)/4294967296<BOXP},
 boxOn=()=>PLACE==='room'&&boxDay(),bkey=()=>boxOn()?'|box':''; // bkey ต่อท้ายรหัสแคชของฉาก
// ของที่ตกลงมาตามฤดู: กลีบซากุระ ใบเมเปิล หิมะ · เส้นทางคิดจากนาฬิกาฉากล้วน (ไม่เก็บสถานะ เปิดกี่ครั้งก็ตรงกัน) · ปิดแอนิเมชัน = ไม่มี
// R = [x, y, กว้าง, สูง] ช่วงที่ตก · ok(x,y) = วาดเฉพาะจุดที่ผ่าน (หน้าต่าง: เฉพาะพิกเซลที่เป็นฟ้า ไม่ทับกรอบ ม่าน เมฆ)
const FALLC={spring:[['#f7c4d2','#ec9fb5'],['#b98399','#9c6a80']],autumn:[['#e8735a','#c9533f','#f0a05a'],['#93473a','#76382e','#a0663e']],winter:[['#ffffff','#eef3f8'],['#dde5f0','#b8c4d6']]};
function fall(c,A,se,[x0,y0,w,h],n,ok){if(!A.P||!FALLC[se]||!falling(se,A.ms))return;const C=FALLC[se][A.sk==='dark'?1:0],wi=se==='winter';
 for(let i=0;i<n;i++){const T=(wi?11000:se==='spring'?13000:9000)+(i*7919)%6000,p=(A.ms/T+i*.618)%1,
  rx=(((i*37.7)%w+p*w*(wi?.1:.35)+Math.sin(A.ms/(650+i*53)+i)*(wi?1.3:2.6))%w+w)%w,x=Math.floor(x0+rx),y=Math.floor(y0+p*h),f=((A.ms/(wi?400:260))+i)|0;
  const P=wi?(i%5?[[0,0]]:[[0,0],[1,0],[0,1],[1,1]]):se==='spring'?(f%2?[[0,0],[1,0]]:[[0,0],[0,1]]):(f%2?[[0,0],[1,0],[0,1]]:[[1,0],[0,1],[1,1]]);
  c.fillStyle=C[i%C.length];P.forEach(([u,v])=>{if(!ok||ok(x+u,y+v))c.fillRect(x+u,y+v,1,1)})}}
// หน้ากากช่องฟ้าของภาพแคช: พิกเซลที่เป็นสี sky/sky2 พอดี (แคชต่อผืนผ้าใบ)
const MASKS=new WeakMap();function skyMask(v,k){let m=MASKS.get(v);if(m)return m;const d=v.getContext('2d').getImageData(0,0,SW,SH).data,S=[k.sky,k.sky2].filter(x=>x&&x[0]==='#').map(x=>parseInt(x.slice(1,7),16));
 m=new Uint8Array(SW*SH);for(let i=0;i<SW*SH;i++)if(d[i*4+3]===255&&S.includes((d[i*4]<<16)|(d[i*4+1]<<8)|d[i*4+2]))m[i]=1;MASKS.set(v,m);return m}
const fallIn=(c,k,A,se,R,n)=>{if(!A.P||!FALLC[se]||!falling(se,A.ms))return;const M=skyMask(layer('bg',A.sk),k);fall(c,A,se,R,n,(x,y)=>x>=0&&y>=0&&x<SW&&y<SH&&M[y*SW+x])};
// ---------- พระจันทร์ตามโลกจริง (v104 เจ้าของขอ) ----------
// เฟสคิดจากเดือนจันทรคติเฉลี่ย 29.53 วัน นับจากจันทร์ดับ 6 ม.ค. 2000 18:14 UTC (คลาดจากจริงไม่เกินราวครึ่งวัน)
// p: 0 = ดับ · .25 = ข้างขึ้นครึ่งดวง · .5 = เต็มดวง · .75 = ข้างแรมครึ่งดวง · ซีกโลกเหนือ: ข้างขึ้นสว่างฝั่งขวา ข้างแรมสว่างฝั่งซ้าย
// ขึ้น-ตก: ผ่านกลางฟ้าราว 12:00 + 24p ชม. (เวลาเครื่อง) อยู่บนฟ้า ±6 ชม. จากนั้น ข้างขึ้นเห็นหัวค่ำ ข้างแรมเห็นหลังเที่ยงคืน จันทร์ดับไม่เห็น
// ha = ชม.หลังผ่านกลางฟ้า (ลบ = ยังขึ้นอยู่ฝั่งตะวันออก ซ้ายจอ · บวก = ลงฝั่งตะวันตก ขวาจอ)
const SYN=29.530588853,NM0=Date.UTC(2000,0,6,18,14),TAU=Math.PI*2;
function moonAt(ms){const p=(((ms-NM0)/864e5/SYN)%1+1)%1,d=new Date(ms),h=d.getHours()+d.getMinutes()/60,ha=((h-12-24*p)%24+36)%24-12;
 return{p,lit:(1-Math.cos(TAU*p))/2,ha,up:Math.abs(ha)<6.2,k:moonTilt(ms,p,h)}}
// ทิศด้านสว่าง (v105 เจ้าของขอ "เสี้ยวนอนเป็นเรือแบบที่เห็นจากเมืองไทย"): ด้านสว่างหันหาดวงอาทิตย์เสมอ คิดตำแหน่งดวงอาทิตย์กับดวงจันทร์บนฟ้าจริง
// ที่ละติจูดตามเขตเวลาเครื่อง (LAT · ค่าเริ่มต้น 14°N กรุงเทพฯ) ตามวันในปี (ระนาบสุริยวิถีเอียง 23.44°) แล้วหาทิศจากดวงจันทร์ไปดวงอาทิตย์บนจอ (มองไปทางใต้: ตะวันออกซ้าย ตะวันตกขวา)
// ปัดเป็น 8 ทิศ k: 0 ขวา 1 ขวาล่าง 2 ล่าง (เสี้ยวหงายเป็นเรือ) 3 ซ้ายล่าง 4 ซ้าย 5 ซ้ายบน 6 บน 7 ขวาบน · ถือว่าเวลาเครื่อง ≈ เวลาสุริยะท้องถิ่น
// v115 ละติจูดตามเขตเวลาของเครื่อง (เดิมกรุงเทพฯ ทุกเครื่อง): ผู้ใช้ญี่ปุ่นเห็นเสี้ยวเอียงแบบญี่ปุ่น · ไม่รู้จักเขตเวลา = 14°N
// ซีกโลกใต้มองไปทางเหนือ (ตะวันออกอยู่ขวา) แต่ฉากวาดพระจันทร์ขึ้นซ้ายตกขวาเสมอ จึงใช้ภาพสะท้อนของท้องฟ้าจริงทั้งภาพ (moonTilt กลับ dx) · _t.setLat(องศา) ตรึงไว้ทดสอบ/พรีวิว
const TZLAT={Bangkok:13.75,Vientiane:18,Phnom_Penh:11.6,Ho_Chi_Minh:10.8,Saigon:10.8,Yangon:16.8,Rangoon:16.8,Tokyo:35.7,Seoul:37.6,Shanghai:31.2,Chongqing:29.6,Hong_Kong:22.3,Macau:22.2,Taipei:25,
 Singapore:1.35,Kuala_Lumpur:3.1,Jakarta:-6.2,Makassar:-5.1,Manila:14.6,Kolkata:22.6,Calcutta:22.6,Dhaka:23.8,Kathmandu:27.7,Dubai:25.2,Riyadh:24.7,Karachi:24.9,
 London:51.5,Paris:48.9,Berlin:52.5,Madrid:40.4,Rome:41.9,Moscow:55.8,New_York:40.7,Chicago:41.9,Denver:39.7,Los_Angeles:34.1,Toronto:43.7,Vancouver:49.3,Mexico_City:19.4,Honolulu:21.3,
 Sao_Paulo:-23.5,Buenos_Aires:-34.6,Santiago:-33.4,Lima:-12,Bogota:4.6,Johannesburg:-26.2,Cairo:30,Lagos:6.5,Nairobi:-1.3,
 Sydney:-33.9,Melbourne:-37.8,Brisbane:-27.5,Perth:-31.95,Adelaide:-34.9,Darwin:-12.5,Hobart:-42.9,Auckland:-36.85},
 TZREG={Asia:25,Europe:50,America:35,Africa:5,Australia:-30,Pacific:-15,Atlantic:35,Indian:-10},
 latOf=tz=>{if(!tz)return 14;const P=tz.split('/'),c=TZLAT[P[P.length-1]];return c!=null?c:TZREG[P[0]]!=null?TZREG[P[0]]:14};
let LAT=(()=>{try{return latOf(Intl.DateTimeFormat().resolvedOptions().timeZone)}catch{return 14}})()*Math.PI/180;const OBL=23.44*Math.PI/180,RAD=Math.PI/180;
function moonTilt(ms,p,h){const dd=(ms-Date.UTC(2000,0,1,12))/864e5,ls=(280.46+.9856474*dd)*RAD,lm=ls+p*TAU,
 eq=l=>[Math.atan2(Math.cos(OBL)*Math.sin(l),Math.cos(l)),Math.asin(Math.sin(OBL)*Math.sin(l))],[ras,des]=eq(ls),[ram,dem]=eq(lm),
 hs=(h-12)*15*RAD,hm=hs-(ram-ras),
 aa=(H,de)=>{const al=Math.asin(Math.sin(LAT)*Math.sin(de)+Math.cos(LAT)*Math.cos(de)*Math.cos(H)),az=Math.atan2(Math.sin(H),Math.cos(H)*Math.sin(LAT)-Math.tan(de)*Math.cos(LAT));return[al,az]}, // az วัดจากทิศใต้ไปทางตะวันตก
 [a1,z1]=aa(hm,dem),[a2,z2]=aa(hs,des),dz=z2-z1,dx=Math.cos(a2)*Math.sin(dz),dy=Math.cos(a1)*Math.sin(a2)-Math.sin(a1)*Math.cos(a2)*Math.cos(dz);
 return((Math.round(Math.atan2(-dy,LAT<0?-dx:dx)/(Math.PI/4))%8)+8)%8}
let MOON=moonAt(Date.now());
// ตำแหน่งบนฟ้าเป็นเส้นโค้ง: (xz,yz) = จุดสูงสุดตอนผ่านกลางฟ้า (ha=0) · xe/xw = x ที่ขอบฟ้าฝั่งขึ้น (ซ้าย) / ฝั่งตก (ขวา) · h = ระยะลงถึงขอบฟ้า
// แต่ละฉากวางจุดสูงสุดไว้กลางช่องกระจก/ช่องฟ้าที่เห็นชัด ไม่ให้ค้างหลังกรอบหน้าต่างหรือป้าย (ขึ้น-ตกแล้วหายหลังภูเขา ตึก หรือกรอบ)
const moonXY=(xz,yz,xe,xw,h)=>{const a=clamp(MOON.ha/6,-1.05,1.05);return[xz+a*(a<0?xz-xe:xw-xz),yz+h*(1-Math.cos(a*Math.PI/2))]};
// ดวงจันทร์ 7×7 วาดมือทีละเฟส (คำนวณเป็นวงกลมเล็กขนาดนี้แล้วเสี้ยวขาดเป็นจุด) · L = ด้านสว่าง D = ด้านมืด (แสงโลกจางๆ)
// วาดไว้ 2 ทิศ: ด้านสว่างหันขวา (MOONS) กับหันขวาล่าง (MOONSD · ทแยง) แล้วหมุนทีละ 90° ได้ครบ 8 ทิศ (moonTilt)
// ช่วงเฟส q = ระยะจากจันทร์ดับ: ดับ <.035 · เสี้ยวบาง <.11 · เสี้ยว <.19 · ครึ่งดวง <.28 · ค่อนดวง <.36 · เกือบเต็ม <.45 · เต็มดวง
const MPH=[.035,.11,.19,.28,.36,.45,.5],MOONS=[null,
 ['..DDL..','.DDDDL.','DDDDDLL','DDDDDLL','DDDDDLL','.DDDDL.','..DDL..'],
 ['..DDL..','.DDDLL.','DDDDLLL','DDDDLLL','DDDDLLL','.DDDLL.','..DDL..'],
 ['..DLL..','.DDLLL.','DDDLLLL','DDDLLLL','DDDLLLL','.DDLLL.','..DLL..'],
 ['..DLL..','.DLLLL.','DDLLLLL','DDLLLLL','DDLLLLL','.DLLLL.','..DLL..'],
 ['..LLL..','.DLLLL.','DLLLLLL','DLLLLLL','DLLLLLL','.DLLLL.','..LLL..'],
 ['..LLL..','.LLLLL.','LLLLLLL','LLLLLLL','LLLLLLL','.LLLLL.','..LLL..']],
 MOONSD=[null,
 ['..DDD..','.DDDDD.','DDDDDDL','DDDDDDL','DDDDDLL','.DDDLL.','..LLL..'],
 ['..DDD..','.DDDDD.','DDDDDLL','DDDDDLL','DDDDLLL','.DLLLL.','..LLL..'],
 ['..DDD..','.DDDDL.','DDDDLLL','DDDLLLL','DDLLLLL','.LLLLL.','..LLL..'],
 ['..DDD..','.DDDLL.','DDDLLLL','DDLLLLL','DLLLLLL','.LLLLL.','..LLL..'],
 ['..DDL..','.DLLLL.','DLLLLLL','DLLLLLL','LLLLLLL','.LLLLL.','..LLL..'],
 MOONS[6]];
const rot90=B=>B.map((r,y)=>[...r].map((_,x)=>B[6-x][y]).join('')); // หมุนตามเข็ม 90° (ขวา → ล่าง)
const moonBmp=(n,k)=>{let B=(k%2?MOONSD:MOONS)[n];for(let i=0;i<k>>1;i++)B=rot90(B);return B};
const moonIdx=p=>{const q=p<.5?p:1-p,i=MPH.findIndex(t=>q<t);return i<0?MPH.length-1:i}; // q = .5 พอดี = เต็มดวง
function moonDisc(c,cx,cy,col){const M=MOON;if(!M.up)return;const n=moonIdx(M.p);if(!MOONS[n])return;const B=moonBmp(n,M.k),x0=Math.round(cx)-3,y0=Math.round(cy)-3,
 eh=col+Math.round(48*(1-M.lit)**2).toString(16).padStart(2,'0'); // แสงโลกชัดตอนเสี้ยวบาง หายไปตอนเกือบเต็มดวง
 B.forEach((r,y)=>[...r].forEach((ch,x)=>{if(ch==='.')return;c.fillStyle=ch==='L'?col:eh;c.fillRect(x0+x,y0+y,1,1)}))}
// ดาว + พระจันทร์ (ดาวที่จะชิดขอบดวงไม่วาด ไม่ให้เป็นปุ่มนูนข้างดวง) · ดวงกว้าง 7 px ทุกฉาก
function moonSky(c,stars,[mx,my],col,r=3.4){const show=MOON.up&&moonIdx(MOON.p)>0;stars.forEach(([x,y])=>{if(!show||Math.hypot(x+.5-Math.round(mx)-.5,y+.5-Math.round(my)-.5)>r+1.6)rect(c,x,y,1,1,col)});moonDisc(c,mx,my,col)}
const moonKey=ms=>{const M=moonAt(ms),n=moonIdx(M.p);return M.up&&n>0?n+'/'+M.k+':'+Math.round(M.ha*6)+':'+Math.round(M.lit*8):'-'}; // เปลี่ยนเมื่อเฟส/แสงโลกเปลี่ยน หรือทุก 10 นาที (ตำแหน่ง)
const ring=(c,cx,cy,a,b,col)=>{for(let t=0;t<6.29;t+=.6/Math.max(a,b))dot(c,cx+Math.cos(t)*a,cy+Math.sin(t)*b,col)}; // เส้นวงรีบาง 1 px
// ---- ต้นไม้ (v92 เจ้าของขอให้สมจริงขึ้น) · สุ่มแบบกำหนด seed ภาพจึงเหมือนเดิมทุกครั้ง ----
const rng=s=>()=>(s=s*16807%2147483647)/2147483647;
// พุ่มตัดแต่งทรงก้อนเมฆ: กอเล็กหลายกอเรียงเป็นโดมก้นแบน C = [เงาใต้กอ, เนื้อพุ่ม, แสงบนกอ, ปลายสว่าง] · ร่องเงาแตกลายระหว่างกอ
function clumpPad(c,cx,cy,w,h,C,seed){const R=rng(seed),n=Math.max(3,Math.round(w/2.5)),T=[];
 for(let i=0;i<n;i++){const u=i/(n-1)*2-1;T.push([cx+u*(w-2.2)+(R()-.5)*.8,cy-(1-u*u)*h*.5+(R()-.5)*.9,2+R()*.9+(1-Math.abs(u))*.8])}
 const B=[];for(let i=0;i<n-1;i++){const u=(i+.5)/(n-1)*2-1;B.push([cx+u*(w-3),cy+h*.28,1.7+R()*.6])}
 [...T,...B].forEach(([x,y,r])=>blob(c,x,y+.9,r,r*.75,C[0]));
 T.forEach(([x,y,r])=>blob(c,x,y-.2,r-.55,r*.75-.6,C[1]));
 T.forEach(([x,y,r])=>blob(c,x-.6,y-.9,r*.52,r*.3,C[2]));
 T.forEach(([x,y,r],i)=>{dot(c,x-1+(i&1),y-r*.6,C[3]);if(R()<.55)dot(c,x+.8,y+.5,C[0]);if(R()<.4)dot(c,x-r*.5,y+.2,C[0])})}
// เนื้อไม้ต่อเนื่อง (v110 เจ้าของบอกว่าลำต้นขาด): ลำต้นและกิ่งทุกเส้นปั๊มเป็นวงกลมเรียวตามทางลงหน้ากากเดียวกันก่อน แล้วค่อยลงสีทีละพิกเซล
// ขอบซ้ายรับแสง C[1] ขอบขวาเงา C[2] ข้างในสีเปลือก C[0] มีขีดลายเปลือกสุ่ม · กิ่งเส้นเดียวกว้าง 1 px ใช้สีเปลือก · S = [[จุด, กว้างโคน, กว้างปลาย], …]
function wood(c,S,C,seed){const R=rng(seed),M=new Uint8Array(SW*SH);let X0=SW,X1=0,Y0=SH,Y1=0;
 S.forEach(([P,w0,w1])=>{const L=[0];for(let i=1;i<P.length;i++)L.push(L[i-1]+Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]));const T=L[L.length-1]||1;
  for(let i=0;i<P.length-1;i++){const[ax,ay]=P[i],[bx,by]=P[i+1],n=Math.ceil(Math.hypot(bx-ax,by-ay)*4)||1;
   for(let j=0;j<=n;j++){const t=j/n,x=ax+(bx-ax)*t,y=ay+(by-ay)*t,r=Math.max(.72,(w0+(w1-w0)*(L[i]+(L[i+1]-L[i])*t)/T)/2);
    for(let yy=Math.floor(y-r);yy<=y+r;yy++)for(let xx=Math.floor(x-r);xx<=x+r;xx++)if(xx>=0&&yy>=0&&xx<SW&&yy<SH&&(xx+.5-x)**2+(yy+.5-y)**2<=r*r){M[yy*SW+xx]=1;if(xx<X0)X0=xx;if(xx>X1)X1=xx;if(yy<Y0)Y0=yy;if(yy>Y1)Y1=yy}}}});
 for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){const i=y*SW+x;if(!M[i])continue;const l=!M[i-1],r=!M[i+1];c.fillStyle=l&&r?C[0]:l?C[1]:r?C[2]:R()<.16?C[2]:C[0];c.fillRect(x,y,1,1)}}
// กิ่ง: เส้นหนา w ผ่านจุด P
const limb=(c,P,w,col)=>{for(let i=0;i<P.length-1;i++){const[xa,ya]=P[i],[xb,yb]=P[i+1],n=Math.ceil(Math.hypot(xb-xa,yb-ya)*2);for(let j=0;j<=n;j++)rect(c,Math.floor(xa+(xb-xa)*j/n),Math.floor(ya+(yb-ya)*j/n),1,w,col)}};
// ก้านโค้ง (เบซิเยร์กำลังสอง) จาก (x0,y0) ผ่านจุดคุม (qx,qy) ถึง (x1,y1)
const stem=(c,x0,y0,qx,qy,x1,y1,col)=>{for(let t=0;t<=1;t+=.03){const a=(1-t)*(1-t),b=2*(1-t)*t,d=t*t;dot(c,a*x0+b*qx+d*x1,a*y0+b*qy+d*y1,col)}};
// ใบมอนสเตอร่า: รูปหัวใจยาวตามเส้นกลางใบมุม a มีรอยแหว่งสองข้าง (ใบอ่อน slit = 0 ไม่แหว่ง) · C = [ด้านเงา, ด้านรับแสง, เส้นกลางใบ, ขอบใบ]
function monLeaf(c,cx,cy,rx,ry,a,C,slit=1){const ca=Math.cos(a),sa=Math.sin(a),M=Math.ceil(Math.max(rx,ry))+1;
 for(let y=Math.floor(cy-M);y<=cy+M;y++)for(let x=Math.floor(cx-M);x<=cx+M;x++){const dx=x+.5-cx,dy=y+.5-cy,u=dx*ca+dy*sa,v=-dx*sa+dy*ca,e=(u/rx)**2+(v/ry)**2,av=Math.abs(v);
  if(e>1||(u<-rx*.6&&av<ry*.3))continue;                                          // นอกใบ · รอยเว้าโคนใบ
  if(slit&&av>ry*.42&&u>-rx*.55&&((u+rx+(v>0?1.5:0))%3.1)<1)continue;              // รอยแหว่งข้างใบ ห่างกันราว 3 px
  const lit=v*(ca-sa*.4)<0;c.fillStyle=av<.55&&u>-rx*.5?C[2]:e>.62?(lit?C[0]:C[3]):lit?C[1]:C[0];c.fillRect(x,y,1,1)}}
// ฟ้ากลางแจ้ง: sky = ฟ้าด้านบน sky2 = แถบใกล้ขอบฟ้า · เมฆวาดแยกใน clouds() ให้ลอยได้
const sky=(c,k,y2,mz=[80,9,16,144,30])=>{rect(c,0,0,SW,y2,k.sky);rect(c,0,y2-16,SW,16,k.sky2);rect(c,0,y2-17,SW,1,k.sky2+'99');
 if(k.moon)moonSky(c,[[78,8],[104,20],[146,26],[90,30],[120,6],[40,14],[60,24],[20,30]],moonXY(...mz),k.moon)
 else blob(c,130,k.sunY||12,k.sunY?5:4,k.sunY?5:4,k.sun)};
// เมฆก้อน (คิวมูลัส · v95 เจ้าของขอให้ใหญ่และเหมือนจริง): ก้นแบน ยอดพองเป็นก้อนกลมหลายก้อน ก้อนกลางสูงสุด ด้านบนซ้ายรับแสง (cloud) ด้านล่างขวาและฐานเป็นเงา (cloud2)
// วาดครั้งเดียวต่อชุดสี/ขนาด/seed แล้วแคช
const clC={};
function cloudImg(k,w,h,seed){const id=[k.cloud,k.cloud2,w,h,seed].join();if(clC[id])return clC[id];const v=document.createElement('canvas');v.width=w;v.height=h;const c=v.getContext('2d'),R=rng(seed),L=[];
 const m=Math.max(3,Math.round(w/(h*.5)));for(let i=0;i<m;i++){const u=i/(m-1),pr=Math.sin(Math.PI*(.08+u*.84)),r=Math.min(h/1.7,h*(.22+.36*pr)*(.8+R()*.4));L.push([1+r*.8+(w-2-r*1.6)*u+(R()-.5)*1.6,h-r*.72,r])}
 L.slice(0,m).forEach(([x,y,r])=>{const rb=Math.min(r*(.45+R()*.2),(y-r*.55)/1.12-.3);if(rb>1.4&&R()<.85)L.push([x+(R()-.5)*r*.9,y-r*.55,rb])});                                                  // ก้อนพองเล็กบนยอด (ทรงดอกกะหล่ำ)
 const IN=(x,y,dx,dy,sh)=>L.some(([cx,cy,r])=>(x+.5-cx-dx)**2+((y+.5-cy-dy)*1.12)**2<=(r-sh)**2);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(IN(x,y,0,0,0)){c.fillStyle=y<h-Math.max(2,h*.18)&&IN(x,y,-1.1,-1.7,.9)?k.cloud:k.cloud2;c.fillRect(x,y,1,1)}
 return clC[id]=v}
// เมฆลอยช้าๆ จากซ้ายไปขวา (ก้อนใหญ่ใกล้กว่า ลอยเร็วกว่า ก้อนเล็กแบนอยู่ไกลใกล้ขอบฟ้า) · กลางคืนไม่มีเมฆ · [x, y บนสุด, กว้าง, สูง, ความเร็ว, seed]
const CLOUDS=[[50,1,52,18,1,3],[114,13,32,11,.7,5],[-10,6,36,12,.85,7],[150,26,18,6,.45,9]],cloudKey=A=>A.P?Math.floor(A.ms/2500):0;
function clouds(c,k,A){if(!k.cloud)return;const s=A.P?A.ms/2500:0;
 CLOUDS.forEach(([x0,y,w,h,z,sd])=>{const W=SW+w,x=((x0+w+s*z)%W+W)%W-w;c.drawImage(cloudImg(k,w,h,sd),Math.round(x),y)})}

// ===== ห้องอ่านหนังสือ (部屋): วอลเปเปอร์ลายจุด บอร์ดก๊อกโน้ต หน้าต่างมีม่านและวิวหลังคาบ้าน ชั้นหนังสือ โคมอันด้ง เบาะ · ฉากหน้า: กระถางต้นไม้
// ขยับ: นาฬิกาลูกตุ้ม แดดจากหน้าต่างบนพื้นเลื่อนตามชั่วโมง (กลางคืนเป็นแสงจันทร์จางๆ) นกกระจอกมาเกาะขอบหน้าต่างเป็นพักๆ
// ฟูจิลูกเล็กหลังเนินในบานล่างขวา (แผนที่เมือง: บ้านอยู่ใต้เมือง ฟูจิอยู่ไกลทางเหนือ) · ยอดตัดแบน หิมะยอดตามฤดู · จุด (100,30) ยังเป็นฟ้าเสมอ
function roomFuji(c,k){const sn={winter:3,spring:2,autumn:1}[k.season]||0;for(let y=26;y<34;y++){const hw=1.5+(y-26)*1.4+(y-26)**2*.15;for(let x=Math.ceil(121-hw);x<=Math.min(128,121+hw);x++)if(x>=113)dot(c,x,y,y-26<sn-(sn>1&&(x*5)%3===0&&y-26===sn-1?1:0)?k.fjs:k.fj)}}
function roomBg(c,k){
 rect(c,0,0,SW,SH,k.wall);for(let y=3;y<50;y+=6)for(let x=y%12===3?1:4;x<SW;x+=6)rect(c,x,y,1,1,k.wall2);  // วอลเปเปอร์ลายจุดจางๆ
 rect(c,0,52,SW,17,k.wall2);rect(c,0,51,SW,1,k.trim);rect(c,0,69,SW,2,k.trim);                             // ไม้บัวกลาง บัวเชิงผนัง
 rect(c,0,71,SW,SH-71,k.floor);[76,81,86].forEach(y=>rect(c,0,y,SW,1,k.floor2));                            // พื้นไม้เป็นแผ่นเหลื่อมกัน
 [[71,[26,74,122]],[76,[6,50,98,146]],[81,[30,78,126]],[86,[12,60,108,154]]].forEach(([y,xs])=>xs.forEach(x=>rect(c,x,y,1,5,k.seam)));
 // บอร์ดก๊อก: โน้ตกระดาษ กระดาษโน้ตเหลือง รูปถ่ายวิว (เส้นแทนตัวหนังสือ)
 rect(c,54,12,28,21,k.frame2);rect(c,55,13,26,19,k.cork);for(let y=14;y<32;y+=3)for(let x=56+(y%2)*2;x<81;x+=4)rect(c,x,y,1,1,k.cork2);
 [[57,15,8,7,k.note],[67,14,6,6,k.note2],[74,16,6,8,k.note3],[57,24,7,6,k.note2]].forEach(([x,y,w,h,col],i)=>{rect(c,x+1,y+1,w,h,k.cork2);rect(c,x,y,w,h,col);
  for(let ly=y+2;ly<y+h-1;ly+=2)rect(c,x+1,ly,w-2-(ly%4?1:0),1,k.ink);rect(c,x+(w>>1),y,1,1,i%2?k.b1:k.b2)});
 rect(c,67,23,10,9,k.cork2);rect(c,66,22,10,9,k.note);rect(c,67,23,8,5,k.sky);rect(c,67,27,8,2,k.leaf);blob(c,72.5,25,1.2,1.2,k.cloud||k.moon);rect(c,70,22,1,1,k.b1); // รูปถ่าย
 // หน้าต่าง + วิวเนินกับหลังคาบ้านไกลๆ (กลางคืนบ้านเปิดไฟ)
 rect(c,92,8,40,32,k.frame2);rect(c,93,9,38,30,k.frame);rect(c,95,11,34,26,k.sky);rect(c,95,11,34,7,k.sky2);
 if(k.moon)moonSky(c,[[99,14],[104,24],[117,27],[100,20],[126,26]],moonXY(121,17,116,128,16),k.moon) // อยู่ในบานขวาตลอด (v105 ไม่ให้หายหลังเสากลางนานๆ) สูงสุดกลางบานบน ขึ้น-ตกหลังเนิน
 else if(k.sunY){blob(c,106,k.sunY-4,4.5,4.5,k.sun);c.drawImage(cloudImg(k,12,5,4),114,13)} // รุ่งเช้า/พลบค่ำ: พระอาทิตย์ต่ำใกล้หลังคา
 else{c.drawImage(cloudImg(k,13,6,4),96,12);c.drawImage(cloudImg(k,10,4,6),117,16)}
 roomFuji(c,k);poly(c,[[95,34],[103,32],[110,33.5],[117,31.5],[124,33],[129,32],[129,37],[95,37]],k.hill);
 if(k.season==='spring'||k.season==='autumn'){const C=k.season==='spring'?(k.lwin?['#8a5a6c','#a86f85']:['#e9a5bb','#f6cad7']):(k.lwin?['#6e3a2c','#8a4d36']:['#d9774f','#eda36a']);rect(c,109,31,1,3,k.roof);blob(c,109.5,30.4,3,2.2,C[0]);blob(c,109,29.8,2,1.4,C[1])} // ต้นซากุระ/ต้นไม้ใบแดงบนเนิน
 [[99,33,6],[118,31,7]].forEach(([x,y,w])=>{rect(c,x,y+2,w,35-y,k.house);poly(c,[[x-1,y+2.5],[x+w/2,y-.5],[x+w+1,y+2.5]],k.roof);if(k.lwin)rect(c,x+2,y+3,1,1,k.lwin)}); // หนาว: หลังคาและเนินขาวด้วยหิมะ (สีตามฤดู)
 [[96,21],[97,20],[98,19],[99,18],[100,17],[98,21],[99,20],[100,19],[101,18],[124,36],[125,35],[126,34],[127,33]].forEach(([x,y])=>dot(c,x,y,k.glare)); // แสงสะท้อนกระจก
 rect(c,95,11,34,1,k.fshd);rect(c,95,11,1,26,k.fshd);rect(c,113,11,1,26,k.fshd);rect(c,95,25,34,1,k.fshd);                                             // เงาขอบกรอบบนกระจก
 rect(c,111,11,2,26,k.frame);rect(c,95,23,34,2,k.frame);rect(c,90,40,44,2,k.frame2);rect(c,90,40,44,1,k.frame);rect(c,92,8,40,1,k.frame);
 // ม่านรวบสองข้าง
 rect(c,82,5,60,1,k.frame2);blob(c,82,5.5,1.5,1.5,k.frame2);blob(c,142,5.5,1.5,1.5,k.frame2);dot(c,81,5,k.frame);dot(c,141,5,k.frame);                  // ราวม่าน ปลายราวกลม
 [[84,1],[133,-1]].forEach(([x,d])=>{const F=[k.cur2,k.cur,k.curH,k.cur,k.cur2,k.curH,k.cur];                                                         // จีบผ้าสามเฉด รวบเข้าหาผนัง ชายผ้าบานออก
  for(let y=6;y<=41;y++){const w=y<26?6:y<28?4:Math.min(7,4+((y-28)*.3|0)),x0=d>0?x:x+6-w;for(let i=0;i<w;i++)dot(c,x0+i,y,y===41?k.cur2:F[(i+(y<26?0:y<28?2:1))%7])}
  rect(c,d>0?x:x+2,26,5,2,k.cur3);dot(c,d>0?x+5:x+1,27,k.cur3);for(let i=0;i<6;i+=2)dot(c,x+i,6,k.cur2)});
 // ชั้นหนังสือใต้หน้าต่าง (ห้องอ่านหนังสือ): หนังสือสีพาสเทล เล่มเอียง กองหนังสือนอน ข้างบนมีกระถางเล็ก หนังสือซ้อน และแมวกวัก
 rect(c,87,47,48,2,k.frame2);rect(c,87,47,48,1,k.frame);rect(c,88,49,46,22,k.frame2);rect(c,90,49,20,9,k.shin);rect(c,112,49,20,9,k.shin);rect(c,90,61,20,8,k.shin);rect(c,112,61,20,8,k.shin);
 rect(c,88,58,46,3,k.frame2);rect(c,88,58,46,1,k.frame);rect(c,88,69,46,2,k.frame);
 const B=[k.b1,k.b2,k.b3,k.b4,k.b5],book=(x,yb,w,h,i)=>{rect(c,x,yb-h+1,w,h,B[i%5]);rect(c,x,yb-h+2,w,1,k.spine);if(h>6)rect(c,x,yb-2,w,1,k.spine)};
 [[90,2,8],[92,3,7],[95,2,9],[97,2,8],[99,3,6],[103,2,8]].forEach(([x,w,h],i)=>book(x,57,w,h,i));poly(c,[[105,57],[107,57],[110,51],[108,50]],k.b4); // แถวบนซ้าย + เล่มเอียง
 [[112,3,9],[115,2,8],[117,2,7],[119,3,9],[122,2,6]].forEach(([x,w,h],i)=>book(x,57,w,h,i+2));rect(c,126,53,5,5,k.note);rect(c,126,53,5,1,k.b1);   // แถวบนขวา + กล่องเล็ก
 [[91,66,15,2,0],[92,64,13,2,3],[91,62,14,2,1]].forEach(([x,y,w,h,i])=>{rect(c,x,y,w,h,B[i]);rect(c,x+w-1,y,1,h,k.spine)});                       // กองหนังสือนอน
 [[112,2,7],[114,3,8],[117,2,6],[119,2,8],[121,3,7],[124,2,8],[126,3,6],[129,2,7]].forEach(([x,w,h],i)=>book(x,68,w,h,i+1));
 // ต้นพิเลีย (ใบกลมเหมือนเหรียญ ก้านติดกลางใบ) ในกระถางเซรามิกขาว ตรงมุมหน้าต่าง
 [[90.5,39],[93.5,35.5],[96.5,37.5],[89.5,41.5],[97.5,41],[92,37.5],[95,40]].forEach(([x,y])=>stem(c,93.5,42,93.5+(x-93.5)*.3,y+2,x,y,k.leaf2));
 [[92,37.5],[95,40],[90.5,39],[93.5,35.5],[96.5,37.5],[89.5,41.5],[97.5,41]].forEach(([x,y],i)=>{blob(c,x,y,1.7,1.35,i<2?k.leaf2:k.leaf);dot(c,x-1,y-1,k.leaf3);dot(c,x,y,i<2?k.leaf4:k.leaf2)});
 rect(c,91,43,6,4,k.pilP);rect(c,90,42,8,1,k.pilP);rect(c,96,43,1,4,k.pilP2);rect(c,90,42,8,1,k.pilP2);dot(c,91,43,k.cup||k.note);
 rect(c,102,45,10,2,k.b2);rect(c,103,43,9,2,k.b3);rect(c,111,45,1,2,k.spine);rect(c,111,43,1,2,k.spine);                                            // หนังสือซ้อน
 blob(c,125.5,44.4,2.6,2.4,k.mk);blob(c,125.5,40.8,2.3,2,k.mk);rect(c,123,38,1,2,k.mk);rect(c,127,38,1,2,k.mk);rect(c,128,38,1,3,k.mk);              // แมวกวัก
 dot(c,124,40,k.hand);dot(c,126,40,k.hand);rect(c,124,42,4,1,k.b1);dot(c,125,43,k.bob);dot(c,123,39,k.b1);dot(c,127,39,k.b1);
 roomLamp(c,k);
 blob(c,38,84.4,24,4.6,k.cush2);blob(c,38,83.4,23.4,4,k.cush);blob(c,33,81.8,12,1.3,k.cush3);[[14,83],[61,83]].forEach(([x,y])=>rect(c,x,y,1,2,k.cush2)); // เบาะนอน (ซาบุตง) กว้างพอให้ท่าขดนอนอยู่บนเบาะ
 blob(c,111,71.6,24,1.2,k.shade);blob(c,147,88.6,10,1.6,k.shade);if(boxOn())boxBack(c,k)}
// โคมกระดาษตั้งพื้น (อันด้ง) ข้างเบาะ (เจ้าของขอ 2026-11-19 · ของตกแต่งชิ้นแรก) ไฟติดตอนรุ่งเช้า พลบค่ำ และกลางคืน (k.lit)
// แสงบนผนัง/พื้นวาดในฉากหลัง ส่วนแสงที่ตกบนตัวแมววาดทับทีหลังใน roomLight()
function roomLamp(c,k){const L=k.lit;if(L){blob(c,72,62,30,22,'rgba(255,200,120,.10)');blob(c,72,62,19,14,'rgba(255,205,130,.12)');blob(c,72,79,26,4,'rgba(255,200,120,.16)')}
 rect(c,66,50,13,2,k.frame2);rect(c,67,52,11,19,k.frame2);rect(c,68,53,9,17,L||k.paper);if(L)rect(c,69,55,7,13,'#fff2c8'); // โครงไม้ + กระดาษ (ติดไฟ = กลางสว่างกว่า)
 rect(c,72,53,1,17,k.frame);rect(c,68,61,9,1,k.frame);rect(c,67,71,1,6,k.frame2);rect(c,77,71,1,6,k.frame2);rect(c,66,76,13,1,k.frame2)} // ตาราง + ขา
// แสงโคมตกบนทุกอย่างรวมตัวแมว (บวกแสงแบบ lighter) ใช้เมื่อโคมติด
function roomLight(c,k){if(!k.lit)return;c.save();c.globalCompositeOperation='lighter';blob(c,72,64,24,20,'rgba(255,170,90,.07)');blob(c,72,64,14,12,'rgba(255,170,90,.06)');c.restore()}
// ใบไทรใบสัก: รูปไข่กลับ (ปลายใบกว้างกว่าโคน) ตามมุม a จากกิ่งออกไป · C = [ด้านเงา, ด้านรับแสง, เส้นกลางใบ, ขอบใบด้านเงา]
const figLeaf=(c,cx,cy,a,L,W,C)=>{const ca=Math.cos(a),sa=Math.sin(a),M=Math.ceil(L/2)+1;for(let y=Math.floor(cy-M);y<=cy+M;y++)for(let x=Math.floor(cx-M);x<=cx+M;x++){
 const dx=x+.5-cx,dy=y+.5-cy,u=dx*ca+dy*sa,v=-dx*sa+dy*ca,e=(u/(L/2))**2+(v/(W/2*(u>0?1:.72)))**2;if(e>1)continue;const lit=v*ca-v*sa*.3<0;
 c.fillStyle=Math.abs(v)<.5&&L>=4.4&&Math.abs(u)<L*.36?C[2]:e>.68&&!lit?C[3]:lit?C[1]:C[0];c.fillRect(x,y,1,1)}};
function roomFg(c,k){
 // ต้นไทรใบสัก: ลำต้นตรงแตกกิ่งสองข้าง (เจ้าของขอ 2026-11-18) ใบใหญ่รูปไข่กลับมีเส้นกลางใบ ใบหลังเข้ม ใบหน้าสว่าง (v95 เจ้าของขอให้สมจริงขึ้น)
 rect(c,146,48,2,24,k.trunk);rect(c,146,48,1,24,k.trunk2);rect(c,145,70,4,2,k.trunk);limb(c,[[146,64],[143,60],[140,56]],1,k.trunk);limb(c,[[148,62],[151,58],[154,54]],1,k.trunk);
 const BK=[k.leaf4,k.leaf2,k.leaf2,k.leaf4],FR=[k.leaf2,k.leaf,k.leaf3,k.leaf4];
 [[143.5,43,-2.3,5,3.2],[150.5,43,-.8,5,3.2],[141,51,-1.9,4.6,3],[153,49.5,-1.2,4.6,3],[146,47,-2.8,4.6,2.8],[149,47.5,-.3,4.6,2.8],[144.5,63,2.7,4,2.6]].forEach(([x,y,a,L,W])=>figLeaf(c,x,y,a,L,W,BK));
 [[147,40.5,-1.57,5.4,3.4],[139.5,54,-2.6,5.2,3.2],[155,52,-.4,5.2,3.2],[138.5,58.5,2.9,4.4,2.8],[156,56.5,.5,4.4,2.8],[147.5,45.5,-1.65,4.4,3],[142,57.5,2.4,4,2.6],[151.5,55.5,.9,4,2.6],[150,65,.4,4,2.6]].forEach(([x,y,a,L,W])=>figLeaf(c,x,y,a,L,W,FR));
 for(let y=72;y<=88;y++){const h=y<75?8:7-(y-75)*.2;rect(c,Math.round(147-h),y,Math.round(h*2),1,y<75?k.pot3:k.pot)}rect(c,141,76,1,10,k.pot3);rect(c,152,77,2,10,k.pot2);rect(c,141,72,12,1,k.soil);rect(c,139,74,16,1,k.pot2); // กระถาง ดิน ขอบปาก
 if(boxOn())boxFront(c,k);
}
// กล่องกระดาษ (v118): ฝาหลังกับด้านในอยู่ฉากหลัง (หลังแมว) · ด้านหน้า ฝาข้าง เทปกาว อยู่ฉากหน้า (บังตัวแมวตอนนั่งในกล่อง เห็นแค่หัว)
function boxBack(c,k){const{x0,x1,top}=BOX;rect(c,x0-1,86,x1-x0+3,1,k.shade);poly(c,[[x0+1,top-1],[x0+3,top-7],[x1-3,top-7],[x1-1,top-1]],k.box3);rect(c,x0+3,top-7,x1-x0-6,1,k.box);
 rect(c,x0+1,top-2,x1-x0-2,2,k.box4);rect(c,x0+1,top-2,1,2,k.box2)}
function boxFront(c,k){const{x0,x1,top}=BOX;rect(c,x0,top,x1-x0,86-top,k.box);rect(c,x0,top,x1-x0,1,k.box3);rect(c,x1-2,top+1,2,85-top,k.box2);rect(c,x0,85,x1-x0,1,k.box2);
 rect(c,Math.round((x0+x1)/2)-1,top,3,5,k.tape);rect(c,x0+3,top+7,5,1,k.box2);rect(c,x0+3,top+9,3,1,k.box2); // เทปกาว · ลายพิมพ์ข้างกล่อง (เส้น ไม่มีตัวอักษร)
 poly(c,[[x0,top],[x0-6,top-3],[x0-6,top-1],[x0,top+3]],k.box2);poly(c,[[x1,top],[x1+6,top-3],[x1+6,top-1],[x1,top+3]],k.box3)} // ฝาข้างพับออก
// นาฬิกาลูกตุ้มติดผนังในห้อง: เข็มชั่วโมง/นาทีตามเวลาจริงของเครื่อง ลูกตุ้มแกว่งรอบละ 2 วินาที (ปิดแอนิเมชัน = ลูกตุ้มนิ่ง)
// วาดทับฉากหลังทุกครั้งที่วาดใหม่ (ฉากหลังแคชไว้ จึงวาดนาฬิกาแยก) หน้าปัดกลางพิกเซล (39,17)
const handAt=(c,cx,cy,a,len,col,w=0)=>{c.fillStyle=col;for(let t=0;t<=len;t+=.25)for(const o of w?[-.45,.45]:[0])c.fillRect(Math.floor(cx+Math.sin(a)*t+Math.cos(a)*o),Math.floor(cy-Math.cos(a)*t+Math.sin(a)*o),1,1)}; // w = เข็มหนา (ชั่วโมง)
const hand=(c,a,len,col,w=0)=>handAt(c,39.5,17.5,a,len,col,w);
function roomClock(c,k,d,sw){rect(c,37,4,5,2,k.frame2);rect(c,30,6,19,2,k.frame2);rect(c,31,8,17,35,k.frame2);rect(c,32,8,15,34,k.frame);rect(c,31,42,17,1,k.frame2);
 blob(c,39.5,17.5,6.6,6.6,k.frame2);blob(c,39.5,17.5,5.7,5.7,k.clk);[[39,12],[44,17],[39,22],[34,17]].forEach(([x,y])=>rect(c,x,y,1,1,k.frame2));
 const m=d.getMinutes(),h=d.getHours()%12+m/60;hand(c,h/12*2*Math.PI,3,k.hand,1);hand(c,m/60*2*Math.PI,4.8,k.hand);rect(c,39,17,1,1,k.hand);
 rect(c,35,27,9,13,k.glass);const a=sw*.32,ex=39.5+Math.sin(a)*8,ey=27+Math.cos(a)*8;c.fillStyle=k.frame2;for(let t=0;t<=8;t+=.5)c.fillRect(Math.floor(39.5+Math.sin(a)*t),Math.floor(27+Math.cos(a)*t),1,1);blob(c,ex,ey,1.7,1.7,k.bob)}
// แดดจากหน้าต่างตกบนพื้นเป็นสี่ช่องตามกรอบหน้าต่าง เอียงตามชั่วโมง (เช้าเอียงซ้าย บ่ายเอียงขวา) · รุ่งเช้า/พลบค่ำเป็นแสงส้มยาว · กลางคืนแสงจันทร์จางๆ
// (รายงานพฤติกรรมข้อ 9 "แสงแดดตามนาฬิกา": ภาพทำแล้ว v92 ส่วนแมวไปนอนอาบแดดยังไม่ทำ · ตำแหน่งแดด sunX())
const sunSkew=(td,d)=>td==='dawn'?-17:td==='dusk'?17:td==='night'?-5:clamp((d.getHours()+d.getMinutes()/60-12)*2.6,-14,14);
// กลางคืน = แสงจันทร์ (v105 เจ้าของขอ): สว่างตามเฟส (เต็มดวงชัดสุด เสี้ยวจางมาก) เอียงตามตำแหน่งดวง · พระจันทร์ยังไม่ขึ้น/ตกแล้ว/ดับ = ไม่มีแสงบนพื้น
const moonGlow=ms=>{const M=moonAt(ms);return M.up&&moonIdx(M.p)?{a:clamp(M.ha*2.6,-14,14),al:+(.02+.11*M.lit).toFixed(3)}:null}; // ความเอียง + ความทึบแสงจันทร์บนพื้น (null = ไม่มีแสง)
function roomSun(c,k,A){let a=sunSkew(A.td,A.d),col=A.td==='day'?'rgba(255,250,222,.34)':'rgba(255,196,140,.26)';
 if(A.td==='night'){const g=moonGlow(A.ms);if(!g)return;a=g.a;col='rgba(190,205,255,'+g.al+')'}
 const TL=[96+a*.15,72],TR=[128+a*.15,72],BL=[93+a,89],BR=[131+a,89],P=(u,v)=>[TL[0]+(TR[0]-TL[0])*u+(BL[0]-TL[0])*v+(BR[0]-BL[0]-TR[0]+TL[0])*u*v,TL[1]+(BL[1]-TL[1])*v];
 [[0,.46,0,.42],[.54,1,0,.42],[0,.46,.54,1],[.54,1,.54,1]].forEach(([u0,u1,v0,v1])=>poly(c,[P(u0,v0),P(u1,v0),P(u1,v1),P(u0,v1)],col))}
// ชิมะเอนางะ (นกติ๊ดหางยาวฮอกไกโด · v95 เจ้าของขอ): ตัวกลมฟูสีขาว ตาดำเม็ดเล็ก ปากจิ๋ว แถบดำกับขนชมพูน้ำตาลข้างปีก หางดำยาว
// มาเกาะขอบหน้าต่างด้านนอก 21 วิ ทุก 170 วิ (กลางวัน รุ่งเช้า พลบค่ำ): บินเข้า นั่ง พองขน เอียงคอ กระโดดหนึ่งที แล้วบินออก (ไว้ทำท่าแมวมองนกต่อ)
const BIRD_T=170000,BIRD_ON=21000,birdAt=A=>{if(!A.P||A.td==='night')return null;const o=A.ms%BIRD_T;return o<BIRD_ON?o:null};
const birdPose=o=>{if(o<600){const p=o/600;return{x:137-15*p,y:21+10.5*p,fly:1,up:(o/70|0)%2,dir:-1}}if(o>BIRD_ON-600){const p=(o-BIRD_ON+600)/600;return{x:118+20*p,y:31.5-11*p,fly:1,up:(o/70|0)%2,dir:1}}
 return{x:o>9000?118:122,y:31.5,fly:0,tilt:o%4200>3000?(o%8400>4200?1:-1):0,puff:o%5300<700?1:0}};
function roomBird(c,k,A){const o=birdAt(A);if(o==null)return;const B=birdPose(o),cx=Math.round(B.x),cy=Math.round(B.y),r=4.4+(B.puff?.5:0),ry=r*.84,bx=cx+.5;
 c.save();c.beginPath();c.rect(113,11,16,12);c.rect(113,25,16,12);c.clip();                                                                       // อยู่นอกกระจกบานขวา ไม่ทับกรอบกลาง
 const td=B.fly?-B.dir:1;for(let i=0;i<6;i++)dot(c,cx+td*(4+i),cy+2+i*(B.fly?.15:.45),k.bird4);                                                  // หางดำยาว
 blob(c,bx,cy+.3,r,ry,k.bird2);blob(c,bx-.5,cy-.4,r-.6,ry-.7,k.bird);                                                                            // ขนฟูกลม เงาจางด้านล่างขวา
 if(B.fly){const wy=B.up?cy-3:cy+1;[-1,1].forEach(s=>{rect(c,s<0?cx-6:cx+5,wy,2,2,k.bird4);dot(c,s<0?cx-5:cx+5,wy+(B.up?2:-1),k.bird6)})}
 else{const sd=td>0?1:-1;rect(c,cx+sd*4,cy+1,1,2,k.bird4);dot(c,cx+sd*3,cy+2,k.bird6);dot(c,cx+sd*3,cy+3,k.bird6);dot(c,cx-1,cy+Math.ceil(ry)+.3,k.bird4);dot(c,cx+1,cy+Math.ceil(ry)+.3,k.bird4)} // ปีกดำกับขนชมพูด้านหลัง ขาเกาะ
 const fx=cx+(B.tilt||0);dot(c,fx-2,cy-1,k.eye);dot(c,fx+2,cy-1,k.eye);dot(c,fx,cy,k.eye);c.restore()}                                            // ตาเม็ดเล็กห่างกัน ปากจิ๋วตรงกลาง
const roomLive=(c,k,A)=>{const se=season(A.ms);if(se==='winter'||se==='spring')fallIn(c,k,A,se,[95,8,34,30],se==='winter'?13:4);roomSun(c,k,A);roomBird(c,k,A);roomClock(c,k,A.d,A.P?Math.round(Math.sin(A.t/1000*Math.PI)*3)/3:0)};
const roomTick=A=>{const o=birdAt(A),se=season(A.ms);return(A.P&&(se==='winter'||se==='spring')&&falling(se,A.ms)?(A.ms/120|0)+'|':'')+A.d.getHours()*60+A.d.getMinutes()+'|'+(A.P?Math.round(Math.sin(A.t/1000*Math.PI)*3)/3:0)+'|'+(o==null?'':(B=>B.fly?'f'+(o/35|0):B.x+'|'+B.tilt+'|'+B.puff)(birdPose(o)))};

// ===== สวนญี่ปุ่น (庭): ภูเขาไกลยอดหิมะ แนวไม้หลังรั้ว เมเปิลแดง รั้วไม้ไผ่ผูกเชือก สนาม ทางกรวดคราด หินกลางวงคราด โคมหิน ต้นสน กระบอกไม้ไผ่ตอกหิน (ชิชิโอโดชิ) · ฉากหน้า: พุ่มอาซาเลีย
// ขยับ: เมฆลอย กระบอกไม้ไผ่รับน้ำแล้วกระดกเทน้ำ ตีหินดังป๊อก ทุก 7 วินาที ผีเสื้อบินตอนกลางวัน หิ่งห้อยกะพริบตอนกลางคืน
const GCOL={light:{sky:'#cfe9f7',sky2:'#e6f4fb',sun:'#ffd987',cloud:'#ffffff',cloud2:'#d5e2ee',mtn:'#b7d1c6',mtn2:'#a3c2b6',snow:'#f4f8fa',fuji:'#a9bfd6',fuji2:'#93a9c4',far:'#97bc9f',fence:'#d2b07a',fence2:'#ad8a55',rope:'#7d5f3a',grass:'#b4d68f',grass2:'#9cc579',
  gravel:'#efe8da',gravel2:'#dcd1bc',stone:'#c9c3b8',stone2:'#aaa294',stone3:'#e2ddd4',moss:'#9cbf72',lan:'#c2bbaf',lan2:'#9e9688',lwin:'#f6e7c0',glow:null,trunk:'#8a6a4a',
  leaf:'#86b96f',leaf2:'#65985a',leaf3:'#a8d48f',mp0:'#9c3a2e',mp1:'#e8735a',mp2:'#c9533f',mp3:'#f8ae80',pn1:'#3d6b4a',pn2:'#56895a',pn3:'#78a968',pn4:'#a2cb86',bark:'#7a5a40',bark2:'#9b7a5a',bark3:'#57402e',flower:'#f2a0b4',flower2:'#fcd3de',flower3:'#d97b93',az0:'#4f7f47',az1:'#64995a',az2:'#82b86c',az3:'#a9d48c',bam:'#a9c46a',bam2:'#7f9c48',bam3:'#cfe0a0',post:'#8a6a4a',water:'#a6d6ea',water2:'#e6f6fc',
  bfly:'#fffaf0',bfly2:'#f2d36b',ff:null,line:'#5f6e4a',shade:'rgba(70,80,50,.16)',moon:null},
 dark:{sky:'#1e2b47',sky2:'#273860',moon:'#f4e4a6',mtn:'#2f3f4a',mtn2:'#28363f',snow:'#7f8ea4',fuji:'#33425a',fuji2:'#2b384d',far:'#24352f',fence:'#6e5a40',fence2:'#57462f',rope:'#3e3122',grass:'#3f5a3a',grass2:'#354d31',
  gravel:'#4c4741',gravel2:'#403b36',stone:'#625d57',stone2:'#4c4843',stone3:'#736e67',moss:'#4f6a40',lan:'#5d5952',lan2:'#4a4741',lwin:'#f6d27a',glow:'rgba(246,210,122,.16)',trunk:'#5a4636',
  leaf:'#5f8c52',leaf2:'#4a7040',leaf3:'#79a868',mp0:'#55241f',mp1:'#93473a',mp2:'#76382e',mp3:'#b0644c',pn1:'#21382a',pn2:'#2f4f37',pn3:'#426849',pn4:'#5a855a',bark:'#4a3a2c',bark2:'#5e4a38',bark3:'#30251c',flower:'#b8738a',flower2:'#d79bae',flower3:'#91566a',az0:'#253b25',az1:'#34512f',az2:'#466c3e',az3:'#5f8c54',bam:'#62773f',bam2:'#4b5c30',bam3:'#7d9455',post:'#5a4636',water:'#3c5d74',water2:'#6d90a8',
  ff:'#eaf7a0',line:'#a9b893',shade:'rgba(0,0,0,.3)'}};
function gardenFar(c,k){sky(c,k,52)}
// ภูเขาอยู่หน้าเมฆ (เมฆลอยหลังยอดเขา)
// ภูเขาฟูจิ (แผนที่เมือง js/town.js: สวนอยู่ฝั่งเหนือของเมือง หันไปทางฟูจิ): กรวยกว้างสมมาตร ยอดตัดแบน เชิงเขาเว้าบานออก · ซีกซ้ายรับแสง ซีกขวาเงา รอยต่อเป็นจุดสลับ (ไม่แบ่งครึ่งแข็ง)
// หิมะตามฤดู: ร้อนไม่มี ใบไม้ร่วงหิมะแรกที่ยอด ใบไม้ผลิมาก หนาวลงถึงไหล่เขา · ขอบหิมะเป็นริ้วลงตามร่องเขา ซีกเงาใช้สี cloud2 · เนินเตี้ยสองข้างกับแนวเขาหน้าเหมือนเดิม
const FJ={x:60,top:19,sh:{summer:0,autumn:3.5,spring:8,winter:13}},BAY4=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
function gardenMid(c,k){const se=k.season,sh=FJ.sh[se]||0;
 poly(c,[[96,52],[112,41],[128,44],[146,37],[160,40],[160,52]],k.mtn);
 for(let y=FJ.top;y<52;y++){const hw=4+(y-FJ.top)*1.02+(y-FJ.top)**2*.03;for(let x=Math.max(0,Math.ceil(FJ.x-hw));x<=Math.min(SW-1,FJ.x+hw);x++){const s=(x+.5-FJ.x)/hw,b=(BAY4[y&3][x&3]+.5)/16,shd=s>.12+(b-.5)*.5;
  const sny=FJ.top+sh*(1-.22*Math.abs(s))+(sh?sh*.5*Math.max(0,Math.sin(s*12+1.1))**3*(1-Math.abs(s)*.5)+((x*7)%3-1)*.5:-9);
  dot(c,x,y,y<sny-.5||(y<sny+.5&&b<.5)?(shd?k.cloud2:k.snow):shd?k.fuji2:k.fuji)}}
 if(!sh)rect(c,FJ.x-3,FJ.top,7,1,k.fuji2);
 poly(c,[[0,44],[12,40],[26,43],[38,48],[0,52]],k.mtn);
 poly(c,[[0,50],[30,42],[60,49],[96,43],[132,50],[160,45],[160,52],[0,52]],k.mtn2)}
function gardenBg(c,k){
 const se=k.season,wi=se==='winter',FAR=[[40,46,7,3.5],[52,45,6,4],[64,46.5,7,3],[80,45.5,6,3.5],[92,46,7,3],[146,46,8,4],[158,45,6,4]];
 FAR.forEach(([x,y,a,b])=>blob(c,x,y,a,b,k.far));if(wi)FAR.forEach(([x,y,a,b])=>blob(c,x-.5,y-b*.55,a*.75,1.2,k.sn));                                   // แนวไม้หลังรั้ว (หนาว: หิมะบนยอด)
 // เมเปิลหลังรั้ว: ลำต้นเรียวแตกกิ่งเป็นง่าม ใบเป็นกอโปร่งหลายชั้น · สีใบตามฤดู (ซากุระชมพู เขียว แดง) หนาวเป็นกิ่งโล่งมีหิมะเกาะ
 const MB=[k.bark,k.bark2,k.bark3],MP=[k.mp0,k.mp2,k.mp1,k.mp3];
 // ลำต้นกับกิ่งหลักวาดเป็นเนื้อเดียว กิ่งยื่นไปถึงใต้กอใบทุกกอ (v110 เจ้าของบอกว่าลำต้นขาด: เดิมกิ่ง 1 px ถูกกอใบบังจนกอใบดูลอย)
 const MW=[[[[16,47],[15,42],[17,37],[16,31],[16,26]],3.4,1.8],[[[15,42],[11,39],[7,35]],2.2,1.3],[[[17,37],[21,34],[25,30]],2.1,1.3],[[[16,40],[23,39],[30,37]],2,1.3],[[[16,34],[11,33],[7,32]],1.7,1.2],[[[16,31],[20,29],[23,27]],1.5,1.1]];
 if(wi)MW.push(...[[[16,26],[15,23]],[[16,30],[11,27],[8,25]],[[17,29],[22,26],[24,24]],[[7,35],[4,32]],[[7,35],[6,31]],[[25,30],[27,27]],[[25,30],[29,29]],[[30,37],[32,34]],[[11,39],[9,42]],[[21,34],[20,31]],[[7,32],[4,30]]].map(P=>[P,1.4,1]));  // หนาว: กิ่งฝอยปลายกิ่ง
 wood(c,MW,MB,7);
 if(wi)[[8,34],[12,38],[19,33],[22,32],[22,38],[26,37],[15,25],[10,26],[21,25],[5,31]].forEach(([x,y])=>rect(c,x,y,2,1,k.sn));                            // หิมะเกาะบนกิ่ง
 else [[16,27,7,3,3],[6,33,5,2.6,5],[25,29,5,2.6,9],[10,39,6,2.8,11],[22,35,6,3,13],[30,38,4,2.2,17]].forEach(([x,y,w,h,sd])=>clumpPad(c,x,y,w,h,MP,sd));
 rect(c,0,47,SW,15,k.fence);for(let x=1;x<SW;x+=4)rect(c,x,47,1,15,k.fence2);rect(c,0,46,SW,1,k.fence2);rect(c,0,50,SW,1,k.fence2);rect(c,0,57,SW,1,k.fence2); // รั้วไม้ไผ่
 for(let x=10;x<SW;x+=20){rect(c,x,49,2,3,k.rope);rect(c,x,56,2,3,k.rope)}                                                                                // ปมเชือกผูกรั้ว
 if(wi){rect(c,0,45,SW,1,k.sn);rect(c,0,46,SW,1,k.sn2)}                                                                                                   // หนาว: หิมะบนสันรั้ว
 rect(c,0,62,SW,10,k.grass);rect(c,0,62,SW,1,k.grass2);[[6,64],[22,67],[48,63],[70,66],[88,64],[118,67],[136,63],[152,66]].forEach(([x,y])=>{rect(c,x,y,1,2,k.grass2);rect(c,x+2,y+1,1,1,k.grass2)});
 if(wi)[[30,66,9,2.4],[62,68,12,2.6],[94,65,7,2],[140,67,10,2.4],[8,70,6,1.6]].forEach(([x,y,a,b])=>{blob(c,x,y+.4,a,b,k.sn2);blob(c,x,y,a-.8,b-.6,k.sn)}); // หย่อมหิมะบนสนาม
 if(se==='autumn'||se==='spring'){const R=rng(se==='autumn'?71:73),L=se==='autumn'?[k.mp1,k.mp2,k.mp3]:[k.mp1,k.mp3];for(let i=0;i<se.length*5;i++){const x=(R()*R()*92)|0,y=63+((R()*25)|0);if(y<72||x<60)dot(c,x,y,L[i%L.length])}} // ใบแดง/กลีบซากุระร่วงบนพื้น (หนาแน่นใกล้ต้น)
 rect(c,0,72,SW,18,k.gravel);for(let y=75;y<90;y+=4)for(let x=0;x<SW;x++)if((x+y)%14<10)rect(c,x,y+(x%28<14?0:1),1,1,k.gravel2); // ทางกรวดคราดเป็นลอน
 blob(c,78,79,20,8,k.gravel);[[18,7],[14.5,5.4],[11,4]].forEach(([a,b])=>ring(c,78,79,a,b,k.gravel2));                                                    // วงคราดรอบหิน
 blob(c,78,78.6,7,3.4,k.stone2);blob(c,77,77.6,6,2.6,k.stone);blob(c,75.5,76.6,2.6,1.1,k.stone3);rect(c,73,75,4,1,k.moss);rect(c,79,75,2,1,k.moss);blob(c,86,80,3,1.6,k.stone2);blob(c,85.6,79.6,2.3,1.1,k.stone);
 // ชิชิโอโดชิ (ส่วนที่ไม่ขยับ): เสาไม้ไผ่กับรางน้ำ อ่างหิน หลักแกน หินรองตี · กระบอกที่กระดกวาดใน gardenLive()
 rect(c,2,51,3,20,k.bam2);rect(c,3,51,1,20,k.bam);[56,63].forEach(y=>rect(c,2,y,3,1,k.bam3));rect(c,2,53,10,2,k.bam);rect(c,2,53,10,1,k.bam3);rect(c,11,53,1,2,k.bam2);
 blob(c,11.5,71.4,7,2.8,k.stone2);blob(c,11.5,70.4,6.4,2.2,k.stone);blob(c,11.5,70,4.6,1.2,k.water);rect(c,9,69,2,1,k.water2);
 blob(c,27,70.4,3.6,2,k.stone2);blob(c,27,69.8,3,1.4,k.stone);rect(c,19,64,2,8,k.post);rect(c,19,64,1,8,k.stone3+'55');
 if(k.glow)blob(c,105,54,11,9,k.glow);
 rect(c,98,69,14,3,k.lan2);rect(c,103,59,4,10,k.lan);rect(c,99,57,12,2,k.lan2);rect(c,100,50,10,7,k.lan);rect(c,103,52,4,4,k.lwin);
 poly(c,[[96,51],[105,44],[114,51]],k.lan2);rect(c,104,42,2,2,k.lan2);rect(c,101,50,1,7,k.stone3);                                                       // โคมหิน (โทโร)
 if(wi){poly(c,[[97,49.6],[105,43.6],[113,49.6],[110,49.2],[105,46],[100,49.2]],k.sn);rect(c,104,41,2,1,k.sn);rect(c,99,56,12,1,k.sn);blob(c,77,75.4,5,1.1,k.sn);blob(c,11.5,68.6,5.5,.9,k.sn)} // หิมะบนหลังคาโคม ฐานโคม หิน อ่างหิน
 // ต้นสนดำตัดแต่ง (นิวากิ): โคนบานมีราก ลำต้นคดเอียง ลายเปลือกเป็นเกล็ด กิ่งยื่นออกไปรับพุ่มเข็มทรงก้อนเมฆ 5 ก้อน
 const PB=[k.bark,k.bark2,k.bark3],PN=[k.pn1,k.pn2,k.pn3,k.pn4];
 rect(c,119,65,12,1,k.bark3);rect(c,120,64,10,1,k.bark);dot(c,118,65,k.bark3);dot(c,131,65,k.bark3);                                                  // รากแผ่
 // ลำต้นคดและกิ่งวาดเป็นเนื้อเดียว (v110 เจ้าของบอกว่าลำต้นขาด: เดิมวาดทีละแถว ช่วงที่เอียงและเรียวแถวไม่ต่อกัน กิ่งเป็นขั้นบันได)
 wood(c,[[[[125,65],[123.5,58],[125.5,50],[122.5,43],[121.5,36],[124,29],[127,22]],6.2,2.4],[[[123,46],[118,43.5],[113,42],[109,41]],2.6,1.6],[[[121.8,38],[117.5,34.5],[114.5,31]],2.4,1.5],
  [[[123.5,31],[129,29],[134,27],[138,26.5]],2.4,1.5],[[[125,53],[130,50.5],[134,49]],2,1.3],[[[118,43.5],[116,45.5]],1.4,1.1]],PB,3);
 [[108,39,6,2.8,21],[115,29,8,3.2,23],[137,25,8,3.2,29],[134,47,4,2,31],[127,19,9,4,37]].forEach(([x,y,w,h,sd])=>{clumpPad(c,x,y,w,h,PN,sd);if(wi){blob(c,x,y-h*.62,w*.82,1.3,k.sn2);blob(c,x-.4,y-h*.72,w*.7,1,k.sn)}}); // หนาว: หิมะบนพุ่มสน
 blob(c,124,66.4,6,1.2,k.shade);blob(c,105,72.4,9,1,k.shade);blob(c,147,88.6,11,1.6,k.shade)}
// พุ่มอาซาเลีย (v110 เจ้าของขอให้ดูดีขึ้น): พุ่มนูนจากกอใบกลมหลายกอซ้อนกัน แสงจากบนซ้าย ใต้พุ่มเงาเข้ม มีขีดใบเล็กๆ
// ใบไม้ผลิดอกเต็มพุ่ม (ดอก 2×2 มีไฮไลต์) · ร้อนเหลือไม่กี่ดอก · ใบไม้ร่วงใบแดงแซมเป็นหย่อม · หนาวหิมะคลุมยอดกอ
const AZ=[[147,77.5,8.5,5.6],[137.5,80.5,6.5,4.6],[157,79.5,6.5,4.8],[142,84,7.5,4.6],[152.5,84,8,4.6],[133,85.5,5,3.4],[161,85,4.5,3.6]];
function gardenFg(c,k){const se=k.season,R=rng(41);
 blob(c,147,86,18,5.6,k.az0);                                                                                                   // ฐานพุ่ม (เงาใต้กอ)
 AZ.forEach(([x,y,a,b])=>blob(c,x,y+1,a,b,k.az0));AZ.forEach(([x,y,a,b])=>blob(c,x,y,a-.7,b-.7,k.az1));                           // เงากอ → สีกลาง
 AZ.forEach(([x,y,a,b])=>blob(c,x-a*.18,y-b*.22,a*.68,b*.58,k.az2));AZ.forEach(([x,y,a,b])=>blob(c,x-a*.32,y-b*.45,a*.34,b*.28,k.az3)); // ด้านรับแสง → ไฮไลต์บนซ้าย
 for(let i=0;i<46;i++){const[x,y,a,b]=AZ[i%AZ.length],u=(R()-.5)*2*a*.8,v=(R()-.2)*b*.9;dot(c,x+u,y+v,R()<.6?k.az1:k.az0);if(R()<.5)dot(c,x+u+1,y+v-1,k.az0)} // ขีดใบ
 const FL=[[143,73],[148,71.5],[153,74],[139,77],[146,77],[156,77.5],[134,81],[150,80],[160,81],[141,81],[154,82],[137,84]],fl=(x,y)=>{x=Math.round(x);y=Math.round(y);rect(c,x,y,2,2,k.flower);dot(c,x,y,k.flower2);dot(c,x+1,y+1,k.flower3)};
 if(se==='spring')FL.forEach(([x,y])=>fl(x,y));else if(se==='summer')[FL[1],FL[5],FL[7]].forEach(([x,y])=>fl(x,y));
 else if(se==='autumn')FL.forEach(([x,y],i)=>{const C=[k.mp1,k.mp2,k.mp3];rect(c,Math.round(x),Math.round(y),2,1,C[i%3]);dot(c,x+(i&1),y+1,C[(i+1)%3]);if(i%3===0)dot(c,x+2,y,C[i%3])});
 if(se==='winter'){const X0=126,Y0=64,w=SW-X0,h=SH-Y0,d=c.getImageData(X0,Y0,w,h).data;                                 // หนาว: หิมะคลุมตามแนวยอดพุ่มจริง (หนา 2 px ย้อยลงบางจุด)
  for(let x=0;x<w;x++){let y=0;while(y<h&&!d[(y*w+x)*4+3])y++;if(y>=h)continue;const t=Y0+y,X=X0+x,deep=2+((x*7)%5===0)+((x*13)%7===0);
   rect(c,X,t,1,deep,k.sn);dot(c,X,t+deep,k.sn2)}}}
// ชิชิโอโดชิ: แกนที่ (20,63.5) ปากกระบอกยาว 10 ไปทางซ้าย ท้ายยาว 6 · มุม 0.42 = เงยรับน้ำ · −0.6 = กระดกเทลงอ่าง · รอบละ 7 วินาที
const SHISHI_T=7000,ease=p=>p*p*(3-2*p);
function shishiA(A){if(!A.P)return .42;const o=A.ms%SHISHI_T;
 return o<5400?.42-.3*ease(o/5400):o<5800?.12-.72*(((o-5400)/400)**2):o<6300?-.6:o<6480?-.6+1.12*ease((o-6300)/180):.52-.1*ease((o-6480)/520)}
function gardenLive(c,k,A){const a=shishiA(A),o=A.ms%SHISHI_T,ca=Math.cos(a),sa=Math.sin(a),at=s=>[20-s*ca,63.5-s*sa];
 if(A.P&&o<5400){const n=(o/110|0)%3;for(let y=55;y<at(9.6)[1]-1;y++)if((y+n)%3)dot(c,11,y,k.water2)}                                                   // น้ำหยดจากรางลงปากกระบอก
 for(let s=-6;s<=10;s+=.3){const[x,y]=at(s);dot(c,x+sa,y-ca,k.bam2);dot(c,x,y,k.bam);dot(c,x-sa,y+ca,k.bam2)}for(let s=-6;s<=10;s+=.3){const[x,y]=at(s);dot(c,x+sa*.9,y-ca*.9,k.bam3)}
 [2,-3].forEach(s=>{const[x,y]=at(s);dot(c,x+sa,y-ca,k.bam2);dot(c,x,y,k.bam2)});const[mx,my]=at(10);dot(c,mx,my,k.post);                                 // ข้อไม้ไผ่ ปากกระบอก
 if(A.P&&o>=5600&&o<6400){const p=(o-5600)/800;ring(c,11.5,70,1+p*3.6,.4+p*.8,k.water2);if(o<6200)for(let i=0;i<3;i++)dot(c,mx-1+i,my+1+((o/80|0)+i)%2,k.water2)} // น้ำเทลงอ่าง วงน้ำกระเพื่อม
 if(A.P&&o>=6440&&o<6640){dot(c,30,66,k.stone3);dot(c,31,68,k.stone3);dot(c,24,66,k.stone3)}}                                                                  // ตีหิน ป๊อก!
// ผีเสื้อกะหล่ำบินวนแถวสนามกับพุ่มดอกไม้ (กลางวัน รุ่งเช้า พลบค่ำ) บางช่วงบินออกนอกจอขวา · หิ่งห้อยกะพริบช้าๆ ตอนกลางคืน
const FF=[[28,64],[50,58],[88,66],[118,60],[140,70],[68,53],[150,57]];
// ตำแหน่งผีเสื้อตามนาฬิกา (ใช้ทั้งวาดและให้แมวซุ่ม) · กลางคืน/ปิดแอนิเมชันไม่มีผีเสื้อ · x เกิน SW = บินออกนอกจอ
const bflyAt=A=>!A.P||A.td==='night'||season(A.ms)==='winter'?null:{x:Math.round(108+52*Math.sin(A.ms/7300)+12*Math.sin(A.ms/1900)),y:Math.round(60+11*Math.sin(A.ms/3300)+3*Math.sin(A.ms/870))};
function gardenFront(c,k,A){if(!A.P)return;const m=A.ms,se=season(m);
 fall(c,A,se,se==='winter'?[0,-3,SW,93]:[0,14,96,76],se==='winter'?30:se==='autumn'?9:12);                                                                   // หิมะทั้งฉาก · กลีบ/ใบปลิวจากต้นเมเปิลทางซ้าย
 if(A.td!=='night'){const b=bflyAt(A);if(!b)return;const{x,y}=b,up=(m/120|0)%2;
  if(x<SW+3){rect(c,x,y,1,2,k.post);if(up){rect(c,x-2,y-2,2,2,k.bfly);rect(c,x+1,y-2,2,2,k.bfly);dot(c,x-2,y-2,k.bfly2);dot(c,x+2,y-2,k.bfly2)}else{rect(c,x-2,y,2,2,k.bfly);rect(c,x+1,y,2,2,k.bfly);dot(c,x-1,y-1,k.bfly);dot(c,x+1,y-1,k.bfly)}}}
else if(se==='summer')FF.forEach(([bx,by],i)=>{const b=Math.sin(m/900+i*1.9);if(b<.1)return;const x=Math.round(bx+7*Math.sin(m/(2600+i*370)+i)),y=Math.round(by+4*Math.sin(m/(1900+i*230)+i*2));
  if(b>.5){c.fillStyle='rgba(234,247,160,.28)';c.fillRect(x-1,y,3,1);c.fillRect(x,y-1,1,3)}dot(c,x,y,k.ff)})}
const gardenTick=A=>{if(!A.P)return'';const o=A.ms%SHISHI_T;return cloudKey(A)+'|'+(o>=5400&&o<6700?'s'+(o/40|0):'w'+(o/110|0))+'|'+(A.ms/110|0)};

// ===== คาเฟ่ (喫茶店): หน้าต่างร้านเห็นฟ้าตามเวลาและตึกฝั่งตรงข้าม ม่านคาเฟ่ กระดานเมนูชอล์ก โคมไฟห้อย ชั้นโหลกาแฟ เคาน์เตอร์มีไซฟอน ตู้เค้ก เครื่องบดกาแฟ มอนสเตอร่า พื้นตาหมากรุก
// ฉากหน้า: โต๊ะกลมกับกาแฟและโดรายากิ · ขยับ: ไอกาแฟลอยขึ้นจากถ้วย
const KCOL={light:{wall:'#f1dcc0',wall2:'#e5caa6',trim:'#b9875c',wains:'#cfa274',wains2:'#b98c60',floor:'#ead2b2',floor2:'#dcbf98',board:'#4d6656',frame:'#a97e58',chalk:'#f3efe4',
  shelf:'#a97e58',jar:'#e9f1f2',beans:'#7a4f34',dora:'#d39a58',dora2:'#b97b3c',cup:'#ffffff',cup2:'#e2d8cc',lamp:'#e08a5e',lamp2:'#c46f45',glow:'rgba(255,214,150,.32)',
  plant:'#86b96f',bed:'#c08b5c',bed2:'#9f6c3d',bed3:'#f6e6cf',table:'#a97e58',table2:'#8a6040',line:'#7a5a43',shade:'rgba(90,58,38,.14)',
  sky:'#cfe9f7',sky2:'#e6f4fb',sun:'#ffd987',cloud:'#ffffff',cloud2:'#d5e2ee',moon:null,bldg:'#e8d6c0',bldg2:'#d5bfa4',bwin:'#a9cde3',awn:'#d96e5a',awn2:'#f7f1e8',slamp:'#fff4cf',sglow:null,
  cur:'#fffaf0',cur2:'#ece2d2',ctop:'#c49069',ctop2:'#dcae86',cfront:'#a97e58',cfront2:'#8a6040',case:'#e8f3f5',cream:'#fff8ee',berry:'#e05a5a',pud:'#f2c14e',
  glow2:'rgba(255,214,150,.09)',lampH:'#f0a882',bulb:'#fff6d6',shelfH:'#c49a73',beans2:'#5e3a25',kraft:'#c9a274',kraft2:'#ad8758',tin:'#d6b25e',tin2:'#8fb3a6',syrup:'#c8873a',sponge:'#f3d48e',mont:'#c99a62',mug3:'#9cbf9a',flame:'#fff1a8',flame2:'#ff9a4a',flameG:null,glassT:'#dfeef1',foam:'#c9a27a',
  mon:'#6fa65c',mon2:'#4f8a45',mon3:'#93c47a',mon4:'#3c6c39',stem:'#5a8a46',pot:'#c97b54',potR:'#dd9469',pot2:'#a8613e',cac1:'#4c8648',cac2:'#6aa95b',cac3:'#98cc80',spine:'#fbf8ec',flw:'#f28aa0',flw2:'#ffd36b',metal:'#c3c7cb',metal2:'#8f9499',steam:'#ffffff'},
 dark:{wall:'#3a2e26',wall2:'#33281f',trim:'#5a4331',wains:'#4a3a2c',wains2:'#3f3125',floor:'#3d3128',floor2:'#352a22',board:'#2c3a32',frame:'#7d604a',chalk:'#c9c4b6',
  shelf:'#7d604a',jar:'#8a9799',beans:'#4d3222',dora:'#9a6c3c',dora2:'#7f5530',cup:'#d8d2ca',cup2:'#a9a197',lamp:'#f0a070',lamp2:'#c47a4e',glow:'rgba(255,190,120,.2)',
  plant:'#5f8c52',bed:'#86603f',bed2:'#6b4b30',bed3:'#b9a68b',table:'#7d604a',table2:'#634a37',line:'#b8987a',shade:'rgba(0,0,0,.3)',
  sky:'#1e2b47',sky2:'#273860',moon:'#f4e4a6',bldg:'#2c3040',bldg2:'#252836',bwin:'#f4d27a',awn:'#7a3a32',awn2:'#8a857c',slamp:'#ffe9a8',sglow:'rgba(255,233,168,.2)',
  cur:'#b9b2a6',cur2:'#9d968b',ctop:'#7d604a',ctop2:'#94745a',cfront:'#5a4331',cfront2:'#47352a',case:'#4a5559',cream:'#cfc6b8',berry:'#a04646',pud:'#b8923a',
  glow2:'rgba(255,190,120,.055)',lampH:'#f6b48a',bulb:'#fff6d6',shelfH:'#94745a',beans2:'#3a2418',kraft:'#7d6448',kraft2:'#6a543b',tin:'#8f7a45',tin2:'#4f6a62',syrup:'#8a5a2a',sponge:'#a8925e',mont:'#8a6a44',mug3:'#5f7a5e',flame:'#fff1a8',flame2:'#ff9a4a',flameG:'rgba(255,170,90,.18)',glassT:'#55666b',foam:'#7d6448',
  mon:'#4a7040',mon2:'#3a5a33',mon3:'#5f8c52',mon4:'#2a4628',stem:'#3e5e35',pot:'#86533a',potR:'#9c6444',pot2:'#68402a',cac1:'#33553a',cac2:'#477146',cac3:'#618e5a',spine:'#c4bfb0',flw:'#b05f72',flw2:'#c9a656',metal:'#7a7e83',metal2:'#5e6267',steam:'#e8e2d8'}};
function cafeBg(c,k){rect(c,0,0,SW,52,k.wall);for(let x=9;x<SW;x+=10)rect(c,x,0,1,51,k.wall2);
 // หน้าต่างร้าน: ฟ้าตามเวลา ตึกฝั่งตรงข้ามมีกันสาดลายทาง (กลางคืนเปิดไฟ · เจ้าของให้เอาเสาไฟถนนออก) · ม่านคาเฟ่ครึ่งล่าง
 rect(c,3,6,40,43,k.frame);rect(c,5,8,36,39,k.sky);rect(c,5,28,36,19,k.sky2);
 if(k.moon)moonSky(c,[[9,11],[16,15],[27,10],[31,18]],moonXY(13,14,2,38,16),k.moon);else{c.drawImage(cloudImg(k,13,5,4),6,10);c.drawImage(cloudImg(k,9,4,6),29,14)} // พระจันทร์สูงสุดกลางบานบนซ้าย ตกหลังตึกฝั่งตรงข้าม
 rect(c,5,24,19,23,k.bldg);rect(c,26,19,15,28,k.bldg2);[[7,26],[12,26],[17,26]].forEach(([x,y])=>rect(c,x,y,3,3,k.bwin));[[28,22],[33,22],[28,28],[33,28]].forEach(([x,y],i)=>rect(c,x,y,3,3,i===2&&!k.moon?k.bldg:k.bwin));
 for(let x=5;x<24;x++){rect(c,x,31,1,3,(x>>1)%2?k.awn:k.awn2);if(x%2)dot(c,x,34,(x>>1)%2?k.awn:k.awn2)}                                                     // กันสาดลายทาง
 if(k.season==='winter'){rect(c,5,30,19,1,k.sn);rect(c,5,24,19,1,k.sn);rect(c,26,19,15,1,k.sn)}                                                              // หนาว: หิมะบนกันสาดและหลังคาตึก
                                    // เสาไฟถนน
 rect(c,22,8,2,39,k.frame);rect(c,5,21,36,1,k.frame);
 rect(c,4,35,38,1,k.frame2);rect(c,5,36,36,10,k.cur);for(let x=6;x<41;x+=3)rect(c,x,36,1,10,k.cur2);for(let x=5;x<41;x+=2)dot(c,x,46,k.cur);               // ม่านคาเฟ่
 rect(c,2,47,42,2,k.frame2);rect(c,2,47,42,1,k.trim);
 // กระบองเพชรทรงเสามีแขนสองข้าง ลายร่องตามยาว หนามจุดขาว ดอกชมพูบนยอด ในกระถางดินเผา
 rect(c,34,43,7,1,k.potR);poly(c,[[34.5,44],[40.5,44],[39.8,47],[35.2,47]],k.pot);rect(c,39,44,1,3,k.pot2);
 rect(c,36,37,3,6,k.cac2);rect(c,37,37,1,6,k.cac3);rect(c,38,37,1,6,k.cac1);dot(c,37,36,k.cac2);
 rect(c,39,40,1,1,k.cac2);rect(c,40,38,1,3,k.cac1);dot(c,40,37,k.cac2);rect(c,35,41,1,1,k.cac2);rect(c,34,39,1,3,k.cac2);dot(c,34,38,k.cac3);
 [[35,37],[39,38],[35,40],[41,39],[33,40],[36,42],[38,36]].forEach(([x,y])=>dot(c,x,y,k.spine));dot(c,36,35,k.flw);dot(c,38,35,k.flw);dot(c,37,34,k.flw);dot(c,37,35,k.flw2);                              // ขอบหน้าต่าง + กระบองเพชร
 // กระดานเมนูชอล์ก (เส้นแทนตัวหนังสือ) + โคมไฟห้อย
 const bx=50;rect(c,bx,14,36,24,k.frame);rect(c,bx+1,15,34,22,k.board);rect(c,bx+4,18,18,1,k.chalk);
 [[23,12],[27,9],[31,13]].forEach(([y,w])=>{rect(c,bx+4,y,w,1,k.chalk);rect(c,bx+26,y,5,1,k.chalk)});rect(c,bx+27,17,2,2,k.chalk);
 blob(c,bx+30,33,2,1.4,k.dora);rect(c,bx+28,33,4,1,k.dora2);rect(c,bx+4,33,6,1,k.chalk+'88');                                                               // รูปโดรายากิชอล์กมุมกระดาน
 [[22,17,13],[20,13,10],[18,9,7],[16,5,4]].forEach(([y,a,b])=>blob(c,94.5,y,a,b,k.glow2));                                                                   // แสงโคมไล่ระดับ
 rect(c,94,0,1,5,k.trim);rect(c,92,5,5,2,k.lamp2);poly(c,[[88,13],[90,7],[99,7],[101,13]],k.lamp);rect(c,90,8,2,4,k.lampH);rect(c,88,13,13,1,k.lamp2);blob(c,94.5,14.4,2,1.2,k.bulb); // โคมไฟห้อย + หลอด
 // ชั้นวาง: ขอบหน้ารับแสง เงาใต้ชั้น ขาค้ำ
 [17,30].forEach(y=>{rect(c,104,y,52,2,k.shelf);rect(c,104,y,52,1,k.shelfH);rect(c,104,y+2,52,1,k.wall2);[106,153].forEach(x=>{rect(c,x,y+2,2,1,k.table2);dot(c,x,y+3,k.table2)})});
 // ชั้นบน: ต้นพลูด่างห้อยลงจากกระถาง โหลกาแฟเมล็ดสองระดับคั่ว (ฝาไม้ ฉลาก ประกายแก้ว) แก้วมัคสามใบ
 rect(c,105,12,6,5,k.pot);rect(c,104,11,8,1,k.potR);rect(c,109,12,1,5,k.pot2);[[106,9,2.4,1.8],[109.5,9.5,2.2,1.6],[108,7.6,1.8,1.4]].forEach(([x,y,a,b])=>blob(c,x,y,a,b,k.mon));dot(c,106,8,k.mon3);dot(c,110,9,k.mon2);
 for(let y=13;y<26;y++){const x=Math.round(104.6+Math.sin(y*.55)*.8);dot(c,x,y,k.stem);if(y%3===1){dot(c,x-1,y,k.mon);dot(c,x+1,y+1,k.mon3)}}for(let y=14;y<22;y++){const x=Math.round(111+Math.sin(y*.7)*.7);dot(c,x,y,k.stem);if(y%3===0)dot(c,x+1,y,k.mon)}
 [[113,8,7,k.beans,k.beans2],[122,10,6,k.dora,k.dora2]].forEach(([x,y,w,b,b2])=>{const h=17-y;rect(c,x,y+1,w,h-1,k.jar);rect(c,x,y+3,w,h-3,b);for(let i=0;i<w*2;i++)dot(c,x+(i*3)%w,y+4+(i*5)%(h-4),b2);
  rect(c,x-1,y,w+2,2,k.shelf);rect(c,x-1,y,w+2,1,k.shelfH);rect(c,x+1,y+h-5,w-2,2,k.bed3);rect(c,x,y+2,1,h-3,k.glassT);dot(c,x+1,y+2,k.cup)});
 [[131,k.cup],[139,k.potR],[147,k.mug3]].forEach(([x,col])=>{rect(c,x,12,5,5,col);rect(c,x,12,5,1,k.cup2);dot(c,x+5,13,col);dot(c,x+6,14,col);dot(c,x+5,15,col);dot(c,x,13,k.cup);rect(c,x+1,16,3,1,k.shelf+'55')});
 // ชั้นล่าง: กระป๋องชา จานรองซ้อนกับถ้วยคว่ำ ถุงกาแฟกระดาษคราฟต์ (ฉลากรูปเมล็ด) ขวดไซรัป
 rect(c,113,21,5,8,k.tin);rect(c,113,21,5,1,k.shelfH);rect(c,113,24,5,1,k.tin2);dot(c,113,22,k.cup);rect(c,119,24,4,5,k.tin2);rect(c,119,24,4,1,k.cup2);
 [[124,28,11,k.cup2],[125,27,9,k.cup],[124,26,11,k.cup2],[125,25,9,k.cup]].forEach(([x,y,w,col])=>rect(c,x,y,w,1,col));rect(c,127,22,5,3,k.cup);rect(c,126,24,7,1,k.cup2);
 rect(c,139,22,9,8,k.kraft);rect(c,139,20,9,2,k.kraft2);for(let x=139;x<148;x+=2)dot(c,x,20,k.kraft);rect(c,147,22,1,8,k.kraft2);rect(c,141,24,5,4,k.bed3);blob(c,143.5,26,1.3,1.6,k.beans);dot(c,143,26,k.bed3);
 rect(c,150,23,4,6,k.syrup);rect(c,151,21,2,2,k.syrup);rect(c,151,20,2,1,k.metal2);dot(c,150,24,k.cup);rect(c,150,26,4,2,k.bed3);
 // ผนังบัวล่าง + เคาน์เตอร์
 rect(c,0,52,SW,17,k.wains);for(let x=19;x<SW;x+=20)rect(c,x,53,1,16,k.wains2);rect(c,0,51,SW,1,k.trim);rect(c,0,69,SW,2,k.trim);
 rect(c,96,48,64,3,k.ctop);rect(c,96,48,64,1,k.ctop2);rect(c,97,51,63,18,k.cfront);for(let x=108;x<SW;x+=13)rect(c,x,52,1,16,k.cfront2);rect(c,97,51,63,1,k.cfront2);rect(c,97,68,63,3,k.cfront2);
 // มอนสเตอร่าในกระถาง (หลังแมว)
 // ใบรูปหัวใจมีรอยแหว่ง ก้านยาวโค้งออกจากกระถาง ใบหลังสีเข้มกว่า ใบอ่อนยังไม่แหว่ง
 const ML=[[16.5,48.5,3.8,3,-1.1,0],[4.5,57,5.8,4.6,Math.PI-.55,1],[9,47.5,5.6,4.4,-Math.PI/2-.55,1],[20.5,54,5.8,4.6,-.3,1],[21,62,3.4,2.4,.55,2]];
 ML.forEach(([x,y,rx,,a])=>stem(c,12.5,63,12.5+(x-12.5)*.2,y+4,x-Math.cos(a)*rx*.7,y-Math.sin(a)*rx*.7,k.stem));
 ML.forEach(([x,y,rx,ry,a,t])=>monLeaf(c,x,y,rx,ry,a,t===0?[k.mon4,k.mon2,k.mon,k.mon4]:t===2?[k.mon,k.mon3,k.mon3,k.mon2]:[k.mon2,k.mon,k.mon3,k.mon4],t===1));
 rect(c,7,63,11,2,k.potR);rect(c,7,64,11,1,k.pot);poly(c,[[8,65],[17,65],[16.2,71],[8.8,71]],k.pot);rect(c,15,65,1,6,k.pot2);rect(c,9,65,1,5,k.potR);   // กระถางดินเผา
 // ไซฟอนกาแฟ
 // ขาตั้งโลหะ ห้องบนมีกาแฟกับฟองครีมา หลอดแก้ว โถล่างเป็นแก้วใส ตะเกียงอยู่ใต้โถ (เปลวไฟกับฟองน้ำขยับใน cafeLive)
 rect(c,99,47,12,1,k.metal2);rect(c,99,47,12,1,k.metal2);rect(c,100,33,1,14,k.metal2);rect(c,100,35,4,1,k.metal2);rect(c,100,40,3,1,k.metal2);
 rect(c,103,31,7,1,k.metal);rect(c,103,32,7,6,k.glassT);rect(c,104,34,5,4,k.beans);rect(c,104,34,5,1,k.foam);dot(c,103,32,k.cup);rect(c,103,33,1,4,k.cup+'aa');
 rect(c,105,38,3,1,k.metal);rect(c,106,39,1,2,k.glassT);blob(c,106.5,43,3.8,3.2,k.glassT);blob(c,106.5,44.4,3,1.6,k.beans);dot(c,104,41,k.cup);dot(c,104,42,k.cup);rect(c,105,46,4,1,k.metal2);
 // ตู้เค้ก: ช็อตเค้กสตรอว์เบอร์รี โรลเค้ก พุดดิ้ง
 // กรอบโลหะ กระจกมีประกายเฉียง ฐานไม้มีป้ายราคา (ช่องว่าง ไม่มีตัวหนังสือ) · ช็อตเค้กสตรอว์เบอร์รี โรลเค้ก พุดดิ้ง มงบลัง
 rect(c,114,34,29,1,k.metal);rect(c,115,35,27,9,k.case);rect(c,114,35,1,9,k.metal);rect(c,142,35,1,9,k.metal);rect(c,114,44,29,4,k.cfront2);rect(c,114,44,29,1,k.ctop2);
 rect(c,116,39,6,5,k.cream);rect(c,116,40,6,1,k.sponge);rect(c,116,42,6,1,k.sponge);rect(c,116,41,6,1,k.berry);dot(c,118,38,k.berry);dot(c,119,38,k.berry);dot(c,117,38,k.cream);dot(c,119,37,k.mon);
 blob(c,125.5,41.2,2.7,2.6,k.beans);blob(c,125.5,41.2,1.6,1.5,k.cream);dot(c,125,41,k.beans);dot(c,126,40,k.beans);rect(c,123,43,6,1,k.cup2);
 poly(c,[[130,39],[134,39],[135,43.9],[129,43.9]],k.pud);rect(c,130,39,4,1,k.dora2);dot(c,131,38,k.cream);dot(c,132,38,k.cream);dot(c,132,37,k.berry);
 rect(c,136,42,5,2,k.sponge);blob(c,138.5,40.2,2.6,2.2,k.mont);[[137,39],[139,40],[138,41],[140,41]].forEach(([x,y])=>dot(c,x,y,k.dora2));dot(c,138,37,k.dora2);dot(c,138,38,k.cream);
 [[116,36],[117,35],[127,37],[128,36],[129,35],[139,36],[140,35]].forEach(([x,y])=>dot(c,x,y,k.cup));[117,125,131,137].forEach(x=>rect(c,x,45,3,2,k.cup));
 // เครื่องบดกาแฟ
 // เครื่องบดมือหมุน: กล่องไม้มีลิ้นชักกับปุ่ม ชามโลหะมีเมล็ดกาแฟ มือหมุนหัวไม้ · กาน้ำคอห่าน
 rect(c,145,40,7,7,k.cfront2);rect(c,146,41,5,2,k.ctop);rect(c,146,44,5,2,k.ctop2);dot(c,148,44,k.metal2);poly(c,[[144,36],[153,36],[151,40],[146,40]],k.metal);rect(c,144,36,9,1,k.cup2);rect(c,146,37,5,1,k.beans);
 rect(c,148,32,1,4,k.metal2);rect(c,148,32,4,1,k.metal2);rect(c,151,30,1,2,k.dora2);
 poly(c,[[155,42],[158,42],[159.5,47],[153.5,47]],k.metal);rect(c,155,41,3,1,k.metal2);dot(c,156,40,k.metal2);rect(c,154,46,6,1,k.metal2);dot(c,155,43,k.cup);
 [[153,43],[152,44],[152,45]].forEach(([x,y])=>dot(c,x,y,k.metal2));[[159,44],[160,43]].forEach(([x,y])=>dot(c,x,y,k.metal));
 for(let y=71;y<SH;y+=5)for(let x=0;x<SW;x+=8)rect(c,x,y,8,5,((x/8+(y-71)/5)&1)?k.floor2:k.floor); // พื้นตาหมากรุก
 rect(c,96,71,64,1,k.floor2);blob(c,12,71.6,7,1,k.shade);blob(c,146,88.6,10,1.4,k.shade)}
function cafeFg(c,k){rect(c,128,63,32,3,k.table);rect(c,128,66,32,1,k.table2);rect(c,144,67,4,19,k.table);rect(c,138,86,16,2,k.table2);
 rect(c,133,62,10,1,k.cup2);rect(c,135,57,6,5,k.cup);rect(c,141,58,1,3,k.cup2);rect(c,136,57,4,1,k.beans); // กาแฟ
 rect(c,147,62,11,1,k.cup2);blob(c,152.5,60.4,4.6,1.8,k.dora2);blob(c,152.5,59.6,4.4,1.6,k.dora)} // โดรายากิ
// ไซฟอนกำลังต้ม: เปลวตะเกียงไหว ฟองน้ำผุดในโถล่าง (กลางคืนเปลวไฟมีแสงรอบ)
function cafeLive(c,k,A){if(!A.P)return;if(season(A.ms)==='winter')fallIn(c,k,A,'winter',[5,6,36,41],11);const f=(A.ms/140|0)%4;if(k.flameG)blob(c,106.5,45.5,3,2,k.flameG);dot(c,106,46,k.flame2);dot(c,107,46,k.flame2);dot(c,f<2?106:107,45,k.flame);
 for(let i=0;i<3;i++){const p=(A.ms/700+i/3)%1;dot(c,105+i,44-p*3,k.cup)}}
// ไอกาแฟ 3 สายลอยขึ้นจากถ้วยบนโต๊ะ ส่ายเบาๆ แล้วจางหาย
function cafeFront(c,k,A){if(!A.P)return;for(let i=0;i<3;i++){const p=(A.ms/2100+i/3)%1,y=55-p*12,x=137.6+Math.sin(p*6.5+i*2.1)*1.5;c.globalAlpha=(1-p)*.75;rect(c,Math.round(x),Math.round(y),1,2,k.steam)}c.globalAlpha=1}
const cafeTick=A=>A.P?''+(A.ms/120|0):'';

// ===== สถานีรถไฟ (駅): หลังคาชานชาลามีไฟ เมืองไกล ชานชาลาฝั่งตรงข้าม รางรถไฟ เสาไฟฟ้าเหนือราง ป้ายสถานีรูปอุ้งเท้า ตู้กดน้ำ ม้านั่ง แถบเบรลล์สีเหลือง · ฉากหน้า: เสาชานชาลากับนาฬิกา
// ขยับ: เมฆลอย รถไฟสามตู้วิ่งผ่านทุก 120 วินาที (เจ้าของเลือก 2026-11-20 วิ่งผ่านเฉยๆ ไม่จอด) (ใช้เวลาราว 4 วินาที วิ่งหลังม้านั่งกับตู้กดน้ำ) เข็มนาฬิกาบนเสาเดินตามเวลาจริง
const TCOL={light:{sky:'#cfe9f7',sky2:'#e6f4fb',sun:'#ffd987',cloud:'#ffffff',cloud2:'#d5e2ee',city:'#b8c6d4',city2:'#a6b5c4',cwin:null,roof:'#6f6a73',roof2:'#5a5660',beam:'#8b8590',sign:'#ffffff',signb:'#4f8fd6',ink:'#3b3540',
  wall:'#ddd8cf',wall2:'#cbc5bb',vm:'#d9625c',vm2:'#b84c47',vmg:'#eef4f6',vglow:null,d1:'#5b9bd6',d2:'#f0bb55',d3:'#86c49b',bench:'#c49a73',bench2:'#a97e58',plat:'#d8d3cb',plat2:'#c4beb4',edge:'#f0c84a',edge2:'#d4a92c',
  mat:'#7fb0d8',mat2:'#5f93c0',mat3:'#a9cbe8',pil:'#9aa0a8',pil2:'#80868f',pil3:'#b8bec5',clock:'#ffffff',line:'#5a5660',shade:'rgba(60,60,70,.16)',moon:null,
  opl:'#d3cec6',opf:'#b5afa5',fen:'#a3a9b0',bal:'#b3aca1',bal2:'#9d968a',slp:'#8f806e',rail:'#7f848b',rail2:'#d0d4d8',pole:'#8b8590',wire:'#6a6670',lampf:'#fdfdf5',lglow:null,white:'#f7f5f0',
  c1:'#ece4d6',c2:'#cfdbe5',c3:'#e6d3c5',c4:'#d6dfcd',btop:'#a9b3bd',bsh:'rgba(60,70,90,.16)',win:'#a7c3d8',win2:'#eef6fb',balc:'#f6f3ec',haze:'#c6d4e1',haze2:'#b3c4d4',tank:'#c2bbb0',ac:'#dcdcd8',sgn1:'#e8735a',sgn2:'#f0bb55',sgn3:'#5f93c0',
  led0:'#1f1d23',ledO:'#f2a93b',ledG:'#7fd36b',ledR:'#ff6b5a',ledGl:null,vmw:'#f4f8fa',d4:'#e8735a',d5:'#f7f4ec',d6:'#7a4f34',cap:'#b9bec4',btn1:'#7fd3ff',btn2:'#ff9a8a',lcd:'#2f3a2f',bin1:'#5f93c0',bin2:'#86c49b',seat:'#5f93c0',seat2:'#4a78a8',seat3:'#8ab4dc',mark:'#6fbf8a',
  trn:'#eef1f3',trn2:'#d3d9de',trn3:'#aab3ba',tst:'#4f8fd6',tst2:'#3b6aa0',twin:'#8fb8d8',twin2:'#c4dcee',tun:'#5c6168',wheel:'#3f4248',head:'#fff6c0',pax:'#6f8aa0'},
 dark:{sky:'#1e2b47',sky2:'#273860',moon:'#f4e4a6',city:'#2b3446',city2:'#252d3d',cwin:'#f4d27a',roof:'#2e2b31',roof2:'#25232a',beam:'#3e3a42',sign:'#cfcac2',signb:'#3b6aa0',ink:'#2a2530',
  wall:'#3a3631',wall2:'#322e2a',vm:'#9c4744',vm2:'#7e3936',vmg:'#f2f0d8',vglow:'rgba(242,240,216,.14)',d1:'#4a7fae',d2:'#c49a45',d3:'#6d9c7c',bench:'#7d604a',bench2:'#634a37',plat:'#47433e',plat2:'#3c3834',edge:'#b8952f',edge2:'#987a22',
  mat:'#4f6f8c',mat2:'#3f5a73',mat3:'#6585a2',pil:'#4e535a',pil2:'#41454b',pil3:'#5e636a',clock:'#e8e4dc',line:'#9aa0a8',shade:'rgba(0,0,0,.3)',
  opl:'#4a4641',opf:'#3c3935',fen:'#4e535a',bal:'#3d3a36',bal2:'#33302d',slp:'#2e2924',rail:'#4a4d52',rail2:'#8a8f95',pole:'#3e3a42',wire:'#5e5a64',lampf:'#fffbe6',lglow:'rgba(255,248,220,.07)',white:'#bdb9b2',
  c1:'#2f3748',c2:'#28303f',c3:'#333a4b',c4:'#2a3342',btop:'#3d4659',bsh:'rgba(0,0,0,.22)',win:'#1c2232',win2:'#1c2232',balc:'#3f4859',haze:'#222a3a',haze2:'#283044',tank:'#3a4050',ac:'#3a4050',sgn1:'#d0644f',sgn2:'#d9ad48',sgn3:'#4f86c0',
  led0:'#141317',ledO:'#ffb347',ledG:'#8ff07a',ledR:'#ff7a68',ledGl:'rgba(255,190,90,.10)',vmw:'#f6f4dc',d4:'#c0604c',d5:'#e8e4d4',d6:'#5e3c28',cap:'#9aa0a7',btn1:'#8fe0ff',btn2:'#ffa898',lcd:'#22301f',bin1:'#3f6a96',bin2:'#5e8f6c',seat:'#3f6a96',seat2:'#335a82',seat3:'#5a86b4',mark:'#4f9a6a',
  trn:'#b9bec4',trn2:'#9aa0a7',trn3:'#7d838a',tst:'#3b6aa0',tst2:'#2d5280',twin:'#f2e2a8',twin2:'#fff4cc',tun:'#2f3236',wheel:'#232528',head:'#fff6c0',pax:'#8a7a5a'}};
function stationFar(c,k){sky(c,k,48,[79,16,58,102,9])} // พระจันทร์: อยู่ในช่องฟ้าระหว่างป้ายไฟกับป้ายสถานี (v105 เดิมไปค้างหลังเสานาฬิกา) ขึ้น-ตกหลังป้ายและตึก
// เมืองอยู่หน้าเมฆ (v95 เจ้าของบอกว่าตึกรก: ลดเหลือ 7 หลัง เว้นช่องให้เห็นฟ้า ตึกสูงไกลเหลือ 2 หลัง)
function stationCity(c,k){const R=rng(41),win=()=>k.cwin?(R()<.42?k.cwin:k.win):(R()<.14?k.win2:k.win);
 [[38,23,8],[95,19,7]].forEach(([x,y,w],i)=>{rect(c,x,y,w,47-y,k.haze);if(i){rect(c,x+3,y-6,1,6,k.haze);dot(c,x+3,y-7,k.sgn1)}
  for(let wy=y+2;wy<40;wy+=3)for(let wx=x+1;wx<x+w-1;wx+=2)if(R()<.4)dot(c,wx,wy,k.cwin&&R()<.5?k.cwin:k.haze2)});                           // ตึกสูงไกลๆ (จางในหมอก)
 CITY.forEach(([x,y,w,t],i)=>bldg(c,x,y,w,t,k,R,win,i))}
// ตึกฉากหลังสถานี: office = กระจกเป็นตาราง · apt = แมนชันมีระเบียงทุกชั้นและผ้าตาก · shop = ตึกเตี้ยมีป้ายโฆษณาบนหลังคา (สีล้วน ไม่มีตัวหนังสือ)
// ของบนดาดฟ้า: ถังน้ำ แอร์ เสาอากาศ ราวกันตก · ด้านขวามีเงา 1 px · กลางคืนหน้าต่างเปิดไฟบางบาน
const CITY=[[0,34,14,'apt'],[23,29,11,'off'],[50,38,13,'shop'],[78,33,15,'apt'],[112,27,11,'off'],[133,37,12,'shop'],[149,31,11,'apt']];
function bldg(c,x,y,w,t,k,R,win,i){const B=47;rect(c,x,y,w,B-y,[k.c1,k.c2,k.c3,k.c4][i%4]);rect(c,x,y,w,1,k.btop);
 if(t==='off'){for(let wy=y+2;wy<B-1;wy+=3)for(let wx=x+1;wx<x+w-2;wx+=3)rect(c,wx,wy,2,2,win());rect(c,x+(w>>1),y-4,1,4,k.btop);dot(c,x+(w>>1),y-5,k.sgn1)}
 else if(t==='apt'){for(let wy=y+3;wy<B;wy+=4){for(let wx=x+1;wx<x+w-2;wx+=3)rect(c,wx,wy-2,2,2,win());rect(c,x,wy,w-1,1,k.balc);if(R()<.45)dot(c,x+2+((R()*(w-5))|0),wy-1,[k.d1,k.d2,k.d3,k.white][(R()*4)|0])}
  rect(c,x+1,y-3,3,2,k.tank);dot(c,x+1,y-1,k.btop);dot(c,x+3,y-1,k.btop);rect(c,x+w-5,y-2,3,2,k.ac);for(let rx=x;rx<x+w;rx+=2)dot(c,rx,y-1,k.btop)}
 else{for(let wx=x+1;wx<x+w-2;wx+=3)rect(c,wx,y+3,2,3,win());rect(c,x,y+7,w-1,1,k.balc);rect(c,x+1,y+8,w-3,B-y-8,k.win);
  const sc=[k.sgn1,k.sgn2,k.sgn3][i%3];rect(c,x+1,y-5,w-2,4,sc);rect(c,x+2,y-4,w-4,2,k.white);rect(c,x+3,y-4,2,2,sc);dot(c,x+2,y-1,k.btop);dot(c,x+w-3,y-1,k.btop)} // ป้ายบนหลังคา
 rect(c,x+w-1,y,1,B-y,k.bsh)}
// ชานชาลาฝั่งตรงข้าม รั้ว หินโรยทาง หมอนรองราง ราง เสาไฟฟ้าและสายเหนือราง (อยู่หน้าเมฆ หลังรถไฟ)
function stationMid(c,k){stationCity(c,k);rect(c,0,41,SW,1,k.fen);for(let x=4;x<SW;x+=10)rect(c,x,41,1,6,k.fen);
 rect(c,64,36,1,11,k.pole);rect(c,77,36,1,11,k.pole);rect(c,62,33,18,6,k.ink);rect(c,63,34,16,4,k.sign);rect(c,63,37,16,1,k.signb);rect(c,69,35,4,1,k.ink);   // ป้ายสถานีฝั่งตรงข้าม (ไม่มีตัวหนังสือ)
 rect(c,30,43,12,1,k.seat2);rect(c,30,41,12,2,k.seat);dot(c,31,44,k.pole);dot(c,40,44,k.pole);rect(c,118,40,6,6,k.vm2);rect(c,119,41,4,3,k.vmg);              // ม้านั่งกับตู้กดน้ำฝั่งตรงข้าม
 rect(c,0,47,SW,2,k.opl);rect(c,0,47,SW,1,k.white);rect(c,0,49,SW,4,k.opf);            // ชานชาลาฝั่งตรงข้าม + รั้ว
 rect(c,0,53,SW,17,k.bal);for(let y=54;y<70;y+=2)for(let x=y%4?1:0;x<SW;x+=3)rect(c,x,y,1,1,k.bal2);for(let x=2;x<SW;x+=6)rect(c,x,57,3,10,k.slp);           // หินโรยทาง หมอนรองราง
 if(k.season==='winter'){const R=rng(53);for(let i=0;i<70;i++)rect(c,(R()*SW)|0,54+((R()*15)|0),1+(R()<.4),1,R()<.7?k.sn:k.sn2);rect(c,0,47,SW,1,k.sn)}       // หนาว: หิมะประบนหินโรยทางและขอบชานชาลาฝั่งตรงข้าม
 [59,64].forEach(y=>{rect(c,0,y,SW,1,k.rail2);rect(c,0,y+1,SW,1,k.rail)});                                                                                  // ราง
 [24,112].forEach(x=>{rect(c,x,12,2,41,k.pole);rect(c,x,20,12,1,k.pole);rect(c,x+11,20,1,7,k.pole)});rect(c,0,20,SW,1,k.wire);rect(c,0,26,SW,1,k.wire);for(let x=6;x<SW;x+=14)rect(c,x,21,1,5,k.wire)} // เสาไฟฟ้า สายเหนือราง
// รถไฟสามตู้ (วาดครั้งเดียวต่อชุดสี) หัวรถอยู่ซ้าย วิ่งจากขวาไปซ้าย · ภาพเริ่มที่ y=26 (สายไฟ) ล้อแตะรางที่ y=64
const TRAIN_T=120000,TRAIN_V=.11,TRAIN_W=3*72,trC={},trainX=A=>{if(!A.P)return null;const x=SW+6-(A.ms%TRAIN_T)*TRAIN_V;return x>-TRAIN_W-6?Math.round(x):null};
function trainImg(k){const id=k.trn+k.twin;if(trC[id])return trC[id];const v=document.createElement('canvas');v.width=TRAIN_W;v.height=40;const c=v.getContext('2d');
 for(let i=0;i<3;i++){const x0=i*72;
  rect(c,x0+1,7,68,1,k.trn3);rect(c,x0,8,70,24,k.trn);rect(c,x0,27,70,5,k.trn2);rect(c,x0,24,70,2,k.tst);rect(c,x0,26,70,1,k.tst2);rect(c,x0,8,70,1,k.trn2);
  [10,32,54].forEach(dx=>{rect(c,x0+dx,11,7,21,k.trn2);rect(c,x0+dx+1,12,5,8,k.twin);rect(c,x0+dx+3,11,1,21,k.trn3)});                                       // ประตู
  [[2,7],[18,13],[40,13],[62,6]].forEach(([dx,w],j)=>{rect(c,x0+dx,12,w,8,k.twin);rect(c,x0+dx,12,w,1,k.twin2);if((i+j)%2)rect(c,x0+dx+2,16,2,4,k.pax)});     // หน้าต่าง + ผู้โดยสาร
  rect(c,x0+4,32,62,3,k.tun);[[6,12],[52,12]].forEach(([dx,w])=>{rect(c,x0+dx,33,w,3,k.wheel);[2,w-3].forEach(o=>{blob(c,x0+dx+o+.5,36.5,2.2,2.2,k.wheel);dot(c,x0+dx+o,36,k.trn3)})});
  if(i<2)rect(c,x0+70,12,2,18,k.tun)}
 c.clearRect(0,8,1,3);c.clearRect(0,8,2,1);rect(c,1,11,4,8,k.twin);rect(c,1,11,4,1,k.twin2);rect(c,0,28,2,2,k.head);                                         // หัวรถมน กระจกหน้า ไฟหน้า
 rect(c,28,0,14,1,k.wire);for(let t=0;t<=6;t++){dot(c,30+t*.8,1+t,k.tun);dot(c,40-t*.8,1+t,k.tun)}rect(c,31,6,8,1,k.tun);                                   // แพนโทกราฟแตะสายไฟ
 return trC[id]=v}
function stationTrain(c,k,A){const x=trainX(A);if(x!=null)c.drawImage(trainImg(k),x,26)}
// หนาว: หิมะตกในที่โล่งหลังชานชาลา (หน้ารถไฟ หลังหลังคาและพื้นชานชาลาฝั่งเรา)
function stationBack(c,k,A){stationTrain(c,k,A);if(season(A.ms)==='winter')fall(c,A,'winter',[0,9,SW,64],26)}
function stationBg(c,k){rect(c,0,0,SW,6,k.roof);rect(c,0,6,SW,1,k.roof2);rect(c,0,7,SW,2,k.beam);                                                           // หลังคาชานชาลา
 [6,72].forEach(x=>{if(k.lglow)blob(c,x+6,12,9,3,k.lglow);rect(c,x,9,12,2,k.pil2);rect(c,x+1,10,10,1,k.lampf)});
 // ป้ายบอกเวลารถออก (ไฟ LED เป็นแถบสี ไม่มีตัวหนังสือ)
 rect(c,36,9,1,3,k.beam);rect(c,62,9,1,3,k.beam);rect(c,32,12,34,9,k.ink);rect(c,33,13,32,7,k.led0);
 [[14,[[34,2,k.ledR],[38,5,k.ledO],[45,3,k.ledO],[50,6,k.ledG],[59,4,k.ledO]]],[17,[[34,2,k.ledG],[38,4,k.ledO],[44,5,k.ledO],[51,5,k.ledG],[59,4,k.ledO]]]].forEach(([y,S])=>S.forEach(([x,w,col])=>rect(c,x,y,w,1,col)));
 if(k.lglow)blob(c,49,16,18,6,k.ledGl);                   // ไฟใต้หลังคา (กลางคืนแสงตกบนพื้นชานชาลา)
 rect(c,100,9,1,5,k.beam);rect(c,128,9,1,5,k.beam);rect(c,92,14,45,15,k.ink);rect(c,93,15,43,13,k.sign);rect(c,93,24,43,4,k.signb);
 [[109,17,2,2],[112,15,2,2],[116,15,2,2],[119,17,2,2],[112,19,6,3],[111,20,8,1]].forEach(([x,y,w,h])=>rect(c,x,y,w,h,k.ink)); // ป้ายสถานีเป็นรูปอุ้งเท้า (ไม่ใช้ตัวอักษรปลอม)
 rect(c,95,25,1,2,k.sign);rect(c,96,24,1,4,k.sign);rect(c,97,25,2,2,k.sign);rect(c,134,25,1,2,k.sign);rect(c,133,24,1,4,k.sign);rect(c,131,25,2,2,k.sign);                                             // ลูกศรสถานีถัดไปซ้าย/ขวา
 blob(c,97,19,2.6,2.6,k.tst);blob(c,97,19,1.5,1.5,k.sign);rect(c,92,29,45,1,k.ink+'55');                                                                   // วงสัญลักษณ์สายรถไฟ
 rect(c,0,70,SW,20,k.plat);rect(c,0,70,SW,1,k.white);rect(c,0,71,SW,1,k.plat2);rect(c,0,73,SW,3,k.edge);for(let x=1;x<SW;x+=3)rect(c,x,74,1,1,k.edge2);for(let x=31;x<SW;x+=32)rect(c,x,77,1,13,k.plat2); // ชานชาลา + แถบเบรลล์
 [40,84].forEach(x=>{rect(c,x,76,5,1,k.mark);rect(c,x+1,77,3,1,k.mark);dot(c,x+2,78,k.mark)});                                                       // เครื่องหมายจุดขึ้นรถบนพื้น
 if(k.lglow)[12,78].forEach(x=>blob(c,x,80,20,6,k.lglow));if(k.vglow)blob(c,12,62,16,17,k.vglow);
 // ตู้กดน้ำ: ไฟหัวตู้ ตู้โชว์เครื่องดื่ม 3 ชั้น (กระป๋อง/ขวด ฝาสีเทา) ปุ่มกดใต้แต่ละชั้น ช่องหยอดเหรียญ ช่องธนบัตร จอเล็ก ช่องรับของมีฝาพับ
 rect(c,3,44,19,36,k.vm);rect(c,3,44,19,2,k.vm2);rect(c,20,46,2,34,k.vm2);rect(c,5,46,15,2,k.vmg);rect(c,5,49,11,17,k.vmw);
 const DR=[k.d1,k.d2,k.d3,k.d4,k.d5,k.d6];[50,55,60].forEach((ry,r)=>{for(let j=0;j<4;j++){const x=6+j*2.6|0,col=DR[(r*4+j*3)%6],can=(r+j)%3===0;rect(c,x,ry+(can?1:0),2,can?3:4,col);dot(c,x,ry+(can?1:0),can?k.cup||'#ddd':k.cap);if(!can)dot(c,x+1,ry+1,k.cap)}
  rect(c,5,ry+4,11,1,k.vm2);for(let j=0;j<4;j++)dot(c,6+j*2.6|0,ry+4,(r+j)%2?k.btn1:k.btn2)});
 rect(c,16,49,3,2,k.lcd);dot(c,17,50,k.ledG);rect(c,17,53,2,1,k.ink);rect(c,16,56,3,1,k.ink);dot(c,18,59,k.vmg);rect(c,16,62,3,2,k.vm2);
 rect(c,5,68,11,5,k.vm2);rect(c,6,69,9,3,k.ink);rect(c,6,69,9,1,k.vm2);rect(c,3,78,19,2,k.vm2);dot(c,5,47,k.white);
 // ถังขยะแยกขวด/กระป๋อง สองถัง ฝามีรูกลม
 [[23,k.bin1],[28,k.bin2]].forEach(([x,col])=>{rect(c,x,71,4,9,col);rect(c,x,70,4,1,k.pil3);blob(c,x+2,71.5,1.2,.9,k.ink);rect(c,x+3,72,1,8,k.pil2+'88');rect(c,x,74,4,1,k.white)});
 // เก้าอี้พลาสติกขึ้นรูปสี่ที่นั่งบนโครงเหล็ก
 for(let i=0;i<4;i++){const x=96+i*8;rect(c,x,63,7,6,k.seat);dot(c,x,63,k.plat);dot(c,x+6,63,k.plat);rect(c,x+1,64,1,4,k.seat3);rect(c,x+6,64,1,5,k.seat2);rect(c,x,69,7,2,k.seat2);rect(c,x,69,7,1,k.seat3)}
 rect(c,95,71,36,1,k.pil2);rect(c,97,72,1,8,k.pil2);rect(c,128,72,1,8,k.pil2);rect(c,112,72,1,8,k.pil2);rect(c,96,79,3,1,k.pil2);rect(c,127,79,3,1,k.pil2);
 blob(c,112,80.4,17,1,k.shade);blob(c,12,80.4,11,1,k.shade);blob(c,27,80.4,6,.8,k.shade);blob(c,150,88.6,7,1.4,k.shade)}
function stationFg(c,k){rect(c,146,9,8,81,k.pil);rect(c,146,9,2,81,k.pil3);rect(c,152,9,2,81,k.pil2);rect(c,145,86,10,4,k.pil2);
 blob(c,150,30,5,5,k.ink);blob(c,150,30,4,4,k.clock); // หน้าปัดนาฬิกา (เข็มวาดใน stationFront ตามเวลาจริง)
 rect(c,146,38,8,8,k.ink);rect(c,147,39,6,6,k.sign);rect(c,150,40,1,4,k.ink);dot(c,149,41,k.ink);rect(c,149,44,3,1,k.ink);                                 // ป้ายชานชาลาเลข 1
 rect(c,145,49,10,6,k.ink);rect(c,146,50,8,4,k.edge);rect(c,147,52,5,1,k.ink);dot(c,151,51,k.ink);dot(c,151,53,k.ink);dot(c,152,52,k.ink)}                   // ป้ายทางออกสีเหลืองลูกศรขวา
function stationFront(c,k,A){const d=A.d,m=d.getMinutes(),h=d.getHours()%12+m/60;handAt(c,150,30,h/12*2*Math.PI,2,k.ink);handAt(c,150,30,m/60*2*Math.PI,3.2,k.ink);dot(c,150,30,k.ink)}
const stationTick=A=>{const x=trainX(A);return(A.P&&season(A.ms)==='winter'&&snowDay(A.ms)?(A.ms/120|0)+'|':'')+A.d.getHours()*60+A.d.getMinutes()+'|'+cloudKey(A)+'|'+(x==null?'':x)};

// สีตามฤดูของแต่ละฉาก (ทับชุดสีหลัก · รุ่งเช้า/พลบค่ำใช้ชุดสว่างของฤดูแล้วทับด้วย TWI) · sn/sn2 = หิมะ/เงาหิมะ (มีเฉพาะหน้าหนาว)
const SNOW={light:{sn:'#fbfcfe',sn2:'#dbe4ee'},dark:{sn:'#c3cddc',sn2:'#8f9db2'}},
 GSEA={spring:{light:{mp0:'#d68ea6',mp2:'#e9a8bd',mp1:'#f5c4d3',mp3:'#fde3ec',grass:'#bde09a',grass2:'#a3cd7f',far:'#9cc4a2'},dark:{mp0:'#6b4253',mp2:'#875368',mp1:'#a36b82',mp3:'#bf8a9f'}},
  summer:{light:{mp0:'#4b7b43',mp2:'#62964d',mp1:'#82b55f',mp3:'#acd585',grass:'#a8d27f',grass2:'#8fbf6a',far:'#86b38f'},dark:{mp0:'#22371e',mp2:'#2e4828',mp1:'#3d5e33',mp3:'#527545'}},
  autumn:{light:{grass:'#c2cf8c',grass2:'#a9b974',far:'#aab88a'},dark:{grass:'#46563a',grass2:'#3b4a31',far:'#2b3529'}},
  winter:{light:{grass:'#d3d8c6',grass2:'#bcc3ab',far:'#a2b2a7',mtn:'#c3d2d0',snow:'#fbfcfe',...SNOW.light},dark:{grass:'#3a483d',grass2:'#323e35',far:'#25322e',snow:'#b3bfd0',...SNOW.dark}}},
 RSEA={spring:{light:{hill:'#bfe0c0'},dark:{}},summer:{light:{hill:'#a8d3b2'},dark:{hill:'#16253a'}},autumn:{light:{hill:'#d9d3a6'},dark:{hill:'#1f2638'}},
  winter:{light:{hill:'#eef3f7',roof:'#f7f9fc',...SNOW.light},dark:{hill:'#2f3a50',roof:'#535d72',...SNOW.dark}}},
 KSEA={winter:{light:{...SNOW.light},dark:{...SNOW.dark}}},
 TSEA={winter:{light:{btop:'#f7f9fc',...SNOW.light},dark:{btop:'#8d99ad',...SNOW.dark}}};
// ===== ร้านสะดวกซื้อ (コンビニ · v120): ผนังขาวแถบสีหัวร้าน · ประตูกระจกซ้ายเห็นถนนกับฟ้า ชั้นนิตยสารใต้หน้าต่าง
// ตู้แช่เครื่องดื่มสามบาน (กลางคืนไฟในตู้สว่าง) · เคาน์เตอร์: หม้อโอเด้ง ตู้ของทอดอุ่น เครื่องคิดเงิน เครื่องชงกาแฟ · ฉากหน้า: ตะกร้าซ้อนกัน
// ขยับ: ไอโอเด้ง ป้ายโปรโมชันห้อยแกว่ง (สีตามฤดู) · ป้าย/ฉลากเป็นแถบสี
const KBCOL={light:{hillF:'#a9c7b9',pad0:'#8fc46a',pad1:'#a5d47e',pad2:'#78b05a',house:'#f3e8d6',roofD:'#5f6a74',pole:'#7a6a5a',wire:'#5a5048',wall:'#f6f4ef',wall2:'#ebe7de',band:'#3fa7a0',band2:'#f2c14e',band3:'#2f7f7a',floor:'#e9e7e1',floor2:'#dcd9d1',frame:'#b9bec4',frame2:'#8f959c',
  sky:'#cfe9f7',sky2:'#e6f4fb',sun:'#ffd987',cloud:'#ffffff',cloud2:'#d5e2ee',moon:null,bldg:'#e3d5c3',bldg2:'#cdbca6',bwin:'#a9cde3',road:'#b9b5ae',road2:'#a5a19a',walk:'#ddd6ca',
  fr:'#e3e7ea',fr2:'#aab2b9',frIn:'#eef6fa',frSh:'#c3ccd3',glare:'rgba(255,255,255,.55)',frGlow:null,b1:'#e86b5a',b2:'#5aa0d6',b3:'#f2c14e',b4:'#7bc47f',b5:'#ffffff',b6:'#b58ad6',cap:'#5b6168',
  mag:'#cfd3d8',mag2:'#a9afb6',m1:'#f08a5d',m2:'#6fb7e0',m3:'#e26a8d',m4:'#8fcf7a',m5:'#f7d35c',
  ctop:'#d8d3ca',ctop2:'#f1ede6',cfront:'#b8c3c9',cfront2:'#9aa6ad',reg:'#5b6168',reg2:'#868d93',scr:'#9fd7c9',pot:'#c9ccd0',pot2:'#9aa0a6',broth:'#d9a75a',daikon:'#f4ead0',kon:'#8a7a70',egg:'#f3d79a',
  case:'#f7ecd0',case2:'#e8c98a',chick:'#d99a45',chick2:'#b8782c',cof:'#4f565e',cof2:'#7a838b',cup:'#ffffff',steam:'#ffffff',post:'#5fb3e0',post2:'#7bc4c0',post3:'#f7d35c',
  bask:'#e5534b',bask2:'#b83a33',bask3:'#f2837b',pop:'#5fb3e0',pop2:'#ffffff',str:'#8f959c',line:'#5b5f66',shade:'rgba(60,60,70,.12)'},
 dark:{hillF:'#2e4038',pad0:'#3f5a36',pad1:'#4a6a3f',pad2:'#34502f',house:'#5d564c',roofD:'#363c44',pole:'#4a4038',wire:'#2e2824',wall:'#6c6f76',wall2:'#62656c',band:'#2b6f6b',band2:'#a8873a',band3:'#215552',floor:'#5a5d63',floor2:'#505359',frame:'#7d838a',frame2:'#61676e',
  sky:'#1e2b47',sky2:'#273860',moon:'#f4e4a6',bldg:'#303a50',bldg2:'#283146',bwin:'#f6d27a',road:'#2c3140',road2:'#252937',walk:'#3a4050',
  fr:'#8a9097',fr2:'#6a7077',frIn:'#e4f1f7',frSh:'#b7c3cb',glare:'rgba(255,255,255,.35)',frGlow:'rgba(220,240,250,.10)',b1:'#e86b5a',b2:'#5aa0d6',b3:'#f2c14e',b4:'#7bc47f',b5:'#ffffff',b6:'#b58ad6',cap:'#4a4f56',
  mag:'#7d828a',mag2:'#646970',m1:'#a8654a',m2:'#4f7f9c',m3:'#9c4f68',m4:'#64905a',m5:'#a89448',
  ctop:'#8f8a82',ctop2:'#a5a098',cfront:'#646c73',cfront2:'#555c63',reg:'#3a3e44',reg2:'#565b61',scr:'#7fd7c4',pot:'#8f9398',pot2:'#6c7076',broth:'#b88a48',daikon:'#d9cfb4',kon:'#5e544d',egg:'#d4b97c',
  case:'#f2dca8',case2:'#c9a462',chick:'#c98a3a',chick2:'#9c6826',cof:'#33383e',cof2:'#545b62',cup:'#d9d6cf',steam:'#e8e6e1',post:'#3f7fa6',post2:'#4f8c89',post3:'#a8944a',
  bask:'#a8403a',bask2:'#7f2c27',bask3:'#bd5f57',pop:'#3f7fa6',pop2:'#d9d6cf',str:'#61676e',line:'#c9c6bf',shade:'rgba(0,0,0,.25)'}};
// สีป้ายโปรโมชันกับโปสเตอร์ตามฤดู (ใบไม้ผลิชมพูซากุระ · ร้อนฟ้า · ใบไม้ร่วงส้ม · หนาวแดง) · หนาว: หิมะบนถนนและหลังคาตึกฝั่งตรงข้าม
const KBSEA={spring:{light:{pop:'#f4a6bf',post:'#f4a6bf',pad0:'#a9cfd6',pad1:'#c8e3e6',pad2:'#8fb98a'},dark:{pop:'#a86a80',post:'#a86a80',pad0:'#3c5a6e',pad1:'#4f6f82',pad2:'#3a5a3f'}},autumn:{light:{pop:'#e8873a',post:'#e8873a',pad0:'#e2c46a',pad1:'#efd88a',pad2:'#c9a64a',hillF:'#b9b79a'},dark:{pop:'#a86230',post:'#a86230',pad0:'#6e5c2c',pad1:'#84703a',pad2:'#5c4c24'}},
 winter:{light:{pop:'#d9534f',post:'#d9534f',pad0:'#eef2f6',pad1:'#dbe4ee',pad2:'#c9b89a',hillF:'#c9d6e0',...SNOW.light},dark:{pop:'#9c3d3a',post:'#9c3d3a',pad0:'#59627a',pad1:'#4d556b',pad2:'#5e5446',hillF:'#4a5468',...SNOW.dark}}}; // โปสเตอร์โปรโมชันบนกระจกสีเดียวกับป้ายห้อย
function kbBg(c,k){const wi=k.season==='winter';
 rect(c,0,0,SW,71,k.wall);for(let x=7;x<SW;x+=14)rect(c,x,8,1,63,k.wall2);rect(c,0,0,SW,5,k.band);rect(c,0,5,SW,1,k.band2);rect(c,0,6,SW,2,k.band3);   // ผนัง + แถบสีหัวร้าน
 // ประตูกระจกเลื่อน: ฟ้า ถนนชนบท (แผนที่เมือง: ร้านอยู่หัวมุมถนนสายเก่านอกย่านสถานี) เนินไกล ทุ่งนาตามฤดู บ้านเตี้ย เสาไฟมีสายไฟ ทางเท้า ถนน (พระจันทร์สูงสุดกลางบานซ้ายบน ขึ้นตกหลังเนิน)
 rect(c,2,10,40,48,k.frame);rect(c,4,12,36,44,k.sky);rect(c,4,30,36,14,k.sky2);
 if(k.moon)moonSky(c,[[8,15],[16,20],[30,14],[35,22],[25,25]],moonXY(13,16,3,40,18),k.moon);else{c.drawImage(cloudImg(k,14,5,11),6,15);c.drawImage(cloudImg(k,9,4,13),28,19)}
 poly(c,[[4,34],[10,31],[17,33],[25,30],[33,32.5],[40,31],[40,38],[4,38]],k.hillF);
 [[36,2,0],[38,3,1],[41,3,0]].forEach(([y,h,i])=>{rect(c,4,y,36,h,i?k.pad1:k.pad0);for(let x=5+(y%4)*2;x<40;x+=10)rect(c,x,y,1,h,k.pad2)});rect(c,4,38,36,1,k.pad2);
 for(let x=5;x<40;x+=2){const se=k.season;if(se==='spring'&&x%6===1)dot(c,x,37,k.sky2);if(se==='summer')dot(c,x,40+(x%4>>1),k.pad2);if(se==='autumn'&&x%3===0)dot(c,x,42,k.pad2);if(wi&&x%3===1)dot(c,x,42,k.pad2)}
 [[25,35,9],[34,36,6]].forEach(([x,y,w])=>{rect(c,x,y+2,w,6-(y-35),k.house);rect(c,x-1,y,w+2,2,k.roofD);if(wi)rect(c,x-1,y,w+2,1,k.sn);if(k.moon)dot(c,x+2,y+3,k.lit||k.bwin)});
 [[9,20],[31,23]].forEach(([x,y])=>{rect(c,x,y,1,44-y,k.pole);rect(c,x-2,y+1,5,1,k.pole)});for(let x=4;x<40;x++){const t=(x-9)/22,sag=Math.round(2.5*Math.sin(Math.max(0,Math.min(1,t))*Math.PI));dot(c,x,(x<9?21:x>31?24:21+Math.round(t*3)+sag),k.wire)}
 rect(c,4,44,36,4,k.walk);rect(c,4,48,36,8,k.road);for(let x=6;x<40;x+=8)rect(c,x,51,4,1,k.road2);if(wi){[[6,44,8],[20,45,10],[30,44,6]].forEach(([x,y,w])=>rect(c,x,y,w,1,k.sn));rect(c,4,48,36,1,k.sn2)}
 rect(c,21,12,2,44,k.frame);rect(c,4,40,36,1,k.frame2);rect(c,18,34,2,6,k.frame2);rect(c,24,34,2,6,k.frame2);rect(c,2,10,40,1,k.frame2);  // กรอบกลางบานเลื่อน มือจับ
 [[6,23,5,6,k.post],[33,41,6,7,k.post2],[9,41,4,5,k.post3]].forEach(([x,y,w,h,col])=>{rect(c,x,y,w,h,col);rect(c,x+1,y+1,w-2,1,k.pop2);rect(c,x+1,y+3,w-3,1,k.pop2+'aa')}); // โปสเตอร์ติดกระจก (แถบ ไม่มีตัวหนังสือ)
 // ชั้นนิตยสารใต้หน้าต่าง: นิตยสารเรียงเอียง ปกสีต่างๆ
 rect(c,2,58,40,13,k.mag);rect(c,2,58,40,1,k.ctop2);rect(c,2,64,40,1,k.mag2);rect(c,2,70,40,1,k.mag2);
 [k.m1,k.m2,k.m3,k.m4,k.m5,k.m2,k.m1,k.m4,k.m3,k.m5].forEach((col,i)=>{const x=3+i*4;rect(c,x,59,3,5,col);dot(c,x,59,k.pop2);rect(c,x+1,65,3,5,[k.m5,k.m3,k.m2,k.m1,k.m4][i%5]);dot(c,x+1,66,k.pop2)});
 // ตู้แช่เครื่องดื่มสามบาน: ไฟในตู้ ชั้นวางขวด ฝาขวด มือจับ ประกายกระจกเฉียง
 rect(c,45,9,61,3,k.band);rect(c,45,11,61,1,k.band3);[[47,6],[60,8],[75,5],[88,7]].forEach(([x,w])=>rect(c,x,10,w,1,k.pop2));                          // แถบหมวดบนตู้ (แถบสี)
 if(k.frGlow)blob(c,75,40,38,30,k.frGlow);
 rect(c,45,12,61,59,k.fr2);rect(c,46,13,59,57,k.fr);
 [47,66,85].forEach((x,d)=>{rect(c,x,14,18,52,k.frIn);[24,36,48,60].forEach(y=>rect(c,x,y,18,1,k.frSh));
  [16,28,40,52].forEach((y,r)=>{const C=[[k.b1,k.b2,k.b3],[k.b4,k.b5,k.b2],[k.b3,k.b6,k.b1],[k.b5,k.b4,k.b3]][(r+d)%4];for(let i=0;i<6;i++){const bx=x+1+i*3,col=C[i%3];rect(c,bx,y+2,2,6,col);dot(c,bx,y+1,k.cap);if(r%2)dot(c,bx+1,y+4,k.pop2)}});
  rect(c,x+15,30,1,12,k.fr2);rect(c,x+16,30,1,12,k.frame);for(let i=0;i<8;i++)dot(c,x+2+i,22-i,k.glare);for(let i=0;i<5;i++)dot(c,x+4+i,46-i,k.glare)});
 rect(c,45,66,61,5,k.fr2);rect(c,46,67,59,1,k.frame);
 // ผนังหลังเคาน์เตอร์: บอร์ดเมนูของทอด (ภาพ ไม่มีตัวหนังสือ) ชั้นวางของเล็ก
 rect(c,112,14,30,18,k.frame2);rect(c,113,15,28,16,k.ctop2);[[115,17],[124,17],[133,17]].forEach(([x,y],i)=>{blob(c,x+3,y+5,3,2.4,[k.chick,k.broth,k.egg][i]);rect(c,x,y+9,7,1,k.post2);rect(c,x+2,y+11,3,1,k.band)});
 rect(c,146,16,12,1,k.frame2);[[147,k.m1],[150,k.m2],[153,k.m5]].forEach(([x,col])=>{rect(c,x,11,2,5,col);dot(c,x,11,k.pop2)});rect(c,146,26,12,1,k.frame2);[[147,k.b4],[151,k.b6],[155,k.b3]].forEach(([x,col])=>rect(c,x,22,3,4,col));
 // เคาน์เตอร์
 rect(c,108,50,52,3,k.ctop);rect(c,108,50,52,1,k.ctop2);rect(c,109,53,51,18,k.cfront);for(let x=121;x<SW;x+=13)rect(c,x,54,1,15,k.cfront2);rect(c,109,53,51,1,k.cfront2);rect(c,109,68,51,3,k.cfront2);
 // หม้อโอเด้ง: ช่องแบ่ง น้ำซุป หัวไชเท้า ไข่ คอนเนียคุสามเหลี่ยม
 rect(c,110,45,16,5,k.pot2);rect(c,111,45,14,4,k.broth);rect(c,110,44,16,1,k.pot);[115,120].forEach(x=>rect(c,x,45,1,4,k.pot));
 blob(c,112.6,46.4,1.6,1.2,k.daikon);blob(c,117.6,46.4,1.4,1.4,k.egg);poly(c,[[121.5,48],[124.5,48],[123,45.2]],k.kon);dot(c,112,46,k.cup);
 // ตู้ของทอดอุ่น (ไฟอุ่นในตู้)
 rect(c,128,38,12,12,k.frame2);rect(c,129,39,10,10,k.case);rect(c,129,44,10,1,k.case2);[[131,42],[135,42],[133,47],[136,47]].forEach(([x,y])=>{blob(c,x,y,1.6,1.2,k.chick);dot(c,x,y+1,k.chick2)});dot(c,130,40,k.cup);
 // เครื่องคิดเงิน + เครื่องชงกาแฟ
 rect(c,143,44,9,6,k.reg);rect(c,144,41,7,3,k.reg2);rect(c,145,42,5,1,k.scr);[[144,46],[146,46],[148,46],[144,48],[146,48],[148,48]].forEach(([x,y])=>dot(c,x,y,k.reg2));
 rect(c,153,34,7,16,k.cof);rect(c,153,34,7,2,k.cof2);rect(c,154,37,5,3,k.scr);rect(c,155,44,3,1,k.cof2);rect(c,155,47,3,3,k.cup);
 for(let y=71;y<SH;y+=5)for(let x=0;x<SW;x+=10)rect(c,x,y,10,5,((x/10+(y-71)/5)&1)?k.floor2:k.floor);rect(c,0,71,SW,1,k.floor2); // พื้นกระเบื้อง
 blob(c,75,72,30,1.2,k.shade);blob(c,150,88.6,10,1.4,k.shade)}
// ตะกร้าซ้อนกัน (ฉากหน้า แมวแอบได้)
function kbFg(c,k){for(let i=0;i<3;i++){const y=74-i*3;poly(c,[[142,y],[159,y],[157,86],[144,86]],i?k.bask2:k.bask);rect(c,142,y,17,1,k.bask3);if(!i)for(let x=145;x<157;x+=3)rect(c,x,y+3,1,8,k.bask2)}
 rect(c,148,64,5,1,k.bask2);rect(c,147,65,1,3,k.bask2);rect(c,153,65,1,3,k.bask2)}
// ขยับ: ไอโอเด้งสามสาย ป้ายโปรโมชันห้อยแกว่งเบาๆ · หิมะ/กลีบ/ใบตกนอกประตูกระจก
function kbLive(c,k,A){const se=season(A.ms);if(se!=='summer')fallIn(c,k,A,se,[4,12,36,36],se==='winter'?11:4);
 const sw=A.P?Math.round(Math.sin(A.ms/900)*1.2):0;rect(c,70,0,1,6+sw,k.str);rect(c,82,0,1,6-sw,k.str);poly(c,[[66,6+sw],[86,6-sw],[86,12-sw],[66,12+sw]],k.pop);
 rect(c,69,8+(sw>0?1:0),14,1,k.pop2);rect(c,71,10,9,1,k.pop2+'aa');
 if(!A.P)return;for(let i=0;i<3;i++){const p=(A.ms/1900+i/3)%1,y=43-p*10,x=114+i*4+Math.sin(p*6+i*2)*1.2;c.globalAlpha=(1-p)*.7;rect(c,Math.round(x),Math.round(y),1,2,k.steam)}c.globalAlpha=1}
const kbTick=A=>A.P?''+(A.ms/120|0):'';
// ===== ห้องเรียน (きょうしつ · v120): หน้าต่างซ้ายเห็นสนามโรงเรียนกับต้นไม้ตามฤดู ม่านขาวไหวตามลม · กระดานดำ (เส้นชอล์กแทนตัวหนังสือ + รูปแมวชอล์ก)
// โต๊ะครู · นาฬิกาเหนือกระดาน (เวลาจริง) · บอร์ดประกาศ ช่องเก็บของมีกระเป๋า · ฉากหน้า: โต๊ะนักเรียนกับเก้าอี้ (แมวแอบได้)
const CLCOL={light:{fj:'#a9bfd6',fjs:'#f6f9fc',mtnF:'#a9c7b9',pad0:'#8fc46a',pad1:'#a5d47e',pad2:'#78b05a',wall:'#f3ead9',wall2:'#e8dcc6',trim:'#b98c5e',wains:'#d9c3a0',wains2:'#c9b08a',board:'#3f6b55',board2:'#355c49',boardF:'#9c7650',boardF2:'#7d5b3a',
  chalk:'#f3efe4',chalkY:'#f2d36b',chalkP:'#f2a0b4',tray:'#8a6a4a',er:'#5b6aa0',er2:'#ece6da',floor:'#d9b48a',floor2:'#c89f73',seam:'#b88d62',
  desk:'#c99a62',desk2:'#a87a44',desk3:'#e2ba82',metal:'#9aa3ab',metal2:'#737b83',seat:'#b98c5e',frame:'#c6cbd0',frame2:'#9aa1a8',
  sky:'#cfe9f7',sky2:'#e6f4fb',sun:'#ffd987',cloud:'#ffffff',cloud2:'#d5e2ee',moon:null,yard:'#e3cfa8',yard2:'#d4bd92',fence:'#9aa1a8',bldg:'#efe6d6',bldg2:'#d9cdb8',bwin:'#a9cde3',
  bark:'#7a5a40',bark2:'#9b7a5a',bark3:'#57402e',mp0:'#4f8a45',mp1:'#86b96f',mp2:'#65985a',mp3:'#a8d48f',
  cur:'#f4f7f8',cur2:'#dce4e8',clk:'#fffaf0',hand:'#3a3634',notice:'#dcbf8f',notice2:'#c4a473',n1:'#fffaf0',n2:'#fde9a6',n3:'#d6ebf6',n4:'#f7c9cf',pin:'#e05a5a',
  cub:'#c99a62',cub2:'#a87a44',cub3:'#8a6040',g1:'#e86b5a',g2:'#5aa0d6',g3:'#f2c14e',g4:'#7bc47f',g5:'#b58ad6',line:'#6b4f3a',shade:'rgba(90,58,38,.14)'},
 dark:{fj:'#34435c',fjs:'#8d9bb0',mtnF:'#2e4038',pad0:'#3f5a36',pad1:'#4a6a3f',pad2:'#34502f',wall:'#4a4250',wall2:'#433b49',trim:'#6e5844',wains:'#55493f',wains2:'#4a3f36',board:'#24392f',board2:'#1e3128',boardF:'#5e4836',boardF2:'#4a3829',
  chalk:'#c9c6bc',chalkY:'#b8a35a',chalkP:'#b8778a',tray:'#4f3d2e',er:'#3e4870',er2:'#a9a49a',floor:'#5a4a3c',floor2:'#4f4134',seam:'#463a2e',
  desk:'#7d6448',desk2:'#62503b',desk3:'#94785a',metal:'#6a7178',metal2:'#53595f',seat:'#6e5844',frame:'#6f747a',frame2:'#575c62',
  sky:'#1e2b47',sky2:'#273860',moon:'#f4e4a6',yard:'#3a3a44',yard2:'#33333c',fence:'#565c66',bldg:'#3a3f52',bldg2:'#323647',bwin:'#f6d27a',
  bark:'#4a3a2c',bark2:'#5e4a38',bark3:'#30251c',mp0:'#253b25',mp1:'#466c3e',mp2:'#34512f',mp3:'#5f8c54',
  cur:'#8f949c',cur2:'#747a82',clk:'#d9ccb4',hand:'#2e221c',notice:'#7a6448',notice2:'#62503b',n1:'#b9b4a8',n2:'#b5a978',n3:'#8aa0ad',n4:'#a8838a',pin:'#a8403a',
  cub:'#7d6448',cub2:'#62503b',cub3:'#4f3f2e',g1:'#a8504a',g2:'#4a789c',g3:'#a8904a',g4:'#5a8c5c',g5:'#7f6a9c',line:'#c9b9a5',shade:'rgba(0,0,0,.28)'}};
// ต้นไม้นอกหน้าต่างตามฤดู: ใบไม้ผลิซากุระ · ร้อนเขียว (ชุดหลัก) · ใบไม้ร่วงแปะก๊วยเหลือง · หนาวกิ่งโล่งหิมะ
const CLSEA={spring:{light:{mp0:'#d97b93',mp1:'#f2a0b4',mp2:'#e88aa3',mp3:'#fcd3de',pad0:'#a9cfd6',pad1:'#c8e3e6',pad2:'#8fb98a'},dark:{mp0:'#7a4656',mp1:'#a86a80',mp2:'#91566a',mp3:'#c48ea0',pad0:'#3c5a6e',pad1:'#4f6f82',pad2:'#3a5a3f'}},
 autumn:{light:{mp0:'#c99a2e',mp1:'#f2c94e',mp2:'#e0b23a',mp3:'#f8e08a',pad0:'#e2c46a',pad1:'#efd88a',pad2:'#c9a64a',mtnF:'#b9b79a'},dark:{mp0:'#6e5420',mp1:'#a8903a',mp2:'#8c742c',mp3:'#c4ac5a',pad0:'#6e5c2c',pad1:'#84703a',pad2:'#5c4c24'}},
 winter:{light:{yard:'#eef2f6',yard2:'#dbe4ee',pad0:'#eef2f6',pad1:'#dbe4ee',pad2:'#c9b89a',mtnF:'#c9d6e0',...SNOW.light},dark:{yard:'#59627a',yard2:'#4d556b',pad0:'#59627a',pad1:'#4d556b',pad2:'#5e5446',mtnF:'#4a5468',...SNOW.dark}}};
function clBg(c,k){const se=k.season,wi=se==='winter';
 rect(c,0,0,SW,52,k.wall);for(let y=4;y<50;y+=8)for(let x=y%16===4?2:6;x<SW;x+=8)dot(c,x,y,k.wall2);rect(c,0,52,SW,17,k.wains);for(let x=15;x<SW;x+=16)rect(c,x,53,1,16,k.wains2);
 rect(c,0,51,SW,1,k.trim);rect(c,0,69,SW,2,k.trim);
 // หน้าต่าง: ฟ้า ภูเขาไกลกับฟูจิเล็ก ทุ่งนาตามฤดู รั้ว สนามดิน ต้นไม้ตามฤดู (พระจันทร์สูงสุดกลางบานบน) · แผนที่เมือง: โรงเรียนติดทุ่งนา ฟูจิอยู่ทางเหนือ
 rect(c,1,5,30,46,k.frame);rect(c,3,7,26,42,k.sky);rect(c,3,26,26,12,k.sky2);
 if(k.moon)moonSky(c,[[6,10],[12,16],[24,11],[27,19]],moonXY(15,13,2,30,16),k.moon);else c.drawImage(cloudImg(k,13,5,15),5,11);
 const fs={winter:3,spring:2,autumn:1}[se]||0;for(let y=22;y<31;y++){const hw=1+(y-22)*1.3+(y-22)**2*.12;for(let x=Math.max(17,Math.ceil(23-hw));x<=Math.min(28,23+hw);x++)dot(c,x,y,y-22<fs?k.fjs:k.fj)}
 poly(c,[[3,30],[7,28],[12,29.5],[18,27.5],[24,29.5],[29,28.5],[29,32],[3,32]],k.mtnF);
 // ทุ่งนา: แปลงเรียงเป็นแถว คันนาคั่น ใบไม้ผลิน้ำขังมีประกายฟ้า ร้อนกล้าเป็นแถว ใบไม้ร่วงรวงทอง หนาวหิมะมีตอซัง
 [[31,2,0],[33,2,1],[35,3,0]].forEach(([y,h,i])=>{rect(c,3,y,26,h,i?k.pad1:k.pad0);for(let x=3+(y%3)*3;x<29;x+=9)rect(c,x,y,1,h,k.pad2)});rect(c,3,33,26,1,k.pad2);
 for(let x=4;x<29;x+=2){if(se==='spring'&&x%6===0)dot(c,x,32,k.sky2);if(se==='summer')dot(c,x,35+(x%4>>1),k.pad2);if(se==='autumn'&&x%3===0)dot(c,x,36,k.pad2);if(wi&&x%3===1)dot(c,x,36,k.pad2)}
 rect(c,3,38,26,11,k.yard);for(let x=4;x<29;x+=5)dot(c,x,43+(x%3),k.yard2);rect(c,3,37,26,1,k.fence);for(let x=4;x<29;x+=3)rect(c,x,34,1,4,k.fence);
 const TB=[k.bark,k.bark2,k.bark3];wood(c,[[[[9,47],[9,38],[10,30],[9,24]],2.6,1.4],[[[9,36],[5,31],[4,27]],1.5,1],[[[10,32],[14,28],[16,24]],1.5,1],[[[9,28],[7,23]],1.2,.9]],TB,5);
 if(wi)[[3,26],[6,22],[13,27],[15,23],[8,23]].forEach(([x,y])=>rect(c,x,y,2,1,k.sn));else[[9,22,6,3,3],[4,27,4,2.4,5],[15,24,4,2.4,7],[11,28,5,2.6,9]].forEach(([x,y,w,h,sd])=>clumpPad(c,x,y,w,h,[k.mp0,k.mp2,k.mp1,k.mp3],sd));
 if(se==='autumn'||se==='spring'){const R=rng(se==='autumn'?91:93);for(let i=0;i<14;i++)dot(c,3+((R()*20)|0),44+((R()*5)|0),i%2?k.mp1:k.mp3)}
 rect(c,15,7,2,42,k.frame);rect(c,3,26,26,1,k.frame2);rect(c,0,49,32,3,k.frame2);rect(c,0,49,32,1,k.frame);
 // กระดานดำ: กรอบไม้ เส้นชอล์กแทนประโยค วงกลมทำเครื่องหมาย รูปแมวชอล์ก มุมเวรประจำวัน · รางชอล์กมีแปรงลบกระดานและชอล์กสามสี
 const B0=40,B1=120;rect(c,B0,8,B1-B0,33,k.boardF);rect(c,B0+2,10,B1-B0-4,29,k.board);rect(c,B0+2,10,B1-B0-4,1,k.board2);rect(c,B0,40,B1-B0,1,k.boardF2);
 [[45,14,22],[45,18,30],[48,22,26],[45,27,18],[66,27,10],[45,32,24]].forEach(([x,y,w])=>{for(let i=0;i<w;i++)if((i*7+y)%9<7)dot(c,x+i,y,k.chalk)});
 ring(c,59,32,7,2.4,k.chalkY);rect(c,80,14,1,22,k.chalk+'66');
 [[84,16,14],[84,21,10],[84,26,13]].forEach(([x,y,w])=>{for(let i=0;i<w;i++)if((i*5+y)%7<5)dot(c,x+i,y,k.chalk)});rect(c,84,31,6,1,k.chalkP);
 ring(c,108,26,6,5,k.chalk);poly(c,[[102,23],[103,17],[106,21]],k.board);[[102,22],[102,21],[103,20],[103,19],[103,18],[104,19],[105,20],[106,21]].forEach(([x,y])=>dot(c,x,y,k.chalk));
 [[114,22],[113,21],[113,20],[113,19],[113,18],[112,19],[111,20],[110,21]].forEach(([x,y])=>dot(c,x,y,k.chalk));dot(c,106,25,k.chalk);dot(c,110,25,k.chalk);dot(c,108,27,k.chalkP);[[104,28],[112,28]].forEach(([x,y])=>{dot(c,x,y,k.chalk);dot(c,x+(x<108?-1:1),y,k.chalk)}); // รูปแมวชอล์ก
 rect(c,112,12,6,1,k.chalk);rect(c,112,14,4,1,k.chalk);
 rect(c,B0+4,41,B1-B0-8,2,k.tray);rect(c,52,39,6,2,k.er);rect(c,52,39,6,1,k.er2);[[64,k.chalk],[67,k.chalkY],[70,k.chalkP]].forEach(([x,col])=>rect(c,x,40,2,1,col));
 // บอร์ดประกาศ + ช่องเก็บของ (กระเป๋าสีต่างๆ)
 rect(c,126,14,32,22,k.notice2);rect(c,127,15,30,20,k.notice);[[129,17,8,7,k.n1],[139,16,7,9,k.n3],[148,18,7,6,k.n2],[131,26,9,7,k.n4],[143,27,10,6,k.n1]].forEach(([x,y,w,h,col])=>{rect(c,x,y,w,h,col);dot(c,x+Math.floor(w/2),y,k.pin);rect(c,x+1,y+2,w-2,1,k.notice2+'88');rect(c,x+1,y+4,w-3,1,k.notice2+'66')});
 rect(c,124,44,36,25,k.cub3);for(let r=0;r<2;r++)for(let i=0;i<4;i++){const x=125+i*9,y=45+r*12;rect(c,x,y,8,11,k.cub2);rect(c,x,y,8,1,k.cub3);const col=[k.g1,k.g2,k.g3,k.g4,k.g5][(i+r*2)%5];
  if((i+r)%3!==2){rect(c,x+1,y+4,6,7,col);rect(c,x+2,y+3,4,1,col);dot(c,x+3,y+6,k.n1)}else{rect(c,x+1,y+8,6,3,col);rect(c,x+1,y+8,6,1,k.n1)}}
 // โต๊ะครู (หน้ากระดาน): ท็อปไม้ แผงหน้า มีสมุดกับกล่องชอล์ก
 rect(c,64,51,34,3,k.desk3);rect(c,64,53,34,1,k.desk2);rect(c,66,54,30,16,k.desk);rect(c,66,54,30,1,k.desk2);rect(c,68,57,26,10,k.desk2);rect(c,69,58,24,8,k.desk);
 rect(c,70,48,9,3,k.g2);rect(c,71,47,8,1,k.n1);rect(c,86,49,6,2,k.n1);rect(c,86,49,6,1,k.chalkP);
 for(let y=71;y<SH;y+=4){rect(c,0,y,SW,4,k.floor);rect(c,0,y,SW,1,k.floor2);for(let x=(y*7)%26;x<SW;x+=26)rect(c,x,y+1,1,3,k.seam)} // พื้นไม้เป็นแผ่น
 blob(c,81,71.4,18,1,k.shade);blob(c,142,70.8,18,1,k.shade);blob(c,146,88.6,12,1.4,k.shade)}
// โต๊ะนักเรียนกับเก้าอี้ (ฉากหน้า): ท็อปไม้ ขาเหล็ก ช่องใต้โต๊ะมีหนังสือ · เก้าอี้พนักพิงไม้
function clFg(c,k){rect(c,130,61,30,3,k.desk3);rect(c,130,63,30,1,k.desk2);rect(c,132,64,26,5,k.metal2);rect(c,133,65,24,3,k.desk2);rect(c,134,65,4,3,k.g3);rect(c,139,65,3,3,k.g2);
 [[132,69],[156,69]].forEach(([x,y])=>{rect(c,x,y,2,17,k.metal);rect(c,x+1,y,1,17,k.metal2)});rect(c,131,85,5,1,k.metal2);rect(c,155,85,5,1,k.metal2);
 rect(c,144,52,13,8,k.seat);rect(c,144,52,13,1,k.desk3);rect(c,145,60,1,14,k.metal);rect(c,155,60,1,14,k.metal);rect(c,143,72,15,2,k.seat);rect(c,143,72,15,1,k.desk3);rect(c,144,74,1,12,k.metal);rect(c,156,74,1,12,k.metal)}
// ขยับ: ม่านขาวไหวตามลม (หน้าต่างเปิดแง้ม) · นาฬิกาเหนือกระดานตามเวลาจริง · กลีบ/ใบ/หิมะตกนอกหน้าต่าง
function clLive(c,k,A){const se=season(A.ms);if(se!=='summer')fallIn(c,k,A,se,[3,7,26,40],se==='winter'?9:3);
 const w=A.P?Math.sin(A.ms/1300)*1.4+Math.sin(A.ms/530)*.5:0;for(let y=5;y<51;y++){const t=(y-5)/46,o=Math.round(w*t*t),wd=y<30?4+Math.round((30-y)/12):y<33?3:4+Math.round((y-33)/6),x=31+o-(y>=33?Math.round((y-33)/9):0);
  for(let i=0;i<wd;i++)dot(c,x+i,y,(i+(y>>2))%3?k.cur:k.cur2);dot(c,x+wd,y,k.cur2)}rect(c,30,4,8,2,k.frame2);rect(c,31,30,5,2,k.n4); // ม่านรวบข้างหน้าต่าง (ผูกตรงกลาง) ชายม่านไหวตามลม
 const d=A.d,cx=124,cy=7;blob(c,cx+.5,cy+.5,4.6,4.6,k.boardF2);blob(c,cx+.5,cy+.5,3.8,3.8,k.clk);[[cx,cy-3],[cx+3,cy],[cx,cy+3],[cx-3,cy]].forEach(([x,y])=>dot(c,x,y,k.boardF2));
 handAt(c,cx+.5,cy+.5,(d.getHours()%12+d.getMinutes()/60)/12*Math.PI*2,2,k.hand,1);handAt(c,cx+.5,cy+.5,d.getMinutes()/60*Math.PI*2,3.2,k.hand)}
const clTick=A=>A.d.getHours()*60+A.d.getMinutes()+'|'+(A.P?(A.ms/120|0):'');
// ===== ศาลเจ้า (じんじゃ · v120): ฟ้า เมฆลอย ป่าไม้ด้านหลังตามฤดู · โทริอิสีชาด · โคมหิน · แผงเอมะ · หอสักการะ (หลังคาโค้ง เชือกชิเมนาวะกับกระดาษชิเดะ กระดิ่ง กล่องรับเงินทำบุญ บันได)
// ทางเดินหิน + กรวด · ฉากหน้า: สิงโตหิน (โคมะอินุ) บนแท่น แมวแอบได้ · ขยับ: เชือกกระดิ่งแกว่ง แผ่นเอมะไหว · กลีบ/ใบ/หิมะตกทั้งฉาก
const JNCOL={light:{sky:'#cfe9f7',sky2:'#e6f4fb',sun:'#ffd987',cloud:'#ffffff',cloud2:'#d5e2ee',moon:null,for0:'#4f7f47',for1:'#64995a',for2:'#82b86c',for3:'#a9d48c',far:'#97bc9f',
  tor:'#d9503c',tor2:'#a8382a',tor3:'#ef7a62',torK:'#3a3434',torK2:'#575050',roof:'#5f6a70',roof2:'#4a545a',roof3:'#7d898f',eave:'#3c4449',wood:'#c79b6b',wood2:'#a37a50',wood3:'#dcb688',dark:'#5e4630',wall:'#f3eee4',
  rope:'#d9c08a',rope2:'#b89c62',shide:'#ffffff',shide2:'#dfe3e6',bell:'#d6b25e',bell2:'#a8873a',bellR:'#e05a5a',box:'#8a6040',box2:'#6e4a2e',box3:'#a87a50',
  stone:'#c9c3b8',stone2:'#aaa294',stone3:'#e2ddd4',moss:'#9cbf72',path:'#ddd6ca',path2:'#c9c1b2',gravel:'#efe8da',gravel2:'#dcd1bc',lwin:'#f6e7c0',glow:null,
  ema:'#e7cfa0',ema2:'#c9a774',emaR:'#d9503c',rack:'#8a6a4a',bark:'#7a5a40',bark2:'#9b7a5a',bark3:'#57402e',kom:'#c2bcb0',kom2:'#a19a8c',kom3:'#ddd8ce',line:'#5f5a50',shade:'rgba(70,70,60,.16)'},
 dark:{sky:'#1e2b47',sky2:'#273860',moon:'#f4e4a6',for0:'#1d2f22',for1:'#253b25',for2:'#34512f',for3:'#466c3e',far:'#24352f',
  tor:'#8a3428',tor2:'#6a2a20',tor3:'#a8483a',torK:'#1f1c1c',torK2:'#332f2f',roof:'#353c44',roof2:'#2b3138',roof3:'#454d55',eave:'#22272c',wood:'#6e5640',wood2:'#594532',wood3:'#806650',dark:'#2e2219',wall:'#9c978c',
  rope:'#8f7f5a',rope2:'#74663f',shide:'#c9c6bc',shide2:'#a9a69c',bell:'#a8904a',bell2:'#7f6a33',bellR:'#a8403a',box:'#4f3d2e',box2:'#3e2f23',box3:'#62503b',
  stone:'#625d57',stone2:'#4c4843',stone3:'#736e67',moss:'#4f6a40',path:'#57524b',path2:'#4a4640',gravel:'#4c4741',gravel2:'#403b36',lwin:'#f6d27a',glow:'rgba(246,210,122,.18)',
  ema:'#9c8a68',ema2:'#7f6e50',emaR:'#8a3428',rack:'#4f3d2e',bark:'#4a3a2c',bark2:'#5e4a38',bark3:'#30251c',kom:'#6e6a62',kom2:'#57534c',kom3:'#837f76',line:'#b9b3a5',shade:'rgba(0,0,0,.3)'}};
// ป่ารอบศาลเจ้าตามฤดู: ใบไม้ผลิมีซากุระแซม · ร้อนเขียวเข้ม (ชุดหลัก) · ใบไม้ร่วงแปะก๊วยเหลืองกับเมเปิลแดงแซม · หนาวสนเขียวเข้มมีหิมะ
const JNSEA={spring:{light:{for3:'#f2b8c8',for2:'#e899b0'},dark:{for3:'#a86a80',for2:'#7a4656'}},
 autumn:{light:{for2:'#e8b83a',for3:'#f2d36b',for1:'#d9703c'},dark:{for2:'#8c742c',for3:'#a8903a',for1:'#7a3f24'}},
 winter:{light:{for2:'#5f8a5a',for3:'#7aa070',...SNOW.light},dark:{for2:'#2f4a31',for3:'#3e5c40',...SNOW.dark}}};
function jnFar(c,k){sky(c,k,50,[66,9,18,112,30])} // พระจันทร์สูงสุดกลางฟ้าระหว่างโทริอิกับหลังคาหอ ขึ้นตกหลังป่า
// ป่าด้านหลังอยู่หน้าเมฆ: กอไม้ทรงกลมซ้อนกันหลายชั้น สีตามฤดู · หนาวมีหิมะบนยอดกอ
function jnMid(c,k){const wi=k.season==='winter',F=[[-4,30,14],[12,26,13],[28,32,12],[44,35,11],[58,33,12],[74,30,13],[90,27,12],[104,31,11],[118,26,14],[136,29,13],[152,27,14],[4,40,12],[36,42,11],[66,41,12],[98,40,12],[128,41,11]];
 rect(c,0,42,SW,12,k.for0);F.forEach(([x,y,r],i)=>{clumpPad(c,x+r/2,y+r*.5,r,r*.9,[k.for0,k.for1,k.for2,k.for3],51+i*7);if(wi)blob(c,x+r/2,y,r*.6,1.2,k.sn)})} // ป่าศักดิ์สิทธิ์รอบศาลเจ้า สองแถว
function jnBg(c,k){const wi=k.season==='winter';
 // ทางเดินหิน (ซันโด) + กรวด
 rect(c,0,54,SW,36,k.gravel);for(let y=57;y<90;y+=4)for(let x=0;x<SW;x++)if((x*3+y)%17<4)dot(c,x,y+(x%2),k.gravel2);
 for(let y=72;y<90;y+=5)for(let x=(y%10?-6:0);x<SW;x+=12){rect(c,x,y,11,4,k.path);rect(c,x,y,11,1,k.stone3);rect(c,x+11,y,1,4,k.path2)}
 if(wi)[[24,62,9,1.8],[60,66,7,1.6],[86,60,8,1.6],[30,70,6,1.4]].forEach(([x,y,a,b])=>{blob(c,x,y+.3,a,b,k.sn2);blob(c,x,y,a-.8,b-.5,k.sn)});
 // หอสักการะ (ไฮเด็น): ฐานหิน บันได เสาไม้ ผนังด้านในมืด ลูกกรง คานหน้า หลังคาโค้งชายงอน
 rect(c,92,64,68,8,k.stone2);rect(c,92,64,68,1,k.stone3);[[112,66],[112,69]].forEach(([x,y],i)=>{rect(c,x-i*2,y,28+i*4,3,k.stone);rect(c,x-i*2,y,28+i*4,1,k.stone3)});
 rect(c,98,40,62,24,k.dark);rect(c,98,40,62,2,k.wood2);for(let x=104;x<SW;x+=5)rect(c,x,46,1,12,k.wood2);rect(c,98,58,62,2,k.wood);rect(c,98,46,62,1,k.wood);
 [[98,40],[150,40]].forEach(([x,y])=>{rect(c,x,y,4,24,k.wood);rect(c,x,y,1,24,k.wood3);rect(c,x+3,y,1,24,k.wood2)});rect(c,98,36,62,4,k.wood);rect(c,98,36,62,1,k.wood3);rect(c,98,39,62,1,k.wood2);
 poly(c,[[84,30],[92,26],[110,16],[160,16],[160,30],[150,33],[96,33]],k.roof);poly(c,[[84,30],[96,33],[160,33],[160,35],[94,35],[86,32]],k.eave);
 for(let x=114;x<SW;x+=4)rect(c,x,17,1,13,k.roof2);rect(c,110,15,50,2,k.roof3);rect(c,84,29,4,2,k.roof3);dot(c,83,28,k.roof3);
 if(wi){poly(c,[[85,29],[93,25],[110,15],[160,15],[160,18],[111,18],[94,27]],k.sn);rect(c,96,33,64,1,k.sn2)}
 // เชือกชิเมนาวะกับกระดาษชิเดะซิกแซก · กระดิ่งกับกล่องรับเงินทำบุญ (เชือกกระดิ่งแกว่งใน jnLive)
 for(let x=100;x<158;x++){const y=Math.round(41+Math.sin((x-100)/58*Math.PI)*2.4);rect(c,x,y,1,2,k.rope);if(x%3===0)dot(c,x,y+1,k.rope2)}
 [108,120,136,148].forEach(x=>{const y=Math.round(43+Math.sin((x-100)/58*Math.PI)*2.4);[[0,0],[1,0],[1,1],[0,2],[0,3],[1,3],[1,4],[0,5]].forEach(([u,v])=>dot(c,x+u,y+v,v%2?k.shide2:k.shide))});
 blob(c,128.5,46.6,3.2,3,k.bell2);blob(c,128.5,46,2.8,2.6,k.bell);dot(c,127,45,k.shide);rect(c,127,49,3,1,k.bell2);
 rect(c,116,57,26,9,k.box);rect(c,116,57,26,2,k.box3);for(let x=118;x<141;x+=3)rect(c,x,59,1,2,k.box2);rect(c,116,61,26,1,k.box2);rect(c,117,62,24,1,k.box3+'88');
 // โทริอิ: เสาเรียวสองต้น ฐานดำ คานบนสุดสีดำปลายงอน (คาสะงิ) คานรอง (ชิมะกิ) คานผูก (นุกิ) แผ่นป้ายกลาง (ไม่มีตัวหนังสือ)
 [[14,1],[45,-1]].forEach(([x])=>{rect(c,x,22,4,50,k.tor);rect(c,x,22,1,50,k.tor3);rect(c,x+3,22,1,50,k.tor2);rect(c,x-1,68,6,4,k.torK);rect(c,x-1,68,6,1,k.torK2)});
 rect(c,7,24,52,3,k.tor);rect(c,7,24,52,1,k.tor3);rect(c,7,26,52,1,k.tor2);poly(c,[[3,18],[8,20],[58,20],[63,18],[63,21],[58,23],[8,23],[3,21]],k.torK);rect(c,8,20,50,1,k.torK2);
 rect(c,10,33,46,3,k.tor);rect(c,10,33,46,1,k.tor3);rect(c,10,35,46,1,k.tor2);rect(c,29,26,7,8,k.torK);rect(c,30,27,5,6,k.tor2);rect(c,31,28,3,4,k.torK2);
 if(wi){rect(c,4,17,59,1,k.sn);rect(c,8,23,50,1,k.sn2);rect(c,10,32,46,1,k.sn)}
 // แผงแขวนเอมะ (แผ่นไม้ห้าเหลี่ยม · แผ่นขยับใน jnLive) + โคมหิน
 rect(c,64,50,2,20,k.rack);rect(c,86,50,2,20,k.rack);rect(c,62,48,28,2,k.rack);rect(c,64,58,24,1,k.rack);poly(c,[[61,48],[76,44],[91,48]],k.roof2);if(wi)poly(c,[[62,47.5],[76,43.6],[90,47.5],[76,45.4]],k.sn);
 if(k.glow)blob(c,72,48,9,8,k.glow);
 rect(c,66,69,12,3,k.stone2);rect(c,70,60,4,9,k.stone);rect(c,67,58,10,2,k.stone2);rect(c,68,52,8,6,k.stone);rect(c,70,54,4,3,k.lwin);poly(c,[[65,53],[72,48],[79,53]],k.stone2);rect(c,71,46,2,2,k.stone2);rect(c,68,52,1,6,k.stone3);
 if(wi){poly(c,[[66,52.6],[72,47.6],[78,52.6],[72,50]],k.sn);rect(c,67,57,10,1,k.sn)}
 blob(c,72,72.2,8,1,k.shade);blob(c,126,72.4,34,1.2,k.shade);blob(c,31,72.2,22,1,k.shade);blob(c,150,88.6,11,1.6,k.shade)}
// สิงโตหิน (โคมะอินุ) นั่งบนแท่นหิน หันซ้าย: หัวกลมแผงคอหยิก อกยื่น ขาหน้าตรง หางพุ่มขึ้น (ฉากหน้า)
function jnFg(c,k){const wi=k.season==='winter';rect(c,140,74,20,12,k.stone2);rect(c,140,74,20,1,k.stone3);rect(c,138,84,24,2,k.stone2);for(let x=142;x<158;x+=5)rect(c,x,77,1,6,k.stone);
 blob(c,151,68,6.4,5.6,k.kom);blob(c,156.5,62,3.6,5,k.kom);blob(c,145.6,60,5,4.8,k.kom);blob(c,144.6,58.6,3.6,3,k.kom3);[[143,57],[146,56],[148,59],[145,62]].forEach(([x,y])=>dot(c,x,y,k.kom2));
 rect(c,143,64,3,9,k.kom);rect(c,147,65,3,8,k.kom2);rect(c,142,72,5,2,k.kom3);dot(c,141,60,k.line);rect(c,141,62,3,1,k.kom2);dot(c,144,59,k.line);
 blob(c,158,58,2.4,3.4,k.kom3);[[157,56],[159,59],[156,61]].forEach(([x,y])=>dot(c,x,y,k.kom2));blob(c,152,73,5,1.2,k.kom2);
 if(wi){blob(c,145.4,55.4,4,1,k.sn);blob(c,151,62.8,4.4,1,k.sn);rect(c,140,73,20,1,k.sn)}}
// ขยับ: เชือกกระดิ่งลายแดงขาวแกว่ง · แผ่นเอมะไหวเบาๆ ทีละแผ่น · ของตกตามฤดูทั้งฉาก (ชั้น front)
function jnLive(c,k,A){const sw=A.P?Math.sin(A.ms/1700)*1.6+Math.sin(A.ms/610)*.4:0;for(let y=49;y<62;y++){const x=Math.round(128.5+sw*(y-49)/13);rect(c,x,y,2,1,(y>>1)%2?k.bellR:k.shide)}
 for(let i=0;i<6;i++){const x=65+(i%3)*7,y=i<3?50:59,r=A.P?Math.round(Math.sin(A.ms/(900+i*170)+i*1.7)*.6):0;rect(c,x+r+2,y,1,1,k.rope2);poly(c,[[x+r,y+2],[x+r+2.5,y+1],[x+r+5,y+2],[x+r+5,y+6],[x+r,y+6]],k.ema);rect(c,x+r,y+5,5,1,k.ema2);dot(c,x+r+2,y+3,i%2?k.emaR:k.ema2)}}
function jnFront(c,k,A){const se=season(A.ms);if(se!=='summer')fall(c,A,se,se==='winter'?[0,-3,SW,93]:[0,10,SW,80],se==='winter'?28:10)}
const jnTick=A=>A.P?cloudKey(A)+'|'+(A.ms/120|0):'';
// poi = จุดของในฉากระดับพื้นที่แมวเดินไปดม (x ของขอบของ จมูกจะแตะตรงนั้น · v117)
const SCENES={room:{pal:SCOL,sea:RSEA,bg:roomBg,fg:roomFg,bed:CUSH,live:roomLive,tick:roomTick,over:roomLight,poi:[66,79,100,120,138]},
 garden:{pal:GCOL,sea:GSEA,far:gardenFar,air:clouds,mid:gardenMid,bg:gardenBg,live:gardenLive,fg:gardenFg,front:gardenFront,tick:gardenTick,bed:null,poi:[18,30,72,88,98,122,128]},
 cafe:{pal:KCOL,sea:KSEA,bg:cafeBg,live:cafeLive,fg:cafeFg,front:cafeFront,tick:cafeTick,bed:null,poi:[24,98,118,138]},
 station:{pal:TCOL,sea:TSEA,far:stationFar,air:clouds,mid:stationMid,back:stationBack,bg:stationBg,fg:stationFg,front:stationFront,tick:stationTick,bed:null,poi:[21,31,96,128,145]},
 konbini:{pal:KBCOL,sea:KBSEA,bg:kbBg,live:kbLive,fg:kbFg,tick:kbTick,bed:null,poi:[42,47,104,108,142]},
 classroom:{pal:CLCOL,sea:CLSEA,bg:clBg,live:clLive,fg:clFg,tick:clTick,bed:null,poi:[33,64,98,124,130]},
 shrine:{pal:JNCOL,sea:JNSEA,far:jnFar,air:clouds,mid:jnMid,bg:jnBg,live:jnLive,fg:jnFg,front:jnFront,tick:jnTick,bed:null,poi:[13,49,62,90,116,140]}};
let PLACE='room';const SCN=()=>SCENES[PLACE]||SCENES.room;
// รุ่งเช้า (05–07) / พลบค่ำ (17–19): ใช้ชุดสีกลางวัน เปลี่ยนฟ้าเป็นชมพูอมพีช/ส้ม พระอาทิตย์ลอยต่ำ แล้วย้อมทั้งภาพด้วยสีอุ่น (WARM, multiply) ให้แมวอมแสงเดียวกัน
// ฟ้าห้อง: sky = ฟ้าในหน้าต่าง sky2 = แถบบนสุด · ฉากกลางแจ้ง (sky()): sky = ฟ้าด้านบน sky2 = แถบใกล้ขอบฟ้า
const TWI={dawn:{room:{sky:'#ffd2b8',sky2:'#c9b3e0',sun:'#ffc07a',cloud:'#ffe6dc',cloud2:'#e7c2cf',sunY:33},out:{sky:'#c9b6e6',sky2:'#ffcfb4',sun:'#ffbf80',cloud:'#ffe3d6',cloud2:'#e2bdd0',sunY:44},lit:'#ffe2a0'},
 dusk:{room:{sky:'#ffae6e',sky2:'#c9798f',sun:'#ff7a45',cloud:'#ffc49e',cloud2:'#df9a9c',sunY:33},out:{sky:'#d58aa0',sky2:'#ffb070',sun:'#ff7845',cloud:'#ffc0a0',cloud2:'#d6949e',sunY:42},lit:'#ffd98a'}};
const WARM={dawn:'#f6e2ee',dusk:'#ffd6b8'};
function palOf(s,sk){const se=season(),id=sk+'|'+se;if(s.pal[id])return s.pal[id];const so=(s.sea&&s.sea[se])||{},dk=sk==='dark',base={...s.pal[dk?'dark':'light'],...(so[dk?'dark':'light']||{}),season:se},t=TWI[sk];
 return s.pal[id]=dk||!t?base:{...base,...(s===SCENES.room?t.room:t.out),moon:null,lit:t.lit}}
const bgC={},fgC={};
// ชั้นภาพที่ไม่ขยับ (far mid bg) แคชตามสถานที่และชุดสี
// กลางคืนมีพระจันทร์ (เฟสและตำแหน่งตามเวลาจริง) จึงต่อ moonKey ท้ายรหัสแคช และลบภาพเก่าของชั้นเดียวกันทิ้ง
const LAST={};function layer(n,tm){const ms=NOW??Date.now(),base=PLACE+'|'+n+'|'+tm+'|'+season(ms)+bkey(),id=tm==='dark'?base+'|'+moonKey(ms):base;if(bgC[id])return bgC[id];
 if(LAST[base]&&LAST[base]!==id)delete bgC[LAST[base]];LAST[base]=id;MOON=moonAt(ms);const s=SCN(),v=canv();s[n](v.getContext('2d'),palOf(s,tm));return bgC[id]=v}
// ฉากหลังรวมทุกชั้นแบบนิ่ง (เมฆตำแหน่งเริ่ม ไม่มีรถไฟ) ใช้ในชุดทดสอบและภาพ Design System
function sceneBg(tm){const id=PLACE+'|all|'+tm+'|'+season()+bkey()+(tm==='dark'?'|'+moonKey(NOW??Date.now()):'');if(bgC[id])return bgC[id];const s=SCN(),v=canv(),c=v.getContext('2d'),A={t:0,ms:0,d:new Date(2026,0,1,12),P:false,td:'day',sk:tm};
 if(s.far)c.drawImage(layer('far',tm),0,0);if(s.air)s.air(c,palOf(s,tm),A);if(s.mid)c.drawImage(layer('mid',tm),0,0);c.drawImage(layer('bg',tm),0,0);return bgC[id]=v}
function sceneFg(tm){const id=PLACE+'|'+tm+'|'+season()+bkey();if(fgC[id])return fgC[id];const s=SCN(),k=palOf(s,tm),v=canv(),c=v.getContext('2d');s.fg(c,k);
 // เส้นขอบรอบฉากหน้า ให้เข้าชุดกับแมว
 const d=c.getImageData(0,0,SW,SH),A=(x,y)=>x>=0&&y>=0&&x<SW&&y<SH&&d.data[(y*SW+x)*4+3]>0,o=[];
 for(let y=0;y<SH;y++)for(let x=0;x<SW;x++)if(!A(x,y)&&(A(x+1,y)||A(x-1,y)||A(x,y+1)||A(x,y-1)))o.push([x,y]);o.forEach(([x,y])=>rect(c,x,y,1,1,k.line));return fgC[id]=v}
const cat={x:52,dir:1,mode:'sit',t:0,dur:2500,dist:0,target:52,then:null,k:'sit'};
const rr=(a,b)=>a+Math.random()*(b-a),DUR=Object.fromEntries(INFO.map(i=>[i[0],i[3]]));
function setMode(m,dur=0){if(m==='sit')dur*=pk('sit');else if(m==='nap'||m==='curl')dur*=pk('nap');cat.mode=m;cat.t=0;cat.dur=dur;cat.ev=null} // นิสัยยืด/ย่อเวลานั่งและงีบ
function goTo(tx,then,run=false){cat.bs=0;cat.target=Math.round(clamp(tx,XMIN,XMAX));cat.then=then;cat.run=run;if(cat.target===Math.round(cat.x)){cat.x=cat.target;cat.str=0;arrive();return}cat.dir=cat.target>cat.x?1:-1;setMode('turnOut',run?120:260)}
// วิ่งดีด: วิ่งไปเกือบสุดอีกฝั่งของห้อง แล้ววิ่งกลับมาครึ่งทาง
function zoom(){const far=cat.x<(XMIN+XMAX)/2?XMAX-rr(0,8):XMIN+rr(0,8);goTo(far,'zoom2',true)}
function arrive(){if(cat.then==='zoom2'){cat.then='sit';const tx=(XMIN+XMAX)/2+rr(-20,20);cat.target=Math.round(tx);cat.dir=cat.target>cat.x?1:-1;setMode('skid',220);return}
 if(cat.then==='beg'){cat.then='sit';cat.beg=1;cat.pose='curious';setMode('pose',1300);return say([['ニャー',1200],['ゴロゴロ…',1800]])} // ขออาหาร: เงยหน้ามองแล้วร้อง จากนั้นถูหัวคราง (pose จบ → pet)
 if(cat.then==='greet'){cat.then='sit';const g=cat.greet||1;act('happy',g>1?2800:1600);say(g>1?[['ニャー！ ニャー！',1300],['ゴロゴロ…',1700]]:[['ニャッ♪',1500]]);return}
 if(cat.then==='come'){cat.then='sit';return setMode('sit',rr(5000,9000))} // มานั่งใกล้ๆ แล้วอยู่นานหน่อย
 if(cat.then==='bird'){cat.then='sit';const o=birdAt(env());if(o==null){cat.pose='curious';return setMode('pose',1500)}act('birdwatch',Math.max(1500,BIRD_ON-o-300));if(!talking())say([['カカカッ',1300]]);return} // ใต้หน้าต่างแล้ว: มองนก
 if(cat.then==='bask'){cat.then='sit';setMode('bask',rr(20000,32000));if(!talking()&&Math.random()<.5)say([['ぽかぽか…',1500]]);return} // นอนในแดด
 if(cat.then==='box'||cat.then==='boxhide'){const hide=cat.then==='boxhide';cat.then='sit';if(hide)cat.cool=rr(15000,20000)*pk('cool');cat.bt=(hide?rr(14000,20000):rr(8000,18000))*pk('boxT');cat.bz=!hide&&(dayPart()==='noon'||dayPart()==='night')&&Math.random()<.5;return setMode('boxin',360)} // มุดลงกล่อง
 if(cat.then==='sniff'){cat.then='sniffed';cat.dir=cat.sd||cat.dir;cat.sniff=1;return setMode('turnOut',260)} // ถึงจุดแล้วตั้งแต่ต้น: หันข้างเข้าหาของแล้วดม
 if(cat.then==='sniffed'){cat.then='sit';if(cat.sbx){cat.sbx=0;BOX_SEEN=boxKey();if(Math.random()<.6)return goTo(BOX.cx,'box')} // ดมกล่องใหม่แล้วมักมุดเข้าไปเลย
if(Math.random()<.35){cat.pose='curious';return setMode('pose',rr(1200,2200))}return setMode('sit',rr(2500,5000))}
 if(cat.then==='hunted'){cat.then='sit';cat.pose='curious';setMode('pose',1800);cat.gA=Math.random()<.5;return} // ผีเสื้อบินหนี: เงยมองตาม แล้วบางทีเลียขนกลบเกลื่อน
 if(cat.then==='leave'){cat.then='sit';cat.cool=rr(15000,20000)*pk('cool');return groom()} // เดินหนีแล้วเลียขน พักราว 15–20 วิ
 if(cat.then==='groom'){cat.then='sit';return groom()} // ยืดตัวเสร็จแล้วเลียขน
 if(cat.then==='sleep'){cat.bs=0;if(Math.random()<(KNP[S.stage]||0)*pk('knead')){setMode('knead',rr(2400,3600));if(!talking())say([['ふみふみ…',1400],['ゴロゴロ…',1400]]);return}return setMode('loaf',rr(3000,4500))}
 setMode('sit',rr(3000,7000))}
// ---------- ตื่นนอน / ก่อนนอน (รายงานพฤติกรรมข้อ 6–7 · v83 · ตาราง "ทางแยกหลังเหตุการณ์") ----------
// ตื่น: หาว 50% → ยืดตัวโค้งคำนับ 60% → แยกเป็น เลียขน 35% / วิ่งดีด 10% / เดินมาหาผู้ใช้ 15% / นั่งต่อ 40%
// หาว+ยืดตัวมักเกิดตอนเปลี่ยนจากหลับเป็นตื่น หรือจากพักเป็นเคลื่อนไหว (ไม่มีงานวิจัยบอกลำดับ เป็นค่าตั้งต้นเชิงออกแบบ จึงสุ่มข้ามบางขั้น) · ยืดตัวเป็นท่าหันข้าง จึงต่อด้วยเดินได้เลย ไม่เดินก็หันกลับมานั่ง
// ก่อนนอนบนเบาะ: นวด ふみふみ 30% (สนิทขึ้นนวดบ่อยขึ้น) → หมอบ → ขด · การนวดยังไม่มีงานวิจัยเชิงลึก ใช้เป็นลูกเล่นตอนผ่อนคลาย ไม่ให้เกิดทุกครั้ง
const KNP=[0,.3,.4,.5];
function rouse(){if(Math.random()<.5){cat.wk=1;return yawn()}rouse2()}
function rouse2(){cat.wk=0;const st=Math.random()<.6,pw=PLW[PLACE]||{},wy=wary(),tw=k=>((PS.w||{})[k]??1)*(pw[k]??1)*(1+((WARYW[k]??1)-1)*wy), // คิดตามนิสัย × สถานที่ × ช่วงปรับตัว เหมือน decide()
  zw=Math.min(2,tw('zoom')),cw=Math.min(2.5,tw('come')),r=Math.random()*(.75+.15*cw+.1*zw); // เลียขน .35 / เดินมาหา .15 / นั่ง .40 / วิ่งดีด .10 (ขี้อายแทบไม่เดินมาหา ขี้เซาแทบไม่วิ่ง)
 if(r<.35)return st?stretchHere('groom'):groom();
 if(r<.35+.15*cw){cat.str=st;return goTo((XMIN+XMAX)/2+rr(-10,10),'come')}
 if(r>=.75+.15*cw){cat.str=st;return zoom()}
 if(st)return stretchHere('sit');setMode('sit',rr(3000,6000))}
function yawn(){setMode('yawn',GT('yawn'));if(!talking()&&Math.random()<.5)say([['ふわぁ〜',1300]])}
// ยืดตัวอยู่กับที่: หันข้างไปทางกลางฉาก ยืดตัว แล้วหันกลับมานั่ง (turnIn → arrive)
function stretchHere(then){cat.then=then;cat.target=Math.round(cat.x);cat.str=1;cat.run=false;cat.dir=cat.x<(XMIN+XMAX)/2?1:-1;setMode('turnOut',260)}
// ทักทายตามเวลาที่หายไป (Eriksson 2017: หายนานทักแรงขึ้น · หางตั้งเดินเข้าหา = ทักทายเป็นมิตร)
// ไม่ถึง 30 นาที: ไม่ทำอะไรพิเศษ · 30 นาที–4 ชม.: เดินหางตั้งมากลางห้อง ดีใจ ฟอง ニャッ♪ (ถ้าหลับอยู่ ปล่อยหลับต่อ) · 4 ชม.ขึ้นไป: หลับอยู่ก็ตื่นก่อน แล้วเดินหางตั้งมา ดีใจนานขึ้น ニャー！→ゴロゴロ…
// ปิดแอนิเมชัน: ไม่เดิน แค่ขึ้นฟองคำพูด
function greet(ms){if(!(ms>=18e5))return;const g=ms>=144e5?2:1,asleep=cat.mode==='curl'||cat.mode==='loaf'||cat.mode==='nap';cat.greet=g;
 if(!cv||!cv.isConnected){pendGreet=ms;return}
 if(!playing)return say(g>1?[['ニャー！',1500]]:[['ニャッ♪',1500]]);
 if(asleep){if(g<2)return;cat.after='greet';return setMode('wake',1400)}greetGo()}
function greetGo(){goTo((XMIN+XMAX)/2+rr(-14,14),'greet')}
// ขออาหาร (รายงานพฤติกรรมข้อ 12 · v70): กดให้อาหารตอน Energy ไม่พอ แทนท่าเศร้า แมวเดินหางตั้งมานั่งกลางฉากใกล้ผู้ใช้ เงยหน้ามอง「ニャー」 แล้วถูหัวคราง「ゴロゴロ…」
// เหมียวของแมวโตส่วนใหญ่ส่งถึงคน (Nicastro 2004) · เสียงครางตอนขออาหารมีเสียงร้องแฝง (McComb 2009 หลักฐานแข็ง) · ไม่ใช้ท่าเศร้า เพราะความหิวของสัตว์เลี้ยงไม่ใช่ความผิดของผู้ใช้
// หลับอยู่ = ตื่นก่อน · ปิดแอนิเมชัน = ไม่เดิน แค่เงยหน้ามองกับฟองคำพูด
function beg(woke){if(!woke&&SLEEPM[cat.mode]){cat.after='beg';return cat.mode==='wake'?0:setMode('wake',1400)}cat.lv=0; // woke = เรียกจากตอนตื่นเสร็จ (wake อยู่ใน SLEEPM จึงต้องข้ามการเช็ก ไม่งั้นวนตื่นไม่จบ)
 if(!playing){act('curious',2600);return say([['ニャー',1200],['ゴロゴロ…',1400]])}
 goTo((XMIN+XMAX)/2+rr(-10,10),'beg')}
const GT=k=>DUR[k].reduce((a,b)=>a+b,0);function groom(k='groom'){cat.gk=k;setMode('groom',GT(k)*2)} // เริ่มที่อุ้งเท้าหน้า/หน้าเสมอ แล้วต่อขาหลัง 60% (เลียไล่จากหัวลงหาง Eckstein & Hart 2000)
// เล่นท่าใดก็ได้ใน INFO ตามเวลาที่กำหนด แล้วกลับมานั่ง (ไว้ผูกกับเหตุการณ์ในแอป เช่น ตอบถูก = act('happy',1600))
function act(k,ms){cat.pose=k;cat.beg=0;setMode('pose',ms)}
// น้ำหนักการตัดสินใจตามช่วงเวลาจริงของเครื่อง (รายงาน reports/พฤติกรรมแมวบ้าน… 2026-11-19): แมวจริงคึกช่วงเช้า/เย็น ง่วงช่วงเที่ยงและกลางคืน
// วิ่งดีดเป็นเหตุการณ์นานๆ ครั้ง · งีบอยู่กับที่ (nap = ท่าหมอบ 8–14 วิ) เพิ่มเวลาพักโดยไม่ต้องเดินไปเบาะบ่อย · นั่งมอง (watch = ท่าสงสัย)
// ทิศทางมีหลักฐานระดับปานกลาง ส่วนตัวเลขเป็นค่าของเกม (บีบเวลา: งีบจริง ~79 นาที → curl 24–36 วิ)
const DAYW={day:{bed:9,nap:14,zoom:2,groom:14,walk:31,watch:8,come:3,sit:19,sniff:4},tw:{bed:5,nap:9,zoom:6,groom:12,walk:37,watch:9,come:4,sit:18,sniff:5},
 noon:{bed:14,nap:20,zoom:1,groom:14,walk:22,watch:8,come:2,sit:19,sniff:2},night:{bed:25,nap:20,zoom:1,groom:13,walk:16,watch:5,come:1,sit:19,sniff:2}}; // sniff = เดินไปดมของในฉาก (v117 · ที่ใหม่ดมบ่อยขึ้น) // come = เดินมานั่งใกล้ๆ ผู้ใช้เอง
// ---------- นิสัย → พฤติกรรม (v63 · รายงาน "บทพูดสัตว์เลี้ยงตามนิสัย 10 แบบ" หัวข้อ Feline Five) ----------
// บุคลิกแมวจริงมีแกนซ้ำกันข้ามงานวิจัย: กระตือรือร้น ความกลัว ความเป็นมิตรกับคน ความหุนหัน (Litchfield 2017 แมว 2,802 ตัว · Salonen 2019) ความกระตือรือร้นต่างกันมากที่สุด
// ลำดับตรงกับ TR ใน js/data/pet-lines.js · ตัวคูณทุกตัวเป็นค่าของเกม (แมวกลาง = 1) · ผูกกับมิติจริงได้มั่นใจ: พลังล้น ขี้เซา ขี้สงสัย (สูง) เงียบสงบ ขี้อาย ตัวน้อย (กลาง) ที่เหลือเป็นกรอบทางสังคม
// w = น้ำหนัก decide() · knead = โอกาสนวดก่อนนอน · sit/nap = เวลานั่ง/งีบ · tol = ความทนลูบ (ขี้อายโตตามร่าง) · shy = โอกาสเขินตอนลูบหัว · sb = กะพริบตาช้าเอง · cool = เวลาพักหลังเดินหนี · voc = ร้องเอง · hide = ไปแอบหลังของ
const PERS=[
 {w:{zoom:2,nap:.6,bed:.7,walk:1.2,watch:.6,hunt:1.8,bask:.6,box:.6},boxT:.7,startle:.8,sit:.8,voc:1.2,sb:.8,mw:'ニャッ！'},                         // 0 พลังล้น: E สูง วิ่งพล่าน นั่งไม่ติด
 {w:{zoom:.4,nap:1.5,walk:.8,hunt:.5,bask:1.4},startle:.7,sit:1.3,tol:1.2,shy:.5,sb:1.3,voc:.5,knead:1.3,mw:'…ニャ'},                 // 1 เงียบสงบ: N ต่ำ I ต่ำ หมอบนาน กะพริบตาช้าบ่อย พูดน้อย
 {w:{come:.4,zoom:.6,hunt:.8,sniff:.7,box:2.5},boxT:1.5,startle:1.6,tol:[.6,.8,1],shy:2,sb:.7,cool:1.3,hide:.35,mw:'にゃ…'},                  // 2 ขี้อาย: N สูง แอบหลังของ ทนลูบน้อยแล้วโตตามร่าง เขินบ่อย
 {w:{come:2.2},tol:.7,shy:1.5,voc:.7,mw:'ニャ'},                                                // 3 ปากแข็งแต่ใจดี: เดินมานั่งข้างๆ เอง แต่ทนการลูบที่ผู้ใช้เริ่มสั้นกว่า (ให้แมวเลือก Haywood 2021)
 {w:{nap:2,bed:1.6,zoom:.3,walk:.7,hunt:.4,bask:1.8,box:1.5},boxT:1.3,bird:.6,nap:1.4,sit:1.2,tol:1.4,sb:1.2,voc:.6,knead:1.4,mw:'ふにゃ…'},          // 4 ชิลๆ ขี้เซา: E ต่ำ งีบบ่อยและนาน ทนลูบ
 {w:{zoom:1.6,walk:1.1,nap:.7,hunt:2},bird:1.2,sit:.7,tol:.9,voc:1.1,mw:'ニャ〜'},                                      // 5 ขี้เล่นจอมแซว: E สูง I สูง พุ่งกะทันหัน เปลี่ยนท่าไว
 {w:{watch:2.8,walk:1.3,nap:.8,hunt:1.3,sniff:2.6},bird:1.2,voc:1,mw:'ンニャ？'},                                             // 6 ขี้สงสัย: E สูง N ต่ำ นั่งจ้องสงสัยบ่อย เดินสำรวจ
 {w:{come:1.6,groom:1.3,zoom:.5,hunt:.8},tol:1.1,sb:1.2,voc:.6,mw:'ニャン'},                            // 7 สุภาพเรียบร้อย: A สูง I ต่ำ เดินหางตั้งมาทัก เลียขนเรียบร้อย ไม่เรียกร้อง
 {w:{watch:2,zoom:.5},sit:1.2,voc:.8,mw:'ニャ。'},                                              // 8 นักวิชาการ: นั่งเฝ้ามอง (แมวจริงไม่มีมิติวิชาการ ความมั่นใจต่ำ)
 {w:{walk:1.3,zoom:1.2,hunt:1.4,sniff:1.3},startle:.6,cool:.6,voc:1.1,mw:'ニャッ'}];                                          // 9 ตัวน้อยขยันสู้: N ต่ำ กล้า เดินสำรวจ ฟื้นไวหลังเดินหนี
let PS={};const pk=(k,d=1)=>PS[k]??d;
// ---------- น้ำหนักตามสถานที่ (รายงานพฤติกรรมข้อ 10 · v83) ----------
// สวน: ที่โล่ง เดินสำรวจ วิ่งดีด นั่งมองบ่อยขึ้น · คาเฟ่/สถานี: ที่แคบและคนเยอะ ไม่วิ่งดีด เดินน้อย นั่ง/หมอบ/มานั่งใกล้ผู้ใช้มากขึ้น
// งานวิจัยเฉพาะคาเฟ่/สถานีไม่มี ใช้หลักทั่วไปว่าที่ใหม่ทำให้แมวเครียดแล้วค่อยๆ ผ่อนคลาย (Vinke 2014 คะแนนเครียดลดลงตลอดราว 2 สัปดาห์) ตัวเลขทั้งหมดเป็นค่าของเกม
const PLW={garden:{walk:1.3,zoom:1.5,watch:1.2},cafe:{zoom:0,walk:.5,sit:1.5,nap:1.5,come:1.5},station:{zoom:0,walk:.4,sit:1.3,watch:1.3,nap:1.2},
 konbini:{zoom:0,walk:.6,sit:1.3,watch:1.4,come:1.4},classroom:{zoom:.6,walk:1.1,watch:1.2},shrine:{walk:1.2,zoom:1.2,watch:1.3,sniff:1.3}}; // v120 ร้านสะดวกซื้อแคบคนเข้าออก (เหมือนคาเฟ่) · ห้องเรียนโล่งเงียบ · ศาลเจ้ากลางแจ้งร่มรื่น (คล้ายสวน)
// ช่วงปรับตัว (คาเฟ่/สถานี): วันแรกที่ไประวังตัวเต็มที่ แล้วลดลงวันละหนึ่งในสาม หายเป็นปกติวันที่ 4 (FAM = จำนวนวันที่เคยอยู่ที่นั้น จาก plVisit() ใน js/place.js)
// อยู่บนจอที่นั้นนานขึ้นในรอบเดียวกันก็ค่อยๆ ผ่อนคลาย (10 นาทีเหลือ 30%) · ระวังตัว = นั่งมองรอบตัว แอบหลังของ มานั่งใกล้ผู้ใช้ (เจ้าของเป็นที่พึ่ง) งีบ/เลียขน/เดินเล่นน้อยลง ไม่วิ่งดีด กะพริบตาช้าน้อยลง
// ท่าระวังตัวต้องไม่ดูทรมาน: docs/PET_PIXEL.md หัวข้อ "กติกาการออกแบบที่ test ตรวจไม่ได้"
const WARYW={walk:.5,groom:.4,nap:.3,bed:.3,zoom:0,watch:2.2,come:1.6,sniff:1.5},WARY_AT={cafe:1,station:1,konbini:1,classroom:1};
let FAM=99,AT_MS=0;
const wary=()=>WARY_AT[PLACE]?clamp(1-(FAM-1)/3,0,1)*Math.max(.3,1-AT_MS/6e5*.7):0;
// อารมณ์รายวัน ±15% ต่อพฤติกรรม (คงที่ทั้งวัน) ให้แต่ละวันไม่เหมือนกันเป๊ะ · ใช้นาฬิกาฉาก (NOW) · _t.setJit(false) ปิดไว้ทดสอบผลของนิสัยล้วนๆ (ผลไม่แกว่งตามวัน)
let JITF=true;const jit=k=>{if(!JITF)return 1;const d=new Date(NOW??Date.now());let x=0;for(const c of d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate()+k)x=(x*31+c.charCodeAt(0))>>>0;return .85+(x%1000)/1000*.3};
// ร้องเองนานๆ ครั้งตอนจบช่วงนั่ง เสียงตามนิสัย (Fe-BARQ วัดการส่งเสียงแยกจากความกระตือรือร้น) ไม่ทับฟองที่กำลังพูดอยู่
function meow(){if(!talking()&&cv&&cv.isConnected)say([[pk('mw','ニャ'),1100]])}
// CHR = นาฬิกาชีวิตประจำตัว (v119 · petMount ส่งมา): -1 ตื่นเช้า เลื่อนทุกช่วงเร็วขึ้น 2 ชม. · 1 นอนดึก เลื่อนช้าลง 2 ชม. · แมวบ้านปรับจังหวะตามเจ้าของได้ ตัวเลขเป็นค่าของเกม
let PART=null,CHR=0;const dayPart=(h0=new Date().getHours(),h=(h0-2*CHR+24)%24)=>PART||(h>=21||h<5?'night':h<9||h>=17?'tw':h>=11&&h<15?'noon':'day'); // tw = เช้า 05–09 / เย็น 17–21 (แมวปกติ)
// ---------- ท่าที่ใช้ของในฉาก (v97 · เจ้าของสั่ง 2026-11-20 · รายงานพฤติกรรมข้อ 8, 9, 10) ----------
// ห้อง: นกชิมะเอนางะมาเกาะหน้าต่าง → แมวที่ตื่นอยู่และว่าง (นั่ง เลียขน นั่งมอง งีบ) เดินไปใต้หน้าต่าง เงยมอง ปากสั่น「カカカッ」(chattering) จนนกบินไป
//   แมวจริงทำเสียงแกะๆ ตอนเห็นเหยื่อที่เอื้อมไม่ถึง (ยังไม่รู้หน้าที่แน่ชัด) · หลับลึก/กำลังเดิน/ทำท่าตามเหตุการณ์ในแอป ไม่ขัด · ขี้เซาสนใจน้อย ขี้เล่น/ขี้สงสัยสนใจมาก
// ห้อง: แดดบนพื้น (sunSkew) กลางวันมีตัวเลือก "อาบแดด" (เที่ยงบ่อยสุด) เดินไปนอนตะแคงในแดด 20–32 วิ แล้วตื่นแบบหาว/ยืดตัว · กลางคืนไม่มี
// สวน: ผีเสื้อบินต่ำในจอ → ตัวเลือก "ซุ่ม" (ขี้เล่น/พลังล้นบ่อย ขี้เซาน้อย) เดินไปจุดซุ่ม หมอบ ก้นส่าย 1.8–3 วิ กระโจน ตะปบ แล้วเงยมองตาม (ผีเสื้อบินหนีเสมอ ไม่ทำร้ายสัตว์) บางทีเลียขนกลบเกลื่อน
// สถานี: รถไฟเข้าจอ → ตื่นอยู่: สะดุ้ง「ビクッ！」ตามความระวังตัว (วันแรกเกือบทุกครั้ง ชินแล้วราว 30% นอกนั้นแค่หันมอง) ระวังตัวมากบางทีวิ่งไปแอบหลังเสา · หลับอยู่: บางทีสะดุ้งตื่น
// ตัวเลขทั้งหมดเป็นค่าของเกม
const env=()=>({ms:NOW??Date.now(),P:playing,td:tod()});
let SEEN_B=-1,SEEN_T=-1;
function sceneEvents(){if(!cv)return;const E=env();
 if(PLACE==='room'){const o=birdAt(E),id=Math.floor(E.ms/BIRD_T);if(o!=null&&o>600&&o<BIRD_ON-4000&&id!==SEEN_B){SEEN_B=id;birdSeen()}}
 if(PLACE==='station'){const x=trainX(E),id=Math.floor(E.ms/TRAIN_T);if(x!=null&&x<SW&&id!==SEEN_T){SEEN_T=id;trainSeen()}}}
const FREE=()=>cat.mode==='sit'||cat.mode==='groom'||(cat.mode==='pose'&&cat.pose==='curious'); // ว่างพอให้ของในฉากดึงความสนใจ
function birdSeen(){if(cat.mode==='nap'&&Math.random()<.4)return setMode('wake',900);if(!FREE()||Math.random()>Math.min(1,.85*pk('bird')))return;cat.then='bird';goTo(76+rr(-4,4),'bird')}
function trainSeen(){if(SLEEPM[cat.mode]){if(cat.mode!=='wake'&&Math.random()<.3+.4*wary())setMode('wake',900);return}
 if(!FREE())return;const wy=wary();if(Math.random()<clamp((.3+.65*wy)*pk('startle'),0,1)){act('startle',GT('startle'));if(!talking())say([['ビクッ！',900]]);cat.hideA=wy>.4&&Math.random()<.5}else{cat.pose='curious';setMode('pose',1600)}}
// จุดนอนอาบแดด: กลางแดดบนพื้น (ท่านอนตะแคงตัวอยู่ราว x+28 ของภาพ)
const baskX=()=>clamp(Math.round(84+sunSkew(tod(),new Date())*.6),XMIN,XMAX);
// ตัวเลือกเพิ่มตามฉาก: ซุ่มผีเสื้อ (สวน กลางวันและผีเสื้ออยู่ในจอ) · อาบแดด (ห้อง ไม่ใช่กลางคืน เที่ยงบ่อยสุด)
function sceneW(){const E=env(),o={};if(PLACE==='garden'){const b=bflyAt(E);if(b&&b.x<SW-6&&b.x>10)o.hunt=7}
 if(PLACE==='room'&&E.P&&E.td!=='night')o.bask=E.td==='day'?(dayPart()==='noon'?16:10):5;
 if(boxOn()){if(BOX_SEEN!==boxKey())o.boxsniff=14;else o.box=dayPart()==='noon'||dayPart()==='night'?8:6}return o} // กล่องใหม่วันนี้: ไปดมก่อน แล้วค่อยมุด
function hunt(){const b=bflyAt(env());if(!b||b.x>SW-6){return setMode('sit',rr(2500,4000))}const c=cat.x+24,d=b.x>c?1:-1;
 let T=clamp(d>0?b.x-62:b.x+14,XMIN,XMAX); // จุดซุ่ม: หัวห่างผีเสื้อราว 18 px (หันขวาหัวอยู่ที่ x+44 หันซ้ายที่ x+4)
 if(Math.abs(T-cat.x)<6){cat.dir=d;cat.hunt=1;cat.run=false;cat.str=0;return setMode('turnOut',220)} // อยู่ที่จุดซุ่มแล้ว: หันข้างแล้วหมอบเลย
 cat.str=0;goTo(T,'stalk')} // ใกล้เกินก็ถอยไปจุดซุ่มก่อน แล้วค่อยหันเข้าหาผีเสื้อตอนหยุด (halt)
// ---------- ดมของ + ดม/หมุนตัวก่อนนอน (v117 · รายงานข้อ 7 · ท่าใหม่ sniff) ----------
// เดินไปดมของในฉาก (SCENES[ที่].poi): แมวสำรวจที่ใหม่ด้วยจมูกก่อน ที่ที่เพิ่งมา (FAM 1–3 วัน) ดมบ่อยขึ้นสูงสุด 2.5 เท่า · ขี้สงสัยดมบ่อยสุด · ดมแล้วบางทีนั่งเอียงคอสงสัย
// ก่อนนอนบนเบาะ: ดมเบาะ แล้วหมุนตัวกลับไปมา 1–2 รอบ (ย่ำที่นอน) ก่อนนวด/หมอบ · รายงานบอกว่ายังไม่มีหลักฐานในแมว (มีในสุนัข) จึงให้เกิดแค่บางครั้ง ค่าทั้งหมดเป็นค่าของเกม
const novel=()=>PLACE==='room'?0:clamp((4-FAM)/3,0,1),SNP=.4;let SNIFF_LAST=-1,BOX_SEEN='';const boxKey=()=>{const d=new Date(NOW??Date.now());return d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate()};
function sniffGo(L){const P=(L||SCN().poi||[]).filter(x=>x!==SNIFF_LAST);if(!P.length)return setMode('sit',rr(2500,5000));const px=P[Math.floor(Math.random()*P.length)];SNIFF_LAST=px;
 const O=[[1,px-46.5],[-1,px-1.5]].filter(([,t])=>t>=XMIN&&t<=XMAX),M=O.filter(([d,t])=>d>0?t>=cat.x-2:t<=cat.x+2),C=(M.length?M:O).sort((a,b)=>Math.abs(a[1]-cat.x)-Math.abs(b[1]-cat.x))[0]; // จมูกหันขวาอยู่ที่ x+46.5 หันซ้ายที่ x+1.5 · เลือกฝั่งที่เดินไปแล้วหันหน้าเข้าหาของพอดี
 if(!C)return setMode('sit',rr(2500,5000));cat.sd=C[0];cat.str=0;goTo(C[1],'sniff')}
// หมุนตัวก่อนนอน: ยืน → หันสามส่วนสี่ → หันอีกฝั่ง → ยืนอีกฝั่ง (1 หรือ 2 รอบ) ใช้ท่าที่มีอยู่ ไม่ต้องวาดใหม่
function circleSteps(d,n){const S=[];for(let i=0;i<n;i++){S.push(['turn',d,200],['turn',-d,200],['stand',-d,320]);d=-d}return S}
function decide(){const wy=wary(),pw=PLW[PLACE]||{};if(Math.random()<(SBP[S.stage]||0)*pk('sb')*(1-wy*.6))return slowBlink();if(Math.random()<.03*pk('voc'))meow();
 const W=Object.entries({...DAYW[dayPart()],...sceneW()}).map(([k,v])=>[k,v*((PS.w||{})[k]??1)*(pw[k]??1)*(1+((WARYW[k]??1)-1)*wy)*jit(k)*(k==='sniff'?1+1.5*novel():1)]);let r=Math.random()*W.reduce((a,b)=>a+b[1],0); // น้ำหนักตามช่วงเวลา × นิสัย × สถานที่ × ช่วงปรับตัว × อารมณ์รายวัน
 for(const[k,v]of W){if((r-=v)>=0)continue;
  if(k==='come')return goTo((XMIN+XMAX)/2+rr(-10,10),'come');
  if(k==='bed'&&SCN().bed!=null)return goTo(SCN().bed,'sleep');if(k==='nap'||k==='bed')return setMode('nap',rr(8000,14000));if(k==='zoom')return zoom();if(k==='groom')return groom();
  if(k==='watch'){cat.pose='curious';return setMode('pose',rr(3000,6000))}
  if(k==='hunt')return hunt();if(k==='bask')return goTo(baskX(),'bask');if(k==='sniff')return sniffGo();
  if(k==='boxsniff'){cat.sbx=1;return sniffGo([BOX.x0,BOX.x1])}if(k==='box')return goTo(BOX.cx,'box');
  if(k==='walk'){if(Math.random()<Math.max(pk('hide',0),.35*wy))return goTo(XMAX-rr(0,6),'sit'); // ขี้อาย/ที่ไม่คุ้น: ไปแอบหลังของฉากหน้าฝั่งขวา (กระถาง พุ่มไม้ โต๊ะ เสา) โผล่แค่หัว
   let tx,n=0;do tx=rr(XMIN,XMAX);while(Math.abs(tx-cat.x)<24&&++n<20);return goTo(tx,'sit')}break}
 setMode('sit',rr(2500,5000))}
function step(dt){if(playing)sceneEvents();const m=cat.mode;if(playing)AT_MS+=dt;if(cat.tol>0)cat.tol=Math.max(0,cat.tol-TOL_DECAY*dt/1000);if(cat.cool>0&&(cat.cool-=dt)<=0){cat.cool=0;cat.tol=0} // มาตรวัดความทนค่อยๆ ลด · พักครบแล้วกลับมาเล่นได้ตามปกติ
 if(!playing&&!TAPM[m])return;cat.t+=dt;
 cat.dy=m==='boxin'?BOX.dy*Math.min(1,cat.t/360):m==='box'?BOX.dy:m==='boxout'?BOX.dy*Math.max(0,1-cat.t/300):0; // มุดลง/โผล่ขึ้นจากกล่อง
 if(m==='pounce')cat.x=clamp(cat.x+cat.dir*.04*dt,XMIN,XMAX); // กระโจนไปข้างหน้าราว 17 px
 if(m==='walk'||m==='run'){const d=GAIT[m].v*dt/1000,left=cat.target-cat.x;if(Math.abs(left)<=d){cat.x=cat.target;if(m==='run'&&cat.then==='zoom2')arrive();else setMode('halt',m==='run'?240:300)}else{cat.x+=Math.sign(left)*d;cat.dist+=d}return}
 if(!cat.dur||cat.t<cat.dur)return;
 ({sit:decide,turnOut:()=>{if(cat.hunt===1){cat.hunt=2;return setMode('crouch',rr(1800,3000))}if(cat.sniff){cat.sniff=0;return setMode('sniff',rr(1600,2600))}if(cat.str){cat.str=0;return setMode('stretch',GT('stretchR'))}cat.run?setMode('run'):setMode('rise',260)},
  crouch:()=>{setMode('pounce',GT('pounceR'));if(!talking()&&Math.random()<.4)say([['ニャッ',800]])},pounce:()=>setMode('pin',GT('pinR')*1.4),pin:()=>{cat.hunt=0;cat.then='hunted';setMode('turnIn',260)}, // ซุ่ม → กระโจน → ตะปบ → หันกลับมามอง
  bask:()=>{cat.wk=1;rouse()},
  stretch:()=>Math.random()<.5?setMode('hind',GT('hindR')):cat.target===Math.round(cat.x)?setMode('turnIn',260):setMode(cat.run?'run':'walk'), // ยืดตัวจบที่ท่ายืน เดินต่อได้เลย · ครึ่งหนึ่งยืดขาหลังต่อ (v117)
  hind:()=>cat.target===Math.round(cat.x)?setMode('turnIn',260):setMode(cat.run?'run':'walk'),
  boxin:()=>{setMode('box',cat.bt||10000);if(!talking()&&Math.random()<.4)say([[cat.bz?'…ぬくぬく':'ニャ♪',1300]])},box:()=>setMode('boxout',300),boxout:()=>{cat.dy=0;setMode('sit',rr(2500,5000))}, // นั่งในกล่อง: โผล่หัว (ง่วงก็สัปหงก) แล้วกระโดดออก
  sniff:()=>{if(cat.bs===1){cat.bs=2;cat.cs=circleSteps(cat.dir,Math.random()<.5?1:2);return setMode('circle',cat.cs.reduce((a,b)=>a+b[2],0))}setMode('turnIn',260)},
  circle:()=>{const L=cat.cs[cat.cs.length-1];cat.dir=L[1];cat.cs=null;setMode('turnIn',260)},
  yawn:()=>cat.wk?rouse2():setMode('sit',rr(2500,5000)),knead:()=>setMode('loaf',rr(3000,4500)),skid:()=>setMode('run'),rise:()=>setMode('walk'),halt:()=>{if(cat.then==='sniff'){cat.then='sniffed';cat.dir=cat.sd||cat.dir;return setMode('sniff',rr(1600,2600))}
   if(cat.then==='sleep'&&!cat.bs&&Math.random()<SNP){cat.bs=1;return setMode('sniff',rr(1100,1700))} // ก่อนนอน: ดมเบาะ → หมุนตัว
   if(cat.then==='stalk'){cat.then='sit';cat.hunt=2;const b=bflyAt(env());if(b)cat.dir=b.x>cat.x+24?1:-1;return setMode('crouch',rr(1800,3000))}setMode('turnIn',260)},turnIn:arrive,loaf:()=>setMode('curl',rr(24000,36000)),curl:()=>setMode('wake',1500),nap:()=>{cat.wk=0;Math.random()<.3?yawn():setMode('sit',rr(2500,5000))}, // งีบเสร็จบางทีหาว
  wake:()=>{if(cat.after==='greet'){cat.after=null;cat.str=1;return greetGo()}if(cat.after==='beg'){cat.after=null;return beg(true)}rouse()}, // หายไปนาน: ตื่นแล้วยืดตัวก่อนเดินมาทัก (Eriksson 2017)
  groom:()=>cat.gk==='groom'&&Math.random()<.6?groom('groomLeg'):setMode('sit',rr(2500,5000)),
  pose:()=>{if(cat.beg){cat.beg=0;return setMode('pet',2000)}if(cat.hideA){cat.hideA=0;return goTo(XMAX-rr(0,4),'sit')}if(cat.gA){cat.gA=0;return groom()}cat.pose==='eat'&&Math.random()<.6?groom():setMode('sit',rr(2500,5000))}, // หลังกินมักเลียขน · ขออาหาร: มองเสร็จแล้วถูหัว
  shy:()=>setMode('sit',rr(2000,4000)),pet:()=>setMode('sit',rr(2500,5000)),notice:()=>setMode('sit',rr(2000,4000)),annoy:()=>{cat.lv=0;setMode('sit',rr(2500,4500))},sblink:()=>setMode('sit',rr(2500,5000))})[m]()}
function catPose(){const m=cat.mode,D=cat.dir>0?'R':'L';if(m==='walk'||m==='run')return[(m==='walk'&&(cat.then==='greet'||cat.then==='come'||cat.then==='beg')?'walkUp':m)+D,Math.floor(cat.dist/GAIT[m].step)%GAIT[m].n];if(m==='skid')return['stand'+(cat.dir>0?'L':'R'),0]; // หยุดกึกยังหันทางเดิมก่อนกลับตัว
 if(m==='crouch'||m==='pounce'||m==='pin'){const k=m+D;return[k,playing?frameAt(DUR[k],cat.t):0]}
 if(m==='circle'&&cat.cs){let t=cat.t,i=0;while(i<cat.cs.length-1&&t>=cat.cs[i][2])t-=cat.cs[i++][2];const[q,d]=cat.cs[i],k=q+(d>0?'R':'L');return[k,playing?frameAt(DUR[k],t):0]} // หมุนตัวก่อนนอน
 const k=m==='rise'||m==='halt'?'stand'+D:m==='turnOut'||m==='turnIn'?'turn'+D:m==='stretch'||m==='hind'||m==='sniff'?m+D:(m==='pose'?cat.pose:{sit:'sit',boxin:'sit',box:cat.bz?'doze':'sit',boxout:'sit',loaf:'doze',nap:'doze',wake:'doze',curl:'curl',shy:'shy',groom:cat.gk||'groom',pet:'pet',notice:'curious',annoy:cat.lv>1?'lash':'annoyed',sblink:'slowBlink',yawn:'yawn',knead:'knead',bask:'bask'}[m]);return[k,playing?frameAt(DUR[k],cat.t):0]}
const sprC={};function sprite(k,f,tm,coat,acc,idle){const key=[k,f,tm,coat,acc,idle].join('|');let v=sprC[key];if(!v){v=document.createElement('canvas');v.width=W;v.height=H;draw(v.getContext('2d'),frame(k,f,tm,coat,acc,idle));sprC[key]=v}return v}
// ---------- ผูกกับแอป ----------
// ท่าอารมณ์ตามเหตุการณ์: ถ้าแมวกำลังเดิน/หันตัวอยู่ให้รอจบก่อน (ไม่ให้ท่าสะดุด) แล้วค่อยเล่นตอนนั่งพัก
const CALM={sit:1,pose:1,shy:1,groom:1,wake:1,loaf:1,curl:1,nap:1,pet:1,notice:1,annoy:1,sblink:1,yawn:1,knead:1,bask:1,box:1},SLEEPM={curl:1,loaf:1,nap:1,wake:1},TAPM={shy:1,wake:1,pet:1,notice:1,annoy:1,sblink:1}; // TAPM = ท่าตอบการแตะ เดินต่อได้แม้ปิดแอนิเมชัน
// ---------- แตะแมว: แยกโซน + มาตรวัดความทน (รายงานพฤติกรรมข้อ 4 · v60) ----------
// แมวชอบให้ลูบหัว/ขมับที่สุด ไม่ชอบโคนหางที่สุด (Soennichsen & Chamove 2002, Ellis 2015) · ให้แมวได้เลือกเอง แตะถี่เกินไปแมวเตือนเป็นขั้นแล้วเดินหนี (Haywood 2021)
// ไม่มีงานวิจัยบอกว่าลูบได้กี่ครั้ง ตัวเลขทั้งหมดเป็นค่าของเกม: มาตรวัดเพิ่มตามน้ำหนักของโซน ลดลง 0.2 ต่อวิ
//   แตะหัวห่างกัน ~2 วิ: ราวครั้งที่ 6 เริ่มเตือน · แตะรัว: ครั้งที่ 4 เตือน ครั้งที่ 7 เดินหนี · โซนตัว/หางทนได้น้อยกว่า · ร่าง 2/3 (สนิทขึ้น) ทนได้มากขึ้น
// ท่าตอบการแตะ: docs/PET_PIXEL.md หัวข้อ "กติกาการออกแบบที่ test ตรวจไม่ได้"
const TAPW={head:1,body:1.5,tail:2.5,belly:2,sleep:.5,move:.5},TOL=[3.5,5,6.5],TOL_DECAY=.2,TOLK=[1,1,1.15,1.3],SHYP=[0,.4,.15,0]; // SHYP = โอกาสเขินแทนถูกลูบ ตามร่าง (ยังไม่สนิทเขินบ่อย)
cat.tol=0;cat.cool=0;cat.lv=0;
// โซนจากจุดที่แตะ (พิกัดฉาก): ท่านั่งหันหน้า หัว = ครึ่งบน · หาง = ขอบขวา · ที่เหลือ = ตัว · ท่าโชว์พุง หัวอยู่ซ้าย
function zoneAt(x,y){const sx=x-Math.round(cat.x),sy=y-CY,m=cat.mode;if(SLEEPM[m])return'sleep';if(!CALM[m])return'move';
 if(cat.k==='belly'||cat.k==='bask')return sx<20?'head':'belly';if(sy<31&&Math.abs(sx-24)<15)return'head';return sx>=37?'tail':'body'}
const tolLv=()=>{const t=pk('tol'),k=(TOLK[S.stage]||1)*(Array.isArray(t)?t[S.stage-1]:t);return cat.tol>=TOL[2]*k?3:cat.tol>=TOL[1]*k?2:cat.tol>=TOL[0]*k?1:0};
// ตำแหน่งหัวในฉาก (ขอบบนของภาพเฟรมปัจจุบัน) ไว้วางเอฟเฟกต์
function headAt(){const c=cur||{k:'sit',f:0,tm:'light',idle:null},b=bbox(c.k,c.f,c.tm,c.idle);return{x:Math.round(cat.x)+b.cx,y:CY+Math.round(cat.dy||0)+b.t}}
const forceIdle=(n,side)=>{cat.ev=cat.ev||{};cat.ev[n]=performance.now();if(side)cat.side=side}; // หูกระดิก/หางสะบัดทันที (ผ่าน idleAt)
// แตะแมว: z = โซน (head body tail belly sleep move) · x,y = จุดที่แตะในฉาก (ไม่ส่ง = กลางหัว เช่น กด Enter)
function poke(z,x,y){const m=cat.mode,h=headAt();cat.beg=0; // แตะระหว่างขออาหาร: ตอบการแตะแทน ไม่ถูหัวต่อ
 if(m==='box'||m==='boxin'||m==='boxout'){if(x==null){x=h.x;y=h.y+6}fx('tap',x,y);forceIdle('twitch',x<h.x?'L':'R');if(cat.bz&&m==='box'){cat.bz=false}if(!talking())say([['ニャ？',900]]);return} // อยู่ในกล่อง: หูกระดิก ลืมตา ไม่ออกมา (ที่หลบของแมว ไม่บังคับออก)
 z=z||(SLEEPM[m]?'sleep':CALM[m]?'head':'move');if(x==null){x=h.x;y=h.y+8}const side=x<h.x?'L':'R';
 if(cat.cool>0||cat.then==='leave'){fx('tap',x,y,{c:FX});if(!FXS.some(e=>e.type==='dots'))fx('dots',h.x>SW-34?h.x-22:h.x+13,h.y+6);return forceIdle('twitch',side)} // เพิ่งหนีไป: ยังไม่อยากเล่น แค่หูกระดิก …
 cat.tol+=TAPW[z]||1;const lv=tolLv();
 if(z==='sleep'){fx('tap',x,y);if(m!=='wake')setMode('wake',1400);return} // หลับ/งีบ: ตื่น
 if(z==='move')return fx('tap',x,y); // กำลังเดิน/วิ่ง/หันตัว: ไม่ตัดกลางก้าว
 if(lv>=3)return leave();
 if(lv>=1||z==='tail'||z==='belly'){fx('tap',x,y,{c:FX});if(cat.k==='belly'&&lv<2)return forceIdle('flick'); // แตะพุงตอนโชว์พุง: ปลายหางสะบัด (โชว์พุง = ทักทาย ไม่ใช่ให้ลูบพุง)
  const a=Math.max(1,lv);if(a>1&&!(m==='annoy'&&cat.lv>1)){fx('vein',h.x+15,h.y+3);say([['ムッ',1100]])}cat.lv=a;return setMode('annoy',a>1?1600:1300)}
 const busy=m==='pose'&&cat.pose!=='curious'; // กำลังเล่นท่าตามเหตุการณ์ (กิน ดีใจ): ไม่ขัด มีแค่เอฟเฟกต์
 if(z==='head'){fx('tap',x,y,{c:HEART});hearts(h);if(++pets===3&&TIP)TIP('blink');if(busy)return;if(m==='pet'){cat.dur=cat.t+2200;return}
  if(Math.random()<Math.min(.8,(SHYP[S.stage]||0)*pk('shy')))return setMode('shy',1600);setMode('pet',2200);
  // ลูบหัวแล้วบางครั้งพูดต่อตามนิสัย (ช่อง pat ใน js/data/pet-lines.js) ความถี่ตาม voc: พลังล้นพูดบ่อยสุด เงียบสงบน้อยสุด (รายงานบทพูด: ความถี่การพูดต่างกันตามนิสัย)
  const ln=LINE&&Math.random()<Math.min(.9,.65*pk('voc'))?LINE('pat'):'';return say([['ゴロゴロ…',ln?1300:1800]],ln)}
 fx('tap',x,y);if(busy)return;if(m!=='notice')say([['ニャ？',900]],MAIN);setMode('notice',1300)} // แตะตัว: หันมอง หูกระดิก แล้วพูดประโยคหลักอีกครั้ง
// ขั้นที่ 3: ぷいっ แล้วเดินหนีไปอีกฝั่ง เลียขน (เลียขนหลังเครียด) พักราว 15–20 วิ · ปิดแอนิเมชัน: ไม่เดิน แค่ทำหน้ารำคาญแล้วพัก
function leave(){say([['ぷいっ',1300]]);cat.lv=0;cat.pend=null;
 if(!playing){cat.cool=rr(15000,20000)*pk('cool');return setMode('annoy',1300)}
 if(boxOn()&&Math.abs(cat.x-BOX.cx)>8)return goTo(BOX.cx,'boxhide'); // วันที่มีกล่อง: หนีไปมุดกล่องแทน (ที่หลบช่วยให้แมวฟื้นจากความเครียดเร็วขึ้น Vinke 2014)
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
function doAct(k,ms){if(k==='beg'){if(CALM[cat.mode]){cat.pend=null;beg()}else cat.pend={k,ms};return} // ขออาหาร: ลำดับพฤติกรรม ไม่ใช่ท่าเดียว
 if(!POSES[k])return;if(CALM[cat.mode]){cat.pend=null;act(k,ms)}else cat.pend={k,ms}}
let cv=null,io=null,raf=0,last=0,vis=true,sLast='',pending=null,booted=false;
// กลางวัน/กลางคืนของฉากตามเวลาจริงของเครื่อง (06:00–17:59 = กลางวัน) ไม่ผูกกับโหมดมืดของแอป (เจ้าของขอ 2026-11-19: เช้าแล้วห้องยังมืด)
// ภาพแมวใช้ชุดสีตามฉาก (กลางคืน = เส้นขอบสว่าง) หน้าแอปยังมืด/สว่างตามเครื่องเหมือนเดิม
// 4 ช่วง (เจ้าของขอ 2026-11-19): รุ่งเช้า 05:00–06:59 · กลางวัน 07:00–16:59 · พลบค่ำ 17:00–18:59 · กลางคืน 19:00–04:59
let TOD=null;const tod=(d=new Date())=>{if(TOD)return TOD;const h=d.getHours();return h>=5&&h<7?'dawn':h>=7&&h<17?'day':h>=17&&h<19?'dusk':'night'};
const thm=()=>tod()==='night'?'dark':'light'; // ชุดสีของภาพแมว (กลางคืน = เส้นขอบสว่าง)
const skey=t=>t==='day'?'light':t==='night'?'dark':t; // ชุดสีฉาก
let NOW=null; // เวลาของสิ่งที่ขยับในฉาก (null = นาฬิกาจริง) ตั้งได้จาก _t.setNow() ไว้ทดสอบ/ทำภาพพรีวิว
function paint(){if(FXS.length)sLast='';const td=tod(),tm=thm(),sk=skey(td),[k,f]=catPose();cat.k=k;const now=performance.now(),idle=idleAt(cat,now),X=Math.round(cat.x),s=SCN(),
  A={t:now,ms:NOW??Date.now(),d:new Date(),P:playing,td,sk},key=[k,f,idle,X,sk,S.coat,S.acc,PLACE,s.tick?s.tick(A):'',sk==='dark'?moonKey(A.ms):'',season(A.ms)+bkey(),cat.dy||0].join('|');
 cur={k,f,idle,X,tm};if(key===sLast)return;sLast=key;const sx=cv.getContext('2d'),pal=palOf(s,sk);sx.clearRect(0,0,SW,SH);
 if(s.far)sx.drawImage(layer('far',sk),0,0);if(s.air)s.air(sx,pal,A);if(s.mid)sx.drawImage(layer('mid',sk),0,0);if(s.back)s.back(sx,pal,A); // ไกล → เมฆ → ราง → รถไฟ
 sx.drawImage(layer('bg',sk),0,0);if(s.live)s.live(sx,pal,A);
 const dy=Math.round(cat.dy||0);if(dy){sx.save();sx.beginPath();sx.rect(0,0,SW,BOX.top+1);sx.clip()} // ในกล่อง: ตัดส่วนที่ต่ำกว่าขอบปากกล่อง (ขา หางที่ห้อยลง) ไม่ให้โผล่ใต้/ข้างกล่อง
 sx.drawImage(sprite(k,f,tm,S.coat,S.acc,idle),X,CY+dy);if(dy)sx.restore();sx.drawImage(sceneFg(sk),0,0);if(s.front)s.front(sx,pal,A);if(FXS.length)fxDraw(sx,tm);
 if(WARM[td]){sx.save();sx.globalCompositeOperation='multiply';sx.fillStyle=WARM[td];sx.fillRect(0,0,SW,SH);sx.restore()} // แสงอุ่นทั้งภาพ
 if(s.over)s.over(sx,pal)}
// กล่องคำพูดลอยเหนือหัวสัตว์เลี้ยงและเลื่อนตามเวลาเดิน (เจ้าของขอ 2026-11-18): หาขอบบนของภาพเฟรมปัจจุบัน แล้วค่อยๆ ไล่ตาม ไม่ให้กระตุก
// ไม่ให้ล้นขอบฉาก ถ้าชิดขอบ หางกล่องยังชี้ที่หัว · ไม่มีที่ว่างเหนือหัว (หัวสูง/กล่องสูง) จะชิดขอบบนแทน
const BB={};function bbox(k,f,tm,idle){const key=[k,f,tm,S.coat,S.acc,idle].join('|');if(BB[key])return BB[key];const g=frame(k,f,tm,S.coat,S.acc,idle);let t=H,l=W,r=-1;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(g[y][x]){if(y<t)t=y;if(x<l)l=x;if(x>r)r=x}return BB[key]={t:t<H?t:20,cx:r>=0?(l+r+1)/2:24}}
let cur=null,bub=null,bx=null,by=null,bw=0,bh=0,bLast='',ro=null,sayT=0,hideT=0,MAIN='',mainUntil=0,LINE=null,RMS=0,pendGreet=0;
// กล่องคำพูดขึ้นเฉพาะตอนสัตว์เลี้ยงพูด แล้วค่อยๆ จางหายเอง (เจ้าของขอ 2026-11-19 · เดิมค้างตลอด) เวลาตามความยาวประโยค 4–9 วิ
// ประโยคหลักของหน้าแรก (MAIN) ขึ้นตอนวาดหน้า ถ้าเพิ่งขึ้นประโยคเดิมไปไม่ถึง 2 นาที (เช่น วาดหน้าใหม่หลังให้อาหาร) ไม่ขึ้นซ้ำ · แตะตัวแมว = พูดประโยคหลักอีกครั้ง
const SEEN={t:'',at:0},readMs=h=>RMS||clamp(2600+h.replace(/<rt>.*?<\/rt>|<[^>]*>/g,'').length*80,4000,9000);
const talking=()=>!!bub&&bub.classList.contains('on');
function bhide(ms){clearTimeout(hideT);if(!bub)return;if(ms>0){hideT=setTimeout(()=>bhide(0),ms);return}bub.classList.remove('on')}
function talk(h,ms){if(!bub||!h)return;clearTimeout(sayT);bub.innerHTML=h;bw=0;bub.classList.add('on');bhide(ms||readMs(h))}
// ฟองคำพูดชั่วคราว (เสียงแมวภาษาญี่ปุ่น): seq = [[ข้อความ, ms], ...] · after = ประโยคที่พูดต่อ (ลูบหัว แตะตัว)
// ไม่มี after: คืนประโยคหลัก ถ้ายังอยู่ในช่วงแสดงประโยคหลักก็แสดงต่อ ไม่งั้นจางหาย
function say(seq,after){if(!bub)return;clearTimeout(sayT);clearTimeout(hideT);bub.classList.add('on');
 const next=i=>{if(!bub)return;if(i>=seq.length){if(after)return talk(after);bub.innerHTML=MAIN;bw=0;const left=mainUntil-Date.now();return bhide(left>500?Math.max(left,2500):0)}
  bub.textContent=seq[i][0];bw=0;sayT=setTimeout(()=>next(i+1),seq[i][1])};next(0)}
function bubble(dt){if(!bub||!cur)return;const b=bbox(cur.k,cur.f,cur.tm,cur.idle),tx=cur.X+b.cx,ty=CY+Math.round(cat.dy||0)+b.t-2;
 if(bx==null){bx=tx;by=ty}else{const a=Math.min(1,dt/140);bx+=(tx-bx)*a;by+=(ty-by)*a}
 const W2=cv.clientWidth,H2=cv.clientHeight;if(!W2)return;if(!bw){bw=bub.offsetWidth;bh=bub.offsetHeight;bLast=''}
 const px=bx/SW*W2,L=clamp(px,bw/2+6,W2-bw/2-6),T=Math.max(by/SH*H2-8,bh+6),tl=clamp(px-L+bw/2,16,bw-16),key=Math.round(L)+'|'+Math.round(T)+'|'+Math.round(tl);
 if(key===bLast)return;bLast=key;bub.style.transform=`translate(${Math.round(L-bw/2)}px,${Math.round(T-bh)}px)`;bub.style.setProperty('--tl',Math.round(tl)+'px');bub.classList.add('pl')} // pl = วางตำแหน่งแล้ว (ก่อนหน้านั้นซ่อนไว้ ไม่ให้กระพริบที่มุมซ้ายบน)
function loop(now){if(!cv||!cv.isConnected){stop();return}const dt=Math.min(now-last,100);last=now;
 if(vis&&!document.hidden){if(cat.pend&&CALM[cat.mode]){const p=cat.pend;cat.pend=null;doAct(p.k,p.ms)}step(dt);fxStep(dt);paint();bubble(dt)}
 raf=requestAnimationFrame(loop)}
let hold=null;const dropHold=()=>{FXS=FXS.filter(f=>f.type!=='hold');sLast=''};
function endHold(tap){if(!hold)return;clearTimeout(hold.tm);const h=hold;hold=null;dropHold();if(tap&&!h.done)poke('head',h.x,h.y)}
function stop(){endHold(false);clearTimeout(sayT);clearTimeout(hideT);cancelAnimationFrame(raf);raf=0;if(io){io.disconnect();io=null}if(ro){ro.disconnect();ro=null}cv=null;bub=null}
function fit(){if(!cv||!cv.parentElement||cv.closest('.scn'))return; // อยู่ในฉากสถานที่: CSS ขยายเต็มการ์ดเอง
 const w=cv.parentElement.clientWidth||SW*2,s=w>=SW*2?Math.min(5,Math.floor(w/SW)):w/SW;cv.style.width=SW*s+'px';cv.style.height=SH*s+'px'}
// ใส่แมวลงผืนผ้าใบ (เรียกทุกครั้งที่วาดหน้าหลักใหม่ สถานะแมวต่อเนื่องจากครั้งก่อน)
function mount(canvas,o={}){stop();cv=canvas;S.coat=COATS[o.coat]?o.coat:'cream';S.acc=o.acc||'none';S.stage=o.stage||1;PS=PERS[o.trait]||{};FXS=[];TIP=o.onTip||null;pets=0;hold=null;{const np=SCENES[o.place]?o.place:'room';if(np!==PLACE)AT_MS=0;PLACE=np}FAM=o.fam||99;CHR=o.chrono||0;sLast='';vis=true;clearTimeout(sayT);clearTimeout(hideT);bub=o.bubble||null;MAIN=bub?bub.innerHTML:'';LINE=o.line||null;mainUntil=0;bx=by=null;bw=0;cur=null;
 if(bub&&'ResizeObserver'in window){ro=new ResizeObserver(()=>{bw=0});ro.observe(bub);ro.observe(cv)} // ขนาดกล่อง/ฉากเปลี่ยน (ฟอนต์โหลดเสร็จ หมุนจอ) วัดใหม่
 cv.width=SW;cv.height=SH;cv.tabIndex=0;cv.setAttribute('role','button');cv.setAttribute('aria-label',(o.label||'แมว')+' แตะหัวเพื่อลูบ กดค้างที่หัวเพื่อกะพริบตาช้าใส่');
 // นิ้ว เมาส์ Apple Pencil ใช้ pointer event เดียวกัน · โซนอื่นตอบทันทีตอนแตะลง · หัวรอดูว่าแตะ (ลูบหัวตอนยกนิ้ว) หรือกดค้าง (กะพริบตาช้า) มีวงแหวนชมพูค่อยๆ เต็มให้รู้ว่ากำลังกดค้าง
 const pt=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)/r.width*SW,(e.clientY-r.top)/r.height*SH]};
 cv.addEventListener('pointerdown',e=>{const[x,y]=pt(e),X=Math.round(cat.x);if(!(x>=X+4&&x<=X+44&&y>=CY+4&&y<=CY+46))return;const z=zoneAt(x,y);
  if(z!=='head'||cat.k==='belly'||cat.cool>0)return poke(z,x,y);
  endHold(false);fx('hold',x,y);hold={x,y,tm:setTimeout(()=>{if(!hold)return;hold.done=1;dropHold();if(!slowBlink(1))poke('head',hold.x,hold.y)},HOLD)};
  try{cv.setPointerCapture(e.pointerId)}catch(err){console.warn('จับนิ้วไว้ที่ฉากแมวไม่ได้',err)}});
 cv.addEventListener('pointerup',()=>endHold(true));cv.addEventListener('pointercancel',()=>endHold(false));
 cv.addEventListener('pointermove',e=>{if(!hold||hold.done)return;const[x,y]=pt(e);if(Math.hypot(x-hold.x,y-hold.y)>6)endHold(true)}); // ลากออกไป = นับเป็นแตะ
 cv.addEventListener('contextmenu',e=>e.preventDefault()); // กดค้างไม่ให้เมนูของระบบเด้ง
 cv.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();poke()}});
 if('IntersectionObserver'in window){io=new IntersectionObserver(es=>{vis=es[0].isIntersecting;sLast=''});io.observe(cv)} // ไม่อยู่บนจอ = ไม่คำนวณ ไม่วาด
 if(!booted){booted=true;if(o.sleepy){if(SCN().bed!=null){cat.x=SCN().bed;cat.dir=1;setMode('curl',rr(24000,36000))}else setMode('nap',rr(8000,14000))}} // เปิดแอปดึกๆ: ในห้องหลับอยู่บนเบาะ ที่อื่นงีบหมอบ
 fit();paint();bubble(0);
 if(bub){const now=Date.now();if(SEEN.t!==MAIN||now-SEEN.at>=12e4){SEEN.t=MAIN;SEEN.at=now;const ms=readMs(MAIN);mainUntil=now+ms;talk(MAIN,ms)}}
 if(pendGreet){const g=pendGreet;pendGreet=0;greet(g)}
 if(pending&&Date.now()-pending.t<6e5){doAct(pending.k,pending.ms)}pending=null; // ท่าอารมณ์ที่เกิดตอนไม่ได้อยู่หน้าหลัก เล่นให้ดูตอนกลับมา (ไม่เกิน 10 นาที)
 last=performance.now();raf=requestAnimationFrame(loop)}
// ส่งท่าตามเหตุการณ์ในแอป: อยู่หน้าหลักเล่นทันที ไม่อยู่ก็เก็บไว้เล่นตอนกลับมา
function cue(k,ms=1800){if(cv&&cv.isConnected)doAct(k,ms);else pending={k,ms,t:Date.now()}}
addEventListener('resize',fit);
document.addEventListener('visibilitychange',()=>{last=performance.now();sLast=''});
// frame/fall ใช้ในแผนที่เมือง (js/town.js): frame = ภาพแมวหนึ่งเฟรมเป็นตาราง 48×48 สี (ไม่ต้อง mount) · fall = ของตกตามฤดูลงผืนผ้าใบใดก็ได้ (หิมะเฉพาะวันที่หิมะตก)
window.PixelCat={mount,unmount:stop,cue,act:doAct,poke,greet,say,tod,season:()=>season(),coats:Object.keys(COATS),poses:KEYS,places:Object.keys(SCENES),
 frame:(k,f,tm,coat,acc)=>frame(k,f,tm,COATS[coat]?coat:'cream',acc||'none'),fall:(c,se,R,n,ms=Date.now(),sk='light')=>fall(c,{P:true,ms,sk},se,R,n),
 _t:{step,cat,sceneBg,sceneFg,SW,SH,CY,bbox,bubblePos:()=>bub&&bub.style.transform,seen:SEEN,setReadMs:v=>{RMS=v},talking,XMIN,XMAX,frame,draw,W,H,COATS,KEYS,IDLE_NAMES,setPlaying:v=>{playing=v},setPart:v=>{PART=v},dayPart,setTod:v=>{TOD=v},setTrait:i=>{PS=PERS[i]||{}},PERS,setFam:(n,ms=0)=>{FAM=n;AT_MS=ms},wary,PLW,slowBlink,zoneAt,tolLv,headAt,fxs:()=>FXS,TOL,TOLK,palOf:(id,sk)=>palOf(SCENES[id],sk),layer,scenes:SCENES,trainX,birdAt,shishiA,setNow:v=>{NOW=v;sLast=''},setSeason:v=>{SEAS=v;sLast=''},sniffGo,novel,circleSteps,setBox:v=>{BOXF=v;sLast=''},setChrono:v=>{CHR=v},setJit:v=>{JITF=v!==false},boxDay,BOX,setBoxSeen:v=>{BOX_SEEN=v?boxKey():''},leave,poke,decide,catPose,setSnow:v=>{SNOWF=v;sLast=''},setLat:d=>{LAT=d*Math.PI/180;MOON=moonAt(NOW??Date.now());for(const k in bgC)delete bgC[k];sLast=''},latOf,lat:()=>LAT*180/Math.PI,snowDay,season,fall,moonAt,moonKey,moonIdx,moonBmp,moonGlow,DUR,bflyAt,baskX,sunSkew,BIRD_ON,TRAIN_T,hunt,birdSeen,trainSeen,goTo,sceneW,
  // ตัวช่วยวาดสำหรับร่างท่าในหน้าพรีวิว/ไฟล์ร่างใน docs/ (เพิ่มท่าร่างลง POSES แล้วเรียก frame ได้) แอปไม่ได้ใช้
  POSES,lib:{sitCat,sdBox,sdEll,sdCap,smin,ear,earPts,headMat,tail,P,put,bean,eyeClosed,eyeSleepy,eyeHappy,mouth,blush,zz,bowPart,RAMP,EYE,IRIS,NOSE,FX,fr,get ACC(){return ACC},get IDLE(){return IDLE}}}};
})();
