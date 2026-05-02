const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.post('/', conversationController.getOrCreateConversation);
router.get('/', conversationController.getConversations);
router.get('/:id/messages', conversationController.getMessages);

module.exports = router;
