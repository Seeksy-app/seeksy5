// Shared podcast categories for creators, advertisers, and AI matching
export const PODCAST_CATEGORIES = [
  "Arts",
  "Business",
  "Comedy",
  "Education",
  "Fiction",
  "Food",
  "Government",
  "History",
  "Health & Fitness",
  "Kids & Family",
  "Leisure",
  "Music",
  "News",
  "Religion & Spirituality",
  "Science",
  "Society & Culture",
  "Sports",
  "Technology",
  "True Crime",
  "TV & Film",
] as const;

export type PodcastCategory = typeof PODCAST_CATEGORIES[number];
