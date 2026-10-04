const SHAPES = {
  sweater: {
    body: '<path d="M150 70 Q200 104 250 70 L328 100 Q348 110 354 132 L386 300 L336 318 L300 196 L302 440 L98 440 L100 196 L64 318 L14 300 L46 132 Q52 110 72 100 Z"/>',
    deco: '<path d="M150 70 Q200 104 250 70"/><path d="M104 410 L296 410"/><path d="M36 286 L76 272 M364 286 L324 272"/>',
  },
  cardigan: {
    body: '<path d="M150 70 Q200 140 250 70 L328 100 Q348 110 354 132 L386 300 L336 318 L300 196 L302 440 L98 440 L100 196 L64 318 L14 300 L46 132 Q52 110 72 100 Z"/>',
    deco: '<path d="M200 128 L200 440"/><circle cx="212" cy="190" r="5"/><circle cx="212" cy="250" r="5"/><circle cx="212" cy="310" r="5"/><circle cx="212" cy="370" r="5"/>',
  },
  dress: {
    body: '<path d="M164 48 L180 48 Q200 84 220 48 L236 48 L250 150 Q262 190 240 216 L336 456 Q200 482 64 456 L160 216 Q138 190 150 150 Z"/>',
    deco: '<path d="M150 210 Q200 226 250 210"/><path d="M90 430 Q200 454 310 430"/>',
  },
  skirt: {
    body: '<path d="M124 96 L276 96 L280 128 L346 440 Q200 472 54 440 L120 128 Z"/>',
    deco: '<path d="M120 128 L280 128"/><path d="M80 412 Q200 440 320 412"/><path d="M170 140 L150 440 M230 140 L250 440"/>',
  },
  top: {
    body: '<path d="M150 64 L174 64 Q200 124 226 64 L250 64 L268 162 Q262 180 270 200 L282 420 L118 420 L130 200 Q138 180 132 162 Z"/>',
    deco: '<path d="M132 200 L270 200"/><path d="M124 392 L276 392"/>',
  },
  pants: {
    body: '<path d="M118 66 L282 66 L306 452 L220 452 L200 196 L180 452 L94 452 L118 66 Z"/>',
    deco: '<path d="M118 96 L282 96"/><path d="M200 96 L200 196"/>',
  },
  shorts: {
    body: '<path d="M108 128 L292 128 L326 332 L216 350 L200 236 L184 350 L74 332 Z"/>',
    deco: '<path d="M108 156 L292 156"/>',
  },
  shawl: {
    body: '<path d="M26 112 Q200 156 374 112 L218 428 Q200 452 182 428 Z"/>',
    deco: '<path d="M60 128 L200 420 M340 128 L200 420"/><path d="M190 440 L186 470 M200 446 L200 478 M210 440 L214 470"/>',
  },
  rose: {
    body: [0, 45, 90, 135, 180, 225, 270, 315]
      .map((a) => `<ellipse cx="200" cy="170" rx="58" ry="92" transform="rotate(${a} 200 250)"/>`)
      .join('') + '<circle cx="200" cy="250" r="78"/>',
    deco: '<circle cx="200" cy="250" r="54"/><circle cx="200" cy="250" r="30"/><circle cx="200" cy="250" r="10"/>',
  },
  yarn: {
    body: '<circle cx="200" cy="262" r="132"/>',
    deco: '<path d="M90 190 Q200 300 310 200"/><path d="M76 250 Q200 360 324 262"/><path d="M96 320 Q200 400 300 330"/><path d="M140 140 Q230 200 250 390"/><path d="M300 80 L170 420 M330 92 L200 430"/>',
  },
};

const HEX = /^[0-9a-f]{6}$/i;

export function placeholderSvg(shape, bgRaw, fgRaw) {
  const s = SHAPES[shape] || SHAPES.yarn;
  const bg = HEX.test(bgRaw) ? `#${bgRaw}` : '#7A1323';
  const fg = HEX.test(fgRaw) ? `#${fgRaw}` : '#F3ECE4';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
<defs>
  <pattern id="lace" width="24" height="24" patternUnits="userSpaceOnUse">
    <circle cx="12" cy="12" r="4.6" fill="${bg}" fill-opacity=".5"/>
    <circle cx="0" cy="0" r="2.2" fill="${bg}" fill-opacity=".38"/>
    <circle cx="24" cy="0" r="2.2" fill="${bg}" fill-opacity=".38"/>
    <circle cx="0" cy="24" r="2.2" fill="${bg}" fill-opacity=".38"/>
    <circle cx="24" cy="24" r="2.2" fill="${bg}" fill-opacity=".38"/>
  </pattern>
  <pattern id="dots" width="34" height="34" patternUnits="userSpaceOnUse">
    <circle cx="17" cy="17" r="1.2" fill="${fg}" fill-opacity=".16"/>
  </pattern>
  <radialGradient id="light" cx="30%" cy="18%" r="85%">
    <stop offset="0" stop-color="#fff" stop-opacity=".16"/>
    <stop offset="1" stop-color="#000" stop-opacity=".14"/>
  </radialGradient>
</defs>
<rect x="-800" y="-800" width="2000" height="2100" fill="${bg}"/>
<rect x="-800" y="-800" width="2000" height="2100" fill="url(#dots)"/>
<g transform="translate(40 50) scale(.8)">
  <clipPath id="shape">${s.body}</clipPath>
  <g fill="${fg}">${s.body}</g>
  <rect x="0" y="0" width="400" height="500" fill="url(#lace)" clip-path="url(#shape)"/>
  <g fill="none" stroke="${bg}" stroke-opacity=".45" stroke-width="2.4" stroke-dasharray="3 6" stroke-linecap="round">${s.deco}</g>
</g>
<rect x="-800" y="-800" width="2000" height="2100" fill="url(#light)"/>
</svg>`;
}
