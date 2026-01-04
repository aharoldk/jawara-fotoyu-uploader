const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runBot({ username, contentType, folderPath, batchSize, harga, lokasi, tanggal, deskripsi, fototree }, mainWindow) {
    let context = null;
    let browser = null;

    // Helper to send logs to renderer
    const log = (message, type = 'info') => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('bot-log', { message, type });
        }
        console.log(`[${type.toUpperCase()}] ${message}`);
    };

    try {
        log('Connecting to Chrome browser...');

        // Connect to Chrome via CDP
        browser = await chromium.connectOverCDP('http://127.0.0.1:9222');

        log('Connected to Chrome successfully');

        // Get the default context
        context = browser.contexts()[0];
        const page = await context.newPage();

        log('Opening Fotoyu profile page...');
        await page.bringToFront();
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

            // Click on the content type selector
            if (contentType === 'Photo') {
                await page.locator('div[class*="GiftShopUploadDropzone"] >> text="Foto"').click();
            } else {
                await page.locator('div[class*="GiftShopUploadDropzone"] >> text="Video"').click();
            }

            // Wait for file chooser and upload files
            log(`Selecting files for batch ${batchNumber}...`);
            const fileChooser = await page.waitForEvent('filechooser');
            await fileChooser.setFiles(batch);

            log(`Batch ${batchNumber} files selected, waiting for upload to process...`);

            // Wait a bit for files to be processed
            await page.waitForTimeout(2000);

            // Fill in metadata if this is the first batch
            if (i === 0) {
                // Fill harga
                if (harga) {
                    log('Setting price (harga)...');
                    const hargaInput = page.locator('input[placeholder*="harga"], input[name*="price"]').first();
                    if (await hargaInput.count() > 0) {
                        await hargaInput.fill(harga.toString());
                    }
                }

                // Fill lokasi
                if (lokasi) {
                    log('Setting location (lokasi)...');
                    const lokasiInput = page.locator('input[placeholder*="lokasi"], input[name*="location"]').first();
                    if (await lokasiInput.count() > 0) {
                        await lokasiInput.fill(lokasi);
                    }
                }

                // Fill tanggal
                if (tanggal) {
                    log('Setting date (tanggal)...');
                    const tanggalInput = page.locator('input[type="date"], input[name*="date"]').first();
                    if (await tanggalInput.count() > 0) {
                        await tanggalInput.fill(tanggal);
                    }
                }

                // Fill deskripsi
                if (deskripsi) {
                    log('Setting description (deskripsi)...');
                    const deskripsiInput = page.locator('textarea[placeholder*="deskripsi"], textarea[name*="description"]').first();
                    if (await deskripsiInput.count() > 0) {
                        await deskripsiInput.fill(deskripsi);
                    }
                }

                // Fill fototree
                if (fototree) {
                    log('Setting fototree...');
                    const fototreeInput = page.locator('input[placeholder*="fototree"]').first();
                    if (await fototreeInput.count() > 0) {
                        await fototreeInput.fill(fototree);
                    }
                }
            }

            log(`Batch ${batchNumber}/${totalBatches} processed successfully`);

            // Small delay between batches
            if (i + batchSize < files.length) {
                await page.waitForTimeout(1000);
            }
        }

        log(`All batches completed! Total: ${files.length} files uploaded`, 'success');

        return { success: true, totalFiles: files.length };

    } catch (error) {
        console.error("An error occurred during bot execution:", error);
        log(`Error: ${error.message}`, 'error');
        return { success: false, error: error.message };
    } finally {
        // Note: We don't close the context/browser because it's a persistent Chrome instance
        // that the user is connected to via CDP
        if (context) {
            log('Bot execution completed');
        }
    }
}

module.exports = { runBot };

