const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/ApiError');

function generateToken(user) {
  const payload = {
    sub: user.id,
    role: user.role,
  };
  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
  return token;
}

async function register({ email, password, name, role }) {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new ApiError(400, 'Email already in use');
  }
  const hash = await bcrypt.hash(password, 10);
  const user = await userRepository.createUser({
    email,
    password: hash,
    name,
    role: role || 'ATTENDEE',
  });
  const token = generateToken(user);
  return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token };
}

async function login({ email, password }) {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new ApiError(401, 'Invalid credentials');
  }
  const token = generateToken(user);
  return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token };
}

async function getProfile(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

module.exports = {
  register,
  login,
  getProfile,
};

