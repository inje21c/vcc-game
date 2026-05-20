import java.io.*;
import javax.microedition.midlet.*;
import javax.microedition.lcdui.*;
import javax.microedition.rms.*;
import javax.microedition.io.*;
import java.util.Random;
import mmpp.media.*;
import mmpp.phone.Phone;

public class Haida extends MIDlet
{
	private HaidaCanvas canvasHaida;
	Display display;

	public Haida()
	{
		canvasHaida = new HaidaCanvas(this);
    	display=Display.getDisplay(this);
    }

    public void startApp() throws MIDletStateChangeException
	{
		canvasHaida.initCustom();
		display.setCurrent(canvasHaida);
    }

    public void pauseApp()
	{
    }

    public void destroyApp(boolean unconditional)
	{
		canvasHaida.saveRecord();
    }
}

class HaidaCanvas extends Canvas implements Runnable {
	private byte realStage[][];
	private static final int TOPLEFT = Graphics.LEFT|Graphics.TOP;
	private static final int SOUND_TITLE		= 0;
	private static final int SOUND_VISUAL		= 1;
	private static final int SOUND_HURRYUP		= 2;
	private static final int SOUND_ENDING		= 3;
	private static final int SOUND_FEATHER		= 4;

	private static final int KEY_CANCEL	 	= -8;
	private static final int KEY_SOFTL		= -6;
	private static final int KEY_SOFTR		= -7;

	private int maxProgress = 5;
	private int numProgress = 0;

	private static final int DISPLAY_WIDTH = 120;
	private static final int DISPLAY_HEIGHT = 132;

	private Font font = Font.getFont(Font.FACE_MONOSPACE, Font.STYLE_PLAIN, Font.SIZE_SMALL);
	private Font font2 = Font.getFont(Font.FACE_MONOSPACE, Font.STYLE_PLAIN, Font.SIZE_MEDIUM);

	int startToggle = 0;

	int nToggle = 0;				//애니매이션을 위한 변수
	int nToggle2 = 0;				//애니매이션을 위한 변수
	int gameStage = 1;
	int allProcessFlag = 0;			//하나의 이벤트가 있을때 동기화를 위한 플래그
	int actorY = 10;				//actor의 y 좌표인데 실제 좌료가 아닌 블럭 갯수 만큼의 값
	int blockRectNum = 0;			//블럭을 감싸고 있는 애니매이션을 위해 필요
	int aniBlockY = 0, aniBlockNum = 0, aniBlockFlag = 0;	//좌측에 블럭 애니매이션을 위한 변수
	int stoneFlag = 0;				//현재 스톤의 갯수를 가지고 있는 변수
	int bottomBlockNum = 0;			//현재 떨어진 블럭의 종류를 가지고 있는 변수
	int actorFlag = 0;				//액터가 움직이고 있는지 알아보는 변수
	int bottomClearFlag = 0;		//맨밑의 블럭이 모두 같은 블럭으로 채워졌는지 알아보는 변수
	int gameClearFlag = 0;			//0:게임진행중, 1:모두 클리어, 2:실패
	int comboFlag = 0;				//콤보 갯수
	int mistakeFlag = 0;			//실수한 갯수
	int skillPointNum = 0;
	int gameTime = 900;				//게임 시간
	int storyGameScore = 0;			//스토리 게임 스코어
	int featherFlag = 0;			//현재 깃털이 있는 블럭
	int allFeatherNum = 0;			//전체 깃털의 갯수
	int blockAnimationNum = 0;		//블럭 전체 애니메이션
	int boomFlag = 0;				//폭탄이 터졌는가?
	int t_blockFlag = 0;			//현재 없어진 블럭이 "T" block??


	int s_bottomBlockFlag = 0;		//4개의 같은 블럭을 찾기 위한 변수
	int s_bottomClearFlag = 0;		//0:암것도 없음, 1:같은4개가 들어왔음
	int s_bottomBlockNum = 0;		//현재 없애야하는 넘
	int blockDownTime = 0, blockDownStartTime = 0;	//서바이벌 모드에서의 타임
	int downBlockNum1 = 0, downBlockNum2 = 0;	//랜덤으로 생기는 두개의 블럭
	int survivalGameScore = 0;		//survival mode score

	int readStageNum = 0;			//저장된 스테이지 정보를 읽어서 저장

	private static final int SCENE_TITLE				= 100;
	private static final int SCENE_MENU					= 110;	//메뉴 화면

	private static final int SCENE_GAME_STORY			= 120;	//게임 화면
	private static final int SCENE_STORY_LEFTANI		= 121;	//왼쪽 떨어지는 블럭 애니
	private static final int SCENE_STORY_BOTTOMANI		= 122;	//밑에 블럭 없어지는 애니
	private static final int SCENE_GAME_ITEM			= 123;	//아이템 사용시 추장 나오는 애니
	private static final int SCENE_GAME_BOOM			= 124;	//폭탄 터지는 애니
	private static final int SCENE_GAME_SCORE			= 125;	//스코어 보여주기
	private static final int SCENE_GAME_PAUSE			= 126;	//일시정지
	private static final int SCENE_GAME_PAUSE_PAINT	 	= 127;

	private static final int SCENE_GAME_SURVIVAL		= 150;	//서바이벌 게임 화면
	private static final int SCENE_SURVIVAL_LEFTANI		= 151;	//왼쪽 떨어지는 블럭 애니
	private static final int SCENE_SURVIVAL_BOTTOMANI	= 152;	//밑에 블럭 없어지는 애니
	private static final int SCENE_GAME_ITEM2			= 153;	//아이템 사용시 헤이다 나오는 애니

	private static final int SCENE_SETTING				= 170;	//설정 화면
	private static final int SCENE_HELP					= 171;
	private static final int SCENE_SCORE				= 172;
	private static final int SCENE_ABOUT				= 173;
	private static final int SCENE_PLAY_MENU			= 174;
	private static final int SCENE_GAME_ANI1			= 175;
	private static final int SCENE_GAME_ANI8			= 176;
	private static final int SCENE_GAME_ANI14			= 177;
	private static final int SCENE_GAME_ENDING			= 178;

	private static final int SCENE_GAME_POPUP			= 200;
	private static final int SCENE_RANK_REGIST			= 210;

	int menuNum = 0;
	int nSin = 0;

	int[] nStoryScore = new int[5];
	int[] nSurvivalScore = new int[5];
	private boolean bSound = true;
	private boolean bVib = true;

	private int nCurrentScene	= -999;
	private int nReturnScene	= -1;

	String timeStr = "0", missStr = "0", scoreStr = " = 0";
	String scoreStr2 = " ";	//survival 점수 텍스트

	private static Random rand = new Random();

	//title 화면
	Image titleImg;
	Image gridImg;

	Image gameBackImg;
	Image gameBackTopImg;
	Image gameBackLeftImg;
	Image gameBackBottomImg;
	Image gameBackFeatherImg;
	Image gameBlockImg;
	Image gameStoneImg;
	Image comboImg;
	Image enemyImg[] = new Image[2];
	Image featherNumImg;
	Image boomImg[] = new Image[3];

	//story 화면
	Image gameBackTentImg[] = new Image[2];
	Image imgActor[] = new Image[6];
	Image featherImg[] = new Image[2];
	Image imgLogo;
	Image imgButton[] = new Image[2];

	//survival 화면
	Image imgActor2[] = new Image[4];

	Haida myMidlet;

	private Image bufferedImage;
	private Graphics bufferedGraphics;

	private byte btCount;
	private int endingStart = 13;

	private MediaPlayer mPlayer[] = new MediaPlayer[5];

	public HaidaCanvas(Haida myMidlet) {
		this.myMidlet = myMidlet;

		bufferedImage = Image.createImage(DISPLAY_WIDTH, DISPLAY_HEIGHT);
		bufferedGraphics = bufferedImage.getGraphics();
		nCurrentScene = SCENE_TITLE;
		try{
			titleImg = Image.createImage("/img/title.png");
			gridImg = Image.createImage("/img/grid.png");
			imgLogo = Image.createImage("/img/logo.png");
			mPlayer[0] = new MediaPlayer();
			mPlayer[0].setMediaLocation("/snd/0.mmf");
		}catch(IOException e) { }
		loadRecord();
		mPlayer[0].start();
		BackLight.on(0);
	}

	private boolean bFirstPaint = true;
	synchronized public void paint(Graphics g) {
		g.drawImage(bufferedImage, 0, 0, TOPLEFT);
		if(bFirstPaint)
		{
			g.drawImage(imgLogo, 0, 119, TOPLEFT);
			bFirstPaint = false;
		}

		try{
			notify();
		}catch(Exception e){}
	}

	public void initCustom() {
		drawTitle();
		bufferedGraphics.setFont(font);
	}

	public void run() {
		Thread.currentThread().setPriority(Thread.MAX_PRIORITY);
		loadResource();

		while (true) {
			synchronized (this) {
				switch(nCurrentScene) {
				case SCENE_MENU:
					drawMenu();
					break;
				case SCENE_GAME_STORY:
					drawGame(SCENE_GAME_STORY);
					calculateTime();
					break;
				case SCENE_GAME_ITEM:
					drawItem(0);
					break;
				case SCENE_STORY_LEFTANI:
					drawLeftAni(SCENE_STORY_LEFTANI);
					calculateTime();
					break;
				case SCENE_STORY_BOTTOMANI:
					drawStoryBottomAni();
					break;
				case SCENE_GAME_BOOM:
					drawBoom();
					break;
				case SCENE_RANK_REGIST:
					drawRankRegist();
					break;
				case SCENE_GAME_SCORE:
					drawScore();
					break;
				case SCENE_GAME_PAUSE_PAINT:
					drawPause(nReturnScene);
					break;
				case SCENE_GAME_SURVIVAL:
					drawGame(SCENE_GAME_SURVIVAL);
					calculateTime2();
					break;
				case SCENE_GAME_ITEM2:
					drawItem(1);
					break;
				case SCENE_SURVIVAL_LEFTANI:
					drawLeftAni(SCENE_SURVIVAL_LEFTANI);
					break;
//				case SCENE_SURVIVAL_BOTTOMANI:
//					drawSurvivalBottomAni();
//					break;
				case SCENE_GAME_ANI1:
					drawStage1Ani();
					break;
				case SCENE_GAME_ANI8:
					drawStage8Ani();
					break;
				case SCENE_GAME_ANI14:
					drawStage14Ani();
					break;
				case SCENE_GAME_ENDING:
					drawStageEnding();
					break;
				case SCENE_PLAY_MENU:
					drawPlayMenu();
					break;
				case SCENE_SETTING:
					drawSetting();
					break;
				case SCENE_HELP:
					drawHelp();
					break;
				case SCENE_ABOUT:
					drawAbout();
					break;
				case SCENE_SCORE:
					drawRank();
					break;
				case SCENE_GAME_POPUP:
					drawPopupWindow();
					break;
				}
				repaintAll();
			}
		}
	}

