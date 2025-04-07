import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import { takeElementScreenshot } from '@/lib/puppeteer';

// Define the response data type
interface ResponseData {
  success: boolean;
  imageUrl?: string;
  message?: string;
}

/**
 * API endpoint that generates a high-quality image from an Instagram post
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { postId } = req.body;

    if (!postId || typeof postId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'PostId is required and must be a string',
      });
    }

    // Map post IDs to element IDs for screenshots
    const postElementMap: Record<string, string> = {
      post1: 'instagram-post-1',
      post2: 'instagram-post-2',
      post3: 'instagram-post-3',
    };

    const elementId = postElementMap[postId];

    if (!elementId) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid postId' });
    }

    // Define base URL based on environment
    const baseUrl =
      process.env.NODE_ENV === 'production'
        ? process.env.NEXT_PUBLIC_BASE_URL || 'https://safar.example.com'
        : 'http://localhost:3000';

    // URL to the Instagram posts page
    const url = `${baseUrl}/marketing/instagram-posts`;

    // Define output path
    const outputDir = path.join(process.cwd(), 'public', 'uploads');
    const filename = `instagram-${postId}-${Date.now()}.png`;
    const outputPath = path.join(outputDir, filename);

    // Take screenshot using the utility function
    await takeElementScreenshot(url, elementId, outputPath, {
      width: 1200,
      height: 1200,
      deviceScaleFactor: 2,
      timeout: 30000,
    });

    // Return the URL to the generated image
    return res.status(200).json({
      success: true,
      imageUrl: `/uploads/${filename}`,
    });
  } catch (error) {
    console.error('Error generating image:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
