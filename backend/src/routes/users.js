const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth } = require('../middleware/auth');

router.use(auth); // All user routes require authentication

router.get('/leaderboard', userController.getLeaderboard);
router.get('/:id', userController.getUser);
router.get('/:id/reviews', userController.getUserReviews);
router.put('/profile', userController.updateProfile);
router.get('/', userController.getUsers);
router.post('/:id/block', userController.blockUser);

module.exports = router;
