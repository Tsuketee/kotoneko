// แผนที่เมืองเนโกะมาจิ: หน้าต่าง "ไปเที่ยว" (placeAsk) เป็นแผนที่พิกเซล 160×340 แตะป้ายสถานที่แล้วขึ้นกล่องข้อมูล (เจ้าของโอเคผังรอบสอง 2026-11-22)
// ผังอ้างอิงหมู่บ้านซาโตยามะจริง: ฟูจิทางเหนือ ป่าศาลเจ้าบนเนิน ทุ่งนาริมแม่น้ำ เมืองหน้าสถานี ย่านบ้านบนเนินลาด · ฉากหลังของแต่ละที่ (SCENES ใน js/pixelcat.js) วาดให้ตรงกับแผนที่นี้
// ตำแหน่งของแต่ละที่อยู่ในช่อง map ของ js/data/places.js ({at: จุดอาคาร (ปลายเส้นชี้), lb: จุดกลางป้าย, cat: จุดเท้าแมว}) · อาคารวาดใน SITE ของไฟล์นี้
// เพิ่มสถานที่ใหม่: ต้องมีทั้งฉากใน SCENES ช่อง map และอาคารใน SITE (ชุดทดสอบตรวจ) · แปลงว่าง LOTS คือที่ที่เผื่อไว้ เมืองจริงจะมีของแบบนั้นตรงนั้น
// ภาพนิ่งแคชต่อ (ฤดู · ที่ที่ล็อก · เทศกาล) ส่วนขยับวาดทุกเฟรม: รถไฟ ไม้กั้นทางข้ามรถไฟ ธงปลาคาร์ป แมว ของตกตามฤดู แสงตามเวลา · ปิดแอนิเมชันในระบบ = นิ่ง
// ห่อใน IIFE ส่งออก window.TownMap · placeAsk() ท้ายไฟล์ต่อแผนที่เข้ากับข้อมูลของแอป · ต้นแบบ/พรีวิวคือ docs/town-map.html (โหลดไฟล์นี้)
(() => {
'use strict';
const W = 160, H = 340;
// ---------- สีตามฤดู (ชุดเดียวกับฉากสัตว์เลี้ยง) · sak = ซากุระ dec = ไม้ผลัดใบทั่วไป ----------
const PAL = {
  spring: { gr: '#b9dc95', gr2: '#a3cd7f', gr3: '#97c277', sak: ['#c9849b', '#e9a8bd', '#f5c4d3'], dec: ['#5f9a55', '#86bd68', '#b5da8a'], fo: ['#3f6b45', '#56895a', '#78a968'], pad: ['#a9cfd6', '#c8e3e6', '#8fb98a'], h1: '#a9c4b8', h1b: '#bfd5c9', h2: '#86b083', h2b: '#a2c595', snow: 12, veg: ['#8a6a48', '#7fb069'] },
  summer: { gr: '#a8d27f', gr2: '#8fbf6a', gr3: '#86b763', sak: ['#4b7b43', '#62964d', '#82b55f'], dec: ['#3f7040', '#58904a', '#7cb05a'], fo: ['#355e3c', '#4b7b43', '#62964d'], pad: ['#7fbf5e', '#99d273', '#6aa84f'], h1: '#96b9a7', h1b: '#abc9b8', h2: '#6fa06a', h2b: '#88b87c', snow: 0, veg: ['#8a6a48', '#5e9e48'] },
  autumn: { gr: '#c2cf8c', gr2: '#a9b974', gr3: '#b2bf7c', sak: ['#b3563c', '#d9774f', '#eda36a'], dec: ['#9c3a2e', '#c9533f', '#e8735a'], fo: ['#3f6b45', '#8a6a2c', '#c9533f'], pad: ['#e2c46a', '#efd88a', '#c9a64a'], h1: '#b3b5a4', h1b: '#c8c9b9', h2: '#a99360', h2b: '#bfa977', snow: 5, veg: ['#8a6a48', '#a7a24e'] },
  winter: { gr: '#e9eef2', gr2: '#d3dbe3', gr3: '#dbe3ea', sak: null, dec: null, fo: ['#3a5a3f', '#4a6b4b', '#5f7f5c'], pad: ['#eef2f6', '#dbe4ee', '#c9b89a'], h1: '#c9d6e0', h1b: '#e2e9ef', h2: '#dde5ec', h2b: '#f2f5f8', snow: 19, veg: ['#c9b89a', '#e9eef2'] } };
const C = { road: '#c9c4bb', road2: '#a8a298', line: '#f4efe4', lane: '#d9c9a6', water: '#8fcbe6', water2: '#d9f0fa', water3: '#5f9fc4', bank: '#b9c4a8', sand: '#e8dfc4', sand2: '#d6caa8', levee: '#e3d8bf', bridge: '#b98a63', bridge2: '#8f6646',
  rail: '#6f6a73', sleeper: '#9b7a5a', ballast: '#b3aca0', train: '#f4f1ea', train2: '#4f8fd6', glass: '#bfe0ef', bark: '#7a5a40', snow: '#fbfcfe', snow2: '#dbe4ee',
  steel: '#b55a3c', steel2: '#d47a5a', steel3: '#7e3a28', wall: '#f3e8d6', wall2: '#ddd0bb', tile: '#6f7b86', tile2: '#57626c', roof: '#c96a4a', roof2: '#a4513a', roof3: '#8f8a7a', tor: '#d9503c', stone: '#c9c3b8', stone2: '#aaa294',
  teal: '#3fa7a0', must: '#f2c14e', awn: '#d96e5a', dirt: '#d9c4a0', fence: '#b98a63', ink: '#3b2e27', field: '#c9a675', plaza: '#e4ddd0', plaza2: '#d3cabb', win: '#9fcde3', win2: '#f6e7c0',
  apt: '#e8e2d6', apt2: '#cfc6b6', off: '#b8c6d4', off2: '#9fb0c2', plat: '#d9d3c8', tact: '#e8c64a', pole: '#6b5a4a', lamp: '#ffe6a3', glow: '#ffd27a' };
// ---------- ตัวช่วยวาด ----------
const rect = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h) };
const dot = (c, x, y, col) => rect(c, x, y, 1, 1, col);
const blob = (c, cx, cy, rx, ry, col) => { c.fillStyle = col; for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) if (((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1) c.fillRect(x, y, 1, 1) };
const rng = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
const BY = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], bay = (x, y) => (BY[y & 3][x & 3] + .5) / 16;
const hex = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)), mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
// สีไล่เฉดแบบพิกเซล: เติมจุด bayer ก่อนปัดสีเป็นขั้น ได้ลายจุดละเอียดแทนแถบสีแข็ง
const dcol = (x, y, [r, g, b]) => { const d = (bay(x, y) - .5) * 12, q = v => Math.max(0, Math.min(255, Math.round((v + d) / 10) * 10)); return `rgb(${q(r)},${q(g)},${q(b)})` };
// เส้นโค้ง Catmull-Rom ผ่านจุด · คืนจุดถี่ๆ ตามความยาว
const spline = P => { const o = []; for (let i = 0; i < P.length - 1; i++) { const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2, n = Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) * 1.5);
  for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t, f = (a, b, c, d) => .5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3); o.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]) } } o.push(P[P.length - 1]); return o };
const stroke = (c, S, r, col) => { c.fillStyle = col; S.forEach(([x, y], i) => { const R = typeof r === 'function' ? r(i, S.length) : r; for (let dy = -Math.ceil(R); dy <= R; dy++) for (let dx = -Math.ceil(R); dx <= R; dx++) if (dx * dx + dy * dy <= R * R + R * .6) c.fillRect(Math.round(x + dx), Math.round(y + dy), 1, 1) }) };
const near = (S, x, y) => { let b = 1e9, bi = 0; S.forEach(([a, c], i) => { const d = (a - x) ** 2 + (c - y) ** 2; if (d < b) { b = d; bi = i } }); return [Math.sqrt(b), bi] };
const dirAt = (S, i) => { const a = S[Math.max(0, i - 2)], b = S[Math.min(S.length - 1, i + 2)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l] };
// จุดตัดของสองเส้น (ใกล้กันน้อยกว่า 1.5 พิกเซล) → [x, y, ดัชนีบนเส้นแรก]
const cross = (A, B) => { let best = null; A.forEach((p, i) => { const [d] = near(B, p[0], p[1]); if (d < 1.5 && (!best || d < best[3])) best = [p[0], p[1], i, d] }); return best };
// ---------- เส้นหลักของเมือง ----------
const RIVER = spline([[125, 50], [127, 60], [122, 72], [114, 90], [106, 114], [100, 136], [94, 156], [84, 172], [68, 188], [48, 206], [33, 228], [25, 254], [29, 282], [40, 308], [48, 344]]);
const RW = i => Math.min(1, .3 + i / 40) * (3 + 2.2 * i / RIVER.length); // แม่น้ำกว้างขึ้นทางปลายน้ำ (ใต้) · ต้นน้ำค่อยๆ บานออกจากชายป่า
const RAIL = spline([[-4, 152], [18, 148], [40, 145], [64, 145], [90, 145], [106, 145], [124, 150], [144, 159], [164, 165]]);
const MAIN = spline([[164, 92], [148, 104], [135, 120], [126, 140], [122, 160], [119, 180], [115, 200], [113, 222], [117, 250], [126, 278], [138, 308], [146, 340], [148, 346]]); // ถนนสายเก่าเลียบแม่น้ำฝั่งตะวันออก
const ONS = spline([[162, 93], [158, 80], [152, 64], [148, 52], [146, 42]]);                                                       // ทางขึ้นออนเซ็นบนเขา
const SHOT = spline([[68, 158], [76, 168], [84, 180], [96, 194], [106, 202], [114, 205]]);                                      // ถนนช้อปปิ้งหน้าสถานี (ข้ามแม่น้ำ)
const WEST = spline([[-4, 178], [20, 174], [38, 169], [52, 161]]);                                                              // จากทุ่งนาฝั่งตะวันตกเข้าลานหน้าสถานี
const HILL = spline([[62, 124], [54, 114], [44, 105], [35, 99], [29, 97]]);                                                     // ทางออกเหนือของสถานีขึ้นศาลเจ้า (จบที่โทริอิ)
const SCH = spline([[84, 180], [80, 194], [84, 206], [89, 216], [90, 225]]);                                                    // ถนนไปโรงเรียน (จบที่ประตูข้างอาคารเรียน)
const RES1 = spline([[117, 250], [132, 256], [146, 261], [164, 266]]), RES2 = spline([[126, 278], [114, 296], [106, 316], [102, 344]]), RES3 = spline([[138, 308], [152, 314], [164, 319]]); // ซอยในย่านบ้าน
const LANES = [spline([[-2, 200], [18, 194], [34, 182], [44, 167]]), spline([[8, 177], [10, 206], [12, 240], [15, 272], [17, 296], [14, 320], [9, 344]]), spline([[48, 107], [64, 100], [84, 95], [106, 93], [126, 91]]),
  spline([[-2, 118], [16, 113], [30, 108], [44, 105]]), spline([[118, 190], [134, 192], [150, 198], [164, 203]])]; // คันนา/ทางเกวียน: ทุกเส้นต่อถนน ที่หมาย หรือออกขอบแผนที่
