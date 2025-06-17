import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import game logic modules
import * as deckUtils from './game/deck.js';
import { createGame, joinGame, leaveGame, startGame, makeMove, callPobudka } from './game/gameLogic.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// If in production, serve static files from dist
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Game state
const rooms = {};

// Socket.io logic
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Create a new room
  socket.on('createRoom', ({ username }) => {
    const roomId = uuidv4().substring(0, 6); // Create a shorter room ID
    
    const room = createGame(roomId, username, socket.id);
    rooms[roomId] = room;
    
    socket.join(roomId);
    socket.emit('roomCreated', { roomId, room });
    console.log(`Room created: ${roomId} by ${username}`);
  });

  // Join an existing room
  socket.on('joinRoom', ({ roomId, username }) => {
    const room = rooms[roomId];
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    if (room.players.length >= 5) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }
    
    if (room.gameState.isStarted) {
      socket.emit('error', { message: 'Game already started' });
      return;
    }
    
    joinGame(room, username, socket.id);
    
    socket.join(roomId);
    socket.emit('roomJoined', { roomId, room });
    io.to(roomId).emit('roomUpdated', { room });
    console.log(`${username} joined room ${roomId}`);
  });

  // Start game
  socket.on('startGame', ({ roomId }) => {
    const room = rooms[roomId];
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    if (room.players.length < 2) {
      socket.emit('error', { message: 'Need at least 2 players' });
      return;
    }
    
    if (room.host !== socket.id) {
      socket.emit('error', { message: 'Only host can start the game' });
      return;
    }
    
    startGame(room);
    
    io.to(roomId).emit('gameStarted', { room });
    console.log(`Game started in room ${roomId}`);
  });

  // Make a move
  socket.on('makeMove', ({ roomId, moveType, cardIndex, targetCardIndex }) => {
    const room = rooms[roomId];
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    if (!room.gameState.isStarted) {
      socket.emit('error', { message: 'Game not started' });
      return;
    }
    
    const playerId = socket.id;
    const player = room.players.find(p => p.id === playerId);
    
    if (!player) {
      socket.emit('error', { message: 'Player not found' });
      return;
    }
    
    if (room.gameState.currentPlayer !== player.id) {
      socket.emit('error', { message: 'Not your turn' });
      return;
    }
    
    try {
      makeMove(room, playerId, moveType, cardIndex, targetCardIndex);
      io.to(roomId).emit('gameUpdated', { room });
      
      // Send private card info to players
      room.players.forEach(p => {
        io.to(p.id).emit('privateGameState', {
          knownCards: p.knownCards,
        });
      });
      
      console.log(`Player ${player.username} made move: ${moveType}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Call "Pobudka!" (Wake up)
  socket.on('callPobudka', ({ roomId }) => {
    const room = rooms[roomId];
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    if (!room.gameState.isStarted) {
      socket.emit('error', { message: 'Game not started' });
      return;
    }
    
    const playerId = socket.id;
    const player = room.players.find(p => p.id === playerId);
    
    if (!player) {
      socket.emit('error', { message: 'Player not found' });
      return;
    }
    
    if (room.gameState.currentPlayer !== player.id) {
      socket.emit('error', { message: 'Not your turn' });
      return;
    }
    
    callPobudka(room, playerId);
    
    io.to(roomId).emit('pobudkaCalled', { 
      room, 
      callerId: playerId,
      playerName: player.username 
    });
    
    console.log(`Player ${player.username} called Pobudka!`);
  });

  // Handle player disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Find rooms where this player is
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex !== -1) {
        leaveGame(room, socket.id);
        
        // If no players left, delete the room
        if (room.players.length === 0) {
          delete rooms[roomId];
          console.log(`Room ${roomId} deleted (no players left)`);
        } else {
          io.to(roomId).emit('roomUpdated', { room });
          console.log(`Player left room ${roomId}`);
        }
        
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 