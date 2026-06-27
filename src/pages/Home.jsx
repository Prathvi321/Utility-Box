import React, { useEffect, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { services } from '../utils/serviceData';
import { Sparkles, ArrowRight, Search, Layers3, MousePointerClick } from 'lucide-react';

const colorClasses = {
    indigo: { bg: 'bg-indigo-50 border-indigo-100 text-indigo-600', btn: 'bg-indigo-600 hover:bg-indigo-700', shadow: 'hover:shadow-indigo-200/50 hover:border-indigo-300', ring: 'from-indigo-500/20' },
    green: { bg: 'bg-green-50 border-green-100 text-green-600', btn: 'bg-green-600 hover:bg-green-700', shadow: 'hover:shadow-green-200/50 hover:border-green-300', ring: 'from-green-500/20' },
    purple: { bg: 'bg-purple-50 border-purple-100 text-purple-600', btn: 'bg-purple-600 hover:bg-purple-700', shadow: 'hover:shadow-purple-200/50 hover:border-purple-300', ring: 'from-purple-500/20' },
    blue: { bg: 'bg-blue-50 border-blue-100 text-blue-600', btn: 'bg-blue-600 hover:bg-blue-700', shadow: 'hover:shadow-blue-200/50 hover:border-blue-300', ring: 'from-blue-500/20' },
    red: { bg: 'bg-red-50 border-red-100 text-red-600', btn: 'bg-red-600 hover:bg-red-700', shadow: 'hover:shadow-red-200/50 hover:border-red-300', ring: 'from-red-500/20' },
    pink: { bg: 'bg-pink-50 border-pink-100 text-pink-600', btn: 'bg-pink-600 hover:bg-pink-700', shadow: 'hover:shadow-pink-200/50 hover:border-pink-300', ring: 'from-pink-500/20' },
    cyan: { bg: 'bg-cyan-50 border-cyan-100 text-cyan-600', btn: 'bg-cyan-600 hover:bg-cyan-700', shadow: 'hover:shadow-cyan-200/50 hover:border-cyan-300', ring: 'from-cyan-500/20' },
    teal: { bg: 'bg-teal-50 border-teal-100 text-teal-600', btn: 'bg-teal-600 hover:bg-teal-700', shadow: 'hover:shadow-teal-200/50 hover:border-teal-300', ring: 'from-teal-500/20' },
    amber: { bg: 'bg-amber-50 border-amber-100 text-amber-600', btn: 'bg-amber-600 hover:bg-amber-700', shadow: 'hover:shadow-amber-200/50 hover:border-amber-300', ring: 'from-amber-500/20' },
};

const quickFilters = [
    { label: 'All', keyword: '' },
    { label: 'Images', keyword: 'image' },
    { label: 'PDF', keyword: 'pdf' },
    { label: 'Data', keyword: 'json' },
    { label: 'Web', keyword: 'url' },
];

const Home = () => {
    const { searchTerm, setSearchTerm } = useOutletContext() || { searchTerm: '', setSearchTerm: () => {} };
    const [activeFilter, setActiveFilter] = useState('');
    const heroRef = useRef(null);
    const gridRef = useRef(null);
    const servicesRef = useRef(null);

    const term = searchTerm?.trim() || activeFilter;
    const lowerTerm = term.toLowerCase();
    const filteredServices = term
        ? services.filter(service => {
            const titleMatch = service.title.toLowerCase().includes(lowerTerm);
            const descMatch = service.description.toLowerCase().includes(lowerTerm);
            const keywordMatch = service.keywords.some(keyword =>
                keyword.toLowerCase().includes(lowerTerm) ||
                lowerTerm.includes(keyword.toLowerCase())
            );
            return titleMatch || descMatch || keywordMatch;
        })
        : services;

    useEffect(() => {
        const anime = window.anime;
        if (!anime || !heroRef.current) return;

        anime({
            targets: heroRef.current.querySelectorAll('.anime-hero-item'),
            translateY: [22, 0],
            opacity: [0, 1],
            delay: anime.stagger(90),
            duration: 760,
            easing: 'easeOutExpo',
        });
    }, []);

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
            <section ref={heroRef} className="relative px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 lg:pt-16 pb-8 md:pb-12">
                <div className="absolute inset-0 -z-10 pointer-events-none">
                    <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-300/20 blur-3xl sm:h-96 sm:w-96" />
                    <div className="absolute right-0 top-24 h-56 w-56 rounded-full bg-purple-300/20 blur-3xl" />
                </div>

                <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 items-center">
                    <div>
                        <div className="anime-hero-item opacity-0 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-indigo-100 shadow-sm text-indigo-700 font-bold text-sm mb-5">
                            <Sparkles className="w-4 h-4" /> Fast browser-first tools
                        </div>
                        <h1 className="anime-hero-item opacity-0 text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight text-gray-950 leading-[0.95]">
                            Your everyday utilities, polished for every screen.
                        </h1>
                        <p className="anime-hero-item opacity-0 mt-5 text-base sm:text-lg lg:text-xl text-gray-600 font-medium max-w-2xl leading-relaxed">
                            Search, filter, and launch powerful PDF, image, data, web, and AI tools from one responsive dashboard.
                        </p>
                        <div className="anime-hero-item opacity-0 mt-7 flex flex-col sm:flex-row gap-3">
                            <button onClick={() => servicesRef.current?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gray-950 text-white font-black shadow-xl shadow-gray-300 hover:bg-indigo-600 transition-all">
                                Browse Services <ArrowRight className="w-5 h-5" />
                            </button>
                            <div className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/80 text-gray-700 font-bold border border-gray-100 shadow-sm">
                                <Layers3 className="w-5 h-5 text-indigo-600" /> {services.length} tools available
                            </div>
                        </div>
                    </div>

                    <div className="anime-hero-item opacity-0 grid grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
                        {services.slice(0, 8).map((service, index) => {
                            const colors = getColorClasses(service.color);
                            return (
                                <Link key={service.id} to={`/${service.id}`} className={`group relative overflow-hidden rounded-3xl bg-white/75 border border-white p-4 sm:p-5 shadow-lg shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300 ${index % 3 === 0 ? 'sm:translate-y-5' : ''}`}>
                                    <div className={`absolute inset-0 bg-gradient-to-br ${colors.ring} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                                    <div className={`relative w-11 h-11 rounded-2xl flex items-center justify-center mb-4 ${colors.bg} border`}>
                                        <service.icon className="w-5 h-5" />
                                    </div>
                                    <p className="relative text-sm sm:text-base font-black text-gray-900 leading-tight">{service.title}</p>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section ref={servicesRef} className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-28">
                <div className="sticky top-[112px] sm:top-24 z-30 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 bg-gray-50/85 backdrop-blur-xl border-y sm:border border-gray-200/70 sm:rounded-[2rem] sm:shadow-sm mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex items-center gap-2 text-gray-900 font-black whitespace-nowrap">
                            <Search className="w-5 h-5 text-indigo-600" /> Services
                            <span className="text-gray-400 font-bold">({filteredServices.length})</span>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0 services-scrollbar">
                            {quickFilters.map(filter => (
                                <button key={filter.label} onClick={() => handleFilter(filter.keyword)} className={`flex-shrink-0 px-4 py-2.5 rounded-2xl text-sm font-black transition-all ${((searchTerm || activeFilter) === filter.keyword) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-200 hover:text-indigo-700'}`}>
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div ref={gridRef} className="grid grid-cols-1 min-[520px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                    {filteredServices.map((service) => {
                        const colors = getColorClasses(service.color);
                        return (
                            <article key={service.id} className={`service-card opacity-0 group relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-[1.7rem] sm:rounded-[2rem] p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col ${colors.shadow}`}>
                                <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full bg-gradient-to-br ${colors.ring} to-transparent blur-xl group-hover:scale-125 transition-transform`} />
                                <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${colors.bg} border transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm`}>
                                    <service.icon className="w-7 h-7" strokeWidth={1.5} />
                                </div>
                                <h3 className="relative text-lg sm:text-xl font-black text-gray-900 mb-3 tracking-tight group-hover:text-indigo-700 transition-colors">{service.title}</h3>
                                <p className="relative text-sm sm:text-[15px] text-gray-500 mb-6 flex-grow leading-relaxed font-medium">{service.description}</p>
                                <Link to={`/${service.id}`} className={`relative w-full flex items-center justify-center gap-2 px-5 py-3.5 ${colors.btn} text-white font-black rounded-2xl transition-all duration-300 text-sm shadow-lg group-hover:shadow-xl focus:ring-2 focus:ring-offset-2`}>
                                    Use Tool
                                    <MousePointerClick className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                </Link>
                            </article>
                        );
                    })}
                </div>

                {filteredServices.length === 0 && (
                    <div className="text-center py-20 sm:py-24 bg-white/70 backdrop-blur-sm rounded-[2.5rem] border border-gray-200 shadow-sm mt-8 max-w-3xl mx-auto">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100">
                            <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                        </div>
                        <p className="text-gray-800 text-2xl sm:text-3xl font-extrabold tracking-tight">No tools found matching your search</p>
                        <p className="text-gray-500 mt-4 mb-8 text-base sm:text-lg font-medium">Try adjusting your keywords to find what you're looking for.</p>
                        <button onClick={() => handleFilter('')} className="inline-flex items-center gap-3 px-7 py-4 bg-gray-900 hover:bg-gray-800 cursor-pointer text-white font-bold rounded-2xl transition-all duration-300 shadow-xl shadow-gray-200">
                            Clear Search
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
};

export default Home;
