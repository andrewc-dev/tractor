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
  declare status: 'waiting' | 'ready' | 'active' | 'finished';
  declare createdAt: Date;
  declare gameType: 'Tractor' | 'Red Heart Five' | 'Throwing Eggs';
  declare roomName?: string;
  declare deck: string; // JSON string of cards
}

// Define Player model
export class Player extends Model {
  declare id: string;
  declare gameId: string;
  declare name: string;
  declare hand: string; // JSON string of cards
}

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
    deck: {
      type: DataTypes.TEXT, // Store JSON string
      allowNull: false,
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