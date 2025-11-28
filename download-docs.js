#!/usr/bin/env node

/**
 * Docs.rs Documentation Downloader
 * Downloads and extracts Rust crate documentation from docs.rs
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const DOCS_RS_BASE = 'https://docs.rs/crate';
const OUTPUT_DIR = './rust-docs';

/**
 * Download a file from URL with redirect handling
 */
function downloadFile(url, outputPath, maxRedirects = 5) {
    return new Promise((resolve, reject) => {
        let redirects = 0;

        const makeRequest = (currentUrl) => {
            const protocol = currentUrl.startsWith('https:') ? https : http;
            const file = fs.createWriteStream(outputPath);

            console.log(`📥 Downloading from: ${currentUrl}`);

            const req = protocol.get(currentUrl, (response) => {
                // Handle redirects
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    fs.unlink(outputPath, () => {});

                    redirects++;
                    if (redirects > maxRedirects) {
                        reject(new Error('Too many redirects'));
                        return;
                    }

                    const redirectUrl = new URL(response.headers.location, currentUrl).toString();
                    console.log(`🔄 Redirecting to: ${redirectUrl}`);
                    makeRequest(redirectUrl);
                    return;
                }

                if (response.statusCode !== 200) {
                    reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage || response.statusMessage}`));
                    return;
                }

                response.pipe(file);

                file.on('finish', () => {
                    file.close();
                    console.log(`✅ Downloaded: ${outputPath}`);
                    resolve(outputPath);
                });
            }).on('error', (err) => {
                fs.unlink(outputPath, () => {});
                reject(err);
            });

            // Set timeout for the request
            req.setTimeout(30000, () => {
                req.destroy();
                fs.unlink(outputPath, () => {});
                reject(new Error('Request timeout'));
            });
        };

        makeRequest(url);
    });
}

/**
 * Extract ZIP file
 */
function extractZip(zipPath, extractTo) {
    return new Promise((resolve, reject) => {
      try {
        console.log(`📦 Extracting to: ${extractTo}`);

        // Create extraction directory if it doesn't exist
        if (!fs.existsSync(extractTo)) {
          fs.mkdirSync(extractTo, { recursive: true });
        }

        // Try to use unzip command first (faster)
        try {
          execSync(`unzip -o "${zipPath}" -d "${extractTo}"`, { stdio: 'inherit' });
          console.log(`✅ Extracted successfully using unzip`);
          resolve(extractTo);
          return;
        } catch (unzipError) {
          console.log(`⚠️  unzip command failed, trying Node.js extraction...`);
        }

        // Fallback to Node.js extraction using adm-zip if available
        try {
          const AdmZip = require('adm-zip');
          const zip = new AdmZip(zipPath);
          zip.extractAllTo(extractTo, /* overwrite */ true);
          console.log(`✅ Extracted successfully using adm-zip`);
          resolve(extractTo);
          return;
        } catch (admZipError) {
          console.log(`⚠️  adm-zip not available, extraction incomplete`);
        }

        console.log(`❌ Extraction failed. Please manually extract: ${zipPath}`);
        console.log(`   To extract directory: ${extractTo}`);
        resolve(extractTo);

      } catch (error) {
        reject(error);
      }
    });
}

/**
 * Create local README for viewing documentation
 */
function createLocalReadme(crateName, version, extractPath) {
    const readmeContent = `# ${crateName} v${version} Documentation

Downloaded from docs.rs and extracted to this directory.

## 🌐 Local Viewing

### Option 1: Python HTTP Server (Recommended)
\`\`\`bash
cd "${extractPath}"
python -m http.server 8000
# Then visit: http://localhost:8000
\`\`\`

### Option 2: Node.js HTTP Server
\`\`\`bash
cd "${extractPath}"
npx serve -p 8000
# Then visit: http://localhost:8000
\`\`\`

### Option 3: Live Server (if you have VS Code)
\`\`\`bash
cd "${extractPath}"
# Open in VS Code and use Live Server extension
\`\`\`

## 📁 Directory Structure

- \`index.html\` - Main documentation page
- \`search-index.js\` - Search functionality
- \`settings.js\` - Documentation settings
- \`source-files.js\` - Source code references
- Crate documentation in subdirectories by target platform

## 🔍 Search and Navigation

- Use the search box in the documentation to find specific items
- Navigation is available on the left sidebar
- Source code links are available for documented items

## ⚠️ Important Notes

- Static resources are loaded from \`/-/rustdoc.static/\` (requires internet)
- For complete offline viewing, you may need to download additional resources
- Some features may not work without an internet connection

## 📚 Original Source

- Crate: ${crateName}
- Version: ${version}
- Original URL: https://docs.rs/${crateName}/${version}/

---

*Generated by Rust Toolkit - Claude Code Skill*
`;

    const readmePath = path.join(extractPath, 'README-local.md');
    fs.writeFileSync(readmePath, readmeContent);
    console.log(`📝 Created local viewing guide: ${readmePath}`);
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.log('Usage: node download-docs.js <crate_name> [version]');
        console.log('');
        console.log('Examples:');
        console.log('  node download-docs.js tokio latest      # Download latest version');
        console.log('  node download-docs.js serde 1.0.0       # Download specific version');
        console.log('  node download-docs.js reqwest ~0.12     # Download latest 0.12.x');
        process.exit(1);
    }

    const crateName = args[0];
    const version = args[1] || 'latest';

    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Determine download URL
    let downloadUrl;
    let outputName;

    if (version === 'latest') {
        downloadUrl = `${DOCS_RS_BASE}/${crateName}/latest/download`;
        outputName = `${crateName}-latest`;
    } else if (version.startsWith('~')) {
        // Semantic version (e.g., ~1.0 means latest 1.0.x)
        const semver = version.substring(1);
        downloadUrl = `${DOCS_RS_BASE}/${crateName}/~${semver}/download`;
        outputName = `${crateName}-${semver}-latest`;
    } else {
        // Specific version
        downloadUrl = `${DOCS_RS_BASE}/${crateName}/${version}/download`;
        outputName = `${crateName}-${version}`;
    }

    const extractPath = path.join(OUTPUT_DIR, outputName);
    const zipPath = path.join(OUTPUT_DIR, `${outputName}.zip`);

    try {
        console.log(`🦀 Starting download for ${crateName} v${version}`);
        console.log(`📂 Output directory: ${extractPath}`);
        console.log('');

        // Step 1: Download ZIP file
        await downloadFile(downloadUrl, zipPath);

        // Step 2: Extract ZIP
        await extractZip(zipPath, extractPath);

        // Step 3: Create local README
        createLocalReadme(crateName, version, extractPath);

        // Step 4: Clean up ZIP file
        try {
            fs.unlinkSync(zipPath);
            console.log(`🗑️  Cleaned up ZIP file`);
        } catch (cleanupError) {
            console.log(`⚠️  Could not clean up ZIP file: ${cleanupError.message}`);
        }

        console.log('');
        console.log(`🎉 Documentation ready!`);
        console.log(`📁 Location: ${extractPath}`);
        console.log('');
        console.log(`🌐 To view locally:`);
        console.log(`   cd "${extractPath}"`);
        console.log(`   python -m http.server 8000`);
        console.log(`   # Then visit: http://localhost:8000`);

    } catch (error) {
        console.error(`❌ Error: ${error.message}`);

        // Provide helpful error messages
        if (error.message.includes('404')) {
            console.log('');
            console.log(`💡 The crate or version may not exist on docs.rs`);
            console.log(`   Check: https://docs.rs/${crateName}`);
            console.log(`   Or search: https://crates.io/search?q=${crateName}`);
        } else if (error.message.includes('429')) {
            console.log('');
            console.log(`💡 Rate limited by docs.rs. Please wait and try again later.`);
            console.log(`   Each crate version can only be downloaded once per 24 hours.`);
        }

        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error(`❌ Uncaught error: ${error.message}`);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(`❌ Unhandled promise rejection: ${reason}`);
    process.exit(1);
});

// Run main function
if (require.main === module) {
    main();
}

module.exports = { downloadFile, extractZip, createLocalReadme };