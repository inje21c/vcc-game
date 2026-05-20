# 도와줘 헤이다 원본 자료 인벤토리

작성일: 2026-05-20

## 확인된 자료

- `assets/도와줘헤이다.ppt`
  - PowerPoint 문서
  - 2003년 2월 27일 저장된 문서로 확인됨
  - 시나리오/기획 원문일 가능성이 높음
- `assets/도와줘헤이다제안서.ppt`
  - PowerPoint 제안서
  - 2003년 1월 31일 저장된 문서로 확인됨
- `assets/haida.avi`
  - AVI 영상
  - 248 x 244, 15fps, PCM 오디오 포함
  - 원본 플레이/시연 영상일 가능성이 있음
- `assets/Haida/`
  - BREW/C 기반 원본 프로젝트로 보임
  - 주요 소스: `Haida.c`, `haida.h`, `NBM.c`, `NBM.h`
  - 리소스/빌드 산출물: `.bar`, `.bri`, `.mod`, `.dll`, Debug/Release 산출물 등
- `assets/Haida_ktf/`
  - KTF 배포/패키징 자료로 보임
  - `.bar`, `.mod`, `.mif`, `.zip`, `level.dat` 포함
- `assets/Haida_lgt/`
  - LGT용 J2ME 버전으로 보임
  - 주요 소스: `Haida_lgt/Haida/src/Haida.java`
  - 빌드/배포물: `.jar`, `.jad`, `.class`
  - 리소스: `img/`, `data/`, `snd/`

## 현재 읽기 좋은 기준 소스

현대 모바일 프로토타입의 1차 기준은 `assets/Haida_lgt/Haida/src/Haida.java`가 좋아 보인다.

이유:

- 단일 Java 파일 안에 화면 상태, 입력, 게임 루프, 스테이지 로딩, 점수 계산이 비교적 모여 있음
- 이미지 리소스가 PNG로 이미 추출되어 있음
- 스테이지 데이터가 `/data/stage1`부터 `/data/stage18`까지 일반 텍스트 숫자 그리드로 존재함
- BREW/C 버전보다 현대 웹/모바일 구현으로 옮기기 쉽다

BREW/C 버전 `assets/Haida/Haida.c`는 원형 검증과 통신사별 차이 확인용으로 함께 참고한다.

## 파악된 원본 게임 구조

- 원본 화면 크기: `120 x 132`
- 게임 모드:
  - 스토리 모드
  - 서바이벌 모드
- 기본 스테이지:
  - J2ME 리소스 기준 `stage1`부터 `stage18`까지 존재
  - 각 스테이지 파일은 13행 x 8칸 숫자 그리드
- 주요 조작:
  - 위/아래: 캐릭터가 밀 줄을 선택
  - 왼쪽: 선택한 줄 맨 앞 블록을 왼쪽으로 밀어 바닥 영역으로 보냄
  - 오른쪽: 스킬/아이템 사용
  - 확인/FIRE: 메뉴 선택, 결과 진행
  - 별/좌측 소프트키: 팝업
  - 샵/우측 소프트키: 일시정지
- 핵심 규칙 개요:
  - 캐릭터가 한 줄을 선택하고 맨 앞 블록을 밀어낸다.
  - 밀어낸 블록은 아래쪽 수집/판정 라인에 쌓인다.
  - 스토리 모드는 바닥 라인이 같은 블록으로 채워지면 클리어 처리된다.
  - 실패하면 블록 배열이 한 줄 밀리고 실수 카운트가 증가한다.
  - 서바이벌 모드는 바닥 라인에서 같은 블록 4개 조합을 찾는 방식으로 보인다.
  - 콤보가 이어지면 스킬 포인트가 증가한다.
- 시간/점수:
  - 스토리 기본 시간은 `900`
  - 스토리 점수는 남은 시간과 실수 수를 반영한다.
  - 서바이벌 점수는 콤보 기반으로 증가한다.

## 주요 이미지 리소스

J2ME 기준 `assets/Haida_lgt/Haida/output/img/`에 PNG 이미지가 있다.

- `title.png`: 120 x 119
- `grid.png`: 120 x 11
- `bg1.png`: 120 x 13
- `bg2.png`: 16 x 89
- `bg3.png`: 120 x 18
- `back.png`: 104 x 89
- `block.png`: 24 x 96
- `stone.png`: 12 x 7
- `hero0.png` ~ `hero5.png`
- `s_hero0.png` ~ `s_hero3.png`
- `enemy0.png`, `enemy1.png`
- `boom0.png` ~ `boom2.png`
- `feather.png`, `s_feather0.png`, `s_feather1.png`
- `feather_number.png`
- `tent0.png`, `tent1.png`
- `button0.png`, `button1.png`
- `combo.png`
- `logo.png`
- `cursor.png`

주의: `s_feather0.png`는 현재 `file` 기준으로 empty로 표시된다. 다른 버전의 패키지나 원본 리소스에서 대체 파일이 있는지 확인이 필요하다.

## 현대 모바일 버전으로 옮길 때의 1차 방향

- 원본 로직은 J2ME `Haida.java`를 기준으로 TypeScript/Canvas 또는 HTML5 게임 구조로 포팅한다.
- 원본 120 x 132 좌표계는 내부 논리 좌표로 유지하고, 화면에 맞게 정수 배율 또는 레터박스 스케일링한다.
- 피처폰 키 조작은 현대 모바일 터치 조작으로 변환한다.
  - 위/아래: 좌측 세로 슬라이더 또는 보드 행 탭
  - 왼쪽 밀기: 큰 액션 버튼 또는 행에서 좌측 스와이프
  - 오른쪽 아이템: 별도 스킬 버튼
  - FIRE: 화면 하단 확인 버튼
- 먼저 원본 리소스로 플레이 가능한 프로토타입을 만든 뒤, 이후 그래픽을 현대 모바일 해상도에 맞게 리마스터한다.

## 다음 작업 후보

1. PPT 문서에서 시나리오/기획 텍스트 추출
2. J2ME 리소스를 `public/` 또는 `src/assets/`로 복사해 웹 프로토타입에서 바로 로딩
3. `stage1` ~ `stage18`을 JSON 또는 텍스트 로더로 변환
4. 핵심 게임 규칙을 TypeScript로 포팅
5. 120 x 132 원본 좌표계 기반의 첫 번째 Canvas 프로토타입 제작
