import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Whisper Transcription with Word-Level Timestamps
 * 
 * Uses OpenAI Whisper API to generate transcriptions with precise word-level
 * timing for animated captions (OpusClip-style word highlighting).
 * 
 * Output format:
 * {
 *   text: "full transcript",
 *   words: [{ word: "hello", start: 0.0, end: 0.5, confidence: 0.98 }, ...]
 *   segments: [{ text: "sentence", start: 0.0, end: 2.5, words: [...] }, ...]
 * }
 */

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  confidence?: number;
}

interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  words: WordTimestamp[];
}

interface WhisperResponse {
  text: string;
  words?: WordTimestamp[];
  segments?: TranscriptSegment[];
  language?: string;
  duration?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== WHISPER TRANSCRIPTION START ===");

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Not authenticated');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { 
      audio_url, 
      media_id,
      clip_id,
      language = 'en',
      response_format = 'verbose_json',
      timestamp_granularities = ['word', 'segment']
    } = await req.json();

    if (!audio_url) {
      throw new Error('Missing required field: audio_url');
    }

    console.log(`→ Transcribing: ${audio_url}`);
    console.log(`→ Media ID: ${media_id || 'N/A'}, Clip ID: ${clip_id || 'N/A'}`);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Fetch audio file
    console.log('→ Fetching audio file...');
    const audioResponse = await fetch(audio_url);
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio: ${audioResponse.status}`);
    }

    const audioBlob = await audioResponse.blob();
    console.log(`→ Audio size: ${(audioBlob.size / 1024 / 1024).toFixed(2)} MB`);

    // Prepare form data for Whisper API
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.mp4');
    formData.append('model', 'whisper-1');
    formData.append('language', language);
    formData.append('response_format', response_format);
    
    // Request word-level timestamps
    if (timestamp_granularities.includes('word')) {
      formData.append('timestamp_granularities[]', 'word');
    }
    if (timestamp_granularities.includes('segment')) {
      formData.append('timestamp_granularities[]', 'segment');
    }

    console.log('→ Calling OpenAI Whisper API...');
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error('Whisper API error:', whisperResponse.status, errorText);
      throw new Error(`Whisper API error (${whisperResponse.status}): ${errorText}`);
    }

    const result: WhisperResponse = await whisperResponse.json();
    console.log(`✓ Transcription complete - ${result.words?.length || 0} words, ${result.segments?.length || 0} segments`);

    // Process words for caption generation
    const processedWords: WordTimestamp[] = result.words?.map(w => ({
      word: w.word.trim(),
      start: w.start,
      end: w.end,
      confidence: w.confidence || 1.0,
    })) || [];

    // Group words into caption segments (3-5 words each for readability)
    const captionSegments = groupWordsIntoCaptions(processedWords);
    console.log(`✓ Generated ${captionSegments.length} caption segments`);

    // Store in database
    const transcriptData = {
      user_id: user.id,
      asset_id: media_id || clip_id || null,
      source_type: clip_id ? 'clip' : 'media',
      language: result.language || language,
      raw_text: result.text,
      ai_model: 'openai-whisper-1',
      word_timestamps: processedWords,
      metadata: {
        audio_url,
        duration: result.duration,
        segments: result.segments,
        caption_segments: captionSegments,
        created_via: 'transcribe-whisper-function',
      }
    };

    const { data: transcript, error: dbError } = await supabaseClient
      .from('transcripts')
      .insert(transcriptData)
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Don't throw - still return the transcription
    } else {
      console.log(`✓ Transcript stored: ${transcript.id}`);
    }

    // If this is for a clip, update the clip record
    if (clip_id) {
      await supabaseClient
        .from('clips')
        .update({
          transcript_id: transcript?.id,
          has_word_timestamps: true,
        })
        .eq('id', clip_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        transcript_id: transcript?.id,
        text: result.text,
        words: processedWords,
        segments: result.segments,
        caption_segments: captionSegments,
        duration: result.duration,
        language: result.language || language,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Whisper transcription error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

/**
 * Group words into caption segments for display
 * Each segment is 3-5 words, breaking at natural pauses
 */
function groupWordsIntoCaptions(words: WordTimestamp[]): Array<{
  text: string;
  words: WordTimestamp[];
  start: number;
  end: number;
  highlightWord?: string;
}> {
  if (!words.length) return [];

  const segments: Array<{
    text: string;
    words: WordTimestamp[];
    start: number;
    end: number;
    highlightWord?: string;
  }> = [];

  let currentSegment: WordTimestamp[] = [];
  const WORDS_PER_SEGMENT = 4;
  const MAX_SEGMENT_DURATION = 2.5; // seconds

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    currentSegment.push(word);

    // Check if we should break the segment
    const segmentDuration = currentSegment.length > 0 
      ? word.end - currentSegment[0].start 
      : 0;

    const shouldBreak = 
      currentSegment.length >= WORDS_PER_SEGMENT ||
      segmentDuration >= MAX_SEGMENT_DURATION ||
      // Break at sentence endings
      word.word.match(/[.!?]$/) ||
      // Break at natural pauses (gap > 0.3s to next word)
      (i < words.length - 1 && words[i + 1].start - word.end > 0.3);

    if (shouldBreak && currentSegment.length > 0) {
      // Find the most impactful word to highlight
      const highlightWord = findHighlightWord(currentSegment);
      
      segments.push({
        text: currentSegment.map(w => w.word).join(' '),
        words: currentSegment,
        start: currentSegment[0].start,
        end: currentSegment[currentSegment.length - 1].end,
        highlightWord,
      });
      currentSegment = [];
    }
  }

  // Don't forget remaining words
  if (currentSegment.length > 0) {
    segments.push({
      text: currentSegment.map(w => w.word).join(' '),
      words: currentSegment,
      start: currentSegment[0].start,
      end: currentSegment[currentSegment.length - 1].end,
      highlightWord: findHighlightWord(currentSegment),
    });
  }

  return segments;
}

/**
 * Find the most impactful word in a segment to highlight
 * Prioritizes: verbs, nouns, adjectives > common words
 */
function findHighlightWord(words: WordTimestamp[]): string | undefined {
  if (words.length === 0) return undefined;
  
  // Common words to skip highlighting
  const skipWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'can', 'to', 'of', 'in', 'for', 'on', 'with', 'at',
    'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here',
    'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more',
    'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
    'so', 'than', 'too', 'very', 'just', 'and', 'but', 'or', 'if', 'because',
    'until', 'while', 'although', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'what', 'which', 'who', 'this', 'that', 'these', 'those', 'my', 'your',
    'his', 'her', 'its', 'our', 'their', 'me', 'him', 'us', 'them'
  ]);

  // Find first significant word
  for (const word of words) {
    const cleanWord = word.word.toLowerCase().replace(/[^a-z]/g, '');
    if (cleanWord.length >= 4 && !skipWords.has(cleanWord)) {
      return word.word;
    }
  }

  // Fallback to longest word
  return words.reduce((longest, current) => 
    current.word.length > longest.word.length ? current : longest
  ).word;
}
