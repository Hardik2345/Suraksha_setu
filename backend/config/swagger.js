const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Suraksha Setu API Documentation',
      version: '1.0.0',
      description: 'Comprehensive API documentation for Suraksha Setu disaster management platform',
      contact: {
        name: 'Suraksha Setu Team',
        email: 'support@surakshasetu.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development server' },
      { url: 'https://api.surakshasetu.com', description: 'Production server' }
    ],
    tags: [
      { name: 'Authentication', description: 'User authentication and authorization endpoints' },
      { name: 'SOS', description: 'Emergency SOS reporting and management' },
      { name: 'Resources', description: 'Emergency resource management (hospitals, shelters, etc.)' },
      { name: 'Alerts', description: 'Alert broadcasting and notification system' },
      { name: 'Dashboard', description: 'Dashboard data and statistics' }
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session-based authentication using Passport.js (cookie)'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['name', 'email', 'password', 'role'],
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', minLength: 2 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            phone: { type: 'string', pattern: '^[0-9]{10}$' },
            role: { type: 'string', enum: ['citizen', 'admin'] },
            location: {
              type: 'object',
              properties: { lat: { type: 'number' }, lng: { type: 'number' }, address: { type: 'string' } }
            },
            createdAt: { type: 'string', format: 'date-time' },
            isActive: { type: 'boolean', default: true }
          }
        },
        SOS: {
          type: 'object',
          required: ['userId', 'type', 'severity', 'description', 'location'],
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            type: { type: 'string', enum: ['flood','fire','earthquake','medical','accident','other'] },
            severity: { type: 'string', enum: ['low','medium','high','critical'] },
            status: { type: 'string', enum: ['pending','acknowledged','in-progress','resolved'], default: 'pending' },
            description: { type: 'string', maxLength: 500 },
            location: { type: 'object', properties: { lat: { type: 'number' }, lng: { type: 'number' }, address: { type: 'string' } } },
            contactNumber: { type: 'string', pattern: '^[0-9]{10}$' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Resource: {
          type: 'object',
          required: ['name','type','location','contact'],
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string', enum: ['hospital','shelter','fire-station','police-station','community-center','relief-camp'] },
            location: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['Point'] },
                coordinates: { type: 'array', items: { type: 'number' }, description: '[longitude, latitude]' },
                address: { type: 'string' }, city: { type: 'string' }, state: { type: 'string' }, pincode: { type: 'string' }
              }
            },
            contact: { type: 'object', properties: { phone: { type: 'string', pattern: '^[0-9]{10}$' }, email: { type: 'string', format: 'email' }, website: { type: 'string', format: 'uri' } } },
            services: { type: 'array', items: { type: 'string' } },
            capacity: { type: 'number', minimum: 0 },
            currentOccupancy: { type: 'number', minimum: 0, default: 0 },
            operatingHours: { type: 'string', default: '24/7' },
            isActive: { type: 'boolean', default: true },
            createdBy: { type: 'string' }, createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Alert: {
          type: 'object',
          required: ['title','message','type','createdBy'],
          properties: {
            _id: { type: 'string' },
            title: { type: 'string', maxLength: 100 },
            message: { type: 'string', maxLength: 500 },
            severity: { type: 'string', enum: ['info','warning','danger','critical'], default: 'info' },
            type: { type: 'string', enum: ['weather','disaster','health','security','general'] },
            targetAudience: { type: 'string', enum: ['all','location-based','admin-only'], default: 'all' },
            location: { type: 'object', properties: { type: { type: 'string', enum: ['Point'] }, coordinates: { type: 'array', items: { type: 'number' } }, radius: { type: 'number' }, city: { type: 'string' }, state: { type: 'string' } } },
            isActive: { type: 'boolean', default: true },
            createdBy: { type: 'string' }, createdAt: { type: 'string', format: 'date-time' }, expiresAt: { type: 'string', format: 'date-time' }, readBy: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js', './models/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
