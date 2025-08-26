import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from "@/styles/Home.module.css";

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
      alert('Check your email for the confirmation link!');
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
