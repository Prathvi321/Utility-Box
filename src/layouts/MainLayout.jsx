import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Search } from 'lucide-react';

const MainLayout = () => {
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Top Navigation Bar */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 md:h-20 gap-4">

                        {/* Logo & Brand */}
                        <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
                            <img src="/Utility.png" alt="UtilityBox Logo" className="w-10 h-10 md:w-12 md:h-12 rounded-xl shadow-lg group-hover:shadow-indigo-500/30 transition-shadow object-cover" />
                            <span className="font-extrabold text-xl md:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 tracking-tight">
                                UtilityBox
                            </span>
                        </Link>

                        {/* Search Bar - Desktop & Tablet */}
                        <div className="hidden sm:flex flex-1 max-w-lg mx-auto transform transition-all">
                            <div className="relative w-full group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search for tools, services..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 text-base border border-gray-300 rounded-full focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 bg-gray-100 hover:bg-gray-50 focus:bg-white shadow-inner"
                                />
                            </div>
                        </div>

                        {/* Mobile Placeholder (Search icon acting as toggle or simple link) - for simplicity we just keep the search visible but scaled down on mobile in the next div if needed, but a dedicated mobile search bar below nav is often better */}
                        <div className="sm:hidden flex items-center">
                            {/* Additional mobile icons could go here */}
                        </div>
                    </div>
                </div>

                {/* Mobile Search Bar - Visible only on small screens below the header */}
                <div className="sm:hidden px-4 pb-3 pt-1 border-t border-gray-100 bg-white shadow-sm">
                    <div className="relative w-full group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search tools..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-gray-50 focus:bg-white"
                        />
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 w-full relative">
                <Outlet context={{ searchTerm, setSearchTerm }} />
            </main>

            {/* Simple Footer */}
            <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
                    &copy; {new Date().getFullYear()} UtilityBox. All rights reserved.
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
