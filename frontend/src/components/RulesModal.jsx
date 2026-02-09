import React from 'react';
import Modal from './Modal';

const RulesModal = ({ show, onClose }) => {
    return (
        <Modal title="How to Play 100xFootball" show={show} onClose={onClose}>
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
                        <p><span className="text-white font-medium">Manage Cooldowns:</span> High-rated players are powerful! The better the player, the longer your cooldown before your next claim.</p>
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
                    onClick={onClose}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-all mt-2"
                >
                    Got it, Let's Play!
                </button>
            </div>
        </Modal>
    );
};

export default RulesModal;
