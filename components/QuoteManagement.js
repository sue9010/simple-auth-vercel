import { useState } from 'react';
import styles from '../styles/Home.module.css';
import QuoteForm from './QuoteForm'; // Import the new form component

export default function QuoteManagement() {
  const [quotes, setQuotes] = useState([]); // Placeholder for quote data
  const [selectedQuoteIds, setSelectedQuoteIds] = useState([]); // State for selected quote IDs
  const [showForm, setShowForm] = useState(false); // State to toggle between table and form

  const headers = [
    '', // Checkbox column header
    '날짜', '업체명', '금액', '통화', '메모'
  ];

  const handleCheckboxChange = (quoteId) => {
    setSelectedQuoteIds(prevSelected => {
      if (prevSelected.includes(quoteId)) {
        return prevSelected.filter(id => id !== quoteId);
      } else {
        return [...prevSelected, quoteId];
      }
    });
  };

  const handleFormCancel = () => {
    setShowForm(false);
    // Future: re-fetch quotes here
  };

  // Placeholder for future data fetching
  // useEffect(() => { /* fetch quotes */ }, []);

  const renderTableBody = () => {
    if (quotes.length === 0) {
      return (
        <tr>
          <td colSpan={headers.length} style={{ textAlign: 'center', padding: '20px' }}>
            견적 정보가 없습니다.
          </td>
        </tr>
      );
    }

    // Placeholder for actual data rows
    return quotes.map(quote => (
      <tr key={quote.id}>
        <td className={styles.checkboxCell}>
          <input
            type="checkbox"
            checked={selectedQuoteIds.includes(quote.id)}
            onChange={() => handleCheckboxChange(quote.id)}
          />
        </td>
        <td>{quote.date}</td>
        <td>{quote.companyName}</td>
        <td>{quote.amount}</td>
        <td>{quote.currency}</td>
        <td>{quote.memo}</td>
      </tr>
    ));
  };

  return (
    <div>
      {showForm ? (
        <QuoteForm onCancel={handleFormCancel} />
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                {headers.map(header => <th key={header}>{header}</th>)}
              </tr>
            </thead>
            <tbody>
              {renderTableBody()}
            </tbody>
          </table>
          <div className={styles.buttonGroup}>
            <button className={styles.button} onClick={() => setShowForm(true)}>추가</button>
            <button className={styles.button}>수정</button>
            <button className={styles.button}>삭제</button>
          </div>
        </>
      )}
    </div>
  );
}
