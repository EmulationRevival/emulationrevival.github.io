---
layout: template
title: "RetroArch Guide"
permalink: /guides/emulators/retroarch-guide/
description: "A guide for setting up RetroArch on dev mode."
---

# RetroArch Setup Guide (Mesa/Angle for Xbox)
#### Guide Authors: Mango/Stern/Jeen

This guide provides instructions for installing and setting up RetroArch (Mesa for Xbox Series X|S, Angle for Xbox One) on consoles running in Developer Mode.

**Important:** This guide **ONLY** covers RetroArch Mesa and RetroArch Angle. For the Citra (Nintendo 3DS) core, please refer to the separate `RetroArch Setup Guide (Citra)`.

## 1. Prerequisites

Before you begin, ensure the following conditions are met:

*   **Xbox Developer Mode Activated:** Your Xbox console must be successfully set up and running in Developer Mode.
*   **Remote Access Enabled:** Remote Access must be enabled and configured within the Xbox Dev Home application.
*   **(For USB Users) USB Drive Prepared:** If using an external USB drive, it *must* be formatted as NTFS and have full read/write permissions set for UWP applications.

> **Need help with prerequisites?** See the [_Xbox Dev Mode Setup_](https://wiki.xboxdev.store/en/DevModeSetup) guide for detailed instructions on activating Dev Mode, setting up Remote Access, and preparing a USB drive.

## 2. Obtaining RetroArch UWP

You have a couple of options for getting the RetroArch UWP application:

*   **Xbox Dev Store (Recommended for most users):**
    *   This is the easiest method. Download RetroArch directly from the [Xbox Dev Store](https://xbdev.store/).
    *   **Note:** The versions on the Dev Store (excluding the Citra build) typically *do not* come with cores pre-installed. You will need to download them later using the Online Updater (covered in Step 5).

*   **Compiling from Source (Advanced Users):**
    *   If you are comfortable compiling software from source code, you can build the latest versions yourself.
    *   The primary repository for UWP builds is maintained by the Xbox Emulation Hub: [https://github.com/XboxEmulationHub/RetroArch/releases](https://github.com/XboxEmulationHub/RetroArch/releases)
    *   This guide does not cover the compilation process itself.

## 3. Installing RetroArch on Xbox

Use the Xbox Device Portal to install the RetroArch application package (`.appx` or `.msixbundle`).

1.  **Access Dev Portal:** On your PC or Smartphone, open a web browser and navigate to the Remote Access URL displayed in Dev Home on your Xbox.
    *   **Note:** This URL can change. Always verify it in Dev Home before connecting.
2.  **Bypass Security Warning:** If your browser shows a security warning ("Your connection is not private"), click "Advanced" and "Proceed" (or the equivalent option). Edge browser typically handles this well.
3.  **Navigate to "Add":** Under the "My games & apps" section, click "Add".
4.  **Extract Files:** If you downloaded a `.zip` file, extract its contents on your PC or phone. You should have at least one `.appx` or `.msixbundle` file and potentially a dependency file.
5.  **Upload Appx/Msixbundle:** Click "Choose File" (or drag and drop on PC) and select the main RetroArch application file (e.g., `RetroArch.appx`).
6.  **Start Installation:** Click "Start" and wait for the installation to complete ("Package successfully registered").

## 4. Initial Launch Configuration

This step is crucial for performance and proper function.

1.  **Locate RetroArch in Dev Home:** On your Xbox, go back to Dev Home. Find "RetroArch" in the list (it might be at the bottom).
2.  **Change Type to "Game":**
    *   Highlight RetroArch and press the "View" button (the button with two overlapping squares, formerly known as "Back").
    *   Select "View details".
    *   Change the "App type" (or similar wording) from "App" to "Game".
    *   Press B to go back.
3.  **(Recommended) Restart Console:** It's good practice to restart your Xbox after changing the app type. Select "Restart console" from the Dev Home main menu.
4.  **Launch RetroArch:**
    *   After the restart, go back to Dev Home.
    *   Select "Launch Home" to go to the standard Xbox dashboard.
    *   Navigate to "My games & apps".
    *   RetroArch should now appear under the "Games" category.
    *   Select RetroArch and press A to launch it.

## 5. Setting Up RetroArch (Internal Configuration)

Once RetroArch is launched, perform these initial setup steps.

### 5.1. Online Updater (Essential First Step)

1.  **Navigate:** Go to `Main Menu > Online Updater`.
2.  **Update Components:** Select and run *each* of the following options:
    *   `Update Core Info Files`
    *   `Update Assets`
    *   `Update Controller Profiles`
    *   `Update Cheats`
    *   `Update Databases`
    *   `Update Overlays`
    *   `Update Slang Shaders` (Note: Slang shaders might be broken in some UWP builds; don't worry if this fails).

### 5.2. Downloading Cores

1.  **Navigate:** Go to `Main Menu > Online Updater`.
2.  **Select Core Downloader:** Choose `Core Downloader`.
3.  **Download:** Select the desired emulator core from the list and press A to download it. Repeat for all cores you intend to use.
    *   **Note:** This can only be done *after* running the "Update Core Info Files" option in the previous step.
    *   **WARNING:** Do **NOT** update `Mupen64Plus-Next`, `ParaLLEl N64`, or `Yabasanshiro` via the Core Downloader if you are using a build specifically configured for ANGLE (typically Xbox One). These builds use modified core versions. Updating them will likely break them. Download them initially, but do not update them later via the Online Updater unless explicitly instructed.
