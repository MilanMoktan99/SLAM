// Shared shapes for Home/Events/Community/Profile/VIP data. Keep these in
// sync with your future Firestore documents so swapping mock data for real
// queries is a non-event.

export type EventCategory = 'social' | 'business' | 'wellness' | 'getaways';
export type EventPricingType = 'free' | 'paid';

export type EventItem = {
  id: string;
  title: string;
  category: EventCategory;
  image: string;
  date: string;
  time: string;
  location: string;
  description: string;
  pricingType: EventPricingType;
  standardPrice?: number;
  vipPrice?: number;
  spotsLeft: number;
  attendeeAvatars: string[];
  attendeeCount: number;
};

export type Attendee = {
  id: string;
  name: string;
  avatar: string;
};

export type ExploreCategory = {
  id: string;
  label: string;
  upcomingCount: number;
  colorLight: string;
  colorDark: string;
};

export type SuggestedPerson = {
  id: string;
  name: string;
  occupation: string;
  location: string;
  avatar: string;
};

export type Post = {
  id: string;
  authorName: string;
  authorAvatar: string;
  postedAt: string;
  content: string;
  image?: string;
  likeCount: number;
  commentCount: number;
  likedByMe?: boolean; // populated client-side when a userId is known
};

export type VipPlan = 'monthly' | 'annual';

export type Comment = {
  id: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  postedAt: string;
};

export type NotificationType =
  | 'like'
  | 'comment'
  | 'rsvp_confirmed'
  | 'event_reminder'
  | 'profile_incomplete'
  | 'vip_prompt'
  | 'points_earned';
 
export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  actionRoute?: string;
};

// Fields marked "private" below are only ever meant to be visible to the
// account owner — once a "view someone else's profile" screen exists, it
// should read from a getPublicProfile()-style projection that excludes
// these, rather than the full CurrentUser shape.
export type CurrentUser = {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  // Location
  city: string;
  area?: string; // private — more precise than city, self-visible only
  // Professional
  occupation: string;
  company?: string;
  education?: string;
  // Personal
  dob: string; // private
  phone: string; // private
  // Languages
  languages?: string[];
  // Interests
  interests: string[];
  // Connection
  connectionGoals?: string[];
  // Account
  email: string; // private
  isVip: boolean;
  vipPlan?: VipPlan;
  points: number;
  profileCompleted: boolean;
  // Referral
  referralCode: string;
  referralCount: number;
};

// --- SLAM Points & Rewards ---

export type RewardType =
  | 'event_credit'
  | 'vip_upgrade'
  | 'merch'
  | 'partner_perk'
  | 'prize_entry'
  | 'retreat_credit';

export type RewardStatus = 'active' | 'inactive';
export type RedemptionStatus = 'pending' | 'collected' | 'expired';

export type Reward = {
  id: string;
  name: string;
  type: RewardType;
  pointsRequired: number;
  quantityAvailable: number; // -1 = unlimited
  collectionMethod: string;
  expiryDate?: string;
  vipOnly: boolean;
  status: RewardStatus;
};

export type RewardRedemption = {
  id: string;
  rewardId: string;
  rewardName: string;
  redeemedAt: string;
  status: RedemptionStatus;
};

export type PointsTransaction = {
  id: string;
  reason: string;
  points: number;
  date: string;
};