Write-Host "🐳 Starting Dev Container Build and Push Process" -ForegroundColor Cyan

# Load environment variables from .env file
$envFile = Join-Path -Path $PSScriptRoot -ChildPath "../.env"
if (Test-Path $envFile) {
    Write-Host "📄 Loading environment variables from .env file..." -ForegroundColor Cyan
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Item -Path "env:$key" -Value $value
        }
    }
}

# Set variables using the standardized environment variables
$REGISTRY = if ($env:DOCKER_REGISTRY) { $env:DOCKER_REGISTRY } else { "docker.io" }
$USERNAME = if ($env:DOCKER_USERNAME) { $env:DOCKER_USERNAME } else { "deanluus22021994" }
$IMAGE_NAME = "$USERNAME/cloudbuild"
$VERSION = Get-Date -Format "yyyyMMdd"
$LATEST_TAG = "$IMAGE_NAME`:latest"
$VERSION_TAG = "$IMAGE_NAME`:$VERSION"

# Optional Docker Host configuration
if ($env:DOCKER_HOST) {
    Write-Host "🔌 Using Docker Host: $env:DOCKER_HOST" -ForegroundColor Cyan
    # Set Docker host environment variable if needed
    $env:DOCKER_HOST = $env:DOCKER_HOST
}

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

# Use Docker access token from environment variables for authentication
Write-Host "🔑 Logging in to Docker Hub..." -ForegroundColor Yellow
if ($env:DOCKER_USERNAME -and $env:DOCKER_ACCESS_TOKEN) {
    $securePassword = ConvertTo-SecureString $env:DOCKER_ACCESS_TOKEN -AsPlainText -Force
    $credential = New-Object System.Management.Automation.PSCredential($env:DOCKER_USERNAME, $securePassword)
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($credential.Password)
    $plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    
    # Use docker login with credentials
    echo $plainPassword | docker login -u $env:DOCKER_USERNAME --password-stdin
} else {
    Write-Host "⚠️ Docker credentials not found in environment. Prompting for login..." -ForegroundColor Yellow
    docker login -u $USERNAME
}

# Push the images
Write-Host "📤 Pushing images to $REGISTRY..." -ForegroundColor Yellow
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