// ---------- แปลงว่าง: ที่ที่เมืองจริงจะมี (ชื่อจริงตั้งตอนมีสถานที่) ----------
const LOTS = [{ id: 's1', at: [13, 157], lot: [3, 152, 21, 10] },   // ตลาดเช้าหน้าสถานี
  { id: 's2', at: [146, 33], lot: [136, 27, 20, 11] },                 // ออนเซ็นบนเขา
  { id: 's3', at: [53, 292], lot: [43, 286, 20, 12] },                 // ริมแม่น้ำ
  { id: 's4', at: [133, 245], lot: [124, 240, 18, 10] },               // วัดในย่านบ้าน
  { id: 's5', at: [27, 324], lot: [18, 318, 18, 12] }];                // ปลายแม่น้ำ
// ---------- ของทั่วไปในเมือง (มุมมองเฉียงจากบน: เห็นหลังคา + ผนังด้านใต้) ----------
const house = (c, x, y, w, roof, roof2, L, wall = C.wall) => { rect(c, x, y + 3, w, 3, wall); rect(c, x, y + 5, w, 1, C.wall2); rect(c, x, y, w, 3, roof); rect(c, x, y + 2, w, 1, roof2); if (w > 5) { rect(c, x + 1, y + 4, 2, 1, C.win); if (L) L.push([x + 1, y + 4, 2, 1]) } rect(c, x + w - 2, y + 4, 1, 2, '#8a6040') };
const tall = (c, x, y, w, h, col, col2, L) => { rect(c, x, y, w, h, col); rect(c, x, y, w, 2, col2); rect(c, x, y + h - 1, w, 1, col2); for (let yy = y + 3; yy < y + h - 1; yy += 2) for (let xx = x + 1; xx < x + w - 1; xx += 2) { dot(c, xx, yy, C.win); if (L && (xx * 7 + yy * 3) % 5 < 3) L.push([xx, yy, 1, 1]) } };
function tree(c, x, y, se, kind = 'dec', s = 1) { const P = PAL[se], T = kind === 'pine' ? [P.fo[0], P.fo[1], P.fo[2]] : P[kind]; rect(c, x, y - 2, 1, 2, C.bark);
  if (!T) { rect(c, x - 1, y - 4, 3, 1, C.bark); dot(c, x - 2, y - 5, C.bark); dot(c, x + 1, y - 5, C.bark); rect(c, x - 1, y - 5, 2, 1, C.snow); return }
  blob(c, x + .5, y - 3.4 * s, 2.6 * s, 2.2 * s, T[0]); blob(c, x, y - 3.8 * s, 2 * s, 1.7 * s, T[1]); dot(c, x - 1, y - 5 * s, T[2]); if (se === 'winter') rect(c, x - 1, y - 5.4 * s, 2, 1, C.snow) }
function forest(c, cx0, cy0, rx, ry, se, seed, mix = .25) { const P = PAL[se], R = rng(seed); for (let i = 0; i < rx * ry * .5; i++) { const a = R() * Math.PI * 2, d = Math.sqrt(R()), x = cx0 + Math.cos(a) * d * rx, y = cy0 + Math.sin(a) * d * ry, alt = R() < mix && P.dec;
    blob(c, x, y + .6, 2.6, 2.1, P.fo[0]); blob(c, x - .3, y, 2.1, 1.7, alt ? P.dec[1] : P.fo[1]); dot(c, x - 1, y - 1, alt ? P.dec[2] : P.fo[2]); if (se === 'winter') rect(c, x - 1, y - 1.6, 2, 1, C.snow) } }
