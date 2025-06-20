#!/bin/bash

# HEO - Google Cloud Deployment Script
# For AI in Action Hackathon 2025

echo "🚀 Starting HEO deployment to Google Cloud..."

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "."; then
    echo "❌ Please authenticate with Google Cloud first:"
    echo "   gcloud auth login"
    exit 1
fi

# Set project (update with your project ID)
read -p "Enter your Google Cloud Project ID: " PROJECT_ID
gcloud config set project $PROJECT_ID

echo "📦 Building the application..."
npm run build

echo "🌩️ Deploying to Google Cloud App Engine..."
gcloud app deploy --quiet

echo "✅ Deployment complete!"
echo "🌐 Your HEO application should be available at:"
echo "   https://$PROJECT_ID.ew.r.appspot.com"

echo ""
echo "📋 Next steps for hackathon submission:"
echo "1. Test your deployed application"
echo "2. Add the URL to your DevPost submission"
echo "3. Create your demo video showing the live app"
echo "4. Submit before June 17, 2025 @ 2:00pm Pacific Time" 