import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card.js';
import Modal from '../components/Modal.js';

const GamePage = ({ 
  room, 
  gameState, 
  privateGameState, 
  playerId, 
  makeMove, 
  callPobudka 
}) => {
  const navigate = useNavigate();
  const [selectedCard, setSelectedCard] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [showSpecialModal, setShowSpecialModal] = useState(false);
  const [specialType, setSpecialType] = useState(null);
  const [specialTargets, setSpecialTargets] = useState([]);
  const [roundOver, setRoundOver] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Get current player
  const currentPlayer = room?.players?.find(p => p.id === gameState?.currentPlayer);
  const player = room?.players?.find(p => p.id === playerId);
  const isCurrentPlayer = currentPlayer?.id === playerId;

  // Check for round end
  useEffect(() => {
    if (gameState?.roundEnded && !roundOver) {
      setRoundOver(true);
    }
  }, [gameState, roundOver]);

  // Check for game over
  useEffect(() => {
    if (room?.players?.some(p => p.score >= 100)) {
      setGameOver(true);
    }
  }, [room]);

  // Helper function to check if card is known
  const isCardKnown = (cardIndex) => {
    return privateGameState && privateGameState.knownCards && 
           privateGameState.knownCards.hasOwnProperty(cardIndex);
  };

  // Get card from known cards or return null (face down)
  const getKnownCard = (cardIndex) => {
    return (privateGameState && privateGameState.knownCards) ? 
           privateGameState.knownCards[cardIndex] : null;
  };

  // Handle deck click
  const handleDeckClick = () => {
    if (!isCurrentPlayer) return;
    setActionType('takeFromDeck');
  };

  // Handle discard pile click
  const handleDiscardClick = () => {
    if (!isCurrentPlayer) return;
    setActionType('takeFromDiscard');
  };

  // Handle player card click
  const handlePlayerCardClick = (cardIndex) => {
    if (!isCurrentPlayer) return;
    
    // If action type is set and we're selecting a card in our dream
    if (actionType) {
      if (actionType === 'takeFromDeck') {
        makeMove('takeFromDeck', cardIndex);
      } else if (actionType === 'takeFromDiscard') {
        makeMove('takeFromDiscard', cardIndex);
      }
      
      // Reset state
      setActionType(null);
      setSelectedCard(null);
    }
  };

  // Handle special card actions
  const handleUseSpecial = (special) => {
    setSpecialType(special);
    
    switch (special) {
      case 'takeTwoCards':
        makeMove('useSpecialTakeTwoCards', 0); // Keep first card by default
        break;
      case 'peekOneCard':
        setShowSpecialModal(true);
        break;
      case 'swapTwoCards':
        setShowSpecialModal(true);
        break;
      default:
        break;
    }
  };

  // Handle selection of cards for special abilities
  const handleSpecialCardSelection = (playerId, cardIndex) => {
    if (specialType === 'peekOneCard') {
      // For peek, we just need one card
      makeMove('useSpecialPeekOneCard', `p${playerId}c${cardIndex}`);
      setShowSpecialModal(false);
      setSpecialType(null);
    } else if (specialType === 'swapTwoCards') {
      // For swap, we need two cards
      setSpecialTargets([...specialTargets, { playerId, cardIndex }]);
      
      // If we have two cards selected, make the move
      if (specialTargets.length === 1) {
        const first = specialTargets[0];
        const second = { playerId, cardIndex };
        
        makeMove(
          'useSpecialSwapTwoCards', 
          `p${first.playerId}c${first.cardIndex}`, 
          `p${second.playerId}c${second.cardIndex}`
        );
        
        setShowSpecialModal(false);
        setSpecialType(null);
        setSpecialTargets([]);
      }
    }
  };

  // Handle Pobudka call
  const handlePobudka = () => {
    callPobudka();
  };

  // Render discard pile top card
  const renderDiscardPile = () => {
    if (!gameState?.discardPile || gameState.discardPile.length === 0) {
      return <div className="card-slot">Pusty</div>;
    }
    
    const topCard = gameState.discardPile[gameState.discardPile.length - 1];
    
    // Make sure the card has all required properties
    const cardToRender = {
      value: topCard.value || 0,
      special: topCard.special || null
    };
    
    return (
      <Card 
        card={cardToRender} 
        isFaceDown={false}
        onClick={handleDiscardClick}
        isSelectable={isCurrentPlayer && !actionType}
      />
    );
  };

  // Render deck
  const renderDeck = () => {
    return (
      <div 
        className="game-card face-down"
        onClick={handleDeckClick}
        style={{ cursor: isCurrentPlayer && !actionType ? 'pointer' : 'default' }}
      >
        <span>Talia</span>
      </div>
    );
  };

  // Render player cards
  const renderPlayerCards = (player, isCurrentPlayer) => {
    return (
      <div className="player-area">
        <div className="player-info">
          <div className={`player-name ${isCurrentPlayer ? 'current-player' : ''}`}>
            {player.username} {isCurrentPlayer ? '(Twoja tura)' : ''}
          </div>
          <div>Punkty: {player.score}</div>
        </div>
        <div className="player-cards">
          {player.dreamCards.map((card, index) => {
            // For current player, use known cards
            const isMyCard = player.id === playerId;
            const knownCard = isMyCard ? getKnownCard(index) : null;
            
            // If this is the current player's card and we know the value, or if the game has ended
            const showCard = (isMyCard && knownCard) || gameState.roundEnded;
            
            return (
              <Card
                key={`player-${player.id}-card-${index}`}
                card={showCard ? card : null}
                isFaceDown={!showCard}
                onClick={() => isMyCard ? handlePlayerCardClick(index) : null}
                isSelectable={isMyCard && isCurrentPlayer && actionType}
                isSelected={isMyCard && selectedCard === index}
              />
            );
          })}
        </div>
      </div>
    );
  };

  // Render special actions modal
  const renderSpecialModal = () => {
    let title = '';
    let content = null;
    
    switch (specialType) {
      case 'peekOneCard':
        title = 'Wybierz kartę do podejrzenia';
        content = (
          <div>
            <p className="mb-1">Wybierz kartę, którą chcesz podejrzeć:</p>
            <div className="flex flex-wrap gap-2">
              {room.players.map((p, playerIndex) => (
                <div key={p.id} className="mb-2">
                  <h4>{p.username} {p.id === playerId ? '(Ty)' : ''}</h4>
                  <div className="flex gap-1 mt-1">
                    {[0, 1, 2, 3].map(cardIndex => (
                      <div 
                        key={`peek-${playerIndex}-${cardIndex}`}
                        className="game-card face-down"
                        style={{ cursor: 'pointer', width: '60px', height: '80px' }}
                        onClick={() => handleSpecialCardSelection(playerIndex, cardIndex)}
                      >
                        <span>{cardIndex + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        break;
      case 'swapTwoCards':
        title = `Wybierz ${specialTargets.length === 0 ? 'pierwszą' : 'drugą'} kartę do zamiany`;
        content = (
          <div>
            <p className="mb-1">
              {specialTargets.length === 0 
                ? 'Wybierz pierwszą kartę do zamiany:' 
                : 'Wybierz drugą kartę do zamiany:'}
            </p>
            <div className="flex flex-wrap gap-2">
              {room.players.map((p, playerIndex) => (
                <div key={p.id} className="mb-2">
                  <h4>{p.username} {p.id === playerId ? '(Ty)' : ''}</h4>
                  <div className="flex gap-1 mt-1">
                    {[0, 1, 2, 3].map(cardIndex => {
                      // Check if card is already selected
                      const isSelected = specialTargets.some(
                        t => t.playerId === playerIndex && t.cardIndex === cardIndex
                      );
                      
                      return (
                        <div 
                          key={`swap-${playerIndex}-${cardIndex}`}
                          className={`game-card ${isSelected ? 'selected' : 'face-down'}`}
                          style={{ 
                            cursor: isSelected ? 'default' : 'pointer',
                            width: '60px', 
                            height: '80px',
                            border: isSelected ? '2px solid var(--color-accent)' : 'none'
                          }}
                          onClick={() => !isSelected && handleSpecialCardSelection(playerIndex, cardIndex)}
                        >
                          <span>{cardIndex + 1}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        break;
      default:
        break;
    }
    
    return (
      <Modal
        isOpen={showSpecialModal}
        title={title}
        onClose={() => {
          setShowSpecialModal(false);
          setSpecialType(null);
          setSpecialTargets([]);
        }}
      >
        {content}
      </Modal>
    );
  };

  // Render round end modal
  const renderRoundEndModal = () => {
    return (
      <Modal
        isOpen={roundOver}
        title="Koniec rundy!"
        onClose={() => setRoundOver(false)}
      >
        <div>
          <h4>Wyniki rundy:</h4>
          <div className="mt-1">
            {room.players.map(p => (
              <div key={p.id} className="flex justify-between mb-1">
                <span>{p.username} {p.id === gameState.pobudkaCalledBy ? '(Pobudka!)' : ''}</span>
                <span>{p.score}</span>
              </div>
            ))}
          </div>
          
          {gameOver ? (
            <>
              <h4 className="mt-2">Koniec gry!</h4>
              <p>
                Zwycięża {room.players.reduce((winner, p) => 
                  p.score < winner.score ? p : winner
                ).username}!
              </p>
              <div className="flex justify-center mt-2">
                <button 
                  className="btn btn-large"
                  onClick={() => navigate('/')}
                >
                  Powrót do menu
                </button>
              </div>
            </>
          ) : (
            <div className="flex justify-center mt-2">
              <button 
                className="btn btn-large"
                onClick={() => {
                  setRoundOver(false);
                  // Logic to start new round handled by server
                }}
              >
                Następna runda
              </button>
            </div>
          )}
        </div>
      </Modal>
    );
  };

  // Handle action options for special cards
  const renderActionOptions = () => {
    if (!isCurrentPlayer) return null;
    
    const topDiscard = gameState?.discardPile?.[gameState.discardPile.length - 1];
    
    if (!topDiscard?.special) return null;
    
    return (
      <div className="card mt-2">
        <div className="card-header">
          <h3>Karta specjalna dostępna!</h3>
        </div>
        <div className="card-body">
          <p>
            Możesz użyć zdolności specjalnej karty: <strong>
              {topDiscard.special === 'takeTwoCards' && 'Weź dwie karty'}
              {topDiscard.special === 'peekOneCard' && 'Podejrzyj jedną'}
              {topDiscard.special === 'swapTwoCards' && 'Zamień dwie'}
            </strong>
          </p>
          <button 
            className="btn mt-1"
            onClick={() => handleUseSpecial(topDiscard.special)}
          >
            Użyj zdolności
          </button>
        </div>
      </div>
    );
  };

  if (!room || !gameState) {
    navigate('/');
    return null;
  }

  return (
    <div className="game-page">
      <div className="game-info">
        <h2>Runda {gameState.currentRound}</h2>
        <div>
          <p>Aktualny gracz: {currentPlayer?.username || 'Ładowanie...'}</p>
        </div>
      </div>

      {gameState.pobudkaCalled && !gameState.roundEnded && (
        <div className="card">
          <div className="card-body">
            <p>
              <strong>Pobudka!</strong> została wywołana przez {room.players.find(p => 
                p.id === gameState.pobudkaCalledBy
              )?.username || 'gracza'}. 
              Każdy gracz ma jeszcze jedną turę.
            </p>
          </div>
        </div>
      )}

      <div className="playing-area">
        <div className="deck-area">
          <div>
            <h4 className="mb-1">Talia</h4>
            {renderDeck()}
            <p className="mt-1">Pozostało: {gameState.deck.length}</p>
          </div>
          <div>
            <h4 className="mb-1">Stos kart odrzuconych</h4>
            {renderDiscardPile()}
          </div>
        </div>
        
        <div className="game-actions">
          {isCurrentPlayer && !gameState.pobudkaCalled && !gameState.roundEnded && (
            <button 
              className="btn btn-secondary"
              onClick={handlePobudka}
            >
              Pobudka!
            </button>
          )}
          {actionType && (
            <button 
              className="btn btn-tertiary"
              onClick={() => setActionType(null)}
            >
              Anuluj
            </button>
          )}
        </div>
      </div>

      {/* Player areas */}
      <div>
        <h3 className="mb-1">Gracze</h3>
        
        {/* Current player's cards */}
        {player && renderPlayerCards(player, player.id === currentPlayer?.id)}
        
        {/* Other players' cards */}
        {room.players.filter(p => p.id !== playerId).map(p => (
          <React.Fragment key={p.id}>
            {renderPlayerCards(p, p.id === currentPlayer?.id)}
          </React.Fragment>
        ))}
      </div>

      {renderActionOptions()}
      {renderSpecialModal()}
      {renderRoundEndModal()}

      <div className="score-board">
        <h3 className="score-header">Wyniki</h3>
        <ul className="score-list">
          {room.players.map(p => (
            <li key={p.id} className="score-item">
              <span>{p.username}</span>
              <span>{p.score}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default GamePage; 