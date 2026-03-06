---
layout: template
title: "Dev Mode Guide"
permalink: /guides/devmode-guide/
description: "A guide for setting up dev mode on dev Xbox."
author: "Jeen"
---

# Preliminary Steps

## Important notes
* If you are in the Xbox Update Preview program, ensure that you exit it before switching on Dev Mode. This step helps in preventing the **E208 error**. Here's how to exit:
    * Open the **Xbox Insider Hub**.
    * Navigate to **Previews > Xbox Update Preview > Manage > Leave Preview**.
    * Update your console through **Settings > System > Updates**.
* Switching between Dev and Retail Modes deletes your **Quick Resume states** and any **local captures**. To save captures, use an external USB drive.

---

# Microsoft Developer Account (Now Free)

Microsoft no longer charges the one-time fee for **Individual developer accounts** used to activate Dev Mode on Xbox. You can now register a developer account at no cost.

## What You Need
* An Xbox One or Series console
* A Windows 10/11 PC or virtual machine
* USB drive for storing files

## Steps
1. Go to the Microsoft developer registration page:  
   `https://developer.microsoft.com/store/register`

2. Sign in with your **Microsoft account**.

3. Click **Create a developer account**.

4. Select:
   * **Country/Region**: Your actual location
   * **Account Type**: **Individual**

5. Complete the required profile fields (name, address, contact details).

6. Accept the developer agreement.

7. Submit the registration.

8. Your **Microsoft Developer Account will be activated without payment**.

Once completed, your account is ready to activate **Xbox Dev Mode**.

---

# Setting up USB drive for emulation

## Manual instructions for formatting and adding permissions

### Important notes
* This is the most reliable method for preparing a USB drive for Xbox Dev Mode emulation.
* You **must** use a **Windows PC or VM** to apply the required permissions correctly.

### Steps
1. **Format your USB drive to NTFS**
    * Connect your USB/external drive to your PC.
    * Right-click the drive and select **Format**.
    * Under **File System**, select **NTFS**.
    * Click **Start**.

2. After formatting:
    * Right-click the drive.
    * Select **Properties > Security** tab.

3. Navigate to:
    * **Advanced > Add > Select Principal > Advanced > Find Now**

4. Select:
    * **ALL APPLICATION PACKAGES**

5. Click:
    * **OK > Tick Full Control > OK**

6. Tick:
    * **Replace all child object permission entries**

7. Click **OK**.

8. You may receive a **System Volume Information** warning. Select **Continue** and ignore it.

9. When connecting the drive to Xbox, select **Media**.  
   **Do NOT select "Games and Apps".**

---

## Using XboxMediaUSB

### Important notes
* Some users report that **XboxMediaUSB does not apply correct permissions automatically**.
* If issues occur, perform the **manual permission steps above**.

### Steps
1. Go to the XboxMediaUSB GitHub repository.
2. Download the **latest release**.
3. Extract the archive.
4. Open `XboxMediaUSB.exe`.
5. Select your USB drive.
6. Click **Format USB**.
7. Safely eject the drive once formatting completes.

---

# Installing Dev Mode on Xbox

## Initial setup
1. Open the **Microsoft Store** on your Xbox.
2. Search for **Xbox Dev Mode**.
3. Install and open the app.
4. The app will display:
   * A **unique activation code**
   * A link for activation.

5. On your PC, open:  
   `https://aka.ms/activatexbox`

6. Sign in with the **same Microsoft account used for your developer registration**.

7. Enter the **activation code shown on your Xbox**.

8. Confirm activation.

9. Your console will switch to **Dev Mode and restart**.

---

# Configuration

## First Setup
1. After the restart, open **Manage Dev Storage**.
2. Allocate **at least 5GB** to Dev Mode storage.
3. Restart the console to apply the change.

---

## Connect to Internet
1. Go to **Settings > Network Settings**.
2. Connect via **Wi-Fi** or **Ethernet**.
3. Once connected, proceed to configure remote access.

---

# Remote Access via PC

## Steps
1. Go to **Settings > Remote Access Settings**.
2. Enable **Xbox Device Portal**.

Optional:
* Enable **Require Authentication**.
* Set a **username and password** for portal access.

---

# Accessing Xbox Device Portal

## From PC
1. In a web browser, enter the **Device Portal URL** displayed on your Xbox.
2. Ignore the browser security warning and proceed.

---

## What you can do in Device Portal
* Install applications
* Upload emulator packages
* Manage files
* View logs
* Adjust system settings

---

# Installing Emulators

## Download Emulators
1. Download emulator packages such as **RetroArch** or **Dolphin** built for Xbox Dev Mode.
2. Extract the files on your PC.

---

## Upload to Xbox
1. Open **Xbox Device Portal** in your browser.
2. Click the green **Add** button in the **Apps** section.
3. Drag:
   * The emulator **APPX** file
   * Any required **dependency packages** (typically `x64`).

4. Click **Next** and complete the installation.

After installation, the emulator will appear in your **Dev Mode app list** and can be launched directly.