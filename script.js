class QRCodeGenerator {
    constructor() {
        this.data = [];
        this.generatedQRCodes = [];
        this.logoImage = null;
        this.batchSize = 25; // Default batch size, user configurable
        this.currentStep = 1;
        this.previewCanvas = null;
        this.initializeEventListeners();
        this.initializeTabs();
        this.initializeStepNavigation();
        this.initializeLivePreview();
    }

    initializeEventListeners() {
        const fileInput = document.getElementById('fileInput');
        const fileUploadArea = document.getElementById('fileUploadArea');
        const generateBtn = document.getElementById('generateBtn');
        const downloadBtn = document.getElementById('downloadBtn');

        // Template download handlers
        const downloadCsvTemplate = document.getElementById('downloadCsvTemplate');
        const downloadExcelTemplate = document.getElementById('downloadExcelTemplate');

        // File upload handlers
        if (fileUploadArea && fileInput) {
            // Only handle drag and drop on the upload area, not clicks
            fileUploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
            fileUploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
            fileUploadArea.addEventListener('drop', this.handleDrop.bind(this));
            fileInput.addEventListener('change', this.handleFileSelect.bind(this));
            
            // Handle browse link separately
            const browseLink = document.getElementById('browseLink');
            if (browseLink) {
                browseLink.addEventListener('click', (e) => {
                    e.stopPropagation();
                    fileInput.click();
                });
            }
        }

        // Template handlers
        if (downloadCsvTemplate) {
            downloadCsvTemplate.addEventListener('click', this.downloadCSVTemplate.bind(this));
        }
        if (downloadExcelTemplate) {
            downloadExcelTemplate.addEventListener('click', this.downloadExcelTemplate.bind(this));
        }

        // Logo upload handler
        const logoUpload = document.getElementById('logoUpload');
        if (logoUpload) {
            logoUpload.addEventListener('change', this.handleLogoUpload.bind(this));
        }

        // Logo size slider
        const logoSize = document.getElementById('logoSize');
        if (logoSize) {
            logoSize.addEventListener('input', this.updateLogoSizeDisplay.bind(this));
        }

        // Generate and download handlers
        if (generateBtn) {
            generateBtn.addEventListener('click', this.generateQRCodes.bind(this));
        }
        if (downloadBtn) {
            downloadBtn.addEventListener('click', this.downloadZip.bind(this));
        }

        // Batch size configuration
        const batchSizeSelect = document.getElementById('batchSize');
        if (batchSizeSelect) {
            batchSizeSelect.addEventListener('change', (e) => {
                this.batchSize = parseInt(e.target.value);
                this.updateGenerationSummary();
            });
        }

        // Live preview refresh
        const refreshPreview = document.getElementById('refreshPreview');
        if (refreshPreview) {
            refreshPreview.addEventListener('click', this.updateLivePreview.bind(this));
        }

        // Color value display updates
        const qrColorDark = document.getElementById('qrColorDark');
        const qrColorLight = document.getElementById('qrColorLight');
        const textColor = document.getElementById('textColor');
        
        if (qrColorDark) {
            qrColorDark.addEventListener('input', (e) => {
                e.target.nextElementSibling.textContent = e.target.value.toUpperCase();
                this.updateLivePreview();
            });
        }
        if (qrColorLight) {
            qrColorLight.addEventListener('input', (e) => {
                e.target.nextElementSibling.textContent = e.target.value.toUpperCase();
                this.updateLivePreview();
            });
        }
        if (textColor) {
            textColor.addEventListener('input', (e) => {
                e.target.nextElementSibling.textContent = e.target.value.toUpperCase();
                this.updateLivePreview();
            });
        }

        // Live preview updates for all controls
        const previewControls = [
            'qrSize', 'qrMargin', 'errorLevel', 'qrColorDark', 'qrColorLight', 'qrStyle',
            'textBelow', 'textSize', 'textColor', 'textFont', 'logoSize', 'logoBackground'
        ];
        
        previewControls.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', this.updateLivePreview.bind(this));
                element.addEventListener('input', this.updateLivePreview.bind(this));
            }
        });
    }

    initializeTabs() {
        // Handle customization tabs
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanels = document.querySelectorAll('.tab-panel');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                
                // Remove active class from all tabs and panels
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanels.forEach(panel => panel.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding panel
                button.classList.add('active');
                document.getElementById(`${tabId}-panel`).classList.add('active');
            });
        });
    }

    initializeStepNavigation() {
        const steps = document.querySelectorAll('.step');
        const stepContents = document.querySelectorAll('.step-content');

        steps.forEach(step => {
            step.addEventListener('click', () => {
                const stepNumber = parseInt(step.getAttribute('data-step'));
                this.goToStep(stepNumber);
            });
        });
    }

    goToStep(stepNumber) {
        this.currentStep = stepNumber;
        
        // Update step indicators
        const steps = document.querySelectorAll('.step');
        const stepContents = document.querySelectorAll('.step-content');
        
        steps.forEach((step, index) => {
            const stepNum = index + 1;
            step.classList.remove('active', 'completed');
            
            if (stepNum === stepNumber) {
                step.classList.add('active');
            } else if (stepNum < stepNumber) {
                step.classList.add('completed');
            }
        });
        
        // Update step content
        stepContents.forEach((content, index) => {
            content.classList.remove('active');
            if (index + 1 === stepNumber) {
                content.classList.add('active');
            }
        });
        
        // Update header stats and perform step-specific actions
        this.updateHeaderStats();
        
        if (stepNumber === 3) {
            setTimeout(() => this.updateLivePreview(), 100);
        }
        
        if (stepNumber === 4) {
            this.updateGenerationSummary();
        }
    }

    initializeLivePreview() {
        this.previewCanvas = document.getElementById('previewCanvas');
        if (!this.previewCanvas) {
            console.error('Preview canvas not found!');
            return;
        }
        console.log('Preview canvas found, initializing...');
        // Initial preview with sample data
        setTimeout(() => {
            console.log('Updating initial live preview...');
            this.updateLivePreview();
        }, 500);
    }

    handleDragOver(e) {
        e.preventDefault();
        document.getElementById('fileUploadArea').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        document.getElementById('fileUploadArea').classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        document.getElementById('fileUploadArea').classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    // Template download methods
    downloadCSVTemplate() {
        const csvContent = `Link,Filename,Description,Category
https://www.example.com,Example_Website,Sample website link,Web
https://www.google.com,Google_Search,Google search engine,Search
https://www.github.com,GitHub_Code,Code repository platform,Development
https://www.youtube.com,YouTube_Video,Video streaming platform,Media
https://www.linkedin.com,LinkedIn_Profile,Professional networking,Social`;
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        this.downloadFile(blob, 'qr_code_template.csv');
    }

    async downloadExcelTemplate() {
        try {
            const wb = XLSX.utils.book_new();
            const templateData = [
                ['Link', 'Filename', 'Description', 'Category', 'Notes'],
                ['https://www.example.com', 'Example_Website', 'Sample website link', 'Web', 'Replace with your actual links'],
                ['https://www.google.com', 'Google_Search', 'Google search engine', 'Search', 'Each row will generate one QR code'],
                ['https://www.github.com', 'GitHub_Code', 'Code repository platform', 'Development', 'Filename will be used for the image'],
                ['https://www.youtube.com', 'YouTube_Video', 'Video streaming platform', 'Media', 'Description is optional'],
                ['https://www.linkedin.com', 'LinkedIn_Profile', 'Professional networking', 'Social', 'Add as many rows as needed']
            ];
            
            const ws = XLSX.utils.aoa_to_sheet(templateData);
            
            // Set column widths
            ws['!cols'] = [
                { width: 25 }, // Link
                { width: 20 }, // Filename
                { width: 30 }, // Description
                { width: 15 }, // Category
                { width: 35 }  // Notes
            ];
            
            XLSX.utils.book_append_sheet(wb, ws, 'QR Code Data');
            
            // Add instructions sheet
            const instructions = [
                ['QR Code Generator - Instructions'],
                [''],
                ['1. Required Columns:'],
                ['   - Link: The URL you want to convert to QR code'],
                ['   - Filename: Name for the generated QR code image'],
                [''],
                ['2. Optional Columns:'],
                ['   - Description: Additional information (not used in QR code)'],
                ['   - Category: For organizing your QR codes'],
                ['   - Notes: Any additional notes'],
                [''],
                ['3. Tips:'],
                ['   - Links must start with http:// or https://'],
                ['   - Filenames should not contain special characters'],
                ['   - You can add as many rows as needed'],
                ['   - Delete the example rows and add your own data'],
                [''],
                ['4. Supported Link Types:'],
                ['   - Websites (https://example.com)'],
                ['   - Email (mailto:email@example.com)'],
                ['   - Phone (tel:+1234567890)'],
                ['   - SMS (sms:+1234567890)'],
                ['   - WiFi (WIFI:T:WPA;S:NetworkName;P:Password;;)'],
                ['   - Plain text (any text content)']
            ];
            
            const instructionsWs = XLSX.utils.aoa_to_sheet(instructions);
            instructionsWs['!cols'] = [{ width: 50 }];
            XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instructions');
            
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            this.downloadFile(blob, 'qr_code_template.xlsx');
            
        } catch (error) {
            console.error('Error creating Excel template:', error);
            // Fallback to CSV template
            this.downloadCSVTemplate();
        }
    }

    showGoogleSheetsInfo() {
        alert('Google Sheets Import:\n\n1. Create a Google Sheet with your data\n2. File → Download → Microsoft Excel (.xlsx)\n3. Upload the downloaded file here\n\nDirect Google Sheets import coming soon!');
    }

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Logo handling methods
    handleLogoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.logoImage = img;
                this.showLogoPreview(e.target.result);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    showLogoPreview(src) {
        const preview = document.getElementById('logoPreview');
        const previewImg = document.getElementById('logoPreviewImg');
        previewImg.src = src;
        preview.style.display = 'block';
        // Update live preview when logo changes
        setTimeout(() => this.updateLivePreview(), 100);
    }

    updateLogoSizeDisplay() {
        const logoSize = document.getElementById('logoSize');
        const logoSizeValue = document.getElementById('logoSizeValue');
        logoSizeValue.textContent = `${logoSize.value}%`;
        // Update live preview when logo size changes
        this.updateLivePreview();
    }

    async processFile(file) {
        const fileName = file.name.toLowerCase();
        
        try {
            if (fileName.endsWith('.csv')) {
                await this.processCSV(file);
            } else if (fileName.endsWith('.tsv') || fileName.endsWith('.txt')) {
                await this.processTSV(file);
            } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                await this.processExcel(file);
            } else {
                alert('Please upload a CSV, TSV, or Excel file.');
                return;
            }

            this.showMappingSection();
            this.goToStep(2); // Auto-advance to step 2
        } catch (error) {
            console.error('Error processing file:', error);
            alert('Error processing file. Please check the file format and try again.');
        }
    }

    updateHeaderStats() {
        const totalRowsEl = document.getElementById('totalRows');
        const validRowsEl = document.getElementById('validRows');
        
        if (this.data && this.data.rows) {
            const totalRows = this.data.rows.length;
            const linkColumn = document.getElementById('linkColumn')?.value;
            const filenameColumn = document.getElementById('filenameColumn')?.value;
            
            let validRows = 0;
            if (linkColumn && filenameColumn) {
                validRows = this.data.rows.filter(row => 
                    row[parseInt(linkColumn)] && row[parseInt(filenameColumn)] &&
                    this.isValidLink(row[parseInt(linkColumn)])
                ).length;
            }
            
            totalRowsEl.textContent = totalRows;
            validRowsEl.textContent = validRows;
        } else {
            totalRowsEl.textContent = '0';
            validRowsEl.textContent = '0';
        }
    }

    async updateLivePreview() {
        if (!this.previewCanvas) return;
        
        const ctx = this.previewCanvas.getContext('2d');
        const canvas = this.previewCanvas;
        
        // Get current settings
        const qrSize = parseInt(document.getElementById('qrSize')?.value || 300);
        const qrMargin = parseInt(document.getElementById('qrMargin')?.value || 2);
        const errorLevel = document.getElementById('errorLevel')?.value || 'M';
        const qrColorDark = document.getElementById('qrColorDark')?.value || '#000000';
        const qrColorLight = document.getElementById('qrColorLight')?.value || '#FFFFFF';
        const qrStyle = document.getElementById('qrStyle')?.value || 'square';
        const textBelow = document.getElementById('textBelow')?.value || '';
        const textSize = parseInt(document.getElementById('textSize')?.value || 16);
        const textColor = document.getElementById('textColor')?.value || '#000000';
        const textFont = document.getElementById('textFont')?.value || 'Arial';
        const logoSize = parseInt(document.getElementById('logoSize')?.value || 15);
        const logoBackground = document.getElementById('logoBackground')?.checked || false;
        
        // Sample data
        let sampleLink = 'https://example.com';
        let sampleText = 'Example Filename';
        
        // Use actual data if available
        if (this.data && this.data.rows && this.data.rows.length > 0) {
            const linkColumn = document.getElementById('linkColumn')?.value;
            const filenameColumn = document.getElementById('filenameColumn')?.value;
            
            if (linkColumn && filenameColumn) {
                const firstRow = this.data.rows[0];
                sampleLink = firstRow[parseInt(linkColumn)] || sampleLink;
                sampleText = firstRow[parseInt(filenameColumn)] || sampleText;
            }
        }
        
        const displayText = textBelow || sampleText;
        
        try {
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Generate QR code
            const tempCanvas = document.createElement('canvas');
            try {
                await QRCode.toCanvas(tempCanvas, sampleLink, {
                    width: qrSize,
                    margin: qrMargin,
                    errorCorrectionLevel: errorLevel,
                    color: {
                        dark: qrColorDark,
                        light: qrColorLight
                    }
                });
                console.log('QR code generated successfully for preview');
            } catch (qrError) {
                console.error('QR generation failed:', qrError);
                throw new Error('Failed to generate QR code: ' + qrError.message);
            }
            
            // Add logo if available
            if (this.logoImage) {
                await this.addLogoToCanvas(tempCanvas, logoSize, logoBackground);
            }
            
            // Create final canvas with text
            const finalCanvas = await this.createQRWithText(tempCanvas, displayText, {
                qrSize,
                textSize,
                textColor,
                textFont
            });
            
            // Draw to preview canvas with proper scaling to fit
            const scale = Math.min(canvas.width / finalCanvas.width, canvas.height / finalCanvas.height, 1);
            const scaledWidth = finalCanvas.width * scale;
            const scaledHeight = finalCanvas.height * scale;
            const x = Math.max(0, (canvas.width - scaledWidth) / 2);
            const y = Math.max(0, (canvas.height - scaledHeight) / 2);
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Add a light border around the preview
            ctx.fillStyle = '#f7fafc';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw the QR code with text
            ctx.drawImage(finalCanvas, x, y, scaledWidth, scaledHeight);
            
            // Update preview details
            document.getElementById('sampleLink').textContent = sampleLink;
            document.getElementById('sampleText').textContent = displayText;
            document.getElementById('finalSize').textContent = `${finalCanvas.width}x${finalCanvas.height}px`;
            
        } catch (error) {
            console.error('Preview generation error:', error);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#f7fafc';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#718096';
            ctx.font = '16px Inter, Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Preview Error', canvas.width / 2, canvas.height / 2 - 10);
            ctx.fillText('Check your settings', canvas.width / 2, canvas.height / 2 + 10);
        }
    }

    updateGenerationSummary() {
        if (!this.data || !this.data.rows) return;
        
        const linkColumn = document.getElementById('linkColumn')?.value;
        const filenameColumn = document.getElementById('filenameColumn')?.value;
        
        let totalEntries = this.data.rows.length;
        let validEntries = 0;
        
        if (linkColumn && filenameColumn) {
            validEntries = this.data.rows.filter(row => 
                row[parseInt(linkColumn)] && row[parseInt(filenameColumn)] &&
                this.isValidLink(row[parseInt(linkColumn)])
            ).length;
        }
        
        // Estimate time (rough calculation)
        const estimatedSeconds = Math.ceil((validEntries / this.batchSize) * 2);
        const estimatedTime = estimatedSeconds < 60 ? 
            `${estimatedSeconds}s` : 
            `${Math.ceil(estimatedSeconds / 60)}m`;
        
        document.getElementById('totalEntries').textContent = totalEntries;
        document.getElementById('validEntries').textContent = validEntries;
        document.getElementById('estimatedTime').textContent = estimatedTime;
    }

    async processCSV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    const rows = this.parseCSV(text);
                    
                    if (rows.length < 2) {
                        reject(new Error('File must contain at least a header row and one data row'));
                        return;
                    }

                    this.data = {
                        headers: rows[0],
                        rows: rows.slice(1)
                    };
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    async processTSV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    const rows = text.split('\n').map(row => 
                        row.split('\t').map(cell => cell.trim())
                    ).filter(row => row.some(cell => cell.length > 0));
                    
                    if (rows.length < 2) {
                        reject(new Error('File must contain at least a header row and one data row'));
                        return;
                    }

                    this.data = {
                        headers: rows[0],
                        rows: rows.slice(1)
                    };
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    parseCSV(text) {
        const rows = [];
        const lines = text.split('\n');
        
        for (let line of lines) {
            if (line.trim() === '') continue;
            
            const row = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const nextChar = line[i + 1];
                
                if (char === '"') {
                    if (inQuotes && nextChar === '"') {
                        current += '"';
                        i++; // Skip next quote
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (char === ',' && !inQuotes) {
                    row.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            
            row.push(current.trim());
            if (row.some(cell => cell.length > 0)) {
                rows.push(row);
            }
        }
        
        return rows;
    }

    async processExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    
                    if (jsonData.length < 2) {
                        reject(new Error('File must contain at least a header row and one data row'));
                        return;
                    }

                    this.data = {
                        headers: jsonData[0],
                        rows: jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ''))
                    };
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    showMappingSection() {
        const linkColumn = document.getElementById('linkColumn');
        const filenameColumn = document.getElementById('filenameColumn');

        if (!linkColumn || !filenameColumn) {
            console.error('Mapping section elements not found');
            return;
        }

        // Clear previous options
        linkColumn.innerHTML = '<option value="">Choose column...</option>';
        filenameColumn.innerHTML = '<option value="">Choose column...</option>';

        // Add column options
        this.data.headers.forEach((header, index) => {
            const option1 = new Option(header, index);
            const option2 = new Option(header, index);
            linkColumn.add(option1);
            filenameColumn.add(option2);
        });

        // Auto-detect likely columns
        this.autoDetectColumns();

        // Show preview table
        this.updatePreviewTable();
        
        // Add event listeners for column changes (remove existing ones first)
        linkColumn.removeEventListener('change', this.validateMapping.bind(this));
        filenameColumn.removeEventListener('change', this.validateMapping.bind(this));
        linkColumn.addEventListener('change', this.validateMapping.bind(this));
        filenameColumn.addEventListener('change', this.validateMapping.bind(this));
        
        // Update preview info
        const previewInfo = document.getElementById('previewInfo');
        if (previewInfo) {
            previewInfo.textContent = `First 5 of ${this.data.rows.length} rows`;
        }
    }

    autoDetectColumns() {
        const linkColumn = document.getElementById('linkColumn');
        const filenameColumn = document.getElementById('filenameColumn');

        // Auto-detect link column (look for URL-like content or column names)
        this.data.headers.forEach((header, index) => {
            const headerLower = header.toLowerCase();
            if (headerLower.includes('url') || headerLower.includes('link') || headerLower.includes('website')) {
                linkColumn.value = index;
            }
            if (headerLower.includes('name') || headerLower.includes('file') || headerLower.includes('title')) {
                filenameColumn.value = index;
            }
        });

        // If no auto-detection, check data content
        if (!linkColumn.value) {
            this.data.rows.slice(0, 5).forEach(row => {
                row.forEach((cell, index) => {
                    if (typeof cell === 'string' && (cell.includes('http') || cell.includes('www.'))) {
                        linkColumn.value = index;
                    }
                });
            });
        }

        this.validateMapping();
    }

    updatePreviewTable() {
        const table = document.getElementById('previewTable');
        table.innerHTML = '';

        // Create header row
        const headerRow = table.insertRow();
        this.data.headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });

        // Create data rows (first 5)
        const previewRows = this.data.rows.slice(0, 5);
        previewRows.forEach(row => {
            const tr = table.insertRow();
            this.data.headers.forEach((_, index) => {
                const td = tr.insertCell();
                td.textContent = row[index] || '';
            });
        });
    }

    validateMapping() {
        const linkColumn = document.getElementById('linkColumn').value;
        const filenameColumn = document.getElementById('filenameColumn').value;

        if (linkColumn && filenameColumn) {
            this.updateHeaderStats();
            // Auto-advance to preview step
            setTimeout(() => this.goToStep(3), 500);
        }
    }

    async generateQRCodes() {
        const linkColumnIndex = parseInt(document.getElementById('linkColumn').value);
        const filenameColumnIndex = parseInt(document.getElementById('filenameColumn').value);
        
        // Get all customization options
        const qrSize = parseInt(document.getElementById('qrSize').value);
        const qrMargin = parseInt(document.getElementById('qrMargin').value);
        const errorLevel = document.getElementById('errorLevel').value;
        const qrColorDark = document.getElementById('qrColorDark').value;
        const qrColorLight = document.getElementById('qrColorLight').value;
        const textBelow = document.getElementById('textBelow').value;
        const textSize = parseInt(document.getElementById('textSize').value);
        const textColor = document.getElementById('textColor').value;
        const textFont = document.getElementById('textFont').value;
        const filenamePrefix = document.getElementById('filenamePrefix').value;
        const filenameSuffix = document.getElementById('filenameSuffix').value;
        const logoSize = parseInt(document.getElementById('logoSize').value);
        const logoBackground = document.getElementById('logoBackground').checked;

        if (isNaN(linkColumnIndex) || isNaN(filenameColumnIndex)) {
            alert('Please select both link and filename columns.');
            return;
        }

        const generateBtn = document.getElementById('generateBtn');
        const progressContainer = document.getElementById('progressContainer');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const progressDetails = document.getElementById('progressDetails');
        const successCount = document.getElementById('successCount');
        const failedCount = document.getElementById('failedCount');

        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        progressContainer.style.display = 'block';
        this.generatedQRCodes = [];
        
        // Reset counters
        successCount.textContent = '0';
        failedCount.textContent = '0';

        const validRows = this.data.rows.filter(row => 
            row[linkColumnIndex] && row[filenameColumnIndex]
        );

        // Process in batches for better performance
        const totalBatches = Math.ceil(validRows.length / this.batchSize);
        
        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const batchStart = batchIndex * this.batchSize;
            const batchEnd = Math.min(batchStart + this.batchSize, validRows.length);
            const batchRows = validRows.slice(batchStart, batchEnd);

            // Process batch
            const batchPromises = batchRows.map(async (row, index) => {
                const globalIndex = batchStart + index;
                const link = row[linkColumnIndex];
                const filename = row[filenameColumnIndex];

                try {
                    // Validate link
                    if (!this.isValidLink(link)) {
                        console.warn(`Invalid link format: ${link}`);
                        return null;
                    }

                    // Generate QR code with advanced options
                    const canvas = document.createElement('canvas');
                    console.log('Generating QR for:', link);
                    try {
                        await QRCode.toCanvas(canvas, link, {
                            width: qrSize,
                            margin: qrMargin,
                            errorCorrectionLevel: errorLevel,
                            color: {
                                dark: qrColorDark,
                                light: qrColorLight
                            }
                        });
                        console.log('QR generated successfully for:', filename);
                    } catch (qrError) {
                        console.error('QR generation failed for', filename, ':', qrError);
                        throw new Error('QR generation failed: ' + qrError.message);
                    }

                    // Add logo if uploaded
                    if (this.logoImage) {
                        await this.addLogoToCanvas(canvas, logoSize, logoBackground);
                    }

                    // Create final image with text
                    const finalCanvas = await this.createQRWithText(canvas, textBelow || filename, {
                        qrSize,
                        textSize,
                        textColor,
                        textFont
                    });
                    
                    // Convert to blob with error handling
                    const blob = await this.canvasToBlob(finalCanvas);

                    // Generate filename
                    const sanitizedFilename = this.sanitizeFilename(filename);
                    const finalFilename = `${filenamePrefix}${sanitizedFilename}${filenameSuffix}.png`;

                    return {
                        blob,
                        filename: finalFilename,
                        link,
                        text: textBelow || filename,
                        canvas: finalCanvas
                    };

                } catch (error) {
                    console.error(`Error generating QR code for ${filename}:`, error);
                    return null;
                }
            });

            // Wait for batch to complete
            const batchResults = await Promise.all(batchPromises);
            
            // Add successful results
            batchResults.forEach(result => {
                if (result) {
                    this.generatedQRCodes.push(result);
                }
            });

            // Update progress
            const progress = Math.round((batchEnd / validRows.length) * 100);
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;
            progressDetails.textContent = `${batchEnd} / ${validRows.length}`;
            
            // Update success/failure counts
            const currentSuccess = this.generatedQRCodes.length;
            const currentFailed = batchEnd - currentSuccess;
            successCount.textContent = currentSuccess;
            failedCount.textContent = currentFailed;

            // Small delay to prevent UI freezing
            if (batchIndex < totalBatches - 1) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }

        // Show download section and preview
        document.getElementById('downloadSection').style.display = 'block';
        const finalSuccessCount = this.generatedQRCodes.length;
        const totalCount = validRows.length;
        const finalFailedCount = totalCount - finalSuccessCount;
        
        let infoText = `Generated ${finalSuccessCount} QR codes successfully!`;
        if (finalFailedCount > 0) {
            infoText += ` (${finalFailedCount} failed - check console for details)`;
        }
        
        document.getElementById('downloadInfo').textContent = infoText;
        this.showPreview();
        
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<i class="fas fa-play"></i> Start Generation';
        
        // Update final counts
        successCount.textContent = finalSuccessCount;
        failedCount.textContent = finalFailedCount;
    }

    isValidLink(link) {
        if (!link || typeof link !== 'string') {
            console.log('Invalid link: not a string or empty');
            return false;
        }
        
        const trimmedLink = link.trim();
        if (trimmedLink.length === 0) {
            console.log('Invalid link: empty after trim');
            return false;
        }
        
        if (trimmedLink.length > 2000) {
            console.log('Invalid link: too long');
            return false;
        }
        
        // Very permissive validation - almost any text is valid for QR codes
        console.log('Link validation passed for:', trimmedLink);
        return true;
    }

    async addLogoToCanvas(canvas, logoSizePercent, addBackground) {
        if (!this.logoImage) return;

        const ctx = canvas.getContext('2d');
        
        // Constrain logo size to prevent it from exceeding canvas boundaries
        // Maximum logo size should be 40% of canvas to maintain QR code readability
        const maxLogoPercent = 40;
        const constrainedLogoPercent = Math.min(logoSizePercent, maxLogoPercent);
        
        const logoSize = (canvas.width * constrainedLogoPercent) / 100;
        
        // Ensure logo doesn't exceed canvas bounds with some padding
        const maxLogoSize = Math.min(canvas.width * 0.4, canvas.height * 0.4);
        const finalLogoSize = Math.min(logoSize, maxLogoSize);
        
        const x = (canvas.width - finalLogoSize) / 2;
        const y = (canvas.height - finalLogoSize) / 2;

        if (addBackground) {
            // Add white background circle with proper sizing
            const backgroundRadius = finalLogoSize / 2 + 5;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, backgroundRadius, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Draw logo with proper sizing
        ctx.drawImage(this.logoImage, x, y, finalLogoSize, finalLogoSize);
    }

    async canvasToBlob(canvas) {
        return new Promise((resolve, reject) => {
            try {
                canvas.toBlob(blob => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create blob from canvas'));
                    }
                }, 'image/png', 0.95);
            } catch (error) {
                reject(error);
            }
        });
    }

    async createQRWithText(qrCanvas, text, options) {
        const { qrSize, textSize = 16, textColor = '#000000', textFont = 'Arial' } = options;
        const padding = 20;
        const fontSize = Math.max(12, Math.min(textSize, 24)); // Constrain font size
        
        const finalCanvas = document.createElement('canvas');
        const ctx = finalCanvas.getContext('2d');
        
        // Pre-calculate text dimensions to properly size canvas
        let textHeight = 0;
        let lines = [];
        
        if (text && text.trim()) {
            ctx.font = `${fontSize}px ${textFont}, sans-serif`;
            const maxWidth = qrSize - 20; // Leave some padding for text
            lines = this.wrapText(ctx, text.trim(), maxWidth);
            const lineHeight = fontSize + 6; // Increased line spacing
            textHeight = lines.length * lineHeight + 30; // Extra padding for text area
        }
        
        // Set canvas size with proper calculations
        finalCanvas.width = Math.max(qrSize + (padding * 2), 300); // Minimum width
        finalCanvas.height = qrSize + textHeight + (padding * 2);
        
        // Fill white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
        
        // Draw QR code centered horizontally
        const qrX = (finalCanvas.width - qrSize) / 2;
        ctx.drawImage(qrCanvas, qrX, padding, qrSize, qrSize);
        
        // Draw text if present
        if (text && text.trim() && lines.length > 0) {
            ctx.fillStyle = textColor;
            ctx.font = `${fontSize}px ${textFont}, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            
            const lineHeight = fontSize + 6;
            const textStartY = qrSize + padding + 20; // Space between QR and text
            
            lines.forEach((line, index) => {
                const textY = textStartY + (index * lineHeight);
                // Ensure text doesn't exceed canvas height
                if (textY + fontSize <= finalCanvas.height - padding) {
                    ctx.fillText(line, finalCanvas.width / 2, textY);
                }
            });
        }
        
        return finalCanvas;
    }

    wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0] || '';

        for (let i = 1; i < words.length; i++) {
            const testLine = currentLine + ' ' + words[i];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine.length > 0) {
                lines.push(currentLine);
                currentLine = words[i];
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine.length > 0) {
            lines.push(currentLine);
        }
        
        return lines;
    }

    sanitizeFilename(filename) {
        return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    }

    showPreview() {
        // For the new UI, just show the download section
        // The preview is handled by the live preview panel
        document.getElementById('downloadSection').style.display = 'block';
    }

    async downloadZip() {
        if (this.generatedQRCodes.length === 0) {
            alert('No QR codes to download. Please generate QR codes first.');
            return;
        }

        const downloadBtn = document.getElementById('downloadBtn');
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating ZIP...';

        try {
            const zip = new JSZip();
            
            // Add all QR codes to zip
            this.generatedQRCodes.forEach(qrCode => {
                zip.file(qrCode.filename, qrCode.blob);
            });

            // Generate zip file
            const zipBlob = await zip.generateAsync({ 
                type: 'blob',
                compression: "DEFLATE",
                compressionOptions: {
                    level: 6
                }
            });
            
            // Create download link
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `qr_codes_${new Date().toISOString().slice(0, 10)}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download ZIP File';
            downloadBtn.disabled = false;

        } catch (error) {
            console.error('Error creating ZIP file:', error);
            alert('Error creating ZIP file. Please try again.');
            downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download ZIP File';
            downloadBtn.disabled = false;
        }
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing QR Code Generator...');
    try {
        window.qrGenerator = new QRCodeGenerator();
        console.log('QR Code Generator initialized successfully');
    } catch (error) {
        console.error('Failed to initialize QR Code Generator:', error);
    }
});