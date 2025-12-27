/**
 * Elevator System Backend Server
 * 
 * Architecture:
 * - Express REST API for configuration and commands
 * - WebSocket for real-time state broadcasts (100ms intervals)
 * - ElevatorController manages elevator logic and allocation
 * 
 * Features:
 * - Intelligent elevator selection algorithm (idle priority)
 * - Real-time state synchronization
 * - Sound notification on arrivals
 * - Wait time tracking and analytics
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { ElevatorController } from './ElevatorController';
import { BuildingConfig, Direction } from './types';
import http from 'http';

const app: Express = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

/**
 * Default building configuration
 * Optimized for balanced performance and realistic simulation
 */
let buildingConfig: BuildingConfig = {
    numElevators: 5,
    numFloors: 10,
    floorHeight: 3,
    elevatorSpeed: 1,
    doorTime: 1000
};

// Initialize elevator controller
let elevatorController = new ElevatorController(buildingConfig);

// Set up arrival notification callback
elevatorController.setArrivalNotificationCallback((elevatorId: number, floor: number) => {
    // Broadcast arrival event to all connected clients
    const message = JSON.stringify({
        type: 'ARRIVAL',
        data: { elevatorId, floor }
    });

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket server for real-time updates
const wss = new WebSocketServer({ server, path: '/ws' });

// Broadcast system state to all connected clients
const broadcastSystemState = () => {
    const state = elevatorController.getSystemState();
    const message = JSON.stringify({ type: 'STATE_UPDATE', data: state });

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
};

// Broadcast updates every 100ms
setInterval(broadcastSystemState, 100);

wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');

    // Send initial state
    const state = elevatorController.getSystemState();
    ws.send(JSON.stringify({ type: 'STATE_UPDATE', data: state }));

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// API Routes

// Get building configuration
app.get('/api/config', (req: Request, res: Response) => {
    res.json(buildingConfig);
});

// Update building configuration
app.post('/api/config', (req: Request, res: Response) => {
    const { numElevators, numFloors } = req.body;

    if (numElevators && (numElevators < 1 || numElevators > 10)) {
        return res.status(400).json({ error: 'Number of elevators must be between 1 and 10' });
    }

    if (numFloors && (numFloors < 2 || numFloors > 100)) {
        return res.status(400).json({ error: 'Number of floors must be between 2 and 100' });
    }

    // Stop old controller
    elevatorController.stopUpdateLoop();

    // Update config
    if (numElevators) buildingConfig.numElevators = numElevators;
    if (numFloors) buildingConfig.numFloors = numFloors;

    // Create new controller with new config
    elevatorController = new ElevatorController(buildingConfig);

    // Re-register arrival notification callback
    elevatorController.setArrivalNotificationCallback((elevatorId: number, floor: number) => {
        const message = JSON.stringify({
            type: 'ARRIVAL',
            data: { elevatorId, floor }
        });

        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    res.json({ success: true, config: buildingConfig });
});

// Get system state
app.get('/api/state', (req: Request, res: Response) => {
    const state = elevatorController.getSystemState();
    res.json(state);
});

// Get specific elevator state
app.get('/api/elevator/:id', (req: Request, res: Response) => {
    const elevatorId = parseInt(req.params.id);
    const state = elevatorController.getElevatorState(elevatorId);

    if (state) {
        res.json(state);
    } else {
        res.status(404).json({ error: 'Elevator not found' });
    }
});

// Call elevator to a floor
app.post('/api/call', (req: Request, res: Response) => {
    const { floor, direction } = req.body;

    if (typeof floor !== 'number' || floor < 0 || floor >= buildingConfig.numFloors) {
        return res.status(400).json({ error: 'Invalid floor number' });
    }

    const validDirections = [Direction.UP, Direction.DOWN, undefined];
    if (direction && !validDirections.includes(direction)) {
        return res.status(400).json({ error: 'Invalid direction' });
    }

    const requestId = elevatorController.callElevator(floor, direction);
    res.json({ success: true, message: `Elevator called to floor ${floor}`, requestId });
});

// Get recent arrivals with wait times
app.get('/api/arrivals', (req: Request, res: Response) => {
    const arrivals = elevatorController.getRecentArrivals();
    res.json(arrivals);
});

// Select destination floor from inside elevator
app.post('/api/elevator/:id/select', (req: Request, res: Response) => {
    const elevatorId = parseInt(req.params.id);
    const { floor } = req.body;

    if (typeof floor !== 'number' || floor < 0 || floor >= buildingConfig.numFloors) {
        return res.status(400).json({ error: 'Invalid floor number' });
    }

    if (elevatorId < 0 || elevatorId >= buildingConfig.numElevators) {
        return res.status(404).json({ error: 'Elevator not found' });
    }

    elevatorController.selectFloor(elevatorId, floor);
    res.json({ success: true, message: `Floor ${floor} selected for elevator ${elevatorId}` });
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
});

// Start server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`WebSocket server running on ws://localhost:${PORT}/ws`);
});

// Cleanup on exit
process.on('SIGINT', () => {
    console.log('Shutting down...');
    elevatorController.stopUpdateLoop();
    wss.close();
    server.close();
    process.exit(0);
});
