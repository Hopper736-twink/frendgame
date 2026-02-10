#!/usr/bin/env bash
set -euo pipefail

# Mirrors GitHub manual merge steps shown in PR UI.
# Usage:
#   ./scripts/github_manual_merge.sh codex/create-truth-or-dare-game-website-koswz2 main [--dry-run]

HEAD_BRANCH="${1:-}"
BASE_BRANCH="${2:-main}"
DRY_RUN="${3:-}"

if [[ -z "${HEAD_BRANCH}" ]]; then
  echo "Usage: $0 <head-branch> [base-branch] [--dry-run]"
  exit 1
fi

run_cmd() {
  if [[ "${DRY_RUN}" == "--dry-run" ]]; then
    echo "[dry-run] $*"
  else
    echo "+ $*"
    eval "$@"
  fi
}

if [[ "${DRY_RUN}" != "--dry-run" ]]; then
  if ! git remote get-url origin >/dev/null 2>&1; then
    echo "ERROR: remote 'origin' is not configured."
    echo "Add it first: git remote add origin <repo-url>"
    exit 1
  fi
fi

echo "Step 1) Update local repository"
run_cmd "git pull origin ${BASE_BRANCH}"

echo "Step 2) Checkout head branch"
run_cmd "git checkout ${HEAD_BRANCH}"

echo "Step 3) Merge base into head"
set +e
if [[ "${DRY_RUN}" == "--dry-run" ]]; then
  echo "[dry-run] git merge ${BASE_BRANCH}"
  MERGE_EXIT=0
else
  git merge "${BASE_BRANCH}"
  MERGE_EXIT=$?
fi
set -e

if [[ ${MERGE_EXIT} -ne 0 ]]; then
  echo "Step 4) Conflicts detected."
  echo "Resolve conflicts, then run:"
  echo "  git add -A"
  echo "  git commit"
else
  echo "Merge completed without conflicts."
fi

echo "Step 5) Push changes"
run_cmd "git push -u origin ${HEAD_BRANCH}"
