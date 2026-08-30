export type AdminPendingCounts = {
  pendingEvents: number;
  pendingPosts: number;
  pendingBusinesses: number;
  unreadMessages: number;
  pendingDeliveries: number;
};

export async function getAdminPendingCounts(): Promise<AdminPendingCounts> {
  const { getAdminAnalytics } = await import("./analytics");
  const { getPendingFeedPosts } = await import("./feed");
  const { getPendingBusinessCount } = await import("./users");
  const { getUnreadContactMessageCount } = await import("./contact");
  const { getPendingDeliveryCount } = await import("./promotions");

  const [analytics, posts, pendingBusinesses, unreadMessages, pendingDeliveries] =
    await Promise.all([
      getAdminAnalytics(),
      getPendingFeedPosts("en"),
      getPendingBusinessCount(),
      getUnreadContactMessageCount(),
      getPendingDeliveryCount(),
    ]);

  return {
    pendingEvents: analytics.pendingEvents,
    pendingPosts: posts.length,
    pendingBusinesses,
    unreadMessages,
    pendingDeliveries,
  };
}
