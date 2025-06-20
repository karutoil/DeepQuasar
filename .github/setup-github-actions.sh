#!/bin/bash

# GitHub Actions Setup Script for Docker Hub Integration
# This script helps you configure the GitHub repository for automatic Docker builds

set -e

echo "🚀 GitHub Actions Docker Hub Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "This is not a Git repository. Please run this script from your bot's repository root."
    exit 1
fi

# Check if GitHub Actions directory exists
if [ ! -d ".github/workflows" ]; then
    print_error "GitHub Actions workflows not found. Please ensure the workflows are in .github/workflows/"
    exit 1
fi

print_status "Found GitHub Actions workflows"

# Get repository information
REPO_URL=$(git config --get remote.origin.url)
if [[ $REPO_URL == *"github.com"* ]]; then
    # Extract owner/repo from URL
    if [[ $REPO_URL == *".git" ]]; then
        REPO_PATH=${REPO_URL%.git}
    else
        REPO_PATH=$REPO_URL
    fi
    REPO_PATH=$(echo $REPO_PATH | sed 's/.*github\.com[\/:]//g')
    REPO_OWNER=$(echo $REPO_PATH | cut -d'/' -f1)
    REPO_NAME=$(echo $REPO_PATH | cut -d'/' -f2)
    
    print_status "Repository: $REPO_OWNER/$REPO_NAME"
else
    print_error "This doesn't appear to be a GitHub repository"
    exit 1
fi

echo ""
echo "📋 Setup Checklist"
echo "=================="

echo "1. Docker Hub Account Setup:"
echo "   • Create account at https://hub.docker.com"
echo "   • Create repository: $REPO_OWNER/discord-music-bot"
echo "   • Generate access token (recommended over password)"

echo ""
echo "2. GitHub Secrets Configuration:"
echo "   Go to: https://github.com/$REPO_OWNER/$REPO_NAME/settings/secrets/actions"
echo "   Add these secrets:"
echo "   • DOCKER_USERNAME: Your Docker Hub username"
echo "   • DOCKER_PASSWORD: Your Docker Hub password or access token"

echo ""
echo "3. Workflow Configuration:"

# Check if workflows need customization
DEFAULT_IMAGE_NAME="discord-music-bot"
CURRENT_IMAGE_NAME=$(grep -n "IMAGE_NAME:" .github/workflows/docker-build-push.yml | head -1 | cut -d':' -f3 | xargs)

if [ "$CURRENT_IMAGE_NAME" != "$DEFAULT_IMAGE_NAME" ]; then
    print_status "Image name already customized: $CURRENT_IMAGE_NAME"
else
    print_warning "You may want to customize the IMAGE_NAME in your workflows"
    echo "   Current: $CURRENT_IMAGE_NAME"
    echo "   Suggested: ${REPO_NAME,,}"  # Convert to lowercase
fi

echo ""
echo "4. Testing the Setup:"
echo "   • Push changes to trigger the workflow"
echo "   • Check GitHub Actions tab for build status"
echo "   • Verify images appear on Docker Hub"

echo ""
echo "🔧 Quick Commands:"
echo "=================="
echo "Test Docker build locally:"
echo "  cd Docker && docker build -f Dockerfile .."
echo ""
echo "Push to trigger workflow:"
echo "  git add . && git commit -m 'Add Docker workflows' && git push"
echo ""
echo "Create a release (triggers release workflow):"
echo "  git tag v1.0.0 && git push origin v1.0.0"

echo ""
echo "📚 Documentation:"
echo "=================="
echo "Detailed setup guide: .github/workflows/README.md"
echo "Docker documentation: Docker/README.md"

echo ""
print_info "Would you like to customize the IMAGE_NAME now? (y/n)"
read -r response

if [[ $response =~ ^[Yy]$ ]]; then
    echo "Current image name: $CURRENT_IMAGE_NAME"
    echo "Enter new image name (or press Enter to keep current):"
    read -r new_name
    
    if [ -n "$new_name" ]; then
        # Update all workflow files
        find .github/workflows -name "*.yml" -exec sed -i "s/IMAGE_NAME: .*/IMAGE_NAME: $new_name/" {} \;
        print_status "Updated IMAGE_NAME to: $new_name"
        print_warning "Remember to create a Docker Hub repository with this name!"
    fi
fi

echo ""
print_status "Setup guide complete!"
print_info "Next steps:"
echo "1. Set up your Docker Hub repository and GitHub secrets"
echo "2. Push your changes to GitHub"
echo "3. Check the Actions tab for your first build"

echo ""
print_warning "Don't forget to add your bot credentials to Docker/.env before deploying!"
