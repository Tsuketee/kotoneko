// ตรรกะหลักของแอป (ใช้ตัวแปร global จากไฟล์ใน js/data/ ที่โหลดก่อนหน้า)
const PAL=['#e05a5a','#3aa65f','#4a86d8','#e0952f','#9b59b6','#16a5a5','#c2528b','#7a8c2e'];
const KA=[];{
const mk=(hs,ks,r,t,c,g)=>{const R=r.split(' '),T=t.split(' ');hs.forEach((x,i)=>KA.push({k:x,o:R[i],u:'-',m:'เสียง "'+T[i]+'"',c,g,sc:'h'}));ks.forEach((x,i)=>KA.push({k:x,o:R[i],u:'-',m:'เสียง "'+T[i]+'"',c,g,sc:'k'}))};
[['あいうえお','アイウエオ','a i u e o','อะ อิ อุ เอะ โอะ','あ/ア'],['かきくけこ','カキクケコ','ka ki ku ke ko','คะ คิ คุ เคะ โคะ','か/カ'],['さしすせそ','サシスセソ','sa shi su se so','ซะ ชิ สุ เซะ โซะ','さ/サ'],['たちつてと','タチツテト','ta chi tsu te to','ทะ จิ ทสึ เทะ โทะ','た/タ'],['なにぬねの','ナニヌネノ','na ni nu ne no','นะ นิ นุ เนะ โนะ','な/ナ'],['はひふへほ','ハヒフヘホ','ha hi fu he ho','ฮะ ฮิ ฟุ เฮะ โฮะ','は/ハ'],['まみむめも','マミムメモ','ma mi mu me mo','มะ มิ มุ เมะ โมะ','ま/マ'],['やゆよ','ヤユヨ','ya yu yo','ยะ ยุ โยะ','や/ヤ'],['らりるれろ','ラリルレロ','ra ri ru re ro','ระ ริ รุ เระ โระ','ら/ラ'],['わをん','ワヲン','wa wo n','วะ โอะ ง/น','わ/ワ']].forEach(x=>mk([...x[0]],[...x[1]],x[2],x[3],x[4],'b'));
[['がぎぐげご','ガギグゲゴ','ga gi gu ge go','กะ กิ กุ เกะ โกะ','が/ガ'],['ざじずぜぞ','ザジズゼゾ','za ji zu ze zo','ซะ จิ ซุ เซะ โซะ','ざ/ザ'],['だぢづでど','ダヂヅデド','da ji zu de do','ดะ จิ ซุ เดะ โดะ','だ/ダ'],['ばびぶべぼ','バビブベボ','ba bi bu be bo','บะ บิ บุ เบะ โบะ','ば/バ'],['ぱぴぷぺぽ','パピプペポ','pa pi pu pe po','ปะ ปิ ปุ เปะ โปะ','ぱ/パ']].forEach(x=>mk([...x[0]],[...x[1]],x[2],x[3],x[4],'d'));
[['き','キ','kya kyu kyo','เคียะ คิว เคียว'],['し','シ','sha shu sho','ชะ ชุ โชะ'],['ち','チ','cha chu cho','ฉะ ฉุ โฉะ'],['に','ニ','nya nyu nyo','เนียะ นิว เนียว'],['ひ','ヒ','hya hyu hyo','เฮียะ ฮิว เฮียว'],['み','ミ','mya myu myo','เมียะ มิว เมียว'],['り','リ','rya ryu ryo','เรียะ ริว เรียว'],['ぎ','ギ','gya gyu gyo','เกียะ กิว เกียว'],['じ','ジ','ja ju jo','จะ จุ โจะ'],['び','ビ','bya byu byo','เบียะ บิว เบียว'],['ぴ','ピ','pya pyu pyo','เปียะ ปิว เปียว']].forEach(x=>{const f=(b,s)=>[...s].map(c=>b+c);mk(f(x[0],'ゃゅょ'),f(x[1],'ャュョ'),x[2],x[3],x[0]+'ゃ/'+x[1]+'ャ','y')})}
const DS={a:{n:'ฮิระงะนะ・คะตะคะนะ',d:KA,key:'ka1'},k:{n:'คันจิ N5',d:K,key:'kn5'},w:{n:'คำที่เขียนด้วยคันจิ',d:W,key:'kw1'},v:{n:'คำศัพท์คะนะ',d:V,key:'kv1'}};
let ks='h',tab='home',ds='k',view='s',fur=true,dl=1,CATS=['ทั้งหมด',...new Set(K.map(x=>x.c))];
const IV=[0,600000,86400000,259200000,604800000,1209600000];
function load(){try{return JSON.parse(localStorage.getItem(DS[ds].key)||'{}')}catch(e){return{}}}
function save(){try{localStorage.setItem(DS[ds].key,JSON.stringify(S))}catch(e){}}
let S=load(),st=[],lc=0,tool='pen',esz=14,ep=null,wi=0,ci=0,guide=2,cat='ทั้งหมด',mode='card',qt='read',prac=0,cur=null,ch=null,ans=null,fl=false;
const pool=()=>K.filter(x=>(ds!=='a'||ks==='all'||x.sc===ks)&&(cat==='ทั้งหมด'||(cat==='ผิดบ่อย'?(S[x.k]&&S[x.k].w>=2):x.c===cat)));
const rd=x=>x.o+(x.u!=='-'?' ・ '+x.u:'');
const sh=a=>a.map(v=>[Math.random(),v]).sort((p,q)=>p[0]-q[0]).map(v=>v[1]);
function pick1(){const p=pool(),n=Date.now();
 const due=p.filter(x=>S[x.k]&&S[x.k].d<=n).sort((a,b)=>S[a.k].d-S[b.k].d);
 if(due.length)return due[0];
 const nw=p.filter(x=>!S[x.k]);if(nw.length)return mode==='quiz'?nw[Math.floor(Math.random()*nw.length)]:nw[0];
 return prac?sh(p)[0]:null}
function go(){st=[];ci=0;cur=null;ch=null;ans=null;fl=false;render()}
document.onselectstart=e=>e.preventDefault();const MK='kn_meta';let M={};try{M=JSON.parse(localStorage.getItem(MK)||'{}')}catch(e){}M.goal=M.goal||20;M.days=M.days||{};
const dstr=x=>x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');
function saveM(){try{localStorage.setItem(MK,JSON.stringify(M))}catch(e){}}
function toast(m){const e=document.createElement('div');e.className='toast';e.innerHTML=m;document.body.appendChild(e);setTimeout(()=>e.remove(),2300)}
function tick(){const k=dstr(new Date());M.days[k]=(M.days[k]||0)+1;saveM();if(M.days[k]===M.goal)toast(IC.star+' ถึงเป้าวันนี้แล้ว!')}
function streak(){let n=0;const d=new Date();if((M.days[dstr(d)]||0)<M.goal)d.setDate(d.getDate()-1);while((M.days[dstr(d)]||0)>=M.goal){n++;d.setDate(d.getDate()-1)}return n}
function setGoal(){const g=[10,20,30,50,100];M.goal=g[(g.indexOf(M.goal)+1)%g.length];saveM();render()}
function goalHtml(){const t=M.days[dstr(new Date())]||0,g=M.goal;return `<div class="gl" onclick="setGoal()"><span>${IC.flame} ${streak()} วัน</span><div class="bar"><i style="width:${Math.min(100,t/g*100)}%"></i></div><span>${t}/${g}${t>=g?' '+IC.check:''}</span></div>`}
const DN={a:'คานะ',k:'คันจิ',w:'คำคันจิ',v:'คำศัพท์'};
function allMis(){const o=[];for(const k in DS){let s={};try{s=JSON.parse(localStorage.getItem(DS[k].key)||'{}')}catch(e){}DS[k].d.forEach(x=>{const r=s[x.k];if(r&&r.w>=1)o.push({k,x,w:r.w})})}return o.sort((a,b)=>b.w-a.w)}
function renderMis(){const L=allMis();let h=NAV()+`<h1>ที่ตอบผิดบ่อย</h1><div class="st">รวมทุกแท็บ · ผิดตั้งแต่ 2 ครั้งถือว่าผิดบ่อย · ตอบถูกต่อเนื่องแล้วจะหลุดจากรายการเอง</div>`;
 if(!L.length)h+=`<div class="card" style="margin-top:12px"><div class="k">${ic(P.star,72)}</div><div class="d">ยังไม่มีข้อที่ตอบผิด<br>ไปฝึกก่อนแล้วกลับมาดูนะคะ</div></div>`;
 else{const bs=Object.keys(DN).filter(k=>L.some(o=>o.k===k&&o.w>=2));
  if(bs.length)h+=`<div class="btns" style="margin:12px 0;flex-wrap:wrap">${bs.map(k=>`<button onclick="goMis('${k}')">ฝึก${DN[k]} (${L.filter(o=>o.k===k&&o.w>=2).length})</button>`).join('')}</div>`;
  h+=`<div class="card" style="text-align:left;min-height:0;padding:6px 14px;margin-top:12px">${L.slice(0,50).map(o=>`<div class="mi"><span class="mk">${o.x.k}</span><span class="mt"><b>${rd(o.x)}</b><br>${o.x.m}</span><span class="mw">ผิด ${o.w}</span></div>`).join('')}</div>`}
 document.getElementById('app').innerHTML=h}
