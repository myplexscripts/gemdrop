// Copies the static game into www/ for Capacitor. The game has no bundler:
// everything it needs is listed here explicitly.
import {cpSync,rmSync,mkdirSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'www');
const entries=[
  'index.html','styles.css','game.js','meta.js','native.js','reactive-gem-system.js',
  'sw.js','manifest.webmanifest','icon.svg','icons','assets','gems','vendor'
];

rmSync(out,{recursive:true,force:true});
mkdirSync(out,{recursive:true});
for(const entry of entries){
  const src=join(root,entry);
  if(!existsSync(src)) continue;
  cpSync(src,join(out,entry),{recursive:true});
}
console.log('Built www/ with',entries.filter(e=>existsSync(join(root,e))).length,'entries');
