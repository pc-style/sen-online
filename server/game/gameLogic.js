import * as deckUtils from './deck.js';

/**
 * Creates a new game room
 */
export function createGame(roomId, hostName, hostId) {
  return {
    id: roomId,
    host: hostId,
    players: [
      {
        id: hostId,
        username: hostName,
        score: 0,
        dreamCards: [],
        knownCards: {}, // Maps position to card value
      }
    ],
    gameState: {
      isStarted: false,
      deck: [],
      discardPile: [],
      currentPlayer: null,
      currentRound: 0,
      pobudkaCalled: false,
      pobudkaCalledBy: null,
      lastPlayerTurn: false,
      roundEnded: false,
    }
  };
}

/**
 * Adds a player to a game
 */
export function joinGame(room, username, playerId) {
  room.players.push({
    id: playerId,
    username: username,
    score: 0,
    dreamCards: [],
    knownCards: {},
  });
  
  return room;
}

/**
 * Removes a player from a game
 */
export function leaveGame(room, playerId) {
  const playerIndex = room.players.findIndex(p => p.id === playerId);
  
  if (playerIndex !== -1) {
    room.players.splice(playerIndex, 1);
    
    // If the host left, assign a new host
    if (room.host === playerId && room.players.length > 0) {
      room.host = room.players[0].id;
    }
    
    // If the current player left, move to next player
    if (room.gameState.isStarted && room.gameState.currentPlayer === playerId) {
      moveToNextPlayer(room);
    }
  }
  
  return room;
}

/**
 * Starts a new game
 */
export function startGame(room) {
  // Create and shuffle deck
  const deck = deckUtils.shuffleDeck(deckUtils.createDeck());
  
  // Deal 4 cards to each player
  room.players.forEach(player => {
    player.dreamCards = deckUtils.dealCards(deck, 4);
    player.knownCards = {}; // Reset known cards
    player.initialCardSelectionComplete = false;
  });
  
  // Setup initial discard pile
  const initialDiscard = deckUtils.dealCards(deck, 1);
  
  // Setup game state
  room.gameState = {
    isStarted: true,
    deck: deck,
    discardPile: initialDiscard,
    currentPlayer: room.players[0].id, // First player starts
    currentRound: 1,
    pobudkaCalled: false,
    pobudkaCalledBy: null,
    lastPlayerTurn: false,
    roundEnded: false,
    initialCardSelectionPhase: true, // New phase for initial card selection
  };
  
  return room;
}

/**
 * Handles player move
 */
export function makeMove(room, playerId, moveType, cardIndex, targetCardIndex) {
  // Special handling for initial card selection
  if (moveType === 'selectInitialCards') {
    return selectInitialCards(room, playerId, cardIndex);
  }
  
  // Prevent other moves during initial card selection phase
  if (room.gameState.initialCardSelectionPhase) {
    throw new Error('Wait for all players to complete initial card selection');
  }
  
  if (room.gameState.pobudkaCalled) {
    throw new Error('Pobudka has been called, round is ending');
  }
  
  const playerIndex = room.players.findIndex(p => p.id === playerId);
  const player = room.players[playerIndex];
  
  let shouldEndTurn = true;
  let result = null;
  
  switch(moveType) {
    case 'takeFromDiscard':
      takeFromDiscard(room, player, cardIndex);
      break;
    case 'peekDeckCard':
      result = peekDeckCard(room, player);
      shouldEndTurn = false; // Peeking doesn't end turn
      break;
    case 'takeFromDeck':
      result = takeFromDeck(room, player, cardIndex);
      // If player took a special card from deck, they get to use it but this ends their turn
      break;
    case 'useSpecialFromDeck':
      result = useSpecialFromDeck(room, player, moveType, cardIndex, targetCardIndex);
      break;
    case 'useSpecialTakeTwoCards':
      // Check if player can use this special (must have taken a special card from deck)
      const topDiscard = room.gameState.discardPile[room.gameState.discardPile.length - 1];
      if (!topDiscard || topDiscard.special !== 'takeTwoCards') {
        throw new Error('Cannot use this special ability - card must be taken from deck');
      }
      result = useSpecialTakeTwoCards(room, player, cardIndex);
      // Using special ability ends turn
      break;
    case 'useSpecialPeekOneCard':
      const topDiscard2 = room.gameState.discardPile[room.gameState.discardPile.length - 1];
      if (!topDiscard2 || topDiscard2.special !== 'peekOneCard') {
        throw new Error('Cannot use this special ability - card must be taken from deck');
      }
      result = useSpecialPeekOneCard(room, player, cardIndex);
      // Using special ability ends turn
      break;
    case 'useSpecialSwapTwoCards':
      const topDiscard3 = room.gameState.discardPile[room.gameState.discardPile.length - 1];
      if (!topDiscard3 || topDiscard3.special !== 'swapTwoCards') {
        throw new Error('Cannot use this special ability - card must be taken from deck');
      }
      useSpecialSwapTwoCards(room, player, cardIndex, targetCardIndex);
      // Using special ability ends turn
      break;
    default:
      throw new Error('Invalid move type');
  }
  
  // Move to next player only if turn should end
  if (shouldEndTurn) {
    moveToNextPlayer(room);
  }
  
  return result;
}

