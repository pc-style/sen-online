import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = ({ username, setUsername, createRoom, joinRoom, isAuthenticated }) => {
  const [roomIdToJoin, setRoomIdToJoin] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const navigate = useNavigate();

  // Check if user is coming from a game and redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleCreateRoom = () => {
    createRoom();
    // Navigation will be handled in App.js when roomCreated event is received
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    joinRoom(roomIdToJoin);
    // Navigation will be handled in App.js when roomJoined event is received
  };

  return (
    <div className="home-page">
      <div className="card">
        <div className="card-header">
          <h2>Witaj w grze Sen Online</h2>
        </div>
        <div className="card-body">
          {!username ? (
            <div>
              <p className="mb-2">Aby rozpocząć, wprowadź swoją nazwę użytkownika:</p>
              <div className="form-group">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Twoja nazwa..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-2">Witaj, <strong>{username}</strong>! Co chcesz zrobić?</p>
              
              <div className="home-buttons">
                <button className="btn btn-large" onClick={handleCreateRoom}>
                  Utwórz pokój
                </button>
                <button 
                  className="btn btn-large btn-secondary" 
                  onClick={() => setShowJoinForm(!showJoinForm)}
                >
                  Dołącz do pokoju
                </button>
              </div>
              
              {showJoinForm && (
                <div className="mt-2">
                  <form onSubmit={handleJoinRoom}>
                    <div className="form-group">
                      <label className="form-label">Podaj kod pokoju:</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="np. A1B2C3"
                        value={roomIdToJoin}
                        onChange={(e) => setRoomIdToJoin(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn">
                      Dołącz
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="card mt-2">
        <div className="card-header">
          <h3>Jak grać?</h3>
        </div>
        <div className="card-body">
          <p>
            <strong>Sen</strong> to gra karciana, w której gracze starają się uzyskać jak najniższy wynik punktowy poprzez 
            manipulowanie czterema kartami leżącymi przed nimi. Celem jest zdobycie jak najmniej punktów na koniec każdej rundy.
          </p>
          <p className="mt-1">
            Gra kończy się, gdy którykolwiek z graczy przekroczy 100 punktów. Zwycięzcą zostaje osoba, 
            która ma w tym momencie najmniej punktów.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 