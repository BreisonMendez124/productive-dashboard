import React, { useContext } from 'react';
import { DashboardContext } from '../patterns/mediator/DashboardMediator';

export const DailyGoalWidget = () => {
  const { dashboardData } = useContext(DashboardContext);
  const metaDiaria = 500;
  
  
  const porcentaje = Math.min((dashboardData.pickingRealizados / metaDiaria) * 100, 100).toFixed(1);

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', margin: '10px', borderRadius: '8px', minWidth: '250px' }}>
      <h3>Meta Diaria de Picking</h3>
      <p>{dashboardData.pickingRealizados} / {metaDiaria} unidades</p>
      
  
      <div style={{ width: '100%', backgroundColor: '#eee', borderRadius: '4px', marginTop: '10px' }}>
        <div style={{ 
          height: '20px', 
          width: `${porcentaje}%`, 
          backgroundColor: porcentaje >= 100 ? '#4caf50' : '#2196f3',
          borderRadius: '4px',
          transition: 'width 0.5s ease-in-out'
        }}></div>
      </div>
      <p style={{ textAlign: 'center', marginTop: '5px' }}>{porcentaje}% completado</p>
    </div>
  );
};