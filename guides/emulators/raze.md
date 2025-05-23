---
layout: template
title: "Raze Guide"
permalink: /guides/emulators/raze-guide/
description: "A guide for setting up raze on dev mode."
---

# Raze Setup Guide For Internal and External Storage
#### Guide Author: MewLew

## External Drive Setup  
1. Extract the premade USB folder from [**here**](<https://discord.com/channels/1024833470020722760/1223422209431834684>) and transfer the extracted `Raze` folder to your external drive.
2. Open the `Raze` folder and navigate to the game folders (e.g., `Blood`, `Duke3D`). 
   - Inside each folder is a `.txt` file listing the required game files.  
   - For example, in the `Blood` folder, you’ll need to include the following files:  
      - `blood.ini`  
      - All `.rff` files  
      - All `.art` files  
      - All `.dat` files  
      - All `.smk` files  
      - Music files are optional.
3. Copy the required files from your game installation into the corresponding folder.    
4. Once you've placed all the required game files correctly, drag the entire `Raze` folder to the root directory of your USB drive. 
5. Install Raze through the Dev Portal and launch it once to initialize the folders.
6. Upload the preconfigured `raze_portable.ini` file.
   - Open the **Dev Portal** on your PC.  
   - Navigate to `LocalAppData > Raze > Localstate` using the **File Explorer**.
   - Delete the existing `raze_portable.ini` file.
   - Click **Choose File**, navigate to your USB drive, and select the `raze_portable.ini` file from the extracted `Raze` folder.  
   - Click **Upload**.  
7. Eject your external drive from your PC and connect to the Xbox.
8. Launch Raze.
   - If only one game folder is present, it will load automatically.  
   - If multiple games are present, a basic menu will appear. Use **B** to scroll through the list if more than six games are available and **A** to select a game.

___

### Modding:
1. Inside the `Raze` folder, create the following subfolder:  
   - `Mods` (for mods like `.grp` or `.zip` files). 
2. Copy your mod files into the `Mods` folder (e.g., `E:\Raze\Mods`).  
3. Open the **Dev Portal** on your PC.  
   - Navigate to `LocalAppData > Raze > Localstate` using the **File Explorer**.
4. Locate the `raze_portable.ini` file in the `LocalState` folder and save it.
5. Open `raze_portable.ini` in a text editor (e.g., Notepad).  
6. Scroll to the specific game section like `[Duke.Autoload]`) and add the path to your mod file e.g:

```
[Duke.Autoload]
Path=E:\Raze\Mods\Metro.grp
```
```
[Blood.Autoload]
Path=E:\Raze\Mods\Blood_Graphics_AIO.zip
```
7. Save the changes and reupload your `raze_portable.ini` to the `LocalState` folder, replacing the original file.
8. Launch your game and your mods should be applied.

___

## Internal Setup 
1. Extract the premade USB folder from [**here**](<https://discord.com/channels/1024833470020722760/1223422209431834684>).
2. Open the `Raze` folder and navigate to the game folders (e.g., `Blood`, `Duke3D`). 
   - Inside each folder is a `.txt` file listing the required game files.  
   - For example, in the `Blood` folder, you’ll need to include the following files:  
      - `blood.ini`  
      - All `.rff` files  
      - All `.art` files  
      - All `.dat` files  
      - All `.smk` files  
      - Music files are optional.
3. Copy the required files from your game installation into the corresponding folder.    
4. Once you've placed all the required game files correctly, select all your game folders and compress them as a `.zip` file.
5. Configure your saves directory.
   - Open `raze_portable.ini` in a text editor (e.g., Notepad).
   - Locate the line `save_dir=E:\Raze\Saves` (using the search function can make this easier).
   - Modify it to `save_dir=Saves`
   - Save and close the `raze_portable.ini` file.
6. Install Raze through the Dev Portal and launch it once to initialize the folders.
7. Upload the preconfigured `raze_portable.ini` file.
   - Open the **Dev Portal** on your PC.  
   - Navigate to `LocalAppData > Raze > Localstate` using the **File Explorer**.
   - Delete the existing `raze_portable.ini` file.
   - Click **Choose File**, navigate to your USB drive, and select the `raze_portable.ini` file from the extracted `Raze` folder.  
   - Click **Upload**.  
8. Upload your game folders.
   - Open the **Dev Portal** on your PC.  
   - Navigate to `LocalAppData > Raze > Localstate` using the **File Explorer**.
   - Click **Choose File** and select the `zip` file that contains your game folders.
   - Click **Upload**.
   - When prompted to unzip automatically, choose **Yes**.
9. Create a Saves directory.
   - Open the **Dev Portal** on your PC.  
   - Navigate to `LocalAppData > Raze > Localstate` using the **File Explorer**.
   - Click **Create new folder** and name it `Saves`.
10. Launch Raze.
    - If only one game folder is present, it will load automatically.  
    - If multiple games are present, a basic menu will appear. Use **B** to scroll through the list if more than six games are available and **A** to select a game.

___

### Modding:
1. Inside the `LocalState` folder, create the following subfolder:  
   - `Mods` (for mods like `.grp` or `.zip` files).    
2. Copy your mod files into the `Mods` folder.  
3. Locate the `raze_portable.ini` file in the `LocalState` folder and save it.
4. Open `raze_portable.ini` in a text editor (e.g., Notepad).  
5. Scroll to the specific game section like `[Duke.Autoload]`) and add the path to your mod file e.g:

```
[Duke.Autoload]
Path=Mods\Metro.grp
```
```
[Blood.Autoload]
Path=Mods\Blood_Graphics_AIO.zip
```
6. Save the changes and reupload your `raze_portable.ini` to the `LocalState` folder, replacing the original file.
7. Launch your game and your mods should be applied.
