import React, { useCallback, useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DropZone = ({
    onFileDrop,
    accept,
    multiple = false,
    icon: Icon = Upload,
    title = "Click to upload",
    subtitle = "or drag and drop",
    description,
    colorClass = "indigo"
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragEnter = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) {
            setIsDragging(false);
        }
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            if (multiple) {
                onFileDrop(e.dataTransfer.files);
            } else {
                onFileDrop(e.dataTransfer.files[0]);
            }
            e.dataTransfer.clearData();
        }
    }, [multiple, onFileDrop]);

    const handleFileInput = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            if (multiple) {
                onFileDrop(e.target.files);
            } else {
                onFileDrop(e.target.files[0]);
            }
            e.target.value = null;
        }
    };

    const colorVariants = {
        indigo: { text: 'text-indigo-500', bg: 'bg-indigo-50/50', border: 'border-indigo-400', ring: 'ring-indigo-100' },
        purple: { text: 'text-purple-500', bg: 'bg-purple-50/50', border: 'border-purple-400', ring: 'ring-purple-100' },
        emerald: { text: 'text-emerald-500', bg: 'bg-emerald-50/50', border: 'border-emerald-400', ring: 'ring-emerald-100' },
        rose: { text: 'text-rose-500', bg: 'bg-rose-50/50', border: 'border-rose-400', ring: 'ring-rose-100' },
        blue: { text: 'text-blue-500', bg: 'bg-blue-50/50', border: 'border-blue-400', ring: 'ring-blue-100' },
        orange: { text: 'text-orange-500', bg: 'bg-orange-50/50', border: 'border-orange-400', ring: 'ring-orange-100' },
        cyan: { text: 'text-cyan-500', bg: 'bg-cyan-50/50', border: 'border-cyan-400', ring: 'ring-cyan-100' },
        teal: { text: 'text-teal-500', bg: 'bg-teal-50/50', border: 'border-teal-400', ring: 'ring-teal-100' },
    };

    const currentColors = colorVariants[colorClass] || colorVariants.indigo;

    return (
        <div className="relative text-center w-full">
            <input
                type="file"
                accept={accept}
                multiple={multiple}
                onChange={handleFileInput}
                ref={fileInputRef}
                className="hidden"
            />
            <motion.div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                animate={{
                    borderColor: isDragging ? 'var(--tw-colors-indigo-400)' : 'var(--tw-colors-gray-200)',
                    backgroundColor: isDragging ? 'rgba(238, 242, 255, 0.5)' : '#ffffff',
                }}
                className={`flex flex-col items-center justify-center w-full min-h-[16rem] border-2 border-dashed rounded-[2rem] cursor-pointer transition-shadow duration-300 ease-in-out bg-white/50 backdrop-blur-sm ${isDragging
                        ? `${currentColors.border} ${currentColors.bg} ring-4 ${currentColors.ring} shadow-lg shadow-${colorClass}-100/50`
                        : `border-gray-200 hover:${currentColors.border} hover:shadow-md`
                    }`}
            >
                <div className="flex flex-col items-center justify-center p-8 pointer-events-none">
                    <motion.div
                        animate={{
                            y: isDragging ? -10 : 0,
                            scale: isDragging ? 1.1 : 1
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={`w-20 h-20 mb-6 rounded-3xl flex items-center justify-center ${isDragging ? `bg-${colorClass}-100 ${currentColors.text}` : 'bg-gray-50 text-gray-400'
                            } shadow-inner bg-white/50 backdrop-blur-md border border-white`}
                    >
                        <Icon strokeWidth={1.5} className="w-10 h-10" />
                    </motion.div>

                    <h3 className="mb-2 text-xl font-semibold text-gray-800 tracking-tight">
                        {title}
                    </h3>
                    <p className="mb-4 text-sm font-medium text-gray-500">
                        {subtitle}
                    </p>

                    {description && (
                        <p className="text-xs text-gray-400 font-medium max-w-xs">{description}</p>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default DropZone;
