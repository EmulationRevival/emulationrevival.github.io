---
layout: guide
title: "Tails Adventure Remake Guide"
permalink: /guides/ports/tailsadventure-guide.html
description: "A guide for setting up Tails Adventure Remake on dev mode."
author: "MewLew"
noindex: true
---

### Install the Tails Adventure Remake App
- Install the included `.msixbundle` via the Xbox Dev Portal.
- Install the included dependency file.

## Internal Storage Setup

Use this method if you want to store save data, runtime files and mods inside the app's Xbox Dev Mode **LocalState** folder.

### Internal Storage Location

The game stores internal files here:

`LocalState\tails-adventure`

Typical Xbox Dev Mode path:

`Q:\Users\UserMgr0\AppData\Local\Packages\<package-id>\LocalState\tails-adventure`

### Internal Setup Steps

1. Launch the game once first so the `LocalState\tails-adventure` folder is created.
2. Open the Xbox Dev Portal.
3. Go to the app's file explorer.
4. Open the app's `LocalState` folder.
5. Open or create this folder:

`tails-adventure`

6. Place your mod folders directly inside:

`LocalState\tails-adventure`

7. Add or edit `mods.ini` in the same folder.

### Internal Storage Example

`LocalState\tails-adventure\`  
`mods.ini`  
`Pinkails over Tails V2\`  
`Another Mod Folder\`  

## External USB Drive Setup

Use this method if you want to store mods on an external USB drive instead of inside the app's LocalState folder.

### External Storage Location

The game checks this external path:

`E:\TailsAdventureRemake\mods`

### External Setup Steps

1. Create this folder structure on the external drive:

`E:\TailsAdventureRemake\mods`

2. Place your mod folders inside the `mods` folder.
3. Add or edit `mods.ini` inside the same `mods` folder.

### External Storage Example

`E:\TailsAdventureRemake\mods\`  
`mods.ini`  
`Pinkails over Tails V2\`  
`Another Mod Folder\`  

## mods.ini Rules

`mods.ini` controls which mods are enabled and the order they load in.

Each mod needs its own section:

`[Pinkails over Tails V2]`  
`enabled=true`  
`priority=100`  

- `enabled=true` turns the mod on.
- `enabled=false` turns the mod off.
- If `enabled` is missing, the mod defaults to disabled.
- `priority` controls load order.
- Higher priority mods load later and can override lower priority mods.
- The section name must exactly match the mod folder name.

Correct:

`Folder: Pinkails over Tails V2`  
`mods.ini: [Pinkails over Tails V2]`  

Incorrect:

`Folder: Pinkails over Tails V2`  
`mods.ini: [Pinkails over tails v2]`  

## Additional Notes

- Internal storage users must launch the game once first so the LocalState folder is created.
- External USB users must use the exact path:

`E:\TailsAdventureRemake\mods`

- The game checks internal storage first, then checks the external USB path.
- If `mods.ini` does not exist and the selected mod root is writable, the game will create one automatically.
- If a mod does not load, check that the mod folder name and the `mods.ini` section name match exactly.