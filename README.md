# Elevator Control System

A full-stack elevator control system built with React, TypeScript, Node.js, and Express. This system simulates a building with multiple elevators and provides a real-time visualization of elevator states, along with the ability to call elevators and select destination floors.

## Features

### Backend
- **Smart Elevator Scheduling Algorithm**: Optimally assigns elevators to requests based on:
  - Current distance to requested floor
  - Direction of travel
  - Current load (queue length)
  - Estimated time to arrival
- **Real-time WebSocket Communication**: Broadcasts elevator state updates to all connected clients
- **RESTful API**: Endpoints for calling elevators and selecting floors
- **TypeScript**: Fully typed for better code quality and maintainability

### Frontend
- **Real-time Visualization**: Live updates of elevator positions and states
- **Interactive Controls**: 
  - Floor panel for calling elevators (with directional buttons)
  - Individual elevator panels for selecting destination floors
- **Visual Indicators**:
  - Current floor display with direction arrows
  - Status indicators (idle, moving, doors opening/closing)
  - Queue visualization
  - Animated door states
- **Responsive Design**: Works on desktop and mobile devices

## Architecture

### Elevator Scheduling Algorithm

The system uses a sophisticated scoring algorithm to determine which elevator should respond to each call:

1. **Distance Score**: Closer elevators get priority
2. **Idle Bonus**: Idle elevators are strongly preferred
3. **Direction Match**: Elevators already moving in the requested direction get priority
4. **Queue Penalty**: Elevators with longer queues are deprioritized
5. **Estimated Time**: Considers stops along the way

### Queue Management

Elevators maintain sorted queues based on their current direction:
- **Moving Up**: Floors added in ascending order
- **Moving Down**: Floors added in descending order
- This minimizes backtracking and optimizes travel time

## Project Structure

```
Elevators/
├── backend/
│   ├── src/
│   │   ├── __tests__/
│   │   │   ├── Elevator.test.ts
│   │   │   └── ElevatorController.test.ts
│   │   ├── Elevator.ts           # Individual elevator logic
│   │   ├── ElevatorController.ts # Multi-elevator coordination
│   │   ├── server.ts             # Express server & WebSocket
│   │   └── types.ts              # TypeScript interfaces
│   ├── package.json
│   ├── tsconfig.json
│   └── jest.config.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Elevator.tsx      # Elevator component
│   │   │   ├── Elevator.css
│   │   │   ├── FloorPanel.tsx    # Floor call panel
│   │   │   └── FloorPanel.css
│   │   ├── App.tsx               # Main application
│   │   ├── App.css
│   │   ├── main.tsx
│   │   ├── api.ts                # API client
│   │   └── types.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── index.html
└── package.json
```

## Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Setup

1. **Install root dependencies**:
```bash
npm install
```

2. **Install backend dependencies**:
```bash
cd backend
npm install
```

3. **Install frontend dependencies**:
```bash
cd ../frontend
npm install
```

## Running the Application

### Development Mode

From the root directory:
```bash
npm run dev
```

This will start both the backend server (port 3001) and frontend dev server (port 3000) concurrently.

### Individual Services

**Backend only**:
```bash
cd backend
npm run dev
```

**Frontend only**:
```bash
cd frontend
npm run dev
```

## API Endpoints

### GET `/api/config`
Returns building configuration (number of elevators, floors, etc.)

**Response**:
```json
{
  "numElevators": 3,
  "numFloors": 10,
  "floorHeight": 3,
  "elevatorSpeed": 1,
  "doorTime": 2000
}
```

### GET `/api/state`
Returns current state of all elevators

**Response**:
```json
[
  {
    "id": 0,
    "currentFloor": 3,
    "targetFloor": 5,
    "status": "MOVING_UP",
    "direction": "UP",
    "queue": [7, 9],
    "doorOpen": false
  }
]
```

### POST `/api/call`
Call an elevator to a specific floor

**Request Body**:
```json
{
  "floor": 5,
  "direction": "UP"  // optional: "UP" | "DOWN"
}
```

### POST `/api/elevator/:id/select`
Select a destination floor from inside an elevator

**Request Body**:
```json
{
  "floor": 8
}
```

### WebSocket `/ws`
Real-time updates of elevator states. Messages are broadcast every 100ms.

**Message Format**:
```json
{
  "type": "STATE_UPDATE",
  "data": [/* array of elevator states */]
}
```

## Testing

### Backend Tests
```bash
cd backend
npm test
```

Tests include:
- Elevator initialization and state management
- Queue management and floor sorting
- Distance calculations and direction logic
- Controller coordination and assignment

## Configuration

You can modify the building configuration in [backend/src/server.ts](backend/src/server.ts):

```typescript
const buildingConfig: BuildingConfig = {
  numElevators: 3,      // Number of elevators
  numFloors: 10,        // Number of floors
  floorHeight: 3,       // Height of each floor (meters)
  elevatorSpeed: 1,     // Speed (floors per second)
  doorTime: 2000        // Door open/close time (milliseconds)
};
```

## Technologies Used

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type-safe JavaScript
- **ws** - WebSocket library
- **Jest** - Testing framework

### Frontend
- **React** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **WebSocket API** - Real-time communication

## Key Design Decisions

1. **WebSocket for Real-time Updates**: Ensures smooth, real-time visualization without polling
2. **Optimistic Scheduling**: The algorithm prioritizes idle elevators and minimizes wait times
3. **Queue Sorting**: Floors are automatically sorted based on travel direction to minimize backtracking
4. **Component-based Architecture**: Modular React components for easy maintenance and testing
5. **Type Safety**: Full TypeScript coverage for both frontend and backend

## Future Enhancements

- Energy optimization mode (minimize total travel distance)
- Priority handling for specific floors (e.g., ground floor)
- Load balancing across elevators
- Maintenance mode for individual elevators
- Historical data and analytics
- Express zones for tall buildings
- Peak hour optimization

## License

MIT

## Author

Created for Arbox Senior Full Stack Developer Position by Modan Bar-on
