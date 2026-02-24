import React from 'react';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto px-4 py-12">
                <header className="text-center mb-8 md:mb-16">
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4 md:mb-6">UtilityBox</h1>
                    <p className="text-lg md:text-xl text-gray-600 mb-4 max-w-2xl mx-auto px-4">
                        Professional digital tools for productivity and efficiency
                    </p>
                    <div className="w-16 md:w-24 h-1 bg-indigo-600 mx-auto rounded-full"></div>
                </header>

                <main className="max-w-6xl mx-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
