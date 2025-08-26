import { useEffect, useState } from 'react';
import currencies from '../data/currencies.json';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Home.module.css';
import CompanySelectionModal from './CompanySelectionModal';

export default function QuoteForm({ onCancel, fetchQuotes, quoteToEdit }) {
  const isEditMode = !!quoteToEdit;

  const getInitialFormData = () => ({
    date: new Date().toISOString().split('T')[0],
    company_name: '',
    company_id: null,
    currency: '',
    vat_rate: 0,
    memo: '',
    remarks: ''
  });

  const getInitialLineItems = () => [
    { item_name: '', model_name: '', description: '', quantity: 1, unit_price: 0, amount: 0 }
  ];

  const [formData, setFormData] = useState(getInitialFormData());
  const [lineItems, setLineItems] = useState(getInitialLineItems());
  const [submitting, setSubmitting] = useState(false);
  const [currencySuggestions, setCurrencySuggestions] = useState([]);
  const [showCurrencySuggestions, setShowCurrencySuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  useEffect(() => {
    if (isEditMode && quoteToEdit) {
      setFormData({
        date: quoteToEdit.date,
        company_name: quoteToEdit.company_name,
        company_id: quoteToEdit.company_id,
        currency: quoteToEdit.currency,
        vat_rate: quoteToEdit.vat_rate,
        memo: quoteToEdit.memo || '',
        remarks: quoteToEdit.remarks || ''
      });
      setLineItems(quoteToEdit.quote_line_items && quoteToEdit.quote_line_items.length > 0 ? quoteToEdit.quote_line_items : getInitialLineItems());
    } else {
      setFormData(getInitialFormData());
      setLineItems(getInitialLineItems());
    }
  }, [quoteToEdit, isEditMode]);

  useEffect(() => {
    const updatedLineItems = lineItems.map(item => ({
      ...item,
      amount: (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)
    }));
    if (JSON.stringify(updatedLineItems) !== JSON.stringify(lineItems)) {
      setLineItems(updatedLineItems);
    }
  }, [lineItems]);

  const handleMainFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));

    if (name === 'currency') {
      if (value.length > 0) {
        const filteredSuggestions = currencies.filter(c => c.toLowerCase().startsWith(value.toLowerCase()));
        setCurrencySuggestions(filteredSuggestions);
        setShowCurrencySuggestions(true);
        setActiveSuggestionIndex(-1);
      } else {
        setShowCurrencySuggestions(false);
      }
    }
  };

  const handleLineItemChange = (index, e) => {
    const { name, value } = e.target;
    const list = [...lineItems];
    list[index][name] = value;
    setLineItems(list);
  };

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { item_name: '', model_name: '', description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const handleRemoveLineItem = (index) => {
    if (lineItems.length > 1) {
      const list = [...lineItems];
      list.splice(index, 1);
      setLineItems(list);
    } else {
      alert('최소 한 개의 품목은 있어야 합니다.');
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setFormData(prevState => ({ ...prevState, currency: suggestion }));
    setShowCurrencySuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (showCurrencySuggestions && currencySuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev + 1) % currencySuggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev - 1 + currencySuggestions.length) % currencySuggestions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeSuggestionIndex > -1) {
          handleSelectSuggestion(currencySuggestions[activeSuggestionIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowCurrencySuggestions(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const quotePayload = {
      date: formData.date,
      company_name: formData.company_name,
      company_id: formData.company_id,
      currency: formData.currency,
      vat_rate: formData.vat_rate,
      memo: formData.memo,
      remarks: formData.remarks,
      subtotal: subtotal,
      vat_amount: vatAmount,
      total_amount: totalAmount
    };

    try {
      if (isEditMode) {
        // Update logic
        const { error: quoteError } = await supabase
          .from('quotes')
          .update(quotePayload)
          .eq('id', quoteToEdit.id);

        if (quoteError) throw quoteError;

        // Delete old line items
        const { error: deleteError } = await supabase
          .from('quote_line_items')
          .delete()
          .eq('quote_id', quoteToEdit.id);

        if (deleteError) throw deleteError;

        // Insert new line items
        const newLineItems = lineItems.map(item => ({
          item_name: item.item_name,
          model_name: item.model_name,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
          quote_id: quoteToEdit.id,
        }));
        const { error: itemsError } = await supabase
          .from('quote_line_items')
          .insert(newLineItems);

        if (itemsError) throw itemsError;

        alert('견적 정보가 성공적으로 수정되었습니다.');

      } else {
        // Insert logic (Existing functionality)
        const { data: quoteData, error: quoteError } = await supabase
          .from('quotes')
          .insert([quotePayload])
          .select();

        if (quoteError) throw quoteError;

        const newQuoteId = quoteData[0].id;
        const newLineItems = lineItems.map(item => ({
          item_name: item.item_name,
          model_name: item.model_name,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
          quote_id: newQuoteId,
        }));

        const { error: itemsError } = await supabase
          .from('quote_line_items')
          .insert(newLineItems);

        if (itemsError) throw itemsError;

        alert('견적 정보가 성공적으로 저장되었습니다.');
      }
      
      fetchQuotes();
      onCancel();

    } catch (error) {
      console.error('Error saving quote:', error.message);
      alert(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompanySelected = (company) => {
    const vatRate = company.currency === 'KRW' ? 10 : 0;
    setFormData(prevState => ({
      ...prevState,
      company_name: company.name,
      company_id: company.id,
      currency: company.currency || '',
      memo: company.memo || '',
      vat_rate: vatRate
    }));
    setShowCompanyModal(false);
  };

  const subtotal = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const vatAmount = subtotal * (parseFloat(formData.vat_rate) / 100 || 0);
  const totalAmount = subtotal + vatAmount;

  return (
    <div className={styles.formCard} style={{ maxWidth: '1600px', margin: 'auto' }}>
      <h1>{isEditMode ? '견적 정보 수정' : '신규 견적 등록'}</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.sectionTitle}>기본 정보</div>
        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <label htmlFor="date" className={styles.label}>날짜</label>
            <input id="date" className={styles.input} type="date" name="date" value={formData.date} onChange={handleMainFormChange} disabled={submitting || isEditMode} />
          </div>
          <div className={styles.formField}>
            <label htmlFor="company_name" className={styles.label}>업체명</label>
            <button
              type="button"
              id="company_name"
              className={styles.input}
              onClick={() => !isEditMode && setShowCompanyModal(true)}
              disabled={submitting || isEditMode}
              style={{ textAlign: 'left', color: 'black', backgroundColor: isEditMode ? '#e9ecef' : 'white', cursor: isEditMode ? 'not-allowed' : 'pointer' }}
            >
              {formData.company_name || '업체를 선택하세요'}
            </button>
          </div>
          <div className={styles.formField}>
            <label htmlFor="currency" className={styles.label}>통화</label>
            <input
              id="currency"
              className={styles.input}
              type="text"
              name="currency"
              value={formData.currency}
              onChange={handleMainFormChange}
              disabled={submitting}
              onFocus={() => formData.currency.length > 0 && setCurrencySuggestions(currencies.filter(c => c.toLowerCase().startsWith(formData.currency.toLowerCase())))}
              onBlur={() => setTimeout(() => setShowCurrencySuggestions(false), 100)}
              onKeyDown={handleKeyDown}
            />
            {showCurrencySuggestions && currencySuggestions.length > 0 && (
              <ul className={styles.autocompleteDropdown}>
                {currencySuggestions.map((suggestion, index) => (
                  <li
                    key={suggestion}
                    className={`${styles.autocompleteItem} ${index === activeSuggestionIndex ? styles.autocompleteItemActive : ''}`}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    onMouseEnter={() => setActiveSuggestionIndex(index)}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className={styles.formField}>
            <label htmlFor="vat_rate" className={styles.label}>부가세율 (%)</label>
            <input id="vat_rate" className={styles.input} type="number" name="vat_rate" value={formData.vat_rate} onChange={handleMainFormChange} disabled={submitting} />
          </div>
          <div className={styles.formField}>
            <label htmlFor="memo" className={styles.label}>메모</label>
            <input id="memo" className={styles.input} type="text" name="memo" value={formData.memo} onChange={handleMainFormChange} disabled={submitting} />
          </div>
          <div className={styles.formField}>
            <label htmlFor="remarks" className={styles.label}>비고</label>
            <input id="remarks" className={styles.input} type="text" name="remarks" value={formData.remarks} onChange={handleMainFormChange} disabled={submitting} />
          </div>
        </div>

        <div className={styles.sectionTitle} style={{ marginTop: '2rem' }}>품목 정보</div>
        <table className={styles.table} style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>품목명</th>
              <th>모델명</th>
              <th>Description</th>
              <th>수량</th>
              <th>단가</th>
              <th>금액</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, index) => (
              <tr key={index}>
                <td><input type="text" name="item_name" value={item.item_name} onChange={e => handleLineItemChange(index, e)} className={styles.input} disabled={submitting} /></td>
                <td><input type="text" name="model_name" value={item.model_name} onChange={e => handleLineItemChange(index, e)} className={styles.input} disabled={submitting} /></td>
                <td><input type="text" name="description" value={item.description} onChange={e => handleLineItemChange(index, e)} className={styles.input} disabled={submitting} /></td>
                <td><input type="number" name="quantity" value={item.quantity} onChange={e => handleLineItemChange(index, e)} className={styles.input} disabled={submitting} /></td>
                <td><input type="number" name="unit_price" value={item.unit_price} onChange={e => handleLineItemChange(index, e)} className={styles.input} disabled={submitting} /></td>
                <td><input type="text" name="amount" value={(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} readOnly className={styles.input} style={{ backgroundColor: '#e9ecef' }} /></td>
                <td>
                  <button type="button" onClick={() => handleRemoveLineItem(index)} className={styles.button} style={{ backgroundColor: '#dc3545' }} disabled={submitting || lineItems.length === 1}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" onClick={handleAddLineItem} className={styles.button} style={{ marginTop: '1rem' }} disabled={submitting}>품목 추가</button>

        <div className={styles.sectionTitle} style={{ marginTop: '2rem' }}>총 금액</div>
        <div className={styles.totalSummary}>
          <div className={styles.formField}>
            <label className={styles.label}>공급가</label>
            <input className={styles.input} type="text" value={subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} readOnly style={{ backgroundColor: '#e9ecef' }} />
          </div>
          <div className={styles.formField}>
            <label className={styles.label}>VAT</label>
            <input className={styles.input} type="text" value={vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} readOnly style={{ backgroundColor: '#e9ecef' }} />
          </div>
          <div className={styles.formField}>
            <label className={styles.label}>합계</label>
            <input className={styles.input} type="text" value={totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} readOnly style={{ backgroundColor: '#e9ecef' }} />
          </div>
        </div>

        <div className={styles.buttonGroup} style={{ justifyContent: 'flex-end', marginTop: '2rem' }}>
          <button type="button" className={styles.button} onClick={onCancel} style={{ backgroundColor: '#6c757d' }} disabled={submitting}>취소</button>
          <button type="submit" className={styles.button} disabled={submitting}>
            {isEditMode ? '수정' : '저장'}
          </button>
        </div>
      </form>
      {showCompanyModal && (
        <CompanySelectionModal
          onSelectCompany={handleCompanySelected}
          onClose={() => setShowCompanyModal(false)}
        />
      )}
    </div>
  );
}
