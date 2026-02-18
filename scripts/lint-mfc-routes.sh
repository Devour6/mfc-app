#!/usr/bin/env bash
#
# MFC Route Linter — runs in CI to enforce project-specific patterns.
# Exit code 0 = all checks pass, non-zero = violations found.
#
set -euo pipefail

ERRORS=0

echo "=== MFC Route Linter ==="
echo ""

# ---------------------------------------------------------------------------
# Rule 1: require-ensureUser
# Routes that call requireAuth() must also call ensureUser() — unless allowlisted.
# ---------------------------------------------------------------------------
echo "--- Check: requireAuth → ensureUser ---"

ALLOWLIST_ENSURE_USER=(
  "app/api/stripe/webhook/route.ts"
  "app/api/health/route.ts"
  "app/api/solana/config/route.ts"
  "app/api/agents/register/route.ts"
)

ENSURE_ERRORS=0
for route_file in $(find app/api -name "route.ts" -type f); do
  # Skip allowlisted files
  skip=false
  for allowed in "${ALLOWLIST_ENSURE_USER[@]}"; do
    if [[ "$route_file" == "$allowed" ]]; then
      skip=true
      break
    fi
  done
  if $skip; then continue; fi

  has_require_auth=false
  has_ensure_user=false
  grep -q "requireAuth" "$route_file" 2>/dev/null && has_require_auth=true
  grep -q "ensureUser" "$route_file" 2>/dev/null && has_ensure_user=true

  if $has_require_auth && ! $has_ensure_user; then
    echo "  FAIL: $route_file calls requireAuth() but NOT ensureUser()"
    ENSURE_ERRORS=$((ENSURE_ERRORS + 1))
    ERRORS=$((ERRORS + 1))
  fi
done

if [[ $ENSURE_ERRORS -eq 0 ]]; then
  echo "  PASS: All auth routes use ensureUser()"
fi
echo ""

# ---------------------------------------------------------------------------
# Rule 2: require-route-tests
# Every route.ts under app/api/ must have a corresponding test file.
# ---------------------------------------------------------------------------
echo "--- Check: Route test coverage ---"

ALLOWLIST_TESTS=(
  "app/api/health/route.ts"
)

TEST_ERRORS=0
for route_file in $(find app/api -name "route.ts" -type f); do
  # Skip allowlisted
  skip=false
  for allowed in "${ALLOWLIST_TESTS[@]}"; do
    if [[ "$route_file" == "$allowed" ]]; then
      skip=true
      break
    fi
  done
  if $skip; then continue; fi

  # Extract the base route name:
  # app/api/bets/route.ts → bets
  # app/api/bets/[id]/route.ts → bets (parent resource)
  # app/api/stripe/checkout-session/route.ts → stripe-checkout-session
  # app/api/solana/config/route.ts → solana-config
  route_path=$(echo "$route_file" | sed 's|app/api/||' | sed 's|/route\.ts||')
  # Remove [id] segments
  route_path_no_id=$(echo "$route_path" | sed 's|\[id\]/?||g' | sed 's|/$||')
  # Convert slashes to dashes for test file matching
  route_name=$(echo "$route_path_no_id" | sed 's|/|-|g')
  # Also get the parent resource name (first segment)
  parent_resource=$(echo "$route_path_no_id" | cut -d'/' -f1)

  found_test=false

  # Strategy 1: Direct test file name match
  # e.g., bets → bets.test.ts, stripe-checkout-session → stripe-checkout.test.ts
  for test_file in __tests__/api/*.test.ts; do
    if [[ ! -f "$test_file" ]]; then continue; fi
    test_base=$(basename "$test_file" .test.ts)

    # Exact match: bets.test.ts for app/api/bets/route.ts
    if [[ "$route_name" == "$test_base" ]]; then
      found_test=true
      break
    fi

    # Parent match: bets.test.ts for app/api/bets/[id]/route.ts
    if [[ "$parent_resource" == "$test_base" ]]; then
      found_test=true
      break
    fi

    # Partial match: stripe-checkout.test.ts for stripe-checkout-session
    if [[ "$route_name" == *"$test_base"* ]] || [[ "$test_base" == *"$route_name"* ]]; then
      found_test=true
      break
    fi

    # Partial match on parent: stripe.test.ts for stripe-*
    if [[ "$parent_resource" == "$test_base" ]]; then
      found_test=true
      break
    fi
  done

  # Strategy 2: Check if the route's API path is referenced in any test file
  if ! $found_test; then
    api_path="/api/${route_path_no_id}"
    if grep -rq "$api_path" __tests__/api/ 2>/dev/null; then
      found_test=true
    fi
  fi

  if ! $found_test; then
    echo "  FAIL: $route_file has no test coverage in __tests__/api/"
    TEST_ERRORS=$((TEST_ERRORS + 1))
    ERRORS=$((ERRORS + 1))
  fi
done

if [[ $TEST_ERRORS -eq 0 ]]; then
  echo "  PASS: All routes have test coverage"
fi
echo ""

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo "=== Summary ==="
if [[ $ERRORS -gt 0 ]]; then
  echo "WARNING: $ERRORS violation(s) found (non-blocking until Phase 1 cleanup is complete)"
  # TODO: Change to 'exit 1' after Luna removes rounded corners and Orcus adds ensureUser + tests
  exit 0
else
  echo "PASSED: All MFC route checks clean"
  exit 0
fi
