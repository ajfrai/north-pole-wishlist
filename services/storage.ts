
import { AppData, WishList } from '../types';

const STORAGE_KEY_BUCKET = 'north_pole_bucket_id_v2';
const DEFAULT_BUCKET_ID = '4JqnYPuEYxqTZGWRyFbWou';
const LOCAL_STORAGE_KEY_DATA = 'north_pole_data_cache';
const LOCAL_STORAGE_KEY_SHARDED = 'north_pole_use_sharded';

// Check if debug mode is enabled
const isDebugMode = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('debug') === 'true';
};

// Check if sharded storage should be used
const useShardedStorage = () => {
  if (!isDebugMode()) return false;
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY_SHARDED);
  return stored === 'true';
};

export const enableShardedStorage = () => {
  localStorage.setItem(LOCAL_STORAGE_KEY_SHARDED, 'true');
};

export const disableShardedStorage = () => {
  localStorage.removeItem(LOCAL_STORAGE_KEY_SHARDED);
};

// --- SEED DATA ---
const SEED_DATA: AppData = {
  users: ['Megan', 'Erin'],
  lists: [
    {
      id: 'list-megan',
      owner: 'Megan',
      colorTheme: 'red',
      items: [
        { id: 'm1', name: 'Cicaplast Lotion', store: 'Target', price: '$19', claimedBy: null },
        { id: 'm2', name: 'Bath Robe (Pink S/M)', store: 'Macys', price: '$70', isBlackFriday: true, claimedBy: null },
        { id: 'm3', name: 'Vacuum filter replacements', store: 'Walmart', price: '$17', claimedBy: null },
        { id: 'm4', name: 'Mini trash cans with lids (2 of them)', store: 'Target', price: '$34 for two', notes: '$17 each', claimedBy: null },
        { id: 'm5', name: 'Plug in carbon monoxide detector', store: 'Target (or any)', price: '$30', claimedBy: null },
        { id: 'm6', name: 'Heat protector spray', store: 'Amazon', price: '$15', isBlackFriday: true, claimedBy: null },
        // Stocking Stuffers
        { id: 'm7', name: '[Stocking Stuffer] Baby hats/mittens', store: 'Target', price: '$10', claimedBy: null },
        { id: 'm8', name: '[Stocking Stuffer] Baby socks', store: 'Target', price: '$10', claimedBy: null },
        { id: 'm9', name: '[Stocking Stuffer] Pepcid', store: 'Target/Any', price: '$15', claimedBy: null },
        { id: 'm10', name: '[Stocking Stuffer] Diaper pail refill', store: 'Target', price: '$15', claimedBy: null },
        { id: 'm11', name: '[Stocking Stuffer] White shower liner', store: 'Target', price: '$4', claimedBy: null },
        { id: 'm12', name: '[Stocking Stuffer] Compact mini travel umbrella', store: 'Amazon', price: '$11', isBlackFriday: true, claimedBy: null },
      ]
    },
    {
      id: 'list-erin',
      owner: 'Erin',
      colorTheme: 'green',
      items: [
        {
          id: 'e1',
          name: 'Untitled Goose Game',
          store: 'Walmart',
          link: 'https://www.walmart.com/ip/Untitled-Goose-Game-SKYBOUND-Nintendo-Switch/772817774',
          notes: 'Unclear if Black Friday sale or normal',
          claimedBy: null
        },
        {
          id: 'e2',
          name: 'Basic picture frames',
          notes: '9x12 black (1 qty), 11x14 light gray or light wood (1 qty)',
          claimedBy: null
        },
        {
          id: 'e3',
          name: 'Large drying rack',
          store: 'Amazon',
          link: 'https://www.amazon.com/gp/product/B07TLK6QHD/ref=ox_sc_saved_title_5?smid=A2G697YVFPFSPH&psc=1',
          isBlackFriday: true,
          claimedBy: null
        },
        {
          id: 'e4',
          name: 'Window hammock',
          store: 'Amazon',
          link: 'https://www.amazon.com/gp/product/B0CMT5C8XC/ref=ox_sc_saved_title_6?smid=A2OO1IYTXCYU3&th=1',
          isBlackFriday: true,
          claimedBy: null
        },
        {
          id: 'e5',
          name: 'Stainless steel trash can (10-13 gal)',
          store: 'Amazon/Home Depot',
          notes: 'No plastic inner liner. See links.',
          link: 'https://www.amazon.com/GLD-74506-Stainless-Clorox-Protection-Kitchen/dp/B07GY9TFTY',
          claimedBy: null
        }
      ]
    }
  ]
};

// --- END SEED DATA ---

export const getBucketId = (): string => {
  return localStorage.getItem(STORAGE_KEY_BUCKET) || DEFAULT_BUCKET_ID;
};

