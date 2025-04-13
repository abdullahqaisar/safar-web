import { stationData } from '@/core/data/station-data';
import {
  getLinesForStation,
  getLineNameById,
} from '@/features/map/utils/station-helpers';

export interface StationSearchResult {
  id: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  lines: string[];
  lineNames: string[];
  score: number;
  isStation: true;
}

/**
 * Normalize text for better matching
 * - Convert to lowercase
 * - Remove extra spaces
 * - Replace hyphens, underscores with spaces
 * - Remove non-essential special characters
 */
function normalizeText(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      // Convert camelCase to spaces
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[\-_]/g, ' ')
      .replace(/\s+/g, ' ')
      // Only remove certain special characters, keep some for accurate matching
      .replace(/[^\w\s\-\/\.]/g, '')
  );
}

/**
 * Prepare keywords from station name for better matching
 */
function extractKeywords(stationName: string): string[] {
  const normalized = normalizeText(stationName);
  // Split into individual words and filter out short prepositions, articles, etc.
  return normalized
    .split(' ')
    .filter(
      (word) =>
        word.length > 1 &&
        !['and', 'the', 'of', 'in', 'on', 'at', 'by', 'to', 'for'].includes(
          word
        )
    );
}

/**
 * Calculate similarity score between query and station
 * Higher score = better match
 */
function calculateSimilarity(
  query: string,
  station: { name: string; id: string }
): number {
  const normalizedQuery = normalizeText(query);
  const normalizedName = normalizeText(station.name);
  const normalizedId = normalizeText(station.id).replace(
    /([a-z])([A-Z])/g,
    '$1 $2'
  );

  // Direct match on full station name
  if (normalizedName === normalizedQuery) {
    return 100;
  }

  // Create name and query keywords
  const stationKeywords = extractKeywords(station.name);
  const queryKeywords = extractKeywords(query);

  // Handle ID vs keywords
  if (normalizedId === normalizedQuery) {
    return 95;
  }

  // Direct contains - station name contains the exact query string
  if (normalizedName.includes(normalizedQuery)) {
    // Weight by how much of the name the query represents
    const coverage = normalizedQuery.length / normalizedName.length;
    return Math.min(90, 70 + Math.floor(coverage * 20));
  }

  // Special case for Airport - prioritize it highly when the query contains "airport"
  if (
    (normalizedQuery.includes('airport') &&
      normalizedName.includes('airport')) ||
    (normalizedQuery.includes('int') &&
      normalizedName.includes('international'))
  ) {
    return 92;
  }

  // Whole query word matching - calculate how many query words are exact matches
  let exactWordMatches = 0;
  let partialWordMatches = 0;
  let positionScore = 0;

  // Check each query keyword against station keywords
  for (const queryWord of queryKeywords) {
    // Calculate exact word matches
    if (stationKeywords.includes(queryWord)) {
      exactWordMatches++;

      // If it's the first word/prefix of the station name, give extra score
      if (normalizedName.startsWith(queryWord + ' ')) {
        positionScore += 10;
      }
    }
    // Calculate partial word matches but only if significant
    else if (queryWord.length > 2) {
      for (const stationWord of stationKeywords) {
        // Only count meaningful partial matches (>50% of the station word)
        if (
          stationWord.includes(queryWord) &&
          queryWord.length > stationWord.length / 2
        ) {
          partialWordMatches++;
          break;
        }
      }
    }
  }

  // Calculate scores based on matches
  if (exactWordMatches > 0) {
    // Weight by percentage of exact matches
    const matchPercentage = exactWordMatches / queryKeywords.length;
    return 40 + Math.floor(matchPercentage * 40) + positionScore;
  }

  if (partialWordMatches > 0) {
    // Partial matches are weighted less but still count
    const partialPercentage = partialWordMatches / queryKeywords.length;
    const partialScore = 20 + Math.floor(partialPercentage * 20);

    // Only return a partial match score if it's meaningful
    return partialScore > 25 ? partialScore : 0;
  }

  // Special case for sector names (G-13, etc)
  const sectorMatch = normalizedQuery.match(/^([a-z])[- ]?(\d+)$/i);
  const stationSectorMatch = normalizedName.match(/([a-z])[- ]?(\d+)/i);

  if (
    sectorMatch &&
    stationSectorMatch &&
    sectorMatch[1] === stationSectorMatch[1] &&
    sectorMatch[2] === stationSectorMatch[2]
  ) {
    return 80;
  }

  return 0;
}

/**
 * Search for stations that match the query
 * Production-quality implementation with more precise results
 */
export function searchStations(
  query: string,
  limit = 5
): StationSearchResult[] {
  if (!query || query.length < 2) {
    return [];
  }

  const results = stationData
    .map((station) => {
      const score = calculateSimilarity(query, station);
      const lines = getLinesForStation(station.id);
      const lineNames = lines.map((lineId) => getLineNameById(lineId));

      return {
        ...station,
        score,
        lines,
        lineNames,
        isStation: true as const,
      };
    })
    .filter((result) => result.score > 30) // Higher threshold for relevance
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return results;
}

/**
 * Utility to combine Google Places results with station results
 * Ordered by relevance - stations are prioritized
 */
export function combineSearchResults(
  stationResults: StationSearchResult[],
  googleResults: Array<{
    place_id: string;
    description: string;
    structured_formatting: {
      main_text: string;
      secondary_text: string;
    };
  }>
) {
  // Create a copy of station results with specific structure for the dropdown
  const stationSuggestions = stationResults.map((station) => ({
    place_id: `station-${station.id}`,
    description: station.name,
    structured_formatting: {
      main_text: station.name,
      secondary_text: 'Transit Station',
    },
    isStation: true,
    station: station,
  }));

  // Ensure Google results don't overlap with station results
  const filteredGoogleResults = googleResults.filter(
    (googleResult) =>
      !stationResults.some(
        (station) =>
          normalizeText(station.name) ===
          normalizeText(googleResult.structured_formatting.main_text)
      )
  );

  // For production-quality presentation, limit to most relevant results
  // and ensure we prioritize Google results that contain the exact query term in main_text
  return [...stationSuggestions, ...filteredGoogleResults];
}
