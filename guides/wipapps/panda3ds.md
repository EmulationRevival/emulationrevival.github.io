---
layout: template
title: "Panda3DS Guide"
permalink: /guides/wipapps/panda3ds-guide/
description: "A guide for setting up Panda3DS on dev mode."
author: "Jeen"
---

This guide provides instructions for installing and setting up Panda3DS, a Nintendo 3DS emulator, on an Xbox Series S/X console running in Developer Mode.

**Important:**
*   Pay close attention to the **Game File Locations** section (Step 2), as incorrect placement is a common cause of errors.
*   Decrypted Nintendo 3DS ROMs are generally required for emulation.

## Prerequisites

Before you begin, ensure the following conditions are met:

1.  **Xbox Developer Mode Activated:** Your Xbox Series S/X must be successfully set up and running in Developer Mode.
2.  **Remote Access Enabled:** Remote Access must be enabled and configured within the Xbox Dev Home application.
3.  **External USB Drive (Optional but Recommended):** A USB drive formatted as NTFS with full read/write permissions set for UWP applications is recommended for storing games.
4.  **PC:** A Windows PC for downloading files and accessing the Xbox Device Portal.
5.  **Nintendo 3DS Game Files:** Your own legally dumped Nintendo 3DS game files (decrypted format usually required, e.g., `.3ds`, `.cia`).

