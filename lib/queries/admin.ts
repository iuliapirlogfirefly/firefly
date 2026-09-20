export type AdminPendingCounts = {
  pendingEvents: number;
  pendingPosts: number;
  pendingBusinesses: number;
  unreadMessages: number;
  pendingDeliveries: number;
};

export async function getAdminPendingCounts(): Promise<AdminPendingCounts> {
  const { getPendingEventCount } = await import("./events");
  const { getPendingFeedPostCount } = await import("./feed");
  const { getPendingBusinessCount } = await import("./users");
  const { getUnreadContactMessageCount } = await import("./contact");
  const { getPendingDeliveryCount } = await import("./promotions");

  const [
    pendingEvents,
    pendingPosts,
    pendingBusinesses,
    unreadMessages,
    pendingDeliveries,
  ] = await Promise.all([
    getPendingEventCount(),
    getPendingFeedPostCount(),
    getPendingBusinessCount(),
    getUnreadContactMessageCount(),
    getPendingDeliveryCount(),
  ]);

  return {
    pendingEvents,
    pendingPosts,
    pendingBusinesses,
    unreadMessages,
    pendingDeliveries,
  };
}
