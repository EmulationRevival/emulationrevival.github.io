---
layout: template
title: "XBSX2 Guide"
permalink: /guides/emulators/xbsx2-guide/
description: "A guide for setting up XBSX2 on dev mode."
author: "Stern/Jeen"
---

XBSX2 is an emulator that allows you to play PlayStation 2 (PS2) games on your Xbox Series X/S, taking advantage of the hardware to provide smooth gameplay with features such as:

- Higher resolutions (up to 4K)
- HD texture packs
- 60fps patches
- Multiplayer (local and online)

### Requirements Checklist

- **Xbox Series X|S**
    Make sure you have an Xbox Series X or Series S. Note: Xbox One can run some PS2 games, but it's not powerful enough for most of them.
- **External USB Drive (Optional but Highly Recommended)**
    You will need a properly formatted USB drive to store the BIOS, games and other files. The USB drive must be formatted in NTFS and have the correct permissions - see the Dev Mode Setup Guide for the steps. We recommend using an external SSD for smoother performance when using HD textures or large games.
- **Developer Mode on Xbox**
    To run homebrew applications such as XBSX2, you need to enable Developer Mode. This allows you to install applications that aren't available from the Microsoft Store. If you haven't enabled Developer Mode yet, don't worry - we've got you covered here.

## Setting up XBSX2 on Xbox

### Download the Necessary Files

1.  On your computer, go to GitHub or the Xbox Dev Store.
2.  Download the latest version of XBSX2 and dependencies.
3.  You'll get two files: the `.MSIX` file (XBSX2 itself) and the `.APPX` dependencies (needed to run the app).

### Transfer the Files to Xbox

In order to install XBSX2 on your Xbox, you'll need to use the Xbox Device Portal on your computer.

1.  Go to Xbox Dev Mode on your Xbox. Look for the IP address of your Xbox on the Developer Home Screen (it looks like `192.168.x.x`).
2.  On your PC, open a web browser and enter the Xbox IP address in the URL bar. This opens the Xbox Device Portal.
3.  Sign in using your Xbox Developer credentials.

### Upload XBSX2

1.  In the Device Portal, go to **My Games & Apps**.
2.  Click **Add**, then select **Choose File**.
3.  Upload the XBSX2 `.appx` file and the `.APPX` dependencies.
4.  Click **Next** and follow the prompts to install.

**Troubleshooting:** If the app doesn’t install correctly or gets stuck, refresh the page and retry.

## Setting Up BIOS Files

A BIOS file is a core system file for running PS2 games. You’ll need to legally obtain a PS2 BIOS from a PlayStation 2 console you own.

### Get the PS2 BIOS File

**Important:** You must obtain the BIOS from your own PS2 hardware. There are several legal ways to do this:

* Use tools like FreeMcBoot on your PS2 console.
* Dump the BIOS using a modded PS2 or PS3.
* You can also extract a PS2 Bios from the PS3 firmware without a console. Watch this tutorial to learn how to do this.

#### Option 1: Using a USB drive

1.  Format your USB drive to NTFS and apply permissions. Click here if you don't know how to do this.
2.  Create a folder named `XBSX2` on the USB drive.
3.  Inside that folder, create another folder called `BIOS`.
4.  Copy the PS2 BIOS file to the `BIOS` folder on your USB drive.
5.  Make sure your BIOS should be like in the Picture. (Note: Image was referenced but not provided)

#### Option 2: Internal storage

1.  Upload the PS2 BIOS file using the Xbox Device Portal: Go to `Dev portal > File explorer > LocalAppData > XBSX2 > Localstate`
2.  Create a `BIOS` folder (if it doesn’t already exist).
3.  Copy the BIOS files into this folder.

### Configure BIOS on Xbox

1.  Plug the USB drive into your Xbox.
2.  Open XBSX2 on the Xbox.
3.  Navigate to **Settings > BIOS Directory**.
4.  Point the BIOS directory to the `BIOS` folder on your USB drive or internal storage.
    Once You've done BIOS Part then Click **BIOS Selection** to see if your BIOS show up like this: (Note: Image was referenced but not provided)

    But if your BIOS does not show up then you need to redump your BIOS.

