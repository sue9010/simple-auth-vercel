import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from "@/styles/Home.module.css";
import CompanyRegistration from '../components/CompanyRegistration'; // Import the new component
import QuoteManagement from '../components/QuoteManagement'; // Import the new component

export default function Home() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [activeTab, setActiveTab] = useState('구매'); // For dashboard
  const [showSalesSubMenu, setShowSalesSubMenu] = useState(false); // State for sales sub-menu

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      alert(error.error_description || error.message);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signUp({
        email, 
        password, 
        options: { 
          data: { 
            display_name: displayName 
          } 
        }
      });
      if (error) throw error;
      const newWindow = window.open('', '_blank');
      newWindow.document.write(`
        <html lang="ko">
          <head><title>Email Confirmation</title></head>
          <body><h1>이메일을 확인해주세요!</h1><p>인증 링크를 클릭하시면 회원가입이 완료됩니다.</p></body>
        </html>
      `);
      newWindow.document.close();
    } catch (error) {
      alert(error.error_description || error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

    const renderDashboard = () => {
    const renderContent = () => {
      switch (activeTab) {
        case '업체 등록':
          return <CompanyRegistration />;
        case '견적':
          return <QuoteManagement />;
        // Add other cases for other tabs here in the future
        default:
          return <h1>{activeTab}</h1>;
      }
    };

    const navItems = [
      { label: '구매', tab: '구매' },
      { label: '송금', tab: '송금' },
      { 
        label: '판매', 
        isToggle: true, 
        onClick: () => setShowSalesSubMenu(!showSalesSubMenu), 
        subItems: [
          { label: '견적', tab: '견적' },
          { label: '주문', tab: '주문' },
          { label: '생산', tab: '생산' },
          { label: '출고', tab: '출고' },
          { label: '배송', tab: '배송' }
        ]
      },
      { label: '입금', tab: '입금' },
      { label: '업체 등록', tab: '업체 등록' },
      { label: '제품 등록', tab: '제품 등록' }
    ];

    return (
      <div className={styles.dashboardContainer}>
        <nav className={styles.navBar}>
          <div className={styles.navLinks}>
            {navItems.map(item => (
              <div key={item.label}>
                <div 
                  className={`${styles.navLink} ${activeTab === item.tab ? styles.navLinkActive : ''}`}
                  onClick={item.isToggle ? item.onClick : () => setActiveTab(item.tab)}
                >
                  {item.label}
                </div>
                {item.isToggle && showSalesSubMenu && item.subItems && (
                  <div className={styles.navSubMenu}>
                    {item.subItems.map(subItem => (
                      <div
                        key={subItem.label}
                        className={`${styles.navLink} ${styles.navSubLink} ${activeTab === subItem.tab ? styles.navLinkActive : ''}`}
                        onClick={() => setActiveTab(subItem.tab)}
                      >
                        {subItem.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className={styles.navSpacer}></div>
          <div className={styles.userInfo}>
            <p>{session.user.user_metadata.display_name || session.user.email}</p>
            <button className={styles.logoutButton} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </nav>
        <main className={styles.mainContent}>
          {renderContent()}
        </main>
      </div>
    );
  };

  const renderLoginForm = () => (
    <div className={styles.container}>
       <div className={styles.formCard}>
          <h1>{isSignUp ? 'Sign Up' : 'Login'}</h1>
          <form className={styles.form} onSubmit={isSignUp ? handleSignUp : handleLogin}>
            {isSignUp && (
              <input
                className={styles.input}
                type="text"
                placeholder="Your display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            )}
            <input
              className={styles.input}
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className={styles.input}
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className={styles.button} type="submit">
              {isSignUp ? 'Sign Up' : 'Login'}
            </button>
          </form>
          <button onClick={() => setIsSignUp(!isSignUp)} className={styles.toggleButton}>
            {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
          </button>
        </div>
    </div>
  );

  return session ? renderDashboard() : renderLoginForm();
}