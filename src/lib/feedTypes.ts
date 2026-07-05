export type FeedItemType = "movie" | "place" | "book" | "softwareLog" | "post";

export const FEED_TYPE_LABEL: Record<FeedItemType, string> = {
  movie: "Movie",
  place: "Place",
  book: "Book",
  softwareLog: "Dev Log",
  post: "Post",
};

export const FEED_TYPE_PATH: Record<FeedItemType, string> = {
  movie: "/movies",
  place: "/places",
  book: "/books",
  softwareLog: "/dev-log",
  post: "/posts",
};
