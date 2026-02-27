const {chromium} = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * Send log messages to the renderer process
 */
function createLogger(mainWindow) {
    return (message, type = 'info') => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('bot-log', {message, type});
        }
        console.log(`[${type.toUpperCase()}] ${message}`);
    };
}

/**
 * Get files from folder filtered by content type
 */
function getFilesFromFolder(folderPath, contentType) {
    const photoExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];

    return fs.readdirSync(folderPath)
        .filter(f => {
            const ext = path.extname(f).toLowerCase();
            if (contentType === 'Photo') {
                return photoExtensions.includes(ext);
            } else if (contentType === 'Video') {
                return videoExtensions.includes(ext);
            }
            return false;
        })
        .map(f => path.join(folderPath, f));
}


/**
 * Perform complete login process
 */
async function performLogin(page, params, log) {
    const { username, password } = params;

    log('Opening Fotoyu login page...');
    await page.bringToFront();
    await page.goto('https://www.fotoyu.com/login', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
    });

    log('Filling username...');
    const usernameInput = page.locator('input[type="text"], input[name="username"], input[placeholder*="username"]').first();
    await usernameInput.fill(username);

    log('Clicking Lanjut button...');
    const lanjutButton = page.locator('div[data-cy="AuthLoginFormLoginButton"], button:has-text("Lanjut"), div[label="Lanjut"]').first();
    await lanjutButton.click();

    log('Filling password...');
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    await passwordInput.fill(password);

    log('Clicking Masuk button...');
    const loginButton = page.locator('div[label="Masuk"], div[data-cy="AuthLoginFormLoginButton"]:has-text("Masuk"), button:has-text("Masuk")').first();
    await loginButton.click();

    log('Waiting for login to complete...');
    await page.waitForURL(/fotoyu\.com\/(?!login)/, {timeout: 15000});
    log('Login successful!');
}

/**
 * Navigate to upload page
 */
async function navigateToUploadPage(page, username, log) {
    log('Navigating to profile page...');

    try {
        // Use 'domcontentloaded' instead of 'networkidle' for faster, more reliable loading
        await page.goto(`https://www.fotoyu.com/profile/${username}?type=all`, {
            waitUntil: 'domcontentloaded',
            timeout: 60000 // 60 seconds timeout
        });
    } catch (error) {
        if (error.message.includes('Timeout')) {
            log('Page load slow, trying to continue anyway...', 'warning');
            // Page may have loaded enough content, try to continue
        } else {
            throw error;
        }
    }

    log('Waiting for upload button...');
    await page.waitForSelector('div[label="Unggah"]', {timeout: 30000});
    await page.click('div[label="Unggah"]');

    log('Navigating to upload page...');
    await page.waitForSelector('p:has-text("Pilih Tipe Konten")', {timeout: 15000});
    await page.getByText("Unggah kreasimu ke server Fotoyu, agar RoboYu milik Yuser bisa menemukannya.", {exact: true}).click();

    await page.waitForURL('https://www.fotoyu.com/upload', {timeout: 30000});
    log('Upload page loaded successfully');
}

/**
 * Trigger file chooser dialog
 */
async function triggerFileChooser(page, contentType, log) {
    log('Triggering file chooser...');

    try {
        const dropzoneSelector = contentType === 'Photo'
            ? 'div.DragDrop__StyledContainer-sc-z8ly7x-0:has(p:has-text("Foto"))'
            : 'div.DragDrop__StyledContainer-sc-z8ly7x-0:has(p:has-text("Pratinjau Video"))';

        const dropzone = page.locator(dropzoneSelector).first();

        // Wait for the element to be visible
        await dropzone.waitFor({ state: 'visible', timeout: 10000 });

        log(`Clicking ${contentType} upload zone...`);
        await dropzone.click();

        log('Upload zone clicked successfully');

    } catch (clickError) {
        log(`Error clicking upload zone: ${clickError.message}, trying alternative methods...`, 'warning');

        try {
            const textSelector = contentType === 'Photo'
                ? 'p:has-text("Foto")'
                : 'p:has-text("Pratinjau Video")';

            log(`Trying fallback method with text selector: ${textSelector}`);
            const textElement = page.locator(textSelector).first();
            await textElement.click();
            log('Fallback click successful');
            return;
        } catch (fallbackError) {
            log(`Fallback method failed: ${fallbackError.message}`, 'warning');
        }

        try {
            log('Trying to trigger hidden file input directly...');
            const fileInput = page.locator('input[type="file"]').first();

            await fileInput.evaluate(input => input.click());
            log('Hidden file input triggered successfully');
        } catch (inputError) {
            log(`Hidden input trigger failed: ${inputError.message}`, 'error');
            throw new Error(`Failed to trigger file chooser: ${clickError.message}`);
        }
    }
}

