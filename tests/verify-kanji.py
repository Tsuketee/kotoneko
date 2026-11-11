# ตรวจรายการคันจิใน js/data/kanji-n5.js เทียบกับ KANJIDIC2 (EDRDG)
# เตรียมข้อมูล (ครั้งเดียว):
#   pip download jamdict-data --no-deps -d /tmp/jd && tar -xzf /tmp/jd/jamdict_data-*.tar.gz -C /tmp/jd
#   xz -dk /tmp/jd/jamdict_data-*/jamdict_data/jamdict.db.xz
# รัน:  python3 -I tests/verify-kanji.py <path ของ jamdict.db>
# ผลที่ต้องการ: "ขาดจากระดับ JLPT เก่า 4" มีแต่ตัวที่เรายังไม่ได้เพิ่มโดยตั้งใจ และ "คำอ่านที่ KANJIDIC2 ไม่มี" ต้องว่าง
import re,sqlite3,sys,os
db=sys.argv[1] if len(sys.argv)>1 else 'jamdict.db'
c=sqlite3.connect(db)
src=open(os.path.join(os.path.dirname(__file__),'..','js/data/kanji-n5.js'),encoding='utf-8').read()
rows=[l.split(',') for l in re.search(r'`(.*?)`',src,re.S).group(1).strip().split('\n')]
ours={r[0] for r in rows}
j4={l for (l,) in c.execute("select literal from character where jlpt='4'")}
print('จำนวนคันจิในแอป',len(rows),'| KANJIDIC2 JLPT เก่าระดับ 4:',len(j4))
print('ขาดจากระดับ JLPT เก่า 4:',sorted(j4-ours))
print('เพิ่มเกินจากระดับ JLPT เก่า 4 (ตั้งใจ):',sorted(ours-j4))
kata=lambda s:''.join(chr(ord(x)+0x60) if 'ぁ'<=x<='ゖ' else x for x in s)
hira=lambda s:''.join(chr(ord(x)-0x60) if 'ァ'<=x<='ヶ' else x for x in s)
bad=[]
for k,o,u,m,cat in rows:
    cid=c.execute('select ID from character where literal=?',(k,)).fetchone()[0]
    on=set();kun=set()
    for rv,rt in c.execute("select r.value,r.r_type from reading r join rm_group g on r.gid=g.ID where g.cid=? and r.r_type in ('ja_on','ja_kun')",(cid,)):
        if rt=='ja_on':on.add(kata(rv))
        else:kun.add(hira(rv.split('.')[0].replace('-','')))
    mine_on={kata(x) for x in o.split('/') if x and x!='-'}
    mine_kun={re.sub(r'\(.*?\)','',x) for x in re.split(r'[・/]',u) if x and x!='-'}
    if mine_on-on or mine_kun-kun:bad.append((k,sorted(mine_on-on),sorted(mine_kun-kun)))
print('คำอ่านที่ KANJIDIC2 ไม่มี:',bad)
sys.exit(1 if bad else 0)
