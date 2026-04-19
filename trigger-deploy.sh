#!/bin/bash

echo "=== Naili Deployment Trigger ==="
echo "Current commit: $(git log --oneline -1)"
echo ""

# Check if we can trigger a Vercel deployment
echo "1. Checking Vercel deployment status..."

# Try to get deployment info
if command -v curl &> /dev/null; then
    echo "Checking https://naili.ai deployment..."
    RESPONSE=$(curl -s -I https://naili.ai 2>/dev/null | grep -i "x-vercel-id\|age\|cache")
    echo "Response headers:"
    echo "$RESPONSE"
    echo ""
fi

echo "2. Deployment options:"
echo ""
echo "Option A: Wait for Vercel auto-deploy (usually 1-3 minutes after push)"
echo "Option B: Manually trigger via Vercel dashboard:"
echo "   - Go to https://vercel.com/prybarai/vision-shield"
echo "   - Click 'Redeploy' or wait for auto-deploy"
echo ""
echo "Option C: Force rebuild by pushing an empty commit:"
echo "   git commit --allow-empty -m 'Trigger Vercel deployment'"
echo "   git push"
echo ""
echo "3. To verify deployment is live:"
echo "   - Open https://naili.ai in incognito mode"
echo "   - Look for 'The magical flow' section"
echo "   - Check for 'Step 1 of 3' in upload flow"
echo "   - Verify Showcase has valid before/after pairs"
echo ""
echo "4. If still not deployed after 5 minutes:"
echo "   - Check Vercel dashboard for build errors"
echo "   - Verify GitHub repo is connected to Vercel"
echo "   - Clear Vercel build cache if needed"
echo ""
echo "=== Current build status ==="
npm run build 2>&1 | tail -20