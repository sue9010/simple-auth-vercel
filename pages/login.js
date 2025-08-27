
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import loginStyles from "@/styles/Login.module.css";

export default function LoginPage() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        router.push('/dashboard');
      }
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        router.push('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // The onAuthStateChange listener will handle the redirect
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

  // If session exists, we are redirecting, so we can show a loading or null state.
  if (session) {
    return null; 
  }

  return (
    <div className={loginStyles.container}>
      <div className={loginStyles.formCard}>
        <h1>{isSignUp ? 'Sign Up' : 'Login'}</h1>
        <form className={loginStyles.form} onSubmit={isSignUp ? handleSignUp : handleLogin}>
          {isSignUp && (
            <input
              className={loginStyles.input}
              type="text"
              placeholder="Your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          )}
          <input
            className={loginStyles.input}
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className={loginStyles.input}
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className={loginStyles.button} type="submit">
            {isSignUp ? 'Sign Up' : 'Login'}
          </button>
        </form>
        <button onClick={() => setIsSignUp(!isSignUp)} className={loginStyles.toggleButton}>
          {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
}
