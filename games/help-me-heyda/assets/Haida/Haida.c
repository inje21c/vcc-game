/*===========================================================================

FILE: Haida.c
===========================================================================*/
/*
		ClearBlack();
		rect.x = 0;
		rect.y = 0;
		rect.dx = pMe->di.cxScreen;
		rect.dy = pMe->di.cyScreen;
		IDISPLAY_FillRect(pMe->a.m_pIDisplay, &rect, 0);
*/
//BlockDown	: OK
//BlockUp	: OK
//BlockPushN: OK
//BlockPushS:
//BlockSort	: OK1
//BlockClear: OK
//BlockInit	: OK
//Queue Set	: OK
//Level Set	: OK
//TimeGaze	: OK
//Bomb ITEM	:
//Time ITEM	:
//Score		:
//Feather	:
//Combo Chk	: OK
//Skill Pnt	: OK

//INTERFACE
//RANKING	:
//INTRO		:
//MENU		:
//OPTION_GM	:
//OPTION_OUT:
//HELP		:
	
/*===============================================================================
INCLUDES AND VARIABLE DEFINITIONS
=============================================================================== */
#include "AEEModGen.h"          // Module interface definitions
#include "AEEAppGen.h"          // Applet interface definitions
#include "AEEShell.h"           // Shell interface definitions
#include "AEEFile.h"			// File interface definitions
#include "AEEDB.h"				// Database interface definitions
#include "AEENet.h"				// Socket interface definitions
#include "AEESound.h"			// Sound Interface definitions
#include "AEETapi.h"			// TAPI Interface definitions
#include "AEEStdlib.h"
#include "AEEHeap.h"
#include "AEEMenu.h"
#include "AEEGraphics.h"
#include "IEB_KTF_BillCom.h"
#include "AEEClassIDs.h"
//#include "AEEStatics.h"

#include "haida.h"
#include "TAKE_YOUR_HANDS.BID"
#include "NBM.h"
//#include "temp_res.h"

#include "haida_res.h"
#include "haisnd_res.h"
#include "haiblock_res.h"

#define HAIDA_COMP_RES_FILE "haida.bar"
#define HAIDA_SND_FILE "HaiSnd.bar"
#define HAIDA_RES_FILE	"haida.bar"




#define SERVER_IP	"211.233.81.68"
#define SERVER_PORT	4097



#define ISDIGIT(c)  ( (unsigned) ((c) - '0') < 10)
#define ISALPHA(c)  ( (unsigned) ( ((c)|32) - 'a') < 26 )
#define ISALNUM(c)  ( ISDIGIT(c) || ISALPHA(c) )


#define ARRAYSIZE(a)   (sizeof(a) / sizeof((a)[0]))




/*-------------------------------------------------------------------
            Type Declarations
-------------------------------------------------------------------*/
typedef struct
{ 
	int    iSignature1;                     //전송할 패킷 데이터의 헤더 구분 필드 
	char   achContentsId[12];          //전송할 패킷 데이터의 과금 정보 (CP번호(5자리) + 컨텐츠 번호(2자리) +                                                       //메뉴  [번호(2자리)) ..바과금이면 0X00]
	char   szChargNumber[12];      //과금 전화 번호 
	char   szResv[12];                  // 확장 
	uint32 uiLen;                         // 헤더를 제외한 실제 데이터 사이즈 
	char   achSignature2[4];          // 전송할 Packet Data 의 유형 구분 필드 

}MacsHeaderPkt;

typedef struct _tagData
{
//	char szPhoneNum[12];
//	int		nLevel;
	int		nScore;
	int		nRank;
}SPlayerData;

typedef struct _CIHaida
{
	AEEApplet	      a;

	int m_nTimerCounter;
	int m_LCDx;
	int m_LCDy;

	uint16 m_nNetSubCnt;
	uint16 m_nSubCnt;
	int		m_nRank;
	SPlayerData	m_sData[10];


	uint16 m_nRankState;
	uint16 m_ui16Updated;
	uint32 m_sRS;
//////////////At Menu
	uint16	m_nMenu;


	int		m_nApproachCnt;
	uint16	m_nIntroCounter;


	uint32	m_nMaxStoryScore;
	uint32	m_nMaxSurvScore;
	uint32	m_nMaxStage;

//////////////At Option
	int	m_nVibState;
	int	m_nSoundState;
	short	m_nOptionState;
	short	m_nPauseState;

//////////////At help
	int	m_nHelpState;
//////////////At Game
	int m_nEndingCount;
	int	m_nSkipCounter;

	int m_nEndingProcess;
	
//	int		m_nEndingCount;
	int m_nRemainBomb;
	uint32 m_nGameCounter;
	short m_nPreCounter;
	uint16 m_nPressedKey;
	short m_nBombCounter;
	short m_nTimeItem;

	short m_nComboImgCounter;//0: do not draw 1 3 <= draw


	uint16 m_uiCancle;
	uint16 m_nProjectState;
	uint16 m_nGameMode;
	int m_nStage;
	uint16 m_nSubState;
	uint16 m_nPrepareIndex;
	short m_nRemainTime;


	int	m_nSuccessPos[4];

	int m_nBlockNum[10];	//SurvivalMode


	int m_nBlock[12][8];
	int m_nBlockQueue[8];
	int m_nPushedBlock;	
	int m_nPlayerPos;
	int	m_nSuccessNum;		//몇개를 맞추면 성공인가.
	int m_nQueueNum;		//몇개의 칸이 비어있는가
	int	m_nGenerationBlock[2];//SurvivalMode;

	int m_nBlockAni;
	int	m_nScore;
	int m_nFeatherBlock;
	int	m_nFeatherNum;
	uint16	m_nMissBlock;
	uint16	m_nComboCounter;
	uint16	m_nSkillPoint;


	
	uint16	m_nBlockClearCount;
	uint16	m_bDrawCombo;	//Combo표시를 해줘야 하는가.
	uint16	m_nEventCounter;
	char	str[30];
	char	str2[30];

	AEEDeviceInfo di;
	ISound*			m_pISound;
	ISoundPlayer*	m_pISoundPlayer;
	IGraphics*		m_pIGraphics;
	IFileMgr*		m_pIFileMgr;
	byte*			m_pSndBuffer;

	
	ISocket *   m_pISock;
	INetMgr *   m_pINet;
	IEB_KTF_Com* m_pIBillCommMgr;
					
	char                     m_Read_Buffer[1024];      //수신 버퍼 
	int                      m_ReadData_Size;           //실제 데이터 사이즈 
	int                      m_Rv_Size;                     //수신된 데이터 사이즈 저장 변수 

	uint16		m_bSuccess;


	IImage*	pBlock;

	NBMImage*	pActor[4];	
	NBMImage*	pBack2[3];
	NBMImage*	pBack[3];
	NBMImage* pBG1;
	NBMImage* pBG2;
	NBMImage* pBG3;
	NBMImage*	pBoom[4];
	NBMImage*	pBulldozer;
	NBMImage*	pClear;
	NBMImage*	pCombo;
	NBMImage*	pCursor;
	NBMImage*	pEnding_bg;
	NBMImage*	pEnemy[2];
	NBMImage*	pFace[7];
	NBMImage*	pFeather;
	NBMImage*	pFeather_Number[10];
	NBMImage*	pGame_name;
	NBMImage*	pGameover;
	NBMImage* pHero[6];
	NBMImage*	pNumber[10];
	NBMImage*	pOption[2];
	NBMImage*	pPaper;
	NBMImage*	pPressOkKey;
	NBMImage*	pS_Hero[4];
	NBMImage*	pS_Title;
	NBMImage*	pSmile_Hero;
	NBMImage*	pStone;
	NBMImage*	pTalk_Menu;
	NBMImage* pTent;
	NBMImage*	pTent2;
	NBMImage*	pTitle;
	NBMImage*	pTotem;		

	NBMImage*	pFeather_Small[2];

	NBMImage*	pMenu[10];			//79+15
	NBMImage*	pCeo;
	NBMImage*	pGammaBack;
	NBMImage*	pWTOTEM;
	NBMImage*	pBottom;
//	NBMImage*	pTempImage[10];	//Do Not Use

}CIHaida;

#define HAIDA_IMAGE_NUM		 92	//79-
/*-------------------------------------------------------------------
Function Prototypes
-------------------------------------------------------------------*/
static boolean Haida_HandleEvent(IApplet * pi, AEEEvent eCode, 
                                      uint16 wParam, uint32 dwParam);

static void Initialize(CIHaida*	pMe);

static void KeyPress(CIHaida* pMe, uint16 wParam , uint32 dwParam);
static void TimerHaida (void *pi);
static void UpdateHaida (CIHaida* pMe);
static void	SRAND(CIHaida* pMe, int s);
static unsigned int	RAND(CIHaida*	pMe);
static void	FillBlack(CIHaida*pMe);
static void	FillWhite(CIHaida*pMe);


static void LoadStage1(CIHaida* pMe);
static void LoadStage2(CIHaida* pMe);
static void LoadStage3(CIHaida* pMe);

static void	LoadHelp(CIHaida*	pMe);
static void LoadRanking(CIHaida* pMe);
static void LoadSelect(CIHaida* pMe);
static void LoadIntro(CIHaida* pMe);
static void LoadOption(CIHaida* pMe);
static void LoadGameImg(CIHaida*	pMe);

static void SetTrans(CIHaida* pMe);
static void FreeAll(CIHaida* pMe);

static void UpdateIntro(CIHaida* pMe);
static void UpdateMain(CIHaida* pMe);
static void UpdateOption(CIHaida* pMe);
static void UpdateHelp(CIHaida* pMe);
static void UpdateGame(CIHaida* pMe);
static void UpdateRanking(CIHaida* pMe);
static void UpdateEnding(CIHaida* pMe);
static void UpdateAsk(CIHaida* pMe);
static void UpdateFee(CIHaida* pMe);
static void UpdateShowRank(CIHaida* pMe);
static void UpdateEmergency(CIHaida* pMe);

static void DrawEmergency(CIHaida* pMe);
static void DrawShowRank(CIHaida* pMe);
static void DrawFee(CIHaida* pMe);
static void DrawAsk(CIHaida* pMe);
static void DrawIntro(CIHaida* pMe);
static void DrawMain(CIHaida* pMe);
static void DrawOption(CIHaida* pMe);
static void DrawHelp(CIHaida* pMe);
static void DrawGame(CIHaida* pMe);
static void DrawRanking(CIHaida* pMe);
static void DrawEnding(CIHaida* pMe);
static void DrawSpeech(CIHaida *pMe, int acter1_x, int acter1_y, int acter1_num, int acter2_x, int acter2_y, int acter2_num, int face_num );
static void DrawPrepare(CIHaida* pMe);
static void DrawPause(CIHaida* pMe);


static void UpdateGameModeStory(CIHaida* pMe);
static void DrawGameModeStory(CIHaida*	pMe);
static void UpdateGameModeSurv(CIHaida* pMe);
static void DrawGameModeSurv(CIHaida*	pMe);

static uint16 ProcessEnviroment(CIHaida* pMe);	//storymode : time check
												//survivalmode	: counter check and check new block

static void ProcessBlockDown(CIHaida*	pMe);	//survival mode
static void ProcessBlock(CIHaida*	pMe, uint16 nType);
static void ProcessPlayer(CIHaida*	pMe);
static uint16 ProcessSort(CIHaida* pMe);
static void ProcessQueue(CIHaida* pMe);

static void SetNextStage(CIHaida*	pMe);
static void SetStage(CIHaida*	pMe, int nStage);
static void SetPreState(CIHaida* pMe, uint16 nEventMaxCnt);



static void	DrawBackground(CIHaida* pMe);
static void	DrawBlock(CIHaida* pMe);
static void	DrawPlayer(CIHaida* pMe);
static void	DrawInterface(CIHaida* pMe);
static void DrawCalculate(CIHaida* pMe);


static void StopSound(CIHaida* pMe);
static void SOUND(CIHaida*	pMe, uint16 ui16Index );
static void VIB(CIHaida*	pMe, uint16 ui16Duration );
static void Text_Out(CIHaida*	pMe, int x, int y);
static void LightText_Out(CIHaida* pMe, int x, int y, RGBVAL rgbText, RGBVAL rgbLight );



static void UpdateAskBefore(CIHaida* pMe);
static void UpdateAskAfter(CIHaida* pMe);
static void DrawAskBefore(CIHaida* pMe);
static void DrawAskAfter(CIHaida* pMe);


static void StartGame(CIHaida* pMe);

//////////////NetWork Functions
//static boolean Haida_OpenNetwork(CIHaida* pMe);
//static boolean Haida_CloseNetwork(CIHaida* pMe);

//static boolean Haida_OpenSocket(CIHaida* pMe);
//static boolean Haida_CloaseSocket(CIHaida* pMe);

//static void Haida_ConnectCB(CIHaida* pMe, int nError);

static void Init_SocketData(CIHaida *pMe);
static void Start_Socket(CIHaida *pMe);
static void Socket_ConnectCB(void *cxt, int err);
static void Send_Data(void *cxt);
static void Read_MacsHeaderPkt(void *cxt);
static void Read_Data(void *cxt);
static void Read_Emergency(void *cxt);
static INAddr xConvertToINAddr(char *psz);
static void Release_SocketData(CIHaida *pMe);
/*===============================================================================
FUNCTION DEFINITIONS
=============================================================================== */

/*===========================================================================

FUNCTION: AEEClsCreateInstance

DESCRIPTION
	This function is invoked while the app is being loaded. All Modules must provide this 
	function. Ensure to retain the same name and parameters for this function.
	In here, the module must verify the ClassID and then invoke the AEEApplet_New() function
	that has been provided in AEEAppGen.c. 

   After invoking AEEApplet_New(), this function can do app specific initialization. In this
   example, a generic structure is provided so that app developers need not change app specific
   initialization section every time except for a call to IDisplay_InitAppData(). 
   This is done as follows: InitAppData() is called to initialize AppletData 
   instance. It is app developers responsibility to fill-in app data initialization 
   code of InitAppData(). App developer is also responsible to release memory 
   allocated for data contained in AppletData -- this can be done in 
   IDisplay_FreeAppData().

PROTOTYPE:
   int AEEClsCreateInstance(AEECLSID ClsId,IShell * pIShell,IModule * po,void ** ppObj)

PARAMETERS:
	clsID: [in]: Specifies the ClassID of the applet which is being loaded

	pIShell: [in]: Contains pointer to the IShell object. 

	pIModule: pin]: Contains pointer to the IModule object to the current module to which
	this app belongs

	ppObj: [out]: On return, *ppObj must point to a valid IApplet structure. Allocation
	of memory for this structure and initializing the base data members is done by AEEApplet_New().

DEPENDENCIES
  none

RETURN VALUE
  AEE_SUCCESS: If the app needs to be loaded and if AEEApplet_New() invocation was
     successful
  EFAILED: If the app does not need to be loaded or if errors occurred in 
     AEEApplet_New(). If this function returns FALSE, the app will not be loaded.

SIDE EFFECTS
  none
===========================================================================*/
int AEEClsCreateInstance(AEECLSID ClsId,IShell * pIShell,IModule * po,void ** ppObj)
{
//	int i,j;
//	uint32 uiHeap;
//	AEEDeviceInfo di;
//	boolean b;
//	IHeap * pIHeap;
//	di.wStructSize = sizeof(AEEDeviceInfo);
//	uiHeap = IHEAP_GetMemStats(&(pMe->a));
//	dwMemInUse = IHEAP_GetMemStats(pIHeap);
	
	CIHaida	*pMe;


   *ppObj = NULL;
		
   if(ClsId == AEECLSID_TAKE_YOUR_HANDS){
      if(AEEApplet_New(sizeof(CIHaida), ClsId, pIShell,po,(IApplet**)ppObj,
         (AEEHANDLER)Haida_HandleEvent,NULL)
         == TRUE)
      {
		 // Add your code here .....

		pMe = (CIHaida*)*ppObj;

         return (AEE_SUCCESS);
      }
   }
	return (EFAILED);
}
static void LoadStage1(CIHaida* pMe)
{
	FreeAll(pMe);
	//Todo
	pMe->pBack2[0] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_BACK2_0);
	pMe->pBack[0] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_BACK_0);
	LoadGameImg(pMe);
	SetTrans(pMe);
}
static void LoadStage2(CIHaida* pMe)
{
	FreeAll(pMe);
	//Todo

	pMe->pBack2[1] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_BACK2_1);
	pMe->pBack[1] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_BACK_1);
	LoadGameImg(pMe);
	SetTrans(pMe);
}
static void LoadStage3(CIHaida* pMe)
{
	FreeAll(pMe);
	//Todo
	pMe->pBack2[2] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_BACK2_2);
	pMe->pBack[2] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_BACK_2);
	LoadGameImg(pMe);
	SetTrans(pMe);
}
static void LoadGameImg(CIHaida*	pMe)
{
	pMe->pBottom = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_BOTTOM);



	pMe->pBlock = ISHELL_LoadResImage(pMe->a.m_pIShell, "haiblock.bar", IMG_BLOCK);
	IIMAGE_SetDrawSize(pMe->pBlock, 12,8);

	pMe->pActor[0] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_ACTER_0);
	pMe->pActor[1] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_ACTER_1);
	pMe->pActor[2] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_ACTER_2);
	pMe->pActor[3] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_ACTER_3);

	pMe->pFace[0] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_FACE_0);
	pMe->pFace[1] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_FACE_1);
	pMe->pFace[2] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_FACE_2);
	pMe->pFace[3] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_FACE_3);
	pMe->pFace[4] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_FACE_4);
	pMe->pFace[5] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_FACE_5);
	pMe->pFace[6] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_FACE_6);

	pMe->pPaper = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_PAPER);
	pMe->pS_Hero[0] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_S_HERO_0);
	pMe->pS_Hero[1] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_S_HERO_1);
	pMe->pS_Hero[2] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_S_HERO_2);
	pMe->pS_Hero[3] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_S_HERO_3);
	pMe->pSmile_Hero = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_SMILE_HERO);

	pMe->pTalk_Menu = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_TALK_MENU);
	pMe->pTotem = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_TOTEM);
	pMe->pBoom[0] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_BOOM_0);
	pMe->pBoom[1] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_BOOM_1);
	pMe->pBoom[2] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_BOOM_2);
	pMe->pBoom[3] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_BOOM_3);

	pMe->pBulldozer = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_BULLDOZER);
	pMe->pBG1 = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_BG1);
	pMe->pBG2 = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_BG2);
	pMe->pBG3 = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_BG3);
	pMe->pFeather = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_FEATHER);


	pMe->pHero[0] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_HERO_0);
	pMe->pHero[1] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_HERO_1);
	pMe->pHero[2] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_HERO_2);
	pMe->pHero[3] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_HERO_3);
	pMe->pHero[4] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_HERO_4);
	pMe->pHero[5] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_HERO_5);

//	pMe->pCursor = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_CURSOR);
	pMe->pEnding_bg = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_ENDING_BG);
	pMe->pEnemy[0] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_ENEMY_0);
	pMe->pEnemy[1] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_ENEMY_1);

	pMe->pCombo = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_COMBO);
	pMe->pStone = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_STONE);



	pMe->pTent = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_TENT);
	pMe->pTent2 = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_TENT2);
/*
	pMe->pNumber[0] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_NUMBER_0);
	pMe->pNumber[1] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_NUMBER_1);
	pMe->pNumber[2] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_NUMBER_2);
	pMe->pNumber[3] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_NUMBER_3);
	pMe->pNumber[4] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_NUMBER_4);
	pMe->pNumber[5] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_NUMBER_5);
	pMe->pNumber[6] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_NUMBER_6);
	pMe->pNumber[7] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_NUMBER_7);
	pMe->pNumber[8] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_NUMBER_8);
	pMe->pNumber[9] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_NUMBER_9);
*/


	pMe->pFeather_Number[0] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_FEATHER_NUMBER_0);
	pMe->pFeather_Number[1] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_FEATHER_NUMBER_1);
	pMe->pFeather_Number[2] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_FEATHER_NUMBER_2);
	pMe->pFeather_Number[3] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_FEATHER_NUMBER_3);
	pMe->pFeather_Number[4] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_FEATHER_NUMBER_4);
	pMe->pFeather_Number[5] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_FEATHER_NUMBER_5);
	pMe->pFeather_Number[6] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_FEATHER_NUMBER_6);
	pMe->pFeather_Number[7] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_FEATHER_NUMBER_7);
	pMe->pFeather_Number[8] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_FEATHER_NUMBER_8);
	pMe->pFeather_Number[9] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_FEATHER_NUMBER_9);

	pMe->pGameover = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_GAMEOVER);


	pMe->pS_Title = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_S_TITLE);

	pMe->pClear = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_CLEAR);

	pMe->pFeather_Small[0] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_SMALL_FEATHER_0);
	pMe->pFeather_Small[1] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_SMALL_FEATHER_1);
	
	pMe->pWTOTEM = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_W_TOTEM);
	//NBMImage*	pWTOTEM;

//pMe->pTitle = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_TITLE);


}
static void	LoadHelp(CIHaida*	pMe)
{
	FreeAll(pMe);
	//Todo

	pMe->pBottom = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_BOTTOM);

	pMe->pBlock = ISHELL_LoadResImage(pMe->a.m_pIShell, "haiblock.bar", IMG_BLOCK);
	IIMAGE_SetDrawSize(pMe->pBlock, 12,8);

	pMe->pBack[0] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_BACK_0);
	pMe->pBack[1] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_BACK_1);
	pMe->pBack[2] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_BACK_2);

	pMe->pBG1 = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_BG1);
	pMe->pBG2 = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_BG2);
	pMe->pBG3 = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_BG3);

	pMe->pEnemy[0] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_ENEMY_0);
	pMe->pEnemy[1] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_ENEMY_1);
	pMe->pTent = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_TENT);
	pMe->pTent2 = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_TENT2);
	pMe->pStone = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_STONE);	
	

	pMe->pHero[0] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_HERO_0);
	pMe->pHero[1] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_HERO_1);
	pMe->pHero[2] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_HERO_2);
	pMe->pHero[3] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_HERO_3);
	pMe->pHero[4] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_HERO_4);
	pMe->pHero[5] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_HERO_5);

	pMe->pGameover = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_GAMEOVER);
	pMe->pFeather_Small[0] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_SMALL_FEATHER_0);
	pMe->pFeather_Small[1] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_SMALL_FEATHER_1);

	SetTrans(pMe);
}
static void LoadRanking(CIHaida* pMe)
{
	FreeAll(pMe);
	//Todo
	pMe->pBottom = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_BOTTOM);

	SetTrans(pMe);
}
static void LoadSelect(CIHaida* pMe)//menu
{
	
	FreeAll(pMe);
	//Todo
	pMe->pBottom = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_BOTTOM);

//	pMe->pPressOkKey = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_PRESSOKKEY);
 	pMe->pS_Title = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_S_TITLE);
//	pMe->pGame_name = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_GAME_NAME);
	pMe->pGameover = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_GAMEOVER);
	pMe->pTitle = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_TITLE);
//*//	
//	pMe->pOption[0] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_OPTION_0);
//	pMe->pOption[1] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_OPTION_1);

	pMe->pCeo = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_CEO);
	pMe->pGammaBack = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_GAMMA_TITLE);

	//Load Menu Data
	pMe->pMenu[0] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_MENU_0);
	pMe->pMenu[1] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_MENU_1);
	pMe->pMenu[2] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_MENU_2);
	pMe->pMenu[3] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_MENU_3);
	pMe->pMenu[4] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_MENU_4);
	pMe->pMenu[5] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_MENU_5);
	pMe->pMenu[6] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_MENU_6);
	pMe->pMenu[7] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_MENU_7);
	pMe->pMenu[8] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_MENU_8);

	pMe->pMenu[9] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_MENU_11);
//	pMe->pMenu[9] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_MENU_9);
//	pMe->pMenu[10] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_MENU_10);
//	pMe->pMenu[11] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_MENU_11);
//	pMe->pMenu[12] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_MENU_12);
//	pMe->pMenu[13] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_MENU_13);
//	pMe->pMenu[14] = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_MENU_14);
//*/
	SetTrans(pMe);
}
/* Do Not Use */
static void LoadIntro(CIHaida* pMe)
{
	FreeAll(pMe);
	//Todo
	pMe->pBottom = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_BOTTOM);
	
	SetTrans(pMe);
}

static void LoadOption(CIHaida* pMe)
{
	FreeAll(pMe);
	//Todo
	pMe->pPaper = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_PAPER);
	pMe->pBottom = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_BOTTOM);
	SetTrans(pMe);
}

static void FreeAll(CIHaida* pMe)
{
	int i;
//*
	if(pMe->pBlock)
	{
		IIMAGE_Release(pMe->pBlock);
		pMe->pBlock = NULL;
	}
	
	for(i = 0; i < HAIDA_IMAGE_NUM; i++)
	{
		if(*(pMe->pActor + i))
		{
			//Function Free
			//NBM_LoadImage(pMe->a.m_pIShell, HAIDA_RES_FILE, IMG_PAPER);
			NBM_Release(*(pMe->pActor + i));
			*(pMe->pActor + i) = NULL;
		}
	}
//*/
}

static void SetTrans(CIHaida* pMe)
{
	int i;
	for(i = 0; i < HAIDA_IMAGE_NUM ; i++)
	{
//		if(*(pMe->pActor + i))
//			IIMAGE_SetParm ( *(pMe->pActor + i),IPARM_ROP,AEE_RO_TRANSPARENT,0);
	}
}


