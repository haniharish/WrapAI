import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { seekPlayback } from '../../../../store/slices/workspaceSlice.js';
import { transcriptService } from '../../../../services/transcriptService.js';
import { PosterButton } from '../../../../components/ui/PosterButton.jsx';
import { Input } from '../../../../components/ui/Input.jsx';
import { Select } from '../../../../components/ui/Select.jsx';
import { Modal } from '../../../../components/ui/Modal.jsx';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { Search, Edit2, Play, Copy, Check } from 'lucide-react';
import { formatTimecode, formatDuration } from '../../../../utils/formatters.js';

export function TranscriptTab() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const currentSeconds = useSelector((state) => state.workspace.currentPlaybackSeconds);

  const [data, setData] = useState({ transcript: null, speakers: [], segments: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [speakerFilter, setSpeakerFilter] = useState('ALL');
  const [renameSpeaker, setRenameSpeaker] = useState(null);
  const [newName, setNewName] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const loadTranscript = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await transcriptService.getTranscript(id);
      if (res && res.data) {
        setData({
          transcript: res.data.transcript || null,
          speakers: res.data.speakers || [],
          segments: res.data.segments || []
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load transcript');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTranscript();
  }, [id]);

  const handleSpeakerRename = async (e) => {
    e.preventDefault();
    if (!renameSpeaker || !newName.trim()) return;
    try {
      if (renameSpeaker.id || renameSpeaker._id) {
        await transcriptService.updateSpeakerById(
          renameSpeaker.id || renameSpeaker._id,
          newName.trim()
        );
      } else {
        await transcriptService.updateSpeakerName(
          id,
          renameSpeaker.speakerLabel,
          newName.trim()
        );
      }
      setRenameSpeaker(null);
      await loadTranscript();
    } catch (err) {
      alert(`Failed to rename speaker: ${err.message}`);
    }
  };

  const handleCopy = (segId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(segId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) return <LoadingState message="LOADING SPEECH-TO-TEXT TRANSCRIPT..." />;

  const { speakers, segments, transcript } = data;
  const totalSpeakingDuration = speakers.reduce((acc, s) => acc + (s.totalSpeakingTimeSeconds || 0), 0) || transcript?.durationSeconds || 1;

  const filteredSegments = (segments || []).filter((seg) => {
    const matchesSearch = seg.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpeaker =
      speakerFilter === 'ALL' ||
      seg.speakerLabel === speakerFilter ||
      seg.speakerId === speakerFilter;
    return matchesSearch && matchesSpeaker;
  });

  return (
    <div className="space-y-8">
      {errorMessage && (
        <div className="p-4 bg-[#9e1c1c]/10 border border-[#9e1c1c] text-[#9e1c1c] text-xs font-mono flex items-center justify-between">
          <span>{errorMessage}</span>
          <PosterButton variant="outline" size="sm" onClick={loadTranscript}>
            RETRY
          </PosterButton>
        </div>
      )}

      {/* 1. Speaker Manifest Card */}
      <div className="bg-white/70 border border-[#C7C7C7] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#C7C7C7]">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#7A7A7A]">
            IDENTIFIED SPEAKERS ({speakers.length})
          </span>
          <span className="text-[10px] font-mono text-[#7A7A7A]">
            WHISPER + PYANNOTE ACOUSTIC CLUSTERING
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {speakers.length === 0 ? (
            <div className="col-span-full py-4 text-xs font-mono text-[#7A7A7A] italic">
              SINGLE SPEAKER IDENTIFIED
            </div>
          ) : (
            speakers.map((s, idx) => {
              const spkDuration = s.totalSpeakingTimeSeconds || 0;
              const spkPct = s.speakingPercentage || Math.round((spkDuration / totalSpeakingDuration) * 100);

              return (
                <div
                  key={s.id || s._id || idx}
                  className="p-4 bg-[#E3E2DE]/40 border border-[#C7C7C7] flex flex-col justify-between space-y-3 hover:border-[#1351AA] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-2.5 h-2.5 bg-[#1351AA] flex-shrink-0" />
                      <div>
                        <div className="font-bold text-sm uppercase text-[#141414] leading-tight">
                          {s.displayName || s.speakerDisplayName || s.speakerLabel}
                        </div>
                        <span className="text-[10px] font-mono text-[#7A7A7A]">
                          [{s.speakerLabel}]
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setRenameSpeaker(s);
                        setNewName(s.displayName || s.speakerDisplayName || '');
                      }}
                      className="p-1 text-[#7A7A7A] hover:text-[#1351AA] transition-colors cursor-pointer"
                      title="Rename Speaker"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="pt-2 border-t border-[#C7C7C7] flex items-center justify-between text-xs font-mono text-[#444343]">
                    <span>{formatDuration(spkDuration)}</span>
                    <span className="font-bold text-[#1351AA]">{spkPct}% SHARE</span>
                    <span className="text-[#7A7A7A]">{s.segmentCount || 0} TURNS</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Controls & Search Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-white/70 border border-[#C7C7C7] p-4 sm:p-6">
        <div className="sm:col-span-8">
          <Input
            icon={Search}
            placeholder="SEARCH TRANSCRIPT KEYWORDS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="sm:col-span-4">
          <Select
            value={speakerFilter}
            onChange={(e) => setSpeakerFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'ALL SPEAKERS' },
              ...speakers.map((s) => ({
                value: s.speakerLabel || s.id,
                label: `${(s.displayName || s.speakerLabel).toUpperCase()} (${s.speakerLabel})`
              }))
            ]}
          />
        </div>
      </div>

      {/* 3. Transcript Segments Stream */}
      {filteredSegments.length === 0 ? (
        <div className="bg-white/70 border border-[#C7C7C7] p-12 text-center text-[#7A7A7A] font-mono text-xs">
          NO TRANSCRIPT SEGMENTS FOUND MATCHING CRITERIA.
        </div>
      ) : (
        <div className="divide-y divide-[#C7C7C7] border-y border-[#C7C7C7]">
          {filteredSegments.map((seg) => {
            const isActive = currentSeconds >= seg.startTime && currentSeconds <= seg.endTime;
            const matchingSpeaker = speakers.find((s) => s.speakerLabel === seg.speakerLabel || (s.id && s.id === seg.speakerId));

            return (
              <div
                key={seg.id || seg._id || seg.sequence}
                className={`py-6 px-4 transition-colors duration-200 ${
                  isActive
                    ? 'bg-[#1351AA]/10 border-l-4 border-l-[#1351AA]'
                    : 'bg-white/40 hover:bg-white/70'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => dispatch(seekPlayback(seg.startTime))}
                      className="inline-flex items-center text-xs font-mono font-bold text-[#141414] hover:text-[#1351AA] bg-[#E3E2DE] hover:bg-white border border-[#C7C7C7] px-2.5 py-1 transition-colors cursor-pointer"
                      title="Jump media player to this timestamp"
                    >
                      <Play className="w-2.5 h-2.5 mr-1.5 text-[#1351AA]" />
                      {formatTimecode(seg.startTime)}
                    </button>

                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-[#141414]" />
                      <span className="font-bold text-xs uppercase tracking-wider text-[#141414]">
                        {seg.speakerDisplayName || seg.speakerName || matchingSpeaker?.displayName || 'SPEAKER'}
                      </span>
                      <span className="text-[10px] font-mono text-[#7A7A7A]">
                        [{seg.speakerLabel || 'SPEAKER_00'}]
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopy(seg.id || seg._id || seg.sequence, seg.text)}
                    className="text-[#7A7A7A] hover:text-[#141414] p-1 transition-colors cursor-pointer"
                    title="Copy Segment Text"
                  >
                    {copiedId === (seg.id || seg._id || seg.sequence) ? (
                      <Check className="w-3.5 h-3.5 text-[#1b6b36]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <p className="text-base text-[#141414] leading-relaxed font-sans pl-1">
                  {seg.text}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Rename Speaker Modal */}
      <Modal
        isOpen={Boolean(renameSpeaker)}
        onClose={() => setRenameSpeaker(null)}
        title="RENAME SPEAKER"
      >
        <form onSubmit={handleSpeakerRename} className="space-y-6">
          <p className="text-xs font-mono text-[#7A7A7A] uppercase leading-relaxed">
            RENAMING WILL UPDATE ALL ASSOCIATED TRANSCRIPT SEGMENTS AND COMPILED REPORTS AUTOMATICALLY WHILE PRESERVING THE ACOUSTIC CLUSTER LABEL ({renameSpeaker?.speakerLabel}).
          </p>
          <Input
            label="SPEAKER DISPLAY NAME"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Rahul Sharma"
            required
            autoFocus
          />
          <div className="flex justify-end space-x-3 pt-4 border-t border-[#C7C7C7]">
            <PosterButton type="button" variant="outline" size="sm" onClick={() => setRenameSpeaker(null)}>
              CANCEL
            </PosterButton>
            <PosterButton type="submit" variant="primary" size="sm">
              SAVE SPEAKER NAME
            </PosterButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default TranscriptTab;
