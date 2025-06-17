import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="header">
      <div className="container">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h1>Sen Online</h1>
        </Link>
        <p>Gra Karciana</p>
      </div>
    </header>
  );
};

export default Header; 