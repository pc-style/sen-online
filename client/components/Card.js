import React from 'react';

const Card = ({ card, isFaceDown, onClick, isSelectable, isSelected }) => {
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
    isFaceDown ? 'face-down' : 'face-up',
    isSelectable ? 'selectable' : '',
    isSelected ? 'selected' : '',
  ].filter(Boolean).join(' ');

  // Render card content based on face-up/down state
  const renderCardContent = () => {
    if (isFaceDown) {
      return <span>?</span>;
    } else if (card) {
      return (
        <>
          <div className="card-value">{card.value !== undefined ? card.value : '?'}</div>
          {card.special && (
            <div className="card-special">{getSpecialName(card.special)}</div>
          )}
        </>
      );
    } else {
      return <span>Empty</span>;
    }
  };

  return (
    <div 
      className={cardClasses}
      onClick={onClick}
      style={isSelected ? { border: '3px solid var(--color-accent)' } : {}}
    >
      {renderCardContent()}
    </div>
  );
};

export default Card; 