export default async function auphonicRoutes(fastify, options) {
  const AUPHONIC_API_URL = process.env.AUPHONIC_API_URL || 'https://auphonic.com/api';
  const AUPHONIC_API_KEY = process.env.AUPHONIC_API_KEY;

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

  // Create Auphonic production
  fastify.post('/production', async (request, reply) => {
    const { audioUrl, title, metadata } = request.body;

    if (!audioUrl) {
      return reply.code(400).send({ error: 'Audio URL required' });
    }

    if (!AUPHONIC_API_KEY) {
      return reply.code(500).send({ error: 'Auphonic API key not configured' });
    }

    try {
      const response = await fetch(`${AUPHONIC_API_URL}/productions.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AUPHONIC_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input_file: audioUrl,
          metadata: {
            title: title || 'Untitled',
            ...metadata
          },
          algorithms: {
            denoise: true,
            leveler: true,
            normloudness: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Auphonic API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Track in PostHog
      if (fastify.posthog) {
        fastify.posthog.capture({
          distinctId: request.user.id,
          event: 'auphonic_production_created',
          properties: {
            productionId: data.data.uuid,
            title
          }
        });
      }

      return {
        success: true,
        production: data.data
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });

  // Start Auphonic production
  fastify.post('/production/:uuid/start', async (request, reply) => {
    const { uuid } = request.params;

    if (!AUPHONIC_API_KEY) {
      return reply.code(500).send({ error: 'Auphonic API key not configured' });
    }

    try {
      const response = await fetch(`${AUPHONIC_API_URL}/production/${uuid}/start.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AUPHONIC_API_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error(`Auphonic API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        production: data.data
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });

  // Get Auphonic production status
  fastify.get('/production/:uuid', async (request, reply) => {
    const { uuid } = request.params;

    if (!AUPHONIC_API_KEY) {
      return reply.code(500).send({ error: 'Auphonic API key not configured' });
    }

    try {
      const response = await fetch(`${AUPHONIC_API_URL}/production/${uuid}.json`, {
        headers: {
          'Authorization': `Bearer ${AUPHONIC_API_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error(`Auphonic API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        production: data.data
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });

  // Webhook endpoint for Auphonic callbacks
  fastify.post('/webhook', async (request, reply) => {
    const { uuid, status, output_files } = request.body;

    fastify.log.info(`Auphonic webhook received for ${uuid}: ${status}`);

    if (status === 'Done' && output_files) {
      // Trigger Inngest function to download and store the enhanced audio
      await fastify.inngest.send({
        name: 'auphonic/completed',
        data: {
          productionId: uuid,
          outputFiles: output_files
        }
      });
    }

    return { success: true };
  });
}
