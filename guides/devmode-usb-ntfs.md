---
layout: template
title: "Xbox Dev Mode USB & NTFS Setup"
permalink: /guides/devmode-usb-ntfs/
description: "Preparing a USB drive for Xbox Dev Mode emulation using NTFS and correct permissions."
author: "Jeen"
---

# Overview

External storage is commonly used for storing ROMs, BIOS files, and emulator assets in Xbox Dev Mode. Proper formatting and permissions are required for emulator access.

# Requirements

* USB flash drive or external HDD/SSD  
* Windows PC or Windows virtual machine

# Format the Drive

1. Connect the USB drive to the PC.

2. Open **File Explorer**.

3. Right-click the drive.

4. Select **Format**.

5. Configure:

   * **File System:** NTFS
   * **Allocation Unit Size:** Default

6. Click **Start**.

# Apply Required Permissions

1. Right-click the drive.

2. Select **Properties**.

3. Open the **Security** tab.

4. Click **Advanced**.

5. Select **Add**.

6. Click **Select Principal**.

7. Click **Advanced**.

8. Click **Find Now**.

9. Select:

   **ALL APPLICATION PACKAGES**

10. Click **OK**.

11. Enable:

   **Full Control**

12. Click **OK**.

13. Enable:

   **Replace all child object permission entries**.

14. Click **Apply**.

Ignore any warning about **System Volume Information**.

# Connect the Drive to Xbox

1. Insert the drive into the Xbox.

2. When prompted select:

   **Use for Media**

Do **not** select **Games and Apps**.

Media mode allows Dev Mode applications to access files.

# Optional Tool: XboxMediaUSB

Automated formatting can be performed using XboxMediaUSB.

Steps:

1. Download XboxMediaUSB from GitHub.

2. Extract the archive.

3. Run:

   XboxMediaUSB.exe

4. Select the USB drive.

5. Click **Format USB**.

If permission issues occur, repeat the **manual permission process**.