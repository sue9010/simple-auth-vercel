import styles from '../styles/Quotation.module.css';

// Placeholder for company info - replace with actual data later
const myCompanyInfo = {
  kr: {
    name: '주식회사 내회사',
    address: '서울특별시 강남구 테헤란로 123, 45층',
    phone: '02-1234-5678',
    email: 'contact@mycompany.co.kr',
    registration: '123-45-67890',
  },
  en: {
    name: 'MyCompany Inc.',
    address: '45F, 123 Teheran-ro, Gangnam-gu, Seoul, Republic of Korea',
    phone: '+82-2-1234-5678',
    email: 'contact@mycompany.com',
    registration: '123-45-67890',
  },
};

// Labels for internationalization (i18n)
const labels = {
  kr: {
    quotation: '견적서',
    quoteNo: '견적번호',
    date: '날짜',
    to: '수신',
    item: '품목',
    description: '내용',
    quantity: '수량',
    unitPrice: '단가',
    amount: '금액',
    subtotal: '공급가액',
    vat: '부가세',
    total: '합계',
    backToList: '목록으로 돌아가기',
    download: '다운로드',
    print: '인쇄',
  },
  en: {
    quotation: 'QUOTATION',
    quoteNo: 'Quote No.',
    date: 'Date',
    to: 'To',
    item: 'Item',
    description: 'Description',
    quantity: 'Qty',
    unitPrice: 'Unit Price',
    amount: 'Amount',
    subtotal: 'Subtotal',
    vat: 'VAT',
    total: 'Total Amount',
    print: 'Print',
    download: 'Download',
    backToList: 'Back to List',
  },
};

const QuotationTemplate = ({ quoteData, language = 'kr', router, setLanguage }) => {
  const l = labels[language];
  const company = myCompanyInfo[language];

  if (!quoteData) {
    return <div>Loading...</div>;
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert('다운로드 기능은 아직 구현되지 않았습니다.');
    // TODO: Implement PDF download functionality using a library like html2pdf.js
  };

  return (
    <>
      <div className={styles.controls}>
        <button onClick={() => router.back()}>{l.backToList}</button>
        <button onClick={() => setLanguage('kr')} disabled={language === 'kr'}>한국어</button>
        <button onClick={() => setLanguage('en')} disabled={language === 'en'}>English</button>
        <button onClick={handlePrint}>{l.print}</button>
        <button onClick={handleDownload}>{l.download}</button>
      </div>
      <div className={styles.quotationPage}>
        <header className={styles.header}>
          <div className={styles.companyInfo}>
            <h1>{company.name}</h1>
            <p>{company.address}</p>
            <p>Tel: {company.phone} / Email: {company.email}</p>
            <p>{language === 'kr' ? `사업자등록번호: ${company.registration}` : `Business Reg. No: ${company.registration}`}</p>
          </div>
          <div className={styles.quoteDetails}>
            <h2>{l.quotation}</h2>
            <p>{l.date}: {quoteData.date}</p>
          </div>
        </header>

        <section className={styles.customerInfo}>
          <h3>{l.to}: {quoteData.company_name}</h3>
        </section>

        <section style={{ flexGrow: 1 }}>
          <table className={styles.itemsTable}>
            <thead>
              <tr>
                <th>{l.item}</th>
                <th>{l.description}</th>
                <th className={styles.textRight}>{l.quantity}</th>
                <th className={styles.textRight}>{l.unitPrice}</th>
                <th className={styles.textRight}>{l.amount}</th>
              </tr>
            </thead>
            <tbody>
              {quoteData.quote_line_items.map((item, index) => (
                <tr key={index}>
                  <td>{item.item_name}</td>
                  <td>{item.model_name} {item.description && `- ${item.description}`}</td>
                  <td className={styles.textRight}>{item.quantity}</td>
                  <td className={styles.textRight}>{item.unit_price.toLocaleString()}</td>
                  <td className={styles.textRight}>{item.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className={styles.totals}>
          <table className={styles.totalsTable}>
            <tbody>
              <tr>
                <td className={styles.label}>{l.subtotal}</td>
                <td className={styles.value}>{quoteData.subtotal.toLocaleString()}</td>
              </tr>
              <tr>
                <td className={styles.label}>{l.vat} ({quoteData.vat_rate}%)</td>
                <td className={styles.value}>{quoteData.vat_amount.toLocaleString()}</td>
              </tr>
              <tr>
                <td className={styles.label}>{l.total}</td>
                <td className={styles.value}>{quoteData.total_amount.toLocaleString()} {quoteData.currency}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
};

export default QuotationTemplate;