/*===========================================================================

FUNCTION Haida_HandleEvent

DESCRIPTION
	This is the EventHandler for this app. All events to this app are handled in this
	function. All APPs must supply an Event Handler.

PROTOTYPE:
	boolean Haida_HandleEvent(IApplet * pi, AEEEvent eCode, uint16 wParam, uint32 dwParam)

PARAMETERS:
	pi: Pointer to the AEEApplet structure. This structure contains information specific
	to this applet. It was initialized during the AEEClsCreateInstance() function.

	ecode: Specifies the Event sent to this applet

   wParam, dwParam: Event specific data.

DEPENDENCIES
  none

RETURN VALUE
  TRUE: If the app has processed the event
  FALSE: If the app did not process the event

SIDE EFFECTS
  none
===========================================================================*/
#define	AX_DEF_UPDATE_SPD	400
static boolean Haida_HandleEvent(IApplet * pi, AEEEvent eCode, uint16 wParam, uint32 dwParam)
{  
	
	CIHaida *pMe = (CIHaida *)pi;
   switch (eCode) 
	{
   case EVT_BUSY:
	   return (FALSE);
	   break;
      case EVT_APP_START: 

//	 ISHELL_CreateInstance(pMe->a.m_pIShell, AEECLSID_FILEMGR,(void **)&pMe->m_pIFileMgr);
//		  LoadSelect(pMe);
		Initialize(pMe);
		ISHELL_SetTimer(pMe->a.m_pIShell, AX_DEF_UPDATE_SPD, TimerHaida, (void *)pMe);

		IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,MAKE_RGB(0xff,0xff,0xff));
		
		ISHELL_CreateInstance(pMe->a.m_pIShell, AEECLSID_GRAPHICS, (void **)&(pMe->m_pIGraphics));
		pMe->m_nTimerCounter = 0;
		

   		return(TRUE);
      case EVT_APP_STOP:
		  FreeAll(pMe);

		  ISHELL_CancelTimer(pMe->a.m_pIShell, NULL, pMe);


		  if(pMe->m_pIFileMgr)
		  {
			  IFILEMGR_Release(pMe->m_pIFileMgr);
			  pMe->m_pIFileMgr = NULL;
		  }
		  if(pMe->m_pIGraphics)
			  IGRAPHICS_Release(pMe->m_pIGraphics);
		  pMe->m_pIGraphics = NULL;
	
		  StopSound(pMe);
		  if(pMe->m_pISound)
			  ISOUND_Release(pMe->m_pISound);
		  pMe->m_pISound = NULL;
		  if(pMe->m_pISoundPlayer)
			  ISOUNDPLAYER_Release(pMe->m_pISoundPlayer);
		  pMe->m_pISoundPlayer = NULL;
		  

		    // Add your code here .....
		  if(pMe->a.m_pIDisplay)
			  IDISPLAY_Release(pMe->a.m_pIDisplay);
		  pMe->a.m_pIDisplay = NULL;
         return TRUE;
	  case EVT_APP_SUSPEND:
			
		  
		  FreeAll(pMe);
		  Release_SocketData(pMe);
		  ISHELL_CancelTimer(pMe->a.m_pIShell, NULL, pMe);
		  StopSound(pMe);
//		  if(pMe->m_nProjectState == AX_PROJECT_ASKBEFORE || pMe->m_nProjectState == AX_PROJECT_ASKAFTER)
//		  {
//			  pMe->m_nProjectState = AX_PROJECT_INTRO;
//		  }
		if(pMe->m_pISound)
			  ISOUND_Release(pMe->m_pISound);
		  pMe->m_pISound = NULL;

		  if(pMe->m_pISoundPlayer)
			  ISOUNDPLAYER_Release(pMe->m_pISoundPlayer);
		  pMe->m_pISoundPlayer = NULL;

		  return TRUE;
	  case EVT_APP_RESUME:

		pMe->m_uiCancle = 1;
		ISHELL_CancelTimer(pMe->a.m_pIShell, NULL, pMe);
		IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,MAKE_RGB(0xff,0xff,0xff));
		StopSound(pMe);
		  
		  switch(pMe->m_nProjectState)
		  {
			  case	AX_PROJECT_RANKING:
					if(pMe->m_bSuccess == 1)
					{
						FreeAll(pMe);
						pMe->m_bSuccess = 0;
						pMe->m_nProjectState = AX_PROJECT_MAIN;
					}

			  case	AX_PROJECT_INTRO:
			  case	AX_PROJECT_MAIN:
			  
			  case	AX_PROJECT_ASK:
			  case AX_PROJECT_FEE:
			  
				  LoadSelect(pMe);
				break;
			  case	AX_PROJECT_OPTION:
				  LoadOption(pMe);
				  break;
			  case	AX_PROJECT_HELP:
				  LoadHelp(pMe);
				  break;
			  case	AX_PROJECT_STORY:
			  case	AX_PROJECT_ENDING:
				

				if(pMe->m_nStage < EVENT1_LEVEL)
				{
					LoadStage1(pMe);
				}	
				else if(pMe->m_nStage < EVENT2_LEVEL)
				{
					LoadStage2(pMe);
				}
				else
				{
					LoadStage3(pMe);
				}
				break;	
			case	AX_PROJECT_SURVIVAL:
				{
					LoadStage3(pMe);
				}
				  
				  break;

		  case	AX_PROJECT_ASKBEFORE:

				if(pMe->m_nNetSubCnt < 3)
  					pMe->m_nNetSubCnt  = 0;
				pMe->m_nSubCnt = 0;
				LoadSelect(pMe);
				break;

		case AX_PROJECT_SHOWRANK:
				if(pMe->m_nStage < EVENT1_LEVEL)
				{
					LoadStage1(pMe);
				}	
				else if(pMe->m_nStage < EVENT2_LEVEL)
				{
					LoadStage2(pMe);
				}
				else
				{
					LoadStage3(pMe);
				}
			break;
		  case	AX_PROJECT_ASKAFTER:
				if(pMe->m_nNetSubCnt < 3)	
					pMe->m_nNetSubCnt = 0;
				
				pMe->m_nSubCnt = 0;
				if(pMe->m_nStage < EVENT1_LEVEL)
				{
					LoadStage1(pMe);
				}	
				else if(pMe->m_nStage < EVENT2_LEVEL)
				{
					LoadStage2(pMe);
				}
				else
				{
					LoadStage3(pMe);
				}

				break;

		  }
			ISHELL_SetTimer(pMe->a.m_pIShell, AX_DEF_UPDATE_SPD, TimerHaida, (void *)pMe);
		  return TRUE;
		  break;
	  case EVT_KEY_PRESS:
		  KeyPress(pMe, wParam, dwParam);

		  return (TRUE);
		  break;
	  case EVT_KEY:
		  return TRUE;
		  break;
	  case EVT_KEY_RELEASE:
		  return TRUE;
		  break;
	  case EVT_KEY_HELD:
		  return (TRUE);
		  break;
      default:
         break;
   }
   return FALSE;
}




static void TimerHaida (void *pi)
{

	CIHaida *pMe = (CIHaida *)pi;
	
	
	if(pMe->m_ui16Updated == 0)
		return;
	pMe->m_ui16Updated = 0;
	//DisplayOutput ((IApplet *)pMe, -1, "We are in the Timer-callback function...");
	ISHELL_CancelTimer(pMe->a.m_pIShell, NULL, pMe);
	ISHELL_SetTimer(pMe->a.m_pIShell, AX_DEF_UPDATE_SPD, TimerHaida, (void *)pMe);
	UpdateHaida(pMe);
	pMe->m_ui16Updated = 1;

	return;
}

static void KeyPress(CIHaida* pMe, uint16 wParam , uint32 dwParam)
{
	//AVK_CLR, AVK_POUND(우물), AVK_STAR, AVK_SELECT
	pMe->m_nPressedKey = wParam;

}

//extern  int g_sRS;

static void	SRAND(CIHaida* pMe, int s)
{
	pMe->m_sRS = s;
}


static unsigned int		RAND(CIHaida* pMe)
{
	pMe->m_sRS = pMe->m_sRS * 0x343FD + 0x269EC3;
	return (((pMe->m_sRS) >>16)&0x7FFF);
}

/*==============================================================================================================================================================
GAME	ROUTINS STARTS
============================================================================================================================================================== */

static void Initialize(CIHaida* pMe)
{
//	
	int i;
	IFile	*pIFile;


/*
	int j,k;
static int LEVEL[20][12][8] = {

{4,10,4,0,0,0,0,0,4,10,0,0,0,0,0,0,10,2,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{5,6,5,0,0,0,0,0,10,5,10,0,0,0,0,0,6,10,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{1,2,1,0,0,0,0,0,3,1,3,0,0,0,0,0,2,5,2,0,0,0,0,0,4,3,4,0,0,0,0,0,5,4,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{10,10,6,0,0,0,0,0,4,5,10,0,0,0,0,0,5,4,6,0,0,0,0,0,4,5,6,0,0,0,0,0,2,1,3,0,0,0,0,0,3,2,1,0,0,0,0,0,1,3,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{4,1,3,0,0,0,0,0,5,3,2,0,0,0,0,0,5,2,1,0,0,0,0,0,6,6,4,0,0,0,0,0,7,4,6,0,0,0,0,0,7,1,3,0,0,0,0,0,2,5,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{3,2,5,0,0,0,0,0,2,3,4,0,0,0,0,0,1,2,1,0,0,0,0,0,4,1,4,0,0,0,0,0,7,6,7,0,0,0,0,0,8,7,8,0,0,0,0,0,3,5,8,0,0,0,0,0,6,5,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{3,4,3,3,0,0,0,0,10,4,10,4,0,0,0,0,10,8,10,4,0,0,0,0,2,8,3,8,0,0,0,0,2,2,1,8,0,0,0,0,1,1,1,2,0,0,0,0,5,6,5,6,0,0,0,0,6,5,6,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{1,1,3,12,0,0,0,0,10,2,1,10,0,0,0,0,10,3,1,10,0,0,0,0,4,2,4,5,0,0,0,0,2,3,5,12,0,0,0,0,4,2,4,9,0,0,0,0,5,3,5,9,0,0,0,0,12,9,12,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{10,5,5,3,0,0,0,0,5,10,3,7,0,0,0,0,4,3,10,4,0,0,0,0,3,4,4,10,0,0,0,0,7,6,5,9,0,0,0,0,9,7,6,2,0,0,0,0,9,6,7,2,0,0,0,0,9,2,6,2,0,0,0,0,12,12,12,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{3,7,3,4,7,0,0,0,10,12,3,10,6,0,0,0,5,6,5,6,3,0,0,0,4,7,5,9,0,0,0,0,7,9,12,6,0,0,0,0,4,5,10,3,0,0,0,0,9,10,9,7,0,0,0,0,12,4,12,6,0,0,0,0,12,4,9,5,0,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{2,5,1,5,2,0,0,0,5,7,4,7,5,0,0,0,12,7,10,7,12,0,0,0,2,10,4,10,2,0,0,0,1,10,4,10,1,0,0,0,12,1,2,1,12,0,0,0,4,12,4,0,0,0,0,0,7,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{3,9,3,7,9,0,0,0,12,10,7,9,4,0,0,0,4,5,4,10,6,0,0,0,7,4,4,10,10,0,0,0,3,6,6,5,5,0,0,0,12,7,6,5,12,0,0,0,9,6,12,7,5,0,0,0,3,9,12,3,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{5,6,5,5,4,0,0,0,2,5,4,12,5,0,0,0,2,4,10,4,3,0,0,0,2,6,7,6,2,0,0,0,2,9,10,7,9,0,0,0,9,6,9,9,10,0,0,0,3,7,4,10,12,0,0,0,3,10,6,12,0,0,0,0,3,7,12,0,0,0,0,0,3,12,0,0,0,0,0,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{2,11,4,12,4,7,0,0,11,2,11,5,7,5,0,0,7,12,6,7,12,6,0,0,5,7,2,5,2,0,0,0,7,5,6,2,6,0,0,0,5,4,11,6,0,0,0,0,4,12,2,11,0,0,0,0,12,4,6,0,0,0,0,0,4,12,11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{12,2,4,4,11,10,0,0,2,10,7,12,4,10,0,0,2,10,12,7,4,10,0,0,11,2,5,5,2,2,0,0,11,10,11,11,1,0,0,0,11,1,4,4,1,0,0,0,1,7,12,7,5,0,0,0,1,7,7,12,5,0,0,0,12,1,5,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{12,1,10,1,10,11,0,0,1,10,5,8,1,10,0,0,1,4,5,5,4,10,0,0,4,4,11,4,10,12,0,0,8,11,11,4,6,12,0,0,7,7,8,6,6,7,0,0,5,7,8,8,7,7,0,0,5,5,12,6,1,0,0,0,11,12,12,6,6,0,0,0,11,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{12,8,5,8,5,8,12,0,11,5,8,5,8,5,1,0,12,3,12,1,11,3,11,0,1,5,2,12,2,5,7,0,11,8,1,11,1,8,7,0,12,3,2,3,2,3,9,0,11,2,3,2,3,2,9,0,1,12,1,11,9,7,0,0,7,7,7,9,7,0,0,0,9,9,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{6,5,6,12,12,5,5,0,11,6,12,11,11,5,2,0,10,6,11,10,10,2,10,0,8,6,10,8,8,6,0,0,12,7,8,12,12,6,0,0,11,7,12,11,11,7,0,0,8,7,5,8,8,7,0,0,10,2,5,7,7,2,0,0,2,2,10,5,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{8,12,3,3,2,8,2,0,12,3,7,11,3,2,8,0,1,7,11,7,11,1,2,0,5,11,7,11,2,1,7,0,4,12,2,4,5,4,5,0,4,2,4,8,12,4,11,0,3,4,8,12,8,3,0,0,3,1,12,8,12,1,0,0,7,5,1,1,5,0,0,0,11,7,5,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{1,3,7,6,7,8,2,0,3,1,3,7,5,2,5,0,6,3,1,3,2,5,6,0,5,6,3,1,3,6,7,0,6,5,2,4,1,4,5,0,4,2,5,2,4,1,4,0,2,4,7,6,7,4,1,0,8,11,8,7,8,11,11,0,11,8,11,8,11,8,11,0,12,12,12,12,12,12,11,0,12,11,11,11,11,11,11,0,0,0,0,0,0,0,0,0}
,};
/*

static int LEVEL[20][12][8] = {

{4,10,4,0,0,0,0,0,4,10,0,0,0,0,0,0,10,2,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
{4,10,4,0,0,0,0,0,4,10,0,0,0,0,0,0,10,2,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
{4,10,4,0,0,0,0,0,4,10,0,0,0,0,0,0,10,2,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
{4,10,4,0,0,0,0,0,4,10,0,0,0,0,0,0,10,2,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{4,1,3,0,0,0,0,0,5,3,2,0,0,0,0,0,5,2,1,0,0,0,0,0,6,6,4,0,0,0,0,0,7,4,6,0,0,0,0,0,7,1,3,0,0,0,0,0,2,5,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{3,2,5,0,0,0,0,0,2,3,4,0,0,0,0,0,1,2,1,0,0,0,0,0,4,1,4,0,0,0,0,0,7,6,7,0,0,0,0,0,8,7,8,0,0,0,0,0,3,5,8,0,0,0,0,0,6,5,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{3,2,5,0,0,0,0,0,2,3,4,0,0,0,0,0,1,2,1,0,0,0,0,0,4,1,4,0,0,0,0,0,7,6,7,0,0,0,0,0,8,7,8,0,0,0,0,0,3,5,8,0,0,0,0,0,6,5,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{3,2,5,0,0,0,0,0,2,3,4,0,0,0,0,0,1,2,1,0,0,0,0,0,4,1,4,0,0,0,0,0,7,6,7,0,0,0,0,0,8,7,8,0,0,0,0,0,3,5,8,0,0,0,0,0,6,5,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{3,2,5,0,0,0,0,0,2,3,4,0,0,0,0,0,1,2,1,0,0,0,0,0,4,1,4,0,0,0,0,0,7,6,7,0,0,0,0,0,8,7,8,0,0,0,0,0,3,5,8,0,0,0,0,0,6,5,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{3,2,5,0,0,0,0,0,2,3,4,0,0,0,0,0,1,2,1,0,0,0,0,0,4,1,4,0,0,0,0,0,7,6,7,0,0,0,0,0,8,7,8,0,0,0,0,0,3,5,8,0,0,0,0,0,6,5,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{3,2,5,0,0,0,0,0,2,3,4,0,0,0,0,0,1,2,1,0,0,0,0,0,4,1,4,0,0,0,0,0,7,6,7,0,0,0,0,0,8,7,8,0,0,0,0,0,3,5,8,0,0,0,0,0,6,5,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{3,2,5,0,0,0,0,0,2,3,4,0,0,0,0,0,1,2,1,0,0,0,0,0,4,1,4,0,0,0,0,0,7,6,7,0,0,0,0,0,8,7,8,0,0,0,0,0,3,5,8,0,0,0,0,0,6,5,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{3,2,5,0,0,0,0,0,2,3,4,0,0,0,0,0,1,2,1,0,0,0,0,0,4,1,4,0,0,0,0,0,7,6,7,0,0,0,0,0,8,7,8,0,0,0,0,0,3,5,8,0,0,0,0,0,6,5,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{3,2,5,0,0,0,0,0,2,3,4,0,0,0,0,0,1,2,1,0,0,0,0,0,4,1,4,0,0,0,0,0,7,6,7,0,0,0,0,0,8,7,8,0,0,0,0,0,3,5,8,0,0,0,0,0,6,5,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{3,2,5,0,0,0,0,0,2,3,4,0,0,0,0,0,1,2,1,0,0,0,0,0,4,1,4,0,0,0,0,0,7,6,7,0,0,0,0,0,8,7,8,0,0,0,0,0,3,5,8,0,0,0,0,0,6,5,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{3,2,5,0,0,0,0,0,2,3,4,0,0,0,0,0,1,2,1,0,0,0,0,0,4,1,4,0,0,0,0,0,7,6,7,0,0,0,0,0,8,7,8,0,0,0,0,0,3,5,8,0,0,0,0,0,6,5,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{3,2,5,0,0,0,0,0,2,3,4,0,0,0,0,0,1,2,1,0,0,0,0,0,4,1,4,0,0,0,0,0,7,6,7,0,0,0,0,0,8,7,8,0,0,0,0,0,3,5,8,0,0,0,0,0,6,5,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{3,2,5,0,0,0,0,0,2,3,4,0,0,0,0,0,1,2,1,0,0,0,0,0,4,1,4,0,0,0,0,0,7,6,7,0,0,0,0,0,8,7,8,0,0,0,0,0,3,5,8,0,0,0,0,0,6,5,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{3,2,5,0,0,0,0,0,2,3,4,0,0,0,0,0,1,2,1,0,0,0,0,0,4,1,4,0,0,0,0,0,7,6,7,0,0,0,0,0,8,7,8,0,0,0,0,0,3,5,8,0,0,0,0,0,6,5,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,{3,2,5,0,0,0,0,0,2,3,4,0,0,0,0,0,1,2,1,0,0,0,0,0,4,1,4,0,0,0,0,0,7,6,7,0,0,0,0,0,8,7,8,0,0,0,0,0,3,5,8,0,0,0,0,0,6,5,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
,};
*
	ISHELL_CreateInstance(pMe->a.m_pIShell, AEECLSID_FILEMGR,(void **)&pMe->m_pIFileMgr);
	pIFile = IFILEMGR_OpenFile(pMe->m_pIFileMgr, "level.dat", _OFM_CREATE);
	for(i = 0; i < 20; i++)
	{
		for(j = 0; j < 12; j++)
		{
			for(k = 0; k <8; k++)
			{
				IFILE_Write(pIFile, &(LEVEL[i][j][k]), 4);
			}
		}
	}
	
	IFILE_Release(pIFile);
	IFILEMGR_Release(pMe->m_pIFileMgr);
	pMe->m_pIFileMgr = NULL;

//*/


	pMe->m_nRankState = 0;
	pMe->m_nRank = 0;
	pMe->m_nNetSubCnt = 0;
	pMe->m_nSubCnt = 0;
	pMe->m_ui16Updated = 1;
	pMe->m_bSuccess = 0;

	pMe->m_pISock = NULL;
	pMe->m_pINet = NULL;
	pMe->m_pIBillCommMgr = NULL;

	pMe->m_pIFileMgr = NULL;
	pMe->m_pISound = NULL;
	pMe->m_pISoundPlayer = NULL;
	ISHELL_GetDeviceInfo(pMe->a.m_pIShell, &(pMe->di));

	pMe->m_LCDx = MAX((pMe->di.cxScreen -120)/2, 0);
	pMe->m_LCDy = MAX((pMe->di.cyScreen -119)/2, 0);
	pMe->m_LCDy = 0;
	
	pMe->m_pSndBuffer = NULL;
	for(i = 0; i < HAIDA_IMAGE_NUM; i++)
	{
		*(pMe->pActor + i) = NULL;
	}
	
	LoadSelect(pMe);
	Init_SocketData(pMe);
/*
	for(i = 0; i <20; i++)
	{
		for(j = 0; j < 12; j++)
		{
			for(k = 0; k < 8; k++)
			{
				LEVEL[i][j][k]--;
			}
		}
	}
*/
	for(i = 0; i < 8 ; i++)
	{
		pMe->m_nBlockQueue[i] = -1;
	}

	pMe->m_nApproachCnt = 3;
	pMe->m_nHelpState = 0;

	pMe->m_nSkipCounter = 0;
	pMe->m_uiCancle = 0;
	pMe->m_nTimeItem = 0;
	pMe->m_nComboImgCounter = 0;
	pMe->m_nRemainBomb = 0;
	pMe->m_bDrawCombo = 0;
	pMe->m_nBlockAni = 4;
	pMe->m_nBombCounter = -1;
	pMe->m_nScore = 0;
	pMe->m_nFeatherNum = 0;
	pMe->m_nEventCounter = 0;
	pMe->m_nVibState = 1;
	pMe->m_nSoundState = 1;
	pMe->m_nMenu = 0;
	pMe->m_nSkillPoint = 0;
	pMe->m_nPushedBlock = -1;
	pMe->m_nGameMode = AX_GAMEMODE_STORY;
	pMe->m_nStage = 0;
	pMe->m_nSubState = AX_SUBSTATE_PREPARE;
	pMe->m_nPrepareIndex = 0;

	pMe->m_nIntroCounter = 0;



	ISHELL_CreateInstance(pMe->a.m_pIShell, AEECLSID_FILEMGR,(void **)&pMe->m_pIFileMgr);
	if ((pIFile = IFILEMGR_OpenFile(pMe->m_pIFileMgr, "haida.sav", _OFM_READ)) == NULL)
	{
		//there's no file
		pIFile = IFILEMGR_OpenFile(pMe->m_pIFileMgr, "haida.sav", _OFM_CREATE);
		IFILE_Write(pIFile, &(pMe->m_nStage), 4);
		IFILE_Write(pIFile, &(pMe->m_nScore), 4);
		IFILE_Write(pIFile, &(pMe->m_nScore), 4);

	}
	else
	{
		IFILE_Read(pIFile, &(pMe->m_nStage), 4);
		IFILE_Read(pIFile, &(pMe->m_nMaxStoryScore), 4);
		IFILE_Read(pIFile, &(pMe->m_nMaxSurvScore), 4);
	}
	IFILE_Release(pIFile);

	IFILEMGR_Release(pMe->m_pIFileMgr);
	pMe->m_pIFileMgr = NULL;



//	SOUND(pMe, 2);
}

static void UpdateHaida(CIHaida* pMe)
{
	AEERect rect;

	pMe->m_nTimerCounter++;

	switch(pMe->m_nProjectState)
	{
	case AX_PROJECT_INTRO:
		{
			UpdateIntro( pMe);
		}
		break;
	case AX_PROJECT_MAIN:
		{
			UpdateMain( pMe);
		}
		break;
	case AX_PROJECT_OPTION:
		{
			UpdateOption( pMe);
		}
		break;
	case AX_PROJECT_HELP:
		{
			UpdateHelp( pMe);
		}
		break;
	case AX_PROJECT_STORY:
	case AX_PROJECT_SURVIVAL:
		{
			UpdateGame( pMe);
		}
		break;
	case AX_PROJECT_RANKING:
		{
			UpdateRanking( pMe);
		}
		break;
	case AX_PROJECT_ENDING:
		{
			UpdateEnding(pMe);
		}
		break;
	case AX_PROJECT_ASK:
		{
			UpdateAsk(pMe);
		}
		break;
	case AX_PROJECT_ASKBEFORE:
		{
			UpdateAskBefore(pMe);
		}
		break;
	case AX_PROJECT_ASKAFTER:
		{
			UpdateAskAfter(pMe);
		}
		break;
	case AX_PROJECT_FEE:
		{
			UpdateFee(pMe);
		}
		break;
	case AX_PROJECT_SHOWRANK:
		{
			UpdateShowRank(pMe);
		}
		break;
	case AX_PROJECT_EMERGENCY:
		{

			UpdateEmergency(pMe);
		}
		break;
	}

	if(pMe->m_uiCancle == 1)
	{
		pMe->m_uiCancle = 0;
		ISHELL_SetTimer(pMe->a.m_pIShell, AX_DEF_UPDATE_SPD, TimerHaida, (void *)pMe);
	}
	else
	{
//		if(pMe->m_nNetSubCnt == 2)
//			return;
		rect.x = pMe->m_LCDx+ 120;
		rect.y = 0;
		rect.dx = pMe->di.cxScreen - rect.x;
		rect.dy = pMe->di.cyScreen;
		IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, COLOR_INDEX_3, IDF_RECT_FILL);
		//Flip

		if(pMe->m_nProjectState != AX_PROJECT_INTRO)
		{
			NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT, pMe->pBottom, 0 + pMe->m_LCDx, 119 + pMe->m_LCDy);	
		}
		IDISPLAY_Update(pMe->a.m_pIDisplay);

		
	}


	//Initialize Key Data
	pMe->m_nPressedKey = AVK_UNDEFINED;
	
}

/*==============================================================================================================================================================
INTRO
============================================================================================================================================================== */
static void UpdateIntro(CIHaida* pMe)
{
	pMe->m_nIntroCounter++;

	if(pMe->m_nIntroCounter == 10)
		SOUND(pMe, 2);

	if(pMe->m_nPressedKey == AVK_SELECT && pMe->m_nIntroCounter >= 10)
	{
//		pMe->m_nIntroCounter = 20;
		SOUND(pMe, 8);
		pMe->m_nProjectState = AX_PROJECT_MAIN;
	}
	else if(pMe->m_nPressedKey == AVK_CLR)
	{
		//Quit
	}
	if(pMe->m_nProjectState == AX_PROJECT_INTRO)
		DrawIntro(pMe);
}
static void DrawIntro(CIHaida* pMe)
{
//	return;
//		NBMImage *pImage;
	if(pMe->m_nIntroCounter < 10)
	{
		FillWhite(pMe);
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pCeo, 20 + pMe->m_LCDx, 13 + pMe->m_LCDy);

//		pImage = NBM_LoadImage(pMe->a.m_pIShell, HAIDA_TMP_FILE, IMG_CEOO);
//		NBM_Draw(pMe->a.m_pIDisplay, 24 + pMe->m_LCDx, 29 + pMe->m_LCDy, pImage, AEE_RO_TRANSPARENT);
//		NBM_Release(pImage);

		
		
		IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,MAKE_RGB(0x00,0x00,0x00));
//		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)"powered by billcom", -1, 2 + pMe->m_LCDx, 90 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
//		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)"& ", -1, 54 + pMe->m_LCDx, 100 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
//		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)"my Rankingpack", -1, 2 + pMe->m_LCDx, 110 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);

//IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)"hcm@mobileage.co.kr ", -1, 2 + pMe->m_LCDx, 80 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
//IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)"(주)모바일에이지", -1, 2 + pMe->m_LCDx, 60 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);

	}
	else
	{
		FillBlack(pMe);
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pTitle, 0 + pMe->m_LCDx,0 + pMe->m_LCDy);
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT, pMe->pBottom, 0 + pMe->m_LCDx, 119 + pMe->m_LCDy);

//		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pGame_name, 30 + pMe->m_LCDx,3 + pMe->m_LCDy);
//		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)"OK를 눌러주세요 ", -1, 20 + pMe->m_LCDx, 100 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
//		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pPressOkKey,20 + pMe->m_LCDx ,95 + pMe->m_LCDy);
	}


	IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,MAKE_RGB(0xff,0xff,0xff));
}

/*==============================================================================================================================================================
MAIN
============================================================================================================================================================== */
static void UpdateMain(CIHaida* pMe)
{
	switch(pMe->m_nPressedKey)
	{
	case AVK_UP:
		{
			SOUND(pMe,7);
			if(pMe->m_nMenu == 0)
				pMe->m_nMenu = 7;
			else
				pMe->m_nMenu--;
		}
		break;
	case AVK_DOWN:
		{
			SOUND(pMe,7);
			if(pMe->m_nMenu == 7)
				pMe->m_nMenu = 0;
			else
				pMe->m_nMenu++;
		}
		break;
	case AVK_SELECT:
		{
			pMe->m_nPressedKey = AVK_UNDEFINED;
			switch(pMe->m_nMenu)
			{
			case 0:
//				Init_SocketData(pMe);
				pMe->m_nNetSubCnt  = 0;
				pMe->m_nSubCnt = 0;
				pMe->m_nProjectState = AX_PROJECT_ASKBEFORE;
				pMe->m_nGameMode = AX_GAMEMODE_STORY;
				break;
			case 1:
//				Init_SocketData(pMe);
				pMe->m_nNetSubCnt  = 0;
				pMe->m_nSubCnt = 0;
				pMe->m_nProjectState = AX_PROJECT_ASKBEFORE;
				pMe->m_nGameMode = AX_GAMEMODE_SURVIVAL;

				break;
			case 2:
				pMe->m_nOptionState = 0;
				pMe->m_nProjectState = AX_PROJECT_HELP;
				LoadHelp(pMe);
				break;
			case 3:
				pMe->m_nProjectState = AX_PROJECT_OPTION;
				pMe->m_nHelpState = 0;
				LoadOption(pMe);
				break;
			case 4:
				//랭킹 추후 처리
				if ( ISHELL_StartApplet(pMe->a.m_pIShell, 0x01010EB4) == SUCCESS )
				{
				// 성공
					pMe->m_bSuccess = 1;
				}
				else
				{
				// 실패: 여기에서 "마이랭킹팩을 다운받아 설치하세요"라는 등의 문구 출력
					pMe->m_bSuccess = 0;
					pMe->m_nProjectState = AX_PROJECT_RANKING;
				}
				
				
				break;
			case 5:
				//정보이용료
				pMe->m_nProjectState = AX_PROJECT_FEE;
				break;
			case 6:
				//게임문의
				pMe->m_nProjectState = AX_PROJECT_ASK;
				//UpdateAsk(pMe);
				break;
			case 7:
				//나가기
				ISHELL_CloseApplet(pMe->a.m_pIShell, FALSE);
				break;
//				case 
			}
		}
		break;
	case AVK_STAR:
		{
			pMe->m_nPressedKey = AVK_UNDEFINED;
			//StoryMode
			if(pMe->m_nMenu == 0)
			{
				pMe->m_nStage = 0;

				pMe->m_nNetSubCnt  = 0;
				pMe->m_nSubCnt = 0;
//				Init_SocketData(pMe);
				pMe->m_nProjectState = AX_PROJECT_ASKBEFORE;
				pMe->m_nGameMode = AX_GAMEMODE_STORY;

			}
		}
		break;
	case AVK_CLR:
		{
		}
		break;
	}
	if(pMe->m_nProjectState == AX_PROJECT_MAIN)
		DrawMain(pMe);
}
static void DrawMain(CIHaida* pMe)
{
//	int menu1, menu2, menu3, menu4, menu5;
	

	FillBlack(pMe);
	/*
	switch(pMe->m_nMenu)
	{
		case 0 :{ menu1 = MENU_MODE1; menu2 = MENU_MODE2; menu3 = MENU_SETUP; menu4 = MENU_HELP; menu5 = MENU_RANKING;	break;}
		case 1 :{ menu5 = MENU_MODE1; menu1 = MENU_MODE2; menu2 = MENU_SETUP; menu3 = MENU_HELP; menu4 = MENU_RANKING; break;}
		case 2 :{ menu4 = MENU_MODE1; menu5 = MENU_MODE2; menu1 = MENU_SETUP; menu2 = MENU_HELP; menu3 = MENU_RANKING; break;}
		case 3 :{ menu3 = MENU_MODE1; menu4 = MENU_MODE2; menu5 = MENU_SETUP; menu1 = MENU_HELP; menu2 = MENU_RANKING; break;}
		case 4 :{ menu2 = MENU_MODE1; menu3 = MENU_MODE2; menu4 = MENU_SETUP; menu5 = MENU_HELP; menu1 = MENU_RANKING; break;}
	}
*/
	NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pGammaBack, 0 + pMe->m_LCDx,0 + pMe->m_LCDy);
