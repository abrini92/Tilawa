export default async function authRoutes(fastify, options) {
  // Verify JWT token middleware
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

  // Get current user
  fastify.get('/me', async (request, reply) => {
    return { user: request.user };
  });

  // Refresh token
  fastify.post('/refresh', async (request, reply) => {
    const { refresh_token } = request.body;
    
    if (!refresh_token) {
      return reply.code(400).send({ error: 'Refresh token required' });
    }

    const { data, error } = await fastify.supabase.auth.refreshSession({
      refresh_token
    });

    if (error) {
      return reply.code(401).send({ error: error.message });
    }

    return data;
  });

  // Sign out
  fastify.post('/signout', async (request, reply) => {
    const authHeader = request.headers.authorization;
    const token = authHeader?.substring(7);

    if (token) {
      await fastify.supabase.auth.signOut();
    }

    return { success: true };
  });
}
