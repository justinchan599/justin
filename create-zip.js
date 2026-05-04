const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const outputFile = 'weather-dashboard-final.zip';
const output = fs.createWriteStream(outputFile);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
    console.log('Created:', outputFile);
    console.log('Size:', archive.pointer(), 'bytes');
});

output.on('error', (err) => {
    console.error('Output error:', err);
});

archive.on('error', (err) => {
    console.error('Archive error:', err);
});

const excludes = ['node_modules', '.next', '.git', 'weather-dashboard.zip',
    'weather-dashboard.tar.gz', 'weather-dashboard-linux.tar.gz',
    'create-zip.js', 'make-zip.py', 'weather-dashboard-fixed.zip', 'weather-dashboard-new.zip', 'weather-dashboard-final.zip'];

function addDir(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        if (excludes.includes(item.name)) continue;
        const fullPath = path.join(dir, item.name);
        // Use forward slashes for Linux compatibility
        const archiveName = fullPath.replace(/\\/g, '/').replace(/^\.\//, '');
        if (item.isDirectory()) {
            addDir(fullPath);
        } else {
            archive.file(fullPath, { name: archiveName });
        }
    }
}

addDir('.');
archive.finalize();
