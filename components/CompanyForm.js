import { useState } from 'react';
import countries from '../data/countries.json'; // Import the country list
import currencies from '../data/currencies.json'; // Import the currency list
import shippingMethods from '../data/shipping_methods.json'; // Import the shipping methods list
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Home.module.css'; // Adjust path as needed

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
  const [suggestions, setSuggestions] = useState([]); // State for autocomplete suggestions
  const [showSuggestions, setShowSuggestions] = useState(false); // State to control suggestion visibility
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1); // State for keyboard navigation
  const [currentAutocompleteField, setCurrentAutocompleteField] = useState(null); // To track which field is active for autocomplete

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));

    if (name === 'country') {
      if (value.length > 0) {
        const filteredSuggestions = countries.filter(country =>
          country.toLowerCase().startsWith(value.toLowerCase())
        );
        setSuggestions(filteredSuggestions);
        setShowSuggestions(true);
        setActiveSuggestionIndex(-1); // Reset active index on new input
        setCurrentAutocompleteField('country');
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        setCurrentAutocompleteField(null);
      }
    } else if (name === 'currency') {
      if (value.length > 0) {
        const filteredSuggestions = currencies.filter(currency =>
          currency.toLowerCase().startsWith(value.toLowerCase())
        );
        setSuggestions(filteredSuggestions);
        setShowSuggestions(true);
        setActiveSuggestionIndex(-1);
        setCurrentAutocompleteField('currency');
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        setCurrentAutocompleteField(null);
      }
    } else if (name === 'shipping_method') {
      if (value.length > 0) {
        const filteredSuggestions = shippingMethods.filter(method =>
          method.toLowerCase().startsWith(value.toLowerCase())
        );
        setSuggestions(filteredSuggestions);
        setShowSuggestions(true);
        setActiveSuggestionIndex(-1);
        setCurrentAutocompleteField('shipping_method');
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        setCurrentAutocompleteField(null);
      }
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setFormData(prevState => ({ ...prevState, [currentAutocompleteField]: suggestion }));
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    setCurrentAutocompleteField(null);
  };

  const handleKeyDown = (e) => {
    if (suggestions.length === 0) return; // No suggestions, no navigation

    if (e.key === 'ArrowDown') {
      e.preventDefault(); // Prevent cursor from moving to end of input
      setActiveSuggestionIndex(prevIndex =>
        (prevIndex + 1) % suggestions.length
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); // Prevent cursor from moving to start of input
      setActiveSuggestionIndex(prevIndex =>
        (prevIndex - 1 + suggestions.length) % suggestions.length
      );
    } else if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      if (activeSuggestionIndex !== -1) {
        handleSelectSuggestion(suggestions[activeSuggestionIndex]);
      } else {
        // If no suggestion is highlighted, but Enter is pressed, submit the form
        // This case should ideally not happen if suggestions are shown and Enter is pressed
        // but as a fallback, allow form submission if no suggestion is active
        handleSubmit(e); 
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
      setCurrentAutocompleteField(null);
    }
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
              onFocus={() => {
                if (field.name === 'country' && formData.country.length > 0) {
                  setSuggestions(countries.filter(c => c.toLowerCase().startsWith(formData.country.toLowerCase())));
                  setShowSuggestions(true);
                  setCurrentAutocompleteField('country');
                } else if (field.name === 'currency' && formData.currency.length > 0) {
                  setSuggestions(currencies.filter(c => c.toLowerCase().startsWith(formData.currency.toLowerCase())));
                  setShowSuggestions(true);
                  setCurrentAutocompleteField('currency');
                } else if (field.name === 'shipping_method' && formData.shipping_method.length > 0) {
                  setSuggestions(shippingMethods.filter(m => m.toLowerCase().startsWith(formData.shipping_method.toLowerCase())));
                  setShowSuggestions(true);
                  setCurrentAutocompleteField('shipping_method');
                } else {
                  setSuggestions([]);
                  setShowSuggestions(false);
                  setCurrentAutocompleteField(null);
                }
              }}
              onBlur={() => setTimeout(() => {
                setShowSuggestions(false);
                setCurrentAutocompleteField(null);
                setActiveSuggestionIndex(-1);
              }, 100)} // Delay to allow click on suggestion
              onKeyDown={field.name === 'country' || field.name === 'currency' || field.name === 'shipping_method' ? handleKeyDown : undefined} // Add keydown for country, currency, and shipping_method fields
            />
            {currentAutocompleteField === field.name && showSuggestions && suggestions.length > 0 && (
              <ul className={styles.autocompleteDropdown}>
                {suggestions.map((suggestion, index) => (
                  <li
                    key={suggestion}
                    className={`${styles.autocompleteItem} ${index === activeSuggestionIndex ? styles.autocompleteItemActive : ''}`}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    onMouseEnter={() => setActiveSuggestionIndex(index)} // Highlight on hover
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
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
