#!/bin/bash

# Magna Coders Backend - Render Deployment Script
echo "🚀 Preparing Magna Coders Backend for Render Deployment..."

# Check if we're in the right directory
if [ ! -f "render.yaml" ]; then
    echo "❌ Error: render.yaml not found. Make sure you're in the project root directory."
    exit 1
fi

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo "❌ Error: backend directory not found."
    exit 1
fi

echo "✅ Project structure verified"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit for Render deployment"
else
    echo "✅ Git repository found"
fi

# Check for environment variables file
if [ ! -f "backend/.env.example" ]; then
    echo "⚠️  Warning: .env.example not found in backend directory"
else
    echo "✅ Environment variables example found"
fi

# Verify package.json has correct scripts
if grep -q "render-build" backend/package.json; then
    echo "✅ Render build scripts found in package.json"
else
    echo "⚠️  Warning: Render build scripts not found in package.json"
fi

echo ""
echo "🎯 Next Steps for Render Deployment:"
echo "1. Push your code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Add Render deployment configuration'"
echo "   git push origin main"
echo ""
echo "2. Go to https://dashboard.render.com"
echo "3. Click 'New' → 'Blueprint'"
echo "4. Connect your GitHub repository"
echo "5. Render will detect the render.yaml file automatically"
echo ""
echo "6. Set up your environment variables in Render Dashboard:"
echo "   - DATABASE_URL (PostgreSQL connection string)"
echo "   - JWT_SECRET (secure random string)"
echo "   - FRONTEND_URL (your frontend domain)"
echo "   - Other optional service keys (Stripe, Cloudinary, etc.)"
echo ""
echo "📚 For detailed instructions, see RENDER_DEPLOYMENT.md"
echo ""
echo "✨ Your backend will be available at: https://your-service-name.onrender.com"
echo "📖 API docs will be at: https://your-service-name.onrender.com/api-docs"