//	NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pGame_name, 30 + pMe->m_LCDx,3 + pMe->m_LCDy);
//	NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pOption[1], 27 + pMe->m_LCDx,48 + pMe->m_LCDy);
//	NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pOption[0], 83 + pMe->m_LCDx,48 + pMe->m_LCDy);
//	NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pMenu[menu1], 37 + pMe->m_LCDx,36 + pMe->m_LCDy);
//	NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pMenu[menu2+1], 4 + pMe->m_LCDx,62 + pMe->m_LCDy);
//	NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pMenu[menu3+2], 30 + pMe->m_LCDx,94 + pMe->m_LCDy);
//	NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pMenu[menu4+2], 71 + pMe->m_LCDx,94 + pMe->m_LCDy);
//	NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pMenu[menu5+1], 91 + pMe->m_LCDx,62 + pMe->m_LCDy);

	NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pMenu[0],2+pMe->m_LCDx, 3 - 1+ (pMe->m_nMenu * 14) +pMe->m_LCDy);
	NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pMenu[pMe->m_nMenu +1 ],8+pMe->m_LCDx, 4+ (pMe->m_nMenu * 14)+pMe->m_LCDy);


	if ( pMe->m_nMenu == 0 )
	{
//		IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,MAKE_RGB(0x00, 0x40,0xC0));
		IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_BACKGROUND,MAKE_RGB(0x00,0x40,0xC0));
		

		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT, pMe->pMenu[9], 11 + pMe->m_LCDx, 18 + pMe->m_LCDy);
//		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD
//			  , (AECHAR*)"이어하기 OK ", -1, 23-8 + pMe->m_LCDx, 18+3 + pMe->m_LCDy, 0, NULL);
//		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD
//			  , (AECHAR*)"새로하기 *", -1, 23-8 + pMe->m_LCDx, 32+3 + pMe->m_LCDy, 0, NULL);
		
//		IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,MAKE_RGB(0xff,0xff,0xff));
	}

}

static void UpdateFee(CIHaida* pMe)
{
	if(pMe->m_nPressedKey == AVK_SELECT)
	{
		SOUND(pMe, 8);
		pMe->m_nProjectState = AX_PROJECT_MAIN;
	}

	DrawFee(pMe);
}


static void DrawFee(CIHaida* pMe)
{
	AEERect rect;

	FillBlack(pMe);

	IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,MAKE_RGB(0xff,0xff,0xff));

	rect.x = 41 + pMe->m_LCDx;
	rect.y = 98 + pMe->m_LCDy;
	rect.dx = 37;
	rect.dy = 15;
	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, COLOR_INDEX_18, IDF_RECT_FILL);


	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL
			  , (AECHAR*)"본 게임은 네트웍", -1, 2 + pMe->m_LCDx, 3 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL
			  , (AECHAR*)"데이타 사용에 따라", -1, 2 + pMe->m_LCDx, 18 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL
			  , (AECHAR*)"기본 통신료의 1패 ", -1, 2 + pMe->m_LCDx, 33 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL
			  , (AECHAR*)"킷(512byte)당 00", -1, 1 + pMe->m_LCDx, 48 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL
			  , (AECHAR*)"원의 추가정보 이", -1, 2 + pMe->m_LCDx, 65 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL
			  , (AECHAR*)"용료가 부과됩니다 ", -1, 1 + pMe->m_LCDx, 80 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);

	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL
			  , (AECHAR*)"OK닫기", -1, 42 + pMe->m_LCDx, 100 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);

}

static void UpdateAsk(CIHaida* pMe)
{
	if(pMe->m_nPressedKey == AVK_SELECT)
	{
		SOUND(pMe, 8);
		pMe->m_nProjectState = AX_PROJECT_MAIN;
	}
	if(pMe->m_nProjectState == AX_PROJECT_ASK)
		DrawAsk(pMe);
}

static void DrawAsk(CIHaida* pMe)
{
	AEERect rect;

	FillBlack(pMe);

	IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,MAKE_RGB(0xff,0xff,0xff));
/*
<정보>			2, 3
(주)모바일에이지		2, 18
헤이다 Ver 1.0		2, 33
www.mobileage.co.kr	1, 48

<문의>			2, 78
hcm@mobileage.co.kr	1, 93
02-569-4187		2, 108

ok닫기 버튼-> 도움말 참고.	33, 132
		박스	32, 131, 78, 142
박스 색깔은rgb 192,255,255
*/	

	rect.x = 41 + pMe->m_LCDx;
	rect.y = 98 + pMe->m_LCDy;
	rect.dx = 37;
	rect.dy = 15;
	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, COLOR_INDEX_18, IDF_RECT_FILL);

	
	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL
			  , (AECHAR*)"<정보>  ", -1, 2 + pMe->m_LCDx, 3 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL
			  , (AECHAR*)"(주)모바일에이지", -1, 2 + pMe->m_LCDx, 18 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL
			  , (AECHAR*)"헤이다 Ver 1.0.3", -1, 2 + pMe->m_LCDx, 33 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL
			  , (AECHAR*)"www.mobileage.co.kr ", -1, 1 + pMe->m_LCDx, 48 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL
			  , (AECHAR*)"<문의>", -1, 2 + pMe->m_LCDx, 65 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL
			  , (AECHAR*)"02-569-4187 ", -1, 1 + pMe->m_LCDx, 80 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);

	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL
			  , (AECHAR*)"OK닫기", -1, 42 + pMe->m_LCDx, 100 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	

}


static void UpdateAskBefore(CIHaida* pMe)
{

	//NetSubCnt 
	//0: default
	//1: Connecting
	//2: Send Succeed
	//3: Fail
	//4: Receive Succeed

	if(pMe->m_nNetSubCnt == 0)
	{
		if(pMe->m_nPressedKey == AVK_STAR)
		{
			pMe->m_nSubCnt = 0;
			pMe->m_nNetSubCnt++;
			Start_Socket(pMe);
		}
		else if(pMe->m_nPressedKey == AVK_POUND)
		{

			StartGame(pMe);
		}
	}
	else if(pMe->m_nNetSubCnt == 1)
	{
		pMe->m_nSubCnt++;
		if(pMe->m_nSubCnt >= 50)
		{
			pMe->m_nNetSubCnt = 3;
			pMe->m_nSubCnt = 0;
		}
	}
	else if(pMe->m_nNetSubCnt == 2)
	{
		
		pMe->m_nSubCnt++;
//		if(pMe->m_nPressedKey == AVK_2)
//		{
//			ISHELL_CloseApplet(pMe->a.m_pIShell, FALSE);
//		}
		if(pMe->m_nSubCnt >= 50)
		{
			pMe->m_nSubCnt = 0;
			pMe->m_nNetSubCnt = 3;
		}
	}
	else if(pMe->m_nNetSubCnt == 3)
	{
		pMe->m_nSubCnt++;
		if(pMe->m_nSubCnt >= 8)
		{
			pMe->m_nNetSubCnt = 0;
			pMe->m_nSubCnt = 0;
			Release_SocketData(pMe);
			StartGame(pMe);
		}
	}
	else if(pMe->m_nNetSubCnt == 4)
	{
		pMe->m_nSubCnt++;
		if(pMe->m_nSubCnt >= 8)
		{
			pMe->m_nNetSubCnt = 0;
			pMe->m_nSubCnt = 0;
			Release_SocketData(pMe);
			StartGame(pMe);
		}
	}
				
	
	if(pMe->m_nProjectState == AX_PROJECT_ASKBEFORE)
		DrawAskBefore(pMe);
}

static void UpdateAskAfter(CIHaida* pMe)
{
	if(pMe->m_nNetSubCnt == 0)
	{
		if(pMe->m_nPressedKey == AVK_STAR)
		{
			pMe->m_nSubCnt = 0;
			pMe->m_nNetSubCnt++;
			Start_Socket(pMe);
		}
		else if(pMe->m_nPressedKey == AVK_POUND)
		{
			pMe->m_nSubCnt = 0;
			pMe->m_nNetSubCnt= 0;

			SOUND(pMe, 2);
			LoadSelect(pMe);
			pMe->m_nNetSubCnt = 0;
			pMe->m_nProjectState = AX_PROJECT_INTRO;

		}
	}
	else if(pMe->m_nNetSubCnt == 1)
	{
		pMe->m_nSubCnt++;
		if(pMe->m_nSubCnt >= 50)
		{
			pMe->m_nNetSubCnt = 3;
			pMe->m_nSubCnt = 0;
		}
	}
	else if(pMe->m_nNetSubCnt == 2)
	{
		pMe->m_nSubCnt++;
		if(pMe->m_nSubCnt >= 50)
		{
			pMe->m_nSubCnt = 0;
			pMe->m_nNetSubCnt = 3;
		}
	}
	else if(pMe->m_nNetSubCnt == 3)
	{
		pMe->m_nSubCnt++;
		if(pMe->m_nSubCnt >= 8)
		{
			pMe->m_nSubCnt = 0;
			pMe->m_nNetSubCnt = 0;
			SOUND(pMe, 2);
			LoadSelect(pMe);
			Release_SocketData(pMe);
			pMe->m_nProjectState = AX_PROJECT_INTRO;
		}
	}
	else if(pMe->m_nNetSubCnt == 4)
	{
		pMe->m_nSubCnt++;
		if(pMe->m_nSubCnt >= 8)
		{
			//CAN't INTO THIS ROUTIN
			pMe->m_nSubCnt = 0;
			pMe->m_nNetSubCnt = 0;
			SOUND(pMe, 2);
			LoadSelect(pMe);
			Release_SocketData(pMe);
			pMe->m_nProjectState = AX_PROJECT_INTRO;
		}
	}

	if(pMe->m_nProjectState == AX_PROJECT_ASKAFTER)
		DrawAskAfter(pMe);
}

static void DrawAskBefore(CIHaida* pMe)
{
	AEERect rect;
	
//		if(pMe->m_nNetSubCnt == 2)
//			return;


	DrawMain(pMe);

	rect.x = pMe->m_LCDx + 16;
	rect.y = pMe->m_LCDy + 36;
	rect.dx = 87;
	rect.dy = 59;
	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, MAKE_RGB(255, 255, 255), NULL, IDF_RECT_FRAME);

	rect.x += 1;
	rect.y += 1;
	rect.dx -= 2;
	rect.dy -= 2;
	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, MAKE_RGB(0, 0, 0), NULL, IDF_RECT_FRAME);

	rect.x += 1;
	rect.y += 1;
	rect.dx -= 2;
	rect.dy -= 2;
	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, MAKE_RGB(192, 192, 192), NULL, IDF_RECT_FRAME);

	rect.x += 1;
	rect.x += 1;
	rect.y += 1;
	rect.dx -= 2;
	rect.dy -= 2;
	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, MAKE_RGB(255,224,255), IDF_RECT_FILL);

	IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,MAKE_RGB(0x00,0x00,0x00));

	if(pMe->m_nNetSubCnt == 0)
	{
		STRCPY(pMe->str, "랭킹을 확인 ");
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 21 + pMe->m_LCDx, 41 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
		STRCPY(pMe->str, "하겠습니까? ");
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 21 + pMe->m_LCDx, 57 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
		STRCPY(pMe->str, "Y(*)/N(#) ");
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 21 + pMe->m_LCDx, 73 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	}
	else if(pMe->m_nNetSubCnt == 1)
	{
		STRCPY(pMe->str, "네트웍에");
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 21 + pMe->m_LCDx, 49 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
		STRCPY(pMe->str, "접속중입니다");
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 21 + pMe->m_LCDx, 65 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	}
	else if(pMe->m_nNetSubCnt == 2)
	{
		STRCPY(pMe->str, "데이터를");
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 21 + pMe->m_LCDx, 49 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
		STRCPY(pMe->str, "받고있습니다");
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 21 + pMe->m_LCDx, 65 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	}
	else if(pMe->m_nNetSubCnt == 3)
	{
		STRCPY(pMe->str, "네트웍에");
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 21 + pMe->m_LCDx, 41 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
		STRCPY(pMe->str, "오류가 발생 ");
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 21 + pMe->m_LCDx, 57 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
		STRCPY(pMe->str, "하였습니다");
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 21 + pMe->m_LCDx, 73 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	}
	else if(pMe->m_nNetSubCnt == 4)
	{
		STRCPY(pMe->str, "당신의 최고점 ");
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 21 + pMe->m_LCDx, 41 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
		if(!pMe->m_nGameMode)
		{
			SPRINTF(pMe->str, "스토리%d등                  ", pMe->m_nRank);
			IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 21 + pMe->m_LCDx, 57 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
			SPRINTF(pMe->str, "점수%d                          ", pMe->m_nMaxStoryScore);
			IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 21 + pMe->m_LCDx, 73 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);

		}
		else
		{ 
			SPRINTF(pMe->str, "서바이벌%d등                ", pMe->m_nRank);
			IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 21 + pMe->m_LCDx, 57 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
			SPRINTF(pMe->str, "점수%d               ", pMe->m_nMaxSurvScore);
			IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 21 + pMe->m_LCDx, 73 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
		}

	}

	if(pMe->m_nNetSubCnt == 1 || pMe->m_nNetSubCnt == 2)
	{
		switch(pMe->m_nSubCnt %4)
		{
		case 3://94 - 25  = 70
			rect.x = pMe->m_LCDx + 25 + 51;
			rect.y = pMe->m_LCDy + 80;
			rect.dx = 94-77;
			rect.dy = 5;
			IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, MAKE_RGB(0,0,255), IDF_RECT_FILL);
		case 2:
			rect.y = pMe->m_LCDy + 80;
			rect.dy = 5;
			rect.x  = 25 + 17 + 17;
			rect.dx = 17;
			IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, MAKE_RGB(0,0,255), IDF_RECT_FILL);
		case 1:
			rect.y = pMe->m_LCDy + 80;
			rect.dy = 5;
			rect.x = 25 + 17;
			rect.dx = 17;
			IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, MAKE_RGB(0,0,255), IDF_RECT_FILL);
		case 0:
			rect.y = pMe->m_LCDy + 80;
			rect.dy = 5;
			rect.x = pMe->m_LCDx + 25;
			rect.dx = 18;
			IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, MAKE_RGB(0,0,255), IDF_RECT_FILL);
			break;
		}
	}
	IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,MAKE_RGB(0xff,0xff,0xff));
}

static void DrawAskAfter(CIHaida* pMe)
{
	AEERect rect;

	FillBlack(pMe);

	if(pMe->m_nNetSubCnt == 0)
	{
		rect.x = pMe->m_LCDx + 16;
		rect.y = pMe->m_LCDy + 20;
		rect.dx = 87 ;
		rect.dy = 59+ 16*2;
	}
	else
	{
		rect.x = pMe->m_LCDx + 16;
		rect.y = pMe->m_LCDy + 36;
		rect.dx = 87;
		rect.dy = 59;
	}

	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, MAKE_RGB(255, 255, 255), NULL, IDF_RECT_FRAME);

	rect.x += 1;
	rect.y += 1;
	rect.dx -= 2;
	rect.dy -= 2;
	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, MAKE_RGB(0, 0, 0), NULL, IDF_RECT_FRAME);

	rect.x += 1;
	rect.y += 1;
	rect.dx -= 2;
	rect.dy -= 2;
	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, MAKE_RGB(192, 192, 192), NULL, IDF_RECT_FRAME);

	rect.x += 1;
	rect.x += 1;
	rect.y += 1;
	rect.dx -= 2;
	rect.dy -= 2;
	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, MAKE_RGB(255,224,255), IDF_RECT_FILL);

	IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,MAKE_RGB(0x00,0x00,0x00));

	if(pMe->m_nNetSubCnt == 0)
	{
		STRCPY(pMe->str, "당신의 점수는");
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 21 + pMe->m_LCDx, 41-16 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
		SPRINTF(pMe->str, "%d점", pMe->m_nScore + pMe->m_nFeatherNum * 20000);
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 21 + pMe->m_LCDx, 41 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);

		STRCPY(pMe->str, "랭킹을 확인 ");
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 21 + pMe->m_LCDx, 57 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
		STRCPY(pMe->str, "하겠습니까? ");
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 21 + pMe->m_LCDx, 73 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
		STRCPY(pMe->str, "Y(*)/N(#) ");
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 21 + pMe->m_LCDx, 73+16 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	}
	else if(pMe->m_nNetSubCnt == 1)
	{
		STRCPY(pMe->str, "네트웍에");
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 21 + pMe->m_LCDx, 49 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
		STRCPY(pMe->str, "접속중입니다");
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 21 + pMe->m_LCDx, 65 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	}
	else if(pMe->m_nNetSubCnt == 2)
	{
		STRCPY(pMe->str, "데이터를");
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 21 + pMe->m_LCDx, 49 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
		STRCPY(pMe->str, "받고있습니다");
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 21 + pMe->m_LCDx, 65 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	}
	else if(pMe->m_nNetSubCnt == 3)
	{
		STRCPY(pMe->str, "네트웍에");
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 21 + pMe->m_LCDx, 41 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
		STRCPY(pMe->str, "오류가 발생 ");
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 21 + pMe->m_LCDx, 57 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
		STRCPY(pMe->str, "하였습니다");
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 21 + pMe->m_LCDx, 73 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	}
	else if(pMe->m_nNetSubCnt == 4)
	{
/*
		STRCPY(pMe->str, "당신의 최고점은 ");
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 18 + pMe->m_LCDx, 26 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
		if(!pMe->m_nGameMode)
		{
			SPRINTF(pMe->str, "스토리%d등      ", pMe->m_nRank);
			IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 18 + pMe->m_LCDx, 42 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
			SPRINTF(pMe->str, "%d    ", pMe->m_nMaxStoryScore);
			IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 18 + pMe->m_LCDx, 53 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
			STRCPY(pMe->str, "점입니다");
			IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 18 + pMe->m_LCDx, 64 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
		}
		else
		{
			SPRINTF(pMe->str, "서바이벌%d등      ", pMe->m_nRank);
			IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 18 + pMe->m_LCDx, 42 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
			SPRINTF(pMe->str, "%d    ", pMe->m_nMaxSurvScore);
			IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 18 + pMe->m_LCDx, 53 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
			STRCPY(pMe->str, "점입니다");
			IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 18 + pMe->m_LCDx, 64 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
		}
*/
	}
	if(pMe->m_nNetSubCnt == 1 || pMe->m_nNetSubCnt == 2)
	{
		switch(pMe->m_nSubCnt %4)
		{
		case 3://94 - 25  = 70
			rect.x = pMe->m_LCDx + 25 + 51;
			rect.y = pMe->m_LCDy + 80;
			rect.dx = 94-77;
			rect.dy = 5;
			IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, MAKE_RGB(0,0,255), IDF_RECT_FILL);
		case 2:
			rect.y = pMe->m_LCDy + 80;
			rect.dy = 5;
			rect.x = 25 + 17 + 17;
			rect.dx = 17;
			IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, MAKE_RGB(0,0,255), IDF_RECT_FILL);
		case 1:
			rect.y = pMe->m_LCDy + 80;
			rect.dy = 5;
			rect.x = 25 + 17;
			rect.dx = 17;
			IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, MAKE_RGB(0,0,255), IDF_RECT_FILL);
		case 0:
			rect.y = pMe->m_LCDy + 80;
			rect.dy = 5;
			rect.x = pMe->m_LCDx + 25;
			rect.dx = 18;
			IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, MAKE_RGB(0,0,255), IDF_RECT_FILL);
			break;
		}
	}

	IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,MAKE_RGB(0xff,0xff,0xff));
}

static void StartGame(CIHaida* pMe)
{
	pMe->m_uiCancle = 1;
	ISHELL_CancelTimer(pMe->a.m_pIShell, NULL, pMe);		

	if( pMe->m_nVibState )
	{
		if(pMe->m_pISound)ISOUND_StopVibrate (pMe->m_pISound);
		pMe->m_pISound = NULL;
	}

	StopSound(pMe);

	FreeAll(pMe);

	SRAND(pMe, pMe->m_nTimerCounter);
	pMe->m_nScore = 0;
	pMe->m_nFeatherNum = 0;
	pMe->m_nSubState = AX_SUBSTATE_PREPARE;

	if(!pMe->m_nGameMode)
	{
		pMe->m_nProjectState = AX_PROJECT_STORY;
		if(pMe->m_nStage < EVENT1_LEVEL)
			LoadStage1(pMe);
		else if(pMe->m_nStage < EVENT2_LEVEL)
			LoadStage2(pMe);
		else
			LoadStage3(pMe);
		
		SetStage(pMe, pMe->m_nStage);
	}
	else
	{
		pMe->m_nApproachCnt = 3;
		
		pMe->m_nProjectState = AX_PROJECT_SURVIVAL;
		
		
		StopSound(pMe);
		LoadStage3(pMe);
		SetStage(pMe, 0);
		SOUND(pMe,5);

	}

}

static void UpdateShowRank(CIHaida* pMe)
{
	if(pMe->m_nPressedKey == AVK_RIGHT)
	{
		if(pMe->m_nRankState)
		{
			pMe->m_nRankState = 0;
		}
		else
		{
			pMe->m_nRankState = 1;
		}
	}
	else if(pMe->m_nPressedKey == AVK_SELECT)
	{
		SOUND(pMe, 2);
		LoadSelect(pMe);
		pMe->m_nProjectState = AX_PROJECT_INTRO;
	}
	if(pMe->m_nProjectState == AX_PROJECT_SHOWRANK)
	{
		DrawShowRank(pMe);
	}
}

static void DrawShowRank(CIHaida* pMe)
{
	int i,k;
	int nTempSize;
	AEERect rect;

	//int i;
//	int divide_feather[3];
//	int	zero_chk_counter;
//	int s_n_x;
//	int nTempFeather;


	FillBlack(pMe);
	//IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, COLOR_INDEX_18, IDF_RECT_FILL);



	rect.x = pMe->m_LCDx;
	rect.y = pMe->m_LCDy;
	rect.dx = 120;
	rect.dy = 119;
	if(pMe->m_nRankState == 0)
	{
		IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, MAKE_RGB(132,254,196), IDF_RECT_FILL);
	}
	else
	{
		IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, MAKE_RGB(196,254,252), IDF_RECT_FILL);
	}
	IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,MAKE_RGB(252,192,4));
	
	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, MAKE_RGB(252,192,4), NULL, IDF_RECT_FRAME);

	rect.x +=1;
	rect.y +=1;
	rect.dx -=2;
	rect.dy -=2;
	IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,MAKE_RGB(196,130,4));
	

	rect.x = pMe->m_LCDx + 2;
	rect.y = pMe->m_LCDy + 83;
	rect.dx = 115;
	rect.dy = 16;

	if(pMe->m_nRankState == 0)
	{
		IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, MAKE_RGB(4,254,4), IDF_RECT_FILL);

		STRCPY(pMe->str, "▶ 스토리  순위 ◀");
		nTempSize = IDISPLAY_MeasureText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)pMe->str);

		LightText_Out(pMe, 59- (nTempSize/2), 6, COLOR_INDEX_129, COLOR_INDEX_3);
	}
	else
	{
		IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, MAKE_RGB(4,242,252), IDF_RECT_FILL);
		STRCPY(pMe->str, "▶ 서바이벌순위 ◀");
		nTempSize = IDISPLAY_MeasureText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)pMe->str);
		LightText_Out(pMe, 59- (nTempSize/2), 6, COLOR_INDEX_129, COLOR_INDEX_3);
	}

	IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_LINE,MAKE_RGB(252,192,4));
	IDISPLAY_DrawHLine(pMe->a.m_pIDisplay, 2 + pMe->m_LCDx, 20+pMe->m_LCDy, 115);
	IDISPLAY_DrawHLine(pMe->a.m_pIDisplay, 2 + pMe->m_LCDx, 100+pMe->m_LCDy, 115);

	IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_LINE,MAKE_RGB(196,130,4));
	IDISPLAY_DrawHLine(pMe->a.m_pIDisplay, 2 + pMe->m_LCDx, 21+pMe->m_LCDy, 115);
	IDISPLAY_DrawHLine(pMe->a.m_pIDisplay, 2 + pMe->m_LCDx, 101+pMe->m_LCDy, 115);


	rect.x = 2 + pMe->m_LCDx;
	rect.y = 82 + pMe->m_LCDy;
	rect.dx = 114;
	rect.dy = 16;
	if(pMe->m_nRankState == 0)
	{
		for(i = 0; i < 4; i++)
		{
			if(pMe->m_sData[i].nRank >= 0)
			{


				MEMSET(pMe->str, NULL, sizeof(pMe->str));
				SPRINTF(pMe->str, " %d점", pMe->m_sData[i].nScore);
				for(k = 0; k < 30; k++)
				{
					if(pMe->str[k] == NULL)
					{
						if(k %2 == 1)
						{
						//	pMe->str[k+1] = NULL;
							pMe->str[k] = pMe->str[0];
							break;
						}
					}
				}
				nTempSize = IDISPLAY_MeasureText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)pMe->str);
				LightText_Out(pMe, 75 - nTempSize, 24 + i * 14, COLOR_INDEX_129, COLOR_INDEX_3);

				MEMSET(pMe->str, NULL, sizeof(pMe->str));
				SPRINTF(pMe->str, " %d위", pMe->m_sData[i].nRank);
				for(k = 0; k < 30; k++)
				{
					if(pMe->str[k] == NULL)
					{
						if(k %2 == 1)
						{
						//	pMe->str[k+1] = NULL;
							pMe->str[k] = pMe->str[0];
							break;
						}
					}
				}

				nTempSize = IDISPLAY_MeasureText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)pMe->str);
				LightText_Out(pMe, 115- nTempSize, 24 + i * 14, COLOR_INDEX_129, COLOR_INDEX_3);
			}
		}
		//83
		//IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, COLOR_INDEX_43, IDF_RECT_FILL);
		IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_125);
		IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_LINE,COLOR_INDEX_125);
		IDISPLAY_DrawHLine(pMe->a.m_pIDisplay, 2 + pMe->m_LCDx, 100+pMe->m_LCDy, 115);



		MEMSET(pMe->str, NULL, sizeof(pMe->str));
		SPRINTF(pMe->str, " %d점", pMe->m_sData[8].nScore);
		for(k = 0; k < 30; k++)
		{
			if(pMe->str[k] == NULL)
			{
				if(k %2 == 1)
				{
					pMe->str[k+1] = NULL;
					pMe->str[k] = pMe->str[0];
					break;
				}
			}
		}

		nTempSize = IDISPLAY_MeasureText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)pMe->str);
		LightText_Out(pMe, 75- nTempSize, 85, COLOR_INDEX_129, COLOR_INDEX_3);

		MEMSET(pMe->str, NULL, sizeof(pMe->str));
		SPRINTF(pMe->str, " %d위", pMe->m_sData[8].nRank);
		for(k = 0; k < 30; k++)
		{
			if(pMe->str[k] == NULL)
			{
				if(k %2 == 1)
				{
					pMe->str[k+1] = NULL;
					pMe->str[k] = pMe->str[0];
					break;
				}
			}
		}
		nTempSize = IDISPLAY_MeasureText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)pMe->str);
		LightText_Out(pMe, 115- nTempSize, 85, COLOR_INDEX_129, COLOR_INDEX_3);

	}
	else
	{
		for(i = 4; i < 8; i++)
		{
			if(pMe->m_sData[i].nRank >= 0)
			{

				MEMSET(pMe->str, NULL, sizeof(pMe->str));

				SPRINTF(pMe->str, " %d점", pMe->m_sData[i].nScore);
				for(k = 0; k < 30; k++)
				{
					if(pMe->str[k] == NULL)
					{
						if(k %2 == 1)
						{
							//pMe->str[k+1] = NULL;
							pMe->str[k] =pMe->str[0];
							break;
						}
					}
				}
				nTempSize = IDISPLAY_MeasureText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)pMe->str);
				LightText_Out(pMe, 75- nTempSize,  24 + (i-4) * 14, COLOR_INDEX_129, COLOR_INDEX_3);

				MEMSET(pMe->str, NULL, sizeof(pMe->str));
				SPRINTF(pMe->str, " %d위", pMe->m_sData[i].nRank);
				for(k = 0; k < 30; k++)
				{
					if(pMe->str[k] == NULL)
					{
						if(k %2 == 1)
						{
							//pMe->str[k+1] = NULL;
							pMe->str[k] = pMe->str[0];
							break;
						}
					}
				}
				nTempSize = IDISPLAY_MeasureText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)pMe->str);
				LightText_Out(pMe, 115- nTempSize,  24 + (i-4) * 14, COLOR_INDEX_129, COLOR_INDEX_3);
			}
		}
		//IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, COLOR_INDEX_43, IDF_RECT_FILL);
		IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_125);
		IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_LINE,COLOR_INDEX_125);
		IDISPLAY_DrawHLine(pMe->a.m_pIDisplay, 2 + pMe->m_LCDx, 100+pMe->m_LCDy, 115);


		MEMSET(pMe->str, NULL, sizeof(pMe->str));

		SPRINTF(pMe->str, " %d점", pMe->m_sData[9].nScore);
		for(k = 0; k < 30; k++)
		{
			if(pMe->str[k] == NULL)
			{
				if(k %2 == 1)
				{
				//pMe->str[k+1] = NULL;
					pMe->str[k] = pMe->str[0];
					break;
				}
			}
		}
		
		nTempSize = IDISPLAY_MeasureText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)pMe->str);
		LightText_Out(pMe, 75- nTempSize, 85, COLOR_INDEX_129, COLOR_INDEX_3);

		MEMSET(pMe->str, NULL, sizeof(pMe->str));
		SPRINTF(pMe->str, " %d위", pMe->m_sData[9].nRank);
		for(k = 0; k < 30; k++)
		{
			if(pMe->str[k] == NULL)
			{
				if(k %2 == 1)
				{
					//pMe->str[k+1] = NULL;
					pMe->str[k] = pMe->str[0];
					break;
				}
			}
		}
		nTempSize = IDISPLAY_MeasureText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)pMe->str);
		LightText_Out(pMe, 115- nTempSize, 85, COLOR_INDEX_129, COLOR_INDEX_3);
	}
	SPRINTF(pMe->str, "나가기-OK  다음-▶");
	nTempSize = IDISPLAY_MeasureText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)pMe->str);
	LightText_Out(pMe, 115- nTempSize, 105, COLOR_INDEX_129, COLOR_INDEX_3);


}

