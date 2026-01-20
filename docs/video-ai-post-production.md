# Video AI Post-Production System

## Overview

The Video AI Post-Production system uses Lovable AI (google/gemini-2.5-flash) to analyze and process video content, providing intelligent insights and editing recommendations for creators.

## Features

### 1. Smart Trim/Cut
- **AI Analysis**: Automatically detects filler words (um, uh, like, you know)
- **Timestamp Tracking**: Precise timestamps and duration for each filler word
- **Time Savings**: Calculates total removable duration
- **Status**: Analysis complete, actual video cutting requires FFmpeg implementation

### 2. Quality Enhancement
- **Issue Detection**: Identifies lighting, audio, shaky footage, and blur issues
- **Severity Levels**: Categorizes issues as low, medium, or high severity
- **Suggestions**: Provides specific enhancement recommendations
- **Status**: Analysis complete, actual enhancement requires FFmpeg implementation

### 3. Auto-Captions
- **Transcript Generation**: Full video transcription with AI
- **Timestamp Sync**: Accurate timing for subtitle generation
- **Format Ready**: Transcript ready for SRT file conversion
- **Status**: Transcript generation complete, caption burning requires FFmpeg

### 4. Ad Insertion
- **Optimal Timing**: AI suggests natural break points for ads
- **Reason Analysis**: Explains why each timestamp is optimal
- **Scene Detection**: Identifies scene transitions for seamless ad placement
- **Status**: Analysis complete, actual ad splicing requires FFmpeg

## Architecture

### Edge Functions

#### `analyze-video-content`
- **Purpose**: Analyzes video content using Lovable AI
- **Input**: Media file ID, video URL, analysis type
- **Output**: Comprehensive analysis with transcript, filler words, scenes, ad breaks, quality issues
- **Authentication**: JWT verification enabled

#### `process-video`
- **Purpose**: Orchestrates video processing workflow
- **Steps**:
  1. Calls analyze-video-content for AI analysis
  2. Processes results based on job type (ai_edit, ad_insertion, full_process)
  3. Creates media version record with analysis
  4. Updates job status
- **Authentication**: JWT verification enabled

### Frontend Components

#### `VideoEditingControls`
- UI for selecting edit type and providing instructions
- Feature previews for each edit type
- Processing status indicators
- Located: `src/components/media/VideoEditingControls.tsx`

#### `VideoAnalysisResults`
- Displays AI analysis results
- Summary statistics (filler words, scenes, ad breaks, issues)
- Detailed breakdowns with scrollable lists
- Full transcript view
- Located: `src/components/media/VideoAnalysisResults.tsx`

#### `useVideoProcessing` Hook
- Manages video processing requests
- Status tracking
- Error handling
- Located: `src/hooks/useVideoProcessing.tsx`

## Usage Flow

1. **User uploads video** → Stored in Supabase Storage
2. **User selects edit type** → AI Edit, Ad Insertion, or Full Process
3. **User provides instructions** → Optional guidance for AI
4. **System creates job** → Record in media_processing_jobs table
5. **AI analyzes content** → Lovable AI generates comprehensive analysis
6. **Results displayed** → User sees filler words, quality issues, ad break suggestions
7. **Version created** → Analysis saved in media_versions table

## Database Tables

### `media_processing_jobs`
- Tracks processing status and results
- Fields: media_file_id, job_type, status, output_data, processing_time

### `media_versions`
- Stores different versions of media files
- Fields: original_media_id, version_type, processing_config, file_url

### `media_ad_slots`
- Records ad insertion configurations
- Fields: media_file_id, slot_type, position_seconds, ad_file_url

## AI Model

- **Model**: google/gemini-2.5-flash
- **Provider**: Lovable AI Gateway
- **Key**: LOVABLE_API_KEY (auto-configured)
- **Endpoint**: https://ai.gateway.lovable.dev/v1/chat/completions

## Current Limitations

The current implementation provides **AI analysis only**. Actual video manipulation requires FFmpeg integration:

### To Enable Full Video Editing:

1. **Set up Docker environment** with FFmpeg installed
2. **Implement video manipulation functions**:
   - `applySmartTrim()` - Remove filler word segments
   - `enhanceQuality()` - Stabilize, denoise, color correct
   - `addCaptions()` - Burn subtitles into video
   - `insertAds()` - Splice ads at optimal points
3. **Add file handling**:
   - Download from Supabase Storage
   - Process with FFmpeg
   - Upload back to Storage
4. **Implement progress tracking** and timeout management

See `supabase/functions/process-video/index.ts` for detailed FFmpeg implementation notes.

## Error Handling

- Upload failures logged to `upload_failure_logs`
- Email alerts sent to admins via Resend
- Processing errors update job status to "failed"
- Detailed error messages stored in database

## Future Enhancements

- [ ] Real-time processing progress updates
- [ ] Batch video processing
- [ ] Custom filler word dictionary
- [ ] Advanced scene detection (action, dialogue, b-roll)
- [ ] Color grading presets
- [ ] Automated thumbnail generation
- [ ] Multi-language caption support
- [ ] Video compression optimization
