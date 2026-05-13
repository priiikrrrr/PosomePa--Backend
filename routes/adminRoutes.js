const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const HostApplication = require('../models/HostApplication');
const User = require('../models/User');
const emailService = require('../services/emailService');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_ALTERNATE_EMAIL = process.env.ADMIN_ALTERNATE_EMAIL;

//  session storage, consider redis before scaling
let adminSession = null;

const adminAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!adminSession || adminSession.token !== token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  req.admin = adminSession;
  next();
};

router.use(express.static(path.join(__dirname, '../public/admin')));
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if ((email === ADMIN_EMAIL || email === ADMIN_ALTERNATE_EMAIL) && password === ADMIN_PASSWORD) {
      const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
      adminSession = { email, role: 'admin', token };
      
      return res.json({ 
        success: true, 
        token,
        email,
        message: 'Login successful' 
      });
    }
    
    res.status(401).json({ message: 'Invalid credentials' });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

router.post('/logout', (req, res) => {
  adminSession = null;
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (adminSession && adminSession.token === token) {
    return res.json({ 
      authenticated: true, 
      email: adminSession.email 
    });
  }
  
  res.json({ authenticated: false });
});

router.get('/stats', adminAuth, async (req, res) => {
  try {
    const stats = {
      totalApplications: await HostApplication.countDocuments(),
      pending: await HostApplication.countDocuments({ status: 'pending' }),
      verified: await HostApplication.countDocuments({ status: 'verified' }),
      rejected: await HostApplication.countDocuments({ status: 'rejected' }),
      totalUsers: await User.countDocuments({ role: { $ne: 'admin' } }),
      verifiedHosts: await User.countDocuments({ hostApplicationStatus: 'verified' })
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Failed to get stats' });
  }
});

// sari applications with papgination
router.get('/applications', adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const applications = await HostApplication.find(query)
      .populate('user', 'name email phone avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await HostApplication.countDocuments(query);

    res.json({
      applications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ message: 'Failed to get applications' });
  }
});

router.get('/applications/:id', adminAuth, async (req, res) => {
  try {
    const application = await HostApplication.findById(req.params.id)
      .populate('user', 'name email phone avatar');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json({ application });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ message: 'Failed to get application' });
  }
});

// Approval & rejection route 
router.post('/applications/:id/approve', adminAuth, async (req, res) => {
  try {
    const application = await HostApplication.findById(req.params.id)
      .populate('user', 'name email');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Application has already been processed. Current status: ' + application.status 
      });
    }

    application.status = 'verified';
    application.verifiedAt = new Date();
    application.reviewedAt = new Date();
    await application.save();

    await User.findByIdAndUpdate(application.user._id, { 
      hostApplicationStatus: 'verified',
      role: 'host'
    });

    await emailService.sendApprovalEmail(application.email, application.fullName);

    res.json({
      success: true,
      message: 'Application approved and email sent',
      application
    });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ message: 'Failed to approve application' });
  }
});
router.post('/applications/:id/reject', adminAuth, async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const application = await HostApplication.findById(req.params.id)
      .populate('user', 'name email');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Application has already been processed. Current status: ' + application.status 
      });
    }
    application.status = 'rejected';
    application.rejectionReason = reason;
    application.rejectedAt = new Date();
    application.reviewedAt = new Date();
    application.canResubmitAt = new Date(Date.now() + 14 * 60 * 60 * 1000);
    await application.save();

    await User.findByIdAndUpdate(application.user._id, { 
      hostApplicationStatus: 'rejected'
    });

    await emailService.sendRejectionEmail(application.email, application.fullName, reason);

    res.json({
      success: true,
      message: 'Application rejected and email sent',
      application
    });
  } catch (error) {
    console.error('Reject error:', error);
    res.status(500).json({ message: 'Failed to reject application' });
  }
});

module.exports = router;
