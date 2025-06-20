# GitHub Actions Updates - Deprecation Fixes

## Issue
The GitHub Actions workflows were failing due to deprecated action versions:
- `actions/upload-artifact@v3` (deprecated January 30, 2025)
- `actions/download-artifact@v3` (deprecated January 30, 2025) 
- `actions/create-release@v1` (deprecated, unmaintained)

## Updates Made

### 1. Updated Artifact Actions (v3 → v4)
**File: `.github/workflows/docker-multiplatform.yml`**

**Before:**
```yaml
uses: actions/upload-artifact@v3
uses: actions/download-artifact@v3
```

**After:**
```yaml
uses: actions/upload-artifact@v4
uses: actions/download-artifact@v4
```

**Benefits of v4:**
- Up to 98% faster upload/download speeds
- Better compression
- Improved reliability
- New features and bug fixes

### 2. Updated Release Action
**File: `.github/workflows/release.yml`**

**Before:**
```yaml
uses: actions/create-release@v1
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
with:
  tag_name: ${{ github.ref }}
  release_name: Release ${{ github.ref }}
  body: ${{ steps.changelog.outputs.CHANGELOG }}
  draft: false
  prerelease: false
```

**After:**
```yaml
uses: softprops/action-gh-release@v2
with:
  tag_name: ${{ github.ref }}
  name: Release ${{ github.ref }}
  body: ${{ steps.changelog.outputs.CHANGELOG }}
  draft: false
  prerelease: false
```

**Benefits:**
- Actively maintained alternative
- Better performance and reliability
- More features and options
- Automatic GITHUB_TOKEN handling

### 3. Updated Other Actions
**Files: Multiple workflow files**

- `peter-evans/dockerhub-description@v3` → `@v4`
- `aquasecurity/trivy-action@master` → `@0.28.0` (pinned version)
- `github/codeql-action/upload-sarif@v2` → `@v3`

## Current Action Versions

| Action | Version | Status |
|--------|---------|--------|
| `actions/checkout` | v4 | ✅ Latest |
| `actions/upload-artifact` | v4 | ✅ Latest |
| `actions/download-artifact` | v4 | ✅ Latest |
| `docker/setup-buildx-action` | v3 | ✅ Latest |
| `docker/setup-qemu-action` | v3 | ✅ Latest |
| `docker/login-action` | v3 | ✅ Latest |
| `docker/build-push-action` | v5 | ✅ Latest |
| `docker/metadata-action` | v5 | ✅ Latest |
| `softprops/action-gh-release` | v2 | ✅ Latest |
| `peter-evans/dockerhub-description` | v4 | ✅ Latest |
| `aquasecurity/trivy-action` | 0.28.0 | ✅ Pinned |
| `github/codeql-action/upload-sarif` | v3 | ✅ Latest |

## Testing

All workflows should now run without deprecation warnings. The key changes ensure:

1. **Artifact handling** works with the new v4 API
2. **Release creation** uses a maintained action
3. **Security scanning** uses stable versions
4. **All actions** are up-to-date and maintained

## Migration Notes

### Artifact Actions (v3 → v4)
- No breaking changes in basic usage
- Improved performance automatically
- Better error handling
- Enhanced logging

### Release Action Migration
- `actions/create-release` → `softprops/action-gh-release`
- Simplified configuration (no manual GITHUB_TOKEN)
- Better release management features
- Active maintenance and updates

## Future Maintenance

To avoid similar issues:

1. **Regular Updates**: Check for action updates monthly
2. **Dependabot**: Consider adding Dependabot for GitHub Actions
3. **Version Pinning**: Pin to specific versions for stability
4. **Monitoring**: Watch for deprecation notices in GitHub blog

## Validation

The workflows are now ready to run without deprecation warnings. Test by:

1. **Push to main branch** - triggers docker-build-push.yml
2. **Create pull request** - triggers docker-test.yml
3. **Create version tag** (v1.0.0) - triggers release.yml
4. **Push to feature branch** - triggers docker-multiplatform.yml

All workflows should complete successfully with the updated action versions.
