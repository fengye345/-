import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Portal } from './Portal';
import { Icon, type IconName } from './Icon';

type ToastItem = { id: number; message: string; icon: IconName };
type ToastFn = (message: string, icon?: IconName) => void;

const ToastContext = createContext<ToastFn>(() => undefined);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const push = useCallback<ToastFn>((message, icon = 'check') => {
    const id = ++seq.current;
    setItems((prev) => [...prev, { id, message, icon }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 2400);
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Portal id="toasts">
        <div className="toast-layer" aria-live="polite">
          {items.map((t) => (
            <div className="toast" key={t.id}>
              <Icon name={t.icon} size={15} />
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      </Portal>
    </ToastContext.Provider>
  );
}
