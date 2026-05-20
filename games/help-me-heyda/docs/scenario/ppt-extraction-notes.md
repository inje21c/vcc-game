# PPT 텍스트 추출 노트

작성일: 2026-05-20

## 추출 상태

현재 작업 환경에는 PowerPoint 변환 도구인 LibreOffice 또는 `catppt`가 없어, `strings` 기반으로 내부 문자열을 추출했다. 완전한 슬라이드 텍스트 복원은 아니지만, 원본 기획의 구조를 짐작할 수 있는 단서가 확인되었다.

## 확인된 문서

- `assets/도와줘헤이다.ppt`
- `assets/도와줘헤이다제안서.ppt`

## 확인된 주요 문구와 단서

- `Haida, Take your hands`
- `GVM GAME`
- `2003`
- `Mobile`
- `Key`
- `User`
- `UI(User Interface)`
- `Title`
- `Game`
- `Mode`
- `Story Mode`
- `Survival Mode`
- `Ending`
- `Story Mode/Survival Mode`
- `Network Real Time Ranking Service`
- `Multi platform Process`
- `SKT`
- `GVM`
- `Minimum Size 120 x 119 pixel`
- `Game / User Info`
- `Take Your Hands.`
- `Survival Mode`
- `Never Ending Game`
- `Game Over`
- `Combo`
- `Event !!`

## 확인된 스크린샷/이미지 참조

PPT 내부에 다음과 같은 파일 참조가 포함되어 있었다.

- `title.JPG`
- `CI.jpg`
- `logo.JPG`
- `char01.JPG`
- `char02.JPG`
- `char03.JPG`
- `help.JPG`
- `menu.JPG`
- `option.JPG`
- `game001.JPG`
- `game002.JPG`
- `game003.JPG`
- `game004.JPG`
- `game005.JPG`
- `score.JPG`
- `item001.JPG`
- `item002.JPG`
- `item003.JPG`
- `sin1_1.JPG`
- `sin1_2.JPG`
- `sin1_3.JPG`
- `sin1_4.JPG`
- `sin1_5.JPG`
- `sin2_1.JPG`
- `sin2_2.JPG`
- `sin3_1.JPG`
- `sin3.JPG`
- `sin3_2.JPG`
- `s_game000.JPG`
- `s_game001.JPG`
- `s_game002.JPG`
- `ranking0.JPG`
- `ranking1.JPG`
- `ranking2.JPG`
- `ranking3.JPG`

## 해석

원본 기획은 피처폰 GVM 게임을 기준으로 작성되었고, 스토리 모드와 서바이벌 모드가 핵심이다. 제안서에는 실시간 네트워크 랭킹과 멀티 플랫폼 처리가 주요 기능으로 언급된 것으로 보인다.

현대 모바일 버전의 첫 프로토타입에서는 원본의 핵심 플레이 규칙과 스테이지를 우선 복원하고, 랭킹/네트워크 기능은 이후 확장 항목으로 분리한다.

## 추후 권장

더 정확한 시나리오 복원이 필요하면 LibreOffice 또는 PowerPoint가 있는 환경에서 PPT를 PDF/이미지/텍스트로 변환한 뒤 재검토한다.
