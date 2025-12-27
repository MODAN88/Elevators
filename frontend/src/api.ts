import { ElevatorState, Direction, BuildingConfig } from './types';

const API_BASE_URL = '/api';
const WS_URL = `ws://${window.location.hostname}:${window.location.port}/ws`;

export const api = {
    getConfig: async (): Promise<BuildingConfig> => {
        const response = await fetch(`${API_BASE_URL}/config`);
        return response.json();
    },

    updateConfig: async (numElevators: number, numFloors: number): Promise<BuildingConfig> => {
        const response = await fetch(`${API_BASE_URL}/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ numElevators, numFloors })
        });
        const data = await response.json();
        return data.config;
    },

    getArrivals: async (): Promise<any[]> => {
        const response = await fetch(`${API_BASE_URL}/arrivals`);
        return response.json();
    },

    callElevator: async (floor: number, direction?: Direction): Promise<void> => {
        await fetch(`${API_BASE_URL}/call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ floor, direction })
        });
    },

    selectFloor: async (elevatorId: number, floor: number): Promise<void> => {
        await fetch(`${API_BASE_URL}/elevator/${elevatorId}/select`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ floor })
        });
    },

    connectWebSocket: (onMessage: (data: ElevatorState[]) => void): WebSocket => {
        const ws = new WebSocket(WS_URL);

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'STATE_UPDATE') {
                onMessage(message.data);
            }
        };

        return ws;
    }
};
