const fs = require('fs-extra');
const path = require('path');

const filesToCopy = [
  { from: 'public/electron.js', to: 'build/electron.js' },
  { from: 'public/preload.js', to: 'build/preload.js' },
  { from: 'public/localdb.js', to: 'build/localdb.js' },
  { from: 'public/thermalPrinterService.js', to: 'build/thermalPrinterService.js' },
  { from: 'public/htmlToEscposConverter.js', to: 'build/htmlToEscposConverter.js' },
];

filesToCopy.forEach(({ from, to }) => {
  fs.copySync(path.join(__dirname, from), path.join(__dirname, to));
});

const templatesDir = 'public/templates';
const buildTemplatesDir = 'build/templates';

if (fs.existsSync(path.join(__dirname, templatesDir))) {
  fs.copySync(
    path.join(__dirname, templatesDir),
    path.join(__dirname, buildTemplatesDir)
  );
}