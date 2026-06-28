export type ActivityFeedItem = {
  id: string;
  title: string;
  message: string;
  referralId: string | null;
  createdBy: string;
  isRead: boolean;
  createdAt: string;
};

/** @deprecated Use ActivityFeedItem */
export type Notification = ActivityFeedItem;