	private boolean bKeyEnable = true;
	public void keyPressed(int nKey) {
		if(!bKeyEnable) return;

		int nMotion = getGameAction(nKey);

		switch(nCurrentScene) {
		case SCENE_TITLE:
			imgLogo = null;
			bKeyEnable = false;
			new Thread(this).start();
			break;

		case SCENE_MENU:
			if (nMotion==UP) {
				menuNum--;
				if (menuNum==-1)
					menuNum = 5;
			} else if (nMotion==DOWN) {
				menuNum++;
				if (menuNum==6)
					menuNum = 0;
			}

			if(KEY_NUM0 < nKey && nKey < KEY_NUM7)
			{
				menuNum = nKey-KEY_NUM1;
				nMotion = FIRE;
			}

			if( nMotion == Canvas.FIRE ) {
				switch (menuNum)
				{
				case 0:
					nCurrentScene = SCENE_PLAY_MENU;
					menuNum = 0;
					break;
				case 1:
					nReturnScene = nCurrentScene;
					nCurrentScene = SCENE_HELP;
					break;
				case 2:
					nReturnScene = nCurrentScene;
					nCurrentScene = SCENE_SETTING;
					menuNum = 0;
					break;
				case 3:
					nCurrentScene = SCENE_RANK_REGIST;
					break;
				case 4:
					nReturnScene = nCurrentScene;
					nCurrentScene = SCENE_ABOUT;
					break;
				case 5:
					myMidlet.notifyDestroyed();
					myMidlet.destroyApp(false);
					break;
				}
			}
			break;

		case SCENE_RANK_REGIST:
			if(nKey == KEY_STAR)
			{
				RankSoket rs = new RankSoket(this);
				rs.writeUserInfo();
				rs.writeScore(0, 100);
//				rs.readData();
//				nReturnScene = nCurrentScene;
//				nCurrentScene = SCENE_SCORE;
			}else if(nKey == KEY_POUND)
				nCurrentScene = SCENE_MENU;
			break;

		case SCENE_PLAY_MENU:
			if(nKey > KEY_NUM0 && nKey < KEY_NUM4)
			{
				menuNum = nKey - KEY_NUM1;
				nMotion = FIRE;
			}else if(nKey == KEY_CANCEL)
			{
				menuNum = 0;
				nCurrentScene = SCENE_MENU;
			}
			switch(nMotion)
			{
				case UP:
					if(menuNum == 0)
						menuNum = 2;
					else
						menuNum--;
					break;
				case DOWN:
					if(menuNum == 2)
						menuNum = 0;
					else
						menuNum++;
					break;
				case FIRE:
					if(menuNum == 1)
					{
						storyGameScore = 0;
						nSin = 0;
						gameTime = 900;
						comboFlag = 0;
						mistakeFlag = 0;
						gameClearFlag = 0;
						blockAnimationNum = 0;
						skillPointNum = 0;
						t_blockFlag = 0;
						boomFlag = 0;
						allFeatherNum = 0;
						startToggle = 0;

						nCurrentScene = SCENE_GAME_STORY;

						if( readStageNum == 0 ) {
							gameStage = 1;
							playSound(mPlayer[SOUND_VISUAL]);
							nCurrentScene = SCENE_GAME_ANI1;
						} else {
							gameStage = readStageNum;
						}

						buildStage(gameStage);

					}else if(menuNum == 2)
					{
						playSound(mPlayer[SOUND_VISUAL]);
						nCurrentScene = SCENE_GAME_SURVIVAL;
						buildStage(SCENE_GAME_SURVIVAL);
						downBlockNum1 = rand(1, 11);	//초기 랜덤값 설정
						downBlockNum2 = rand(1, 11);
						skillPointNum = 5;
					}else if(menuNum == 0)
					{
						storyGameScore = 0;
						nSin = 0;
						gameStage = 1;
						playSound(mPlayer[SOUND_VISUAL]);
						nCurrentScene = SCENE_GAME_ANI1;
						buildStage(gameStage);
					}
					break;
			}
			break;

		case SCENE_GAME_STORY:
			if( allProcessFlag == 0 )	//현재 진행되고 있는것이 암것도 없다면..
			{
				if( gameClearFlag != 2 ) {
					switch(nMotion) {
						case DOWN:
							actorY++;
							if (actorY==11)
								actorY = 10;
							break;
						case UP:
							actorY--;
							if (actorY==-1)
								actorY = 0;
							break;
						case LEFT:
							if ( realStage[actorY+1][0]!=0 ) {	//actor 왼쪽 부분에 블럭이 있다면..
								allProcessFlag = 1;
								pushLeft(SCENE_STORY_LEFTANI);
							}
							break;
						case RIGHT:
							if(realStage[actorY+1][0]!=0) {
								if( skillPointNum >= 5) {
									nCurrentScene = SCENE_GAME_ITEM;
									skillPointNum = skillPointNum - 5;
								}
							}
							break;


/*						case Canvas.FIRE:	//debug 테스트를 위해서 필요..
							for(int i=0; i < 13; i++)
							{
								for(int j=0; j < 8; j++)
								{
									realStage[i][j] = 0;
								}
							}
							break;
*/					}
				}
			}

			if( nMotion==Canvas.FIRE ) {
				if( (realStage[10][0]==0) && (realStage[11][0]==0) ) {	//스테이지가 클리어 되었다면..
					timeStr = gameTime + " x 5 = " + (gameTime*5);
					missStr = mistakeFlag + " x 5 = " + (mistakeFlag*5);
					scoreStr = " = " + ((gameTime*5)-(mistakeFlag*5));
					nCurrentScene = SCENE_GAME_SCORE;
				} else if( gameClearFlag == 2 ) {	//스테이지 실패했다면

					saveRecord();

					storyGameScore = 0;
					nSin = 0;
					gameTime = 900;
					comboFlag = 0;
					mistakeFlag = 0;
					gameClearFlag = 0;
					blockAnimationNum = 0;
					skillPointNum = 0;
					t_blockFlag = 0;
					boomFlag = 0;
					allFeatherNum = 0;
					startToggle = 0;

					nCurrentScene = SCENE_MENU;
					loadRecord();
				}
			} else if(nKey==KEY_STAR || nKey==KEY_SOFTL)
			{
				popupFocus = 0;
				nReturnScene = nCurrentScene;
				nCurrentScene = SCENE_GAME_POPUP;
			}
			else if(nKey==KEY_POUND || nKey==KEY_SOFTR)
			{
				nReturnScene = nCurrentScene;
				nCurrentScene = SCENE_GAME_PAUSE_PAINT;
			}
			break;

		case SCENE_GAME_SURVIVAL:
			if( allProcessFlag == 0 )	//현재 진행되고 있는것이 암것도 없다면..
			{
				if( gameClearFlag != 2 ) {
					switch(nMotion) {
						case DOWN:
							actorY++;
							if (actorY==11)
								actorY = 10;
							break;
						case UP:
							actorY--;
							if (actorY==-1)
								actorY = 0;
							break;
						case LEFT:
							if ( realStage[actorY+1][0]!=0 ) {	//actor 왼쪽 부분에 블럭이 있다면..
								allProcessFlag = 1;
								pushLeft(SCENE_SURVIVAL_LEFTANI);
							}
							break;
						case RIGHT:
							if( skillPointNum >= 5) {
								nCurrentScene = SCENE_GAME_ITEM2;
								skillPointNum = skillPointNum - 5;
							}
							break;
					}
				}
			}

			if( nMotion==Canvas.FIRE ) {
				if( gameClearFlag == 2 ) {	//fail
					blockAnimationNum = 0;
					skillPointNum = 0;
					survivalGameScore = 0;
					nCurrentScene = SCENE_MENU;

					menuNum = 0;

					for(int i=0; i < 13; i++)
					{
						for(int j=0; j < 8; j++)
						{
							realStage[i][j] = 0;
						}
					}

					buildStage(SCENE_GAME_SURVIVAL);
					downBlockNum1 = rand(1, 11);	//초기 랜덤값 설정
					downBlockNum2 = rand(1, 11);
					skillPointNum = 5;
					gameClearFlag = 0;
				}
			} else if(nKey==KEY_STAR || nKey==KEY_SOFTL)
			{
				popupFocus = 0;
				nReturnScene = nCurrentScene;
				nCurrentScene = SCENE_GAME_POPUP;
			}
			else if(nKey==KEY_POUND || nKey==KEY_SOFTR)
			{
				nReturnScene = nCurrentScene;
				nCurrentScene = SCENE_GAME_PAUSE_PAINT;
			}
			break;

		case SCENE_GAME_SCORE:
			if( nMotion==Canvas.FIRE ) {
				storyGameScore = storyGameScore + ((gameTime*5)-(mistakeFlag*5));
				scoreStr = " = " + storyGameScore;

				gameTime = 900;
				comboFlag = 0;
				mistakeFlag = 0;
				gameStage++;
				gameClearFlag = 0;
				blockAnimationNum = 0;
				t_blockFlag = 0;
				boomFlag = 0;
				startToggle = 0;

				buildStage(gameStage);
				featherFlag = rand(1, 11);

				nCurrentScene = SCENE_GAME_STORY;

				switch(gameStage) {
					case 8:
						playSound(mPlayer[SOUND_VISUAL]);
						nCurrentScene = SCENE_GAME_ANI8;
						break;
					case 14:
						playSound(mPlayer[SOUND_VISUAL]);
						nCurrentScene = SCENE_GAME_ANI14;
						break;
					case 21:
						playSound(mPlayer[SOUND_ENDING]);
						saveRecord();
						nCurrentScene = SCENE_GAME_ENDING;
						break;
				}
			}
			break;

		case SCENE_GAME_POPUP:
			keyPressedImplPopup(nKey, nMotion);
			break;

		case SCENE_GAME_PAUSE:
			nCurrentScene = nReturnScene;
			break;

		case SCENE_SETTING:
			keyPressedImplSetting(nKey, nMotion);
			break;

		case SCENE_ABOUT:
		case SCENE_SCORE:
		case SCENE_HELP:
			if(nReturnScene == SCENE_GAME_STORY || nReturnScene == SCENE_GAME_SURVIVAL)
			{
				nCurrentScene = SCENE_GAME_POPUP;
				bFirstPopup = true;
			}else
			{
				nCurrentScene = nReturnScene;
				nReturnScene = -1;
			}
			break;

		case SCENE_GAME_ANI1:
		case SCENE_GAME_ANI8:
		case SCENE_GAME_ANI14:
			nCurrentScene = SCENE_GAME_STORY;
//			bFirstButton = true;
			nSin = 0;
			break;

		case SCENE_GAME_ENDING:
			keyPressedImplEnding(nKey, nMotion);
			break;
		}
	}

	//팝업 메뉴에 관한 KeyPressed
	private void keyPressedImplPopup(int key, int keyCode)
	{
		if(key>KEY_NUM0 && key<KEY_NUM6)
		{
			popupFocus = key-KEY_NUM1;
			keyCode = FIRE;
		}

		switch(keyCode)
		{
			case UP:
				if(popupFocus > 0)
					popupFocus--;
				else
					popupFocus=4;
				break;

			case DOWN:
				if(popupFocus < 4)
					popupFocus++;
				else
					popupFocus=0;
				break;

			case FIRE:
				switch(popupFocus) {
					case 0:
						nCurrentScene = nReturnScene;
						nReturnScene = -1;
						break;
					case 1:
//						nReturnScene = nCurrentScene;
//						bFirstPaint = true;
						nCurrentScene = SCENE_HELP;
						break;
					case 2:
//						bFirstPaint = true;
//						nReturnScene = nCurrentScene;
						nCurrentScene = SCENE_SETTING;
						break;
					case 3:
						saveRecord();
						gameTime = 900;
						comboFlag = 0;
						mistakeFlag = 0;
						gameClearFlag = 0;
						blockAnimationNum = 0;
						t_blockFlag = 0;
						boomFlag = 0;
						nCurrentScene = SCENE_MENU;
						loadRecord();
						break;
					case 4:
						myMidlet.notifyDestroyed();
						myMidlet.destroyApp(false);
						break;
				}
				break;
		}
	}

