import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { seekPlayback } from '../../../../store/slices/workspaceSlice.js';
import { chatService } from '../../../../services/chatService.js';
import { Card } from '../../../../components/ui/Card.jsx';
import { Input } from '../../../../components/ui/Input.jsx';
import { Button } from '../../../../components/ui/Button.jsx';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { MessageSquare, Send, Play, Sparkles, User } from 'lucide-react';
import { formatTimecode } from '../../../../utils/formatters.js';

export function AskAITab() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await chatService.getChatHistory(id);
        setMessages(res.data);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputVal.trim() || isSending) return;
    const text = inputVal;
    setInputVal('');
    setIsSending(true);

    try {
      const res = await chatService.askQuestion(id, text);
      const history = await chatService.getChatHistory(id);
      setMessages(history.data);
    } finally {
      setIsSending(false);
    }
  };

  const handlePromptClick = (question) => {
    setInputVal(question);
  };

  if (isLoading) return <LoadingState message="Initializing RAG chat interface..." />;

  return (
    <div className="space-y-6 max-w-4xl">
      <Card className="p-6 sm:p-8">
        <div className="flex items-center space-x-2 pb-4 border-b border-brand-charcoal/10 mb-6">
          <MessageSquare className="w-5 h-5 text-brand-navy" />
          <h2 className="font-display text-2xl uppercase tracking-wide text-brand-navy">Ask Your Content</h2>
        </div>

        {/* Example prompts */}
        <div className="mb-6 flex flex-wrap gap-2">
          <span className="text-xs font-mono font-bold text-brand-taupe uppercase py-1">SUGGESTIONS:</span>
          {[
            'What decisions were made?',
            'What did Rahul say about the database?',
            'When was the deployment deadline discussed?',
            'Summarize all engineering action items'
          ].map((q, idx) => (
            <button
              key={idx}
              onClick={() => handlePromptClick(q)}
              className="text-xs bg-brand-light hover:bg-brand-sage/20 border border-brand-charcoal/20 px-3 py-1 text-brand-charcoal transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Message Stream */}
        <div className="space-y-6 min-h-[300px] mb-6">
          {messages.map((m) => (
            <div key={m.id} className="flex items-start space-x-3">
              <div
                className={`w-8 h-8 flex items-center justify-center font-bold text-xs ${
                  m.sender === 'USER' ? 'bg-brand-navy text-brand-white' : 'bg-brand-sage text-brand-navy'
                }`}
              >
                {m.sender === 'USER' ? 'YOU' : 'AI'}
              </div>

              <div className="bg-brand-light border border-brand-charcoal/15 p-4 flex-1">
                <p className="text-sm text-brand-navy leading-relaxed">{m.message}</p>

                {/* Grounded Citation Badges */}
                {m.citations?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-brand-charcoal/10 space-y-2">
                    <p className="text-[10px] font-mono uppercase text-brand-taupe font-bold">VERIFIED SOURCES:</p>
                    {m.citations.map((cit, cIdx) => (
                      <div
                        key={cIdx}
                        className="bg-brand-white border border-brand-charcoal/15 p-2 text-xs flex items-center justify-between"
                      >
                        <div className="truncate mr-3">
                          <span className="font-bold text-brand-navy mr-2">{cit.speaker}:</span>
                          <span className="text-brand-charcoal italic truncate">"{cit.excerpt}"</span>
                        </div>
                        <button
                          onClick={() => dispatch(seekPlayback(cit.timestamp))}
                          className="inline-flex items-center text-xs font-mono font-bold text-brand-navy hover:text-brand-charcoal bg-brand-sage/40 hover:bg-brand-sage px-2 py-0.5 flex-shrink-0"
                        >
                          <Play className="w-2.5 h-2.5 mr-1" />
                          {cit.timecode || formatTimecode(cit.timestamp)}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex items-center space-x-3 p-4 bg-brand-sage/15 border border-brand-sage text-xs font-mono text-brand-charcoal">
              <div className="w-4 h-4 border-2 border-brand-navy border-t-transparent rounded-full animate-spin" />
              <span>Searching Atlas Vector Store & formulating grounded response...</span>
            </div>
          )}
        </div>

        {/* Input bar */}
        <form onSubmit={handleSend} className="flex gap-2 pt-4 border-t border-brand-charcoal/15">
          <Input
            placeholder="Ask anything about this uploaded content..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
          />
          <Button type="submit" variant="primary" size="md" icon={Send} disabled={isSending || !inputVal.trim()}>
            Send
          </Button>
        </form>
      </Card>
    </div>
  );
}
