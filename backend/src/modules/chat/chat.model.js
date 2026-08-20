import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const chatSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    integrations: { type: [String], default: [] },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

// Mongoose 9 dropped the legacy next() callback for document middleware —
// hooks must be synchronous (or return a Promise), so this hook takes no
// arguments and simply returns.
chatSchema.pre('validate', function setTitleFromFirstMessage() {
  if (!this.title) {
    const firstUserMessage = this.messages.find(
      (message) => message.role === 'user'
    );

    if (firstUserMessage) {
      this.title = firstUserMessage.content.slice(0, 60);
    }
  }
});

export default mongoose.model('Chat', chatSchema);
