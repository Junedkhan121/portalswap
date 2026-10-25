# Windows Service Setup (NSSM)

If you want the bot to run as a true Windows Service (like a system app), use NSSM.

## Setup Steps

### 1. Download NSSM
- Visit: https://nssm.cc/download
- Download the latest version
- Extract `nssm.exe` to a folder (e.g., `C:\nssm\`)

### 2. Create a startup script

Save this as `C:\Users\juned\Desktop\swap\swap\telegram-bot\start.bat`:

```batch
@echo off
cd /d C:\Users\juned\Desktop\swap\swap\telegram-bot
node src/index.js
```

### 3. Install the service

Open CMD **as Administrator** and run:

```cmd
C:\nssm\nssm.exe install PortalSwapBot "C:\Users\juned\Desktop\swap\swap\telegram-bot\start.bat"
```

### 4. Configure the service

```cmd
C:\nssm\nssm.exe set PortalSwapBot AppDirectory C:\Users\juned\Desktop\swap\swap\telegram-bot
C:\nssm\nssm.exe set PortalSwapBot AppStdout C:\Users\juned\Desktop\swap\swap\telegram-bot\logs\service.log
C:\nssm\nssm.exe set PortalSwapBot AppStderr C:\Users\juned\Desktop\swap\swap\telegram-bot\logs\service-error.log
C:\nssm\nssm.exe set PortalSwapBot AppRotateFiles 1
C:\nssm\nssm.exe set PortalSwapBot AppRotateBytes 10485760
```

### 5. Start the service

```cmd
C:\nssm\nssm.exe start PortalSwapBot
```

Or use Windows Services GUI:
- Press `Win + R`
- Type `services.msc`
- Find "PortalSwapBot"
- Right-click → Start

---

## Management

**Check status:**
```cmd
C:\nssm\nssm.exe status PortalSwapBot
```

**Restart:**
```cmd
C:\nssm\nssm.exe restart PortalSwapBot
```

**Stop:**
```cmd
C:\nssm\nssm.exe stop PortalSwapBot
```

**View logs:**
```cmd
notepad C:\Users\juned\Desktop\swap\swap\telegram-bot\logs\service.log
```

**Uninstall:**
```cmd
C:\nssm\nssm.exe stop PortalSwapBot
C:\nssm\nssm.exe remove PortalSwapBot confirm
```

---

## Advantages
- ✅ Runs as a Windows Service
- ✅ Auto-starts on Windows boot
- ✅ Runs even when not logged in
- ✅ Managed via Windows Services GUI
