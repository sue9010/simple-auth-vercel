import { useEffect, useState } from 'react';
import currencies from '../data/currencies.json';
import { supabase } from '../lib/supabaseClient';
import autocompleteStyles from '../styles/Autocomplete.module.css';
import commonStyles from '../styles/Common.module.css';
import quoteFormStyles from '../styles/QuoteForm.module.css';
import tableStyles from '../styles/Table.module.css';
import CompanySelectionModal from './CompanySelectionModal';

export default function QuoteForm({ onCancel, fetchQuotes, quoteToEdit }) {
  const isEditMode = !!quoteToEdit;

  const getInitialFormData = () => ({
    date: new Date().toISOString().split('T')[0],
    company_name: '',
    quotation_id: '',
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
        const { error: quoteError } = await supabase
          .from('quotes')
          .update(quotePayload)
          .eq('id', quoteToEdit.id);

        if (quoteError) throw quoteError;

        const { error: deleteError } = await supabase
          .from('quote_line_items')
          .delete()
          .eq('quote_id', quoteToEdit.id);

        if (deleteError) throw deleteError;

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
        const newQuotePayload = {
          ...quotePayload,
          quotation_id: formData.quotation_id,
        };

        const { data: quoteData, error: quoteError } = await supabase
          .from('quotes')
          .insert([newQuotePayload])
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
    <div className={quoteFormStyles.formCard} style={{ maxWidth: '1800px', margin: 'auto' }}>
      <h1>{isEditMode ? '견적 정보 수정' : '신규 견적 등록'}</h1>
      <form onSubmit={handleSubmit} className={quoteFormStyles.form}>
        <div className={quoteFormStyles.sectionTitle}>기본 정보</div>
        <div className={quoteFormStyles.formGrid}>
          <div className={quoteFormStyles.formField}>
            <label htmlFor="date" className={quoteFormStyles.label}>날짜</label>
            <input id="date" className={quoteFormStyles.input} type="date" name="date" value={formData.date} onChange={handleMainFormChange} disabled={submitting || isEditMode} />
          </div>
          {isEditMode ? (
            <div className={quoteFormStyles.formField}>
              <label htmlFor="quotation_id" className={quoteFormStyles.label}>견적번호</label>
              <input
                id="quotation_id"
                className={quoteFormStyles.input}
                type="text"
                name="quotation_id"
                value={quoteToEdit.quotation_id}
                readOnly
                disabled={true}
                style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }}
              />
            </div>
          ) : null}
          <div className={quoteFormStyles.formField}>
            <label htmlFor="company_name" className={quoteFormStyles.label}>업체명</label>
            <button
              type="button"
              id="company_name"
              className={quoteFormStyles.input}
              onClick={() => !isEditMode && setShowCompanyModal(true)}
              disabled={submitting || isEditMode}
              style={{ textAlign: 'left', color: 'black', backgroundColor: isEditMode ? '#e9ecef' : 'white', cursor: isEditMode ? 'not-allowed' : 'pointer' }}
            >
              {formData.company_name || '업체를 선택하세요'}
            </button>
          </div>
          <div className={quoteFormStyles.formField}>
            <label htmlFor="currency" className={quoteFormStyles.label}>통화</label>
            <input
              id="currency"
              className={quoteFormStyles.input}
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
              <ul className={autocompleteStyles.autocompleteDropdown}>
                {currencySuggestions.map((suggestion, index) => (
                  <li
                    key={suggestion}
                    className={`${autocompleteStyles.autocompleteItem} ${index === activeSuggestionIndex ? autocompleteStyles.autocompleteItemActive : ''}`}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    onMouseEnter={() => setActiveSuggestionIndex(index)}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className={quoteFormStyles.formField}>
            <label htmlFor="vat_rate" className={quoteFormStyles.label}>부가세율 (%)</label>
            <input id="vat_rate" className={quoteFormStyles.input} type="number" name="vat_rate" value={formData.vat_rate} onChange={handleMainFormChange} disabled={submitting} />
          </div>
          <div className={quoteFormStyles.formField}>
            <label htmlFor="memo" className={quoteFormStyles.label}>메모</label>
            <input id="memo" className={quoteFormStyles.input} type="text" name="memo" value={formData.memo} onChange={handleMainFormChange} disabled={submitting} />
          </div>
          <div className={quoteFormStyles.formField}>
            <label htmlFor="remarks" className={quoteFormStyles.label}>비고</label>
            <input id="remarks" className={quoteFormStyles.input} type="text" name="remarks" value={formData.remarks} onChange={handleMainFormChange} disabled={submitting} />
          </div>
        </div>

        <div className={quoteFormStyles.sectionTitle} style={{ marginTop: '2rem' }}>품목 정보</div>
        <table className={tableStyles.table} style={{ width: '100%' }}>
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
                <td><input type="text" name="item_name" value={item.item_name} onChange={e => handleLineItemChange(index, e)} className={quoteFormStyles.input} disabled={submitting} /></td>
                <td><input type="text" name="model_name" value={item.model_name} onChange={e => handleLineItemChange(index, e)} className={quoteFormStyles.input} disabled={submitting} /></td>
                <td><input type="text" name="description" value={item.description} onChange={e => handleLineItemChange(index, e)} className={quoteFormStyles.input} disabled={submitting} /></td>
                <td><input type="number" name="quantity" value={item.quantity} onChange={e => handleLineItemChange(index, e)} className={quoteFormStyles.input} disabled={submitting} /></td>
                <td><input type="number" name="unit_price" value={item.unit_price} onChange={e => handleLineItemChange(index, e)} className={quoteFormStyles.input} disabled={submitting} /></td>
                <td><input type="text" name="amount" value={(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} readOnly className={quoteFormStyles.input} style={{ backgroundColor: '#e9ecef' }} /></td>
                <td>
                  <button type="button" onClick={() => handleRemoveLineItem(index)} className={quoteFormStyles.button} style={{ backgroundColor: '#dc3545' }} disabled={submitting || lineItems.length === 1}>-</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" onClick={handleAddLineItem} className={quoteFormStyles.button} style={{ marginTop: '1rem', width: 'auto' }} disabled={submitting}>품목 추가</button>
        </div>

        <div className={quoteFormStyles.sectionTitle} style={{ marginTop: '2rem' }}>총 금액</div>
        <div className={quoteFormStyles.totalSummary}>
          <div className={quoteFormStyles.formField}>
            <label className={quoteFormStyles.label}>공급가</label>
            <input className={quoteFormStyles.input} type="text" value={subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} readOnly style={{ backgroundColor: '#e9ecef' }} />
          </div>
          <div className={quoteFormStyles.formField}>
            <label className={quoteFormStyles.label}>VAT</label>
            <input className={quoteFormStyles.input} type="text" value={vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} readOnly style={{ backgroundColor: '#e9ecef' }} />
          </div>
          <div className={quoteFormStyles.formField}>
            <label className={quoteFormStyles.label}>합계</label>
            <input className={quoteFormStyles.input} type="text" value={totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} readOnly style={{ backgroundColor: '#e9ecef' }} />
          </div>
        </div>

        <div className={commonStyles.buttonGroup} style={{ justifyContent: 'flex-end', marginTop: '2rem' }}>
          <button type="button" className={commonStyles.button} onClick={onCancel} style={{ backgroundColor: '#6c757d' }} disabled={submitting}>취소</button>
          <button type="submit" className={commonStyles.button} disabled={submitting}>
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