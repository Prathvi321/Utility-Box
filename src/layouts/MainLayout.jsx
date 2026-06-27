import React, { useEffect, useRef, useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Search, Sparkles } from 'lucide-react';

const MainLayout = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const navRef = useRef(null);

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

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eef2ff,transparent_34rem),linear-gradient(180deg,#f8fafc_0%,#ffffff_42%,#f8fafc_100%)] flex flex-col font-sans">
            <nav ref={navRef} className="sticky top-0 z-50 border-b border-white/70 bg-white/75 backdrop-blur-2xl shadow-sm transition-all duration-300">
                <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center min-h-16 md:min-h-20 gap-3 sm:gap-5">
                        <Link to="/" className="anime-nav-item opacity-0 flex-shrink-0 flex items-center gap-2.5 sm:gap-3 group">
                            <img src="/Utility.png" alt="UtilityBox Logo" className="w-10 h-10 md:w-12 md:h-12 rounded-2xl shadow-lg group-hover:shadow-indigo-500/30 transition-all duration-300 object-cover group-hover:-rotate-3 group-hover:scale-105" />
                            <span className="font-black text-lg sm:text-xl md:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-gray-950 via-indigo-900 to-gray-700 tracking-tight">
                                UtilityBox
                            </span>
                        </Link>

                        <div className="anime-nav-item opacity-0 hidden sm:flex flex-1 max-w-2xl mx-auto transform transition-all">
                            <div className="relative w-full group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search tools: PDF, image, JSON, URL..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 text-base border border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 bg-white/80 hover:bg-white focus:bg-white shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="anime-nav-item opacity-0 hidden md:inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-indigo-100 bg-indigo-50/80 text-indigo-700 font-black text-sm">
                            <Sparkles className="w-4 h-4" /> Browser tools
                        </div>
                    </div>
                </div>

                <div className="sm:hidden px-4 pb-3 pt-1 bg-white/70 backdrop-blur-xl">
                    <div className="relative w-full group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search tools..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 bg-white/90 focus:bg-white shadow-inner"
                        />
                    </div>
                </div>
            </nav>

            <main className="flex-1 w-full relative">
                <Outlet context={{ searchTerm, setSearchTerm }} />
            </main>

            <footer className="bg-white/80 backdrop-blur-xl border-t border-gray-200 py-8 mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm font-semibold">
                    &copy; {new Date().getFullYear()} UtilityBox. Fast, responsive tools for everyday tasks.
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