static void UpdateEmergency(CIHaida* pMe)
{
	pMe->m_nSubCnt++;

	if(pMe->m_nSubCnt == 20)
	{
		ISHELL_CloseApplet(pMe->a.m_pIShell, FALSE);
	}

	DrawEmergency(pMe);
}

static void DrawEmergency(CIHaida* pMe)
{
	int i;
	FillBlack(pMe);
	IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,MAKE_RGB(0xff,0xff,0xff));

	for(i = 0; i < 12; i++)
	{
		MEMSET(pMe->str, NULL, sizeof(pMe->str));
		MEMCPY(pMe->str, pMe->m_Read_Buffer + i * 20, 20);
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 2, 2 + i * 11, 0, IDF_TEXT_TRANSPARENT);

	}
}
/*==============================================================================================================================================================
OPTION
============================================================================================================================================================== */
static void UpdateOption(CIHaida* pMe)
{
	IFile	*pIFile;
	//Server Connection 이 빠진 관계로 초기화는 하지 않음.
	if(pMe->m_nPressedKey == AVK_DOWN)
	{
		SOUND(pMe,7);
		pMe->m_nOptionState++;
		if(pMe->m_nOptionState > 2)
			pMe->m_nOptionState = 0;

	}
	else if(pMe->m_nPressedKey == AVK_UP)
	{
		SOUND(pMe,7);
		pMe->m_nOptionState--;
		if(pMe->m_nOptionState < 0)
			pMe->m_nOptionState = 1;
	}
	else if(pMe->m_nPressedKey == AVK_RIGHT || pMe->m_nPressedKey == AVK_LEFT)
	{
		
		if(pMe->m_nOptionState == 0)
		{
			pMe->m_nSoundState += 1;
			pMe->m_nSoundState &= 1;

		}
		else if(pMe->m_nOptionState == 1)
		{
			pMe->m_nVibState += 1;
			pMe->m_nVibState &= 1;
		}
		else if(pMe->m_nOptionState == 2)
		{
			pMe->m_nOptionState = 3;
		}

		SOUND(pMe, 8);

	}
	else if(pMe->m_nPressedKey == AVK_SELECT)
	{
		SOUND(pMe, 8);
		pMe->m_nProjectState = AX_PROJECT_MAIN;
		LoadSelect(pMe);
	}
	if(pMe->m_nOptionState == 3)
	{
		if(pMe->m_nPressedKey == AVK_POUND)
		{
			pMe->m_nOptionState = 2;
		}
		else if(pMe->m_nPressedKey == AVK_STAR)
		{
			pMe->m_nOptionState = 2;
			pMe->m_nStage = 0;

			ISHELL_CreateInstance(pMe->a.m_pIShell, AEECLSID_FILEMGR,(void **)&pMe->m_pIFileMgr);
			if ((pIFile = IFILEMGR_OpenFile(pMe->m_pIFileMgr, "haida.sav", _OFM_READWRITE)) == NULL)
			{
				//there's no file
			}
			else
			{
				IFILE_Write(pIFile, &(pMe->m_nStage), 4);
			}
			IFILE_Release(pIFile);
			IFILEMGR_Release(pMe->m_pIFileMgr);
			pMe->m_pIFileMgr = NULL;

		}
	}


	if(pMe->m_nProjectState == AX_PROJECT_OPTION)
		DrawOption(pMe);
}
static void DrawOption(CIHaida* pMe)
{
	FillBlack(pMe); // 수정된 사항
	NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pPaper, 3 + pMe->m_LCDx, 2 + pMe->m_LCDy);
	
	switch( pMe->m_nOptionState )
	{
		case 0: 
			IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_39);
			STRCPY( pMe->str, "소리" );	Text_Out( pMe, 13, 10);	
			IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_19);
			STRCPY( pMe->str, "진동" );	Text_Out( pMe, 13, 30 );	
			STRCPY( pMe->str, "게임저장 초기화 " );	Text_Out( pMe, 13, 50 );	
			break;
		case 1: 
			IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_19);
			STRCPY( pMe->str, "소리" );	Text_Out( pMe, 13, 10 );
			IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_39);
			STRCPY( pMe->str, "진동" );	Text_Out( pMe, 13, 30 );
			IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_19);
			STRCPY( pMe->str, "게임저장 초기화 " );	Text_Out( pMe, 13, 50 );
			break;
		case 2: 
			IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_19);
			STRCPY( pMe->str, "소리" );	Text_Out( pMe, 13, 10 );
			STRCPY( pMe->str, "진동" );	Text_Out( pMe, 13, 30 );
			IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_39);
			STRCPY( pMe->str, "게임저장 초기화 " );	Text_Out( pMe, 13, 50);
			break;
		case 3: 
			
			IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_18);
			STRCPY( pMe->str, "초기화 할까요?" );	Text_Out( pMe, 18, 30 );
			
			IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_39);
			STRCPY( pMe->str, "Y(*)/N(#) " );	Text_Out( pMe, 32, 59);
			break;

	}
	if(pMe->m_nOptionState != 3)
	{
		IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_129);
		STRCPY( pMe->str, "설 정 - ◀ ▶ " );	Text_Out( pMe, 13, 75 );
		STRCPY( pMe->str, "나가기 - 확인 " );	Text_Out( pMe, 13, 95 );


		if ( pMe->m_nSoundState == TRUE )
		{		
			IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_3);
			STRCPY( pMe->str, "ON" );	Text_Out( pMe, 40, 10 );	
		}
		else
		{		
			IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_1);
			STRCPY( pMe->str, "OFF " );	Text_Out( pMe, 40, 10 );	
		}

		if ( pMe->m_nVibState == TRUE )
		{		
			IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_3);
			STRCPY( pMe->str, "ON" );	Text_Out( pMe, 40, 30 );	
		}
		else
		{		
			IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_1);
			STRCPY( pMe->str, "OFF " );	Text_Out( pMe, 40, 30);	
		}	
	}

	IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_0);
}

/*==============================================================================================================================================================
HELP
============================================================================================================================================================== */
static void UpdateHelp(CIHaida* pMe)
{
	if(pMe->m_nPressedKey == AVK_RIGHT)
	{
		SOUND(pMe,7);
		pMe->m_nHelpState++;
		if(pMe->m_nHelpState > 19)
			pMe->m_nHelpState = 0;

	}
	else if(pMe->m_nPressedKey == AVK_LEFT)
	{
		SOUND(pMe,7);
		pMe->m_nHelpState--;
		if(pMe->m_nHelpState < 0)
			pMe->m_nHelpState = 19;
	}
	else if(pMe->m_nPressedKey == AVK_SELECT)
	{

		SOUND(pMe, 8);
		pMe->m_nProjectState = AX_PROJECT_MAIN;
		LoadSelect(pMe);
	}

	if(pMe->m_nProjectState == AX_PROJECT_HELP)
		DrawHelp(pMe);
}
static void DrawHelp(CIHaida* pMe)
{
	AEERect rect;
	AEEEllipse ellipse;

	FillBlack(pMe);



	
	rect.x=2+ pMe->m_LCDx;
	rect.y=2+ pMe->m_LCDy;
	rect.dx=115;
	rect.dy=114;
	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, COLOR_INDEX_16, IDF_RECT_FILL);

	if ( pMe->m_nHelpState >3 && pMe->m_nHelpState < 13 && pMe->m_nHelpState != 10)
	{

		
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBack[0], 20+pMe->m_LCDx, -8 + pMe->m_LCDy);
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBG2, 4 +pMe->m_LCDx, -8 + pMe->m_LCDy);
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBG3, 4 +pMe->m_LCDx, + 80 + pMe->m_LCDy);
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pStone, 56+pMe->m_LCDx, 85 + pMe->m_LCDy);
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pStone, 68+pMe->m_LCDx, 85 + pMe->m_LCDy);
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pStone, 80+pMe->m_LCDx, 85 + pMe->m_LCDy);
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pStone, 92+pMe->m_LCDx, 85 + pMe->m_LCDy);
//		SetClip( 5 + size_x, 22 + size_y, 114 + size_x, 96 + size_y );
//		CopyImage( 20 + size_x,-8 + size_y, back[0]);
//		CopyImage( 4 + size_x, -8 + size_y, bg2 );
//		CopyImage( 4 + size_x,  80 + size_y, bg3 );
//		CopyImage( 56 + size_x, 85 + size_y, stone );
//		CopyImage( 68 + size_x, 85 + size_y, stone );
//		CopyImage( 80 + size_x, 85 + size_y, stone );
//		CopyImage( 92 + size_x, 85 + size_y, stone );
		
	}
		

	switch(pMe->m_nHelpState)
	{
		case 0:{
					IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_46);
					STRCPY( pMe->str, "1. 사용키 " );			Text_Out( pMe, 10, 23);

					IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_0);
					STRCPY( pMe->str, "[ ▲ ▼ ] 이 동 " );		Text_Out( pMe, 10, 38);
					STRCPY( pMe->str, "[ ◀ ] 블럭밀기 " );		Text_Out( pMe, 10, 53);
					STRCPY( pMe->str, "[ ▶ ] 기술사용 " );		Text_Out( pMe, 10, 68);
					STRCPY( pMe->str, "[ 취소 ] 일시정지 " );		Text_Out( pMe, 10, 83);
					break;
				}
		case 1:{
					IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_46);
					STRCPY( pMe->str, "2. 스토리 모드" );			Text_Out( pMe, 10, 23);

					IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_0);
					STRCPY( pMe->str, "가장 강력한 토템의" );		Text_Out( pMe, 7, 38);
					STRCPY( pMe->str, "힘을내기 위해서는 " );		Text_Out( pMe, 7, 53);
					STRCPY( pMe->str, "특별한 배열이 필요" );		Text_Out( pMe, 7, 68);
					STRCPY( pMe->str, "하단다. " );				Text_Out( pMe, 7, 83);
					break;
				}
		case 2:{
					IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_0);
					STRCPY( pMe->str, "이는 어려운 일이니" );		Text_Out( pMe, 7, 23);
					STRCPY( pMe->str, "헤이다.. 너는 같은" );		Text_Out( pMe, 7, 38);
					STRCPY( pMe->str, "모양, 같은색깔의  " );		Text_Out( pMe, 7, 53);
					STRCPY( pMe->str, "토템끼리만 분류   " );			Text_Out( pMe, 7, 68);
					STRCPY( pMe->str, "해주면 된단다.    " );			Text_Out( pMe, 7, 83);
					break;
				}

		case 3:{
					IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_0);
					STRCPY( pMe->str, "토템을 밀면 가장" );	Text_Out( pMe, 7, 23);
					STRCPY( pMe->str, "왼쪽 토템이 밀려" );	Text_Out( pMe, 7, 38);
					STRCPY( pMe->str, "떨어지고 위의   " );		Text_Out( pMe, 7, 53);
					STRCPY( pMe->str, "토템은 아래로   " );		Text_Out( pMe, 7, 68);
					STRCPY( pMe->str, "떨어진단다.     " );			Text_Out( pMe, 7, 83);
					break;
				}
		case 4:{
					IIMAGE_SetOffset(pMe->pBlock, 48, 72 );
					IIMAGE_Draw(pMe->pBlock, 20+pMe->m_LCDx, 57+pMe->m_LCDy);
					IIMAGE_Draw(pMe->pBlock, 20+pMe->m_LCDx, 65+pMe->m_LCDy);
					IIMAGE_Draw(pMe->pBlock, 20+pMe->m_LCDx, 73+pMe->m_LCDy);
					IIMAGE_SetOffset(pMe->pBlock, 48, 16 );
					IIMAGE_Draw(pMe->pBlock, 31+pMe->m_LCDx, 57+pMe->m_LCDy);
					IIMAGE_Draw(pMe->pBlock, 31+pMe->m_LCDx, 65+pMe->m_LCDy);
					IIMAGE_Draw(pMe->pBlock, 31+pMe->m_LCDx, 73+pMe->m_LCDy);
					
					NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pHero[0], 44+pMe->m_LCDx, 64+pMe->m_LCDy);

					break;
				}
		case 5:{
					IIMAGE_SetOffset(pMe->pBlock, 48, 72 );
					IIMAGE_Draw(pMe->pBlock, 20+pMe->m_LCDx, 57+pMe->m_LCDy);
					IIMAGE_Draw(pMe->pBlock, 20+pMe->m_LCDx, 65+pMe->m_LCDy);
					IIMAGE_Draw(pMe->pBlock, 4+pMe->m_LCDx, 77+pMe->m_LCDy);
					IIMAGE_SetOffset(pMe->pBlock, 48, 16 );
					IIMAGE_Draw(pMe->pBlock, 31+pMe->m_LCDx, 57+pMe->m_LCDy);
					IIMAGE_Draw(pMe->pBlock, 31+pMe->m_LCDx, 65+pMe->m_LCDy);
					IIMAGE_Draw(pMe->pBlock, 20+pMe->m_LCDx, 73+pMe->m_LCDy);

					NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pHero[1], 42+pMe->m_LCDx, 65+pMe->m_LCDy);

					break;
				}
		case 6:{
					IIMAGE_SetOffset(pMe->pBlock, 48, 72 );
					IIMAGE_Draw(pMe->pBlock, 20+pMe->m_LCDx, 57+pMe->m_LCDy);
					IIMAGE_Draw(pMe->pBlock, 20+pMe->m_LCDx, 65+pMe->m_LCDy);
					IIMAGE_Draw(pMe->pBlock, 43+pMe->m_LCDx, 85+pMe->m_LCDy);
					IIMAGE_SetOffset(pMe->pBlock, 48, 16 );
					IIMAGE_Draw(pMe->pBlock, 20+pMe->m_LCDx, 73+pMe->m_LCDy);
					IIMAGE_Draw(pMe->pBlock, 31+pMe->m_LCDx, 65+pMe->m_LCDy);
					IIMAGE_Draw(pMe->pBlock, 31+pMe->m_LCDx, 73+pMe->m_LCDy);

					NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pHero[0], 44+pMe->m_LCDx, 64+pMe->m_LCDy);
					break;
				}
		case 7:{
					IIMAGE_SetOffset(pMe->pBlock, 48, 72 );
					IIMAGE_Draw(pMe->pBlock, 20+pMe->m_LCDx, 65+pMe->m_LCDy);
					IIMAGE_Draw(pMe->pBlock, 31+pMe->m_LCDx, 85+pMe->m_LCDy);
					IIMAGE_Draw(pMe->pBlock, 43+pMe->m_LCDx, 85+pMe->m_LCDy);
					IIMAGE_SetOffset(pMe->pBlock, 48, 16 );
					IIMAGE_Draw(pMe->pBlock, 31+pMe->m_LCDx, 65+pMe->m_LCDy);
					IIMAGE_Draw(pMe->pBlock, 20+pMe->m_LCDx, 73+pMe->m_LCDy);
					IIMAGE_Draw(pMe->pBlock, 31+pMe->m_LCDx, 73+pMe->m_LCDy);

					NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pHero[1], 25+pMe->m_LCDx, 49+pMe->m_LCDy);
					break;
				}
		case 8:{
					IIMAGE_SetOffset(pMe->pBlock, 48, 72 );
					IIMAGE_Draw(pMe->pBlock, 19+pMe->m_LCDx, 85+pMe->m_LCDy);
					IIMAGE_Draw(pMe->pBlock, 31+pMe->m_LCDx, 85+pMe->m_LCDy);
					IIMAGE_Draw(pMe->pBlock, 43+pMe->m_LCDx, 85+pMe->m_LCDy);
					IIMAGE_SetOffset(pMe->pBlock, 48, 16 );
					IIMAGE_Draw(pMe->pBlock, 20+pMe->m_LCDx, 65+pMe->m_LCDy);
					IIMAGE_Draw(pMe->pBlock, 20+pMe->m_LCDx, 73+pMe->m_LCDy);
					IIMAGE_Draw(pMe->pBlock, 31+pMe->m_LCDx, 73+pMe->m_LCDy);

					NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pHero[1], 40+pMe->m_LCDx, 57+pMe->m_LCDy);
					break;
				}
		case 9:{
		
					IIMAGE_SetOffset(pMe->pBlock, 48, 16 );
					IIMAGE_Draw(pMe->pBlock, 20+pMe->m_LCDx, 65+pMe->m_LCDy);
					IIMAGE_Draw(pMe->pBlock, 20+pMe->m_LCDx, 73+pMe->m_LCDy);
					IIMAGE_Draw(pMe->pBlock, 31+pMe->m_LCDx, 73+pMe->m_LCDy);
					NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pHero[0], 32+pMe->m_LCDx, 57+pMe->m_LCDy);

					break;
				}
		case 10:{

					IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_0);
					STRCPY( pMe->str, "같지 않은 토템은" );	Text_Out( pMe, 7, 23);
					STRCPY( pMe->str, "밑으로 쌓이게   " );		Text_Out( pMe, 7, 38);
					STRCPY( pMe->str, "되어 위로       " );			Text_Out( pMe, 7, 53);
					STRCPY( pMe->str, "올라오지만 그만큼 " );	Text_Out( pMe, 7, 68);
					STRCPY( pMe->str, "시간을 소비하지.  " );		Text_Out( pMe, 7, 83);
					break;
				}
		case 11:{
					IIMAGE_SetOffset(pMe->pBlock, 48, 72 );
					IIMAGE_Draw(pMe->pBlock, 20+pMe->m_LCDx, 85+pMe->m_LCDy);
					IIMAGE_Draw(pMe->pBlock, 31+pMe->m_LCDx, 85+pMe->m_LCDy);
					IIMAGE_Draw(pMe->pBlock, 20+pMe->m_LCDx, 73+pMe->m_LCDy);
					IIMAGE_SetOffset(pMe->pBlock, 48, 16 );
					IIMAGE_Draw(pMe->pBlock, 43+pMe->m_LCDx, 85+pMe->m_LCDy);
					IIMAGE_Draw(pMe->pBlock, 20+pMe->m_LCDx, 65+pMe->m_LCDy);
					IIMAGE_Draw(pMe->pBlock, 31+pMe->m_LCDx, 73+pMe->m_LCDy);

					NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pHero[0], 44+pMe->m_LCDx, 64+pMe->m_LCDy);

					break;
				}
		case 12:{
					IIMAGE_SetOffset(pMe->pBlock, 48, 72 );
					IIMAGE_Draw(pMe->pBlock, 20+pMe->m_LCDx, 73+pMe->m_LCDy);
					IIMAGE_Draw(pMe->pBlock, 31+pMe->m_LCDx, 73+pMe->m_LCDy);
					IIMAGE_Draw(pMe->pBlock, 20+pMe->m_LCDx, 65+pMe->m_LCDy);
					IIMAGE_SetOffset(pMe->pBlock, 48, 16 );
					IIMAGE_Draw(pMe->pBlock, 43+pMe->m_LCDx, 73+pMe->m_LCDy);
					IIMAGE_Draw(pMe->pBlock, 20+pMe->m_LCDx, 57+pMe->m_LCDy);
					IIMAGE_Draw(pMe->pBlock, 31+pMe->m_LCDx, 65+pMe->m_LCDy);
	
					NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pHero[0], 56+pMe->m_LCDx, 64+pMe->m_LCDy);

					break;
				}
		case 13:{
					IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_0);
					STRCPY( pMe->str, "토템이나 불도저가 " );	Text_Out( pMe, 7, 23);
					STRCPY( pMe->str, "마을을 덮치면 손쓸" );	Text_Out( pMe, 7, 38);
					STRCPY( pMe->str, "방법이 없으니     " );		Text_Out( pMe, 7, 53);
					STRCPY( pMe->str, "조심하렴....      " );		Text_Out( pMe, 7, 68);
					STRCPY( pMe->str, "  " );	Text_Out( pMe, 7, 83);
					break;
				}
		case 14:{
			/*Drawbacksize : 72-35 = 37*/
//					SetClip( 5 + size_x, 22 + size_y, 113 + size_x, 96 + size_y );
					NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBG1, 5 + pMe->m_LCDx, 22+pMe->m_LCDy);
//					IIMAGE_SetDrawSize(pMe->pBG2, 16,37);
					NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBG2, 5 + pMe->m_LCDx, 35+pMe->m_LCDy);
//					IIMAGE_SetDrawSize(pMe->pBG2, 16,89);

					NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pTent2, 21 + pMe->m_LCDx, 25+pMe->m_LCDy);
//					IIMAGE_SetDrawSize(pMe->pBack[1], 104,37);
					NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBack[1], 21 + pMe->m_LCDx, 35+pMe->m_LCDy);
//					IIMAGE_SetDrawSize(pMe->pBack[1], 104,89);
					NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pEnemy[1], 33 + pMe->m_LCDx, 26+pMe->m_LCDy);


					NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBG1, 5 + pMe->m_LCDx, 59+pMe->m_LCDy);
//					IIMAGE_SetDrawSize(pMe->pBG2, 16,37);
					NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBG2, 5 + pMe->m_LCDx, 72+pMe->m_LCDy);
//					IIMAGE_SetDrawSize(pMe->pBG2, 16,89);

//					IIMAGE_SetDrawSize(pMe->pBack[2], 104,37);
					NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBack[2], 21 + pMe->m_LCDx, 72+pMe->m_LCDy);
//					IIMAGE_SetDrawSize(pMe->pBack[2], 104,89);

					IIMAGE_SetOffset(pMe->pBlock, 48, 64 );
					IIMAGE_Draw(pMe->pBlock, 22 + pMe->m_LCDx , 65+ pMe->m_LCDy);
					IIMAGE_SetOffset(pMe->pBlock, 48, 8 );
					IIMAGE_Draw(pMe->pBlock, 22 + pMe->m_LCDx , 73+ pMe->m_LCDy);
					IIMAGE_SetOffset(pMe->pBlock, 48, 64 );
					IIMAGE_Draw(pMe->pBlock, 22 + pMe->m_LCDx , 81+ pMe->m_LCDy);
					IIMAGE_SetOffset(pMe->pBlock, 48, 32 );
					IIMAGE_Draw(pMe->pBlock, 22 + pMe->m_LCDx , 89+ pMe->m_LCDy);

					NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pTent2, 21 + pMe->m_LCDx, 62+pMe->m_LCDy);
					
					NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pGameover, 40 + pMe->m_LCDx, 40+pMe->m_LCDy);
					NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pGameover, 40 + pMe->m_LCDx, 80+pMe->m_LCDy);


					//IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_109);
					IGRAPHICS_SetColor(pMe->m_pIGraphics, 0xff,0,0,0);
					ellipse.cx = 24;
					ellipse.cy = 30;
					ellipse.wx = 7;
					ellipse.wy = 7;
					IGRAPHICS_DrawEllipse(pMe->m_pIGraphics, &ellipse);
					ellipse.wx = 8;
					ellipse.wy = 8;
					IGRAPHICS_DrawEllipse(pMe->m_pIGraphics, &ellipse);

					ellipse.cx = 24;
					ellipse.cy = 67;
					IGRAPHICS_DrawEllipse(pMe->m_pIGraphics, &ellipse);
					ellipse.wx = 7;
					ellipse.wy = 7;

					IGRAPHICS_DrawEllipse(pMe->m_pIGraphics, &ellipse);