function goMis(k){tab='learn';nv(k);mode='card';cat='ผิดบ่อย';go()}
function rec(ok){const nw=!S[cur.k],s=S[cur.k]||{b:0};s.b=ok?Math.min(5,s.b+1):0;if(!ok)s.w=(s.w||0)+1;else if(s.b>=3)s.w=0;s.d=Date.now()+(ok?IV[s.b]:30000);S[cur.k]=s;save();tick();if(ok)ptrack('rev');if(nw)ptrack('neu')}
function grade(ok){rec(ok);go()}
function pick(i){if(ans!==null)return;ans=i;rec(ch[i].ok);render();if(ch[i].ok){const c0=cur;setTimeout(()=>{if(cur===c0&&ans!==null)go()},700)}}
function mkch(){const f=x=>(ds==='a'||qt==='read')?rd(x):x.m;const c=f(cur);
 const o=sh(K.filter(x=>x.k!==cur.k&&f(x)!==c)).filter((x,i,a)=>a.findIndex(y=>f(y)===f(x))===i).slice(0,3);
 ch=sh([{t:c,ok:true},...o.map(x=>({t:f(x),ok:false}))])}
function nv(i){if(i==='d'||i==='m'||i==='n5'){view=i}else{view='s';ds=i;K=DS[i].d;CATS=['ทั้งหมด',...new Set(K.map(x=>x.c))];cat='ทั้งหมด';S=load();mode=i==='a'?'chart':'card';wi=0;ci=0;st=[];prac=0;cur=null;ch=null;ans=null;fl=false}render()}
const NAV=()=>tab==='learn'?`<div class="top"><button class="bk" onclick="tab='home';render()">‹</button><b>${view==='d'?'บทสนทนา':view==='n5'?'N5':DS[ds].n}</b></div>`:'';
const rb=s=>s.replace(/\{([^|}]*)\|([^}]*)\}/g,fur?'<ruby>$1<rt>$2</rt></ruby>':'$1');
let di=0,rom=true;const DIMG={};
const AVC=['#e0707a','#e0a14e','#5fae7c','#5b9bd5','#9b7fd1','#d56fa8','#4fb3b3','#c4895b'];
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
 ${bub}${done?'<div class="st" style="text-align:center">✅ อ่านแล้ววันนี้</div>':`<button class="lk" style="display:block;margin:10px auto" onclick="pdd(${di})">อ่านจบแล้ว ✓ (นับเป็นภารกิจ)</button>`}
 <div class="dnav"><button ${di?'':'disabled'} onclick="dgo(di-1)">← ก่อนหน้า</button><button ${di<D.length-1?'':'disabled'} onclick="dgo(di+1)">ถัดไป →</button></div>`}
const EXR=`一:一月|いちがつ|มกราคม|o;一つ|ひとつ|หนึ่งอัน|k;一人|ひとり|1 คน|s
二:二月|にがつ|กุมภาพันธ์|o;二つ|ふたつ|สองอัน|k;二人|ふたり|2 คน|s
三:三月|さんがつ|มีนาคม|o;三つ|みっつ|สามอัน|k
四:四月|しがつ|เมษายน|o;四つ|よっつ|สี่อัน|k;四人|よにん|4 คน|k
五:五月|ごがつ|พฤษภาคม|o;五つ|いつつ|ห้าอัน|k
六:六月|ろくがつ|มิถุนายน|o;六つ|むっつ|หกอัน|k
七:七月|しちがつ|กรกฎาคม|o;七つ|ななつ|เจ็ดอัน|k
八:八月|はちがつ|สิงหาคม|o;八つ|やっつ|แปดอัน|k
九:九月|くがつ|กันยายน|o;九つ|ここのつ|เก้าอัน|k
十:十月|じゅうがつ|ตุลาคม|o;十|とお|สิบ (นับของ)|k
百:百円|ひゃくえん|100 เยน|o;三百|さんびゃく|300|o
千:千円|せんえん|1,000 เยน|o;三千円|さんぜんえん|3,000 เยน|o
万:一万円|いちまんえん|10,000 เยน|o
円:百円|ひゃくえん|100 เยน|o;円高|えんだか|เยนแข็งค่า|o
日:日曜日|にちようび|วันอาทิตย์|o;日|ひ|วัน/ดวงอาทิตย์|k;今日|きょう|วันนี้|s
月:月曜日|げつようび|วันจันทร์|o;月|つき|ดวงจันทร์|k;一月|いちがつ|มกราคม|o
年:一年|いちねん|1 ปี|o;今年|ことし|ปีนี้|s
時:時間|じかん|เวลา/ชั่วโมง|o;時々|ときどき|บางครั้ง|k
分:十分|じゅっぷん|10 นาที|o;分かる|わかる|เข้าใจ|k
午:午前|ごぜん|ช่วงเช้า (ก่อนเที่ยง)|o;午後|ごご|ช่วงบ่าย|o
前:午前|ごぜん|ช่วงเช้า|o;前|まえ|ข้างหน้า/ก่อน|k
後:午後|ごご|ช่วงบ่าย|o;後ろ|うしろ|ข้างหลัง|k;後で|あとで|ทีหลัง|k
今:今月|こんげつ|เดือนนี้|o;今|いま|ตอนนี้|k;今朝|けさ|เช้านี้|s
毎:毎日|まいにち|ทุกวัน|o;毎週|まいしゅう|ทุกสัปดาห์|o
週:今週|こんしゅう|สัปดาห์นี้|o;来週|らいしゅう|สัปดาห์หน้า|o
間:時間|じかん|เวลา|o;間|あいだ|ระหว่าง|k
半:半分|はんぶん|ครึ่งหนึ่ง|o;三時半|さんじはん|สามโมงครึ่ง|o
何:何|なに|อะไร|k;何時|なんじ|กี่โมง|k
火:火曜日|かようび|วันอังคาร|o;火|ひ|ไฟ|k
水:水曜日|すいようび|วันพุธ|o;水|みず|น้ำ|k
木:木曜日|もくようび|วันพฤหัสบดี|o;木|き|ต้นไม้|k
金:金曜日|きんようび|วันศุกร์|o;お金|おかね|เงิน|k
土:土曜日|どようび|วันเสาร์|o;土|つち|ดิน|k
山:富士山|ふじさん|ภูเขาไฟฟูจิ|o;山|やま|ภูเขา|k
川:川|かわ|แม่น้ำ|k;小川|おがわ|ลำธารเล็ก|k
天:天気|てんき|อากาศ|o;天の川|あまのがわ|ทางช้างเผือก|k
気:天気|てんき|อากาศ|o;元気|げんき|แข็งแรง/สบายดี|o
雨:雨|あめ|ฝน|k;雨天|うてん|วันฝนตก|o
花:花|はな|ดอกไม้|k;花瓶|かびん|แจกัน|o
田:田んぼ|たんぼ|นาข้าว|k;水田|すいでん|นาข้าว|o
電:電話|でんわ|โทรศัพท์|o;電車|でんしゃ|รถไฟฟ้า|o
人:人|ひと|คน|k;日本人|にほんじん|คนญี่ปุ่น|o;三人|さんにん|3 คน|o
男:男の人|おとこのひと|ผู้ชาย|k;男性|だんせい|เพศชาย|o
女:女の人|おんなのひと|ผู้หญิง|k;女性|じょせい|เพศหญิง|o
子:子ども|こども|เด็ก|k;男子|だんし|เด็กผู้ชาย|o
父:お父さん|おとうさん|คุณพ่อ|k;父母|ふぼ|พ่อแม่|o
母:お母さん|おかあさん|คุณแม่|k;母国語|ぼこくご|ภาษาแม่|o
友:友達|ともだち|เพื่อน|k;友人|ゆうじん|เพื่อน (ทางการ)|o
先:先生|せんせい|ครู|o;先週|せんしゅう|สัปดาห์ที่แล้ว|o;先|さき|ข้างหน้า/ก่อน|k
生:学生|がくせい|นักเรียน|o;生まれる|うまれる|เกิด|k;一生|いっしょう|ตลอดชีวิต|o
学:学校|がっこう|โรงเรียน|o;学ぶ|まなぶ|เรียนรู้|k;大学|だいがく|มหาวิทยาลัย|o
名:名前|なまえ|ชื่อ|k;有名|ゆうめい|มีชื่อเสียง|o
目:目|め|ตา|k;目的|もくてき|เป้าหมาย|o
耳:耳|みみ|หู|k;耳鼻科|じびか|แผนกหู คอ จมูก|o
口:口|くち|ปาก|k;人口|じんこう|ประชากร|o
手:手|て|มือ|k;手紙|てがみ|จดหมาย|k;上手|じょうず|เก่ง|o
足:足|あし|เท้า/ขา|k;足りる|たりる|พอ/เพียงพอ|k;満足|まんぞく|พอใจ|o
力:力|ちから|กำลัง|k;電力|でんりょく|พลังงานไฟฟ้า|o
上:上|うえ|ข้างบน|k;上手|じょうず|เก่ง|o
下:下|した|ข้างล่าง|k;地下鉄|ちかてつ|รถไฟใต้ดิน|o
中:中|なか|ข้างใน|k;中国|ちゅうごく|จีน|o
外:外|そと|ข้างนอก|k;外国|がいこく|ต่างประเทศ|o
右:右|みぎ|ขวา|k;右折|うせつ|เลี้ยวขวา|o
左:左|ひだり|ซ้าย|k;左折|させつ|เลี้ยวซ้าย|o
北:北|きた|ทิศเหนือ|k;北海道|ほっかいどう|ฮอกไกโด|o
南:南|みなみ|ทิศใต้|k;東南|とうなん|ตะวันออกเฉียงใต้|o
東:東|ひがし|ทิศตะวันออก|k;東京|とうきょう|โตเกียว|o
西:西|にし|ทิศตะวันตก|k;関西|かんさい|คันไซ|o
大:大きい|おおきい|ใหญ่|k;大学|だいがく|มหาวิทยาลัย|o;大人|おとな|ผู้ใหญ่|s
小:小さい|ちいさい|เล็ก|k;小学校|しょうがっこう|โรงเรียนประถม|o
長:長い|ながい|ยาว|k;社長|しゃちょう|ประธานบริษัท|o
高:高い|たかい|สูง/แพง|k;高校|こうこう|มัธยมปลาย|o
安:安い|やすい|ถูก|k;安全|あんぜん|ปลอดภัย|o
新:新しい|あたらしい|ใหม่|k;新聞|しんぶん|หนังสือพิมพ์|o
古:古い|ふるい|เก่า|k;中古|ちゅうこ|มือสอง|o
白:白い|しろい|สีขาว|k;白紙|はくし|กระดาษเปล่า|o
少:少ない|すくない|น้อย|k;少し|すこし|นิดหน่อย|k;少年|しょうねん|เด็กชาย|o
多:多い|おおい|มาก|k;多少|たしょう|มากน้อย/บ้างเล็กน้อย|o
見:見る|みる|ดู|k;意見|いけん|ความคิดเห็น|o
聞:聞く|きく|ฟัง/ถาม|k;新聞|しんぶん|หนังสือพิมพ์|o
言:言う|いう|พูด|k;言語|げんご|ภาษา|o
話:話す|はなす|พูดคุย|k;電話|でんわ|โทรศัพท์|o
読:読む|よむ|อ่าน|k;読書|どくしょ|การอ่านหนังสือ|o
書:書く|かく|เขียน|k;図書館|としょかん|ห้องสมุด|o
食:食べる|たべる|กิน|k;食事|しょくじ|มื้ออาหาร|o
飲:飲む|のむ|ดื่ม|k;飲料|いんりょう|เครื่องดื่ม|o
行:行く|いく|ไป|k;銀行|ぎんこう|ธนาคาร|o
来:来る|くる|มา|k;来月|らいげつ|เดือนหน้า|o
出:出る|でる|ออก|k;外出|がいしゅつ|ออกไปข้างนอก|o
入:入る|はいる|เข้า|k;入口|いりぐち|ทางเข้า|k;入学|にゅうがく|เข้าเรียน|o
買:買う|かう|ซื้อ|k;買い物|かいもの|ช้อปปิ้ง|k;売買|ばいばい|ซื้อขาย|o
休:休む|やすむ|พัก/หยุด|k;休日|きゅうじつ|วันหยุด|o
立:立つ|たつ|ยืน|k;国立|こくりつ|ของรัฐ/แห่งชาติ|o
会:会う|あう|พบ|k;会社|かいしゃ|บริษัท|o
国:国|くに|ประเทศ|k;外国|がいこく|ต่างประเทศ|o
校:学校|がっこう|โรงเรียน|o;校長|こうちょう|ผู้อำนวยการโรงเรียน|o
駅:駅|えき|สถานี|o;駅前|えきまえ|หน้าสถานี|o
店:店|みせ|ร้านค้า|k;書店|しょてん|ร้านหนังสือ|o
社:会社|かいしゃ|บริษัท|o;神社|じんじゃ|ศาลเจ้า|o
車:車|くるま|รถ|k;電車|でんしゃ|รถไฟ|o
道:道|みち|ถนน/ทาง|k;柔道|じゅうどう|ยูโด|o
語:日本語|にほんご|ภาษาญี่ปุ่น|o;語る|かたる|เล่า/กล่าว|k
本:本|ほん|หนังสือ|o;日本|にほん|ญี่ปุ่น|o;本当|ほんとう|จริง|o`;const EX={};EXR.split('\n').forEach(l=>{const i=l.indexOf(':');EX[l.slice(0,i)]=l.slice(i+1).split(';').map(s=>s.split('|'))});
const P={home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',book:'<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',alert:'<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',chart:'<path d="M5 21v-6"/><path d="M12 21V3"/><path d="M19 21V9"/>',vol:'<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9.5 9.5 0 0 1 0 14"/>',flame:'<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',check:'<path d="M21.8 10A10 10 0 1 1 17 3.3"/><path d="m9 11 3 3L22 4"/>',star:'<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2L5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',eye:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',eyeoff:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/>'};
const ic=(p,s=18)=>`<svg class="ic2" viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const IC={};for(const k in P)IC[k]=ic(P[k]);
const IPEN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16.4 3.6a1.4 1.4 0 0 1 2 2L7.4 16.6a2 2 0 0 1-.9.5l-2.9.8.8-2.9a2 2 0 0 1 .5-.9z"/><path d="M12 21c1.5 0 1.5-1.5 3-1.5s1.5 1.5 3 1.5 1.5-1.5 3-1.5"/></svg>',IER='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>';
const EXT={o:['ออน','on'],k:['คุน','kun'],s:['พิเศษ','sp']};
function exHtml(c){if(ds!=='k'||!EX[c.k])return'';return `<div class="ex"><div class="exh">ตัวอย่างการใช้</div>${EX[c.k].map(e=>`<div class="er" data-t="${e[1]}" onclick="event.stopPropagation();speak(this.dataset.t)"><span class="et ${EXT[e[3]][1]}">${EXT[e[3]][0]}</span><span class="ew">${e[0]}</span><span class="ed"><b>${e[1]}</b> ${e[2]}</span></div>`).join('')}</div>`}
const MN={"し": "เหมือนเบ็ดตกปลา ลากตรงลงแล้วเกี่ยวขึ้น · อย่าสับสนกับ つ ที่เป็นเส้นโค้งนอน", "つ": "เหมือนคลื่นลูกเดียวซัดเข้าฝั่ง เป็นเส้นโค้งนอน · ต่างจาก し ที่ลากตั้งลง", "ぬ": "ปลายขีดมีห่วงเล็กๆ เหมือนเส้นก๋วยเตี๋ยว (ぬ = นู้ดเดิล) · ต่างจาก め ที่ไม่มีห่วง", "め": "ไม่มีห่วง ปลายตรง เหมือนตา (目 อ่านว่า め) · ต่างจาก ぬ ที่มีห่วง", "ね": "ปลายมีห่วงเล็กๆ เหมือนหางแมว (ねこ = แมว) · ต่างจาก れ และ わ ที่ไม่มีห่วง", "れ": "ปลายสะบัดออกไปด้านนอก · ต่างจาก わ ที่ปลายโค้งเข้าด้านใน", "わ": "ปลายโค้งเข้าด้านใน · ต่างจาก れ ที่ปลายสะบัดออก", "る": "ปลายมีห่วงเล็กๆ ที่ท้าย · ต่างจาก ろ ที่ไม่มีห่วง", "ろ": "เหมือนเลข 3 หงายข้าง ไม่มีห่วง · ต่างจาก る", "は": "สามขีด คือขีดตั้งซ้าย ขีดขวาง และขีดโค้งขวา · ต่างจาก ほ ที่มีขีดขวางเพิ่ม", "ほ": "เหมือน は แต่เพิ่มขีดขวางอีกหนึ่งขีด รวมสี่ขีด", "さ": "ขีดขวางหนึ่งขีดข้างบน แล้วขีดโค้งลงมา · ต่างจาก き ที่มีสองขีดขวาง", "き": "มีสองขีดขวางซ้อนกัน เหมือนกุญแจ (key = き)", "い": "ขีดซ้ายยาวกว่าขีดขวา เหมือนคนสองคนยืนข้างกัน · ต่างจาก り ที่ขีดขวายาวกว่า", "り": "ขีดซ้ายสั้น ขีดขวายาวลากลงแล้วเกี่ยวขึ้น · ต่างจาก い", "に": "ขีดตั้งซ้ายกับสองขีดขวางสั้นๆ · ต่างจาก こ ที่ไม่มีขีดตั้ง", "こ": "สองขีดขวางซ้อนกันเหมือนปากที่อ้า ไม่มีขีดตั้ง · ต่างจาก に", "へ": "เหมือนเนินเขาเตี้ยๆ ขีดเดียว", "シ": "จุดสองจุดเรียงแนวนอน ขีดยาวลากขึ้นไปทางขวา เหมือนหน้ายิ้มนอน · ต่างจาก ツ", "ツ": "จุดสองจุดเรียงแนวตั้ง ขีดยาวลากลงไปทางซ้าย เหมือนคนยืน · ต่างจาก シ", "ソ": "ขีดสั้นอยู่ด้านบน ขีดยาวลากลงซ้าย เหมือนตัว Y เอียง · ต่างจาก ン", "ン": "ขีดสั้นอยู่ด้านซ้าย ขีดยาวลากขึ้นขวา เหมือนคนนอนเอียง · ต่างจาก ソ", "ウ": "มีขีดสั้นๆ ที่ด้านบน · ต่างจาก ワ ที่ไม่มี", "ワ": "ไม่มีขีดสั้นด้านบน · ต่างจาก ウ", "ナ": "ขีดขวางด้านบน แล้วขีดโค้งลงตัดกลาง · ต่างจาก メ", "メ": "สองขีดไขว้กันเป็นกากบาทเอียง · ต่างจาก ナ", "フ": "ขีดเดียวหักมุมเหมือนมุมโต๊ะ · ต่างจาก ラ ที่มีขีดบนเพิ่ม", "ラ": "มีขีดสั้นด้านบน แล้วขีดหักมุมด้านล่าง · ต่างจาก フ", "コ": "สองขีดเหมือนกล่องเปิดด้านซ้าย · ต่างจาก ユ ที่ขีดล่างยื่นออก", "ユ": "เหมือน コ แต่ขีดล่างยื่นออกไปทางขวา"};
function speakFor(x){if(ds==='a')return x.k;if(ds==='k')return x.u&&x.u!=='-'?x.u.split('・')[0].replace(/\(.*?\)/g,''):x.o;return x.o}
function speak(t){if(!t)return;if(!('speechSynthesis' in window))return toast('เครื่องนี้ยังไม่รองรับเสียงอ่าน');try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='ja-JP';u.rate=.85;const v=speechSynthesis.getVoices().find(v=>/^ja/i.test(v.lang));if(v)u.voice=v;speechSynthesis.speak(u)}catch(e){}}
const spHtml=x=>`<button class="sp" data-t="${speakFor(x).replace(/"/g,'')}" onclick="event.stopPropagation();speak(this.dataset.t)">${IC.vol} ฟังเสียง</button>`;
const mnHtml=x=>ds==='a'&&MN[x.k]?`<div class="ex"><div class="exh">เคล็ดจำ</div><div class="mn">${MN[x.k]}</div></div>`:'';
function catOpts(){const o=c=>`<option value="${c}"${c===cat?' selected':''}>${c}</option>`;if(ds!=='a')return[...CATS,'ผิดบ่อย'].map(o).join('');const G={b:'พื้นฐาน',d:'เสียงขุ่น・กึ่งขุ่น',y:'เสียงควบ'};let s=o('ทั้งหมด');for(const g in G){const cs=[...new Set(K.filter(x=>x.g===g).map(x=>x.c))];s+=`<optgroup label="${G[g]}">${cs.map(o).join('')}</optgroup>`}return s+o('ผิดบ่อย')}
const scriptRow=()=>`<div class="seg" style="display:flex;margin-bottom:12px">${[['h','ฮิระงะนะ'],['k','คะตะคะนะ'],['all','ทั้งสองแบบ']].map(x=>`<button style="flex:1" class="${ks===x[0]?'on':''}" onclick="ks='${x[0]}';wi=0;go()">${x[1]}</button>`).join('')}</div>`;
function chartHtml(){const sc=ks==='k'?'k':'h',G={b:'พื้นฐาน',d:'เสียงขุ่น・กึ่งขุ่น',y:'เสียงควบ'},R={};K.filter(x=>x.sc===sc).forEach(x=>{(R[x.c]=R[x.c]||[]).push(x)});
 const tint=x=>{const r=S[x.k];return!r?'':r.w>=2?'background:rgba(239,107,91,.3)':r.b>=3?'background:rgba(92,184,127,.3)':r.b>=1?'background:rgba(224,149,47,.28)':''};
 let h=`<div class="seg" style="display:flex;margin-bottom:12px"><button style="flex:1" class="${sc==='h'?'on':''}" onclick="ks='h';render()">ฮิระงะนะ</button><button style="flex:1" class="${sc==='k'?'on':''}" onclick="ks='k';render()">คะตะคะนะ</button></div><div class="st" style="margin-bottom:8px">แตะตัวอักษรเพื่อฟังเสียง · สีบอกความแม่น</div>`;
 for(const g in G){h+=`<div class="kt">${G[g]}</div>`;Object.keys(R).filter(c=>R[c][0].g===g).forEach(c=>{const cols=g==='y'?3:5;h+=`<div class="kr" style="grid-template-columns:repeat(${cols},1fr)">${R[c].map((x,i)=>`<div class="kc" style="grid-column:${(c==='や/ヤ'||c==='わ/ワ')?[1,3,5][i]:i+1};${tint(x)}" data-t="${x.k}" onclick="speak(this.dataset.t)"><b>${x.k}</b><span>${x.o}</span></div>`).join('')}</div>`})}
 return h+`<div class="lg"><i style="background:rgba(92,184,127,.55)"></i>แม่นแล้ว<i style="background:rgba(224,149,47,.55)"></i>กำลังเรียน<i style="background:rgba(239,107,91,.55)"></i>ผิดบ่อย</div>`}
