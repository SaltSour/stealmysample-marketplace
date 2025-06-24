#!/bin/bash
echo "Cleaning previous build artifacts..."
rm -rf .next

echo "Generating Prisma client..."
npx prisma generate

echo "Starting Next.js build..."
next build

echo "Build completed!" 