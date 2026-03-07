# Real Estate Backend - ER Diagram Summary

## Overview
This document summarizes the Entity Relationship Diagram for the comprehensive Real Estate Backend System. The system consists of **25 database models** with complex relationships supporting all major real estate platform features.

## Core Entities

### User Management
- **User**: Main user table with authentication and basic profile information
- **UserProfile**: Extended user profile with personal details and preferences
- **Role**: User roles for RBAC (Role-Based Access Control)
- **Permission**: Granular permissions for system access
- **RolePermission**: Many-to-many relationship between roles and permissions

### Property System
- **Property**: Core property listings with all details (location, price, features)
- **PropertyImage**: Multiple images per property with primary image support
- **PropertyVideo**: Video tours and property videos
- **Amenity**: Available amenities (pool, gym, parking, etc.)
- **PropertyAmenity**: Many-to-many relationship between properties and amenities
- **PropertyView**: Tracking property views and analytics

### Agent Management
- **Agent**: Professional agent profiles with licensing and specialties
- **AgentReview**: Ratings and reviews for agents

### User Interactions
- **Favorite**: User's favorite/saved properties
- **PropertyReview**: Property ratings and reviews by users
- **Inquiry**: Property inquiries from potential buyers/renters
- **Appointment**: Property viewing appointments
- **Message**: Internal messaging system between users and agents

### Content Management
- **Blog**: Blog posts and articles
- **BlogCategory**: Blog categorization with hierarchical support
- **BlogComment**: Comments on blog posts with threading support

### Marketing & Features
- **FeaturedProperty**: Paid featured property listings
- **Advertisement**: Platform advertisements and banners

### System & Analytics
- **Notification**: User notifications for various events
- **ActivityLog**: Comprehensive audit trail of all user actions

## Key Relationships

### One-to-One Relationships
- User ↔ UserProfile (each user has one profile)
- User ↔ Agent (users can optionally be agents)

### One-to-Many Relationships
- Agent → Properties (agents list multiple properties)
- Property → PropertyImages (properties have multiple images)
- Property → PropertyVideos (properties can have multiple videos)
- Property → PropertyAmenities (properties have multiple amenities)
- User → Favorites (users can favorite multiple properties)
- User → PropertyReviews (users can review multiple properties)
- User → AgentReviews (users can review multiple agents)
- User → Appointments (users can book multiple appointments)
- Blog → BlogComments (blog posts have multiple comments)

### Many-to-Many Relationships
- Property ↔ Amenity (via PropertyAmenity junction table)
- Role ↔ Permission (via RolePermission junction table)

## Database Schema Features

### Security & Authentication
- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing and reset tokens
- Email verification system

### Data Integrity
- Foreign key constraints with references
- Unique constraints on emails, license numbers, slugs
- Required field validations
- Enum constraints for status fields

### Performance Optimization
- Comprehensive indexing strategy
- Text search indexes for property search
- Composite indexes for common queries
- Pagination support

### Audit & Analytics
- Activity logging for all user actions
- Property view tracking
- Review and rating systems
- Notification system

## Entity Statistics
- **Total Models**: 25
- **User-related Models**: 7 (User, UserProfile, Agent, Favorite, PropertyReview, AgentReview, ActivityLog)
- **Property-related Models**: 8 (Property, PropertyImage, PropertyVideo, Amenity, PropertyAmenity, PropertyView, FeaturedProperty, PropertyReview)
- **Communication Models**: 4 (Inquiry, Appointment, Message, Notification)
- **Content Models**: 3 (Blog, BlogCategory, BlogComment)
- **System Models**: 3 (Role, Permission, RolePermission, Advertisement)

## Key Features Supported

### Property Management
- CRUD operations for properties
- Image and video uploads
- Amenities management
- Featured property system
- Advanced search and filtering

### User Management
- Registration and authentication
- Profile management
- Role-based permissions
- Activity tracking

### Agent Services
- Agent verification system
- Property listings management
- Client communication
- Performance tracking

### Communication
- Property inquiries
- Appointment scheduling
- Real-time messaging
- Email notifications

### Content & Marketing
- Blog management
- Advertisement system
- Featured listings
- SEO optimization

## Technical Implementation

### Database: MongoDB
- Document-based NoSQL database
- Flexible schema design
- Horizontal scaling support
- Rich query capabilities

### File Storage: AWS S3
- Image and video storage
- CDN integration
- Secure file access

### Backend: Node.js + Express
- RESTful API architecture
- Middleware-based security
- Comprehensive error handling
- Production-ready configuration

## Generated Files

1. **er-diagram.png**: Visual ER diagram image
2. **er-diagram.puml**: PlantUML source code for the diagram
3. **ER-Diagram-Summary.md**: This summary document

The ER diagram provides a complete visual representation of all database relationships and is suitable for:
- Database design documentation
- Developer onboarding
- System architecture planning
- Client presentations
