import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Home.module.css';

export default function CompanySelectionModal({ onSelectCompany, onClose }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // State for search term

  useEffect(() => {
    async function fetchCompanies() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('companies')
          .select('*');

        if (error) {
          throw error;
        }
        setCompanies(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCompanies();
  }, []);

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectClick = () => {
    if (selectedCompanyId) {
      const selectedCompany = companies.find(comp => comp.id === selectedCompanyId);
      if (selectedCompany) {
        onSelectCompany(selectedCompany);
      }
    }
    onClose();
  };

  const headers = [
    '', // Radio button column
    '업체명', '국가', '주소', '담당자', '전화번호', 
    '이메일', '통화', '운송방법', '운송계정', '메모'
  ];

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} style={{ maxWidth: '1600px' }}>
        <h2>업체 선택</h2>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="업체명 검색..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {loading && <p>로딩 중...</p>}
        {error && <p style={{ color: 'red' }}>에러: {error}</p>}
        {!loading && !error && (
          <table className={styles.table}>
            <thead>
              <tr>
                {headers.map((header, index) => (
                  <th key={index}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={headers.length} style={{ textAlign: 'center', padding: '20px' }}>
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredCompanies.map(company => (
                  <tr key={company.id}>
                    <td className={styles.checkboxCell}> {/* Reusing checkboxCell for radio button */} 
                      <input
                        type="radio"
                        name="selectedCompany"
                        checked={selectedCompanyId === company.id}
                        onChange={() => setSelectedCompanyId(company.id)}
                      />
                    </td>
                    <td>{company.name}</td>
                    <td>{company.country}</td>
                    <td>{company.address}</td>
                    <td>{company.contact_person}</td>
                    <td>{company.phone}</td>
                    <td>{company.email}</td>
                    <td>{company.currency}</td>
                    <td>{company.shipping_method}</td>
                    <td>{company.shipping_account}</td>
                    <td>{company.memo}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
        <div className={styles.buttonGroup} style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button className={styles.button} onClick={onClose} style={{ backgroundColor: '#6c757d' }}>취소</button>
          <button className={styles.button} onClick={handleSelectClick} disabled={!selectedCompanyId}>선택</button>
        </div>
      </div>
    </div>
  );
}