//					ResetClip();
					break;
				}
		case 15:{
					IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_46);
					STRCPY( pMe->str, "3. 서바이벌 모드" );		Text_Out( pMe, 10, 23);

					IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_0);
					STRCPY( pMe->str, "7 개의 칸안에   " );			Text_Out( pMe, 7, 38);
					STRCPY( pMe->str, "4 개의 토템이   " );			Text_Out( pMe, 7, 53);
					STRCPY( pMe->str, "같으면 사라집니다." );			Text_Out( pMe, 7, 68);
					STRCPY( pMe->str, "콤보면 점수더블!! " );		Text_Out( pMe, 7, 83);
					break;
				}
		case 16:{
					IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_46);
					STRCPY( pMe->str, "4. 기 술" );			Text_Out( pMe, 10, 23);

					IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_0);
					STRCPY( pMe->str, "콤보시 SP가 차며" );		Text_Out( pMe, 7, 38);
					STRCPY( pMe->str, "기술 사용시 선택된" );			Text_Out( pMe, 7, 53);
					STRCPY( pMe->str, "토템이 없어집니다 " );		Text_Out( pMe, 7, 68);

					NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBG3, 7 + pMe->m_LCDx, 82+ pMe->m_LCDy);
					IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_3);
					IDISPLAY_DrawHLine(pMe->a.m_pIDisplay, 42 + pMe->m_LCDx, 83+pMe->m_LCDy, 119-42);
					IDISPLAY_DrawHLine(pMe->a.m_pIDisplay, 42 + pMe->m_LCDx, 84+pMe->m_LCDy, 119-42);

					//IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_74);
					rect.x = 17+ pMe->m_LCDx;
					rect.y = 81+ pMe->m_LCDy;
					rect.dx = 28;
					rect.dy = 5;
					IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, COLOR_INDEX_74, NULL, IDF_RECT_FRAME);

/*					SetClip( 5 + size_x, 22 + size_y, 114 + size_x, 96 + size_y );
					CopyImage( 7 + size_x, 82 + size_y, bg3 );
					SetColor( 3 );
					DrawHLine( 42 + size_x , 119 + size_x, 83 + size_y );
					DrawHLine( 42 + size_x , 119 + size_x, 84 + size_y );
					SetColor( 74 );
					DrawRect( 17 + size_x, 81 + size_y, 45 + size_x, 86 + size_y );
					ResetClip();
*/					break;
				}
		case 17:{
					IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_46);
					STRCPY( pMe->str, "5. 아이템 " );				Text_Out( pMe, 10, 23);

					IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_0);
					STRCPY( pMe->str, "   깃털이  붙은 " );		Text_Out( pMe, 7, 38);
					STRCPY( pMe->str, "토템을 없애면   " );			Text_Out( pMe, 7, 53);
					STRCPY( pMe->str, "깃털 1개 SP한칸을 " );		Text_Out( pMe, 7, 68);
					STRCPY( pMe->str, "획득 합니다." );			Text_Out( pMe, 7, 83);

					IIMAGE_SetOffset(pMe->pBlock, 48, 48 );
					IIMAGE_Draw(pMe->pBlock, 6+pMe->m_LCDx, 40+pMe->m_LCDy);
					NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pFeather_Small[0], 6+pMe->m_LCDx, 40+pMe->m_LCDy);
					break;
				}
		case 18:{
					IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_0);
					STRCPY( pMe->str, "   폭탄:토템이타서" );		Text_Out( pMe, 7, 23);
					STRCPY( pMe->str, "보기 힘들어 집니다" );		Text_Out( pMe, 7, 38);
					STRCPY( pMe->str, "   T:인디언들의 " );			Text_Out( pMe, 7, 53);
					STRCPY( pMe->str, "도움으로 불도저가 " );		Text_Out( pMe, 7, 68);
					STRCPY( pMe->str, "뒤로 갑니다." );			Text_Out( pMe, 7, 83);

					IIMAGE_SetOffset(pMe->pBlock, 48, 88 );
					IIMAGE_Draw(pMe->pBlock, 6+pMe->m_LCDx, 25+pMe->m_LCDy);
					IIMAGE_SetOffset(pMe->pBlock, 48, 80 );
					IIMAGE_Draw(pMe->pBlock, 6+pMe->m_LCDx, 55+pMe->m_LCDy);
					break;
				}
		case 19:{
					IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_46);
					STRCPY( pMe->str, "6. 점수계산 " );				Text_Out( pMe, 10, 23);

					IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_0);
					STRCPY( pMe->str, "점수 20000점이면" );		Text_Out( pMe, 7, 38);
					STRCPY( pMe->str, "깃털 1개 획득!" );			Text_Out( pMe, 7, 53);
					STRCPY( pMe->str, "깃털을 많이 얻어야" );		Text_Out( pMe, 7, 68);
					STRCPY( pMe->str, "승리 해요.. ^^" );			Text_Out( pMe, 7, 83);
					break;
				}
	}

	rect.x=2+pMe->m_LCDx;
	rect.y=109+ pMe->m_LCDy;
	rect.dx=115;
	rect.dy=9;
	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, COLOR_INDEX_16, IDF_RECT_FILL);


	rect.x = pMe->m_LCDx;
	rect.y = pMe->m_LCDy;
	rect.dx = 119;
	rect.dy = 118;
	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, COLOR_INDEX_16, NULL, IDF_RECT_FRAME);
	
	rect.x +=2;rect.y+=2;rect.dx -=4;rect.dy-=4;
	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, COLOR_INDEX_16, NULL, IDF_RECT_FRAME);

	rect.x +=1;rect.y+=1;rect.dx -=2;rect.dy-=2;
	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, COLOR_INDEX_26, NULL, IDF_RECT_FRAME);

	
	rect.x = 4 + pMe->m_LCDx;
	rect.y = 4 + pMe->m_LCDy;
	rect.dx = 111;
	rect.dy = 14;
	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, COLOR_INDEX_18, IDF_RECT_FILL);
	

	IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_18);
	IDISPLAY_DrawHLine(pMe->a.m_pIDisplay, 4 + pMe->m_LCDx, 20+pMe->m_LCDy, 111);
	rect.x = 5 + pMe->m_LCDx;
	rect.y = 98 + pMe->m_LCDy;
	rect.dx = 30;
	rect.dy = 15;
	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, COLOR_INDEX_18, IDF_RECT_FILL);
	
	rect.x = 41 + pMe->m_LCDx;
	rect.y = 98 + pMe->m_LCDy;
	rect.dx = 37;
	rect.dy = 15;
	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, COLOR_INDEX_18, IDF_RECT_FILL);
	
	rect.x = 84 + pMe->m_LCDx;
	rect.y = 98 + pMe->m_LCDy;
	rect.dx = 30;
	rect.dy = 15;
	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, COLOR_INDEX_18, IDF_RECT_FILL);
	
	


	IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_128);
	STRCPY( pMe->str, "▷도움말◁" );								Text_Out(pMe, 8, 5);
	IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_124);
	if(pMe->m_nHelpState  > 8)
	{
		SPRINTF( pMe->str, "[%d%d/20]   ", (pMe->m_nHelpState+1)/10, (pMe->m_nHelpState+1)%10 );
	}
	else
	{
		SPRINTF( pMe->str, "[%d/20]   ", pMe->m_nHelpState+1 );
	}
			Text_Out(pMe, 70, 5 );	//수정된 부분
	IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_128);
	STRCPY( pMe->str, "◀전  OK닫기  후▶" );							Text_Out(pMe, 7, 100);
	IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_0);
	
	rect.x = pMe->m_LCDx;
	rect.y = pMe->m_LCDy;
	rect.dx = 119;
	rect.dy = 118;
	
	rect.x = 0;
	rect.y = 0;
	rect.dx = pMe->di.cxScreen;
	rect.dy = pMe->m_LCDy +2;
	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, 0, IDF_RECT_FILL);
	rect.x = 119 + pMe->m_LCDx -2;
	rect.dx = pMe->di.cxScreen - (119 + pMe->m_LCDx)+4;
	rect.dy = pMe->di.cyScreen;
	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, 0, IDF_RECT_FILL);
	
	rect.x = 0;
	rect.y = 118 +pMe->m_LCDy -2;
	rect.dx = pMe->di.cxScreen;
	rect.dy = pMe->di.cyScreen -100;
	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, 0, IDF_RECT_FILL);

}

/*==============================================================================================================================================================
GAME _ COMMON
============================================================================================================================================================== */
static void UpdateGame(CIHaida* pMe)
{
	
	int i,j;
	uint32 nTempScore;
//	int nTempClear;
	//Todo: CommonJob

	if(pMe->m_nSubState != AX_SUBSTATE_PAUSE)
	{
		if(pMe->m_nComboImgCounter > 0)
			pMe->m_nComboImgCounter--;

		if((pMe->m_nGameCounter % 50 == 25) && (pMe->m_nBombCounter == -1) && (pMe->m_nBlockAni == 4) && (pMe->m_nRemainBomb <= 0))
		{
			pMe->m_nBlockAni++;
		}
			
		if(pMe->m_nBlockAni < 4)
			pMe->m_nBlockAni++;
		if(pMe->m_nBlockAni > 4 && pMe->m_nBlockAni < 8)
			pMe->m_nBlockAni++;
		if(pMe->m_nBlockAni == 8 && pMe->m_nBombCounter < 0  && (pMe->m_nRemainBomb <= 0))
			pMe->m_nBlockAni = 0;

		if(pMe->m_nRemainBomb > 0)
		{
			//pMe->m_nRemainBomb--;
		}


		if(pMe->m_nBlockClearCount > 0)
		{
			pMe->m_nBlockClearCount++;
			if(pMe->m_nBlockClearCount == 2)
			{
				pMe->m_nBlockClearCount = 0;
				if(pMe->m_nGameMode)		//At Survival, QueueSetting;
				{
					for(i = 0; i < pMe->m_nQueueNum-1 ; i++)
					{
						for(j = i; j < pMe->m_nQueueNum ; j++)
						{
							if(pMe->m_nBlockQueue[i] != -1 && pMe->m_nBlockQueue[j] == -1)
							{
								pMe->m_nBlockQueue[j] = pMe->m_nBlockQueue[i];
								pMe->m_nBlockQueue[i] = -1;

							}
						}
					}


				}
			}
		}
	}

	switch(pMe->m_nSubState)
	{
	case AX_SUBSTATE_PREPARE:
		{
			if(!pMe->m_nGameMode)
			{
				if(pMe->m_nStage == OPENING_LEVEL)
				{
					//5
					SetPreState(pMe, 5);
				}
				else if(pMe->m_nStage == EVENT1_LEVEL)
				{
					//3
					SetPreState(pMe, 3);
				}
				else if(pMe->m_nStage == EVENT2_LEVEL)
				{
					//4
					SetPreState(pMe, 4);
				}
				else
				{
					
					pMe->m_nPreCounter--;
					if(pMe->m_nPreCounter <= 0)
					{
						pMe->m_nSubState = AX_SUBSTATE_PLAYING;
						if( pMe->m_nSoundState )
						{		
					//		if(pMe->m_pISoundPlayer)ISOUNDPLAYER_Stop(pMe->m_pISoundPlayer);
					//		pMe->m_pISoundPlayer = NULL;

							StopSound(pMe);
						}
					}
				}
			}
			else
			{
				if(pMe->m_nPressedKey == AVK_SELECT)
				{
					
					pMe->m_nPreCounter--;
				}
				if(pMe->m_nPreCounter < 10)
					pMe->m_nPreCounter--;
				if(pMe->m_nPreCounter <= 0)
				{
					
					pMe->m_nSubState = AX_SUBSTATE_PLAYING;
					if( pMe->m_nSoundState )
					{		
				//		if(pMe->m_pISoundPlayer)ISOUNDPLAYER_Stop(pMe->m_pISoundPlayer);
				//		pMe->m_pISoundPlayer = NULL;


						StopSound(pMe);
					}
				}
			}
		}
		break;
	case AX_SUBSTATE_PLAYING:
		{
//			if(pMe->m_nPressedKey == AVK_5)
//			{
//				SetNextStage(pMe);
//				return;
//			}
//			if(pMe->m_nPressedKey == AVK_6)
//			{
//				pMe->m_nScore += 10000;
//			}
//			if(pMe->m_nPressedKey == AVK_4)
//			{
//				pMe->m_nFeatherNum += 110;
//			}
			ProcessEnviroment(pMe);
			if(pMe->m_nBlock[0][0] >= 0)
				ProcessPlayer(pMe);
//			ProcessBlock(pMe);
			if(!pMe->m_nGameMode)		//pMe->m_nGameMode == 0 : GAME_STORY
			{

				if(pMe->m_nRemainTime<= 0 )
				{
					//lose
					VIB(pMe,100);
					pMe->m_nSubState = AX_SUBSTATE_GAMEOVER;
					SOUND(pMe, 0);
				}
			}

		}
		break;
	case AX_SUBSTATE_GAMECLEAR:
		{
			pMe->m_nSkipCounter++;
			pMe->m_nGameCounter++;
			if(pMe->m_nPressedKey == AVK_SELECT || pMe->m_nSkipCounter >= 7)
			{
				pMe->m_nSkipCounter = 0;
				pMe->m_nSubState = AX_SUBSTATE_CALCULATE;
			}
		}
		break;
	case AX_SUBSTATE_CALCULATE:
		{

			pMe->m_nSkipCounter++;
			if(pMe->m_nPressedKey == AVK_SELECT || pMe->m_nSkipCounter >= 7)
			{
				pMe->m_nSkipCounter= 0;
				pMe->m_nScore += pMe->m_nRemainTime*5;
				pMe->m_nScore -= pMe->m_nMissBlock*5;
				if(pMe->m_nScore <= 0)
					pMe->m_nScore = 0;
				SetNextStage(pMe);
				return;
			}
		}
		break;
	case AX_SUBSTATE_GAMEOVER:
		{
			
			pMe->m_nGameCounter++;
			if(pMe->m_nPressedKey == AVK_SELECT)
			{
				
				//Add
				nTempScore = pMe->m_nFeatherNum * 20000 + pMe->m_nScore;
				if(!pMe->m_nGameMode)
				{
					if(pMe->m_nMaxStoryScore < nTempScore)
					{
					}
				}
				else
				{
					if(pMe->m_nMaxSurvScore < nTempScore)
					{
					}
				}
				//SOUND(pMe, 2);
//				Init_SocketData(pMe);
				pMe->m_nNetSubCnt = 0;
				pMe->m_nSubCnt = 0;
				pMe->m_nProjectState = AX_PROJECT_ASKAFTER;
				//LoadSelect(pMe);
			}
		}
		break;
	case AX_SUBSTATE_PAUSE:
		{
			switch(pMe->m_nPressedKey)
			{
			case AVK_SELECT:
				break;
			case AVK_POUND:
				SOUND(pMe, 8);
				pMe->m_nSubState = AX_SUBSTATE_PLAYING;
				break;
			case AVK_STAR:
				SOUND(pMe, 2);
				LoadSelect(pMe);
				pMe->m_nProjectState = AX_PROJECT_INTRO;
				break;
			case AVK_1:
				pMe->m_nSoundState += 1;
				pMe->m_nSoundState &= 1;
				SOUND(pMe, 8);
				break;
			case AVK_2:
				pMe->m_nVibState += 1;
				pMe->m_nVibState &= 1;
				SOUND(pMe, 8);
				break;
			}
		}
		break;
	}


	if(!pMe->m_nGameMode)		//pMe->m_nGameMode == 0 : GAME_STORY
	{
		UpdateGameModeStory(pMe);

	}
	else
	{
		UpdateGameModeSurv(pMe);
		//BlockOverflow

	}


	if ( pMe->m_nScore >= 20000 )
	{
		SOUND(pMe, 14);
		if ( pMe->m_nFeatherNum >= 999 )
		{
			pMe->m_nScore = 19999;
		}
		else
		{
			pMe->m_nScore -= 20000;
			pMe->m_nFeatherNum++;
		}
		
	}

	if ( pMe->m_nFeatherNum > 999 )	//폐인들을 위한 배려....
	{
		pMe->m_nFeatherNum = 999;
	}

	
	if(pMe->m_nProjectState == AX_PROJECT_STORY)
	{
		if(pMe->m_nSubState == AX_SUBSTATE_PREPARE)
		{
			DrawPrepare(pMe);

			if(pMe->m_nStage == OPENING_LEVEL)
			{
				if(pMe->m_nEventCounter < 5)
					return;
			}
			else if(pMe->m_nStage == EVENT1_LEVEL)
			{
				if(pMe->m_nEventCounter < 3)
					return;
			}
			else if(pMe->m_nStage == EVENT2_LEVEL)
			{
				if(pMe->m_nEventCounter < 4)
					return;
			}
			DrawGame(pMe);
			//DrawStage	

			IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,MAKE_RGB(0x00,0x00,0x00));
			if( pMe->m_nPreCounter > 5 )
			{
				SPRINTF(pMe->str, "STAGE %d%d  ", (pMe->m_nStage +1)/10, (pMe->m_nStage+1)%10);
				IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)(pMe->str), -1, 39 + pMe->m_LCDx, 35 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
			}
			else
			{
				IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)"START!", -1, 45 + pMe->m_LCDx, 35 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
			}
			IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,MAKE_RGB(0xff,0xff,0xff));
		}
		else
		{
			DrawGame(pMe);
		}
		
		
	}
	else if(	pMe->m_nProjectState == AX_PROJECT_SURVIVAL)
	{
		if(pMe->m_nPreCounter == 10)
		{
			DrawGameModeSurv(pMe);
		}
		else
		{
			DrawGame(pMe);
		}
		
	}
}

static void SetPreState(CIHaida* pMe, uint16 nEventMaxCnt)
{
	if(pMe->m_nPressedKey == AVK_RIGHT)
	{
		pMe->m_nEventCounter++;
		if(pMe->m_nEventCounter == nEventMaxCnt && pMe->m_nBlockAni != 5)
		{
			pMe->m_nPreCounter = 10;
			pMe->m_nBlockAni = 5;
		}
			
	}
	else if(pMe->m_nPressedKey == AVK_SELECT && pMe->m_nBlockAni != 5)
	{
		StopSound(pMe);
		pMe->m_nEventCounter = nEventMaxCnt;
		pMe->m_nPreCounter = 10;
		pMe->m_nBlockAni = 5;
	}
	if(pMe->m_nEventCounter >= nEventMaxCnt)
	{
		if(pMe->m_nPreCounter--)
		{
		}
		else
		{
			pMe->m_nSubState = AX_SUBSTATE_PLAYING;
			if( pMe->m_nSoundState )
			{		
		//		if(pMe->m_pISoundPlayer)ISOUNDPLAYER_Stop(pMe->m_pISoundPlayer);
		//		pMe->m_pISoundPlayer = NULL;


				StopSound(pMe);
			}
		}
	}

}
static uint16 ProcessEnviroment(CIHaida* pMe)
{
	if(!pMe->m_nGameMode)
	{
		pMe->m_nGameCounter++;	//AnimateCheck
		if(pMe->m_nTimeItem > 0)
		{
			pMe->m_nRemainTime += 2;
			if(pMe->m_nRemainTime > 998)
				pMe->m_nRemainTime = 998;
			pMe->m_nTimeItem -= 2;
		}
		else
		{
			pMe->m_nRemainTime -= 2;
		}
			
	}
	else
	{
		pMe->m_nGameCounter++;	//AnimateCheck

		
		pMe->m_nRemainTime -= pMe->m_nApproachCnt;

		
		if(pMe->m_nRemainTime <= 0)
		{
			pMe->m_nApproachCnt++;
			if(pMe->m_nApproachCnt == 7)
			{
				pMe->m_nApproachCnt = 3;
			}
			ProcessBlockDown(pMe);
			pMe->m_nRemainTime = AX_DEF_NEWBLOCK_TIME;
			pMe->m_nGenerationBlock[0] = RAND(pMe)%10;
			pMe->m_nGenerationBlock[1] = RAND(pMe)%10;
		}
		
	}

	if(pMe->m_nBombCounter >= 0)
	{
		pMe->m_nBombCounter++;
		if(pMe->m_nBombCounter >= 4)
			pMe->m_nBombCounter = -1;
	}
	ProcessQueue(pMe);
	if(!pMe->m_nGameMode || (pMe->m_nGameMode && pMe->m_nBlockClearCount != 1))
		ProcessSort(pMe);


	return 1;
}

static void ProcessBlockDown(CIHaida*	pMe)
{
	int i;

	if(pMe->m_nBlock[10][0] >= 0)
	{
		//GameOver
		pMe->m_nSubState = AX_SUBSTATE_GAMEOVER;
		VIB(pMe, 100);
		SOUND(pMe, 0);
	}
	else
	{
		for(i = 0;i < 12; i++)
		{
			if(pMe->m_nBlock[i][0] < 0)
			{
				pMe->m_nBlock[i][0] = pMe->m_nGenerationBlock[0];
				break;
			}
		}
		for(i = 0;i < 12; i++)
		{
			if(pMe->m_nBlock[i][1] < 0)
			{
				pMe->m_nBlock[i][1] = pMe->m_nGenerationBlock[1];
				break;
			}
		}
	}

}

static void ProcessQueue(CIHaida* pMe)
{
	int i,j;
	int nTempClear;
	int nTempCounter;//Survival <= 몇개 같은지 체크
	//int nTempNumber;//Survival <= 어떤번호가 같은지 체크
	//int nTempCheck;//Survival <= 붙어있는곳인가 떨어져있는곳인가 체크.. AAABA <= AAA만 사라짐
	uint16 uiClear = 0;
	int nTmpCnt = 0;//WHAT?
	int nTempScore;



	nTempCounter = 1;
//	if(pMe->m_nPushedBlock == -1)
//		return;

	pMe->m_bDrawCombo = 0;

	if(!pMe->m_nGameMode)
	{
		if(pMe->m_nBlockQueue[0] >= 0)
		{
			for(i = 0 ; i < pMe->m_nQueueNum - 1; i++)
			{
				if(pMe->m_nBlockQueue[i] != pMe->m_nBlockQueue[i+1])
				{
					uiClear = 1;
					break;
				}
			}

			if(uiClear == 1 && pMe->m_nBlock[10][0] >= 0)
			{
				//GameLose
				uiClear = 2;
			}

			if(uiClear == 1)
			{
				//fill up
				for(j = 0; j < pMe->m_nQueueNum; j++)
				{
					for(i = 11; i >= 1; i--)
					{
						pMe->m_nBlock[i][j] = pMe->m_nBlock[i-1][j];
					}
					pMe->m_nBlock[0][j] = pMe->m_nBlockQueue[j];
					pMe->m_nBlockQueue[j] = -1;
				}
				pMe->m_nMissBlock++;
				pMe->m_nComboCounter = 0;

				pMe->m_nFeatherBlock = RAND(pMe)%10;
		

			}
			else if(uiClear == 0)
			{
				if(pMe->m_nBlockQueue[0] == pMe->m_nFeatherBlock)
				{
					pMe->m_nFeatherNum += 1;
					pMe->m_nSkillPoint += 5;
					SOUND(pMe, 14);
				}
				if(pMe->m_nBlockQueue[0] == 11)
				{
					//bomb
					SOUND(pMe,12);
					pMe->m_nBlockAni = 8;
					pMe->m_nBombCounter = 0;
					pMe->m_nRemainBomb = 100;
				}
				else if(pMe->m_nBlockQueue[0] == 10)
				{
					pMe->m_nTimeItem = 200;
//					pMe->m_nGameCounter += 200;
//					pMe->m_nGameCounter = MIN(pMe->m_nGameCounter, 800);
				}
				//clear

				for(i = 0; i < pMe->m_nQueueNum; i++)
				{
					pMe->m_nBlockQueue[i] = -1;
				}
				//combo counter ++;

				pMe->m_nBlockClearCount = 1;

				pMe->m_nComboCounter++;
				pMe->m_nScore += (pMe->m_nComboCounter * 10 * pMe->m_nQueueNum);

				
				if(pMe->m_nComboCounter > 1)
				{
					pMe->m_nComboImgCounter = 3;
					pMe->m_bDrawCombo = 1;
					pMe->m_nSkillPoint++;
					if(pMe->m_nSkillPoint > 20)
					{
						pMe->m_nSkillPoint = 20;
//						pMe->m_nSkillPoint = 0;
//						pMe->m_nSkill++;
					}
				}
//				pMe->m_nFeatherBlock = RAND(pMe)%10;

				nTempClear = 1;
				for(i = 0; i < 12; i++)
				{
					for(j = 0; j < 8; j++)
					{
						if(pMe->m_nBlock[i][j] >= 0)
						{
							nTempClear = 0;
							break;
						}
					}
				}

				if(nTempClear)
				{
					//GameClear
					pMe->m_nSkipCounter= 0;
					pMe->m_nSubState = AX_SUBSTATE_GAMECLEAR;
					SOUND(pMe, 1);
				}
				else
				{
					if(pMe->m_nBlockQueue[0] == pMe->m_nFeatherBlock)
					{
//						SOUND(pMe, 14);
					}
					else
					{
//						SOUND(pMe, 10);
					}

				}

			}
			else
			{
				//GameLose;;;
				pMe->m_nSubState = AX_SUBSTATE_GAMEOVER;
				VIB(pMe, 100);
				SOUND(pMe, 0);
			}
		}
	}
	else
	{
		//Check
		for(i = 0; i < 10; i ++)
		{
			pMe->m_nBlockNum[i] = 0;
		}
		//Check
		for(i = 0 ; i < pMe->m_nQueueNum; i++)
		{
			
			if(pMe->m_nBlockQueue[i] >= 0)
			{
				pMe->m_nBlockNum[pMe->m_nBlockQueue[i]]++;
			}
		}
		for(i = 0; i <10; i++)
		{
			if(pMe->m_nBlockNum[i] == 4)
			{
				for(j = 0; j < pMe->m_nQueueNum;j++)
				{
					if(pMe->m_nBlockQueue[j] == i)
					{
						pMe->m_nSuccessPos[nTmpCnt++] = j;
					}
				}
				uiClear = 0;
				break;
			}
			else
			{
				uiClear = 4;
			}
		}

		if(pMe->m_nBlockQueue[0] >= 0 && uiClear != 0)
		{
			uiClear = 1;
/*		
			if(pMe->m_nBlockQueue[0] == pMe->m_nBlockQueue[1]
				&& pMe->m_nBlockQueue[1] == pMe->m_nBlockQueue[2])
			{
				uiClear = 0;
			}
			else
				uiClear = 1;
*/
		}
		else
		{
			if(uiClear != 0)
				uiClear = 4;
		}

		//3개가 같은 블럭.
		//uiClear = 1;
		if(uiClear == 1 && pMe->m_nBlock[10][0] >= 0)
		{
			//GameLose
			uiClear = 2;
		}

		if(uiClear == 1)
		{
			//fill up
			for(j = 0; j < pMe->m_nQueueNum; j++)
			{
				
				for(i = 11; i >= 1; i--)
				{
					pMe->m_nBlock[i][j] = pMe->m_nBlock[i-1][j];
				}
				pMe->m_nBlock[0][j] = pMe->m_nBlockQueue[j];
				pMe->m_nBlockQueue[j] = -1;
			}
			pMe->m_nMissBlock++;
			pMe->m_nComboCounter = 0;
			//pMe->m_nBlockClearCount = 1;

			//pMe->m_nFeatherBlock = RAND(pMe)%10;
	

		}
		else if(uiClear == 0)
		{
			//nTempCheck = 0; 
			//clear
			for(i = 0; i < pMe->m_nQueueNum; i++)
			{
				if(i == pMe->m_nSuccessPos[0]
					|| i == pMe->m_nSuccessPos[1]
					|| i == pMe->m_nSuccessPos[2]
					|| i == pMe->m_nSuccessPos[3])
				{
					pMe->m_nBlockQueue[i] = -1;
					//nTempCheck = 1;
//					if(i < 6 && pMe->m_nBlockQueue[i+1] != nTempNumber)
//						break;
				}
					
			}
			//combo counter ++;
	//		SOUND(pMe, 10);
			pMe->m_nBlockClearCount = 1;
			pMe->m_nComboCounter++;
			
			nTempScore = 2;
			for(i = pMe->m_nComboCounter -1 ; i > 0; i--)
			{
				nTempScore *=2 ;
			}
			if(nTempScore > 10000)
				nTempScore = 10000;

			pMe->m_nScore += nTempScore;

			if(pMe->m_nComboCounter > 1)
			{
				pMe->m_nComboImgCounter = 3;
				pMe->m_bDrawCombo = 1;
				pMe->m_nSkillPoint++;
				if(pMe->m_nSkillPoint > 20)
				{
					pMe->m_nSkillPoint = 20;
//						pMe->m_nSkillPoint = 0;
//						pMe->m_nSkill++;
				}
			}
/*
			nTempClear = 1;
			for(i = 0; i < 12; i++)
			{
				for(j = 0; j < 8; j++)
				{
					if(pMe->m_nBlock[i][j] >= 0)
					{
						nTempClear = 0;
						break;
					}
				}
			}
*/
		}
		else if(uiClear == 2)
		{
			//GameLose;;;
			pMe->m_nSubState = AX_SUBSTATE_GAMEOVER;
			VIB(pMe, 100);
			SOUND(pMe, 0);
		}
		else
		{
		}
	}


	for(i = 0; i < 12; i++)
	{
		for(j = 0; j < 8; j++)
		{
			if(pMe->m_nBlock[i][j] >= 0)
				return;
		}
	}
//	for(i = 0; i
	for(i = 0; i < pMe->m_nQueueNum; i++)
	{
		if(pMe->m_nBlockQueue[i] >= 0)
			return;
	}


	//Queue가 비고, 데이터 없을경우.
	pMe->m_nSkipCounter= 0;
	pMe->m_nSubState = AX_SUBSTATE_GAMECLEAR;
	SOUND(pMe, 1);




}

