import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { services } from '../utils/serviceData';
import { motion, AnimatePresence } from 'framer-motion';

const Home = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredServices = useMemo(() => {
        if (!searchTerm.trim()) return services;

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
            indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', btn: 'bg-indigo-600 hover:bg-indigo-700' },
            green: { bg: 'bg-green-100', text: 'text-green-600', btn: 'bg-green-600 hover:bg-green-700' },
            purple: { bg: 'bg-purple-100', text: 'text-purple-600', btn: 'bg-purple-600 hover:bg-purple-700' },
            blue: { bg: 'bg-blue-100', text: 'text-blue-600', btn: 'bg-blue-600 hover:bg-blue-700' },
            red: { bg: 'bg-red-100', text: 'text-red-600', btn: 'bg-red-600 hover:bg-red-700' },
            pink: { bg: 'bg-pink-100', text: 'text-pink-600', btn: 'bg-pink-600 hover:bg-pink-700' },
            cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', btn: 'bg-cyan-600 hover:bg-cyan-700' },
            teal: { bg: 'bg-teal-100', text: 'text-teal-600', btn: 'bg-teal-600 hover:bg-teal-700' },
            amber: { bg: 'bg-amber-100', text: 'text-amber-600', btn: 'bg-amber-600 hover:bg-amber-700' },
        };
        return colors[color] || colors.indigo;
    };

    return (
        <div>
            {/* Search Section */}
            <div className="mb-6 md:mb-8 flex justify-center sticky top-0 z-40 bg-white/80 backdrop-blur-md p-4 -mx-4 md:static md:bg-transparent md:p-0 md:m-0">
                <div className="relative w-full max-w-md group">
                    <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 md:h-5 md:w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search tools..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 text-base md:text-lg border border-gray-300 rounded-lg md:rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white shadow-sm"
                    />
                </div>
            </div>

            {/* Quick Stats */}
            <div className="flex justify-center mb-12">
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-8 text-center">
                        <div>
                            <div className="text-3xl font-bold text-gray-900">{services.length}</div>
                            <div className="text-sm text-gray-600">Total Services</div>
                        </div>
                        <div className="w-px h-12 bg-gray-300"></div>
                        <div>
                            <div className="text-3xl font-bold text-indigo-600">{activeServicesCount}</div>
                            <div className="text-sm text-gray-600">Available Now</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Services Grid */}
            <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
            >
                <AnimatePresence mode="popLayout">
                    {filteredServices.map((service) => {
                        const colors = getColorClasses(service.color);
                        return (
                            <motion.div
                                layout
                                key={service.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                                whileHover={{ y: -8 }}
                                className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-md md:shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col items-start text-left"
                            >
                                <div className={`w-10 h-10 md:w-12 md:h-12 ${colors.bg} rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4 ${colors.text}`}>
                                    <service.icon className="w-5 h-5 md:w-6 md:h-6" />
                                </div>
                                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">{service.title}</h3>
                                <p className="text-sm md:text-base text-gray-600 mb-4 flex-grow">{service.description}</p>
                                <Link
                                    to={`/${service.id}`}
                                    className={`block w-full text-center px-4 py-2 ${colors.btn} text-white font-semibold rounded-lg md:rounded-xl transition-colors duration-200 text-sm md:text-base mt-auto`}
                                >
                                    Use Service
                                </Link>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </motion.div>

            {filteredServices.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No services found matching "{searchTerm}"</p>
                </div>
            )}
        </div>
    );
};

export default Home;
