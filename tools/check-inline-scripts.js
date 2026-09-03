const fs = require('fs');

const htmlPath = process.argv[2] || 'index.html';
const html = fs.readFileSync(htmlPath, 'utf8');
const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const classicScripts = [];

for (const match of html.matchAll(scriptPattern)) {
  const attrs = match[1] || '';
  if (/\bsrc\s*=/.test(attrs)) continue;
  if (/\btype\s*=\s*["']module["']/i.test(attrs)) continue;
  classicScripts.push(match[2]);
}

classicScripts.forEach((source, index) => {
  try {
    new Function(source);
  } catch (err) {
    err.message = `Classic inline script ${index + 1}: ${err.message}`;
    throw err;
  }
});

console.log(`classic inline scripts OK: ${classicScripts.length}`);
