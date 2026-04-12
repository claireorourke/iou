#!/usr/bin/env bash
set -euo pipefail

OUTDIR="dist"
BRANCH="pages"
REMOTE_URL=$(git remote get-url origin)
COMMIT_MSG="Deploy $(git rev-parse --short HEAD) - $(date -u '+%Y-%m-%d %H:%M:%S UTC')"

# Clear and re-clone the pages branch into the output dir
rm -rf "$OUTDIR"

if git ls-remote --exit-code --heads origin "$BRANCH" > /dev/null 2>&1; then
    git clone --branch "$BRANCH" --single-branch "$REMOTE_URL" "$OUTDIR"
else
    echo "Branch '$BRANCH' not found on origin. Initializing fresh orphan branch."
    mkdir "$OUTDIR"
    git -C "$OUTDIR" init
    git -C "$OUTDIR" remote add origin "$REMOTE_URL"
    git -C "$OUTDIR" checkout --orphan "$BRANCH"
fi

# Build into the output dir
npm run build

# Ensure GitHub Pages does not run Jekyll
touch "$OUTDIR/.nojekyll"

# Commit and push
git -C "$OUTDIR" add --all
git -C "$OUTDIR" commit -m "$COMMIT_MSG"
git -C "$OUTDIR" push origin "$BRANCH"
