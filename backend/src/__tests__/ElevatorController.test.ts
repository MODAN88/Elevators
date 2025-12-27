import { ElevatorController } from '../ElevatorController';
import { Direction, BuildingConfig } from '../types';

describe('ElevatorController', () => {
    let controller: ElevatorController;
    const config: BuildingConfig = {
        numElevators: 3,
        numFloors: 10,
        floorHeight: 3,
        elevatorSpeed: 1,
        doorTime: 2000
    };

    beforeEach(() => {
        controller = new ElevatorController(config);
    });

    afterEach(() => {
        controller.stopUpdateLoop();
    });

    test('should initialize with correct number of elevators', () => {
        const state = controller.getSystemState();
        expect(state.length).toBe(3);
    });

    test('should call elevator to floor', () => {
        controller.callElevator(5, Direction.UP);
        const state = controller.getSystemState();
        const hasFloorInQueue = state.some(
            elevator => elevator.queue.includes(5) || elevator.targetFloor === 5
        );
        expect(hasFloorInQueue).toBe(true);
    });

    test('should select floor for specific elevator', () => {
        controller.selectFloor(0, 7);
        const state = controller.getElevatorState(0);
        expect(state?.queue.includes(7) || state?.targetFloor === 7).toBe(true);
    });

    test('should get system state', () => {
        const state = controller.getSystemState();
        expect(Array.isArray(state)).toBe(true);
        expect(state.length).toBe(config.numElevators);
        state.forEach(elevator => {
            expect(elevator).toHaveProperty('id');
            expect(elevator).toHaveProperty('currentFloor');
            expect(elevator).toHaveProperty('status');
        });
    });

    test('should get specific elevator state', () => {
        const state = controller.getElevatorState(0);
        expect(state).toBeTruthy();
        expect(state?.id).toBe(0);
    });

    test('should return null for invalid elevator id', () => {
        const state = controller.getElevatorState(99);
        expect(state).toBeNull();
    });
});
