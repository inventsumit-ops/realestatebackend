const crypto = require('crypto');
const slugify = require('slugify');
const moment = require('moment');

const generateSlug = (text) => {
  return slugify(text, {
    lower: true,
    strict: true,
    trim: true
  });
};

const generateRandomToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

const formatPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
};

const filterPropertiesWithinRadius = (properties, centerLat, centerLon, radiusKm) => {
  return properties.filter(property => {
    const distance = calculateDistance(
      centerLat, centerLon,
      property.latitude, property.longitude
    );
    return distance <= radiusKm;
  });
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

const escapeRegex = (string) => {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    result[group] = result[group] || [];
    result[group].push(item);
    return result;
  }, {});
};

const sortByKey = (array, key, order = 'asc') => {
  return array.sort((a, b) => {
    if (order === 'desc') {
      return b[key] > a[key] ? 1 : -1;
    }
    return a[key] > b[key] ? 1 : -1;
  });
};

const uniqueArray = (array) => {
  return [...new Set(array)];
};

const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

const flattenObject = (obj, prefix = '') => {
  let flattened = {};
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(flattened, flattenObject(obj[key], newKey));
      } else {
        flattened[newKey] = obj[key];
      }
    }
  }
  return flattened;
};

const pick = (obj, keys) => {
  return keys.reduce((result, key) => {
    if (obj && obj.hasOwnProperty(key)) {
      result[key] = obj[key];
    }
    return result;
  }, {});
};

const omit = (obj, keys) => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

const isEmpty = (value) => {
  if (value == null) return true;
  if (Array.isArray(value) || typeof value === 'string') return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

const isEqual = (a, b) => {
  return JSON.stringify(a) === JSON.stringify(b);
};

const cloneDeep = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

const formatDate = (date, format = 'YYYY-MM-DD') => {
  return moment(date).format(format);
};

const timeAgo = (date) => {
  return moment(date).fromNow();
};

const isFutureDate = (date) => {
  return moment(date).isAfter(moment());
};

const isPastDate = (date) => {
  return moment(date).isBefore(moment());
};

const addDays = (date, days) => {
  return moment(date).add(days, 'days').toDate();
};

const subtractDays = (date, days) => {
  return moment(date).subtract(days, 'days').toDate();
};

const getDaysBetween = (startDate, endDate) => {
  return moment(endDate).diff(moment(startDate), 'days');
};

const generatePasswordResetToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hashedToken };
};

const verifyPasswordResetToken = (token, hashedToken) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return tokenHash === hashedToken;
};

const maskEmail = (email) => {
  const [username, domain] = email.split('@');
  const maskedUsername = username.slice(0, 2) + '*'.repeat(username.length - 2);
  return `${maskedUsername}@${domain}`;
};

const maskPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length >= 4) {
    return `***-***-${cleaned.slice(-4)}`;
  }
  return phone;
};

const generateReferenceNumber = (prefix = 'REF') => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}${timestamp}${random}`;
};

const calculateAge = (birthDate) => {
  return moment().diff(moment(birthDate), 'years');
};

const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

const extractFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

module.exports = {
  generateSlug,
  generateRandomToken,
  formatCurrency,
  formatPhoneNumber,
  calculateDistance,
  filterPropertiesWithinRadius,
  sanitizeInput,
  escapeRegex,
  createError,
  asyncForEach,
  groupBy,
  sortByKey,
  uniqueArray,
  chunkArray,
  flattenObject,
  pick,
  omit,
  isEmpty,
  isEqual,
  cloneDeep,
  debounce,
  throttle,
  formatDate,
  timeAgo,
  isFutureDate,
  isPastDate,
  addDays,
  subtractDays,
  getDaysBetween,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  maskEmail,
  maskPhone,
  generateReferenceNumber,
  calculateAge,
  isValidUrl,
  extractFileExtension,
  formatFileSize
};
