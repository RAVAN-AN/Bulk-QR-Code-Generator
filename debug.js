// Debug script to test functionality
console.log('Debug script loaded');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - debug version');
    
    // Add visual indicators for loaded elements
    const elements = [
        'downloadCsvTemplate', 
        'downloadExcelTemplate', 
        'fileInput', 
        'fileUploadArea',
        'linkColumn',
        'filenameColumn',
        'generateBtn',
        'downloadBtn'
    ];
    
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            console.log('✓ Found element:', id);
            // Add a visible border for debugging
            el.style.border = '2px solid green';
        } else {
            console.log('✗ Missing element:', id);
        }
    });
    
    // Don't override the main script functionality
    // Just log debug information
});