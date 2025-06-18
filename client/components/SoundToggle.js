import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import soundEffects from '../utils/soundEffects.js';

const SoundToggle = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const savedSetting = localStorage.getItem('soundEnabled');
    if (savedSetting !== null) {
      const enabled = JSON.parse(savedSetting);
      setSoundEnabled(enabled);
      soundEffects.enabled = enabled;
    }
  }, []);

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    soundEffects.enabled = newState;
    localStorage.setItem('soundEnabled', JSON.stringify(newState));
    
    if (newState) {
      soundEffects.success();
    }
  };

  return (
    <motion.button
      className="sound-toggle"
      onClick={toggleSound}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      title={soundEnabled ? 'Wyłącz dźwięki' : 'Włącz dźwięki'}
    >
      <motion.span
        initial={false}
        animate={{
          rotate: soundEnabled ? 0 : 180,
          scale: soundEnabled ? 1 : 0.8
        }}
        transition={{ duration: 0.3 }}
      >
        {soundEnabled ? '🔊' : '🔇'}
      </motion.span>
    </motion.button>
  );
};

export default SoundToggle; 