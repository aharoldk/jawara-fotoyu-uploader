const {chromium} = require('playwright');
const fs = require('fs');
const path = require('path');

async function runBot({
                          username,
                          password,
                          contentType,
                          folderPath,
                          batchSize,
                          harga,
                          lokasi,
                          tanggal,
                          deskripsi,
                          fototree
                      }, mainWindow) {
    let context = null;
    let browser = null;

    // Helper to send logs to renderer
    const log = (message, type = 'info') => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('bot-log', {message, type});
        }
        console.log(`[${type.toUpperCase()}] ${message}`);
    };

    try {
        log('Launching Chrome browser...');

        // Launch Chrome browser
        browser = await chromium.launch({
            headless: false, // Show browser window
            args: [
                '--start-maximized',
            ]
        });

        log('Browser launched successfully');

        // Create a new context and page with permissions
        context = await browser.newContext({
            viewport: null, // Use full screen
            permissions: ['geolocation'], // Automatically grant location permission
        });
        const page = await context.newPage();

        // Step 1: Login to Fotoyu
        log('Opening Fotoyu login page...');
        await page.bringToFront();
        await page.goto('https://www.fotoyu.com/login', {waitUntil: 'networkidle'});

        log('Waiting for login form...');
        await page.waitForSelector('input[type="text"], input[name="username"], input[placeholder*="username"]', {timeout: 10000});

        // Fill username
        log('Filling username...');
        const usernameInput = page.locator('input[type="text"], input[name="username"], input[placeholder*="username"]').first();
        await usernameInput.fill(username);

        // Click "Lanjut" (Continue) button
        log('Clicking Lanjut button...');
        const lanjutButton = page.locator('div[data-cy="AuthLoginFormLoginButton"], button:has-text("Lanjut"), div[label="Lanjut"]').first();
        await lanjutButton.click();

        await page.waitForTimeout(500);

        // Fill password
        log('Filling password...');
        const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
        await passwordInput.fill(password);

        // Wait a moment for any validation
        await page.waitForTimeout(500);

        // Click "Masuk" (Login) button
        log('Clicking Masuk button...');
        const loginButton = page.locator('div[label="Masuk"], div[data-cy="AuthLoginFormLoginButton"]:has-text("Masuk"), button:has-text("Masuk")').first();
        await loginButton.click();

        // Wait for navigation after login
        log('Waiting for login to complete...');
        await page.waitForURL(/fotoyu\.com\/(?!login)/, {timeout: 15000});

        log('Login successful! Navigating to profile page...');

        // Step 2: Navigate to profile page
        await page.goto(`https://www.fotoyu.com/profile/${username}?type=all`);

        log('Waiting for upload button...');
        await page.waitForSelector('div[label="Unggah"]');
        await page.click('div[label="Unggah"]');

        log('Navigating to upload page...');
        await page.waitForSelector('p:has-text("Pilih Tipe Konten")', {timeout: 15000});
        await page.getByText("Unggah kreasimu ke server Fotoyu, agar RoboYu milik Yuser bisa menemukannya.", {exact: true}).click();

        await page.waitForURL('https://www.fotoyu.com/upload');
        log('Upload page loaded successfully');

        // Get all files from the folder
        const files = fs.readdirSync(folderPath)
            .filter(f => {
                const ext = path.extname(f).toLowerCase();
                if (contentType === 'Photo') {
                    return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
                } else if (contentType === 'Video') {
                    return ['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext);
                }
                return false;
            })
            .map(f => path.join(folderPath, f));

        log(`Found ${files.length} ${contentType.toLowerCase()} files to upload`);

        // Process files in batches
        const totalBatches = Math.ceil(files.length / batchSize);

        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;

            log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} files)...`);

            // Set up file chooser listener BEFORE any click action
            log(`Setting up file chooser for batch ${batchNumber}...`);
            const fileChooserPromise = page.waitForEvent('filechooser', {timeout: 30000});

            // Try to find and interact with the upload zone or file input
            try {
                // Method 1: Try to find the hidden file input and trigger it
                const fileInput = page.locator('input[type="file"]').first();
                if (await fileInput.count() > 0) {
                    log('Found file input, triggering click...');
                    await fileInput.click({force: true});
                } else {
                    // Method 2: Click on the dropzone
                    log(`Clicking ${contentType} upload zone...`);
                    const dropzoneSelector = contentType === 'Photo'
                        ? 'div:has-text("Foto"), div:has-text("foto"), [class*="dropzone" i]:has-text("Foto")'
                        : 'div:has-text("Video"), div:has-text("video"), [class*="dropzone" i]:has-text("Video")';

                    const dropzone = page.locator(dropzoneSelector).first();
                    await dropzone.click();
                }
            } catch (clickError) {
                log(`Error clicking upload zone: ${clickError.message}, trying alternative method...`, 'warning');
                // Fallback: try clicking anywhere on the page that might trigger file selection
                await page.locator('body').click();
            }

            // Wait for file chooser and upload files
            log(`Waiting for file chooser...`);
            const fileChooser = await fileChooserPromise;

            log(`Selecting ${batch.length} files for batch ${batchNumber}...`);
            await fileChooser.setFiles(batch);

            log(`Batch ${batchNumber} files selected, waiting for upload to process...`);

            // Wait for files to be processed and uploaded
            await page.waitForTimeout(5000);


            log('All files selected! Now filling metadata...');

            // Fill in metadata AFTER all files are selected
            log('Waiting for metadata form to be ready...');
            await page.waitForTimeout(3000);

            // Fill harga (price)
            if (harga) {
                log('Setting price (harga)...');
                const hargaInput = page.locator('input[name="price"], input[placeholder*="Harganya"]').first();
                if (await hargaInput.count() > 0) {
                    await hargaInput.clear();
                    await hargaInput.fill(harga.toString());
                    log(`Price set to: ${harga}`);
                } else {
                    log('Price input not found', 'warning');
                }
            }

            // Fill deskripsi (description)
            if (deskripsi) {
                log('Setting description (deskripsi)...');
                const deskripsiInput = page.locator('textarea[name="description"], textarea[placeholder*="konten kamu"]').first();
                if (await deskripsiInput.count() > 0) {
                    await deskripsiInput.clear();
                    await deskripsiInput.fill(deskripsi);
                    log(`Description set`);
                } else {
                    log('Description input not found', 'warning');
                }
            }

            // Fill fototree
            if (fototree) {
                log('Setting fototree...');
                const fototreeInput = page.locator('input[placeholder*="Ketik nama FotoTree"], input[placeholder*="FotoTree"]').first();
                if (await fototreeInput.count() > 0) {
                    await fototreeInput.clear();
                    await fototreeInput.fill(fototree);
                    log(`FotoTree set to: ${fototree}`);

                    // Wait a bit for autocomplete suggestions to appear
                    await page.waitForTimeout(3000);

                    // Try to select the matching suggestion from the dropdown
                    // Look for the exact match with the FotoTree name
                    const suggestionSelectors = [
                        `div[data-testid="list"]:has-text("${fototree}")`,
                        `div[class*="ListItemSelect"]:has-text("${fototree}")`,
                        `p:has-text("${fototree}")`,
                        'div[role="option"]',
                        'li[role="option"]'
                    ];

                    let suggestionFound = false;
                    for (const selector of suggestionSelectors) {
                        const suggestions = page.locator(selector);
                        const count = await suggestions.count();

                        if (count > 0) {
                            log(`Found ${count} FotoTree suggestion(s) with selector: ${selector}`);

                            // Try to find exact match
                            for (let i = 0; i < count; i++) {
                                const suggestion = suggestions.nth(i);
                                const text = await suggestion.textContent();

                                if (text && text.includes(fototree)) {
                                    log(`Clicking on matching FotoTree suggestion: "${fototree}"`);
                                    await suggestion.click();
                                    await page.waitForTimeout(1000);
                                    suggestionFound = true;
                                    break;
                                }
                            }

                            if (suggestionFound) break;
                        }
                    }

                    if (!suggestionFound) {
                        log('No matching FotoTree suggestion found in dropdown, trying first option...', 'warning');
                        const firstSuggestion = page.locator('div[data-testid="list"], div[role="option"], li[role="option"]').first();
                        if (await firstSuggestion.count() > 0) {
                            await firstSuggestion.click();
                            await page.waitForTimeout(1000);
                        }
                    }
                } else {
                    log('FotoTree input not found', 'warning');
                }
            }

            // Fill lokasi (location) - if this field exists
            if (lokasi) {
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

            // Fill tanggal (date) - if this field exists
            if (tanggal) {
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

            log('Metadata filled successfully');

            // Click the "Unggah" (Upload/Publish) button
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

                    // Wait for upload to process
                    log('Waiting for upload to complete...');
                    await page.waitForTimeout(5000);
                    log('Upload published successfully!');
                } else {
                    log('Unggah button not found - upload may be processing automatically', 'warning');
                }
            } catch (uploadError) {
                log(`Error clicking Unggah button: ${uploadError.message}`, 'warning');
            }

            log(`Batch ${batchNumber}/${totalBatches} processed successfully`);

            // Small delay between batches
            if (i + batchSize < files.length) {
                log('Waiting before next batch...');
                await page.waitForTimeout(2000);
            }
        }

        log(`All batches completed! Total: ${files.length} files uploaded`, 'success');

        return {success: true, totalFiles: files.length};

    } catch (error) {
        console.error("An error occurred during bot execution:", error);
        log(`Error: ${error.message}`, 'error');
        return {success: false, error: error.message};
    } finally {
        log('Bot execution completed - browser will remain open');
    }
}

module.exports = {runBot};

