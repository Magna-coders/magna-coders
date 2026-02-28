import React, { useState } from 'react';
import { X, Bot, Send, Sparkles, Brain, Zap, MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
}

interface MagnaAIModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const defaultMessages: Message[] = [
  {
    id: '1',
    type: 'ai',
    content: 'Hello! I\'m Magna AI, your intelligent assistant for contract management. How can I help you today?',
    timestamp: '2:30 PM'
  }
];

const quickActions = [
  {
    icon: <Brain className="w-4 h-4" />,
    title: 'Analyze Contract',
    description: 'Review contract terms and conditions'
  },
  {
    icon: <Zap className="w-4 h-4" />,
    title: 'Generate Summary',
    description: 'Get a quick overview of the project'
  },
  {
    icon: <Sparkles className="w-4 h-4" />,
    title: 'Draft Milestone',
    description: 'Create new milestone suggestions'
  },
  {
    icon: <MessageSquare className="w-4 h-4" />,
    title: 'Explain Terms',
    description: 'Clarify complex contract language'
  }
];

export const MagnaAIModal: React.FC<MagnaAIModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>(defaultMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  if (!isOpen) return null;

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: getAIResponse(inputMessage),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickAction = (action: typeof quickActions[0]) => {
    const actionMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: `Please ${action.title.toLowerCase()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, actionMessage]);
    setIsTyping(true);

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `I'll help you ${action.title.toLowerCase()}. ${getAIResponse(action.title)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const getAIResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('analyze') || lowerInput.includes('contract')) {
      return 'I\'ve analyzed your contract. The key terms appear to be fair and balanced. However, I recommend reviewing the payment schedule and milestone deliverables. Would you like me to create a detailed analysis report?';
    }
    
    if (lowerInput.includes('summary') || lowerInput.includes('overview')) {
      return 'Here\'s a summary of your project: This is a milestone-based contract with a total value of $180,000. Currently, 1 out of 4 milestones is completed. The next milestone involves UI/UX design and is due in 5 days.';
    }
    
    if (lowerInput.includes('milestone') || lowerInput.includes('draft')) {
      return 'I can help you draft a new milestone. Based on the project scope, I suggest: "Backend API Development" with deliverables including REST API endpoints, database integration, and authentication system. Estimated timeline: 14 days. Value: $45,000.';
    }
    
    if (lowerInput.includes('explain') || lowerInput.includes('terms')) {
      return 'I\'d be happy to explain contract terms. The "milestone-based payment" means funds are released only when specific deliverables are completed and approved. This protects both parties and ensures project progress.';
    }
    
    return 'I understand you\'re asking about the contract. I can help you analyze terms, generate summaries, draft milestones, or explain complex language. What would you like to know?';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-[#111] to-[#0a0a0a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E70008] to-[#ff1f29] flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Magna AI Assistant</h2>
              <p className="text-sm text-gray-400">Your intelligent contract companion</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="p-6 border-b border-white/10">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action)}
                className="p-3 rounded-xl bg-[#0a0a0a] border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all text-left group"
              >
                <div className="text-[#E70008] mb-2 group-hover:scale-110 transition-transform">
                  {action.icon}
                </div>
                <h4 className="text-white font-medium text-sm mb-1">{action.title}</h4>
                <p className="text-gray-400 text-xs">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-[#E70008] text-white rounded-br-lg'
                      : 'bg-[#0a0a0a] border border-white/10 text-gray-300 rounded-bl-lg'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1 px-1">{message.timestamp}</p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl rounded-bl-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[#E70008]" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-white/10">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Magna AI anything about your contract..."
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-[#E70008]/50 focus:ring-1 focus:ring-[#E70008]/50"
                rows={2}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="px-4 py-3 rounded-xl bg-[#E70008] hover:bg-[#ff1f29] disabled:bg-gray-600 disabled:cursor-not-allowed text-white transition-colors flex items-center gap-2"
            >
              <Send size={16} />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};