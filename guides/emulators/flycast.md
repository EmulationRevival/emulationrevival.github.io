---
layout: template
title: "Flycast Guide"
permalink: /guides/emulators/flycast-guide/
description: "A guide for setting up Flycast on dev mode."
---


# Flycast Guide
#### Guide Author: MewLew

## Supported ROM Formats

Flycast supports the following game formats:

- **SEGA Dreamcast Titles:** `.cdi`, `.gdi`, `.chd`, `.cue` (includes Windows CE games)
- **SEGA NAOMI GD-ROM Titles:** `.7z`, `.zip`, `.dat/.lst`, `.chd`
- **SEGA NAOMI 1 & 2 Titles:** `.zip`, `.7z`, `.dat/.lst`
- **Sammy Atomiswave Titles:** `.zip`, `.7z`

**Note:** Flycast does **not** support Hikaru or SEGA System SP games.

---

## Installing Flycast on Xbox Dev Mode

1. **Prepare Files:**
   - Get the Flycast `.appx` file (e.g., `flycast_2.5.appx`).
   - (Optional) Get a Dreamcast BIOS (dc_boot) file for better compatibility.

2. **Upload BIOS to USB (optional but recommended):**
   - Create a `Sega - Dreamcast` games folder on your USB.
   - Place the BIOS file and Dreamcast games inside.

3. **Install Flycast:**
   - Enable **Xbox Device Portal** in your Xbox Dev Mode settings.
   - On your PC, open a web browser and enter the Xbox Device Portal URL.
   - Go to **My games & apps** → **Add**.
   - Drag and drop the Flycast `.appx` file, click **Next**, then **Start**.
   - Once installed, click **Done**.

4. **Change App to Game Mode:**
   - On Xbox, hover over Flycast → press **Select** → **View Details**.
   - Change it from **App** to **Game**.

---

## Internal Storage Setup

**Where to upload your ROMs:**

- Xbox Device Portal → **File explorer** → `LocalAppData\Flycast\LocalState`
  - Create a `games` folder here.
  - Upload Dreamcast ROMs.
  - You can upload `.zip` files — the portal will prompt you to unzip.

**For cheats, VMUs, etc.:**

- Upload to:
  - `LocalAppData\Flycast\LocalState\Data`

---

## Initial Configuration

1. **Launch Flycast.**
2. Go to **Settings** → **Content Location** → **Add**.
3. Press **Up** on the D-pad → **A** → keep pressing **A** on **.. (Parent Directory)** until you see drives.
4. Select the **E:/** drive (USB)
5. If using internal storage the default drive will be **Q:/**.
6. Press **B** → **Select Current Directory**.

---

## Recommended Video Settings

- **Transparent Sorting:** Per Pixel
- **Automatic Frame Skipping:** Leave default
- **Widescreen Mode:** Enable if desired
- **Filtering:** 16x
- **VSync:** Enable if needed
- **Show FPS Counter / VMU in-game:** Optional
- **Internal Resolution:** Max for Series X; reduce on Series S for best performance
