export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'WrapAI REST API Gateway',
    version: '1.0.0',
    description: 'WrapAI — From Content to Clarity. Complete REST API documentation for multi-modal content intelligence, transcription, speaker diarization, RAG queries, and executive reports.'
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local Development Server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your short-lived access JWT'
      }
    },
    schemas: {
      StandardSuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object' }
        }
      },
      StandardErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error description' },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              details: { type: 'object' }
            }
          }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: {
        summary: 'System health probe',
        tags: ['System'],
        responses: {
          '200': {
            description: 'System status and database connectivity',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/StandardSuccessResponse' } } }
          }
        }
      }
    },
    '/auth/register': {
      post: {
        summary: 'Register new user account',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fullName', 'email', 'password'],
                properties: {
                  fullName: { type: 'string', example: 'Rahul Sharma' },
                  email: { type: 'string', example: 'rahul@wrapai.io' },
                  password: { type: 'string', example: 'SecurePassword123' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'User registered successfully' },
          '409': { description: 'Email already exists' }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate user & issue JWT',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'rahul@wrapai.io' },
                  password: { type: 'string', example: 'password123' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Authentication successful with JWT' },
          '401': { description: 'Invalid credentials' }
        }
      }
    },
    '/content': {
      get: {
        summary: 'List user uploaded content items',
        tags: ['Content'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['AUDIO', 'VIDEO', 'DOCUMENT', 'TEXT', 'URL'] } }
        ],
        responses: {
          '200': { description: 'List of content items with pagination' }
        }
      }
    }
  }
};
