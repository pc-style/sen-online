// Card structure:
// { value: number, special: null | 'takeTwoCards' | 'peekOneCard' | 'swapTwoCards' }

/**
 * Creates a new deck for the Sen game
 * The deck consists of:
 * - 4 cards with values 0-8 (36 cards)
 * - 9 cards with value 9
 * - Special abilities on some cards: 3x value 5 (takeTwoCards), 3x value 6 (peekOneCard), 3x value 7 (swapTwoCards)
 */
export function createDeck() {
  const deck = [];
  
  // Add cards with values 0-8 (4 of each)
  for (let value = 0; value <= 8; value++) {
    for (let i = 0; i < 4; i++) {
      deck.push({ value, special: null });
    }
  }
  
  // Replace some cards with special cards
  // 3x value 5 (takeTwoCards)
  for (let i = 0; i < 3; i++) {
    const index = deck.findIndex(card => card.value === 5 && card.special === null);
    if (index !== -1) {
      deck[index].special = 'takeTwoCards';
    }
  }
  
  // 3x value 6 (peekOneCard)
  for (let i = 0; i < 3; i++) {
    const index = deck.findIndex(card => card.value === 6 && card.special === null);
    if (index !== -1) {
      deck[index].special = 'peekOneCard';
    }
  }
  
  // 3x value 7 (swapTwoCards)
  for (let i = 0; i < 3; i++) {
    const index = deck.findIndex(card => card.value === 7 && card.special === null);
    if (index !== -1) {
      deck[index].special = 'swapTwoCards';
    }
  }
  
  // Add 9 cards with value 9
  for (let i = 0; i < 9; i++) {
    deck.push({ value: 9, special: null });
  }
  
  return deck;
}

/**
 * Shuffles the deck using the Fisher-Yates algorithm
 */
export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Deals a hand of cards
 */
export function dealCards(deck, count) {
  return deck.splice(0, count);
} 