import React from 'react';

const Tile = ({ tile, onClaim, isClaimed, loadingTileId, claimant, frontColor }) => {
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
        className={`relative w-full h-full text-center transition-all duration-700 preserve-3d ${
          isClaimed ? 'rotate-y-180' : 'rotate-y-0 hover:scale-105 group-hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]'
        }`}
      >
        {/* FRONT: Unclaimed */}
        <div 
          className={`absolute w-full h-full backface-hidden rounded-md border-[1.5px] flex items-center justify-center overflow-hidden transition-all duration-300 ${loadingTileId === tile.id ? 'opacity-50 grayscale' : ''}`}
          style={{ 
            borderColor: `${frontColor}66`, 
            backgroundColor: '#050505',
            boxShadow: `0 0 10px ${frontColor}11`
          }}
        >
          <div 
            className="w-full h-full absolute top-0 left-0 transition-opacity" 
            style={{ backgroundImage: `radial-gradient(circle at center, ${frontColor}33 0%, transparent 70%)` }}
          ></div>
          {loadingTileId === tile.id ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <span className="text-white text-xl font-bold opacity-20 select-none drop-shadow-lg" style={{ color: frontColor }}>?</span>
          )}
        </div>

        {/* BACK: Claimed */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-md border-[1.5px] border-white/30 bg-black overflow-hidden flex flex-col p-1 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
          <div className="relative flex-1 bg-white/5 rounded mb-1 overflow-hidden">
              {tile.image_url ? (
                <img src={tile.image_url} alt={tile.name} className="w-full h-full object-cover grayscale-[20%] transition-all group-hover:grayscale-0" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/5 text-xs text-gray-500 italic">No Image</div>
              )}
             <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-[10px] py-0.5 px-1 truncate font-medium">
                {tile.name}
             </div>
          </div>
          
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-green-400">{tile.overall}</span>
            {claimant && (
              <span 
                className="text-[9px] font-bold truncate max-w-[50px] px-1 rounded bg-black/40"
                style={{ color: claimant.color }}
              >
                {claimant.username}
              </span>
            )}
            <span className="text-xs grayscale-[0.5]" title={tile.nationality}>
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
