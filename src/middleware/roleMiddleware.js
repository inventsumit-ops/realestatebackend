const Role = require('../models/Role');
const Permission = require('../models/Permission');
const RolePermission = require('../models/RolePermission');

const checkPermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (req.user.role === 'admin') {
        return next();
      }

      const userRole = await Role.findOne({ role_name: req.user.role });
      if (!userRole) {
        return res.status(403).json({
          success: false,
          message: 'User role not found'
        });
      }

      const permission = await Permission.findOne({ permission_name: permissionName });
      if (!permission) {
        return res.status(403).json({
          success: false,
          message: 'Permission not found'
        });
      }

      const hasPermission = await RolePermission.findOne({
        role_id: userRole._id,
        permission_id: permission._id
      });

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Insufficient permissions. Required: ${permissionName}`
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Permission check failed',
        error: error.message
      });
    }
  };
};

const requireAgent = (req, res, next) => {
  if (req.user.role !== 'agent' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Agent access required'
    });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

module.exports = { checkPermission, requireAgent, requireAdmin };