// ไผ่: ลำต้นเขียวอ่อนเป็นเส้นตั้ง ใบเป็นจุด (เขียวทั้งปี หนาวมีหิมะเกาะ)
function bamboo(c, x0, y0, w, h, se) { const R = rng(77); for (let x = x0; x < x0 + w; x++) for (let y = y0; y < y0 + h; y++) { const r = R(); if (x % 2 === 0 && r < .7) dot(c, x, y, '#9cbf5a'); else if (r < .5) dot(c, x, y, '#5f8f3f'); else if (r < .8) dot(c, x, y, '#7aa84a') } if (se === 'winter') for (let x = x0; x < x0 + w; x += 2) dot(c, x, y0, C.snow) }
// ---------- อาคารของสถานที่หลัก: ใหญ่กว่าบ้านทั่วไปและมีรูปทรงเฉพาะ ให้เห็นทันทีว่าแตะตรงไหนได้ · L = รายการหน้าต่างที่เปิดไฟตอนกลางคืน ----------
const SITE = {
  // ศาลเจ้าบนเนิน: หอสักการะหลังคาทองแดงเขียว มีไม้ไขว้บนสัน ฮนเด็นหลังเล็กข้างหลัง บันไดหินลงมาที่โทริอิใหญ่ โคมหินสองข้าง
  shrine(c, se, L) { const wi = se === 'winter'; rect(c, 22, 51, 14, 4, '#4f7a6c'); rect(c, 22, 54, 14, 1, '#3f6357'); rect(c, 24, 55, 10, 2, '#6e4a33');
    rect(c, 15, 57, 28, 6, '#5e8f7f'); rect(c, 15, 57, 28, 1, '#7fb0a0'); rect(c, 15, 62, 28, 1, '#43685c'); rect(c, 17, 63, 24, 6, '#7a4a30'); rect(c, 17, 68, 24, 1, '#5e3a26'); rect(c, 26, 64, 6, 5, '#3a2a20'); rect(c, 20, 64, 3, 2, C.win2); rect(c, 35, 64, 3, 2, C.win2); L.push([20, 64, 3, 2], [35, 64, 3, 2]);
    dot(c, 15, 56, '#3f6357'); dot(c, 42, 56, '#3f6357'); dot(c, 14, 55, '#3f6357'); dot(c, 43, 55, '#3f6357'); if (wi) { rect(c, 15, 57, 28, 1, C.snow); rect(c, 22, 51, 14, 1, C.snow) }
    rect(c, 27, 69, 5, 18, C.stone); for (let y = 70; y < 87; y += 2) rect(c, 27, y, 5, 1, C.stone2); [[24, 74], [34, 74], [24, 82], [34, 82]].forEach(([x, y]) => { rect(c, x, y, 2, 3, C.stone); rect(c, x - 1, y - 1, 4, 1, C.stone2); L.push([x, y, 2, 1]) });
    rect(c, 20, 87, 19, 1, '#3a3434'); dot(c, 19, 86, '#3a3434'); dot(c, 39, 86, '#3a3434'); rect(c, 20, 88, 19, 1, C.tor); rect(c, 21, 90, 17, 1, C.tor); rect(c, 23, 90, 2, 6, C.tor); rect(c, 34, 90, 2, 6, C.tor); rect(c, 23, 95, 2, 1, '#8a2f24'); rect(c, 34, 95, 2, 1, '#8a2f24'); if (wi) rect(c, 20, 86, 19, 1, C.snow) },
  // สวนญี่ปุ่น: กำแพงดินหลังคากระเบื้อง บ่อ สะพานโค้งแดง โคมหิน สนตัดแต่ง ร้านน้ำชาเล็ก ประตูหันลงถนนสายหลัก
  garden(c, se, L) { const P = PAL[se], wi = se === 'winter'; rect(c, 126, 77, 28, 25, '#c9b99a'); rect(c, 127, 78, 26, 22, wi ? C.snow2 : P.gr); rect(c, 126, 77, 28, 1, C.tile); rect(c, 126, 101, 28, 1, '#a8987a');
    for (let i = 0; i < 26; i += 2) dot(c, 127 + i, 80 + (i % 4 ? 0 : 1), '#d9d2c2'); blob(c, 139, 91, 7.5, 4.5, C.water3); blob(c, 139, 90.6, 6.5, 3.8, wi ? C.water2 : C.water); dot(c, 136, 89, C.water2); dot(c, 142, 92, C.water2);
    for (let i = 0; i < 7; i++) dot(c, 136 + i, 90 - (i === 0 || i === 6 ? 0 : i === 3 ? 2 : 1), C.tor); rect(c, 145, 81, 7, 3, C.tile); rect(c, 145, 84, 7, 3, '#e8dcc6'); rect(c, 147, 85, 2, 2, '#8a6040'); L.push([150, 85, 1, 1]);
    rect(c, 129, 84, 2, 3, C.stone); rect(c, 128, 83, 4, 1, C.stone2); L.push([129, 85, 2, 1]); tree(c, 150, 97, se, 'sak'); blob(c, 130, 97, 2.6, 1.6, '#3d6b4a'); blob(c, 132, 81, 2.4, 1.5, '#3d6b4a'); blob(c, 147, 96, 2, 1.3, '#3d6b4a');
    rect(c, 137, 101, 6, 2, '#8a6040'); rect(c, 136, 100, 8, 1, C.tile); if (wi) { rect(c, 126, 76, 28, 1, C.snow); rect(c, 145, 80, 7, 1, C.snow) } },
  // สถานีรถไฟ: อาคารใหญ่หลังคาฟ้าเทา หอนาฬิกากลาง ชานชาลาสองฝั่ง (ฝั่งตรงข้ามมีหลังคาคลุม) ลานหน้าสถานีทางออกใต้
  station(c, se, L) { const wi = se === 'winter'; rect(c, 48, 123, 32, 6, '#7d93a8'); rect(c, 48, 123, 32, 1, '#9fb4c6'); rect(c, 48, 128, 32, 1, '#5f7488'); rect(c, 60, 118, 8, 6, '#7d93a8'); rect(c, 60, 118, 8, 1, '#9fb4c6'); blob(c, 64, 121, 1.6, 1.6, '#fff'); dot(c, 64, 120, C.ink); dot(c, 64, 121, C.ink);
    rect(c, 49, 129, 30, 9, C.wall); rect(c, 49, 137, 30, 1, C.wall2); for (let x = 51; x < 77; x += 4) { if (x > 58 && x < 69) continue; rect(c, x, 131, 2, 2, C.win); L.push([x, 131, 2, 2]) } rect(c, 60, 131, 8, 6, C.glass); rect(c, 63, 131, 2, 6, '#8fb4c6'); L.push([60, 131, 8, 6]);
    rect(c, 58, 129, 12, 1, '#4f8fd6'); if (wi) { rect(c, 48, 123, 32, 1, C.snow); rect(c, 60, 118, 8, 1, C.snow) }
    rect(c, 44, 139, 44, 3, C.plat); rect(c, 44, 141, 44, 1, C.tact); rect(c, 46, 148, 40, 3, C.plat); rect(c, 46, 148, 40, 1, C.tact); rect(c, 54, 151, 24, 1, '#b9b2a6');
    rect(c, 56, 147, 18, 1, '#8b9aa8'); for (let x = 57; x < 74; x += 4) dot(c, x, 150, '#8b9aa8'); L.push([60, 149, 1, 1], [68, 149, 1, 1]);
    rect(c, 52, 153, 28, 8, C.plaza); for (let yy = 153; yy < 161; yy++) for (let xx = 52; xx < 80; xx++) if ((xx + yy * 2) % 6 === 0) dot(c, xx, yy, C.plaza2); blob(c, 66, 157, 2.2, 2, PAL[se].dec ? PAL[se].dec[1] : C.bark); rect(c, 74, 155, 4, 2, '#e7d35a'); rect(c, 55, 159, 1, 2, C.pole); dot(c, 55, 158, '#fff'); L.push([55, 158, 1, 1]) },
  // คาเฟ่: ร้านสองชั้นหลังคาน้ำตาลมีหน้าจั่ว ป้ายถ้วยกาแฟ กันสาดลายแดงขาว โต๊ะร่มหน้าร้าน (ตรงข้ามเป็นร้านกันสาดลายทาง เหมือนวิวจากหน้าต่างคาเฟ่)
  cafe(c, se, L) { const wi = se === 'winter'; rect(c, 98, 165, 17, 6, '#8a5a3a'); rect(c, 98, 165, 17, 1, '#a8744e'); rect(c, 98, 170, 17, 1, '#6e4a2e'); rect(c, 104, 162, 6, 4, '#8a5a3a'); rect(c, 104, 162, 6, 1, '#a8744e'); rect(c, 112, 163, 2, 3, '#6e4a2e');
    blob(c, 107, 167.5, 2, 1.6, '#fff7ee'); dot(c, 109, 167, '#fff7ee'); dot(c, 106, 166, '#d9b48a'); dot(c, 107, 164, '#e9dccb'); dot(c, 108, 163, '#e9dccb');
    rect(c, 98, 171, 17, 7, '#e8c9a0'); rect(c, 98, 177, 17, 1, '#c9a67c'); [100, 104, 110].forEach(x => { rect(c, x, 172, 2, 2, C.win); L.push([x, 172, 2, 2]) }); for (let k = 0; k < 17; k++) dot(c, 98 + k, 175, k % 2 ? C.awn : '#fff7ee'); rect(c, 106, 176, 3, 2, '#6e4a2e'); L.push([100, 176, 4, 1], [110, 176, 3, 1]);
    blob(c, 96, 180, 2.4, 1.4, '#4f9a6a'); dot(c, 96, 180, '#fff7ee'); rect(c, 96, 181, 1, 1, C.bark); if (wi) { rect(c, 98, 165, 17, 1, C.snow); rect(c, 104, 162, 6, 1, C.snow) } },
  // ร้านสะดวกซื้อ: กล่องหลังคาแบน มีแถบสีร้านสมมติ หน้าร้านกระจกสว่าง ลานจอดรถ ป้ายเสาสูงหัวมุม
  konbini(c, se, L) { const wi = se === 'winter'; rect(c, 124, 205, 22, 5, '#e6e4df'); rect(c, 124, 205, 22, 1, '#f6f4ef'); rect(c, 128, 206, 3, 2, '#b9b6ae'); rect(c, 138, 206, 4, 2, '#b9b6ae');
    rect(c, 124, 210, 22, 1, C.teal); rect(c, 124, 211, 22, 1, C.must); rect(c, 124, 212, 22, 1, C.awn); rect(c, 124, 213, 22, 4, '#f6f4ef'); rect(c, 126, 213, 17, 3, C.glass); rect(c, 133, 213, 3, 4, '#9fcde0'); rect(c, 124, 216, 22, 1, C.wall2); L.push([126, 213, 17, 3]);
    rect(c, 122, 217, 26, 7, C.plaza); for (let i = 2; i < 26; i += 4) rect(c, 122 + i, 219, 1, 5, '#fff'); rect(c, 121, 203, 1, 8, C.pole); rect(c, 119, 200, 5, 3, '#f6f4ef'); rect(c, 119, 201, 5, 1, C.teal); L.push([119, 200, 5, 3]); if (wi) rect(c, 124, 205, 22, 1, C.snow) },
  // โรงเรียน: อาคารเรียนยาวสามชั้น หอนาฬิกา สนามดินมีลู่วิ่ง สระว่ายน้ำ โรงยิมหลังคาโค้ง ซากุระริมรั้ว
  classroom(c, se) { let X0; const wi = se === 'winter', X = 14; // ทั้งบล็อกเลื่อนไปทางขวา X พิกเซล (v130 เจ้าของบอกว่าฝั่งซ้ายลงไปในแม่น้ำ) · ไฟตึกเรียนไม่เปิดตอนกลางคืน (ไม่มีนักเรียน)
    rect(c, 38 + X, 212, 34, 3, '#d9d6cf'); rect(c, 38 + X, 212, 34, 1, '#ecebe6'); rect(c, 52 + X, 207, 6, 5, C.wall); rect(c, 52 + X, 207, 6, 1, '#d9d6cf'); blob(c, 55 + X, 209.5, 1.5, 1.5, '#fff'); dot(c, 55 + X, 209, C.ink);
    rect(c, 38 + X, 215, 34, 9, C.wall); rect(c, 38 + X, 223, 34, 1, C.wall2); for (let y = 216; y < 223; y += 3) for (let x = 40; x < 70; x += 3) rect(c, x + X, y, 2, 2, C.win); rect(c, 54 + X, 220, 3, 3, '#8a6040');
    X0 = 38 + X - 4; rect(c, X0 + 2, 227, 34, 26, C.field); for (let x = 0; x < 34; x++) { dot(c, X0 + 2 + x, 227, '#fff'); dot(c, X0 + 2 + x, 252, '#fff') } rect(c, X0 + 2, 227, 1, 26, '#fff'); rect(c, X0 + 35, 227, 1, 26, '#fff'); blob(c, X0 + 19, 240, 12, 7.5, '#fff'); blob(c, X0 + 19, 240, 11, 6.5, C.field); blob(c, X0 + 19, 240, 9, 4.5, '#d6b98a');
    rect(c, X0 + 40, 226, 13, 8, '#e6e1d6'); rect(c, X0 + 41, 227, 11, 6, wi ? '#cfe0ea' : '#6fc0e0'); for (let y = 228; y < 233; y += 2) rect(c, X0 + 41, y, 11, 1, wi ? '#e3edf3' : '#9fd8ee');
    rect(c, X0 + 40, 237, 14, 4, '#7f9a8a'); rect(c, X0 + 41, 236, 12, 1, '#9fb6a6'); rect(c, X0 + 40, 240, 14, 1, '#62786a'); rect(c, X0 + 40, 241, 14, 5, '#e8e2d6'); for (let x = 2; x < 13; x += 3) rect(c, X0 + 40 + x, 242, 2, 1, C.win);
    [1, 9, 28, 36].forEach(x => tree(c, X0 + x, 258, se, 'sak'));
    if (wi) { rect(c, 38 + X, 211, 34, 1, C.snow); rect(c, X0 + 40, 236, 14, 1, C.snow); for (let i = 0; i < 40; i++) rect(c, X0 + 3 + (i * 7) % 32, 228 + (i * 5) % 24, 2, 1, C.snow) } },
  // บ้าน (ห้องอ่านหนังสือ): บ้านสองชั้นหลังคาส้มบนเนิน สวนเล็กมีรั้ว ต้นพลับ
  room(c, se, L) { const wi = se === 'winter'; rect(c, 129, 287, 17, 9, '#a9c98a'); rect(c, 128, 296, 19, 1, C.fence); for (let x = 128; x < 147; x += 3) dot(c, x, 295, C.fence);
    rect(c, 131, 276, 13, 5, C.roof); rect(c, 131, 276, 13, 1, '#e08a66'); rect(c, 131, 280, 13, 1, C.roof2); rect(c, 131, 281, 13, 7, C.wall); rect(c, 131, 287, 13, 1, C.wall2); rect(c, 133, 282, 3, 2, C.win); rect(c, 139, 282, 3, 2, C.win); rect(c, 133, 285, 2, 1, C.win); rect(c, 141, 284, 2, 3, '#8a6040'); L.push([133, 282, 3, 2], [139, 282, 3, 2]);
    rect(c, 136, 288, 1, 3, C.lane); rect(c, 137, 290, 1, 3, C.lane); dot(c, 145, 289, '#d9503c'); if (wi) { rect(c, 131, 275, 13, 1, C.snow); rect(c, 129, 287, 17, 3, C.snow) } }
};
// ---------- ภาพนิ่ง ----------
function sky(c) { const a = hex('#bfe2f4'), b = hex('#e8f5fb'); for (let y = 0; y < 44; y++) for (let x = 0; x < W; x++) c.fillStyle = dcol(x, y, mix(a, b, Math.min(1, y / 36))), c.fillRect(x, y, 1, 1) }
// ฟูจิ: กรวยกว้างสมมาตร ยอดตัดแบน เชิงเขาบานออก (เว้าเข้า) · ไล่เฉดแบบมองไกล ฟ้าอมเทา ด้านซ้ายรับแสง ขวาเงา จางเป็นหมอกที่ฐาน
// หิมะตามฤดูแบบเดียวกับฉากสวน: ร้อนไม่มี ใบไม้ร่วงหิมะแรกที่ยอด ใบไม้ผลิมาก หนาวลงถึงไหล่เขา · ขอบหิมะเป็นริ้วตามร่องเขา
const FX = 56, FT = 4, FB = 46, fhw = y => 3 + (y - FT) * .8 + (y - FT) ** 2 * .034;
function fuji(c, se) { const sh = PAL[se].snow, lit = hex('#9cb4cf'), shd = hex('#7189ab'), haze = hex('#d6e6f1'), sl = hex('#fbfcfe'), ss = hex('#cbd8e8');
  for (let y = FT; y < FB; y++) { const hw = fhw(y); for (let x = Math.ceil(FX - hw); x <= FX + hw; x++) { if (x < 0 || x >= W) continue; const s = (x + .5 - FX) / hw, ts = Math.max(0, Math.min(1, .5 + s * .45 + .06 * Math.sin(s * 13 + 1)));
      const sny = FT + sh * (1 - .22 * Math.abs(s)) + (sh ? sh * .5 * Math.max(0, Math.sin(s * 12 + 1.1)) ** 3 * (1 - Math.abs(s) * .5) + ((x * 7) % 3 - 1) * .5 : -9);
      if (y < sny - .5 || (y < sny + .5 && bay(x, y) < .5)) { c.fillStyle = dcol(x, y, mix(sl, ss, ts)); c.fillRect(x, y, 1, 1); continue }
      const tv = (y - FT) / (FB - FT); c.fillStyle = dcol(x, y, mix(mix(lit, shd, ts), haze, tv ** 1.7 * .6)); c.fillRect(x, y, 1, 1) } }
  rect(c, FX - 2, FT, 5, 1, sh ? '#e6edf5' : '#6a7f9c') }
