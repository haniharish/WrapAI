import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { AmbientBackground } from '../../components/common/AmbientBackground.jsx';
import {
  Mic,
  Video,
  FileText,
  Link2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  Clock,
  CheckSquare,
  MessageSquare,
  HelpCircle,
  Download,
  ShieldCheck,
  Zap
} from 'lucide-react';

export function LandingPage() {
  const [activeDemoQuestion, setActiveDemoQuestion] = useState('decisions');

  const demoAnswers = {
    decisions: {
      question: 'What decisions were made about the database?',
      answer: 'The team agreed to adopt MongoDB Atlas for native 1536-dimensional vector search and relational metadata storage, eliminating cross-database synchronization latency.',
      timestamp: '43:21',
      speaker: 'Speaker 2 (Sarah Jenkins)'
    },
    deadline: {
      question: 'When was the deployment deadline discussed?',
      answer: 'Sarah Jenkins was assigned to complete the BullMQ worker retry configuration by Friday, September 4th, with integration tests included in the PR.',
      timestamp: '09:41',
      speaker: 'Speaker 1 (Rahul Sharma)'
    },
    actionItems: {
      question: 'What are the main engineering action items?',
      answer: 'Two primary action items: 1) Configure BullMQ exponential backoff queues (Owner: Sarah, Sept 4); 2) Benchmark RAG cosine thresholds >0.72 (Owner: Alexandre, Sept 8).',
      timestamp: '11:21',
      speaker: 'Speaker 3 (Alexandre Dubois)'
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* 1. Hero Section */}
      <section className="relative pt-24 pb-28 px-6 border-b border-brand-charcoal/15">
        <AmbientBackground />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-brand-sage/30 border border-brand-sage text-brand-navy text-xs font-bold uppercase tracking-widest mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Content & Meeting Intelligence Platform</span>
          </div>

          <h1 className="font-display text-6xl sm:text-8xl md:text-9xl uppercase tracking-tighter text-brand-navy leading-none mb-6">
            Turn Content <br /> Into Clarity.
          </h1>

          <p className="text-lg sm:text-xl text-brand-charcoal/80 max-w-2xl mx-auto mb-10 font-normal leading-relaxed">
            Upload audio, video, text or links. WrapAI transforms long-form content into timestamped transcripts, speaker insights, executive summaries, and actionable information.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/dashboard">
              <Button variant="primary" size="lg" icon={ArrowRight} iconPosition="right">
                Start Wrapping
              </Button>
            </Link>
            <Link to="/content/cnt_01">
              <Button variant="outline" size="lg">
                Explore Interactive Demo
              </Button>
            </Link>
          </div>

          {/* Supported Types Pill Bar */}
          <div className="mt-16 pt-10 border-t border-brand-charcoal/10 flex flex-wrap justify-center items-center gap-8 text-xs font-bold uppercase tracking-widest text-brand-taupe">
            <span className="flex items-center"><Mic className="w-4 h-4 mr-2 text-brand-navy" /> Audio Files</span>
            <span className="flex items-center"><Video className="w-4 h-4 mr-2 text-brand-navy" /> Video Files</span>
            <span className="flex items-center"><FileText className="w-4 h-4 mr-2 text-brand-navy" /> Documents & TXT</span>
            <span className="flex items-center"><Link2 className="w-4 h-4 mr-2 text-brand-navy" /> Media URLs</span>
          </div>
        </div>
      </section>

      {/* 2. Process Architecture: Input -> Understand -> Extract -> Wrap */}
      <section id="pipeline" className="py-24 px-6 bg-brand-white border-b border-brand-charcoal/15">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-taupe mb-2">The Intelligence Pipeline</p>
            <h2 className="font-display text-4xl sm:text-6xl uppercase tracking-tight text-brand-navy">
              Four Stages to Pure Clarity.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                num: '01',
                step: 'INPUT',
                desc: 'Ingest multi-modal content via drag-and-drop or URLs. Audio is stripped to 16kHz mono WAV streams asynchronously.'
              },
              {
                num: '02',
                step: 'UNDERSTAND',
                desc: 'Whisper generates word-level timestamps while pyannote performs acoustic speaker diarization.'
              },
              {
                num: '03',
                step: 'EXTRACT',
                desc: 'Structured LLMs extract summaries, topics, decisions, action items, and assignees with strict schema validation.'
              },
              {
                num: '04',
                step: 'WRAP',
                desc: 'Interact with your content via grounded RAG chat, customized speaker tags, and exportable PDF/DOCX reports.'
              }
            ].map((st) => (
              <Card key={st.num} hover className="border-fine">
                <p className="font-display text-4xl text-brand-sage mb-4">{st.num}</p>
                <h3 className="font-display text-2xl uppercase tracking-wide text-brand-navy mb-2">{st.step}</h3>
                <p className="text-xs text-brand-charcoal leading-relaxed">{st.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Meeting Intelligence Showcase (Asymmetric Layout) */}
      <section id="meeting-intel" className="py-24 px-6 bg-brand-light border-b border-brand-charcoal/15">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <Badge variant="cyan" className="mb-4">Meeting Intelligence</Badge>
              <h2 className="font-display text-5xl sm:text-6xl uppercase tracking-tight text-brand-navy mb-6">
                Never Miss a Decision or Deadline Again.
              </h2>
              <p className="text-sm text-brand-charcoal leading-relaxed mb-6">
                WrapAI listens across multi-speaker conversations, isolates who said what, and extracts deterministic decision registries with owners and deadlines.
              </p>
              <ul className="space-y-3 text-xs font-bold uppercase tracking-wider text-brand-navy mb-8">
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2.5 text-brand-navy" /> Speaker-Diarized Aligned Transcripts</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2.5 text-brand-navy" /> Automatic Decision & Action Item Extraction</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2.5 text-brand-navy" /> Responsible Person & Deadline Detection</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2.5 text-brand-navy" /> Interactive Timestamp Jump Links</li>
              </ul>
              <Link to="/content/cnt_01">
                <Button variant="primary" size="md">View Live Meeting Workspace</Button>
              </Link>
            </div>

            {/* Asymmetric Meeting Card Display */}
            <div className="lg:col-span-7">
              <Card className="bg-brand-navy text-brand-white border border-brand-charcoal shadow-2xl p-8">
                <div className="flex items-center justify-between border-b border-brand-charcoal pb-4 mb-6">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-brand-cyan tracking-widest">PROCESSED REPORT</span>
                    <h3 className="font-display text-2xl uppercase tracking-wide text-brand-white">Q3 Engineering Architecture Sync</h3>
                  </div>
                  <span className="text-xs font-mono text-brand-sage">52 MINS</span>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-[11px] font-mono text-brand-sage uppercase tracking-wider mb-2">PARTICIPANTS DETECTED</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="default" className="bg-brand-charcoal text-white">Rahul Sharma (Lead)</Badge>
                      <Badge variant="default" className="bg-brand-charcoal text-white">Sarah Jenkins (Backend)</Badge>
                      <Badge variant="default" className="bg-brand-charcoal text-white">Alexandre Dubois (AI)</Badge>
                    </div>
                  </div>

                  <div className="bg-brand-charcoal/70 p-4 border border-brand-charcoal">
                    <p className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider mb-1 flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> KEY DECISION (43:21)
                    </p>
                    <p className="text-xs text-brand-light">
                      Adopt MongoDB Atlas Vector Search natively to eliminate cross-database synchronization latency.
                    </p>
                  </div>

                  <div className="bg-brand-charcoal/70 p-4 border border-brand-charcoal">
                    <p className="text-[11px] font-mono text-brand-cyan uppercase tracking-wider mb-1 flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1.5" /> ACTION ITEM (09:41)
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span>Configure BullMQ worker exponential backoff</span>
                      <span className="font-mono text-brand-beige">OWNER: Sarah | DUE: Sept 4</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Interactive "Ask Your Content" (RAG Visualizer) */}
      <section id="ask-ai" className="py-24 px-6 bg-brand-white border-b border-brand-charcoal/15">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="navy" className="mb-3">Ask Your Content</Badge>
            <h2 className="font-display text-5xl sm:text-6xl uppercase tracking-tight text-brand-navy mb-4">
              Grounded Conversational Intelligence.
            </h2>
            <p className="text-sm text-brand-taupe">
              No generic hallucinations. Every AI response cites the exact timestamp and identified speaker from your source material.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-brand-light border border-brand-charcoal/20 shadow-xl p-6 sm:p-8">
            <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-brand-charcoal/10">
              <button
                onClick={() => setActiveDemoQuestion('decisions')}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors ${
                  activeDemoQuestion === 'decisions'
                    ? 'bg-brand-navy text-brand-white border-brand-navy'
                    : 'bg-brand-white text-brand-charcoal border-brand-charcoal/20 hover:bg-brand-sage/20'
                }`}
              >
                Database Decisions
              </button>
              <button
                onClick={() => setActiveDemoQuestion('deadline')}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors ${
                  activeDemoQuestion === 'deadline'
                    ? 'bg-brand-navy text-brand-white border-brand-navy'
                    : 'bg-brand-white text-brand-charcoal border-brand-charcoal/20 hover:bg-brand-sage/20'
                }`}
              >
                Deployment Deadline
              </button>
              <button
                onClick={() => setActiveDemoQuestion('actionItems')}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors ${
                  activeDemoQuestion === 'actionItems'
                    ? 'bg-brand-navy text-brand-white border-brand-navy'
                    : 'bg-brand-white text-brand-charcoal border-brand-charcoal/20 hover:bg-brand-sage/20'
                }`}
              >
                Action Items
              </button>
            </div>

            {/* Chat Interaction Simulation */}
            <div className="space-y-6">
              {/* User Prompt */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-brand-navy text-brand-white flex items-center justify-center font-bold text-xs">
                  YOU
                </div>
                <div className="bg-brand-white border border-brand-charcoal/15 p-4 flex-1">
                  <p className="text-sm font-semibold text-brand-navy">
                    "{demoAnswers[activeDemoQuestion].question}"
                  </p>
                </div>
              </div>

              {/* AI Grounded Response */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-brand-sage text-brand-navy flex items-center justify-center font-bold text-xs">
                  AI
                </div>
                <div className="bg-brand-white border border-brand-charcoal/20 p-5 flex-1 shadow-sm">
                  <p className="text-sm text-brand-navy leading-relaxed mb-4">
                    {demoAnswers[activeDemoQuestion].answer}
                  </p>
                  <div className="inline-flex items-center space-x-2 bg-brand-navy text-brand-white px-3 py-1 text-xs font-mono">
                    <span className="text-brand-cyan font-bold">{demoAnswers[activeDemoQuestion].timestamp}</span>
                    <span className="text-brand-taupe">|</span>
                    <span className="text-brand-sage">{demoAnswers[activeDemoQuestion].speaker}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA Section */}
      <section className="py-24 px-6 bg-brand-navy text-brand-white text-center relative">
        <AmbientBackground />
        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="font-display text-5xl sm:text-7xl uppercase tracking-tight mb-6">
            From Content To Clarity Today.
          </h2>
          <p className="text-base text-brand-sage max-w-xl mx-auto mb-8">
            Experience the next generation of multi-modal transcription, speaker intelligence, and grounded contextual analysis.
          </p>
          <Link to="/dashboard">
            <Button variant="luxury" size="lg" className="bg-brand-white text-brand-navy hover:bg-brand-sage border-none">
              Get Started with WrapAI
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
