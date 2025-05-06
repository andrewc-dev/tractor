import { Sequelize, Model, DataTypes } from '@sequelize/core';
import { SqliteDialect } from '@sequelize/sqlite3';

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: SqliteDialect,
  storage: 'sequelize.sqlite',
});

// Define Game model
export class Game extends Model {
  declare id: string;
  declare maxPlayers: number;
  declare status: 'waiting' | 'ready' | 'active' | 'paused' | 'finished';
  declare createdAt: Date;
  declare gameType: 'Tractor' | 'Red Heart Five' | 'Throwing Eggs';
  declare roomName?: string;
  declare instanceId: string | null; // Reference to GameInstance
}

// Define Player model
export class Player extends Model {
  declare id: string;
  declare gameId: string;
  declare name: string;
  declare hand: string; // JSON string of cards
}

// Define GameInstance model
export class GameInstance extends Model {
  declare id: string;
  declare deck: string; // JSON string of cards
  declare currentPlayer: string | null;
  declare roundNumber: number;
  declare gameState: string; // JSON string of additional game state
}


// Initialize GameInstance model
GameInstance.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    deck: {
      type: DataTypes.TEXT, // Store JSON string
      allowNull: false,
      defaultValue: '[]',
    },
    currentPlayer: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    roundNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    gameState: {
      type: DataTypes.TEXT, // Store JSON string
      allowNull: false,
      defaultValue: '{}',
    },
  },
  {
    sequelize,
    modelName: 'GameInstance',
  }
);

// Initialize Game model
Game.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    maxPlayers: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    gameType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    roomName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    instanceId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: GameInstance,
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Game',
  }
);

// Initialize Player model
Player.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    gameId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: Game,
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    hand: {
      type: DataTypes.TEXT, // Store JSON string
      allowNull: false,
      defaultValue: '[]',
    },
  },
  {
    sequelize,
    modelName: 'Player',
  }
);

// Define associations
Game.hasMany(Player, { foreignKey: 'gameId' });
Player.belongsTo(Game, { foreignKey: 'gameId' });
Game.belongsTo(GameInstance, { foreignKey: 'instanceId' });
GameInstance.hasOne(Game, { foreignKey: 'instanceId' });

// Database initialization function
export const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('SQLite connection established successfully.');
    
    // Sync models with database
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized.');
    
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
};

export default sequelize; 