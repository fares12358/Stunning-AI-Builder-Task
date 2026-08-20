import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiAlertTriangle,
  FiCheck,
  FiClipboard,
  FiX,
  FiSend,
  FiUser,
  FiCpu,
  FiMenu,
} from 'react-icons/fi';

/**
 * ResponsePanel — right panel of the workspace
 *
 * Renders the full conversation transcript (user + AI messages) and,
 * once a conversation exists, a composer for sending follow-up prompts.
 *
 * Props:
 *   messages      — { role: 'user' | 'assistant', content: string }[]
 *   isLoading     — bool — true while the initial build OR a follow-up is in flight
 *   error         — string | null
 *   onSendFollowUp— (prompt: string) => void
 *   canFollowUp   — bool — false when the conversation has no persisted id (e.g. save failed)
 *   sidebarOpen   — bool — when false, shows a sidebar-reopen toggle in this header
 *   onOpenSidebar — () => void
 */
function ResponsePanel({
  messages,
  isLoading,
  error,
  onSendFollowUp,
  canFollowUp,
  sidebarOpen,
  onOpenSidebar,
}) {
  const hasMessages = messages && messages.length > 0;

  const lastAssistantMessage = hasMessages
    ? [...messages].reverse().find((m) => m.role === 'assistant')
        ?.content ?? null
    : null;

  const state = hasMessages
    ? 'success'
    : isLoading
    ? 'loading'
    : error
    ? 'error'
    : 'empty';

  return (
    <section
      aria-label="AI conversation"
      aria-busy={isLoading}
      className="flex min-w-0 flex-1 flex-col overflow-hidden bg-(--bg)"
    >
      {/* Panel header */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-6 py-[18px]">
        <div className="flex items-center gap-2">
          {!sidebarOpen && (
            <motion.button
              type="button"
              onClick={onOpenSidebar}
              aria-label="Open sidebar"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="-my-1 -ml-1.5 mr-0.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--surface-high)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <FiMenu size={15} aria-hidden="true" />
            </motion.button>
          )}

          <StatusDot state={state} loading={isLoading} />

          <h2 className="m-0 text-[13px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
            {hasMessages
              ? 'Conversation'
              : isLoading
              ? 'Generating…'
              : state === 'error'
              ? 'Something went wrong'
              : 'Response'}
          </h2>
        </div>

        {lastAssistantMessage && (
          <CopyButton text={lastAssistantMessage} />
        )}
      </div>

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto px-6 py-7">
        <AnimatePresence mode="wait">
          {state === 'loading' && <LoadingState key="loading" />}
          {state === 'error' && (
            <ErrorState key="error" message={error} />
          )}
          {state === 'empty' && <EmptyState key="empty" />}
        </AnimatePresence>

        {hasMessages && (
          <div className="flex flex-col gap-7">
            {messages.map((message, index) =>
              message.role === 'assistant' ? (
                <AssistantMessage
                  key={index}
                  text={message.content}
                />
              ) : (
                <UserMessage key={index} text={message.content} />
              )
            )}

            <AnimatePresence>
              {isLoading && <GeneratingIndicator key="generating" />}
            </AnimatePresence>

            <AnimatePresence>
              {error && <InlineError key="inline-error" message={error} />}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Follow-up composer */}
      {hasMessages && (
        <FollowUpComposer
          isLoading={isLoading}
          disabled={!canFollowUp}
          onSend={onSendFollowUp}
        />
      )}
    </section>
  );
}

/* ─────────────────────────── Messages ─────────────────────────── */

function UserMessage({ text }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-end gap-1.5"
    >
      <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-muted)]">
        You
        <FiUser size={11} aria-hidden="true" />
      </span>

      <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm leading-[1.65] text-[var(--text-primary)]">
        {text}
      </div>
    </motion.div>
  );
}

function AssistantMessage({ text }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-start gap-1.5"
    >
      <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-muted)]">
        <FiCpu size={11} aria-hidden="true" />
        AI
      </span>

      <div className="w-full max-w-full">
        <FormattedResponse text={text} />
      </div>
    </motion.div>
  );
}

function GeneratingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      aria-label="AI is generating a reply"
      className="flex flex-col items-start gap-1.5"
    >
      <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-muted)]">
        <FiCpu size={11} aria-hidden="true" />
        AI
      </span>

      <div className="flex w-full max-w-[420px] flex-col gap-2.5">
        <SkeletonLine width="88%" delay={0} />
        <SkeletonLine width="68%" delay={0.08} />
        <SkeletonLine width="48%" delay={0.16} />
      </div>
    </motion.div>
  );
}

/* ─────────────────────────── Loading (initial) ─────────────────────────── */

function LoadingState() {
  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      aria-label="AI is generating a response"
      className="flex flex-col gap-3"
    >
      {[100, 92, 85, 100, 78, 88, 60].map(
        (width, index) => (
          <SkeletonLine
            key={index}
            width={`${width}%`}
            delay={index * 0.06}
          />
        )
      )}

      {/* Code block skeleton */}
      <div className="mt-2 flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4">
        {[70, 85, 55, 90].map(
          (width, index) => (
            <SkeletonLine
              key={index}
              width={`${width}%`}
              delay={index * 0.07 + 0.4}
              mono
            />
          )
        )}
      </div>

      {[95, 72].map((width, index) => (
        <SkeletonLine
          key={`b${index}`}
          width={`${width}%`}
          delay={index * 0.06 + 0.7}
        />
      ))}
    </motion.div>
  );
}

function SkeletonLine({
  width,
  delay = 0,
  mono = false,
}) {
  return (
    <motion.div
      animate={{
        opacity: [0.35, 0.7, 0.35],
      }}
      transition={{
        duration: 1.6,
        ease: 'easeInOut',
        repeat: Infinity,
        delay,
      }}
      style={{ width }}
      className={[
        'rounded',
        mono ? 'h-[13px]' : 'h-[14px]',
        // --text-muted keeps real contrast against --bg in both themes —
        // --surface-high (used previously) sits almost the same lightness
        // as --bg in light mode and was nearly invisible there.
        'bg-[var(--text-muted)]',
        mono && 'font-[var(--font-mono)]',
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}

/**
 * Lightweight response renderer.
 * Supports prose, headings, lists, inline code and fenced code blocks.
 */
function FormattedResponse({ text }) {
  const parts = parseCodeBlocks(text);

  return (
    <div className="flex flex-col">
      {parts.map((part, index) =>
        part.type === 'code' ? (
          <CodeBlock
            key={index}
            lang={part.lang}
            code={part.content}
          />
        ) : (
          <ProsePart
            key={index}
            text={part.content}
          />
        )
      )}
    </div>
  );
}

/**
 * Groups lines into heading / list / paragraph blocks.
 *
 * Line-based (not blank-line-paragraph-based) so a heading is recognized
 * even when the model doesn't put a blank line after it — e.g.
 * "# Project Overview\nA minimal app that..." previously fell through to
 * the paragraph branch as one merged block, rendering the whole paragraph
 * at heading size/weight instead of just the heading line.
 */
function parseProseBlocks(text) {
  const lines = text.split('\n');
  const blocks = [];
  let paragraphLines = [];
  let listItems = [];

  const flushParagraph = () => {
    if (paragraphLines.length) {
      blocks.push({ type: 'p', text: paragraphLines.join(' ') });
      paragraphLines = [];
    }
  };

  const flushList = () => {
    if (listItems.length) {
      blocks.push({ type: 'list', items: listItems });
      listItems = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2] });
      continue;
    }

    if (/^[-*•]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      flushParagraph();
      listItems.push(line.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, ''));
      continue;
    }

    flushList();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}

const HEADING_STYLES = {
  1: 'mb-2.5 mt-7 text-lg font-bold tracking-[-0.02em] text-[var(--text-primary)]',
  2: 'mb-2 mt-6 text-base font-semibold tracking-[-0.02em] text-[var(--text-primary)]',
};
const HEADING_STYLE_DEFAULT =
  'mb-1.5 mt-5 text-sm font-semibold tracking-[-0.01em] text-[var(--text-primary)]';

