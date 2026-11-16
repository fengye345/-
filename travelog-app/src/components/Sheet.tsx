import { useEffect, type ReactNode } from 'react';
import { Portal } from './Portal';
import { Icon } from './Icon';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  sub?: string;
  tall?: boolean;
  footer?: ReactNode;
  children: ReactNode;
}

export function Sheet({ open, onClose, title, sub, tall, footer, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <Portal id="overlays">
      <div className="sheet-layer" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-backdrop" onClick={onClose} />
        <section className={`sheet${tall ? ' tall' : ''}`}>
          <div className="sheet-grab" />
          <div className="sheet-head">
            <div>
              <h3>{title}</h3>
              {sub ? <div className="sub">{sub}</div> : null}
            </div>
            <button className="sheet-close" onClick={onClose} aria-label="关闭">
              <Icon name="close" size={15} />
            </button>
          </div>
          <div className="sheet-body">{children}</div>
          {footer ? <div className="sheet-foot">{footer}</div> : null}
        </section>
      </div>
    </Portal>
  );
}
