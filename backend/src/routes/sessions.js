const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.post('/', sessionController.createSession);
router.get('/', sessionController.getSessions);
router.patch('/:id/status', sessionController.updateSessionStatus);
router.post('/:id/review', sessionController.createReview);

module.exports = router;