function pathHtml(sts){const m=Object.fromEntries(sts),L=['k','w','v'],A=m.a||{lr:0,t:0,due:0},t5=L.reduce((a,k)=>a+m[k].t,0),l5=L.reduce((a,k)=>a+m[k].lr,0),d5=L.reduce((a,k)=>a+m[k].due,0),pa=A.t?A.lr/A.t:0,p5=t5?l5/t5:0,lock=(n,s,g)=>`<div class="pc lk0"><div class="pn">🔒</div><div class="pb"><b>${n}</b><div class="st">${s}</div></div><div class="pg2">${g}</div></div>`;
 return `<div class="path"><div class="pc big1" onclick="openDs('a')"><div class="pn">1</div><div class="pb"><div class="pg">あ ア</div><b>${DS.a.n}</b>${pa>=.8?'<span class="bd b2">ผ่านแล้ว</span>':'<span class="bd b1">เริ่มที่นี่</span>'}<div class="st">ก่อนเริ่ม · เรียนทีละแถว 5 ตัว มีตารางและเสียงอ่าน</div><div class="st">พื้นฐาน ${A.lr}/${A.t} จำได้แม่น${A.due?' · ทบทวน '+A.due:''}</div><div class="bar"><i style="width:${pa*100}%"></i></div></div></div>
 <div class="pc" onclick="openLv()"><div class="pn">2</div><div class="pb"><b>N5</b>${p5>=.8?'<span class="bd b2">ผ่านแล้ว</span>':pa>=.8?'<span class="bd b3">พร้อมแล้ว</span>':''}<div class="st">คำศัพท์ · คันจิ · บทสนทนา · ไวยากรณ์ · ซ้อมสอบ</div><div class="st">${l5}/${t5} จำได้แม่น${d5?' · ทบทวน '+d5:''}</div><div class="bar"><i style="width:${p5*100}%"></i></div></div><div class="pg2">五</div></div>
 ${lock('N4','ปลดล็อกเมื่อ N5 จำได้แม่น 80% · เนื้อหากำลังมา','四')}${lock('N3','เนื้อหากำลังมา','三')}</div>`}
