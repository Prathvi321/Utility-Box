import React, { useEffect, useRef } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ServiceLayout = () => {
    const shellRef = useRef(null);

    useEffect(() => {
        const anime = window.anime;
        if (!anime || !shellRef.current) return;

        anime({
            targets: shellRef.current,
            translateY: [24, 0],
            scale: [0.985, 1],
            opacity: [0, 1],
            duration: 720,
            easing: 'easeOutExpo',
        });
    }, []);

    return (
        <div className="h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-stretch justify-center p-3 sm:p-4 md:p-6 relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[70%] sm:w-[50%] h-[50%] rounded-full bg-purple-300/20 blur-[120px]" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[70%] sm:w-[50%] h-[50%] rounded-full bg-indigo-300/20 blur-[120px]" />
            </div>

            <div ref={shellRef} className="opacity-0 bg-white/70 backdrop-blur-2xl border border-white/70 rounded-[1.5rem] sm:rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] p-4 sm:p-5 md:p-6 w-full max-w-[90rem] relative h-full flex flex-col z-10 overflow-hidden">
                <div className="mb-3 sm:mb-4 flex items-center justify-between flex-shrink-0">
                    <Link
                        to="/"
                        className="inline-flex items-center px-3.5 sm:px-4 py-2.5 bg-white/85 backdrop-blur-md border border-white text-gray-700 font-bold rounded-2xl hover:bg-white hover:text-indigo-600 transition-all duration-300 shadow-sm hover:shadow-md group text-sm sm:text-base"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1.5 transition-transform duration-300" />
                        Back to Services
                    </Link>
                </div>

                <div className="flex-1 w-full flex flex-col overflow-hidden min-h-0">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default ServiceLayout;
