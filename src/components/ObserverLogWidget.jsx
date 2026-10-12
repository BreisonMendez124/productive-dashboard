import React, { useContext } from 'react';
import { DashboardContext } from '../patterns/mediator/DashboardMediator';

export const ObserverLogWidget = () => {
  const { eventLogs } = useContext(DashboardContext);

  return (
    <div style={{ border: '1px dashed #999', padding: '20px', margin: '10px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
      <h3 style={{ color: '#555' }}>📡 Actividad del Observer (Push)</h3>
      <p style={{ fontSize: '12px', color: '#666' }}>
        <em>Demostrando que no hay polling constante. Los datos llegan solos.</em>
      </p>
      <ul style={{ textAlign: 'left', fontSize: '14px', fontFamily: 'monospace' }}>
        {eventLogs.length === 0 ? <li>Esperando primera conexión...</li> : null}
        {eventLogs.map((log, index) => (
          <li key={index} style={{ color: index === 0 ? 'green' : 'black' }}>
            {log} {index === 0 && ' (¡Nuevo!)'}
          </li>
        ))}
      </ul>
    </div>
  );
};