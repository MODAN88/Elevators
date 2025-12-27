import React from 'react';
import { Direction } from '../types';
import './FloorPanel.css';

interface FloorPanelProps {
  numFloors: number;
  onCallElevator: (floor: number, direction?: Direction) => void;
}

const FloorPanel: React.FC<FloorPanelProps> = ({ numFloors, onCallElevator }) => {
  const [activeButtons, setActiveButtons] = React.useState<Set<string>>(new Set());

  const handleCall = (floor: number, direction?: Direction) => {
    const key = `${floor}-${direction || 'none'}`;
    setActiveButtons(prev => new Set(prev).add(key));
    onCallElevator(floor, direction);
    
    // Remove active state after animation
    setTimeout(() => {
      setActiveButtons(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 2000);
  };

  return (
    <div className="floor-panel-container">
      <div className="floor-panel-header">
        <h3>Call Elevator</h3>
      </div>
      
      <div className="floor-panel">
        {Array.from({ length: numFloors }, (_, i) => numFloors - 1 - i).map(floor => (
          <div key={floor} className="floor-row">
            <div className="floor-number">Floor {floor}</div>
            <div className="call-buttons">
              {floor < numFloors - 1 && (
                <button
                  className={`call-button up ${
                    activeButtons.has(`${floor}-${Direction.UP}`) ? 'active' : ''
                  }`}
                  onClick={() => handleCall(floor, Direction.UP)}
                  title="Call elevator going up"
                >
                  ↑
                </button>
              )}
              {floor > 0 && (
                <button
                  className={`call-button down ${
                    activeButtons.has(`${floor}-${Direction.DOWN}`) ? 'active' : ''
                  }`}
                  onClick={() => handleCall(floor, Direction.DOWN)}
                  title="Call elevator going down"
                >
                  ↓
                </button>
              )}
              {(floor === 0 || floor === numFloors - 1) && (
                <button
                  className={`call-button any ${
                    activeButtons.has(`${floor}-none`) ? 'active' : ''
                  }`}
                  onClick={() => handleCall(floor)}
                  title="Call any elevator"
                >
                  •
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FloorPanel;
