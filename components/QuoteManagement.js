import { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';
import QuoteForm from './QuoteForm';
import { supabase } from '../lib/supabaseClient';

export default function QuoteManagement() {
  const [quotes, setQuotes] = useState([]);
  const [selectedQuoteIds, setSelectedQuoteIds] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    fetchQuotes(); // Re-fetch quotes after form is closed
  };

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quotes')
        .select('id, date, company_name, total_amount, currency, memo')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      setQuotes(data);
    } catch (err) {
      console.error('Error fetching quotes:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch quotes on component mount
  useEffect(() => {
    fetchQuotes();
  }, []);

  const renderTableBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={headers.length} style={{ textAlign: 'center', padding: '20px' }}>
            견적 정보를 불러오는 중...
          </td>
        </tr>
      );
    }

    if (error) {
      return (
        <tr>
          <td colSpan={headers.length} style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
            견적 정보를 불러오는데 오류가 발생했습니다: {error}
          </td>
        </tr>
      );
    }

    if (quotes.length === 0) {
      return (
        <tr>
          <td colSpan={headers.length} style={{ textAlign: 'center', padding: '20px' }}>
            견적 정보가 없습니다.
          </td>
        </tr>
      );
    }

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
        <td>{quote.company_name}</td>
        <td>{quote.total_amount ? quote.total_amount.toFixed(2) : '0.00'}</td>
        <td>{quote.currency}</td>
        <td>{quote.memo}</td>
      </tr>
    ));
  };

  return (
    <div>
      {showForm ? (
        <QuoteForm onCancel={handleFormCancel} fetchQuotes={fetchQuotes} />
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
