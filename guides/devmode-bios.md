---
layout: template
title: "Xbox Dev Mode BIOS Requirements"
permalink: /guides/devmode-bios/
description: "Required BIOS files for emulators used in Xbox Dev Mode."
author: "Jeen"
---

# Overview

Some emulators require firmware or BIOS files extracted from original hardware. These files must be placed in the correct directory for the emulator to detect them.

When using RetroArch, BIOS files are typically placed in:

/system

Some standalone emulators use their own internal BIOS folders.

Only the emulators below require BIOS files.

---

# PlayStation 2 (XBSX2)

XBSX2 requires a **PlayStation 2 BIOS dump**.

Common BIOS files:

SCPH-70012_BIOS_V12_USA_200.bin  
SCPH-70004_BIOS_V12_PAL_200.bin  
SCPH-70000_BIOS_JAPAN.bin  

Typical directory:

/system/pcsx2/bios

Multiple BIOS versions can be stored in the same directory.

## Using PS3 Backwards Compatibility BIOS

It is also possible to use BIOS files extracted from **backwards-compatible PlayStation 3 consoles**.

Examples:

ps2-0230a.bin  
ps2-0200a.bin  

These function as PS2 BIOS replacements and are supported by XBSX2.

---

# Sega Dreamcast / Naomi / Atomiswave (Flycast)

Flycast requires Dreamcast firmware files.

Required BIOS:

dc_boot.bin  
dc_flash.bin  

Typical directory:

/system/dc

Additional arcade platform BIOS:

Naomi systems:

naomi.zip  

Atomiswave systems:

awbios.zip  

---

# Nintendo 3DS (RetroArch – Citra Core)

Some configurations require Nintendo 3DS firmware components.

Required files:

boot9.bin  
boot11.bin  

Optional but sometimes required:

nand.bin  

Typical directory:

/system

These files are extracted from real Nintendo 3DS hardware.

---

# BIOS Summary

| Emulator | Required Files |
|--------|--------|
| XBSX2 (PS2) | PS2 BIOS or PS3 BC PS2 BIOS |
| Flycast | dc_boot.bin, dc_flash.bin |
| Flycast (Naomi) | naomi.zip |
| Flycast (Atomiswave) | awbios.zip |
| Citra (3DS) | boot9.bin, boot11.bin |

---

# File Detection

BIOS detection requires:

* Exact filenames
* Correct directory placement
* Correct file extensions

Incorrect names or placement will cause the emulator to report the BIOS as missing.