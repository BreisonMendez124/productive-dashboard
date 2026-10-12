import { useEffect } from 'react';
export const useDashboardObserver = (mediatorNotify) => {
  useEffect(() => {
    console.log("Observer: Suscribiéndose al DashboardSubject del backend...");

    const mockServerPush = setInterval(() => {
      const mockData = {
        pickingRealizados: Math.floor(Math.random() * 500) + 100,
        estado: 'Óptimo',
        timestamp: new Date().toLocaleTimeString()
      };
      
      console.log("Observer: ¡Nueva información recibida del backend!");
      mediatorNotify(mockData);
      
    }, 8000);

  
    return () => {
      console.log("Observer: Desconectando del servidor...");
      clearInterval(mockServerPush);
    };
  }, [mediatorNotify]);
};