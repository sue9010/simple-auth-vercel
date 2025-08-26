import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Home.module.css';

export default function CompanyRegistration() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const headers = [
    '업체명', '국가', '주소', '담당자', '전화번호', 
    '이메일', '통화', '운송방법', '운송 계정', '메모'
  ];

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

  const renderTableBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={headers.length} style={{ textAlign: 'center', padding: '20px' }}>
            로딩 중...
          </td>
        </tr>
      );
    }

    if (error) {
      return (
        <tr>
          <td colSpan={headers.length} style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
            에러: {error}
          </td>
        </tr>
      );
    }

    if (companies.length === 0) {
      return (
        <tr>
          <td colSpan={headers.length} style={{ textAlign: 'center', padding: '20px' }}>
            업체 정보가 없습니다.
          </td>
        </tr>
      );
    }

    return companies.map(company => (
      <tr key={company.id}>
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
    ));
  };

  return (
    <div>
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
        <button className={styles.button}>추가</button>
        <button className={styles.button}>수정</button>
        <button className={styles.button}>삭제</button>
      </div>
    </div>
  );
}