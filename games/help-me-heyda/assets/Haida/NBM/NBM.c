#include "AEEStdLib.h"
#include "NBM.h"

NBMImage *NBM_Convert(byte *pNbm) {
	//디코딩관련
	byte *pBmp;
	NBMImage *nbm;
	AEEImageInfo imageInfo;
	boolean bVal = TRUE;
	rleInfo rInfo = {0};
	int uIdx;
	int tOffset;
	byte iData;
	byte iDataCnt;
	byte uClrCnt;

	//제어변수
	int i, j;

	///////////////////
	//이미지정보 로딩//
	///////////////////
	MEMCPY(&rInfo, pNbm+54, 11);

	//////////
	//디코딩//
	//////////
	pBmp = (byte *) MALLOC(rInfo.imageSize+1);
	MEMCPY(pBmp, pNbm, 54);				//이미지헤더
	MEMCPY(pBmp+54, pNbm+65, rInfo.paletteCnt*4);

	tOffset = rInfo.paletteCnt*4;
	uClrCnt = 0x01 << rInfo.clrBit;

	uIdx = 1078;
	for(i=0; i < (int) rInfo.imageSize2; i++) {
		iData = *(pNbm+tOffset+i);
		if (iData >= uClrCnt) {
			iDataCnt = iData >> rInfo.clrBit;
			iData = ((byte) (iData << (8-rInfo.clrBit))) >> (8-rInfo.clrBit);
			for(j=0; j < iDataCnt; j++) {
				pBmp[uIdx++] = iData;
			}
		} else {
			iDataCnt = *(pNbm+tOffset+i+1);
			for(j=0; j < iDataCnt; j++) {
				pBmp[uIdx++] = iData;
			}
			i++;
		}
	}

	nbm = (NBMImage *) MALLOC(sizeof(NBMImage));
	nbm->image = CONVERTBMP(pBmp, &imageInfo, &bVal);
	nbm->fWidth = imageInfo.cx;
	nbm->fHeight = imageInfo.cy;
	nbm->nFrames = 1;
	nbm->bVal = bVal;

	if (bVal) FREE(pBmp);

	return nbm;
}

NBMImage *NBM_LoadImage(IShell *pIShell, char *resFile, uint32 offset) {
	//이미지파일 로딩관련
	IFileMgr *pFilemgr;
	IFile *pFile;
	FileInfo fileinfo;
	byte *temp;
	byte imgInfo[65];

	//디코딩관련
	byte *pBmp;
	NBMImage *nbm;
	AEEImageInfo imageInfo;
	boolean bVal = TRUE;
	rleInfo rInfo = {0};
	int uIdx;
	int tOffset;
	byte iData;
	byte iDataCnt;
	byte uClrCnt;

	//제어변수
	int i, j;

	///////////////////
	//이미지파일 로딩//
	///////////////////
	ISHELL_CreateInstance(pIShell, AEECLSID_FILEMGR, (void **)&pFilemgr);
	pFile = IFILEMGR_OpenFile(pFilemgr, resFile, _OFM_READ);
	IFILE_GetInfo(pFile, &fileinfo);
	IFILE_Seek(pFile, _SEEK_START, offset);
	IFILE_Read(pFile, imgInfo, 65);
	MEMCPY(&rInfo, imgInfo+54, 11);
	temp = (byte *) MALLOC(rInfo.imageSize2+rInfo.paletteCnt*4);
	IFILE_Read(pFile, temp, rInfo.imageSize2+rInfo.paletteCnt*4);
	IFILE_Release(pFile);
	IFILEMGR_Release(pFilemgr);

	//////////
	//디코딩//
	//////////
	pBmp = (byte *) MALLOC(rInfo.imageSize+1);
	MEMCPY(pBmp, imgInfo, 54);				//이미지헤더
	MEMCPY(pBmp+54, temp, rInfo.paletteCnt*4);

	tOffset = rInfo.paletteCnt*4;
	uClrCnt = 0x01 << rInfo.clrBit;

	uIdx = 1078;
	for(i=0; i < (int) rInfo.imageSize2; i++) {
		iData = *(temp+tOffset+i);
		if (iData >= uClrCnt) {
			iDataCnt = iData >> rInfo.clrBit;
			iData = ((byte) (iData << (8-rInfo.clrBit))) >> (8-rInfo.clrBit);
			for(j=0; j < iDataCnt; j++) {
				pBmp[uIdx++] = iData;
			}
		} else {
			iDataCnt = *(temp+tOffset+i+1);
			for(j=0; j < iDataCnt; j++) {
				pBmp[uIdx++] = iData;
			}
			i++;
		}
	}

	nbm = (NBMImage *) MALLOC(sizeof(NBMImage));
	nbm->image = CONVERTBMP(pBmp, &imageInfo, &bVal);
	nbm->fWidth = imageInfo.cx;
	nbm->fHeight = imageInfo.cy;
	nbm->nFrames = 1;
	nbm->bVal = bVal;

	if (bVal) FREE(pBmp);

	FREE(temp);

	return nbm;
}

void NBM_Release(NBMImage *nbmImage) {
	if (nbmImage != NULL) {
		if (nbmImage->image != NULL) {
			if (nbmImage->bVal) {
				SYSFREE(nbmImage->image);
			} else {
				FREE(nbmImage->image);
			}
		}
		FREE(nbmImage);
	}
}

void NBM_Draw(IDisplay *pIDisplay, int x, int y, NBMImage *image, AEERasterOp dwRopCode) {
	IDISPLAY_BitBlt(pIDisplay, x, y, image->fWidth, image->fHeight, image->image, 0, 0, dwRopCode);
}

void NBM_Start(IShell *pIShell, IDisplay *pIDisplay, int x, int y, NBMImage *image, AEERasterOp dwRopCode) {
	NBMAnimation *animation;

	animation =  (NBMAnimation *) MALLOC(sizeof(NBMAnimation));
	animation->image = image;
	animation->pIDisplay = pIDisplay;
	animation->pIShell = pIShell;
	animation->x = x;
	animation->y = y;
	animation->dwRopCode =  dwRopCode;
	animation->image->animation = (void *) animation;

	ISHELL_SetTimer(pIShell, image->rate, NBM_Animation, (void *) animation);
}

void NBM_Stop(void *animation) {
	NBMAnimation *ani = (NBMAnimation *) animation;

	ISHELL_CancelTimer(ani->pIShell, NBM_Animation, ani);
	FREE(animation);
}

void NBM_Animation(void *animation) {
	NBMAnimation *ani = (NBMAnimation *) animation;

	if (++ani->image->cFrame >= ani->image->nFrames) ani->image->cFrame=0;

	IDISPLAY_BitBlt(ani->pIDisplay, ani->x, ani->y, ani->image->fWidth, ani->image->fHeight, ani->image->image, ani->image->cFrame*ani->image->fWidth, 0, ani->dwRopCode);
	IDISPLAY_UpdateEx(ani->pIDisplay, TRUE);
	ISHELL_SetTimer(ani->pIShell, ani->image->rate, NBM_Animation, (void *) animation);
}

void NBM_SetParm(NBMImage *nbmImage, int nParm, int p1) {
	switch (nParm) {
		case IPARM_NFRAMES:
			nbmImage->nFrames = p1;
			nbmImage->fWidth = nbmImage->fWidth / p1;
			nbmImage->fHeight = nbmImage->fHeight;
			break;
		case IPARM_RATE:
			nbmImage->rate = p1;
			break;
	}
}