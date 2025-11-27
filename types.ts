
export interface GiftItem {
  id: string;
  name: string;
  link?: string;
  store?: string;
  price?: string;
  notes?: string;
  isBlackFriday?: boolean;
  isTimeSensitive?: boolean;
  claimedBy?: string | null; // Name of the person who claimed it
  isPurchased?: boolean; // Whether the claimer has purchased it
}

export interface WishList {
  id: string;
  owner: string; // The user's name
  externalLink?: string; // URL to external registry (e.g. Amazon)
  items: GiftItem[];
  colorTheme: 'red' | 'green' | 'gold';
}

export interface AppData {
  lists: WishList[];
  users: string[]; // List of all known family members
}

export type ViewState = 'HOME' | 'LIST' | 'MY_CLAIMS';
