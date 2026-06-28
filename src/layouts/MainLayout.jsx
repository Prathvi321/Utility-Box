import React, { useEffect, useRef, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Search, Sparkles, Loader2, WifiOff } from 'lucide-react';

const MainLayout = () => {
     const [searchTerm, setSearchTerm] = useState('');
    const [searchMode, setSearchMode] = useState('keyword'); // 'keyword' or 'ai'
    const [aiMatches, setAiMatches] = useState([]);
    const [isAiSearching, setIsAiSearching] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    
    const navRef = useRef(null);
    const location = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

     useEffect(() => {
        const anime = window.anime;
        if (!anime || !navRef.current) return;

        anime({
            targets: navRef.current.querySelectorAll('.anime-nav-item'),
            translateY: [-14, 0],
            opacity: [0, 1],
            delay: anime.stagger(80),
            duration: 620,
            easing: 'easeOutExpo',
        });
    }, []);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Perform AI Smart Search on demand
     const triggerAiSearch = async (queryToSearch) => {
        const query = queryToSearch || searchTerm;
        if (!query.trim()) return;

        if (!isOnline) {
            setSearchMode('keyword');
            setAiMatches([]);
            return;
        }

        setSearchMode('ai');
        setIsAiSearching(true);
        try {
            const response = await fetch('/.netlify/functions/smart-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query })
            });
            if (response.ok) {
                const data = await response.json();
                setAiMatches(data.matches || []);
            } else {
                setAiMatches([]);
            }
        } catch (err) {
            console.error("Smart search error:", err);
            setAiMatches([]);
        } finally {
            setIsAiSearching(false);
        }
    };

    // When the user is typing, fallback immediately to standard keyword search
    const handleSearchInput = (value) => {
        setSearchTerm(value);
        if (searchMode === 'ai') {
            setSearchMode('keyword');
            setAiMatches([]);
        }
    };

    // Reset search when mode toggled to keyword
    const toggleSearchMode = () => {
        if (searchMode === 'ai') {
            setSearchMode('keyword');
            setAiMatches([]);
        } else {
            triggerAiSearch(searchTerm);
        }
    };

     return (
        <div className="min-h-screen bg-gradient-to-br from-stone-50 via-sage-50 to-stone-100 flex flex-col font-sans">
            {!isOnline && (
                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-center py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2 z-[60] shadow-md animate-slide-down">
                    <WifiOff className="w-4 h-4 text-red-100" />
                    <span>You are currently working offline. API-dependent services are disabled, but all local utilities remain fully operational.</span>
                </div>
            )}
            <nav ref={navRef} className="sticky top-0 z-50 border-b border-stone-200/50 bg-stone-50/80 backdrop-blur-2xl shadow-sm transition-all duration-300">
                <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center min-h-16 md:min-h-20 gap-3 sm:gap-5">
                        <Link to="/" className="anime-nav-item opacity-0 flex-shrink-0 flex items-center gap-2.5 sm:gap-3 group">
                            <img src="/Utility.png" alt="UtilityBox Logo" className="w-10 h-10 md:w-12 md:h-12 rounded-2xl shadow-lg group-hover:shadow-sage-500/30 transition-all duration-300 object-cover group-hover:-rotate-3 group-hover:scale-105" />
                            <span className="font-black text-lg sm:text-xl md:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-sage-900 via-sage-700 to-stone-600 tracking-tight">
                                UtilityBox
                            </span>
                        </Link>

                        {/* Desktop Search Bar */}
                        <div className="anime-nav-item opacity-0 hidden sm:flex flex-1 max-w-2xl mx-auto transform transition-all">
                            <div className="relative w-full group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    {isAiSearching ? (
                                        <Loader2 className="h-5 w-5 text-sage-600 animate-spin" />
                                    ) : (
                                        <Search className="h-5 w-5 text-stone-400 group-focus-within:text-sage-600 transition-colors" />
                                    )}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search tools: PDF, image, JSON, URL..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearchInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            triggerAiSearch(searchTerm);
                                        }
                                    }}
                                    className="w-full pl-11 pr-32 py-3 text-base border border-stone-200 rounded-2xl focus:outline-none focus:border-sage-500 focus:ring-4 focus:ring-sage-200 transition-all duration-200 bg-white/90 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                                />
                                 <div className="absolute inset-y-2 right-2 flex items-center">
                                    <button
                                        type="button"
                                        onClick={toggleSearchMode}
                                        disabled={!searchTerm.trim() || !isOnline}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1 border ${
                                            !isOnline
                                                ? 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed'
                                                : searchMode === 'ai'
                                                ? 'bg-sage-900 border-sage-950 text-white shadow-sm'
                                                : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed'
                                        }`}
                                        title={!isOnline ? "AI search is unavailable offline" : ""}
                                    >
                                        <Sparkles className={`w-3.5 h-3.5 ${searchMode === 'ai' ? 'animate-pulse text-sage-300' : ''}`} />
                                        <span>AI Search</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Mobile Search Bar */}
                <div className="sm:hidden px-4 pb-3 pt-1 bg-stone-50/70 backdrop-blur-xl">
                    <div className="relative w-full group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            {isAiSearching ? (
                                <Loader2 className="h-4 w-4 text-sage-600 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4 text-stone-400 group-focus-within:text-sage-600 transition-colors" />
                            )}
                        </div>
                        <input
                            type="text"
                            placeholder="Search tools..."
                            value={searchTerm}
                            onChange={(e) => handleSearchInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    triggerAiSearch(searchTerm);
                                }
                            }}
                            className="w-full pl-9 pr-24 py-2.5 text-sm border border-stone-200 rounded-2xl focus:outline-none focus:border-sage-500 focus:ring-4 focus:ring-sage-200 bg-white/90 focus:bg-white shadow-sm hover:shadow-md"
                        />
                        <div className="absolute inset-y-1.5 right-1.5 flex items-center">
                             <button
                                type="button"
                                onClick={toggleSearchMode}
                                disabled={!searchTerm.trim() || !isOnline}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all duration-300 flex items-center gap-0.5 border ${
                                    !isOnline
                                        ? 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed'
                                        : searchMode === 'ai'
                                        ? 'bg-sage-900 border-sage-950 text-white'
                                        : 'bg-stone-50 border-stone-200 text-stone-600 disabled:opacity-40'
                                }`}
                                title={!isOnline ? "AI search is unavailable offline" : ""}
                            >
                                <Sparkles className="w-3 h-3" />
                                <span>AI</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

             <main className="flex-1 w-full relative">
                <Outlet context={{ 
                    searchTerm, 
                    setSearchTerm, 
                    searchMode, 
                    setSearchMode, 
                    aiMatches, 
                    isAiSearching,
                    triggerAiSearch,
                    isOnline
                }} />
            </main>

            <footer className="bg-stone-50/80 backdrop-blur-xl border-t border-stone-200 py-8 mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center text-stone-600 text-sm font-semibold">
                    &copy; {new Date().getFullYear()} UtilityBox. Fast, responsive tools for everyday tasks.
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
