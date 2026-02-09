import React from 'react';
import Tile from './Tile';

const GameGrid = ({ tiles, onClaim, loadingTileId, profiles }) => {
  const vibrantColors = [
    '#22c55e', '#3b82f6', '#ef4444', '#eab308', '#a855f7', 
    '#ec4899', '#f97316', '#06b6d4', '#6366f1', '#f43f5e',
    '#10b981', '#fbbf24', '#f87171', '#818cf8', '#fb7185'
  ];

  return (
    <main className="w-full flex items-center justify-center p-4 md:p-8 bg-black">
      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 w-full max-w-[1400px] bg-white/[0.02] p-4 rounded-xl border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.05)] backdrop-blur-sm">
        {tiles.map((tile, index) => (
          <Tile
            key={tile.id || tile.tile_index}
            tile={tile}
            onClaim={onClaim}
            isClaimed={!!tile.claimed_by}
            loadingTileId={loadingTileId}
            claimant={profiles[tile.claimed_by]}
            frontColor={vibrantColors[index % vibrantColors.length]}
          />
        ))}
      </div>
    </main>
  );
};

export default GameGrid;
