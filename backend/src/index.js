import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import env from '@fastify/env';
import * as Sentry from '@sentry/node';
import { PostHog } from 'posthog-node';
import { supabaseClient } from './config/supabase.js';
import { inngestClient } from './config/inngest.js';
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import auphonicRoutes from './routes/auphonic.js';

const schema = {
  type: 'object',
  required: ['PORT', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'],
  properties: {
    PORT: { type: 'string', default: '3000' },
    HOST: { type: 'string', default: '0.0.0.0' },
    NODE_ENV: { type: 'string', default: 'development' },
    SUPABASE_URL: { type: 'string' },
    SUPABASE_ANON_KEY: { type: 'string' },
    SUPABASE_SERVICE_ROLE_KEY: { type: 'string' },
    SENTRY_DSN: { type: 'string' },
    POSTHOG_API_KEY: { type: 'string' },
    POSTHOG_HOST: { type: 'string', default: 'https://app.posthog.com' },
  }
};

const options = {
  confKey: 'config',
  schema,
  dotenv: true,
  data: process.env
};

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  }
});

// Initialize Sentry (before fastify starts)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
  });
}

// Register plugins first (needed to access config)
await fastify.register(env, options);

// Initialize PostHog after env is loaded
let posthog;
if (fastify.config.POSTHOG_API_KEY) {
  posthog = new PostHog(fastify.config.POSTHOG_API_KEY, {
    host: fastify.config.POSTHOG_HOST || 'https://app.posthog.com'
  });
}
await fastify.register(cors, {
  origin: true,
  credentials: true
});
await fastify.register(multipart, {
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  }
});
await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '15 minutes'
});

// Decorate fastify with services
fastify.decorate('supabase', supabaseClient);
fastify.decorate('inngest', inngestClient);
fastify.decorate('posthog', posthog);

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register routes
await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(uploadRoutes, { prefix: '/api/upload' });
await fastify.register(auphonicRoutes, { prefix: '/api/auphonic' });

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error);
  }
  
  fastify.log.error(error);
  
  reply.status(error.statusCode || 500).send({
    error: error.message || 'Internal Server Error',
    statusCode: error.statusCode || 500
  });
});

// Start server
const start = async () => {
  try {
    const port = fastify.config.PORT;
    const host = fastify.config.HOST;
    
    await fastify.listen({ port, host });
    
    fastify.log.info(`Server listening on ${host}:${port}`);
    fastify.log.info(`Environment: ${fastify.config.NODE_ENV}`);
  } catch (err) {
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(err);
    }
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
const closeGracefully = async (signal) => {
  fastify.log.info(`Received signal to terminate: ${signal}`);
  
  if (posthog) {
    await posthog.shutdown();
  }
  
  await fastify.close();
  process.exit(0);
};

process.on('SIGINT', closeGracefully);
process.on('SIGTERM', closeGracefully);

start();
