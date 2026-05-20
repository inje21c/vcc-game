#ifndef __AEEBILLCOM_H
#define __AEEBILLCOM_H

typedef struct _IEB_KTF_Com		IEB_KTF_Com;

QINTERFACE(IEB_KTF_Com)
{
	DECLARE_IBASE(IEB_KTF_Com)
	void		(*SetNetMgr)(IEB_KTF_Com* po, INetMgr *pNetMgr, ISocket* pISocket);
	int			(*Connect)(IEB_KTF_Com* po, PFNCONNECTCB pfn,void* pUser, boolean bFlag);
	void		(*SetReservedHeaderData)(IEB_KTF_Com* po, char* sUser);
	int			(*Write)(IEB_KTF_Com* po, byte* pBuff, uint16 wBytes, INAddr a, INPort wPort);
};

#define IEB_KTF_COM_AddRef(p)						GET_PVTBL(p,IEB_KTF_Com)->AddRef(p)
#define IEB_KTF_COM_Release(p)						GET_PVTBL(p,IEB_KTF_Com)->Release(p)
#define IEB_KTF_COM_SetNetMgr(p,a, b)				GET_PVTBL(p,IEB_KTF_Com)->SetNetMgr(p,a,b)
#define IEB_KTF_COM_Connect(p,a,b,c)					GET_PVTBL(p,IEB_KTF_Com)->Connect(p,a,b,c)
#define IEB_KTF_COM_SetReservedHeaderData(p,a)		GET_PVTBL(p,IEB_KTF_Com)->SetReservedHeaderData(p,a)
#define IEB_KTF_COM_Write(p,a,b,c,d)					GET_PVTBL(p,IEB_KTF_Com)->Write(p,a,b,c,d)

#define KTF_BREW_EX_VERSION				"1.0"
#define KTF_BREW_EX_VERSION_LEN			10

#define EVT_MAX 		(65535)  /* max value of "unsigned short" */
#define EVT_KTF_BASE (EVT_MAX - 100)

#define EVT_BILLCOM_WRITE_DONE  EVT_KTF_BASE

#define BILLCOM_ERR_EINPROGRESS 	(-3)

typedef struct {	
	int		PacketLength;	
	int		ClasID;	
	char 	BREWAPIVersion[10];
	char 	BREWExtensionVersion[10];
	char 	HandsetModelName[10];
	char 	HandsetMIN[16];
	char 	ChannelInfo[2]; // A, B, C
	char 	HandsetSID[5];
	char 	HandsetNID[5];
	char 	HandsetBID[5];
	char 	HandsetBSCID[5];
	char 	HandsetBestPN[4];
	uint32	DestinationIP;
	uint16	DestinationPort;
	char 	Reserved[10];
} BILL_COM_PACKET;

/*========================================================================

FUNCTION IEB_KTF_Com_SetNetMgr
	void IEB_KTF_Com_SetNetMgr(IEB_KTF_Com*	po, INetMgr *pINetMgr, ISocket* pISocket)

DESCRIPTION


DEPENDENCIES
  none

ARGUMENTS
	[in]pINetMgr : INETMGR Interface
	[in]pISocket : ISOCKET Interface
	
RETURN VALUE
  none

SIDE EFFECTS
  ISOCKET Interface는 SetNetMgr전에 반드시 Create, Bind, Connect처리를 해야 한다.
========================================================================*/

/*========================================================================

FUNCTION IEB_KTF_Com_Connect
	int 		IEB_KTF_Com_Connect(IEB_KTF_Com* po, PFNCONNECTCB* pfn,void* pUser,boolean bFlag);

DESCRIPTION


DEPENDENCIES
  none

ARGUMENTS
	pfn: Connection Callback funtcion pointer
	pUser: Connection callback function argument
	bFlag:Test용인지 여부(TRUE : Test게이트웨이 접속, FALSE : 정식서버 접속)	
	
RETURN VALUE
  	Socket Connect와 동일한 return 값

SIDE EFFECTS
	(IEB_KTF_COM_Write함수의 Argument참조)사이의 접속유무에 대한 ACK를 수신한 후에야 정확하게 데이터 송.수신을 수행할 수 있다.
========================================================================*/

/*========================================================================

FUNCTION IEB_KTF_Com_SetReservedHeaderData
	void	IEB_KTF_Com_SetReservedHeaderData(IEB_KTF_Com* po, char* sUser);

DESCRIPTION
	데이터 전송시 Overhead부분의 reserved 영역을 이용할 수도록함.

DEPENDENCIES
  none

ARGUMENTS
	[in]sUser : User data 	
RETURN VALUE
  	Socket Connect와 동일한 return 값

SIDE EFFECTS
========================================================================*/


/*===========================================================================

FUNCTION IEB_KTF_Com_Write
	int IEB_KTF_Com_Write(IEB_KTF_Com* po, byte* pBuff, uint16 wBytes, INAddr a, INPort wPort, AEECLSID ClasID)

DESCRIPTION


DEPENDENCIES
  none

RETURN VALUE
  none

SIDE EFFECTS
  ISOCKET Interface의 Write와 동일함수
  구현시 a(IPAddr), wPort(INPort)의 값을 반드시 Overhead포멧내의 Destination IP, Destination Port에 입력해야 한다. 
  단 입력시 Network order를 준수해야 한다.
  소켓에 Write 가 끝나면 EVT_BILLCOM_WRITE_DONE 이 호출 App에게 전송되며 wParam 은 전송결과(AEE_NET_SUCCESS,
  AEE_NET_ERROR, AEE_NET_WOULDBLOCK etc...)
  dwParam 은 총 전송된 바이트가 리턴된다.
===========================================================================*/

#endif

