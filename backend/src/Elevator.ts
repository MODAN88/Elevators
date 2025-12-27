/**
 * Elevator Class - Core elevator logic and state management
 * 
 * Responsibilities:
 * - Maintains elevator state (position, direction, status)
 * - Manages floor queue with optimal routing
 * - Handles door operations and arrival sequence
 * - Executes smooth movement simulation
 * 
 * Movement Physics:
 * - Speed: configurable floors/second (default: 1 floor/s)
 * - Updates: 50ms intervals (20 FPS)
 * - Position: fractional floors for smooth animation
 * 
 * Arrival Sequence:
 * 1. DOORS_OPENING (doorTime/4 = 250ms)
 * 2. DOORS_OPEN (doorTime/2 = 500ms)
 * 3. DOORS_CLOSING (doorTime/4 = 250ms)
 * 4. ARRIVED (2000ms wait)
 * 5. IDLE or next MOVING state
 */

import { ElevatorState, ElevatorStatus, Direction, ElevatorRequest } from './types';

export class Elevator {
    public id: number;
    public currentFloor: number;
    public targetFloor: number | null = null;
    public status: ElevatorStatus = ElevatorStatus.IDLE;
    public direction: Direction = Direction.NONE;
    public queue: number[] = [];
    private speed: number;
    private doorTime: number;
    private arrivalCallback?: (elevatorId: number, floor: number) => void;

    /**
     * Initialize elevator instance
     * @param id - Unique elevator identifier (0-based)
     * @param initialFloor - Starting floor position (default: 0)
     * @param speed - Travel speed in floors/second (default: 1)
     * @param doorTime - Door operation base time in ms (default: 2000)
     */
    constructor(id: number, initialFloor: number = 0, speed: number = 1, doorTime: number = 2000) {
        this.id = id;
        this.currentFloor = initialFloor;
        this.speed = speed;
        this.doorTime = doorTime;
    }

    /**
     * Register callback for arrival notifications
     * Used to trigger sound effects and broadcast arrival events
     * @param callback - Function to call on arrival (elevatorId, floor)
     */
    public setArrivalCallback(callback: (elevatorId: number, floor: number) => void): void {
        this.arrivalCallback = callback;
    }

    /**
     * Get current elevator state snapshot
     * @returns Complete ElevatorState object for WebSocket broadcast
     */
    public getState(): ElevatorState {
        return {
            id: this.id,
            currentFloor: this.currentFloor,
            targetFloor: this.targetFloor,
            status: this.status,
            direction: this.direction,
            queue: [...this.queue]
        };
    }

    /**
     * Add floor to elevator queue
     * Floors are inserted in optimal order based on current direction
     */
    public addFloorToQueue(floor: number): void {
        if (floor === this.currentFloor && this.status === ElevatorStatus.IDLE) {
            return;
        }

        if (!this.queue.includes(floor) && floor !== this.targetFloor) {
            if (this.queue.length === 0) {
                this.queue.push(floor);
            } else {
                this.insertFloorInOptimalPosition(floor);
            }
        }
    }

    /**
     * Insert floor in queue based on current direction for optimal routing
     * UP: ascending order, DOWN: descending order
     */
    private insertFloorInOptimalPosition(floor: number): void {
        if (this.direction === Direction.UP) {
            const index = this.queue.findIndex(f => f > floor);
            if (index === -1) {
                this.queue.push(floor);
            } else {
                this.queue.splice(index, 0, floor);
            }
        } else if (this.direction === Direction.DOWN) {
            const index = this.queue.findIndex(f => f < floor);
            if (index === -1) {
                this.queue.push(floor);
            } else {
                this.queue.splice(index, 0, floor);
            }
        } else {
            this.queue.push(floor);
        }
    }

    /**
     * Update elevator state - called every 50ms
     */
    public update(deltaTime: number): void {
        switch (this.status) {
            case ElevatorStatus.IDLE:
                this.handleIdle();
                break;
            case ElevatorStatus.MOVING_UP:
            case ElevatorStatus.MOVING_DOWN:
                this.handleMoving(deltaTime);
                break;
            case ElevatorStatus.DOORS_OPENING:
            case ElevatorStatus.DOORS_CLOSING:
            case ElevatorStatus.ARRIVED:
                break;
        }
    }

    private handleIdle(): void {
        if (this.queue.length > 0) {
            this.targetFloor = this.queue.shift()!;
            this.determineDirection();
            this.status = this.direction === Direction.UP ? ElevatorStatus.MOVING_UP : ElevatorStatus.MOVING_DOWN;
        }
    }

    private handleMoving(deltaTime: number): void {
        if (this.targetFloor === null) {
            this.status = ElevatorStatus.IDLE;
            return;
        }

        const floorsToMove = this.speed * (deltaTime / 1000);

        if (this.direction === Direction.UP) {
            this.currentFloor += floorsToMove;
            if (this.currentFloor >= this.targetFloor) {
                this.arriveAtFloor(this.targetFloor);
            }
        } else if (this.direction === Direction.DOWN) {
            this.currentFloor -= floorsToMove;
            if (this.currentFloor <= this.targetFloor) {
                this.arriveAtFloor(this.targetFloor);
            }
        }
    }

    /**
     * Handle elevator arrival at floor
     * Sequence: DOORS_OPENING → DOORS_OPEN → DOORS_CLOSING → ARRIVED (2s) → next action
     */
    private arriveAtFloor(floor: number): void {
        this.currentFloor = floor;
        this.targetFloor = null;
        this.status = ElevatorStatus.DOORS_OPENING;

        if (this.arrivalCallback) {
            this.arrivalCallback(this.id, floor);
        }

        setTimeout(() => {
            this.status = ElevatorStatus.DOORS_OPEN;

            setTimeout(() => {
                this.status = ElevatorStatus.DOORS_CLOSING;
                setTimeout(() => {
                    this.status = ElevatorStatus.ARRIVED;

                    setTimeout(() => {
                        if (this.queue.length > 0) {
                            this.targetFloor = this.queue.shift()!;
                            this.determineDirection();
                            this.status = this.direction === Direction.UP ? ElevatorStatus.MOVING_UP : ElevatorStatus.MOVING_DOWN;
                        } else {
                            this.status = ElevatorStatus.IDLE;
                            this.direction = Direction.NONE;
                        }
                    }, 2000);
                }, this.doorTime / 4);
            }, this.doorTime / 2);
        }, this.doorTime / 4);
    }

    private determineDirection(): void {
        if (this.targetFloor === null) {
            this.direction = Direction.NONE;
        } else if (this.targetFloor > this.currentFloor) {
            this.direction = Direction.UP;
        } else if (this.targetFloor < this.currentFloor) {
            this.direction = Direction.DOWN;
        } else {
            this.direction = Direction.NONE;
        }
    }

    public getDistanceToFloor(floor: number): number {
        return Math.abs(this.currentFloor - floor);
    }

    public isMovingTowards(floor: number): boolean {
        if (this.direction === Direction.UP && floor > this.currentFloor) {
            return true;
        }
        if (this.direction === Direction.DOWN && floor < this.currentFloor) {
            return true;
        }
        return false;
    }

    public getEstimatedTimeToFloor(floor: number): number {
        const distance = this.getDistanceToFloor(floor);
        const travelTime = distance / this.speed;
        const stops = this.queue.filter(f => {
            if (this.direction === Direction.UP) {
                return f < floor && f > this.currentFloor;
            } else if (this.direction === Direction.DOWN) {
                return f > floor && f < this.currentFloor;
            }
            return false;
        }).length;

        return travelTime + (stops * (this.doorTime / 1000));
    }
}
