import { VALIDATION_RULES } from './constants';

export const validators = {
  required: (value, message = 'This field is required') => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return message;
    }
    return null;
  },

  email: (value, message = 'Please enter a valid email address') => {
    if (!value) return null;
    if (!VALIDATION_RULES.EMAIL_REGEX.test(value)) {
      return message;
    }
    return null;
  },

  phone: (value, message = 'Please enter a valid phone number') => {
    if (!value) return null;
    if (!VALIDATION_RULES.PHONE_REGEX.test(value)) {
      return message;
    }
    return null;
  },

  minLength: (min, message) => (value) => {
    if (!value) return null;
    if (value.length < min) {
      return message || `Must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (max, message) => (value) => {
    if (!value) return null;
    if (value.length > max) {
      return message || `Must be no more than ${max} characters`;
    }
    return null;
  },

  exactLength: (length, message) => (value) => {
    if (!value) return null;
    if (value.length !== length) {
      return message || `Must be exactly ${length} characters`;
    }
    return null;
  },

  pattern: (regex, message) => (value) => {
    if (!value) return null;
    if (!regex.test(value)) {
      return message || 'Invalid format';
    }
    return null;
  },

  numeric: (value, message = 'Must be a number') => {
    if (!value) return null;
    if (isNaN(Number(value))) {
      return message;
    }
    return null;
  },

  integer: (value, message = 'Must be an integer') => {
    if (!value) return null;
    if (!Number.isInteger(Number(value))) {
      return message;
    }
    return null;
  },

  positive: (value, message = 'Must be positive') => {
    if (!value) return null;
    if (Number(value) <= 0) {
      return message;
    }
    return null;
  },

  nonNegative: (value, message = 'Must be zero or positive') => {
    if (!value) return null;
    if (Number(value) < 0) {
      return message;
    }
    return null;
  },

  min: (min, message) => (value) => {
    if (!value) return null;
    if (Number(value) < min) {
      return message || `Must be at least ${min}`;
    }
    return null;
  },

  max: (max, message) => (value) => {
    if (!value) return null;
    if (Number(value) > max) {
      return message || `Must be no more than ${max}`;
    }
    return null;
  },

  range: (min, max, message) => (value) => {
    if (!value) return null;
    const num = Number(value);
    if (num < min || num > max) {
      return message || `Must be between ${min} and ${max}`;
    }
    return null;
  },

  url: (value, message = 'Please enter a valid URL') => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return message;
    }
  },

  date: (value, message = 'Please enter a valid date') => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return message;
    }
    return null;
  },

  futureDate: (value, message = 'Date must be in the future') => {
    if (!value) return null;
    const date = new Date(value);
    const now = new Date();
    if (date <= now) {
      return message;
    }
    return null;
  },

  pastDate: (value, message = 'Date must be in the past') => {
    if (!value) return null;
    const date = new Date(value);
    const now = new Date();
    if (date >= now) {
      return message;
    }
    return null;
  },

  password: (value) => {
    if (!value) return null;
    const errors = [];
    
    if (value.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
      errors.push(`at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`);
    }
    
    if (!/[a-z]/.test(value)) {
      errors.push('one lowercase letter');
    }
    
    if (!/[A-Z]/.test(value)) {
      errors.push('one uppercase letter');
    }
    
    if (!/\d/.test(value)) {
      errors.push('one number');
    }
    
    if (errors.length > 0) {
      return `Password must contain ${errors.join(', ')}`;
    }
    
    return null;
  },

  confirmPassword: (password, message = 'Passwords do not match') => (value) => {
    if (!value) return null;
    if (value !== password) {
      return message;
    }
    return null;
  },

  oneOf: (allowedValues, message) => (value) => {
    if (!value) return null;
    if (!allowedValues.includes(value)) {
      return message || `Must be one of: ${allowedValues.join(', ')}`;
    }
    return null;
  },

  notOneOf: (disallowedValues, message) => (value) => {
    if (!value) return null;
    if (disallowedValues.includes(value)) {
      return message || `Cannot be any of: ${disallowedValues.join(', ')}`;
    }
    return null;
  },

  file: (file, allowedTypes, maxSizeMB = 5, message) => {
    if (!file) return null;
    
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      return message || `File type must be one of: ${allowedTypes.join(', ')}`;
    }
    
    if (file.size > maxSizeMB * 1024 * 1024) {
      return message || `File size must be less than ${maxSizeMB}MB`;
    }
    
    return null;
  },

  compose: (...validators) => (value) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return null;
  },
};

export const createValidator = (rules) => {
  return (value) => {
    for (const rule of rules) {
      const error = rule(value);
      if (error) return error;
    }
    return null;
  };
};

export const validateField = (value, rules) => {
  for (const rule of rules) {
    const error = typeof rule === 'function' ? rule(value) : validators[rule](value);
    if (error) return error;
  }
  return null;
};

export const validateForm = (data, schema) => {
  const errors = {};
  
  Object.keys(schema).forEach(field => {
    const value = data[field];
    const rules = schema[field];
    const error = validateField(value, rules);
    if (error) {
      errors[field] = error;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
