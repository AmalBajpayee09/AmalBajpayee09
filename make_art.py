from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
from pathlib import Path
import math, random
random.seed(13)
R=Path(__file__).parent
A=R/'assets'
A.mkdir(exist_ok=True)
source=Image.open(R/'docs/assets/visionary-hero.jpg').convert('RGB')
FONT='/usr/share/fonts/opentype/inter/InterDisplay-ExtraBold.otf'
FONT2='/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf'
MONO='/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
F=lambda n,what=FONT: ImageFont.truetype(what,n)

def darken(im,edge=235):
    w,h=im.size
    ov=Image.new('RGBA',(w,h));px=ov.load()
    for x in range(w):
        factor=(1-x/w)**2*.86 + .06
        for y in range(h):
            px[x,y]=(1,11,23,int(edge*factor))
    return Image.alpha_composite(im.convert('RGBA'),ov)

def cap(text,frame=0):
    w,h=1200,650
    img=source.resize((w,h),Image.Resampling.LANCZOS)
    img=darken(img,245)
    d=ImageDraw.Draw(img,'RGBA')
    # editorial frame lines
    d.line((44,40,1155,40),fill=(153,244,234,110),width=2)
    d.line((44,604,1155,604),fill=(153,244,234,110),width=2)
    d.text((54,61),'AMAL  /  THE ENGINEER WHO BUILDS WORLDS',font=F(16,MONO),fill='#aee9e4')
    d.text((1095,61),'2026',font=F(15,MONO),fill='#ffd0a3')
    d.text((56,171),'THE',font=F(92),fill='#fffef6',stroke_width=0)
    d.text((56,259),'ENGINEER\'S',font=F(89),fill='#d6fffa')
    d.text((56,349),'QUEST.',font=F(116),fill='#65eedb')
    d.rectangle((56,482,390,486),fill='#ffc283')
    d.text((56,510),'6 LEVELS   /   6 REVEALS   /   1 BUILDER',font=F(17,MONO),fill='#ffffff')
    d.text((56,549),'RUN  •  JUMP  •  CONQUER  •  DISCOVER',font=F(15,MONO),fill='#a8d7d5')
    # protagonist callout right
    d.rounded_rectangle((948,514,1137,575),radius=4,fill=(4,24,32,205),outline=(115,255,219,210),width=2)
    d.text((965,527),'PLAY THE',font=F(16,MONO),fill='#a8fff0')
    d.text((965,547),'PORTFOLIO  →',font=F(15,MONO),fill='#fff9e8')
    # subtle light animation
    cx=942+12*math.sin(frame*.4)
    d.arc((cx-50,238,cx+50,338),start=40+frame*9,end=205+frame*9,fill=(255,205,141,80+int(90*(.5+.5*math.sin(frame*.4)))),width=5)
    for j in range(17):
       x=750+((j*61+frame*11)%420);y=94+((j*67-frame*7)%375)
       r=1+j%3
       d.ellipse((x,y,x+r,y+r),fill=(205,253,240,105+j%5*25))
    return img.convert('RGB')

still=cap('',0)
still.save(A/'hero-vision.jpg',quality=87,optimize=True)
frames=[cap('',i).quantize(colors=128,method=Image.Quantize.FASTOCTREE) for i in range(16)]
frames[0].save(A/'hero-vision.gif',save_all=True,append_images=frames[1:],duration=150,loop=0,optimize=True,disposal=2)

