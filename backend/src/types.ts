export enum ElevatorStatus {
    IDLE = 'IDLE',
    MOVING_UP = 'MOVING_UP',
    MOVING_DOWN = 'MOVING_DOWN',
    DOORS_OPENING = 'DOORS_OPENING',
    DOORS_OPEN = 'DOORS_OPEN',
    DOORS_CLOSING = 'DOORS_CLOSING',
    ARRIVED = 'ARRIVED'
}

export enum Direction {
    UP = 'UP',
    DOWN = 'DOWN',
    NONE = 'NONE'
}

export interface ElevatorRequest {
    floor: number;
    direction?: Direction;
    timestamp: number;
    requestId?: string;
}

export interface ArrivalEvent {
    elevatorId: number;
    floor: number;
    arrivalTime: number;
    requestTime: number;
    waitTime: number;
}

export interface ElevatorState {
    id: number;
    currentFloor: number;
    targetFloor: number | null;
    status: ElevatorStatus;
    direction: Direction;
    queue: number[];
    doorOpen: boolean;
}

export interface BuildingConfig {
    numElevators: number;
    numFloors: number;
    floorHeight: number; // in meters
    elevatorSpeed: number; // floors per second
    doorTime: number; // seconds to open/close doors
}
