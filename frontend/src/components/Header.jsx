import React from 'react';

const Header = ({ lastClaimedInfo, onRulesClick, onLeaderboardClick, username, resetTimer, cooldownTime }) => {
    return (
        <header className="bg-black/95 backdrop-blur-xl border-b-[1.5px] border-white/20 p-4 flex flex-col md:flex-row items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-red-500 bg-clip-text text-transparent">
                    100xFootball
                </h1>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex flex-col items-end">
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Global Reset In</div>
                    <div className="text-lg font-mono text-yellow-500">{resetTimer}</div>
                </div>

                {cooldownTime > 0 && (
                    <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-xs font-bold animate-pulse">
                        COOLDOWN: {Math.floor(cooldownTime / 60)}:{(cooldownTime % 60).toString().padStart(2, '0')}
                    </div>
                )}

                {lastClaimedInfo && (
                    <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full border border-white/10 animate-pulse">
                        <span className="text-sm text-gray-500">Live Claim:</span>
                        <div className="flex items-center gap-2">
                            <span className="font-bold whitespace-nowrap" style={{ color: lastClaimedInfo.userColor }}>{lastClaimedInfo.username}</span>
                            <span className="text-gray-600">got</span>
                            <span className="text-green-500 font-bold">+{lastClaimedInfo.playerScore}</span>
                        </div>
                        <span className="text-xs text-gray-600 uppercase tracking-tighter">
                            {new Date(lastClaimedInfo.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <button
                        onClick={onRulesClick}
                        className="text-sm px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-all text-gray-300 hover:text-white"
                    >
                        Rules
                    </button>
                    <button
                        onClick={onLeaderboardClick}
                        className="text-sm px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-all text-gray-300 hover:text-white"
                    >
                        Leaderboard
                    </button>
                    <div className="h-4 w-[1px] bg-white/10 ml-2"></div>
                    <span className="text-sm font-semibold text-gray-400 ml-2 truncate max-w-[100px]">
                        {username || 'Guest'}
                    </span>
                </div>
            </div>
        </header>
    );
};

export default Header;
