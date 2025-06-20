# GitHub Actions Docker Hub Integration

This directory contains GitHub Actions workflows that automatically build and push your Discord bot to Docker Hub whenever the repository is updated.

## Workflows

### 1. `docker-build-push.yml`
**Main workflow** that runs on every push to main/master branches and tags:
- Builds the Docker image for multiple platforms (amd64, arm64)
- Pushes to Docker Hub with appropriate tags
- Updates Docker Hub repository description

### 2. `docker-multiplatform.yml`
**Advanced multi-platform build** for production releases:
- Uses matrix strategy for parallel builds
- Optimized for multiple architectures
- Advanced caching and digest management

### 3. `docker-test.yml`
**Testing workflow** that runs on pull requests:
- Tests Docker build without pushing
- Runs security scans with Trivy
- Validates container startup

### 4. `release.yml`
**Release workflow** triggered by version tags:
- Creates GitHub releases with changelog
- Builds and pushes release images
- Tags images with version numbers

## Setup Instructions

### 1. Create Docker Hub Account
1. Go to [Docker Hub](https://hub.docker.com/) and create an account
2. Create a new repository for your bot (e.g., `your-username/deepquasarv2`)

### 2. Configure GitHub Secrets
Add these secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

#### Required Secrets:
- `DOCKER_USERNAME`: Your Docker Hub username
- `DOCKER_PASSWORD`: Your Docker Hub password or access token (recommended)

#### Optional Secrets:
- `GITHUB_TOKEN`: Usually available by default for releases

### 3. Update Configuration
Edit the workflows to match your Docker Hub repository:

In each workflow file, update:
```yaml
env:
  REGISTRY: docker.io
  IMAGE_NAME: your-bot-name  # Change this to match your repository name
```

And update the image references:
```yaml
images: ${{ env.REGISTRY }}/${{ secrets.DOCKER_USERNAME }}/${{ env.IMAGE_NAME }}
```

### 4. Docker Hub Access Token (Recommended)
Instead of using your password, create an access token:

1. Go to Docker Hub > Account Settings > Security
2. Create a new access token with "Read, Write, Delete" permissions
3. Use this token as your `DOCKER_PASSWORD` secret

## Workflow Triggers

### Automatic Builds
- **Push to main/master**: Builds and pushes `latest` tag
- **Push to develop**: Builds and pushes `develop` tag
- **Version tags** (v1.0.0): Builds and pushes version-specific tags
- **Pull requests**: Tests build without pushing

### Manual Triggers
You can also trigger workflows manually from the GitHub Actions tab.

## Image Tags

The workflows create these Docker image tags:

- `latest`: Latest build from main branch
- `develop`: Latest build from develop branch
- `v1.0.0`: Specific version tags
- `1.0`: Major.minor version
- `1`: Major version only

## Platform Support

Images are built for multiple platforms:
- `linux/amd64`: Standard x86_64 systems
- `linux/arm64`: ARM64 systems (Apple Silicon, some servers)

## Security Features

### Vulnerability Scanning
The test workflow includes Trivy security scanning:
- Scans for known vulnerabilities
- Results uploaded to GitHub Security tab
- Fails if critical vulnerabilities found

### Security Best Practices
- Uses non-root user in container
- Minimal Alpine Linux base image
- Only production dependencies included
- Regular security updates via automated builds

## Caching

Workflows use GitHub Actions cache to speed up builds:
- Docker layer caching
- Dependency caching
- Shared cache between workflows

## Monitoring

### Build Status
Monitor your builds in the GitHub Actions tab:
- Green checkmark: Successful build
- Red X: Failed build
- Yellow circle: In progress

### Docker Hub
Check your Docker Hub repository for:
- New image versions
- Download statistics
- Security scan results

## Troubleshooting

### Common Issues

**Build fails with "permission denied":**
- Check Docker Hub credentials
- Verify repository exists
- Ensure access token has correct permissions

**Image not found:**
- Verify image name matches repository
- Check if build actually pushed
- Wait a few minutes for Docker Hub to sync

**Security scan failures:**
- Update base image in Dockerfile
- Update Node.js dependencies
- Review and acknowledge acceptable risks

### Debug Steps

1. Check GitHub Actions logs for detailed errors
2. Verify all secrets are correctly set
3. Test Docker build locally:
   ```bash
   cd Docker
   docker build -f Dockerfile ..
   ```

## Customization

### Adding New Triggers
Edit workflow files to add custom triggers:
```yaml
on:
  push:
    branches: [main, develop, feature/*]
  schedule:
    - cron: '0 2 * * 0'  # Weekly builds
```

### Custom Tags
Add custom tagging logic:
```yaml
tags: |
  type=ref,event=branch
  type=semver,pattern={{version}}
  type=raw,value=nightly,enable={{is_default_branch}}
```

### Notifications
Add Slack/Discord notifications:
```yaml
- name: Notify on success
  if: success()
  run: |
    curl -X POST -H 'Content-type: application/json' \
      --data '{"text":"Docker build successful!"}' \
      ${{ secrets.SLACK_WEBHOOK }}
```

## Performance Optimization

### Build Speed
- Parallel multi-platform builds
- Aggressive caching strategy
- Minimal context copying

### Image Size
- Multi-stage builds (if needed)
- Alpine Linux base
- Production-only dependencies
- Layer optimization

## Maintenance

### Regular Updates
- Update action versions monthly
- Monitor security advisories
- Update base images regularly
- Review and update dependencies

### Cleanup
- Old images auto-expire on Docker Hub (free tier)
- Configure retention policies
- Monitor storage usage

This setup provides a robust CI/CD pipeline for your Discord bot with automatic Docker builds, security scanning, and multi-platform support.
