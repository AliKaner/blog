/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adminSessions from "../adminSessions.js";
import type * as books from "../books.js";
import type * as customPets from "../customPets.js";
import type * as feed from "../feed.js";
import type * as files from "../files.js";
import type * as lib_requireAdmin from "../lib/requireAdmin.js";
import type * as movies from "../movies.js";
import type * as pets from "../pets.js";
import type * as places from "../places.js";
import type * as posts from "../posts.js";
import type * as profile from "../profile.js";
import type * as projects from "../projects.js";
import type * as resumeItems from "../resumeItems.js";
import type * as softwareLogs from "../softwareLogs.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adminSessions: typeof adminSessions;
  books: typeof books;
  customPets: typeof customPets;
  feed: typeof feed;
  files: typeof files;
  "lib/requireAdmin": typeof lib_requireAdmin;
  movies: typeof movies;
  pets: typeof pets;
  places: typeof places;
  posts: typeof posts;
  profile: typeof profile;
  projects: typeof projects;
  resumeItems: typeof resumeItems;
  softwareLogs: typeof softwareLogs;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