static uint16 ProcessSort(CIHaida* pMe)
{
	int i,j,k;

	//HorizeSort
	for(i = 0; i <12; i++)
	{
		for(j = 0; j < 7 ; j++)
		{
//Bubble Sort
//			pMe->m_nBlock[i][j] = pMe->m_nBlock[i][j+1];
//			pMe->m_nBlock[i][j+1] = -1;
			for(k = j+1; k <8; k++)
			{
				if(pMe->m_nBlock[i][j] == -1 && pMe->m_nBlock[i][k] != -1)
				{
					pMe->m_nBlock[i][j] = pMe->m_nBlock[i][k];
					pMe->m_nBlock[i][k] = -1;
				}
			}
		}
	}

	//VerticalSort
	for(j = 0; j <8; j++)
	{
		for(i = 0; i < 11 ; i++)
		{
//Bubble Sort
//			pMe->m_nBlock[i][j] = pMe->m_nBlock[i+1][j];
//			pMe->m_nBlock[i+1][j] = -1;
			for(k = i+1; k <12; k++)
			{
				if(pMe->m_nBlock[i][j] == -1 && pMe->m_nBlock[k][j] != -1)
				{
					pMe->m_nBlock[i][j] = pMe->m_nBlock[k][j];
					pMe->m_nBlock[k][j] = -1;
				}
			}
		}
	}

	//Add in Queue
	for(i = pMe->m_nQueueNum -1 ; i >= 0; i--)
	{
		if(pMe->m_nBlockQueue[i] < 0 && pMe->m_nPushedBlock >= 0)//cause of different of counters
		{
			pMe->m_nBlockQueue[i] = pMe->m_nPushedBlock;
			pMe->m_nPushedBlock = -1;
			break;
		}
		
//		if(i == 1)
//		{
//		}
	}
	for(i = 0; i < pMe->m_nQueueNum-1 ; i++)
	{
		for(j = i; j < pMe->m_nQueueNum ; j++)
		{
			if(pMe->m_nBlockQueue[i] != -1 && pMe->m_nBlockQueue[j] == -1)
			{
				pMe->m_nBlockQueue[j] = pMe->m_nBlockQueue[i];
				pMe->m_nBlockQueue[i] = -1;

			}
		}
	}


	return 1;
}

static void ProcessPlayer(CIHaida*	pMe)
{
	switch(pMe->m_nPressedKey)
	{
	case AVK_LEFT:
		{
			if(pMe->m_nBlock[pMe->m_nPlayerPos][0] >= 0)
			{
				if(pMe->m_nPushedBlock < 0 && pMe->m_nBlockClearCount == 0)
				{
/*
					if(!pMe->m_nGameMode)
					{
						SOUND(pMe, 9);
					}
					else
					{
						SOUND(pMe, 15);
					}
//*/					
					ProcessBlock(pMe, AX_PROCESSBLOCK_NORMAL);
				}
			}
		}
		break;
	case AVK_RIGHT:
		{
			if(pMe->m_nSkillPoint >= 5)
			{
				if(pMe->m_nBlock[pMe->m_nPlayerPos][0] >= 0)
				{
					if(pMe->m_nPushedBlock < 0 && pMe->m_nBlockClearCount == 0)
					{
						if(!pMe->m_nGameMode)
						{
							SOUND(pMe, 13);
						}
						else
						{
							SOUND(pMe, 15);
						}
						
						pMe->m_nSkillPoint -= 5;
						ProcessBlock(pMe, AX_PROCESSBLOCK_SPECIAL);
					}
				}
			}
		}
		break;
	case AVK_UP:
		{
			//can move up to pos 11
			if(pMe->m_nPlayerPos <11)
			{
				if(pMe->m_nBlock[pMe->m_nPlayerPos +1][0] >= 0)
				{
					pMe->m_nPlayerPos++;
//					if(pMe->m_nGameMode)
//					{
//						SOUND(pMe, 11);
//					}

				}
			}
		}
		break;
	case AVK_DOWN:
		{
			if(pMe->m_nPlayerPos > 0)
			{
				pMe->m_nPlayerPos--;
//				if(pMe->m_nGameMode)
//				{
//					SOUND(pMe, 11);
//				}
			}
		}
		break;
	case AVK_CLR:
		{
			pMe->m_nPauseState = 0;
			pMe->m_nSubState = AX_SUBSTATE_PAUSE;
		}
		break;
	}
	if(pMe->m_nBlock[pMe->m_nPlayerPos][0] < 0 && pMe->m_nPlayerPos > 0)
	{
		if(pMe->m_nPlayerPos == 12)
		{
			pMe->m_nPlayerPos--;
		}
		else
		{
			if(pMe->m_nBlock[pMe->m_nPlayerPos+1][0] < 0)
				pMe->m_nPlayerPos--;
		}
			
		
	}
		
}

static void ProcessBlock(CIHaida*	pMe, uint16 nType)
{
	int i,j;
	int nBlock;
//	uint16 nTemp;
	if(nType == AX_PROCESSBLOCK_NORMAL)
	{
		pMe->m_nPushedBlock = pMe->m_nBlock[pMe->m_nPlayerPos][0];
		for(i = 0; i < 7 ; i++)
		{
//			if(pMe->m_nBlock[pMe->m_nPlayerPos][i+1] >= 0)
//			{
				pMe->m_nBlock[pMe->m_nPlayerPos][i] = pMe->m_nBlock[pMe->m_nPlayerPos][i+1];
				pMe->m_nBlock[pMe->m_nPlayerPos][i+1] = -1;
//			}
		}

	}
	else if(nType == AX_PROCESSBLOCK_SPECIAL)
	{
		nBlock = pMe->m_nBlock[pMe->m_nPlayerPos][0];
		if(nBlock == pMe->m_nFeatherBlock)
			pMe->m_nSkillPoint += 5;
		pMe->m_nComboCounter = 0;

		for(i = 0; i <12; i++)
		{
			for(j = 0; j <8; j++)
			{
				if(pMe->m_nBlock[i][j] == nBlock)
					pMe->m_nBlock[i][j] = -1;
			}
		}
		for(i = 0; i < 8; i++)
		{
			if(pMe->m_nBlockQueue[i] == nBlock)
				pMe->m_nBlockQueue[i] = -1;
		}
	}
}

static void SetNextStage(CIHaida*	pMe)
{
	IFile * pIFile;
	pMe->m_nStage++;

//	pMe->m_nStage = EVENT1_LEVEL;

	if(pMe->m_nStage == EVENT1_LEVEL)
	{
		pMe->m_uiCancle = 1;
		ISHELL_CancelTimer(pMe->a.m_pIShell, NULL, pMe);		
		StopSound(pMe);
		LoadStage2(pMe);
	}
		
	else if(pMe->m_nStage == EVENT2_LEVEL)
	{
		pMe->m_uiCancle = 1;
		ISHELL_CancelTimer(pMe->a.m_pIShell, NULL, pMe);		
		StopSound(pMe);
		LoadStage3(pMe);
	}
		

	if(pMe->m_nStage == 20)
	{
		//Ending
		SOUND(pMe, 3);
		pMe->m_nProjectState = AX_PROJECT_ENDING;
		pMe->m_nEndingCount = 0;
	}
	else
	{
//*
		ISHELL_CreateInstance(pMe->a.m_pIShell, AEECLSID_FILEMGR,(void **)&pMe->m_pIFileMgr);
			//there's no file
		pIFile = IFILEMGR_OpenFile(pMe->m_pIFileMgr, "haida.sav", _OFM_READWRITE);
		IFILE_Write(pIFile, &(pMe->m_nStage), 4);
//		IFILE_Write(pIFile, &(pMe->m_nScore), 4);
//		IFILE_Write(pIFile, &(pMe->m_nScore), 4);

		IFILE_Release(pIFile);
		IFILEMGR_Release(pMe->m_pIFileMgr);
		pMe->m_pIFileMgr = NULL;
//*/
		SetStage(pMe, pMe->m_nStage);
	}
}

static void SetStage(CIHaida*	pMe, int nStage)
{
	int i, j;
	IFile	*pIFile;
	int32	nSeek;
//	uint32 nnn;
	//char LEVEL;

	if(!pMe->m_nGameMode)
	{
		
		pMe->m_nRemainTime = AX_DEF_STAGE_TIME;
		if(nStage < 6)
		{
			pMe->m_nSuccessNum = 3;		//몇개를 맞추면 성공인가.
			pMe->m_nQueueNum = 3;		//몇개의 칸이 비어있는가

		}
		else if(nStage < 9)
		{
			pMe->m_nSuccessNum = 4;		//몇개를 맞추면 성공인가.
			pMe->m_nQueueNum = 4;		//몇개의 칸이 비어있는가
		}
		else if(nStage < 13)
		{
			pMe->m_nSuccessNum = 5;		//몇개를 맞추면 성공인가.
			pMe->m_nQueueNum = 5;		//몇개의 칸이 비어있는가
		}
		else if(nStage < 16)
		{
			pMe->m_nSuccessNum = 6;		//몇개를 맞추면 성공인가.
			pMe->m_nQueueNum = 6;		//몇개의 칸이 비어있는가
		}
		else
		{
			pMe->m_nSuccessNum = 7;		//몇개를 맞추면 성공인가.
			pMe->m_nQueueNum = 7;		//몇개의 칸이 비어있는가
		}

	

		ISHELL_CreateInstance(pMe->a.m_pIShell, AEECLSID_FILEMGR,(void **)&pMe->m_pIFileMgr);
		pIFile = IFILEMGR_OpenFile(pMe->m_pIFileMgr, "level.dat", _OFM_READ);
		nSeek = nStage * 12* 8 *4;
		IFILE_Seek(pIFile, _SEEK_START, nSeek);
		for(i = 0; i < 12; i++)
		{
			for(j = 0; j < 8; j++)
			{
				
				IFILE_Read(pIFile, &(pMe->m_nBlock[i][j]), 4);
				(pMe->m_nBlock[i][j])--;
			}
		}
		IFILE_Release(pIFile);
		pIFile = NULL;

		IFILEMGR_Release(pMe->m_pIFileMgr);
		pMe->m_pIFileMgr = NULL;


		StopSound(pMe);
		if(pMe->m_nStage == OPENING_LEVEL
			|| pMe->m_nStage == EVENT1_LEVEL
			|| pMe->m_nStage == EVENT2_LEVEL)
		{
			SOUND(pMe,3);
		}

	}
	else
	{
		for(i = 0; i < 12; i++)
		{
			for(j = 0; j < 8; j++)
			{
				pMe->m_nBlock[i][j] = -1;
			}
		}

		pMe->m_nSuccessNum = 3;
		pMe->m_nQueueNum = 7;

		pMe->m_nRemainTime = AX_DEF_NEWBLOCK_TIME;
		
		
		pMe->m_nBlock[0][0] = RAND(pMe)%10;
		pMe->m_nBlock[0][1] = RAND(pMe)%10;
		pMe->m_nBlock[1][0] = RAND(pMe)%10;
		pMe->m_nBlock[1][1] = RAND(pMe)%10;

		pMe->m_nBlock[0][2] = RAND(pMe)%10;
		pMe->m_nBlock[0][3] = RAND(pMe)%10;
		pMe->m_nBlock[1][2] = RAND(pMe)%10;
		pMe->m_nBlock[1][3] = RAND(pMe)%10;
						
		pMe->m_nBlock[0][4] = RAND(pMe)%10;
		pMe->m_nBlock[0][5] = RAND(pMe)%10;
		pMe->m_nBlock[1][4] = RAND(pMe)%10;
		pMe->m_nBlock[1][5] = RAND(pMe)%10;



		pMe->m_nGenerationBlock[0] = RAND(pMe)%10;
		pMe->m_nGenerationBlock[1] = RAND(pMe)%10;
	}

	pMe->m_nBlockClearCount = 0;
	pMe->m_nTimeItem = 0;
	pMe->m_nComboImgCounter = 0;
	pMe->m_nRemainBomb = 0;
	pMe->m_nBlockAni = 4;
	pMe->m_bDrawCombo = 0;
	pMe->m_nBombCounter = -1;
//	pMe->m_nFeatherNum = 0;
	pMe->m_nEventCounter = 0;
	pMe->m_nFeatherBlock = -1;
	pMe->m_nMissBlock = 0;
	pMe->m_nComboCounter = 0;
	pMe->m_nPushedBlock = -1;
	pMe->m_nPreCounter = 10;
	pMe->m_nStage = nStage;
//	pMe->m_nGameMode = AX_GAMEMODE_STORY;
	pMe->m_nSubState = AX_SUBSTATE_PREPARE;
	pMe->m_nPrepareIndex = 0;
	pMe->m_nGameCounter = 0;
	pMe->m_nPlayerPos = 0;


	for(i = 0; i < 8 ; i++)
	{
		pMe->m_nBlockQueue[i] = -1;
	}
}

static void DrawGame(CIHaida* pMe)
{
	//TODO:CommonDraw
	DrawBackground(pMe);
	DrawBlock(pMe);
	DrawPlayer(pMe);
	DrawInterface(pMe);


	if(pMe->m_nSubState == AX_SUBSTATE_CALCULATE)
	{
		DrawCalculate(pMe);
	}

	if(pMe->m_nSubState == AX_SUBSTATE_PAUSE)
	{
		DrawPause(pMe);
	}
}

static void DrawBackground(CIHaida* pMe)
{
	NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBG1, 0 + pMe->m_LCDx,0 + pMe->m_LCDy);
	NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBG2, 0 + pMe->m_LCDx,13 + pMe->m_LCDy);
	NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBG3, 0 + pMe->m_LCDx,101 + pMe->m_LCDy);


	if(!pMe->m_nGameMode)
	{
		if(pMe->m_nStage < EVENT1_LEVEL)
		{
			NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBack[0], 16 + pMe->m_LCDx,12 + pMe->m_LCDy);
		}
		else if(pMe->m_nStage < EVENT2_LEVEL)
		{
			NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBack[1], 16 + pMe->m_LCDx,12 + pMe->m_LCDy);
//			NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBack[1], 16 + pMe->m_LCDx,12 + pMe->m_LCDy);
		}
		else
		{
			NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBack[2], 16 + pMe->m_LCDx,12 + pMe->m_LCDy);
		}
	}
	else
	{
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBack[2], 16 + pMe->m_LCDx,12 + pMe->m_LCDy);
	}
	NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pFeather, 100 + pMe->m_LCDx,106 + pMe->m_LCDy);
}

//survival mode 위에서 떨어지는 block은 interface에서 그린다.
static void DrawBlock(CIHaida* pMe)
{
	int i,j;
	int nCnt;
	//normal blocks
	for(i = 0; i < 12; i++)
	{
		for(j = 0; j<8; j++)
		{
			if(pMe->m_nBlock[i][j] >= 0)
			{
				IIMAGE_SetOffset(pMe->pBlock, pMe->m_nBlockAni * 12, pMe->m_nBlock[i][j] *8 );
				IIMAGE_Draw(pMe->pBlock, 15+ 12*j + pMe->m_LCDx, 5+ 8*(11-i) +pMe->m_LCDy);
				if(pMe->m_nBlock[i][j] == pMe->m_nFeatherBlock)
				{
					NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pFeather_Small[pMe->m_nGameCounter%2], 15+ 12*j + pMe->m_LCDx, 5+ 8*(11-i) +pMe->m_LCDy);
				}
			}
		}
	}

	//Pushed Block
	if(pMe->m_nPushedBlock >= 0)
	{
		IIMAGE_SetOffset(pMe->pBlock, pMe->m_nBlockAni * 12, pMe->m_nPushedBlock *8 );
		IIMAGE_Draw(pMe->pBlock, 1+pMe->m_LCDx, 8*(12 - pMe->m_nPlayerPos) +pMe->m_LCDy);
		if(pMe->m_nPushedBlock == pMe->m_nFeatherBlock)
		{
			NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pFeather_Small[pMe->m_nGameCounter%2], 1+pMe->m_LCDx, 8*(12 - pMe->m_nPlayerPos) +pMe->m_LCDy);
		}

	}

	//Queue blocks
	for(i = 0; i < pMe->m_nQueueNum; i++)
	{
		if(pMe->m_nBlockQueue[i] >= 0)
		{
			IIMAGE_SetOffset(pMe->pBlock, pMe->m_nBlockAni * 12, pMe->m_nBlockQueue[i] *8 );
			IIMAGE_Draw(pMe->pBlock, 15+ 12*i + pMe->m_LCDx, 105 +pMe->m_LCDy);
			if(pMe->m_nBlockQueue[i] == pMe->m_nFeatherBlock)
			{
				NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pFeather_Small[pMe->m_nGameCounter%2], 15+ 12*i + pMe->m_LCDx, 105 +pMe->m_LCDy);
			}

		}
	}
	for(i = pMe->m_nQueueNum; i < 7; i++)
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pStone, 15+ 12*i + pMe->m_LCDx, 105 +pMe->m_LCDy);

	
	if(pMe->m_nBlockClearCount == 1)
	{
		if(!pMe->m_nGameMode)
		{

			for(i = 0; i < pMe->m_nQueueNum; i++)
				NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pClear, 15+ 12*i + pMe->m_LCDx, 105 +pMe->m_LCDy);
		}
		else
		{
			nCnt = 4;

			for(i = pMe->m_nQueueNum -1; i >= 0; i--)
			{
				if(pMe->m_nBlockQueue[i] == -1)
				{
					NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pClear, 15+ 12*i + pMe->m_LCDx, 105 +pMe->m_LCDy);
					nCnt--;
					if(nCnt == 0)
						break;
				}
			}
		}
	}
	//SurvivalMode Drop Blocks
}

static void DrawPlayer(CIHaida* pMe)
{
	int i;
	int nPlayerX;
	AEERect	rect;

	rect.x = 15 + pMe->m_LCDx;
	rect.y = 5+((11-pMe->m_nPlayerPos)*8) + pMe->m_LCDy;
	rect.dx = 12;
	rect.dy = 8;
	//NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pCursor, 15 + pMe->m_LCDx, 5+((11-pMe->m_nPlayerPos)*8) + pMe->m_LCDy);
	/*Make Cursor*/
	if(pMe->m_nGameCounter %4 > 1)
		IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, MAKE_RGB(0xff,0xff,0xff), NULL, IDF_RECT_FRAME);
	
	//SetPlayerXPosition
	for(i = 0; i <8; i++)
	{
		if(pMe->m_nBlock[pMe->m_nPlayerPos][i] == -1)
		{
			nPlayerX = (i-1)*12+29;
			break;
		}
	}
	
	if(!pMe->m_nGameMode)		//pMe->m_nGameMode == 0 : GAME_STORY
	{
		if(pMe->m_nSubState != AX_SUBSTATE_CALCULATE 
			&& pMe->m_nSubState != AX_SUBSTATE_GAMECLEAR
			&& pMe->m_nSubState != AX_SUBSTATE_GAMEOVER)
		{
			if(pMe->m_nPushedBlock == -1)
				NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pHero[0], nPlayerX +pMe->m_LCDx, 8*(11 - pMe->m_nPlayerPos)-3 + pMe->m_LCDy);
			else
				NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pHero[1], nPlayerX +pMe->m_LCDx, 8*(11 - pMe->m_nPlayerPos)-3 + pMe->m_LCDy);
		}
		else if(pMe->m_nSubState == AX_SUBSTATE_GAMEOVER)
		{
			if(pMe->m_nGameCounter%2)
				NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pHero[2], nPlayerX-7 +pMe->m_LCDx, 8*(11 - pMe->m_nPlayerPos)  + pMe->m_LCDy);
			else
				NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pHero[3], nPlayerX-8 +pMe->m_LCDx, 8*(11 - pMe->m_nPlayerPos) -1 + pMe->m_LCDy);
		}
		else if(pMe->m_nSubState == AX_SUBSTATE_GAMECLEAR)
		{
			if(pMe->m_nGameCounter%2)
				NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pHero[4],  nPlayerX -3+pMe->m_LCDx, 8*(11 - pMe->m_nPlayerPos)-3 + pMe->m_LCDy);
			else
				NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pHero[5],  nPlayerX -2+pMe->m_LCDx, 8*(11 - pMe->m_nPlayerPos)-6 + pMe->m_LCDy);
		}
	}
	else
	{
		if(pMe->m_nSubState != AX_SUBSTATE_CALCULATE 
			&& pMe->m_nSubState != AX_SUBSTATE_GAMECLEAR
			&& pMe->m_nSubState != AX_SUBSTATE_GAMEOVER)
		{
			if(pMe->m_nPushedBlock == -1)
				NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pS_Hero[0], nPlayerX+3 +pMe->m_LCDx, 8*(11 - pMe->m_nPlayerPos)-4 + pMe->m_LCDy);
			else
				NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pS_Hero[1], nPlayerX+3 +pMe->m_LCDx, 8*(11 - pMe->m_nPlayerPos)-4 + pMe->m_LCDy);
		}
		else if(pMe->m_nSubState == AX_SUBSTATE_GAMEOVER)
		{
			if(pMe->m_nGameCounter%2)
				NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pS_Hero[2], nPlayerX-1 +pMe->m_LCDx, 8*(11 - pMe->m_nPlayerPos)-11 + pMe->m_LCDy);
			else
				NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pS_Hero[3], nPlayerX-1 +pMe->m_LCDx, 8*(11 - pMe->m_nPlayerPos)-11 + pMe->m_LCDy);
		}


	}
//		CopyImage(x+(h_x*12)+3 + size_x, y+(h_y*8)-1 + size_y, s_hero[h_ani]);					//서바이벌 히어로 그리기(+3, -1는 헤이다와의 조정상수이다)
}

static void DrawInterface(CIHaida* pMe)
{
	int i;
	int divide_feather[3];
	int	zero_chk_counter;
	int s_n_x;
	int nTempFeather;
	char combo[10];

	IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,MAKE_RGB(0x00,0x00,0x00));
	//Draw Line
//	DrawHLine( 14 + size_x + ( skill_point * 5 ), 119 + size_x, 102 + size_y );
//	DrawHLine( 14 + size_x + ( skill_point * 5 ), 119 + size_x, 103 + size_y );
	IDISPLAY_DrawHLine(pMe->a.m_pIDisplay, 14 + pMe->m_LCDx + (pMe->m_nSkillPoint *5), 102+pMe->m_LCDy,119 - (14+pMe->m_nSkillPoint*5));
	IDISPLAY_DrawHLine(pMe->a.m_pIDisplay, 14 + pMe->m_LCDx + (pMe->m_nSkillPoint *5), 103+pMe->m_LCDy,119 - (14+pMe->m_nSkillPoint*5));
	IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,MAKE_RGB(0xff,0xff,0xff));

	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)"SCORE ", -1, 70+13 + pMe->m_LCDx, 15 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);

	SPRINTF(pMe->str, "%d%d%d%d%d ",		pMe->m_nScore/10000
										,	pMe->m_nScore/1000	- (pMe->m_nScore/10000)*10
										,	pMe->m_nScore/100	- (pMe->m_nScore/1000)*10
										,	pMe->m_nScore/10	- (pMe->m_nScore/100)*10
										,	pMe->m_nScore%10);
	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 70+13 + pMe->m_LCDx, 25 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);


	if(pMe->m_nComboImgCounter > 0 && pMe->m_nComboImgCounter != 2)
	{
		IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,MAKE_RGB(0x00,0x00,0x00));
		if(pMe->m_nComboCounter > 9)
		{
			SPRINTF(combo, "%d%d " , pMe->m_nComboCounter/10, pMe->m_nComboCounter%10);
			NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pCombo,32+pMe->m_LCDx, 20+pMe->m_LCDy);
			IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)combo, -1, 40 + pMe->m_LCDx, 29 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
		}
		else
		{
			SPRINTF(combo, "%d " , pMe->m_nComboCounter);
			NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pCombo, 32+pMe->m_LCDx, 20+pMe->m_LCDy);
			IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)combo, -1, 44 + pMe->m_LCDx, 29 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
		}
		IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,MAKE_RGB(0xff,0xff,0xff));
	}
	if(pMe->m_nBombCounter >= 0)
	{
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBoom[pMe->m_nBombCounter], 40-15+pMe->m_LCDx, 90-20+pMe->m_LCDy);
	}

	if(pMe->m_nSubState == AX_SUBSTATE_GAMEOVER)
	{
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pGameover, 30+pMe->m_LCDx, 40+ pMe->m_LCDy);
		if(!pMe->m_nGameMode)
			NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pTent2, 17+pMe->m_LCDx, 2+pMe->m_LCDy);
		
//		CopyImage( 17 + size_x, 2 + size_y, tent2 );					//주인공이 졌으며 텐트2를 그린다
	}
	else if(pMe->m_nSubState == AX_SUBSTATE_GAMECLEAR)
	{
		if(!pMe->m_nGameMode)
			NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pTent, 17+pMe->m_LCDx, 2+pMe->m_LCDy);
	}
	else
	{
		if(!pMe->m_nGameMode)
			NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pTent, 17+pMe->m_LCDx, 2+pMe->m_LCDy);
	}

	if(!pMe->m_nGameMode)
	{
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pEnemy[pMe->m_nGameCounter%2], 120-(100- pMe->m_nRemainTime/10)+pMe->m_LCDx, 3+pMe->m_LCDy);
//		if ( time_item == 146 )														//수정된 사항
//			CopyImage( 120-(88-game_time/10) + size_x, 7 + size_y, boom[2]);
		if(pMe->m_nTimeItem == 150)
			NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBoom[2], 120-(100- pMe->m_nRemainTime/10)+pMe->m_LCDx, 3+pMe->m_LCDy);
	}
	else
	{

//	ch_block(pMe, pMe->bs_block[1], (120-(80- pMe->s_time *2))-12, 4 );
//	ch_block(pMe, pMe->bs_block[0], (120-(80- pMe->s_time *2))-24, 4 );
		IIMAGE_SetOffset(pMe->pBlock, pMe->m_nBlockAni * 12, pMe->m_nGenerationBlock[0] *8 );
		IIMAGE_Draw(pMe->pBlock, (120-(80-pMe->m_nRemainTime))-24 + pMe->m_LCDx, 4 +pMe->m_LCDy);
		IIMAGE_SetOffset(pMe->pBlock, pMe->m_nBlockAni * 12, pMe->m_nGenerationBlock[1] *8 );
		IIMAGE_Draw(pMe->pBlock, (120-(80- pMe->m_nRemainTime))-12+ pMe->m_LCDx, 4 +pMe->m_LCDy);

		
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pEnemy[pMe->m_nGameCounter%2], 120-(80-pMe->m_nRemainTime)+pMe->m_LCDx, 3+pMe->m_LCDy);
		
//		CopyImage( (120-(80-s_time*2)+4) + size_x, 3 + size_y, enemy[b_ani]); //서바이벌모드 불도저 그리기
//		CopyImage(x+(h_x*12)+3 + size_x, y+(h_y*8)-1 + size_y, s_hero[h_ani]);					//서바이벌 히어로 그리기(+3, -1는 헤이다와의 조정상수이다)
	}
	
//		CopyImage( 120-(88-game_time/10) + size_x, 3 + size_y, enemy[b_ani]); //시간으로 사용된 불도저 그리기


//OriginalSource 차용.

//	StrCpy(str,"SCORE");		//스코어 출력
//	light_text( 115, 15, 109, 0 );
//	(pMe, 115, 15, COLOR_INDEX_109, COLOR_INDEX_0 )	//인수로 string을 받아올수 없으므로 전역변수 str을 반드시 선언해야하고
//	MakeStr1(str,"%d", score );
//	light_text( 115, 25, 23, 0 );
//
//	MakeStr1(str,"%d", feather_num );

