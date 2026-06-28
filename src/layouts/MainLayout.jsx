import React, { useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';

const MainLayout = () => {
    const [searchTerm, setSearchTerm] = React.useState('');
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-50 via-sage-50 to-stone-100 flex flex-col font-sans">
            <nav ref={navRef} className="sticky top-0 z-50 border-b border-stone-200/50 bg-stone-50/80 backdrop-blur-2xl shadow-sm transition-all duration-300">
                <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center min-h-16 md:min-h-20 gap-3 sm:gap-5">
                        <Link to="/" className="anime-nav-item opacity-0 flex-shrink-0 flex items-center gap-2.5 sm:gap-3 group">
                            <img src="/Utility.png" alt="UtilityBox Logo" className="w-10 h-10 md:w-12 md:h-12 rounded-2xl shadow-lg group-hover:shadow-sage-500/30 transition-all duration-300 object-cover group-hover:-rotate-3 group-hover:scale-105" />
                            <span className="font-black text-lg sm:text-xl md:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-sage-900 via-sage-700 to-stone-600 tracking-tight">
                                UtilityBox
                            </span>
                        </Link>

                        <div className="anime-nav-item opacity-0 hidden sm:flex flex-1 max-w-2xl mx-auto transform transition-all">
                            <div className="relative w-full group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-stone-400 group-focus-within:text-sage-600 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search tools: PDF, image, JSON, URL..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 text-base border border-stone-200 rounded-2xl focus:outline-none focus:border-sage-500 focus:ring-4 focus:ring-sage-200 transition-all duration-200 bg-white/90 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                                />
                            </div>
                        </div>

                    </div>
                </div>

                <div className="sm:hidden px-4 pb-3 pt-1 bg-stone-50/70 backdrop-blur-xl">
                    <div className="relative w-full group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-stone-400 group-focus-within:text-sage-600 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search tools..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 text-sm border border-stone-200 rounded-2xl focus:outline-none focus:border-sage-500 focus:ring-4 focus:ring-sage-200 bg-white/90 focus:bg-white shadow-sm hover:shadow-md"
                        />
                    </div>
                </div>
            </nav>

            <main className="flex-1 w-full relative">
                <Outlet context={{ searchTerm, setSearchTerm }} />
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
