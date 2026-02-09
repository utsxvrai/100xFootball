import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import GameGrid from './components/GameGrid';
import Modal from './components/Modal';
import { supabase } from './lib/supabase';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState(null);
  const [inputUsername, setInputUsername] = useState('');
  const [selectedColor, setSelectedColor] = useState('#22c55e'); // Default green
  
  const [tiles, setTiles] = useState([]);
  const [profiles, setProfiles] = useState({}); // { userId: { username, color } }
  const [lastClaimedInfo, setLastClaimedInfo] = useState(null);
  const [loadingTileId, setLoadingTileId] = useState(null);
  const [cooldownTime, setCooldownTime] = useState(0); // in seconds
  const [resetTimer, setResetTimer] = useState('00:00:00');

  const colors = [
    '#22c55e', '#3b82f6', '#ef4444', '#eab308', '#a855f7', 
    '#ec4899', '#f97316', '#06b6d4', '#6366f1', '#f43f5e'
  ];
  
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Refs for real-time handlers to avoid stale closures
  const handleRealtimeUpdateRef = useRef();

  // 1. Initial Data Fetch & Real-time Subscription
  useEffect(() => {
    const initialize = async () => {
      await fetchTiles();
      await fetchProfiles();
      await checkSession();
      setIsInitializing(false);
    };
    initialize();

    // 24h Reset Timer logic
    const timerInterval = setInterval(() => {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setUTCHours(24, 0, 0, 0);
      const diff = tomorrow - now;
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      
      setResetTimer(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      
      // If timer hits zero, refresh tiles (optimistic)
      if (hours === 0 && mins === 0 && secs === 0) fetchTiles();
    }, 1000);

    // Cooldown ticker
    const cooldownInterval = setInterval(() => {
      const endTime = localStorage.getItem('cooldownEndTime');
      if (endTime) {
        const remaining = Math.max(0, Math.floor((new Date(endTime) - new Date()) / 1000));
        setCooldownTime(remaining);
        if (remaining === 0) localStorage.removeItem('cooldownEndTime');
      } else {
        setCooldownTime(0);
      }
    }, 1000);

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'footballer_tiles',
        },
        (payload) => {
          if (handleRealtimeUpdateRef.current) {
            handleRealtimeUpdateRef.current(payload);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearInterval(timerInterval);
      clearInterval(cooldownInterval);
    };
  }, []);

  const fetchTiles = async () => {
    const { data, error } = await supabase
      .from('footballer_tiles')
      .select('*')
      .order('tile_index', { ascending: true });

    if (error) {
      console.error('Error fetching tiles:', error);
    } else {
      setTiles(data);
    }
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, color');

    if (error) {
      console.error('Error fetching profiles:', error);
    } else {
      const profileMap = data.reduce((acc, profile) => {
        acc[profile.id] = { username: profile.username, color: profile.color };
        return acc;
      }, {});
      setProfiles(profileMap);
    }
  };

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const currentUserId = session.user.id;
      setUserId(currentUserId);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username, color')
        .eq('id', currentUserId)
        .single();
      
      if (profile) {
        setUsername(profile.username);
        setSelectedColor(profile.color);
        setIsLoggedIn(true);
      }
    }
  };

  const handleRealtimeUpdate = async (payload) => {
    const { eventType, new: newTile, old: oldTile } = payload;
    
    if (eventType === 'UPDATE' || eventType === 'INSERT') {
      // Functional update to ensure we use latest state
      setTiles((prev) => {
        // If tile already has same claimed_by, don't trigger state change to avoid animation reset
        const existingTile = prev.find(t => t.id === newTile.id);
        if (existingTile && existingTile.claimed_by === newTile.claimed_by) return prev;
        
        return prev.map(t => t.id === newTile.id ? { ...t, ...newTile } : t);
      });
      
      // If a tile was just claimed, update header and refresh profiles to get the new one
      if (newTile.claimed_by && (!oldTile || !oldTile.claimed_by)) {
        const fetchAndSetClaimInfo = async () => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, color')
            .eq('id', newTile.claimed_by)
            .single();

          if (profile) {
            setProfiles(prev => ({ ...prev, [newTile.claimed_by]: profile }));
            setLastClaimedInfo({
              playerScore: newTile.overall,
              playerName: newTile.name,
              username: profile.username,
              userColor: profile.color,
              time: newTile.claimed_at
            });
          }
        };
        fetchAndSetClaimInfo();
      }
    }
  };

  // Sync ref with latest handler
  useEffect(() => {
    handleRealtimeUpdateRef.current = handleRealtimeUpdate;
  });

  // 2. Auth Flow
  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inputUsername.trim()) return;

    try {
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
      if (authError) throw authError;

      const currentUserId = authData.user.id;
      setUserId(currentUserId);

      // Store username in profile (Upsert)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: currentUserId, 
          username: inputUsername,
          color: selectedColor 
        });

      if (profileError) {
        if (profileError.code === '23505') {
          alert('Username is already taken! Please choose another.');
          return;
        }
        throw profileError;
      }

      setUsername(inputUsername);
      setProfiles(prev => ({ ...prev, [currentUserId]: { username: inputUsername, color: selectedColor } }));
      setIsLoggedIn(true);
      setShowRules(true); // Auto-show rules after joining
    } catch (err) {
      console.error('Join error:', err.message);
      alert('Failed to join game: ' + err.message);
    }
  };

  // 3. Claim Logic (Conflict-safe)
  const calculateCooldown = (overall) => {
    if (overall >= 90) return 60; // 1 min
    if (overall >= 80) return 120; // 2 mins
    if (overall >= 70) return 180; // 3 mins
    if (overall >= 60) return 240; // 4 mins
    return 300; // 5 mins
  };

  const handleTileClaim = async (targetTile) => {
    if (!isLoggedIn) {
      setShowRules(true);
      return;
    }

    if (cooldownTime > 0) return; // Silent block or show toast
    if (targetTile.claimed_by || loadingTileId) return;

    setLoadingTileId(targetTile.id);
    const now = new Date().toISOString();

    // Optimistic UI update
    setTiles(prev => prev.map(t => 
      t.id === targetTile.id ? { ...t, claimed_by: userId, claimed_at: now } : t
    ));

    try {
      const { error } = await supabase
        .from('footballer_tiles')
        .update({ 
          claimed_by: userId, 
          claimed_at: now 
        })
        .eq('id', targetTile.id)
        .is('claimed_by', null); // Conditional update

      if (error) throw error;
      
      // Set cooldown based on rating
      const seconds = calculateCooldown(targetTile.overall);
      const endTime = new Date(Date.now() + seconds * 1000).toISOString();
      localStorage.setItem('cooldownEndTime', endTime);
      setCooldownTime(seconds);
      
      // Success will be reinforced by real-time event
    } catch (err) {
      console.error('Claim failed:', err.message);
      // Rollback optimistic update
      setTiles(prev => prev.map(t => 
        t.id === targetTile.id ? { ...t, claimed_by: null, claimed_at: null } : t
      ));
      alert('Tile already taken or error occurred!');
    } finally {
      setLoadingTileId(null);
    }
  };

  // 4. Leaderboard Derivation
  const leaderboard = Object.entries(
    tiles.reduce((acc, tile) => {
      if (tile.claimed_by) {
        if (!acc[tile.claimed_by]) {
          acc[tile.claimed_by] = { 
            name: profiles[tile.claimed_by]?.username || (tile.claimed_by === userId ? username : 'Player'), 
            score: 0, 
            tilesCount: 0 
          };
        }
        acc[tile.claimed_by].score += tile.overall;
        acc[tile.claimed_by].tilesCount += 1;
      }
      return acc;
    }, {})
  )
  .map(([id, data]) => ({ id, ...data }))
  .sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-green-500/30">
      <Header 
        username={username}
        userColor={selectedColor}
        lastClaimedInfo={lastClaimedInfo}
        onRulesClick={() => setShowRules(true)}
        onLeaderboardClick={() => setShowLeaderboard(true)}
        resetTimer={resetTimer}
        cooldownTime={cooldownTime}
      />

      <GameGrid 
        tiles={tiles} 
        onClaim={handleTileClaim} 
        loadingTileId={loadingTileId}
        profiles={profiles}
      />

      {/* Login / Join Modal */}
      {!isInitializing && !isLoggedIn && (
        <Modal title="Join the Field" show={true} onClose={() => {}}>
          <p className="text-gray-400 mb-6 text-sm">Welcome to 100xFootball. Claim tiles, build your squad, and top the leaderboard.</p>
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Username</label>
              <input 
                type="text" 
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 transition-colors text-white placeholder:text-gray-600"
                placeholder="Manager Name"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Team Color</label>
              <div className="flex flex-wrap gap-2 mb-6">
                {colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <button 
              type="submit"
              className="w-full text-white font-bold py-3 rounded-lg transition-all shadow-lg active:scale-[0.98]"
              style={{ backgroundColor: selectedColor }}
            >
              Start Playing
            </button>
          </form>
        </Modal>
      )}

      <Modal title="How to Play 100xFootball" show={showRules} onClose={() => setShowRules(false)}>
        <div className="space-y-6 text-gray-400">
          <div className="bg-green-500/5 border border-green-500/10 p-4 rounded-lg">
            <h4 className="text-green-400 font-bold mb-1 flex items-center gap-2">
              <span className="text-lg">🎯</span> Your Objective
            </h4>
            <p className="text-sm">Build the highest-rated squad! Claim tiles to reveal world-class footballers and climb the global leaderboard.</p>
          </div>

          <ul className="space-y-4 text-sm">
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-green-500 font-bold border border-gray-700">1</div>
              <p><span className="text-white font-medium">Claim Tiles:</span> Click any grey tile to reveal a player. Once claimed, that player is YOURS until the next reset.</p>
            </li>
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-green-500 font-bold border border-gray-700">2</div>
              <p><span className="text-white font-medium">Manage Cooldowns:</span> High-rated players are powerful! The better the player, the longer your cooldown (1-5 minutes) before your next claim.</p>
            </li>
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-green-500 font-bold border border-gray-700">3</div>
              <p><span className="text-white font-medium">Master the Grid:</span> The board is randomized every reset. Memorization won't help—only speed and luck!</p>
            </li>
          </ul>

          <div className="pt-4 border-t border-gray-800 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-yellow-500 bg-yellow-500/5 p-2 rounded">
              <span>⏰</span>
              <span>The field resets every 24 hours (UTC Midnight) or when all 100 tiles are claimed.</span>
            </div>
          </div>

          <button 
            onClick={() => setShowRules(false)}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-all mt-2"
          >
            Got it, Let's Play!
          </button>
        </div>
      </Modal>

      {/* Leaderboard Modal */}
      <Modal title="Global Leaders" show={showLeaderboard} onClose={() => setShowLeaderboard(false)}>
        <div className="space-y-2">
          {leaderboard.length > 0 ? (
            leaderboard.map((user, idx) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 transition-all hover:bg-white/10">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-5 ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-orange-400' : 'text-gray-600'}`}>
                    #{idx + 1}
                  </span>
                  <span className="font-medium truncate max-w-[120px] text-gray-200">{user.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold text-sm">{user.score} pts</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-tighter">{user.tilesCount} tiles</div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8 text-sm italic">No players joined the field yet...</p>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default App;
