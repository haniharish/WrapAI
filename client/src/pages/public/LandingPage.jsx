import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PosterButton } from '../../components/ui/PosterButton.jsx';
import { GridSidebarLabel } from '../../components/ui/GridSidebarLabel.jsx';
import { TypographicListItem } from '../../components/ui/TypographicListItem.jsx';
import { GridCell } from '../../components/ui/GridCell.jsx';

export function LandingPage() {
  const [activeQuestion, setActiveQuestion] = useState('decisions');

  const demoAnswers = {
    decisions: {
      question: 'What decisions were made about the database?',
      answer: 'The team agreed to adopt MongoDB Atlas for native vector search and relational metadata storage, eliminating cross-database synchronization latency.',
      timestamp: '43:21',
      source: 'Q3 ARCHITECTURE SYNC'
    },
    deadline: {
      question: 'When was the deployment deadline discussed?',
      answer: 'Sarah Jenkins was assigned to complete the BullMQ worker retry configuration by Friday, September 4th, with integration tests included in the PR.',
      timestamp: '09:41',
      source: 'SPRINT PLANNING #14'
    },
    actionItems: {
      question: 'What are the main engineering action items?',
      answer: 'Two primary action items: 1) Configure BullMQ exponential backoff queues (Owner: Sarah, Sept 4); 2) Benchmark RAG cosine thresholds >0.72 (Owner: Alexandre, Sept 8).',
      timestamp: '11:21',
      source: 'SYSTEM REVIEW'
    }
  };

  return (
    <div className="space-y-0">
      {/* 1. HERO SECTION (Min 85vh, 12-Column Modernist Grid) */}
      <section className="min-h-[85vh] border-b border-[#C7C7C7] flex flex-col justify-between py-12 sm:py-16">
        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* Columns 1-3: Manifesto Sidebar */}
            <div className="col-span-12 lg:col-span-3 space-y-4 border-b lg:border-b-0 lg:border-r border-[#C7C7C7] pb-6 lg:pb-0 lg:pr-8">
              <div className="w-4 h-4 bg-[#141414]" />
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#7A7A7A] block">
                  MANIFESTO
                </span>
                <p className="text-xs font-mono text-[#444343] uppercase leading-relaxed">
                  REALITY-FIRST INTELLIGENCE ARCHITECTURE. FROM UNSTRUCTURED NOISE TO DETERMINISTIC CLARITY.
                </p>
              </div>
            </div>

            {/* Columns 4-12: Massive Headline & Internal Split Layout */}
            <div className="col-span-12 lg:col-span-9 space-y-10 sm:space-y-14">
              <h1 className="text-poster-hero text-[#141414]">
                TURN <br />
                CONTENT <br />
                INTO <br />
                <span className="text-[#1351AA]">CLARITY.</span>
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end pt-4 border-t border-[#C7C7C7]">
                <div className="md:col-span-7">
                  <p className="text-base sm:text-lg text-[#444343] leading-relaxed max-w-[460px]">
                    Transform meetings, lectures, interviews and conversations into searchable intelligence, timestamped transcripts, structured decisions, and verifiable reports.
                  </p>
                </div>
                <div className="md:col-span-5 flex flex-col sm:flex-row md:flex-col lg:flex-row gap-3 md:justify-end">
                  <Link to="/register" className="w-full sm:w-auto">
                    <PosterButton variant="primary" size="lg" className="w-full">
                      START EXPLORING
                    </PosterButton>
                  </Link>
                  <a href="#system" className="w-full sm:w-auto">
                    <PosterButton variant="secondary" size="lg" className="w-full">
                      VIEW SYSTEM
                    </PosterButton>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SYSTEM / FEATURES SECTION */}
      <section id="system" className="py-20 sm:py-28 border-b border-[#C7C7C7]">
        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-12 gap-8">
            <GridSidebarLabel label="SYSTEM" index="01">
              <p className="text-xs font-mono text-[#7A7A7A] uppercase leading-relaxed">
                CORE CAPABILITIES MATRIX
              </p>
            </GridSidebarLabel>

            <div className="col-span-12 lg:col-span-9 space-y-12">
              <h2 className="text-poster-section text-[#141414]">
                UPLOAD. <br />
                UNDERSTAND. <br />
                <span className="text-[#1351AA]">SEARCH.</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GridCell
                  index="01"
                  title="TRANSCRIBE"
                  description="Convert spoken multi-modal audio and video streams into word-level timestamped transcripts with acoustic speech-to-text models."
                />
                <GridCell
                  index="02"
                  title="SPEAKERS"
                  description="Cluster turns and identify unique participant voices with acoustic diarization and percentage speaking shares."
                />
                <GridCell
                  index="03"
                  title="INTELLIGENCE"
                  description="Extract executive summaries, topics, key points, deterministic decisions, and action items with assignees."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS (STRICT NUMBERED PROCESS) */}
      <section id="process" className="py-20 sm:py-28 border-b border-[#C7C7C7]">
        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-12 gap-8">
            <GridSidebarLabel label="PROCESS" index="02">
              <p className="text-xs font-mono text-[#7A7A7A] uppercase leading-relaxed">
                FIVE STAGES TO CLARITY
              </p>
            </GridSidebarLabel>

            <div className="col-span-12 lg:col-span-9 space-y-1">
              {[
                { index: '01', title: 'UPLOAD', desc: 'Ingest audio, video, text files, or remote links into asynchronous processing queues.' },
                { index: '02', title: 'TRANSCRIBE', desc: 'Faster-Whisper extracts word-level timestamps, normalizing audio to 16kHz mono WAV.' },
                { index: '03', title: 'UNDERSTAND', desc: 'Pyannote diarizes speakers and LLMs extract deterministic summaries, decisions, and action items.' },
                { index: '04', title: 'SEARCH', desc: 'Embeddings are indexed into MongoDB Atlas vector search for cross-workspace semantic retrieval.' },
                { index: '05', title: 'GENERATE', desc: 'Compile professional PDF, DOCX, Markdown, or TXT reports with cryptographically secure sharing.' }
              ].map((item) => (
                <TypographicListItem
                  key={item.index}
                  index={item.index}
                  title={item.title}
                  description={item.desc}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. WHY DIFFERENT (TYPOGRAPHIC COMPARISON LIST) */}
      <section className="py-20 sm:py-28 border-b border-[#C7C7C7]">
        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-12 gap-8">
            <GridSidebarLabel label="WHY DIFFERENT" index="03">
              <p className="text-xs font-mono text-[#7A7A7A] uppercase leading-relaxed">
                DETERMINISTIC PRECISION OVER SAAS NOISE
              </p>
            </GridSidebarLabel>

            <div className="col-span-12 lg:col-span-9 space-y-1">
              {[
                { index: '01', title: 'NOT JUST TRANSCRIPTION', desc: 'Transcripts are aligned with speaker turns, searchable indexes, and semantic vectors.' },
                { index: '02', title: 'NOT JUST SUMMARIZATION', desc: 'Structured registries isolate owners, deadlines, formal decisions, and key quotations.' },
                { index: '03', title: 'SEARCHABLE INTELLIGENCE', desc: 'Vector similarity search spans all user workspaces with precision timestamp jump links.' },
                { index: '04', title: 'SOURCE-GROUNDED ANSWERS', desc: 'RAG chat quotes the exact speaker and playback moment to eliminate hallucinations.' },
                { index: '05', title: 'PROFESSIONAL REPORTS', desc: 'Multi-format PDF, DOCX, Markdown exports with clean typography and public sharing.' }
              ].map((item) => (
                <TypographicListItem
                  key={item.index}
                  index={item.index}
                  title={item.title}
                  description={item.desc}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. CONTENT TYPES */}
      <section className="py-20 sm:py-28 border-b border-[#C7C7C7]">
        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-12 gap-8">
            <GridSidebarLabel label="CONTENT TYPES" index="04">
              <p className="text-xs font-mono text-[#7A7A7A] uppercase leading-relaxed">
                SUPPORTED INPUT STREAMS
              </p>
            </GridSidebarLabel>

            <div className="col-span-12 lg:col-span-9 space-y-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { type: 'AUDIO', ext: 'MP3, WAV, M4A, AAC' },
                  { type: 'VIDEO', ext: 'MP4, MOV, MKV, WEBM' },
                  { type: 'TEXT', ext: 'TXT, MD, RAW INPUT' },
                  { type: 'DOCUMENTS', ext: 'PDF, DOCX, TRANSCRIPTS' },
                  { type: 'URL', ext: 'YOUTUBE, REMOTE MEDIA' }
                ].map((c) => (
                  <div key={c.type} className="border border-[#C7C7C7] p-5 bg-white/50 space-y-2">
                    <h4 className="font-bold text-sm uppercase tracking-wider text-[#141414]">{c.type}</h4>
                    <p className="font-mono text-[10px] text-[#7A7A7A]">{c.ext}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. AI INTELLIGENCE */}
      <section id="intelligence" className="py-20 sm:py-28 border-b border-[#C7C7C7]">
        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-12 gap-8">
            <GridSidebarLabel label="INTELLIGENCE" index="05">
              <p className="text-xs font-mono text-[#7A7A7A] uppercase leading-relaxed">
                STRUCTURED SCHEMAS
              </p>
            </GridSidebarLabel>

            <div className="col-span-12 lg:col-span-9">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: 'SUMMARY', desc: 'Executive overview, key context, and discussion outcomes.' },
                  { title: 'TOPICS', desc: 'Thematic breakdown with relevance scores and timestamps.' },
                  { title: 'DECISIONS', desc: 'Explicitly ratified consensus points and rationale.' },
                  { title: 'ACTION ITEMS', desc: 'Tasks assigned with owners, status, and deadlines.' },
                  { title: 'HIGHLIGHTS', desc: 'Critical quotes, notable statements, and key milestones.' },
                  { title: 'QUESTIONS', desc: 'Open inquiries, unanswered topics, and follow-ups.' }
                ].map((item, idx) => (
                  <GridCell
                    key={item.title}
                    index={`0${idx + 1}`}
                    title={item.title}
                    description={item.desc}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. RAG / ASK YOUR CONTENT */}
      <section id="rag" className="py-20 sm:py-28 border-b border-[#C7C7C7]">
        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-12 gap-8">
            <GridSidebarLabel label="RAG / SEARCH" index="06">
              <p className="text-xs font-mono text-[#7A7A7A] uppercase leading-relaxed">
                GROUNDED CONVERSATIONAL AI
              </p>
            </GridSidebarLabel>

            <div className="col-span-12 lg:col-span-9 space-y-10">
              <h2 className="text-poster-section text-[#141414]">
                ASK <br />
                YOUR <br />
                <span className="text-[#1351AA]">CONTENT.</span>
              </h2>

              <p className="text-sm sm:text-base text-[#444343] max-w-2xl leading-relaxed">
                Ask questions about your content and receive grounded answers with exact source references, speaker tags, and timestamp offsets.
              </p>

              {/* Technical Vertical Message Simulator */}
              <div className="border border-[#C7C7C7] bg-white/70 p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap gap-3 pb-4 border-b border-[#C7C7C7]">
                  {['decisions', 'deadline', 'actionItems'].map((key) => (
                    <button
                      key={key}
                      onClick={() => setActiveQuestion(key)}
                      className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border cursor-pointer transition-colors duration-300 ${
                        activeQuestion === key
                          ? 'bg-[#141414] text-[#E3E2DE] border-[#141414]'
                          : 'bg-transparent text-[#141414] border-[#C7C7C7] hover:border-[#1351AA]'
                      }`}
                    >
                      {key.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="space-y-6">
                  {/* USER MESSAGE */}
                  <div className="border-l-2 border-[#141414] pl-4 py-1 space-y-1">
                    <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#7A7A7A] block">
                      USER
                    </span>
                    <p className="text-base font-bold text-[#141414]">
                      "{demoAnswers[activeQuestion].question}"
                    </p>
                  </div>

                  {/* WRAPAI MESSAGE */}
                  <div className="border-l-2 border-[#1351AA] pl-4 py-1 space-y-2">
                    <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#1351AA] block">
                      WRAPAI
                    </span>
                    <p className="text-sm text-[#444343] leading-relaxed">
                      "{demoAnswers[activeQuestion].answer}"
                    </p>
                    <div className="pt-2">
                      <span className="inline-flex items-center space-x-2 border border-[#1351AA] bg-[#1351AA]/10 text-[#1351AA] px-3 py-1 text-xs font-mono font-bold">
                        <span>SOURCE {demoAnswers[activeQuestion].timestamp}</span>
                        <span>•</span>
                        <span>{demoAnswers[activeQuestion].source}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. REPORTS SECTION */}
      <section id="reports" className="py-20 sm:py-28 border-b border-[#C7C7C7]">
        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-12 gap-8">
            <GridSidebarLabel label="REPORTS" index="07">
              <p className="text-xs font-mono text-[#7A7A7A] uppercase leading-relaxed">
                DOCUMENT EXPORT ENGINE
              </p>
            </GridSidebarLabel>

            <div className="col-span-12 lg:col-span-9 space-y-10">
              <h2 className="text-poster-section text-[#141414]">
                TURN <br />
                INTELLIGENCE <br />
                INTO <br />
                <span className="text-[#1351AA]">DOCUMENTS.</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="border border-[#C7C7C7] p-6 bg-white/50 space-y-2">
                  <span className="font-mono text-xs font-bold text-[#1351AA]">01</span>
                  <h4 className="font-bold text-lg uppercase text-[#141414]">PDF REPORT</h4>
                  <p className="text-xs text-[#444343]">Multi-page formal documentation with executive summaries.</p>
                </div>
                <div className="border border-[#C7C7C7] p-6 bg-white/50 space-y-2">
                  <span className="font-mono text-xs font-bold text-[#1351AA]">02</span>
                  <h4 className="font-bold text-lg uppercase text-[#141414]">DOCX FILE</h4>
                  <p className="text-xs text-[#444343]">Editable Word document with structured tables and checklists.</p>
                </div>
                <div className="border border-[#C7C7C7] p-6 bg-white/50 space-y-2">
                  <span className="font-mono text-xs font-bold text-[#1351AA]">03</span>
                  <h4 className="font-bold text-lg uppercase text-[#141414]">MARKDOWN</h4>
                  <p className="text-xs text-[#444343]">Clean plain-text formatting for GitHub, Notion, and Obsidian.</p>
                </div>
                <div className="border border-[#C7C7C7] p-6 bg-white/50 space-y-2">
                  <span className="font-mono text-xs font-bold text-[#1351AA]">04</span>
                  <h4 className="font-bold text-lg uppercase text-[#141414]">PUBLIC LINK</h4>
                  <p className="text-xs text-[#444343]">Cryptographic SHA-256 hashed share links with revocation.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. ACCESS / PRICING SECTION */}
      <section className="py-24 sm:py-32">
        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-12 gap-8 items-end">
            <GridSidebarLabel label="ACCESS" index="08" />

            <div className="col-span-12 lg:col-span-9 space-y-8">
              <h2 className="text-poster-hero text-[#141414]">
                START <br />
                <span className="text-[#1351AA]">EXPLORING.</span>
              </h2>

              <p className="text-base sm:text-xl text-[#444343] max-w-xl leading-relaxed">
                Upload a meeting. Get a searchable transcript, structured insights, answers, and a professional report.
              </p>

              <div className="pt-4">
                <Link to="/register">
                  <PosterButton variant="secondary" size="xl">
                    GET STARTED WITH WRAPAI
                  </PosterButton>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
