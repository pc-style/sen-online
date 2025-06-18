import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../components/Modal.js';
import Button from '../components/Button.js';
import soundEffects from '../utils/soundEffects.js';

const LobbyPage = ({ room, startGame, socket, isHost }) => {
  const [copied, setCopied] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Play notification sound when new player joins
    soundEffects.notification();
  }, [room?.players?.length]);

  if (!room) {
    navigate('/');
    return null;
  }

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(room.id);
    setCopied(true);
    soundEffects.success();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = () => {
    if (room.players.length < 2) {
      soundEffects.error();
      return; // Don't start the game if fewer than 2 players
    }
    soundEffects.gameStart();
    startGame();
    // Don't navigate immediately - wait for the gameStarted event
    // Navigation is handled in App.js when gameStarted event is received
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  const playerVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
    },
    exit: {
      opacity: 0,
      x: 50,
      transition: { duration: 0.2 }
    }
  };

  const pulseVariants = {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div 
      className="lobby-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="lobby-header" variants={itemVariants}>
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          🎮 Pokój: {room.id}
        </motion.h2>
        <Button 
          variant="secondary"
          onClick={handleCopyRoomId}
        >
          {copied ? '✅ Skopiowano!' : '📋 Kopiuj kod pokoju'}
        </Button>
      </motion.div>

      <motion.div className="card" variants={itemVariants}>
        <motion.div className="card-header" variants={itemVariants}>
          <div className="flex justify-between items-center">
            <h3>👥 Gracze ({room.players.length}/5)</h3>
            <Button 
              variant="tertiary"
              size="small"
              onClick={() => {
                setShowRulesModal(true);
                soundEffects.createTone(600, 0.1, 'sine');
              }}
            >
              📖 Zasady gry
            </Button>
          </div>
        </motion.div>
        <motion.div className="card-body" variants={itemVariants}>
          <motion.ul className="player-list">
            <AnimatePresence>
              {room.players.map((player, index) => (
                <motion.li 
                  key={player.id} 
                  className="player-item"
                  variants={playerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  style={{
                    background: player.id === socket.id 
                      ? 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'
                      : player.id === room.host
                      ? 'linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%)'
                      : 'white'
                  }}
                >
                  <motion.span 
                    className={player.id === room.host ? 'player-host' : ''}
                    whileHover={{ scale: 1.02 }}
                  >
                    {player.id === room.host && '👑 '}
                    {player.username}
                    {player.id === room.host ? ' (Host)' : ''}
                    {player.id === socket.id ? ' (Ty)' : ''}
                  </motion.span>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>

          <motion.div
            variants={itemVariants}
            className="mt-2"
          >
            {isHost ? (
              <motion.div
                variants={room.players.length >= 2 ? pulseVariants : {}}
                initial="initial"
                animate={room.players.length >= 2 ? "animate" : "initial"}
              >
                <Button 
                  size="large"
                  variant={room.players.length >= 2 ? "success" : "primary"}
                  onClick={handleStartGame}
                  disabled={room.players.length < 2}
                >
                  {room.players.length < 2 
                    ? '⏳ Potrzeba co najmniej 2 graczy' 
                    : '🚀 Rozpocznij grę'}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                animate={{
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <p>⏰ Oczekiwanie na rozpoczęcie gry przez hosta...</p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showRulesModal && (
          <Modal
            isOpen={showRulesModal}
            title="📖 Zasady gry Sen"
            onClose={() => setShowRulesModal(false)}
          >
            <motion.div 
              className="rules-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <h4>🎯 Cel Gry</h4>
                <p>
                  Celem gry jest zdobycie jak najmniejszej liczby punktów na koniec każdej rundy. 
                  Punkty to suma wartości (kruków) na czterech kartach tworzących "sen" gracza. 
                  Gra kończy się, gdy którykolwiek z graczy przekroczy 100 punktów.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h4 className="mt-2">🎲 Przebieg Rozgrywki</h4>
                <p>
                  W swojej turze gracz musi wykonać jedną z dwóch akcji:
                </p>
                <ul>
                  <li>
                    <strong>Akcja A:</strong> Dobierz kartę ze stosu odkrytego i wymień ją na jedną z czterech kart w swoim śnie.
                  </li>
                  <li>
                    <strong>Akcja B:</strong> Dobierz kartę ze stosu zakrytego, a następnie:
                    <ul>
                      <li>Wymień na jedną z kart w swoim śnie, lub</li>
                      <li>Odrzuć kartę (jeśli jest to karta specjalna, możesz użyć jej zdolności)</li>
                    </ul>
                  </li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h4 className="mt-2">✨ Karty Specjalne</h4>
                <ul>
                  <li><strong>🎴 Weź dwie (5):</strong> Pozwala dobrać 2 wierzchnie karty ze stosu zakrytego, wybrać jedną z nich dla siebie, a drugą odłożyć na stos odkryty.</li>
                  <li><strong>👁️ Podejrzyj jedną (6):</strong> Pozwala w tajemnicy obejrzeć jedną dowolną kartę leżącą na stole (swoją lub przeciwnika).</li>
                  <li><strong>🔄 Zamień dwie (7):</strong> Pozwala zamienić miejscami dwie dowolne karty snów na stole.</li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <h4 className="mt-2">🛌 Zakończenie Rundy</h4>
                <p>
                  Gracz może zawołać "Pobudka!" zamiast wykonywania normalnej akcji. Po tym każdy z pozostałych graczy ma jeszcze jedną turę.
                  Gracz, który zawołał "Pobudka!" i ma najmniej punktów, otrzymuje 0 punktów w tej rundzie. Jeśli nie ma najmniej punktów, 
                  do sumy kruków dolicza karne 5 punktów.
                </p>
              </motion.div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LobbyPage; 