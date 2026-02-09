import React from 'react';
import Modal from './Modal';

const JoinModal = ({
    show,
    usernameInput,
    setUsernameInput,
    selectedColor,
    setSelectedColor,
    colors,
    onJoin
}) => {
    return (
        <Modal title="Join the Field" show={show} onClose={() => { }}>
            <p className="text-gray-400 mb-6 text-sm">Welcome to 100xFootball. Claim tiles, build your squad, and top the leaderboard.</p>
            <form onSubmit={onJoin} className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Username</label>
                    <input
                        type="text"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 transition-colors text-white placeholder:text-gray-600"
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
    );
};

export default JoinModal;
