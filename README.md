# Multiplayer Card Game

A multiplayer card game with a Node.js backend and React Native mobile application. The game allows players to create or join game rooms, wait for other players to join, and play cards in real-time.

## Project Structure

- `/` - Node.js backend server with Express, Socket.IO, and Redis
- `/mobile` - React Native mobile application

## Backend Setup

1. Install Redis on your machine
2. Install dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   npm start
   ```

The server will run on port 3000 by default.

## Mobile App Setup

1. Navigate to the mobile directory:
   ```
   cd mobile
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Configure backend URL:
   
   Edit the API_URL in `mobile/src/services/api.js` and `mobile/src/services/socket.js` to match your server's IP address.

4. Start the React Native development server:
   ```
   npm start
   ```
5. Run on Android:
   ```
   npm run android
   ```
   
   Or iOS:
   ```
   npm run ios
   ```

## Game Flow

1. Players can create a new game or join an existing game using a game ID
2. The waiting room shows current player count and waiting status
3. When 4 players join, the game starts automatically
4. Players can see their hand of cards and play them one by one
5. Real-time updates are provided via Socket.IO

## Technologies Used

- **Backend:**
  - Express.js
  - Socket.IO
  - Redis
  - UUID

- **Mobile:**
  - React Native
  - React Navigation
  - Socket.IO Client
  - React Native Animatable
  - Async Storage

## Features

- Real-time multiplayer gameplay
- Game room creation and joining
- Waiting room with live player updates
- Card visualization and gameplay
- Mobile-friendly UI for iOS and Android
