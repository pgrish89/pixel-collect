from pathlib import Path
from PIL import Image, ImageDraw
import json
root=Path(__file__).parent
site=root/'docs'; site.mkdir(exist_ok=True)
html=(root/'pixel-collect.html').read_text()
head='''<link rel="manifest" href="./manifest.webmanifest"><link rel="apple-touch-icon" href="./icon-180.png"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="Pixel Collect">'''
html=html.replace('<title>',head+'<title>',1).replace('Standalone preview · all five levels available · progress saved on this browser when supported','Web preview · completed levels saved on this device · no account needed')
html=html.replace('</body>','''<script>
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(err => console.warn('Offline setup unavailable', err)));
}
</script></body>''')
(site/'index.html').write_text(html)
(site/'.nojekyll').touch()
manifest={'id':'./','name':'Pixel Collect','short_name':'Pixel Collect','description':'Five relaxing robot pixel-collection missions.','start_url':'./','scope':'./','display':'standalone','background_color':'#0c1421','theme_color':'#111a28','icons':[{'src':f'./icon-{s}.png','sizes':f'{s}x{s}','type':'image/png','purpose':'any'} for s in (192,512)]}
(site/'manifest.webmanifest').write_text(json.dumps(manifest,indent=2)+'\n')
for size in (180,192,512):
 im=Image.new('RGB',(512,512),'#0c1421'); d=ImageDraw.Draw(im)
 d.rounded_rectangle((90,145,422,418),radius=65,fill='#8ee7db')
 d.rounded_rectangle((132,195,380,298),radius=32,fill='#142034')
 d.rounded_rectangle((167,224,199,261),radius=8,fill='#eef5ff')
 d.rounded_rectangle((313,224,345,261),radius=8,fill='#eef5ff')
 d.line((256,145,256,101),fill='#8ee7db',width=16);d.ellipse((235,63,277,105),fill='#ffce68')
 d.rounded_rectangle((211,340,301,373),radius=12,fill='#142034')
 im.resize((size,size),Image.Resampling.LANCZOS).save(site/f'icon-{size}.png')
print('Prepared hosted HTML, manifest, and three robot icons.')
