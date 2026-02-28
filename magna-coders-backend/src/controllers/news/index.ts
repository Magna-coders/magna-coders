import { Request, Response } from 'express';
import newsAggregator from '../../services/news/newsAggregator';
import newsScheduler from '../../services/news/newsScheduler';

/**
 * Manually trigger tech news fetch and post
 */
export const fetchTechNews = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Number(req.query.limit) || 5;

    // Use the newsScheduler's runNow method which uses the magnanews system user
    await newsScheduler.runNow();

    res.status(200).json({ 
      message: `Successfully fetched and posted tech news as magnanews user`,
      limit 
    });
  } catch (error: any) {
    console.error('Error in fetchTechNews:', error);
    res.status(500).json({ message: 'Failed to fetch tech news', error: error.message });
  }
};

/**
 * Get aggregated news without posting (preview)
 */
export const previewTechNews = async (req: Request, res: Response): Promise<void> => {
  try {
    const articles = await newsAggregator.aggregateNews();
    const limit = Number(req.query.limit) || 10;

    res.status(200).json({ 
      articles: articles.slice(0, limit),
      total: articles.length 
    });
  } catch (error: any) {
    console.error('Error in previewTechNews:', error);
    res.status(500).json({ message: 'Failed to preview tech news', error: error.message });
  }
};
