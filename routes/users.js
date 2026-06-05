const express = require('express');
const User = require('../models/User');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/users — Admin only: list users based on role
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'admin') {
      // Admins only see users they created
      query.createdBy = req.userId;
    } else if (req.user.role === 'super_admin' && req.query.createdBy) {
      // Super admin can filter to see users created by a specific admin
      query.createdBy = req.query.createdBy;
    }
    // super_admin sees all users if no filter is applied
    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error fetching users.' });
  }
});

// DELETE /api/users/:id — Admin only: delete a user
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    // Prevent deleting yourself
    if (req.params.id === req.userId.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }

    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Admins can only delete users they created
    if (req.user.role === 'admin') {
      if (!userToDelete.createdBy || userToDelete.createdBy.toString() !== req.userId.toString()) {
        return res.status(403).json({ message: 'Access denied. You can only delete users you created.' });
      }
    }

    // Prevent admins from deleting super_admins
    if (userToDelete.role === 'super_admin') {
      return res.status(403).json({ message: 'Cannot delete a super admin account.' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error deleting user.' });
  }
});

module.exports = router;
