#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment process..."

# Install Vercel CLI if not installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Login to Vercel
vercel login

# Build the project
echo "🔨 Building the project..."
npm install
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
