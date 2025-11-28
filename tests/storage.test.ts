import { describe, it, expect } from 'vitest';
import { mergeAppData } from '../services/storage';
import type { AppData } from '../types';

describe('mergeAppData', () => {
  it('should merge users from both remote and local', () => {
    const remote: AppData = {
      users: ['Alice', 'Bob'],
      lists: []
    };

    const local: AppData = {
      users: ['Bob', 'Charlie'],
      lists: []
    };

    const result = mergeAppData(remote, local);

    expect(result.users).toContain('Alice');
    expect(result.users).toContain('Bob');
    expect(result.users).toContain('Charlie');
    expect(result.users.length).toBe(3);
  });

  it('should preserve lists that only exist remotely', () => {
    const remote: AppData = {
      users: ['Alice'],
      lists: [{
        id: 'list-1',
        owner: 'Alice',
        colorTheme: 'red',
        items: []
      }]
    };

    const local: AppData = {
      users: ['Alice'],
      lists: []
    };

    const result = mergeAppData(remote, local);

    expect(result.lists.length).toBe(1);
    expect(result.lists[0].id).toBe('list-1');
  });

  it('should preserve lists that only exist locally', () => {
    const remote: AppData = {
      users: ['Alice'],
      lists: []
    };

    const local: AppData = {
      users: ['Alice'],
      lists: [{
        id: 'list-2',
        owner: 'Alice',
        colorTheme: 'green',
        items: []
      }]
    };

    const result = mergeAppData(remote, local);

    expect(result.lists.length).toBe(1);
    expect(result.lists[0].id).toBe('list-2');
  });

  it('should merge items when the same list exists in both remote and local', () => {
    const remote: AppData = {
      users: ['Alice'],
      lists: [{
        id: 'list-1',
        owner: 'Alice',
        colorTheme: 'red',
        items: [
          { id: 'item-1', name: 'Remote Item', claimedBy: null }
        ]
      }]
    };

    const local: AppData = {
      users: ['Alice'],
      lists: [{
        id: 'list-1',
        owner: 'Alice',
        colorTheme: 'red',
        items: [
          { id: 'item-2', name: 'Local Item', claimedBy: null }
        ]
      }]
    };

    const result = mergeAppData(remote, local);

    expect(result.lists.length).toBe(1);
    expect(result.lists[0].items.length).toBe(2);
    expect(result.lists[0].items.find(i => i.id === 'item-1')).toBeDefined();
    expect(result.lists[0].items.find(i => i.id === 'item-2')).toBeDefined();
  });

  it('should handle concurrent claims - User A claims item 1, User B claims item 2', () => {
    // Initial state: two items, none claimed
    const remote: AppData = {
      users: ['Alice', 'Bob'],
      lists: [{
        id: 'list-1',
        owner: 'Charlie',
        colorTheme: 'red',
        items: [
          { id: 'item-1', name: 'Gift 1', claimedBy: 'Alice' },
          { id: 'item-2', name: 'Gift 2', claimedBy: null }
        ]
      }]
    };

    // Local state: Bob claimed item 2 (but doesn't know about Alice's claim yet)
    const local: AppData = {
      users: ['Alice', 'Bob'],
      lists: [{
        id: 'list-1',
        owner: 'Charlie',
        colorTheme: 'red',
        items: [
          { id: 'item-1', name: 'Gift 1', claimedBy: null },
          { id: 'item-2', name: 'Gift 2', claimedBy: 'Bob' }
        ]
      }]
    };

    const result = mergeAppData(remote, local);

    // After merge, local changes win (last write wins)
    expect(result.lists[0].items[0].claimedBy).toBe(null); // Local version wins
    expect(result.lists[0].items[1].claimedBy).toBe('Bob'); // Local version wins
  });

  it('should preserve local changes in last-write-wins strategy', () => {
    const remote: AppData = {
      users: ['Alice'],
      lists: [{
        id: 'list-1',
        owner: 'Alice',
        colorTheme: 'red',
        items: [
          { id: 'item-1', name: 'Old Name', claimedBy: null }
        ]
      }]
    };

    const local: AppData = {
      users: ['Alice'],
      lists: [{
        id: 'list-1',
        owner: 'Alice',
        colorTheme: 'red',
        items: [
          { id: 'item-1', name: 'New Name', claimedBy: null }
        ]
      }]
    };

    const result = mergeAppData(remote, local);

    expect(result.lists[0].items[0].name).toBe('New Name');
  });

  it('should handle addition of new items by different users', () => {
    // Remote: Alice added item-1
    const remote: AppData = {
      users: ['Alice', 'Bob'],
      lists: [{
        id: 'list-1',
        owner: 'Charlie',
        colorTheme: 'red',
        items: [
          { id: 'item-1', name: 'Alice Item', claimedBy: null }
        ]
      }]
    };

    // Local: Bob added item-2 (doesn't know about Alice's item yet)
    const local: AppData = {
      users: ['Alice', 'Bob'],
      lists: [{
        id: 'list-1',
        owner: 'Charlie',
        colorTheme: 'red',
        items: [
          { id: 'item-2', name: 'Bob Item', claimedBy: null }
        ]
      }]
    };

    const result = mergeAppData(remote, local);

    // Both items should be present
    expect(result.lists[0].items.length).toBe(2);
    expect(result.lists[0].items.find(i => i.name === 'Alice Item')).toBeDefined();
    expect(result.lists[0].items.find(i => i.name === 'Bob Item')).toBeDefined();
  });

  it('should handle deletion by preserving remote items not in local', () => {
    const remote: AppData = {
      users: ['Alice'],
      lists: [{
        id: 'list-1',
        owner: 'Alice',
        colorTheme: 'red',
        items: [
          { id: 'item-1', name: 'Item 1', claimedBy: null },
          { id: 'item-2', name: 'Item 2', claimedBy: null }
        ]
      }]
    };

    const local: AppData = {
      users: ['Alice'],
      lists: [{
        id: 'list-1',
        owner: 'Alice',
        colorTheme: 'red',
        items: [
          { id: 'item-1', name: 'Item 1', claimedBy: null }
          // item-2 was deleted locally
        ]
      }]
    };

    const result = mergeAppData(remote, local);

    // Remote item should still be preserved (merge doesn't delete)
    expect(result.lists[0].items.length).toBe(2);
  });

  it('should handle multiple lists with different changes', () => {
    const remote: AppData = {
      users: ['Alice', 'Bob'],
      lists: [
        {
          id: 'list-1',
          owner: 'Alice',
          colorTheme: 'red',
          items: [{ id: 'item-1', name: 'Alice Item 1', claimedBy: null }]
        },
        {
          id: 'list-2',
          owner: 'Bob',
          colorTheme: 'green',
          items: []
        }
      ]
    };

    const local: AppData = {
      users: ['Alice', 'Bob'],
      lists: [
        {
          id: 'list-1',
          owner: 'Alice',
          colorTheme: 'red',
          items: [{ id: 'item-2', name: 'Alice Item 2', claimedBy: null }]
        },
        {
          id: 'list-3',
          owner: 'Charlie',
          colorTheme: 'gold',
          items: []
        }
      ]
    };

    const result = mergeAppData(remote, local);

    expect(result.lists.length).toBe(3);
    expect(result.lists.find(l => l.id === 'list-1')?.items.length).toBe(2);
    expect(result.lists.find(l => l.id === 'list-2')).toBeDefined();
    expect(result.lists.find(l => l.id === 'list-3')).toBeDefined();
  });

  it('should handle empty remote data', () => {
    const remote: AppData = {
      users: [],
      lists: []
    };

    const local: AppData = {
      users: ['Alice'],
      lists: [{
        id: 'list-1',
        owner: 'Alice',
        colorTheme: 'red',
        items: []
      }]
    };

    const result = mergeAppData(remote, local);

    expect(result.users).toContain('Alice');
    expect(result.lists.length).toBe(1);
  });

  it('should handle empty local data', () => {
    const remote: AppData = {
      users: ['Alice'],
      lists: [{
        id: 'list-1',
        owner: 'Alice',
        colorTheme: 'red',
        items: []
      }]
    };

    const local: AppData = {
      users: [],
      lists: []
    };

    const result = mergeAppData(remote, local);

    expect(result.users).toContain('Alice');
    expect(result.lists.length).toBe(1);
  });

  it('should preserve all item properties during merge', () => {
    const remote: AppData = {
      users: ['Alice'],
      lists: [{
        id: 'list-1',
        owner: 'Alice',
        colorTheme: 'red',
        items: [{
          id: 'item-1',
          name: 'Gift',
          link: 'https://example.com',
          store: 'Amazon',
          price: '$50',
          notes: 'Size large',
          isBlackFriday: true,
          isTimeSensitive: false,
          claimedBy: null
        }]
      }]
    };

    const local: AppData = {
      users: ['Alice'],
      lists: [{
        id: 'list-1',
        owner: 'Alice',
        colorTheme: 'red',
        items: [{
          id: 'item-1',
          name: 'Gift Updated',
          link: 'https://example.com',
          store: 'Amazon',
          price: '$50',
          notes: 'Size large',
          isBlackFriday: true,
          isTimeSensitive: false,
          claimedBy: 'Bob'
        }]
      }]
    };

    const result = mergeAppData(remote, local);

    const item = result.lists[0].items[0];
    expect(item.name).toBe('Gift Updated'); // Local wins
    expect(item.claimedBy).toBe('Bob'); // Local wins
    expect(item.store).toBe('Amazon');
    expect(item.price).toBe('$50');
    expect(item.isBlackFriday).toBe(true);
  });
});
