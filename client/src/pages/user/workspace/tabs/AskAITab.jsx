import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { seekPlayback } from '../../../../store/slices/workspaceSlice.js';
import { chatService } from '../../../../services/chatService.js';
import { Input } from '../../../../components/ui/Input.jsx';
import { PosterButton } from '../../../../components/ui/PosterButton.jsx';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { GridSidebarLabel } from '../../../../components/ui/GridSidebarLabel.jsx';
import { Send, Play } from 'lucide-react';
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
        setMessages(res.data || []);
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
      await chatService.askQuestion(id, text);
      const history = await chatService.getChatHistory(id);
      setMessages(history.data || []);
    } finally {
      setIsSending(false);
    }
  };

  const handlePromptClick = (question) => {
    setInputVal(question);
  };

  if (isLoading) return <LoadingState message="INITIALIZING RAG VECTOR CHAT..." />;

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-12 gap-8">
        <GridSidebarLabel label="RAG INTELLIGENCE" index="01">
          <p className="text-xs font-mono text-[#7A7A7A] uppercase leading-relaxed">
            ATLAS VECTOR SEARCH
          </p>
        </GridSidebarLabel>

        <div className="col-span-12 lg:col-span-9 bg-white/70 border border-[#C7C7C7] p-6 sm:p-10 space-y-8">
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-[#141414]">
              ASK YOUR CONTENT
            </h3>
            <p className="text-xs font-mono text-[#7A7A7A] uppercase">
              SEMANTICALLY GROUNDED CITATIONS LINKED TO EXACT TIMECODES
            </p>
          </div>

          {/* Example prompt pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="text-xs font-mono font-bold text-[#7A7A7A] uppercase py-1">PROMPTS:</span>
            {[
              'WHAT DECISIONS WERE MADE?',
              'WHAT DID THE SPEAKERS CONCLUDE ABOUT THE TIMELINE?',
              'SUMMARIZE ALL ASSIGNED ACTION ITEMS',
              'WHEN WAS BUDGET DISCUSSED?'
            ].map((q, idx) => (
              <button
                key={idx}
                onClick={() => handlePromptClick(q)}
                className="text-xs font-mono uppercase bg-[#E3E2DE] hover:bg-white border border-[#C7C7C7] px-3 py-1 text-[#141414] transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Message Stream */}
          <div className="space-y-6 min-h-[300px] border-y border-[#C7C7C7] py-6">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-[#7A7A7A] font-mono text-xs uppercase">
                ASK ANY QUESTION TO RETRIEVE EVIDENCE-BACKED EXCERPTS.
              </div>
            ) : (
              messages.map((m, mIdx) => (
                <div key={m.id || mIdx} className="flex items-start space-x-4">
                  <div
                    className={`w-9 h-9 flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                      m.sender === 'USER' ? 'bg-[#141414] text-[#E3E2DE]' : 'bg-[#1351AA] text-[#E3E2DE]'
                    }`}
                  >
                    {m.sender === 'USER' ? 'YOU' : 'AI'}
                  </div>

                  <div className="bg-[#E3E2DE]/40 border border-[#C7C7C7] p-5 flex-1 space-y-3">
                    <p className="text-sm font-sans text-[#141414] leading-relaxed whitespace-pre-line">
                      {m.message}
                    </p>

                    {/* Grounded Citation Badges */}
                    {m.citations?.length > 0 && (
                      <div className="pt-3 border-t border-[#C7C7C7] space-y-2">
                        <span className="text-[10px] font-mono uppercase text-[#7A7A7A] font-bold block">
                          VERIFIED CITATIONS ({m.citations.length}):
                        </span>
                        <div className="space-y-2">
                          {m.citations.map((cit, cIdx) => (
                            <div
                              key={cIdx}
                              className="bg-white border border-[#C7C7C7] p-3 text-xs flex items-center justify-between gap-3"
                            >
                              <div className="truncate font-mono">
                                <span className="font-bold text-[#141414] uppercase mr-2">{cit.speaker}:</span>
                                <span className="text-[#444343] italic">"{cit.excerpt}"</span>
                              </div>
                              <button
                                onClick={() => dispatch(seekPlayback(cit.timestamp))}
                                className="inline-flex items-center text-xs font-mono font-bold text-[#141414] hover:text-[#1351AA] bg-[#E3E2DE] hover:bg-white border border-[#C7C7C7] px-2 py-0.5 shrink-0 transition-colors cursor-pointer"
                              >
                                <Play className="w-2.5 h-2.5 mr-1 text-[#1351AA]" />
                                {cit.timecode || formatTimecode(cit.timestamp)}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {isSending && (
              <div className="flex items-center space-x-3 p-4 bg-[#1351AA]/10 border border-[#1351AA] text-xs font-mono text-[#141414]">
                <div className="w-2 h-2 bg-[#1351AA] animate-ping shrink-0" />
                <span>SEARCHING ATLAS VECTOR INDEX & FORMULATING GROUNDED RESPONSE...</span>
              </div>
            )}
          </div>

          {/* Input bar */}
          <form onSubmit={handleSend} className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="ASK ANYTHING ABOUT THIS RECORDING..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
              />
            </div>
            <PosterButton
              type="submit"
              variant="primary"
              size="md"
              icon={Send}
              disabled={isSending || !inputVal.trim()}
            >
              SEND
            </PosterButton>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AskAITab;
