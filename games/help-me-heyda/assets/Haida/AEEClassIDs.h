#ifndef AEECLASSIDS_H
#define AEECLASSIDS_H
/*======================================================
FILE:  AEECLASSIDS.h

SERVICES:  AEE Classes

GENERAL DESCRIPTION:
        Base level definitions, typedefs, etc. for AEE

        Copyright © 1999-2001 QUALCOMM Incorporated.
               All Rights Reserved.
            QUALCOMM Proprietary/GTDR
=====================================================*/

#define QVERSION                 0x01000000        // Most significant 8-bits are version

// CLSIDs (Class ID's)

#define AEECLSID_PRIV              (QVERSION)
#define AEECLSID_CORE              (QVERSION + 0x1000)
#define AEECLSID_ENH               (QVERSION + 0x2000)
#define AEECLSID_CONTROL           (QVERSION + 0x3000)
#define AEECLSID_VIEW              (QVERSION + 0x4000)
#define AEECLSID_PROTO             (QVERSION + 0x5000)
#define AEECLSID_OEM               (QVERSION + 0x6000)
#define AEECLSID_OEM_APP           (QVERSION + 0x7000)
#define AEECLSID_SAMPLE_APP        (QVERSION + 0x8000)
#define AEECLSID_USAGE_APP         (QVERSION + 0x9000)

#define AEECLSID_APP               0x01010100
#define AEECLSID_EXTENSION         0x01800000

#define AEECLSID_RANGE             (0x00000fff)

// Protected Classes - Cannot be updated

#define AEECLSID_DOWNLOAD          (AEECLSID_PRIV)
#define AEECLSID_QUERYINTERFACE    (AEECLSID_PRIV+1)
#define AEECLSID_COREAPP           (AEECLSID_PRIV+2)
#define AEECLSID_ADSQUERY          (AEECLSID_PRIV+3)

// 
// Core Classes
//
#define AEECLSID_SHELL             (AEECLSID_CORE)
#define AEECLSID_DISPLAY           (AEECLSID_CORE+1)
#define AEECLSID_HEAP              (AEECLSID_CORE+2)
#define AEECLSID_FILEMGR           (AEECLSID_CORE+3)
#define AEECLSID_NET_10            (AEECLSID_CORE+5)
#define AEECLSID_TAPI              (AEECLSID_CORE+7)
#define AEECLSID_DBMGR             (AEECLSID_CORE+8)
#define AEECLSID_DIALOG            (AEECLSID_CORE+9)
#define AEECLSID_STATIC_10         (AEECLSID_CORE+10)
#define AEECLSID_SOUND             (AEECLSID_CORE+11)
#define AEECLSID_MEMASTREAM        (AEECLSID_CORE+12)
#define AEECLSID_PHONE             (AEECLSID_CORE+14)
#define AEECLSID_LICENSE           (AEECLSID_CORE+15)
#define AEECLSID_CERTCACHE         (AEECLSID_CORE+16)
#define AEECLSID_SOURCEUTIL        (AEECLSID_CORE+17)
#define AEECLSID_SOURCE            (AEECLSID_CORE+18)
#define AEECLSID_GETLINE           (AEECLSID_CORE+19)
#define AEECLSID_UNZIPSTREAM       (AEECLSID_CORE+20)
#define AEECLSID_MD5               (AEECLSID_CORE+21)
#define AEECLSID_RSCPOOL           (AEECLSID_CORE+22)
#define AEECLSID_THREAD            (AEECLSID_CORE+23)
#define AEECLSID_PORT              (AEECLSID_CORE+24)
#define AEECLSID_ARC4              (AEECLSID_CORE+25)
#define AEECLSID_RSA               (AEECLSID_CORE+26)
#define AEECLSID_POSDET            (AEECLSID_CORE+27)
#define AEECLSID_PEEK              (AEECLSID_CORE+28)
#define AEECLSID_NET               (AEECLSID_NET_10 + 0x100)
#define AEECLSID_STATIC            (AEECLSID_STATIC_10 + 0x100)


//
// Enhanced Classes
//
#define AEECLSID_SOUNDPLAYER       (AEECLSID_ENH)
#define AEECLSID_GRAPHICS          (AEECLSID_ENH+1)
#define AEECLSID_VOICE             (AEECLSID_ENH+2)
#define AEECLSID_RINGERMGR         (AEECLSID_ENH+3)
#define AEECLSID_ADDRBOOK          (AEECLSID_ENH+4) 
#define AEECLSID_SAXREADER         (AEECLSID_ENH+5)
#define AEECLSID_SAXCONTENTHANDLER (AEECLSID_ENH+6)
#define AEECLSID_SAXATTRIBUTES     (AEECLSID_ENH+7)
#define AEECLSID_SAXLOCATOR        (AEECLSID_ENH+8)

//
// UI Controls
//
#define AEECLSID_MENUCTL_10        (AEECLSID_CONTROL)
#define AEECLSID_SOFTKEYCTL_10     (AEECLSID_CONTROL+1)
#define AEECLSID_LISTCTL_10        (AEECLSID_CONTROL+2)
#define AEECLSID_ICONVIEWCTL_10    (AEECLSID_CONTROL+3)
#define AEECLSID_DATEPICKCTL       (AEECLSID_CONTROL+4)   
#define AEECLSID_DATECTL           (AEECLSID_CONTROL+5)   
#define AEECLSID_STOPWATCHCTL      (AEECLSID_CONTROL+6)
#define AEECLSID_CLOCKCTL          (AEECLSID_CONTROL+7)
#define AEECLSID_COUNTDOWNCTL      (AEECLSID_CONTROL+8)
#define AEECLSID_TEXTCTL           (AEECLSID_CONTROL+9)

// 1.NNN Versions...

#define AEECLSID_MENUCTL           (AEECLSID_MENUCTL_10 + 0x100)
#define AEECLSID_SOFTKEYCTL        (AEECLSID_SOFTKEYCTL_10 + 0x100)
#define AEECLSID_LISTCTL           (AEECLSID_LISTCTL_10 + 0x100)
#define AEECLSID_ICONVIEWCTL       (AEECLSID_ICONVIEWCTL_10 + 0x100)

//
// Viewers
//
#define AEECLSID_WINBMP             (AEECLSID_VIEW+1)
#define AEECLSID_NATIVEBMP          (AEECLSID_VIEW+2)
#define AEECLSID_GIF                (AEECLSID_VIEW+3)
#define AEECLSID_PNG                (AEECLSID_VIEW+4)
#define AEECLSID_JPEG               (AEECLSID_VIEW+5)
#define AEECLSID_BCI                (AEECLSID_VIEW+6)
#define AEECLSID_HTML               (AEECLSID_VIEW+7)

//
// Protocol Handlers
//
#define AEECLSID_WEB                (AEECLSID_PROTO)
#define AEECLSID_WEBUTIL            (AEECLSID_PROTO+1)
#define AEECLSID_WEBRESP            (AEECLSID_PROTO+2)
#define AEECLSID_WEBREQ             (AEECLSID_PROTO+3)
#define AEECLSID_WEBOPTS            (AEECLSID_PROTO+4)
#define AEECLSID_WEBENG             (AEECLSID_PROTO+5)

#define AEECLSID_BROWSER            0x01007100










#define AEECLSID_BILLCOM 0X018000FC // KTF BillComm Headers
#define AEECLSID_DM 0x018000FE
#define AEECLSID_SIS 0x01800104 //SIS file format Headers




#endif   // AEECLASSIDS_H