//	light_text( 117, 106, 3, 0 );


	if(pMe->m_nTimeItem <= 0 && !pMe->m_nGameMode)
	{
		if(pMe->m_nRemainTime == 200 ||pMe->m_nRemainTime == 160 || pMe->m_nRemainTime == 120 || pMe->m_nRemainTime == 80 || pMe->m_nRemainTime == 40)
		{
			SOUND(pMe, 4);
		}
		else if(pMe->m_nRemainTime < 200)
		{
			IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,MAKE_RGB(0xff,0x00,0x00));

			if(pMe->m_nRemainTime %4 > 1)
				IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)"HURRY UP!! ", -1, 60 + pMe->m_LCDx, 4 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);

			IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,MAKE_RGB(0xff,0xff,0xff));
		}
	}
//	else



	
//Feather
	if ( pMe->m_nFeatherNum <= 0 )
		return;

	divide_feather[0]	= pMe->m_nFeatherNum / 100;
	nTempFeather		= pMe->m_nFeatherNum % 100;
	divide_feather[1]	= nTempFeather / 10;
	divide_feather[2]	= nTempFeather % 10;

	for ( i = 0; i <= 4 ; i++ )			//앞자리의 0은 출력하지 않기 위해서
	{									//어느자리에 값이 있는지 체크한다.
		if (divide_feather[i] != 0 )
		{
			zero_chk_counter = i;
			i = 5;
		}
	}
	s_n_x = 103;
	for ( i = 0; i<= 2; i++ )			//값에 맞게 그림들을 출력한다.
	{
		if ( zero_chk_counter <= i )
		{
			NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pFeather_Number[divide_feather[i]], s_n_x +pMe->m_LCDx, 105+ pMe->m_LCDy);
		}
			//CopyImage( s_n_x, 105, feather_number[divide_feather[i]] );
		s_n_x+=4;
	}


}	

static void DrawCalculate(CIHaida* pMe)
{
	AEERect rect;
	AEEPoint	point;
	

	int i,j;
	rect.x = pMe->m_LCDx + 10;
	rect.y = pMe->m_LCDy + 10;
	rect.dx = 100;
	rect.dy = 100;

//	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, COLOR_INDEX_16, IDF_RECT_FILL);

	IGRAPHICS_SetColor(pMe->m_pIGraphics, 0,0,0,0);
	IGRAPHICS_SetPointSize(pMe->m_pIGraphics, 1);
	for(i = 0; i < 120; i++)
	{
		for(j = 0; j < 119;j++)
		{
			if((i%2) && (j%2))
			{
				point.x = i + pMe->m_LCDx;
				point.y = j + pMe->m_LCDy;
				IGRAPHICS_DrawPoint(pMe->m_pIGraphics, &point);
			}
			else if(!(i%2) && !(j%2))
			{
				point.x = i + pMe->m_LCDx;
				point.y = j + pMe->m_LCDy;
				IGRAPHICS_DrawPoint(pMe->m_pIGraphics, &point);
			}
		}
	}
	//DrawBox...

	rect.x = pMe->m_LCDx + 8;
	rect.y = pMe->m_LCDy + 8;
	rect.dx = 102;
	rect.dy = 92;
	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, MAKE_RGB(128, 0, 0), NULL, IDF_RECT_FRAME);

	rect.x += 1;
	rect.y += 1;
	rect.dx -= 2;
	rect.dy -= 2;
	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, MAKE_RGB(255, 255, 255), NULL, IDF_RECT_FRAME);

	rect.x += 1;
	rect.y += 1;
	rect.dx -= 2;
	rect.dy -= 2;
	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, MAKE_RGB(128, 0, 0), NULL, IDF_RECT_FRAME);
	rect.x += 1;
	rect.y += 1;
	rect.dx -= 2;
	rect.dy -= 2;

	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, MAKE_RGB(192,255,255), IDF_RECT_FILL);
	

	IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,MAKE_RGB(0x00,0x00,0x00));
	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)"TIME", -1, 18 + pMe->m_LCDx, 15 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	
	SPRINTF(pMe->str, "%d%d%dx5=%d%d%d%d  ", pMe->m_nRemainTime/100, pMe->m_nRemainTime/10 - (pMe->m_nRemainTime/100)*10, pMe->m_nRemainTime%10
												,(pMe->m_nRemainTime*5)/1000, (pMe->m_nRemainTime*5)/100 - ((pMe->m_nRemainTime*5)/1000)*10
												, (pMe->m_nRemainTime*5)/10  - ((pMe->m_nRemainTime*5)/100)* 10
												, (pMe->m_nRemainTime*5)%10);

	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)pMe->str, -1, 20 + pMe->m_LCDx, 26 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);

	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)"MISS ", -1, 18 + pMe->m_LCDx, 42 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	SPRINTF(pMe->str, "%d%d%dx5=%d%d%d%d", pMe->m_nMissBlock/100, pMe->m_nMissBlock/10 - (pMe->m_nMissBlock/100)*10, pMe->m_nMissBlock%10
												,(pMe->m_nMissBlock*5)/1000, (pMe->m_nMissBlock*5)/100 - ((pMe->m_nMissBlock*5)/1000)*10
												, (pMe->m_nMissBlock*5)/10  - ((pMe->m_nMissBlock*5)/100)*10
												, (pMe->m_nMissBlock*5)%10);

	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)pMe->str, -1, 20 + pMe->m_LCDx, 53 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);

	//IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)"SCORE ", -1, 18 + pMe->m_LCDx, 69 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	//SPRINTF(pMe->str, "  =   %d", pMe->m_nGameCounter*5 - pMe->m_nMissBlock*5);
	if(pMe->m_nGameCounter >= pMe->m_nMissBlock)
	{
		SPRINTF(pMe->str, "SCORE=%d%d%d%d"	,((pMe->m_nRemainTime - pMe->m_nMissBlock)*5)/1000, ((pMe->m_nRemainTime - pMe->m_nMissBlock)*5)/100 - (((pMe->m_nRemainTime - pMe->m_nMissBlock)*5)/1000)*10
													, ((pMe->m_nRemainTime - pMe->m_nMissBlock)*5)/10  - (((pMe->m_nRemainTime - pMe->m_nMissBlock)*5)/100)*10
													, ((pMe->m_nRemainTime - pMe->m_nMissBlock)*5)%10);
	}
	else
	{
		SPRINTF(pMe->str, "SCORE=-%d%d%d%d "	,((pMe->m_nMissBlock - pMe->m_nRemainTime)*5)/1000, ((pMe->m_nMissBlock - pMe->m_nRemainTime)*5)/100 - (((pMe->m_nMissBlock - pMe->m_nRemainTime)*5)/1000)*10
													, ((pMe->m_nMissBlock - pMe->m_nRemainTime)*5)/10  - (((pMe->m_nMissBlock - pMe->m_nRemainTime)*5)/100)*10
													, ((pMe->m_nMissBlock - pMe->m_nRemainTime)*5)%10);
	}
	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)pMe->str, -1, 18 + pMe->m_LCDx, 69 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);

	IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,MAKE_RGB(0xff,0xff,0xff));
		




}

static void DrawPause(CIHaida* pMe)
{
//	SetColor( 104 );												//수정된부분
	AEERect rect;
	rect.x = 21+pMe->m_LCDx;
	rect.y = 18 +pMe->m_LCDy;

	rect.dx = 84;
	rect.dy = 76;
	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, COLOR_INDEX_104, IDF_RECT_FILL);
	
	IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_0);
	rect.x = 20 +pMe->m_LCDx;
	rect.y = 17 +pMe->m_LCDy;
	rect.dx = 86;
	rect.dy = 78;
	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, COLOR_INDEX_104, NULL, IDF_RECT_FRAME);
	
	IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_84);
	STRCPY( pMe->str, "일시정지" );			Text_Out(pMe, 23, 20 );

	IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_3);
	STRCPY( pMe->str, "끝내기(*) " );		Text_Out(pMe, 23, 35);
	STRCPY( pMe->str, "계속하기(#) " );	 	Text_Out(pMe,23, 50 );
	STRCPY( pMe->str, "소리on/off(1) " );	Text_Out(pMe,23, 65 );
	STRCPY( pMe->str, "진동on/off(2) " );	Text_Out(pMe, 23, 80 );
	IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_0);

}

static void DrawPrepare(CIHaida* pMe)
{
	int acter1_x, acter1_y, acter1_num, acter2_x, acter2_y, acter2_num, face_num;
	acter1_x = 0;
	acter1_y = 0;
	acter1_num = 0;
	acter2_x = 0;
	acter2_y = 0;
	acter2_num = 0;
	face_num = 3; 


	if(!pMe->m_nGameMode)
	{
		if(pMe->m_nStage == OPENING_LEVEL)
		{
/*
			acter1_x = 19;
			acter1_y = 42;
			acter1_num = 0;
			acter2_x = 70;
			acter2_y = 19;
			acter2_num = 2;
			face_num = 3;
*/
			acter2_x = 70;
			acter2_y = 19;
			acter2_num = 2;

			switch(pMe->m_nEventCounter)
			{

			case 0:
				{
					FillBlack(pMe);
					IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)"평화롭던 수우족 ", -1, 10 + pMe->m_LCDx, 25 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
					IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)"인디언 마을에 ", -1, 10 + pMe->m_LCDx, 40 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
					IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)"관광지 개발을 ", -1, 10 + pMe->m_LCDx, 55 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
					IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)"위한 [에이에스유] ", -1, 10 + pMe->m_LCDx, 70 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
					IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)"불도저가", -1, 10 + pMe->m_LCDx, 85 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
					IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)"나타나는데..", -1, 10 + pMe->m_LCDx, 100 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
					IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)"OK닫기    다음▶", -1, 7 + pMe->m_LCDx, 3 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
				}
				break;
			case 1:
				{
					STRCPY(pMe->str, "마을을없애려고");
					STRCPY(pMe->str2, "불도저가");
					acter1_x = 19;
					acter1_y = 42;
					acter1_num = 0;

					face_num = 3;
					DrawSpeech(pMe, acter1_x, acter1_y, acter1_num, acter2_x, acter2_y, acter2_num, face_num );
					

				}
				break;
			case 2:
				{
					STRCPY(pMe->str, "나타났습니다.!! ");
					STRCPY(pMe->str2, "추장님!!");
					acter1_x = 19;
					acter1_y = 42;
					acter1_num = 0;
					
					face_num = 3;

					DrawSpeech(pMe, acter1_x, acter1_y, acter1_num, acter2_x, acter2_y, acter2_num, face_num );
				}
				break;
			case 3:
				{
					STRCPY(pMe->str, "이젠어쩔도리가");
					STRCPY(pMe->str2, "없단말인가? ");
					acter1_x = 19;
					acter1_y = 42;
					acter1_num = 1;
					
					face_num = 0;

					DrawSpeech(pMe, acter1_x, acter1_y, acter1_num, acter2_x, acter2_y, acter2_num, face_num );
				}
				break;
			case 4:
				{
					STRCPY(pMe->str, "저 혼자라도 ");
					STRCPY(pMe->str2, "막을래요! ");
					acter1_x = 19;
					acter1_y = 42;
					acter1_num = 1;

					face_num = 1;
//					acter1_num = 1;
//					acter1_x =15;
					DrawSpeech(pMe, acter1_x, acter1_y, acter1_num, acter2_x, acter2_y, acter2_num, face_num );
				}
				break;
			}
		}
		else if(pMe->m_nStage == EVENT1_LEVEL)
		{
			acter2_x = 70;
			acter2_y = 19;
			acter2_num = 2;

			switch(pMe->m_nEventCounter)
			{
			case 0:
				{
					FillBlack(pMe);
					IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)"헤이다의노력으로", -1, 10 + pMe->m_LCDx, 25 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);						  
					IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)"토템들은 하나씩 ", -1, 10 + pMe->m_LCDx, 40 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
					IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)"옮겨지게 된다 ", -1, 10 + pMe->m_LCDx, 55 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
					IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)"하지만 불도저는 ", -1, 10 + pMe->m_LCDx, 70 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
					IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)"시한폭탄을 토템에 ", -1, 10 + pMe->m_LCDx, 85 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
					IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)"설치하게 되는데 ", -1, 10 + pMe->m_LCDx, 100 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
					IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)"OK닫기    다음▶", -1, 7 + pMe->m_LCDx, 3 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
				}
				break;
			case 1:
				{
					STRCPY(pMe->str, "아빠 큰일났어");
					STRCPY(pMe->str2, "~~~~!!!");
					face_num = 1;
					acter1_x = 19;
					acter1_y = 42;
					acter1_num = 1;

					DrawSpeech(pMe, acter1_x, acter1_y, acter1_num, acter2_x, acter2_y, acter2_num, face_num );
//					NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pFace[5], 49 + pMe->m_LCDx, 56 + pMe->m_LCDy);
//					NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pFace[2], 25 + pMe->m_LCDx, 46 + pMe->m_LCDy);

				}
				break;
			case 2:
				{
					STRCPY(pMe->str, "아니 이건~~!!!");
					STRCPY(pMe->str2, "  ");
					face_num = 0;
					acter1_x = 19;
					acter1_y = 42;
					acter1_num = 1;

					DrawSpeech(pMe, acter1_x, acter1_y, acter1_num, acter2_x, acter2_y, acter2_num, face_num );
//					NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pFace[5], 49 + pMe->m_LCDx, 56 + pMe->m_LCDy);
//					NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pFace[2], 25 + pMe->m_LCDx, 46 + pMe->m_LCDy);
				}
				break;
			}

		}
		else if(pMe->m_nStage == EVENT2_LEVEL)
		{
			acter1_x = 19;
			acter1_y = 42;
			acter1_num = 0;
			acter2_x = 70;
			acter2_y = 19;
			acter2_num = 2;

			switch(pMe->m_nEventCounter)
			{
			case 0:
				{
					FillBlack(pMe); 
					IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)"헤이다의 모습은 ", -1, 10 + pMe->m_LCDx, 25 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);								  
					IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)"자포자기했던", -1, 10 + pMe->m_LCDx,  40 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
					IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)"마을사람들을", -1, 10 + pMe->m_LCDx, 55 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
					IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)"변화시키는데", -1, 10 + pMe->m_LCDx, 70 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
					IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)"....", -1, 10 + pMe->m_LCDx, 85 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
					IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)"OK닫기    다음▶", -1, 7 + pMe->m_LCDx, 3 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
								  
				}
				break;
			case 1:
				{
					STRCPY(pMe->str, "미안하다. ");
					STRCPY(pMe->str2, "헤이다.. 이젠 ");
					face_num = 4;
					acter1_x = 19;
					acter1_y = 42;
					acter1_num = 0;

					DrawSpeech(pMe, acter1_x, acter1_y, acter1_num, acter2_x, acter2_y, acter2_num, face_num );
				}
				break;
			case 2:
				{
					STRCPY(pMe->str, "우리도 도울께 ");
					STRCPY(pMe->str2, "....");
					face_num = 4;
					acter1_x = 19;
					acter1_y = 42;
					acter1_num = 0;

					DrawSpeech(pMe, acter1_x, acter1_y, acter1_num, acter2_x, acter2_y, acter2_num, face_num );
				}
				break;
			case 3:
				{
					STRCPY(pMe->str, "고마워요..");
					STRCPY(pMe->str2, "아저씨..");
					face_num = 1;
					acter1_x = 19;
					acter1_y = 42;
					acter1_num = 1;

					DrawSpeech(pMe, acter1_x, acter1_y, acter1_num, acter2_x, acter2_y, acter2_num, face_num );
				}
			}
		}
		else
		{
		}
	}
	else
	{
	}
}

static void DrawSpeech(CIHaida *pMe, int acter1_x, int acter1_y, int acter1_num, int acter2_x, int acter2_y, int acter2_num, int face_num )
{
	if(pMe->m_nStage<EVENT1_LEVEL)
	{
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBack[0], 15 + pMe->m_LCDx, 0 + pMe->m_LCDy);
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBack2[0], 0 + pMe->m_LCDx, 0 + pMe->m_LCDy);
	}
	else if(pMe->m_nStage < EVENT2_LEVEL)
	{
//		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBack[1], 15 + pMe->m_LCDx, 0 + pMe->m_LCDy);
//		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBack2[1], 0 + pMe->m_LCDx, 0 + pMe->m_LCDy);
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBack[1], 15 + pMe->m_LCDx, 0 + pMe->m_LCDy);
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBack2[1], 0 + pMe->m_LCDx, 0 + pMe->m_LCDy);
	}
	else
	{
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBack[2], 15 + pMe->m_LCDx, 0 + pMe->m_LCDy);
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBack2[2], 0 + pMe->m_LCDx, 0 + pMe->m_LCDy);
	}

	if(acter1_num>=0)
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pActor[acter1_num], acter1_x + pMe->m_LCDx, acter1_y + pMe->m_LCDy);
	if(acter2_num>=0)
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pActor[acter2_num], acter2_x + pMe->m_LCDx, acter2_y + pMe->m_LCDy);

	NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pTalk_Menu, 0 + pMe->m_LCDx,84 + pMe->m_LCDy);
	NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pFace[face_num], 3 + pMe->m_LCDx,88 + pMe->m_LCDy);
	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD
	  , (AECHAR*)(pMe->str), -1, 32 + pMe->m_LCDx, 90 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD
	  , (AECHAR*)(pMe->str2), -1, 32 + pMe->m_LCDx, 103 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);

	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)"OK닫기    다음▶", -1, 7 + pMe->m_LCDx, 3 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
}

/*==============================================================================================================================================================
SUB_GAME_STORY
============================================================================================================================================================== */
static void UpdateGameModeStory(CIHaida* pMe)
{
}

static void DrawGameModeStory(CIHaida*	pMe)
{
}

/*==============================================================================================================================================================
SUB_GAME_SURVIVAL
============================================================================================================================================================== */
static void UpdateGameModeSurv(CIHaida* pMe)
{
}

static void DrawGameModeSurv(CIHaida*	pMe)
{
	AEERect rect;

	if(pMe->m_nSubState == AX_SUBSTATE_PREPARE)
	{
		FillBlack(pMe);
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pActor[2], 42+pMe->m_LCDx, 33-15+pMe->m_LCDy);

		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pTotem, 21+pMe->m_LCDx, 50-15+pMe->m_LCDy);
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pTotem, 74+pMe->m_LCDx, 50-15+pMe->m_LCDy);
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pS_Title, 19+pMe->m_LCDx, 5+pMe->m_LCDy);
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pSmile_Hero, 50+pMe->m_LCDx, 59-15+pMe->m_LCDy);

		rect.x = 6+pMe->m_LCDx;
		rect.y = 70+pMe->m_LCDy;
		rect.dx = 113-6;
		rect.dy = 118-70;
		//IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, COLOR_INDEX_0, COLOR_INDEX_85, IDF_RECT_FILL | IDF_RECT_FRAME);
		IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, MAKE_RGB(192,64,255), IDF_RECT_FILL);
		IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, MAKE_RGB(255,255,255), NULL, IDF_RECT_FRAME);

		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)"7 칸중 토템 4개가 ", -1, 10 + pMe->m_LCDx, 74 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)"모이면 사라집니다.", -1, 10 + pMe->m_LCDx, 89 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD, (AECHAR*)"콤보면 점수더블!! ", -1, 10 + pMe->m_LCDx, 104 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);


	}
	else
	{
	}

}

/*==============================================================================================================================================================
RANKING
============================================================================================================================================================== */
static void UpdateEnding(CIHaida* pMe)
{
	if(pMe->m_nPressedKey == AVK_RIGHT)
	{
		pMe->m_nEndingCount++;
		if(pMe->m_nEndingCount > 4)
			pMe->m_nEndingCount = 4;
	}

	switch(pMe->m_nEndingCount)
	{
	case 0:
		break;
	case 1:
		break;
	case 2:
		break;
	case 3:
		SOUND(pMe, 6);
		pMe->m_nEndingCount++;
		pMe->m_nEndingProcess = 0;
		break;
	case 4:
		pMe->m_nEndingProcess++;
		if(pMe->m_nEndingProcess == 700)
		{
			pMe->m_nEndingProcess = 0;
			pMe->m_nEndingCount++;
		}
		if(pMe->m_nPressedKey == AVK_SELECT)
		{
			pMe->m_nEndingProcess = 0;
			pMe->m_nEndingCount++;
		}
		break;
	case 5:
		//ToRanking
		pMe->m_nNetSubCnt = 0;
		pMe->m_nSubCnt = 0;
		pMe->m_nProjectState = AX_PROJECT_ASKAFTER;

		break;
	}
	DrawEnding(pMe);
}

static void DrawEnding(CIHaida* pMe)
{
	AEERect rect;
	int i;
	char ending_str[40];
	//char ending_str[63][30] ={"우리는  이  땅을",	 	"우리조상들로부터",		"물려  받은  것이",		"아니라  우리 ",		"아이들로부터",						"빌려  온  것이다.",	"헤이다( H a i d a ) 족",		"인디언  속담. . ",		" ",				"- 수우족  기도문- ", "바람  속에  당신의",						"목소리가  있고",		"당신의  숨결이",			"세상  만물에게",		"생명을  줍니다.",		"나는  당신의  많은",						"자식들  가운데",		"작고  힘없는  아이",		"입니다. ",			"내게  당신의  힘과",	"지혜를  주소서. ",						"나로  하여금",		"아름다움  안에서",		"걷게하시고",			"내  두  눈이  오래",	"도록  석양을  바라",						"볼  수  있게하소서. ",	"당신이  만든  물건",		"들을  내  손이",		"존중하게  하시고",	"당신의  목소리를",						"들을  수  있도록",		"내  귀를  예민하게",		"하소서. ",			"당신이  내  부족",		"사람들에게  가르",						"쳐  준  것들을",		"나  또한  알게",			"하시고  당신이",		"모든  나뭇잎, ",		"모든  돌  틈에",						"감춰둔  교훈들을",	"나  또한  배우게",			"하소서. ",			"내  형제들보다",		"더  위대해  지기",						"위해서가  아니라",	"가장  큰  적인",			"내  자신과  싸울수",	"있도록  내게  힘을",	"주소서. ",						"나로  하여금",		"깨끗한  손",				"똑바른  눈으로",		"언제라도  당신",		"에게  갈수  있도록",						"준비시켜  주소서.",	"그래서  저  노을이",		"지듯이  내  목숨이",	"사라질때  내  혼이",	"부끄럼없이  당신",						"에게  갈  수  있게",	"하소서" };
	//char (*ending_str)[63];
	//*(ending_str) = "우리";
	
	FillBlack(pMe);
	if(pMe->m_nEndingCount < 4)
	{
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pEnding_bg, 0+pMe->m_LCDx,0);
		if(pMe->m_nTimerCounter %2)
		{
			NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pTotem, 0+pMe->m_LCDx,0+pMe->m_LCDy);
			NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pTotem, 32+pMe->m_LCDx,0+pMe->m_LCDy);
			NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pTotem, 64+pMe->m_LCDx,0+pMe->m_LCDy);
			NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pTotem, 96+pMe->m_LCDx,0+pMe->m_LCDy);
		}
		else
		{
			NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pWTOTEM, 0+pMe->m_LCDx,0+pMe->m_LCDy);
			NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pWTOTEM, 32+pMe->m_LCDx,0+pMe->m_LCDy);
			NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pWTOTEM, 64+pMe->m_LCDx,0+pMe->m_LCDy);
			NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pWTOTEM, 96+pMe->m_LCDx,0+pMe->m_LCDy);
		}
	}
	else
	{
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pPaper, 4+pMe->m_LCDx,2+pMe->m_LCDy);
	}
	switch(pMe->m_nEndingCount)
	{
	case 0:
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBulldozer, 11+pMe->m_LCDx, 30+pMe->m_LCDy);
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pTalk_Menu, 0+pMe->m_LCDx, 84+pMe->m_LCDy);
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD
			  , (AECHAR*)"잉잉~~~~~!!!", -1, 32+pMe->m_LCDx, 89+pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pFace[6], 3+pMe->m_LCDx, 88+pMe->m_LCDy);
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD
			  , (AECHAR*)"다음▶", -1, 83+pMe->m_LCDx, 3+pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
		break;
	case 1:
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBulldozer, 11+pMe->m_LCDx,30+pMe->m_LCDy);
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pActor[3], 12+pMe->m_LCDx, 34+pMe->m_LCDy);
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pTalk_Menu, 0+pMe->m_LCDx, 84+pMe->m_LCDy);
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD
			  , (AECHAR*)"우리가 해냈어 ", -1, 32+pMe->m_LCDx, 90+pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD
			  , (AECHAR*)"요~~~!!!", -1, 32+pMe->m_LCDx, 103+pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pFace[1], 3+pMe->m_LCDx, 88+pMe->m_LCDy);
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD
			  , (AECHAR*)"다음▶", -1, 83+pMe->m_LCDx, 3+pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);

		break;
	case 2:
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pBulldozer, 11+pMe->m_LCDx,30+pMe->m_LCDy);
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pActor[2], 77+pMe->m_LCDx, 19+pMe->m_LCDy);
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pSmile_Hero, 85+pMe->m_LCDx, 45+pMe->m_LCDy);
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pActor[3], 12+pMe->m_LCDx,34+pMe->m_LCDy);
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pTalk_Menu, 0+pMe->m_LCDx,84+pMe->m_LCDy);
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD
			  , (AECHAR*)"헤이다가 마을을 ", -1, 32+pMe->m_LCDx, 90+pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD
			  , (AECHAR*)"살려냈구나", -1, 32+pMe->m_LCDx, 103+pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
		NBM_Draw2(pMe->a.m_pIDisplay, AEE_RO_TRANSPARENT,pMe->pFace[0], 3+pMe->m_LCDx, 88+pMe->m_LCDy);
		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD
			  , (AECHAR*)"다음▶", -1, 83+pMe->m_LCDx, 3+pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);

		break;
	case 3:
		break;
	case 4:
		
		
		rect.x = 10 +pMe->m_LCDx;
		rect.y = 10 +pMe->m_LCDy;
		rect.dx = 100;
		rect.dy = 100;
		
		IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_3);
		for(i = 0; i <63; i++)
		{
			if(110-(pMe->m_nEndingProcess *2) +(i*20) > 0
				&& 110-(pMe->m_nEndingProcess *2) +(i*20) < pMe->di.cyScreen)
			{
				switch(i)
				{
					case 0:STRCPY( ending_str, "우리는 이 땅을" );break;
					case 1:STRCPY( ending_str, "우리조상들로부터" );break;
					case 2:STRCPY( ending_str, "물려 받은 것이" );break;
					case 3:STRCPY( ending_str, "아니라 우리 " );break;
					case 4:STRCPY( ending_str, "아이들로부터" );break;
					case 5:STRCPY( ending_str, "빌려 온  것이다." );break;
					case 6:STRCPY( ending_str, "헤이다(Haida)족 " );break;
					case 7:STRCPY( ending_str, "인디언 속담..   " );break;
					case 8:STRCPY( ending_str, "  " );break;
					case 9:STRCPY( ending_str, "-수우족 기도문- " );break;
					case 10:STRCPY( ending_str, "바람 속에 당신의" );break;
					case 11:STRCPY( ending_str, "목소리가 있고 " );break;
					case 12:STRCPY( ending_str, "당신의 숨결이 " );break;
					case 13:STRCPY( ending_str, "세상 만물에게 " );break;
					case 14:STRCPY( ending_str, "생명을 줍니다." );break;
					case 15:STRCPY( ending_str, "나는 당신의 많은" );break;
					case 16:STRCPY( ending_str, "자식들 가운데 " );break;
					case 17:STRCPY( ending_str, "작고 힘없는 아이" );break;
					case 18:STRCPY( ending_str, "입니다. " );break;
					case 19:STRCPY( ending_str, "내게 당신의 힘과" );break;
					case 20:STRCPY( ending_str, "지혜를 주소서.  " );break;
					case 21:STRCPY( ending_str, "나로 하여금 " );break;
					case 22:STRCPY( ending_str, "아름다움 안에서 " );break;
					case 23:STRCPY( ending_str, "걷게하시고" );break;
					case 24:STRCPY( ending_str, "내 두 눈이 오래 " );break;
					case 25:STRCPY( ending_str, "도록 석양을 바라" );break;
					case 26:STRCPY( ending_str, "볼 수 있게하소서. " );break;
					case 27:STRCPY( ending_str, "당신이 만든 물건" );break;
					case 28:STRCPY( ending_str, "들을 내 손이" );break;
					case 29:STRCPY( ending_str, "존중하게 하시고 " );break;
					case 30:STRCPY( ending_str, "당신의 목소리를 " );break;
					case 31:STRCPY( ending_str, "들을 수 있도록" );break;
					case 32:STRCPY( ending_str, "내 귀를 예민하게" );break;
					case 33:STRCPY( ending_str, "하소서. " );break;
					case 34:STRCPY( ending_str, "당신이 내 부족" );break;
					case 35:STRCPY( ending_str, "사람들에게 가르 " );break;
					case 36:STRCPY( ending_str, "쳐 준 것들을" );break;
					case 37:STRCPY( ending_str, "나 또한 알게" );break;
					case 38:STRCPY( ending_str, "하시고 당신이 " );break;
					case 39:STRCPY( ending_str, "모든 나뭇잎," );break;
					case 40:STRCPY( ending_str, "모든 돌 틈에" );break;
					case 41:STRCPY( ending_str, "감춰둔 교훈들을 " );break;
					case 42:STRCPY( ending_str, "나 또한 배우게" );break;
					case 43:STRCPY( ending_str, "하소서. " );break;
					case 44:STRCPY( ending_str, "내 형제들보다 " );break;
					case 45:STRCPY( ending_str, "더 위대해 지기" );break;
					case 46:STRCPY( ending_str, "위해서가 아니라 " );break;
					case 47:STRCPY( ending_str, "가장 큰 적인  " );break;
					case 48:STRCPY( ending_str, "내 자신과 싸울수" );break;
					case 49:STRCPY( ending_str, "있도록 내게 힘을" );break;
					case 50:STRCPY( ending_str, "주소서. " );break;
					case 51:STRCPY( ending_str, "나로 하여금 " );break;
					case 52:STRCPY( ending_str, "깨끗한 손 " );break;
					case 53:STRCPY( ending_str, "똑바른 눈으로 " );break;
					case 54:STRCPY( ending_str, "언제라도 당신 " );break;
					case 55:STRCPY( ending_str, "에게 갈수 있도록" );break;
					case 56:STRCPY( ending_str, "준비시켜 주소서." );break;
					case 57:STRCPY( ending_str, "그래서 저 노을이" );break;
					case 58:STRCPY( ending_str, "지듯이 내 목숨이" );break;
					case 59:STRCPY( ending_str, "사라질때 내 혼이" );break;
					case 60:STRCPY( ending_str, "부끄럼없이 당신 ");break;
					case 61:STRCPY( ending_str, "에게 갈 수 있게 " );break;
					case 62:STRCPY( ending_str, "하소서" );break;

				}
	
				IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD
					  , (AECHAR*)(ending_str), -1, 13 +pMe->m_LCDx, 110-(pMe->m_nEndingProcess *2) +(i*20) + pMe->m_LCDx, &rect, IDF_TEXT_TRANSPARENT);
			}

		}
