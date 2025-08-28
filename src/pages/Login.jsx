import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { GoogleAuthProvider, signInWithPopup, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { FcGoogle } from 'react-icons/fc';
import { FiMail, FiUser, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const cardRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Entrance animation
    gsap.fromTo(cardRef.current, 
      { opacity: 0, scale: 0.8, y: 50 },
      { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'back.out(1.7)' }
    );
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // User signed in with Google
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLinkSignIn = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage({ text: 'Please enter your email', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);
      const actionCodeSettings = {
        url: window.location.origin,
        handleCodeInApp: true,
      };
      
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setMessage({ 
        text: 'Check your email for the sign-in link!', 
        type: 'success' 
      });
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Check if we're handling a sign-in link
  if (isSignInWithEmailLink(auth, window.location.href)) {
    let email = window.localStorage.getItem('emailForSignIn');
    if (!email) {
      email = window.prompt('Please provide your email for confirmation');
    }
    
    signInWithEmailLink(auth, email, window.location.href)
      .then(() => {
        window.localStorage.removeItem('emailForSignIn');
      })
      .catch((error) => {
        setMessage({ text: error.message, type: 'error' });
      });
  }

  return (
    <div ref={containerRef} className="auth-screen">
      <button 
        onClick={() => navigate(-1)} 
        className="absolute top-4 left-4 text-gray-600 hover:text-gray-800 transition-colors"
        aria-label="Go back to previous page"
      >
        <FiArrowLeft size={24} />
      </button>
      <div ref={cardRef} className="auth-card glass-effect">
        <div className="auth-header">
          <div className="auth-icon">
            <FiUser size={32} />
          </div>
          <h1 className="auth-title">Welcome to KlassMate</h1>
          <p className="auth-subtitle">Sign in to continue to your account</p>
        </div>

        <div className="auth-form">
          {message.text && (
            <div className={`auth-message ${message.type === 'error' ? 'error' : 'success'}`}>
              {message.text}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input glass-input pl-10 w-full"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <button
            onClick={handleEmailLinkSignIn}
            disabled={isLoading || !email.trim()}
            className="join-btn primary-btn"
          >
            {isLoading ? (
              <div className="loading-spinner" />
            ) : (
              'Send Sign In Link'
            )}
          </button>

          <div className="divider">
            <span>or continue with</span>
          </div>

          <div className="w-full flex justify-center">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="google-signin-btn glass-btn flex items-center justify-center w-full max-w-xs mx-auto"
            >
              <FcGoogle className="w-5 h-5 mr-2" />
              {isLoading ? 'Signing in...' : 'Sign in with Google'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;