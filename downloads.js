const downloads = {

// EMULATORS

  // XBSX2
  xbsx2: "https://github.com/XboxEmulationHub/XBSX2/releases/download/2.0.8.3/xbsx2_2.0.8.3_x64.msix",
  
  // Dolphin
  dolphin: "https://github.com/SternXD/dolphin/releases/download/1.1.9.0/DolphinWinRT_1.1.9.0_x64.msix",
  
  // Flycast
  flycast: "https://github.com/flyinghead/flycast/releases/download/v2.5/flycast-2.5.appx",
  
  // Xenia
  xenia: "https://github.com/SirMangler/xenia/releases/download/1.1.5a/xenia-canary-uwp_1.1.5a.appx",
  
  // Citra
  citra: "https://github.com/YTReviveMe/RetroArch-uwp/releases/download/Citra-Alpha-RetroArch/RetroArch-Citra-Alpha_1.0.1.0_x64.msix",
  
  // Xbox One - No Cores
  retroarch1: "https://github.com/XboxEmulationHub/RetroArch/releases/download/05-02-2025/RetroArch-XboxOne.appx",
  
  // Xbox One - All Cores
  retroarch2: "https://github.com/XboxEmulationHub/RetroArch/releases/download/05-02-2025/RetroArch-XboxOne-AllCores.appx",
  
  // Xbox Series - No Cores
  retroarch3: "https://github.com/XboxEmulationHub/RetroArch/releases/download/05-02-2025/RetroArch-SeriesConsoles.appx",
  
  // Xbox Series - All Cores
  retroarch4: "https://github.com/XboxEmulationHub/RetroArch/releases/download/05-02-2025/RetroArch-SeriesConsoles-AllCores.appx",
  
  //PPSSPP
  ppsspp: "https://drive.google.com/uc?export=download&id=1rijhJMFEcN1qoxCMSf5iXi4G9I8_bUkL",
  
  // Supermodel emulator 
  supermodel1: "https://github.com/poopbird4k/Supermodel-uwp-gl/releases/download/v1.0.0.4/SegaModel3-powered-by-SuperModel-v1.0.0.4_NoGUI.appx",
  
  // Supermodel dependency
  supermodel2: "https://github.com/poopbird4k/Supermodel-uwp-gl/releases/download/v1.0.0.4/Microsoft.VCLibs.x64.14.00.appx",
  
    // Supermodel-G920 emulator 
  superg1: "https://github.com/poopbird4k/Supermodel-uwp-gl/releases/download/v1.0.0.4/SegaModel3-G920-powered-by-SuperModel-v1.0.0.4_NoGUI.appx",
  
  // Supermodel-G920 dependency
  superg2: "https://github.com/poopbird4k/Supermodel-uwp-gl/releases/download/v1.0.0.4/Microsoft.VCLibs.x64.14.00.appx",
  
  // Ruffle
  ruffle: "https://drive.google.com/uc?export=download&id=16PJ4EVXwz1ljaYMd43S61k5cHzr2X8EW",
  
  // OpenBOR 
  openbor1: "https://drive.google.com/uc?export=download&id=16Cmq95PWfLzmOinKNnxo1Zdg2FLVw4Rx",
  
  // OpenBOR Legacy
  openbor2: "https://drive.google.com/uc?export=download&id=16Cmq95PWfLzmOinKNnxo1Zdg2FLVw4Rx",
  
  // Ikemen-GO
  ikemen: "",
  
  // GZDoom
  gzdoom: "https://github.com/aerisarn/gzdoom-uwp/releases/download/1.0.7/zdoom_1.0.7.0_x64.msixbundle",
  
  // Raze
  raze: "https://github.com/aerisarn/Raze-uwp/releases/download/1.0.22/raze_1.0.22.0_x64.msixbundle",
  
  // BoxedWine
  boxedwine: "https://github.com/poopbird4k/Supermodel-uwp-gl/releases/download/v1.0.0.4/Microsoft.VCLibs.x64.14.00.appx",
  
  
  
// GAME PORTS

  // Castlevania Revamped
  castlevania: "https://drive.google.com/uc?export=download&id=16hBZME-610jsTGKmwTU8ZmBH6xd6InNF",
  
  // Celeste Classic
  celeste: "https://github.com/Xbox-Homebrew/ccleste/releases/download/1.0.2.0/CelesteClassic-UWP_1.0.2.0_Test.zip",
  
  // Chrono Divide
  chrono: "https://drive.google.com/uc?export=download&id=16hJY3G0jjdK-bwxuVCSpcrEevVPAwxCq",
  
  // Darkplaces Quake
  darkplaces: "https://drive.google.com/uc?export=download&id=16j7MGY_2pen4WmZJ6zV6CyuGZyDsjjXJ",
  
  // DevilutionX
  devilutionx: "https://github.com/diasurgical/DevilutionX/releases/download/1.5.4/devilutionx-xbox-one-series.zip",
  
  // Dhewm 3 HDR
  dhewm3hdr: "https://github.com/worleydl/dhewm3/releases/download/hdr-alpha/dhewm3-uwp_1.0.1.0_x64.msixbundle",
  
  // Dhewm 3 SDR
  dhewm3sdr: "https://github.com/worleydl/dhewm3/releases/download/hdr-alpha/dhewm3-uwp_p709_1.0.1.0_x64.msixbundle",
  
  // Dhewm 3 ROE
  dhewm3roe: "https://github.com/worleydl/dhewm3/releases/download/hdr-alpha/dhewm3-roe_uwp_1.0.1.0_x64.msixbundle",
  
  // Dhewm 3 Dependency
  dhewm3dep: "https://github.com/worleydl/dhewm3/releases/download/hdr-alpha/Microsoft.VCLibs.x64.14.00.appx",
  
  //DXX Rebirth
  dxxrebirth1: "https://github.com/worleydl/dxx-rebirth-uwp/releases/download/release-alpha/dxx-rebirth-uwp_1.0.3.0_x64.msixbundle",
  
  //DXX Rebirth dependency
  dxxrebirth2: "https://github.com/worleydl/dxx-rebirth-uwp/releases/download/release-alpha/Microsoft.VCLibs.x64.14.00.appx",
  
  // ioquake3
  ioquake3app: "https://github.com/worleydl/ioq3-uwp/releases/download/uwp-v1.0.0/uwp_1.0.0.0_rebundle_x64.msixbundle",
  
  // ioquake3 dependency 
  ioquake3dep: "https://github.com/worleydl/ioq3-uwp/releases/download/uwp-v1.0.0/Microsoft.VCLibs.x64.14.00.appx",
  
  // Jazz 2 resurrection 
  jazz2: "https://github.com/deathkiller/jazz2/releases/download/3.3.0/Jazz2_3.3.0_UWP.zip",
  
  // Maze0x72
  maze: "https://drive.google.com/uc?export=download&id=18YKPvE4mHfXLgQoY-V0XUy_scyqOaJDE",
  
  // Minesweeper
  mine: "https://drive.google.com/uc?export=download&id=18TiEEa25OX0bRZMBWRykXnWdiM1ERfhI",
  
  // Open JKDF2
  jkdf2app: "https://github.com/worleydl/OpenJKDF2-uwp/releases/download/uwp-alpha/openjkdf2-uwp_1.0.0.0_x64.msixbundle",
  
  // Open JKDF2 dependency 
  jkdf2dep: "https://github.com/worleydl/OpenJKDF2-uwp/releases/download/uwp-alpha/Microsoft.VCLibs.x64.14.00.appx",
  
  // Open JKDF2 controller profile
  jkdf2ctl: "https://github.com/worleydl/OpenJKDF2-uwp/releases/download/uwp-alpha/xbone.ctl",
  
  // OpenLara
  openlara: "https://github.com/XProger/OpenLara/releases/download/latest/OpenLara_xb1.zip",
  
  // OpenTyrian 2000
  opentyrian1: "https://drive.google.com/uc?export=download&id=175wee2D5xoB60z4O15Ld-7mB3Xg7XF0w",
  
  // OpenTyrian 2000 Freeware files
  opentyrian2: "https://drive.google.com/uc?export=download&id=176CtEHJWqaokRRb6DoWBEP0ykv0PoAeY",
  
  // Relic Hunters Zero
  relichunters: "https://github.com/MDashK/Relic-Hunters-Zero-Xbox/releases/download/v1.0.0/RelicHuntersZero.appx",
  
  // SDLPOP
  sdlpop: "https://github.com/Xbox-Homebrew/SDLPoP/releases/download/1.0.0.0/sdlpop.appx",
  
  // Snake UWP
  snake: "https://drive.google.com/uc?export=download&id=17NweU0yfh32Na9zqqyw18jLxAeFBsjNn",
  
  // SOH (Ship of Harkinian)
  soh1: "https://github.com/worleydl/shipdev/releases/download/uwp-1.1.5/soh-uwp_1.1.5.0_x64.msixbundle",

  // SOH (Ship of Harkinian) dependency 
  soh2: "https://github.com/worleydl/shipdev/releases/download/uwp-1.1.5/Microsoft.VCLibs.x64.14.00.appx",
  
  // Sonic 1 Decompilation 
  sonic1decomp: "https://drive.google.com/uc?export=download&id=17W0bUAji5ybPFEosQmnFsl0kiryGwuNZ",
  
  // Sonic 2 Decompilation
  sonic2decomp: "https://drive.google.com/uc?export=download&id=17auj4RzbrRLvCSxTpDFejgi-qC_RugPz",
  
  // Sonic 1 SMS Remake
  sonic1sms: "https://github.com/MDashK/sonic-1-sms-remake-xbox/releases/download/v1.9.2-xbox/Sonic1SMSRemake.appx",
  
  // Sonic 2 SMS Remake
  sonic2sms: "https://github.com/MDashK/sonic-2-sms-remake-xbox/releases/download/v2.9.2-xbox/Sonic2SMSRemake.appx",
  
  // Sonic 3 A.I.R
  sonic3air: "https://drive.google.com/uc?export=download&id=17jnUlMM76ztcac76zuNutyuYmIX9U0_4",
  
  // Sonic Adventure Blast 2
  sab2app: "https://github.com/worleydl/SAB2-uwp/releases/download/v1.0.0/SAB2_1.0.0.0_x64.msixbundle",
  
  // Sonic Adventure Blast 2
  sab2dep: "https://github.com/worleydl/SAB2-uwp/releases/download/v1.0.0/Microsoft.VCLibs.x64.14.00.appx",
  
  // Sonic CD Decompilation
  soniccd: "https://drive.google.com/uc?export=download&id=17yUkyPnQtmixv1OMFQYF2ngmHnEUpLHo",
  
  // Sonic Mania
  sonicmania: "https://github.com/izzy2lost/RSDKv5-Decompilation/releases/download/1.4.0/RSDKv5-UWP_1.4.0.0_x64.appx",
  
  // Sonic Realms
  sonicrealms: "https://drive.google.com/uc?export=download&id=18ARq0oWTgrQA3aR3XB588NxTHhRiN-uA",
  
  // Sonic Ring Racers
  ringracers1: "https://github.com/worleydl/ringracers-uwp/releases/download/uwp-initial/uwp_1.0.0.0_x64.msixbundle",
  
  // Sonic Ring Racers dependency 
  ringracers2: "https://github.com/worleydl/ringracers-uwp/releases/download/uwp-initial/Microsoft.VCLibs.x64.14.00.appx",
  
  // Sonic Robo Blast 2
  srb2: "https://github.com/aerisarn/srb2-uwp/releases/download/1.0.213/SRB2SDL2_1.0.213.0.zip",
  
  // Sonic Time Twisted
  sonictimetwisted: "https://drive.google.com/uc?export=download&id=18EkopK5SPQbHdCRJKLsuLdg9hIJ0osPG",
  
  // Sonic Unleashed Recomp
  unleashed1: "https://github.com/YTReviveMe/UnleashedRecomp-uwp/releases/download/Beta/UnleashedRecompiled_uwp_beta_1.0.3.0_x64.msixbundle",
  
  // Sonic Unleashed Recomp dependency 
  unleashed2: "https://github.com/YTReviveMe/UnleashedRecomp-uwp/releases/download/Beta/Microsoft.VCLibs.x64.14.00.appx",
  
  // Spelunky Classic HD
  spelunky: "https://drive.google.com/uc?export=download&id=18H7b2ydAMej7ynhODvqCBWmFO2uXPVki",
  
  // Spooky Dimensions
  spooky: "https://drive.google.com/uc?export=download&id=18HuPIq-zBBVAWR5ilAxp_2ZdNLoL2EOz",
  
  // Trogdor Reburninated
  trogdor: "https://drive.google.com/uc?export=download&id=18M9myT6bF1zVHh2UTH8zgXojcM8DC7iu",
  
  // Tuck King of the Sky
  tuck: "https://drive.google.com/uc?export=download&id=18aRcIzrd-ME--wwiuPQqtxNDo4g6JMRB",
  
  //VVVVVV
  vvvvvv1: "https://github.com/poopbird4k/DURANGO-V6/releases/download/v2.3.6.0/VVVVVV-v2.3.6.0.appx",
  
  // VVVVVV dependency 
  vvvvvv2: "https://github.com/poopbird4k/DURANGO-V6/releases/download/v2.3.6.0/Microsoft.VCLibs.x64.14.00.appx",
  
  // Zircon Quake
  zircon: "https://drive.google.com/uc?export=download&id=18PQOAYOoZCgJQJJXVA_XZwcdJg9jXzpX",
  
  // Zelda 64 Recomp
  zelda64: "https://github.com/YTReviveMe/Zelda64Recomp-uwp/releases/download/1.2.0/recomp_1.2.0.0_x64.msixbundle",
  
  
  
// APPS

  // Discord
  discorduwp: "https://drive.google.com/uc?export=download&id=13qvqqpDsuHGznBpUITiV6W50Ng3pqyex",
  
  // Moonlight
  moonlight1: "https://github.com/TheElixZammuto/moonlight-xbox/releases/download/1.17.5/moonlight-xbox-dx_1.17.5.0_x64.msixbundle",
  
  // Moonlight Dependency 1
  moonlight2: "https://github.com/TheElixZammuto/moonlight-xbox/releases/download/1.17.5/Microsoft.UI.Xaml.2.7.appx",
  
  // Moonlight Dependency 2 
  moonlight3: "https://github.com/TheElixZammuto/moonlight-xbox/releases/download/1.17.5/Microsoft.VCLibs.x64.14.00.appx",
  
  // X UWP
  xuwp: "https://drive.google.com/uc?export=download&id=13vqMwvw1GejeElQ_62A1i1QRPylJma71",
  
  // XB Cloud Gaming
  xbcloudgaming: "https://drive.google.com/uc?export=download&id=144V8fmPZBXklRYgfphkxbBt_dSKhkKuL",
  
  
  
// MEDIA APPS

  // Kodi
  kodi: "https://drive.google.com/uc?export=download&id=14YQNJ5FwlRnzdo5otCdp8l0dhLIDVR9V",
  
  // SoundCloud 
  soundcloud: "https://drive.google.com/uc?export=download&id=15Gf3gHcW3EK1zAF3_7_fZjUTG81fJBZC",
  
  // TuneIn Radio
  tunein: "https://drive.google.com/uc?export=download&id=1515UGixciiCsNilnqnqrDwUydUoDf5YP",
  
  // Twitch
  twitch: "https://drive.google.com/uc?export=download&id=14rv08APMZMEmQd6VTNl-Rt4bA8XxBti4",
  
  // VLC Media Player 
  vlc: "https://drive.google.com/uc?export=download&id=14VQd7q-nUe-mIjOiCttJnWgWv1nQ4zk1",
  
  // YouTube 
  youtube: "https://drive.google.com/uc?export=download&id=14EVGDFL3x8jGbIuCfVHMqhXja5xQquyT",
  
  // Zune
  zune: "https://drive.google.com/uc?export=download&id=15_ZOR4F4fXW8WCBTiDYpkbymdhTfJxUg",  
  
  
  
// FRONTENDS

  // Launchpass 
  launchpass1: "https://github.com/Misunderstood-Wookiee/LaunchPass/releases/download/v2.2.0/LaunchPass_2.2.0.0_x64.msixbundle",
  
  // Launchpass Dependencies
  launchpass2: "https://github.com/Misunderstood-Wookiee/LaunchPass/releases/download/v2.2.0/Dependencies_x64.zip",
  
  // Retropass
  retropass: "https://github.com/retropassdev/RetroPass/releases/download/RetroPass_v1.12.0/RetroPass_v1.12.0.zip",
 


// WIP APPS

  // Chonkystation3 
  chonkystation3: "https://drive.google.com/uc?export=download&id=18dxFEL2Ofv1kiN-pHZE-Zci_Woa3cPdm",

  // Hedge Physics
  hedgephysics: "https://drive.google.com/uc?export=download&id=170OC29cIE_kZjQNM6y3OtBK7B2EOqMgM",
  
  // Panda3DS
  panda3ds: "https://drive.google.com/uc?export=download&id=18rpPV5w4urNPSiBtasFMaM-SdS_ESQqW",
  
  //SM64HD fan remake
  sm64hd: "https://drive.google.com/uc?export=download&id=18cFjR6Y9nNVzzcTkAlTXxjfgNeheKso0",
  



 
 
// UTILITIES 

  // Console Media USB Tool
  xboxusb: "https://github.com/SvenGDK/XboxMediaUSB/releases/download/v2.2/XboxMediaUSB.v2.2.zip",
  
  // Durango FTP
  durangoftp: "https://github.com/Dantes-Dungeon/DURANGO-FTP/releases/download/v1.2.1/DurangoFTP_1.0.3.0_x64.msix",
  
  //Oberon Remote
  oberon: "https://github.com/SamsidParty/OberonRemote/releases/download/1.2.0/Oberon.Msixbundle",
  
  // Safe Exit
  safeexit: "https://github.com/Dantes-Dungeon/safe-exit/releases/download/1.0.0.1/SafeExitRelease.zip"
  
  };