//					RestoreLCD();	
//					SetClip(10, 10, 110, 109 );	
//		for ( i = 0; i <= 62; i++ )
//		{
//			if( ((pMe->ending_t_y + pMe->y) >= 0) || ((pMe->ending_t_y + pMe->y) <=120) )
//			{
//				IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD
//					  , (AECHAR*)(ending_str[i]), -1, pMe->ending_t_x, pMe->ending_t_y, 0, IDF_TEXT_TRANSPARENT);
//
//			}
//							DrawText( ending_t_x, ending_t_y + y, ending_str[i] );
//			pMe->y+=16;
//		}
//		pMe->y = 0;
//		pMe->ending_t_y-=7;
//		if( pMe->ending_t_y <= -990 )
//		{
//		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD
//			  , (AECHAR*)"이용해  주셔서", -1, 20+pMe->m_LCDx,45+pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
//		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_BOLD
//			  , (AECHAR*)"감사합니다", -1, 30+pMe->m_LCDx, 60+pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);

//						DrawText( 20, 45, "이용해 주셔서" );
//						DrawText( 30, 60, "감사합니다" );
//		}
//					ResetClip();

		break;
	}
}
/*==============================================================================================================================================================
RANKING
============================================================================================================================================================== */
static void UpdateRanking(CIHaida* pMe)
{
	if(!pMe->m_bSuccess)
	{
		if(pMe->m_nPressedKey == AVK_SELECT)
		{
			SOUND(pMe, 8);
			pMe->m_nProjectState = AX_PROJECT_MAIN;
		}

	}
	DrawRanking(pMe);
}
static void DrawRanking(CIHaida* pMe)
{
	AEERect rect;

	FillBlack(pMe);

	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL
			  , (AECHAR*)"랭킹을 보실려면 ", -1, 2 + pMe->m_LCDx, 3 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL
			  , (AECHAR*)"모빌샵[네트워크게임]", -1, 2 + pMe->m_LCDx, 18 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL
			  , (AECHAR*)"메뉴내에서", -1, 2 + pMe->m_LCDx, 33 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL
			  , (AECHAR*)"'마이랭킹팩'을", -1, 1 + pMe->m_LCDx, 48 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL
			  , (AECHAR*)"다운받아서", -1, 2 + pMe->m_LCDx, 65 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL
			  , (AECHAR*)"설치하셔야합니다", -1, 1 + pMe->m_LCDx, 80 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);

	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL
			  , (AECHAR*)"OK닫기", -1, 42 + pMe->m_LCDx, 100 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);

	rect.x = 41 + pMe->m_LCDx;
	rect.y = 98 + pMe->m_LCDy;
	rect.dx = 37;
	rect.dy = 15;
	IDISPLAY_DrawRect(pMe->a.m_pIDisplay, &rect, NULL, COLOR_INDEX_18, IDF_RECT_FILL);

	
	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL
			  , (AECHAR*)"OK닫기  ", -1, 42 + pMe->m_LCDx, 100 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);

}



//=======================================

static void VIB(CIHaida*	pMe, uint16 ui16Duration )
{
	//VibrationStateCheck
	if( pMe->m_nVibState )
	{
		if(pMe->m_pISound)ISOUND_StopVibrate (pMe->m_pISound);
		pMe->m_pISound = NULL;

		if(pMe->m_pISound == NULL)
		{
			ISHELL_CreateInstance(pMe->a.m_pIShell, AEECLSID_SOUND, (void **)&pMe->m_pISound);
			
			if(pMe->m_pISound)
			{
				ISOUND_Vibrate(pMe->m_pISound, ui16Duration);
			}
		}
		
	}
}

static void StopSound(CIHaida* pMe)
{
	
	if(pMe->m_pISoundPlayer)
	{
		ISOUNDPLAYER_Stop(pMe->m_pISoundPlayer);
		pMe->m_pISoundPlayer = NULL;
	}

	if(pMe->m_pSndBuffer)
	{
		ISHELL_FreeResData(pMe->a.m_pIShell, pMe->m_pSndBuffer);
		pMe->m_pSndBuffer = NULL;
	}

}

static void SOUND(CIHaida*	pMe, uint16 ui16Index )
{
//	FileInfo fi;
//	IFile * pIFile1;
//	char* szFileName;
	//AEESoundPlayerInfo	*pInfo;
	
	//SoundStateCheck
	if( pMe->m_nSoundState )
	{		
//		if(pMe->m_pISoundPlayer)ISOUNDPLAYER_Stop(pMe->m_pISoundPlayer);
//		pMe->m_pISoundPlayer = NULL;

		StopSound(pMe);
//		if(pMe->m_pISoundPlayer)
//		{
//			return;
//		}

		if( ISHELL_CreateInstance(pMe->a.m_pIShell, AEECLSID_SOUNDPLAYER, (void **)&pMe->m_pISoundPlayer) != SUCCESS)
			return;

		if(pMe->m_pISoundPlayer)
		{
			ui16Index++;
			pMe->m_pSndBuffer = (byte*)ISHELL_LoadResData (pMe->a.m_pIShell,
															HAIDA_SND_FILE, // resource file name
															ui16Index, // resouce id
															RESTYPE_IMAGE); // use RESTYPE_IMAGE

			ISOUNDPLAYER_Set(pMe->m_pISoundPlayer,
							SDT_BUFFER, // not file type but buffer type
							(void *)(pMe->m_pSndBuffer+ 12));
			ISOUNDPLAYER_Play(pMe->m_pISoundPlayer); //
		}
	}
}

static void	FillBlack(CIHaida*pMe)
{
	AEERect rect;
	rect.x = 0;
	rect.y = 0;
	rect.dx = pMe->di.cxScreen;
	rect.dy = pMe->di.cyScreen;
	IDISPLAY_FillRect(pMe->a.m_pIDisplay, &rect, 0);
}

static void	FillWhite(CIHaida*pMe)
{
	AEERect rect;
	rect.x = 0;
	rect.y = 0;
	rect.dx = pMe->di.cxScreen;
	rect.dy = pMe->di.cyScreen;
	IDISPLAY_FillRect(pMe->a.m_pIDisplay, &rect, MAKE_RGB(0xff,0xff,0xff));
}


static void Text_Out(CIHaida*	pMe, int x, int y)
{
	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, x + pMe->m_LCDx, y + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
}

static void LightText_Out(CIHaida* pMe, int x, int y, RGBVAL rgbText, RGBVAL rgbLight )	//인수로 string을 받아올수 없으므로 전역변수 str을 반드시 선언해야하고
{															//함수를 호출할때 StrCpy()함수로 str의 값을 반드시 만들어 주어야 한다.
	IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,rgbLight);
	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, x + 1 + pMe->m_LCDx, y - 1 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, x + 1 + pMe->m_LCDx, y + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, x + 1 + pMe->m_LCDx, y + 1 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);

	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, x + pMe->m_LCDx, y - 1 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, x + pMe->m_LCDx, y + 1 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);

	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, x - 1 + pMe->m_LCDx, y - 1 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, x - 1 + pMe->m_LCDx, y + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, x - 1 + pMe->m_LCDx, y + 1 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);

	IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,rgbText);
	IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, x + pMe->m_LCDx, y + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
	IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,COLOR_INDEX_0);
}







/*/////////////////////////////////Network

static boolean Haida_OpenNetwork(CIHaida* pMe)
{
    ISHELL_CreateInstance(pMe->a.m_pIShell, 
                            AEECLSID_NET, 
                            (void **)&(pMe->m_pINet));
    if (!pMe->m_pINet) {
		//Process Change. show can't open network

//	FreeAppData((IApplet *)pMe);
	return FALSE;
    }

    return TRUE;
}
static boolean Haida_CloseNetwork(CIHaida* pMe)
{
    if (pMe->m_pINet) {
	INETMGR_Release(pMe->m_pINet);
	pMe->m_pINet = NULL;
    }

    return TRUE;
}

static boolean Haida_OpenSocket(CIHaida* pMe)
{
	int	    iConnect;
	pMe->m_pISock =  INETMGR_OpenSocket(pMe->m_pINet, 
										   AEE_SOCK_STREAM);
	// 빌컴 포인터 생성
	ISHELL_CreateInstance(pMe->a.m_pIShell, 
										 AEECLSID_BILLCOM , 
 						   (void **)&(pMe->m_pIBillCommMgr));
	IEB_KTF_COM_SetNetMgr(pMe->m_pIBillCommMgr, 
		pMe->m_pINet, pMe->m_pISock);
//	iConnect = IEB_KTF_COM_Connect(pMe->m_pIBillCommMgr
//									, Haida_ConnectCB, pMe, FALSE);  
	return TRUE;
}

static boolean Haida_CloaseSocket(CIHaida* pMe)
{
	return TRUE;
}

static void Haida_ConnectCB(CIHaida* pMe, int nError)
{
}



/////////////위까진 사용하지 않음.
//*/
static void Init_SocketData(CIHaida *pMe)
{
	pMe->m_pINet = 0;
	pMe->m_pISock = 0;
	pMe->m_pIBillCommMgr = 0;  
	MEMSET(&pMe->m_Read_Buffer, 0, sizeof(pMe->m_Read_Buffer));
	pMe->m_ReadData_Size = 0;     //실제 데이터 사이즈 
	pMe->m_Rv_Size = 0;
}


static void Start_Socket(CIHaida *pMe)
{
	INAddr nodeINAddr;                           // IP address in network byte order

	MEMSET(pMe->m_Read_Buffer, NULL, sizeof(pMe->m_Read_Buffer));
	
	if (ISHELL_CreateInstance(pMe->a.m_pIShell, AEECLSID_NET, (void**)(&pMe->m_pINet)) != SUCCESS)
	{
		   Release_SocketData(pMe);
		   return; 
	}

	pMe->m_pISock = INETMGR_OpenSocket(pMe->m_pINet, AEE_SOCK_STREAM);
	if (!pMe->m_pISock) 
	{
		  Release_SocketData(pMe);
		  return;
	}

	nodeINAddr = xConvertToINAddr(SERVER_IP);

	// 빌컴 접속을 위한 처리
	if(ISHELL_CreateInstance( pMe->a.m_pIShell, AEECLSID_BILLCOM, (void **)(&pMe->m_pIBillCommMgr))!= SUCCESS)
	{
		 Release_SocketData(pMe);
		 return;
	}

	IEB_KTF_COM_SetNetMgr(pMe->m_pIBillCommMgr, pMe->m_pINet, pMe->m_pISock );

	IEB_KTF_COM_Connect(pMe->m_pIBillCommMgr, (PFNCONNECTCB)Socket_ConnectCB, pMe, FALSE);
}

static void Socket_ConnectCB(void *cxt, int err)
{
	CIHaida *pMe = (CIHaida*)cxt;

	if (err) 
	{
//		xStatus(pMe, 3, "소켓 연결 에러");
		Release_SocketData(pMe);

		return;
	}

	Send_Data(pMe);
}

static void Send_Data(void *cxt)
{
	CIHaida *pMe = (CIHaida*)cxt;
	int nTempScore;
	int  rv = 0; 

	
	char Buffer[100];// = "안녕하세요";



	int  Buffer_Size = sizeof(Buffer);

	INAddr nodeINAddr; 

	nodeINAddr = xConvertToINAddr(SERVER_IP);

	MEMSET(Buffer, NULL, sizeof(Buffer));
	
	MEMSET(Buffer, 0x03, 1);
	MEMSET(Buffer+1, 0xff, 3);
//	Buffer[0] = 0x03;
//	Buffer[1] = 0xff;
//	Buffer[2] = 0xff;
//	Buffer[3] = 0xff;

	if(pMe->m_nProjectState == AX_PROJECT_ASKBEFORE)
	{
		MEMSET(Buffer + 4, 0, 8);
	}
	else if(pMe->m_nProjectState == AX_PROJECT_ASKAFTER)
	{
		nTempScore = pMe->m_nScore + pMe->m_nFeatherNum * 20000;
		if(!pMe->m_nGameMode)
		{
			MEMCPY(Buffer +4, &nTempScore, 4);
			MEMSET(Buffer + 8, 0, 4);
		}
		else
		{
			MEMSET(Buffer +4, 0, 4);
			MEMCPY(Buffer +8, &nTempScore, 4);
		}
	}

	
	//파일을 모두 남김없이 전송한다.
	pMe->m_Rv_Size = 0;	
	while ((sizeof(Buffer) - pMe->m_Rv_Size) > 0) 
	{
		rv = IEB_KTF_COM_Write( pMe->m_pIBillCommMgr,
									  (byte*)(Buffer + pMe->m_Rv_Size),
									  (uint16)(Buffer_Size - pMe->m_Rv_Size), 
									  nodeINAddr, 
									  SERVER_PORT 
								);

		pMe->m_Rv_Size += rv;

		if(rv == AEE_NET_WOULDBLOCK) 
		{
			ISOCKET_Writeable(pMe->m_pISock, Send_Data, (void *)pMe);

			return;
		} 
		if(rv == AEE_NET_ERROR) 
		{
			pMe->m_nNetSubCnt = 3;
			pMe->m_nSubCnt = 0;
			Release_SocketData(pMe);
			return;
		}       
	}

	//전송이 완료되면 다음 콜백 함수 등록 (리스트가 있는지 없는지에 따라 각각 처리한다)
	if((Buffer_Size - pMe->m_Rv_Size) == 0)
	{
		pMe->m_Rv_Size = 0;
		pMe->m_nSubCnt = 0;
		pMe->m_nNetSubCnt = 2;
		//과금 헤더 패킷을 받기 위해 과금 헤더 수신 함수를 등록한다.
		ISOCKET_Readable(pMe->m_pISock, Read_MacsHeaderPkt, (void *)pMe);
	}
}

static void Read_MacsHeaderPkt(void *cxt)
{
//	int i;
	CIHaida *pMe = (CIHaida*)cxt;

	MacsHeaderPkt  Pkt;
	int rv = 0;
	char   achSignature2[4] = {0};

	int Pkt_Size = sizeof(MacsHeaderPkt);


	//ISHELL_CloseApplet(pMe->a.m_pIShell, FALSE);


	rv = ISOCKET_Read(pMe->m_pISock,
						 (char*)(pMe->m_Read_Buffer + pMe->m_Rv_Size), 
						 (Pkt_Size - pMe->m_Rv_Size)
							);

	if(rv)
	{
		pMe->m_Rv_Size += rv;

		
//		FillBlack(pMe);
//		SPRINTF(pMe->str, "1:%d 2:%d 3:%d", pMe->m_Rv_Size, Pkt_Size, rv);
//		IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,MAKE_RGB(0xff,0xff,0xff));
//		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 2 + pMe->m_LCDx, 10 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
//		IDISPLAY_Update(pMe->a.m_pIDisplay);

		//패킷 데이터를 다 못 받았을 때 처리  
		if(Pkt_Size > pMe->m_Rv_Size)
		{
				ISOCKET_Readable(pMe->m_pISock, Read_MacsHeaderPkt, (void*)pMe);
				return;
		}

		//수신 받은 버퍼의 내용을 과금 구조체에 복사한다                
		MEMSET(&Pkt, 0x00, sizeof(MacsHeaderPkt));
		MEMCPY(&Pkt, pMe->m_Read_Buffer, sizeof(MacsHeaderPkt));

		//실제 받을 데이터 사이즈 설정 
		//pMe->m_ReadData_Size = NTOHL(Pkt.uiLen);
		pMe->m_ReadData_Size = Pkt.uiLen;
		pMe->m_ReadData_Size = 84;


	

		//긴급 공지 여부를 체크
		STRCPY(achSignature2, Pkt.achSignature2);

		//ISHELL_CloseApplet(pMe->a.m_pIShell, FALSE);

		if(STRNCMP(achSignature2, "BCEN", 4) == 0)
		{
				//적절한 처리 요망 
				/*
				긴급공지 처리
				개발중인 모든 어플리케이션들은 긴급공지사항이라는 것을 처리하여야 합니다. 
				긴급공지는 클라이언트에서 서버로 처음 접속할 때 패킷이 서버로 가지 않고 목동의 MACS에서
				수신을 단절 시키고 대신 임의의 문자열을 보내 주는 것으로써, 빌컴 헤더의 ACHSIGNATURE2 
				값이 ‘BCEN’인 경우엔 긴급공지가 MACS에서 온 것으로 판단하고 그때의 BODY를 읽어 공지
				사항을 화면에 보여주면 됩니다. 
				공지 사항을 보여주고 난후 클라이언트에서는 사용중인 소켓을 닫고 네트웍을 종료하고 해당 
				어플리케이션을 종료합니다.
				*/
			//i = 0;
			//수신 버퍼 초기화		
			
			pMe->m_ReadData_Size = Pkt.uiLen;

			MEMSET(&pMe->m_Read_Buffer, 0, sizeof(pMe->m_Read_Buffer));
			//수신 사이즈 초기화 
			pMe->m_Rv_Size = 0;

			ISOCKET_Readable(pMe->m_pISock, Read_Emergency, (void*)pMe);
			//ISHELL_CloseApplet(pMe->a.m_pIShell, FALSE);
			return;
		}
		
		//ISHELL_CloseApplet(pMe->a.m_pIShell, FALSE);

		//수신 버퍼 초기화			
		MEMSET(&pMe->m_Read_Buffer, 0, sizeof(pMe->m_Read_Buffer));
		//수신 사이즈 초기화 
		pMe->m_Rv_Size = 0;

		ISOCKET_Readable(pMe->m_pISock, Read_Data, (void*)pMe);
	}
	if (rv == AEE_NET_WOULDBLOCK)
	{
		ISOCKET_Readable(pMe->m_pISock, Read_MacsHeaderPkt, (void*)pMe);
		return;
	} 
	if (rv == AEE_NET_ERROR || rv <= 0)
	{
		//소켓 해제 
			pMe->m_nNetSubCnt = 3;
			pMe->m_nSubCnt = 0;

		Release_SocketData(pMe);
		return;
	}
}

static void Read_Emergency(void *cxt)
{
	CIHaida *pMe = (CIHaida*)cxt;

	int  rv = 0;

	rv = ISOCKET_Read(  pMe->m_pISock,
					  (char*)(pMe->m_Read_Buffer + pMe->m_Rv_Size), 
					  (pMe->m_ReadData_Size - pMe->m_Rv_Size)
					);
	if (rv > 0)
	{
		pMe->m_Rv_Size += rv;

		//데이터를 다 받지 못했으면 모두 수신 하도록 처리한다  
		if(pMe->m_Rv_Size < pMe->m_ReadData_Size)
		{
				//Read_Data 함수를 다시 등록 한다 
				ISOCKET_Readable(pMe->m_pISock, Read_Emergency, (void *)pMe);

				return;
		}

//		ISHELL_CloseApplet(pMe->a.m_pIShell, FALSE);

//Test Code
		


		pMe->m_Rv_Size = 0;

		pMe->m_nProjectState = AX_PROJECT_EMERGENCY;
		pMe->m_nSubCnt = 0;


		//소켓 해제 
		Release_SocketData(pMe);
	}
	if (rv == AEE_NET_WOULDBLOCK)
	{
		ISOCKET_Readable(pMe->m_pISock, Read_Emergency, (void*)pMe);
		return;
	} 
	if (rv == AEE_NET_ERROR || rv <= 0)
	{
		//소켓 해제 
		pMe->m_nProjectState = AX_PROJECT_EMERGENCY;
		pMe->m_nSubCnt = 0;
//			pMe->m_nNetSubCnt = 3;
//			pMe->m_nSubCnt = 0;

		Release_SocketData(pMe);
		return;
	}

}

static void Read_Data(void *cxt)
{
	CIHaida *pMe = (CIHaida*)cxt;

	int  rv = 0;
//	ISHELL_CloseApplet(pMe->a.m_pIShell, FALSE);
	rv = ISOCKET_Read(  pMe->m_pISock,
					  (char*)(pMe->m_Read_Buffer + pMe->m_Rv_Size), 
					  (pMe->m_ReadData_Size - pMe->m_Rv_Size)
					);
	if (rv > 0)
	{
		pMe->m_Rv_Size += rv;

//		FillBlack(pMe);
//		SPRINTF(pMe->str, "1:%d 2:%d 3:%d", pMe->m_Rv_Size, pMe->m_ReadData_Size, rv);
//		IDISPLAY_SetColor(pMe->a.m_pIDisplay,CLR_USER_TEXT,MAKE_RGB(0xff,0xff,0xff));
//		IDISPLAY_DrawText(pMe->a.m_pIDisplay, AEE_FONT_NORMAL, (AECHAR*)(pMe->str), -1, 2 + pMe->m_LCDx, 10 + pMe->m_LCDy, 0, IDF_TEXT_TRANSPARENT);
//		IDISPLAY_Update(pMe->a.m_pIDisplay);

		//데이터를 다 받지 못했으면 모두 수신 하도록 처리한다  
		if(pMe->m_Rv_Size < pMe->m_ReadData_Size)
		{
				//Read_Data 함수를 다시 등록 한다 
				ISOCKET_Readable(pMe->m_pISock, Read_Data, (void *)pMe);

				return;
		}

//		ISHELL_CloseApplet(pMe->a.m_pIShell, FALSE);

//Test Code
		


		pMe->m_Rv_Size = 0;

		MEMCPY(pMe->m_sData, pMe->m_Read_Buffer + 4, 8*10);

		Release_SocketData(pMe);

		if(pMe->m_nProjectState == AX_PROJECT_ASKBEFORE)
		{
			pMe->m_nNetSubCnt = 4;
			pMe->m_nSubCnt = 0;
			pMe->m_nMaxStoryScore = pMe->m_sData[8].nScore;
			pMe->m_nMaxSurvScore = pMe->m_sData[9].nScore;
			if(!pMe->m_nGameMode)
			{
				pMe->m_nRank = pMe->m_sData[8].nRank;
			}
			else
			{
				pMe->m_nRank = pMe->m_sData[9].nRank;
			}

		}
		else if(pMe->m_nProjectState == AX_PROJECT_ASKAFTER)
		{
			pMe->m_nSubCnt = 0;
			pMe->m_nNetSubCnt= 0;

			pMe->m_nRankState = pMe->m_nGameMode;
			pMe->m_nProjectState = AX_PROJECT_SHOWRANK;
		}

		return;

//		xStatus(pMe, 4, pMe->m_Read_Buffer);

		//소켓 해제 
		
	}
	if (rv == AEE_NET_WOULDBLOCK)
	{
		ISOCKET_Readable(pMe->m_pISock, Read_Data, (void*)pMe);
		return;
	} 
	if (rv == AEE_NET_ERROR || rv <= 0)
	{
		//소켓 해제 
		Release_SocketData(pMe);
			pMe->m_nNetSubCnt = 3;
			pMe->m_nSubCnt = 0;

		return;
	}
}

static INAddr xConvertToINAddr(char *psz)
{
   INAddr ul = 0;
   int nByte = 0;
   char c;

   if(!psz)
      return 0;

   while (ISDIGIT(*psz)) {
      int n = 0;
      while ( ISDIGIT(c=*psz)) {
         n = n*10 + (c - '0');
         ++psz;
      }
      ((char*)&ul)[nByte++] = n;
 
      if (nByte == 4 || *psz != '.')
         break;
 
      ++psz;
   }
#ifndef DOTADDR_NONE
#define DOTADDR_NONE  0xFFFFFFFF
#endif
   
   if (nByte < 4 || ISALNUM(*psz))
      ul = DOTADDR_NONE;

   return ul;
}

static void Release_SocketData(CIHaida *pMe)
{
   if (pMe->m_pISock) 
	{
      ISOCKET_Release(pMe->m_pISock);
      pMe->m_pISock = 0;
   }

   if (pMe->m_pINet) 
	{
	  INETMGR_SetLinger(pMe->m_pINet, 0);
      INETMGR_Release(pMe->m_pINet);
      pMe->m_pINet = 0;
   }
   if(pMe->m_pIBillCommMgr)
   {
	   IEB_KTF_COM_Release(pMe->m_pIBillCommMgr);
		pMe->m_pIBillCommMgr = NULL;
   }
}


/*공통부분
랭킹팩 카테고리안에 어플이 등록되어 있지 않음
빌컴적용 부적합
게임완료후 점수 등록에서 등록된 점수보다 높지만 등록 순위는 더 낮게 등록될때도 있다

다른부분
어플내의 전체화면에서 1cm정도 검은 여백이 있다

PD-5000, LG CX400k
게임완료후 랭킹등록후에 스토리 순위와 서바이벌순위를 번갈아 보다보면 단말기 리부팅
PD-5000, LG CX400k
랭킹 순위 화면에서 5분 무작동하면 단말기 리부팅됨
sph-x4200
게임시작전 랭킹등록 시도시 네트웍에 오류가 발생하였습니다 라는 메세지만 보이고 랭킹등록을 볼수 없음
모토로라 V.711
어플실행후 랭킹팩 연동시켜 랭킹을 보고 있던중 취소키로 이전화면으로 돌아가기를 시도하면 송수신중입니다 라는 메세지가 보이며 이전화면으로 돌아가지 못한다
*/