function ProsePart({ text }) {
  if (!text.trim()) return null;

  const blocks = parseProseBlocks(text);

  return (
    <div className="mb-1">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          const HeadingTag = block.level === 1 ? 'h2' : block.level === 2 ? 'h3' : 'h4';
          const className = HEADING_STYLES[block.level] ?? HEADING_STYLE_DEFAULT;

          return (
            <HeadingTag key={index} className={className}>
              {block.text}
            </HeadingTag>
          );
        }

        if (block.type === 'list') {
          return (
            <ul
              key={index}
              className="my-1.5 mb-3.5 flex list-disc flex-col gap-1 pl-5"
            >
              {block.items.map((item, itemIndex) => (
                <li
                  key={itemIndex}
                  className="text-sm leading-[1.65] text-[var(--text-secondary)]"
                >
                  {item}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p
            key={index}
            className="mb-3.5 text-sm leading-[1.75] text-[var(--text-secondary)]"
            dangerouslySetInnerHTML={{
              __html: renderInlineCode(block.text),
            }}
          />
        );
      })}
    </div>
  );
}

function CodeBlock({ lang, code }) {
  return (
    <div className="my-3 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]">
      {/* Code header */}
      {lang && (
        <div
          aria-hidden="true"
          className="flex items-center gap-1.5 border-b border-[var(--border)] bg-[var(--surface-high)] px-3.5 py-[7px]"
        >
          <span className="font-[var(--font-mono)] text-[11px] tracking-[0.04em] text-[var(--text-muted)]">
            {lang}
          </span>
        </div>
      )}

      {/* Code content */}
      <pre className="m-0 overflow-x-auto bg-transparent p-4 font-[var(--font-mono)] text-[13px] leading-[1.65] text-[var(--text-primary)]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* ─────────────────────────── Error / empty ─────────────────────────── */

function ErrorState({ message }) {
  return (
    <motion.div
      key="error"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      role="alert"
      className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-6 text-center"
    >
      <div
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.1)]"
      >
        <FiAlertTriangle
          size={18}
          className="text-[var(--error)]"
        />
      </div>

      <div>
        <p className="mb-1.5 text-sm font-semibold text-[var(--error)]">
          Generation failed
        </p>

        <p className="m-0 max-w-[320px] text-[13px] leading-[1.6] text-[var(--text-muted)]">
          {message ||
            'Something went wrong. Please try again.'}
        </p>
      </div>
    </motion.div>
  );
}

function InlineError({ message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      role="alert"
      className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.08)] px-3.5 py-3 text-sm leading-[1.5] text-[var(--error)]"
    >
      <FiAlertTriangle
        size={15}
        aria-hidden="true"
        className="mt-0.5 shrink-0"
      />
      <span>{message}</span>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex min-h-[200px] items-center justify-center"
    >
      <p className="m-0 text-[13px] text-[var(--text-muted)]">
        No response yet.
      </p>
    </motion.div>
  );
}

/* ─────────────────────────── Follow-up composer ─────────────────────────── */

const FOLLOWUP_MAX_HEIGHT = 160; // px — roughly 7 lines before it scrolls internally

function FollowUpComposer({ isLoading, disabled, onSend }) {
  const [draft, setDraft] = useState('');
  const textareaRef = useRef(null);

  const isEmpty = draft.trim().length === 0;
  const isSendDisabled = isEmpty || isLoading || disabled;

  // Auto-grow with content instead of staying pinned at one line —
  // reset to 'auto' first so it can shrink back down when text is deleted.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, FOLLOWUP_MAX_HEIGHT)}px`;
  }, [draft]);

  function handleSend() {
    if (isSendDisabled) return;
    onSend(draft.trim());
    setDraft('');
  }

  function handleKeyDown(event) {
    if (
      (event.ctrlKey || event.metaKey) &&
      event.key === 'Enter'
    ) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)] px-6 py-4">
      {disabled && (
        <p className="mb-2 text-xs text-[var(--text-muted)]">
          This build wasn't saved, so follow-up messages aren't available. Start a New Build to continue.
        </p>
      )}

      <div className="flex items-end gap-2.5">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(event) =>
            setDraft(event.target.value.slice(0, 2000))
          }
          onKeyDown={handleKeyDown}
          disabled={isLoading || disabled}
          rows={1}
          placeholder="Ask a follow-up…"
          aria-label="Follow-up message"
          className="min-h-[42px] max-h-[160px] flex-1 resize-none overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 font-[var(--font-sans)] text-sm leading-[1.5] text-[var(--text-primary)] outline-none transition-colors duration-150 placeholder:text-[var(--text-muted)] focus:border-[var(--border-focus)] disabled:cursor-not-allowed disabled:text-[var(--text-muted)]"
        />

        <motion.button
          type="button"
          onClick={handleSend}
          disabled={isSendDisabled}
          aria-label="Send follow-up message"
          whileHover={
            isSendDisabled ? {} : { scale: 1.05 }
          }
          whileTap={
            isSendDisabled ? {} : { scale: 0.95 }
          }
          transition={{ duration: 0.15 }}
          className={[
            'flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[var(--radius-md)] border-none transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
            isSendDisabled
              ? 'cursor-not-allowed bg-[var(--surface-high)] text-[var(--text-muted)]'
              : 'cursor-pointer bg-[var(--accent)] text-white hover:brightness-110',
          ].join(' ')}
        >
          <FiSend size={15} aria-hidden="true" />
        </motion.button>
      </div>
    </div>
  );
}

