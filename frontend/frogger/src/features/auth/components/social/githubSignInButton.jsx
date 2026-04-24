const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function GitHubSignInButton({ label = 'Sign in with GitHub' }) {
  function handleClick() {
    const callbackURL = `${window.location.origin}/auth/callback`;
    window.location.href =
      `${API_URL}/api/auth/sign-in/social` +
      `?provider=github` +
      `&callbackURL=${encodeURIComponent(callbackURL)}`;
  }

  return (
    <button onClick={handleClick} style={styles.button}>
      <svg width="18" height="18" viewBox="0 0 24 24" style={styles.icon} fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.1.82-.26.82-.58v-2.03c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.69.82.57C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
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
    border: '1px solid #30363d',
    borderRadius: '6px',
    background: '#24292f',
    color: '#fff',
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