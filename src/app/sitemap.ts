import { MetadataRoute } from 'next';
import { metroLines } from '@/core/data/metro-data';

// Get all unique station IDs
const getAllStationIds = (): string[] => {
  const stationIds = new Set<string>();
  metroLines.forEach((line) => {
    line.stations.forEach((stationId) => {
      stationIds.add(stationId);
    });
  });
  return Array.from(stationIds);
};

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.safar.fyi';
  const currentDate = new Date().toISOString();

  // Core pages
  const corePages = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/map`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/route`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/transit-lines`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/stations`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contribute`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
  ];

  // Generate entries for all transit lines
  const transitLineEntries = metroLines.map((line) => ({
    url: `${baseUrl}/transit-lines/${line.id}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Generate entries for all stations
  const stationEntries = getAllStationIds().map((stationId) => ({
    url: `${baseUrl}/stations/${stationId}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Combine all entries
  return [...corePages, ...transitLineEntries, ...stationEntries];
}
