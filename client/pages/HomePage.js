import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button.js';
import soundEffects from '../utils/soundEffects.js';

const HomePage = ({ username, setUsername, createRoom, joinRoom, isAuthenticated }) => {
  const [roomIdToJoin, setRoomIdToJoin] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const navigate = useNavigate();

  // Check if user is coming from a game and redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleCreateRoom = () => {
    soundEffects.success();
    createRoom();
    // Navigation will be handled in App.js when roomCreated event is received
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (roomIdToJoin.trim()) {
      soundEffects.notification();
      joinRoom(roomIdToJoin);
      // Navigation will be handled in App.js when roomJoined event is received
    }
  };

  const handleUsernameSubmit = (e) => {
    if (e.key === 'Enter' && username.trim()) {
      soundEffects.success();
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
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

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const formVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: 'auto',
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <motion.div 
      className="home-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="card" variants={cardVariants}>
        <motion.div className="card-header" variants={itemVariants}>
          <h2>Witaj w grze Sen Online</h2>
        </motion.div>
        <div className="card-body">
          {!username ? (
            <motion.div variants={itemVariants}>
              <p className="mb-2">Aby rozpocząć, wprowadź swoją nazwę użytkownika:</p>
              <div className="form-group">
                <motion.input
                  type="text"
                  className="form-input"
                  placeholder="Twoja nazwa..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleUsernameSubmit}
                  whileFocus={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div variants={itemVariants}>
              <motion.p 
                className="mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Witaj, <strong>{username}</strong>! Co chcesz zrobić?
              </motion.p>
              
              <motion.div 
                className="home-buttons"
                variants={itemVariants}
              >
                <Button 
                  size="large" 
                  onClick={handleCreateRoom}
                  variant="success"
                >
                  🎮 Utwórz pokój
                </Button>
                <Button 
                  size="large" 
                  variant="secondary"
                  onClick={() => {
                    setShowJoinForm(!showJoinForm);
                    soundEffects.createTone(400, 0.1, 'sine');
                  }}
                >
                  🚪 Dołącz do pokoju
                </Button>
              </motion.div>
              
              <AnimatePresence>
                {showJoinForm && (
                  <motion.div 
                    className="mt-2"
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <form onSubmit={handleJoinRoom}>
                      <div className="form-group">
                        <label className="form-label">Podaj kod pokoju:</label>
                        <motion.input
                          type="text"
                          className="form-input"
                          placeholder="np. A1B2C3"
                          value={roomIdToJoin}
                          onChange={(e) => setRoomIdToJoin(e.target.value)}
                          whileFocus={{ scale: 1.02 }}
                          transition={{ duration: 0.2 }}
                          autoFocus
                        />
                      </div>
                      <Button 
                        type="submit" 
                        disabled={!roomIdToJoin.trim()}
                        variant="primary"
                      >
                        ✨ Dołącz
                      </Button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </motion.div>

      <motion.div 
        className="card mt-2" 
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.4 }}
      >
        <motion.div className="card-header" variants={itemVariants}>
          <h3>🌙 Jak grać?</h3>
        </motion.div>
        <motion.div className="card-body" variants={itemVariants}>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <strong>Sen</strong> to gra karciana, w której gracze starają się uzyskać jak najniższy wynik punktowy poprzez 
            manipulowanie czterema kartami leżącymi przed nimi. Celem jest zdobycie jak najmniej punktów na koniec każdej rundy.
          </motion.p>
          <motion.p 
            className="mt-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            Gra kończy się, gdy którykolwiek z graczy przekroczy 100 punktów. Zwycięzcą zostaje osoba, 
            która ma w tym momencie najmniej punktów.
          </motion.p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default HomePage; 