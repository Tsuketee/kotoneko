// ฉากพิกเซล 7 สถานที่ (ห้อง สวน คาเฟ่ สถานี ร้านสะดวกซื้อ ห้องเรียน ศาลเจ้า): สี ฤดู ชั้นภาพ และของที่ขยับ · แยกจาก js/pixelcat.js (ถอนวัชพืชข้อ 16)
// js/pixelcat.js เรียก PixelScenes(kit) ตอนโหลด (ไฟล์นี้ต้องโหลดก่อน) · kit = ตัวช่วยวาดและสถานะของ pixelcat.js · คืนฟังก์ชัน/สีของทุกฉากให้ SCENES ในไฟล์นั้น
// กติกาการวาดฉาก: docs/PET_PIXEL.md หัวข้อ "กติกาการออกแบบที่ test ตรวจไม่ได้"
const PixelScenes = k => {
const { dot, rect, SW, SH, blob, moonSky, moonXY, cloudImg, poly, stem, boxOn, limb, BOX, clamp, moonAt, moonIdx, season, fallIn, falling, sky, wood, clumpPad, rng, ring, fall, cloudKey, monLeaf, snowDay } = k;
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
return { RSEA, roomBg, roomFg, roomLive, roomTick, roomLight, GCOL, GSEA, gardenFar, gardenMid, gardenBg, gardenLive, gardenFg, gardenFront, gardenTick, KCOL, KSEA, cafeBg, cafeLive, cafeFg, cafeFront, cafeTick, TCOL, TSEA, stationFar, stationMid, stationBack, stationBg, stationFg, stationFront, stationTick, KBCOL, KBSEA, kbBg, kbLive, kbFg, kbTick, CLCOL, CLSEA, clBg, clLive, clFg, clTick, JNCOL, JNSEA, jnFar, jnMid, jnBg, jnLive, jnFg, jnFront, jnTick, birdAt, BIRD_ON, BIRD_T, trainX, TRAIN_T, sunSkew, bflyAt, shishiA, moonGlow };
};