/**
 * Takes a card from discard pile and replaces one card in player's dream
 */
function takeFromDiscard(room, player, cardIndex) {
  if (room.gameState.discardPile.length === 0) {
    throw new Error('Discard pile is empty');
  }
  
  if (cardIndex < 0 || cardIndex >= player.dreamCards.length) {
    throw new Error('Invalid card index');
  }
  
  // Get top card from discard
  const discardCard = room.gameState.discardPile.pop();
  
  // Swap with player's card
  const playerCard = player.dreamCards[cardIndex];
  player.dreamCards[cardIndex] = discardCard;
  
  // Put player's card on discard pile
  room.gameState.discardPile.push(playerCard);
  
  // Update player's known cards
  player.knownCards[cardIndex] = discardCard;
  
  // Clear any temporary knowledge about this card from all players
  const playerIndex = room.players.indexOf(player);
  room.players.forEach(p => {
    if (p.tempKnownCards) {
      delete p.tempKnownCards[`${playerIndex}-${cardIndex}`];
    }
  });
}

/**
 * Peek at the top deck card (first step of taking from deck)
 */
function peekDeckCard(room, player) {
  if (room.gameState.deck.length === 0) {
    // If deck is empty, shuffle discard (except top card)
    if (room.gameState.discardPile.length <= 1) {
      throw new Error('No cards left in deck and discard pile');
    }
    
    const topDiscard = room.gameState.discardPile.pop();
    room.gameState.deck = deckUtils.shuffleDeck(room.gameState.discardPile);
    room.gameState.discardPile = [topDiscard];
  }
  
  // Get top card from deck without removing it
  const deckCard = room.gameState.deck[room.gameState.deck.length - 1];
  
  // Store the peeked card temporarily
  player.peekedDeckCard = deckCard;
  
  return deckCard;
}

/**
 * Takes a card from deck and replaces one card in player's dream
 */
