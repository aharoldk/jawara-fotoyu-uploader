const fs = require('fs');
const path = require('path');
const { runBot } = require('./bot');

/**
 * Autobot Handler - Manages automatic upload intervals
 */
class AutobotHandler {
    constructor() {
        this.isRunning = false;
        this.intervalId = null;
        this.uploadedFiles = new Set(); // Track uploaded files
        this.uploadedFilesPath = null; // Path to store uploaded files list
        this.config = null;
        this.mainWindow = null;
        this.checkInterval = parseInt(process.env.AUTOBOT_CHECK_INTERVAL || '60000', 10);
        this.maxFilesPerCheck = parseInt(process.env.AUTOBOT_MAX_FILES_PER_CHECK || '100', 10);
    }

    /**
     * Initialize autobot with configuration
     */
    init(config, mainWindow) {
        this.config = config;
        this.mainWindow = mainWindow;
        this.uploadedFilesPath = path.join(config.folderPath, '.fotoyu-uploaded.json');
        this.loadUploadedFiles();
    }

    /**
     * Load previously uploaded files from tracking file
     */
    loadUploadedFiles() {
        try {
            if (fs.existsSync(this.uploadedFilesPath)) {
                const data = fs.readFileSync(this.uploadedFilesPath, 'utf8');
                const files = JSON.parse(data);
                this.uploadedFiles = new Set(files);
                this.log(`Loaded ${this.uploadedFiles.size} previously uploaded files`, 'info');
            }
        } catch (error) {
            this.log(`Error loading uploaded files: ${error.message}`, 'warning');
            this.uploadedFiles = new Set();
        }
    }

    /**
     * Save uploaded files to tracking file
     */
    saveUploadedFiles() {
        try {
            const files = Array.from(this.uploadedFiles);
            fs.writeFileSync(this.uploadedFilesPath, JSON.stringify(files, null, 2), 'utf8');
        } catch (error) {
            this.log(`Error saving uploaded files: ${error.message}`, 'error');
        }
    }

    /**
     * Get new files that haven't been uploaded yet
     * Optimized for large folders with many already-uploaded files
     */
    getNewFiles(contentType) {
        try {
            const photoExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
            const extensions = contentType === 'Photo' ? photoExtensions : videoExtensions;

            // Read directory entries (faster than reading all files first)
            const entries = fs.readdirSync(this.config.folderPath, { withFileTypes: true });

            const newFilesWithStats = [];
            let scannedCount = 0;

            // Process files lazily - stop when we have enough
            for (const entry of entries) {
                // Skip directories
                if (!entry.isFile()) continue;

                // Check extension
                const ext = path.extname(entry.name).toLowerCase();
                if (!extensions.includes(ext)) continue;

                const fullPath = path.join(this.config.folderPath, entry.name);

                // Skip if already uploaded (O(1) lookup with Set)
                if (this.uploadedFiles.has(fullPath)) continue;

                scannedCount++;

                // Get file stats only for new files
                try {
                    const stats = fs.statSync(fullPath);
                    newFilesWithStats.push({
                        path: fullPath,
                        mtime: stats.mtime.getTime()
                    });

                    // Early exit if we have enough files
                    if (newFilesWithStats.length >= this.maxFilesPerCheck) {
                        this.log(`Found ${newFilesWithStats.length} new files (stopped scanning, more may exist)`, 'info');
                        break;
                    }
                } catch (error) {
                    continue;
                }
            }

            // Sort by modification time (newest first) - only sorting what we need
            newFilesWithStats.sort((a, b) => b.mtime - a.mtime);

            // Return just the paths
            const result = newFilesWithStats.map(item => item.path);

            if (result.length > 0) {
                this.log(`Found ${result.length} new file(s) out of ${scannedCount} unuploaded files scanned`, 'info');
            }

            return result;

        } catch (error) {
            this.log(`Error scanning for new files: ${error.message}`, 'error');
            return [];
        }
    }

    /**
     * Send log message to renderer
     */
    log(message, type = 'info') {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('autobot-log', { message, type });
        }
        console.log(`[AUTOBOT ${type.toUpperCase()}] ${message}`);
    }

    /**
     * Check for new files and upload them
     */
    async checkAndUpload(contentType) {
        if (!this.isRunning) return;

        this.log('Checking for new files...', 'info');

        const newFiles = this.getNewFiles(contentType);

        if (newFiles.length === 0) {
            this.log('No new files to upload', 'info');
            return;
        }

        this.log(`Found ${newFiles.length} new file(s) to upload`, 'success');

        // Prepare bot parameters
        const botParams = {
            username: this.config.username,
            password: this.config.password,
            folderPath: this.config.folderPath,
            filesToUpload: newFiles,
            contentType: contentType,
            harga: contentType === 'Photo' ? this.config.pricePhoto : this.config.priceVideo,
            deskripsi: this.config.description,
            fototree: this.config.fototree,
            batchSize: this.maxFilesPerCheck,
            concurrentTabs: 1
        };

        try {
            this.log('Starting upload process...', 'info');

            // Run the bot with the new files
            const result = await runBot(botParams, this.mainWindow, () => !this.isRunning);

            if (result.success) {
                // Mark files as uploaded
                newFiles.forEach(file => {
                    this.uploadedFiles.add(file);
                });
                this.saveUploadedFiles();

                this.log(`Upload completed! ${newFiles.length} file(s) uploaded successfully`, 'success');
            } else {
                this.log(`Upload failed: ${result.error || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            this.log(`Error during upload: ${error.message}`, 'error');
        }
    }

    /**
     * Start the autobot
     */
    async start(config, mainWindow) {
        if (this.isRunning) {
            this.log('Autobot is already running', 'warning');
            return { success: false, message: 'Autobot is already running' };
        }

        this.init(config, mainWindow);
        this.isRunning = true;

        this.log(`Autobot started! Checking every ${this.checkInterval / 1000} seconds`, 'success');
        this.log(`Monitoring folder: ${config.folderPath}`, 'info');

        // Do initial check immediately
        await this.checkAndUpload('Photo');
        await this.checkAndUpload('Video');

        // Set up interval for periodic checks
        this.intervalId = setInterval(async () => {
            await this.checkAndUpload('Photo');
            await this.checkAndUpload('Video');
        }, this.checkInterval);

        return { success: true, message: 'Autobot started successfully' };
    }

    /**
     * Stop the autobot
     */
    stop() {
        if (!this.isRunning) {
            this.log('Autobot is not running', 'warning');
            return { success: false, message: 'Autobot is not running' };
        }

        this.isRunning = false;

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.log('Autobot stopped', 'info');

        return { success: true, message: 'Autobot stopped successfully' };
    }

    /**
     * Get autobot status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            uploadedFilesCount: this.uploadedFiles.size,
            checkInterval: this.checkInterval,
            config: this.config
        };
    }
}

// Create singleton instance
const autobotHandler = new AutobotHandler();

module.exports = autobotHandler;

