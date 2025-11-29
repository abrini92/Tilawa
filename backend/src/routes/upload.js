import { supabaseAdmin } from '../config/supabase.js';

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

    const buffer = await data.toBuffer();
    const filename = `${request.user.id}/${Date.now()}-${data.filename}`;

    try {
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('audio-files')
        .upload(filename, buffer, {
          contentType: data.mimetype,
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('audio-files')
        .getPublicUrl(filename);

      // Track event in PostHog
      if (fastify.posthog) {
        fastify.posthog.capture({
          distinctId: request.user.id,
          event: 'audio_uploaded',
          properties: {
            filename: data.filename,
            size: buffer.length,
            mimetype: data.mimetype
          }
        });
      }

      // Trigger Inngest function for processing
      await fastify.inngest.send({
        name: 'audio/uploaded',
        data: {
          fileId: uploadData.id,
          userId: request.user.id,
          filename,
          publicUrl
        }
      });

      return {
        success: true,
        file: {
          path: filename,
          url: publicUrl,
          size: buffer.length
        }
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Upload failed' });
    }
  });

  // Get upload URL (signed URL for direct upload)
  fastify.post('/signed-url', async (request, reply) => {
    const { filename, contentType } = request.body;
    
    if (!filename) {
      return reply.code(400).send({ error: 'Filename required' });
    }

    const path = `${request.user.id}/${Date.now()}-${filename}`;

    try {
      const { data, error } = await supabaseAdmin.storage
        .from('audio-files')
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
        .from('audio-files')
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