function takeFromDeck(room, player, cardIndex) {
  if (room.gameState.deck.length === 0) {
    // If deck is empty, shuffle discard (except top card)
    if (room.gameState.discardPile.length <= 1) {
      throw new Error('No cards left in deck and discard pile');
    }
    
    const topDiscard = room.gameState.discardPile.pop();
    room.gameState.deck = deckUtils.shuffleDeck(room.gameState.discardPile);
    room.gameState.discardPile = [topDiscard];
  }
  
  // Get top card from deck
  const deckCard = room.gameState.deck.pop();
  
  if (cardIndex === -1) {
    // Discard the deck card
    room.gameState.discardPile.push(deckCard);
  } else {
    // Validate card index
    if (cardIndex < 0 || cardIndex >= player.dreamCards.length) {
      throw new Error('Invalid card index');
    }
    
    // Replace player's card with deck card
    const playerCard = player.dreamCards[cardIndex];
    player.dreamCards[cardIndex] = deckCard;
    
    // Put player's card on discard pile
    room.gameState.discardPile.push(playerCard);
    
    // Update player's known cards
    player.knownCards[cardIndex] = deckCard;
    
    // Clear any temporary knowledge about this card from all players
    const playerIndex = room.players.indexOf(player);
    room.players.forEach(p => {
      if (p.tempKnownCards) {
        delete p.tempKnownCards[`${playerIndex}-${cardIndex}`];
      }
    });
    
    // If the card taken from deck has a special ability, player can use it
    if (deckCard.special) {
      return {
        canUseSpecial: true,
        specialCard: deckCard
      };
    }
  }
}

/**
 * Use special ability directly from deck card (discards the deck card)
 */
function useSpecialFromDeck(room, player, specialType, cardIndex, targetCardIndex) {
  if (room.gameState.deck.length === 0) {
    throw new Error('No cards in deck');
  }

  // Get the top deck card
  const deckCard = room.gameState.deck[room.gameState.deck.length - 1];
  
  if (!deckCard.special) {
    throw new Error('Deck card has no special ability');
  }

  // Remove the card from deck and discard it
  const specialCard = room.gameState.deck.pop();
  room.gameState.discardPile.push(specialCard);

  // Execute the special ability
  let result = null;
  switch (specialCard.special) {
    case 'takeTwoCards':
      result = executeSpecialTakeTwoCards(room, player, cardIndex);
      break;
    case 'peekOneCard':
      result = executeSpecialPeekOneCard(room, player, cardIndex);
      break;
    case 'swapTwoCards':
      result = executeSpecialSwapTwoCards(room, player, cardIndex, targetCardIndex);
      break;
    default:
      throw new Error('Unknown special ability');
  }

  return result;
}

/**
 * Execute the takeTwoCards special ability
 */
function executeSpecialTakeTwoCards(room, player, cardIndex) {
  if (room.gameState.deck.length < 2) {
    // If deck doesn't have enough cards, shuffle discard (except top card)
    const topDiscard = room.gameState.discardPile.pop();
    if (room.gameState.discardPile.length > 0) {
      const moreCards = deckUtils.shuffleDeck(room.gameState.discardPile);
      room.gameState.deck = [...room.gameState.deck, ...moreCards];
      room.gameState.discardPile = [topDiscard];
    } else {
      room.gameState.discardPile = [topDiscard];
      if (room.gameState.deck.length < 2) {
        throw new Error('Not enough cards to use this ability');
      }
    }
  }
  
  // Draw two cards from the deck
  const card1 = room.gameState.deck.pop();
  const card2 = room.gameState.deck.pop();
  
  // Keep one card (cardIndex is 0 for first or 1 for second)
  const keepCard = cardIndex === 0 ? card1 : card2;
  const discardCard = cardIndex === 0 ? card2 : card1;
  
  // Discard the other card
  room.gameState.discardPile.push(discardCard);
  
  return {
    keptCard: keepCard,
    discardedCard: discardCard
  };
}

/**
 * Use special ability: Draw two cards, keep one and discard one (wrapper for taken cards)
 */
function useSpecialTakeTwoCards(room, player, cardIndex) {
  return executeSpecialTakeTwoCards(room, player, cardIndex);
}

/**
 * Execute the peekOneCard special ability
 */
