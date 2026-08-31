import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card.jsx';
import { ProgressBar } from '../../components/ui/ProgressBar.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { AmbientBackground } from '../../components/common/AmbientBackground.jsx';
import { CheckCircle2, Clock, Cpu, ArrowRight } from 'lucide-react';

export function ProcessingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(15);
  const [stageIndex, setStageIndex] = useState(1);

  const stages = [
    { label: 'Upload & Verification', status: 'COMPLETED' },
    { label: 'FFmpeg Audio Normalization (16kHz WAV)', status: stageIndex > 0 ? 'COMPLETED' : 'RUNNING' },
    { label: 'Whisper Speech-to-Text Transcription', status: stageIndex > 1 ? 'COMPLETED' : stageIndex === 1 ? 'RUNNING' : 'PENDING' },
    { label: 'pyannote Speaker Diarization', status: stageIndex > 2 ? 'COMPLETED' : stageIndex === 2 ? 'RUNNING' : 'PENDING' },
    { label: 'Structured LLM Intelligence Extraction', status: stageIndex > 3 ? 'COMPLETED' : stageIndex === 3 ? 'RUNNING' : 'PENDING' },
    { label: 'Atlas Vector Embeddings & Indexing', status: stageIndex > 4 ? 'COMPLETED' : stageIndex === 4 ? 'RUNNING' : 'PENDING' }
  ];

  // Simulate progress across stages
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        const next = prev + 12;
        if (next >= 30 && stageIndex < 2) setStageIndex(2);
        if (next >= 55 && stageIndex < 3) setStageIndex(3);
        if (next >= 78 && stageIndex < 4) setStageIndex(4);
        if (next >= 95 && stageIndex < 5) setStageIndex(5);
        return next > 100 ? 100 : next;
      });
    }, 900);

    return () => clearInterval(timer);
  }, [stageIndex]);

  return (
    <div className="relative max-w-3xl mx-auto py-12">
      <AmbientBackground />
      <Card className="relative z-10 p-8 sm:p-12 border border-brand-navy shadow-2xl">
        <div className="text-center mb-8">
          <span className="inline-block p-3 bg-brand-sage/30 text-brand-navy border border-brand-sage mb-4">
            <Cpu className="w-8 h-8 animate-pulse" />
          </span>
          <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-tight text-brand-navy">
            Wrapping Your Content
          </h1>
          <p className="text-xs text-brand-taupe mt-1 font-mono">
            JOB ID: {id} | PIPELINE: AUDIO_STT_DIARIZATION_RAG
          </p>
        </div>

        <ProgressBar progress={progress} label="Overall Pipeline Progress" className="mb-8" />

        {/* Multi-stage state checklist */}
        <div className="space-y-3 bg-brand-light/80 border border-brand-charcoal/15 p-6 mb-8">
          {stages.map((st, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                {st.status === 'COMPLETED' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : st.status === 'RUNNING' ? (
                  <div className="w-4 h-4 border-2 border-brand-navy border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-brand-charcoal/30" />
                )}
                <span className={st.status === 'RUNNING' ? 'font-bold text-brand-navy' : 'text-brand-charcoal'}>
                  {st.label}
                </span>
              </div>
              <span className="font-mono text-[10px] uppercase text-brand-taupe font-bold">
                {st.status}
              </span>
            </div>
          ))}
        </div>

        {progress >= 100 && (
          <div className="text-center animate-in fade-in zoom-in-95 duration-300">
            <p className="text-sm font-bold text-emerald-800 mb-4">
              Intelligence Extraction & Diarization Complete!
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/content/cnt_01')}
              icon={ArrowRight}
              iconPosition="right"
            >
              Open Content Workspace
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
