## 2025년 8월 28일 목요일

### CompanyRegistration.js 에러 수정

- **문제**: `CompanyRegistration.js` 파일에서 "Objects are not valid as a React child" 에러 발생. `headers` 배열의 객체를 직접 React 자식으로 렌더링하려고 시도하여 발생.
- **원인**: `<th>` 태그 내에서 `headers.map(header => <th key={header}>{header}</th>)`와 같이 `header` 객체 전체를 렌더링하려고 했기 때문.
- **해결**: `header` 객체의 `label` 속성을 렌더링하고, `className` 속성을 적용하도록 수정.
  - 변경 전: `{headers.map(header => <th key={header}>{header}</th>)}`
  - 변경 후: `{headers.map(header => <th key={header.label} className={header.className}>{header.label}</th>)}`
- **확인**: `QuoteManagement.js` 파일의 `headers` 사용 방식을 분석하여, 해당 파일에서는 `header.label`을 명시적으로 사용하여 에러가 발생하지 않았음을 확인.