function executeSpecialPeekOneCard(room, player, cardIndex) {
  // Determine which card to peek
  // Format: "p{playerIndex}c{cardIndex}"
  // e.g., "p0c2" = first player's third card
  const [playerPart, cardPart] = cardIndex.split('c');
  const targetPlayerIndex = parseInt(playerPart.substring(1));
  const targetCardIndex = parseInt(cardPart);
  
  if (targetPlayerIndex < 0 || targetPlayerIndex >= room.players.length ||
      targetCardIndex < 0 || targetCardIndex >= room.players[targetPlayerIndex].dreamCards.length) {
    throw new Error('Invalid target');
  }
  
  // Get the target card
  const targetCard = room.players[targetPlayerIndex].dreamCards[targetCardIndex];
  
  // Store the peeked card temporarily for the player who used the ability
  if (!player.tempKnownCards) {
    player.tempKnownCards = {};
  }
  player.tempKnownCards[`${targetPlayerIndex}-${targetCardIndex}`] = targetCard;
  
  // If peeking own card, add to regular known cards
  if (targetPlayerIndex === room.players.indexOf(player)) {
    player.knownCards[targetCardIndex] = targetCard;
  }
  
  return {
    targetCard,
    targetPlayerIndex,
    targetCardIndex
  };
}

/**
 * Use special ability: Peek at one card (wrapper for taken cards)
 */
function useSpecialPeekOneCard(room, player, cardIndex) {
  return executeSpecialPeekOneCard(room, player, cardIndex);
}

/**
 * Execute the swapTwoCards special ability
 */
function executeSpecialSwapTwoCards(room, player, cardIndex1, cardIndex2) {
  // Parse card identifiers
  // Format: "p{playerIndex}c{cardIndex}"
  const [player1Part, card1Part] = cardIndex1.split('c');
  const [player2Part, card2Part] = cardIndex2.split('c');
  
  const player1Index = parseInt(player1Part.substring(1));
  const card1Index = parseInt(card1Part);
  const player2Index = parseInt(player2Part.substring(1));
  const card2Index = parseInt(card2Part);
  
  if (player1Index < 0 || player1Index >= room.players.length ||
      card1Index < 0 || card1Index >= room.players[player1Index].dreamCards.length ||
      player2Index < 0 || player2Index >= room.players.length ||
      card2Index < 0 || card2Index >= room.players[player2Index].dreamCards.length) {
    throw new Error('Invalid target');
  }
  
  // Swap the cards
  const player1 = room.players[player1Index];
  const player2 = room.players[player2Index];
  
  const temp = player1.dreamCards[card1Index];
  player1.dreamCards[card1Index] = player2.dreamCards[card2Index];
  player2.dreamCards[card2Index] = temp;
  
  // Update known cards for the current player
  const playerIndex = room.players.indexOf(player);
  if (player1Index === playerIndex) {
    delete player.knownCards[card1Index];
  }
  if (player2Index === playerIndex) {
    delete player.knownCards[card2Index];
  }
  
  // Clear any temporary knowledge about swapped cards from all players
  room.players.forEach(p => {
    if (p.tempKnownCards) {
      delete p.tempKnownCards[`${player1Index}-${card1Index}`];
      delete p.tempKnownCards[`${player2Index}-${card2Index}`];
    }
  });
}

/**
 * Use special ability: Swap two cards without looking (wrapper for taken cards)
 */
function useSpecialSwapTwoCards(room, player, cardIndex1, cardIndex2) {
  return executeSpecialSwapTwoCards(room, player, cardIndex1, cardIndex2);
}

/**
 * Call "Pobudka!" (Wake up)
 */
export function callPobudka(room, playerId) {
  if (room.gameState.pobudkaCalled) {
    throw new Error('Pobudka already called');
  }
  
  room.gameState.pobudkaCalled = true;
  room.gameState.pobudkaCalledBy = playerId;
  
  // End the round immediately when Pobudka is called
  endRound(room);
}

/**
 * Move to the next player
 */
function moveToNextPlayer(room) {
  const currentPlayerIndex = room.players.findIndex(p => p.id === room.gameState.currentPlayer);
  
  if (currentPlayerIndex === -1) {
    room.gameState.currentPlayer = room.players[0].id;
    return;
  }
  
  const nextPlayerIndex = (currentPlayerIndex + 1) % room.players.length;
  room.gameState.currentPlayer = room.players[nextPlayerIndex].id;
}