export const setBucketId = (id: string) => {
  localStorage.setItem(STORAGE_KEY_BUCKET, id);
  localStorage.removeItem(LOCAL_STORAGE_KEY_DATA);
};

// --- SHARDED STORAGE FUNCTIONS ---

const fetchShardedData = async (bucketId: string): Promise<AppData | null> => {
  try {
    // Fetch users
    const usersResponse = await fetch(`https://kvdb.io/${bucketId}/users_v2`, { cache: 'no-store' });
    let users: string[] = [];

    if (usersResponse.ok) {
      users = await usersResponse.json();
    } else if (usersResponse.status === 404) {
      return null; // No sharded data exists yet
    } else {
      throw new Error('Failed to fetch users');
    }

    // Fetch list IDs
    const listIdsResponse = await fetch(`https://kvdb.io/${bucketId}/list_ids_v2`, { cache: 'no-store' });
    let listIds: string[] = [];

    if (listIdsResponse.ok) {
      listIds = await listIdsResponse.json();
    }

    // Fetch each list
    const lists: WishList[] = [];
    for (const listId of listIds) {
      const listResponse = await fetch(`https://kvdb.io/${bucketId}/list_${listId}_v2`, { cache: 'no-store' });
      if (listResponse.ok) {
        const list = await listResponse.json();
        lists.push(list);
      }
    }

    return { users, lists };
  } catch (e) {
    console.warn('Sharded fetch failed', e);
    return null;
  }
};

const saveShardedData = async (bucketId: string, data: AppData): Promise<boolean> => {
  try {
    // Save users
    const usersResponse = await fetch(`https://kvdb.io/${bucketId}/users_v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data.users),
      keepalive: true
    });

    if (!usersResponse.ok) throw new Error('Failed to save users');

    // Save list IDs
    const listIds = data.lists.map(l => l.id);
    const listIdsResponse = await fetch(`https://kvdb.io/${bucketId}/list_ids_v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listIds),
      keepalive: true
    });

    if (!listIdsResponse.ok) throw new Error('Failed to save list IDs');

    // Save each list
    for (const list of data.lists) {
      const listResponse = await fetch(`https://kvdb.io/${bucketId}/list_${list.id}_v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(list),
        keepalive: true
      });

      if (!listResponse.ok) {
        throw new Error(`Failed to save list ${list.id}`);
      }
    }

    return true;
  } catch (error) {
    console.error('Sharded save failed:', error);
    return false;
  }
};

// --- PUBLIC API ---

export const fetchAppData = async (): Promise<AppData> => {
  let cloudData: AppData | null = null;
  let localData: AppData | null = null;
  const bucketId = getBucketId();

  // 1. Try Local Storage (Cache)
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY_DATA);
    if (local) {
      localData = JSON.parse(local);
    }
  } catch (e) {
    console.error('Local read error', e);
  }

  // 2. Try Cloud Storage
  if (bucketId) {
    try {
      if (useShardedStorage()) {
        cloudData = await fetchShardedData(bucketId);

        // Fall back to monolithic if sharded fails
        if (!cloudData) {
          const response = await fetch(`https://kvdb.io/${bucketId}/data_v1`, { cache: 'no-store' });
          if (response.ok) {
            cloudData = await response.json();
          }
        }
      } else {
        // Use monolithic storage
        const response = await fetch(`https://kvdb.io/${bucketId}/data_v1`, { cache: 'no-store' });
        if (response.ok) {
          cloudData = await response.json();
        } else if (response.status === 404) {
          cloudData = { lists: [], users: [] };
        }
      }

      // Update local backup
      if (cloudData) {
        localStorage.setItem(LOCAL_STORAGE_KEY_DATA, JSON.stringify(cloudData));
      }
    } catch (e) {
      console.warn('Cloud fetch failed', e);
    }
  }

  // 3. Resolve Data & Backfill with Seed if Empty
  let resolvedData = cloudData || localData;

  if (!resolvedData || resolvedData.lists.length === 0) {
      // INJECT SEED DATA if empty
      resolvedData = SEED_DATA;
  }

  // Ensure users array exists
  if (!resolvedData.users) {
      const existingOwners = new Set(resolvedData.lists.map((l: WishList) => l.owner));
      resolvedData.users = Array.from(existingOwners);
  }

  return resolvedData;
};

export const saveAppData = async (data: AppData): Promise<boolean> => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_DATA, JSON.stringify(data));
  } catch (e) {
    console.error('Local save failed', e);
  }

  const bucketId = getBucketId();
  if (!bucketId) return false;

  try {
    if (useShardedStorage()) {
      return await saveShardedData(bucketId, data);
    } else {
      // Use monolithic storage
      const response = await fetch(`https://kvdb.io/${bucketId}/data_v1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true
      });

      return response.ok;
    }
  } catch (error) {
    console.warn('Cloud sync failed:', error);
    return false;
  }
};