# Three dramatic editorial world cards, illustrated using custom geometry.
def world_card(i):
  w,h=760,420
  colors=[('#161e4d','#9e9afe','#b5c4ff'),('#083d3c','#68e7b8','#c4ffe5'),('#3d2139','#ffb97e','#ffead3')]
  a,b,c=colors[i]
  im=Image.new('RGB',(w,h),a)
  d=ImageDraw.Draw(im,'RGBA')
  # Deep stylized background shapes
  for k in range(15):
    x=510+math.sin(k*2.7+i)*240; y=160+math.cos(k*1.8+i)*170
    r=90+(k%4)*21
    d.ellipse((x-r,y-r,x+r,y+r),outline=(*tuple(bytes.fromhex(b.strip('#'))),18+k*3),width=1+k%2)
  if i==0:
    pts=[(400,130),(520,75),(600,145),(500,240),(635,280),(700,130),(560,320)]
    for x,y in pts:d.ellipse((x-9,y-9,x+9,y+9),fill='#a596ff');
    for j in range(len(pts)-1):d.line((*pts[j],*pts[j+1]),fill='#988ef5',width=3)
  elif i==1:
    for j in range(9):
      x=360+j*39;y=130+math.sin(j*1.6)*75
      d.rounded_rectangle((x,y,x+24,y+130),radius=9,outline=b,width=3)
      d.line((x+12,y+20,x+12,y+105),fill='#d4ffe2',width=2)
  else:
    for j in range(5):
      x=385+j*65;y=105+math.sin(j*2)*60
      d.rounded_rectangle((x,y,x+55,y+42),radius=5,outline='#ffbf8d',width=4)
      if j:d.line((x-12,y+21,x,y+21),fill='#ffa56e',width=4)
  # left legibility shade
  for x in range(w):
    if x<480:
      alpha=int(225*(1-x/550))
      d.line((x,0,x,h),fill=(3,10,24,max(0,alpha)))
  titles=[('NEURAL','FRONTIER'),('DATA','WILDS'),('SYSTEMS','SKYLINE')]
  d.text((37,30),f'WORLD {i+1:02d}   /   TWO LEVELS',font=F(17,MONO),fill=c)
  d.text((32,150),titles[i][0],font=F(74),fill='#f6fff9')
  d.text((32,226),titles[i][1],font=F(74),fill=b)
  d.line((36,326,300,326),fill=b,width=4)
  d.text((38,348),['VOICE AI  ·  AGENT SYSTEMS','MACHINE LEARNING  ·  ETL','DISTRIBUTED SYSTEMS  ·  INCIDENT AI'][i],font=F(16,MONO),fill='#e3f4ed')
  return im
for i in range(3):world_card(i).save(A/f'world-{i+1:02}.png',optimize=True)

# Editorial section headers: substitute for disallowed GitHub CSS on Markdown headings.
def chapter(n,kicker,title,subtitle):
    w,h=1200,205
    im=Image.new('RGB',(w,h),'#071a29');d=ImageDraw.Draw(im,'RGBA')
    for x in range(0,w,60):d.line((x,0,x,h),fill=(84,229,220,9),width=1)
    d.rectangle((0,0,w,3),fill='#61e8d8')
    d.text((46,25),f'{n:02d} / {kicker}',font=F(17,MONO),fill='#ffbd8d')
    d.text((43,52),title,font=F(77),fill='#f3faf5')
    d.text((46,150),subtitle,font=F(15,MONO),fill='#8cbebf')
    d.polygon([(1090,15),(1170,86),(1090,164),(1015,86)],outline='#5ee3d9')
    d.ellipse((1060,59,1120,119),outline='#ffc28e',width=4)
    return im
chapter(1,'THE ADVENTURE','CHOOSE YOUR WORLD','A SIDE-SCROLLING JOURNEY THROUGH SOFTWARE, INTELLIGENCE AND SYSTEMS').save(A/'chapter-worlds.png',optimize=True)
chapter(2,'THE REAL WORK','WHAT I BUILD','EVERY BOSS DEFEATED REVEALS AN ENGINEERING STORY').save(A/'chapter-projects.png',optimize=True)
chapter(3,'BEHIND THE CONTROLLER','MEET THE BUILDER','ABV-IIITM GWALIOR  /  SOFTWARE ENGINEERING  /  AI  /  DATA').save(A/'chapter-about.png',optimize=True)
chapter(4,'SHOWING UP','THE CONSISTENCY ENGINE','CONTRIBUTIONS, STREAKS AND THE DAYS BETWEEN RELEASES').save(A/'chapter-consistency.png',optimize=True)
chapter(5,'THE END CREDITS','BUILD SOMETHING REAL','OPEN TO SOFTWARE ENGINEERING, AGENTIC AI AND COLLABORATION').save(A/'chapter-contact.png',optimize=True)
print('art ready')
