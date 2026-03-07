# Real Estate Platform Backend

A comprehensive backend API for a real estate platform built with Node.js, Express, and MongoDB. This backend provides a complete set of features for property listings, user management, agent services, inquiries, appointments, and more.

## 🚀 Features

- **User Management**: Registration, authentication, profile management
- **Agent Services**: Agent verification, property management, reviews
- **Property Listings**: CRUD operations, search, filtering, image uploads
- **Communication**: Messaging system, inquiries, appointments
- **Reviews & Ratings**: Property and agent reviews with ratings
- **Favorites**: Save and manage favorite properties
- **Notifications**: Real-time notifications for various activities
- **Admin Panel**: Complete admin dashboard with analytics
- **File Uploads**: AWS S3 integration for media storage
- **Security**: JWT authentication, role-based access control

## 📋 API Endpoints

### Authentication (10 endpoints)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password/:token` - Reset password
- `GET /api/auth/verify-email/:token` - Verify email
- `POST /api/auth/resend-otp` - Resend verification email
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/update-profile` - Update profile
- `DELETE /api/auth/delete-account` - Delete account

### Users (12 endpoints)
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)
- `GET /api/users/favorites` - Get user favorites
- `POST /api/users/favorites` - Add to favorites
- `DELETE /api/users/favorites/:id` - Remove from favorites
- `GET /api/users/appointments` - Get user appointments
- `POST /api/users/appointments` - Create appointment
- `GET /api/users/inquiries` - Get user inquiries
- `POST /api/users/reviews` - Create review
- `GET /api/users/notifications` - Get notifications

### Properties (30+ endpoints)
- `POST /api/properties` - Create property
- `GET /api/properties` - Get all properties
- `GET /api/properties/:id` - Get property by ID
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property
- `GET /api/properties/search` - Search properties
- `GET /api/properties/featured` - Get featured properties
- `GET /api/properties/latest` - Get latest properties
- `POST /api/properties/:id/images` - Upload property images
- `POST /api/properties/:id/amenities` - Add property amenities
- `GET /api/properties/:id/reviews` - Get property reviews
- `POST /api/properties/:id/reviews` - Create property review
- `POST /api/properties/:id/contact` - Contact agent

### Agents (15+ endpoints)
- `POST /api/agents/register` - Register as agent
- `GET /api/agents` - Get all agents
- `GET /api/agents/:id` - Get agent by ID
- `PUT /api/agents/:id` - Update agent profile
- `DELETE /api/agents/:id` - Delete agent
- `GET /api/agents/:id/properties` - Get agent properties
- `GET /api/agents/:id/reviews` - Get agent reviews
- `POST /api/agents/:id/reviews` - Create agent review
- `GET /api/agents/:id/appointments` - Get agent appointments
- `GET /api/agents/:id/inquiries` - Get agent inquiries
- `POST /api/agents/:id/verify` - Verify agent (admin only)
- `GET /api/agents/top` - Get top agents
- `GET /api/agents/:id/stats` - Get agent statistics

### Communication (10+ endpoints)
- `POST /api/inquiries` - Create inquiry
- `GET /api/inquiries` - Get inquiries
- `GET /api/inquiries/:id` - Get inquiry by ID
- `PUT /api/inquiries/:id` - Update inquiry
- `DELETE /api/inquiries/:id` - Delete inquiry
- `POST /api/messages` - Send message
- `GET /api/messages` - Get messages
- `GET /api/messages/:conversationId` - Get conversation
- `DELETE /api/messages/:id` - Delete message
- `GET /api/messages/unread` - Get unread messages

### Appointments (8+ endpoints)
- `GET /api/appointments` - Get appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment
- `GET /api/appointments/availability` - Get agent availability
- `GET /api/appointments/stats` - Get appointment statistics
- `PUT /api/appointments/:id/reschedule` - Reschedule appointment

### Admin (20+ endpoints)
- `GET /api/admin/dashboard` - Get dashboard data
- `GET /api/admin/users` - Get all users
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/properties` - Get all properties
- `PUT /api/admin/properties/:id/approve` - Approve property
- `PUT /api/admin/properties/:id/reject` - Reject property
- `DELETE /api/admin/properties/:id` - Delete property
- `GET /api/admin/agents` - Get all agents
- `PUT /api/admin/agents/:id/verify` - Verify agent
- `GET /api/admin/reports` - Get reports
- `GET /api/admin/analytics` - Get analytics
- `GET /api/admin/logs` - Get activity logs
- `POST /api/admin/ads` - Create advertisement
- `GET /api/admin/ads` - Get advertisements
- `PUT /api/admin/ads/:id` - Update advertisement
- `DELETE /api/admin/ads/:id` - Delete advertisement
- `POST /api/admin/blogs` - Create blog
- `GET /api/admin/settings` - Get settings
- `PUT /api/admin/settings` - Update settings

## 🛠️ Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **AWS S3** - File storage
- **Nodemailer** - Email service
- **Multer** - File upload handling
- **Joi** - Input validation
- **Bcryptjs** - Password hashing

## 📦 Database Schema

### User Tables
- `users` - Basic user information
- `user_profiles` - Extended user profiles

### Property Tables
- `properties` - Property listings
- `property_images` - Property images
- `property_videos` - Property videos
- `property_amenities` - Property-amenity relationships
- `amenities` - Available amenities

### Interaction Tables
- `favorites` - User favorites
- `property_reviews` - Property reviews
- `property_views` - Property view tracking

### Communication Tables
- `inquiries` - Property inquiries
- `appointments` - Property appointments
- `messages` - User messages

### Agent Tables
- `agents` - Agent information
- `agent_reviews` - Agent reviews

