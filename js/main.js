// จุดเริ่มต้น: โหลดไฟล์อื่นครบแล้วค่อยวาดหน้าจอ (ต้องเป็นไฟล์ท้ายสุดใน index.html)
['gesturestart', 'gesturechange', 'gestureend'].forEach(t => document.addEventListener(t, e => e.preventDefault(), { passive: false }));
document.addEventListener('touchmove', e => { if (e.touches.length > 1) e.preventDefault() }, { passive: false });
render();
cloudStart();
packStart();
