import styles from "@/styles/Home.module.css";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(''); // State for display name
  const [isSignUp, setIsSignUp] = useState(false);

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
          <head>
            <title>Email Confirmation</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f2f5; text-align: center; }
              div { background: #fff; padding: 2rem 3rem; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }
              h1 { margin-bottom: 1rem; }
              p { color: #555; }
            </style>
          </head>
          <body>
            <div>
              <h1>이메일을 확인해주세요!</h1>
              <p>가입하신 이메일 주소의 받은 편지함을 확인하여<br/>인증 링크를 클릭하시면 회원가입이 완료됩니다.</p>
              <p>(이 창은 닫으셔도 됩니다)</p>
            </div>
          </body>
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

  return (
    <div className={styles.container}>
      {!session ? (
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
      ) : (
        <div className={styles.welcomeCard}>
          <h1>Welcome, {session.user.user_metadata.display_name || session.user.email}!</h1>
          <p>You are now logged in.</p>
          <button className={styles.button} onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
