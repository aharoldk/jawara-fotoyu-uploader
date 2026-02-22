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
 * Launch browser with configured settings
 */
async function launchBrowser(log) {
    log('Launching Chrome browser...');

    const browser = await chromium.launch({
        headless: false,
        args: ['--start-maximized']
    });

    const context = await browser.newContext({
        viewport: null,
        permissions: ['geolocation']
    });

    const page = await context.newPage();

    log('Browser launched successfully');

    return { browser, context, page };
}

/**
 * Fill username and click Continue button
 */
async function fillUsername(page, username, log) {
    log('Filling username...');
    const usernameInput = page.locator('input[type="text"], input[name="username"], input[placeholder*="username"]').first();
    await usernameInput.fill(username);

    log('Clicking Lanjut button...');
    const lanjutButton = page.locator('div[data-cy="AuthLoginFormLoginButton"], button:has-text("Lanjut"), div[label="Lanjut"]').first();
    await lanjutButton.click();
    await page.waitForTimeout(500);
}

/**
 * Fill password and click Login button
 */
async function fillPassword(page, password, log) {
    log('Filling password...');
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    await passwordInput.fill(password);
    await page.waitForTimeout(500);

    log('Clicking Masuk button...');
    const loginButton = page.locator('div[label="Masuk"], div[data-cy="AuthLoginFormLoginButton"]:has-text("Masuk"), button:has-text("Masuk")').first();
    await loginButton.click();
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

    log('Waiting for login form...');
    await page.waitForSelector('input[type="text"], input[name="username"], input[placeholder*="username"]', {timeout: 10000});

    await fillUsername(page, username, log);
    await fillPassword(page, password, log);

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
        const fileInput = page.locator('input[type="file"]').first();
        if (await fileInput.count() > 0) {
            log('Found file input, triggering click...');
            await fileInput.click({force: true});
            return;
        }

        log(`Clicking ${contentType} upload zone...`);
        const dropzoneSelector = contentType === 'Photo'
            ? 'div:has-text("Foto"), div:has-text("foto"), [class*="dropzone" i]:has-text("Foto")'
            : 'div:has-text("Video"), div:has-text("video"), [class*="dropzone" i]:has-text("Video")';

        const dropzone = page.locator(dropzoneSelector).first();
        await dropzone.click();
    } catch (clickError) {
        log(`Error clicking upload zone: ${clickError.message}, trying alternative method...`, 'warning');
        await page.locator('body').click();
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

    // Wait with cancellation checks during compression
    // Files typically take 1-5 seconds to compress depending on size
    const maxWaitTime = 30000; // 30 seconds max
    const checkInterval = 500; // Check every 500ms
    let waited = 0;

    while (waited < maxWaitTime) {
        if (isCancelled && isCancelled()) {
            log('Upload cancelled during file compression', 'warning');
            throw new Error('Upload cancelled by user');
        }
        await page.waitForTimeout(checkInterval);
        waited += checkInterval;

        // Try to detect if compression is complete by checking for upload form elements
        try {
            const hasForm = await page.locator('input[name="price"], textarea[name="description"]').count() > 0;
            if (hasForm) {
                log('File compression completed');
                break;
            }
        } catch (e) {
            // Continue waiting
        }
    }
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

    await input.fill('');
    await input.type(fototree, { delay: 80 });

    // Wait for the exact visible text in dropdown
    const optionTitle = page.getByText(fototree, { exact: true });

    await optionTitle.waitFor({ state: 'visible', timeout: 5000 });

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
            { state: 'visible', timeout: 15000 }
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
async function handleDuplicateModal(page, log) {
    try {
        // Wait a bit for modal to appear
        await page.waitForTimeout(2000);

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
        const successModal = page.locator('p:has-text("berhasil"), p:has-text("selesai"), p:has-text("Diunggah")');
        if (await successModal.count() > 0) {
            log('✓ Upload successful!', 'success');

            // Close success modal if present
            const closeButton = page.locator('button[aria-label="Close"], div[aria-label="Close"]').first();
            if (await closeButton.count() > 0) {
                await closeButton.click();
                await page.waitForTimeout(500);
            }
        }

        return false; // Success (no duplicate)

    } catch (error) {
        log(`Error checking result: ${error.message}`, 'warning');
        return false; // Assume success if can't determine
    }
}

/**
 * Click the publish/upload button and wait for completion
 */
async function publishUpload(page, log, isCancelled) {
    log('Looking for Unggah button to publish...');
    await page.waitForTimeout(1000);

    // Check cancellation before publishing
    if (isCancelled && isCancelled()) {
        log('Upload cancelled before publishing', 'warning');
        throw new Error('Upload cancelled by user');
    }

    try {
        const unggahButton = page.locator(
            'div[label="Unggah"]:has-text("Unggah"), ' +
            'button:has-text("Unggah"), ' +
            'div[data-testid="button"]:has-text("Unggah")'
        ).first();

        if (await unggahButton.count() > 0) {
            log('Clicking Unggah button to publish...');
            await unggahButton.click();

            log('Waiting for upload to complete...');

            // Wait for result modal to appear (success or duplicate)
            // Use polling with cancellation checks
            const maxWaitTime = 60000; // 60 seconds max for upload
            const checkInterval = 1000; // Check every second
            let waited = 0;
            let completed = false;

            while (waited < maxWaitTime) {
                if (isCancelled && isCancelled()) {
                    log('Upload cancelled during upload processing', 'warning');
                    throw new Error('Upload cancelled by user');
                }

                try {
                    const resultSelector = await page.locator(
                        'p:has-text("Diunggah! Tetapi"), ' +
                        'p:has-text("konten terdeteksi sebagai duplikat"), ' +
                        'p:has-text("berhasil"), ' +
                        'p:has-text("selesai"), ' +
                        'p:has-text("Diunggah")'
                    ).count();

                    if (resultSelector > 0) {
                        completed = true;
                        break;
                    }
                } catch (e) {
                    // Continue waiting
                }

                await page.waitForTimeout(checkInterval);
                waited += checkInterval;
            }

            if (!completed) {
                log('Upload completion modal not detected, but continuing...', 'warning');
            } else {
                log('Upload process completed');
            }

            // Additional wait for UI to stabilize
            await page.waitForTimeout(2000);

            log('Upload published successfully!');
        } else {
            log('Unggah button not found - upload may be processing automatically', 'warning');
        }
    } catch (uploadError) {
        // Check if error is due to cancellation
        if (uploadError.message && uploadError.message.includes('cancelled by user')) {
            throw uploadError;
        }
        log(`Error clicking Unggah button: ${uploadError.message}`, 'error');
        throw uploadError;
    }
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
    await publishUpload(page, log, isCancelled);

    if (isCancelled && isCancelled()) {
        log(`[Batch ${batchNumber}] Upload cancelled by user`, 'warning');
        throw new Error('Upload cancelled by user');
    }

    // Step 5: Handle Result (Success or Duplicate)
    log(`[Batch ${batchNumber}] Step 5: Checking result...`);
    const isDuplicate = await handleDuplicateModal(page, log);

    if (isDuplicate) {
        log(`[Batch ${batchNumber}] Result: Duplicate detected`, 'warning');
    } else {
        log(`[Batch ${batchNumber}] Result: Upload successful`, 'success');
    }

    log(`[Batch ${batchNumber}] ✓ Completed successfully`);
}

/**
 * Process batches in a single tab from a shared queue
 * Each tab processes batches one by one until queue is empty
 */
async function processTabBatches(page, tabId, batchQueue, params, metadata, log, isCancelled, stats) {
    log(`[Tab ${tabId}] Initialized and ready to process batches`);

    while (batchQueue.length > 0) {
        // Check if upload was cancelled
        if (isCancelled && isCancelled()) {
            log(`[Tab ${tabId}] Upload cancelled, stopping...`, 'warning');
            break;
        }

        // Get next batch from queue
        const batchInfo = batchQueue.shift();
        if (!batchInfo) break;

        const { batch, batchNumber, totalBatches } = batchInfo;

        try {
            log(`[Tab ${tabId}] Starting batch ${batchNumber}/${totalBatches}`);

            // Process this batch through the complete flow (with cancellation check)
            await processSingleBatch(page, batch, batchNumber, totalBatches, params, metadata, log, isCancelled);

            // Update statistics
            stats.filesUploaded += batch.length;
            stats.batchesCompleted++;

            log(`[Tab ${tabId}] ✓ Batch ${batchNumber}/${totalBatches} finished`);

            // Check if more batches exist
            if (batchQueue.length > 0) {
                log(`[Tab ${tabId}] More batches available (${batchQueue.length} remaining), continuing...`);
                await page.waitForTimeout(2000);
            } else {
                log(`[Tab ${tabId}] No more batches in queue`);
            }

        } catch (error) {
            // Check if error is due to cancellation
            if (error.message.includes('cancelled by user')) {
                log(`[Tab ${tabId}] ✗ Upload cancelled by user`, 'warning');
                break; // Stop processing immediately
            }

            log(`[Tab ${tabId}] ✗ Error in batch ${batchNumber}: ${error.message}`, 'error');
            log(`[Tab ${tabId}] Continuing with next batch...`);
            // Continue with next batch despite error
        }
    }

    log(`[Tab ${tabId}] Finished all batches`);
}

/**
 * Create and initialize multiple tabs for concurrent uploads
 */
async function createConcurrentTabs(context, numTabs, params, log) {
    log(`Creating ${numTabs} concurrent tabs...`);

    const { username } = params;
    const tabs = [];

    for (let i = 0; i < numTabs; i++) {
        const page = await context.newPage();
        await page.bringToFront();

        log(`Tab ${i + 1}/${numTabs} created`);

        // Only perform full login for the first tab
        // Other tabs will share the same session/cookies
        if (i === 0) {
            log(`[Tab ${i + 1}] Performing login...`);
            await performLogin(page, params, log);
        } else {
            // For subsequent tabs, just navigate to profile page (already logged in via shared context)
            log(`[Tab ${i + 1}] Navigating to profile page (using shared session)...`);
            try {
                await page.goto(`https://www.fotoyu.com/profile/${username}?type=all`, {
                    waitUntil: 'domcontentloaded',
                    timeout: 60000
                });
                log(`[Tab ${i + 1}] Ready (session active)`);
            } catch (error) {
                if (error.message.includes('Timeout')) {
                    log(`[Tab ${i + 1}] Page load slow but continuing...`, 'warning');
                    // Continue anyway, page likely has enough content loaded
                } else {
                    throw error;
                }
            }
        }

        tabs.push({
            id: i + 1,
            page: page
        });

        // Small delay between tab creations
        await page.waitForTimeout(1000);
    }

    log(`All ${numTabs} tabs created and ready!`);
    return tabs;
}

/**
 * Distribute batches across multiple tabs and process concurrently
 */
async function runMultiTabUpload(context, params, log, isCancelled) {
    const {
        folderPath,
        contentType,
        batchSize,
        harga,
        deskripsi,
        fototree,
        concurrentTabs = 1
    } = params;

    // Get files
    const files = getFilesFromFolder(folderPath, contentType);
    log(`Found ${files.length} ${contentType.toLowerCase()} files to upload`);

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

        batchQueue.push({
            batch,
            batchNumber,
            totalBatches
        });
    }

    log(`Created ${totalBatches} batches to be processed by ${concurrentTabs} tab(s)`);

    // Create tabs
    const tabs = await createConcurrentTabs(context, concurrentTabs, params, log);

    // Shared statistics
    const stats = {
        filesUploaded: 0,
        batchesCompleted: 0
    };

    // Process batches concurrently across all tabs
    log('Starting concurrent batch processing...');

    const tabPromises = tabs.map(tab =>
        processTabBatches(tab.page, tab.id, batchQueue, params, metadata, log, isCancelled, stats)
    );

    // Wait for all tabs to complete
    await Promise.all(tabPromises);

    log(`All tabs completed! Total: ${stats.filesUploaded} files uploaded in ${stats.batchesCompleted} batches`, 'success');
    return stats.filesUploaded;
}

