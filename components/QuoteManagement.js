import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import tableStyles from "../styles/Table.module.css";
import paginationStyles from "../styles/Pagination.module.css";
import commonStyles from "../styles/Common.module.css";
import quotationStyles from "../styles/Quotation.module.css";
import QuoteForm from "./QuoteForm";

export default function QuoteManagement() {
  const router = useRouter();
  const [quotes, setQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuoteIds, setSelectedQuoteIds] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quoteToEdit, setQuoteToEdit] = useState(null);
  const [allSelected, setAllSelected] = useState(false); // New state for select all

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const headers = [
    { label: "", className: tableStyles.checkboxCol },
    { label: "날짜", className: tableStyles.dateCol },
    { label: "업체명" },
    { label: "금액" },
    { label: "통화" },
    { label: "비고" },
    { label: "상태" },
  ];

  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const results = quotes.filter((quote) =>
      quote.company_name.toLowerCase().includes(lowercasedSearchTerm)
    );
    setFilteredQuotes(results);
    setCurrentPage(1);
  }, [searchTerm, quotes]);

  // New handleSelectAll function
  const handleSelectAll = () => {
    const newAllSelected = !allSelected;
    setAllSelected(newAllSelected);
    if (newAllSelected) {
      setSelectedQuoteIds(currentItems.map((quote) => quote.id));
    } else {
      setSelectedQuoteIds([]);
    }
  };

  const handleCheckboxChange = (quoteId) => {
    setSelectedQuoteIds((prevSelected) => {
      const newSelected = prevSelected.includes(quoteId)
        ? prevSelected.filter((id) => id !== quoteId)
        : [...prevSelected, quoteId];

      // Update allSelected state based on the new selection
      if (
        newSelected.length === currentItems.length &&
        currentItems.length > 0
      ) {
        setAllSelected(true);
      } else {
        setAllSelected(false);
      }
      return newSelected;
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
        .from("quotes")
        .select("*, quote_line_items(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuotes(data);
    } catch (err) {
      console.error("Error fetching quotes:", err.message);
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
      alert("수정할 견적을 하나만 선택해주세요.");
      return;
    }
    const quoteIdToEdit = selectedQuoteIds[0];
    const selectedQuote = quotes.find((q) => q.id === quoteIdToEdit);
    if (selectedQuote) {
      setQuoteToEdit(selectedQuote);
      setShowForm(true);
    }
  };

  const handleDelete = async () => {
    if (selectedQuoteIds.length === 0) {
      alert("삭제할 견적을 선택해주세요.");
      return;
    }

    if (
      window.confirm(
        `선택된 ${selectedQuoteIds.length}개의 견적을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
      )
    ) {
      try {
        await supabase
          .from("quote_line_items")
          .delete()
          .in("quote_id", selectedQuoteIds);
        await supabase.from("quotes").delete().in("id", selectedQuoteIds);
        alert(
          `${selectedQuoteIds.length}개의 견적이 성공적으로 삭제되었습니다.`
        );
        setSelectedQuoteIds([]);
        fetchQuotes();
      } catch (error) {
        console.error("Error deleting quotes:", error.message);
        alert(`삭제 중 오류가 발생했습니다: ${error.message}`);
      }
    }
  };

  const handleViewQuotation = () => {
    if (selectedQuoteIds.length !== 1) {
      alert("견적서를 볼 항목을 하나만 선택해주세요.");
      return;
    }
    const quoteId = selectedQuoteIds[0];
    router.push(`/quotes/${quoteId}`);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredQuotes.slice(indexOfFirstItem, indexOfLastItem);
  const pageCount = Math.ceil(filteredQuotes.length / itemsPerPage);

  const renderTableBody = () => {
    if (loading)
      return (
        <tr>
          <td colSpan={headers.length} className={commonStyles.tableMessage}>
            견적 정보를 불러오는 중...
          </td>
        </tr>
      );
    if (error)
      return (
        <tr>
          <td
            colSpan={headers.length}
            className={`${commonStyles.tableMessage} ${commonStyles.error}`}
          >
            견적 정보를 불러오는데 오류가 발생했습니다: {error}
          </td>
        </tr>
      );
    if (currentItems.length === 0)
      return (
        <tr>
          <td colSpan={headers.length} className={commonStyles.tableMessage}>
            {searchTerm ? "검색 결과가 없습니다." : "견적 정보가 없습니다."}
          </td>
        </tr>
      );

    return currentItems.map((quote) => (
      <tr key={quote.id}>
        <td
          className={`${tableStyles.checkboxCell} ${tableStyles.checkboxCol}`}
        >
          <input
            type="checkbox"
            checked={selectedQuoteIds.includes(quote.id)}
            onChange={() => handleCheckboxChange(quote.id)}
          />
        </td>
        <td className={tableStyles.dateCol}>{quote.date}</td>
        <td>{quote.company_name}</td>
        <td>
          {quote.total_amount != null
            ? quote.total_amount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "0.00"}
        </td>
        <td>{quote.currency}</td>
        <td>{quote.remarks}</td>
        <td>{quote.status}</td>
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
      <div className={paginationStyles.pagination}>
        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
          &lt;&lt;
        </button>
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          &lt;
        </button>
        {pageNumbers.map((number) => (
          <button
            key={number}
            onClick={() => setCurrentPage(number)}
            className={
              currentPage === number ? paginationStyles.activePage : ""
            }
          >
            {number}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
          disabled={currentPage === pageCount}
        >
          &gt;
        </button>
        <button
          onClick={() => setCurrentPage(pageCount)}
          disabled={currentPage === pageCount}
        >
          &gt;&gt;
        </button>
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
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "1rem",
            }}
          >
            <input
              type="text"
              placeholder="업체명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={commonStyles.tableSearchInput}
            />
          </div>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th key={headers[0].label} className={headers[0].className}>
                  <div className={tableStyles.checkboxCell}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAll}
                    />
                  </div>
                </th>
                {headers.slice(1).map((header) => (
                  <th key={header.label} className={header.className}>
                    {header.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{renderTableBody()}</tbody>
          </table>
          <div className={paginationStyles.bottomControls}>
            <div className={paginationStyles.buttonGroup}>
              <button className={paginationStyles.button} onClick={handleAdd}>
                추가
              </button>
              <button className={paginationStyles.button} onClick={handleEdit}>
                수정
              </button>
              <button
                className={paginationStyles.button}
                onClick={handleDelete}
              >
                삭제
              </button>
              <button
                className={paginationStyles.button}
                onClick={handleViewQuotation}
                disabled={selectedQuoteIds.length !== 1}
              >
                견적서
              </button>
            </div>
            {renderPagination()}
          </div>
        </>
      )}
    </div>
  );
}
