import React from 'react';

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    textAlign: 'center',
    padding: '2rem'
  },
  code: {
    fontSize: '6rem',
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: '1rem'
  },
  title: {
    fontSize: '2rem',
    color: '#333',
    marginBottom: '1rem'
  }
};

const NotFoundPage = () => {

  return (
    <div style={styles.wrapper} role="alert" aria-label="Page not found">
      <div style={styles.code}>404</div>
      <h1 style={styles.title}>Page not found</h1>
    </div>
  );
};

export default NotFoundPage;