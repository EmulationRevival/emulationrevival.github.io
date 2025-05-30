---
layout: template
title: "Sonic Adventure Blast 2 Guide"
permalink: /guides/ports/sonicadventureblast2-guide/
description: "A guide for setting up Sonic Adventure Blast 2 on dev mode."
author: "Jeen"
---

This guide provides instructions for installing and setting up the fan-made game "Sonic Adventure Blast 2" (SAB2) UWP port on an Xbox Series S/X console running in Developer Mode

**Ported By:** WorleyDL

### Important
*   This is a fan-made port and is not an official SEGA product.
*   This guide is based on the setup process demonstrated in the referenced video. Ensure you have the correct files as shown.
*   This port requires an **External USB Drive** for game data. It will **not** work using only the Xbox's internal storage for game assets.
*   This port is confirmed to work on **Xbox Series X|S** only. It will **not** work on Xbox One consoles.

### Prerequisites

Before you begin, ensure the following conditions are met:

1.  **Xbox Developer Mode Activated:** Your Xbox Series S/X must be successfully set up and running in Developer Mode.
2.  **Remote Access Enabled:** Remote Access must be enabled and configured within the Xbox Dev Home application.
3.  **External USB Drive:** A USB drive formatted as NTFS with full read/write permissions set for UWP applications.
4.  **PC:** A Windows PC for downloading files and accessing the Xbox Device Portal.

> **Need help with prerequisites?** See the [_Xbox Dev Mode Setup_](https://emulationrevival.github.io/guides/devmode-guide/) guide for detailed instructions on activating Dev Mode, setting up Remote Access, and preparing a USB drive.

### Step 1: Downloading Files

The necessary files are obtained from the official GitHub repository releases page.

1.  **Navigate** to the [Sonic Adventure Blast 2](https://emulationrevival.github.io/ports.html#sab2).
2.  **Download Required Files:** Under the "Assets" section of the release, download the following three files:
    *   `Sonic Adventure Blast 2` (The main application package)
    *   `Dependency File` (The necessary dependency)
3.  **Save Files:** Save these three files to a known location on your PC.

> **Support the Developer:** If you enjoy WorleyDL's ports, consider supporting their work via their Ko-fi link (https://ko-fi.com/worleydl).

### Step 2: Prepare External USB Drive

The game's core content (`Settings` and `res` folders) needs to be placed on your external USB drive.

1.  **Extract Game Content:** On your PC, locate the `SonicAdventureBlast2_1.1.zip` file you downloaded and extract its contents using a tool like 7-Zip or Windows Explorer's built-in extractor. This will create a folder (e.g., `SonicAdventureBlast2_1.1`) containing `Settings` and `res` subfolders.
2.  **Create `sab2` Folder:** Connect your prepared external USB drive to your PC. Create a new folder directly in the *root directory* of the USB drive and name it exactly `sab2`.
3.  **Copy Game Folders:**
    *   Open the extracted `SonicAdventureBlast2_1.1` folder.
    *   Select *both* the `Settings` folder and the `res` folder.
    *   Copy these two folders.
    *   Navigate into the `sab2` folder you created on your USB drive.
    *   Paste the `Settings` and `res` folders directly inside the `sab2` folder. Your structure should look like `E:\sab2\Settings` and `E:\sab2\res` (assuming `E:\` is your USB drive).
4. **Keep Files:** Keep the downloaded `.msixbundle` and `.appx` files on your PC for the next step. You can optionally delete the downloaded `.zip` and the extracted game content folder *from your PC* after copying them to the USB drive.

### Step 3: Install via Device Portal

Use the Xbox Device Portal to install the application package and its dependency.

1.  **Access Dev Portal:** On your PC, open a web browser and navigate to the Remote Access URL displayed in Dev Home on your Xbox.
2.  **Bypass Security Warning:** If necessary, bypass the browser's security warning.
3.  **Navigate to "Add":** Under "My games & apps", click "Add".
4.  **Upload MSIXBUNDLE:** Click "Choose File" (or drag and drop) and select the `SAB2_1.0.0_x64.msixbundle` file from your PC.
5.  **Upload Dependency:** Click "Next". On the dependency page:
    *   Click "Choose File" (or drag and drop).
    *   Select the `Microsoft.VCLibs.x64.14.00.appx` file.
6.  **Start Installation:** Click "Start" and wait for the installation to complete ("Package successfully registered"). Click "Done".

### Step 4: Configure on Xbox

Set the application type to "Game" for optimal performance.

1.  **Locate SAB2 in Dev Home:** On your Xbox, go back to Dev Home. Find `sab2-uwp` (or similar name) in the list.
2.  **Change Type to "Game":**
    *   Highlight the app and press the "View" button (two overlapping squares).
    *   Select "View details".
    *   Change the "App type" from "App" to "Game".
    *   Press B to go back.
3.  **(Recommended) Restart Console:** Select "Restart console" from the Dev Home main menu.

### Step 5: Launching the Game

1.  **Connect USB Drive:** Ensure your external USB drive (containing the `sab2` folder with `Settings` and `res`) is plugged into your Xbox *before* launching the game.
2.  **Launch SAB2:**
