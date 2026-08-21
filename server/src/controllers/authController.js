const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

// Helper to sign JWT valid for 7 days
const signJWT = (user) => {
  return jwt.sign(
    { userId: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'supersecretjwtkey12345!@#$',
    { expiresIn: '7d' }
  );
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  const { email, password, name, role, flatNumber, phone } = req.body;

  try {
    if (!email || !password || !name || !role) {
      return res.status(400).json({ message: 'Missing required registration parameters' });
    }

    const formattedRole = role.toUpperCase();
    if (formattedRole !== 'ADMIN' && formattedRole !== 'RESIDENT') {
      return res.status(400).json({ message: 'Invalid role selection' });
    }

    if (formattedRole === 'RESIDENT' && !flatNumber) {
      return res.status(400).json({ message: 'Flat number is required for residents' });
    }

    // Check if email already registered
    const userExists = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password with salt rounds = 10
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role: formattedRole,
        flatNumber: formattedRole === 'RESIDENT' ? flatNumber : null,
        phone,
      },
    });

    const token = signJWT(user);

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        flatNumber: user.flatNumber,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * @desc    Authenticate user and issue JWT
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = signJWT(user);

      return res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          flatNumber: user.flatNumber,
          phone: user.phone,
        },
      });
    }

    return res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * @desc    Get current user profile details
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        flatNumber: true,
        phone: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    console.error('Fetch profile details error:', error);
    return res.status(500).json({ message: 'Server error retrieving profile' });
  }
};

module.exports = {
  register,
  login,
  getMe,
};
