/**
 * OpenAPI 3.1 specification for PublisherOS API.
 * Served at GET /api/v1/openapi.json (spec) and GET /api/v1/docs (Scalar UI).
 *
 * Add new routes to this spec as they are implemented.
 */
export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'PublisherOS API',
    version: '0.3.0',
    description:
      'PublisherOS — publisher-centric multi-tenancy. Phase 2 (refactored): authentication, publisher management, and platform admin.',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Local development',
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Liveness check',
        description:
          'Returns 200 when the process is running. Does not check dependencies.',
        operationId: 'getHealth',
        tags: ['System'],
        responses: {
          '200': {
            description: 'Application is alive',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status', 'timestamp'],
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: {
                      type: 'string',
                      format: 'date-time',
                      example: '2024-01-01T00:00:00.000Z',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/ready': {
      get: {
        summary: 'Readiness check',
        description:
          'Returns 200 only when PostgreSQL and Redis are both reachable. Returns 503 otherwise.',
        operationId: 'getReady',
        tags: ['System'],
        responses: {
          '200': {
            description: 'All dependencies are reachable',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ReadyResponse' },
              },
            },
          },
          '503': {
            description: 'One or more dependencies are unavailable',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ReadyResponse' },
              },
            },
          },
        },
      },
    },

    // ── Auth ──────────────────────────────────────────────────────────────────

    '/auth/register': {
      post: {
        summary: 'Register a new user',
        description:
          'Creates a new user account and sends an email verification link. Rate-limited to 10 req/15 min per IP.',
        operationId: 'register',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'User created — verification email sent',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '409': { $ref: '#/components/responses/ConflictError' },
          '429': { $ref: '#/components/responses/RateLimitError' },
        },
      },
    },

    '/auth/login': {
      post: {
        summary: 'Log in',
        description:
          'Authenticates the user and sets an HttpOnly session cookie. Rate-limited to 10 req/15 min per IP.',
        operationId: 'login',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Authenticated — session cookie set',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/AuthError' },
          '429': { $ref: '#/components/responses/RateLimitError' },
        },
      },
    },

    '/auth/logout': {
      post: {
        summary: 'Log out',
        description: 'Revokes the current session and clears the session cookie.',
        operationId: 'logout',
        tags: ['Auth'],
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Logged out',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { message: { type: 'string' } },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/AuthError' },
        },
      },
    },

    '/auth/me': {
      get: {
        summary: 'Get current user',
        description: 'Returns the authenticated user. Used by the frontend to bootstrap auth state.',
        operationId: 'getMe',
        tags: ['Auth'],
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Authenticated user',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { user: { $ref: '#/components/schemas/User' } },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/AuthError' },
        },
      },
    },

    '/auth/forgot-password': {
      post: {
        summary: 'Request a password reset link',
        description:
          'Sends a password-reset email if the address is registered. Always returns 200 to prevent email enumeration. Rate-limited to 5 req/60 min per IP.',
        operationId: 'forgotPassword',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Always returned (prevents enumeration)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { message: { type: 'string' } },
                },
              },
            },
          },
          '429': { $ref: '#/components/responses/RateLimitError' },
        },
      },
    },

    '/auth/reset-password': {
      post: {
        summary: 'Reset password',
        description:
          'Resets the password using a token from the email link. Revokes all sessions on success. Rate-limited to 5 req/60 min per IP.',
        operationId: 'resetPassword',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token: { type: 'string' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Password reset — all sessions revoked',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { message: { type: 'string' } },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '429': { $ref: '#/components/responses/RateLimitError' },
        },
      },
    },

    '/auth/verify-email': {
      post: {
        summary: 'Verify email address',
        description: 'Activates the account using the token from the verification email.',
        operationId: 'verifyEmail',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token'],
                properties: {
                  token: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Email verified',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },

    '/auth/resend-verification': {
      post: {
        summary: 'Resend verification email',
        description: 'Sends a new verification email to the current user. Rate-limited to 5 req/60 min per IP.',
        operationId: 'resendVerification',
        tags: ['Auth'],
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Verification email sent',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { message: { type: 'string' } },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/AuthError' },
          '429': { $ref: '#/components/responses/RateLimitError' },
        },
      },
    },

  },

  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'pos_session',
        description: 'HttpOnly session cookie set on login.',
      },
    },
    parameters: {},
    responses: {
      AuthError: {
        description: 'Not authenticated',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      ForbiddenError: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      ValidationError: {
        description: 'Invalid request data',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      ConflictError: {
        description: 'Conflict — resource already exists',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      RateLimitError: {
        description: 'Too many requests',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['message', 'code'],
            properties: {
              message: { type: 'string' },
              code: { type: 'string' },
              details: { type: 'object' },
            },
          },
        },
      },
      ReadyResponse: {
        type: 'object',
        required: ['status', 'checks'],
        properties: {
          status: {
            type: 'string',
            enum: ['ready', 'not_ready'],
            example: 'ready',
          },
          checks: {
            type: 'object',
            required: ['postgres', 'redis'],
            properties: {
              postgres: { type: 'boolean' },
              redis: { type: 'boolean' },
            },
          },
        },
      },
      User: {
        type: 'object',
        required: ['id', 'name', 'email', 'status', 'createdAt'],
        properties: {
          id: { type: 'string', format: 'cuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'] },
          systemRole: { type: 'string', enum: ['SUPER_ADMIN'], nullable: true },
          publisherRole: { type: 'string', enum: ['PUBLISHER_OWNER', 'PUBLISHER_STAFF'], nullable: true },
          publisherId: { type: 'string', nullable: true },
          emailVerifiedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['publisherName', 'name', 'email', 'password'],
        properties: {
          publisherName: { type: 'string', minLength: 2, maxLength: 100 },
          name: { type: 'string', minLength: 1, maxLength: 100 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
    },
  },
};
