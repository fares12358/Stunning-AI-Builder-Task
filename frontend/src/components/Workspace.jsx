import { motion } from 'framer-motion';
import ResponsePanel from './ResponsePanel.jsx';

/**
 * Workspace — AI builder conversation view
 *
 * The conversation (ResponsePanel) is the sole content area — there is no
 * separate "Build context" panel; the submitted prompt and integrations are
 * shown as the first message in the conversation itself.
 *
 * Props:
 *   chatData       — { chatId, title, integrations, messages } | null
 *   isLoading      — bool
 *   error          — string | null
 *   onSendFollowUp — (prompt: string) => void
 *   sidebarOpen    — bool — passed through so ResponsePanel can show the sidebar
 *                    reopen toggle in its own header when it's closed
 *   onOpenSidebar  — () => void
 */
function Workspace({
  chatData,
  isLoading,
  error,
  onSendFollowUp,
  sidebarOpen,
  onOpenSidebar,
}) {
  const messages = chatData?.messages ?? [];
  const canFollowUp = Boolean(chatData?.chatId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className="flex h-full flex-col overflow-hidden bg-(--bg) font-(--font-sans) text-(--text-primary)"
    >
      <ResponsePanel
        messages={messages}
        isLoading={isLoading}
        error={error}
        onSendFollowUp={onSendFollowUp}
        canFollowUp={canFollowUp}
        sidebarOpen={sidebarOpen}
        onOpenSidebar={onOpenSidebar}
      />
    </motion.div>
  );
}

export default Workspace;
