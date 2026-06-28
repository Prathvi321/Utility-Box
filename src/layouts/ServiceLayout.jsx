import React, { useEffect, useRef, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, WifiOff } from 'lucide-react';
import { services } from '../utils/serviceData';

const ServiceLayout = () => {
    const shellRef = useRef(null);
    const location = useLocation();
    const [isOnline, setIsOnline] = useState(navigator.onLine);

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

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const currentPath = location.pathname.substring(1);
    const currentService = services.find(s => s.id === currentPath);
    const requiresInternet = currentService?.requiresInternet;
    const isOfflineService = !isOnline && requiresInternet;

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
                    {isOfflineService ? (
                        <div className="flex flex-col items-center justify-center text-center py-12 px-6 max-w-2xl mx-auto my-auto animate-fade-in">
                            <div className="w-20 h-20 bg-red-50 border border-red-200 text-red-500 rounded-3xl flex items-center justify-center mb-6 shadow-md shadow-red-100">
                                <WifiOff className="w-10 h-10" strokeWidth={1.5} />
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mb-3">
                                {currentService?.title || 'Tool'} is Offline
                            </h2>
                            <p className="text-stone-600 text-sm sm:text-base font-medium mb-8 leading-relaxed">
                                This specific service relies on external API processing or server resources. Please connect to the internet to enable it.
                            </p>
                            <div className="bg-stone-50/80 border border-stone-200/50 rounded-2xl p-5 text-left w-full mb-8 backdrop-blur-sm">
                                <h4 className="text-sm font-bold text-stone-800 mb-2">What you can do:</h4>
                                <ul className="text-xs sm:text-sm text-stone-600 space-y-2 list-disc list-inside font-medium">
                                    <li>Check your Wi-Fi, Ethernet, or cellular data connection.</li>
                                    <li>Return to the home dashboard to use other tools like <strong>PDF Merger</strong>, <strong>Image Compressor</strong>, or <strong>QR Generator</strong>, which function entirely in your browser without internet.</li>
                                </ul>
                            </div>
                            <Link 
                                to="/" 
                                className="px-6 py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-extrabold rounded-2xl shadow-lg transition-all duration-300 text-sm hover:-translate-y-0.5"
                            >
                                Back to Home Dashboard
                            </Link>
                        </div>
                    ) : (
                        <Outlet />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ServiceLayout;
