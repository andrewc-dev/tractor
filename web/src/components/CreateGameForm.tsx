import React from 'react';
import Button from './Button';
import Input from './Input';
import { GameSettings } from '../services/api';

interface CreateGameFormProps {
  gameSettings: GameSettings;
  updateGameSettings: (field: keyof GameSettings, value: string | number) => void;
  creating: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const CreateGameForm: React.FC<CreateGameFormProps> = ({
  gameSettings,
  updateGameSettings,
  creating,
  onSubmit,
  onCancel
}) => {
  return (
    <div className="card-container create-form">
      <h2>Create New Game</h2>
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="gameType">Game Type</label>
          <select 
            id="gameType"
            className="select-field"
            value={gameSettings.gameType}
            onChange={(e) => updateGameSettings('gameType', e.target.value)}
            required
          >
            <option value="Tractor">Tractor</option>
            <option value="Red Heart Five">Red Heart Five</option>
            <option value="Throwing Eggs">Throwing Eggs</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="playerCount">Number of Players</label>
          <select 
            id="playerCount"
            className="select-field"
            value={gameSettings.playerCount}
            onChange={(e) => updateGameSettings('playerCount', parseInt(e.target.value, 10))}
            required
          >
            <option value="4">4 Players</option>
            <option value="6">6 Players</option>
          </select>
        </div>
        
        <Input
          label="Room Name (Optional)"
          value={gameSettings.roomName || ''}
          onChange={(value) => updateGameSettings('roomName', value)}
          placeholder="Enter a name for your game room"
          className="form-group"
        />
        
        <div className="button-container">
          <Button
            title="Create Game"
            loading={creating}
            type="submit"
            className="create-button"
          />
          <Button
            title="Cancel"
            onClick={onCancel}
            primary={false}
            className="cancel-button"
          />
        </div>
      </form>
    </div>
  );
};

export default CreateGameForm; 