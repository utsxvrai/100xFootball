import React from 'react';
import Tile from './Tile';

const GameGrid = ({ tiles, onClaim, loadingTileId }) => {
  return (
    <main className="max-w-[1000px] mx-auto p-4 md:p-8">
      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 md:gap-3 bg-gray-900/50 p-4 rounded-xl border border-gray-800 shadow-2xl backdrop-blur-sm">
        {tiles.map((tile) => (
          <Tile
            key={tile.id || tile.tile_index}
            tile={tile}
            onClaim={onClaim}
            isClaimed={!!tile.claimed_by}
            loadingTileId={loadingTileId}
          />
        ))}
      </div>
    </main>
  );
};

export default GameGrid;
