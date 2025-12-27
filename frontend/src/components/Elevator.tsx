/**
 * Individual Elevator Display Component
 * 
 * Features:
 * - Real-time position and status display
 * - Floor selection buttons with visual feedback
 * - Arrival time display (shown for 2 seconds)
 * - Queue visualization
 * - Door animation indicator
 * - Estimated time to target floor
 * 
 * Visual States:
 * - IDLE: Black (#333)
 * - MOVING: Blue (#2196F3)
 * - DOORS: Orange (#FF9800)
 * - ARRIVED: Green (#4CAF50) with animation
 * 
 * Props:
 * - elevator: Current elevator state
 * - numFloors: Total building floors
 * - onSelectFloor: Callback for floor selection
 * - arrivals: Recent arrival events for time display
 */

import React from 'react';
import { ElevatorState, Direction, ArrivalEvent } from '../types';
import './Elevator.css';

interface ElevatorProps {
  elevator: ElevatorState;
  numFloors: number;
  onSelectFloor: (floor: number) => void;
  arrivals: ArrivalEvent[];
}

const Elevator: React.FC<ElevatorProps> = ({ elevator, numFloors, onSelectFloor, arrivals }) => {
  const [selectedFloor, setSelectedFloor] = React.useState<number | null>(null);

  /**
   * Find most recent arrival for this elevator (within 2 seconds)
   * @returns ArrivalEvent or undefined
   */
  const getLastArrival = () => {
    const recentArrival = arrivals.find(
      a => a.elevatorId === elevator.id && 
      Date.now() - a.arrivalTime < 2000
    );
    return recentArrival;
  };

  /**
   * Calculate estimated time to reach target floor
   * Formula: distance * 2 + queue_length * 3
   * @returns Estimated seconds or null if no target
   */
  const getEstimatedTime = () => {
    if (!elevator.targetFloor) return null;
    const distance = Math.abs(elevator.targetFloor - elevator.currentFloor);
    const estimatedSeconds = Math.ceil(distance * 2 + elevator.queue.length * 3);
    return estimatedSeconds;
  };

  const getStatusColor = () => {
    switch (elevator.status) {
      case 'ARRIVED':
        return '#4CAF50';
      case 'IDLE':
        return '#333';
      case 'MOVING_UP':
      case 'MOVING_DOWN':
        return '#2196F3';
      case 'DOORS_OPEN':
      case 'DOORS_OPENING':
      case 'DOORS_CLOSING':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const getDirectionSymbol = () => {
    if (elevator.direction === Direction.UP) return '↑';
    if (elevator.direction === Direction.DOWN) return '↓';
    return '−';
  };

  const handleFloorSelect = (floor: number) => {
    setSelectedFloor(floor);
    onSelectFloor(floor);
    setTimeout(() => setSelectedFloor(null), 300);
  };

  return (
    <div className="elevator-container">
      <div className="elevator-header">
        <h3>Elevator {elevator.id + 1}</h3>
        <div className="elevator-status" style={{ backgroundColor: getStatusColor() }}>
          {elevator.status.replace(/_/g, ' ')}
        </div>
      </div>

      {getLastArrival() && (
        <div className="arrival-time">
          ⏱ Arrival: {(getLastArrival()!.waitTime / 1000).toFixed(1)}s
        </div>
      )}

      <div className="elevator-display">
        <div className="floor-display">
          Floor: {Math.round(elevator.currentFloor)}
        </div>
        <div className="direction-display">
          {getDirectionSymbol()}
        </div>
      </div>

      {elevator.targetFloor !== null && (
        <div className="target-floor">
          Target: Floor {elevator.targetFloor}
          {getEstimatedTime() && (
            <div className="estimated-time">
              ⏱ ~{getEstimatedTime()}s
            </div>
          )}
        </div>
      )}

      {elevator.queue.length > 0 && (
        <div className="queue-display">
          <strong>Queue:</strong> {elevator.queue.join(', ')}
        </div>
      )}

      <div className="floor-buttons">
        {Array.from({ length: numFloors }, (_, i) => numFloors - 1 - i).map(floor => {
          const isCurrentFloor = Math.round(elevator.currentFloor) === floor;
          const isArrived = elevator.status === 'ARRIVED' && isCurrentFloor;
          const isInQueue = elevator.queue.includes(floor) || elevator.targetFloor === floor;
          
          return (
            <button
              key={floor}
              className={`floor-button ${
                isArrived ? 'arrived' : (isCurrentFloor ? 'current' : '')
              } ${
                !isArrived && isInQueue ? 'active' : ''
              } ${
                selectedFloor === floor ? 'selected' : ''
              }`}
              onClick={() => handleFloorSelect(floor)}
              disabled={isCurrentFloor}
            >
              {isArrived ? 'ARRIVED' : floor}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Elevator;
