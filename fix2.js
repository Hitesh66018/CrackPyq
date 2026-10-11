const fs = require('fs');

function fixFiles(files) {
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    
    // Admin missed gray text
    content = content.replace(/text-gray-800/g, 'text-white');
    
    // The active link in admin sidebar was bg-gray-100
    content = content.replace(/bg-gray-100/g, 'bg-purple-600/20 text-purple-400');
    
    // Make sure we replace any left over bg-white inside the dashboard elements
    content = content.replace(/bg-white/g, 'bg-[#111624]');
    content = content.replace(/bg-gray-50/g, 'bg-[#0B0F19]');

    // Fix inputs
    content = content.replace(/className="appearance-none/g, 'className="bg-[#0B0F19] text-white appearance-none');
    
    // Add text-white to the layout body if it doesn't have it
    content = content.replace(/className="flex h-screen bg-\[\#0B0F19\]"/g, 'className="flex h-screen bg-[#0B0F19] text-white"');

    fs.writeFileSync(file, content);
  }
}

fixFiles([
  'src/app/login/page.tsx', 
  'src/app/signup/page.tsx',
  'src/app/admin/layout.tsx',
  'src/app/admin/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/admin/tests/[id]/page.tsx',
  'src/app/admin/questions/page.tsx',
  'src/app/admin/tests/page.tsx'
]);