/* ─────────────────────────── Copy button ─────────────────────────── */

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFailed(true);
      setTimeout(() => setFailed(false), 2000);
    }
  }, [text]);

  const label = copied
    ? 'Copied!'
    : failed
    ? 'Copy failed'
    : 'Copy last response';

  const buttonClasses = copied
    ? 'border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.08)] text-[var(--success)]'
    : failed
    ? 'border-[rgba(248,113,113,0.35)] bg-[rgba(248,113,113,0.08)] text-[var(--error)]'
    : 'border-[var(--border)] bg-[var(--surface-high)] text-[var(--text-secondary)]';

  return (
    <motion.button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      title={label}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className={[
        'inline-flex shrink-0 cursor-pointer items-center gap-1.5',
        'rounded-[var(--radius-md)] border',
        'px-3 py-1.5',
        'font-[var(--font-sans)] text-xs font-medium',
        'transition-[background-color,border-color,color] duration-150',
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-[var(--accent)]',
        buttonClasses,
      ].join(' ')}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={
            copied
              ? 'check'
              : failed
              ? 'fail'
              : 'copy'
          }
          initial={{
            opacity: 0,
            scale: 0.7,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            scale: 0.7,
          }}
          transition={{ duration: 0.15 }}
          aria-hidden="true"
          className="flex text-[13px] leading-none"
        >
          {copied ? (
            <FiCheck size={13} />
          ) : failed ? (
            <FiX size={13} />
          ) : (
            <FiClipboard size={13} />
          )}
        </motion.span>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.span
          key={label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

/* ─────────────────────────── Status dot ─────────────────────────── */

function StatusDot({ state, loading }) {
  const colorClass =
    loading
      ? 'bg-[var(--accent)]'
      : state === 'success'
      ? 'bg-[var(--success)]'
      : state === 'error'
      ? 'bg-[var(--error)]'
      : 'bg-[var(--text-muted)]';

  return (
    <motion.div
      aria-hidden="true"
      animate={
        loading
          ? { opacity: [1, 0.3, 1] }
          : { opacity: 1 }
      }
      transition={
        loading
          ? {
              duration: 1.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }
          : {}
      }
      className={[
        'h-[7px] w-[7px] shrink-0 rounded-full',
        colorClass,
      ].join(' ')}
    />
  );
}

/* ─────────────────────────── Helpers ─────────────────────────── */

function parseCodeBlocks(text) {
  if (!text) return [];

  const parts = [];
  const regex = /```(\w*)\n?([\s\S]*?)```/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'prose',
        content: text.slice(
          lastIndex,
          match.index
        ),
      });
    }

    parts.push({
      type: 'code',
      lang: match[1] || '',
      content: match[2].trimEnd(),
    });

    lastIndex =
      match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: 'prose',
      content: text.slice(lastIndex),
    });
  }

  return parts;
}

function renderInlineCode(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /`([^`]+)`/g,
      (_, code) =>
        `<code class="inline-code">${code}</code>`
    );
}

export default ResponsePanel;
