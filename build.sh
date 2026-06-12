#!/bin/bash

echo "========================================="
echo "  CloudSaver Build Script"
echo "========================================="
echo ""

cd /app/cloudsaver

echo "Step 1: Installing dependencies..."
yarn install
if [ $? -ne 0 ]; then
    echo "❌ Dependency installation failed"
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

echo "Step 2: Building application..."
yarn build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi
echo "✅ Build successful"
echo ""

echo "Step 3: Building Windows executable..."
yarn build:win
if [ $? -ne 0 ]; then
    echo "❌ Windows build failed"
    exit 1
fi
echo "✅ Windows executable created"
echo ""

echo "========================================="
echo "  Build Complete!"
echo "========================================="
echo ""
echo "Output location: /app/cloudsaver/dist/"
echo ""
echo "Files created:"
ls -lh /app/cloudsaver/dist/ 2>/dev/null || echo "Check dist/ folder for output"
echo ""
echo "To run in development mode: yarn dev"
echo "To test built app: yarn preview"
echo ""