/**
 * Upload files batch
 */
async function uploadFilesBatch(page, batch, contentType, log, isCancelled) {
    const fileChooserPromise = page.waitForEvent('filechooser', {timeout: 30000});

    await triggerFileChooser(page, contentType, log);

    log(`Waiting for file chooser...`);
    const fileChooser = await fileChooserPromise;

    // Check cancellation before selecting files
    if (isCancelled && isCancelled()) {
        log('Upload cancelled during file selection', 'warning');
        throw new Error('Upload cancelled by user');
    }

    log(`Selecting ${batch.length} files...`);
    await fileChooser.setFiles(batch);

    log(`Files selected, waiting for compression to complete...`);
}

/**
 * Fill price field
 */
async function fillPrice(page, harga, log) {
    if (!harga) return;

    log('Setting price (harga)...');

    // Try multiple selectors
    const selectors = [
        'input[name="price"]',
        'input[placeholder*="Harganya"]',
        'input[placeholder*="harga"]',
        'input[placeholder*="Harga"]'
    ];

    let found = false;
    for (const selector of selectors) {
        const hargaInput = page.locator(selector).first();
        if (await hargaInput.count() > 0) {
            log(`Price input found with selector: ${selector}`);
            await hargaInput.clear();
            await hargaInput.fill(harga.toString());
            log(`Price set to: ${harga}`);
            found = true;
            break;
        }
    }

    if (!found) {
        log('Price input not found - tried all selectors', 'warning');
        log(`Selectors attempted: ${selectors.join(', ')}`, 'warning');
    }
}

/**
 * Fill description field
 */
async function fillDescription(page, deskripsi, log) {
    if (!deskripsi) return;

    log('Setting description (deskripsi)...');

    // Try multiple selectors
    const selectors = [
        'textarea[name="description"]',
        'textarea[placeholder*="Ceritakan tentang konten kamu"]',
        'textarea[placeholder*="deskripsi"]',
        'textarea[placeholder*="Deskripsi"]'
    ];

    let found = false;
    for (const selector of selectors) {
        const deskripsiInput = page.locator(selector).first();
        if (await deskripsiInput.count() > 0) {
            log(`Description input found with selector: ${selector}`);
            await deskripsiInput.clear();
            await deskripsiInput.fill(deskripsi);
            log(`Description set`);
            found = true;
            break;
        }
    }

    if (!found) {
        log('Description input not found - tried all selectors', 'warning');
        log(`Selectors attempted: ${selectors.join(', ')}`, 'warning');
    }
}

async function fillFotoTree(page, fototree, log) {
    if (!fototree) return;

    log('Setting fototree...');

    const input = page.locator('input[placeholder*="FotoTree" i]').first();
    await input.waitFor({ state: 'visible' });

    await input.fill(fototree, { delay: 80 });

    // Wait for the exact visible text in dropdown
    const optionTitle = page.getByText(fototree, { exact: true });

    await optionTitle.waitFor({ state: 'visible', timeout: 0 });

    // Click the clickable parent card
    await optionTitle.locator('xpath=ancestor::div[1]').click();

    log(`✓ FotoTree selected: ${fototree}`);
}


/**
 * Close age warning modal if it appears
 */
async function closeWarningModal(page, log) {
    try {
        await page.waitForTimeout(1000);

        const warningModal = page.locator('p:has-text("TUTUP")');

        if (await warningModal.count() > 0) {
            const tutupButton = page.locator('button:has-text("TUTUP"), div[label="TUTUP"], div:has-text("TUTUP")').first();

            if (await tutupButton.count() > 0) {
                log('Clicking TUTUP button to close age warning modal...');
                await tutupButton.click();
                await page.waitForTimeout(1000);
                log('Age warning modal closed');
            } else {
                // Try pressing Escape key to close modal
                log('TUTUP button not found, trying Escape key...');
                await page.keyboard.press('Escape');
                await page.waitForTimeout(1000);
            }
        }
    } catch (error) {
        log(`Error handling age warning modal: ${error.message}`, 'warning');
    }
}

/**
 * Fill all metadata fields
 */
