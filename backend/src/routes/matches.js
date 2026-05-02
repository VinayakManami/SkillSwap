const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', matchController.findMatches);
router.get('/recommendations', matchController.getRecommendations);

module.exports = router;
