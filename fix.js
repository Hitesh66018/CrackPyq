const fs = require('fs');

function convertToDark(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Backgrounds
  content = content.replace(/bg-gray-50/g, 'bg-[#0B0F19]');
  content = content.replace(/bg-white/g, 'bg-[#111624]');
  content = content.replace(/bg-blue-600/g, 'bg-purple-600');
  content = content.replace(/hover:bg-blue-50/g, 'hover:bg-purple-900/30');
  content = content.replace(/hover:bg-blue-700/g, 'hover:bg-purple-700');
  content = content.replace(/hover:bg-gray-50/g, 'hover:bg-white/5');
  content = content.replace(/bg-red-50/g, 'bg-red-900/30');
  content = content.replace(/bg-blue-50/g, 'bg-purple-900/30');
  content = content.replace(/hover:bg-gray-100/g, 'hover:bg-white/10');
  
  // Text
  content = content.replace(/text-gray-900/g, 'text-white');
  content = content.replace(/text-gray-700/g, 'text-gray-300');
  content = content.replace(/text-gray-600/g, 'text-gray-400');
  content = content.replace(/text-gray-500/g, 'text-gray-400');
  content = content.replace(/text-blue-600/g, 'text-purple-400');
  content = content.replace(/text-blue-700/g, 'text-purple-400');
  content = content.replace(/hover:text-blue-500/g, 'hover:text-purple-300');
  content = content.replace(/text-red-600/g, 'text-red-400');
  
  // Borders and Inputs
  content = content.replace(/border-gray-200/g, 'border-white/10');
  content = content.replace(/border-gray-300/g, 'border-white/10');
  content = content.replace(/focus:ring-blue-500/g, 'focus:ring-purple-500');
  content = content.replace(/focus:border-blue-500/g, 'focus:border-purple-500');
  content = content.replace(/placeholder-gray-400/g, 'placeholder-gray-500');

  // Input text color specifically
  content = content.replace(/text-gray-900 focus:ring-purple-500/g, 'text-white bg-[#0B0F19] focus:ring-purple-500');
  content = content.replace(/<input\n?(\s+)id=/g, '<input\n$1className="text-white bg-[#0B0F19]" id=');
  
  // Text area
  content = content.replace(/<textarea/g, '<textarea className="text-white bg-[#0B0F19]" ');

  fs.writeFileSync(file, content);
}

convertToDark('src/app/login/page.tsx');
convertToDark('src/app/signup/page.tsx');

const adminLayout = 'src/app/admin/layout.tsx';
if (fs.existsSync(adminLayout)) convertToDark(adminLayout);
const adminPage = 'src/app/admin/page.tsx';
if (fs.existsSync(adminPage)) convertToDark(adminPage);
const dashboardPage = 'src/app/dashboard/page.tsx';
if (fs.existsSync(dashboardPage)) convertToDark(dashboardPage);
const testPage = 'src/app/admin/tests/[id]/page.tsx';
if (fs.existsSync(testPage)) convertToDark(testPage);
