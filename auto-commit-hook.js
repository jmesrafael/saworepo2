#!/usr/bin/env node
/**
 * Auto-commit hook for product images and data
 * Syncs from working directory to git repo and commits automatically
 *
 * Usage from Node/Electron:
 *   const hook = require('./auto-commit-hook');
 *   hook.syncAndCommit().then(result => console.log(result));
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_DIR = __dirname;
const WORK_DIR = path.join(REPO_DIR, '..', 'saworepo1', 'saworepo2');
const ADMIN_DATA_DIR = path.join(REPO_DIR, '..', 'saworepo1', 'sawo-main', 'frontend', 'src', 'Administrator', 'Local', 'data');

function execGit(cmd) {
  try {
    return execSync(cmd, { cwd: REPO_DIR, encoding: 'utf-8', stdio: 'pipe' });
  } catch (e) {
    return null;
  }
}

function syncImages() {
  const srcDir = path.join(WORK_DIR, 'images');
  const destDir = path.join(REPO_DIR, 'images');

  if (!fs.existsSync(srcDir)) return 0;

  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.webp'));
  let copied = 0;

  for (const file of files) {
    const src = path.join(srcDir, file);
    const dest = path.join(destDir, file);

    // Copy only if source is newer or destination doesn't exist
    const srcStat = fs.statSync(src);
    const destExists = fs.existsSync(dest);

    if (!destExists || srcStat.mtime > fs.statSync(dest).mtime) {
      fs.copyFileSync(src, dest);
      copied++;
    }
  }

  return copied;
}

function syncProducts() {
  const src = path.join(ADMIN_DATA_DIR, 'products.json');
  const dest = path.join(REPO_DIR, 'products.json');

  if (!fs.existsSync(src)) return false;

  const srcStat = fs.statSync(src);
  const destExists = fs.existsSync(dest);

  if (!destExists || srcStat.mtime > fs.statSync(dest).mtime) {
    fs.copyFileSync(src, dest);
    return true;
  }

  return false;
}

function hasChanges() {
  const output = execGit('git status --porcelain');
  return output && output.trim().length > 0;
}

async function syncAndCommit() {
  try {
    console.log('[AUTO-SYNC] Starting product sync...');

    const imgCopied = syncImages();
    const prodSynced = syncProducts();

    if (imgCopied === 0 && !prodSynced) {
      console.log('[AUTO-SYNC] ✅ No changes detected');
      return { success: true, message: 'No changes', changed: false };
    }

    if (imgCopied > 0) console.log(`[AUTO-SYNC] 📸 Copied ${imgCopied} image(s)`);
    if (prodSynced) console.log('[AUTO-SYNC] 📋 Updated products.json');

    // Stage changes
    execGit('git add -A');

    const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
    const commitMsg = `Auto-sync: Product images and data [${timestamp}]`;

    const result = execGit(`git commit -m "${commitMsg}"`);

    if (!result || result.includes('nothing to commit')) {
      console.log('[AUTO-SYNC] ⚠️  No changes to commit');
      return { success: true, message: 'No changes to commit', changed: false };
    }

    console.log('[AUTO-SYNC] ✅ Committed successfully');

    // Try to push
    try {
      execGit('git push origin main');
      console.log('[AUTO-SYNC] ✅ Pushed to remote');
      return { success: true, message: 'Synced and pushed', changed: true, pushed: true };
    } catch (e) {
      console.warn('[AUTO-SYNC] ⚠️  Push failed (offline or auth issue)');
      return { success: true, message: 'Synced but push failed', changed: true, pushed: false };
    }
  } catch (error) {
    console.error('[AUTO-SYNC] ❌ Error:', error.message);
    return { success: false, message: error.message, error };
  }
}

// HTTP Server for app communication
function startHttpServer() {
  const http = require('http');
  const PORT = 3001;

  const server = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Sync endpoint
    if (req.url === '/api/sync-products' && req.method === 'POST') {
      try {
        const result = await syncAndCommit();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result || { success: true, message: 'Sync triggered' }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: error.message }));
      }
      return;
    }

    // Health check
    if (req.url === '/api/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', daemon: 'running' }));
      return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  server.listen(PORT, () => {
    console.log(`[AUTO-SYNC] HTTP server listening on http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[AUTO-SYNC] ⚠️  Port ${PORT} in use (daemon already running?)`);
    } else {
      console.error(`[AUTO-SYNC] Server error:`, err.message);
    }
  });

  return server;
}

// Auto-commit on interval (every 5 minutes) if running standalone
if (require.main === module) {
  const INTERVAL = process.env.SYNC_INTERVAL || 5 * 60 * 1000; // 5 minutes

  console.log(`[AUTO-SYNC] Starting auto-sync daemon (interval: ${INTERVAL / 1000}s)`);

  // Start HTTP server for app communication
  startHttpServer();

  syncAndCommit(); // Run immediately
  setInterval(syncAndCommit, INTERVAL);
}

module.exports = { syncAndCommit, syncImages, syncProducts, hasChanges, startHttpServer };
