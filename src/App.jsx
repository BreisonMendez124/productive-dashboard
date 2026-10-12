import React from 'react';
import { DashboardMediatorProvider } from './patterns/mediator/DashboardMediator';
import { PickingStatusWidget } from './components/PickingStatusWidget';
import { DailyGoalWidget } from './components/DailyGoalWidget';
import { ObserverLogWidget } from './components/ObserverLogWidget';

function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Tablero de Productividad WMS</h1>
      <p style={{ color: '#666' }}>Arquitectura refactorizada con Observer y Mediator</p>
      
      <DashboardMediatorProvider>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
          <PickingStatusWidget />
          <DailyGoalWidget />
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <ObserverLogWidget />
        </div>
      </DashboardMediatorProvider>
    </div>
  );
}

export default App;