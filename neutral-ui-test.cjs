const fs=require('fs'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/pixel-collect.html','utf8');
assert(!/bright pixels|dim pixels|try an exposed color|add an exposed color|\(bright\)|\(dim\)/i.test(html),'no proactive exposure advice');
const draw=html.match(/function draw\(\)\{([\s\S]*?)function complete/)[1];
assert(!/M\.exposed|exterior|globalAlpha=exterior/.test(draw),'picture rendering cannot consult access state');
assert(/collect from the outside/i.test(html),'neutral collection rule remains visible');
console.log('Neutral rules, no suggested color, and no exposure-dependent picture shading passed.');
