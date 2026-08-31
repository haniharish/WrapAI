import { YoutubeTranscript } from 'youtube-transcript';
import { logger } from '../utils/logger.js';

export const youtubeService = {
  /**
   * Checks whether a given string is a valid YouTube URL
   */
  isYouTubeUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i;
    return ytRegex.test(url.trim());
  },

  /**
   * Extracts the 11-character video ID from any YouTube URL format
   */
  extractVideoId(url) {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    return match ? match[1] : null;
  },

  /**
   * Fetches video metadata including real title, author, and length
   */
  async fetchVideoMetadata(url) {
    const videoId = this.extractVideoId(url);
    if (!videoId) return null;

    try {
      const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      const html = await res.text();

      let title = null;
      let durationSeconds = 0;
      let author = null;

      const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
      if (playerResponseMatch) {
        try {
          const playerResponse = JSON.parse(playerResponseMatch[1]);
          title = playerResponse.videoDetails?.title;
          durationSeconds = parseInt(playerResponse.videoDetails?.lengthSeconds || '0', 10);
          author = playerResponse.videoDetails?.author;
        } catch {
          // fallback to title tag
        }
      }

      if (!title) {
        const titleMatch = html.match(/<title>(.*?)<\/title>/);
        if (titleMatch) {
          title = titleMatch[1].replace(' - YouTube', '').trim();
        }
      }

      return {
        videoId,
        title: title || `YouTube Video (${videoId})`,
        author: author || 'YouTube Creator',
        durationSeconds: durationSeconds || 0,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      };
    } catch (err) {
      logger.warn(`Failed to fetch YouTube metadata for ${videoId}:`, err.message);
      return {
        videoId,
        title: `YouTube Video (${videoId})`,
        author: 'YouTube Creator',
        durationSeconds: 0,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      };
    }
  },

  /**
   * Fetches and normalizes the full transcript of a YouTube video
   */
  async fetchTranscript(url) {
    const videoId = this.extractVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL provided.');
    }

    logger.info(`Fetching YouTube transcript for video ${videoId}`);

    const rawItems = await YoutubeTranscript.fetchTranscript(url);
    if (!rawItems || rawItems.length === 0) {
      throw new Error('No transcript or captions available for this YouTube video.');
    }

    // Group close short phrases into smooth readable sentences / segments (e.g. 15-30s blocks)
    const segments = [];
    let currentBlock = {
      startTime: 0,
      endTime: 0,
      text: '',
      sequence: 1,
      speakerLabel: 'SPEAKER_00',
      speakerDisplayName: 'Speaker 1',
      confidence: 0.96,
      words: []
    };

    let totalDuration = 0;
    let totalWordCount = 0;

    rawItems.forEach((item, idx) => {
      const startSec = Math.round((item.offset / 1000) * 100) / 100;
      const durSec = Math.round((item.duration / 1000) * 100) / 100;
      const endSec = Math.round((startSec + durSec) * 100) / 100;
      const cleanText = (item.text || '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/<[^>]+>/g, '')
        .trim();

      if (!cleanText) return;

      totalWordCount += cleanText.split(/\s+/).filter(Boolean).length;
      totalDuration = Math.max(totalDuration, endSec);

      if (!currentBlock.text) {
        currentBlock.startTime = startSec;
        currentBlock.endTime = endSec;
        currentBlock.text = cleanText;
      } else if (endSec - currentBlock.startTime < 25 && currentBlock.text.length < 220) {
        currentBlock.endTime = endSec;
        currentBlock.text += ' ' + cleanText;
      } else {
        segments.push({ ...currentBlock });
        currentBlock = {
          startTime: startSec,
          endTime: endSec,
          text: cleanText,
          sequence: segments.length + 1,
          speakerLabel: 'SPEAKER_00',
          speakerDisplayName: 'Speaker 1',
          confidence: 0.96,
          words: []
        };
      }
    });

    if (currentBlock.text) {
      segments.push(currentBlock);
    }

    return {
      contentId: null,
      language: rawItems[0]?.lang || 'en',
      durationSeconds: Math.ceil(totalDuration),
      wordCount: totalWordCount,
      speakersCount: 1,
      processingModel: 'youtube-caption-extractor',
      diarizationModel: null,
      speakers: [
        {
          speakerLabel: 'SPEAKER_00',
          displayName: 'Speaker 1',
          totalSpeakingTime: Math.ceil(totalDuration),
          segmentCount: segments.length,
          speakingPercentage: 100.0,
          color: '#1351AA',
          confidence: 0.96
        }
      ],
      segments
    };
  }
};
