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
      
      // Ctrl + N (Add Client)
      if (ctrlKey && lowerKey === 'n') {
        event.preventDefault();
        actionsRef.current.addClient?.();
      }

      // Ctrl + K (Search Client)
      if (ctrlKey && lowerKey === 'k') {
        event.preventDefault();
        actionsRef.current.searchClient?.();
      }

      // Ctrl + S (Save Form) - Allowed in inputs
      if (ctrlKey && lowerKey === 's') {
        event.preventDefault();
        actionsRef.current.saveForm?.();
      }

      // Ctrl + D (Open Dashboard)
      if (ctrlKey && lowerKey === 'd') {
        event.preventDefault();
        actionsRef.current.openDashboard?.();
      }

      // Alt + Arrow keys (Switch Tabs)
      if (altKey && (key === 'ArrowRight' || key === 'ArrowLeft')) {
        event.preventDefault();
        actionsRef.current.switchTabs?.(key === 'ArrowRight' ? 'next' : 'prev');
      }

      // Ctrl + A (Alert View)
      if (ctrlKey && lowerKey === 'a') {
        event.preventDefault();
        actionsRef.current.openAlerts?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // Re-bind only once
};

export default useShortcuts;
