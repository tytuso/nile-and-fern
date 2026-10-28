import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const files=['/','/journeys','/destinations','/saved','/journal','/plan','/our-story','/contact','/enquiry-status','/privacy','/credits','/offline.html','/mark.svg','/manifest.webmanifest'];
for(const dir of ['assets','fonts','images','icons'])for(const name of await readdir('dist/'+dir))if(/\.(?:js|css|woff2?|ttf|jpg|png|svg|json)$/.test(name))files.push('/'+dir+'/'+name);
const hash=createHash('sha256');for(const file of files)hash.update(await readFile('dist'+(file==='/'||!file.includes('.')?'/index.html':file)));
const version='nile-fern-'+hash.digest('hex').slice(0,12);
const source=(await readFile('public/sw.js','utf8')).replace("const VERSION = 'nile-fern-v1';",'const VERSION = '+JSON.stringify(version)+';').replace(/const SHELL = \[[^;]+;/,'const SHELL = '+JSON.stringify(files)+';');
await writeFile('dist/sw.js',source);console.log('PWA ready: '+files.length+' public pages/assets; '+version);