	private int volume = 3;
	private void keyPressedImplSetting(int nKey, int nAction)
	{
		switch(nAction)
		{
			case UP:
			case DOWN:
				if(menuNum == 0) 		menuNum = 1;
				else if(menuNum == 1) 	menuNum = 0;
				break;
			case RIGHT:
			case LEFT:
				if(menuNum == 0)
				{
					volume = ++volume%6;
					if(volume == 0)
						bSound = false;
					else
						bSound = true;
				}
				else if(menuNum == 1)
					bVib = !bVib;
				break;
			case FIRE:
				changeVolume(volume);
				if(nReturnScene == SCENE_GAME_STORY || nReturnScene == SCENE_GAME_SURVIVAL)
				{
					nCurrentScene = SCENE_GAME_POPUP;
					bFirstPopup = true;
				}else
				{
					nCurrentScene = nReturnScene;
					nReturnScene = -1;
				}
				menuNum = 0;
				break;
		}
	}

	private void keyPressedImplEnding(int nKey, int nMotion)
	{
		if(nSin == 0)	nSin++;
		else {
			nSin = 0;
			gameTime = 900;
			comboFlag = 0;
			mistakeFlag = 0;
			gameClearFlag = 0;
			blockAnimationNum = 0;
			skillPointNum = 0;
			t_blockFlag = 0;
			boomFlag = 0;
			allFeatherNum = 0;
			startToggle = 0;
			gameStage = 1;
			nCurrentScene = SCENE_MENU;
		}
	}

	//****************************************************************************************
	//********************************** drawing start ***************************************
	private void drawTitle() {
		bufferedGraphics.drawImage(titleImg, 0, 0, TOPLEFT);
		bufferedGraphics.drawImage(imgLogo, 0, 119, TOPLEFT);
//		drawCustomString2("Press Any Key", 60, 90, 255, 255, 255);
	}

	private void drawMenu() {
		String[] strMenu = {
			"1.게임시작",
			"2.게임방법",
			"3.환경설정",
			"4.랭킹보기",
			"5.게임문의",
			"6.게임종료"
		};

		bufferedGraphics.drawImage(titleImg, 0, 0, TOPLEFT);
		drawGrid();

		bufferedGraphics.setColor(255,255, 255);
		bufferedGraphics.fillRoundRect(9, 8+(menuNum*18), 102, 16, 7, 5);

		bufferedGraphics.setColor(192, 128, 0);
		bufferedGraphics.fillRoundRect(10, 9+(menuNum*18), 100, 14, 7, 5);

		for(int i=0; i<strMenu.length; i++)
		{
			if(menuNum == i)
			{
				bufferedGraphics.setColor(0xFFE000);
				bufferedGraphics.drawString(strMenu[i], 30, 9+(i*18), TOPLEFT);
			}else {
				bufferedGraphics.setColor(0);
				bufferedGraphics.drawString(strMenu[i], 30, 9+(i*18), TOPLEFT);
				bufferedGraphics.setColor(0xffffff);//0xFFE000
				bufferedGraphics.drawString(strMenu[i], 31, 10+(i*18), TOPLEFT);
			}
		}
	}

	private void drawPlayMenu()
	{
		String[] strPlayMenu = {
			"1. 게임시작",
			"2. 이어하기",
			"3. 서바이벌"
		};
		bufferedGraphics.drawImage(titleImg, 0, 0, TOPLEFT);

		drawGrid();

		bufferedGraphics.setColor(255,255, 255);
		bufferedGraphics.fillRoundRect(9, 29+(menuNum*25), 102, 16, 7, 5);

		bufferedGraphics.setColor(192, 128, 0);
		bufferedGraphics.fillRoundRect(10, 30+(menuNum*25), 100, 14, 7, 5);

		for(int i=0; i<strPlayMenu.length; i++)
		{
			if(menuNum == i)
			{
				bufferedGraphics.setColor(0xFFE000);
				bufferedGraphics.drawString(strPlayMenu[i], 20, 30+(i*25), TOPLEFT);
			}else {
				bufferedGraphics.setColor(0);
				bufferedGraphics.drawString(strPlayMenu[i], 20, 30+(i*25), TOPLEFT);
				bufferedGraphics.setColor(0xffffff);//0xFFE000
				bufferedGraphics.drawString(strPlayMenu[i], 21, 31+(i*25), TOPLEFT);
			}
		}
	}

	private void drawSetting()
	{
		String[] strSet = {"Sound:", "Vibration:"};

		bufferedGraphics.setColor(0);
		bufferedGraphics.fillRect(0, 0, DISPLAY_WIDTH, 119);
		bufferedGraphics.setColor(0x000080);
		bufferedGraphics.drawRect( 0, 0, 119, 118);
		bufferedGraphics.fillRect( 2, 2, 117, 116);
		bufferedGraphics.setColor(0x0080FF);
		bufferedGraphics.drawRect( 3, 3, 116, 115);
		bufferedGraphics.setColor(0x0000FF);
		bufferedGraphics.fillRect( 4, 4, 115, 18);
		bufferedGraphics.drawLine( 4, 20, 115, 20);

		bufferedGraphics.setColor(0xFFC0FF);
		bufferedGraphics.drawString("▷ 환경설정 ◁", DISPLAY_WIDTH/2, 5, Graphics.TOP|Graphics.HCENTER);

		for(int i=0; i<strSet.length; i++)
		{
			if(menuNum == i)
				bufferedGraphics.setColor(255, 224, 0);
			else
				bufferedGraphics.setColor(0, 240, 0);
			bufferedGraphics.drawString(strSet[i], 13, (20*i)+35, TOPLEFT);
		}

		if(bSound) {
			if(menuNum == 0)
				bufferedGraphics.setColor(255, 224, 0);
			else
				bufferedGraphics.setColor(0, 240, 0);
			bufferedGraphics.drawString(volume+"", 80, 35, TOPLEFT);
		}
		else {
			if(menuNum == 0)
				bufferedGraphics.setColor(255, 224, 0);
			else
				bufferedGraphics.setColor(0, 240, 0);
			bufferedGraphics.drawString(volume+"", 80, 35, TOPLEFT);
		}

		if(bVib) {
			if(menuNum == 1)
				bufferedGraphics.setColor(255, 224, 0);
			else
				bufferedGraphics.setColor(0, 240, 0);
			bufferedGraphics.drawString("On", 80, 55, TOPLEFT);
		}
		else {
			if(menuNum == 1)
				bufferedGraphics.setColor(255, 224, 0);
			else
				bufferedGraphics.setColor(0, 240, 0);
			bufferedGraphics.drawString("Off", 80, 55, TOPLEFT);
		}

		bufferedGraphics.setColor(0xffffff);
		bufferedGraphics.drawString("설 정 - ◀ ▶", 13, 75, TOPLEFT);
		bufferedGraphics.drawString("나가기 - 확인", 13, 95, TOPLEFT);
	}

	private void drawPause(int modeNum)
	{
		if(modeNum == SCENE_GAME_SURVIVAL)
		{
			drawBack(SCENE_GAME_SURVIVAL);
			drawEnemy(modeNum);
//			drawBlock();
			drawActor2();
			drawGameScore2();
		}else if(modeNum == SCENE_GAME_STORY)
		{
			drawBack(gameStage);	//기본적인 배경
			drawEnemy(modeNum);
//			drawBlock();
			drawActor();
			drawGameScore();
		}
		bufferedGraphics.setColor(0xffffff);
		bufferedGraphics.fillRoundRect(DISPLAY_WIDTH/2-20, 50, 40, 15, 10, 10);
		bufferedGraphics.setColor(0);
		bufferedGraphics.drawString("PAUSE", DISPLAY_WIDTH/2, 50, Graphics.TOP|Graphics.HCENTER);

//		nReturnScene = nCurrentScene;
		nCurrentScene = SCENE_GAME_PAUSE;
	}
	private void drawGame(int modeNum) {

		switch(modeNum) {
			case SCENE_GAME_STORY:
				nToggle2 = -1 * nToggle2 + 1;	//두개의 이미지의 애니매이션을 위한..

				if( (realStage[10][0]==0) && (realStage[11][0]==0) )	//게임을 모두 클리어 했다면..
					gameClearFlag = 1;

				drawBack(gameStage);	//기본적인 배경
				drawEnemy(modeNum);
				drawBlock();
				drawActor();
				drawGameScore();

				if(gameClearFlag == 2) {	//game 실패시
					bufferedGraphics.setFont(font2);
					drawCustomString2("GAME OVER", 60, 50, 255, 224, 0);
					bufferedGraphics.setFont(font);
				}

				break;
			case SCENE_GAME_SURVIVAL:
				nToggle2 = -1 * nToggle2 + 1;

				drawBack(SCENE_GAME_SURVIVAL);
				drawEnemy(modeNum);
				drawBlock();
				drawActor2();
				drawGameScore2();

				if(gameClearFlag == 2) { //game 실패시
					bufferedGraphics.setFont(font2);
					drawCustomString2("GAME OVER", 60, 50, 255, 224, 0);
					bufferedGraphics.setFont(font);
				}
				break;
		}

		bufferedGraphics.drawImage(imgButton[0], 0, 119-7, TOPLEFT);
		bufferedGraphics.drawImage(imgButton[1], 120-50, 119-7, TOPLEFT);
	}

	private void drawBack(int stageFlag)
	{
		if( ((realStage[0][0]!=0) || (gameTime<=0)) && (gameClearFlag == 0))	{	//게임 실패했다면..
			gameClearFlag = 2;
			vibStart(2000);
		}

		bufferedGraphics.drawImage(gameBackImg, 16, 12, TOPLEFT);
		bufferedGraphics.drawImage(gameBackTopImg, 0, 0, TOPLEFT);
		bufferedGraphics.drawImage(gameBackLeftImg, 0, 13, TOPLEFT);
		bufferedGraphics.drawImage(gameBackBottomImg, 0, 101, TOPLEFT);
		bufferedGraphics.drawImage(gameBackFeatherImg, 100, 106, TOPLEFT);

		for ( int k = 0; k < stoneFlag; k++ )
			bufferedGraphics.drawImage(gameStoneImg, 88-(k*12), 105, TOPLEFT);

		//combo 게이지
		if( storyGameScore/20000 > 0 ) {
			storyGameScore = storyGameScore % 20000;
			skillPointNum = skillPointNum + 5;
			allFeatherNum++;
		}

		if( skillPointNum > 20 )
			skillPointNum = 20;

		bufferedGraphics.setColor(0, 0, 0);
		bufferedGraphics.fillRect(14+(skillPointNum*5), 102, 105-(skillPointNum*5), 2);

		if( stageFlag != SCENE_GAME_SURVIVAL) {
			if(gameClearFlag == 2) {
				bufferedGraphics.drawImage(gameBackTentImg[1], 17, 2, TOPLEFT);
			} else {
				bufferedGraphics.drawImage(gameBackTentImg[0], 17, 1, TOPLEFT);
			}
		}

		//feather 전체 갯수
		if( allFeatherNum >= 10 ) {
			changeClip(bufferedGraphics, 111, 106, 4, 6);
			bufferedGraphics.drawImage(featherNumImg, 111-((allFeatherNum/10)*4), 106, TOPLEFT);
			changeClip(bufferedGraphics, 0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);
			changeClip(bufferedGraphics, 115, 106, 4, 6);
			bufferedGraphics.drawImage(featherNumImg, 115-((allFeatherNum%10)*4), 106, TOPLEFT);
			changeClip(bufferedGraphics, 0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);
		} else {
			changeClip(bufferedGraphics, 115, 106, 4, 6);
			bufferedGraphics.drawImage(featherNumImg, 115-(allFeatherNum*4), 106, TOPLEFT);
			changeClip(bufferedGraphics, 0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);
		}
	}

