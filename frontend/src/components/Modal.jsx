import React from 'react';

const Modal = ({ title, show, onClose, children }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl transition-all duration-300">
      <div className="bg-[#050505] border-[2px] border-white/30 rounded-xl shadow-[0_0_50px_rgba(255,255,255,0.1)] w-full max-w-md overflow-hidden animate-modal-in">
        <div className="p-4 border-b-[1.5px] border-white/20 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/5 rounded transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
