import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiArrowUp, FiCode, FiLoader } from 'react-icons/fi';
import { FaPlug } from 'react-icons/fa';
import IntegrationSelector from './IntegrationSelector.jsx';

const MAX_PROMPT = 2000;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 18,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

/**
 * LandingPage — the product's first impression
 *
 * Props:
 *   onSubmit      — (prompt: string, integrations: string[]) => void
 *   isLoading     — bool
 *
 * Submission errors are shown in the workspace, not here — onSubmit
 * navigates to the workspace immediately with the sent prompt, so any
 * failure is displayed alongside it (see App.jsx's handleBuild).
 */
function LandingPage({ onSubmit, isLoading }) {
  const [prompt, setPrompt] = useState('');
  const [selected, setSelected] = useState([]);
  const [focused, setFocused] = useState(false);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const integrationsRef = useRef(null);

  const isEmpty = prompt.trim().length === 0;
  const isDisabled = isEmpty || isLoading;
  const charCount = prompt.length;
  const nearLimit = charCount > MAX_PROMPT * 0.88;
  const hasSelection = selected.length > 0;

  // Close the integrations dropdown on outside click / Escape
  useEffect(() => {
    if (!integrationsOpen) return;

    function handlePointerDown(event) {
      if (
        integrationsRef.current &&
        !integrationsRef.current.contains(event.target)
      ) {
        setIntegrationsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIntegrationsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [integrationsOpen]);

  function toggleIntegration(name) {
    setSelected((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    );
  }

  function handleSubmit() {
    if (isDisabled) return;

    onSubmit(prompt.trim(), selected);
  }

  function handleKeyDown(event) {
    // Ctrl+Enter or Cmd+Enter submits
    if (
      (event.ctrlKey || event.metaKey) &&
      event.key === 'Enter'
    ) {
      event.preventDefault();
      handleSubmit();
    }
  }

  return (
    <main className="flex h-full flex-col overflow-y-auto bg-[var(--bg)] font-[var(--font-sans)] text-[var(--text-primary)]">
      {/* Center content */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex w-full max-w-[620px] flex-col gap-8"
        >
          {/* Badge */}
          <motion.div variants={itemVariants}>
            <div
              aria-label="AI Builder"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-xl)] border border-[var(--accent-border)] bg-[var(--accent-subtle)] px-3 py-[5px] text-xs font-medium uppercase tracking-[0.04em] text-[var(--accent)]"
            >
              <FiCode
                size={13}
                aria-hidden="true"
              />

              AI Builder
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div variants={itemVariants}>
            <h1 className="m-0 text-[clamp(36px,7vw,56px)] font-bold leading-[1.08] tracking-[-0.03em] text-[var(--text-primary)]">
              Build anything.
            </h1>

            <p className="mt-3 mb-0 text-[17px] font-normal leading-[1.5] text-[var(--text-secondary)]">
              Describe it, select your stack, ship it.
            </p>
          </motion.div>

          {/* Prompt composer */}
          <motion.div variants={itemVariants}>
            <label
              htmlFor="prompt-input"
              className="mb-2 block text-xs font-medium uppercase tracking-[0.06em] text-(--text-muted)"
            >
              Your idea
            </label>

            <div className="relative rounded-lg">
              {/* Composer surface */}
              <div
                className={[
                  'relative overflow-visible rounded-lg',
                  'bg-(--surface)',
                  'transition-colors duration-200',
                  focused
                    ? 'border border-(--border-focus)'
                    : 'border border-(--border)',
                ].join(' ')}
              >
                <textarea
                  id="prompt-input"
                  value={prompt}
                  onChange={(event) =>
                    setPrompt(
                      event.target.value.slice(
                        0,
                        MAX_PROMPT
                      )
                    )
                  }
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  placeholder="What do you want to build?"
                  rows={4}
                  maxLength={MAX_PROMPT}
                  className={[
                    'block min-h-27.5 w-full resize-y rounded-t-lg focus-visible:outline-none focus:outline-none',
                    'border-none bg-transparent p-4',
                    'font-(--font-sans) text-[15px]',
                    'leading-[1.6]',
                    'outline-none',
                    'placeholder:text-(--text-muted)',
                    'caret-(--accent)',
                    'transition-colors duration-150',
                    isLoading
                      ? 'cursor-not-allowed text-(--text-muted)'
                      : 'cursor-text text-(--text-primary)',
                      
                  ].join(' ')}
                />

                {/* Composer footer: integrations trigger (left), char count + send (right) */}
                <div className="flex items-center justify-between gap-3 rounded-b-lg border-t border-(--border) px-3 py-2.5 ">
                  {/* Integrations trigger + dropdown */}
                  <div
                    ref={integrationsRef}
                    className="relative"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setIntegrationsOpen((open) => !open)
                      }
                      disabled={isLoading}
                      aria-haspopup="true"
                      aria-expanded={integrationsOpen}
                      className={[
                        'inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-md)] border px-2.5 py-[7px] text-xs font-medium transition-colors duration-150',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
                        isLoading && 'cursor-not-allowed opacity-60',
                        hasSelection
                          ? 'border-[var(--accent-border)] bg-[var(--accent-subtle)] text-[var(--accent)]'
                          : 'border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--border-focus)] hover:text-[var(--text-primary)]',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <FaPlug size={12} aria-hidden="true" />
                      Integrations
                      {hasSelection && (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-semibold text-white">
                          {selected.length}
                        </span>
                      )}
                    </button>

                    <AnimatePresence>
                      {integrationsOpen && (
                        <motion.div
                          initial={{
                            opacity: 0,
                            y: 6,
                            scale: 0.97,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                          }}
                          exit={{
                            opacity: 0,
                            y: 6,
                            scale: 0.97,
                          }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-[calc(100%+8px)] left-0 z-10 w-[270px] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.4)]"
                        >
                          <IntegrationSelector
                            selected={selected}
                            onChange={toggleIntegration}
                            disabled={isLoading}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Char count + Send */}
                  <div className="flex shrink-0 items-center gap-3">
                    <AnimatePresence initial={false}>
                      {charCount > 0 && (
                        <motion.span
                          initial={{
                            opacity: 0,
                            y: 2,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          exit={{
                            opacity: 0,
                            y: 2,
                          }}
                          transition={{ duration: 0.15 }}
                          className={[
                            'text-xs transition-colors duration-150',
                            nearLimit
                              ? 'text-[var(--warning)]'
                              : 'text-[var(--text-muted)]',
                          ].join(' ')}
                        >
                          {charCount} / {MAX_PROMPT}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    <motion.button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isDisabled}
                      aria-label={
                        isLoading ? 'Building…' : 'Build with AI'
                      }
                      title="Build with AI (Ctrl+Enter)"
                      whileHover={
                        isDisabled ? {} : { scale: 1.06 }
                      }
                      whileTap={
                        isDisabled ? {} : { scale: 0.94 }
                      }
                      transition={{ duration: 0.15 }}
                      className={[
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border-none',
                        'transition-colors duration-150',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]',
                        isDisabled
                          ? 'cursor-not-allowed bg-[var(--surface-high)] text-[var(--text-muted)]'
                          : 'cursor-pointer bg-[var(--accent)] text-white hover:brightness-110',
                      ].join(' ')}
                    >
                      {isLoading ? (
                        <FiLoader
                          size={15}
                          aria-hidden="true"
                          className="animate-spin"
                        />
                      ) : (
                        <FiArrowUp size={16} aria-hidden="true" />
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}

export default LandingPage;
