---
layout: template
title: "Sonic Unleashed Recompiled Guide"
permalink: /guides/ports/sonicunleashedrecomp-guide/
description: "A guide for setting up Sonic Unleashed Recompiled on dev mode."
---

## Sonic Unleashed Recompiled UWP Setup Guide
#### Guide author: Jeen

This guide provides instructions for installing and setting up the "Sonic Unleashed Recompiled" fan project (UWP port by WorleyDL) on an Xbox Series S/X console running in Developer Mode. It also covers how to set up mods using HedgeModManager


### CRITICAL REQUIREMENT: E:\ Drive Letter
*   This UWP port **absolutely requires** that your external USB drive is assigned the drive letter **`E:`** when connected to your Windows PC during the setup process (specifically for preparing game data and mods).
*   If Windows assigns a different letter (like `D:`, `F:`, etc.), the game data and mods **will not be found** by the UWP application on Xbox.
*   Instructions on how to check and potentially change the drive letter are included in **Part 1**.

### Other Important Notes
*   This is a fan-made project based on the original Sonic Unleashed and is not an official SEGA product.
*   This UWP port is by WorleyDL. Please report UWP-specific issues to their repository, **NOT** the official Hedge-Dev or original Sonic Unleashed Recompiled teams.
*   This guide is based on setup processes demonstrated in videos and community guides. Ensure you download the correct files.
*   **External USB Drive REQUIRED:** This port requires an External USB Drive for storing the **main game data files** and mods.
*   This port is confirmed to work on **Xbox Series X|S** only. It will **not** work on Xbox One consoles.

### Prerequisites

Before you begin, ensure the following conditions are met:

1.  **Xbox Developer Mode Activated:** Your Xbox Series S/X must be successfully set up and running in Developer Mode.
2.  **Remote Access Enabled:** Remote Access must be enabled and configured within the Xbox Dev Home application.
3.  **External USB Drive:** A USB drive formatted as NTFS with full read/write permissions set for UWP applications. **This drive *must* appear as drive `E:` when connected to your Windows PC.**
4.  **PC:** A Windows PC for downloading files, running the PC installer, using HedgeModManager, and accessing the Xbox Dev Portal.
5.  **Sonic Unleashed Game Files:** You need your *own* copy (dump) of the Xbox 360 version of Sonic Unleashed (ISO or extracted folder format), the latest Title Update, and optionally, any DLCs.
6.  **Sonic Unleashed Recompiled PC Installer:** The Windows version installer is needed to generate game data files.
7.  **Sonic Unleashed Recompiled UWP App:** The UWP application package (`.msixbundle`) and dependency (`.appx`) for installation on the Xbox.

> **Need help with prerequisites?** See the [_Xbox Dev Mode Setup_](https://wiki.xboxdev.store/en/DevModeSetup) guide for detailed instructions on activating Dev Mode, setting up Remote Access, and preparing a USB drive (including formatting and permissions, **but double-check the drive letter requirement below**).

## Part 1: Preparing Game Data Files on the E:\ Drive (Using PC Installer)

This step *must* be done on your PC, and the USB drive *must* be assigned the letter `E:`.

### 1.1. Ensure Your USB Drive is Assigned E:

1.  **Connect USB Drive:** Plug your prepared (NTFS, permissions set) USB drive into your Windows PC.
2.  **Check Drive Letter:** Open File Explorer (`This PC`). Note the drive letter assigned to your USB drive.
3.  **If Not E:, Attempt to Change:** If the drive letter is *not* `E:`, you **must** attempt to change it. **Warning:** Changing drive letters can sometimes affect programs that expect a drive at a specific letter. Proceed with caution.
    *   **Open Disk Management:**
        *   Right-click the Windows Start button and select "Disk Management".
        *   Alternatively, press `Win + R`, type `diskmgmt.msc`, and press Enter.
    *   **Identify USB Drive:** Locate your USB drive in the list of disks and partitions. It will likely show as "Removable". Be **absolutely sure** you have identified the correct drive based on its size and label.
    *   **Change Drive Letter:**
        *   Right-click on the main partition of your USB drive (the large block representing the storage).
        *   Select "Change Drive Letter and Paths...".
        *   Click the "Change..." button.
        *   Select the radio button for "Assign the following drive letter:".
        *   From the dropdown menu, select **E**.
        *   Click "OK".
        *   **If E: is Taken:** If `E:` is already in use by another drive (internal or external), you will first need to change *that* drive's letter to something else (like `G:`, `H:`, etc.) using the same process, *then* change your USB drive's letter to `E:`.
    *   **Confirm Warning:** Windows may warn you that changing the drive letter might cause programs to stop working. Click "Yes" to proceed.
    *   **Verify:** Close Disk Management and check File Explorer again to confirm your USB drive is now assigned the letter `E:`.

### 1.2. Prepare Installer and Game Files on E:\ Drive

*(Assuming your USB drive is now successfully assigned as E:\)*

1.  **Download PC Installer:** Go to the official Sonic Unleashed Recompiled GitHub releases page: [https://github.com/hedge-dev/UnleashedRecompiled/releases](https://github.com/hedge-dev/UnleashedRecompiled/releases)
2.  **Download Windows Zip:** Download the `UnleashedRecompiled-Windows.zip` file.
3.  **Extract Installer:** Extract the `.zip` file to a temporary location on your PC.
4.  **Create `unleashed` Folder on USB:** On your `E:\` drive (your USB drive), create a new folder named exactly `unleashed` (Path: `E:\unleashed`).
5.  **Move Installer Contents to USB:** Copy *all* contents from the extracted `UnleashedRecompiled-Windows` folder *into* the `E:\unleashed` folder.
6.  **Prepare Game Source Files on USB:**
    *   Inside the `E:\unleashed` folder, create a subfolder named `my sonic files`.
    *   Copy your Sonic Unleashed game files (ISO or extracted folder), Title Update, and DLCs *into* `E:\unleashed\my sonic files`.
7.  **Run PC Installer (from USB):**
    *   Navigate to `E:\unleashed`.
    *   Run `UnleashedRecompiled.exe` *from the USB drive*.
    *   Select language, click "Next", click "Next".
8.  **Add Game Sources (from USB):**
    *   **Game:** Click "Add Files". Navigate to `E:\unleashed\my sonic files` and select your game file (`.iso` or `default.xex`). Click "Open".
    *   **Update:** Click "Update" tab > "Add Files". Navigate to `E:\unleashed\my sonic files` and select your Title Update. Click "Open".
    *   **DLC (Optional):** Click "DLC" tab > "Add Files". Select all DLC files in `E:\unleashed\my sonic files`. Click "Open". Or click "Skip".
9.  **Install Files (to USB):** Click "Next". Click "Next" again. The installer will generate game data folders (`game`, `update`, etc.) inside `E:\unleashed`. Wait for completion.
10. **Finish Installation:** Click "Next", then "Exit". Your `E:\unleashed` folder now contains the necessary generated game data. (You can delete `my sonic files` now if desired).
