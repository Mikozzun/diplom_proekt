const API_URL = import.meta.env.VITE_API_URL || 'https://frogger-backend.fly.dev';

export default function GoogleSignInButton({ label = 'Sign in with Google' }) {
  function handleClick() {
    const callbackURL = `${window.location.origin}/auth/callback`;
    window.location.href =
      `${API_URL}/api/auth/sign-in/social` +
      `?provider=google` +
      `&callbackURL=${encodeURIComponent(callbackURL)}`;
  }

  return (
    <button onClick={handleClick} style={styles.button}>
      <svg width="18" height="18" viewBox="0 0 48 48" style={styles.icon}>
        <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 29.8 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.4-.1-2.7-.5-4z"/>
        <path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 16 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.7 0-14.4 4.4-17.7 11.7z"/>
        <path fill="#FBBC05" d="M24 45c5.5 0 10.5-1.9 14.4-5l-6.7-5.5C29.6 36.1 26.9 37 24 37c-5.7 0-10.6-3.1-11.8-7.5l-7 5.4C8 41.1 15.4 45 24 45z"/>
        <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-1 2.8-2.8 5-5.2 6.5l6.7 5.5C41.7 37.3 45 31.1 45 24c0-1.4-.1-2.7-.5-4z"/>
      </svg>
      {label}
    </button>
  );
}

const styles = {
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    border: '1px solid #dadce0',
    borderRadius: '6px',
    background: '#fff',
    color: '#3c4043',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    width: '100%',
    justifyContent: 'center',
  },
  icon: {
    flexShrink: 0,
  },
}; 