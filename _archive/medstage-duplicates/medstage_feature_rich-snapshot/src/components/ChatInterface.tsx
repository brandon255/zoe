// MedStage — Chat interface
// Text input + image/video upload + voice button. Combines the assistant-style chat
// with the existing voice + image/video upload workflows.

import { useState, useRef, useEffect } from 'react';

export interface ChatAttachment {
  file: File;
  type: 'image' | 'video';
  url: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  attachments?: ChatAttachment[];
  timestamp: number;
  metadata?: {
    action?: string;
    intent?: string;
  };
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, images?: File[]) => void;
  isListening: boolean;
  voiceTranscript: string;
  voiceTranscriptFinal: boolean;
  onToggleVoice: () => void;
  voiceSupported: boolean;
  isProcessing?: boolean;
  onUploadImages?: (files: File[]) => void;
}

export function ChatInterface({
  messages,
  onSendMessage,
  isListening,
  voiceTranscript,
  voiceTranscriptFinal,
  onToggleVoice,
  voiceSupported,
  isProcessing,
  onUploadImages,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ url: string; type: 'image' | 'video' }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sync voice transcript to input
  useEffect(() => {
    if (voiceTranscriptFinal && voiceTranscript) {
      setInput(voiceTranscript);
    }
  }, [voiceTranscriptFinal, voiceTranscript]);

  // Generate previews for attached files
  useEffect(() => {
    const newPreviews: { url: string; type: 'image' | 'video' }[] = attachedFiles.map((file) => {
      const url = URL.createObjectURL(file);
      const type: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image';
      return { url, type };
    });
    setFilePreviews(newPreviews);
    return () => {
      newPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [attachedFiles]);

  const handleSend = () => {
    const text = input.trim();
    if (!text && attachedFiles.length === 0) return;
    onSendMessage(text, attachedFiles);
    setInput('');
    setAttachedFiles([]);
    setFilePreviews([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles((prev) => [...prev, ...files]);
    if (onUploadImages) onUploadImages(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      className="chat-interface"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 80,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '0 20px 16px',
        pointerEvents: 'none',
        maxHeight: '50vh',
      }}
    >
      {/* Messages area */}
      {messages.length > 0 && (
        <div
          className="chat-messages"
          style={{
            maxHeight: '30vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            padding: '8px 4px',
            pointerEvents: 'auto',
          }}
        >
          {messages.slice(-6).map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Voice transcript (live) */}
      {isListening && voiceTranscript && (
        <div
          style={{
            alignSelf: 'center',
            padding: '6px 12px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-info)',
            borderRadius: 999,
            fontSize: 12,
            color: 'var(--color-text)',
            fontStyle: 'italic',
            pointerEvents: 'auto',
          }}
        >
          🎤 "{voiceTranscript}"
        </div>
      )}

      {/* File previews (images + videos) */}
      {filePreviews.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            padding: 6,
            background: 'var(--color-surface)',
            borderRadius: 8,
            pointerEvents: 'auto',
            alignSelf: 'flex-start',
            maxWidth: '60%',
            flexWrap: 'wrap',
          }}
        >
          {attachedFiles.map((file, i) => {
            const preview = filePreviews[i];
            return (
              <div
                key={i}
                style={{
                  position: 'relative',
                  width: 64,
                  height: 64,
                  borderRadius: 6,
                  overflow: 'hidden',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                }}
              >
                {preview?.type === 'video' ? (
                  <>
                    <video
                      src={preview.url}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      muted
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 2,
                        left: 2,
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        fontSize: 8,
                        fontWeight: 700,
                        padding: '1px 4px',
                        borderRadius: 2,
                        letterSpacing: 0.4,
                      }}
                    >
                      ▶ VIDEO
                    </div>
                  </>
                ) : (
                  <img
                    src={preview?.url || ''}
                    alt={file.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
                <button
                  onClick={() => removeFile(i)}
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    fontSize: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Input row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          background: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-border-strong)',
          borderRadius: 24,
          padding: '8px 8px 8px 16px',
          boxShadow: 'var(--shadow-md)',
          pointerEvents: 'auto',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        {/* Image/video upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload images or video"
          title="Upload images or video (multi-photo for 3D scan, video for reference)"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'transparent',
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(204, 0, 0, 0.1)';
            e.currentTarget.style.color = 'var(--color-text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-muted)';
          }}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* Text input */}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isProcessing
              ? 'Processing…'
              : isListening
              ? 'Listening…'
              : voiceSupported
              ? 'Type a command, or tap the mic to speak…'
              : 'Type a command…'
          }
          disabled={isProcessing}
          rows={1}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--color-text)',
            fontSize: 14,
            fontFamily: 'inherit',
            resize: 'none',
            maxHeight: 80,
            minHeight: 24,
            padding: '6px 0',
          }}
          onInput={(e) => {
            const target = e.currentTarget;
            target.style.height = 'auto';
            target.style.height = Math.min(target.scrollHeight, 80) + 'px';
          }}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={(!input.trim() && attachedFiles.length === 0) || isProcessing}
          aria-label="Send message"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: input.trim() || attachedFiles.length > 0 ? 'var(--color-primary)' : 'rgba(94, 110, 133, 0.3)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 150ms',
            opacity: (!input.trim() && attachedFiles.length === 0) || isProcessing ? 0.5 : 1,
          }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>

        {/* Voice button */}
        <button
          onClick={onToggleVoice}
          aria-label={isListening ? 'Stop listening' : 'Start listening'}
          title={voiceSupported ? 'Click to use voice' : 'Voice not supported'}
          disabled={!voiceSupported}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: isListening ? 'var(--color-accent)' : 'var(--color-info)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            animation: isListening ? 'pulse 1.5s ease-in-out infinite' : 'none',
            opacity: voiceSupported ? 1 : 0.5,
            transition: 'all 150ms',
          }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '70%',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {message.imageUrl && (
        <img
          src={message.imageUrl}
          alt="attachment"
          style={{
            maxWidth: 200,
            maxHeight: 200,
            borderRadius: 8,
            border: '1px solid var(--color-border)',
          }}
        />
      )}
      {message.videoUrl && (
        <video
          src={message.videoUrl}
          controls
          style={{
            maxWidth: 240,
            maxHeight: 180,
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            background: '#000',
          }}
        />
      )}
      {message.attachments?.map((att, i) => (
        att.type === 'image' ? (
          <img
            key={i}
            src={att.url}
            alt={att.file.name}
            style={{
              maxWidth: 200,
              maxHeight: 200,
              borderRadius: 8,
              border: '1px solid var(--color-border)',
            }}
          />
        ) : (
          <video
            key={i}
            src={att.url}
            controls
            style={{
              maxWidth: 240,
              maxHeight: 180,
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              background: '#000',
            }}
          />
        )
      ))}
      <div
        style={{
          padding: '8px 12px',
          background: isUser ? 'var(--color-primary)' : 'var(--color-surface-elevated)',
          color: 'white',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          fontSize: 13,
          lineHeight: 1.4,
          boxShadow: 'var(--shadow-sm)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        {message.content}
      </div>
    </div>
  );
}