async function fillMetadata(page, metadata, log, isCancelled) {
    log('Waiting for metadata form to be ready...');

    // Check cancellation before starting
    if (isCancelled && isCancelled()) {
        log('Upload cancelled before filling metadata', 'warning');
        throw new Error('Upload cancelled by user');
    }

    try {
        await page.waitForSelector(
            'input[name="price"], textarea[placeholder*="Ceritakan tentang konten kamu"], input[placeholder*="FotoTree"]',
            { state: 'visible', timeout: 0 }
        );
        log('Metadata form detected and visible!');
    } catch (error) {
        log('Timeout waiting for metadata form, trying anyway...', 'warning');

        // Take a screenshot for debugging
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const screenshotPath = `/tmp/fotoyu-debug-${timestamp}.png`;
            await page.screenshot({ path: screenshotPath, fullPage: true });
            log(`Screenshot saved to: ${screenshotPath}`, 'warning');
        } catch (screenshotError) {
            log(`Could not save screenshot: ${screenshotError.message}`, 'warning');
        }
    }

    // Check cancellation after waiting for form
    if (isCancelled && isCancelled()) {
        log('Upload cancelled while waiting for metadata form', 'warning');
        throw new Error('Upload cancelled by user');
    }

    await closeWarningModal(page, log);

    // Check cancellation before each field
    if (isCancelled && isCancelled()) {
        log('Upload cancelled during metadata filling', 'warning');
        throw new Error('Upload cancelled by user');
    }

    await fillPrice(page, metadata.harga, log);

    if (isCancelled && isCancelled()) {
        log('Upload cancelled during metadata filling', 'warning');
        throw new Error('Upload cancelled by user');
    }

    await fillDescription(page, metadata.deskripsi, log);

    if (isCancelled && isCancelled()) {
        log('Upload cancelled during metadata filling', 'warning');
        throw new Error('Upload cancelled by user');
    }

    await fillFotoTree(page, metadata.fototree, log);

    log('Metadata filled successfully');
}

/**
 * Handle result after upload (Success or Duplicate)
 * Returns: true if duplicate detected, false if success
 */
async function handleUploadResult(page, log) {
    try {
        log('Waiting for upload to complete...');

        const successSelector = 'p:has-text("Diunggah! Tetapi"), p:has-text("konten terdeteksi sebagai duplikat"), p:has-text("berhasil"), p:has-text("selesai")';

        // Wait indefinitely until the result modal appears (no timeout)
        await page.locator(successSelector).first().waitFor({
            state: 'visible',
            timeout: 0
        });

        log('Upload result modal appeared, checking result...');

        // Check if duplicate modal exists
        const duplicateModal = page.locator('p:has-text("Diunggah! Tetapi")');
        const duplicateWarning = page.locator('p:has-text("konten terdeteksi sebagai duplikat")');

        if (await duplicateModal.count() > 0 || await duplicateWarning.count() > 0) {
            log('⚠️ Duplicate content detected!', 'warning');

            // Extract duplicate count if available
            const warningText = await duplicateWarning.textContent().catch(() => '');
            if (warningText) {
                log(`Details: ${warningText}`, 'warning');
            }

            // Close the duplicate modal
            const viewReportButton = page.locator('div[label="Lihat Laporan"], button:has-text("Lihat Laporan")').first();
            const closeButton = page.locator('button[aria-label="Close"], div[aria-label="Close"]').first();

            if (await viewReportButton.count() > 0) {
                log('Viewing duplicate report...');
                await viewReportButton.click();
                await page.waitForTimeout(2000);
            } else if (await closeButton.count() > 0) {
                log('Closing duplicate modal...');
                await closeButton.click();
                await page.waitForTimeout(1000);
            } else {
                // Try pressing Escape key to close modal
                log('Closing modal with Escape...');
                await page.keyboard.press('Escape');
                await page.waitForTimeout(1000);
            }

            return true; // Duplicate detected
        }

        // Check for success indicators
        const successModal = page.locator('p:has-text("berhasil"), p:has-text("selesai")');
        if (await successModal.count() > 0) {
            log('✓ Upload successful!', 'success');

            // Close success modal if present
            const closeButton = page.locator('button[aria-label="Close"], div[aria-label="Close"]').first();
            if (await closeButton.count() > 0) {
                await closeButton.click();
                await page.waitForTimeout(500);
            }
        }
    } catch (error) {
        log(`Error checking result: ${error.message}`, 'warning');
    }
}

/**
 * Click the publish/upload button
 */
async function publishUpload(page, log) {
    log('Looking for Unggah button to publish...');

    const unggahButton = page.locator(
        'div[label="Unggah"]:has-text("Unggah"), ' +
        'button:has-text("Unggah"), ' +
        'div[data-testid="button"]:has-text("Unggah")'
    ).first();

    await unggahButton.click();
}