function openLv(){tab='learn';nv('n5');window.scrollTo(0,0)}
function renderLv(){const m=Object.fromEntries(Object.keys(DS).map(k=>[k,dsStat(k)])),L=['k','w','v'],t=L.reduce((a,k)=>a+m[k].t,0),l=L.reduce((a,k)=>a+m[k].lr,0);
 const sec=(k,s,g)=>`<div class="pc" onclick="openDs('${k}')"><div class="pb"><b>${k==='d'?'บทสนทนา':DS[k].n}</b><div class="st">${k==='d'?D.length+' บทสนทนา':m[k].lr+'/'+m[k].t+' จำได้แม่น'+(m[k].due?' · ทบทวน '+m[k].due:'')}</div>${k==='d'?'':`<div class="bar"><i style="width:${m[k].t?m[k].lr/m[k].t*100:0}%"></i></div>`}</div><div class="pg2">${g}</div></div>`,
 soon=(n,s,g)=>`<div class="pc lk0"><div class="pb"><b>🔒 ${n}</b><div class="st">${s}</div></div><div class="pg2">${g}</div></div>`;
 document.getElementById('app').innerHTML=NAV()+`<div class="st">จำได้แม่นรวม ${l}/${t} · เนื้อหาเขียนเอง</div><div class="bar"><i style="width:${t?l/t*100:0}%"></i></div><div class="path" style="margin-top:14px">${sec('k','','漢')}${sec('w','','語')}${sec('v','','文')}${sec('d','','話')}${soon('ไวยากรณ์','เนื้อหากำลังมา','法')}${soon('ซ้อมสอบ N5','ปลดล็อกเมื่อเรียนครบทุกหมวด','試')}</div>`}
