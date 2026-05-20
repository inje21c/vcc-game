#ifndef __HAIDA_H__
#define	__HAIDA_H__



#define	AX_PROJECT_INTRO		0
#define	AX_PROJECT_MAIN			1
#define	AX_PROJECT_OPTION		2
#define AX_PROJECT_HELP			3
#define AX_PROJECT_STORY		4
#define AX_PROJECT_SURVIVAL		5
#define AX_PROJECT_RANKING		6
#define AX_PROJECT_ENDING		7
#define	AX_PROJECT_ASK			8

#define	AX_PROJECT_ASKBEFORE	9
#define	AX_PROJECT_ASKAFTER		10
#define AX_PROJECT_NET_BEFOREGAME	11
#define AX_PROJECT_NET_AFTERGAME	12
#define AX_PROJECT_FEE			13

#define AX_PROJECT_SHOWRANK		14

#define AX_PROJECT_EMERGENCY	15


#define AX_GAMEMODE_STORY		0
#define AX_GAMEMODE_SURVIVAL	1


#define AX_SUBSTATE_PREPARE		0//include Events
#define AX_SUBSTATE_PLAYING		1
#define	AX_SUBSTATE_GAMECLEAR	2
#define AX_SUBSTATE_CALCULATE	3
#define AX_SUBSTATE_GAMEOVER	4
#define AX_SUBSTATE_PAUSE		99

#define AX_DEF_STAGE_TIME		1000
#define AX_DEF_NEWBLOCK_TIME	80



#define AX_PROCESSBLOCK_NORMAL	0
#define AX_PROCESSBLOCK_SPECIAL	1

/*
#define GAMEOVER	8888	// game_state 에 사용될 상수들
#define S_GAMEOVER	8889
#define S_GAMENEXT	8998
#define S_GAMEIN	8999
#define MENU	 9996
#define START	 9997
#define GAMENEXT 9998
#define GAMEIN   9999
#define CLEAR_BLOCK 3
#define DROP_BLOCK 25

#define DEMO	1000
#define HELP	1500
#define SETUP	1600
#define RANKING 1700
#define YESNO	1800
#define QUIT	1900
#define NET_ERROR 2000
*/


#define STORY_GAMETIME 800

#define ON 1
#define OFF 0

#define MENU_MODE2		12	// menu[]배열에 사용될 상수들
#define MENU_MODE1		9
#define MENU_SETUP		6
#define MENU_RANKING	3
#define MENU_HELP		0


#define B_MAX_Y 12	//블럭의 맥시멈양
#define B_MAX_X 6

#define PUSH 1	//케릭터 애니에 따른 동작
#define LOSE 2
#define VICTORY 4
#define SCORE 5

#define N_TIME 100

#define BOOM_ITEM 1818	//폭탄 아이템
/*
#define VISUAL4	 20	// 22
#define VISUAL3	 13	// 15
#define VISUAL2	 7	//  9
#define VISUAL1	 0	//  1
*/

#define OPENING_LEVEL	0
#define	EVENT1_LEVEL	7
#define	EVENT2_LEVEL	13


#define IDF_PACKET_USERINFO				0x001
#define IDF_PACKET_USERSCORE			0x002
#define IDF_PACKET_QUERYRANKING			0x003
#define IDF_PACKET_QUERYUSERINFO		0x010
#define IDF_PACKET_NOTIFY				0x020
#define IDF_PACKET_RANKKING				0x030
#define IDF_PACKET_RESEND				0x0F0


#define	PLAYER_WIN_X	10
#define PLAYER_WIN_Y	10
#define	PLAYER_LOSE_X	10
#define PLAYER_LOSE_Y	10



//#define MIN(a,b) (a) >= (b) ? (b) : (a)
//#define MAX(a,b) (a) >= (b) ? (a) : (b)


#define COLOR_SCORE_BG	MAKE_RGB(0xff,0xff,0xff)
#define COLOR_INDEX_85	MAKE_RGB(0xff,0xff,0xff)


#define COLOR_INDEX_0	MAKE_RGB(0xff,0xff,0xff)
#define COLOR_INDEX_1	MAKE_RGB(0xC0,0xC0,0xC0)
#define COLOR_INDEX_3	MAKE_RGB(0x00,0x00,0x00)
#define COLOR_INDEX_16	MAKE_RGB(0x00,0x00,0x80)
#define COLOR_INDEX_18	MAKE_RGB(0x00,0x00,0xff)
#define COLOR_INDEX_19	MAKE_RGB(0x00,0x40,0x00)
#define COLOR_INDEX_23	MAKE_RGB(0x00,0x80,0x00)
#define COLOR_INDEX_26	MAKE_RGB(0x00,0x80,0xff)
#define COLOR_INDEX_39	MAKE_RGB(0x00,0xF0,0x00)
#define COLOR_INDEX_42	MAKE_RGB(0x00,0xF0,0xff)
#define COLOR_INDEX_43	MAKE_RGB(0x00,0xff,0x00)
#define COLOR_INDEX_46	MAKE_RGB(0x00,0xff,0xff)
#define COLOR_INDEX_52	MAKE_RGB(0x80,0x40,0x80)
#define COLOR_INDEX_74	MAKE_RGB(0x80,0xff,0x00)
#define COLOR_INDEX_76	MAKE_RGB(0x80,0xff,0xC0)
#define COLOR_INDEX_84	MAKE_RGB(0xC0,0x40,0xC0)
#define COLOR_INDEX_86	MAKE_RGB(0xC0,0x80,0x00)
#define COLOR_INDEX_104	MAKE_RGB(0xC0,0xE0,0xff)
#define COLOR_INDEX_108	MAKE_RGB(0xC0,0xff,0xff)
#define COLOR_INDEX_109	MAKE_RGB(0xff,0xff,0xff)
#define COLOR_INDEX_124	MAKE_RGB(0xff,0xA0,0xff)
#define COLOR_INDEX_125	MAKE_RGB(0xff,0xC0,0x00)
#define COLOR_INDEX_128	MAKE_RGB(0xff,0xC0,0xff)
#define COLOR_INDEX_129	MAKE_RGB(0xff,0xE0,0x00)









#endif//__HAIDA_H__
