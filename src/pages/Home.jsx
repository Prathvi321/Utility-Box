import React, { useEffect, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { services } from '../utils/serviceData';
import { Sparkles, Search, MousePointerClick, Loader2, WifiOff } from 'lucide-react';

const colorClasses = {
    sage: { bg: 'bg-sage-100 border-sage-300 text-sage-600', btn: 'bg-sage-500 hover:bg-sage-600', shadow: 'hover:shadow-sage-200/50 hover:border-sage-300', ring: 'from-sage-500/20' },
    forest: { bg: 'bg-sage-50 border-sage-300 text-sage-700', btn: 'bg-sage-900 hover:bg-sage-800', shadow: 'hover:shadow-sage-300/50 hover:border-sage-700', ring: 'from-sage-900/20' },
    stone: { bg: 'bg-stone-100 border-stone-300 text-stone-600', btn: 'bg-stone-600 hover:bg-stone-700', shadow: 'hover:shadow-stone-200/50 hover:border-stone-300', ring: 'from-stone-500/20' },
    teal: { bg: 'bg-stone-100 border-stone-400 text-stone-600', btn: 'bg-stone-600 hover:bg-stone-700', shadow: 'hover:shadow-stone-200/50 hover:border-stone-400', ring: 'from-stone-600/20' },
    slate: { bg: 'bg-stone-50 border-stone-200 text-stone-700', btn: 'bg-stone-700 hover:bg-stone-800', shadow: 'hover:shadow-stone-300/50 hover:border-stone-600', ring: 'from-stone-700/20' },
    light: { bg: 'bg-sage-50 border-sage-200 text-sage-600', btn: 'bg-sage-500 hover:bg-sage-600', shadow: 'hover:shadow-sage-200/50 hover:border-sage-300', ring: 'from-sage-400/20' },
    muted: { bg: 'bg-stone-50 border-stone-300 text-stone-600', btn: 'bg-stone-500 hover:bg-stone-600', shadow: 'hover:shadow-stone-200/50 hover:border-stone-400', ring: 'from-stone-500/20' },
    natural: { bg: 'bg-sage-100 border-sage-300 text-sage-600', btn: 'bg-sage-600 hover:bg-sage-700', shadow: 'hover:shadow-sage-200/50 hover:border-sage-400', ring: 'from-sage-600/20' },
    dark: { bg: 'bg-sage-50 border-sage-900 text-sage-900', btn: 'bg-sage-900 hover:bg-sage-800', shadow: 'hover:shadow-sage-400/50 hover:border-sage-900', ring: 'from-sage-900/20' },
    // Legacy color mappings
    indigo: { bg: 'bg-sage-100 border-sage-300 text-sage-600', btn: 'bg-sage-500 hover:bg-sage-600', shadow: 'hover:shadow-sage-200/50 hover:border-sage-300', ring: 'from-sage-500/20' },
    green: { bg: 'bg-sage-100 border-sage-300 text-sage-600', btn: 'bg-sage-500 hover:bg-sage-600', shadow: 'hover:shadow-sage-200/50 hover:border-sage-300', ring: 'from-sage-500/20' },
    purple: { bg: 'bg-stone-100 border-stone-300 text-stone-600', btn: 'bg-stone-600 hover:bg-stone-700', shadow: 'hover:shadow-stone-200/50 hover:border-stone-300', ring: 'from-stone-500/20' },
    blue: { bg: 'bg-stone-100 border-stone-300 text-stone-600', btn: 'bg-stone-600 hover:bg-stone-700', shadow: 'hover:shadow-stone-200/50 hover:border-stone-300', ring: 'from-stone-500/20' },
    red: { bg: 'bg-sage-100 border-sage-300 text-sage-600', btn: 'bg-sage-500 hover:bg-sage-600', shadow: 'hover:shadow-sage-200/50 hover:border-sage-300', ring: 'from-sage-500/20' },
    pink: { bg: 'bg-stone-100 border-stone-300 text-stone-600', btn: 'bg-stone-600 hover:bg-stone-700', shadow: 'hover:shadow-stone-200/50 hover:border-stone-300', ring: 'from-stone-500/20' },
    cyan: { bg: 'bg-stone-100 border-stone-400 text-stone-600', btn: 'bg-stone-600 hover:bg-stone-700', shadow: 'hover:shadow-stone-200/50 hover:border-stone-400', ring: 'from-stone-600/20' },
    amber: { bg: 'bg-sage-100 border-sage-300 text-sage-600', btn: 'bg-sage-500 hover:bg-sage-600', shadow: 'hover:shadow-sage-200/50 hover:border-sage-300', ring: 'from-sage-500/20' },
    orange: { bg: 'bg-stone-100 border-stone-300 text-stone-600', btn: 'bg-stone-600 hover:bg-stone-700', shadow: 'hover:shadow-stone-200/50 hover:border-stone-300', ring: 'from-stone-500/20' },
};

const quickFilters = [
    { label: 'All', keyword: '' },
    { label: 'Images', keyword: 'image' },
    { label: 'PDF', keyword: 'pdf' },
    { label: 'Data', keyword: 'json' },
    { label: 'Web', keyword: 'url' },
];

const Home = () => {
    const { 
        searchTerm, 
        setSearchTerm, 
        searchMode, 
        aiMatches, 
        isAiSearching,
        triggerAiSearch,
        isOnline
    } = useOutletContext() || { 
        searchTerm: '', 
        setSearchTerm: () => {}, 
        searchMode: 'keyword', 
        aiMatches: [], 
        isAiSearching: false,
        triggerAiSearch: () => {},
        isOnline: true
    };
    
    const [activeFilter, setActiveFilter] = useState('');
    const gridRef = useRef(null);
    const servicesRef = useRef(null);

    const filteredServices = React.useMemo(() => {
        const term = searchTerm?.trim() || activeFilter;
        if (!term) return services;

        if (searchMode === 'ai') {
            // Filter by matching IDs from the Gemini Smart Search Netlify function
            return services.filter(service => aiMatches.includes(service.id));
        }

        const lowerTerm = term.toLowerCase();
        return services.filter(service => {
            const titleMatch = service.title.toLowerCase().includes(lowerTerm);
            const descMatch = service.description.toLowerCase().includes(lowerTerm);
            const keywordMatch = service.keywords.some(keyword =>
                keyword.toLowerCase().includes(lowerTerm) ||
                lowerTerm.includes(keyword.toLowerCase())
            );
            return titleMatch || descMatch || keywordMatch;
        });
    }, [searchTerm, activeFilter, searchMode, aiMatches]);

    useEffect(() => {
        const anime = window.anime;
        if (!anime || !gridRef.current) return;

        anime.remove(gridRef.current.querySelectorAll('.service-card'));
        anime({
            targets: gridRef.current.querySelectorAll('.service-card'),
            translateY: [28, 0],
            scale: [0.96, 1],
            opacity: [0, 1],
            delay: anime.stagger(55, { grid: [4, Math.ceil(filteredServices.length / 4)], from: 'first' }),
            duration: 620,
            easing: 'easeOutCubic',
        });
    }, [filteredServices]);

    const handleFilter = (keyword) => {
        setActiveFilter(keyword);
        setSearchTerm(keyword);
        servicesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const getColorClasses = (color) => colorClasses[color] || colorClasses.indigo;

    return (
        <div className="pb-20 md:pb-28 overflow-hidden">
            <section ref={servicesRef} className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-28 pt-4 sm:pt-6">
                
                {/* AI Searching State */}
                {isAiSearching ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-stone-50/50 backdrop-blur-sm rounded-[2.5rem] border border-stone-200/50 shadow-sm max-w-3xl mx-auto animate-pulse">
                        <Loader2 className="w-12 h-12 text-sage-600 animate-spin mb-4" />
                        <h3 className="text-xl font-bold text-stone-800">AI is analyzing your request...</h3>
                        <p className="text-sm text-stone-500 mt-2">Finding matching services for "{searchTerm}"</p>
                    </div>
                ) : (
                    <>
                        {filteredServices.length > 0 && (
                            <div ref={gridRef} className="grid grid-cols-1 min-[520px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                                {filteredServices.map((service) => {
                                    const colors = getColorClasses(service.color);
                                    const isServiceOffline = !isOnline && service.requiresInternet;
                                    return (
                                        <article key={service.id} className={`service-card opacity-0 group relative overflow-hidden bg-stone-50/80 backdrop-blur-xl rounded-[1.7rem] sm:rounded-[2rem] p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-2xl transition-all duration-300 border flex flex-col ${isServiceOffline ? 'border-red-200/50 opacity-80' : 'border-stone-200'} ${colors.shadow}`}>
                                            <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full bg-gradient-to-br ${colors.ring} to-transparent blur-xl group-hover:scale-125 transition-transform`} />
                                            {isServiceOffline && (
                                                <span className="absolute top-4 right-4 text-[10px] bg-red-500/10 border border-red-500/20 text-red-600 font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm z-10">
                                                    <WifiOff className="w-3 h-3" /> Offline
                                                </span>
                                            )}
                                            <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${isServiceOffline ? 'bg-red-50 text-red-400 border-red-100' : colors.bg} border transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm`}>
                                                {isServiceOffline ? <WifiOff className="w-7 h-7" strokeWidth={1.5} /> : <service.icon className="w-7 h-7" strokeWidth={1.5} />}
                                            </div>
                                            <h3 className="relative text-lg sm:text-xl font-black text-stone-900 mb-3 tracking-tight group-hover:text-sage-700 transition-colors">{service.title}</h3>
                                            <p className="relative text-sm sm:text-[15px] text-stone-600 mb-6 flex-grow leading-relaxed font-medium">{service.description}</p>
                                            <Link to={`/${service.id}`} className={`relative w-full flex items-center justify-center gap-2 px-5 py-3.5 ${isServiceOffline ? 'bg-stone-200 border border-stone-300 text-stone-500 hover:bg-stone-200 hover:shadow-none cursor-pointer' : colors.btn + ' text-white'} font-black rounded-2xl transition-all duration-300 text-sm shadow-lg group-hover:shadow-xl focus:ring-2 focus:ring-offset-2`}>
                                                {isServiceOffline ? 'Requires Internet' : 'Use Tool'}
                                                {isServiceOffline ? <WifiOff className="w-4 h-4" /> : <MousePointerClick className="w-4 h-4 group-hover:rotate-12 transition-transform" />}
                                            </Link>
                                        </article>
                                    );
                                })}
                            </div>
                        )}

                        {filteredServices.length === 0 && (
                            <div className="text-center py-20 sm:py-24 bg-stone-50/70 backdrop-blur-sm rounded-[2.5rem] border border-stone-200 shadow-sm mt-8 max-w-3xl mx-auto">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-stone-200">
                                    <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-stone-400" />
                                </div>
                                <p className="text-stone-900 text-2xl sm:text-3xl font-extrabold tracking-tight">
                                    {searchMode === 'ai' 
                                        ? "Service not available on our platform" 
                                        : "No tools found matching your search"}
                                </p>
                                <p className="text-stone-600 mt-4 mb-8 text-base sm:text-lg font-medium">
                                    {searchMode === 'ai' 
                                        ? "Gemini couldn't find a matching tool for your query. Try describing your goal differently." 
                                        : "Try searching with keywords, or ask our Smart AI Search to find tools."}
                                </p>
                                <div className="flex justify-center gap-3">
                                    {searchMode === 'keyword' && searchTerm.trim() && (
                                        <button 
                                            onClick={() => triggerAiSearch(searchTerm)}
                                            className="inline-flex items-center gap-2 px-6 py-3.5 bg-sage-900 hover:bg-sage-800 text-white font-bold rounded-2xl transition-all duration-300 shadow-xl shadow-stone-300 text-sm"
                                        >
                                            <Sparkles className="w-4 h-4 text-sage-300" />
                                            Ask AI Search
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleFilter('')} 
                                        className="inline-flex items-center gap-2 px-6 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 font-bold rounded-2xl transition-all duration-300 text-sm"
                                    >
                                        Clear Search
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </section>
        </div>
    );
};

export default Home;
