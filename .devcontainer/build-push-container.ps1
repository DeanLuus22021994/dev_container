Write-Host "🐳 Starting Dev Container Build and Push Process" -ForegroundColor Cyan

# Set variables
$IMAGE_NAME = "deanluus22021994/cloudbuild"
$VERSION = Get-Date -Format "yyyyMMdd"
$LATEST_TAG = "$IMAGE_NAME`:latest"
$VERSION_TAG = "$IMAGE_NAME`:$VERSION"

# Build the image with multiple tags
Write-Host "🔨 Building container image..." -ForegroundColor Yellow
docker build `
  --build-arg BUILDKIT_INLINE_CACHE=1 `
  --build-arg USER_UID=1000 `
  --build-arg USER_GID=1000 `
  -t $LATEST_TAG `
  -t $VERSION_TAG `
  -f .devcontainer/Dockerfile `
  .

# Check build status
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Please check errors above." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed successfully!" -ForegroundColor Green

# Prompt for Docker Hub login if needed
Write-Host "🔑 Logging in to Docker Hub..." -ForegroundColor Yellow
docker login -u deanluus22021994

# Push the images
Write-Host "📤 Pushing images to Docker Hub..." -ForegroundColor Yellow
docker push $LATEST_TAG
docker push $VERSION_TAG

# Check push status
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push failed! Please check errors above." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Successfully pushed images:" -ForegroundColor Green
Write-Host "   - $LATEST_TAG" -ForegroundColor Cyan
Write-Host "   - $VERSION_TAG" -ForegroundColor Cyan
Write-Host "🚀 Your development container is now available in the cloud!" -ForegroundColor Magenta