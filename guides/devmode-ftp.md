---
layout: template
title: "Xbox Dev Mode FTP & File Transfer"
permalink: /guides/devmode-ftp/
description: "Transferring files to Xbox Dev Mode using FTP and Xbox Device Portal."
author: "Jeen"
---

# Overview

Files such as ROMs, BIOS files, and emulator packages can be transferred to Xbox Dev Mode using:

* Xbox Device Portal
* FTP server inside RetroArch

FTP is preferred for transferring large ROM libraries.

# Enable Xbox Device Portal

1. Boot the console into **Dev Mode**.

2. Open:

   **Settings > Remote Access Settings**

3. Enable:

   **Xbox Device Portal**

Optional:

* Enable **Require Authentication**
* Create a username and password.

# Access Device Portal

1. The console displays a **Device Portal URL**.

Example:

https://192.168.1.25

2. Enter the address in a web browser.

3. Ignore the certificate warning.

The portal allows:

* Installing apps
* Uploading files
* Viewing logs
* Managing storage

# Upload Apps via Device Portal

1. Open **Xbox Device Portal** in a browser.

2. Navigate to the **Apps** section.

3. Click **Add**.

4. Upload:

   * Emulator `.APPX` file
   * Dependency packages (`x64`)

5. Click **Next** and complete installation.

# FTP Transfers (RetroArch)

RetroArch includes an FTP server.

1. Launch **RetroArch**.

2. Navigate to:

   **Settings > Services**

3. Enable:

   **FTP Server**

4. Note the **IP address** shown.

# Connect with FTP Client

Use any FTP client such as:

* FileZilla
* WinSCP

Connection settings:

* **Host:** Xbox IP address
* **Port:** 21
* **Protocol:** FTP
* **Username:** anonymous or blank

# Recommended Folder Structure

Typical layout:

/system  
/roms  
/playlists  
/saves  
/states  

Place BIOS files in:

/system

Place ROMs in:

/roms