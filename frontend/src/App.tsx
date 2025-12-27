/**
 * Main Application Component
 * 
 * State Management:
 * - elevators: Real-time state from WebSocket (100ms updates)
 * - config: Building configuration (elevators, floors, speed)
 * - arrivals: Recent arrival events for analytics and UI feedback
 * - ws: WebSocket connection for real-time communication
 * 
 * Features:
 * - Initial configuration dialog on first load
 * - Real-time elevator visualization
 * - Sound notifications on arrivals
 * - Configuration updates without page reload
 * - Automatic reconnection on config changes
 * 
 * Architecture:
 * - React hooks for state management
 * - WebSocket for real-time updates
 * - REST API for commands and configuration
 */

import { useState, useEffect } from 'react';
import { api } from './api';
import { ElevatorState, BuildingConfig, Direction, ArrivalEvent } from './types';
import './App.css';

function App() {
  const [elevators, setElevators] = useState<ElevatorState[]>([]);
  const [config, setConfig] = useState<BuildingConfig | null>(null);
  const [connected, setConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [showInitialConfig, setShowInitialConfig] = useState(true);
  const [tempElevators, setTempElevators] = useState(5);
  const [tempFloors, setTempFloors] = useState(10);
  const [arrivals, setArrivals] = useState<ArrivalEvent[]>([]);
  
  /** Audio element for arrival notifications (beep sound) */
  const [arrivalSound] = useState(() => {
    const audio = new Audio();
    audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTcIGWi77eefTRAMUKfj8LZjHAY4ktfzzHksBSR3yPDekEALFF605+qnVRUJRZ/h8r9rIQYsgc7y2Ik3CBlpvO3nn00QDFA';
    audio.volume = 0.3;
    return audio;
  });

  /**
   * Initial setup effect
   * - Fetches building configuration
   * - Establishes WebSocket connection
   * - Sets up arrival sound handling
   * - Polls for recent arrivals (10ms intervals)
   */
  useEffect(() => {
    api.getConfig().then(cfg => {
      setConfig(cfg);
      setTempElevators(cfg.numElevators);
      setTempFloors(cfg.numFloors);
    });

    const websocket = api.connectWebSocket((data) => {
      setElevators(data);
      setConnected(true);
    });

    websocket.onopen = () => setConnected(true);
    websocket.onclose = () => setConnected(false);
    websocket.onerror = () => setConnected(false);
    
    websocket.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'ARRIVAL') {
          arrivalSound.currentTime = 0;
          arrivalSound.play().catch(err => console.log('Audio play failed:', err));
        }
      } catch (e) {
      }
    });

    setWs(websocket);

    const arrivalInterval = setInterval(() => {
      api.getArrivals().then(data => {
        const now = Date.now();
        const recentArrivals = data.filter(a => now - a.arrivalTime < 2000);
        setArrivals(recentArrivals);
      }).catch(console.error);
    }, 10);

    return () => {
      websocket.close();
      clearInterval(arrivalInterval);
    };
  }, []);

  const handleUpdateConfig = async () => {
    if (tempElevators < 1 || tempElevators > 10) {
      alert('Number of elevators must be between 1 and 10');
      return;
    }
    
    if (tempFloors < 2 || tempFloors > 100) {
      alert('Number of floors must be between 2 and 100');
      return;
    }
    
    try {
      const newConfig = await api.updateConfig(tempElevators, tempFloors);
      setConfig(newConfig);
      setShowConfig(false);
      setShowInitialConfig(false);
      setShowInitialConfig(false);
      
      if (ws) {
        ws.close();
      }
      
      setTimeout(() => {
        const websocket = api.connectWebSocket((data) => {
          setElevators(data);
          setConnected(true);
        });
        websocket.onopen = () => setConnected(true);
        websocket.onclose = () => setConnected(false);
        setWs(websocket);
      }, 500);
    } catch (error) {
      console.error('Failed to update config:', error);
      alert('Failed to update configuration');
    }
  };

  const handleCallElevator = async (floor: number, direction?: Direction) => {
    try {
      await api.callElevator(floor, direction);
    } catch (error) {
      console.error('Failed to call elevator:', error);
    }
  };

  if (!config) {
    return (
      <div className="app">
        <div className="loading">Loading configuration...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Elevator Exercise</h1>
        <div className="header-controls">
          <button className="config-button" onClick={() => setShowConfig(true)}>
            ⚙️ Configure
          </button>
          <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '● Connected' : '○ Disconnected'}
          </div>
        </div>
      </header>

      {showInitialConfig && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>🏢 Initial Building Configuration</h2>
            <p className="config-description">Set up your building parameters before starting</p>
            <div className="config-form">
              <div className="form-group">
                <label>Number of Elevators (1-10):</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={tempElevators}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setTempElevators(Math.min(Math.max(value, 1), 10));
                  }}
                  autoFocus
                />
                <small className="input-hint">Maximum: 10 elevators</small>
              </div>
              <div className="form-group">
                <label>Number of Floors (2-100):</label>
                <input
                  type="number"
                  min="2"
                  max="100"
                  value={tempFloors}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 2;
                    setTempFloors(Math.min(Math.max(value, 2), 100));
                  }}
                />
                <small className="input-hint">Maximum: 100 floors</small>
              </div>
              <div className="modal-buttons">
                <button 
                  className="btn-primary btn-large" 
                  onClick={handleUpdateConfig}
                  disabled={tempElevators < 1 || tempElevators > 10 || tempFloors < 2 || tempFloors > 100}
                >
                  🚀 Start Simulation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfig && (
        <div className="modal-overlay" onClick={() => setShowConfig(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Building Configuration</h2>
            <div className="config-form">
              <div className="form-group">
                <label>Number of Elevators (1-10):</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={tempElevators}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setTempElevators(Math.min(Math.max(value, 1), 10));
                  }}
                  onBlur={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    if (value < 1) setTempElevators(1);
                    if (value > 10) setTempElevators(10);
                  }}
                />
                <small className="input-hint">Maximum: 10 elevators</small>
              </div>
              <div className="form-group">
                <label>Number of Floors (2-100):</label>
                <input
                  type="number"
                  min="2"
                  max="100"
                  value={tempFloors}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 2;
                    setTempFloors(Math.min(Math.max(value, 2), 100));
                  }}
                  onBlur={(e) => {
                    const value = parseInt(e.target.value) || 2;
                    if (value < 2) setTempFloors(2);
                    if (value > 100) setTempFloors(100);
                  }}
                />
                <small className="input-hint">Maximum: 100 floors</small>
              </div>
              <div className="modal-buttons">
                <button 
                  className="btn-primary" 
                  onClick={handleUpdateConfig}
                  disabled={tempElevators < 1 || tempElevators > 10 || tempFloors < 2 || tempFloors > 100}
                >
                  Apply Configuration
                </button>
                <button className="btn-secondary" onClick={() => setShowConfig(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="building-info">
        <div className="info-card">
          <span className="info-label">Elevators:</span>
          <span className="info-value">{config.numElevators}</span>
        </div>
        <div className="info-card">
          <span className="info-label">Floors:</span>
          <span className="info-value">{config.numFloors}</span>
        </div>
        <div className="info-card">
          <span className="info-label">Speed:</span>
          <span className="info-value">{config.elevatorSpeed} floor/s</span>
        </div>
      </div>

      <div className="main-container">
        <div className="elevator-table">
          <div 
            className="table-header"
            style={{ gridTemplateColumns: `minmax(80px, 100px) repeat(${elevators.length}, minmax(60px, 1fr)) minmax(70px, 90px)` }}
          >
            <div className="floor-label-header">Floor</div>
            {elevators.map((elevator) => (
              <div key={elevator.id} className="elevator-column-header">
                E{elevator.id + 1}
              </div>
            ))}
            <div className="call-buttons-header"></div>
          </div>
          
          {Array.from({ length: config.numFloors }, (_, i) => config.numFloors - 1 - i).map(floor => {
            const currentArrivals = arrivals.filter(a => a.floor === floor);
            const hasActiveRequest = elevators.some(e => e.targetFloor === floor || e.queue.includes(floor));
            const elevatorAtFloor = elevators.some(e => Math.round(e.currentFloor) === floor && e.status !== 'MOVING_UP' && e.status !== 'MOVING_DOWN');
            
            return (
              <div 
                key={floor} 
                className="table-row"
                style={{ gridTemplateColumns: `minmax(80px, 100px) repeat(${elevators.length}, minmax(60px, 1fr)) minmax(70px, 90px)` }}
              >
                <div className="floor-label">
                  {floor === 0 ? 'Ground' : `Floor ${floor}`}
                </div>
                
                {elevators.map((elevator) => {
                  const isAtFloor = Math.round(elevator.currentFloor) === floor;
                  const hasRequest = elevator.queue.includes(floor) || elevator.targetFloor === floor;
                  const isMoving = elevator.status === 'MOVING_UP' || elevator.status === 'MOVING_DOWN';
                  const justArrived = currentArrivals.some(a => a.elevatorId === elevator.id);
                  
                  let colorClass = 'idle'; // black by default (waiting/idle)
                  if (isAtFloor) {
                    // Priority: green (arrived) -> red (moving) -> black (idle)
                    if (justArrived) {
                      colorClass = 'arrived'; // green for 2 seconds after arrival - highest priority
                    } else if (isMoving) {
                      colorClass = 'moving'; // red when moving
                    }
                    // otherwise stays black (idle) after 2 seconds
                  }
                  
                  return (
                    <div key={elevator.id} className="elevator-cell">
                      {isAtFloor && (
                        <img 
                          src="/elevator-icon.svg" 
                          alt="Elevator" 
                          className={`elevator-icon ${colorClass}`}
                        />
                      )}
                      {!isAtFloor && hasRequest && elevator.targetFloor === floor && (
                        <div className="eta-display">
                          {Math.ceil(Math.abs(elevator.targetFloor - elevator.currentFloor) * 2.5)} sec.
                        </div>
                      )}
                    </div>
                  );
                })}
                
                <div className="call-buttons-cell">
                  {elevatorAtFloor ? (
                    <button className="btn-arrived" disabled>Arrived</button>
                  ) : hasActiveRequest ? (
                    <button className="btn-waiting" disabled>Waiting</button>
                  ) : (
                    <button 
                      className="btn-call"
                      onClick={() => handleCallElevator(floor, floor < config.numFloors - 1 ? Direction.UP : Direction.DOWN)}
                    >
                      Call
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
