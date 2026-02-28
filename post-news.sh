#!/bin/bash

echo "🔄 Posting tech news to feed..."
echo ""

curl -X POST http://localhost:5000/api/news/test-fetch

echo ""
echo ""
echo "✅ Done! Open http://localhost:3000/feed and click 'Tech News' filter to see the posts."
