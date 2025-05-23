---
layout: template
title: "Dolphin Guide"
permalink: /guides/emulators/dolphin-guide/
description: "A guide for setting up Dolphin on dev mode."
---

# Dolphin UWP Guide
##### Credit to the guide authors in each section

This guide provides comprehensive instructions for setting up and using Dolphin UWP, the GameCube and Wii emulator, on an Xbox Series S/X in Developer Mode. It covers initial setup, file transfers, Netplay, optional resources (saves, cheats, textures), troubleshooting, and advanced topics.

**Important Notices (Read Before Proceeding):**

*   **Read the Guides:**  Before asking for help, thoroughly read the `#dev-mode-guide` channel (presumably in a Discord server) and the USB tutorial in `#app-guides` if using USB storage.  If you're still stuck, ask for help in `#support`.
*   **Dolphin PC is Recommended:**  Think of the PC version of Dolphin as an extended settings menu for Dolphin UWP.  While not strictly *required*, Dolphin PC is extremely useful (and sometimes necessary) for many features and configurations.  This guide assumes basic familiarity with Dolphin PC. A powerful PC is *not* required for this.

## Initial Setup - USB (Recommended)

This method uses a USB drive for storing games and Dolphin's user data.

### Adding Games

1.  **Open Dolphin Settings:** On your Xbox, launch Dolphin UWP.  Press the Select/View button on your controller to open the Dolphin settings menu.
2.  **Add Game Path:** Select "Add Path".
3.  **Choose Game Location:** Navigate to where your games are stored on your USB drive.  The guide suggests the following structure:
    *   `E:\Games\Nintendo - GameCube`
    *   `E:\Games\Nintendo - Wii`

### Setting the User Folder

The User Folder is where Dolphin stores important files like:

*   Texture Packs
*   Controller Configurations
*   AR/Gecko Codes (Cheats)
*   Box Art

