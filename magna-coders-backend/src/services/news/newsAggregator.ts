import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
  author?: string;
}

/**
 * Download image from URL and convert to base64 data URL
 */
async function downloadImageAsBase64(imageUrl: string): Promise<string | null> {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000, // 10 second timeout
      maxContentLength: 10 * 1024 * 1024, // 10MB max
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MagnaCoders/1.0; +https://magnacoders.com)'
      }
    });

    // Get content type from response headers
    const contentType = response.headers['content-type'] || 'image/jpeg';
    
    // Convert buffer to base64
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    
    // Return as data URL
    return `data:${contentType};base64,${base64}`;
  } catch (error: any) {
    console.error(`Failed to download image from ${imageUrl}:`, error.message);
    return null;
  }
}

export class NewsAggregator {
  private readonly NEWS_API_KEY = process.env.NEWS_API_KEY;
  private readonly NEWSDATA_API_KEY = process.env.NEWSDATA_API_KEY;

  /**
   * Fetch tech news from NewsAPI.org
   * Get your free API key at: https://newsapi.org/
   */
  async fetchFromNewsAPI(): Promise<NewsArticle[]> {
    if (!this.NEWS_API_KEY) {
      console.warn('NEWS_API_KEY not set, skipping NewsAPI fetch');
      return [];
    }

    try {
      const response = await axios.get('https://newsapi.org/v2/top-headlines', {
        params: {
          category: 'technology',
          language: 'en',
          pageSize: 10,
          apiKey: this.NEWS_API_KEY,
        },
      });

      return response.data.articles.map((article: any) => ({
        title: article.title,
        description: article.description || article.content?.substring(0, 200),
        url: article.url,
        source: article.source.name,
        publishedAt: article.publishedAt,
        imageUrl: article.urlToImage,
        author: article.author,
      }));
    } catch (error: any) {
      console.error('Error fetching from NewsAPI:', error.message);
      return [];
    }
  }