// เนินเขาซ้อน 2 ชั้นก่อนถึงป่า: ไกลจางอมฟ้า ใกล้เขียวขึ้นมีพุ่มไม้บนสัน (ต่อภูเขามุมข้างเข้ากับเมืองมุมบน)
// ลำธารต้นน้ำบนเขา (v133 เจ้าของบอกว่าแม่น้ำเหมือนไหลขึ้นเขา): เนินวาดแบบมองข้าง ต้นน้ำจึงเป็นเส้นน้ำเล็กไหลลงร่องเขา หายเข้าแนวป่า แล้วแม่น้ำค่อยโผล่จากชายป่า (RIVER เริ่มใต้แนวป่า)
const BROOK = spline([[118, 30], [119, 34], [121, 38], [122, 42], [124, 47]]);
const brook = (c, se, y0) => BROOK.forEach(([x, y], i) => { if (y < y0) return; const wi = se === 'winter'; dot(c, x, y, wi ? (i % 4 ? '#9fc6dd' : '#e3eef4') : i % 4 ? '#7fbadb' : '#d9f0fa'); if (y > 36) dot(c, x + 1, y, wi ? '#c4dceb' : '#8fcbe6') });
function hills(c, se) { const P = PAL[se];
  for (let x = 0; x < W; x++) { const y = Math.round(31 + 3.5 * Math.sin(x / 21 + .6) + 1.6 * Math.sin(x / 8.5 + 2)); rect(c, x, y, 1, 56 - y, P.h1); dot(c, x, y, P.h1b); for (let yy = y + 2; yy < 46; yy++) if (bay(x, yy) < .16 && (x + yy) % 3) dot(c, x, yy, se === 'winter' ? '#b9c8d4' : P.h2) }
  for (let x = 0; x < W; x++) { const y = Math.round(39 + 2.6 * Math.sin(x / 15 + 2.2) + 1.2 * Math.sin(x / 6 + .4)); rect(c, x, y, 1, 58 - y, P.h2); dot(c, x, y, P.h2b); if (x % 4 === 1) { dot(c, x, y - 1, P.h2); dot(c, x + 1, y - 1, P.h2) } if ((x * 13) % 7 < 2) dot(c, x, y + 3 + (x % 3), se === 'winter' ? '#9fb09f' : P.fo[1]) }
  brook(c, se, 0) }
function paddy(c, se, x0, y0, w, h, sd) { const P = PAL[se], r = rng(sd), wi = se === 'winter';
  for (let y = y0; y < y0 + h; y += 7) for (let x = x0; x < x0 + w; x += 9 + ((y >> 3) % 3)) { const ww = Math.min(8 + ((x + y) % 3), x0 + w - x - 1), hh = Math.min(6, y0 + h - y - 1); if (ww < 3 || hh < 3) continue; const k = r() < .2 ? 2 : r() < .5 ? 1 : 0; rect(c, x, y, ww, hh, P.pad[k]);
    if (se === 'spring' && r() < .4) rect(c, x + 1, y + 1, 2, 1, C.water2); if (se === 'summer') for (let i = 0; i < ww; i += 2) rect(c, x + i, y + 1, 1, hh - 2, P.pad[2]); if (se === 'autumn') for (let i = 1; i < ww; i += 3) dot(c, x + i, y + 2, '#b8922e'); if (wi) for (let i = 0; i < ww; i += 3) dot(c, x + i, y + 2 + (i % 2), '#c9b89a') } }
// แม่น้ำ: คันดินฝั่งเมือง (ทางจักรยานบนสัน ซากุระเรียง) ตลิ่งหญ้า หาดทรายตรงโค้งด้านใน น้ำ ประกาย (หนาวมีน้ำแข็งเกาะริม)
const LEVEE = (() => { const o = []; RIVER.forEach((p, i) => { if (p[1] < 192) return; const [dx, dy] = dirAt(RIVER, i), r = RW(i); o.push([p[0] + dy * (r + 6), p[1] - dx * (r + 6), i]) }); return o })();
function river(c, se) { const P = PAL[se], wi = se === 'winter';
  stroke(c, RIVER, i => RW(i) + 2.4, C.bank); LEVEE.forEach(([x, y]) => { rect(c, x - 1, y, 3, 1, P.gr3); dot(c, x, y, C.levee) }); stroke(c, RIVER, i => RW(i) + .8, C.water3); stroke(c, RIVER, RW, C.water);
  [[150, 1], [205, -1], [262, 1]].forEach(([k, sd]) => { const i = Math.min(RIVER.length - 1, Math.round(RIVER.length * k / 340)), [dx, dy] = dirAt(RIVER, i), r = RW(i), p = RIVER[i]; for (let t = -5; t <= 5; t++) for (let u = 0; u < 2.4 - Math.abs(t) * .2; u++) dot(c, p[0] + dx * t - dy * sd * (r - .5 - u), p[1] + dy * t + dx * sd * (r - .5 - u), u < 1 ? C.sand2 : C.sand) });
  RIVER.forEach(([x, y], i) => { if (i % 5 === 0) rect(c, x - 1 + (i % 3), y, 2, 1, wi ? C.snow : C.water2) }); if (wi) RIVER.forEach(([x, y], i) => { if (i % 3 === 0) { const [dx, dy] = dirAt(RIVER, i), r = RW(i); dot(c, x - dy * r, y + dx * r, C.snow2); dot(c, x + dy * r, y - dx * r, C.snow2) } }) }
