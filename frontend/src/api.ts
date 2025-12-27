/**
 * API Client for Elevator System
 * 
 * Provides:
 * - REST API calls for configuration and elevator control
 * - WebSocket connection for real-time state updates
 * - Type-safe interfaces for all operations
 * 
 * Communication:
 * - HTTP REST: Configuration, commands, analytics
 * - WebSocket: Real-time elevator state broadcasts (100ms)
 */

import { ElevatorState, Direction, BuildingConfig } from './types';

const API_BASE_URL = '/api';
const WS_URL = `ws://${window.location.hostname}:${window.location.port}/ws`;

export const api = {
    /**
     * Fetch current building configuration
     * @returns Promise resolving to BuildingConfig
     */
    getConfig: async (): Promise<BuildingConfig> => {
        const response = await fetch(`${API_BASE_URL}/config`);
        return response.json();
    },

    /**
     * Update building configuration
     * Recreates the elevator system with new parameters
     * @param numElevators - Number of elevators (1-10)
     * @param numFloors - Number of floors (2-100)
     * @returns Promise resolving to updated BuildingConfig
     */
    updateConfig: async (numElevators: number, numFloors: number): Promise<BuildingConfig> => {
        const response = await fetch(`${API_BASE_URL}/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ numElevators, numFloors })
        });
        const data = await response.json();
        return data.config;
    },

    /**
     * Retrieve recent arrival events for analytics
     * @returns Promise resolving to array of ArrivalEvent
     */
    getArrivals: async (): Promise<any[]> => {
        const response = await fetch(`${API_BASE_URL}/arrivals`);
        return response.json();
    },

    /**
     * Request an elevator to a specific floor
     * Algorithm selects optimal elevator based on:
     * - Idle priority (1000 point penalty for busy elevators)
     * - Distance and workload
     * - Random tie-breaker for load balancing
     * @param floor - Target floor number
     * @param direction - Preferred direction (optional)
     */
    callElevator: async (floor: number, direction?: Direction): Promise<void> => {
        await fetch(`${API_BASE_URL}/call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ floor, direction })
        });
    },

    /**
     * Select destination floor from inside elevator
     * Adds floor to elevator's queue in optimal order
     * @param elevatorId - Target elevator ID
     * @param floor - Destination floor
     */
    selectFloor: async (elevatorId: number, floor: number): Promise<void> => {
        await fetch(`${API_BASE_URL}/elevator/${elevatorId}/select`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ floor })
        });
    },

    /**
     * Establish WebSocket connection for real-time updates
     * Receives STATE_UPDATE messages every 100ms
     * Also handles ARRIVAL events for sound notifications
     * @param onMessage - Callback for state updates
     * @returns WebSocket instance
     */
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