function dsStat(k){let s={};try{s=JSON.parse(localStorage.getItem(DS[k].key)||'{}')}catch(e){}const n=Date.now();let seen=0,lr=0,due=0;const L=k==='a'?DS[k].d.filter(x=>x.g==='b'):DS[k].d;L.forEach(x=>{const r=s[x.k];if(r){seen++;if(r.b>=3)lr++;if(r.d<=n)due++}});return{seen,lr,due,t:L.length}}
function openDs(k){M.last=k;saveM();tab='learn';nv(k);window.scrollTo(0,0)}
function resume(){openDs(M.last&&(DS[M.last]||M.last==='d')?M.last:'k')}
function goTab(t){if(t==='learn'){if(tab!=='learn')resume();return}tab=t;render();window.scrollTo(0,0)}
function navUpdate(){document.getElementById('nav').innerHTML=[['home','home','หน้าแรก'],['learn','book','เรียน'],['mis','alert','ผิดบ่อย'],['stats','chart','สถิติ']].map(([t,i,n])=>`<button class="${tab===t?'on':''}" onclick="goTab('${t}')"><span>${ic(P[i],24)}</span>${n}</button>`).join('')}
function homeHtml(){const t=M.days[dstr(new Date())]||0,g=M.goal,n=streak(),C=2*Math.PI*34,f=Math.min(1,t/g),ic={a:'あ',k:'漢',w:'語',v:'文'};
 const sts=Object.keys(DS).map(k=>[k,dsStat(k)]),due=sts.reduce((a,x)=>a+x[1].due,0);
 return `<div class="hero"><div class="ring"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" class="rb"/><circle cx="40" cy="40" r="34" class="rf" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-f)}" transform="rotate(-90 40 40)"/></svg><div class="rt"><b>${t}</b>/${g}</div></div><div class="hm"><div class="hi">สวัสดีค่ะ</div><div class="hs">${IC.flame} ต่อเนื่อง ${n} วัน</div><div class="hs">${t>=g?'ครบเป้าวันนี้แล้ว '+IC.check:'อีก '+(g-t)+' ข้อถึงเป้าวันนี้'}</div></div></div>${petHtml()}<button class="big" onclick="resume()">${due>0?'ทบทวน '+due+' ข้อที่ถึงเวลา':'เรียนต่อ'} →</button><h2>เส้นทางเรียน</h2>${pathHtml(sts)}`}
function statsHtml(){const g=M.goal,days=[];for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);days.push([d,M.days[dstr(d)]||0])}
 const mx=Math.max(g,...days.map(x=>x[1]),1),tot=Object.values(M.days).reduce((a,b)=>a+b,0),wk=days.slice(7).reduce((a,x)=>a+x[1],0),sts=Object.keys(DS).map(k=>[k,dsStat(k)]);
 return `<h1>สถิติ</h1><div class="kp"><div><b>${IC.flame} ${streak()}</b><span>วันต่อเนื่อง</span></div><div><b>${wk}</b><span>ข้อใน 7 วัน</span></div><div><b>${tot}</b><span>ข้อทั้งหมด</span></div></div><h2>14 วันล่าสุด</h2><div class="card" style="min-height:0;padding:14px"><div class="chart">${days.map(x=>`<div class="col"><div class="bw"><div class="bb" style="height:${Math.max(2,x[1]/mx*100)}%;${x[1]>=g?'background:var(--ok)':''}"></div></div><span>${x[0].getDate()}</span></div>`).join('')}</div><div class="st" style="margin-top:8px">แท่งสีเขียว = ถึงเป้าหมายวันนั้น</div></div><h2>เป้าหมายต่อวัน (ข้อ)</h2><div class="seg" style="display:flex">${[10,20,30,50,100].map(v=>`<button style="flex:1" class="${v===g?'on':''}" onclick="M.goal=${v};saveM();render()">${v}</button>`).join('')}</div><h2>ความคืบหน้า</h2><div class="card" style="min-height:0;text-align:left;padding:6px 14px">${sts.map(([k,s])=>`<div class="mi"><span class="mt" style="flex:1"><b>${DS[k].n}</b><div class="bar" style="margin:6px 0 0"><i style="width:${s.t?s.lr/s.t*100:0}%"></i></div></span><span class="mw" style="color:var(--mut)">${s.lr}/${s.t}</span></div>`).join('')}</div><h2>สำรองข้อมูล</h2><div class="st">ส่งออกเป็นไฟล์ไว้เก็บหรือย้ายไปเครื่องอื่น แล้วนำเข้ากลับมาได้</div><div class="btns" style="margin-top:10px"><button onclick="exportProg()">ส่งออก</button><button onclick="document.getElementById('imp').click()">นำเข้า</button></div><input id="imp" type="file" accept="application/json,.json" style="display:none" onchange="importProg(this)">${creditsHtml()}`}
function creditsHtml(){return `<h2>เกี่ยวกับและเครดิต</h2><details class="card" id="credits" style="min-height:0;text-align:left;padding:12px 14px"><summary style="font-size:15px">ลิขสิทธิ์และแหล่งข้อมูล</summary>
<div class="st" style="margin-top:10px;line-height:1.7"><b>ข้อมูลลำดับขีด</b> (ที่ใช้ในโหมดฝึกเขียน) มาจากโปรเจกต์ <a href="https://kanjivg.tagaini.net" target="_blank" rel="noopener">KanjiVG</a> © Ulrich Apel และผู้ร่วมพัฒนา เผยแพร่ภายใต้สัญญาอนุญาต <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener">CC BY-SA 3.0</a> ข้อมูลที่นำมาใช้ถูกจัดรูปแบบใหม่เป็น JavaScript โดยไม่แก้ค่าพิกัดของเส้น<br><br><b>คำศัพท์และบทสนทนา</b> เขียนขึ้นเองสำหรับแอปนี้<br>เนื้อหาในแอปมีไว้เพื่อการเรียนรู้ ไม่รับรองว่าตรงกับข้อสอบ JLPT ทุกข้อ</div></details>`}