/**
 * Process a single batch through the complete upload flow
 * Flow: Upload Page -> Choose Files -> Fill Metadata -> Publish -> Handle Result
 */
async function processSingleBatch(page, batch, batchNumber, totalBatches, params, metadata, log, isCancelled) {
    const { username, contentType } = params;

    log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} files)...`);

    // Check cancellation before each major step
    if (isCancelled && isCancelled()) {
        log(`[Batch ${batchNumber}] Upload cancelled by user`, 'warning');
        throw new Error('Upload cancelled by user');
    }

    // Step 1: Navigate to Upload Page
    log(`[Batch ${batchNumber}] Step 1: Navigating to upload page...`);
    await navigateToUploadPage(page, username, log);

    if (isCancelled && isCancelled()) {
        log(`[Batch ${batchNumber}] Upload cancelled by user`, 'warning');
        throw new Error('Upload cancelled by user');
    }

    // Step 2: Choose Files
    log(`[Batch ${batchNumber}] Step 2: Selecting ${batch.length} files...`);
    await uploadFilesBatch(page, batch, contentType, log, isCancelled);

    if (isCancelled && isCancelled()) {
        log(`[Batch ${batchNumber}] Upload cancelled by user`, 'warning');
        throw new Error('Upload cancelled by user');
    }

    // Step 3: Fill Metadata (FotoTree, Price, Description)
    log(`[Batch ${batchNumber}] Step 3: Filling metadata...`);
    await fillMetadata(page, metadata, log, isCancelled);

    if (isCancelled && isCancelled()) {
        log(`[Batch ${batchNumber}] Upload cancelled by user`, 'warning');
        throw new Error('Upload cancelled by user');
    }

    // Step 4: Publish/Upload
    log(`[Batch ${batchNumber}] Step 4: Publishing upload...`);
    await publishUpload(page, log);

    if (isCancelled && isCancelled()) {
        log(`[Batch ${batchNumber}] Upload cancelled by user`, 'warning');
        throw new Error('Upload cancelled by user');
    }

    // Step 5: Handle Result (Success or Duplicate)
    log(`[Batch ${batchNumber}] Step 5: Checking result...`);
    await handleUploadResult(page, log);
}

/**
 * Process batches in a single window from a shared queue.
 * Each window processes batches one by one until the queue is empty.
 */
async function processWindowBatches(page, windowId, batchQueue, params, metadata, log, isCancelled, stats) {
    log(`[Window ${windowId}] Initialized and ready to process batches`);

    while (batchQueue.length > 0) {
        // Check if upload was cancelled
        if (isCancelled && isCancelled()) {
            log(`[Window ${windowId}] Upload cancelled, stopping...`, 'warning');
            break;
        }

        // Get next batch from queue
        const batchInfo = batchQueue.shift();
        if (!batchInfo) break;

        const { batch, batchNumber, totalBatches } = batchInfo;

        try {
            log(`[Window ${windowId}] Starting batch ${batchNumber}/${totalBatches}`);

            // Process this batch through the complete flow (with cancellation check)
            await processSingleBatch(page, batch, batchNumber, totalBatches, params, metadata, log, isCancelled);

            // Update statistics
            stats.filesUploaded += batch.length;
            stats.batchesCompleted++;

            log(`[Window ${windowId}] ✓ Batch ${batchNumber}/${totalBatches} finished`);

            // Check if more batches exist
            if (batchQueue.length > 0) {
                log(`[Window ${windowId}] More batches available (${batchQueue.length} remaining), continuing...`);
                await page.waitForTimeout(2000);
            } else {
                log(`[Window ${windowId}] No more batches in queue`);
            }

        } catch (error) {
            // Check if error is due to cancellation
            if (error.message.includes('cancelled by user')) {
                log(`[Window ${windowId}] ✗ Upload cancelled by user`, 'warning');
                break; // Stop processing immediately
            }

            log(`[Window ${windowId}] ✗ Error in batch ${batchNumber}: ${error.message}`, 'error');
            log(`[Window ${windowId}] Continuing with next batch...`);
            // Continue with next batch despite error
        }
    }

    log(`[Window ${windowId}] Finished all batches`);
}

/**
 * Launch a separate browser window (its own browser instance + context),
 * perform login, and return { browser, context, page }.
 */
async function launchWindow(windowId, params, log) {
    log(`[Window ${windowId}] Launching separate browser window...`);

    const browser = await chromium.launch({
        headless: false,
    });

    const context = await browser.newContext({
        viewport: null,
        permissions: ['geolocation']
    });

    const page = await context.newPage();

    log(`[Window ${windowId}] Browser window launched, performing login...`);
    await performLogin(page, params, log);
    log(`[Window ${windowId}] Login successful, window ready`);

    return { browser, context, page };
}

/**
 * Cleanup a single browser window's resources.
 */
async function cleanupWindow(windowId, browser, context, log) {
    try {
        if (context) await context.close();
        if (browser) await browser.close();
        log(`[Window ${windowId}] Browser window closed`);
    } catch (error) {
        log(`[Window ${windowId}] Error during cleanup: ${error.message}`, 'warning');
    }
}

/**
 * Distribute batches across multiple independent browser windows and process concurrently.
 */
async function runMultiWindowUpload(params, log, isCancelled) {
    const {
        folderPath,
        filesToUpload,
        contentType,
        batchSize,
        harga,
        deskripsi,
        fototree,
        concurrentBot
    } = params;

    const numWindows = concurrentBot; // reuse concurrentBot param, now means windows

    // Get files - either from filesToUpload or read from folder
    let files;
    if (filesToUpload && Array.isArray(filesToUpload) && filesToUpload.length > 0) {
        files = filesToUpload;
        log(`Uploading ${files.length} specific file(s)`);
    } else {
        files = getFilesFromFolder(folderPath, contentType);
        log(`Found ${files.length} ${contentType.toLowerCase()} files to upload`);
    }

    if (files.length === 0) {
        log('No files found to upload', 'warning');
        return 0;
    }

    // Prepare metadata
    const metadata = { harga, deskripsi, fototree };

    // Create batch queue
    const batchQueue = [];
    const totalBatches = Math.ceil(files.length / batchSize);

    for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        batchQueue.push({ batch, batchNumber, totalBatches });
    }

    log(`Created ${totalBatches} batches to be processed by ${numWindows} window(s)`);

    // Launch all windows concurrently (each does its own login)
    log(`Launching ${numWindows} browser window(s)...`);
    const windowLaunchPromises = [];
    for (let i = 0; i < numWindows; i++) {
        // Stagger launches slightly to avoid race conditions at login
        windowLaunchPromises.push(
            new Promise(resolve => setTimeout(resolve, i * 4000))
                .then(() => launchWindow(i + 1, params, log))
                .then(win => ({ ...win, id: i + 1 }))
        );
    }

    let windows;
    try {
        windows = await Promise.all(windowLaunchPromises);
    } catch (launchError) {
        log(`Failed to launch/login one or more windows: ${launchError.message} — closing all browsers...`, 'error');
        // Collect any windows that did launch successfully and close them
        const settled = await Promise.allSettled(windowLaunchPromises);
        await Promise.allSettled(
            settled
                .filter(r => r.status === 'fulfilled' && r.value)
                .map(r => cleanupWindow(r.value.id, r.value.browser, r.value.context, log))
        );
        throw launchError;
    }
    log(`All ${numWindows} window(s) ready, starting concurrent upload...`);

    // Shared statistics
    const stats = {
        filesUploaded: 0,
        batchesCompleted: 0
    };

    // Process batches concurrently across all windows
    const windowPromises = windows.map(win =>
        processWindowBatches(win.page, win.id, batchQueue, params, metadata, log, isCancelled, stats)
            .finally(() => cleanupWindow(win.id, win.browser, win.context, log))
    );

    // Wait for all windows to complete
    await Promise.all(windowPromises);

    log(`All windows completed! Total: ${stats.filesUploaded} files uploaded in ${stats.batchesCompleted} batches`, 'success');
    return stats.filesUploaded;
}

async function runBot(params, mainWindow, isCancelled) {
    const log = createLogger(mainWindow);

    try {
        const concurrentWindows = params.concurrentBot || 1;
        log(`Using ${concurrentWindows} concurrent browser window(s) for uploading`);

        // Run multi-window upload (each window manages its own browser instance)
        const totalFiles = await runMultiWindowUpload(params, log, isCancelled);

        return { success: true, totalFiles };

    } catch (error) {
        if (error.message && error.message.includes('cancelled by user')) {
            log('Upload cancelled by user', 'warning');
            return { success: false, cancelled: true };
        }

        console.error("An error occurred during bot execution:", error);
        log(`Fatal error: ${error.message}`, 'error');
        return { success: false, error: error.message };
    }
}

module.exports = { runBot };

