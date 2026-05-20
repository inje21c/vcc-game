#include "AEEFile.h"
#include "AEEStdLib.h"

typedef struct RGBQUAD {
	byte Red;
	byte Green;
	byte Blue;
	byte reserved;
} RGBQUAD;

typedef struct BITMAPFILEHEADER {
	uint16 bfType;
	uint32 bfSize;
	uint16 bfReserved1;
	uint16 bfReserved2;
	uint32 bfOffBits;
}	BITMAPFILEHEADER;

typedef struct BITMAPINFOHEADER {
	uint32 biSize;
	uint32 biWidth;
	uint32 biHeight;
	uint16 biPlanes;
	uint16 bitCount;
	uint32 biCompression;
	uint32 biSizeImage;
	uint32 biXPelsPerMeter;
	uint32 biYPelsPerMeter;
	uint32 biClrUsed;
	uint32 biClrImportant;
} BITMAPINFOHEADER;

typedef struct rleInfo {
	uint32 imageSize;
	uint32 imageSize2;
	uint16 paletteCnt;
	byte clrBit;
} rleInfo;

typedef struct NBMImage {
	void *image;

	uint16 nFrames;				//프레임 개수
	uint16 fWidth;				//프레임당 넓이
	uint16 fHeight;				//프레임당 높이
	uint16 cFrame;				//현재 애니메이션 프레임번호
	boolean bVal;					//시스템 메모리 사용여부

	void *animation;			//아래 나오는 NBMAnimation을 가리키기용 포인터

	uint16 rate;
} NBMImage;

typedef struct NBMAnimation {
	IShell *pIShell;
	IDisplay *pIDisplay;
	NBMImage *image;
	uint16 x;
	uint16 y;
	AEERasterOp dwRopCode;
} NBMAnimation;

NBMImage *NBM_Convert(byte *pNbm);
NBMImage *NBM_LoadImage(IShell *pIShell, char *resFile, uint32 offset);
void NBM_Release(NBMImage *nbmImage);
void NBM_Draw(IDisplay *pIDisplay, int x, int y, NBMImage *image, AEERasterOp dwRopCode);
void NBM_Start(IShell *pIShell, IDisplay *pIDisplay, int x, int y, NBMImage *image, AEERasterOp dwRopCode);
void NBM_Stop(void *animation);
void NBM_Animation(void *animation);
void NBM_SetParm(NBMImage *nbmImage, int nParm, int p1);