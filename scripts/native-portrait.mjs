// Locks the generated Capacitor projects to portrait. Safe to run repeatedly;
// platforms that have not been added yet are skipped.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');

const manifest=join(root,'android/app/src/main/AndroidManifest.xml');
if(existsSync(manifest)){
  let xml=readFileSync(manifest,'utf8');
  if(!/android:screenOrientation=/.test(xml)){
    xml=xml.replace(/<activity\b/,'<activity\n            android:screenOrientation="portrait"');
    writeFileSync(manifest,xml);
  }
  console.log('Android: portrait locked');
}

const plist=join(root,'ios/App/App/Info.plist');
if(existsSync(plist)){
  let xml=readFileSync(plist,'utf8');
  const portraitOnly=key=>`<key>${key}</key>\n\t<array>\n\t\t<string>UIInterfaceOrientationPortrait</string>\n\t</array>`;
  for(const key of ['UISupportedInterfaceOrientations','UISupportedInterfaceOrientations~ipad']){
    const pattern=new RegExp(`<key>${key.replace('~','\\~')}</key>\\s*<array>[\\s\\S]*?</array>`);
    xml=pattern.test(xml)?xml.replace(pattern,portraitOnly(key)):xml;
  }
  writeFileSync(plist,xml);
  console.log('iOS: portrait locked');
}
