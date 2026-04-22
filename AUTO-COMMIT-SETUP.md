# Auto-Commit Setup for Product Images & Data

This setup ensures product images and `products.json` are automatically synced from the working directory to the git repository and committed without manual intervention.

## 📁 Directory Structure

```
git-sawo/
├── saworepo1/
│   ├── saworepo2/
│   │   ├── images/           (working copy of images)
│   │   └── files/
│   └── sawo-main/
│       └── frontend/src/Administrator/Local/data/
│           └── products.json  (working copy)
└── saworepo2/                (git repository)
    ├── images/               (synced images)
    ├── files/
    ├── products.json         (synced products)
    └── auto-commit-hook.js   (sync engine)
```

## 🚀 How It Works

1. **Images uploaded** → Supabase bucket
2. **Images synced** → `saworepo1/saworepo2/images/`
3. **Auto-sync runs** → Copies to `saworepo2/images/`
4. **Auto-commit** → Commits and pushes to GitHub
5. **Images available** → GitHub raw URL works

## 🔧 Setup Options

### Option 1: Node.js Hook (Recommended)

**In your Products.jsx (after upload):**

```javascript
// After successful upload
const { syncAndCommit } = require('../../../../../../saworepo2/auto-commit-hook');
syncAndCommit().then(result => {
  console.log('Auto-sync result:', result);
});
```

**Or run as daemon:**

```bash
cd saworepo2
node auto-commit-hook.js
# Syncs every 5 minutes automatically
```

**Custom interval:**

```bash
SYNC_INTERVAL=60000 node auto-commit-hook.js  # 1 minute
```

### Option 2: Scheduled Script (Windows)

**Run manually:**

```bash
cd saworepo2
./sync-and-commit.bat
```

**Schedule with Windows Task Scheduler:**

1. Open "Task Scheduler"
2. Create Basic Task
3. Name: "Product Auto-Sync"
4. Trigger: Daily, every 5 minutes
5. Action: Run script `sync-and-commit.bat`
6. Location: `C:\Users\WEB.WEB-DEVPC1\Desktop\git-sawo\saworepo2\`

### Option 3: Bash Script (macOS/Linux)

```bash
cd saworepo2
chmod +x sync-and-commit.sh
./sync-and-commit.sh
```

**Cron job (every 5 minutes):**

```bash
*/5 * * * * cd /path/to/saworepo2 && ./sync-and-commit.sh >> /var/log/product-sync.log 2>&1
```

## 📦 What Gets Synced

- **Images**: All `.webp` files newer than the destination
- **Products**: `products.json` if newer than the destination
- **Automatic**: Commits with timestamp, pushes to `origin/main`

## ✅ Verification

Check if images are accessible:

```bash
# Local (before push)
ls -lh saworepo2/images/

# Remote (after push)
curl -I https://raw.githubusercontent.com/jmesrafael/saworepo2/main/images/1776815103743_wrrhm0hq3y.webp
```

## 🔐 Git Configuration

Make sure git is configured:

```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

If you get auth errors during push:
- Use GitHub token auth (recommended)
- Or add SSH key to GitHub account

## 📝 Logs

Check sync logs in real-time:

```bash
# Node.js daemon
tail -f sync.log

# Windows Task Scheduler
# Check Event Viewer > Windows Logs > Application
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| 404 on image URL | Push not complete, check `git push` output |
| Auth error | Add SSH key or use GitHub token |
| Script permission denied | `chmod +x sync-and-commit.sh` |
| No changes committed | Check file permissions in both directories |
| Push fails silently | Ensure remote is `origin/main`, not master |

## 🎯 Next Steps

1. **Integrate hook into Products.jsx** after successful uploads
2. **Push current commit**: `cd saworepo2 && git push origin main`
3. **Start daemon**: `node auto-commit-hook.js`
4. **Verify**: Check GitHub and test image URLs in the app
