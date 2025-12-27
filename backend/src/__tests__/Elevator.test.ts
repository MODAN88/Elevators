import { Elevator } from '../Elevator';
import { ElevatorStatus, Direction } from '../types';

describe('Elevator', () => {
    let elevator: Elevator;

    beforeEach(() => {
        elevator = new Elevator(0, 0, 1, 2000);
    });

    test('should initialize with correct default values', () => {
        expect(elevator.id).toBe(0);
        expect(elevator.currentFloor).toBe(0);
        expect(elevator.status).toBe(ElevatorStatus.IDLE);
        expect(elevator.direction).toBe(Direction.NONE);
        expect(elevator.queue).toEqual([]);
    });

    test('should add floor to queue', () => {
        elevator.addFloorToQueue(5);
        expect(elevator.queue).toContain(5);
    });

    test('should not add duplicate floors to queue', () => {
        elevator.addFloorToQueue(5);
        elevator.addFloorToQueue(5);
        expect(elevator.queue.filter(f => f === 5).length).toBe(1);
    });

    test('should calculate distance to floor correctly', () => {
        elevator.currentFloor = 3;
        expect(elevator.getDistanceToFloor(7)).toBe(4);
        expect(elevator.getDistanceToFloor(1)).toBe(2);
    });

    test('should determine if moving towards floor', () => {
        elevator.currentFloor = 3;
        elevator.direction = Direction.UP;
        expect(elevator.isMovingTowards(5)).toBe(true);
        expect(elevator.isMovingTowards(2)).toBe(false);

        elevator.direction = Direction.DOWN;
        expect(elevator.isMovingTowards(5)).toBe(false);
        expect(elevator.isMovingTowards(2)).toBe(true);
    });

    test('should get correct state', () => {
        elevator.currentFloor = 3;
        elevator.targetFloor = 5;
        elevator.status = ElevatorStatus.MOVING_UP;
        elevator.direction = Direction.UP;

        const state = elevator.getState();
        expect(state.currentFloor).toBe(3);
        expect(state.targetFloor).toBe(5);
        expect(state.status).toBe(ElevatorStatus.MOVING_UP);
        expect(state.direction).toBe(Direction.UP);
    });

    test('should sort floors in queue when moving up', () => {
        elevator.direction = Direction.UP;
        elevator.addFloorToQueue(5);
        elevator.addFloorToQueue(3);
        elevator.addFloorToQueue(7);
        expect(elevator.queue).toEqual([3, 5, 7]);
    });

    test('should sort floors in queue when moving down', () => {
        elevator.currentFloor = 10;
        elevator.direction = Direction.DOWN;
        elevator.addFloorToQueue(5);
        elevator.addFloorToQueue(8);
        elevator.addFloorToQueue(3);
        expect(elevator.queue).toEqual([8, 5, 3]);
    });
});
