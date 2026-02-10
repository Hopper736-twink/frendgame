#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/resolve_pr_conflicts.sh <head-branch> [base-branch] [--refresh]
# Example:
#   ./scripts/resolve_pr_conflicts.sh codex/create-truth-or-dare-game-website-koswz2 main --refresh

HEAD_BRANCH="${1:-$(git rev-parse --abbrev-ref HEAD)}"
BASE_BRANCH="${2:-main}"
REFRESH_FLAG="${3:-}"

CONFLICT_FILES=(
  ".github/workflows/deploy-pages.yml"
  "Index.html"
  "README.md"
  "app.js"
  "docs/app.js"
  "docs/index.html"
  "docs/styles.css"
  "index.html"
  "styles.css"
)

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "ERROR: remote 'origin' is not configured. Add remote first:"
  echo "  git remote add origin <repo-url>"
  exit 1
fi

echo "[1/6] Fetch base branch: origin/${BASE_BRANCH}"
git fetch origin "${BASE_BRANCH}" || {
  echo "ERROR: cannot fetch origin/${BASE_BRANCH}. Check remote and permissions."
  exit 1
}

echo "[2/6] Checkout head branch: ${HEAD_BRANCH}"
git checkout "${HEAD_BRANCH}"

echo "[3/6] Merge base branch into head"
set +e
git merge "origin/${BASE_BRANCH}"
MERGE_EXIT=$?
set -e

if [[ ${MERGE_EXIT} -ne 0 ]]; then
  echo "Merge has conflicts. Auto-resolving known files by keeping HEAD version (--ours)."
  for file in "${CONFLICT_FILES[@]}"; do
    if git ls-files -u -- "${file}" | grep -q .; then
      echo "  - resolving ${file} with --ours"
      git checkout --ours -- "${file}" || true
      git add "${file}" || true
    fi
  done

  if git diff --name-only --diff-filter=U | grep -q .; then
    echo "ERROR: unresolved files remain:"
    git diff --name-only --diff-filter=U
    echo "Resolve them manually, then commit."
    exit 2
  fi

  echo "[4/6] Commit merge result"
  GIT_EDITOR=true git commit -m "Merge ${BASE_BRANCH} into ${HEAD_BRANCH} and resolve static-site conflicts"
else
  echo "Merge completed without conflicts."
fi

if [[ "${REFRESH_FLAG}" == "--refresh" ]]; then
  echo "[5/6] Create empty commit to refresh stale/outdated checks"
  git commit --allow-empty -m "chore: refresh PR checks"
else
  echo "[5/6] Skip empty refresh commit (pass --refresh to enable)"
fi

echo "[6/6] Push with:"
echo "git push -u origin ${HEAD_BRANCH}"
