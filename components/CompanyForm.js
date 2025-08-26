import { useState } from 'react';
import styles from '../styles/Home.module.css'; // Adjust path as needed
import { supabase } from '../lib/supabaseClient';

export default function CompanyForm({ onCancel, fetchCompanies, initialData }) { // Receive onCancel prop
  // State for each input field
  const [formData, setFormData] = useState(initialData || {
    name: '',
    country: '',
    address: '',
    contact_person: '',
    phone: '',
    email: '',
    currency: '',
    shipping_method: '',
    shipping_account: '',
    memo: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let error = null;
      if (initialData) {
        // Update existing company
        const { error: updateError } = await supabase
          .from('companies')
          .update(formData)
          .eq('id', initialData.id);
        error = updateError;
      } else {
        // Insert new company
        const { error: insertError } = await supabase
          .from('companies')
          .insert([formData]);
        error = insertError;
      }

      if (error) {
        throw error;
      }

      alert(initialData ? '업체가 성공적으로 수정되었습니다!' : '업체가 성공적으로 등록되었습니다!');
      onCancel(); // Go back to the table view
      fetchCompanies(); // Re-fetch data after successful insert/update
    } catch (error) {
      alert('오류 발생: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fields = [
    { name: 'name', label: '업체명' },
    { name: 'country', label: '국가' },
    { name: 'address', label: '주소' },
    { name: 'contact_person', label: '담당자' },
    { name: 'phone', label: '전화번호' },
    { name: 'email', label: '이메일' },
    { name: 'currency', label: '통화' },
    { name: 'shipping_method', label: '운송방법' },
    { name: 'shipping_account', label: '운송 계정' },
    { name: 'memo', label: '메모' }
  ];

  return (
    <div className={styles.formCard} style={{ maxWidth: '600px', margin: 'auto' }}>
      <h1>{initialData ? '업체 정보 수정' : '신규 업체 등록'}</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        {fields.map(field => (
          <div key={field.name} className={styles.formField}>
            <label htmlFor={field.name} className={styles.label}>{field.label}</label>
            <input
              id={field.name}
              className={styles.input}
              type="text"
              name={field.name}
              value={formData[field.name]}
              onChange={handleChange}
              disabled={submitting}
              readOnly={field.name === 'name' && !!initialData} // Make 'name' readOnly in edit mode
            />
          </div>
        ))}
        <div className={styles.buttonGroup} style={{ justifyContent: 'flex-end' }}>
          <button type="button" className={styles.button} onClick={onCancel} style={{ backgroundColor: '#6c757d' }} disabled={submitting}>취소</button>
          <button type="submit" className={styles.button} disabled={submitting}>저장</button>
        </div>
      </form>
    </div>
  );
}
