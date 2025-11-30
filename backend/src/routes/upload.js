import { supabaseAdmin } from '../config/supabase.js';

// Security constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_DURATION_SECONDS = 15 * 60; // 15 minutes
const ALLOWED_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'audio/mp4',
  'audio/aac',
  'audio/m4a',
  'audio/ogg'
];

/**
 * Get Auphonic algorithms configuration based on enhancement type
 * All presets respect the integrity of Quranic recitation
 */
function getAuphonicAlgorithms(enhancement) {
  const baseAlgorithms = {
    denoise: true,           // Noise reduction (always on)
    leveler: true,           // Loudness normalization
    normloudness: true,      // EBU R128 loudness normalization
    hipfilter: true,         // Remove low-frequency rumble
  };

  switch (enhancement) {
    case 'clean':
      // Minimal processing: noise reduction only
      return {
        denoise: true,
        hipfilter: true,
      };

    case 'studio':
      // Professional clarity + compression
      return {
        ...baseAlgorithms,
        gate: true,            // Noise gate
        compressor: true,      // Dynamic range compression
      };

    case 'mosque_light':
      // Studio + subtle room reverb
      return {
        ...baseAlgorithms,
        gate: true,
        compressor: true,
        reverb: {
          enabled: true,
          room_size: 0.3,      // Small room
          damping: 0.5,
          wet_level: 0.15,     // Subtle
        }
      };

    case 'mosque_deep':
      // Studio + deep mosque reverb
      return {
        ...baseAlgorithms,
        gate: true,
        compressor: true,
        reverb: {
          enabled: true,
          room_size: 0.8,      // Large hall/mosque
          damping: 0.3,
          wet_level: 0.35,     // More pronounced
        }
      };

    default:
      return baseAlgorithms;
  }
}

export default async function uploadRoutes(fastify, options) {
  if (!supabaseAdmin) {
    fastify.log.warn('Supabase admin client not configured - upload routes may not work properly');
  }
  
  // Auth middleware
  fastify.addHook('preHandler', async (request, reply) => {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await fastify.supabase.auth.getUser(token);
    
    if (error || !user) {
      return reply.code(401).send({ error: 'Invalid token' });
    }

    request.user = user;
  });

  // Upload audio file
  fastify.post('/', async (request, reply) => {
    const data = await request.file();
    
    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(data.mimetype)) {
      return reply.code(400).send({ 
        error: 'Invalid file type. Only audio files are allowed.',
        allowedTypes: ALLOWED_MIME_TYPES
      });
    }

    const buffer = await data.toBuffer();
    
    // Validate file size
    if (buffer.length > MAX_FILE_SIZE) {
      return reply.code(413).send({ 
        error: 'File too large',
        maxSize: MAX_FILE_SIZE,
        receivedSize: buffer.length
      });
    }

    // Estimate duration (rough approximation: 128kbps average bitrate)
    // More accurate would require parsing audio metadata
    const estimatedDuration = (buffer.length * 8) / (128 * 1024); // seconds
    if (estimatedDuration > MAX_DURATION_SECONDS) {
      return reply.code(400).send({ 
        error: 'Audio file too long',
        maxDuration: MAX_DURATION_SECONDS,
        estimatedDuration: Math.round(estimatedDuration)
      });
    }

    const filename = `${request.user.id}/${Date.now()}-${data.filename}`;

    try {
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('recitations')
        .upload(filename, buffer, {
          contentType: data.mimetype,
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('recitations')
        .getPublicUrl(filename);

      // Get enhancement type from request (if provided)
      const enhancement = request.body?.enhancement || 'studio';

      // Track event in PostHog
      if (fastify.posthog) {
        fastify.posthog.capture({
          distinctId: request.user.id,
          event: 'audio_uploaded',
          properties: {
            filename: data.filename,
            size: buffer.length,
            mimetype: data.mimetype,
            estimatedDuration: Math.round(estimatedDuration),
            enhancement
          }
        });
      }

      // Send to Auphonic for processing if API key is configured
      let auphonicProductionId = null;
      if (process.env.AUPHONIC_API_KEY) {
        try {
          const auphonicResponse = await fetch(`${process.env.AUPHONIC_API_URL || 'https://auphonic.com/api'}/productions.json`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.AUPHONIC_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              input_file: publicUrl,
              metadata: {
                title: data.filename,
                artist: 'Tilawa User',
                album: 'Quran Recitations'
              },
              algorithms: getAuphonicAlgorithms(enhancement),
              output_files: [{
                format: 'mp3',
                bitrate: 192,
                ending: 'enhanced.mp3'
              }],
              webhook: process.env.WEBHOOK_URL || 'https://tilawa-production.up.railway.app/api/auphonic/webhook'
            })
          });

          if (auphonicResponse.ok) {
            const auphonicData = await auphonicResponse.json();
            auphonicProductionId = auphonicData.data.uuid;
            
            // Start production immediately
            await fetch(`${process.env.AUPHONIC_API_URL || 'https://auphonic.com/api'}/production/${auphonicProductionId}/start.json`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.AUPHONIC_API_KEY}`
              }
            });

            fastify.log.info(`Auphonic production started: ${auphonicProductionId}`);
          }
        } catch (auphonicError) {
          fastify.log.error('Auphonic processing failed:', auphonicError);
          // Continue without Auphonic if it fails
        }
      }

      // Trigger Inngest function for processing
      await fastify.inngest.send({
        name: 'audio/uploaded',
        data: {
          fileId: uploadData.id,
          userId: request.user.id,
          filename,
          publicUrl,
          enhancement,
          auphonicProductionId
        }
      });

      return {
        success: true,
        file: {
          path: filename,
          url: publicUrl,
          size: buffer.length
        },
        auphonicProductionId
      };
    } catch (error) {
      fastify.log.error(error);
      
      // Track failed upload in PostHog
      if (fastify.posthog) {
        fastify.posthog.capture({
          distinctId: request.user.id,
          event: 'audio_upload_failed',
          properties: {
            error: error.message,
            filename: data?.filename
          }
        });
      }
      
      return reply.code(500).send({ error: 'Upload failed' });
    }
  });

  // Get upload URL (signed URL for direct upload)
  fastify.post('/signed-url', async (request, reply) => {
    const { filename, contentType } = request.body;
    
    if (!filename) {
      return reply.code(400).send({ error: 'Filename required' });
    }

    // Validate content type if provided
    if (contentType && !ALLOWED_MIME_TYPES.includes(contentType)) {
      return reply.code(400).send({ 
        error: 'Invalid content type. Only audio files are allowed.',
        allowedTypes: ALLOWED_MIME_TYPES
      });
    }

    const path = `${request.user.id}/${Date.now()}-${filename}`;

    try {
      const { data, error } = await supabaseAdmin.storage
        .from('recitations')
        .createSignedUploadUrl(path);

      if (error) {
        throw error;
      }

      return {
        signedUrl: data.signedUrl,
        path: data.path,
        token: data.token
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to generate signed URL' });
    }
  });

  // List user's uploads
  fastify.get('/list', async (request, reply) => {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from('recitations')
        .list(request.user.id, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        throw error;
      }

      return { files: data };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to list files' });
    }
  });
}
