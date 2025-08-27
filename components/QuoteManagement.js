import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Home.module.css';
import QuoteForm from './QuoteForm';

export default function QuoteManagement() {
  const [quotes, setQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuoteIds, setSelectedQuoteIds] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quoteToEdit, setQuoteToEdit] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const headers = [
    '', // Checkbox column header
    '날짜', '업체명', '금액', '통화', '비고'
  ];

  // Effect for filtering quotes based on search term
  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const results = quotes.filter(quote =>
      quote.company_name.toLowerCase().includes(lowercasedSearchTerm)
    );
    setFilteredQuotes(results);
    setCurrentPage(1); // Reset to first page on new search
  }, [searchTerm, quotes]);

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
    setQuoteToEdit(null);
    fetchQuotes();
  };

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quotes')
        .select('*, quote_line_items(*)')
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
    if (selectedQuoteIds.length === 0) {
      alert('삭제할 견적을 선택해주세요.');
      return;
    }

    if (window.confirm(`선택된 ${selectedQuoteIds.length}개의 견적을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      try {
        const { error: itemsError } = await supabase
          .from('quote_line_items')
          .delete()
          .in('quote_id', selectedQuoteIds);

        if (itemsError) throw itemsError;

        const { error: quotesError } = await supabase
          .from('quotes')
          .delete()
          .in('id', selectedQuoteIds);

        if (quotesError) throw quotesError;

        alert(`${selectedQuoteIds.length}개의 견적이 성공적으로 삭제되었습니다.`);
        setSelectedQuoteIds([]);
        fetchQuotes();

      } catch (error) {
        console.error('Error deleting quotes:', error.message);
        alert(`삭제 중 오류가 발생했습니다: ${error.message}`);
      }
    }
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredQuotes.slice(indexOfFirstItem, indexOfLastItem);
  const pageCount = Math.ceil(filteredQuotes.length / itemsPerPage);

  const renderTableBody = () => {
    if (loading) return <tr><td colSpan={headers.length} className={styles.tableMessage}>견적 정보를 불러오는 중...</td></tr>;
    if (error) return <tr><td colSpan={headers.length} className={`${styles.tableMessage} ${styles.error}`}>견적 정보를 불러오는데 오류가 발생했습니다: {error}</td></tr>;
    if (currentItems.length === 0) return <tr><td colSpan={headers.length} className={styles.tableMessage}>{searchTerm ? '검색 결과가 없습니다.' : '견적 정보가 없습니다.'}</td></tr>;

    return currentItems.map(quote => (
      <tr key={quote.id}>
        <td className={styles.checkboxCell}><input type="checkbox" checked={selectedQuoteIds.includes(quote.id)} onChange={() => handleCheckboxChange(quote.id)} /></td>
        <td>{quote.date}</td>
        <td>{quote.company_name}</td>
        <td>{quote.total_amount != null ? quote.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
        <td>{quote.currency}</td>
        <td>{quote.remarks}</td>
      </tr>
    ));
  };

  const renderPagination = () => {
    if (pageCount <= 1) return null;
    const pageNumbers = [];
    for (let i = 1; i <= pageCount; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className={styles.pagination}>
        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>&lt;&lt;</button>
        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>&lt;</button>
        {pageNumbers.map(number => (
          <button key={number} onClick={() => setCurrentPage(number)} className={currentPage === number ? styles.activePage : ''}>
            {number}
          </button>
        ))}
        <button onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))} disabled={currentPage === pageCount}>&gt;</button>
        <button onClick={() => setCurrentPage(pageCount)} disabled={currentPage === pageCount}>&gt;&gt;</button>
      </div>
    );
  };

  return (
    <div>
      {showForm ? (
        <QuoteForm
          onCancel={handleFormCancel}
          fetchQuotes={fetchQuotes}
          quoteToEdit={quoteToEdit}
        />
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="업체명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.tableSearchInput}
            />
          </div>
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
          <div className={styles.bottomControls}>
            <div className={styles.buttonGroup}>
              <button className={styles.button} onClick={handleAdd}>추가</button>
              <button className={styles.button} onClick={handleEdit}>수정</button>
              <button className={styles.button} onClick={handleDelete}>삭제</button>
            </div>
            {renderPagination()}
          </div>
        </>
      )}
    </div>
  );
}
