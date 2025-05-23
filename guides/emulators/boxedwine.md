---
layout: template
title: "BoxedWine Guide"
permalink: /guides/emulators/boxedwine-guide/
description: "A guide for setting up BoxedWine on dev mode."
---

# Installing and Using BoxedWine on Xbox (Developer Mode) 

This guide explains how to install and run BoxedWine, a Windows application emulator, on an Xbox Series S/X console in Developer Mode.  BoxedWine allows you to run 32-bit Windows applications and games.  This guide is based on a YouTube tutorial by ReviveMe (https://www.youtube.com/@ReviveMe).
## Prerequisites

Before you begin, you *must* have the following:

1.  **Xbox in Developer Mode:**  This is absolutely essential. [DevModeSetup](/DevModeSetup)
2.  **External Storage:** A USB flash drive or external hard drive.  This drive *must* be properly formatted for use with the Xbox in Developer Mode.
3.  **A PC (Windows Recommended):** You'll need a computer to download files, prepare the external drive, and remotely manage your Xbox.
4.  **BoxedWine Files:** These are downloaded from https://xbdev.store/
5.  **(Optional) 32-bit Windows Application:** This is used to test BoxedWine. The application's files (.exe, .msi, or .bat, and any required dependencies) *must be compressed into a .zip file*.

## Installation

The installation process is divided into three main parts:

### Part 1: Downloading and Preparing Files (on your PC)

1.  **Download BoxedWine:**
    *   Open a web browser and go to the "Xbox Dev Store" website.
    *   Navigate to the section labeled "Emulators".
    *   Locate "BoxedWine".  The description should mention "Runs 32-bit apps and games..."
    *   Click the "Download" button.  This will download a file named `boxwine.zip`.

2.  **Prepare your 32-bit Application (Example: Space Cadet Pinball):**
    *   This guide uses "Space Cadet Pinball" as an example, but you can use any 32-bit Windows application.
    *   **CRITICAL:** All files related to your chosen application (the executable file - .exe, along with any necessary .dll files or other supporting files) *must* be compressed together into a single .zip file.  If you have an installer (.msi) or a batch file (.bat), these should also be included in the .zip file.  *This is a mandatory requirement for BoxedWine to function correctly.*

3.  **Create Folder Structure on External Drive:**
    *   Connect your external drive to your PC.
    *   Create a new folder on the external drive. The original tutorial uses the name "boxwine", but you can choose any name you prefer.  This is where your application will reside.
    *   Copy the .zip file containing your 32-bit application *into* this newly created folder.
    *   Safely eject the external drive from your PC.

4.  **Extract the BoxedWine .zip File:**
    *   On your PC, locate the `boxwine.zip` file you downloaded.
    *   Right-click on the file and choose "Extract All..." (or use the equivalent extraction option provided by your .zip utility). Extract the contents to a new folder (e.g., a folder also named "boxwine").  *Do not attempt to install directly from the .zip archive.*
    *   After extraction, you should find files including `boxwine.msixbundle` and a `Dependencies` folder within the extracted folder.

### Part 2: Installing BoxedWine on Your Xbox (Using Remote Access)

1.  **Enable Developer Portal on Your Xbox:**
    *   On your Xbox, navigate to the settings for Developer Mode.
    *   Locate and click on "Remote Access Settings".
    *   Enable the option labeled "Xbox Dev Portal".
    *   **IMPORTANT:**  Take a screenshot or carefully write down the two web addresses (URLs) that are displayed.  These URLs are crucial for accessing your Xbox remotely from your PC.
    *   *Optional (but recommended):* The original tutorial suggests leaving the "Authentication" option (username/password) unchecked. This simplifies access to the portal.
    *   **Keep your Xbox on this settings screen.**

2.  **Access the Xbox Device Portal from Your PC:**
    *   Open a web browser on your PC.
    *   In the address bar, type one of the URLs you recorded from your Xbox (the ones you just wrote down or screenshotted).  Ensure that you include `https://` at the beginning of the URL.
    *   You will likely encounter a security warning (e.g., "Your connection is not private"). Click on "Advanced" and then choose "Proceed" (or the corresponding option in your browser) to bypass the warning.

3.  **Install BoxedWine:**
    *   Once you are in the Xbox Device Portal (in your web browser), locate the "My games & apps" section.
    *   Click the "Add" button.
    *   Click "Choose file" (or a similarly labeled button) and navigate to the extracted `boxwine` folder on your PC (where you extracted `boxwine.zip`).
    *   Select the `boxwine.msixbundle` file and click "Open".
    *   Click "Next".

4.  **Install Dependencies:**
    *   The portal will prompt you to "Choose any necessary dependencies".
    *   Click "Choose file" again.
    *   Navigate to the `Dependencies` folder *inside* the extracted `boxwine` folder, and then go into the `x64` folder.
    *   **CRITICAL:** You must add *all five* dependency files, and you must do it *one by one*. Select each file individually and click "Open" for each one.
    *   After all five dependencies have been added, click "Start".

5.  **Wait for Installation to Complete:**
    *   The installation process will take some time.  Wait until you see the message "Package successfully registered".
    *   Click "Done".
    *   You can now close the Xbox Device Portal in your web browser.

### Part 3: Configuring and Running BoxedWine on Your Xbox

1.  **Set BoxedWine to "Game" Mode:**
    *   Back on your Xbox, find BoxedWine in your list of applications.
    *   Press the "Select" button (or the equivalent menu button) on your Xbox controller.
    *   Choose "View details".
    *   Change the application type from "App" to "Game". If it's already set to "Game", you can skip this step.
