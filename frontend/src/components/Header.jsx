import React from 'react';

const Header = ({ lastClaimedInfo, onRulesClick, onLeaderboardClick, username }) => {
  return (
    <header className="bg-gray-900 border-b border-gray-800 p-4 flex flex-col md:flex-row items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-4 mb-4 md:mb-0">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          100xFootball
        </h1>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6">
        {lastClaimedInfo && (
          <div className="flex items-center gap-4 bg-gray-800/50 px-4 py-2 rounded-full border border-gray-700 animate-pulse">
            <span className="text-sm text-gray-400">Live Claim:</span>
            <span className="font-bold text-green-400">+{lastClaimedInfo.playerScore}</span>
            <span className="text-sm font-medium">{lastClaimedInfo.username}</span>
            <span className="text-xs text-gray-500 uppercase tracking-tighter">
              {new Date(lastClaimedInfo.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button 
            onClick={onRulesClick}
            className="text-sm px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
          >
            Rules
          </button>
          <button 
            onClick={onLeaderboardClick}
            className="text-sm px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
          >
            Leaderboard
          </button>
          <div className="h-4 w-[1px] bg-gray-700 ml-2"></div>
          <span className="text-sm font-semibold text-gray-300 ml-2 truncate max-w-[100px]">
            {username || 'Guest'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
