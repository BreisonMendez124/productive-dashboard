import React, { createContext, useState, useCallback } from 'react';
import { useDashboardObserver } from '../observer/useDashboardObserver';

export const DashboardContext = createContext();

export const DashboardMediatorProvider = ({ children }) => {
  const [dashboardData, setDashboardData] = useState({
    pickingRealizados: 0,
    estado: 'Conectando...',
    timestamp: '-'
  });
  
  
  const [eventLogs, setEventLogs] = useState([]);

  const notifyMediator = useCallback((newData) => {
    setDashboardData(newData);
    
  
    setEventLogs(prevLogs => {
      const newLog = `[${newData.timestamp}] Dato recibido: ${newData.pickingRealizados} pickings`;
      return [newLog, ...prevLogs].slice(0, 5);
    });
  }, []);

  useDashboardObserver(notifyMediator);

  return (
    <DashboardContext.Provider value={{ dashboardData, eventLogs }}>
      {children}
    </DashboardContext.Provider>
  );
};