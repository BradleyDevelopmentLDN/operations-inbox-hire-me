import fs from 'node:fs';
const parts=['domain.js','sample-data.js','app.js'].map(name=>fs.readFileSync(new URL(`../assets/${name}`,import.meta.url),'utf8').replace(/^import .+;\s*$/gm,'').replace(/^export /gm,''));
fs.writeFileSync(new URL('../assets/app-bundle.js',import.meta.url),'// Bundled from compiled TypeScript sources. Do not hand edit.\n'+parts.join('\n')+'\n');
