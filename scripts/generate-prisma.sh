#!/bin/bash
echo "Generating Prisma client..."
npx prisma generate

echo "Checking for Prisma client..."
if [ -d "node_modules/.prisma/client" ]; then
  echo "Prisma client successfully generated!"
else
  echo "Prisma client generation failed!"
  exit 1
fi 