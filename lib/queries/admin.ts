export type AdminPendingCounts = {
  pendingEvents: number;
  pendingPosts: number;
  pendingBusinesses: number;
};

export async function getAdminPendingCounts(): Promise<AdminPendingCounts> {
  const { getAdminAnalytics } = await import("./analytics");
  const { getPendingFeedPosts } = await import("./feed");
  const { getPendingBusinessCount } = await import("./users");

  const [analytics, posts, pendingBusinesses] = await Promise.all([
    getAdminAnalytics(),
    getPendingFeedPosts("en"),
    getPendingBusinessCount(),
  ]);

  return {
    pendingEvents: analytics.pendingEvents,
    pendingPosts: posts.length,
    pendingBusinesses,
  };
}
