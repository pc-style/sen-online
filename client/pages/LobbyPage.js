import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal.js';

const LobbyPage = ({ room, startGame, socket, isHost }) => {
  const [copied, setCopied] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const navigate = useNavigate();

  if (!room) {
    navigate('/');
    return null;
  }

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = () => {
    if (room.players.length < 2) {
      return; // Don't start the game if fewer than 2 players
    }
    startGame();
    // Don't navigate immediately - wait for the gameStarted event
    // Navigation is handled in App.js when gameStarted event is received
  };

  return (
    <div className="lobby-page">
      <div className="lobby-header">
        <h2>Pokój: {room.id}</h2>
        <button 
          className="btn btn-secondary"
          onClick={handleCopyRoomId}
        >
          {copied ? 'Skopiowano!' : 'Kopiuj kod pokoju'}
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <h3>Gracze ({room.players.length}/5)</h3>
            <button 
              className="btn btn-tertiary"
              onClick={() => setShowRulesModal(true)}
            >
              Zasady gry
            </button>
          </div>
        </div>
        <div className="card-body">
          <ul className="player-list">
            {room.players.map((player, index) => (
              <li 
                key={player.id} 
                className="player-item"
              >
                <span className={player.id === room.host ? 'player-host' : ''}>
                  {player.username}
                  {player.id === room.host ? ' (Host)' : ''}
                  {player.id === socket.id ? ' (Ty)' : ''}
                </span>
              </li>
            ))}
          </ul>

          {isHost ? (
            <button 
              className="btn btn-large"
              onClick={handleStartGame}
              disabled={room.players.length < 2}
            >
              {room.players.length < 2 
                ? 'Potrzeba co najmniej 2 graczy' 
                : 'Rozpocznij grę'}
            </button>
          ) : (
            <p>Oczekiwanie na rozpoczęcie gry przez hosta...</p>
          )}
        </div>
      </div>

      <Modal
        isOpen={showRulesModal}
        title="Zasady gry Sen"
        onClose={() => setShowRulesModal(false)}
      >
        <div className="rules-content">
          <h4>Cel Gry</h4>
          <p>
            Celem gry jest zdobycie jak najmniejszej liczby punktów na koniec każdej rundy. 
            Punkty to suma wartości (kruków) na czterech kartach tworzących "sen" gracza. 
            Gra kończy się, gdy którykolwiek z graczy przekroczy 100 punktów.
          </p>

          <h4 className="mt-2">Przebieg Rozgrywki</h4>
          <p>
            W swojej turze gracz musi wykonać jedną z dwóch akcji:
          </p>
          <ul>
            <li>
              <strong>Akcja A:</strong> Dobierz kartę ze stosu odkrytego i wymień ją na jedną z czterech kart w swoim śnie.
            </li>
            <li>
              <strong>Akcja B:</strong> Dobierz kartę ze stosu zakrytego, a następnie:
              <ul>
                <li>Wymień na jedną z kart w swoim śnie, lub</li>
                <li>Odrzuć kartę (jeśli jest to karta specjalna, możesz użyć jej zdolności)</li>
              </ul>
            </li>
          </ul>

          <h4 className="mt-2">Karty Specjalne</h4>
          <ul>
            <li><strong>Weź dwie (5):</strong> Pozwala dobrać 2 wierzchnie karty ze stosu zakrytego, wybrać jedną z nich dla siebie, a drugą odłożyć na stos odkryty.</li>
            <li><strong>Podejrzyj jedną (6):</strong> Pozwala w tajemnicy obejrzeć jedną dowolną kartę leżącą na stole (swoją lub przeciwnika).</li>
            <li><strong>Zamień dwie (7):</strong> Pozwala zamienić miejscami dwie dowolne karty snów na stole.</li>
          </ul>

          <h4 className="mt-2">Zakończenie Rundy</h4>
          <p>
            Gracz może zawołać "Pobudka!" zamiast wykonywania normalnej akcji. Po tym każdy z pozostałych graczy ma jeszcze jedną turę.
            Gracz, który zawołał "Pobudka!" i ma najmniej punktów, otrzymuje 0 punktów w tej rundzie. Jeśli nie ma najmniej punktów, 
            do sumy kruków dolicza karne 5 punktów.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default LobbyPage; 