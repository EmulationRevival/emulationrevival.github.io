---
layout: template
title: "LaunchPass Guide"
permalink: /guides/frontends/launchpass-guide/
description: "A guide for setting up LaunchPass on dev mode."
---

# What is LaunchPass?
#### Guide Author: Delta
LaunchPass is a Frontend that is capable of launching ROMs in most Emulators on Xbox One and Series S|X Consoles.

# Requirements Checklist

+ **External USB Drive**
You will need a properly formatted USB drive to use LaunchPass. The USB drive must be formatted in NTFS and have the correct permissions - see the [Dev Mode Setup Guide](https://wiki.xboxdev.store/DevModeSetup#setting-up-usb-drive-for-emulation) for the steps. We recommend using an external SSD for smoother performance.

+ **Developer Mode on Xbox**
To run homebrew applications such as LaunchPass, you need to enable Developer Mode. This allows you to install applications that aren't available from the Microsoft Store. If you haven't enabled Developer Mode yet, don't worry - we've got you covered [here](https://wiki.xboxdev.store/DevModeSetup).

+  **LaunchBox**
You will need LaunchBox to use LaunchPass.
# Setting up Launchpass on Xbox
1. On your computer, go to [Xbox Dev Store](https://xboxdev.store).
2. Download the latest version of Launchpass.
3. You'll get the .MSIX file (LaunchPass)
## Transfer the Files to Xbox
1. Go to Xbox Dev Mode on your Xbox. Look for the IP address of your Xbox on the Developer Home Screen (it looks like 192.168.x.x).
2. On your PC, open a web browser and enter the Xbox IP address in the URL bar. This opens the Xbox Device Portal.
3. Sign in using your Xbox Developer credentials.
## Upload LaunchPass
1. In the Device Portal, go to My Games & Apps.
2. Click Add, then select Choose File.
3. Upload the LaunchPass .MsixBundles file 
4. Click Next and follow the prompts to install.
5. Go to Dev Mode on your Xbox then Select LaunchPass and click Guide button on your controller > View Details
Turn LaunchPass Game to App to be able to use Launchpass properly.

**Troubleshooting**: If the app doesn’t install correctly or gets stuck, refresh the page and retry.


# Install LaunchBox on USB
1. You will need to [Download LaunchBox](https://www.launchbox-app.com/download).  
2. Open LaunchBox Setup App then Choose USB Location (E:\LaunchBox) to install on USB instead of Local Computer User.
# Setup Emulators on LaunchPass
1. Open LaunchBox on your USB
2. Go to MENU > Tools > Manage > Emulators
![launchpassguidemain.png](/launchpassguidemain.png)
3. Click Add button

![launchpassguidemain2.png](/launchpassguidemain2.png)
**I'm only gonna create for PS2/PSP Games, You can add many emulators you wish**

# XBSX2 Installation on LaunchPass
1. **Make sure to write Emulator name correctly and then for Application Path, Make sure they are in lowercase.**
![launchpassguidexbsx2.png](/launchpassguidexbsx2.png)
**Check "Attempt to hide console window on startup/shutdown"**

2. Go to Associated Platforms Tab > Type Sony Playstation 2 
![launchpassguidexbsx22.png](/launchpassguidexbsx22.png)
3. Make sure Default Emulator is **Checked**
4. Click Add once you are done 

# Standalone PPSSPP Installation on LaunchPass
1. Click Add Option on Manage Emulators again
![launchpassguideppsspp.png](/launchpassguideppsspp.png)
**BE SURE TO PUT APPLICATION PATH .exe IN THE END IF YOU ARE USING STANDALONE EMULATOR**
2. Make sure to put What I wrote In the Picture
3. Go to Associated Platforms Tab
![launchpassguideppsspp2.png](/launchpassguideppsspp2.png)
4. Put Sony PSP on list then finally Click Add button Once you are done!

# Add Games on Launchbox
1. Go to TOOLS > Import > ROM Files
![launchpassguidemain3.png](/launchpassguidemain3.png)
2. For XBSX2 Put your PS2 Games Folder there
![launchpassguidemain4.png](/launchpassguidemain4.png)
3. Click Next Button
4. Choose Sony Playstation 2 From list for XBSX2
![launchpassguidemain5.png](/launchpassguidemain5.png)
5. Click Next Button 
6. XBSX2 is automatically on List you can Click Next Button Again
![launchpassguidemain6.png](/launchpassguidemain6.png)
7. ***Use the files in their current Location***
8. Click Next Button again 
![launchpassguidemain7.png](/launchpassguidemain7.png)
9. You can download which covers to load on LaunchPass (I'm gonna Check All)
10. Click Next button again (EmuMovies isn't needed.)
![launchpassguidemain8.png](/launchpassguidemain8.png)
11. Make sure to Deselect All Options in the below Picture
![launchpassguidemain9.png](/launchpassguidemain9.png)
12. **Be sure to check if All Games show up**
13. Click Finish Button once you are done!