  /**
   * Fetch tech news from Dev.to RSS feed (free, no API key needed)
   */
  async fetchFromDevTo(): Promise<NewsArticle[]> {
    try {
      const response = await axios.get('https://dev.to/api/articles', {
        params: {
          tag: 'javascript,typescript,react,nodejs',
          per_page: 10,
          top: 7, // Top articles from last 7 days
        },
      });

      return response.data.map((article: any) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        source: 'DEV Community',
        publishedAt: article.published_at,
        imageUrl: article.cover_image || article.social_image,
        author: article.user.name,
      }));
    } catch (error: any) {
      console.error('Error fetching from Dev.to:', error.message);
      return [];
    }
  }

  /**
   * Fetch tech news from Hacker News API (free, no API key needed)
   */
  async fetchFromHackerNews(): Promise<NewsArticle[]> {
    try {
      // Get top stories
      const topStoriesResponse = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json');
      const topStoryIds = topStoriesResponse.data.slice(0, 10);

      // Fetch details for each story
      const articles = await Promise.all(
        topStoryIds.map(async (id: number) => {
          const storyResponse = await axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          const story = storyResponse.data;

          return {
            title: story.title,
            description: story.text || `${story.score} points by ${story.by}`,
            url: story.url || `https://news.ycombinator.com/item?id=${id}`,
            source: 'Hacker News',
            publishedAt: new Date(story.time * 1000).toISOString(),
            author: story.by,
          };
        })
      );

      return articles;
    } catch (error: any) {
      console.error('Error fetching from Hacker News:', error.message);
      return [];
    }
  }

  /**
   * Fetch tech news from NewsData.io API
   * Get your free API key at: https://newsdata.io/
   */
  async fetchFromNewsData(): Promise<NewsArticle[]> {
    if (!this.NEWSDATA_API_KEY) {
      console.warn('NEWSDATA_API_KEY not set, skipping NewsData.io fetch');
      return [];
    }

    try {
      const response = await axios.get('https://newsdata.io/api/1/latest', {
        params: {
          apikey: this.NEWSDATA_API_KEY,
          category: 'technology',
          language: 'en',
          size: 10,
        },
      });

      return response.data.results.map((article: any) => ({
        title: article.title,
        description: article.description || article.content?.substring(0, 200),
        url: article.link,
        source: article.source_name || article.source_id,
        publishedAt: article.pubDate,
        imageUrl: article.image_url,
        author: article.creator?.[0] || article.source_name,
      }));
    } catch (error: any) {
      console.error('Error fetching from NewsData.io:', error.message);
      return [];
    }
  }

  /**
   * Aggregate news from all sources
   */
  async aggregateNews(): Promise<NewsArticle[]> {
    const [newsApiArticles, devToArticles, hackerNewsArticles, newsDataArticles] = await Promise.all([
      this.fetchFromNewsAPI(),
      this.fetchFromDevTo(),
      this.fetchFromHackerNews(),
      this.fetchFromNewsData(),
    ]);

    // Log image availability by source
    console.log(`\n📊 Articles by source:`);
    console.log(`  NewsAPI: ${newsApiArticles.length} articles, ${newsApiArticles.filter(a => a.imageUrl).length} with images`);
    console.log(`  DEV.to: ${devToArticles.length} articles, ${devToArticles.filter(a => a.imageUrl).length} with images`);
    console.log(`  Hacker News: ${hackerNewsArticles.length} articles, ${hackerNewsArticles.filter(a => a.imageUrl).length} with images`);
    console.log(`  NewsData: ${newsDataArticles.length} articles, ${newsDataArticles.filter(a => a.imageUrl).length} with images`);

    const allArticles = [...newsApiArticles, ...devToArticles, ...hackerNewsArticles, ...newsDataArticles];

    // Remove duplicates based on title similarity
    const uniqueArticles = this.deduplicateArticles(allArticles);

    // Sort by published date (newest first)
    return uniqueArticles.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }

  /**
   * Remove duplicate articles based on title similarity
   */
  private deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
    const seen = new Set<string>();
    return articles.filter(article => {
      const normalizedTitle = article.title.toLowerCase().trim();
      if (seen.has(normalizedTitle)) {
        return false;
      }
      seen.add(normalizedTitle);
      return true;
    });
  }

  /**
   * Post news articles to the feed
   */
  async postNewsToFeed(articles: NewsArticle[], systemUserId: string): Promise<void> {
    let posted = 0;
    let skipped = 0;
    let withImages = 0;
    let imageDownloadFailed = 0;
    
    for (const article of articles) {
      try {
        // Check if article already exists
        const existing = await prisma.posts.findFirst({
          where: {
            post_type: 'tech-news',
            title: article.title,
          },
        });

        if (existing) {
          console.log(`⏭️  Skipping duplicate: ${article.title.substring(0, 60)}...`);
          skipped++;
          continue;
        }

        // Create engaging content with more details
        const contentParts = [];
        
        // Add description if available
        if (article.description) {
          contentParts.push(article.description);
        }
        
        // Add source attribution
        contentParts.push(`\n\n📰 Source: ${article.source}`);
        
        // Add author if available
        if (article.author) {
          contentParts.push(`✍️ By ${article.author}`);
        }
        
        // Add read more link
        contentParts.push(`\n🔗 Read more: ${article.url}`);
        
        const engagingContent = contentParts.join('\n');

        // Create post with UUID
        const postId = randomUUID();
        await prisma.posts.create({
          data: {
            id: postId,
            author_id: systemUserId,
            title: article.title,
            content: engagingContent,
            post_type: 'tech-news',
          },
        });

        // If article has an image, download it and convert to base64
        if (article.imageUrl) {
          console.log(`📥 Downloading image for: ${article.title.substring(0, 60)}...`);
          const base64Image = await downloadImageAsBase64(article.imageUrl);
          
          if (base64Image) {
            try {
              const mediaId = randomUUID();
              
              // Create media entry with base64 data URL
              await prisma.media.create({
                data: {
                  id: mediaId,
                  url: base64Image,
                  type: 'image',
                },
              });
              
              // Link media to post
              await prisma.post_media.create({
                data: {
                  id: randomUUID(),
                  post_id: postId,
                  media_id: mediaId,
                },
              });
              
              console.log(`✅ Posted with image: ${article.title.substring(0, 60)}... (${article.source})`);
              withImages++;
            } catch (mediaError: any) {
              console.log(`✅ Posted (image save failed): ${article.title.substring(0, 60)}... (${article.source})`);
              console.error(`  📷 Image save error: ${mediaError.message}`);
              imageDownloadFailed++;
            }
          } else {
            console.log(`✅ Posted (image download failed): ${article.title.substring(0, 60)}... (${article.source})`);
            imageDownloadFailed++;
          }
        } else {
          console.log(`✅ Posted (no image): ${article.title.substring(0, 60)}... (${article.source})`);
        }
        
        posted++;
      } catch (error: any) {
        console.error(`❌ Error posting "${article.title.substring(0, 60)}...":`, error.message);
      }
    }
    
    console.log(`\n📊 Summary: ${posted} posted, ${withImages} with images, ${imageDownloadFailed} image downloads failed, ${skipped} skipped`);
  }

  /**
   * Main function to fetch and post tech news
   */
  async fetchAndPostNews(systemUserId: string, limit: number = 5): Promise<void> {
    console.log('🔄 Fetching tech news...');
    
    const articles = await this.aggregateNews();
    const topArticles = articles.slice(0, limit);

    console.log(`📰 Found ${articles.length} articles, posting top ${topArticles.length}`);

    await this.postNewsToFeed(topArticles, systemUserId);

    console.log('✅ Tech news update complete');
  }
}

export default new NewsAggregator();
