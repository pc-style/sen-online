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
  };
  
  return room;
}

/**
 * Handles player move
 */
export function makeMove(room, playerId, moveType, cardIndex, targetCardIndex) {
  if (room.gameState.pobudkaCalled) {
    throw new Error('Pobudka has been called, round is ending');
  }
  
  const playerIndex = room.players.findIndex(p => p.id === playerId);
  const player = room.players[playerIndex];
  
  switch(moveType) {
    case 'takeFromDiscard':
      takeFromDiscard(room, player, cardIndex);
      break;
    case 'takeFromDeck':
      takeFromDeck(room, player, cardIndex);
      break;
    case 'useSpecialTakeTwoCards':
      useSpecialTakeTwoCards(room, player, cardIndex, targetCardIndex);
      break;
    case 'useSpecialPeekOneCard':
      useSpecialPeekOneCard(room, player, cardIndex);
      break;
    case 'useSpecialSwapTwoCards':
      useSpecialSwapTwoCards(room, player, cardIndex, targetCardIndex);
      break;
    default:
      throw new Error('Invalid move type');
  }
  
  // Check if this was the last turn after Pobudka
  if (room.gameState.lastPlayerTurn) {
    endRound(room);
    return;
  }
  
  // Move to next player
  moveToNextPlayer(room);
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
}

/**
 * Takes a card from the deck and either replaces one card or uses special ability
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
  
  // Option 1: Replace card in dream
  if (cardIndex !== undefined) {
    if (cardIndex < 0 || cardIndex >= player.dreamCards.length) {
      throw new Error('Invalid card index');
    }
    
    // Swap with player's card
    const playerCard = player.dreamCards[cardIndex];
    player.dreamCards[cardIndex] = deckCard;
    
    // Put player's card on discard pile
    room.gameState.discardPile.push(playerCard);
    
    // Update player's known cards
    player.knownCards[cardIndex] = deckCard;
  } 
  // Option 2: Discard and potentially use special ability
  else {
    room.gameState.discardPile.push(deckCard);
    
    // Player can use special ability
    if (deckCard.special) {
      // The ability will be used in a separate function call
      // Just make the card available in the discard pile
    }
  }
}

/**
 * Use special ability: Draw two cards, keep one and discard one
 */
function useSpecialTakeTwoCards(room, player, cardIndex) {
  // Check if the top discard has this ability
  const topDiscard = room.gameState.discardPile[room.gameState.discardPile.length - 1];
  if (!topDiscard || topDiscard.special !== 'takeTwoCards') {
    throw new Error('Cannot use this special ability');
  }
  
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
 * Use special ability: Peek at one card
 */
function useSpecialPeekOneCard(room, player, cardIndex) {
  // Check if the top discard has this ability
  const topDiscard = room.gameState.discardPile[room.gameState.discardPile.length - 1];
  if (!topDiscard || topDiscard.special !== 'peekOneCard') {
    throw new Error('Cannot use this special ability');
  }
  
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
  
  // Add to player's known cards
  if (targetPlayerIndex === room.players.indexOf(player)) {
    player.knownCards[targetCardIndex] = targetCard;
  }
  
  return targetCard;
}

/**
 * Use special ability: Swap two cards without looking
 */
function useSpecialSwapTwoCards(room, player, cardIndex1, cardIndex2) {
  // Check if the top discard has this ability
  const topDiscard = room.gameState.discardPile[room.gameState.discardPile.length - 1];
  if (!topDiscard || topDiscard.special !== 'swapTwoCards') {
    throw new Error('Cannot use this special ability');
  }
  
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
  
  // Find the player's index
  const playerIndex = room.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    throw new Error('Player not found');
  }
  
  // Set flag to notify this is the last turn
  room.gameState.lastPlayerTurn = playerIndex === room.players.length - 1;
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
  
  // If Pobudka was called and this is the last player, end the round
  if (room.gameState.pobudkaCalled && 
      room.gameState.pobudkaCalledBy === room.players[(nextPlayerIndex + 1) % room.players.length].id) {
    room.gameState.lastPlayerTurn = true;
  }
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
  };
  
  return room;
}

/**
 * Check if the game has ended (any player has 100 or more points)
 */
export function isGameOver(room) {
  return room.players.some(player => player.score >= 100);
} 