## Adding PS2 Games

You need to legally dump your PS2 games. If you have physical PS2 discs, you can use a tool like ImgBurn on a PC to convert them into ISO files. Your ROMs should be ISO, BIN/CUE, or CHD files.

### Option 1: Transfer Games via USB

1.  On your USB drive, create a folder named `Games`.
2.  Inside the `Games` folder, create another folder called `PlayStation 2`.
3.  Copy your PS2 game ISOs into the `PlayStation 2` folder.

*Optional: If you want cover art for your games, download images (e.g., from GameFAQs) and rename them to match the game files.*

### Option 2: Upload Games to Internal Storage

Use the Xbox Device Portal to upload games: Go to `Dev portal > File explorer > DevelopmentFiles > WindowsApps > XBSX2`.

1.  Create a folder named `Games` in this directory.
2.  Upload the ROMs as `.ISO`, `BIN/CUE`, or `CHD` files. You can upload them as `.zip` files, and the Dev Portal will prompt you to unzip them automatically.

### Configure Games Directory on Xbox

1.  Open XBSX2 on the Xbox.
2.  Go to **Games List > Games Directory Tab**.
3.  Point the games directory to the `PlayStation 2` folder on your USB drive or the `Games` folder in internal storage.

## Configuring Memory Cards

To save your games in XBSX2, you need virtual memory cards.

### Option 1: USB Memory Cards

1.  On your USB drive, go to the `XBSX2` folder.
2.  Create a folder named `MemoryCards`.

### Option 2: Internal Storage Memory Cards

1.  Using the Xbox Device Portal, go to `Dev portal > File explorer > LocalAppData > XBSX2 > Localstate`.
2.  Create a `MemoryCards` folder (if it doesn’t exist).

### Set Up Memory Cards in XBSX2

1.  Open XBSX2 on your Xbox.
2.  Navigate to **Settings > Memory Card Settings**.
3.  Set **Slot 1** to use the `MemoryCards` folder on your USB drive or internal storage.

*Tip: Use folder-based memory cards so you never run out of save space.*

## Controller Setup

### Mapping the Xbox Controller

1.  Open XBSX2, go to **Settings > Controllers**.
2.  In **Controller Port 1**, set the controller type to **DualShock 2**.
3.  Use **Automatic Mapping** to automatically map the Xbox controller buttons to their PS2 counterparts.

*Note: You can also manually customize each button mapping for more control.*

### Multiplayer Setup

For multiplayer, set up the controllers as:

- Player 1: **Controller Port 1**
- Player 2: **Controller Port 2**, and so on.
Enable the **Multitap** setting if you plan on using more than 2 controllers.

## Adding Cheat Codes

### Find and Download Cheat Codes

Find cheats for your desired games. Recommended websites:

- Emulation Collective Discord
- Revives Community Server Discord
- Gamehacking.org
- PCSX2 forums

Download the cheats in PCSX2 PNACH format.

### Rename the PNACH File

Each game has a unique identifier called a CRC32 code. To apply the cheat code to your game, you must rename the downloaded PNACH file to match the CRC32 code of your game.

**Finding the CRC32 Code:**

1.  Open XBSX2 and navigate to your game list.
2.  Highlight the game in question and press **Y** (or the menu button).
3.  The CRC32 code will be displayed on the right side of the screen. Write it down.

### Edit the Cheat File (Optional)

If you want to manually add or tweak cheats:

1.  Open the PNACH file in a text editor (e.g., Notepad).
2.  Cheats are written as follows:
    `/patch=1,EE,XXXXXXXX,extended,YYYYYYYY`

    Replace `XXXXXXXX` with the memory address and `YYYYYYYY` with the cheat value.

### Option 1: Add Cheats to USB

1.  Go to the `XBSX2` folder on your USB drive.
2.  Create a subfolder called `Cheats`.
3.  Place the renamed PNACH files in the `Cheats` folder.

