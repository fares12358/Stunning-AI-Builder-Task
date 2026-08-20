import { AnimatePresence, motion } from 'framer-motion';
import { FiCheck } from 'react-icons/fi';
import { INTEGRATIONS } from '../constants/integrations.js';

/**
 * IntegrationSelector — multi-select chip row for integration choices
 *
 * Props:
 *   selected  — string[] of selected integration names
 *   onChange  — (name: string) => void — toggles one integration
 *   disabled  — bool — disables interaction while loading
 */
function IntegrationSelector({ selected, onChange, disabled }) {
  return (
    <div className="flex flex-col gap-2">
      <span
        className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--text-muted)]"
        id="integrations-label"
      >
        Integrations
      </span>

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-labelledby="integrations-label"
      >
        {INTEGRATIONS.map((integration) => {
          const isSelected = selected.includes(integration.name);
          const Icon = integration.icon;
          return (
            <motion.button
              key={integration.name}
              type="button"
              onClick={() => !disabled && onChange(integration.name)}
              disabled={disabled}
              aria-pressed={isSelected}
              aria-label={`${isSelected ? 'Remove' : 'Add'} ${integration.name}`}
              whileHover={
                disabled
                  ? {}
                  : {
                    scale: 1.04,
                    y: -1,
                  }
              }
              whileTap={disabled ? {} : { scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className={[
                'inline-flex items-center gap-1.5',
                'whitespace-nowrap select-none',
                'rounded-[var(--radius-md)]',
                'border px-[13px] py-[7px]',
                'font-[var(--font-sans)] text-[13px]',
                'cursor-pointer',
                'transition-[background-color,border-color,color,opacity]',
                'duration-150',
                'focus-visible:outline-none',
                'focus-visible:ring-2',
                'focus-visible:ring-[var(--accent)]',
                'focus-visible:ring-offset-2',
                'focus-visible:ring-offset-[var(--bg)]',
                disabled && 'cursor-not-allowed opacity-[0.55]',
                isSelected
                  ? 'border-[var(--accent-border)] bg-[var(--accent-subtle)] font-medium text-[var(--accent)]'
                  : 'border-[var(--border)] bg-[var(--surface)] font-normal text-[var(--text-secondary)]',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <Icon
                size={14}
                aria-hidden="true"
              />

              <span>{integration.name}</span>

              <AnimatePresence>
                {isSelected && (
                  <motion.span
                    key="check"
                    initial={{
                      opacity: 0,
                      scale: 0.4,
                      width: 0,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      width: 'auto',
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.4,
                      width: 0,
                    }}
                    transition={{ duration: 0.15 }}
                    aria-hidden="true"
                    className="ml-0.5 inline-flex overflow-hidden text-[11px] text-[var(--accent)]"
                  >
                    <FiCheck size={11} strokeWidth={2.5} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default IntegrationSelector;