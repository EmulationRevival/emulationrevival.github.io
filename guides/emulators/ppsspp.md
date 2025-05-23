---
layout: template
title: "PPSSPP Guide"
permalink: /guides/emulators/ppsspp-guide/
description: "A guide for setting up PPSSPP on dev mode."
---

## PPSSPP Setup Guide
This is PPSSPP Setup Guide for External and Internal PPSSPP Users.
#### Guide Authors: Delta/Mewlew/Alouisious

### PPSSPP External USB Users
Make sure your USB is NTFS and has **ALL APP PACKAGES Permission** otherwise Games won't load.
If you want tutorial on setting USB Permission up with An App or Manual, see Dev Mode Setup Guide.

Once your USB is all set, Plug your USB in Xbox then Open PPSSPP and then It will ask you if you want to set PSP Folder on External or Internal

Create or Choose a PSP folder = **External USB**

Use App Private Data = **Internal Storage**

But If you accidentally choose **Use App Private Data** then No Problem! Just go to **Settings > System > Click Memory Stick Folder** then Choose **Create or Choose a PSP folder**

Once you choose "Create or Choose a PSP folder" then PPSSPP will create Folders for you automatically on USB.

### Games
PPSSPP will automatically set Games Path for you but If you are not able to see your Games then you can set path by clicking parent directory button until you see Letter Drives then click `E:/ > PSP Folder > GAME`. Once you are in GAME then click `+` button to pin Path.

### Textures
PPSSPP automatically does same as above but **Make sure Specific Game Folder name is GAMEID**

You can get Textures Packs from Resource channels or Official Forum of PPSSPP Orgs

If you get Textures Packs ZIP then you can put them in USB and then go to PPSSPP and click ZIP then Install Button so PPSSPP can automatically unzip Textures Packs and put them in Textures Folder but you can unzip Textures Pack manually by yourself on PC then put them in `TEXTURES` Folder.

Steps to Enable Custom Textures:

1.  In the settings menu, go to **Graphics** and scroll down to **Texture scaling**. Set **Upscale level** to **Off**.
2.  Navigate to **Tools**, then **Developer tools**, and ensure **Replace textures** is enabled. 

## Cheats
To install cheats on PPSSPP, you can get cheats files with `.ini` type once you got Cheat Files ready then put them in `Cheats` Folder inside `PSP` Folder.

Make sure to Turn it on and Enjoy it.

## PPSSPP Internal Storage Users

To setup PPSSPP with Internal Storage, You have to pick **Use App Private Data** when you load PPSSPP up. 

Once you've done that then

### Games
To upload your Games:

**Dev portal > File explorer > LocalAppData > PPSSPP > Localstate > Create a games folder here**

Your Games should be `ISO` or `CHD` files.

You can upload them as `.zip` files, and the dev portal will prompt you to unzip automatically.

## Textures, Cheats and Others
For Custom Textures, cheats etc. Upload them to their respective folders within:

**Dev portal > File explorer > LocalAppData > PPSSPP > Localstate > PSP**

### Credits

__External Guide written by DeltaModz (@notma.)__

__Internal Guide written by MewLew (@mewlew.)__

__Special Thanks to alouisious (@alouisious)__
