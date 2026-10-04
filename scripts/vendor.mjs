import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const from = path.join(root, 'node_modules/gsap/dist');
const to = path.join(root, 'public/vendor/gsap');
const files = ['gsap', 'ScrollTrigger', 'ScrollSmoother', 'SplitText', 'Flip', 'DrawSVGPlugin'].map((n) => `${n}.min.js`);

fs.mkdirSync(to, { recursive: true });
for (const f of files) fs.copyFileSync(path.join(from, f), path.join(to, f));
console.log(`GSAP → public/vendor/gsap (${files.length} files)`);
