import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { seekPlayback } from '../../../../store/slices/workspaceSlice.js';
import { transcriptService } from '../../../../services/transcriptService.js';
import { Card } from '../../../../components/ui/Card.jsx';
import { Input } from '../../../../components/ui/Input.jsx';
import { Select } from '../../../../components/ui/Select.jsx';
import { Button } from '../../../../components/ui/Button.jsx';
import { Modal } from '../../../../components/ui/Modal.jsx';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { Search, UserCheck, Edit2, Play, Copy, Check, FileText, Users, Clock, PieChart } from 'lucide-react';
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

  if (isLoading) return <LoadingState message="Loading speech-to-text transcript and speaker turns..." />;

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
    <div className="space-y-6">
      {errorMessage && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
          <span>{errorMessage}</span>
          <Button variant="outline" size="sm" onClick={loadTranscript}>
            Retry
          </Button>
        </div>
      )}

      {/* Speaker Statistics Manifest Card */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-brand-navy" />
            <h3 className="font-mono text-xs uppercase tracking-wider font-bold text-brand-navy">
              IDENTIFIED SPEAKERS ({speakers.length})
            </h3>
          </div>
          <span className="text-[11px] font-mono text-brand-taupe">
            Model: {transcript?.processingModel || 'faster-whisper-small'} &bull; Diarization: {transcript?.diarizationModel || 'pyannote.audio'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {speakers.length === 0 ? (
            <div className="col-span-full py-3 text-xs font-mono text-brand-taupe italic">
              Single speaker detected
            </div>
          ) : (
            speakers.map((s, idx) => {
              const spkDuration = s.totalSpeakingTimeSeconds || 0;
              const spkPct = s.speakingPercentage || Math.round((spkDuration / totalSpeakingDuration) * 100);
              const avatarBg = s.avatarColor || s.color || '#1B365D';

              return (
                <div
                  key={s.id || s._id || idx}
                  className="p-3 bg-brand-light border border-brand-charcoal/15 flex flex-col justify-between hover:border-brand-navy transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: avatarBg }}
                      />
                      <div>
                        <div className="font-display text-sm text-brand-navy font-bold leading-tight">
                          {s.displayName || s.speakerDisplayName || s.speakerLabel}
                        </div>
                        <span className="text-[10px] font-mono text-brand-taupe">
                          {s.speakerLabel}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setRenameSpeaker(s);
                        setNewName(s.displayName || s.speakerDisplayName || '');
                      }}
                      className="p-1 text-brand-taupe hover:text-brand-navy"
                      title="Rename Speaker"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 pt-2 border-t border-brand-charcoal/10 flex items-center justify-between text-[11px] font-mono text-brand-charcoal/80">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-brand-taupe" />
                      {formatDuration(spkDuration)}
                    </span>
                    <span className="bg-brand-sage/40 px-1.5 py-0.5 font-bold text-brand-navy">
                      {spkPct}% share
                    </span>
                    <span>{s.segmentCount || 0} turns</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Controls & Filter Bar */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-80">
            <Input
              icon={Search}
              placeholder="Search transcript keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <Select
              value={speakerFilter}
              onChange={(e) => setSpeakerFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Speakers' },
                ...speakers.map((s) => ({
                  value: s.speakerLabel || s.id,
                  label: `${s.displayName || s.speakerLabel} (${s.speakerLabel})`
                }))
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Transcript Stream */}
      {filteredSegments.length === 0 ? (
        <Card className="p-12 text-center text-brand-taupe font-mono text-xs">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No transcript segments found matching your filter criteria.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSegments.map((seg) => {
            const isActive = currentSeconds >= seg.startTime && currentSeconds <= seg.endTime;
            const matchingSpeaker = speakers.find((s) => s.speakerLabel === seg.speakerLabel || (s.id && s.id === seg.speakerId));
            const avatarBg = matchingSpeaker?.avatarColor || matchingSpeaker?.color || '#1B365D';

            return (
              <div
                key={seg.id || seg._id || seg.sequence}
                className={`p-4 sm:p-5 border transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-sage/20 border-brand-navy shadow-md translate-x-1'
                    : 'bg-brand-white border-brand-charcoal/15 hover:border-brand-charcoal/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => dispatch(seekPlayback(seg.startTime))}
                      className="inline-flex items-center text-xs font-mono font-bold text-brand-navy hover:text-brand-charcoal bg-brand-sage/40 hover:bg-brand-sage px-2 py-0.5"
                      title="Jump media player to this timestamp"
                    >
                      <Play className="w-2.5 h-2.5 mr-1" />
                      {formatTimecode(seg.startTime)}
                    </button>

                    <div className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: avatarBg }} />
                      <span className="font-display text-sm uppercase tracking-wide text-brand-navy font-bold">
                        {seg.speakerDisplayName || seg.speakerName || matchingSpeaker?.displayName || 'Speaker 1'}
                      </span>
                      <span className="text-[10px] font-mono text-brand-taupe">
                        [{seg.speakerLabel || 'SPEAKER_00'}]
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopy(seg.id || seg._id || seg.sequence, seg.text)}
                    className="text-brand-taupe hover:text-brand-navy p-1"
                    title="Copy segment text"
                  >
                    {copiedId === (seg.id || seg._id || seg.sequence) ? (
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <p className="text-sm text-brand-navy leading-relaxed font-sans pl-1 border-l-2 border-transparent">
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
        title="Rename Speaker"
      >
        <form onSubmit={handleSpeakerRename} className="space-y-4">
          <p className="text-xs text-brand-taupe">
            Renaming{' '}
            <strong className="text-brand-navy">
              {renameSpeaker?.displayName || renameSpeaker?.speakerLabel}
            </strong>{' '}
            will update all associated transcript segments and compiled reports automatically while preserving the original AI label (<code>{renameSpeaker?.speakerLabel}</code>).
          </p>
          <Input
            label="Speaker Display Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Rahul Sharma"
            required
          />
          <div className="flex justify-end space-x-3 pt-4 border-t border-brand-charcoal/10">
            <Button type="button" variant="ghost" onClick={() => setRenameSpeaker(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Speaker Name
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
