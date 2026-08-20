import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus,
  FiSun,
  FiMoon,
  FiTrash2,
  FiMessageSquare,
  FiChevronsLeft,
} from 'react-icons/fi';
import { getChats, deleteChat as deleteChatApi } from '../api/chat.api.js';
import ConfirmDialog from './ConfirmDialog.jsx';

/**
 * Sidebar — persistent app rail
 *
 * Shown on both the landing view and the workspace view.
 * Owns branding, "New Build", recent chat history, and the theme toggle.
 *
 * Props:
 *   theme           — 'dark' | 'light'
 *   onToggleTheme   — () => void
 *   onNewBuild      — () => void — returns to landing with cleared state
 *   onSelectChat    — (chatId: string) => void — loads a saved chat into the workspace
 *   onClose         — () => void — collapses the sidebar (App.jsx owns the open/closed state)
 *   activeChatId    — string | null — highlights the currently loaded chat
 *   refreshKey      — value that changes whenever the list should be refetched
 */
function Sidebar({
  theme,
  onToggleTheme,
  onNewBuild,
  onSelectChat,
  onClose,
  activeChatId,
  refreshKey,
}) {
  const [chats, setChats] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [pendingDelete, setPendingDelete] = useState(null);

  const fetchChats = useCallback(async () => {
    try {
      const data = await getChats();
      setChats(data);
    } catch {
      // History is secondary — fail silently rather than blocking the app
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats, refreshKey]);

  async function confirmDelete() {
    if (!pendingDelete) return;

    const id = pendingDelete._id;
    setPendingDelete(null);
    setChats((prev) => prev.filter((chat) => chat._id !== id));

    try {
      await deleteChatApi(id);
    } catch {
      fetchChats(); // resync local list on failure
    }

    if (id === activeChatId) {
      onNewBuild();
    }
  }

  return (
    <aside
      aria-label="Chat history"
      className="flex h-full flex-col overflow-hidden border-r border-[var(--border)] bg-[var(--surface)]"
    >
      {/* Brand */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--border)] px-5 py-[18px] text-sm font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
        <span className="flex items-center gap-[7px]">
          <span
            className="text-[15px] text-[var(--accent)]"
            aria-hidden="true"
          >
            ✦
          </span>
          Stunning
        </span>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close sidebar"
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-[var(--text-muted)] transition-colors duration-150 hover:bg-[var(--surface-high)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <FiChevronsLeft size={15} aria-hidden="true" />
        </button>
      </div>

      {/* New Build */}
      <div className="shrink-0 px-3 pt-4">
        <motion.button
          type="button"
          onClick={onNewBuild}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15 }}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--accent-border)] bg-[var(--accent-subtle)] px-3.5 py-2.5 text-[13px] font-medium text-[var(--accent)] transition-colors duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
        >
          <FiPlus size={14} aria-hidden="true" />
          New Build
        </motion.button>
      </div>

      {/* Recent chats */}
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--text-muted)]">
          Recent
        </p>

        {!loadingList && chats.length === 0 && (
          <p className="px-2 text-[13px] text-[var(--text-muted)]">
            No builds yet
          </p>
        )}

        <AnimatePresence initial={false}>
          {chats.map((chat) => {
            const isActive = chat._id === activeChatId;

            return (
              <motion.div
                key={chat._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className={[
                  'group flex items-center gap-1 rounded-[var(--radius-md)] transition-colors duration-150',
                  isActive
                    ? 'bg-[var(--surface-high)]'
                    : 'hover:bg-[var(--surface-high)]',
                ].join(' ')}
              >
                <button
                  type="button"
                  onClick={() => onSelectChat(chat._id)}
                  aria-current={isActive}
                  className={[
                    'flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-[var(--radius-md)] px-2.5 py-2 text-left text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
                    isActive
                      ? 'text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]',
                  ].join(' ')}
                >
                  <FiMessageSquare
                    size={13}
                    aria-hidden="true"
                    className="shrink-0 text-[var(--text-muted)]"
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {chat.title}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPendingDelete(chat)}
                  aria-label={`Delete ${chat.title}`}
                  className="mr-1 shrink-0 cursor-pointer rounded p-1.5 text-[var(--text-muted)] opacity-0 transition-opacity duration-150 hover:text-[var(--error)] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] group-hover:opacity-100"
                >
                  <FiTrash2 size={12} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Theme toggle */}
      <div className="shrink-0 border-t border-[var(--border)] px-3 py-3">
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={
            theme === 'dark'
              ? 'Switch to light mode'
              : 'Switch to dark mode'
          }
          className="inline-flex w-full cursor-pointer items-center gap-2 rounded-[var(--radius-md)] px-2.5 py-2 text-[13px] text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--surface-high)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          {theme === 'dark' ? (
            <FiSun size={14} aria-hidden="true" />
          ) : (
            <FiMoon size={14} aria-hidden="true" />
          )}
          Theme
        </button>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this build?"
        message={
          pendingDelete
            ? `"${pendingDelete.title}" and its full conversation will be permanently deleted. This can't be undone.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </aside>
  );
}

export default Sidebar;
