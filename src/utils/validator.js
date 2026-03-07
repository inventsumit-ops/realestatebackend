const Joi = require('joi');

const userValidation = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[+]?[\d\s-()]+$/).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('user', 'agent', 'admin').default('user')
});

const loginValidation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const propertyValidation = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(10).max(2000).required(),
  price: Joi.number().positive().required(),
  location: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  country: Joi.string().required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  property_type: Joi.string().valid('apartment', 'house', 'villa', 'condo', 'townhouse', 'commercial', 'land', 'studio').required(),
  bedrooms: Joi.number().integer().min(0).required(),
  bathrooms: Joi.number().integer().min(0).required(),
  area: Joi.number().positive().required(),
  area_unit: Joi.string().valid('sqft', 'sqm', 'sqyd', 'acre').default('sqft'),
  year_built: Joi.number().integer().min(1800).max(new Date().getFullYear() + 1),
  parking_spaces: Joi.number().integer().min(0).default(0),
  furnished: Joi.boolean().default(false),
  pet_friendly: Joi.boolean().default(false)
});

const agentValidation = Joi.object({
  license_number: Joi.string().required(),
  agency_name: Joi.string().min(2).max(200).required(),
  experience_years: Joi.number().integer().min(0).max(50).required(),
  specialties: Joi.array().items(Joi.string().valid('residential', 'commercial', 'luxury', 'rental', 'investment', 'new_construction')),
  languages: Joi.array().items(Joi.string().max(50)),
  service_areas: Joi.array().items(Joi.object({
    city: Joi.string().required(),
    state: Joi.string().required(),
    country: Joi.string().required()
  })),
  bio: Joi.string().max(1000),
  social_links: Joi.object({
    website: Joi.string().uri(),
    linkedin: Joi.string().uri(),
    facebook: Joi.string().uri(),
    instagram: Joi.string().uri(),
    twitter: Joi.string().uri()
  })
});

const inquiryValidation = Joi.object({
  property_id: Joi.string().required(),
  message: Joi.string().min(10).max(1000).required(),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
  contact_method: Joi.string().valid('email', 'phone', 'both').default('email'),
  preferred_contact_time: Joi.string()
});

const appointmentValidation = Joi.object({
  property_id: Joi.string().required(),
  agent_id: Joi.string().required(),
  appointment_date: Joi.date().iso().required(),
  duration: Joi.number().integer().min(15).default(60),
  notes: Joi.string().max(500)
});

const reviewValidation = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().min(10).max(1000).required(),
  communication_rating: Joi.number().integer().min(1).max(5),
  professionalism_rating: Joi.number().integer().min(1).max(5),
  knowledge_rating: Joi.number().integer().min(1).max(5)
});

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: errorMessage
      });
    }
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query);
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: 'Query validation error',
        error: errorMessage
      });
    }
    next();
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params);
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: 'Parameter validation error',
        error: errorMessage
      });
    }
    next();
  };
};

const objectIdValidation = Joi.object({
  id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
});

const paginationValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort_by: Joi.string(),
  sort_order: Joi.string().valid('asc', 'desc').default('desc')
});

const searchValidation = Joi.object({
  query: Joi.string().min(2).max(100),
  filters: Joi.object({
    property_type: Joi.array().items(Joi.string()),
    price_range: Joi.object({
      min: Joi.number().min(0),
      max: Joi.number().positive()
    }),
    bedrooms: Joi.number().integer().min(0),
    bathrooms: Joi.number().integer().min(0),
    area: Joi.number().min(0),
    city: Joi.string(),
    state: Joi.string(),
    amenities: Joi.array().items(Joi.string())
  })
});

module.exports = {
  userValidation,
  loginValidation,
  propertyValidation,
  agentValidation,
  inquiryValidation,
  appointmentValidation,
  reviewValidation,
  objectIdValidation,
  paginationValidation,
  searchValidation,
  validate,
  validateQuery,
  validateParams
};
