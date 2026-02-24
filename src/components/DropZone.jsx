import React, { useCallback, useState, useRef } from 'react';
import { Upload } from 'lucide-react';

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
            // Reset the input value so the same file can be selected again if needed
            e.target.value = null;
        }
    };

    const getBorderColorClass = () => {
        if (isDragging) {
            return `border-${colorClass}-500 bg-${colorClass}-50 ring-4 ring-${colorClass}-100`;
        }
        return `border-gray-300 hover:border-${colorClass}-500 hover:bg-${colorClass}-50`;
    };

    const getIconColorClass = () => {
        if (isDragging) {
            return `text-${colorClass}-500 scale-110`;
        }
        return `text-gray-400`;
    };

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
            <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
                className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ease-in-out ${getBorderColorClass()}`}
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none">
                    <Icon className={`w-12 h-12 mb-4 transition-transform duration-300 ${getIconColorClass()}`} />
                    <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">{title}</span> {subtitle}
                    </p>
                    {description && (
                        <p className="text-xs text-gray-500">{description}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DropZone;
