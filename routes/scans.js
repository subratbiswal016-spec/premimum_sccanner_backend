const express = require('express');
const Scan = require('../models/Scan');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Helper: build adminId filter based on user role
function getAdminFilter(user, userId) {
  if (user.role === 'super_admin') return {};
  if (user.role === 'admin') return { adminId: userId };
  // user role
  return { adminId: user.createdBy };
}

// GET /api/scans — Get all scans (with optional filters)
// Query params: date, search, startDate, endDate
router.get('/', auth, async (req, res) => {
  try {
    const { date, search, startDate, endDate } = req.query;
    let query = { ...getAdminFilter(req.user, req.userId) };

    if (date) {
      query.date = date;
    }

    if (search) {
      query.moduleId = { $regex: search, $options: 'i' };
    }

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const scans = await Scan.find(query).sort({ createdAt: -1 });
    res.json(scans);
  } catch (error) {
    console.error('Get scans error:', error);
    res.status(500).json({ message: 'Server error fetching scans.' });
  }
});

// GET /api/scans/dates — Get all distinct dates that have scan data
router.get('/dates', auth, async (req, res) => {
  try {
    const filter = getAdminFilter(req.user, req.userId);
    const dates = await Scan.distinct('date', filter);
    res.json(dates);
  } catch (error) {
    console.error('Get dates error:', error);
    res.status(500).json({ message: 'Server error fetching dates.' });
  }
});

// GET /api/scans/duplicates/:moduleId — Check if a module ID is duplicated
router.get('/duplicates/:moduleId', auth, async (req, res) => {
  try {
    const filter = { ...getAdminFilter(req.user, req.userId), moduleId: req.params.moduleId };
    const count = await Scan.countDocuments(filter);
    res.json({ isDuplicate: count > 1 });
  } catch (error) {
    console.error('Duplicate check error:', error);
    res.status(500).json({ message: 'Server error checking duplicates.' });
  }
});

// GET /api/scans/exists/:moduleId — Check if a module ID already exists in the database
router.get('/exists/:moduleId', auth, async (req, res) => {
  try {
    const filter = { ...getAdminFilter(req.user, req.userId), moduleId: req.params.moduleId };
    const count = await Scan.countDocuments(filter);
    res.json({ exists: count > 0 });
  } catch (error) {
    console.error('Exists check error:', error);
    res.status(500).json({ message: 'Server error checking existence.' });
  }
});

// POST /api/scans — Create a new scan record
router.post('/', auth, async (req, res) => {
  try {
    const { date, time, moduleId, jobCard, station, operatorName, reason } = req.body;

    if (!date || !moduleId || !jobCard || !station || !operatorName) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const scan = new Scan({
      date,
      time: time || '',
      moduleId,
      jobCard,
      station,
      operatorName,
      reason: reason || '',
      savedBy: req.user.username,
      savedByUserId: req.userId,
      adminId: req.user.role === 'user' ? req.user.createdBy : req.userId,
    });

    await scan.save();
    res.status(201).json(scan);
  } catch (error) {
    console.error('Create scan error:', error);
    res.status(500).json({ message: 'Server error creating scan.' });
  }
});

// DELETE /api/scans/:id — Admin only: delete a scan record
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.id);
    if (!scan) {
      return res.status(404).json({ message: 'Scan record not found.' });
    }

    // Admins can only delete scans in their own group
    if (req.user.role === 'admin' && scan.adminId && scan.adminId.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only delete scans in your group.' });
    }

    await Scan.findByIdAndDelete(req.params.id);
    res.json({ message: 'Scan record deleted successfully.' });
  } catch (error) {
    console.error('Delete scan error:', error);
    res.status(500).json({ message: 'Server error deleting scan.' });
  }
});

module.exports = router;
