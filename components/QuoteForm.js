import { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';
import { supabase } from '../lib/supabaseClient';
import currencies from '../data/currencies.json';
import CompanySelectionModal from './CompanySelectionModal';




export default function QuoteForm({ onCancel, fetchQuotes, initialData }) {
  const [formData, setFormData] = useState(initialData || {
    date: new Date().toISOString().split('T')[0],
    company_name: '',
    currency: '',
    vat_rate: 0,
    memo: '',
    remarks: ''
  });
  const [lineItems, setLineItems] = useState(initialData?.line_items || [
    { item_name: '', model_name: '', description: '', quantity: 0, unit_price: 0, amount: 0 }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [currencySuggestions, setCurrencySuggestions] = useState([]);
  const [shippingMethodSuggestions, setShippingMethodSuggestions] = useState([]);
  const [showCurrencySuggestions, setShowCurrencySuggestions] = useState(false);
  const [showShippingMethodSuggestions, setShowShippingMethodSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [currentAutocompleteField, setCurrentAutocompleteField] = useState(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false); // State to control company selection modal

  // Calculate line item amount
  useEffect(() => {
    const updatedLineItems = lineItems.map(item => ({
      ...item,
      amount: (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)
    }));
    // Only update if amounts have actually changed to prevent infinite loops
    if (JSON.stringify(updatedLineItems) !== JSON.stringify(lineItems)) {
      setLineItems(updatedLineItems);
    }
  }, [lineItems.map(item => [item.quantity, item.unit_price]).flat().join('-')]); // Dependency on quantity/unit_price

  const handleMainFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));

    if (name === 'currency') {
      if (value.length > 0) {
        const filteredSuggestions = currencies.filter(currency =>
          currency.toLowerCase().startsWith(value.toLowerCase())
        );
        setCurrencySuggestions(filteredSuggestions);
        setShowCurrencySuggestions(true);
        setActiveSuggestionIndex(-1);
        setCurrentAutocompleteField('currency');
      } else {
        setCurrencySuggestions([]);
        setShowCurrencySuggestions(false);
        setActiveSuggestionIndex(-1);
        setCurrentAutocompleteField(null);
      }
    } else if (name === 'shipping_method') {
      if (value.length > 0) {
        const filteredSuggestions = shippingMethods.filter(method =>
          method.toLowerCase().startsWith(value.toLowerCase())
        );
        setShippingMethodSuggestions(filteredSuggestions);
        setShowShippingMethodSuggestions(true);
        setActiveSuggestionIndex(-1);
        setCurrentAutocompleteField('shipping_method');
      } else {
        setShippingMethodSuggestions([]);
        setShowShippingMethodSuggestions(false);
        setActiveSuggestionIndex(-1);
        setCurrentAutocompleteField(null);
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
    setLineItems([...lineItems, { item_name: '', model_name: '', description: '', quantity: 0, unit_price: 0, amount: 0 }]);
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
    if (currentAutocompleteField === 'currency') {
      setFormData(prevState => ({ ...prevState, currency: suggestion }));
      setCurrencySuggestions([]);
      setShowCurrencySuggestions(false);
    } else if (currentAutocompleteField === 'shipping_method') {
      setFormData(prevState => ({ ...prevState, shipping_method: suggestion }));
      setShippingMethodSuggestions([]);
      setShowShippingMethodSuggestions(false);
    }
    setActiveSuggestionIndex(-1);
    setCurrentAutocompleteField(null);
  };

  const handleKeyDown = (e) => {
    const currentSuggestions = currentAutocompleteField === 'currency' ? currencySuggestions : shippingMethodSuggestions;
    if (currentSuggestions.length === 0) return; 

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prevIndex =>
        (prevIndex + 1) % currentSuggestions.length
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prevIndex =>
        (prevIndex - 1 + currentSuggestions.length) % currentSuggestions.length
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestionIndex !== -1) {
        handleSelectSuggestion(currentSuggestions[activeSuggestionIndex]);
      } else {
        handleSubmit(e); 
      }
    } else if (e.key === 'Escape') {
      setShowCurrencySuggestions(false);
      setShowShippingMethodSuggestions(false);
      setActiveSuggestionIndex(-1);
      setCurrentAutocompleteField(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 1. Insert into quotes table
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .insert([
          {
            date: formData.date,
            company_name: formData.company_name,
            currency: formData.currency,
            vat_rate: formData.vat_rate,
            memo: formData.memo,
            remarks: formData.remarks,
            subtotal: subtotal,
            vat_amount: vatAmount,
            total_amount: totalAmount
          }
        ])
        .select(); // Use .select() to get the inserted data including the ID

      if (quoteError) {
        throw quoteError;
      }

      const newQuoteId = quoteData[0].id;

      // 2. Insert into quote_line_items table
      const lineItemsToInsert = lineItems.map(item => ({
        quote_id: newQuoteId,
        item_name: item.item_name,
        model_name: item.model_name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount
      }));

      const { error: lineItemError } = await supabase
        .from('quote_line_items')
        .insert(lineItemsToInsert);

      if (lineItemError) {
        throw lineItemError;
      }

      alert('견적 정보가 성공적으로 저장되었습니다.');
      onCancel(); // Close the form/modal on success
      fetchQuotes(); // Refresh the main list
    } catch (error) {
      console.error('견적 저장 중 오류 발생:', error.message);
      alert(`견적 저장 중 오류 발생: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompanySelected = (company) => {
    const vatRate = company.currency === 'KRW' ? 10 : 0;
    setFormData(prevState => ({
      ...prevState,
      company_name: company.name,
      currency: company.currency || '',
      memo: company.memo || '',
      vat_rate: vatRate
    }));
    setShowCompanyModal(false);
  };

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const vatAmount = subtotal * (parseFloat(formData.vat_rate) / 100 || 0);
  const totalAmount = subtotal + vatAmount;

  return (
    <div className={styles.formCard} style={{ maxWidth: '1600px', margin: 'auto' }}>
      <h1>{initialData ? '견적 정보 수정' : '신규 견적 등록'}</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Main Section */}
        <div className={styles.sectionTitle}>기본 정보</div>
        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <label htmlFor="date" className={styles.label}>날짜</label>
            <input id="date" className={styles.input} type="date" name="date" value={formData.date} onChange={handleMainFormChange} disabled={submitting} />
          </div>
          <div className={styles.formField}>
            <label htmlFor="company_name" className={styles.label}>업체명</label>
            <input
              id="company_name"
              className={styles.input}
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleMainFormChange}
              disabled={submitting}
              readOnly // Make it readOnly as selection is via modal
              onClick={() => setShowCompanyModal(true)} // Open modal on click
            />
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
              onFocus={() => formData.currency.length > 0 && setCurrencySuggestions(currencies.filter(c => c.toLowerCase().startsWith(formData.currency.toLowerCase())))} // Initial suggestions on focus
              onBlur={() => setTimeout(() => { setShowCurrencySuggestions(false); setCurrentAutocompleteField(null); setActiveSuggestionIndex(-1); }, 100)}
              onKeyDown={e => currentAutocompleteField === 'currency' ? handleKeyDown(e) : undefined}
            />
            {currentAutocompleteField === 'currency' && showCurrencySuggestions && currencySuggestions.length > 0 && (
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

        {/* Line Items Section */}
        <div className={styles.sectionTitle} style={{ marginTop: '2rem' }}>품목 정보</div>
        <div className={styles.lineItemsContainer}>
          <table className={styles.table} style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>품목명</th>
                <th>모델명</th>
                <th>Description</th>
                <th>수량</th>
                <th>단가</th>
                <th>금액</th>
                <th></th> {/* For delete button */}
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, index) => (
                <tr key={index}>
                  <td><input type="text" name="item_name" value={item.item_name} onChange={e => handleLineItemChange(index, e)} className={styles.input} style={{ width: 'auto' }} disabled={submitting} /></td>
                  <td><input type="text" name="model_name" value={item.model_name} onChange={e => handleLineItemChange(index, e)} className={styles.input} style={{ width: 'auto' }} disabled={submitting} /></td>
                  <td><input type="text" name="description" value={item.description} onChange={e => handleLineItemChange(index, e)} className={styles.input} style={{ width: 'auto' }} disabled={submitting} /></td>
                  <td><input type="number" name="quantity" value={item.quantity} onChange={e => handleLineItemChange(index, e)} className={styles.input} style={{ width: 'auto' }} disabled={submitting} /></td>
                  <td><input type="number" name="unit_price" value={item.unit_price} onChange={e => handleLineItemChange(index, e)} className={styles.input} style={{ width: 'auto' }} disabled={submitting} /></td>
                  <td><input type="text" name="amount" value={item.amount.toFixed(2)} readOnly className={styles.input} style={{ width: 'auto', backgroundColor: '#e9ecef' }} /></td>
                  <td>
                    <button type="button" onClick={() => handleRemoveLineItem(index)} className={styles.button} style={{ backgroundColor: '#dc3545', padding: '5px 10px', fontSize: '12px' }} disabled={submitting || lineItems.length === 1}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={handleAddLineItem} className={styles.button} style={{ width: 'auto', marginTop: '1rem' }} disabled={submitting}>품목 추가</button>
        </div>

        {/* Totals Section */}
        <div className={styles.sectionTitle} style={{ marginTop: '2rem' }}>총 금액</div>
        <div className={styles.totalSummary}>
          <div className={styles.formField}>
            <label className={styles.label}>공급가</label>
            <input className={styles.input} type="text" value={subtotal.toFixed(2)} readOnly style={{ backgroundColor: '#e9ecef' }} />
          </div>
          <div className={styles.formField}>
            <label className={styles.label}>VAT</label>
            <input className={styles.input} type="text" value={vatAmount.toFixed(2)} readOnly style={{ backgroundColor: '#e9ecef' }} />
          </div>
          <div className={styles.formField}>
            <label className={styles.label}>합계</label>
            <input className={styles.input} type="text" value={totalAmount.toFixed(2)} readOnly style={{ backgroundColor: '#e9ecef' }} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.buttonGroup} style={{ justifyContent: 'flex-end', marginTop: '2rem' }}>
          <button type="button" className={styles.button} onClick={onCancel} style={{ backgroundColor: '#6c757d' }} disabled={submitting}>취소</button>
          <button type="submit" className={styles.button} disabled={submitting}>저장</button>
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