	private void drawEnemy(int modeNum) {
		if( modeNum == SCENE_GAME_STORY) {
			bufferedGraphics.drawImage(enemyImg[nToggle2], 112-((900-gameTime)/10), 3, TOPLEFT);
		} else {
			changeClip(bufferedGraphics, 56-blockDownTime, 4, 12, 8);
			bufferedGraphics.drawImage(gameBlockImg, 56-blockDownTime, 4-((downBlockNum1-1)*8), TOPLEFT);
			changeClip(bufferedGraphics, 68-blockDownTime, 4, 12, 8);
			bufferedGraphics.drawImage(gameBlockImg, 68-blockDownTime, 4-((downBlockNum2-1)*8), TOPLEFT);
			changeClip(bufferedGraphics, 0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);

			bufferedGraphics.drawImage(enemyImg[nToggle2], 74-blockDownTime, 3, TOPLEFT);
		}
	}

	private void drawBlock()
	{
		blockAnimationNum++;

		for( int i = 12; i >= 0; i--) {	//블럭 그리기
			for( int j = 0; j < 8; j++)	{
				if( realStage[i][j] != 0 )	{
					if( blockAnimationNum == 38 )
						blockAnimationNum = 0;

					if (i < 12)	{
						changeClip(bufferedGraphics, 15+(j*12), 5+(i*8), 12, 8);
						bufferedGraphics.drawImage(gameBlockImg, 15+(j*12)-boomFlag, 5+(i*8)-((realStage[i][j]-1)*8), TOPLEFT);
						changeClip(bufferedGraphics, 0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);

						if( featherFlag == realStage[i][j] ) {	//feather
							bufferedGraphics.drawImage(featherImg[nToggle2], 15+(j*12), 5+(i*8), TOPLEFT);
						}
					} else {
						changeClip(bufferedGraphics, 15+(j*12), 105, 12, 8);
						bufferedGraphics.drawImage(gameBlockImg, 15+(j*12)-boomFlag, 105-((realStage[i][j]-1)*8), TOPLEFT);
						changeClip(bufferedGraphics, 0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);

						if( featherFlag == realStage[i][j] ) {	//feather
							bufferedGraphics.drawImage(featherImg[nToggle2], 15+(j*12)+(boomFlag*12), 105, TOPLEFT);
						}
					}
				}
			}
		}
		drawWhiteAni(nCurrentScene);
	}

	private void drawWhiteAni(int modeNum) {
		if( modeNum == SCENE_GAME_STORY ) {
			if ( bottomClearFlag==1 ) {	//맨밑의 블럭 하얀색으로 채우는 애니매이션
				if ( nToggle%2==1) {
					bufferedGraphics.setColor(255,255,255);
					bufferedGraphics.fillRect(16, 105, (7-stoneFlag)*12, 8);
				}

				nToggle++;

				drawCombo();	//콤보 표시

				if (nToggle==4)	{											//애니매이션이 모두 끝났다면..
					nToggle =0;
					bottomClearFlag=0;

					featherFlag = rand(1, 11);

					for( int k = 0; k < 8; k++)	{							//맨 밑의 블럭 모두 0으로 초기화
						realStage[12][k] = 0;
					}

					allProcessFlag = 0;
				}
			}
		} else if( modeNum == SCENE_GAME_SURVIVAL) {
			if ( s_bottomClearFlag==1 ) {	//맨밑의 블럭 하얀색으로 채우는 애니매이션
				if ( nToggle%2==1) {
					bufferedGraphics.setColor(255,255,255);
					for(int i=0; i<7; i++) {
						if( realStage[12][i] == s_bottomBlockNum ) {
							bufferedGraphics.fillRect(16+(i*12), 105, 12, 8);
						}
					}
				}

				nToggle++;

				drawCombo();	//콤보 표시
				if (nToggle==4)	{											//애니매이션이 모두 끝났다면..
					nToggle =0;
					s_bottomClearFlag=0;

					byte temp[] = { 0, 0, 0 };
					int tempDecreaseNum = 2;

					//맨밑에 4개 블럭 삭제하고 다른거 정렬
					for(int i=6; i>=0; i--) {
						if( (realStage[12][i] != s_bottomBlockNum ) && (realStage[12][i] != 0 )) {
							temp[tempDecreaseNum] = realStage[12][i];
							tempDecreaseNum--;
						}
						realStage[12][i] = 0;
					}
					realStage[12][6] = temp[2];
					realStage[12][5] = temp[1];
					realStage[12][4] = temp[0];
					allProcessFlag = 0;
				}
			}
		}
	}

	private void drawActor() {
		//네모 애니매이션
		if( gameClearFlag == 0) {
			if( blockRectNum%4 == 0 ) {
				bufferedGraphics.setColor(255,255,255);
				bufferedGraphics.drawRect(15, 13+(8*(actorY)), 11, 7);
			} else if ( blockRectNum%4 == 1 ) {
				bufferedGraphics.setColor(138, 138, 138);
				bufferedGraphics.drawRect(15, 13+(8*(actorY)), 11, 7);
			} else if (blockRectNum%4 == 2 ) {
				bufferedGraphics.setColor(0, 0, 0);
				bufferedGraphics.drawRect(15, 13+(8*(actorY)), 11, 7);
			} else if (blockRectNum%4 == 3)	{
				bufferedGraphics.setColor(138, 138, 138);
				bufferedGraphics.drawRect(15, 13+(8*(actorY)), 11, 7);
			}
			blockRectNum++;
			if (blockRectNum == 4)
				blockRectNum = 0;

			for( int i = 0; i < 8; i++)	{	//actor 그리기
				if( realStage[actorY+1][i] == 0 ) {
					if (actorFlag==0) {		//현재 상태가 블럭을 밀고 있는 상태가 아니라면
						if( i == 0 )		//왼쪽 끝으로는 actor가 붙을수 없음
							i = 1;
						bufferedGraphics.drawImage(imgActor[0], 28+(12*(i-1)), 4+(8*actorY), TOPLEFT);
					} else if ( (actorFlag==1) || (bottomClearFlag==1) ) {
						if (i==0) {
							bufferedGraphics.drawImage(imgActor[1], 24, 4+(8*actorY), TOPLEFT);
						}
						else {
							bufferedGraphics.drawImage(imgActor[1], 24+(12*i), 4+(8*actorY), TOPLEFT);
						}
					}
					break;
				}
			}
		} else if (gameClearFlag == 1) {
			bufferedGraphics.drawImage(imgActor[4+nToggle2], 24, 4+(8*actorY)-(4*nToggle2), TOPLEFT);
		} else {	//게임 실패
			for( int i = 0; i < 8; i++)	{	//actor 그리기
				if( realStage[actorY+1][i] == 0 ) {
					bufferedGraphics.drawImage(imgActor[2+nToggle2], 20+(12*(i-1))-nToggle2, 6+(8*actorY)-nToggle2, TOPLEFT);
					break;
				}
			}
		}

		if( startToggle < 2 ) {
			drawCustomString("STAGE " + gameStage, 40, 50, 255, 255, 0);
			startToggle++;
		} else if( startToggle < 4 ) {
			startToggle++;
			drawCustomString("START!!", 40, 50, 255, 255, 0);
		}
	}

	private void drawActor2()
	{
		//네모 애니매이션
		if( gameClearFlag == 0) {
			if( blockRectNum%4 == 0 ) {
				bufferedGraphics.setColor(255,255,255);
				bufferedGraphics.drawRect(15, 13+(8*(actorY)), 11, 7);
			} else if ( blockRectNum%4 == 1 ) {
				bufferedGraphics.setColor(138, 138, 138);
				bufferedGraphics.drawRect(15, 13+(8*(actorY)), 11, 7);
			} else if (blockRectNum%4 == 2 ) {
				bufferedGraphics.setColor(0, 0, 0);
				bufferedGraphics.drawRect(15, 13+(8*(actorY)), 11, 7);
			} else if (blockRectNum%4 == 3)	{
				bufferedGraphics.setColor(138, 138, 138);
				bufferedGraphics.drawRect(15, 13+(8*(actorY)), 11, 7);
			}
			blockRectNum++;
			if (blockRectNum == 4)
				blockRectNum = 0;

			for( int i = 0; i < 8; i++)	{	//actor 그리기
				if( realStage[actorY+1][i] == 0 ) {
					if (actorFlag==0) {		//현재 상태가 블럭을 밀고 있는 상태가 아니라면
						if( i == 0 )		//왼쪽 끝으로는 actor가 붙을수 없음
							i = 1;
						bufferedGraphics.drawImage(imgActor2[0], 28+(12*(i-1)), 4+(8*actorY), TOPLEFT);
					} else if ( (actorFlag==1) || (bottomClearFlag==1) ) {
						if (i==0) {
							bufferedGraphics.drawImage(imgActor2[1], 24, 4+(8*actorY), TOPLEFT);
						}
						else {
							bufferedGraphics.drawImage(imgActor2[1], 24+(12*i), 4+(8*actorY), TOPLEFT);
						}
					}
					break;
				}
			}
		} else {	//게임 실패
			for( int i = 0; i < 8; i++)	{	//actor 그리기
				if( realStage[actorY+1][i] == 0 ) {
					bufferedGraphics.drawImage(imgActor2[2+nToggle2], 24+(12*(i-1)), (8*actorY)+nToggle2-3, TOPLEFT);
					break;
				}
			}
		}
	}

	private void drawLeftAni(int modeNum) {
		bufferedGraphics.drawImage(gameBackLeftImg, 0, 13, TOPLEFT);

		if ( aniBlockFlag==1 ) {//움직이는 블럭 2번째 애니..
			if ( (53+(aniBlockY*8)) < 100 )	{
				changeClip(bufferedGraphics, 1, 53+(aniBlockY*8), 12, 8);
				bufferedGraphics.drawImage(gameBlockImg, 1, 53+(aniBlockY*8)-((aniBlockNum-1)*8), TOPLEFT);
				changeClip(bufferedGraphics, 0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);

			} else {
				changeClip(bufferedGraphics, 1, 102, 12, 8);
				bufferedGraphics.drawImage(gameBlockImg, 1, 102-((aniBlockNum-1)*8), TOPLEFT);
				changeClip(bufferedGraphics, 0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);
			}

			aniBlockY = 0;
			aniBlockNum = 0;
			aniBlockFlag = 0;
			actorFlag = 0;

			switch(modeNum) {
				case SCENE_STORY_LEFTANI:
					nCurrentScene = SCENE_GAME_STORY;
					calculateBottomBlock();
					break;
				case SCENE_SURVIVAL_LEFTANI:
					nCurrentScene = SCENE_GAME_SURVIVAL;
					calculateBottomBlock2();
					break;
			}

			arrangeBlock();

		} else if ( aniBlockNum!=0 ) {	//현재 음직이는 블럭이 있다면.. 움직이는 불럭 1번째 애니..
			changeClip(bufferedGraphics, 1, 13+(aniBlockY*8), 12, 8);	//옆에 떨어지는 애니 그리기
			bufferedGraphics.drawImage(gameBlockImg, 1, 13+(aniBlockY*8)-((aniBlockNum-1)*8), TOPLEFT);
			changeClip(bufferedGraphics, 0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);

			aniBlockFlag = 1;

			bufferedGraphics.drawImage(gameBackImg, 16, 12, TOPLEFT);
			drawBlock();

			switch(modeNum) {
				case SCENE_STORY_LEFTANI:
					drawEnemy(SCENE_GAME_STORY);
					drawActor();
					drawGameScore();
					break;
				case SCENE_SURVIVAL_LEFTANI:
					drawEnemy(SCENE_GAME_SURVIVAL);
					drawActor2();
					drawGameScore2();
					break;
			}
		}

		changeClip(bufferedGraphics, 0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);
	}

