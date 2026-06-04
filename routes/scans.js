const express = require('express');
const Scan = require('../models/Scan');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/scans — Get all scans (with optional filters)
// Query params: date, search, startDate, endDate
router.get('/', auth, async (req, res) => {
  try {
    const { date, search, startDate, endDate } = req.query;
    let query = {};

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
    const dates = await Scan.distinct('date');
    res.json(dates);
  } catch (error) {
    console.error('Get dates error:', error);
    res.status(500).json({ message: 'Server error fetching dates.' });
  }
});

// GET /api/scans/duplicates/:moduleId — Check if a module ID is duplicated
router.get('/duplicates/:moduleId', auth, async (req, res) => {
  try {
    const count = await Scan.countDocuments({ moduleId: req.params.moduleId });
    res.json({ isDuplicate: count > 1 });
  } catch (error) {
    console.error('Duplicate check error:', error);
    res.status(500).json({ message: 'Server error checking duplicates.' });
  }
});

// GET /api/scans/exists/:moduleId — Check if a module ID already exists in the database
router.get('/exists/:moduleId', auth, async (req, res) => {
  try {
    const count = await Scan.countDocuments({ moduleId: req.params.moduleId });
    res.json({ exists: count > 0 });
  } catch (error) {
    console.error('Exists check error:', error);
    res.status(500).json({ message: 'Server error checking existence.' });
  }
});

// POST /api/scans — Create a new scan record
router.post('/', auth, async (req, res) => {
  try {
    const { date, moduleId, jobCard, station, operatorName, reason } = req.body;

    if (!date || !moduleId || !jobCard || !station || !operatorName) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const scan = new Scan({
      date,
      moduleId,
      jobCard,
      station,
      operatorName,
      reason: reason || '',
      savedBy: req.user.username,
      savedByUserId: req.userId,
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
    const scan = await Scan.findByIdAndDelete(req.params.id);
    if (!scan) {
      return res.status(404).json({ message: 'Scan record not found.' });
    }
    res.json({ message: 'Scan record deleted successfully.' });
  } catch (error) {
    console.error('Delete scan error:', error);
    res.status(500).json({ message: 'Server error deleting scan.' });
  }
});

module.exports = router;