const road = (c, S, r = 2, line = 1) => { stroke(c, S, r + 1, C.road2); stroke(c, S, r, C.road); if (line) S.forEach(([x, y], i) => { if (i % 6 < 3) dot(c, x, y, C.line) }) };
// สะพานตามแนวถนน: พื้นไม้/คอนกรีตกว้าง 2hw+1 ยาว 2hl+1 มีราวสองข้าง
function bridge(c, S, i, hl, hw, deck, rail) { const [dx, dy] = dirAt(S, i), [x0, y0] = S[i]; for (let t = -hl; t <= hl; t += .5) for (let u = -hw; u <= hw; u += .5) dot(c, x0 + dx * t - dy * u, y0 + dy * t + dx * u, Math.abs(u) > hw - .6 ? rail : deck) }
// ทางรถไฟ: หินโรยทาง หมอนไม้ ราง · สะพานเหล็กโครงถัก (ด้านใกล้วาดในชั้น over ให้รถไฟลอดโครง) · ทางข้ามรถไฟลายเหลืองดำตรงถนนสายหลัก
const RX = cross(RAIL, RIVER), LX = cross(RAIL, MAIN);
function rail(c, o) { stroke(c, RAIL, 2, C.ballast); RAIL.forEach(([x, y], i) => { if (i % 3 === 0) rect(c, x, y - 2, 1, 5, C.sleeper) }); RAIL.forEach(([x, y]) => { dot(c, x, y - 1, C.rail); dot(c, x, y + 1, C.rail) });
  // สะพานเหล็ก: ตอม่อในน้ำ โครงถักด้านไกล (บน) คานยึดด้านบน · ด้านใกล้ (วอร์เรน /\/\) อยู่ใน o
  const y = Math.round(RX[1]), x0 = Math.round(RX[0]) - 8, x1 = x0 + 16;
  for (let x = x0 + 1; x < x1; x++) { const w = near(RIVER, x, y)[0] < RW(near(RIVER, RX[0], RX[1])[1]) + 2; rect(c, x, y - 2, 1, 5, w ? C.water3 : C.bank); if (x % 2) rect(c, x, y - 1, 1, 3, '#8a6a4a'); dot(c, x, y - 1, C.rail); dot(c, x, y + 1, C.rail) } rect(c, x0 + 7, y + 3, 3, 2, C.stone2);
  rect(c, x0, y - 5, 17, 1, C.steel3); for (let x = x0; x <= x1; x++) { const k = (x - x0) % 4; if (k === 1 || k === 3) dot(c, x, y - 4, C.steel); if (k === 2) dot(c, x, y - 4, C.steel3) }
  rect(o, x0, y - 3, 17, 1, C.steel2); rect(o, x0, y + 2, 17, 1, C.steel3); for (let x = x0; x <= x1; x++) { const k = (x - x0) % 8, v = k < 4 ? k : 8 - k; dot(o, x, y - 3 + Math.round(v * 5 / 4), C.steel); if (k === 0) rect(o, x, y - 3, 1, 6, C.steel3) } rect(o, x0, y - 5, 1, 8, C.steel3); rect(o, x1, y - 5, 1, 8, C.steel3);
  // สะพานลอยข้ามรางที่สถานี (หลังคาคลุม) อยู่ในชั้น o ให้รถไฟลอดใต้
  rect(o, 77, 136, 4, 17, '#8b9aa8'); rect(o, 77, 136, 4, 1, '#b4c2cc'); rect(o, 78, 137, 2, 15, '#d9dfe3'); rect(o, 77, 152, 4, 1, '#6d7b88');
  // ทางข้ามรถไฟ: เสาลายเหลืองดำสี่มุม ป้ายกากบาท (ไฟแดงกะพริบกับไม้กั้นวาดตอนรถไฟใกล้)
  const lx = Math.round(LX[0]), ly = Math.round(LX[1]); for (let dx = -4; dx <= 4; dx++) { dot(c, lx + dx, ly - 1, C.rail); dot(c, lx + dx, ly + 1, C.rail) }
  [[-5, -4], [4, -4], [-5, 3], [4, 3]].forEach(([dx, dy]) => { for (let k = 0; k < 3; k++) dot(o, lx + dx, ly + dy + k - 1, k % 2 ? '#2f2a2a' : '#f2c84a'); dot(o, lx + dx - 1, ly + dy - 2, '#f2c84a'); dot(o, lx + dx + 1, ly + dy - 2, '#f2c84a') }) }
// ---------- เทศกาลตามช่วงปี (ดูจากวันที่) ----------
const festOf = d => { const m = d.getMonth(), dd = d.getDate(); return m === 0 && dd <= 7 ? 'ny' : m === 3 || m === 4 ? 'koi' : m === 7 ? 'mat' : '' };
const KOI = [[131, 272], [101, 305], [7, 198]]; // เสาธงปลาคาร์ปข้างบ้าน
function festBase(c, f, L) {
  if (f === 'mat') { for (let y = 70; y < 87; y += 3) [25, 33].forEach(x => { dot(c, x, y, '#e8503c'); L.push([x, y, 1, 1, 1]) }); for (let x = 20; x < 40; x += 3) { dot(c, x, 99, (x / 3 | 0) % 2 ? '#fff4e0' : '#e8503c'); L.push([x, 99, 1, 1, 1]) } rect(c, 40, 92, 4, 3, '#f2c14e'); rect(c, 44, 92, 4, 3, '#e8503c'); rect(c, 40, 92, 8, 1, '#fff4e0') }
  if (f === 'ny') [[57, 160], [75, 160], [124, 222], [146, 222], [129, 294], [144, 294], [21, 96], [38, 96]].forEach(([x, y]) => { rect(c, x, y - 3, 1, 3, '#5f9a55'); dot(c, x + 1, y - 2, '#3f6b45'); dot(c, x, y - 4, '#86bd68'); rect(c, x - 1, y, 3, 1, '#c9a675') });
  if (f === 'koi') KOI.forEach(([x, y]) => rect(c, x, y - 10, 1, 10, '#8a8a8a')) }
// ---------- ภาพนิ่งทั้งหมด → {v: พื้น, o: ชั้นทับรถไฟ, L: หน้าต่างที่เปิดไฟตอนค่ำ} ----------
const cache = {};
function base(se, locked, fest) { const key = se + '|' + locked.join(',') + '|' + fest; if (cache[key]) return cache[key];
  const mk = () => { const v = document.createElement('canvas'); v.width = W; v.height = H; return v }, v = mk(), o = mk(), c = v.getContext('2d'), oc = o.getContext('2d'), P = PAL[se], R = rng(9), wi = se === 'winter', L = [];
  sky(c); fuji(c, se); hills(c, se);
  rect(c, 0, 50, W, H - 50, P.gr); for (let i = 0; i < 320; i++) rect(c, R() * W, 50 + R() * (H - 50), 1, 2, P.gr2);
  // ย่านบ้านบนเนินลาด: ยิ่งไปทางตะวันออกยิ่งสูง (เงาเนินเป็นจุดเข้ม) แนวกำแพงหินกั้นชั้นเนิน แนวป่าบนสันเนินด้านหลัง (ตรงกับวิวหน้าต่างห้องที่เห็นเนินเขากับหลังคาบ้าน)
  for (let y = 238; y < H; y++) for (let x = 100; x < W; x++) { const h = (x - 100) / 60 * .7 + (y - 238) / 102 * .3; if (h > .2 && bay(x, y) < (h - .2) * .7) dot(c, x, y, P.gr3) }
  [[121, 270, 24], [113, 290, 13], [140, 300, 10], [111, 330, 30]].forEach(([x, y, w]) => { for (let i = 0; i < w; i++) { const yy = Math.round(y + i * .36); dot(c, x + i, yy, '#d8d1c3'); dot(c, x + i, yy + 1, '#9fae8f') } });
  forest(c, 80, 53, 92, 8, se, 3, .15); forest(c, 161, 300, 9, 56, se, 21, .2); forest(c, 136, 345, 22, 6, se, 22, .2);
  // เนินศาลเจ้า: ป่าทึบ (ชินจุโนะโมริ) ล้อมลานกรวดหน้าหอ ทางบันไดโล่ง
  forest(c, 29, 74, 30, 23, se, 7, .2); blob(c, 29, 62, 17, 9, '#d3cab4'); rect(c, 25, 69, 9, 21, P.gr);
  paddy(c, se, 62, 62, 44, 38, 3); paddy(c, se, 0, 108, 22, 32, 5); paddy(c, se, 138, 108, 22, 40, 4); paddy(c, se, 0, 180, 32, 40, 1); paddy(c, se, 0, 228, 18, 58, 2); paddy(c, se, 32, 262, 24, 18, 6); paddy(c, se, 128, 170, 32, 18, 8);
  LANES.forEach(S => stroke(c, S, 0, C.lane));
  // ข: ของประจำหมู่บ้าน: บ่อเก็บน้ำของทุ่งนา ดงไผ่ แปลงผักข้างบ้าน ศาลเจ้าเล็กริมทาง (โฮโกระ)
  blob(c, 5, 300, 6, 4.2, '#9fae8f'); blob(c, 5, 300, 5, 3.4, wi ? C.water2 : C.water3); blob(c, 5, 299.6, 4, 2.6, wi ? '#e3edf3' : C.water); bamboo(c, 0, 318, 9, 22, se); bamboo(c, 22, 102, 6, 8, se);
  [[10, 212, 10, 6], [104, 71, 7, 5], [144, 134, 10, 6], [70, 296, 9, 6], [96, 334, 9, 5]].forEach(([x, y, w, h]) => { rect(c, x, y, w, h, P.veg[0]); for (let yy = y + 1; yy < y + h; yy += 2) for (let xx = x + 1; xx < x + w - 1; xx += 2) dot(c, xx, yy, P.veg[1]) });
  [[18, 286], [124, 188]].forEach(([x, y]) => { rect(c, x, y, 3, 1, C.roof2); rect(c, x, y + 1, 3, 2, '#e8dcc6'); dot(c, x + 1, y + 2, '#8a6040'); rect(c, x - 1, y + 3, 5, 1, C.stone) });
  river(c, se); forest(c, 125, 52, 9, 4.5, se, 31, .1);
  // ถนน (ทุกเส้นถึงที่หมายหรือออกขอบแผนที่) · สะพานตรงที่ข้ามแม่น้ำ
  road(c, HILL, 1, 0); road(c, ONS, 1, 0); road(c, WEST, 2, 0); road(c, SCH, 1, 0); [RES1, RES2, RES3].forEach(S => road(c, S, 1, 0)); road(c, MAIN, 2, 1); road(c, SHOT, 2, 0);
  [SHOT, LANES[2]].forEach((S, k) => { const b = cross(S, RIVER); if (b) bridge(c, S, b[2], k ? 6 : 8, k ? 1.5 : 3.5, k ? C.bridge : '#e2ddd3', k ? C.bridge2 : '#7d766c') });
  rail(c, oc);
  // เสาไฟฟ้าเลียบถนนสายหลัก (ข) · โคมไฟเปิดตอนค่ำ
  for (let i = 8; i < MAIN.length; i += 18) { const [dx, dy] = dirAt(MAIN, i), x = Math.round(MAIN[i][0] + dy * 4), y = Math.round(MAIN[i][1] - dx * 4); if (y < 100 || Math.abs(y - LX[1]) < 6) continue; rect(c, x, y - 3, 1, 4, C.pole); rect(c, x - 1, y - 3, 3, 1, C.pole); L.push([x, y - 2, 1, 1, 2]) }
  // ย่านหน้าสถานี: ฝั่งตรงข้ามรางเป็นแมนชันกับออฟฟิศ (ตรงกับวิวในฉากสถานีที่มองข้ามรางไป)
  tall(c, 36, 151, 9, 11, C.off, C.off2, L); tall(c, 26, 157, 8, 8, C.apt, C.apt2, L); tall(c, 84, 150, 7, 9, C.apt, C.apt2, L); tall(c, 34, 124, 9, 14, C.apt, C.apt2, L); tall(c, 84, 124, 8, 12, C.off, C.off2, L);
  // ถนนช้อปปิ้ง: ร้านสองฝั่ง กันสาดหลากสี
  const AW = [C.awn, C.must, '#5aa0d6', '#7bc47f', '#b58ad6']; let n = 0;
  for (let i = 4; i < SHOT.length - 6; i += 9) { const [dx, dy] = dirAt(SHOT, i), [x, y] = SHOT[i]; [-1, 1].forEach(sd => { const hx = Math.round(x - dy * sd * 7.5) - 3, hy = Math.round(y + dx * sd * 7.5) - 3; if (near(RIVER, hx + 3, hy + 3)[0] < 9 || (hx > 94 && hy < 182 && hy > 158)) return;
    house(c, hx, hy, 6, C.roof3, C.tile2, L); for (let k = 0; k < 6; k++) dot(c, hx + k, hy + 3, k % 2 ? AW[n % 5] : '#fff7ee'); n++ }) }
  // ย่านบ้านบนเนิน · บ้านไร่ในทุ่งนา (หลังคากระเบื้องเข้ม) · บ้านริมถนนสายหลัก
  [[120, 258], [134, 263], [104, 274], [112, 300], [104, 324], [118, 316], [132, 322], [146, 304], [148, 274], [92, 286], [86, 304], [76, 318], [92, 314], [70, 286], [80, 276]].forEach(([x, y], i) => house(c, x, y, 7 + (i % 2), i % 3 ? C.tile : C.roof3, C.tile2, L));
  [[8, 122, 9], [96, 64, 8], [146, 126, 9], [6, 204, 9], [144, 186, 8], [20, 254, 8]].forEach(([x, y, w]) => { house(c, x, y, w, '#4f5a63', '#3d464e', L, '#efe4d0'); dot(c, x + 1, y - 1, '#4f5a63') });
  // ต้นไม้ · ต้นพลับมีลูกส้มหน้าใบไม้ร่วง (ข้างบ้านไร่)
  [[60, 112], [98, 108], [128, 136], [48, 198], [104, 232], [92, 272], [6, 280], [60, 304], [92, 330], [154, 160], [70, 132], [42, 116]].forEach(([x, y]) => tree(c, x, y, se, 'dec', 1.1));
  [[18, 128], [152, 196], [16, 214]].forEach(([x, y]) => { tree(c, x, y, se, 'dec'); if (se === 'autumn' || wi) [[-2, -4], [1, -5], [0, -3], [2, -3]].forEach(([dx, dy]) => dot(c, x + dx, y + dy, '#f08a2c')) });
  LEVEE.forEach(([x, y, i], k) => { if (k % 7 === 3) { const [dx, dy] = dirAt(RIVER, i), tx = Math.round(x + dy * 3), ty = Math.round(y - dx * 3) + 1; if (tx > 48 && ty > 204 && ty < 262) return; tree(c, tx, ty, se, 'sak') } });
  // แปลงว่าง (ง): หญ้าโล่ง มีหลักไม้ปักมุม ป้ายเล็ก (ไม่ดึงสายตาเท่าอาคารจริง)
  LOTS.forEach(({ lot: [x, y, w, h] }) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (bay(xx, yy) < .18) dot(c, xx, yy, P.gr2); [[x, y], [x + w - 1, y], [x, y + h - 1], [x + w - 1, y + h - 1]].forEach(([a, b]) => rect(c, a, b - 1, 1, 2, C.fence)); for (let i = 3; i < w - 2; i += 3) { dot(c, x + i, y, '#d9c9a6'); dot(c, x + i, y + h - 1, '#d9c9a6') } rect(c, x + w - 6, y + 2, 4, 2, '#efe6d2'); dot(c, x + w - 5, y + 4, C.fence) });
  // สถานที่หลัก: ยังล็อกวาดจางลง (ป้ายมีกุญแจ)
  Object.keys(SITE).forEach(id => { const lk = locked.includes(id); if (!lk) return SITE[id](c, se, L); const t = mk(), tc = t.getContext('2d'), tl = []; SITE[id](tc, se, tl); c.globalAlpha = .5; c.drawImage(t, 0, 0); c.globalAlpha = 1 });
  festBase(c, fest, L);
  return cache[key] = { v, o, L } }
