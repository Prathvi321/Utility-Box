import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

const AiAgentFab = () => {
    const location = useLocation();

    // Hide the floating button if we are already on the AI Chat page
    if (location.pathname === '/ai-chat') {
        return null;
    }

    return (
        <Link
            to="/ai-chat"
            className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-sage-900 to-sage-600 hover:from-sage-800 hover:to-sage-500 text-white rounded-full shadow-[0_8px_30px_rgba(123,150,105,0.45)] hover:shadow-[0_12px_40px_rgba(123,150,105,0.6)] border border-sage-500/20 transition-all duration-300 hover:scale-110 active:scale-95 group focus:outline-none focus:ring-4 focus:ring-sage-200"
            title="Chat with AI Agent"
        >
            {/* Glowing outer ring */}
            <span className="absolute inset-0 rounded-full bg-sage-500/30 animate-ping group-hover:animate-none opacity-75" />
            
            {/* Main Sparkles Icon */}
            <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300 relative z-10" />
            
            {/* Micro-tooltip */}
            <span className="absolute right-16 bg-stone-900/95 text-white text-xs font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap shadow-md pointer-events-none border border-stone-800 backdrop-blur-sm">
                Ask AI Assistant
            </span>
        </Link>
    );
};

export default AiAgentFab;
