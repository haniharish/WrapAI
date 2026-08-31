import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { seekPlayback, setIsPlaying } from '../../store/slices/workspaceSlice.js';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
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
    <div className="bg-[#141414] text-[#E3E2DE] border border-[#141414] p-4 sm:p-5 select-none">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-3">
        <div className="flex items-center space-x-4 w-full sm:w-auto">
          <button
            onClick={togglePlay}
            className="w-10 h-10 bg-[#1351AA] text-[#E3E2DE] flex items-center justify-center hover:bg-white hover:text-[#141414] transition-colors cursor-pointer"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <div>
            <p className="text-xs font-mono font-bold text-[#E3E2DE] uppercase tracking-wider">
              {formatTimecode(currentSeconds)} / {formatTimecode(duration)}
            </p>
            <p className="text-xs font-mono text-[#7A7A7A] truncate max-w-xs">{title}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 w-full sm:w-auto justify-end">
          <button
            onClick={cycleSpeed}
            className="px-3 py-1 text-xs font-mono font-bold border border-[#444343] bg-black/40 hover:bg-[#1351AA] text-[#E3E2DE] transition-colors cursor-pointer"
          >
            {playbackSpeed}X
          </button>

          <div className="flex items-center space-x-2">
            <button onClick={() => setIsMuted(!isMuted)} className="text-[#7A7A7A] hover:text-[#E3E2DE] cursor-pointer">
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              className="w-20 accent-[#1351AA] h-1.5 bg-[#444343] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Scrubber timeline */}
      <div className="relative flex items-center">
        <input
          type="range"
          min="0"
          max={duration}
          step="1"
          value={currentSeconds}
          onChange={handleSeek}
          className="w-full accent-[#1351AA] h-2 bg-[#444343] rounded-none cursor-pointer"
        />
      </div>
    </div>
  );
}

export default MediaPlayer;
