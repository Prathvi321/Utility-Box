import React, { useMemo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { services } from '../utils/serviceData';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

const Home = () => {
    // Consume searchTerm provided by MainLayout's Outlet
    const { searchTerm } = useOutletContext() || { searchTerm: '' };

    const filteredServices = useMemo(() => {
        if (!searchTerm || !searchTerm.trim()) return services;

        const lowerTerm = searchTerm.toLowerCase();
        return services.filter(service => {
            const titleMatch = service.title.toLowerCase().includes(lowerTerm);
            const descMatch = service.description.toLowerCase().includes(lowerTerm);
            const keywordMatch = service.keywords.some(keyword =>
                keyword.toLowerCase().includes(lowerTerm) ||
                lowerTerm.includes(keyword.toLowerCase())
            );
            return titleMatch || descMatch || keywordMatch;
        });
    }, [searchTerm]);

    const activeServicesCount = filteredServices.length;

    const getColorClasses = (color) => {
        const colors = {
            indigo: { bg: 'bg-indigo-50 border-indigo-100 text-indigo-600', btn: 'bg-indigo-600 hover:bg-indigo-700', shadow: 'hover:shadow-indigo-200/50 hover:border-indigo-300' },
            green: { bg: 'bg-green-50 border-green-100 text-green-600', btn: 'bg-green-600 hover:bg-green-700', shadow: 'hover:shadow-green-200/50 hover:border-green-300' },
            purple: { bg: 'bg-purple-50 border-purple-100 text-purple-600', btn: 'bg-purple-600 hover:bg-purple-700', shadow: 'hover:shadow-purple-200/50 hover:border-purple-300' },
            blue: { bg: 'bg-blue-50 border-blue-100 text-blue-600', btn: 'bg-blue-600 hover:bg-blue-700', shadow: 'hover:shadow-blue-200/50 hover:border-blue-300' },
            red: { bg: 'bg-red-50 border-red-100 text-red-600', btn: 'bg-red-600 hover:bg-red-700', shadow: 'hover:shadow-red-200/50 hover:border-red-300' },
            pink: { bg: 'bg-pink-50 border-pink-100 text-pink-600', btn: 'bg-pink-600 hover:bg-pink-700', shadow: 'hover:shadow-pink-200/50 hover:border-pink-300' },
            cyan: { bg: 'bg-cyan-50 border-cyan-100 text-cyan-600', btn: 'bg-cyan-600 hover:bg-cyan-700', shadow: 'hover:shadow-cyan-200/50 hover:border-cyan-300' },
            teal: { bg: 'bg-teal-50 border-teal-100 text-teal-600', btn: 'bg-teal-600 hover:bg-teal-700', shadow: 'hover:shadow-teal-200/50 hover:border-teal-300' },
            amber: { bg: 'bg-amber-50 border-amber-100 text-amber-600', btn: 'bg-amber-600 hover:bg-amber-700', shadow: 'hover:shadow-amber-200/50 hover:border-amber-300' },
        };
        return colors[color] || colors.indigo;
    };

    return (
        <div className="pb-24">


            {searchTerm && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-4">
                    <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
                        Search Results for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">"{searchTerm}"</span>
                    </h2>
                    <p className="text-gray-500 mt-2 font-medium">{activeServicesCount} tool{activeServicesCount !== 1 ? 's' : ''} found</p>
                </div>
            )}

            <div className={`max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8`}>
                <motion.div
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8"
                >
                    <AnimatePresence mode="popLayout">
                        {filteredServices.map((service, index) => {
                            const colors = getColorClasses(service.color);
                            return (
                                <motion.div
                                    layout
                                    key={service.id}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                                    whileHover={{ y: -8, scale: 1.02 }}
                                    className={`bg-white/70 backdrop-blur-xl rounded-[2rem] p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col items-start group ${colors.shadow}`}
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${colors.bg} border transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm`}>
                                        <service.icon className="w-7 h-7" strokeWidth={1.5} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight group-hover:text-indigo-700 transition-colors">{service.title}</h3>
                                    <p className="text-[15px] text-gray-500 mb-8 flex-grow leading-relaxed font-medium">{service.description}</p>
                                    <Link
                                        to={`/${service.id}`}
                                        className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 ${colors.btn} text-white font-bold rounded-xl transition-all duration-300 text-sm shadow-lg shadow-${service.color}-200/50 group-hover:shadow-xl focus:ring-2 focus:ring-offset-2 focus:ring-${service.color}-500`}
                                    >
                                        Use Tool
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>

                {filteredServices.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-24 bg-white/50 backdrop-blur-sm rounded-[2.5rem] border border-gray-200 shadow-sm mt-8 max-w-3xl mx-auto"
                    >
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100">
                            <Sparkles className="w-12 h-12 text-gray-400" />
                        </div>
                        <p className="text-gray-800 text-3xl font-extrabold tracking-tight">No tools found matching your search</p>
                        <p className="text-gray-500 mt-4 mb-10 text-lg font-medium">Try adjusting your keywords to find what you're looking for.</p>
                        <button
                            onClick={() => window.history.back()}
                            className="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 hover:bg-gray-800 cursor-pointer text-white font-bold text-lg rounded-2xl transition-all duration-300 shadow-xl shadow-gray-200"
                        >
                            <ArrowRight className="w-5 h-5 rotate-180" />
                            Go Back
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Home;
