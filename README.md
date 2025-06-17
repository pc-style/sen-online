# Sen Online - Multiplayer Card Game

An online multiplayer implementation of the polish card game "Sen" by Nasza Księgarnia.

## About the Game

"Sen" (Dream) is a card game where players try to get the lowest score by manipulating four cards in front of them. Players can peek at two of their cards at the start but must remember what they've seen and what other players might have taken.

## Features

- Real-time multiplayer gameplay with Socket.io
- Room system for creating and joining games
- Full implementation of all game rules:
  - Card swapping
  - Special card abilities
  - "Pobudka!" (Wake up!) call
  - Score tracking
- Modern UI with responsive design

## Technology Stack

- **Frontend:**
  - React
  - React Router
  - Socket.io Client
  - CSS

- **Backend:**
  - Node.js
  - Express
  - Socket.io

## How to Run

### Prerequisites

- Node.js and npm installed

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/sen-online.git
cd sen-online
```

2. Install dependencies
```
npm install
```

3. Start the development server
```
npm run dev:server
```

4. In a separate terminal, start the client
```
npm run dev:client
```

5. Open your browser and navigate to `http://localhost:3000`

### Production Build

```
npm run build
npm start
```

## Game Rules

- Each player has 4 face-down cards forming their "dream"
- Players can look at 2 of their cards at the start
- On their turn, players can either:
  - Take a card from the face-up pile and swap with one of their cards
  - Take a card from the face-down pile, then either swap it or discard it (potentially using special abilities)
- The round ends when someone calls "Pobudka!" (Wake up!)
- Players score points based on card values, aiming for the lowest score
- Game ends when someone reaches 100 points

## License

This project is for educational purposes only. The original card game "Sen" is owned by Nasza Księgarnia. 