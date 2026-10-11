const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  if (file.includes('utils\\db.ts')) return; // skip the new file

  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Pattern 1:
  // const { Pool } = require('pg');
  // const pool = new Pool({ ... });
  
  if (content.includes("const { Pool } = require('pg');")) {
    const importStr = "import { db } from '@/utils/db';";
    if (!content.includes(importStr)) {
      // Find the last import
      const lastImportIndex = content.lastIndexOf('import ');
      if (lastImportIndex !== -1) {
        const nextLineIndex = content.indexOf('\n', lastImportIndex);
        content = content.substring(0, nextLineIndex + 1) + importStr + '\n' + content.substring(nextLineIndex + 1);
      } else {
        content = importStr + '\n' + content;
      }
    }

    content = content.replace(/const { Pool } = require\('pg'\);\s*const pool = new Pool\(\{[\s\S]*?\}\);/g, "const pool = db;");
    content = content.replace(/pool\.end\(\);/g, ""); // Do not close the global pool

    if (content !== original) {
      fs.writeFileSync(file, content);
      console.log('Updated:', file);
    }
  }
});
