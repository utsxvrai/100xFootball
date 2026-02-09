import React from 'react';
import Modal from './Modal';

const LeaderboardModal = ({ show, onClose, leaderboard }) => {
  return (
    <Modal title="Global Leaders" show={show} onClose={onClose}>
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
  );
};

export default LeaderboardModal;
