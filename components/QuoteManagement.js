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
  const [quoteToEdit, setQuoteToEdit] = useState(null);

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
    setQuoteToEdit(null); // Clear edit state on cancel
    fetchQuotes();
  };

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quotes')
        .select('*, quote_line_items(*)') // Fetch quotes and their related items
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

  useEffect(() => {
    fetchQuotes();
  }, []);

  const handleAdd = () => {
    setQuoteToEdit(null);
    setShowForm(true);
  };

  const handleEdit = () => {
    if (selectedQuoteIds.length !== 1) {
      alert('수정할 견적을 하나만 선택해주세요.');
      return;
    }
    const quoteIdToEdit = selectedQuoteIds[0];
    const selectedQuote = quotes.find(q => q.id === quoteIdToEdit);
    if (selectedQuote) {
      setQuoteToEdit(selectedQuote);
      setShowForm(true);
    }
  };

  const handleDelete = async () => {
    // Placeholder for delete functionality
    alert('삭제 기능은 아직 구현되지 않았습니다.');
  };

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
        <td>{quote.total_amount != null ? quote.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
        <td>{quote.currency}</td>
        <td>{quote.memo}</td>
      </tr>
    ));
  };

  return (
    <div>
      {showForm ? (
        <QuoteForm
          onCancel={handleFormCancel}
          fetchQuotes={fetchQuotes}
          quoteToEdit={quoteToEdit}
          setQuoteToEdit={setQuoteToEdit}
        />
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
            <button className={styles.button} onClick={handleAdd}>추가</button>
            <button className={styles.button} onClick={handleEdit}>수정</button>
            <button className={styles.button} onClick={handleDelete}>삭제</button>
          </div>
        </>
      )}
    </div>
  );
}
