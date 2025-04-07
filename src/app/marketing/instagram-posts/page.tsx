import React from 'react';
import { Metadata } from 'next';
import InstagramLaunchPosts from '@/components/marketing/InstagramLaunchPosts';

export const metadata: Metadata = {
  title: 'Safar App | Instagram Launch Posts',
  description:
    'Professional Instagram promotional graphics for Safar app launch campaign',
};

export default function InstagramPostsPage() {
  return (
    <main className="container mx-auto py-16 px-4 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Instagram Launch Posts</h1>
        <p className="text-lg text-gray-600 mb-8">
          These promotional graphics have been designed based on research of
          leading transit apps like Moovit and Transit, focusing on key features
          like route finding, interactive maps, and real-time updates.
        </p>
        <p className="text-lg text-gray-600 mb-8">
          Each post has a download button to save it as a high-resolution
          1080×1080 PNG image, perfect for Instagram and other social media
          platforms. The images maintain clean, modern aesthetics while
          showcasing Safar app&apos;s key features.
        </p>
        <div className="mt-12" id="instagram-posts-container">
          <InstagramLaunchPosts />
        </div>
      </div>
    </main>
  );
}
