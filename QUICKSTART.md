# CloudSaver - Quick Start Guide

## 🚀 Installation & Setup

### Prerequisites
1. **Node.js 20+** installed
2. **Yarn** package manager
3. **Telegram account**
4. **API Credentials** from Telegram

### Step 1: Get Telegram API Credentials

1. Go to https://my.telegram.org/apps
2. Log in with your phone number
3. Click on "API Development Tools"
4. Fill in the form:
   - App title: CloudSaver
   - Short name: cloudsaver
   - Platform: Desktop
5. Copy your **API ID** and **API Hash**

### Step 2: Install Dependencies

```bash
cd /app/cloudsaver
yarn install
```

### Step 3: Run in Development Mode

```bash
yarn dev
```

This will:
- Start Vite dev server on port 5173
- Launch Electron window
- Enable hot module replacement

### Step 4: First Time Login

1. **Enter API Credentials:**
   - Paste your API ID (numbers only)
   - Paste your API Hash
   - Check "Save credentials" (recommended)
   - Click "Continue"

2. **Phone Verification:**
   - Enter phone with country code (e.g., +1234567890)
   - Click "Send Verification Code"
   - Wait for Telegram message

3. **Enter Code:**
   - Open Telegram app on your phone
   - Copy the 5-digit code
   - Enter in CloudSaver
   - Click "Verify"

4. **2FA (if enabled):**
   - If you have Cloud Password enabled
   - Enter your password
   - Click "Verify"

5. **Done!**
   - App creates private channel: `cloudsaver_[random_token]`
   - You're now logged in
   - Session persists between app restarts

### Step 5: Upload Your First File

1. **Drag & Drop:**
   - Drag any file onto the upload zone
   - Click "Upload to Cloud"

2. **Or Browse:**
   - Click the upload zone
   - Select file from your computer
   - Click "Upload to Cloud"

3. **File Uploads:**
   - Supports files up to 2GB
   - Shows upload progress
   - Appears in file list when complete

### Step 6: Manage Files

**Download:**
- Click ⬇️ button next to file
- File saves to Downloads folder

**Delete:**
- Click 🗑️ button next to file
- Confirm deletion
- File removed from Telegram channel

**Search:**
- Use search box at top
- Filters files by name

## 📦 Build for Production

### Build Application

```bash
# Build app
yarn build

# Output: /app/cloudsaver/out/
```

### Build Windows Executable

```bash
# Build Windows installer
yarn build:win

# Output: /app/cloudsaver/dist/
# - CloudSaver-Setup.exe (installer)
# - win-unpacked/ (portable)
```

### Using Build Script

```bash
# Automated build
cd /app/cloudsaver
./build.sh
```

## 🔧 Troubleshooting

### "Client not initialized" Error
**Solution:**
- Restart the app
- Log out and log in again
- Check internet connection

### "Unable to access file path" Error
**Solution:**
- Select file from local disk
- Don't use network drives
- Don't use cloud folders (Dropbox, OneDrive)

### Session Lost After Restart
**Solution:**
- Check file permissions in `~/.config/cloudsaver/`
- Re-login with phone number
- Your files remain safe in Telegram

### Upload Fails
**Solution:**
- Check file size (must be < 2GB)
- Check internet connection
- Verify Telegram account is active
- Check rate limits (wait a few minutes)

### Channel Not Found
**Solution:**
- App creates channel on first login
- Don't delete the channel manually
- If deleted, logout and login again (creates new channel)

### Build Fails
**Solution:**
```bash
# Clean and rebuild
rm -rf node_modules out dist
yarn install
yarn build
```

## 🔒 Security Best Practices

1. **Keep API Credentials Private**
   - Never share your API ID or Hash
   - Don't commit to version control
   - App stores them encrypted locally

2. **Session Security**
   - Session stored encrypted
   - Machine-bound (can't copy to other device)
   - Logout when not using

3. **File Privacy**
   - Files stored in YOUR Telegram account
   - Private channel (only you have access)
   - No third-party servers involved

## 📱 Using CloudSaver

### Daily Workflow

1. **Launch App** → Auto-login (session remembered)
2. **Upload Files** → Drag & drop or browse
3. **Manage Files** → Download, delete, search
4. **Logout** → Click logout button (optional)

### File Organization Tips

- Use descriptive file names
- Search works by filename
- Files show upload date
- File size displayed clearly

### Storage Limits

- **Single File:** Up to 2GB
- **Total Storage:** Unlimited (Telegram cloud)
- **File Types:** All types supported
- **Number of Files:** No limit

## 🌐 Telegram Channel

Your files are stored in a private Telegram channel:
- **Name:** `cloudsaver_[unique_token]`
- **Type:** Private channel
- **Access:** Only you
- **Lifetime:** Permanent (until you delete)

You can also access files directly in Telegram app:
1. Open Telegram
2. Search for `cloudsaver_` 
3. Open the channel
4. See all uploaded files

## 💡 Pro Tips

1. **Backup Credentials:**
   - Write down API ID and Hash
   - Store in password manager
   - Needed if you reinstall

2. **Large Files:**
   - Upload during good internet
   - Don't close app during upload
   - Progress shown in real-time

3. **File Names:**
   - Use clear, searchable names
   - Include dates if needed
   - Avoid special characters

4. **Multiple Devices:**
   - Each device needs own login
   - Same Telegram account works
   - Same files accessible everywhere

## 📞 Getting Help

**Check Logs:**
```bash
# View application logs
cd /app/cloudsaver
yarn dev
# Check terminal output for errors
```

**Common Issues:**
- Internet connection
- Telegram account status
- API credentials validity
- File size limits

**Documentation:**
- README.md - Complete documentation
- DEVELOPMENT_SUMMARY.md - Technical details
- Code comments - Implementation details

## ✅ Quick Checklist

Before using CloudSaver:
- [ ] Node.js 20+ installed
- [ ] Yarn installed
- [ ] Telegram account active
- [ ] API credentials obtained
- [ ] Dependencies installed (`yarn install`)
- [ ] Internet connection working

First login:
- [ ] API ID and Hash entered
- [ ] Phone number verified
- [ ] Verification code entered
- [ ] 2FA password (if applicable)
- [ ] Channel created successfully

Ready to use:
- [ ] Dashboard loaded
- [ ] Stats showing (0 files initially)
- [ ] Upload zone visible
- [ ] File list empty (first time)

## 🎉 You're All Set!

CloudSaver is now ready to use. Enjoy unlimited cloud storage with Telegram!

---

**Need help?** Check README.md or open an issue.
**Found a bug?** Report it with logs and steps to reproduce.
**Want to contribute?** Fork and submit pull requests!
