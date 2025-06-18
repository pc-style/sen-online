import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SoundToggle from './SoundToggle.js';

const Header = () => {
  return (
    <header className="header">
      <div className="container">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            🌙 Sen Online
          </motion.h1>
        </Link>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          ✨ Gra Karciana ✨
        </motion.p>
      </div>
      <SoundToggle />
    </header>
  );
};

export default Header; 