	private void drawStoryBottomAni() {
		nCurrentScene = SCENE_GAME_STORY;
	}

	private void drawBoom() {
//		System.out.println("drawBoom");
		switch(nToggle%3) {
			case 0:
				bufferedGraphics.drawImage(boomImg[0], 45, 50, TOPLEFT);
				nToggle++;
				break;
			case 1:
				bufferedGraphics.drawImage(boomImg[1], 45, 50, TOPLEFT);
				nToggle++;
				break;
			case 2:
				bufferedGraphics.drawImage(boomImg[2], 45, 50, TOPLEFT);
				nToggle = 0;
				nCurrentScene = SCENE_GAME_STORY;
//				nToggle++;
				break;
/*			case 3:
				bufferedGraphics.drawImage(boomImg[3], 45, 50, TOPLEFT);
				nToggle = 0;
				nCurrentScene = SCENE_GAME_STORY;
				break;
*/		}
	}

/*	private void drawSurvivalBottomAni() {
		nCurrentScene = SCENE_GAME_SURVIVAL;
	}
*/
	private void drawItem(int modeNum) {

		if( modeNum==0 ) {
			switch (nToggle%5) {
				case 0:
//					bufferedGraphics.drawImage(actorImg[1], 45, 20, TOPLEFT);
					nToggle++;
					break;
				case 1:
					bufferedGraphics.setColor(255,255, 255);
					bufferedGraphics.fillRect(0, 0, 120, 119);
					nToggle++;
					break;
				case 2:
//					bufferedGraphics.drawImage(actorImg[1], 45, 20, TOPLEFT);
					nToggle++;
					break;
				case 3:
					bufferedGraphics.setColor(255,255, 255);
					bufferedGraphics.fillRect(0, 0, 120, 119);
					nToggle++;
					break;
				case 4:
//					bufferedGraphics.drawImage(actorImg[1], 45, 20, TOPLEFT);
					nToggle = 0;
					nCurrentScene = SCENE_GAME_STORY;
					arrangeItemUseBlock();
					break;

			}
		} else if( modeNum==1 ) {
			switch (nToggle%5) {
				case 0:
//					bufferedGraphics.drawImage(actorImg[2], 45, 40, TOPLEFT);
					nToggle++;
					break;
				case 1:
					bufferedGraphics.setColor(255,255, 255);
					bufferedGraphics.fillRect(0, 0, 120, 119);
					nToggle++;
					break;
				case 2:
//					bufferedGraphics.drawImage(actorImg[2], 41, 40, TOPLEFT);
					nToggle++;
					break;
				case 3:
					bufferedGraphics.setColor(255,255, 255);
					bufferedGraphics.fillRect(0, 0, 120, 119);
					nToggle++;
					break;
				case 4:
//					bufferedGraphics.drawImage(actorImg[2], 43, 40, TOPLEFT);
					nToggle = 0;
					nCurrentScene = SCENE_GAME_SURVIVAL;
					arrangeItemUseBlock();
					break;

			}
		}
	}

	private void drawCombo() {
		if( comboFlag > 1 ) {
			bufferedGraphics.drawImage(comboImg, 32, 20, TOPLEFT);
			String temp;
			temp = " " + comboFlag;
			drawCustomString(temp, 43, 28, 40, 180, 0);
		}
	}

	private void drawGameScore() {
		drawCustomString("SCORE", 84, 12, 255, 0, 0);
		bufferedGraphics.setColor(0, 0, 0);
		bufferedGraphics.drawString(scoreStr.substring(2,scoreStr.length()), 119, 25, Graphics.RIGHT|Graphics.TOP);
		bufferedGraphics.setColor(128, 255, 0);
		bufferedGraphics.drawString(scoreStr.substring(2,scoreStr.length()), 118, 24, Graphics.RIGHT|Graphics.TOP);
	}

	private void drawGameScore2() {
		scoreStr2 = " " + survivalGameScore;
		drawCustomString("SCORE", 84, 12, 255, 0, 0);
		bufferedGraphics.setColor(0, 0, 0);
		bufferedGraphics.drawString(scoreStr2, 119, 25, Graphics.RIGHT|Graphics.TOP);
		bufferedGraphics.setColor(128, 255, 0);
		bufferedGraphics.drawString(scoreStr2, 118, 24, Graphics.RIGHT|Graphics.TOP);
	}

	private void drawScore() {
		int tempToggle = 0;

		bufferedGraphics.drawImage(gridImg, 0, 0, TOPLEFT);

		drawGrid();

		drawCustomString("TIME", 18, 15, 128, 255, 0);
		drawCustomString(timeStr, 20, 26, 128, 255, 0);
		drawCustomString("MISS", 18, 42, 128, 255, 0);
		drawCustomString(missStr, 20, 53, 128, 255, 0);
		drawCustomString("SCORE", 18, 69, 128, 255, 0);
		drawCustomString(scoreStr, 63, 69, 128, 255, 0);
	}

	private void drawPause() {
		int tempToggle = 0;

		bufferedGraphics.drawImage(gridImg, 0, 0, TOPLEFT);

		drawGrid();

		bufferedGraphics.setColor(255, 255, 255);
		bufferedGraphics.fillRect(10, 10, 98, 98);

		bufferedGraphics.setColor(192, 240, 248);
		bufferedGraphics.fillRect(12, 12, 94, 94);

		drawCustomString("일시정지", 15, 15, 192, 64, 192);

		bufferedGraphics.setColor(0 ,0 ,0);
		bufferedGraphics.drawString("끝내기(*)", 15, 35, TOPLEFT);
		bufferedGraphics.drawString("계속하기(#)", 15, 50, TOPLEFT);
		bufferedGraphics.drawString("소리on/off(1)", 15, 65, TOPLEFT);
		bufferedGraphics.drawString("진동on/off(2)", 15, 80, TOPLEFT);
	}

	private void drawRankRegist()
	{
		bufferedGraphics.setColor(0xffffff);
		bufferedGraphics.fillRect(10, 12, 95, 95);
		bufferedGraphics.setColor(0xFFC300);
		bufferedGraphics.drawRect(11, 13, 91, 91);
//		bufferedGraphics.setColor(0xffe300);
		bufferedGraphics.setColor(0);
		bufferedGraphics.drawString("랭킹서버에 등록", 13, 18, TOPLEFT);
		bufferedGraphics.drawString("하시겠습니까?", 13, 35, TOPLEFT);
		bufferedGraphics.drawString("Y(*) / N(#)", 22, 52, TOPLEFT);
		bufferedGraphics.setColor(0xFF41FF);
		bufferedGraphics.drawString("별도의 통화료가", 13, 69, TOPLEFT);
		bufferedGraphics.drawString("부과 됩니다.", 13, 86, TOPLEFT);
	}

	private void drawRank()
	{
		bufferedGraphics.setColor(0);
		bufferedGraphics.fillRect(0, 0, DISPLAY_WIDTH, 119);
		bufferedGraphics.setColor(0x000080);
		bufferedGraphics.drawRect( 0, 0, 119, 118);
		bufferedGraphics.fillRect( 2, 2, 117, 116);
		bufferedGraphics.setColor(0x0080FF);
		bufferedGraphics.drawRect( 3, 3, 116, 115);
		bufferedGraphics.setColor(0x0000FF);
		bufferedGraphics.fillRect( 4, 4, 115, 18);
		bufferedGraphics.drawLine( 4, 20, 115, 20);

		bufferedGraphics.setColor(0xFFC0FF);
		bufferedGraphics.drawString("▷ 랭킹 ◁", DISPLAY_WIDTH/2, 5, Graphics.TOP|Graphics.HCENTER);
		bufferedGraphics.setColor(0xffffff);

		bufferedGraphics.setColor(0xffffff);
		for(int i=0; i<5; i++) {
			bufferedGraphics.drawString((i+1) + ".", 20, (16*i)+27, TOPLEFT);
			bufferedGraphics.drawString(String.valueOf(nStoryScore[i]), DISPLAY_WIDTH-15, (16*i)+27, Graphics.TOP|Graphics.RIGHT);
		}
	}

	private void drawAbout()
	{
		int tmpY = 0;
		String[] strAbout = {   "Home Page: www.",
								"mobileage.co.kr",
								"[Haida]",
								"eMail: hcm@",
								"mobileage.co.kr"	};

		bufferedGraphics.setColor(0);
		bufferedGraphics.fillRect(0, 0, DISPLAY_WIDTH, 119);
		bufferedGraphics.setColor(0x000080);
		bufferedGraphics.drawRect( 0, 0, 119, 118);
		bufferedGraphics.fillRect( 2, 2, 117, 116);
		bufferedGraphics.setColor(0x0080FF);
		bufferedGraphics.drawRect( 3, 3, 116, 115);
		bufferedGraphics.setColor(0x0000FF);
		bufferedGraphics.fillRect( 4, 4, 115, 18);
		bufferedGraphics.drawLine( 4, 20, 115, 20);

		bufferedGraphics.setColor(0xFFC0FF);
		bufferedGraphics.drawString("▷ 문의 ◁", DISPLAY_WIDTH/2, 5, Graphics.TOP|Graphics.HCENTER);
		bufferedGraphics.setColor(0xffffff);

		for(int i=0; i<strAbout.length; i++)
		{
			if(i == 1 || i == strAbout.length-1)
				tmpY = (19*i)+26;
			else if(i == strAbout.length-2)
				tmpY = (19*i)+29;
			else
				tmpY = (19*i)+27;
			bufferedGraphics.drawString(strAbout[i], 13, tmpY, TOPLEFT);
		}
	}

	private void drawHelp()
	{
		bufferedGraphics.setColor(0);
		bufferedGraphics.fillRect(0, 0, DISPLAY_WIDTH, 119);
		bufferedGraphics.setColor(0x000080);
		bufferedGraphics.drawRect( 0, 0, 119, 118);
		bufferedGraphics.fillRect( 2, 2, 117, 116);
		bufferedGraphics.setColor(0x0080FF);
		bufferedGraphics.drawRect( 3, 3, 116, 115);
		bufferedGraphics.setColor(0x0000FF);
		bufferedGraphics.fillRect( 4, 4, 115, 18);
		bufferedGraphics.drawLine( 4, 20, 115, 20);

		bufferedGraphics.setColor(0xFFC0FF);
		bufferedGraphics.drawString("▷ 사용키 ◁", DISPLAY_WIDTH/2, 5, Graphics.TOP|Graphics.HCENTER);
		bufferedGraphics.setColor(0xffffff);
		bufferedGraphics.drawString( "[ ▲ ▼ ] 이 동", 10, 35, TOPLEFT );
		bufferedGraphics.drawString( "[ ◀ ] 블럭밀기", 10, 53, TOPLEFT );
		bufferedGraphics.drawString( "[ ▶ ] 기술사용" , 10, 71, TOPLEFT );
		bufferedGraphics.drawString( "[취소] 일시정지",10, 89, TOPLEFT );
	}

