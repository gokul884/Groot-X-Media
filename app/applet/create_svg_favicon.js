const fs = require('fs');
const path = require('path');

const pngPath = path.join('public', 'favicon.png');
const svgPath = path.join('public', 'favicon.svg');

if (fs.existsSync(pngPath)) {
  const pngBuffer = fs.readFileSync(pngPath);
  const base64 = pngBuffer.toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <image href="data:image/png;base64,${base64}" width="256" height="256" />
</svg>`;
  fs.writeFileSync(svgPath, svgContent);
  console.log('Created public/favicon.svg successfully from uploaded favicon.png');
} else {
  console.error('public/favicon.png not found');
}

const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));
const svgTags = '<link rel="icon" type="image/svg+xml" href="/favicon.svg">\n<link rel="apple-touch-icon" href="/favicon.svg">';

htmlFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Remove existing icon/apple-touch-icon links
  content = content.replace(/<link[^>]*rel=['"]?(?:shortcut )?icon['"]?[^>]*>/gi, '');
  content = content.replace(/<link[^>]*rel=['"]?apple-touch-icon['"]?[^>]*>/gi, '');
  
  if (content.includes('<head>')) {
    content = content.replace('<head>', '<head>\n' + svgTags);
  } else if (content.includes('<HEAD>')) {
    content = content.replace('<HEAD>', '<HEAD>\n' + svgTags);
  }
  
  fs.writeFileSync(file, content);
  console.log('Updated favicon to SVG in:', file);
});
