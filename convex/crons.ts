import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Rebuild the Journey heatmap's weekly rows once a day, so it fills itself
// after a deploy and picks up posts, places, cocktails and dev logs (which
// don't trigger a rebuild on save). 03:00 UTC, when nobody is browsing.
crons.cron("rebuild journey heatmap", "0 3 * * *", internal.journey.recompute, {});

export default crons;
