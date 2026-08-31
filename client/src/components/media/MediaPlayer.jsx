import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { seekPlayback, setIsPlaying } from '../../store/slices/workspaceSlice.js';
import { Play, Pause, Volume2, VolumeX, RotateCcw, FastForward } from 'lucide-react';
import { formatTimecode } from '../../utils/formatters.js';

export function MediaPlayer({ duration = 3120, title = 'Media Stream' }) {
  const dispatch = useDispatch();
  const currentSeconds = useSelector((state) => state.workspace.currentPlaybackSeconds);
  const isPlaying = useSelector((state) => state.workspace.isPlaying);

  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const togglePlay = () => {
    dispatch(setIsPlaying(!isPlaying));
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    dispatch(seekPlayback(newTime));
  };

  const speeds = [1, 1.25, 1.5, 2];
  const cycleSpeed = () => {
    const idx = speeds.indexOf(playbackSpeed);
    const next = speeds[(idx + 1) % speeds.length];
    setPlaybackSpeed(next);
  };

  return (
    <div className="bg-brand-navy text-brand-white border border-brand-charcoal p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-3">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={togglePlay}
            className="w-10 h-10 bg-brand-white text-brand-navy flex items-center justify-center hover:bg-brand-sage transition-colors active:scale-95"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <div>
            <p className="text-xs font-mono text-brand-sage uppercase tracking-wider">
              {formatTimecode(currentSeconds)} / {formatTimecode(duration)}
            </p>
            <p className="text-xs text-brand-white/80 truncate max-w-xs">{title}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 w-full sm:w-auto justify-end">
          <button
            onClick={cycleSpeed}
            className="px-2.5 py-1 text-xs font-mono border border-brand-charcoal bg-brand-charcoal/60 hover:bg-brand-charcoal text-brand-cyan transition-colors"
          >
            {playbackSpeed}x
          </button>

          <div className="flex items-center space-x-2">
            <button onClick={() => setIsMuted(!isMuted)} className="text-brand-taupe hover:text-white">
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              className="w-20 accent-brand-cyan h-1 bg-brand-charcoal cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Scrubber timeline */}
      <div className="relative flex items-center group">
        <input
          type="range"
          min="0"
          max={duration}
          step="1"
          value={currentSeconds}
          onChange={handleSeek}
          className="w-full accent-brand-cyan h-2 bg-brand-charcoal rounded-none cursor-pointer"
        />
      </div>
    </div>
  );
}
