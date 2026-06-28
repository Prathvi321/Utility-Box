import React, { useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ServiceLayout = () => {
    const shellRef = useRef(null);
    const location = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

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
        <div className="h-screen bg-gradient-to-br from-sage-50 via-white to-stone-100 flex items-stretch justify-center p-1.5 sm:p-2 md:p-3 relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[70%] sm:w-[50%] h-[50%] rounded-full bg-sage-300/15 blur-[120px]" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[70%] sm:w-[50%] h-[50%] rounded-full bg-stone-300/15 blur-[120px]" />
            </div>

            <div ref={shellRef} className="opacity-0 bg-white/70 backdrop-blur-2xl border border-white/70 rounded-2xl sm:rounded-[1.5rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] p-3 sm:p-4 md:p-5 lg:p-6 w-full max-w-[90rem] relative h-full flex flex-col z-10 overflow-hidden">
                <div className="mb-2 sm:mb-3 flex items-center justify-between flex-shrink-0">
                    <Link
                        to="/"
                        className="inline-flex items-center px-3 py-2 bg-white/85 backdrop-blur-md border border-white text-stone-700 font-bold rounded-xl hover:bg-white hover:text-sage-600 transition-all duration-300 shadow-sm hover:shadow-md group text-xs sm:text-sm"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1.5 transition-transform duration-300" />
                        Back
                    </Link>
                </div>

                <div className="flex-1 w-full flex flex-col overflow-x-hidden overflow-y-auto services-scrollbar min-h-0">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default ServiceLayout;
