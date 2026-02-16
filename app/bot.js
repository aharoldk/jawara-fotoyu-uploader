const {chromium} = require('playwright');
const fs = require('fs');
const path = require('path');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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

// ============================================================================
// BROWSER SETUP
// ============================================================================

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

    return { context, page };
}

// ============================================================================
// LOGIN PROCESS
// ============================================================================

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
    await page.goto('https://www.fotoyu.com/login', {waitUntil: 'networkidle'});

    log('Waiting for login form...');
    await page.waitForSelector('input[type="text"], input[name="username"], input[placeholder*="username"]', {timeout: 10000});

    await fillUsername(page, username, log);
    await fillPassword(page, password, log);

    log('Waiting for login to complete...');
    await page.waitForURL(/fotoyu\.com\/(?!login)/, {timeout: 15000});
    log('Login successful!');
}

// ============================================================================
// NAVIGATION
// ============================================================================

/**
 * Navigate to upload page
 */
async function navigateToUploadPage(page, username, log) {
    log('Navigating to profile page...');
    await page.goto(`https://www.fotoyu.com/profile/${username}?type=all`);

    log('Waiting for upload button...');
    await page.waitForSelector('div[label="Unggah"]');
    await page.click('div[label="Unggah"]');

    log('Navigating to upload page...');
    await page.waitForSelector('p:has-text("Pilih Tipe Konten")', {timeout: 15000});
    await page.getByText("Unggah kreasimu ke server Fotoyu, agar RoboYu milik Yuser bisa menemukannya.", {exact: true}).click();

    await page.waitForURL('https://www.fotoyu.com/upload');
    log('Upload page loaded successfully');
}

// ============================================================================
// FILE UPLOAD
// ============================================================================

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
async function uploadFilesBatch(page, batch, contentType, log) {
    const fileChooserPromise = page.waitForEvent('filechooser', {timeout: 30000});

    await triggerFileChooser(page, contentType, log);

    log(`Waiting for file chooser...`);
    const fileChooser = await fileChooserPromise;

    log(`Selecting ${batch.length} files...`);
    await fileChooser.setFiles(batch);

    log(`Files selected, waiting for upload to process...`);

    // Wait for files to be uploaded - increase time for larger batches
    const waitTime = Math.max(5000, batch.length * 100); // At least 5 seconds, +100ms per file
    log(`Waiting ${waitTime}ms for files to upload...`);
    await page.waitForTimeout(waitTime);

    log('Files upload processing completed');
}

// ============================================================================
// METADATA FILLING
// ============================================================================

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
 * Fill location field
 */
async function fillLocation(page, lokasi, log) {
    if (!lokasi) return;

    log('Setting location (lokasi)...');
    const lokasiInput = page.locator('input[placeholder*="Tambahkan Lokasi"], input[name*="lokais"]').first();
    if (await lokasiInput.count() > 0) {
        await lokasiInput.clear();
        await lokasiInput.fill(lokasi);
        log(`Location set to: ${lokasi}`);
    } else {
        log('Location input not found (may not be available on this form)', 'warning');
    }
}

/**
 * Fill date field
 */
