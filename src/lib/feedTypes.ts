export type FeedItemType =
  | "movie"
  | "place"
  | "book"
  | "softwareLog"
  | "post"
  | "cocktail";

export const FEED_TYPE_LABEL: Record<FeedItemType, string> = {
  movie: "Movie",
  place: "Place",
  book: "Book",
  softwareLog: "Dev Log",
  post: "Post",
  cocktail: "Cocktail",
};

export const FEED_TYPE_PATH: Record<FeedItemType, string> = {
  movie: "/movies",
  place: "/places",
  book: "/books",
  softwareLog: "/dev-log",
  post: "/posts",
  cocktail: "/cocktails",
};