### Marketing Tables
- `featured_properties` - Featured property listings
- `advertisements` - Platform advertisements

### Content Tables
- `blogs` - Blog posts
- `blog_categories` - Blog categories
- `blog_comments` - Blog comments

### System Tables
- `notifications` - User notifications
- `roles` - User roles
- `permissions` - System permissions
- `role_permissions` - Role-permission relationships
- `activity_logs` - Activity tracking

## 🚀 Getting Started

### Prerequisites
- Node.js 16.0 or higher
- MongoDB 4.4 or higher
- AWS S3 account (for file storage)
- SMTP server (for email)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd real-estate-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/real_estate

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=30d

   # AWS S3 Configuration
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=your_s3_bucket_name

   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_password
   ```

4. **Start the database**
   ```bash
   # Make sure MongoDB is running
   mongod
   ```

5. **Run the server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📝 API Documentation

### Authentication
All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Error Responses
All error responses follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information (in development mode)"
}
```

### Success Responses
Success responses follow this format:
```json
{
  "success": true,
  "message": "Success message",
  "data": {...}
}
```

### Pagination
Paginated responses include pagination information:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Different access levels for users, agents, and admins
- **Input Validation**: Comprehensive input validation using Joi
- **Rate Limiting**: API rate limiting to prevent abuse
- **Password Hashing**: Secure password hashing with bcrypt
- **CORS Protection**: Cross-origin resource sharing protection
- **Helmet.js**: Security headers and protections

## 📁 Project Structure

```
real-estate-backend/
├── src/
│   ├── config/
│   │   ├── db.js              # Database configuration
│   │   └── jwt.js             # JWT configuration
│   ├── controllers/
│   │   ├── authController.js  # Authentication controller
│   │   ├── userController.js  # User controller
│   │   ├── propertyController.js # Property controller
│   │   ├── agentController.js # Agent controller
│   │   ├── inquiryController.js # Inquiry controller
│   │   ├── reviewController.js # Review controller
│   │   ├── favoriteController.js # Favorite controller
│   │   ├── appointmentController.js # Appointment controller
│   │   └── adminController.js # Admin controller
│   ├── middleware/
│   │   ├── authMiddleware.js  # Authentication middleware
│   │   ├── roleMiddleware.js  # Role-based access middleware
│   │   └── errorMiddleware.js # Error handling middleware
│   ├── models/
│   │   ├── User.js            # User model
│   │   ├── UserProfile.js     # User profile model
│   │   ├── Property.js        # Property model
│   │   ├── PropertyImage.js   # Property image model
│   │   ├── PropertyVideo.js   # Property video model
│   │   ├── PropertyAmenity.js # Property amenity model
│   │   ├── Amenity.js         # Amenity model
│   │   ├── Favorite.js        # Favorite model
│   │   ├── PropertyReview.js  # Property review model
│   │   ├── PropertyView.js    # Property view model
│   │   ├── Inquiry.js         # Inquiry model
│   │   ├── Appointment.js     # Appointment model
│   │   ├── Message.js         # Message model
│   │   ├── Agent.js           # Agent model
│   │   ├── AgentReview.js     # Agent review model
│   │   ├── FeaturedProperty.js # Featured property model
│   │   ├── Advertisement.js   # Advertisement model
│   │   ├── Blog.js            # Blog model
│   │   ├── BlogCategory.js    # Blog category model
│   │   ├── BlogComment.js     # Blog comment model
│   │   ├── Notification.js    # Notification model
│   │   ├── Role.js            # Role model
│   │   ├── Permission.js      # Permission model
│   │   ├── RolePermission.js  # Role permission model
│   │   └── ActivityLog.js     # Activity log model
│   ├── routes/
│   │   ├── authRoutes.js      # Authentication routes
│   │   ├── userRoutes.js      # User routes
│   │   ├── propertyRoutes.js  # Property routes
│   │   ├── agentRoutes.js     # Agent routes
│   │   ├── inquiryRoutes.js   # Inquiry routes
│   │   ├── reviewRoutes.js    # Review routes
│   │   ├── favoriteRoutes.js  # Favorite routes
│   │   ├── appointmentRoutes.js # Appointment routes
│   │   ├── messageRoutes.js   # Message routes
│   │   └── adminRoutes.js     # Admin routes
│   ├── services/
│   │   ├── emailService.js    # Email service
│   │   └── notificationService.js # Notification service
│   └── utils/
│       ├── pagination.js      # Pagination utilities
│       ├── validator.js       # Input validation
│       └── helpers.js         # Helper functions
├── .env.example               # Environment variables example
├── package.json               # Package dependencies
├── server.js                  # Server entry point
└── README.md                  # Project documentation
```

## 🚀 Deployment

### Environment Variables
Make sure to set the following environment variables in production:

- `NODE_ENV=production`
- `MONGODB_URI` - Production MongoDB connection string
- `JWT_SECRET` - Secure JWT secret
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `EMAIL_USER` - SMTP email user
- `EMAIL_PASS` - SMTP email password

### Production Build
```bash
# Install production dependencies
npm ci --only=production

# Start production server
npm start
```

## 📊 Monitoring & Logging

- **Morgan**: HTTP request logging
- **Activity Logs**: User activity tracking
- **Error Handling**: Comprehensive error handling and logging
- **Health Check**: `/api/health` endpoint for monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions, please contact:
- Email: support@realestateplatform.com
- Documentation: [API Documentation](https://docs.realestateplatform.com)

## 🔄 Version History

- **1.0.0** - Initial release with complete real estate platform functionality
- Full CRUD operations for all entities
- Authentication and authorization system
- File upload with AWS S3
- Email notifications
- Admin dashboard
- Real-time messaging
- Review and rating system
