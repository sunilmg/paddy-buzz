import React, { createContext, useContext, useState, useEffect } from 'react';

const PrintQueueContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const usePrintQueue = () => useContext(PrintQueueContext);

export const PrintQueueProvider = ({ children }) => {
  // Queue state: fixed size of 6, initialized with nulls
  const [printQueue, setPrintQueue] = useState(() => {
    try {
        const saved = localStorage.getItem('printQueue');
        if (saved) {
             const parsed = JSON.parse(saved);
             if (Array.isArray(parsed) && parsed.length === 6) {
                 return parsed;
             }
        }
    } catch (e) {
        console.error("Failed to parse queue from local storage", e);
    }
    return [null, null, null, null, null, null];
  });

  // Save to local storage whenever queue changes
  useEffect(() => {
    localStorage.setItem('printQueue', JSON.stringify(printQueue));
  }, [printQueue]);

  const addToPrintQueue = (item) => {
    const emptyIndex = printQueue.indexOf(null);
    if (emptyIndex === -1) {
       return { success: false, message: "Queue is full (Max 6 items). Please remove some items first." };
    }

    const newQueue = [...printQueue];
    newQueue[emptyIndex] = item;
    setPrintQueue(newQueue);
    
    // Calculate remaining space
    const remaining = newQueue.filter(i => i === null).length;
    return { success: true, message: "Added to print queue", remaining };
  };

  const removeFromQueue = (index) => {
    const newQueue = [...printQueue];
    newQueue[index] = null;
    setPrintQueue(newQueue);
  };

  const clearQueue = () => {
    setPrintQueue([null, null, null, null, null, null]);
  };

  const updateQueue = (newQueue) => {
    if (newQueue.length === 6) {
        setPrintQueue(newQueue);
    }
  };

  const getRemainingSpace = () => {
      return printQueue.filter(item => item === null).length;
  };

  return (
    <PrintQueueContext.Provider value={{ 
      printQueue, 
      addToPrintQueue, 
      removeFromQueue, 
      clearQueue, 
      updateQueue,
      getRemainingSpace
    }}>
      {children}
    </PrintQueueContext.Provider>
  );
};
