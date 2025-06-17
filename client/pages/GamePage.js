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
  const [initialCardSelection, setInitialCardSelection] = useState([]);
  const [peekedCard, setPeekedCard] = useState(null);
  const [showDeckCardModal, setShowDeckCardModal] = useState(false);

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

  // Handle initial card selection completion
  useEffect(() => {
    if (gameState?.initialCardSelectionPhase && 
        privateGameState?.initialCardSelectionComplete === false &&
        initialCardSelection.length === 0) {
      // Player needs to select initial cards
    }
  }, [gameState, privateGameState, initialCardSelection]);

  // Socket event handlers
  useEffect(() => {
    if (!window.socket) return;

    const handleDeckCardPeeked = ({ card }) => {
      setPeekedCard(card);
      setShowDeckCardModal(true);
    };

    const handleSpecialCardAvailable = ({ card, canUse }) => {
      if (canUse && card.special) {
        // Show modal for using special ability
        setShowSpecialModal(true);
        setSpecialType(card.special);
      }
    };

    window.socket.on('deckCardPeeked', handleDeckCardPeeked);
    window.socket.on('specialCardAvailable', handleSpecialCardAvailable);

    return () => {
      window.socket.off('deckCardPeeked', handleDeckCardPeeked);
      window.socket.off('specialCardAvailable', handleSpecialCardAvailable);
    };
  }, []);

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

  // Helper function to check if card is temporarily known (from peek ability)
  const isTempKnown = (playerIndex, cardIndex) => {
    return privateGameState?.tempKnownCards && 
           privateGameState.tempKnownCards[`${playerIndex}-${cardIndex}`];
  };

  // Get temporarily known card
  const getTempKnownCard = (playerIndex, cardIndex) => {
    return privateGameState?.tempKnownCards ? 
           privateGameState.tempKnownCards[`${playerIndex}-${cardIndex}`] : null;
  };

  // Handle initial card selection
  const handleInitialCardSelection = (cardIndex) => {
    if (initialCardSelection.includes(cardIndex)) {
      // Deselect card
      setInitialCardSelection(initialCardSelection.filter(i => i !== cardIndex));
    } else if (initialCardSelection.length < 2) {
      // Select card
      setInitialCardSelection([...initialCardSelection, cardIndex]);
    }
  };

  // Confirm initial card selection
  const confirmInitialSelection = () => {
    if (initialCardSelection.length === 2) {
      makeMove('selectInitialCards', initialCardSelection);
      setInitialCardSelection([]);
    }
  };

  // Handle deck click
  const handleDeckClick = () => {
    if (!isCurrentPlayer) return;
    
    // First peek at the card
    makeMove('peekDeckCard');
  };

  // Handle deck card decision after peeking
  const handleDeckCardDecision = (action, cardIndex = null) => {
    if (action === 'take') {
      makeMove('takeFromDeck', cardIndex);
    } else if (action === 'discard') {
      makeMove('takeFromDeck', -1); // -1 means discard
    } else if (action === 'useSpecial') {
      // Use special ability directly from deck (discards the card)
      if (peekedCard?.special === 'takeTwoCards') {
        makeMove('useSpecialFromDeck', cardIndex); // cardIndex is which of two cards to keep
      } else if (peekedCard?.special === 'peekOneCard') {
        makeMove('useSpecialFromDeck', cardIndex); // cardIndex is target card to peek
      } else if (peekedCard?.special === 'swapTwoCards') {
        makeMove('useSpecialFromDeck', cardIndex); // cardIndex is first card, need second
      }
    }
    setShowDeckCardModal(false);
    setPeekedCard(null);
  };

  // Handle discard pile click
  const handleDiscardClick = () => {
    if (!isCurrentPlayer) return;
    setActionType('takeFromDiscard');
    // Note: Special abilities cannot be used when taking from discard pile
  };

  // Handle player card click
  const handlePlayerCardClick = (cardIndex) => {
    if (!isCurrentPlayer) return;
    
    // If in initial selection phase
    if (gameState?.initialCardSelectionPhase && !privateGameState?.initialCardSelectionComplete) {
      handleInitialCardSelection(cardIndex);
      return;
    }
    
    // If action type is set and we're selecting a card in our dream
    if (actionType) {
      if (actionType === 'takeFromDiscard') {
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
  const handleSpecialCardSelection = (targetPlayerId, cardIndex) => {
    if (specialType === 'peekOneCard') {
      // For peek, we just need one card
      makeMove('useSpecialPeekOneCard', `p${targetPlayerId}c${cardIndex}`);
      setShowSpecialModal(false);
      setSpecialType(null);
    } else if (specialType === 'swapTwoCards') {
      // For swap, we need two cards
      setSpecialTargets([...specialTargets, { playerId: targetPlayerId, cardIndex }]);
      
      // If we have two cards selected, make the move
      if (specialTargets.length === 1) {
        const first = specialTargets[0];
        const second = { playerId: targetPlayerId, cardIndex };
        
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
      return <div className="card-slot discard-card">Pusty</div>;
    }
    
    const topCard = gameState.discardPile[gameState.discardPile.length - 1];
    
    // Make sure the card has all required properties
    const cardToRender = {
      value: topCard.value || 0,
      special: topCard.special || null
    };
    
    return (
      <div className="discard-card">
        <Card 
          card={cardToRender} 
          isFaceDown={false}
          onClick={handleDiscardClick}
          isSelectable={isCurrentPlayer && !actionType}
          showHoverInfo={true}
        />
      </div>
    );
  };

  // Render deck
  const renderDeck = () => {
    return (
      <div 
        className="game-card face-down deck-card"
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
            {gameState?.initialCardSelectionPhase && player.id === playerId && !privateGameState?.initialCardSelectionComplete && 
              <span> - Wybierz 2 karty</span>
            }
          </div>
          <div>Punkty: {player.score}</div>
        </div>
        <div className="player-cards">
          {player.dreamCards.map((card, index) => {
            // For current player, use known cards
            const isMyCard = player.id === playerId;
            const knownCard = isMyCard ? getKnownCard(index) : null;
            
            // Check for temporarily known cards (from peek ability)
            const playerIndex = room.players.findIndex(p => p.id === player.id);
            const tempKnownCard = getTempKnownCard(playerIndex, index);
            
            // If this is the current player's card and we know the value, or if the game has ended, or temporarily known
            const showCard = (isMyCard && knownCard) || gameState.roundEnded || tempKnownCard;
            const cardToShow = knownCard || tempKnownCard || card;
            
            // Check if in initial selection phase
            const inInitialSelection = gameState?.initialCardSelectionPhase && !privateGameState?.initialCardSelectionComplete && isMyCard;
            const isInitialSelected = inInitialSelection && initialCardSelection.includes(index);
            
            return (
              <Card
                key={`player-${player.id}-card-${index}`}
                card={showCard ? cardToShow : null}
                isFaceDown={!showCard}
                onClick={() => isMyCard ? handlePlayerCardClick(index) : null}
                isSelectable={
                  (isMyCard && isCurrentPlayer && actionType) || 
                  inInitialSelection
                }
                isSelected={
                  (isMyCard && selectedCard === index) ||
                  isInitialSelected
                }
                showHoverInfo={showCard}
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
    // Special abilities can only be used when taking cards from deck, not from discard pile
    // This function is now mainly for other game actions
    return null;
  };

  // Render initial card selection modal
  const renderInitialCardSelectionModal = () => {
    if (!gameState?.initialCardSelectionPhase || privateGameState?.initialCardSelectionComplete) {
      return null;
    }

    return (
      <Modal
        isOpen={true}
        title="Wybierz 2 karty do zapamiętania"
        onClose={() => {}} // Cannot close during initial selection
      >
        <div>
          <p className="mb-2">
            Wybierz dokładnie 2 karty ze swojego snu, które chcesz podejrzeć i zapamiętać:
          </p>
          <div className="flex gap-2 justify-center mb-2">
            {player?.dreamCards?.map((card, index) => (
              <Card
                key={`initial-${index}`}
                card={null} // Don't show card until confirmed
                isFaceDown={true}
                onClick={() => handleInitialCardSelection(index)}
                isSelectable={true}
                isSelected={initialCardSelection.includes(index)}
                showHoverInfo={false}
              />
            ))}
          </div>
          <p className="mb-2">
            Wybrano: {initialCardSelection.length}/2
          </p>
          <div className="flex justify-center">
            <button 
              className="btn"
              onClick={confirmInitialSelection}
              disabled={initialCardSelection.length !== 2}
            >
              Potwierdź wybór
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  // Render deck card preview modal
  const renderDeckCardModal = () => {
    if (!showDeckCardModal || !peekedCard) {
      return null;
    }

    return (
      <Modal
        isOpen={true}
        title="Karta z talii"
        onClose={() => {}}
      >
        <div>
          <p className="mb-2">Podejrzałeś kartę z talii:</p>
          <div className="flex justify-center mb-2">
            <Card
              card={peekedCard}
              isFaceDown={false}
              showHoverInfo={true}
            />
          </div>
          <p className="mb-2">Co chcesz zrobić z tą kartą?</p>
          
          {/* If the card has special ability, show option to use it */}
          {peekedCard?.special && (
            <div className="mb-2">
              <p className="mb-1">
                Ta karta ma zdolność specjalną: <strong>
                  {peekedCard.special === 'takeTwoCards' && 'Weź dwie karty'}
                  {peekedCard.special === 'peekOneCard' && 'Podejrzyj jedną kartę'}
                  {peekedCard.special === 'swapTwoCards' && 'Zamień dwie karty'}
                </strong>
              </p>
              <div className="flex justify-center gap-2 mb-2">
                <button 
                  className="btn btn-success"
                  onClick={() => handleDeckCardDecision('useSpecial')}
                >
                  Użyj zdolności (odrzuć kartę)
                </button>
              </div>
              <p className="mb-2 text-center">
                <small>LUB weź kartę do ręki:</small>
              </p>
            </div>
          )}
          
          {/* If we want to replace a card, show player's cards */}
          <div className="mb-2">
            <h4>Wymień za kartę ze snu:</h4>
            <div className="flex gap-1 justify-center">
              {player?.dreamCards?.map((card, index) => {
                const knownCard = getKnownCard(index);
                return (
                  <div key={index} className="text-center">
                    <Card
                      card={knownCard}
                      isFaceDown={!knownCard}
                      onClick={() => handleDeckCardDecision('take', index)}
                      isSelectable={true}
                      showHoverInfo={!!knownCard}
                    />
                    <small>Pozycja {index + 1}</small>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex justify-center gap-2">
            <button 
              className="btn btn-tertiary"
              onClick={() => handleDeckCardDecision('discard')}
            >
              Odrzuć kartę
            </button>
          </div>
        </div>
      </Modal>
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
        {/* Opponents area at top */}
        <div className="opponents-area">
          {room.players.filter(p => p.id !== playerId).map(p => (
            <div key={p.id} className="opponent-player">
              <div className="player-info">
                <div className={`player-name ${p.id === currentPlayer?.id ? 'current-player' : ''}`}>
                  {p.username} {p.id === currentPlayer?.id ? '(Tura)' : ''}
                </div>
              </div>
              <div className="opponent-cards">
                {p.dreamCards.map((card, index) => {
                  // Check for temporarily known cards (from peek ability)
                  const playerIndex = room.players.findIndex(player => player.id === p.id);
                  const tempKnownCard = getTempKnownCard(playerIndex, index);
                  
                  const showCard = gameState.roundEnded || tempKnownCard;
                  const cardToShow = tempKnownCard || card;
                  
                  return (
                    <Card
                      key={`opponent-${p.id}-card-${index}`}
                      card={showCard ? cardToShow : null}
                      isFaceDown={!showCard}
                      onClick={() => null}
                      isSelectable={false}
                      showHoverInfo={showCard}
                      className="opponent-card"
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Center area with deck and discard pile */}
        <div className="center-area">
          <div className="deck-area">
            <h4 className="mb-1">Talia</h4>
            {renderDeck()}
            <p className="mt-1">Pozostało: {gameState.deck.length}</p>
          </div>
          <div className="deck-area">
            <h4 className="mb-1">Stos kart odrzuconych</h4>
            {renderDiscardPile()}
          </div>
        </div>

        {/* Current player area at bottom */}
        <div className="current-player-area">
          {player && (
            <>
              <div className="player-info">
                <div className={`player-name ${player.id === currentPlayer?.id ? 'current-player' : ''}`}>
                  {player.username} {player.id === currentPlayer?.id ? '(Twoja tura)' : ''}
                  {gameState?.initialCardSelectionPhase && player.id === playerId && !privateGameState?.initialCardSelectionComplete && 
                    <span> - Wybierz 2 karty</span>
                  }
                </div>
              </div>
              <div className="current-player-cards">
                {player.dreamCards.map((card, index) => {
                  // For current player, use known cards
                  const knownCard = getKnownCard(index);
                  
                  // If this is the current player's card and we know the value, or if the game has ended
                  const showCard = knownCard || gameState.roundEnded;
                  const cardToShow = knownCard || card;
                  
                  // Check if in initial selection phase
                  const inInitialSelection = gameState?.initialCardSelectionPhase && !privateGameState?.initialCardSelectionComplete;
                  const isInitialSelected = inInitialSelection && initialCardSelection.includes(index);
                  
                  return (
                    <Card
                      key={`current-player-card-${index}`}
                      card={showCard ? cardToShow : null}
                      isFaceDown={!showCard}
                      onClick={() => handlePlayerCardClick(index)}
                      isSelectable={
                        (isCurrentPlayer && actionType) || 
                        inInitialSelection
                      }
                      isSelected={
                        (selectedCard === index) ||
                        isInitialSelected
                      }
                      showHoverInfo={showCard}
                      className="current-player-card"
                    />
                  );
                })}
              </div>
            </>
          )}
          
          {/* Game actions */}
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
      </div>

      {renderActionOptions()}
      {renderSpecialModal()}
      {renderRoundEndModal()}

      {renderInitialCardSelectionModal()}
      {renderDeckCardModal()}

      <div className={`score-board ${!gameState.roundEnded ? 'hidden' : ''}`}>
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