	private void drawStage1Ani()
	{
		clearScreen(0);
		bufferedGraphics.setColor(0xffffff);
		bufferedGraphics.drawString("평화롭던 수우족", 10, 25, TOPLEFT);
		bufferedGraphics.drawString("인도언 마을에", 10, 40, TOPLEFT);
		bufferedGraphics.drawString("관광지 개발을", 10, 55, TOPLEFT);
		bufferedGraphics.drawString("위한 [에이에스유]", 10, 70, TOPLEFT);
		bufferedGraphics.drawString("불도저가", 10, 85, TOPLEFT);
		bufferedGraphics.drawString("나타나는데...", 10, 100, TOPLEFT);
	}

	private void drawStage8Ani()
	{
		clearScreen(0);
		bufferedGraphics.setColor(0xffffff);
		bufferedGraphics.drawString("헤이다의노력으로", 10, 25, TOPLEFT);
		bufferedGraphics.drawString("토템들은 하나씩", 10, 40, TOPLEFT);
		bufferedGraphics.drawString("옮겨지게 된다", 10, 55, TOPLEFT);
		bufferedGraphics.drawString("하지만 불도저는", 10, 70, TOPLEFT);
		bufferedGraphics.drawString("시한폭탄을 토템에", 10, 85, TOPLEFT);
		bufferedGraphics.drawString("설치하게 되는데...", 10, 100, TOPLEFT);
	}

	private void drawStage14Ani()
	{
		clearScreen(0);
		bufferedGraphics.setColor(0xffffff);
		bufferedGraphics.drawString("헤이다의 모습은", 10, 25, TOPLEFT);
		bufferedGraphics.drawString("자포자기했던", 10, 40, TOPLEFT);
		bufferedGraphics.drawString("마을사람들을", 10, 55, TOPLEFT);
		bufferedGraphics.drawString("변화시키는데", 10, 70, TOPLEFT);
		bufferedGraphics.drawString("....", 10, 85, TOPLEFT);
	}

	private void drawStageEnding()
	{
		clearScreen(0);
		bufferedGraphics.setColor(0xffffff);
		if(nSin == 0)
		{
			bufferedGraphics.drawString("토템의 강력한", 10, 25, TOPLEFT);
			bufferedGraphics.drawString("힘이 모여서", 10, 40, TOPLEFT);
			bufferedGraphics.drawString("강력한 벽을", 10, 55, TOPLEFT);
			bufferedGraphics.drawString("만들었다.", 10, 70, TOPLEFT);
			bufferedGraphics.drawString("불도저가", 10, 85, TOPLEFT);
			bufferedGraphics.drawString("나타나는데...", 10, 100, TOPLEFT);
		}else if(nSin == 1)
		{
			bufferedGraphics.drawString("불도저는 포기하", 10, 25, TOPLEFT);
			bufferedGraphics.drawString("고 마을을 떠났고..", 10, 40, TOPLEFT);
			bufferedGraphics.drawString("헤이다는 인디언", 10, 55, TOPLEFT);
			bufferedGraphics.drawString("마을을 구할수", 10, 70, TOPLEFT);
			bufferedGraphics.drawString("있었다.", 10, 85, TOPLEFT);
		}
	}

	private void drawGrid() {
		for(int i = 0; i < 120/10; i++) {
			bufferedGraphics.drawImage(gridImg, 0, i*10, TOPLEFT);
		}
	}

	private void changeClip(Graphics g, int x, int y, int w, int h)
	{
		g.setClip(x, y, w, h);
	}
	//********************************** drawing end *****************************************
	//****************************************************************************************
	private void initVariable() {
		int startToggle = 0;

		int nToggle = 0;				//애니매이션을 위한 변수
		int nToggle2 = 0;				//애니매이션을 위한 변수
		//int gameStage = 20;				//현재의 스테이지 정보를 가지고 있는 변수
		int gameStage = 1;
		int allProcessFlag = 0;			//하나의 이벤트가 있을때 동기화를 위한 플래그
		int actorY = 10;				//actor의 y 좌표인데 실제 좌료가 아닌 블럭 갯수 만큼의 값
		int blockRectNum = 0;			//블럭을 감싸고 있는 애니매이션을 위해 필요
		int aniBlockY = 0, aniBlockNum = 0, aniBlockFlag = 0;	//좌측에 블럭 애니매이션을 위한 변수
		int stoneFlag = 0;				//현재 스톤의 갯수를 가지고 있는 변수
		int bottomBlockNum = 0;			//현재 떨어진 블럭의 종류를 가지고 있는 변수
		int actorFlag = 0;				//액터가 움직이고 있는지 알아보는 변수
		int bottomClearFlag = 0;		//맨밑의 블럭이 모두 같은 블럭으로 채워졌는지 알아보는 변수
		int gameClearFlag = 0;			//0:게임진행중, 1:모두 클리어, 2:실패
		int comboFlag = 0;				//콤보 갯수 	//
		int mistakeFlag = 0;			//실수한 갯수
		//int skillPointNum = 25;			//스킬 게이지
		int skillPointNum = 0;
		int gameTime = 900;				//게임 시간
		int storyGameScore = 0;			//스토리 게임 스코어
		int featherFlag = 0;			//현재 깃털이 있는 블럭
		//int allFeatherNum = 12;
		int allFeatherNum = 0;			//전체 깃털의 갯수
		int blockAnimationNum = 0;		//블럭 전체 애니메이션
		int boomFlag = 0;				//폭탄이 터졌는가?
		int t_blockFlag = 0;			//현재 없어진 블럭이 "T" block??



		int blockDownTime = 0, blockDownStartTime = 0;	//서바이벌 모드에서의 타임
		int survivalGameScore = 0;		//survival mode scor
		int menuNum = 0;				//0:story, 1:survival, 2:setup, 3:help, 4:ranking
		int nSin = 0;
	}

	private void calculateTime() {
		if( (gameTime > 0) && ( gameClearFlag!=1 ) && (gameClearFlag!=2) ) {
			gameTime--;
		} else if(gameTime == 0) {
			gameClearFlag = 2;
		}

		if( (t_blockFlag>0) && (t_blockFlag<150) ) {
			gameTime = gameTime + 2;
			if( gameTime > 900 )
				gameTime = 900;

			t_blockFlag++;
		} else if( t_blockFlag==150 ) {
			t_blockFlag = 0;
		}

		if( gameTime < 100 ) {
			if( gameTime%5==1) {
				drawCustomString("Hurry up!!", 60, 0, 250, 0, 0);
				playSound(mPlayer[SOUND_HURRYUP]);
			}
		}
	}

	private void calculateTime2() {
		if( (blockDownTime > 40) && (gameClearFlag!=2) ) {
			//blockDownTime = 0;
			blockDownTime = blockDownStartTime;
			blockDownStartTime++;

			if(blockDownStartTime == 12)
				blockDownStartTime = -35;

			//떨어지는 블럭들 삽입
			for( int i=1; i<12; i++) {
				if( realStage[i][0]!=0 ) {
					realStage[i-1][0] = (byte)downBlockNum1;
					break;
				}
			}

			for( int i=1; i<12; i++) {
				if( realStage[i][1]!=0 ) {
					realStage[i-1][1] = (byte)downBlockNum2;
					break;
				}
			}

			downBlockNum1 = rand(1, 11);
			downBlockNum2 = rand(1, 11);

		} else {
			if( gameClearFlag != 2 )
				blockDownTime+=2;
		}
	}

	private void pushLeft(int modeNum) {
		aniBlockY = actorY+1;
		aniBlockNum = realStage[actorY+1][0];
		actorFlag = 1;

		for( int i = 0; i < 7; i++)
			realStage[actorY+1][i] = realStage[actorY+1][i+1];

		bottomBlockNum = aniBlockNum;

		nCurrentScene = modeNum;
	}

	private void arrangeBlock()	{
		for( int i = 11; i >= 1; i--) {
			for( int j = 0; j < 8; j++)	{
				if( (realStage[i-1][j]!=0)&&(realStage[i][j]==0) ) {
					realStage[i][j] = realStage[i-1][j];
					realStage[i-1][j] = 0;
				}
			}
		}
	}

	private void arrangeItemUseBlock() {
		int itemUseBlockNum = realStage[actorY+1][0];

		byte tempBlock[] = { 0, 0, 0, 0, 0, 0, 0,
							0, 0, 0, 0, 0, 0, 0,
							0, 0, 0, 0, 0, 0, 0,
							0, 0, 0, 0, 0, 0, 0,
							0, 0, 0, 0, 0, 0, 0,
							0, 0, 0, 0, 0, 0, 0,
							0, 0, 0, 0, 0, 0, 0,
							0, 0, 0, 0, 0, 0, 0,
							0, 0, 0, 0, 0, 0, 0,
							0, 0, 0, 0, 0, 0, 0,
							0, 0, 0, 0, 0, 0, 0,
							0, 0, 0, 0, 0, 0, 0 };

		int tempBlockIncrease = 0;

		for( int i = 12; i > 0; i--) {
			for( int j = 0; j < 7; j++) {
				tempBlock[tempBlockIncrease] = realStage[i][j];
				realStage[i][j] = 0;
				tempBlockIncrease++;
			}
		}

		tempBlockIncrease = 0;

		for( int i = 11; i > 0; i--) {
			for( int j = 0; j < 7-stoneFlag; j++) {
				for( int m = tempBlockIncrease; m < 7*12; m++ ) {
					if( (tempBlock[tempBlockIncrease]!=0) && (tempBlock[tempBlockIncrease]!=itemUseBlockNum) ) {
						realStage[i][j] = tempBlock[tempBlockIncrease];
						tempBlockIncrease++;
						break;
					}
					tempBlockIncrease++;
				}
			}
		}
	}

	private void calculateBottomBlock()		//맨밑의 블럭 계산
	{
		for( int i = 6-stoneFlag; i >= 0; i--) {
			if ( realStage[12][i]==0 ) {
				realStage[12][i] = (byte)bottomBlockNum;
				break;
			}
		}

		if( realStage[12][0]!=0 ) {	//맨 밑의 블럭이 모두 채워졌다면..

			for( int m = 6-stoneFlag; m >= 0; m--) {
				if (realStage[12][m] == bottomBlockNum)	{
					bottomClearFlag = 1;
				} else {
					bottomClearFlag = 0;
					break;
				}
			}

			if (bottomClearFlag == 0) {		//맨밑의 블럭이 클리어가 안 되었다면..
				for( int i = 0; i < 12; i++) {
					for( int j = 0; j < 8; j++) {
						realStage[i][j] = realStage[i+1][j];	//블럭을 한칸씩 올린다.
					}
				}

				for( int k = 0; k < 8; k++)	//맨 밑의 블럭 모두 0으로 초기화
					realStage[12][k] = 0;

				allProcessFlag = 0;
				comboFlag = 0;
				mistakeFlag++;
				featherFlag = rand(1, 11);
			} else {
				comboFlag++;

				if( bottomBlockNum == featherFlag )	{	//현재 삭제된 블럭이 깃털이 있는 거라면..
					storyGameScore = storyGameScore + 20000;
					playSound(mPlayer[SOUND_FEATHER]);
				}

				if( bottomBlockNum == 11 )	//현재 삭제된 블럭이 "T"블럭이라면
					t_blockFlag = 1;

				if( bottomBlockNum == 12 ) {
//					System.out.println("boom");
					boomFlag = 12;
					nCurrentScene = SCENE_GAME_BOOM;
				}

				if( comboFlag > 1 )
					skillPointNum++;
			}

		} else {
			allProcessFlag = 0;
		}
	}