// ---------- ของขยับ ----------
const TRAIN = 42, CYC = 30000, TI = (() => { const [, i] = near(RAIL, 64, 145); return i })();
// รถไฟ: เข้าจากตะวันออก ชะลอจอดที่สถานี 4 วินาที แล้วออกไปทางตะวันตก ว่างช่วงหนึ่งก่อนขบวนถัดไป (คิดจากเวลาล้วน)
const trainHead = ms => { const t = (ms % CYC) / 1000, L = RAIL.length, e = k => k * k * (3 - 2 * k); if (t < 8) return L + TRAIN - (L + TRAIN - TI - TRAIN / 2) * e(t / 8); if (t < 12) return TI + TRAIN / 2; if (t < 20) return TI + TRAIN / 2 - (TI + TRAIN / 2 + 4) * e((t - 12) / 8); return null };
function train(c, ms) { const h = trainHead(ms); if (h == null) return null; const L = RAIL.length; for (let k = 0; k < TRAIN; k++) { const i = Math.round(h) - TRAIN + k; if (i < 0 || i >= L) continue; const [x, y] = RAIL[i], g = k % 14 === 0;
    rect(c, x, y - 2, 1, 4, g ? '#8f959c' : C.train); if (!g) dot(c, x, y, C.train2); if (k % 3 === 1 && !g) dot(c, x, y - 1, C.glass) } return [Math.round(h) - TRAIN, Math.round(h)] }
function crossing(c, span, ms) { if (!span) return; const [a, b] = span, i = LX[2]; if (i < a - 30 || i > b + 30) return; const on = (ms / 450 | 0) % 2, lx = Math.round(LX[0]), ly = Math.round(LX[1]);
  [[-5, -6], [4, -6], [-5, 1], [4, 1]].forEach(([dx, dy], k) => dot(c, lx + dx, ly + dy, (k + on) % 2 ? '#ff4a3a' : '#5a1f1a'));
  for (let dx = -4; dx <= 3; dx++) { dot(c, lx + dx, ly - 5, dx % 2 ? '#2f2a2a' : '#f2c84a'); dot(c, lx + dx + 1, ly + 4, dx % 2 ? '#2f2a2a' : '#f2c84a') } }
function koi(c, ms, P) { KOI.forEach(([x, y], k) => [['#3a3a46', 0], ['#e8503c', 3], ['#4f8fd6', 6]].forEach(([col, dy], j) => { for (let i = 0; i < 6 - j; i++) { const w = P ? Math.round(Math.sin(ms / 260 - i * .9 + k) * .6) : 0; dot(c, x + 1 + i, y - 10 + dy + w, col); if (i === 0) dot(c, x + 1, y - 9 + dy + w, '#fff') } })) }
// ---------- เดินทาง (v131): แมวเดินตามถนนจริงจากที่เดิมไปที่ใหม่ ----------
// กราฟทางเดิน: จุดของถนน ซอย คันนา เชื่อมจุดติดกันในเส้นเดียวกัน และจุดต่างเส้นที่ห่างกันไม่ถึง 2.5 px (ทางแยก) · ข้ามรางที่สถานีทางสะพานลอย (ทางออกเหนือ ↔ ลานหน้าสถานี) · ทางเดินในสวนต่อประตูตะวันตก (คันนาข้ามสะพานไม้) กับประตูใต้
const WALK = [MAIN, ONS, SHOT, WEST, HILL, SCH, RES1, RES2, RES3, ...LANES, spline([[62, 124], [70, 131], [78, 137], [79, 150], [72, 156], [68, 158]]), spline([[126, 91], [132, 96], [140, 101], [146, 105]]), spline([[90, 225], [102, 228], [105, 238], [104, 252], [98, 262]])]; // สองเส้นท้าย = ทางเดินในสวน (ประตูตะวันตก ↔ ประตูใต้) · ทางเดินข้างสระ/โรงยิมจากประตูโรงเรียน
let GR = null;
function graph() { if (GR) return GR; const N = [], E = [], add = p => (N.push(p), E.push([]), N.length - 1), link = (a, b) => { const w = Math.hypot(N[a][0] - N[b][0], N[a][1] - N[b][1]); E[a].push([b, w]); E[b].push([a, w]) };
  const ids = WALK.map(S => { const k = S.filter((q, i) => i % 2 === 0 || i === S.length - 1).map(add); k.forEach((v, i) => { if (i) link(k[i - 1], v) }); return k });
  ids.forEach((A, a) => ids.forEach((B, b) => { if (b > a) A.forEach(i => B.forEach(j => { if (Math.abs(N[i][0] - N[j][0]) < 2.5 && Math.hypot(N[i][0] - N[j][0], N[i][1] - N[j][1]) < 2.5) link(i, j) })) }));
  return GR = { N, E } }
