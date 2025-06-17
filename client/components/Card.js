import React, { useState } from 'react';

const Card = ({ card, isFaceDown, onClick, isSelectable, isSelected, showHoverInfo = false, className = '' }) => {
  const [isHovered, setIsHovered] = useState(false);

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

  // Determine CSS classes
  const cardClasses = [
    'game-card',
    className,
    isFaceDown ? 'face-down' : 'face-up',
    isSelectable ? 'selectable' : '',
    isSelected ? 'selected' : '',
  ].filter(Boolean).join(' ');

  // Render card content based on face-up/down state
  const renderCardContent = () => {
    if (isFaceDown) {
      return <span>?</span>;
    } else if (card) {
      const imageSrc = getCardImage(card);
      if (imageSrc) {
        return (
          <img 
            src={imageSrc} 
            alt={`Card ${card.value}${card.special ? ` - ${card.special}` : ''}`}
            className="card-image"
          />
        );
      } else {
        return <span>?</span>;
      }
    } else {
      return <span>Empty</span>;
    }
  };

  // Render hover overlay
  const renderHoverOverlay = () => {
    if (!isHovered || !showHoverInfo || !card) return null;

    return (
      <div className="card-hover-overlay">
        <div className="card-hover-content">
          <div className="card-hover-value">Wartość: {card.value}</div>
          {card.special && (
            <div className="card-hover-special">{getSpecialName(card.special)}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      className={cardClasses}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={isSelected ? { border: '3px solid var(--color-accent)' } : {}}
    >
      {renderCardContent()}
      {renderHoverOverlay()}
    </div>
  );
};

export default Card; 