	private void calculateBottomBlock2()		//맨밑의 블럭 계산(survival mode)
	{
		for( int i = 6-stoneFlag; i >= 0; i--) {
			if ( realStage[12][i]==0 ) {
				realStage[12][i] = (byte)bottomBlockNum;
				break;
			}
		}


		int s_calculateBottom = 0;

		for( int j = 6; j >= 3; j-- ) {
			for( int m = j-1; m >=0; m--) {
				if( (realStage[12][j] == realStage[12][m]) && (realStage[12][j]!=0) ) {
					s_bottomBlockFlag++;
//					System.out.println("s_bottomBlockFlag " + s_bottomBlockFlag );
				}
			}
			if( s_bottomBlockFlag == 3 ) {	//같은 4개가 있다면..
				s_bottomClearFlag = 1;
				s_bottomBlockFlag = 0;
				s_bottomBlockNum = realStage[12][j];

				comboFlag++;

				int tempScore = 1;
				for( int ii=0; ii<comboFlag; ii++) {
					tempScore = tempScore*2;
				}

				survivalGameScore = survivalGameScore + tempScore;

				if( comboFlag > 1 )
					skillPointNum++;
				break;
			} else {
				allProcessFlag = 0;
				s_bottomBlockFlag = 0;
			}
		}

		if( s_bottomClearFlag == 0 ) {
			if( realStage[12][0]!=0 ) {	//맨 밑의 블럭이 모두 채워졌다면..
				for( int i = 0; i < 12; i++) {
					for( int j = 0; j < 8; j++) {
						realStage[i][j] = realStage[i+1][j];	//블럭을 한칸씩 올린다.
					}
				}

				for( int k = 0; k < 8; k++)	//맨 밑의 블럭 모두 0으로 초기화
					realStage[12][k] = 0;

				allProcessFlag = 0;

				comboFlag = 0;
			}
		}
	}

	private void drawCustomString(String tempStr, int x, int y, int r, int g, int b) {
		//음영
		bufferedGraphics.setColor(0 ,0 ,0);
		bufferedGraphics.drawString(tempStr, x+1, y+1, TOPLEFT);

		//진짜글씨
		bufferedGraphics.setColor(r, g, b);
		bufferedGraphics.drawString(tempStr, x, y, TOPLEFT);
	}

	private void drawCustomString2(String tempStr, int x, int y, int r, int g, int b) {
		//음영
		bufferedGraphics.setColor(0 ,0 ,0);
		bufferedGraphics.drawString(tempStr, x+1, y+1, Graphics.HCENTER|Graphics.TOP);

		//진짜글씨
		bufferedGraphics.setColor(r, g, b);
		bufferedGraphics.drawString(tempStr, x, y, Graphics.HCENTER|Graphics.TOP);

		bufferedGraphics.setColor(0, 0, 0);
		bufferedGraphics.drawString(tempStr, x+1, y, Graphics.HCENTER|Graphics.TOP);
		bufferedGraphics.drawString(tempStr, x, y+1, Graphics.HCENTER|Graphics.TOP);
		bufferedGraphics.drawString(tempStr, x-1, y, Graphics.HCENTER|Graphics.TOP);
		bufferedGraphics.drawString(tempStr, x, y-1, Graphics.HCENTER|Graphics.TOP);

		bufferedGraphics.setColor(r, g, b);
		bufferedGraphics.drawString(tempStr, x, y, Graphics.HCENTER|Graphics.TOP);
	}

	private int popupFocus = 0;
	private final static String[] popupMenu = {
		"1. 계속하기", "2. 게임방법", "3. 환경설정", "4. 메인 메뉴가기", "5. 게임종료"};

	//게임중에 팝업창 호출시 팝업창을 그려준다.
	private boolean bFirstPopup = false;
	private void drawPopupWindow() {
		if(bFirstPopup)
		{
			drawGame(nReturnScene);
			bFirstPopup = false;
		}

		bufferedGraphics.setColor(0xffffff);
		bufferedGraphics.fillRect(0, 119-7-80, 100, 80);
		bufferedGraphics.setColor(0x000000);
		bufferedGraphics.drawRect(0, 119-7-80, 100, 80);
		//focus박스
		bufferedGraphics.fillRect(0, 119-7-76+popupFocus*15, 100, 15);
		for(int i=0; i<popupMenu.length; i++)
		{
			if(popupFocus == i)
				bufferedGraphics.setColor(0xffffff);
			else
				bufferedGraphics.setColor(0x000000);
			bufferedGraphics.drawString(popupMenu[i], 2, 15*i+119-7-80+5, Graphics.TOP|Graphics.LEFT);
		}
	}

	private void buildStage(int stageNum) {

		if(stageNum == SCENE_GAME_SURVIVAL)
		{
			realStage = new byte[13][8];
			for( int i = 11; i >= 10; i--) 	//블럭 그리기
				for( int j = 0; j < 6; j++)
					realStage[i][j] = (byte)rand(1, 11);
			stoneFlag = 0;
		}else
		{
			loadStage(stageNum);
			if(stageNum>0 && stageNum<7)		stoneFlag = 4;
			else if(stageNum>6 && stageNum<10)	stoneFlag = 3;
			else if(stageNum>9 && stageNum<14)  stoneFlag = 2;
			else if(stageNum>13 && stageNum<17) stoneFlag = 1;
			else 								stoneFlag = 0;
		}
	}

	private static int rand(int nMin, int nMax) {
		return ((rand.nextInt() >>> 1) % (nMax-nMin)) + nMin;
	}

	private void loadSound()
	{
		try{
			for(int i=1; i<5; i++)
			{
				mPlayer[i] = new MediaPlayer();
				mPlayer[i].setMediaLocation("/snd/" + i + ".mmf");
				mPlayer[i].setVolumeLevel("3");
			}
		}catch(IOException ioe) {System.out.println("error == " + ioe.getMessage());}
	}

	private void loadResource() {
		System.gc();
		System.out.println("start");

		//menu 화면
		drawProgress("menu");
		gameBackTopImg = load("bg1");
		gameBackLeftImg = load("bg2");
		gameBackBottomImg = load("bg3");
		gameBackFeatherImg = load("feather");
		System.out.println("menu");

		//game 화면
		drawProgress("game");
		gameBackImg = load("back");
		gameBlockImg = load("block");
		gameStoneImg = load("stone");
		comboImg = load("combo");
		load(enemyImg, "enemy");
		System.out.println("game");

		//story 화면
		drawProgress("story");
		load(featherImg, "s_feather");
		featherNumImg = load("feather_number");
		load(boomImg, "boom");
		load(gameBackTentImg, "tent");
		System.out.println("story");

		//survival 화면
		drawProgress("survival");
		load(imgActor, "hero");
		load(imgActor2, "s_hero");
		System.out.println("acter");

		drawProgress("sound");
		load(imgButton, "button");
		loadSound();
		System.out.println("sound");

		System.gc();
		nCurrentScene = SCENE_MENU;
		bKeyEnable = true;
	}

	// drawing at loading resources.
//	private int numProgress = 0;		// initial value
//	private int maxProgress = 6;		// wholly 6 tasks

	private void clearScreen(int color)
	{
		bufferedGraphics.setColor(color);
		bufferedGraphics.fillRect(0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);
	}

	synchronized private void drawProgress(String strMainMessage) {
		if (numProgress<maxProgress) numProgress++;

		if (numProgress==1) {
//			clearScreen(0x4949ab);
			clearScreen(0xffffff);
			bufferedGraphics.setColor(0);
			bufferedGraphics.drawString("헤이다", DISPLAY_WIDTH/2, 10, Graphics.TOP|Graphics.HCENTER);
/*
			// Whole Round-Box
			bufferedGraphics.setColor(0xDBDBFF);
			bufferedGraphics.fillRoundRect(5, 5, DISPLAY_WIDTH-10, 119-20, 20, 20);

			// Title(Game Title)
			bufferedGraphics.setColor(0x490055);
			bufferedGraphics.drawString("헤이다", DISPLAY_WIDTH/2, 10, Graphics.TOP|Graphics.HCENTER);
			// Task Bar 10, 70, w-20, 14	120-20
			bufferedGraphics.setColor(0x6D49AB);
			bufferedGraphics.fillRect(11, 54, DISPLAY_WIDTH-22, 14);
*/
			// Company
//			bufferedGraphics.setColor(0x490055);
//			bufferedGraphics.drawString("mobileage.com", DISPLAY_WIDTH/2, 119-15, Graphics.TOP|Graphics.HCENTER);
		} else {
			// Main Meesage(partially deletion(position of text about each task))
//			bufferedGraphics.setColor(0xDBDBFF);
			bufferedGraphics.setColor(0xffffff);
			bufferedGraphics.fillRect(11, 40, DISPLAY_WIDTH-20, 14);
		}

		// Main Message
//		bufferedGraphics.setColor(0x490055);
		bufferedGraphics.setColor(0);
		bufferedGraphics.drawString(strMainMessage, 12, 41, TOPLEFT );

		int nAdjust = (numProgress>2)?numProgress-2:0;//(numProgress-1) / 2;
		draw3DRect((numProgress-1) * (120-21) / maxProgress + 12 - nAdjust, 55,	// x, y
					(120-21)/maxProgress, 12,		// width, height
					0x0000ff, 0x5050FF, 0x000032);
//					0xDB0000, 0xFF6D00, 0x920000);
//		numProgress++;
		repaintAll();
//		serviceRepaints();
	}

	private void repaintAll() {
		repaint(0, 0, DISPLAY_WIDTH, 119);
		waitThread();
	}

	private void waitThread()
	{
		try{
			wait();
		}catch(InterruptedException ie) {}
	}

	private void draw3DRect(int x, int y, int width, int height, int nBaseColor, int nEffectLightColor, int nEffectDarkColor) {
		bufferedGraphics.setColor(nBaseColor);
		bufferedGraphics.fillRect(x, y, width, height);
		bufferedGraphics.setColor(nEffectLightColor);
		bufferedGraphics.drawLine(x, y, x+width-2, y);
		bufferedGraphics.drawLine(x, y, x, y+height-1);
		bufferedGraphics.setColor(nEffectDarkColor);
		bufferedGraphics.drawLine(x+1, y+height-1, x+width-1, y+height-1);
		bufferedGraphics.drawLine(x+width-1, y, x+width-1, y+height-1);
	}

	synchronized private Image load(String strFilename) {
		try {
			//System.out.println("*********************************************************Trying To Loading : /img/" + strFilename + ".png\n\r");
			return Image.createImage("/img/" + strFilename + ".png");
		} catch (IOException ioe) {
			//System.out.println("Exception at Loading : /img/" + strFilename + ".png\n\r" + ioe);
		}
		return null;
	}

	synchronized private void load(Image[] imgArray, String name) {
		for (int nIndex=0; nIndex<imgArray.length; nIndex++)
			imgArray[nIndex] = load(name + nIndex);
	}

