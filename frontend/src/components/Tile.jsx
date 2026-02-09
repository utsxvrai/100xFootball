import React from 'react';

const Tile = ({ tile, onClaim, isClaimed, loadingTileId }) => {
  const handleClick = () => {
    if (!isClaimed) {
      onClaim(tile);
    }
  };

  return (
    <div 
      className="relative w-full aspect-square group perspective-1000 cursor-pointer"
      onClick={handleClick}
    >
      <div 
        className={`relative w-full h-full text-center transition-transform duration-700 preserve-3d ${
          isClaimed ? 'rotate-y-180' : 'hover:scale-105 group-hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]'
        }`}
      >
        {/* FRONT: Unclaimed */}
        <div className={`absolute w-full h-full backface-hidden rounded-md border border-gray-700 bg-gray-800 flex items-center justify-center overflow-hidden transition-all ${loadingTileId === tile.id ? 'opacity-50 grayscale' : ''}`}>
          <div className="w-full h-full bg-gradient-to-br from-green-500/10 to-transparent absolute top-0 left-0"></div>
          {loadingTileId === tile.id ? (
            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <span className="text-gray-600 text-xl font-bold opacity-30 select-none">?</span>
          )}
        </div>

        {/* BACK: Claimed */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-md border border-green-500 bg-gray-900 overflow-hidden flex flex-col p-1">
          <div className="relative flex-1 bg-gray-800 rounded mb-1 overflow-hidden">
             {tile.image_url ? (
               <img src={tile.image_url} alt={tile.name} className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full flex items-center justify-center bg-gray-700 text-xs">No Image</div>
             )}
             <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-[10px] py-0.5 px-1 truncate font-medium">
                {tile.name}
             </div>
          </div>
          
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-green-400">{tile.overall}</span>
            <span className="text-xs grayscale-[0.5]" title={tile.nationality}>
              {/* Mock flag or code if available, otherwise just text */}
              ⚽
            </span>
          </div>
        </div>
      </div>
      
      {isClaimed && (
        <div className="absolute inset-0 z-10 cursor-not-allowed"></div>
      )}
    </div>
  );
};

export default Tile;