const nearN = (x, y) => { let b = 0, bd = 1e9; graph().N.forEach(([a, c], i) => { const d = (a - x) ** 2 + (c - y) ** 2; if (d < bd) { bd = d; b = i } }); return b };
// เส้นทางสั้นสุด (Dijkstra): จุดแมวของที่เดิม → ถนนหน้าที่เดิม (map.door หรือ map.at) → … → ถนนหน้าที่ใหม่ → จุดแมวของที่ใหม่ · คืนจุดห่างกันทีละ 1 px (ไม่มีทาง = null)
function trip(from, to) { const { N, E } = graph(), door = q => q.map.door || q.map.at, a = nearN(...door(from)), z = nearN(...door(to)), n = N.length, D = new Float64Array(n).fill(Infinity), P = new Int32Array(n).fill(-1), done = new Uint8Array(n); D[a] = 0;
  for (;;) { let u = -1, m = Infinity; for (let i = 0; i < n; i++) if (!done[i] && D[i] < m) { m = D[i]; u = i } if (u < 0 || u === z) break; done[u] = 1; for (const [v, w] of E[u]) if (D[u] + w < D[v]) { D[v] = D[u] + w; P[v] = u } }
  if (!isFinite(D[z])) return null; const R = [to.map.cat]; for (let u = z; u >= 0; u = P[u]) R.unshift(N[u]); R.unshift(from.map.cat);
  const o = [R[0].slice()]; let rem = 0; for (let i = 1; i < R.length; i++) { const [ax, ay] = R[i - 1], [bx, by] = R[i], d = Math.hypot(bx - ax, by - ay); if (!d) continue; let t = 1 - rem; for (; t <= d; t += 1) o.push([ax + (bx - ax) * t / d, ay + (by - ay) * t / d]); rem = d - (t - 1) } o.push(R[R.length - 1].slice()); return o }
const sprite = (c, g, x, y, bob = 0) => { for (let yy = 0; yy < g.length; yy += 2) for (let xx = 0; xx < g[yy].length; xx += 2) if (g[yy][xx]) dot(c, x - 12 + xx / 2, y - 21 + bob + yy / 2, g[yy][xx]) };
// ระหว่างเดินทาง: เส้นทางข้างหน้าเป็นจุดจาง รอยเท้าข้างหลัง ธงปักที่หมาย · ตำแหน่งเดินเร็วช้าตามเส้นโค้ง smoothstep (ออกตัวช้า เร่ง แล้วชะลอตอนถึง)
function tripDraw(c, T, now) { const k = Math.min(1, Math.max(0, (now - T.t0) / T.dur)), e = k * k * (3 - 2 * k), n = T.pts.length - 1, s = e * n, i = Math.floor(s), A = T.pts[i], B = T.pts[Math.min(n, i + 1)], f = s - i;
  T.k = k; T.pos = [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f]; const ah = T.pts[Math.min(n, i + 4)], bk = T.pts[Math.max(0, i - 4)]; if (Math.abs(ah[0] - bk[0]) > .6) T.face = ah[0] > bk[0] ? 1 : -1;
  for (let j = Math.ceil(s) + 4; j < n - 2; j++) if (j % 4 < 2) dot(c, T.pts[j][0], T.pts[j][1], j % 4 ? '#ff8a5c' : '#e8603c');
  for (let j = 3; j < s - 4; j += 4) { const [x, y] = T.pts[j], [dx, dy] = dirAt(T.pts, j), sd = (j / 4 | 0) % 2 ? 1 : -1; dot(c, x - dy * sd, y + dx * sd, '#7a4e30') }
  if (k < 1) { const [fx, fy] = T.dest, w = Math.round(Math.sin(now / 140)); rect(c, fx + 5, fy - 11, 1, 9, '#5a4636'); rect(c, fx + 6, fy - 11, 4, 3 + (w > 0), '#e8503c'); dot(c, fx + 9, fy - 11 + w, '#ff7a5c') } }
function tripCat(c, T, cat, now) { const walk = T.k < 1, g = PixelCat.frame(walk ? (T.face > 0 ? 'walkR' : 'walkL') : 'sit', walk ? Math.floor((now - T.t0) / 85) % 8 : 0, 'light', cat.coat, cat.acc || 'none'); sprite(c, g, T.pos[0], T.pos[1]);
  if (T.arr) { const t = (now - T.arr) / 900; if (t < 1) [[-9, -18], [8, -20], [-4, -24], [5, -15]].forEach(([dx, dy], i) => { const up = Math.round(t * 6), on = ((now / 120 | 0) + i) % 2; if (on) { dot(c, T.pos[0] + dx, T.pos[1] + dy - up, '#ffd34a'); dot(c, T.pos[0] + dx + 1, T.pos[1] + dy - up, '#fff3b0') } }) } }
// แสงตามเวลา: ย้อมทั้งภาพตาม PixelCat.tod() (รุ่งเช้า/พลบค่ำอุ่น กลางคืนน้ำเงินเข้ม) แล้วเปิดไฟหน้าต่าง ตู้แช่ร้าน สถานี โคม
const TINT = { dawn: ['rgba(255,196,160,.42)', .5], dusk: ['rgba(255,160,110,.5)', .8], night: ['rgba(52,62,120,.7)', 1] };
function light(c, td, L) { const T = TINT[td]; if (!T) return; c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = T[0]; c.fillRect(0, 0, W, H); c.restore();
  L.forEach(([x, y, w, h, k], i) => { if (T[1] < 1 && (i * 7) % 10 > T[1] * 10) return; if (k === 2 || w * h > 6) { c.globalAlpha = .28; blob(c, x + w / 2, y + h / 2, w / 2 + 2.5, h / 2 + 2, C.glow); c.globalAlpha = 1 } rect(c, x, y, w, h, k === 1 ? '#ffb27a' : C.lamp) }) }
// ---------- วาดแผนที่ลงผืนผ้าใบ · o: {season(), tod(), date(), here, locked[], places[{id, map}], cat: {coat, acc} | null} ----------
const RMQ = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
function paint(cv, o, now) { const c = cv.getContext('2d'), se = o.season(), d = o.date(), P = !RMQ.matches, ms = d.getTime(), fest = festOf(d), B = base(se, o.locked, fest), td = o.tod();
  c.drawImage(B.v, 0, 0); const span = P ? train(c, ms) : null; c.drawImage(B.o, 0, 0); if (P) crossing(c, span, ms); if (fest === 'koi') koi(c, ms, P);
  if (o.trip) tripDraw(c, o.trip, now);
  light(c, td, B.L);
  const q = o.places.find(p => p.id === o.here), PC = o.cat && window.PixelCat && PixelCat.frame;
  if (PC && o.trip) tripCat(c, o.trip, o.cat, now); else if (PC && q) sprite(c, PixelCat.frame('sit', 0, 'light', o.cat.coat, o.cat.acc || 'none'), q.map.cat[0], q.map.cat[1], P ? Math.round(Math.sin(now / 300)) : 0);
  if (P && window.PixelCat && PixelCat.fall) PixelCat.fall(c, se, [0, 36, W, H - 36], se === 'winter' ? 50 : 20, ms) }
