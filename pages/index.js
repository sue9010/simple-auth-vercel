import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from "@/styles/Home.module.css";

export default function Home() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [activeTab, setActiveTab] = useState('구매'); // For dashboard

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

  const renderDashboard = () => (
    <div className={styles.dashboardContainer}>
      <nav className={styles.navBar}>
        <div className={styles.navLinks}>
          {['구매', '송금', '판매', '입금'].map(tab => (
            <div 
              key={tab}
              className={`${styles.navLink} ${activeTab === tab ? styles.navLinkActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
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
        <h1>{activeTab}</h1>
        {/* Content for each tab will go here */}
      </main>
    </div>
  );

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