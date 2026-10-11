const fs = require('fs');

function fix(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /\{message && \(\s*<div className=\"bg-red-900\/30 text-red-400 p-3 rounded-lg text-sm text-center font-medium\">\s*\{message\}\s*<\/div>\s*\)\}/g, 
    '<FormMessageToast />'
  );
  
  if (!content.includes('FormMessageToast')) {
    console.log('Failed to replace in', file);
  }
  
  // Add import
  if (content.includes('FormMessageToast') && !content.includes('import { FormMessageToast }')) {
    content = content.replace(
      'import { headers } from \'next/headers\'',
      "import { headers } from 'next/headers'\nimport { FormMessageToast } from '@/components/FormMessageToast'"
    );
  }
  
  fs.writeFileSync(file, content);
}

fix('src/app/login/page.tsx');
fix('src/app/signup/page.tsx');