/**
 * End the current round and calculate scores
 */
function endRound(room) {
  room.gameState.roundEnded = true;
  
  // Calculate scores
  const scores = room.players.map(player => {
    let totalValue = 0;
    player.dreamCards.forEach(card => {
      totalValue += card.value;
    });
    return { id: player.id, score: totalValue };
  });
  
  // Find the lowest score
  const minScore = Math.min(...scores.map(s => s.score));
  const playersWithMinScore = scores.filter(s => s.score === minScore).map(s => s.id);
  
  // Update player scores
  room.players.forEach(player => {
    // Get score for this round
    const roundScore = scores.find(s => s.id === player.id).score;
    
    // Player who called Pobudka gets 0 points if they have the lowest score
    if (player.id === room.gameState.pobudkaCalledBy) {
      if (playersWithMinScore.includes(player.id)) {
        player.score += 0;
      } else {
        // Player called Pobudka but didn't have lowest score
        player.score += roundScore + 5; // 5 point penalty
      }
    } else {
      player.score += roundScore;
    }
  });
  
  return room;
}

/**
 * Start a new round
 */
export function startNewRound(room) {
  // Create and shuffle deck
  const deck = deckUtils.shuffleDeck(deckUtils.createDeck());
  
  // Deal 4 cards to each player
  room.players.forEach(player => {
    player.dreamCards = deckUtils.dealCards(deck, 4);
    player.knownCards = {}; // Reset known cards
    player.initialCardSelectionComplete = false;
  });
  
  // Setup initial discard pile
  const initialDiscard = deckUtils.dealCards(deck, 1);
  
  // Find the player who called Pobudka last round
  let startingPlayerIndex = 0;
  if (room.gameState.pobudkaCalledBy) {
    const lastPobudkaIndex = room.players.findIndex(p => p.id === room.gameState.pobudkaCalledBy);
    if (lastPobudkaIndex !== -1) {
      startingPlayerIndex = (lastPobudkaIndex + 1) % room.players.length;
    }
  }
  
  // Update game state
  room.gameState = {
    isStarted: true,
    deck: deck,
    discardPile: initialDiscard,
    currentPlayer: room.players[startingPlayerIndex].id,
    currentRound: room.gameState.currentRound + 1,
    pobudkaCalled: false,
    pobudkaCalledBy: null,
    lastPlayerTurn: false,
    roundEnded: false,
    initialCardSelectionPhase: true,
  };
  
  return room;
}

/**
 * Check if the game has ended (any player has 100 or more points)
 */
export function isGameOver(room) {
  return room.players.some(player => player.score >= 100);
}

/**
 * Handle initial card selection (see 2 cards at start)
 */
export function selectInitialCards(room, playerId, cardIndices) {
  const player = room.players.find(p => p.id === playerId);
  if (!player) {
    throw new Error('Player not found');
  }
  
  if (!room.gameState.initialCardSelectionPhase) {
    throw new Error('Initial card selection phase is over');
  }
  
  if (player.initialCardSelectionComplete) {
    throw new Error('Initial card selection already completed');
  }
  
  if (!Array.isArray(cardIndices) || cardIndices.length !== 2) {
    throw new Error('Must select exactly 2 cards');
  }
  
  // Validate card indices
  cardIndices.forEach(index => {
    if (index < 0 || index >= player.dreamCards.length) {
      throw new Error('Invalid card index');
    }
  });
  
  // Store the selected cards as known
  cardIndices.forEach(index => {
    player.knownCards[index] = player.dreamCards[index];
  });
  
  player.initialCardSelectionComplete = true;
  
  // Check if all players have completed initial selection
  const allPlayersReady = room.players.every(p => p.initialCardSelectionComplete);
  if (allPlayersReady) {
    room.gameState.initialCardSelectionPhase = false;
  }
  
  return room;
} 