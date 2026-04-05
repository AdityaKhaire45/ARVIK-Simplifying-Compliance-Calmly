import { useEffect, useRef } from 'react';

const useShortcuts = (actions) => {
  // Use a ref for actions to ensure the event listener always has the latest version
  // without needing to re-bind on every render.
  const actionsRef = useRef(actions);

  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const { ctrlKey, altKey, key } = event;
      const lowerKey = key.toLowerCase();

      // Ensure we don't trigger if inside an input/textarea UNLESS it's the specific search shortcut
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
      
      // Alt + N (Add Client)
      if (altKey && lowerKey === 'n') {
        event.preventDefault();
        actionsRef.current.addClient?.();
      }

      // Alt + F (Search Client)
      if (altKey && lowerKey === 'f') {
        event.preventDefault();
        actionsRef.current.searchClient?.();
      }

      // Alt + Enter (Save Form) - Allowed in inputs
      if (altKey && lowerKey === 'enter') {
        event.preventDefault();
        actionsRef.current.saveForm?.();
      }

      // Alt + D (Open Dashboard)
      if (altKey && lowerKey === 'd') {
        event.preventDefault();
        actionsRef.current.openDashboard?.();
      }

      // Alt + A (Alert View)
      if (altKey && lowerKey === 'a') {
        event.preventDefault();
        actionsRef.current.openAlerts?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // Re-bind only once
};

export default useShortcuts;
