import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiAlertTriangle } from 'react-icons/fi';

/**
 * ConfirmDialog — reusable confirmation modal for destructive actions
 *
 * Props:
 *   open          — bool
 *   title         — string
 *   message       — string
 *   confirmLabel  — string (default "Delete")
 *   cancelLabel   — string (default "Cancel")
 *   onConfirm     — () => void
 *   onCancel      — () => void
 */
function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onCancel();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  // Rendered into document.body: the sidebar's `sticky` wrapper (App.jsx)
  // creates its own stacking context, which would otherwise trap this
  // fixed-position dialog behind later-in-DOM content (e.g. the landing
  // page composer) regardless of z-index.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onCancel}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[360px] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.45)]"
          >
            <div className="flex items-start gap-3">
              <div
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.1)]"
              >
                <FiAlertTriangle size={16} className="text-[var(--error)]" />
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <h2
                  id="confirm-dialog-title"
                  className="m-0 text-[15px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]"
                >
                  {title}
                </h2>

                <p
                  id="confirm-dialog-message"
                  className="mb-0 mt-1.5 text-[13px] leading-[1.55] text-[var(--text-secondary)]"
                >
                  {message}
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onCancel}
                autoFocus
                className="cursor-pointer rounded-[var(--radius-md)] border border-[var(--border)] bg-transparent px-3.5 py-2 text-[13px] font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--border-focus)] hover:bg-[var(--surface-high)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                {cancelLabel}
              </button>

              <button
                type="button"
                onClick={onConfirm}
                className="cursor-pointer rounded-[var(--radius-md)] border-none bg-[var(--error)] px-3.5 py-2 text-[13px] font-medium text-white transition-[filter] duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--error)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default ConfirmDialog;
