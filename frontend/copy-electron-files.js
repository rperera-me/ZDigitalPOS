const fs = require('fs-extra');
const path = require('path');

const filesToCopy = [
  { from: 'public/electron.js', to: 'build/electron.js' },
  { from: 'public/preload.js', to: 'build/preload.js' },
  { from: 'public/localdb.js', to: 'build/localdb.js' }
];

filesToCopy.forEach(({ from, to }) => {
  fs.copySync(path.join(__dirname, from), path.join(__dirname, to));
  console.log(`Copied ${from} to ${to}`);
});

console.log('✅ All Electron files copied successfully!');