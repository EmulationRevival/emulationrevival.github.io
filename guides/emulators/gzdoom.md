---
layout: template
title: "GZDoom Guide"
permalink: /guides/emulators/gzdoom-guide/
description: "A guide for setting up GZDoom on dev mode."
---

## **External Drive Setup**  
1. On your external drive, create a folder for GZDoom (e.g., `E:\GZDoom`).  
2. Inside the `GZDoom` folder, create the following subfolders:  
   - `Mods` (for mods like `.pk3` or `.zip` files).  
   - `Games` (for `.wad` game files).  
3. Copy your game `.wad` files into the `Games` folder (e.g., `E:\GZDoom\Games`).  
4. Install GZDoom through the Dev Portal and launch it, navigate to your external drive and select your GZDoom games folder (e.g., `E:\GZDoom\Games`).
   - If you have one game file, it will load automatically.  
   - If multiple `.WAD` files are present, a basic menu will appear. Use **B** to scroll through the list if more than six games are available and **A** to select a game.  

**Modding:**
1. Copy your mod files (`.pk3` or `.zip`) into the `Mods` folder (e.g., `E:\GZDoom\Mods`).  
2. Install GZDoom through the Dev Portal and launch it once, navigate to your external drive and select your GZDoom games folder (e.g., `E:\GZDoom\Games`). This will generate the ini file in the same directory.
3. Locate the `gzdoom_portable.ini` file in the `Games` folder:  
   - Example: `E:\GZDoom\Games\gzdoom_portable.ini`.  
4. Open `gzdoom_portable.ini` in a text editor (e.g., Notepad).  
5. Scroll to the `[Global.Autoload]` section (or the specific game section like `[doom.id.Autoload]`) and add the full path to your mod file e.g:

```
[Global.Autoload]
Path=E:\GZDoom\Mods\Universal_Enhanced_AI.pk3
```
```
[doom.id.Autoload]
Path=E:\GZDoom\Mods\brutalv21.pk3
```
6. Save the changes to your `gzdoom_portable.ini` and ensure it is saved in your `Games` folder.
7. Launch your game and your mods should be applied.

## **Internal Setup**  
1. Install GZDoom through the Dev Portal and launch it once to initialize the folders. (*Press B to exit GZDoom when prompted to select a folder.*)  
2. Open the **Dev Portal** on your PC.  
3. Navigate to `LocalAppData > GZDoom > Localstate` using the **File Explorer**.  
4. Copy your game `.wad` files into the `LocalState` folder loose.  
5. Launch GZDoom.
   - If you have one game file, it will load automatically.  
   - If multiple `.WAD` files are present, a basic menu will appear. Use **B** to scroll through the list if more than six games are available and **A** to select a game.

**Modding:**
1. Inside the `LocalState` folder, create the following subfolder if it doesn't already exist:  
   - `Mods` (for mods like `.pk3` or `.zip` files).    
2. Copy your mod files (`.pk3` or `.zip`) into the `Mods` folder.  
3. Locate the `gzdoom_portable.ini` file in the `LocalState` folder and save it.
4. Open `gzdoom_portable.ini` in a text editor (e.g., Notepad).  
5. Scroll to the `[Global.Autoload]` section (or the specific game section like `[doom.id.Autoload]`) and add the path to your mod file e.g:

```
[Global.Autoload]
Path=Mods\Universal_Enhanced_AI.pk3
```
```
[doom.id.Autoload]
Path=Mods\brutalv21.pk3
```
6. Save the changes and reupload your `gzdoom_portable.ini` to the `LocalState` folder, replacing the original file.
7. Launch your game and your mods should be applied.

## **Notes**  
- Mods added under `[Global.Autoload]` will load for all games.  
- To load mods for specific games only, add the path under the relevant section (e.g., `[doom.doom2.Autoload]`).  
- Avoid loading multiple conflicting mods unless they are designed to work together.
- You can also edit the `.ini` file to modify:  
   - **Graphics settings**: Customize resolution and effects.  
   - **Controls**: Map inputs to suit your play style.
- Prefer to follow a video? Revive has tutorials for [**setting up**](https://youtu.be/M1LX8MifJhM) and [**modding**](https://youtu.be/CnOntH5Hr6s?si=Iwzi3rEioUWO1dAs).

