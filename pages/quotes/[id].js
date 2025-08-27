import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import dynamic from 'next/dynamic';

const QuotationTemplate = dynamic(() => import('../../components/QuotationTemplate'), {
  ssr: false,
});
import styles from '../../styles/Quotation.module.css';

const QuoteDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const [quoteData, setQuoteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('kr'); // 'kr' or 'en'

  useEffect(() => {
    if (!id) return;

    const fetchQuote = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('quotes')
          .select('*, quote_line_items(*)')
          .eq('id', id)
          .single(); // Fetch a single record

        if (error) {
          throw error;
        }
        if (data) {
          setQuoteData(data);
        } else {
          setError('견적 데이터를 찾을 수 없습니다.');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <QuotationTemplate quoteData={quoteData} language={language} setLanguage={setLanguage} router={router} />
    </div>
  );
};

export default QuoteDetailPage;
