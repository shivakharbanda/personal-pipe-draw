
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isStreaming: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isStreaming }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {isStreaming && (
        <div className="absolute top-2 right-2 flex items-center gap-2 text-[10px] text-blue-600 font-mono animate-pulse bg-white/90 px-2 py-1 rounded-lg shadow-sm">
          <Loader2 className="w-3 h-3 animate-spin" />
          PROCESSING...
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#d4d4d8 transparent'
        }}
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
            <Bot className="w-12 h-12 mb-4 text-neutral-400" />
            <p className="text-sm text-neutral-600">Ask me anything about the drawing analysis, component specifications, or the suggested design fixes.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`p-2 rounded-lg h-fit ${msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-neutral-200 text-neutral-600'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-tr-none shadow-md'
                : 'bg-neutral-100 border border-neutral-300 text-neutral-900 rounded-tl-none'
            }`}>
              {msg.role === 'user' ? (
                msg.text
              ) : (
                <ReactMarkdown
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-lg font-bold text-neutral-900 mb-2 mt-3 first:mt-0" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-base font-bold text-neutral-900 mb-2 mt-3 first:mt-0" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-sm font-bold text-neutral-900 mb-1 mt-2 first:mt-0" {...props} />,
                    p: ({node, ...props}) => <p className="text-neutral-900 my-2 first:mt-0 last:mb-0" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold text-neutral-900" {...props} />,
                    em: ({node, ...props}) => <em className="italic text-neutral-900" {...props} />,
                    code: ({node, className, children, ...props}) => {
                      const isInline = !className;
                      return isInline ? (
                        <code className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                          {children}
                        </code>
                      ) : (
                        <code className="block bg-neutral-800 text-neutral-100 p-3 rounded-lg my-2 overflow-x-auto text-xs font-mono" {...props}>
                          {children}
                        </code>
                      );
                    },
                    pre: ({node, ...props}) => <pre className="my-2 first:mt-0 last:mb-0" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2 space-y-1 first:mt-0 last:mb-0" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2 space-y-1 first:mt-0 last:mb-0" {...props} />,
                    li: ({node, ...props}) => <li className="text-neutral-900" {...props} />,
                    a: ({node, ...props}) => <a className="text-blue-600 underline hover:text-blue-700" target="_blank" rel="noopener noreferrer" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-neutral-300 pl-4 italic text-neutral-700 my-2" {...props} />,
                    hr: ({node, ...props}) => <hr className="border-t border-neutral-300 my-3" {...props} />
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-neutral-300 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your inquiry..."
          disabled={isStreaming}
          className="flex-1 bg-white border border-neutral-300 rounded-lg px-4 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors disabled:opacity-50 disabled:bg-neutral-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming}
          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;
