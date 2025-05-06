import React from 'react';
import Button from './Button';
import Input from './Input';
import { GameSettings } from '../services/api';
import { t } from '../i18n';

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
      <h2>{t('createGame.title')}</h2>
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="gameType">{t('createGame.gameType')}</label>
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
          <label htmlFor="playerCount">{t('createGame.playerCount')}</label>
          <select 
            id="playerCount"
            className="select-field"
            value={gameSettings.playerCount}
            onChange={(e) => updateGameSettings('playerCount', parseInt(e.target.value, 10))}
            required
          >
            <option value="4">{t('createGame.playerCountOptions.4')}</option>
            <option value="6">{t('createGame.playerCountOptions.6')}</option>
          </select>
        </div>
        
        <Input
          label={t('createGame.roomNameInputLabel')}
          value={gameSettings.roomName || ''}
          onChange={(value) => updateGameSettings('roomName', value)}
          placeholder={t('createGame.roomNameInputPlaceholder')}
          className="form-group"
        />
        
        <div className="button-container">
          <Button
            title={t('createGame.create')}
            loading={creating}
            type="submit"
            className="create-button"
          />
          <Button
            title={t('createGame.cancel')}
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