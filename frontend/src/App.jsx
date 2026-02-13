import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import GameGrid from './components/GameGrid';
import Modal from './components/Modal';
import JoinModal from './components/JoinModal';
import RulesModal from './components/RulesModal';
import LeaderboardModal from './components/LeaderboardModal';
import { supabase } from './lib/supabase';
import { socket } from './lib/socket';


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

    socket.on('tileUpdate', (payload) => {
      if (handleRealtimeUpdateRef.current) {
        handleRealtimeUpdateRef.current(payload);
      }
    });

    socket.on('boardReset', () => {
      fetchTiles();
    });

    return () => {
      socket.off('tileUpdate');
      socket.off('boardReset');
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
    const { eventType, new: newTile, profile } = payload;
    
    if (eventType === 'UPDATE' || eventType === 'INSERT') {
      // Functional update to ensure we use latest state
      setTiles((prev) => {
        // If tile already has same claimed_by, don't trigger state change to avoid animation reset
        const existingTile = prev.find(t => t.id === newTile.id);
        if (existingTile && existingTile.claimed_by === newTile.claimed_by) return prev;
        
        return prev.map(t => t.id === newTile.id ? { ...t, ...newTile } : t);
      });
      
      // Update profile map and last claimed info if profile data is provided
      if (profile) {
        setProfiles(prev => ({ ...prev, [profile.id]: profile }));
        setLastClaimedInfo({
          playerScore: newTile.overall,
          playerName: newTile.name,
          username: profile.username,
          userColor: profile.color,
          time: newTile.claimed_at
        });
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

  const handleTileClaim = async (targetTile) => {
    if (!isLoggedIn) {
      setShowRules(true);
      return;
    }

    if (cooldownTime > 0) return;
    if (targetTile.claimed_by || loadingTileId) return;

    setLoadingTileId(targetTile.id);
    
    // Optimistic UI update
    setTiles(prev => prev.map(t => 
      t.id === targetTile.id ? { ...t, claimed_by: userId, claimed_at: new Date().toISOString() } : t
    ));

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tiles/${targetTile.id}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to claim tile');
      }
      
      // Update cooldown based on backend response
      const endTime = new Date(result.cooldown_until).toISOString();
      localStorage.setItem('cooldownEndTime', endTime);
      const remaining = Math.max(0, Math.floor((new Date(endTime) - new Date()) / 1000));
      setCooldownTime(remaining);
      
    } catch (err) {
      console.error('Claim failed:', err.message);
      // Rollback optimistic update
      setTiles(prev => prev.map(t => 
        t.id === targetTile.id ? { ...t, claimed_by: null, claimed_at: null } : t
      ));
      alert(err.message);
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

      {/* Modals Refactored out of App.jsx */}
      {!isInitializing && !isLoggedIn && (
        <JoinModal 
          show={true}
          usernameInput={inputUsername}
          setUsernameInput={setInputUsername}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          colors={colors}
          onJoin={handleJoin}
        />
      )}

      <RulesModal 
        show={showRules} 
        onClose={() => setShowRules(false)} 
      />

      <LeaderboardModal 
        show={showLeaderboard} 
        onClose={() => setShowLeaderboard(false)} 
        leaderboard={leaderboard}
      />
    </div>
  );
}

export default App;