1.  **Create Dolphin Folder:** On your USB drive, create a folder at the *root level* (e.g., `E:\`) named `Dolphin`.

2.  **Open Dolphin Settings:** Launch Dolphin UWP and press Select/View to open the settings.

3.  **Set User Folder Path:** Go to "Paths & Folders" > "Add Path" and select the `Dolphin` folder you just created.

4.  **Automatic Folder Creation:** The first time you launch a game, Dolphin will automatically create its necessary subfolders (like `Load`, `Config`, `GC`, `Wii`) inside the User Folder you specified.

## Initial Setup - Internal (Not Recommended)

**WARNING:**  Using internal storage is *strongly discouraged* due to its limitations (30GB) and the risk of undeletable files if the app is uninstalled incorrectly (requiring a factory reset).  However, if you don't have a Windows PC to format a USB drive, this is your only option.

### Adding Games

1.  **Connect via FTP:** Use Durango FTP (see `#app-guides` for instructions) to connect to your Xbox from your PC.

2.  **Create Game Folder:** Navigate to: `LocalFolder\[FULLNAME]\LocalCache`.  Replace `[FULLNAME]` with the actual full name of the Dolphin UWP application folder (see "How to find the FULLNAME of Dolphin" below).  Inside `LocalCache`, create a new folder to store your games.

3.  **Add Games:** Copy your game files into the folder you just created.

4.  **Set Game Path in Dolphin:** Launch Dolphin UWP, press Select/View, select "Add Path", and choose the folder where you placed your games.

### Setting the User Folder

1.  **Create Dolphin Folder:**  Using Durango FTP, navigate to `LocalFolder\[FULLNAME]\LocalCache`. Create a new folder named `Dolphin`.

2.  **Set User Folder Path:**  Launch Dolphin UWP, press Select/View, go to "Paths & Folders" > "Add Path", and choose the `Dolphin` folder you just created.

3.  **Automatic Folder Creation:** Dolphin will automatically create its subfolders inside this `Dolphin` folder.

    *   `list_ui.png` (UI overlay for list view)
    *   `carousel_ui.png` (UI overlay for carousel view)
*   **Optional Files:**
    *   `carousel_background_wii.png` (Wii tab)
    *   `carousel_background_gamecube.png` (GameCube tab)
    *   `carousel_background_other.png` (Other tab)
    *   `carousel_background_list.png` (List screen)
    *   `carousel_background_netplay.png` (Netplay screen)

**Note:**  A known glitch might replace the background with box art.  Close and relaunch Dolphin to fix.

## FAQs

### How do I change settings on Dolphin?

*   **Main Menu:**  Press Start/Menu on your controller to access the Settings menu for most settings.
*   **Dolphin PC/dolphin.ini:** For settings not available in the main menu, use Dolphin PC and copy the User Folder, or manually edit the `dolphin.ini` file.
    *   Helpful link: [https://wiki.dolphin-emu.org/index.php?title=GameINI_](https://wiki.dolphin-emu.org/index.php?title=GameINI_)

### How do I access my localstate/user folder in Dolphin?

*   Use ADV File Explorer or Durango FTP on your Xbox.
*   See the `#app-guides` channel for instructions.

### How do I get games for Dolphin?

*   **Legally Dump Games:**  You *must* dump games from a *hacked* Wii, Wii U, or GameCube console.
    *   [https://wii.guide/dump-games](https://wii.guide/dump-games)
    *   [https://dolphin-emu.org/docs/guides/ripping-games](https://dolphin-emu.org/docs/guides/ripping-games)

### What if my question isn't answered here?

*   Read the instructions carefully.
*   Ask for help in the [Emulation Collective](https://discord.gg/emulation-collective-1007582798598647889) or [Revives Community Server](https://discord.com/channels/1024833470020722760/1027247947588583514/1284587835571306557) Discord servers.  Be patient and don't spam.

## Troubleshooting

### "The folder path you have selected is not writable!" & Black Screen Fix

*Written by GoldenSky#4649*

**Recommended Method (Automated):**

*   Use XboxMediaUSB: [https://github.com/SvenGDK/XboxMediaUSB/releases](https://github.com/SvenGDK/XboxMediaUSB/releases)

**Manual Method:**

1.  **Format USB:** Connect your USB drive to your PC and format it as NTFS.
2.  **Security Tab:** Right-click the drive, click "Properties", and go to the "Security" tab.
3.  **Permissions:**
    *   Go to Advanced > Add > Select Principal > Advanced > Find Now.
    *   Select "ALL APPLICATION PACKAGES".
    *   Click OK.
    *   Tick the "Full Control" box.
    *   Click OK.
    *   Tick the "Replace all child object permission entries" box.
    *   Click OK.
4.  **Ignore Error:** Ignore any error about "System Volume Information".

### How to Fix Settings Resetting

1.  **Re-do USB Fix:**  Repeat the USB fix steps above.
2.  **If Still Not Working:**
    1.  **Create Dolphin Folder:** Create a folder named `Dolphin` on your USB drive.
    2.  **Reset User Folder:** Open Dolphin, go to Settings, reset the User folder, press Select, and quit.
    3.  **Set User Folder:** Open Dolphin, go to Settings, set the User folder to the `Dolphin` folder you created, press Select, and quit.
    4.  **Set Game Path:** Open Dolphin, go to Settings, set the Game Path to your game directory on the USB, press Select, and quit.
    5.  **Run Dolphin:** Launch Dolphin; it should now work correctly.

### How to Fix Games Not Showing Up

*   **File Format:** Ensure games are *not* zipped or in `nkit.iso` format.  Use RVZ, WBFS, or ISO.
*   **USB Fix:** Make sure you've correctly performed the USB fix (T1).
*   **ROM Integrity:**  Verify that your ROM is working correctly.

### My UI is Lagging; How Do I Fix It?

*   **Load Cover Art:** Scroll left or right until all your game cover art is loaded.  This should eliminate the lag.

### Fix for Controllers Not Picking Up Correctly

1.  **Language:** Change your console language to English.
2.  **Update Controller:** Update your controller's firmware.
3.  **Insider Preview:** Quit the Xbox Insider Preview program.

## Advanced Guides

### How to Get Homebrew Working on Dolphin

The normal Homebrew Channel doesn't boot by default.

1.  **Download WAD:** Download this WAD file: [https://github.com/FIX94/hbc/releases](https://github.com/FIX94/hbc/releases)
2.  **Place in Games Folder:** Place the downloaded WAD file in your games folder.
3.  **Launch WAD:** In Dolphin, select and launch the WAD file.
4.  **Transfer Apps:** Transfer your PC-generated `WiiSD.raw` file to the `Load` folder in your Dolphin User Folder.  *Some apps requiring custom iOS patches may not work.*

2.  **GameCube Tab:** Go to the "GameCube" tab.
3.  **Slot A:** Set "Slot A" to "Memory Card".
4.  **SP1:** Set "SP1" to "Broadband Adapter (HLE)".

### How to Dump NAND from Your Wii

*   **Requirements:**
    *   Homebrewed Wii with BootMii installed: [https://bootmii.org/download/](https://bootmii.org/download/)
    *   SD card
    *   Wii

1.  **Access BootMii:** Launch BootMii through the Homebrew Channel.
2.  **Navigate:** Use a GameCube controller or the Power/Reset buttons (see [https://bootmii.org/faq/](https://bootmii.org/faq/)).
3.  **Backup NAND:** Select "Options" (the gear icon) > "Backup NAND" (the green arrow from chip to SD card).
4.  **Wait:** Wait for the backup to complete.
5.  **Retrieve NAND:** Remove the SD card, insert it into your PC, and you should find a `nand.bin` file.

**Tutorial:** [https://www.youtube.com/watch?v=EWgMWz77gJM&t=65s](https://www.youtube.com/watch?v=EWgMWz77gJM&t=65s)

### How to Import Wii's NAND into the Windows Version of Dolphin

1.  **Import:** In Dolphin PC, go to Tools > Import BootMii NAND Backup.  Select your `nand.bin` file.
2.  **Decrypt:** Dolphin will decrypt and unpack the NAND. Device credentials and system files will be extracted automatically.
3.  **Extract Certificates:** Go to Tools > Manage NAND > Extract Certificates from NAND.

### How to Get the Wii's NAND Working on Dolphin UWP

*Credit to juntelart#9146 for help*

1.  **Copy Files (PC):** On your PC, go to Documents > Dolphin Emulator > Wii and copy *everything* from that folder.
2.  **Paste Files (Xbox):**  On your Xbox, use Durango FTP to navigate to your Dolphin UWP User Folder > `Wii`.  Paste the copied files, replacing existing files if prompted.
3. **Edit dolphin.ini** Using the **Dev Portal** on your PC, navigate to `LocalAppData > Dolphin > Localstate > Config` and download the `dolphin.ini` file.
4.  **Add Lines (INI):** Open dolphin.ini with a text editor and Add these lines to the `dolphin.ini` file, replacing `AA:BB:CC:DD:EE:FF` with your Wii's MAC address:
    *If you only want to play online, you can choose to only transfer clientca.pem clientcakey.pem and rootca.pem into the localstate/wii folder. This didn’t work for me personally.*

    ```ini
    [General]
    WirelessMac = AA:BB:CC:DD:EE:FF
    ```
5. **Save and Reupload:** Save your modified `dolphin.ini` to your PC, then using the **Dev Portal**, upload and replace the `dolphin.ini` back into the `LocalState > Config` folder on your Xbox.

### How to Play Online (Wiimmfi)

1.  **Patch Games:**  Patch your game ISOs using a Wiimmfi patcher: [https://wiimmfi.de/patcher/](https://wiimmfi.de/patcher/)
2.  **Wii NAND:** You *must* have a NAND from a real Wii.

### How to Connect to a DSU and Have Motion Controls (WIP)

*   See this document for device-specific guides: [How to connect different controllers to Dolphin.](https://docs.google.com/document/d/1PFQ8GmhqUHULYjbivLulFR60H12Kis55qk2VtUY-wvk/edit?usp=sharing)

### How to Make a WiiSD.raw (Homebrew Apps on Dolphin)

1.  **Dolphin PC:** Open Dolphin PC, go to Options > Configuration > Wii.
2.  **Convert to Folder:** Click "Convert File to Folder" in the SD card settings.
3.  **Locate Files:** Go to Documents > Dolphin Emulator > Load.  You'll find the relevant files.
4.  **WiiSDSync:**  Go to the `WiiSDSync` folder.
5.  **Create Apps Folder:**  Create an `apps` folder inside `WiiSDSync`.
6.  **Transfer App Files:**  Place your downloaded app files (e.g., Project+ folder, `apps` folder, `private` folder, `Boot.elf`) into the `WiiSDSync` folder.
7.  **Convert to File:** In Dolphin PC, go to Options > Configuration > Wii.  Click "Convert Folder to File".  This might take a while, and Dolphin might appear to freeze.  Wait for it to finish.
8.  **Transfer WiiSD.raw:** Copy the generated `WiiSD.raw` file to your Dolphin UWP `Load` folder on your Xbox.

### How to Play Super Smash Bros. Brawl Mods on Dolphin

1.  **Prerequisites:**
    *   A `WiiSD.raw` file with the mods installed, transferred to your `Load` folder.
    *   A Homebrew WAD file placed in your games folder.
    *   A dumped copy of Super Smash Bros. Brawl.

2.  **Launch Homebrew WAD:**  In Dolphin UWP, launch the Homebrew WAD file.
3.  **Select Mod:**  You should see your Smash mod in the list.
4.  **In-Game Settings:** Press L3 + R3 to open In-Game Settings.
5.  **Change Disc:** Select "Change Disc", locate your copy of Smash Bros. Brawl, and select it.
6.  **Load Mod:** Select the mod and load it within the Homebrew environment.

*Note: This guide does not apply to G15.*

### How to Configure Custom Controls for a Specific Game

*You need a default controller configuration before using this.*

1.  **Create Controller Config:** Create a controller configuration (see "Control Mapping" section).
2.  **Place Configs:**
    *   **Wii:**  `yourDolphinPath\Config\Profiles\Wiimote`
    *   **GameCube:** `yourDolphinPath\config\Profiles\GCPad\`
3.  **Rename:** Give the file a recognizable name.
4.  **Multiple Controllers:** For multiple controllers, copy and paste the file multiple times, renaming each one (e.g., `MyConfig1.ini`, `MyConfig2.ini`).
5.  **Create GameINI:** Create a `.ini` file and rename it to the Game ID of the game you want to configure.
6.  **Add Settings (Wii Example):**  For a Wii game, add and modify these lines (replace `Name of config` with your actual config file names):

    ```ini
    [Controls]
    WiimoteSource0 = 1
    WiimoteSource1 = 1
    WiimoteSource2 = 1
    WiimoteSource3 = 1
    WiimoteProfile1 = Name of config1
    WiimoteProfile2 = Name of config2
    WiimoteProfile3 = Name of config3
    WiimoteProfile4 = Name of config4

    [Core]
    WiimoteContinuousScanning = True
    ```

    [More information on settings](https://wiki.dolphin-emu.org/index.php?title=GameINI_(Controller_Settings))

### How to Make Riivolution Mods Work

*Written by JJRoyale#5840*

1.  **Create Folder:** Create a folder on your USB drive for the Riivolution mod files.
2.  **Extract Mod:** Extract the mod contents to the folder you created.  Repeat for each mod.
3.  **Dolphin PC:** Open Dolphin PC.
4.  **Start with Riivolution:** Right-click the game to be patched, select "Start with Riivolution Patches" > "Open Riivolution XML".
5.  **Select XML:** Select the XML file (usually in a folder named `riivolution` within the mod folder).
6.  **Save Preset:**  Click "Save as Preset", navigate to your Wii games location, and name the preset.
7.  **Modify XML:** Open the generated XML file and change the file path to match the path on your Xbox:
    *   **Dev Mode:** `E:\`
    *   **Retail Mode:** `D:\` (when/if it returns)
8.  **Launch in Dolphin UWP:**  In Dolphin UWP, you should see your mod listed.

### How to Patch a ROM/Game for a Mod (Example: Super Mario Eclipse)

*Written by jpolo1224, edited by JJRoyale*

1.  **Dumped ROM:**  Start with a dumped ROM of the game you want to mod.
2.  **Download Patch:** Download the patch file for the mod (e.g., an `.ips` or `.xdelta` file).
3.  **Patching Tool:**
    *   **.ips Patches:** Use Flips Manager.
    *   **.xdelta Patches:** Use xdelta and xdeltagui.
4.  **Apply Patch:** Use the chosen tool to apply the patch file to your ROM, creating a new, patched ROM.  *Back up your original ROM.*

### How to Use Smash Brawl Mods for Netplay without Homebrew (PMEX and similar)

*Written by jpolo1224. Redone by Jeen*

**Prerequisites:**

1.  Brawl ISO (or WBFS).
2.  Dolphin 1.16 installed.

**Setting Up Default ISO:**

1.  **Locate dolphin.ini:** Navigate to your Xbox Dolphin User Folder > `config` > `dolphin.ini`.
2.  **Add DefaultISO:** Under `[Core]`, add this line: `DefaultISO=` followed by the *full path* to your Brawl ISO on your Xbox.
    *   **Simplified Method:**
        1.  Add your game path on PC Dolphin.
        2.  Set Brawl as the default ISO on PC Dolphin.
        3.  Boot the game on PC Dolphin.
        4.  Close the game.
        5.  Go to `config`, `paths` in the PC Dolphin User Folder, and copy the `DefaultISO` path.
        6.  Paste this path into your Xbox `dolphin.ini` file.
        7. Or find it in your PC dolphin.ini.

**Downloading PMEX Remix:**

1.  **Visit Website:** Visit the PMEX Remix website: [https://drive.google.com/drive/folders/1u6aENdnSyDio-CmpNRLg8NXxc8xoYfQh](https://drive.google.com/drive/folders/1u6aENdnSyDio-CmpNRLg8NXxc8xoYfQh) to download the necessary files.

2.  **Download Launchers:** Download the *offline* and *netplay* launchers (.elf files). These are for solo/local play and online multiplayer, respectively. You'll find these in separate folders within the Google Drive.

3.  **Place Launchers:** Place the downloaded .elf files into your *games folder* on your Xbox (the same folder where you have your Brawl ISO/WBFS). This could be on your USB drive (recommended) or internal storage (not recommended).

4.  **Obtain SD Card:** From the PMEX Remix Dolphin download (likely a .zip or .7z file), find the `Wii` folder. Inside, there should be a folder named `sd`. Rename this folder to `WiiSD`.

5.  **Replace WiiSD.raw:** Replace the existing `WiiSD.raw` file in your Dolphin UWP *Load* folder (on your Xbox) with the renamed `WiiSD` folder you just prepared. This contains the mod's data.

**Launching PMEX Remix:**

1.  **Launch Launcher:** In Dolphin UWP on your Xbox, launch the .elf file corresponding to the mode you want:
    *   **PMEX Offline Launcher:** For full game access from the title screen (single-player, local multiplayer).
    *   **NETPLAY Launcher:** For online multiplayer.

2.  **Enjoy:** The modded Super Smash Bros. Brawl should now load.