const SPC=[['🐱','แมว'],['🐰','กระต่าย'],['🐶','น้องหมา']];
const OBQ=['ยินดีที่ได้เจอกันนะ! ก่อนเริ่มเรียนด้วยกัน อยากได้เพื่อนตัวไหนไปเป็นเพื่อนเรียนดีนะ','ดีใจจัง! แล้วเธออยากเรียกเราว่าอะไรดีนะ?','ว่าแต่ตอนนี้เธอเรียนญี่ปุ่นมาถึงไหนแล้วเหรอ?','แล้วเรียนไปเพื่ออะไรเหรอ? จะได้คอยเชียร์ถูกทาง','สุดท้ายแล้ว! วันละกี่ข้อกำลังพอดี? เอาแบบสบายๆ ไม่ต้องหักโหมนะ นับเฉพาะข้อที่ตอบถูก'];
const OBO=[SPC.map(s=>s[0]+' '+s[1]),null,['เพิ่งเริ่มเรียนภาษาญี่ปุ่น','N5','N4','N3'],['เพื่อไปสอบวัดระดับ JLPT','ไปอาศัยอยู่ไม่ก็ไปทำงานที่ญี่ปุ่นน่ะ','เรียนเพื่อความบันเทิง อย่างดูหนัง เล่นเกม อนิเมะทำนองนั้นน่ะ'],['5 ข้อ','10 ข้อ','15 ข้อ']];
let ob=0,obl=[],tp={};
function obn(v){obl.push([OBQ[ob],v]);if(ob===0)tp.sp=Math.max(0,SPC.findIndex(s=>v.startsWith(s[0])));if(ob===1)tp.name=v;if(ob===2)tp.lv=v;if(ob===3)tp.goal=v;
 if(ob===4){tp.min=parseInt(v);M.pet={...tp,energy:0,bond:0,d:null,trait:Math.floor(Math.random()*TR.length),rv:dstr(new Date())};saveM();obl=[];ob=0;tab='home';return render()}ob++;render()}