function mount(cv, o) { let raf = 0; const loop = now => { if (!cv.isConnected) return; paint(cv, o, now || 0); if (o.onFrame) o.onFrame(now || 0); if (!RMQ.matches) raf = requestAnimationFrame(loop) }; loop(performance.now()); return { stop: () => cancelAnimationFrame(raf), redraw: () => paint(cv, o, performance.now()) } }
// ---------- หน้าต่าง "ไปเที่ยวที่ไหนดี": แผนที่ + ป้ายเป็นปุ่ม HTML (ตัวหนังสือจริง) + เส้นชี้ + กล่องข้อมูล ----------
// a: {places, at, has(p), count(p), go(id), rb(s), icon(k, s), cat: {coat, acc} | null, emoji, season(), tod(), date()} · host = ใส่ในกล่องที่ให้ (พรีวิว) แทนหน้าต่างลอย
const MARKS = [['ふじさん', 56, 22], ['ねこがわ', 116, 131], ['たんぼ', 11, 238]];
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
function ask(a, host) {
  if (!host && document.querySelector('.cov')) return;
  const ov = host ? null : document.createElement('div'), d = document.createElement('div'); d.className = 'cdl tmd'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'ไปเที่ยวที่ไหนดี'); if (ov) { ov.className = 'cov'; d.setAttribute('aria-modal', 'true') }
  const pl = a.places.filter(p => p.map), locked = pl.filter(p => !a.has(p)).map(p => p.id), lk = a.icon ? a.icon('lock', 13) : '';
  d.innerHTML = `<h2>ไปเที่ยวที่ไหนดี</h2><div class="st">แตะป้ายบนแผนที่ อยู่ที่ไหน ปุ่มทบทวนจะเอาคำในหมวดของที่นั้นขึ้นก่อน ที่ที่มีกุญแจปลดล็อกได้ด้วยการเรียน</div>
<div class="tmw"><div class="tmc"><canvas width="${W}" height="${H}" role="img" aria-label="แผนที่เมืองเนโกะมาจิ ฟูจิอยู่ทางเหนือ แม่น้ำไหลผ่านกลางเมือง"></canvas><svg class="tml" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"></svg>
<span class="tmn" lang="ja" title="北 (きた) = ทิศเหนือ" aria-label="ทิศเหนืออยู่ด้านบน"><i></i>北</span>${MARKS.map(([t]) => `<span class="tmk" lang="ja" aria-hidden="true">${t}</span>`).join('')}
${pl.map(p => `<button type="button" class="tmp" data-p="${p.id}"></button>`).join('')}${LOTS.map(q => `<button type="button" class="tmp soon" data-s="${q.id}" aria-label="แปลงว่าง เร็วๆ นี้">เร็วๆ นี้</button>`).join('')}${a.cat ? '' : `<span class="tme" aria-hidden="true">${a.emoji || ''}</span>`}</div></div>
<div class="btns"><button type="button" class="g" data-x="1">ปิด</button></div>`;
  const cv = d.querySelector('canvas'), wrap = d.querySelector('.tmw'), box = d.querySelector('.tmc'), svg = d.querySelector('.tml');
  const o = { season: a.season, tod: a.tod, date: a.date, here: a.at, locked, places: pl, cat: a.cat }; let m = null;
  let Z = 2;
  const pins = () => { box.querySelectorAll('.tmp[data-p]').forEach(b => { const p = pl.find(q => q.id === b.dataset.p), ok = a.has(p), hr = p.id === o.here, nm = p.map.n || p.n;
    b.className = 'tmp' + (ok ? hr ? ' here' : '' : ' tlk'); b.innerHTML = `${ok ? '' : lk}<span>${esc(nm)}</span><span class="j" lang="ja">${esc(p.jp.replace(/\{([^|}]*)\|[^}]*\}/g, '$1'))}</span>`;
    b.setAttribute('aria-label', nm + (hr ? ' อยู่ที่นี่' : ok ? '' : ' ยังล็อก')) });
    const ln = (p, k) => `<line class="${k}" x1="${p.map.lb[0]}" y1="${p.map.lb[1]}" x2="${p.map.at[0]}" y2="${p.map.at[1]}"/>`;
    svg.innerHTML = pl.map(p => ln(p, 'h')).join('') + pl.map(p => ln(p, 'l') + `<circle cx="${p.map.at[0]}" cy="${p.map.at[1]}" r="1.2"/>`).join('') };
  // วางตามพิกัดแผนที่ · ป้ายที่กว้างเกินขอบถูกดันเข้ามาในแผนที่ (เส้นชี้ยังชี้อาคารเดิม)
  const place = (el, x, y) => { const h = el.offsetWidth / 2 + 3; el.style.left = Math.max(h, Math.min(W * Z - h, x * Z)) + 'px'; el.style.top = y * Z + 'px' };
  const fit = () => Math.max(1.5, Math.min(3, Math.floor((wrap.clientWidth || 320) / W * 2) / 2));
  const layout = z => { Z = typeof z === 'number' ? z : fit(); box.style.width = W * Z + 'px'; box.style.height = H * Z + 'px'; box.style.setProperty('--z', Z);
    box.querySelectorAll('.tmp[data-p]').forEach(b => { const p = pl.find(q => q.id === b.dataset.p); place(b, ...p.map.lb) }); box.querySelectorAll('.tmp[data-s]').forEach(b => { const q = LOTS.find(l => l.id === b.dataset.s); place(b, ...q.at) });
    box.querySelectorAll('.tmk').forEach((e, i) => place(e, MARKS[i][1], MARKS[i][2])); place(box.querySelector('.tmn'), 9, 9); const e = box.querySelector('.tme'), q = pl.find(p => p.id === o.here); if (e && q) place(e, q.map.cat[0], q.map.cat[1] - 6) };
  const onResize = () => layout(); const close = () => { m.stop(); removeEventListener('resize', onResize); if (ov) ov.remove(); else d.remove() };
  const info = p => { const old = d.querySelector('.tmi'); if (old) old.remove(); const s = document.createElement('div'); s.className = 'tmi';
    if (!p) s.innerHTML = `<div class="tmh"><b>แปลงว่าง</b></div><div class="st">สถานที่ใหม่กำลังจะมาที่นี่ เร็วๆ นี้นะ</div><div class="btns"><button type="button" class="g" data-c="1">ปิด</button></div>`;
    else { const ok = a.has(p), hr = p.id === o.here, n = p.unlock ? Math.min(a.count(p), p.unlock.n) : 0;
      s.innerHTML = `<div class="tmh"><b>${esc(p.n)}</b><span class="j" lang="ja">${a.rb(p.jp)}</span></div><div class="st">${p.cats.length ? 'ทบทวนคำหมวด' + esc(p.note) + 'ก่อน' : esc(p.note)}</div>${ok ? '' : `<div class="st">${lk} ${esc(p.unlock.t)} ${n}/${p.unlock.n} คำ</div><div class="bar"><i style="width:${n / p.unlock.n * 100}%"></i></div>`}
<div class="btns"><button type="button" class="go"${ok && !hr ? '' : ' disabled'}>${hr ? 'อยู่ที่นี่แล้ว' : ok ? 'ไปเที่ยวที่นี่' : 'ยังล็อกอยู่'}</button><button type="button" class="g" data-c="1">ปิด</button></div>` }
    s.setAttribute('role', 'group'); s.setAttribute('aria-label', p ? p.n : 'แปลงว่าง'); d.appendChild(s); const f = s.querySelector('.go:not(:disabled)') || s.querySelector('[data-c]'); if (f) f.focus({ preventScroll: true });
    s.onclick = e => { const b = e.target.closest('button'); if (!b) return; e.stopPropagation(); if (b.dataset.c) return s.remove(); if (b.classList.contains('go') && p) { s.remove(); go(p) } } };
  // เดินทาง: แมว (หรืออิโมจิของกระต่าย/หมา) เดินตามถนนไปที่ใหม่ แผนที่เลื่อนตาม กล่องบอกระยะทางกับเวลาเดิน (1 px ≈ 8 ม. · เดิน 80 ม./นาที)
  // ยาวสุด 5.2 วินาที (ไกลก็เดินเร็วขึ้น) · แตะที่ไหนก็ได้เพื่อข้ามไปตอนถึง · ถึงแล้วมีประกายแล้วค่อยปิดหน้าต่าง · ปิดแอนิเมชันในระบบ = ไปทันที
  const go = p => { const from = pl.find(q => q.id === o.here), nm = p.map.n || p.n, pts = RMQ.matches || !from ? null : trip(from, p), fin = () => { o.trip = null; o.onFrame = null; o.here = p.id; a.go(p.id, close) };
    if (!pts) return fin();
    const L = pts.length - 1, km = Math.max(50, Math.round(L * 8 / 50) * 50), min = Math.max(1, Math.round(L * 8 / 80)), e = box.querySelector('.tme'), dl = box.querySelector(`.tmp[data-p="${p.id}"]`), ic = k => a.icon ? a.icon(k, 18) : '';
    o.trip = { pts, t0: performance.now(), dur: Math.max(1800, Math.min(5200, L / 40 * 1000)), face: 1, dest: p.map.cat, k: 0 }; d.classList.add('trip'); if (dl) dl.classList.add('dest');
    const s = document.createElement('div'); s.className = 'tmi tmv'; s.setAttribute('role', 'status');
    s.innerHTML = `<div class="tmh"><b>${ic('paw')} <span>กำลังเดินไป${esc(nm)}</span></b></div><div class="st">ระยะทางราว ${km.toLocaleString('th-TH')} ม. · เดินราว ${min} นาที</div><div class="bar"><i></i></div><div class="st tmk2">แตะที่ไหนก็ได้เพื่อข้าม</div>`; d.appendChild(s);
    // กล้อง: ค่อยๆ ซูมเข้า 1 เท่า (สูงสุด 4) แล้วตามแมวไปทั้งแนวตั้งแนวนอน ให้แมวอยู่กลางส่วนที่ไม่ถูกกล่องบัง
    const bar = s.querySelector('.bar i'), ZT = Math.min(4, fit() + 1); o.onFrame = () => { const T = o.trip; if (!T || !T.pos) return; bar.style.width = T.k * 100 + '%'; if (Z < ZT - .01) layout(Z + (ZT - Z) * .12);
      const vh = wrap.clientHeight - s.offsetHeight - 10; wrap.scrollLeft = T.pos[0] * Z - wrap.clientWidth / 2; wrap.scrollTop = T.pos[1] * Z - Math.max(80, vh) / 2; if (e) place(e, T.pos[0], T.pos[1] - 6);
      if (T.k >= 1 && !T.arr) { T.arr = performance.now(); s.querySelector('b').innerHTML = `${ic('sparkle')} <span>ถึง${esc(nm)}แล้ว!</span>`; s.querySelector('.tmk2').textContent = ''; setTimeout(fin, 900) } } };
  d.addEventListener('click', e => { const b = e.target.closest('button'); if (o.trip) { if (b && b.dataset.x) return close(); if (!o.trip.arr) o.trip.t0 = performance.now() - o.trip.dur; return }
    if (b && b.dataset.x) return close(); if (b && b.dataset.p) return info(pl.find(p => p.id === b.dataset.p)); if (b && b.dataset.s) return info(null);
    if (!e.target.closest('.tmi')) { const i = d.querySelector('.tmi'); if (i) i.remove() } });
  if (ov) { ov.addEventListener('click', e => { if (e.target !== ov) return; if (o.trip) { if (!o.trip.arr) o.trip.t0 = performance.now() - o.trip.dur } else close() }); ov.appendChild(d); document.body.appendChild(ov) } else host.appendChild(d);
  m = mount(cv, o); addEventListener('resize', onResize); pins(); layout();
  // เปิดมาแล้วเลื่อนไปตรงที่แมวอยู่ (แผนที่สูงราว 1,000 พิกเซลที่ 3 เท่า)
  const q = pl.find(p => p.id === o.here); if (q) wrap.scrollTop = Math.max(0, q.map.cat[1] * Z - wrap.clientHeight / 2);
  return { close, info: id => info(pl.find(p => p.id === id) || null) } }
window.TownMap = { W, H, LOTS, SITE, PAL, mount, ask, festOf, trainHead, base, trip, paths: { RIVER, RAIL, MAIN, ONS, SHOT, WEST, HILL, SCH, RES1, RES2, RES3, LANES }, cross };
})();
// ---------- ต่อเข้ากับแอป (แทนรายการสถานที่แบบเดิม) ----------
function placeAsk() {
  const st = plState(), sp = (M.pet && M.pet.sp) || 0;
  TownMap.ask({ places: PLACES, at: st.at, has: plHas, count: p => plCount(p.unlock.cats), rb, icon: icx,
    cat: sp === 0 && window.PixelCat ? { coat: M.pet.coat, acc: M.pet.acc } : null, emoji: SPC[sp][0],
    season: () => window.PixelCat ? PixelCat.season() : ['spring', 'summer', 'autumn', 'winter'][((new Date().getMonth() + 10) % 12) / 3 | 0], tod: plTod, date: () => new Date(),
    go: (id, close) => { st.at = id; if (!st.fam) st.fam = {}; plSave(st); close(); render(); toast(icx('paw', 16) + ' ถึง' + placeOf(id).n + 'แล้ว') } }); // เรียกตอนแมวเดินไปถึงแล้ว
}
