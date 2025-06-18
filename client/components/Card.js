import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import soundEffects from '../utils/soundEffects.js';

const Card = ({ 
  card, 
  isFaceDown, 
  onClick, 
  isSelectable, 
  isSelected, 
  showHoverInfo = false, 
  className = '',
  animationDelay = 0,
  isDealing = false,
  isFlipping = false,
  position = { x: 0, y: 0 },
  targetPosition = { x: 0, y: 0 }
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Helper function to get image filename based on card value and special
  const getCardImage = (card) => {
    if (!card) return null;
    
    // Special cards mapping
    if (card.special === 'takeTwoCards') {
      return '/img/10.png';
    } else if (card.special === 'peekOneCard') {
      return '/img/11.png';
    } else if (card.special === 'swapTwoCards') {
      return '/img/12.png';
    }
    
    // Regular cards use their value as the image number
    return `/img/${card.value}.png`;
  };

  // Helper function to get special ability name in Polish
  const getSpecialName = (special) => {
    switch (special) {
      case 'takeTwoCards':
        return 'Weź dwie karty';
      case 'peekOneCard':
        return 'Podejrzyj jedną';
      case 'swapTwoCards':
        return 'Zamień dwie';
      default:
        return '';
    }
  };

  // Handle card click with sound and animation
  const handleClick = () => {
    if (!onClick || isAnimating) return;
    
    setIsAnimating(true);
    soundEffects.cardPlace();
    
    // Reset animation state after a short delay
    setTimeout(() => setIsAnimating(false), 300);
    
    onClick();
  };

  // Handle hover with sound
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (isSelectable) {
      soundEffects.createTone(600, 0.05, 'sine');
    }
  };

  // Determine CSS classes
  const cardClasses = [
    'game-card',
    'animated-card',
    className,
    isFaceDown ? 'face-down' : 'face-up',
    isSelectable ? 'selectable' : '',
    isSelected ? 'selected' : '',
    isAnimating ? 'animating' : '',
  ].filter(Boolean).join(' ');

  // Animation variants
  const cardVariants = {
    initial: {
      scale: 0,
      rotateY: 180,
      opacity: 0,
      y: -100,
    },
    dealing: {
      scale: 1,
      rotateY: isFaceDown ? 0 : 180,
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: animationDelay,
        ease: "easeOut"
      }
    },
    flipping: {
      rotateY: isFaceDown ? 0 : 180,
      transition: {
        duration: 0.6,
        ease: "easeInOut"
      }
    },
    hover: {
      scale: isSelectable ? 1.05 : 1,
      y: isSelectable ? -8 : 0,
      rotateX: isSelectable ? 5 : 0,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1
      }
    },
    selected: {
      scale: 1.1,
      y: -10,
      boxShadow: "0 10px 25px rgba(90, 98, 145, 0.4)",
      transition: {
        duration: 0.2
      }
    }
  };

  // Particle effect for special cards
  const particleVariants = {
    initial: { opacity: 0, scale: 0 },
    animate: {
      opacity: [0, 1, 0],
      scale: [0, 1, 0],
      y: [-20, -40, -60],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeOut"
      }
    }
  };

  // Render card content based on face-up/down state
  const renderCardContent = () => {
    if (isFaceDown) {
      return (
        <div className="card-back">
          <div className="card-back-pattern">
            <div className="card-back-symbol">♠</div>
            <div className="card-back-symbol">♥</div>
            <div className="card-back-symbol">♦</div>
            <div className="card-back-symbol">♣</div>
          </div>
        </div>
      );
    } else if (card) {
      const imageSrc = getCardImage(card);
      if (imageSrc) {
        return (
          <div className="card-front">
            <img 
              src={imageSrc} 
              alt={`Card ${card.value}${card.special ? ` - ${card.special}` : ''}`}
              className="card-image"
            />
            {card.special && (
              <div className="special-indicator">
                <motion.div
                  className="special-glow"
                  animate={{
                    opacity: [0.5, 1, 0.5],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <AnimatePresence>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="magic-particle"
                      variants={particleVariants}
                      initial="initial"
                      animate="animate"
                      style={{
                        left: `${20 + i * 20}%`,
                        animationDelay: `${i * 0.5}s`
                      }}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        );
      } else {
        return <span className="card-placeholder">?</span>;
      }
    } else {
      return <span className="card-empty">Empty</span>;
    }
  };

  // Render hover overlay with enhanced animations
  const renderHoverOverlay = () => {
    if (!isHovered || !showHoverInfo || !card || isFaceDown) return null;

    return (
      <motion.div 
        className="card-hover-overlay"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
      >
        <div className="card-hover-content">
          <div className="card-hover-value">Wartość: {card.value}</div>
          {card.special && (
            <div className="card-hover-special">{getSpecialName(card.special)}</div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div 
      className={cardClasses}
      variants={cardVariants}
      initial={isDealing ? "initial" : false}
      animate={
        isDealing ? "dealing" :
        isFlipping ? "flipping" :
        isSelected ? "selected" :
        isHovered ? "hover" : {}
      }
      whileTap={isSelectable ? "tap" : {}}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      onAnimationComplete={() => {
        if (isDealing) {
          soundEffects.cardDeal();
        } else if (isFlipping) {
          soundEffects.cardFlip();
        }
      }}
      style={{
        cursor: isSelectable ? 'pointer' : 'default',
        transformStyle: 'preserve-3d'
      }}
    >
      <div className="card-inner">
        {renderCardContent()}
        <AnimatePresence>
          {renderHoverOverlay()}
        </AnimatePresence>
      </div>
      
      {/* Glow effect for selected cards */}
      {isSelected && (
        <motion.div
          className="card-glow"
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [1, 1.05, 1]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </motion.div>
  );
};

export default Card; 