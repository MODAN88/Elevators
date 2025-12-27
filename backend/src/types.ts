/**
 * Elevator operational states
 * State machine flow: IDLE → MOVING → DOORS_OPENING → DOORS_OPEN → DOORS_CLOSING → ARRIVED → IDLE
 */
export enum ElevatorStatus {
    /** Elevator is idle, waiting for requests */
    IDLE = 'IDLE',
    /** Elevator is moving upward */
    MOVING_UP = 'MOVING_UP',
    /** Elevator is moving downward */
    MOVING_DOWN = 'MOVING_DOWN',
    /** Doors are opening (250ms duration) */
    DOORS_OPENING = 'DOORS_OPENING',
    /** Doors are fully open (500ms duration) */
    DOORS_OPEN = 'DOORS_OPEN',
    /** Doors are closing (250ms duration) */
    DOORS_CLOSING = 'DOORS_CLOSING',
    /** Elevator arrived and waiting 2 seconds before next action */
    ARRIVED = 'ARRIVED'
}

/**
 * Movement direction for elevators and requests
 */
export enum Direction {
    /** Moving or requesting upward movement */
    UP = 'UP',
    /** Moving or requesting downward movement */
    DOWN = 'DOWN',
    /** No movement direction */
    NONE = 'NONE'
}

/**
 * Represents a request to call an elevator
 */
export interface ElevatorRequest {
    /** Target floor number (0-based) */
    floor: number;
    /** Preferred direction (optional) */
    direction?: Direction;
    /** Unix timestamp when request was made */
    timestamp: number;
    /** Unique identifier for tracking the request */
    requestId?: string;
}

/**
 * Event data for elevator arrival tracking and analytics
 * Used to calculate wait times and system performance
 */
export interface ArrivalEvent {
    /** ID of the elevator that arrived */
    elevatorId: number;
    /** Floor number where arrival occurred */
    floor: number;
    /** Unix timestamp of arrival */
    arrivalTime: number;
    /** Unix timestamp when request was initiated */
    requestTime: number;
    /** Total wait time in milliseconds (arrivalTime - requestTime) */
    waitTime: number;
}

/**
 * Complete state snapshot of an elevator
 * Broadcast via WebSocket for real-time UI updates
 */
export interface ElevatorState {
    /** Unique elevator identifier (0-based) */
    id: number;
    /** Current floor position (can be fractional during movement) */
    currentFloor: number;
    /** Next floor destination (null if idle) */
    targetFloor: number | null;
    /** Current operational status */
    status: ElevatorStatus;
    /** Current movement direction */
    direction: Direction;
    /** Pending floor requests in optimal order */
    queue: number[];
}

/**
 * Building configuration parameters
 * Defines the physical and performance characteristics of the elevator system
 */
export interface BuildingConfig {
    /** Total number of elevators (1-10) */
    numElevators: number;
    /** Total number of floors (2-100) */
    numFloors: number;
    /** Physical height of each floor in meters */
    floorHeight: number;
    /** Travel speed in floors per second */
    elevatorSpeed: number;
    /** Door operation time in milliseconds */
    doorTime: number;
}