function obt(){const v=document.getElementById('nm').value.replace(/[<>&"']/g,'').trim();if(v)obn(v)}
function obHtml(){let h='<h1>ยินดีต้อนรับ</h1><div class="st">ตั้งค่าครั้งแรก ใช้เวลาไม่ถึงนาที</div>';
 obl.forEach(([q,a])=>{h+=`<div class="pzb">${q}</div><div class="pzb me">${a}</div>`});
 h+=`<div class="pzb">${SPC[tp.sp||0][0]} ${OBQ[ob]}</div>`;
 h+=ob===1?`<div class="row"><input id="nm" maxlength="12" placeholder="ชื่อเพื่อน" style="flex:1;padding:11px;border-radius:10px;border:1px solid var(--bd);background:var(--card);color:var(--fg);font-size:16px"><button style="padding:11px 16px;border:0;border-radius:12px;background:var(--ac);color:#fff;font-size:15px" onclick="obt()">ต่อไป</button></div>`:`<div class="ch">${OBO[ob].map(o=>`<button onclick="obn('${o}')">${o}</button>`).join('')}</div>`;
 return h}
const PM=[{id:'rev',n:'ทบทวนให้ถูก',e:20,go:'k',t:()=>M.pet.min},{id:'neu',n:'เจอคำ/คันจิใหม่',e:20,go:'w',t:()=>Math.max(3,Math.round(M.pet.min/2))},{id:'dlg',n:'อ่านบทสนทนาจบ 1 บท',e:30,go:'d',t:()=>1}];
function pens(){const p=M.pet,k=dstr(new Date());if(!p.d||p.d.date!==k)p.d={date:k,rev:0,neu:0,dlg:0,done:{},r:[]}}
function ptrack(k){if(!M.pet||!M.pet.name)return;pens();const p=M.pet;p.d[k]++;PM.forEach(m=>{if(!p.d.done[m.id]&&p.d[m.id]>=m.t()){p.d.done[m.id]=1;p.energy+=m.e;p.bond+=2;toast('✅ '+m.n+' สำเร็จ +'+m.e+' Energy')}});saveM()}
function pdd(i){if(!M.pet||!M.pet.name)return;pens();if(!M.pet.d.r.includes(i)){M.pet.d.r.push(i);ptrack('dlg')}render()}
function pfeed(){const p=M.pet;if(p.energy<30){toast('Energy ไม่พอ ไปเรียนเก็บเพิ่มก่อนนะ')}else{p.energy-=30;p.bond+=10;toast('🍙 '+ptr(p)[7])}saveM();render()}
function pgo(x){tab='learn';nv(x)}
function pmast(){let n=0;for(const k in DS){try{n+=Object.values(JSON.parse(localStorage.getItem(DS[k].key)||'{}')).filter(v=>v.b>=3).length}catch(e){}}return n}
const TR=[["⚡ พลังล้น (แนวอิตาโดริ)","เจอกันแล้ว!! พลังเต็มร้อยเลย! เรียนยากแค่ไหนก็ไม่ถอย ลุยด้วยกันนะ!","อรุณสวัสดิ์!! ตื่นเต็มตา พลังเต็มถัง! วันนี้ก็ลุยกันเต็มที่เลย!","เที่ยงแล้ว!! หิวจัง… แต่เรียนก่อนสักข้อ! เดี๋ยวข้าวจะอร่อยกว่าเดิมเลย!","ยังไหวนะ! เราอยู่ข้างๆ เธอ ไม่ให้สู้คนเดียวแน่! อีกนิดไปด้วยกัน!","ดึกแล้ว! ไม่ต้องฝืนนะ นอนให้เต็มที่! พรุ่งนี้ค่อยลุยต่อ!","เธอกลับมาแล้ว!! ดีใจสุดๆ! ไม่เป็นไรเลย เริ่มใหม่ด้วยกัน ลุยยย!","อร่อยยยย!! ขอเพิ่มอีกชามได้มั้ย! …ล้อเล่นๆ ขอบคุณนะ!","ทำครบแล้ว!! สุดยอดไปเลย! เธอเก่งมาก เราภูมิใจสุดๆ เลย!"],["🌙 เงียบสงบ","…เจอกันแล้วนะ เราค่อนข้างเงียบ แต่ดีใจนะ","อรุณสวัสดิ์ ค่อยๆ เริ่มไปด้วยกันนะ","ถ้าว่างนิดนึง มาเรียนเบาๆ กันไหม","วันนี้เป็นไงบ้าง… มาเรียนเงียบๆ ด้วยกันสักหน่อยนะ","ดึกแล้ว พักผ่อนเถอะนะ ราตรีสวัสดิ์","กลับมาแล้วเหรอ… ดีใจนะ ไม่เป็นไรเลย ค่อยๆ ไปต่อกัน","ขอบคุณนะ… อร่อยจัง","ทำได้ดีมาก เราชอบแบบนี้"],["😳 ขี้อาย (พูดไม่เก่งแต่อยากพูด)","อะ… อื… เรา… (สูดหายใจลึก) เราอยากเป็นเพื่อนกับเธอ! …พูดออกมาได้แล้ว","อะ… อะ… อรุณ… สวัสดิ์ (พูดได้แล้ว!) วันนี้… เรียนด้วยกัน… นะ?","เอ่อ… อยากชวนเรียน แต่ไม่รู้จะพูดยังไง… เลยเขียนไว้ในสมุดนะ ✏️「เรียนด้วยกันไหม」","…(ขยับเข้ามาใกล้ๆ) วันนี้… มีเรื่องอยากเล่าให้ฟังเยอะเลย แต่พูดไม่ออก… เรียนด้วยกันก่อนนะ","อะ… ดึกแล้วนะ อยากคุยต่ออีกนิด แต่เธอต้องนอน… ราตรีสวัสดิ์นะ (โบกมือเบาๆ)","อ๊ะ! เธอ… กลับมา… ดีใจ… (พูดไม่ออก) …เราดีใจมากจริงๆ นะ!","อะ… ขอบคุณ… อร่อย… (ตัวสั่นนิดๆ) อยากบอกว่าดีใจมากเลย…","เก่งมากเลย!… เรา… อยากชมเธอให้มากกว่านี้ แต่คำมันไม่ออก… ขอบคุณนะ เธอเก่งที่สุด"],["😼 ปากแข็งแต่ใจดี","ก็… เจอกันแล้วนี่ อย่าคิดว่าเราจะอ่อนโยนนะ","มาแล้วเหรอ ก็แค่ว่างเฉยๆ น่ะ ไม่ได้รอหรอก","เที่ยงแล้ว จะไม่เรียนเหรอ… ไม่ได้บังคับนะ แค่ถามเฉยๆ","ยังเรียนไม่เสร็จใช่มั้ย เห็นอยู่หรอก ไปทำเลย","ดึกแล้วน่ะ ไปนอนซะ ไม่ได้เป็นห่วงหรอกนะ","หายไปตั้งหลายวันเลยนะ… ช่างเถอะ มาเริ่มกันใหม่","ก็… ขอบใจ ไม่ได้ดีใจหรอกนะ","ไม่เลวนี่… เก่งกว่าที่คิดแฮะ"],["😴 ชิลๆ ขี้เซา","เจอกันแล้ว… เราเป็นสายชิลล์นะ ไม่ต้องรีบ","หืม… เช้าแล้วเหรอ เรียนนิดเดียวก็พอนะ","แดดดีเนอะ… เรียนสักข้อแล้วค่อยงีบดีมั้ย","เย็นแล้ว… ค่อยๆ เรียนไปเรื่อยๆ ก็ได้นะ","ง่วงแล้ว… ไปนอนกันเถอะ ฝันดีนะ","อ้าว กลับมาแล้วเหรอ… ไม่รีบหรอก เริ่มตอนไหนก็ได้","อร่อย… ขอบใจนะ ง่วงเลย","เยี่ยม ได้เวลางีบแล้ว"],["🎭 ขี้เล่นจอมแซว","เจอกันแล้วว~ เราขี้เล่นนะ ระวังโดนแซวบ่อยๆ ล่ะ","ตื่นแล้วเหรอ? หรือยังฝันอยู่ แหะๆ ไปเรียนกันเถอะ!","ท้องร้องหรือยัง? เรียนสักข้อก่อนค่อยไปหาข้าวนะ","เย็นนี้มีนัดกับเราใช่มั้ย~ นัดเรียนไง!","ดึกขนาดนี้ยังไม่นอน เดี๋ยวตาเป็นแพนด้านะ ไปนอนเลย!","โอ้โห ใครน่ะ? อ๋อ เจ้าของเรานี่เอง! กลับมาแล้วเหรอ","ยัมๆๆ! ถ้าอร่อยกว่านี้เราจะตัวกลมแน่เลย","เก่งเกินไปแล้วนะเนี่ย เดี๋ยวเราต้องขอลายเซ็น!"],["🔍 ขี้สงสัย","เจอกันแล้ว! เราขี้สงสัยนะ วันนี้จะได้เรียนอะไรใหม่ๆ บ้างน้า","อรุณสวัสดิ์ วันนี้เราจะได้รู้อะไรใหม่ๆ บ้างนะ ตื่นเต้นจัง!","เอ๊ะ ช่วงเที่ยงเธอจำได้กี่คำแล้วนะ ลองทบทวนดูมั้ย","วันนี้เจอคำที่น่าสนใจบ้างหรือเปล่า เล่าให้เราฟังหน่อยสิ","ดึกแล้วนะ แต่ก่อนนอนลองทบทวนอีกคำเดียวก็ได้ จะได้จำแม่นๆ","กลับมาแล้ว! ระหว่างนี้เธอไปเจออะไรมาบ้างเหรอ เริ่มกันใหม่นะ","ว้าว อันนี้รสอะไรเหรอ อร่อยจัง ขอบคุณนะ","สุดยอด! เธอรู้เยอะขึ้นอีกแล้วนะ พรุ่งนี้ไปหาคำใหม่ต่อกัน"],["🎩 สุภาพเรียบร้อย","ยินดีที่ได้พบนะครับ ผมค่อนข้างเรียบร้อย ฝากตัวด้วยนะครับ","อรุณสวัสดิ์ครับ วันนี้เรามาเรียนไปด้วยกันอย่างสบายๆ นะครับ","ช่วงพักเที่ยง ถ้าสะดวกลองทบทวนสักข้อสองข้อนะครับ","ทำงานมาเหนื่อยแล้ว เรียนเบาๆ สักหน่อยก็พอนะครับ","ดึกมากแล้วครับ รีบพักผ่อนนะครับ ราตรีสวัสดิ์","ยินดีต้อนรับกลับนะครับ ค่อยๆ เริ่มกันใหม่ได้เลย","ขอบคุณมากครับ อร่อยมากเลย","ยอดเยี่ยมมากครับ วันนี้ทำได้ดีเยี่ยมเลย"],["📚 นักวิชาการ","ยินดีที่ได้รู้จักกัน เราเป็นสายวิชาการนะ ชอบรู้ที่มาที่ไปของทุกคำ","อรุณสวัสดิ์ การทบทวนซ้ำเป็นระยะช่วยให้จำได้นานขึ้นนะ เริ่มกันเลย","ช่วงพักเที่ยง ทบทวนสั้นๆ ก็มีประโยชน์ตามหลักการทบทวนเว้นระยะนะ","วันนี้เจอคันจิที่หน้าตาคล้ายกันบ้างไหม ลองสังเกตดู น่าสนใจนะ","การนอนช่วยให้สมองจัดระเบียบความจำนะ ไปพักเถอะ ราตรีสวัสดิ์","กลับมาแล้วเหรอ ไม่เป็นไร ความรู้ไม่ได้หายไปไหน ทบทวนใหม่ได้เลย","ขอบคุณ อร่อยมาก ว่าแต่ข้าวปั้นในภาษาญี่ปุ่นเรียกว่า おにぎり นะ","ผลวันนี้ยอดเยี่ยม เราขอบันทึกไว้เป็นหลักฐานเลย"],["🌱 ตัวน้อยขยันสู้","เอ่อ… เจอกันแล้ว เราตัวเล็กและยังไม่เก่งอะไรเลย แต่จะพยายามนะ ช่วยเราด้วยน้า","อรุณสวัสดิ์ เราแอบฝึกอ่านคานะมานะ วันนี้ไปด้วยกันนะ","เราตั้งใจมากเลย เธอเรียนด้วยกันไหม เราไม่อยากเรียนคนเดียว","เหนื่อยแล้วใช่มั้ย เราก็เหนื่อยเหมือนกัน แต่ขออีกนิดนะ เราอยากโตไปพร้อมกับเธอ","ดึกแล้ว เธอไปนอนเถอะ พรุ่งนี้เราจะสู้ต่อ แล้วเจอกันนะ","เธอกลับมาแล้ว! ระหว่างนี้เราฝึกอยู่ตลอดเลยนะ ไปต่อด้วยกันนะ","ขอบคุณนะ มีแรงขึ้นเยอะเลย เราจะพยายามให้มากกว่าเดิม","เราทำได้แล้ว!! ขอบคุณที่อยู่ข้างๆ เรานะ ดีใจที่สุดเลย"]];
function ptr(p){if(p.trait==null||!TR[p.trait]){p.trait=Math.floor(Math.random()*TR.length);p.rv=dstr(new Date());saveM()}return TR[p.trait]}
function psay(p,dn){const t=ptr(p),k=dstr(new Date()),hr=new Date().getHours();
 if(p.last!==k){if(p.lastTs&&(Date.now()-p.lastTs)/864e5>=3)p.back=k;p.last=k}
 p.lastTs=Date.now();saveM();
 if(dn>=3)return t[8];if(dn===0){if(p.rv===k)return t[1];if(p.back===k)return t[6]}
 return hr>=5&&hr<11?t[2]:hr>=11&&hr<15?t[3]:hr>=15&&hr<21?t[4]:t[5]}
function petHtml(){pens();const p=M.pet,st=p.bond<40?1:p.bond<120?2:3,dn=Object.keys(p.d.done).length,sp=SPC[p.sp||0],md=dn>=3?'ดีใจมาก':dn?'อารมณ์ดี':'ง่วงๆ รอเรียนด้วยกันอยู่นะ',say=psay(p,dn),g=M.goal,tot=pmast(),bd=tot>=250?'🥇':tot>=100?'🥈':tot>=25?'🥉':'';
 const wk=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return `<div class="${i==6?'on':''}">${['อา','จ','อ','พ','พฤ','ศ','ส'][d.getDay()]}<br><b>${d.getDate()}</b><br>${(M.days[dstr(d)]||0)>=g?'🔥':'·'}</div>`}).join('');
 let h=`<div class="card pz" style="text-align:center"><div class="pzb" style="margin:0 auto 10px">${say}</div><div class="pet" style="font-size:${40+st*24}px">${sp[0]}</div><div><b>${p.name}</b> · ร่าง ${st}</div><div class="st">${ptr(p)[0]}</div><div class="st">${md}</div><div class="bar"><i style="width:${Math.min(100,p.bond/1.2)}%;background:var(--ac)"></i></div><div class="st">ความสนิท ${p.bond} / 120 · ⚡ Energy ${p.energy}</div><button class="lk" onclick="pfeed()">🍙 ให้อาหาร (30 Energy → สนิท +10)</button></div><div class="pzw">${wk}</div><h2>ภารกิจวันนี้</h2>`;
 PM.forEach(m=>{const c=Math.min(p.d[m.id],m.t()),ok=p.d.done[m.id];h+=`<div class="pzm" onclick="pgo('${m.go}')"><div><b>${ok?'✅ ':''}${m.n}</b><div class="st">${c} / ${m.t()}${m.id==='rev'?' (นับเฉพาะข้อที่ตอบถูก)':''}</div></div><span class="pzp">+${m.e} Energy</span></div>`});
 return h+`<div class="st" style="margin:8px 0 14px">ระดับตอนนี้: ${p.lv} · จำได้แม่นรวม ${tot} ข้อ ${bd} (🥉25 🥈100 🥇250)</div>`}
function render(){const a=document.getElementById('app');if(!(M.pet&&M.pet.name)){a.innerHTML=obHtml();document.getElementById('nav').innerHTML='';return}if(tab==='home')a.innerHTML=homeHtml();else if(tab==='stats')a.innerHTML=statsHtml();else if(tab==='mis')renderMis();else if(view==='d')renderDlg();else if(view==='n5')renderLv();else renderLearn();navUpdate()}
function renderLearn(){
 const p=pool(),seen=p.filter(x=>S[x.k]).length,lr=p.filter(x=>S[x.k]&&S[x.k].b>=3).length;
 if(!cur)cur=pick1();
 if(cur&&mode==='quiz'&&!ch)mkch();
 let h=NAV()+`<div class="st">เจอแล้ว ${seen}/${p.length} · จำได้แม่น ${lr}</div><div class="bar"><i style="width:${p.length?lr/p.length*100:0}%"></i></div>`;
 h+=`<div class="row"><select onchange="cat=this.value;prac=0;wi=0;go()">${catOpts()}</select><div class="seg">${ds==='a'?`<button class="${mode==='chart'?'on':''}" onclick="mode='chart';go()">ตาราง</button>`:''}<button class="${mode==='card'?'on':''}" onclick="mode='card';go()">การ์ด</button><button class="${mode==='quiz'?'on':''}" onclick="mode='quiz';go()">ควิซ</button><button class="${mode==='write'?'on':''}" onclick="mode='write';go()">เขียน</button></div></div>${ds==='a'?scriptRow():''}`;
 if(mode==='quiz'&&ds!=='a')h+=`<div class="row"><div class="seg" style="flex:1"><button style="flex:1" class="${qt==='read'?'on':''}" onclick="qt='read';go()">ตอบคำอ่าน</button><button style="flex:1" class="${qt==='mean'?'on':''}" onclick="qt='mean';go()">ตอบความหมาย</button></div></div>`;
 if(mode==='chart'&&ds==='a'){h+=chartHtml()}
 else if(mode==='write'&&p.length){const x=p[wi%p.length],cs=[...x.k].filter(c=>SV[c]),c0=cs.length?cs[ci%cs.length]:x.k[0];
  h+=`<div class="wi"><div class="d" style="margin:0"><b>${x.o}</b>${x.u!=='-'?' ・ '+x.u:''}<br>${x.m}</div>${spHtml(x)}</div><div class="tb"><div class="seg"><button class="${tool==='pen'?'on':''}" onclick="tool='pen';render()">${IPEN}</button><button class="${tool==='er'?'on':''}" onclick="tool='er';render()">${IER}</button></div>${tool==='er'?`<input type="range" min="6" max="40" value="${esz}" oninput="esz=+this.value">`:`<span style="flex:1"></span>`}<button class="ic" onclick="guide=guide?0:1;render()">${guide?IC.eye:IC.eyeoff}</button></div><div class="card nw" style="padding:10px;min-height:0"><div class="sheet">${CELLS.map((sp,i)=>`<div class="cell">${cellSvg(c0,sp)}<canvas data-c="${i}" width="200" height="200"></canvas></div>`).join('')}</div>${cs.length>1?`<div class="btns" style="margin-top:10px">${cs.map((c,i)=>`<button style="background:${c===c0?'var(--ac)':'var(--mut)'};font-size:22px;padding:8px" onclick="ci=${i};st=[];render()">${c}</button>`).join('')}</div>`:''}</div><button class="big" onclick="tick();wi++;ci=0;st=[];render()">ตัวต่อไป →</button>`}
 else if(!cur){h+=`<div class="card"><div class="k">${ic(P.star,72)}</div><div class="d">ทบทวนครบตามรอบแล้ว<br>กลับมาใหม่ทีหลังได้เลย</div><button class="lk" onclick="prac=1;go()">ฝึกสุ่มต่ออีกนิด</button></div>`}
 else if(mode==='card'){
  h+=`<div class="card" ${fl?'':'onclick="fl=true;render()"'}><div class="k" style="${cur.k.length>2?'font-size:'+Math.max(34,Math.floor(200/cur.k.length))+'px':''}">${cur.k}</div>`;
  if(!fl)h+=`<div class="hint">แตะเพื่อดูคำอ่านและความหมาย</div>`;
  else h+=`<div class="d"><b>${cur.o}</b><br>${cur.u!=='-'?cur.u+'<br>':''}${cur.m}${cur.s==='c'?' *':''}<div class="st">หมวด: ${cur.c}</div></div>${spHtml(cur)}${mnHtml(cur)}${exHtml(cur)}<div class="btns"><button onclick="event.stopPropagation();grade(false)">ยังไม่แน่ใจ</button><button class="g" onclick="event.stopPropagation();grade(true)">จำได้</button></div>`;
  h+=`</div>`}
 else{
  h+=`<div class="card"><div class="k" style="${cur.k.length>2?'font-size:'+Math.max(34,Math.floor(200/cur.k.length))+'px':''}">${cur.k}</div><div class="q">${(ds==='a'||qt==='read')?'คำอ่านคือข้อไหน':'ความหมายคือข้อไหน'}</div><div class="ch">`;
  ch.forEach((c,i)=>{const s=ans===null?'':c.ok?'r':(ans===i?'w':'');h+=`<button class="${s}" onclick="pick(${i})">${c.t}</button>`});
  h+=`</div>`;
  if(ans!==null&&!ch[ans].ok)h+=`<div class="btns"><button class="nx" onclick="go()">ข้อต่อไป</button></div>`;
  h+=`</div>`}
 h+=`<div class="ft">ระบบทบทวนแบบเว้นระยะ: ข้อที่ตอบผิดจะกลับมาเร็วขึ้น · ความคืบหน้าเก็บในเบราว์เซอร์เครื่องนี้<br>ข้อมูลเวอร์ชันทดลอง ควรตรวจกับตำราที่ใช้อยู่อีกครั้ง<br>คำศัพท์และบทสนทนาเขียนขึ้นเองสำหรับแอปนี้<br>ลำดับขีดจาก <a href="https://kanjivg.tagaini.net" target="_blank" rel="noopener">KanjiVG</a> (CC BY-SA 3.0) · ดูเครดิตเต็มในหน้าสถิติ</div>`;
 document.getElementById('app').innerHTML=h;if(mode==='write')initCv()}
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
render();

// ===== ส่งออก/นำเข้าความคืบหน้า =====
const PK=[...Object.values(DS).map(d=>d.key),MK];
function exportProg(){const data={};PK.forEach(k=>{try{const v=localStorage.getItem(k);if(v)data[k]=JSON.parse(v)}catch(e){}});
 const o={app:'kanji-app',format:1,exported:new Date().toISOString(),data},b=new Blob([JSON.stringify(o)],{type:'application/json'}),a=document.createElement('a');
 a.href=URL.createObjectURL(b);a.download='kanji-progress-'+dstr(new Date())+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('ส่งออกแล้วค่ะ')}
function importProg(el){const f=el.files[0];el.value='';if(!f)return;const r=new FileReader();
 r.onload=()=>{let o;try{o=JSON.parse(r.result)}catch(e){return toast('ไฟล์ไม่ถูกต้อง')}
  if(!o||o.app!=='kanji-app'||o.format!==1||!o.data||typeof o.data!=='object')return toast('ไม่ใช่ไฟล์สำรองของแอปนี้');
  const ks=PK.filter(k=>o.data[k]&&typeof o.data[k]==='object'&&!Array.isArray(o.data[k]));if(!ks.length)return toast('ไม่พบข้อมูลในไฟล์');
  if(!confirm('นำเข้าจะเขียนทับความคืบหน้าปัจจุบันในเครื่องนี้ ต้องการทำต่อไหมคะ?'))return;
  try{ks.forEach(k=>localStorage.setItem(k,JSON.stringify(o.data[k])))}catch(e){return toast('บันทึกไม่สำเร็จ')}
  location.reload()};
 r.onerror=()=>toast('อ่านไฟล์ไม่สำเร็จ');r.readAsText(f)}
