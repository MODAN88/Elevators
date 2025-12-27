# Elevator Control System - Installation Guide

## Quick Start

Follow these steps to get the elevator control system up and running:

### 1. Install Dependencies

First, install dependencies for all parts of the project:

```powershell
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ..\frontend
npm install

# Return to root
cd ..
```

### 2. Run the Application

From the root directory:

```powershell
npm run dev
```

This will start:
- Backend server on http://localhost:3001
- Frontend application on http://localhost:3000

### 3. Open in Browser

Navigate to http://localhost:3000 in your web browser to see the elevator control system in action.

## Usage

### Calling an Elevator
1. Use the "Call Elevator" panel on the left
2. Click the ↑ (up) or ↓ (down) button for the desired floor
3. The system will automatically assign the best available elevator

### Selecting a Floor Inside an Elevator
1. Click any floor button on an elevator panel
2. The floor will be added to that elevator's queue
3. Watch the elevator move to the selected floor

### Visual Indicators
- **Green status**: Elevator is idle
- **Blue status**: Elevator is moving
- **Orange status**: Doors are opening/closing or open
- **Floor display**: Shows current floor with direction arrow
- **Queue**: Shows upcoming stops for each elevator

## Testing

To run the backend tests:

```powershell
cd backend
npm test
```

## Troubleshooting

### Port Already in Use
If you get an error that port 3000 or 3001 is already in use:

```powershell
# Find and kill process on port 3001 (backend)
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Find and kill process on port 3000 (frontend)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### WebSocket Connection Issues
Make sure both frontend and backend are running. The frontend will show a "Disconnected" status if it cannot connect to the WebSocket server.

## Configuration

To modify the number of elevators or floors, edit `backend/src/server.ts`:

```typescript
const buildingConfig: BuildingConfig = {
  numElevators: 3,  // Change number of elevators
  numFloors: 10,    // Change number of floors
  floorHeight: 3,
  elevatorSpeed: 1,
  doorTime: 2000
};
```

Restart the backend server after making changes.