> **Need help with prerequisites?** See the [_Xbox Dev Mode Setup_](https://emulationrevival.github.io/guides/devmode-guide/) guide for detailed instructions on activating Dev Mode, setting up Remote Access, and preparing a USB drive (if using one).

## Step 1: Downloading Files

1.  **Go to Xbox Dev Store:** Navigate to WIP APPS.
2.  **Find Panda3DS:** Go to the **"Emulators"** tab and scroll down until you see **"Panda3DS"**.
3.  **Download:** Click the **"Download"** button. This will download a `.zip` file.
4.  **Extract Files:** On your PC, extract the downloaded `.zip` file. Inside, you should find:
    *   `Panda3DS_1.0.4.0_x64_Debug.msixbundle` (or similar `.msixbundle` / `.appx` - The main application)
    *   `Microsoft.VCLibs.x64.14.00.appx` (Dependency)
    *   `Microsoft.NET.CoreFramework.Debug_2.2.appx` (Dependency)
    *   `Microsoft.NET.CoreRuntime.2.2.appx` (Dependency)

## Step 2: Prepare Game File Locations

Panda3DS UWP looks for games in specific locations. Choose **ONE** method below. **Do NOT place games inside additional subfolders within these locations.**

**Valid Locations:**

*   **Option A: Root of External USB Drive (`E:\`)**
    *   Connect your prepared USB drive to your PC.
    *   Copy your game files (e.g., `MyGame.3ds`) directly to the root directory (e.g., `E:\MyGame.3ds`).
*   **Option B: `Panda3DS` Folder on External USB Drive (`E:\Panda3DS`)**
    *   Connect your prepared USB drive to your PC.
    *   Create a folder named exactly `Panda3DS` in the root directory (e.g., `E:\Panda3DS`).
    *   Copy your game files *inside* this folder (e.g., `E:\Panda3DS\MyGame.3ds`).
*   **Option C: Root of Internal Storage (`LocalState`)**
    *   Access the Xbox Device Portal on your PC.
    *   Navigate to `File explorer > LocalAppData > [Panda3DS Package Name] > LocalState`.
    *   Upload your game files directly into the `LocalState` folder using the "Choose file" and "Upload" buttons.
*   **Option D: `Panda3DS` Folder on Internal Storage (`LocalState\Panda3DS`)**
    *   Access the Xbox Device Portal on your PC.
    *   Navigate to `File explorer > LocalAppData > [Panda3DS Package Name] > LocalState`.
    *   Click "Create new folder" and name it exactly `Panda3DS`.
    *   Navigate into the newly created `Panda3DS` folder.
    *   Upload your game files into this `LocalState\Panda3DS` folder.

> **WARNING:** Placing games in deeper subfolders (e.g., `E:\Panda3DS\My 3DS Roms\game.3ds` or `LocalState\Games\game.3ds`) **will likely cause errors** like the "filesystem error" mentioned in the troubleshooting section. Keep your game files directly within one of the four valid locations listed above.

## Step 3: Install via Device Portal

1.  **Access Dev Portal:** On your PC, open a web browser and connect to your Xbox Device Portal.
2.  **Bypass Security Warning:** If necessary, bypass the browser's security warning.
3.  **Navigate to "Add":** Under "My games & apps", click "Add".
4.  **Upload MSIXBUNDLE:** Select the `Panda3DS...msixbundle` file from the extracted folder on your PC.
5.  **Upload Dependencies:** Click "Next". Add *all three* dependency files (`Microsoft.VCLibs...`, `Microsoft.NET.CoreFramework...`, `Microsoft.NET.CoreRuntime...`) one by one.
6.  **Start Installation:** Click "Start" and wait for completion ("Package successfully registered"). Click "Done".

## Step 4: Configure on Xbox

1.  **Locate Panda3DS in Dev Home:** On your Xbox, go to Dev Home. Find `Panda3DS`.
2.  **Change Type to "Game":** Highlight the app > Press "View" button > "View details" > Change "App type" to "Game" > Press B.
3.  **(Recommended) Restart Console.**

## Step 5: Initial Launch and Settings

1.  **Connect USB Drive (If Using):** If you placed games on the USB drive (Option A or B in Step 2), ensure it's plugged into your Xbox.
2.  **Launch Panda3DS:** Launch the app from the Xbox dashboard ("My games & apps" > "Games").
3.  **Auto-Update:** If prompted, select **"Yes"** to update. Quit and relaunch the app manually after the update completes.
4.  **Game List:** The emulator will scan the valid locations. Your games should appear in the list if placed correctly in Step 2.
5.  **Configure Settings (CRUCIAL):**
    *   Select **"Settings"** at the bottom of the game list.
    *   Go to **"Audio"**.
        *   Check **"Enable Audio"**.
        *   (Recommended) Change **"DSP Emulation"** to **"LLE"**.
    *   Go back > **"Xbox Specific"**.
        *   Check **"Stretch Window (ignores resolution)"** for fullscreen.
    *   (Optional) Go to **"DevStore"** to manage Cloud Saves and Update Checks.
    *   Select **"Back"**.

## Step 6: Launching and Exiting Games

1.  **Launch Game:** Highlight a game from the list and press A.
2.  **Exit Game:** Press **Start + Select** (Menu + View buttons) simultaneously > Select **"Quit to Main Menu"**.

## Troubleshooting

**Error: "Critical Error - Exception: filesystem error: directory iterator cannot open directory: No such file or directory [E:/] Application will now freeze."**

*   **Cause:** This error typically means Panda3DS cannot find *any* games in the expected locations on the external drive (`E:\` or `E:\Panda3DS`), or there's an issue accessing the drive itself.
*   **Solutions:**
    1.  **Verify Game Location:** Double-check that your game files are placed *directly* in one of the four valid locations described in **Step 2**. Ensure they are **not** inside extra subfolders.
    2.  **USB Connected?:** Make sure your external USB drive was connected to the Xbox *before* launching Panda3DS.
    3.  **USB Formatting/Permissions:** Confirm your USB drive is formatted as NTFS and has the correct permissions set ("ALL APPLICATION PACKAGES" > Full Control). Refer to the [_Xbox Dev Mode Setup_](https://emulationrevival.github.io/guides/devmode-guide/) guide if needed.
    4.  **Try `LocalState`:** As a test, try placing one game file in the root of the app's `LocalState` folder (Option C in Step 2) using the Device Portal and see if the error persists. This helps determine if the issue is USB-specific.

**Other Issues:**

*   **No Games Listed:** Similar causes to the filesystem error above. Verify game locations and USB permissions/connection.
*   **No Audio:** Ensure you enabled audio in the Panda3DS settings (Step 5).
*   **Small Screen:** Ensure "Stretch Window" is enabled in the Panda3DS settings (Step 5).
