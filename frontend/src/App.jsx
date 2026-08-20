import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiLoader, FiMenu } from 'react-icons/fi';
import { useTheme } from './hooks/useTheme.js';
import { sendMessage, sendFollowUp, getChat } from './api/chat.api.js';
import LandingPage from './components/LandingPage.jsx';
import Workspace from './components/Workspace.jsx';
import Sidebar from './components/Sidebar.jsx';
import './App.css';
      
const ACTIVE_CHAT_KEY = 'stunning-active-chat-id';
const MOBILE_QUERY = '(max-width: 700px)';
const SIDEBAR_WIDTH = 260;
const SIDEBAR_TRANSITION = { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] };

const isMobileViewport = () =>
  typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches;

/**
 * App — application shell
 *
 * Top-level state:
 *   view           — 'landing' | 'workspace'
 *   chatData       — { chatId, title, integrations, messages, createdAt, updatedAt } | null
 *   isLoading      — bool — true while the initial build OR a follow-up is in flight
 *   error          — string | null
 *   historyVersion — bumped after a conversation is created/extended so the Sidebar refetches
 *   isRestoring    — bool — true while re-loading the active conversation after a page refresh
 *   sidebarOpen    — bool — defaults to open on desktop, closed on small screens (<701px)
 *   isDesktop      — bool — tracks the 701px breakpoint live, so the sidebar animation can
 *                    switch strategy (width collapse vs. off-canvas slide) if the window
 *                    is resized across it
 *
 * The active conversation's id is mirrored to localStorage so a browser refresh
 * reopens the same conversation instead of losing it.
 *
 * Navigation is state-driven — no React Router needed for this scope.
 */
function App() {
  const [theme, toggleTheme] = useTheme();
  const [view, setView] = useState('landing');
  const [chatData, setChatData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [isRestoring, setIsRestoring] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(() => !isMobileViewport());
  const [isDesktop, setIsDesktop] = useState(() => !isMobileViewport());

  function closeSidebarOnMobile() {
    if (isMobileViewport()) {
      setSidebarOpen(false);
    }
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    const handleChange = (event) => setIsDesktop(!event.matches);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const savedChatId = localStorage.getItem(ACTIVE_CHAT_KEY);

    if (!savedChatId) {
      setIsRestoring(false);
      return;
    }

    (async () => {
      try {
        const chat = await getChat(savedChatId);
        setChatData(chat);
        setView('workspace');
      } catch {
        localStorage.removeItem(ACTIVE_CHAT_KEY);
      } finally {
        setIsRestoring(false);
      }
    })();
  }, []);

  async function handleBuild(prompt, integrations) {
    setError(null);
    setIsLoading(true);

    // Show the workspace immediately with the just-sent prompt as the first
    // message — the user sees what they sent right away instead of staring
    // at the landing page while the AI response is in flight. The
    // conversation's GeneratingIndicator (ResponsePanel) fills the assistant
    // slot until the real response replaces this optimistic chat below.
    setView('workspace');
    setChatData({
      chatId: null,
      title: prompt.slice(0, 60),
      integrations,
      messages: [{ role: 'user', content: prompt, createdAt: new Date().toISOString() }],
      createdAt: null,
      updatedAt: null,
    });

    try {
      const result = await sendMessage(prompt, integrations);

      setChatData(result);
      setHistoryVersion((version) => version + 1);

      if (result.chatId) {
        localStorage.setItem(ACTIVE_CHAT_KEY, result.chatId);
      }
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        'Something went wrong. Please try again.';

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendFollowUp(prompt) {
    if (!chatData?.chatId) return;

    setError(null);
    setIsLoading(true);

    // Same optimistic pattern as handleBuild: show the user's message the
    // instant it's sent; the authoritative response below replaces it.
    setChatData((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        { role: 'user', content: prompt, createdAt: new Date().toISOString() },
      ],
    }));

    try {
      const result = await sendFollowUp(chatData.chatId, prompt);

      setChatData(result);
      setHistoryVersion((version) => version + 1);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        'Failed to send message. Please try again.';

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSelectChat(chatId) {
    setIsLoading(true);
    setError(null);

    try {
      const chat = await getChat(chatId);

      setChatData(chat);
      setView('workspace');
      localStorage.setItem(ACTIVE_CHAT_KEY, chatId);
      closeSidebarOnMobile();
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        'Failed to load that build. Please try again.';

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setChatData(null);
    setError(null);
    setIsLoading(false);
    setView('landing');
    localStorage.removeItem(ACTIVE_CHAT_KEY);
    closeSidebarOnMobile();
  }

  return (
    <div className="app-shell flex min-h-svh w-full">
      {/* Backdrop — mobile/tablet only; desktop reflows the content instead of overlaying it */}
      <AnimatePresence>
        {!isDesktop && sidebarOpen && (
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/60"
          />
        )}
      </AnimatePresence>

      {/*
        Sidebar stays mounted at all times (avoids re-fetching Recent Chats on every
        toggle) and its container animates the property that keeps content in sync:
        `width` on desktop (so the content column reflows smoothly, frame by frame,
        instead of snapping once the panel disappears) and `x` on mobile (an
        off-canvas slide, since it's an overlay and never occupies layout space).
      */}
      <motion.div
        animate={
          isDesktop
            ? { width: sidebarOpen ? SIDEBAR_WIDTH : 0, x: 0 }
            : { width: SIDEBAR_WIDTH, x: sidebarOpen ? 0 : -(SIDEBAR_WIDTH + 20) }
        }
        transition={SIDEBAR_TRANSITION}
        className="
          fixed inset-y-0 left-0 z-50 shrink-0 overflow-hidden
          min-[701px]:sticky min-[701px]:top-0 min-[701px]:z-auto min-[701px]:h-svh
        "
      >
        <div style={{ width: SIDEBAR_WIDTH }} className="h-full">
          <Sidebar
            theme={theme}
            onToggleTheme={toggleTheme}
            onNewBuild={handleReset}
            onSelectChat={handleSelectChat}
            onClose={() => setSidebarOpen(false)}
            activeChatId={chatData?.chatId ?? null}
            refreshKey={historyVersion}
          />
        </div>
      </motion.div>

      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        {/* Content header — landing/restoring only. The workspace instead shows this
            same toggle inline in ResponsePanel's own header (next to the conversation
            title) so the two don't stack as two separate bars. */}
        <AnimatePresence>
          {!sidebarOpen && view !== 'workspace' && (
            <motion.div
              key="content-header"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="flex shrink-0 items-center overflow-hidden border-b border-[var(--border)] bg-[var(--surface)] px-3 py-2.5"
            >
              <motion.button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--surface-high)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                <FiMenu size={16} aria-hidden="true" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="min-h-0 flex-1">
          {isRestoring ? (
            <div className="flex h-full items-center justify-center">
              <FiLoader
                size={22}
                aria-label="Loading"
                className="animate-spin text-[var(--accent)]"
              />
            </div>
          ) : view === 'landing' ? (
            <LandingPage
              onSubmit={handleBuild}
              isLoading={isLoading}
            />
          ) : (
            <Workspace
              chatData={chatData}
              isLoading={isLoading}
              error={error}
              onSendFollowUp={handleSendFollowUp}
              sidebarOpen={sidebarOpen}
              onOpenSidebar={() => setSidebarOpen(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
