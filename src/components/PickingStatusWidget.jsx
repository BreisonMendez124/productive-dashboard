import React, { useContext } from 'react';
import { DashboardContext } from '../patterns/mediator/DashboardMediator';

export const PickingStatusWidget = () => {
  
  const { dashboardData } = useContext(DashboardContext);

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', margin: '10px', borderRadius: '8px' }}>
      <h3>Estado de Picking Actual</h3>
      <p>Total procesados: <strong>{dashboardData.pickingRealizados}</strong></p>
      <p>Estado Operativo: <strong>{dashboardData.estado}</strong></p>
      <small>Última actualización: {dashboardData.timestamp}</small>
    </div>
  );
};