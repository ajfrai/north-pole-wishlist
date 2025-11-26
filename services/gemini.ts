import { GiftItem } from "../types";

// Simple UUID generator
const generateId = () => Math.random().toString(36).substr(2, 9);

// Static gift suggestions database
const giftIdeas: Record<string, GiftItem[]> = {
  cooking: [
    { id: generateId(), name: "Cast Iron Skillet", link: "https://www.google.com/search?q=cast+iron+skillet", claimedBy: null },
    { id: generateId(), name: "Kitchen Stand Mixer", link: "https://www.google.com/search?q=kitchen+stand+mixer", claimedBy: null },
    { id: generateId(), name: "Chef's Knife Set", link: "https://www.google.com/search?q=chef+knife+set", claimedBy: null },
    { id: generateId(), name: "Cookbook Collection", link: "https://www.google.com/search?q=cookbook+collection", claimedBy: null },
    { id: generateId(), name: "Air Fryer", link: "https://www.google.com/search?q=air+fryer", claimedBy: null }
  ],
  reading: [
    { id: generateId(), name: "Kindle E-Reader", link: "https://www.google.com/search?q=kindle+e-reader", claimedBy: null },
    { id: generateId(), name: "Book Light", link: "https://www.google.com/search?q=reading+book+light", claimedBy: null },
    { id: generateId(), name: "Bookends Set", link: "https://www.google.com/search?q=decorative+bookends", claimedBy: null },
    { id: generateId(), name: "Reading Pillow", link: "https://www.google.com/search?q=reading+pillow", claimedBy: null },
    { id: generateId(), name: "Book Subscription Box", link: "https://www.google.com/search?q=book+subscription+box", claimedBy: null }
  ],
  gaming: [
    { id: generateId(), name: "Gaming Headset", link: "https://www.google.com/search?q=gaming+headset", claimedBy: null },
    { id: generateId(), name: "Mechanical Keyboard", link: "https://www.google.com/search?q=mechanical+gaming+keyboard", claimedBy: null },
    { id: generateId(), name: "Gaming Mouse", link: "https://www.google.com/search?q=gaming+mouse", claimedBy: null },
    { id: generateId(), name: "Game Gift Card", link: "https://www.google.com/search?q=gaming+gift+card", claimedBy: null },
    { id: generateId(), name: "Controller Charging Station", link: "https://www.google.com/search?q=controller+charging+station", claimedBy: null }
  ],
  sports: [
    { id: generateId(), name: "Fitness Tracker", link: "https://www.google.com/search?q=fitness+tracker", claimedBy: null },
    { id: generateId(), name: "Yoga Mat", link: "https://www.google.com/search?q=yoga+mat", claimedBy: null },
    { id: generateId(), name: "Water Bottle", link: "https://www.google.com/search?q=insulated+water+bottle", claimedBy: null },
    { id: generateId(), name: "Resistance Bands", link: "https://www.google.com/search?q=resistance+bands", claimedBy: null },
    { id: generateId(), name: "Sports Jersey", link: "https://www.google.com/search?q=sports+jersey", claimedBy: null }
  ],
  music: [
    { id: generateId(), name: "Bluetooth Speaker", link: "https://www.google.com/search?q=bluetooth+speaker", claimedBy: null },
    { id: generateId(), name: "Noise Cancelling Headphones", link: "https://www.google.com/search?q=noise+cancelling+headphones", claimedBy: null },
    { id: generateId(), name: "Vinyl Record Player", link: "https://www.google.com/search?q=vinyl+record+player", claimedBy: null },
    { id: generateId(), name: "Guitar Picks Set", link: "https://www.google.com/search?q=guitar+picks+set", claimedBy: null },
    { id: generateId(), name: "Music Streaming Subscription", link: "https://www.google.com/search?q=music+streaming+gift+card", claimedBy: null }
  ],
  default: [
    { id: generateId(), name: "Cozy Blanket", link: "https://www.google.com/search?q=cozy+blanket", claimedBy: null },
    { id: generateId(), name: "Scented Candle Set", link: "https://www.google.com/search?q=scented+candle+set", claimedBy: null },
    { id: generateId(), name: "Coffee Mug", link: "https://www.google.com/search?q=unique+coffee+mug", claimedBy: null },
    { id: generateId(), name: "Photo Frame", link: "https://www.google.com/search?q=picture+frame", claimedBy: null },
    { id: generateId(), name: "Gift Card", link: "https://www.google.com/search?q=gift+card", claimedBy: null }
  ]
};

export const getGiftSuggestions = async (
  interests: string,
  ageGroup: string
): Promise<GiftItem[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Find matching suggestions based on interests
  const interestKey = interests.toLowerCase();

  for (const [key, suggestions] of Object.entries(giftIdeas)) {
    if (interestKey.includes(key)) {
      return suggestions.map(s => ({
        ...s,
        id: generateId() // Generate new IDs each time
      }));
    }
  }

  // Return default suggestions if no match
  return giftIdeas.default.map(s => ({
    ...s,
    id: generateId()
  }));
};
