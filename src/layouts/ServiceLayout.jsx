import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const ServiceLayout = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
            {/* Premium Background ambient glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-300/20 blur-[120px]" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-300/20 blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white/60 backdrop-blur-2xl border border-white/60 rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] p-6 md:p-8 lg:p-10 w-full max-w-[90rem] relative min-h-[85vh] flex flex-col z-10"
            >
                <div className="mb-6 flex items-center justify-between">
                    <Link
                        to="/"
                        className="inline-flex items-center px-4 py-2.5 bg-white/80 backdrop-blur-md border border-white text-gray-700 font-medium rounded-2xl hover:bg-white hover:text-indigo-600 transition-all duration-300 shadow-sm hover:shadow-md group"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1.5 transition-transform duration-300" />
                        Back to Services
                    </Link>
                </div>

                <div className="flex-1 w-full flex flex-col">
                    <Outlet />
                </div>
            </motion.div>
        </div>
    );
};

export default ServiceLayout;
