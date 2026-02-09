import React, { useState, useEffect } from 'react';
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
  const [lastClaimedInfo, setLastClaimedInfo] = useState(null);
  const [loadingTileId, setLoadingTileId] = useState(null);

  const colors = [
    '#22c55e', '#3b82f6', '#ef4444', '#eab308', '#a855f7', 
    '#ec4899', '#f97316', '#06b6d4', '#6366f1', '#f43f5e'
  ];
  
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showRules, setShowRules] = useState(false);

  // 1. Initial Data Fetch & Real-time Subscription
  useEffect(() => {
    fetchTiles();

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
          handleRealtimeUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTiles = async () => {
    const { data, error } = await supabase
      .from('footballer_tiles')
      .select('*')
      .order('tile_index', { ascending: true });

    if (error) console.error('Error fetching tiles:', error);
    else setTiles(data);
  };

  const handleRealtimeUpdate = (payload) => {
    const { eventType, new: newTile, old: oldTile } = payload;
    
    if (eventType === 'UPDATE' || eventType === 'INSERT') {
      setTiles((prev) => prev.map(t => t.id === newTile.id ? { ...t, ...newTile } : t));
      
      // If a tile was just claimed, update header
      if (newTile.claimed_by && (!oldTile || !oldTile.claimed_by)) {
        setLastClaimedInfo({
          playerScore: newTile.overall,
          username: newTile.claimed_by === userId ? username : 'Someone', // Simplified: we'd need a join or user cache for full name
          time: newTile.claimed_at
        });
      }
    }
  };

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

      if (profileError) throw profileError;

      setUsername(inputUsername);
      setIsLoggedIn(true);
    } catch (err) {
      console.error('Join error:', err.message);
      alert('Failed to join game');
    }
  };

  // 3. Claim Logic (Conflict-safe)
  const handleTileClaim = async (targetTile) => {
    if (!isLoggedIn) {
      setShowRules(true);
      return;
    }

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
        if (!acc[tile.claimed_by]) acc[tile.claimed_by] = { name: 'Player', score: 0, tilesCount: 0 };
        acc[tile.claimed_by].score += tile.overall;
        acc[tile.claimed_by].tilesCount += 1;
        // Mocking name if it's current user
        if (tile.claimed_by === userId) acc[tile.claimed_by].name = username;
      }
      return acc;
    }, {})
  )
  .map(([id, data]) => ({ id, ...data }))
  .sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100 font-sans selection:bg-green-500/30">
      <Header 
        username={username}
        lastClaimedInfo={lastClaimedInfo}
        onRulesClick={() => setShowRules(true)}
        onLeaderboardClick={() => setShowLeaderboard(true)}
      />

      <GameGrid tiles={tiles} onClaim={handleTileClaim} loadingTileId={loadingTileId} />

      {/* Login / Join Modal */}
      {!isLoggedIn && (
        <Modal title="Join the Field" show={true} onClose={() => {}}>
          <p className="text-gray-400 mb-6 text-sm">Welcome to 100xFootball. Claim tiles, build your squad, and top the leaderboard.</p>
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Username</label>
              <input 
                type="text" 
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 transition-colors"
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

      {/* Rules Modal */}
      <Modal title="Game Rules" show={showRules} onClose={() => setShowRules(false)}>
        <ul className="space-y-4 text-gray-300 text-sm">
          <li className="flex gap-3">
            <span className="text-green-500 font-bold">1.</span>
            Click on any unclaimed (grey) tile to reveal a player and claim it.
          </li>
          <li className="flex gap-3">
            <span className="text-green-500 font-bold">2.</span>
            Each player has an overall score. Higher scores add more value to your team.
          </li>
          <li className="flex gap-3">
            <span className="text-green-500 font-bold">3.</span>
            Claiming a player puts you on temporary cooldown based on their rating.
          </li>
          <li className="flex gap-3">
             <span className="text-red-500 font-bold">!</span>
             Score is shown in the live header only. Tiles are for visual squads.
          </li>
        </ul>
      </Modal>

      {/* Leaderboard Modal */}
      <Modal title="Global Leaders" show={showLeaderboard} onClose={() => setShowLeaderboard(false)}>
        <div className="space-y-2">
          {leaderboard.length > 0 ? (
            leaderboard.map((user, idx) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-5 ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-orange-400' : 'text-gray-500'}`}>
                    #{idx + 1}
                  </span>
                  <span className="font-medium truncate max-w-[120px]">{user.name}</span>
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
