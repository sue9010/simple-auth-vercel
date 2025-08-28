import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import commonStyles from '../styles/Common.module.css';
import tableStyles from '../styles/Table.module.css';
import CompanyForm from './CompanyForm'; // Import the new form component

export default function CompanyRegistration() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false); // State to toggle between table and form
  const [selectedCompanyIds, setSelectedCompanyIds] = useState([]); // State for selected company IDs
  const [companyToEdit, setCompanyToEdit] = useState(null); // State for company being edited



  const headers = [
    { label: "", className: tableStyles.checkboxCol },
    { label: "업체명" },
    { label: "국가" },
    { label: "주소" },
    { label: "담당자" },
    { label: "전화번호" },
    { label: "이메일"},
    { label: "통화",className: tableStyles.Col1 },
    { label: "운송방법",className: tableStyles.Col1  },
    { label: "운송계정" },
    { label: "메모" }
  ];

  // Function to fetch companies
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

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleCheckboxChange = (companyId) => {
    setSelectedCompanyIds(prevSelected => {
      if (prevSelected.includes(companyId)) {
        return prevSelected.filter(id => id !== companyId);
      } else {
        return [...prevSelected, companyId];
      }
    });
  };

  const handleEditClick = () => {
    if (selectedCompanyIds.length === 0) {
      alert('수정할 업체를 선택해주세요.');
      return;
    }
    if (selectedCompanyIds.length > 1) {
      alert('하나의 업체만 선택하여 수정할 수 있습니다.');
      return;
    }

    const selectedCompany = companies.find(comp => comp.id === selectedCompanyIds[0]);
    if (selectedCompany) {
      setCompanyToEdit(selectedCompany);
      setShowForm(true);
    }
  };

  const handleDeleteClick = async () => {
    if (selectedCompanyIds.length === 0) {
      alert('삭제할 업체를 선택해주세요.');
      return;
    }

    if (window.confirm('선택된 업체를 정말 삭제하시겠습니까?')) {
      try {
        const { error } = await supabase
          .from('companies')
          .delete()
          .in('id', selectedCompanyIds);

        if (error) {
          throw error;
        }

        alert('선택된 업체가 성공적으로 삭제되었습니다!');
        setSelectedCompanyIds([]); // Clear selections
        fetchCompanies(); // Re-fetch data
      } catch (error) {
        alert('오류 발생: ' + error.message);
      }
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setCompanyToEdit(null); // Clear company to edit
    setSelectedCompanyIds([]); // Clear selections
    fetchCompanies(); // Re-fetch data to ensure latest state
  };

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
        <td className={tableStyles.checkboxCell}>
          <input
            type="checkbox"
            checked={selectedCompanyIds.includes(company.id)}
            onChange={() => handleCheckboxChange(company.id)}
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
    ));
  };

  return (
    <div>
      {showForm ? (
        <CompanyForm onCancel={handleFormCancel} fetchCompanies={fetchCompanies} initialData={companyToEdit} />
      ) : (
        <>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                {headers.map(header => <th key={header.label} className={header.className}>{header.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {renderTableBody()}
            </tbody>
          </table>
          <div className={commonStyles.buttonGroup}>
            <button className={commonStyles.button} onClick={() => setShowForm(true)}>추가</button>
            <button className={commonStyles.button} onClick={handleEditClick}>수정</button>
            <button className={commonStyles.button} onClick={handleDeleteClick}>삭제</button>
          </div>
        </>
      )}
    </div>
  );
}
