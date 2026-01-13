import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const ActionModal = ({ isOpen, onClose, title, children, footer }) => {
    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
            <div
                className="bg-gray-100 dark:bg-slate-800 shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] scale-100 animate-in zoom-in-95 duration-200"
                style={{ backgroundColor: '#f3f4f6', border: '2px solid #0CA9A7', borderRadius: '12px' }}
            >
                {/* Header */}
                <div
                    className="relative flex items-center justify-center border-b"
                    style={{ backgroundColor: '#0CA9A7', color: '#FFFFFF', borderBottomColor: '#087876', padding: '20px 0' }}
                >
                    <h2 className="text-lg font-bold font-heading text-center" style={{ color: '#FFFFFF', lineHeight: 1 }}>
                        {title}
                    </h2>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {children}
                </div>

                {/* Footer (Optional) */}
                {footer && (
                    <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-slate-900/50 flex justify-end gap-2">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default ActionModal;
