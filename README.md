# 전기기사 실기 문제은행

전기기사 실기(필답형) 대비 문제은행 정적 웹사이트.

- **라이브**: https://metasongi.github.io/electric-exam-quiz/
- 회차별 20문제(단답/서술/계산) + 모범답안
- 답 보기 토글, 자가채점(맞았어요/틀렸어요), 유형 필터
- 채점 결과는 브라우저 localStorage(`electric-quiz-progress`)에 저장
- 다크모드 지원, 모바일 친화적

## 새 회차 추가

`quizzes-data.js`의 `QUIZ_SESSIONS` 배열 맨 뒤에 객체를 추가하세요:

```js
{
  id: "2026-10-18-07",
  title: "10월 18일 7시 회차",
  date: "2026-10-18",
  hour: 7,
  questions: [
    { n: 1, type: "단답", q: "문제...", a: "모범답안..." },
    ...
  ]
}
```