### Option 2: Add Cheats to Internal Storage

Use the Xbox Device Portal to access: `Dev portal > File explorer > LocalAppData > XBSX2 > Localstate`

1.  Create a `Cheats` folder here (if it doesn’t exist) and add the PNACH files.

### Enable Cheats in XBSX2

1.  Plug the USB drive back into the Xbox.
2.  Open XBSX2 and go to the **Cheats Menu**.
3.  Enable the desired cheats from the list, then launch the game.

## Applying 60FPS Patches

Some PS2 games run at 30fps by default. With 60fps patches, you can double the frame rate.

### Find 60FPS Codes

1.  Go to forums like the PCSX2 forums or GameHacking.org.
2.  Search for the 60fps patch for your game.

### Add the 60FPS Patch to the Cheat File

If you find the 60fps patch in raw format (hex codes), add it to your PNACH file as follows:

1.  Open the existing PNACH file for the game.
2.  Add a new line:
    `patch=1,EE,XXXXXXXX,extended,YYYYYYYY`
    Replace the `XXXXXXXX` and `YYYYYYYY` with the values provided by the patch.

### Option 1: Transfer by USB Drive

1.  On your USB drive, create a folder named `Cheats` inside your `XBSX2` folder.
2.  Copy the renamed PNACH file into the `Cheats` folder.

### Option 2: Transfer to Internal Storage

Use the Xbox Device Portal to upload the PNACH file: Go to `File Explorer > LocalAppData > XBSX2 > Localstate`.

1.  Create a `Cheats` folder (if it doesn’t exist) and upload the PNACH file there.

### Enable 60FPS Patch in XBSX2

1.  Open XBSX2 on your Xbox.
2.  Go to the **Cheats Menu**.
3.  Toggle the 60fps patch and launch the game.

## Setting Up HD Texture Packs

HD Texture Packs replace the original textures in PS2 games with high-resolution versions, making old games look sharper and more detailed.

### Download HD Texture Packs

There's no central hub for texture packs, but there are still plenty of places to find them:

* Xboxdev.store
* GBATEMP.net
* Community Discords like: Emulation Collective & Revives Community Server.

**Steps:**

1.  Search for an HD texture pack for your game.
2.  Download it.

### Prepare the Texture Pack

1.  Once downloaded, extract the texture pack.
2.  The extracted files should be in a folder named after the game’s SLUS/SLES code (you can find this code on the game's box or in XBSX2 under **Game Details**).

### Option 1: Add Textures via USB

1.  On your USB drive, go to the `XBSX2` folder.
2.  Create a subfolder named `Textures`.
3.  Inside the `Textures` folder, add the folder with the game’s SLUS/SLES code.

### Option 2: Upload Textures to Internal Storage

Use the Xbox Device Portal to upload the texture files.

1.  Go to `Dev portal > File explorer > LocalAppData > XBSX2 > Localstate > Textures`.
2.  Upload the game-specific texture folder here.

### Enable HD Textures in XBSX2

1.  Open XBSX2 on your Xbox.
2.  Go to **Settings > Graphics**.
3.  Toggle **Enable Texture Replacement**.
4.  Launch your game, and the HD textures will automatically be applied.

## Recommended settings

### Widescreen Patches

* Enable widescreen patches for games that didn’t support widescreen natively.
* In **Settings > Graphics**, toggle **Enable Widescreen Patches**.
* This stretches the image without distorting the game.

### Frame Pacing and VSync

* For smoother performance, enable **Optimal Frame Pacing** in **Settings > Performance**.
* Turn on **VSync** to prevent screen tearing, which can occur when the game’s frame rate doesn’t match the TV’s refresh rate.

### Resolution and Performance Tuning

* In XBSX2, you can change the internal resolution (e.g., from native PS2 resolution to 1080p or 4K) to enhance game visuals.
* Go to **Settings > Graphics** and adjust the **Internal Resolution** to 2x, 4x, or even 8x native resolution for crisper textures.

*Note: Higher resolutions may reduce performance, especially in demanding games.*