	private final static int RMS_MAGIC_CODE = 0x13fd;
	private void loadRecord() {
		try {
			RecordStore rs = RecordStore.openRecordStore("haida", true);
			if (rs.getNumRecords()!=0) {//
				RecordEnumeration re = rs.enumerateRecords(null, null, true);
				try {
					int id = 0;
					while (re.hasNextElement()) {
						id = re.nextRecordId();
						ByteArrayInputStream bais = new ByteArrayInputStream(rs.getRecord(id));
						DataInputStream dis = new DataInputStream(bais);

						try {
							int code = dis.readInt();
							if (code!=RMS_MAGIC_CODE) {
								try {
									dis.close();
								} catch (Exception ex11){}

								try {
									bais.close();
								} catch (Exception ex12){}

								break;
							}
							//for (int n=0; n<2; n++) {
								nStoryScore[4] = dis.readInt();
								nSurvivalScore[4] = dis.readInt();
//								System.out.println("RECORD#" + n + " : " + nScore[n]);
							//}
							readStageNum = dis.readInt();
//							System.out.println("readStageNum = "+readStageNum);
						} catch (IOException ioe) {}

						try {
							dis.close();
						} catch (Exception ex11){}
						try {
							bais.close();
						} catch (Exception ex12){}
						break;
					}
				} catch (RecordStoreException rse1) {
					System.out.println("laod: read error-1.");
				}
			}	// End of 'if (rs.getNumRecords()!=0)'

			// close record stroe
			try {
				rs.closeRecordStore();
			} catch (RecordStoreNotOpenException rsnoe) {
				System.out.println("load: closeRecordStore error.");
			}
		} catch (RecordStoreException rse) {
			System.out.println("load: openRecordStore error.");
		}
	}

/*	private int scoreSort()
	{
		if(storyGameScore >= nScore[0])
		{
			nScore[4] = nScore[3];
			nScore[3] = nScore[2];
			nScore[2] = nScore[1];
			nScore[1] = nScore[0];
			nScore[0] = storyGameScore;
			return 1;
		}else if(storyGameScore >= nScore[1])
		{
			nScore[4] = nScore[3];
			nScore[3] = nScore[2];
			nScore[2] = nScore[1];
			nScore[1] = storyGameScore;
			return 2;
		}else if(storyGameScore >= nScore[2])
		{
			nScore[4] = nScore[3];
			nScore[3] = nScore[2];
			nScore[2] = storyGameScore;
			return 3;
		}else if(storyGameScore >= nScore[3])
		{
			nScore[4] = nScore[3];
			nScore[3] = storyGameScore;
			return 4;
		}else if(storyGameScore >= nScore[4])
		{
			nScore[4] = storyGameScore;
			return 5;
		}
		return 0;
	}
*/
	public void saveRecord() {
//		if(scoreSort() == 0)	return;

		// 1. delete record store if exists
		try {RecordStore.deleteRecordStore("haida");}
		catch (Exception ex) {}

		// 2. make record store
		try {
			RecordStore rs = RecordStore.openRecordStore("haida",true);
			ByteArrayOutputStream baos = new ByteArrayOutputStream();
			DataOutputStream dos = new DataOutputStream(baos);
			try {
				dos.writeInt(RMS_MAGIC_CODE);
//				for(int i=0; i<5; i++)
				dos.writeInt(nStoryScore[4]);
				dos.writeInt(nSurvivalScore[4]);
				dos.writeInt(gameStage);

				byte[] b = baos.toByteArray();
				try {
					rs.addRecord(b,0,b.length);
				}catch (RecordStoreException rse1) {
					//System.out.println("save: add error.");
				}
			} catch (IOException ioe) {
				//System.out.println("save: writing error.");
			}

			// 3. close record store
			try {
				rs.closeRecordStore();
			} catch (RecordStoreNotOpenException rsnoe) {
				//System.out.println("save: closeRecordStore error.");
			}
		} catch (RecordStoreException rse) {
			//System.out.println("save: making error.");
			return;
		}
		//System.out.println("save complete.");
	}

	private void vibStart(int nTime)
	{
		if(bVib)
			Vibration.start(5, nTime);
	}

    private void playSound(MediaPlayer mp){
     	if(!bSound)		return;
		mp.start();
    }

    private void changeVolume(int vol) {
    	for(int i=1; i<mPlayer.length; i++)
    		mPlayer[i].setVolumeLevel(String.valueOf(vol));
    }

   	//get data from JAR resource
	private byte[] readDataFromJar(String path)
	{
		ByteArrayOutputStream bout;
		InputStream in;
		byte[] res = null;
		try
		{
		    in = this.getClass().getResourceAsStream(path);
		    bout = new ByteArrayOutputStream();
		    for ( int ret = in.read(); ret >= 0; ret = in.read() )
		    {
		        bout.write( ret );
		    }
		    res = bout.toByteArray();
		} catch(Exception e){}

		in = null;
		return(res);
   	}

    private void loadStage(int stage)
	{
		try
		{
			byte[] data = readDataFromJar("/data/stage" + stage);
			int len = data.length;
			int i;
			int tmp = 0;
			char ch;
			int index = 0;
			int hole = 0;

			for (i=0; i<len; i++)
			{
				ch = (char)data[i];
				if (ch == '\n')
					tmp += 1;
			}
			realStage = new byte[tmp][8];
			tmp = 0;
			for (i=0; i<len; i++)
			{
				ch = (char)data[i];
				if (ch >= '0' && ch <= '9')
					tmp = tmp * 10 + (ch - '0');
				if(ch == ',')
				{
					realStage[index][hole] = (byte)tmp;
					hole += 1;
					tmp = 0;
				}
				else if (ch == '\n')
				{
					realStage[index][hole] = (byte)tmp;
					tmp = 0;
					hole = 0;
					index += 1;
				}
			}
		}
		catch (Exception e)
		{
			System.out.println(e.toString());
		}
	}
}

// Connection -> (Send) IDF_PACKET_USERINFO -> (send) IDF_PACKET_QUERYRANKING ->
//	(Recive)IDF_PACKET_RANKING -> Disconnect
class RankSoket extends Thread
{
	HaidaCanvas canvas;
	public DataOutputStream output;
	public DataInputStream input;
	StreamConnection connection;

	private static final int IDF_PACKET_USERINFO	 = 0x0F1FFFFFF;
	private static final int IDF_PACKET_QUERYRANKING = 0x003FFFFFF;
	private static final int IDF_PACKET_RANKING		 = 0x0F3FFFFFF;

	byte[] rb;

	int cnt = 0, dataLen = 0;

	public RankSoket(HaidaCanvas hc)
	{
		canvas = hc;
		try{
			System.out.println("111111111");
			connection = (StreamConnection)Connector.open("socket://211.233.81.68:4098");
			System.out.println("22222");
			input = new DataInputStream(connection.openInputStream());
			System.out.println("333333333");
			output = new DataOutputStream(connection.openOutputStream());
			System.out.println("444444444");
			start();
		}catch(IOException ioe){System.out.println("Exception = " + ioe.getMessage());}
	}

	// Receive Protocol: 스토리 랭킹(점수)X4 + 서바이벌 랭킹(점수)X4 + 나의랭킹(스토리모드) +
	// 나의점수(스토리모드) + 나의랭킹(서바이벌 모드) + 나의점수(서바이벌 모드)
	// byte : 4 + 4 + 4 + 4(스토리 랭킹) + 4 + 4 + 4 + 4(서바이벌 랭킹) + 4(내스토리랭킹) +
	//  4(내스토리점수) + 4(내서바이벌랭킹) + 4(내서바이벌점수)

	public void run()
	{
		System.out.println("recive data start......");
		int b, t=0;
		try{
			while(true)
			{
				System.out.println("t == " + t);
				b = input.read();
				if(b == -1)
				{
					readData();
					break;
				}
				rb[t++] = (byte) b;
			}
		}catch(IOException ioe){System.out.println("Receive Data Exception == " + ioe.getMessage());}
	}

	void readData()
	{
		for(int cnt=1; cnt<80; cnt*=8)
		{
			System.out.println("cnt == " + cnt);
			if(cnt < 32)
				canvas.nStoryScore[cnt/8] = ( (rb[cnt-1]*24) + (rb[cnt]*16) + (rb[cnt+1]*8) + (rb[cnt+2]) );
			else if(cnt < 64)
				canvas.nSurvivalScore[(cnt-32)/8] = ( (rb[cnt-1]*24) + (rb[cnt]*16) + (rb[cnt+1]*8) + (rb[cnt+2]) );
			else if(cnt < 72)
				canvas.nStoryScore[4] = ( (rb[cnt-1]*24) + (rb[cnt]*16) + (rb[cnt+1]*8) + (rb[cnt+2]) );
			else
				canvas.nSurvivalScore[4] = ( (rb[cnt-1]*24) + (rb[cnt]*16) + (rb[cnt+1]*8) + (rb[cnt+2]) );
		}
	}

	void writeUserInfo()
	{
		byte[] ub = Phone.getProperty("MIN").getBytes();
		dataLen = ub.length;
		byte[] sb = new byte[dataLen+8];
		// 데이타 크기 (4byte)
		sb[cnt++] = (byte) (dataLen >> 24);
		sb[cnt++] = (byte) (dataLen >> 16);
		sb[cnt++] = (byte) (dataLen >> 8);
		sb[cnt++] = (byte) dataLen;

		// sinal infomation(4byte)
		sb[cnt++] = (byte) (IDF_PACKET_USERINFO >> 24);
		sb[cnt++] = (byte) (IDF_PACKET_USERINFO >> 16);
		sb[cnt++] = (byte) (IDF_PACKET_USERINFO >> 8);
		sb[cnt++] = (byte) (IDF_PACKET_USERINFO);

		// real data(phone number)
		for(int i=0; i<dataLen; i++)
			sb[cnt++] = ub[i];

		cnt = 0;
		writeData(sb);
	}

	void writeScore(int storyScore, int survivalScore)
	{
		byte[] sb = new byte[16];
		// 데이타 크기 (4byte)
		sb[cnt++] = (byte) (8 >> 24);
		sb[cnt++] = (byte) (8 >> 16);
		sb[cnt++] = (byte) (8 >> 8);
		sb[cnt++] = (byte) 8;

		// sinal infomation(4byte)
		sb[cnt++] = (byte) (IDF_PACKET_QUERYRANKING >> 24);
		sb[cnt++] = (byte) (IDF_PACKET_QUERYRANKING >> 16);
		sb[cnt++] = (byte) (IDF_PACKET_QUERYRANKING >> 8);
		sb[cnt++] = (byte) (IDF_PACKET_QUERYRANKING);

		// 스토리모드 점수(4byte)
		sb[cnt++] = (byte) (storyScore >> 24);
		sb[cnt++] = (byte) (storyScore >> 16);
		sb[cnt++] = (byte) (storyScore >> 8);
		sb[cnt++] = (byte) (storyScore);
		// 서바이벌 점수(4byte)
		sb[cnt++] = (byte) (survivalScore >> 24);
		sb[cnt++] = (byte) (survivalScore >> 16);
		sb[cnt++] = (byte) (survivalScore >> 8);
		sb[cnt++] = (byte) (survivalScore);

		cnt=0;
		writeData(sb);
	}

	void writeData(byte[] sb)
	{
		//전송.
		try{
			output.write(sb, 0, sb.length);
			output.flush();
			System.out.println("send data");
		}catch(IOException ioe){System.out.println("Send Data Exception == " + ioe.getMessage());}
	}
}