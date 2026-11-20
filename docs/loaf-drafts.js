// ร่างท่าง่วงเคลิ้มแบบใหม่ (2026-11-20 · เจ้าของบอกว่าท่าหมอบเดิมตาและตัวดูใหญ่กว้างไป)
// **เจ้าของเลือก C นั่งสัปหงก** → ย้ายเข้าแอปแล้วเป็น POSES.doze ใน js/pixelcat.js (v86: 8 เฟรม หางโค้งมน ไม่เอียงหัว) · A และ B เก็บไว้เป็นทางเลือก
// โหลดหลัง js/pixelcat.js แล้วเพิ่มท่าร่างลง PixelCat._t.POSES: dozeA ขนมปังตัวเล็ก · dozeB คางเกยอุ้งเท้า · dozeC นั่งสัปหงก
// เลือกแบบไหนแล้วให้ย้ายโค้ดเข้า POSES.loaf ใน js/pixelcat.js (ตัวช่วยใน _t.lib คือฟังก์ชันชุดเดียวกับในไฟล์นั้น)
(function () {
  const T = PixelCat._t, L = T.lib, { sitCat, sdBox, sdEll, sdCap, smin, ear, earPts, headMat, tail, P, put, bean, mouth, blush, zz, bowPart, RAMP, EYE, IRIS, fr } = L;
  // ตาเล็กลง (เดิมตาปรือกว้าง 4 px หนา 2 แถวดูใหญ่): เปลือกตาบาง 3 px + ตาดำ 1 จุด (สีตาตามลาย) · o = 0 เหลือแค่เส้น · x,y = มุมซ้ายบน
  const lid = (a, x, y, o = 1) => { put(a, x, y, [[0, 0], [1, 0], [2, 0]], EYE); if (o) put(a, x + 1, y + 1, o > 1 ? [[0, 0], [0, 1]] : [[0, 0]], IRIS) };
  const shut = (a, x, y) => put(a, x, y, [[0, 0], [1, 1], [2, 0]], EYE); // หลับ ‿ เล็ก 3 px
  const EX = [17, 28]; // ตาซ้าย/ขวา (ตรงกับตาเม็ดถั่วของท่านั่ง)
  // ท่าหมอบตัวเล็ก ใช้ร่วมกันใน A และ B: bw/bh ครึ่งกว้าง/ครึ่งสูงของตัว · by กึ่งกลางตัว · hy กลางหัว · ear หูเอน · paw แถวอุ้งเท้า · front อุ้งเท้าอยู่หน้าคาง
  function doze(o) {
    const a = [], lt = L.IDLE === 'twitchL' ? 1 : 0, rt = L.IDLE === 'twitchR' ? 1 : 0, fl = L.IDLE === 'flick' ? 1 : 0, hx = 24, hy = o.hy, hyF = Math.round(hy);
    const EL = earPts(hx, hy, o.ear + lt * .8, false), ER = earPts(hx, hy, o.ear + rt * .8, true), bw = o.bw, bh = o.bh, by = o.by;
    const bodyS = (x, y) => Math.max(sdBox(x, y, 24, by, bw, bh, Math.min(bh, 5.6)), y - 42.4);
    const body = { z: 0, R: 9, sdf: bodyS, mat: (x, y) => { const st = y < by && Math.abs(x - 24) > bw - 6 && fr(x / 3.2 + .3) < .34; return sdEll(x, y, 24 + bw - 4, by - 4.2, 4, 3) < 0 ? P('patch', st) : P('fur', st) } };
    const hx2 = bw - 4, hips = { z: .5, R: 5, ground: false, contour: false, sdf: (x, y) => Math.max(Math.min(sdEll(x, y, 24 - hx2, by + 1.6, 4.4, 3.8), sdEll(x, y, 24 + hx2, by + 1.6, 4.4, 3.8)), bodyS(x, y) + .4), mat: (x, y) => { const c = x < 24 ? 24 - hx2 : 24 + hx2, d = Math.hypot((x - c) / 1.15, y - by - 1.6); return P('fur', d > 1.5 && fr(d / 2.4) < .38) } };
    const chest = { z: 1, R: 5, ground: false, contour: false, sdf: (x, y) => Math.max(sdEll(x, y, 24, by + 2.6, 5.6, 3.8), bodyS(x, y) + .5), mat: () => P('under') };
    const pr = o.front ? [3, 2.2] : [2.5, 1.8], paws = { z: o.front ? 2.2 : 1.5, R: 2, ground: false, contour: null, sdf: (x, y) => Math.max(Math.min(sdEll(x, y, 24 - o.px, o.paw, ...pr), sdEll(x, y, 24 + o.px, o.paw, ...pr)), y - 42.6), mat: () => P('paw') };
    const head = { z: 2, R: 8.5, sdf: (x, y) => smin(sdEll(x, y, hx, hy, 12.4, 10), Math.min(ear(x, y, ...EL.o), ear(x, y, ...ER.o)), 1.8), mat: (x, y) => headMat(x, y, hx, hy, { lo: EL.o, ro: ER.o, li: EL.i, ri: ER.i }, [hx + 5.6, hy - 7.6, 5.6, 3.6]) };
    const tl = tail(o.tail.map((p, i, A) => i === A.length - 1 ? [p[0] - fl * .6, p[1] - fl * 1.6] : p), 2, 1.2, o.front ? 1.8 : 3, { tip: .78, base: .14 });
    o.eyes(a, hyF); mouth(a, 22, hyF + 4.6); blush(a, 13, hyF + 3.4); blush(a, 32, hyF + 3.4); if (o.zz) zz(a, ...o.zz, false);
    const parts = [body, hips, chest, paws, head, tl], sy = hy + 10.4;
    if (L.ACC === 'scarf') parts.push({ z: 1.9, R: 2.4, ground: false, sdf: (x, y) => sdCap(x, y, hx - 8.6, sy - .4, hx + 8.6, sy - .4, 2.5, 2.5), ramp: 'scarf', contour: RAMP.scarf[4] });
    if (L.ACC === 'bow') parts.push(bowPart(hx + 7.4, hy - 5.6, Math.atan2(5, 7.8)));
    return { parts, decals: a, shadow: [24, 43.6, bw + 3, 2.6], ground: 43 };
  }
  const NOD = [0, .8, 1.8, 0];
  Object.assign(T.POSES, {
    // A ขนมปังตัวเล็ก: ตัวกว้างเท่าหัว (เดิมกว้างกว่าหัว 8 px) ตาปรือเล็ก เปลือกตาบางเห็นตาดำจุดเดียว → สัปหงก → หลับ → เงยหน้ากลับ
    dozeA: f => doze({ bw: 12.8, bh: 6.2, by: 36.6, hy: 25.8 + NOD[f], ear: .05, px: 3.6, paw: 41.8,
      tail: [[35.6, 34.6], [38.4, 37.8], [37.6, 41.4], [33.4, 43.2], [28.6, 43.2]],
      eyes: (a, y) => EX.forEach(x => f === 2 ? shut(a, x, y + 1.6) : lid(a, x, y + 1, [1, 1, 0, 1][f])),
      zz: f === 1 || f === 2 ? [38, 7 - f] : null }),
    // B คางเกยอุ้งเท้า: หัวต่ำลงวางบนอุ้งเท้าหน้า หูเอนออกข้างนิดๆ ตาหลับพริ้ม ‿ หายใจช้าๆ แอบลืมตามองแวบหนึ่ง
    dozeB: f => doze({ bw: 11.4, bh: 5.4, by: 37.8, hy: 28 + [0, .3, .5, .3][f], ear: .18, px: 4, paw: 40.6, front: 1,
      tail: [[35, 35.6], [37.8, 38.8], [35.6, 42.4], [29.4, 43.6], [23, 43.4]],
      eyes: (a, y) => EX.forEach(x => f === 3 ? lid(a, x, y + 1.4, 1) : shut(a, x, y + 1.8)),
      zz: [38, 9 - (f % 2)] }),
    // C นั่งสัปหงก: นั่งตัวปกติ (แคบกว่าหมอบ) หางโอบมาหน้าเท้า หัวค่อยๆ ก้ม ตาปรือ → หลับ → สะดุ้งเงยหน้า
    dozeC: f => sitCat({ hy: [0, .9, 2, -.3][f], tilt: [0, .05, .1, 0][f], ear: [.05, .1, .16, 0][f], tailFront: true,
      tail: [[34, 41], [38.4, 43.2], [33, 45], [25, 45.2], [19.6, 44.2]], tr1: 1.2,
      face: (a, hx, y) => { if (f === 3) { bean(a, 17.6, y + .4, 3); bean(a, 28.6, y + .4, 3) } else EX.forEach(x => f === 2 ? shut(a, x, y + 1.6) : lid(a, x, y + 1, f ? 0 : 1)); // สะดุ้งลืมตาเม็ดถั่วสั้น
        mouth(a, 22, y + 4.6); blush(a, 13, y + 3.4); blush(a, 32, y + 3.4) },
      fx: a => { if (f === 1 || f === 2) zz(a, 38, 9 - f, false) } })
  });
  PixelCat.drafts = { dozeA: [650, 500, 450, 350], dozeB: [700, 700, 700, 700], dozeC: [700, 550, 500, 320] };
})();
