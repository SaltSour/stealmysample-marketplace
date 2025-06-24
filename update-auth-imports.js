const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Files to update - add all files found in the grep search
const filesToUpdate = [
  'app/api/user/ownership/sample/route.ts',
  'app/api/upload/route.ts',
  'app/api/packs/route.ts',
  'app/api/packs/[packId]/route.ts',
  'app/api/packs/my-packs/route.ts',
  'app/api/packs/[packId]/samples/route.ts',
  'app/api/packs/[packId]/samples/[sampleId]/route.ts',
  'app/api/profile/route.ts',
  'app/api/packs/creator/route.ts',
  'app/api/creator/stats/route.ts',
  'app/api/creator/setup/route.ts',
  'app/api/creator/packs/route.ts',
  'app/api/creator/packs/[packId]/route.ts',
  'app/api/creator/apply/route.ts',
  'app/api/cart/route.ts',
  'app/api/cart/items/route.ts',
  'app/api/cart/items/[itemId]/route.ts',
  'app/api/checkout/summary/route.ts',
  'app/api/admin/users/route.ts'
];

async function updateImports() {
  let successCount = 0;
  let errorCount = 0;
  
  for (const filePath of filesToUpdate) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      
      if (!fs.existsSync(fullPath)) {
        console.log(`File not found: ${filePath}`);
        errorCount++;
        continue;
      }
      
      let content = await readFile(fullPath, 'utf8');
      
      // Replace the import statement
      const updatedContent = content.replace(
        /import\s*{\s*authOptions\s*}\s*from\s*["']@\/app\/api\/auth\/\[\.\.\.nextauth\]\/route["']/g,
        'import { authOptions } from "@/lib/auth"'
      );
      
      if (content !== updatedContent) {
        await writeFile(fullPath, updatedContent, 'utf8');
        console.log(`Updated: ${filePath}`);
        successCount++;
      } else {
        console.log(`No changes needed in: ${filePath}`);
      }
    } catch (error) {
      console.error(`Error updating ${filePath}:`, error);
      errorCount++;
    }
  }
  
  console.log(`\nUpdate summary:`);
  console.log(`- Successfully updated: ${successCount} files`);
  console.log(`- Failed to update: ${errorCount} files`);
}

updateImports().catch(console.error); 