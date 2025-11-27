
import React, { useState, useEffect, useCallback } from 'react';
import { Gift, User, ExternalLink, Trash, Plus, Check, ArrowLeft, RefreshCw, Heart, Link as LinkIcon, Info, Cloud, CloudOff, Users, X, Save, Settings, Copy, AlertTriangle, Clock, Tag, ShoppingBag, HelpCircle } from 'lucide-react';
import { AppData, WishList, GiftItem, ViewState } from './types';
import { fetchAppData, saveAppData, getBucketId, setBucketId } from './services/storage';
import Snowflakes from './components/Snowflakes';
import { v4 as uuidv4 } from 'uuid';

function App() {
  // --- State ---
  const [currentUser, setCurrentUser] = useState<string>('');
  const [appData, setAppData] = useState<AppData>({ lists: [], users: [] });
  const [view, setView] = useState<ViewState>('HOME');
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'SYNCED' | 'LOCAL' | 'SYNCING'>('LOCAL');
  
  // Modals
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [alertState, setAlertState] = useState<{isOpen: boolean, title: string, message: string} | null>(null);

  // Settings / Sync
  const [bucketId, setBucketIdState] = useState<string | null>(null);
  const [inputBucketId, setInputBucketId] = useState('');
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  // Create List State
  const [creatingListName, setCreatingListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Add User State
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');

  // List Item State
  const [newItemName, setNewItemName] = useState('');
  const [newItemLink, setNewItemLink] = useState('');
  const [newItemStore, setNewItemStore] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemNotes, setNewItemNotes] = useState('');
  const [newItemBF, setNewItemBF] = useState(false);
  const [newItemUrgent, setNewItemUrgent] = useState(false);

  // Celebration State
  const [showCelebration, setShowCelebration] = useState(false);

  // Dev mode flag
  const [isDevMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('dev') === 'true';
  });

  // --- Effects ---
  const loadData = useCallback(async () => {
    setLoading(true);
    let currentBucketId = getBucketId();
    setBucketIdState(currentBucketId);

    const data = await fetchAppData();
    setAppData(data);
    setLoading(false);
    
    if (currentBucketId) {
        setSyncStatus('SYNCED'); 
    }

    const savedUser = localStorage.getItem('np_user');
    if (savedUser && data.users.includes(savedUser)) {
        setCurrentUser(savedUser);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Helpers ---
  const persistData = async (newData: AppData) => {
    setAppData(newData);
    setSyncStatus('SYNCING');
    const isSynced = await saveAppData(newData);
    setSyncStatus(isSynced ? 'SYNCED' : 'LOCAL');
  };

  const showAlert = (title: string, message: string) => {
      setAlertState({ isOpen: true, title, message });
  };

  const closeAlert = () => setAlertState(null);

  const handleJoinFamily = async (e: React.FormEvent) => {
      e.preventDefault();
      const code = inputBucketId.trim();
      if (!code) return;

      setLoading(true);
      setBucketId(code);
      setBucketIdState(code);
      await loadData();
      setShowSyncModal(false);
      setLoading(false);
  };
  
  const handleClearData = async () => {
      const emptyData: AppData = { lists: [], users: [] };
      await persistData(emptyData);
      setCurrentUser('');
      setView('HOME');
      setShowSyncModal(false);
      setIsConfirmingReset(false);
  };

  // --- Handlers ---
  const handleUserChange = (name: string) => {
    setCurrentUser(name);
    localStorage.setItem('np_user', name);
  };

  const handleAddUser = async (e: React.FormEvent) => {
      e.preventDefault();
      const name = newUserName.trim();
      if (!name) return;

      if (appData.users.some(u => u.toLowerCase() === name.toLowerCase())) {
          handleUserChange(appData.users.find(u => u.toLowerCase() === name.toLowerCase()) || name);
          setNewUserName('');
          setIsAddingUser(false);
          return;
      }
      
      const newList: WishList = {
          id: uuidv4(),
          owner: name,
          items: [],
          colorTheme: ['red', 'green', 'gold'][Math.floor(Math.random() * 3)] as 'red' | 'green' | 'gold'
      };

      const newData = {
          users: [...appData.users, name],
          lists: [...appData.lists, newList]
      };
      
      await persistData(newData);
      handleUserChange(name);
      setNewUserName('');
      setIsAddingUser(false);
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = creatingListName.trim();
    if (!name) return;

    if (appData.lists.some(l => l.owner.toLowerCase() === name.toLowerCase())) {
        const existing = appData.lists.find(l => l.owner.toLowerCase() === name.toLowerCase());
        if (existing) {
             setActiveListId(existing.id);
             setView('LIST');
             setIsCreating(false);
        }
        return;
    }

    const newList: WishList = {
      id: uuidv4(),
      owner: name,
      items: [],
      colorTheme: ['red', 'green', 'gold'][Math.floor(Math.random() * 3)] as 'red' | 'green' | 'gold'
    };

    const updatedUsers = appData.users.some(u => u.toLowerCase() === name.toLowerCase())
        ? appData.users
        : [...appData.users, name];

    const newData = {
      ...appData,
      users: updatedUsers,
      lists: [...appData.lists, newList]
    };

    await persistData(newData);
    setCreatingListName('');
    setIsCreating(false);
    setActiveListId(newList.id);
    setView('LIST');
    
    if (!currentUser) {
        handleUserChange(newList.owner);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !activeListId) return;

    const listIndex = appData.lists.findIndex(l => l.id === activeListId);
    if (listIndex === -1) return;

    const newItem: GiftItem = {
      id: uuidv4(),
      name: newItemName,
      link: newItemLink,
      store: newItemStore,
      price: newItemPrice,
      notes: newItemNotes,
      isBlackFriday: newItemBF,
      isTimeSensitive: newItemUrgent,
      claimedBy: null
    };

    const updatedLists = [...appData.lists];
    updatedLists[listIndex] = {
      ...updatedLists[listIndex],
      items: [...updatedLists[listIndex].items, newItem]
    };

    await persistData({ ...appData, lists: updatedLists });
    setNewItemName('');
    setNewItemLink('');
    setNewItemStore('');
    setNewItemPrice('');
    setNewItemNotes('');
    setNewItemBF(false);
    setNewItemUrgent(false);

    // Show celebratory snowflakes!
    setShowCelebration(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!activeListId) return;
    const listIndex = appData.lists.findIndex(l => l.id === activeListId);
    if (listIndex === -1) return;

    const updatedLists = [...appData.lists];
    updatedLists[listIndex] = {
      ...updatedLists[listIndex],
      items: updatedLists[listIndex].items.filter(i => i.id !== itemId)
    };

    await persistData({ ...appData, lists: updatedLists });
  };

  const handleToggleClaim = async (listId: string, itemId: string) => {
    if (!currentUser) {
        showAlert("Who are you?", "Please select your name in the top bar before claiming gifts!");
        return;
    }

    const listIndex = appData.lists.findIndex(l => l.id === listId);
    if (listIndex === -1) return;

    const list = appData.lists[listIndex];
    const itemIndex = list.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    const item = list.items[itemIndex];
    let newClaimedBy = item.claimedBy;

    if (item.claimedBy === currentUser) {
      newClaimedBy = null; // Unclaim
    } else if (!item.claimedBy) {
      newClaimedBy = currentUser; // Claim
    } else {
      return; // Already claimed
    }

    const updatedLists = [...appData.lists];
    const updatedItems = [...list.items];
    updatedItems[itemIndex] = { ...item, claimedBy: newClaimedBy };
    updatedLists[listIndex] = { ...list, items: updatedItems };

    await persistData({ ...appData, lists: updatedLists });
  };

  const handleTogglePurchased = async (listId: string, itemId: string) => {
    const listIndex = appData.lists.findIndex(l => l.id === listId);
    if (listIndex === -1) return;

    const list = appData.lists[listIndex];
    const itemIndex = list.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    const item = list.items[itemIndex];

    // Only allow toggling if current user claimed it
    if (item.claimedBy !== currentUser) return;

    const updatedLists = [...appData.lists];
    const updatedItems = [...list.items];
    updatedItems[itemIndex] = { ...item, isPurchased: !item.isPurchased };
    updatedLists[listIndex] = { ...list, items: updatedItems };

    await persistData({ ...appData, lists: updatedLists });
  };


  // --- Components ---

  const renderAlertModal = () => {
      if (!alertState) return null;
      return (
          <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
                  <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                      <AlertTriangle size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{alertState.title}</h3>
                  <p className="text-gray-600 mb-6">{alertState.message}</p>
                  <button 
                      onClick={closeAlert}
                      className="w-full bg-gray-800 text-white font-bold py-2 rounded-lg hover:bg-gray-900"
                  >
                      Okay
                  </button>
              </div>
          </div>
      );
  };

  const renderHelpModal = () => {
      if (!showHelpModal) return null;
      return (
          <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          <HelpCircle className="text-christmas-green" /> How to Use
                      </h3>
                      <button onClick={() => setShowHelpModal(false)} className="text-gray-400 hover:text-gray-600">
                          <X size={24} />
                      </button>
                  </div>
                  
                  <div className="space-y-4 text-gray-700">
                      <div className="flex gap-3">
                          <div className="bg-green-100 text-green-700 p-2 rounded-lg h-fit"><User size={20}/></div>
                          <div>
                              <h4 className="font-bold text-gray-900">1. Identify Yourself</h4>
                              <p className="text-sm">Use the dropdown in the top right to select your name. This is crucial for claiming gifts!</p>
                          </div>
                      </div>

                       <div className="flex gap-3">
                          <div className="bg-red-100 text-red-700 p-2 rounded-lg h-fit"><Plus size={20}/></div>
                          <div>
                              <h4 className="font-bold text-gray-900">2. Add Your Wishlist</h4>
                              <p className="text-sm">If you aren't on the list, click "Add Person" on the home screen. This creates a profile and a wishlist for you.</p>
                          </div>
                      </div>

                      <div className="flex gap-3">
                          <div className="bg-gold-100 text-yellow-700 p-2 rounded-lg h-fit"><Gift size={20}/></div>
                          <div>
                              <h4 className="font-bold text-gray-900">3. Add Items</h4>
                              <p className="text-sm">Open your list and add gifts. You can include links, prices, stores, and mark items as "Black Friday Deals".</p>
                          </div>
                      </div>

                      <div className="flex gap-3">
                          <div className="bg-blue-100 text-blue-700 p-2 rounded-lg h-fit"><Heart size={20}/></div>
                          <div>
                              <h4 className="font-bold text-gray-900">4. Claim Gifts</h4>
                              <p className="text-sm">Visit other family members' lists. Click "Claim Gift" to mark it as purchased. This prevents duplicate gifts! The owner cannot see who claimed their items.</p>
                          </div>
                      </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t text-center">
                      <button onClick={() => setShowHelpModal(false)} className="bg-christmas-green text-white px-6 py-2 rounded-lg font-bold">Got it!</button>
                  </div>
              </div>
          </div>
      );
  };

  const renderHeader = () => (
    <header className="bg-christmas-red text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-4">
            <div 
                className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition"
                onClick={() => { setView('HOME'); setActiveListId(null); loadData(); }}
            >
            <Gift size={24} className="text-christmas-gold" />
            <h1 className="text-xl font-bold">North Pole Lists</h1>
            </div>

            <div className="flex gap-2">
                {currentUser && (
                    <button
                        onClick={() => { setView('MY_CLAIMS'); setActiveListId(null); }}
                        className="bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition"
                        title="My Shopping List"
                    >
                        <ShoppingBag size={14} /> My Claims
                    </button>
                )}
                {isDevMode && (
                    <button
                        onClick={() => setShowSyncModal(true)}
                        className="bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition"
                        title="Family Sync Settings (Dev Mode)"
                    >
                        <Settings size={14} /> Code
                    </button>
                )}
                <button
                    onClick={() => setShowHelpModal(true)}
                    className="bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition"
                    title="Help"
                >
                    <HelpCircle size={14} /> Help
                </button>
            </div>
        </div>
        
        <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm border border-white/20">
          <User size={16} className="text-christmas-gold" />
          <span className="text-sm font-medium whitespace-nowrap">I am:</span>
          
          {isAddingUser ? (
             <form onSubmit={handleAddUser} className="flex items-center gap-1">
                 <input 
                    autoFocus
                    type="text" 
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Name"
                    className="bg-white/20 border-none focus:ring-1 focus:ring-christmas-gold text-white placeholder-white/50 text-sm rounded px-2 py-1 w-24 focus:outline-none"
                  />
                  <button type="submit" className="text-green-300 hover:text-green-100"><Save size={16} /></button>
                  <button type="button" onClick={() => setIsAddingUser(false)} className="text-red-300 hover:text-red-100"><X size={16} /></button>
             </form>
          ) : (
            <div className="flex items-center gap-2">
                <select 
                    value={currentUser}
                    onChange={(e) => handleUserChange(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-white text-sm font-bold w-32 focus:outline-none cursor-pointer [&>option]:text-gray-800"
                >
                    <option value="" disabled>Select...</option>
                    {appData.users.sort().map(u => (
                        <option key={u} value={u}>{u}</option>
                    ))}
                </select>
                <button 
                    onClick={() => setIsAddingUser(true)}
                    className="bg-christmas-gold text-christmas-red rounded-full p-0.5 hover:scale-110 transition"
                    title="Add new family member"
                >
                    <Plus size={14} />
                </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );

  const renderSyncModal = () => {
      if (!showSyncModal) return null;
      return (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          <Users className="text-christmas-green" /> Family Sync
                      </h3>
                      <button onClick={() => { setShowSyncModal(false); setIsConfirmingReset(false); }} className="text-gray-400 hover:text-gray-600">
                          <X size={24} />
                      </button>
                  </div>

                  <div className="mb-6 bg-green-50 p-4 rounded-xl border border-green-100">
                      <p className="text-xs font-bold text-green-800 uppercase mb-2">Your Family Code</p>
                      <div className="flex items-center gap-2">
                          <code className="flex-1 bg-white border border-green-200 px-3 py-2 rounded font-mono text-sm text-gray-700 break-all">
                              {bucketId || 'Loading...'}
                          </code>
                          <button 
                            onClick={() => {
                                if (bucketId) navigator.clipboard.writeText(bucketId);
                            }}
                            className="bg-white border border-green-200 p-2 rounded hover:bg-green-100 text-green-700 transition"
                            title="Copy Code"
                          >
                              <Copy size={18} />
                          </button>
                      </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4 mb-4">
                      <p className="text-sm text-gray-600 mb-2 font-medium">Join an existing family?</p>
                      <form onSubmit={handleJoinFamily} className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Paste Family Code here..."
                            value={inputBucketId}
                            onChange={(e) => setInputBucketId(e.target.value)}
                            className="flex-1 border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-christmas-green/30 outline-none"
                            required
                          />
                          <button type="submit" className="bg-christmas-green text-white px-4 py-2 rounded text-sm font-bold hover:bg-green-800">
                              Join
                          </button>
                      </form>
                  </div>

                   <div className="border-t border-red-100 pt-4 bg-red-50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                      {!isConfirmingReset ? (
                          <button 
                            onClick={() => setIsConfirmingReset(true)}
                            className="w-full bg-white border border-red-200 text-red-600 px-4 py-2 rounded text-sm font-bold hover:bg-red-600 hover:text-white transition flex items-center justify-center gap-2"
                          >
                             <AlertTriangle size={16} /> Reset Family Data (Clear All)
                          </button>
                      ) : (
                          <div className="text-center animate-fade-in">
                              <p className="text-red-700 font-bold mb-2">Are you sure? This deletes everything.</p>
                              <div className="flex gap-2 justify-center">
                                  <button 
                                      onClick={() => setIsConfirmingReset(false)}
                                      className="bg-gray-200 text-gray-800 px-4 py-2 rounded text-sm font-bold hover:bg-gray-300"
                                  >
                                      Cancel
                                  </button>
                                  <button 
                                      onClick={handleClearData}
                                      className="bg-red-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-red-700"
                                  >
                                      Yes, Delete All
                                  </button>
                              </div>
                          </div>
                      )}
                   </div>
              </div>
          </div>
      );
  };

  const renderHome = () => (
    <div className="max-w-4xl mx-auto p-4 animate-fade-in">
        <div className="text-center py-8">
            <h2 className="text-3xl font-bold text-christmas-green mb-2">Family Wishlists</h2>
            <p className="text-gray-600 max-w-lg mx-auto mb-4">
              Select your name in the top right to start claiming gifts!
            </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {/* Create New List Card */}
            <div className="bg-white rounded-xl shadow-md p-6 border-2 border-dashed border-christmas-green/40 hover:border-christmas-green transition flex flex-col items-center justify-center min-h-[200px] text-center">
                {!isCreating ? (
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="flex flex-col items-center gap-3 text-christmas-green hover:scale-105 transition w-full h-full justify-center"
                    >
                        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                            <Plus size={24} />
                        </div>
                        <span className="font-bold text-lg">Add Person</span>
                    </button>
                ) : (
                    <form onSubmit={handleCreateList} className="w-full text-left">
                        <h3 className="font-bold text-gray-700 mb-3 text-center">Add Person</h3>
                        
                        <label className="block text-xs font-bold text-gray-500 mb-1">Name</label>
                        <input
                            autoFocus
                            type="text"
                            placeholder="e.g. Grandma"
                            value={creatingListName}
                            onChange={(e) => setCreatingListName(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg mb-4 focus:outline-none focus:border-christmas-green text-sm"
                            required
                        />

                        <div className="flex gap-2">
                            <button 
                                type="button" 
                                onClick={() => setIsCreating(false)}
                                className="flex-1 py-2 text-gray-500 text-sm hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="flex-1 py-2 bg-christmas-green text-white rounded shadow-sm hover:bg-green-800 text-sm font-bold"
                            >
                                Add
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Existing Lists */}
            {loading && appData.lists.length === 0 ? (
                 <div className="col-span-full text-center py-10 text-gray-500">
                    <RefreshCw className="animate-spin inline-block mb-2" /> Loading...
                 </div>
            ) : (
                appData.lists.map(list => {
                    const isMyList = list.owner.toLowerCase() === currentUser.toLowerCase() && currentUser !== '';
                    return (
                        <div 
                            key={list.id}
                            onClick={() => { setActiveListId(list.id); setView('LIST'); }}
                            className={`
                                relative bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer border-t-4 
                                ${isMyList ? 'border-christmas-gold' : 'border-christmas-red'}
                                group
                            `}
                        >
                            <div className="absolute top-4 right-4 text-gray-200 group-hover:text-christmas-red/20 transition">
                                <Gift size={40} />
                            </div>
                            <h3 className="font-bold text-xl text-gray-800 mb-1">{list.owner}</h3>
                            <p className="text-gray-500 text-sm mb-4">
                                {list.items.length} {list.items.length === 1 ? 'gift' : 'gifts'} listed
                            </p>
                            
                            <div className="flex items-center text-sm font-medium text-blue-600 group-hover:underline">
                                {isMyList ? 'Manage my list' : 'View wishlist'} <ArrowLeft className="rotate-180 ml-1" size={14} />
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    </div>
  );

  const renderActiveList = () => {
    const activeList = appData.lists.find(l => l.id === activeListId);
    if (!activeList) return null;

    const isOwner = currentUser === activeList.owner;

    return (
      <div className="max-w-3xl mx-auto p-4 pb-20 animate-fade-in">
        <button 
            onClick={() => { setView('HOME'); setActiveListId(null); loadData(); }}
            className="flex items-center gap-2 text-gray-600 hover:text-christmas-red mb-6 transition"
        >
            <ArrowLeft size={18} /> Back to all lists
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="bg-christmas-green p-6 text-white relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold flex items-center gap-3">
                        {activeList.owner}'s Wishlist
                        {isOwner && <span className="bg-christmas-gold text-christmas-green text-xs px-2 py-1 rounded-full uppercase tracking-wider font-bold shadow-sm">Me</span>}
                    </h2>

                    <p className="text-green-100 opacity-90 mt-1">
                        {isOwner ? "Add things you'd love to receive!" : `Pick something special for ${activeList.owner}.`}
                    </p>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-6">
                {/* Add Item Form */}
                <div className="mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-inner">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Plus size={16} /> Add a Gift Idea
                    </h3>
                    <form onSubmit={handleAddItem} className="space-y-3">
                        <div className="flex flex-col md:flex-row gap-3">
                            <input
                                type="text"
                                placeholder="Gift Name (e.g. Lego Set)"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                className="flex-[2] px-4 py-2 border rounded-lg focus:ring-2 focus:ring-christmas-green/20 focus:outline-none"
                                required
                            />
                             <input
                                type="text"
                                placeholder="Store (Target, Amazon...)"
                                value={newItemStore}
                                onChange={(e) => setNewItemStore(e.target.value)}
                                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-christmas-green/20 focus:outline-none"
                            />
                        </div>
                        <div className="flex flex-col md:flex-row gap-3">
                            <input
                                type="text"
                                placeholder="Price (e.g. $25)"
                                value={newItemPrice}
                                onChange={(e) => setNewItemPrice(e.target.value)}
                                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-christmas-green/20 focus:outline-none"
                            />
                            <input
                                type="text"
                                placeholder="Link (optional)"
                                value={newItemLink}
                                onChange={(e) => setNewItemLink(e.target.value)}
                                className="flex-[2] px-4 py-2 border rounded-lg focus:ring-2 focus:ring-christmas-green/20 focus:outline-none"
                            />
                        </div>
                        <input
                            type="text"
                            placeholder="Notes (Size, color, quantity...)"
                            value={newItemNotes}
                            onChange={(e) => setNewItemNotes(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-christmas-green/20 focus:outline-none"
                        />
                        <div className="flex flex-wrap gap-4 pt-2">
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={newItemBF} 
                                    onChange={(e) => setNewItemBF(e.target.checked)}
                                    className="accent-christmas-red w-4 h-4"
                                />
                                <span className="flex items-center gap-1"><Tag size={14} /> Black Friday Deal</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={newItemUrgent} 
                                    onChange={(e) => setNewItemUrgent(e.target.checked)}
                                    className="accent-christmas-red w-4 h-4"
                                />
                                <span className="flex items-center gap-1"><Clock size={14} /> Time Sensitive</span>
                            </label>
                        </div>
                        <div className="pt-2">
                             <button
                                type="submit"
                                disabled={!newItemName}
                                className="w-full bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition font-bold disabled:opacity-50"
                            >
                                Add Gift
                            </button>
                        </div>
                    </form>
                </div>

                {/* List Items */}
                <div className="space-y-3">
                    {activeList.items.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            No gifts on this list yet. Add one above!
                        </div>
                    ) : (
                        activeList.items.map((item) => {
                            const isClaimed = !!item.claimedBy;
                            const claimedByMe = item.claimedBy === currentUser;
                            
                            return (
                                <div 
                                    key={item.id} 
                                    className={`
                                        group flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg border transition-all
                                        ${isClaimed && !isOwner 
                                            ? 'bg-gray-50 border-gray-200' 
                                            : 'bg-white border-gray-100 hover:border-christmas-red hover:shadow-sm'}
                                    `}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div className="flex flex-col">
                                                <h3 className={`font-medium text-lg flex items-center gap-2 flex-wrap ${isClaimed && !isOwner ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                    {item.name}
                                                    {item.isBlackFriday && <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Tag size={10} /> Black Friday</span>}
                                                    {item.isTimeSensitive && <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Clock size={10} /> Urgent</span>}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
                                                    {item.store && (
                                                        <span className="flex items-center gap-1"><ShoppingBag size={12} /> {item.store}</span>
                                                    )}
                                                    {item.price && (
                                                        <span className="font-semibold text-green-700">{item.price}</span>
                                                    )}
                                                </div>
                                                {item.notes && (
                                                    <p className="text-xs text-gray-500 mt-1 italic">{item.notes}</p>
                                                )}
                                            </div>

                                            {isOwner && (
                                                <button 
                                                    onClick={() => handleDeleteItem(item.id)}
                                                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                                                    title="Remove Item"
                                                >
                                                    <Trash size={16} />
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-3 mt-2">
                                            {item.link && (
                                                <a 
                                                    href={item.link} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="text-xs flex items-center gap-1 text-blue-500 hover:underline border border-blue-200 px-2 py-0.5 rounded"
                                                >
                                                    View Link <ExternalLink size={10} />
                                                </a>
                                            )}
                                            
                                            {!isOwner && isClaimed && (
                                                <span className="text-xs font-bold text-christmas-red bg-red-50 px-2 py-1 rounded border border-red-100">
                                                    Taken by {claimedByMe ? "You" : item.claimedBy}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {!isOwner && (
                                        <div className="flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 mt-2 md:mt-0">
                                            <button
                                                onClick={() => handleToggleClaim(activeList.id, item.id)}
                                                disabled={isClaimed && !claimedByMe}
                                                className={`
                                                    w-full md:w-auto px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition whitespace-nowrap
                                                    ${claimedByMe
                                                        ? 'bg-christmas-green text-white hover:bg-green-800'
                                                        : isClaimed
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : 'bg-white border-2 border-christmas-red text-christmas-red hover:bg-red-50'
                                                    }
                                                `}
                                            >
                                                {claimedByMe ? (
                                                    <> <Check size={14} /> Unclaim </>
                                                ) : isClaimed ? (
                                                    'Claimed'
                                                ) : (
                                                    <> <Heart size={14} /> Claim (I bought this) </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
      </div>
    );
  };

  const renderMyClaims = () => {
    // Get all items claimed by current user across all lists
    const myClaimedItems: Array<{ item: GiftItem; listOwner: string; listId: string }> = [];

    appData.lists.forEach(list => {
      list.items.forEach(item => {
        if (item.claimedBy === currentUser) {
          myClaimedItems.push({ item, listOwner: list.owner, listId: list.id });
        }
      });
    });

    const purchasedCount = myClaimedItems.filter(({ item }) => item.isPurchased).length;

    return (
      <div className="max-w-3xl mx-auto p-4 pb-20 animate-fade-in">
        <button
          onClick={() => { setView('HOME'); loadData(); }}
          className="flex items-center gap-2 text-gray-600 hover:text-christmas-red mb-6 transition"
        >
          <ArrowLeft size={18} /> Back to all lists
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold text-christmas-green flex items-center gap-2">
              <ShoppingBag size={32} /> My Shopping List
            </h2>
            <div className="text-sm text-gray-600">
              {purchasedCount} of {myClaimedItems.length} purchased
            </div>
          </div>

          {myClaimedItems.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ShoppingBag size={48} className="mx-auto mb-3 opacity-30" />
              <p>You haven't claimed any gifts yet.</p>
              <p className="text-sm mt-2">Go to someone's wishlist and claim gifts you plan to buy!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myClaimedItems.map(({ item, listOwner, listId }) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border transition ${
                    item.isPurchased
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200 hover:border-christmas-green'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.isPurchased || false}
                    onChange={() => handleTogglePurchased(listId, item.id)}
                    className="mt-1 w-5 h-5 rounded accent-christmas-green cursor-pointer"
                  />

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className={`font-semibold text-lg ${item.isPurchased ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">For: <span className="font-medium text-christmas-red">{listOwner}</span></p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                          {item.store && <span className="flex items-center gap-1"><ShoppingBag size={12} /> {item.store}</span>}
                          {item.price && <span className="font-semibold text-green-700">{item.price}</span>}
                        </div>

                        {item.notes && <p className="text-xs text-gray-500 mt-1 italic">{item.notes}</p>}
                      </div>

                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs flex items-center gap-1 text-blue-500 hover:underline border border-blue-200 px-2 py-1 rounded whitespace-nowrap"
                        >
                          Link <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStatus = () => (
    <div className="fixed bottom-2 right-2 flex items-center gap-1.5 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border border-gray-200 text-xs font-medium text-gray-500 z-50">
        {syncStatus === 'SYNCED' && <><Cloud size={12} className="text-green-500" /> Online Mode</>}
        {syncStatus === 'SYNCING' && <><RefreshCw size={12} className="animate-spin text-blue-500" /> Saving...</>}
        {syncStatus === 'LOCAL' && <><CloudOff size={12} className="text-orange-500" /> Local Mode (Sync Failed)</>}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0EAD6] font-sans pb-10 relative">
      <Snowflakes show={showCelebration} onComplete={() => setShowCelebration(false)} />
      {renderHeader()}
      {renderSyncModal()}
      {renderHelpModal()}
      {renderAlertModal()}
      {view === 'HOME' && renderHome()}
      {view === 'LIST' && renderActiveList()}
      {view === 'MY_CLAIMS' && renderMyClaims()}
      {renderStatus()}
    </div>
  );
}

export default App;
