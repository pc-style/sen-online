import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

// Pages
import HomePage from '../pages/HomePage.js';
import LobbyPage from '../pages/LobbyPage.js';
import GamePage from '../pages/GamePage.js';
import Header from './Header.js';

// Socket.io setup
const SERVER_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin 
  : 'http://localhost:3001';

const App = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [room, setRoom] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState(null);
  const [privateGameState, setPrivateGameState] = useState({ knownCards: {} });
  const [socket, setSocket] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    // Initialize socket only once
    const newSocket = io(SERVER_URL, { 
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    setSocket(newSocket);

    // Cleanup function to disconnect socket
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Room created
    socket.on('roomCreated', ({ roomId, room }) => {
      setRoomId(roomId);
      setRoom(room);
      setError(null);
      navigate('/lobby');
    });

    // Room joined
    socket.on('roomJoined', ({ roomId, room }) => {
      setRoomId(roomId);
      setRoom(room);
      setError(null);
      navigate('/lobby');
    });

    // Room updated
    socket.on('roomUpdated', ({ room }) => {
      setRoom(room);
    });

    // Game started
    socket.on('gameStarted', ({ room }) => {
      setRoom(room);
      setGameState(room.gameState);
      // Navigate to game page when game starts
      navigate('/game');
    });

    // Game updated
    socket.on('gameUpdated', ({ room }) => {
      setRoom(room);
      setGameState(room.gameState);
    });

    // Private game state (known cards)
    socket.on('privateGameState', (state) => {
      setPrivateGameState(state);
    });

    // Pobudka called
    socket.on('pobudkaCalled', ({ room }) => {
      setRoom(room);
      setGameState(room.gameState);
    });

    // Error handling
    socket.on('error', ({ message }) => {
      setError(message);
      setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
    });

    // Cleanup function
    return () => {
      if (socket) {
        socket.off('roomCreated');
        socket.off('roomJoined');
        socket.off('roomUpdated');
        socket.off('gameStarted');
        socket.off('gameUpdated');
        socket.off('privateGameState');
        socket.off('pobudkaCalled');
        socket.off('error');
      }
    };
  }, [socket]);

  // Socket event handlers
  const createRoom = () => {
    if (!username) {
      setError('Please enter a username');
      return;
    }
    if (socket) {
      socket.emit('createRoom', { username });
    }
  };

  const joinRoom = (roomIdToJoin) => {
    if (!username) {
      setError('Please enter a username');
      return;
    }
    if (!roomIdToJoin) {
      setError('Please enter a room ID');
      return;
    }
    if (socket) {
      socket.emit('joinRoom', { roomId: roomIdToJoin, username });
    }
  };

  const startGame = () => {
    if (socket) {
      socket.emit('startGame', { roomId });
    }
  };

  const makeMove = (moveType, cardIndex, targetCardIndex) => {
    if (socket) {
      socket.emit('makeMove', { roomId, moveType, cardIndex, targetCardIndex });
    }
  };

  const callPobudka = () => {
    if (socket) {
      socket.emit('callPobudka', { roomId });
    }
  };

  // Check if user is authenticated (has username)
  const isAuthenticated = !!username;

  // Check if player is in a room
  const isInRoom = !!roomId && !!room;

  // Check if game has started
  const isGameStarted = isInRoom && room?.gameState?.isStarted;

  // If socket is not initialized yet, show loading
  if (!socket) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Header />
      <main>
        <div className="container">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <Routes>
            <Route 
              path="/" 
              element={
                <HomePage 
                  username={username}
                  setUsername={setUsername}
                  createRoom={createRoom}
                  joinRoom={joinRoom}
                  isAuthenticated={isAuthenticated}
                />
              } 
            />
            <Route 
              path="/lobby" 
              element={
                isInRoom ? (
                  <LobbyPage 
                    room={room}
                    startGame={startGame}
                    socket={socket}
                    isHost={socket.id === room?.host}
                  />
                ) : (
                  <Navigate to="/" />
                )
              } 
            />
            <Route 
              path="/game" 
              element={
                isGameStarted ? (
                  <GamePage 
                    room={room}
                    gameState={gameState}
                    privateGameState={privateGameState}
                    playerId={socket.id}
                    makeMove={makeMove}
                    callPobudka={callPobudka}
                  />
                ) : (
                  <Navigate to={isInRoom ? "/lobby" : "/"} />
                )
              } 
            />
          </Routes>
        </div>
      </main>
    </>
  );
};

export default App; 