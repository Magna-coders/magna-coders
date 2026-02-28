# Tech News Aggregator

Automatically fetches and posts real tech news to the Magna Coders feed.

## Features

- 🔄 **Auto-scheduling**: Posts every hour
- 📰 **Multiple sources**: NewsAPI, NewsData.io, DEV.to, Hacker News
- 🎯 **Smart deduplication**: No duplicate articles
- 🖼️ **Image support**: Fetches article cover images
- ✍️ **Author attribution**: Credits original authors
- 🛡️ **Error resilient**: Continues if one source fails

## Quick Start

### 1. Manual Trigger (Test Now)

```bash
# Preview news without posting
curl "http://localhost:5000/api/news/preview?limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Fetch and post 3 articles
curl -X POST "http://localhost:5000/api/news/fetch?limit=3" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Using the Test Script

```bash
cd magna-coders-backend
./test-news.sh YOUR_JWT_TOKEN
```

### 3. Automatic Schedule

The scheduler runs automatically every hour:
- Every hour on the hour (00:00, 01:00, 02:00, etc.)

## Configuration

### Optional: NewsAPI Key

Get a free API key at https://newsapi.org/ for additional news sources.

Add to `.env`:
```bash
NEWS_API_KEY="your-newsapi-key-here"
```

### Optional: NewsData.io Key

Get a free API key at https://newsdata.io/ for additional news sources.

Add to `.env`:
```bash
NEWSDATA_API_KEY="your-newsdata-api-key-here"
```

### Change Schedule

Edit `src/index.ts`:
```typescript
// Every hour (default)
newsScheduler.start('0 * * * *');

// Every 30 minutes
newsScheduler.start('*/30 * * * *');

// Every 6 hours
newsScheduler.start('0 */6 * * *');

// Every day at 9 AM
newsScheduler.start('0 9 * * *');
```

## News Sources

### 1. NewsAPI.org (Optional, Free Key)
- **Topics**: Technology category
- **Rate Limit**: 100 requests/day (free tier)
- **API**: https://newsapi.org/

### 2. NewsData.io (Optional, Free Key)
- **Topics**: Technology category
- **Rate Limit**: 200 requests/day (free tier)
- **API**: https://newsdata.io/

### 3. DEV Community (Free, No Key)
- **Topics**: JavaScript, TypeScript, React, Node.js
- **Rate Limit**: 30 requests/minute
- **API**: https://dev.to/api/articles

### 4. Hacker News (Free, No Key)
- **Topics**: Top tech stories
- **Rate Limit**: None
- **API**: https://hacker-news.firebaseio.com/v0/

## Architecture

```
newsAggregator.ts
├── fetchFromNewsAPI()      # NewsAPI.org (optional)
├── fetchFromNewsData()     # NewsData.io (optional)
├── fetchFromDevTo()        # DEV Community API
├── fetchFromHackerNews()   # Hacker News API
├── aggregateNews()         # Combine & deduplicate
└── postNewsToFeed()        # Post to Magna feed

newsScheduler.ts
├── initialize()            # Create system user
├── start()                 # Start cron job (every hour)
├── stop()                  # Stop cron job
└── runNow()               # Manual trigger
```

## API Endpoints

### POST /api/news/fetch
Manually fetch and post tech news.

**Query Parameters:**
- `limit` (optional): Number of articles to post (default: 5)

**Response:**
```json
{
  "message": "Successfully fetched and posted tech news",
  "limit": 5
}
```

### GET /api/news/preview
Preview aggregated news without posting.

**Query Parameters:**
- `limit` (optional): Number of articles to preview (default: 10)

**Response:**
```json
{
  "articles": [
    {
      "title": "React 19 Released",
      "description": "New features in React 19...",
      "url": "https://...",
      "source": "DEV Community",
      "publishedAt": "2024-01-15T10:00:00Z",
      "imageUrl": "https://...",
      "author": "John Doe"
    }
  ],
  "total": 25
}
```

## Troubleshooting

### No articles appearing?

1. Check backend logs for errors
2. Verify system user exists: `MagnaTechNews`
3. Test preview endpoint first
4. Check if sources are accessible

### Duplicate articles?

The deduplication logic compares article titles. If you see duplicates:
1. Check if titles are exactly the same
2. Verify the deduplication logic in `newsAggregator.ts`

### Scheduler not running?

Check backend logs for:
```
✅ News scheduler initialized with system user: MagnaTechNews
✅ News scheduler started (cron: 0 */6 * * *)
```

## Development

### Add a New News Source

1. Create a new fetch method in `newsAggregator.ts`:
```typescript
async fetchFromNewSource(): Promise<NewsArticle[]> {
  // Fetch logic here
}
```

2. Add to `aggregateNews()`:
```typescript
const [devTo, hackerNews, newSource] = await Promise.all([
  this.fetchFromDevTo(),
  this.fetchFromHackerNews(),
  this.fetchFromNewSource(), // Add here
]);
```

### Test Locally

```bash
# Start backend
cd magna-coders-backend
npm run dev

# In another terminal, trigger news fetch
curl -X POST "http://localhost:5000/api/news/fetch?limit=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Production Deployment

1. Set `NEWS_API_KEY` in production environment
2. Adjust cron schedule based on traffic patterns
3. Monitor API rate limits
4. Set up error alerting for failed fetches

## License

Part of Magna Coders platform.