async function fillDate(page, tanggal, log) {
    if (!tanggal) return;

    log('Setting date (tanggal)...');
    const tanggalInput = page.locator('input[type="date"], input[name*="date"]').first();
    if (await tanggalInput.count() > 0) {
        await tanggalInput.clear();
        await tanggalInput.fill(tanggal);
        log(`Date set to: ${tanggal}`);
    } else {
        log('Date input not found (may not be available on this form)', 'warning');
    }
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
async function fillMetadata(page, metadata, log) {
    log('All files selected! Now filling metadata...');
    log('Waiting for metadata form to be ready...');

    // Wait for the form to appear - try to detect any of the metadata inputs
    try {
        log('Waiting for metadata inputs to appear and become visible (no timeout)...');
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

    await closeWarningModal(page, log);

    await fillPrice(page, metadata.harga, log);
    await fillDescription(page, metadata.deskripsi, log);
    await fillFotoTree(page, metadata.fototree, log);
    await fillLocation(page, metadata.lokasi, log);
    await fillDate(page, metadata.tanggal, log);

    log('Metadata filled successfully');
}

/**
 * Handle duplicate detection modal if it appears
 */
async function handleDuplicateModal(page, log) {
    try {
        // Check if duplicate modal exists
        const duplicateModal = page.locator('p:has-text("Diunggah! Tetapi")');
        const duplicateWarning = page.locator('p:has-text("konten terdeteksi sebagai duplikat")');

        if (await duplicateModal.count() > 0 || await duplicateWarning.count() > 0) {
            log('Duplicate content detected modal appeared', 'warning');

            // Extract duplicate count if available
            const warningText = await duplicateWarning.textContent().catch(() => '');
            if (warningText) {
                log(`Warning: ${warningText}`, 'warning');
            }

            // Try to find and click "Lihat Laporan" button or close button
            const viewReportButton = page.locator('div[label="Lihat Laporan"], button:has-text("Lihat Laporan")').first();
            const closeButton = page.locator('button[aria-label="Close"], div[aria-label="Close"]').first();

            if (await viewReportButton.count() > 0) {
                log('Clicking "Lihat Laporan" button...');
                await viewReportButton.click();
                await page.waitForTimeout(3000);

                // After viewing report, go back to upload page
                log('Navigating back to upload page...');
                await page.goto('https://www.fotoyu.com/upload');
                await page.waitForTimeout(2000);
            } else if (await closeButton.count() > 0) {
                log('Closing duplicate modal...');
                await closeButton.click();
                await page.waitForTimeout(1000);
            } else {
                // Try pressing Escape key to close modal
                log('Trying to close modal with Escape key...');
                await page.keyboard.press('Escape');
                await page.waitForTimeout(1000);
            }

            log('Duplicate modal handled, continuing with next batch');
        }
    } catch (error) {
        log(`Error handling duplicate modal: ${error.message}`, 'warning');
    }
}

/**
 * Click the publish/upload button
 */
async function publishUpload(page, log) {
    log('Looking for Unggah button to publish...');
    await page.waitForTimeout(1000);

    try {
        const unggahButton = page.locator(
            'div[label="Unggah"]:has-text("Unggah"), ' +
            'button:has-text("Unggah"), ' +
            'div[data-testid="button"]:has-text("Unggah")'
        ).first();

        if (await unggahButton.count() > 0) {
            log('Clicking Unggah button to publish upload...');
            await unggahButton.click();

            log('Waiting for upload to complete (no timeout)...');

            // Wait for either success modal, duplicate modal, or error to appear
            try {
                await page.waitForSelector(
                    'p:has-text("Diunggah! Tetapi"), p:has-text("konten terdeteksi sebagai duplikat"), p:has-text("berhasil"), p:has-text("selesai")',
                    { state: 'visible', timeout: 0 }
                );
                log('Upload completion detected');
            } catch (error) {
                log('Could not detect upload completion modal, proceeding anyway...', 'warning');
            }

            // Additional wait for any animations
            await page.waitForTimeout(2000);

            // Handle duplicate modal if it appears
            await handleDuplicateModal(page, log);

            log('Upload published successfully!');
        } else {
            log('Unggah button not found - upload may be processing automatically', 'warning');
        }
    } catch (uploadError) {
        log(`Error clicking Unggah button: ${uploadError.message}`, 'warning');
    }
}

/**
 * Process a single batch of files
 */
async function processUpload(page, batch, batchNumber, totalBatches, contentType, metadata, log) {
    log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} files)...`);

    await uploadFilesBatch(page, batch, contentType, log);
    await fillMetadata(page, metadata, log);
    await publishUpload(page, log);

    log(`Batch ${batchNumber}/${totalBatches} processed successfully`);
}

/**
 * Process all batches
 */
async function processAllBatches(page, params, log, isCancelled) {
    const {
        username,
        folderPath,
        contentType,
        batchSize,
        harga,
        lokasi,
        tanggal,
        deskripsi,
        fototree
    } = params;

    // Navigate to upload page
    await navigateToUploadPage(page, username, log);

    // Get files
    const files = getFilesFromFolder(folderPath, contentType);
    log(`Found ${files.length} ${contentType.toLowerCase()} files to upload`);

    // Prepare metadata
    const metadata = { harga, lokasi, tanggal, deskripsi, fototree };

    // Process all batches
    const totalBatches = Math.ceil(files.length / batchSize);
    let filesUploaded = 0;

    for (let i = 0; i < files.length; i += batchSize) {
        // Check if upload was cancelled
        if (isCancelled && isCancelled()) {
            log('Upload cancelled by user. Stopping...', 'warning');
            return filesUploaded;
        }

        const batch = files.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;

        await processUpload(page, batch, batchNumber, totalBatches, contentType, metadata, log);
        filesUploaded += batch.length;

        // Small delay between batches
        if (i + batchSize < files.length) {
            log('Waiting before next batch...');
            await page.waitForTimeout(2000);
        }
    }

    log(`All batches completed! Total: ${filesUploaded} files uploaded`, 'success');
    return filesUploaded;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================
async function runBot(params, mainWindow, isCancelled) {
    const log = createLogger(mainWindow);

    try {
        // Launch browser
        const { page } = await launchBrowser(log);

        // Login
        await performLogin(page, params, log);

        const totalFiles = await processAllBatches(page, params, log, isCancelled);

        return { success: true, totalFiles };

    } catch (error) {
        console.error("An error occurred during bot execution:", error);
        log(`Error: ${error.message}`, 'error');
        return { success: false, error: error.message };
    } finally {
        log('Bot execution completed - browser will remain open');
    }
}

module.exports = { runBot };

