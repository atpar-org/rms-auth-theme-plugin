#!/usr/bin/env bash
set -euo pipefail

# Smart startup script for RMS Auth Theme Plugin
# Usage:
#   ./start.sh                      # Auto-detect if build is needed
#   ./start.sh --build              # Force build
#   ./start.sh --no-build           # Skip build
#   ./start.sh --clean              # Clean build artifacts before building
#   ./start.sh --install            # Install dependencies only
#   ./start.sh --full-cycle         # Full cycle: clean+git pull+install+build
#   ./start.sh --help               # Show full help

# Ensure script is run with bash
if [ -z "${BASH_VERSION:-}" ]; then
  echo "ERROR: This script requires bash. Please run: bash $0" >&2
  exit 1
fi

# Get script directory
if [ -n "${BASH_SOURCE:-}" ]; then
  REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
else
  REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
fi
cd "${REPO_ROOT}"

# Parse arguments
FORCE_BUILD=0
SKIP_BUILD=0
CLEAN_BUILD=0
INSTALL_ONLY=0
FULL_CYCLE=0

for arg in "$@"; do
  case "${arg}" in
    --build) FORCE_BUILD=1 ;;
    --no-build) SKIP_BUILD=1 ;;
    --clean) CLEAN_BUILD=1 ;;
    --install) INSTALL_ONLY=1 ;;
    --full-cycle) FULL_CYCLE=1; CLEAN_BUILD=1; FORCE_BUILD=1 ;;
    --help|-h)
      echo "Usage: $0 [options]"
      echo ""
      echo "Build options:"
      echo "  --build              Force build of theme"
      echo "  --no-build           Skip build"
      echo "  --clean              Clean build artifacts before building"
      echo "  --install            Install dependencies only"
      echo "  --full-cycle         Full cycle: clean+git pull+install+build"
      echo ""
      echo "Examples:"
      echo "  $0                   # Auto-detect and build if needed"
      echo "  $0 --build           # Force build"
      echo "  $0 --clean --build   # Clean and build"
      echo "  $0 --full-cycle      # Full cycle: clean+git pull+install+build"
      echo "  $0 --install         # Install dependencies only"
      exit 0
      ;;
    *) echo "Unknown arg: ${arg}" >&2; echo "Use --help for usage information" >&2; exit 2 ;;
  esac
done

# Check for required tools
command -v node >/dev/null 2>&1 || { echo "ERROR: node not found on PATH" >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "ERROR: npm not found on PATH" >&2; exit 1; }

# Function to check if build is needed
check_build_needed() {
  # Check if dist_keycloak directory exists and has JAR files
  if [ ! -d "dist_keycloak" ] || [ -z "$(find dist_keycloak -name "*.jar" 2>/dev/null)" ]; then
    return 0  # Build needed
  fi
  
  # Check if source files are newer than build artifacts
  if find src -type f -newer dist_keycloak 2>/dev/null | grep -q .; then
    return 0  # Build needed
  fi
  
  if [ -f "package.json" ] && [ -f "dist_keycloak" ]; then
    if [ "package.json" -nt "dist_keycloak" ]; then
      return 0  # Build needed
    fi
  fi
  
  return 1  # No build needed
}

# Clean build artifacts
clean_build() {
  echo "==> Cleaning build artifacts ..."
  rm -rf dist 2>/dev/null || true
  rm -rf dist_keycloak 2>/dev/null || true
  rm -rf node_modules/.vite 2>/dev/null || true
  echo "✅ Build artifacts cleaned"
}

# Install dependencies
install_dependencies() {
  echo "==> Installing dependencies ..."
  if [ -f "package-lock.json" ]; then
    npm ci || npm install
  elif [ -f "yarn.lock" ]; then
    yarn install --frozen-lockfile || yarn install
  elif [ -f "pnpm-lock.yaml" ]; then
    pnpm install --frozen-lockfile || pnpm install
  else
    npm install
  fi
  echo "✅ Dependencies installed"
}

# Build theme
build_theme() {
  echo "==> Building Keycloak theme ..."
  npm run build-keycloak-theme || {
    echo "ERROR: Theme build failed!" >&2
    exit 1
  }
  echo "✅ Theme built successfully"
  
  # Show built JAR files
  if [ -d "dist_keycloak" ]; then
    echo ""
    echo "Built JAR files:"
    find dist_keycloak -name "*.jar" -type f | while read -r jar; do
      size=$(du -h "$jar" | cut -f1)
      echo "  - $(basename "$jar") ($size)"
    done
  fi
}

# Handle install-only mode
if [ "${INSTALL_ONLY}" = "1" ]; then
  install_dependencies
  echo "==> Install-only mode: dependencies installed. Exiting."
  exit 0
fi

# Full cycle mode
if [ "${FULL_CYCLE}" = "1" ]; then
  echo "==> Full cycle mode: Starting complete build process ..."
  echo ""
  
  # Clean
  clean_build
  
  # Git pull
  if [ -d ".git" ]; then
    echo "==> Pulling latest changes from git ..."
    git pull || {
      echo "WARNING: Git pull failed or not in a git repository" >&2
    }
    echo "✅ Git pull completed"
  else
    echo "==> Not a git repository, skipping git pull"
  fi
  
  # Install
  install_dependencies
  
  # Build
  build_theme
  
  echo ""
  echo "✅ Full cycle completed successfully!"
  echo ""
  echo "  ✓ Cleaned build artifacts"
  echo "  ✓ Pulled latest code from git"
  echo "  ✓ Installed dependencies"
  echo "  ✓ Built theme JARs"
  echo ""
  echo "Theme JARs are available in: dist_keycloak/"
  exit 0
fi

# Clean if requested
if [ "${CLEAN_BUILD}" = "1" ]; then
  clean_build
fi

# Determine if build is needed
NEED_BUILD=0

if [ "${FORCE_BUILD}" = "1" ]; then
  NEED_BUILD=1
  echo "==> Build forced via --build flag"
elif [ "${SKIP_BUILD}" = "1" ]; then
  NEED_BUILD=0
  echo "==> Build skipped via --no-build flag"
else
  # Auto-detect
  if check_build_needed; then
    NEED_BUILD=1
    echo "==> Build artifacts missing or outdated, build required"
  else
    echo "==> Build artifacts are up to date, skipping build"
  fi
fi

# Install dependencies if needed
if [ "${NEED_BUILD}" = "1" ] && [ ! -d "node_modules" ]; then
  install_dependencies
elif [ "${NEED_BUILD}" = "1" ] && [ -f "package.json" ]; then
  # Check if node_modules needs update
  if [ "package.json" -nt "node_modules" ] 2>/dev/null; then
    echo "==> package.json is newer than node_modules, reinstalling dependencies ..."
    install_dependencies
  fi
fi

# Build if needed
if [ "${NEED_BUILD}" = "1" ]; then
  build_theme
else
  echo ""
  echo "==> No build needed. Existing artifacts are up to date."
  if [ -d "dist_keycloak" ]; then
    echo ""
    echo "Existing JAR files:"
    find dist_keycloak -name "*.jar" -type f | while read -r jar; do
      size=$(du -h "$jar" | cut -f1)
      echo "  - $(basename "$jar") ($size)"
    done
  fi
fi

echo ""
echo "==> Done."
echo ""
echo "Theme JARs are available in: dist_keycloak/"

