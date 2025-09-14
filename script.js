// Service data with keywords for smart search
const serviceData = {
    'pdf-merger': {
        title: 'PDF Merger',
        description: 'Combine multiple PDF files into one',
        keywords: ['pdf', 'merge', 'combine', 'join', 'unite', 'document', 'file']
    },
    'pdf-to-images': {
        title: 'PDF to Images',
        description: 'Convert PDF pages to ZIP file of images',
        keywords: ['pdf', 'convert', 'image', 'jpg', 'png', 'extract', 'pages', 'zip']
    },
    'qr-generator': {
        title: 'QR Code Generator',
        description: 'Generate QR codes for text, URLs, and more',
        keywords: ['qr', 'code', 'generate', 'barcode', 'url', 'text', 'scan']
    },
    'image-compressor': {
        title: 'Image Compressor',
        description: 'Reduce image file sizes without quality loss',
        keywords: ['image', 'compress', 'reduce', 'size', 'optimize', 'jpg', 'png', 'quality']
    },
    'Text-to-Speech': {
        title: 'Text to Speech',
        description: 'Convert text into audio files',
        keywords: ['text', 'speech', 'audio', 'voice', 'sound', 'read', 'tts', 'convert']
    },
    'color-picker': {
        title: 'Color Picker',
        description: 'Pick colors from images and get hex codes',
        keywords: ['color', 'pick', 'hex', 'rgb', 'palette', 'image', 'eyedropper']
    },
    'hash-generator': {
        title: 'Hash Generator',
        description: 'Generate MD5, SHA1, and SHA256 hashes',
        keywords: ['hash', 'md5', 'sha1', 'sha256', 'encrypt', 'checksum', 'security']
    },
    'password-generator': {
        title: 'Password Generator',
        description: 'Generate secure passwords',
        keywords: ['password', 'generate', 'secure', 'random', 'strong', 'security']
    },
    'watermark-adder': {
        title: 'Watermark Adder',
        description: 'Add custom watermarks to your images',
        keywords: ['watermark', 'image', 'logo', 'brand', 'overlay', 'protect', 'add']
    },
    'image-converter': {
        title: 'Image Converter',
        description: 'Convert images between different formats',
        keywords: ['image', 'convert', 'format', 'jpg', 'png', 'webp', 'ico', 'change']
    },
    'image-to-pdf': {
        title: 'Image to PDF',
        description: 'Convert multiple images into a single PDF',
        keywords: ['image', 'pdf', 'convert', 'combine', 'merge', 'document', 'multiple']
    }
};

// Smart search functionality
function performSearch(searchTerm) {
    const serviceCards = document.querySelectorAll('.service-card');
    const suggestions = document.getElementById('searchSuggestions');
    let visibleCount = 0;
    let matchedServices = [];
    
    if (!searchTerm.trim()) {
        serviceCards.forEach(card => {
            card.style.display = 'block';
            card.style.animation = 'fadeIn 0.3s ease-in-out';
        });
        suggestions.classList.add('hidden');
        visibleCount = serviceCards.length;
        updateActiveServices(visibleCount);
        return;
    }
    
    serviceCards.forEach(card => {
        const serviceId = card.getAttribute('data-service');
        const serviceInfo = serviceData[serviceId];
        
        if (serviceInfo) {
            const searchLower = searchTerm.toLowerCase();
            const titleMatch = serviceInfo.title.toLowerCase().includes(searchLower);
            const descMatch = serviceInfo.description.toLowerCase().includes(searchLower);
            const keywordMatch = serviceInfo.keywords.some(keyword => 
                keyword.toLowerCase().includes(searchLower) || 
                searchLower.includes(keyword.toLowerCase())
            );
            
            if (titleMatch || descMatch || keywordMatch) {
                card.style.display = 'block';
                card.style.animation = 'fadeIn 0.3s ease-in-out';
                visibleCount++;
                
                // Calculate relevance score for suggestions
                let score = 0;
                if (titleMatch) score += 10;
                if (descMatch) score += 5;
                if (keywordMatch) score += 3;
                
                matchedServices.push({ ...serviceInfo, serviceId, score });
            } else {
                card.style.display = 'none';
            }
        }
    });
    
    // Show suggestions
    showSearchSuggestions(matchedServices.sort((a, b) => b.score - a.score), searchTerm);
    updateActiveServices(visibleCount);
}

// Show search suggestions
function showSearchSuggestions(matches, searchTerm) {
    const suggestions = document.getElementById('searchSuggestions');
    
    if (matches.length === 0 || !searchTerm.trim()) {
        suggestions.classList.add('hidden');
        return;
    }
    
    suggestions.innerHTML = matches.slice(0, 5).map(service => `
        <div class="search-suggestion p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0" 
             onclick="selectService('${service.serviceId}')">
            <div class="font-medium text-gray-800">${service.title}</div>
            <div class="text-sm text-gray-500">${service.description}</div>
        </div>
    `).join('');
    
    suggestions.classList.remove('hidden');
}

// Select service from suggestions
function selectService(serviceId) {
    document.getElementById('searchSuggestions').classList.add('hidden');
    document.getElementById('searchInput').value = serviceData[serviceId].title;
    openService(serviceId);
}

// Update active services count
function updateActiveServices(count) {
    document.getElementById('activeServices').textContent = count;
}

// Search input event listeners
document.getElementById('searchInput').addEventListener('input', function(e) {
    performSearch(e.target.value);
});

// Hide suggestions when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('#searchInput') && !e.target.closest('#searchSuggestions')) {
        document.getElementById('searchSuggestions').classList.add('hidden');
    }
});

// Keyboard navigation for suggestions
document.getElementById('searchInput').addEventListener('keydown', function(e) {
    const suggestions = document.getElementById('searchSuggestions');
    const suggestionItems = suggestions.querySelectorAll('.search-suggestion');
    
    if (e.key === 'Escape') {
        suggestions.classList.add('hidden');
        this.blur();
    }
});

// Service navigation with loading animation
function openService(serviceName) {
    // Add loading state
    const button = event?.target;
    if (button) {
        const originalText = button.textContent;
        button.textContent = 'Loading...';
        button.disabled = true;
        
        setTimeout(() => {
            window.location.href = `services/${serviceName}.html`;
        }, 300);
    } else {
        window.location.href = `services/${serviceName}.html`;
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Add stagger animation to service cards
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('animate-fadeIn');
    });
    
    // Update total services count
    document.getElementById('totalServices').textContent = serviceCards.length;
    updateActiveServices(serviceCards.length);
});

// Add CSS animation class
const style = document.createElement('style');
style.textContent = `
    .animate-fadeIn {
        animation: fadeIn 0.6s ease-out forwards;
        opacity: 0;
    }
`;
document.head.appendChild(style);