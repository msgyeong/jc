# QA 테스트 결과 폴더

이 폴더에 QA HTML 도구에서 저장한 JSON 파일을 넣어주세요.

## 사용 방법

1. `Docs/qa-test.html`을 브라우저에서 열기
2. 테스트 진행 → 통과/실패 체크 + 이슈 메모 + 스크린샷 첨부
3. **💾 저장 (JSON)** 버튼 클릭 → 다운로드된 JSON 파일을 이 폴더에 넣기
4. git commit & push → 공동개발자도 확인 가능
5. Claude AI에게 "QA 결과 분석해줘" 라고 말하면 이 폴더의 JSON을 읽고 분석

## 파일 형식

- `qa-result-YYYY-MM-DD-HH-mm-ss.json` — QA 결과 JSON
- `JC-QA-결과-YYYY-MM-DD.md` — 마크다운 내보내기 (사람이 읽기 좋음)

## Claude AI 분석 요청 예시

```
QA 결과 분석해줘
Docs/qa-results/ 폴더에 있는 최신 결과 확인하고 버그 수정해
```