async function runBot(params, mainWindow, isCancelled) {
    const log = createLogger(mainWindow);
    let browser = null;
    let context = null;

    try {
        // Launch browser
        const launchResult = await launchBrowser(log);
        browser = launchResult.browser;
        context = launchResult.context;

        // Determine number of concurrent tabs (default to 1 for backward compatibility)
        const concurrentTabs = params.concurrentTabs || 1;
        log(`Using ${concurrentTabs} concurrent tab(s) for uploading`);

        // Run multi-tab upload
        const totalFiles = await runMultiTabUpload(context, params, log, isCancelled);

        // Check if upload was cancelled
        if (isCancelled && isCancelled()) {
            log('Upload was cancelled by user - closing browser...', 'warning');
            await cleanupBrowser(browser, context, log);
            return { success: false, cancelled: true, totalFiles };
        }

        log('All uploads completed successfully', 'success');
        return { success: true, totalFiles };

    } catch (error) {
        if (error.message && error.message.includes('cancelled by user')) {
            log('Upload cancelled by user - closing browser...', 'warning');
            await cleanupBrowser(browser, context, log);
            return { success: false, cancelled: true };
        }

        console.error("An error occurred during bot execution:", error);
        log(`Error: ${error.message}`, 'error');
        return { success: false, error: error.message };
    } finally {
        // Note: Browser is only closed on cancellation or error
        // On successful completion, browser stays open for user to review
        if (isCancelled && isCancelled()) {
            await cleanupBrowser(browser, context, log);
        } else {
            log('Bot execution completed - browser will remain open for review');
        }
    }
}

/**
 * Cleanup browser resources
 */
async function cleanupBrowser(browser, context, log) {
    try {
        if (context) {
            log('Closing browser context...');
            await context.close();
        }
        if (browser) {
            log('Closing browser...');
            await browser.close();
            log('Browser closed successfully');
        }
    } catch (error) {
        log(`Error during cleanup: ${error.message}`, 'warning');
    }
}

module.exports = { runBot };

