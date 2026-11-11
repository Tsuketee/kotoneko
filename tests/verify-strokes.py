# เทียบข้อมูลลำดับขีดใน js/data/strokes.js กับไฟล์ SVG ต้นฉบับของ KanjiVG
# วิธีใช้: ดาวน์โหลดไฟล์ SVG ของโปรเจกต์ KanjiVG (โฟลเดอร์ kanji/) ลงในโฟลเดอร์หนึ่ง แล้วรัน
#   python3 -I tests/verify-strokes.py <โฟลเดอร์ที่เก็บ svg>
# ต้องได้ "same 353 diff 0 missing 0"
import re,json,sys,os
s=open(os.path.join(os.path.dirname(__file__),'..','js/data/strokes.js'),encoding='utf-8').read()
s=s[s.index('const SV=')+9:]
SV=json.loads(s.rstrip().rstrip(';'))
d=sys.argv[1];ok=bad=miss=0;diff=[]
for ch,v in SV.items():
    f=os.path.join(d,'%05x.svg'%ord(ch))
    if not os.path.exists(f):miss+=1;continue
    t=open(f,encoding='utf-8').read()
    ref=re.findall(r'<path id="kvg:[0-9a-f]+-s\d+"[^>]* d="([^"]+)"',t)
    if ref==v['s']:ok+=1
    else:bad+=1;diff.append((ch,len(ref),len(v['s'])))
print(len(SV),'same',ok,'diff',bad,'missing',miss,diff[:15])
