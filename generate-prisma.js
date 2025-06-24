// Script to generate Prisma client using the JavaScript API
const { execSync } = require('child_process');
const path = require('path');

console.log('Generating Prisma client...');

try {
  const schemaPath = path.resolve(__dirname, 'prisma/schema.prisma');
  
  // Use the Prisma JavaScript API to generate the client
  const result = execSync(`npx prisma generate --schema=${schemaPath}`, {
    stdio: 'inherit',
    windowsHide: true,
  });
  
  console.log('Prisma client generated successfully!');
} catch (error) {
  console.error('Error generating Prisma client:', error.message);
  process.exit(1);
} 