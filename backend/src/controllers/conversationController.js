const supabase = require('../config/supabase');

/**
 * Get or create conversation between two users
 * POST /api/conversations
 */
exports.getOrCreateConversation = async (req, res, next) => {
  try {
    const { participantId } = req.body;
    const participantIds = [req.userId, participantId].sort(); // Sort for consistent lookup

    // Check if conversation exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .filter('participant_ids', 'cs', JSON.stringify(participantIds));

    let conversation = existing?.[0];

    if (!conversation) {
      const { data: created, error } = await supabase
        .from('conversations')
        .insert({ participant_ids: participantIds })
        .select()
        .single();
      if (error) throw error;
      conversation = created;
    }

    // Get participant details
    const { data: participants } = await supabase
      .from('users')
      .select('id, name, avatar, is_online')
      .in('id', conversation.participant_ids);

    conversation.participants = (participants || []).map(p => ({
      _id: p.id,
      name: p.name,
      avatar: p.avatar || '',
      isOnline: p.is_online || false,
    }));

    res.json({ conversation: formatConversation(conversation) });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all conversations for current user
 * GET /api/conversations
 */
exports.getConversations = async (req, res, next) => {
  try {
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .filter('participant_ids', 'cs', JSON.stringify([req.userId]))
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Get all unique participant IDs
    const allIds = [...new Set((conversations || []).flatMap(c => c.participant_ids))];
    const { data: users } = await supabase
      .from('users')
      .select('id, name, avatar, is_online')
      .in('id', allIds);

    const userMap = {};
    (users || []).forEach(u => { userMap[u.id] = u; });

    const formatted = (conversations || []).map(c => {
      c.participants = c.participant_ids.map(id => {
        const u = userMap[id] || {};
        return { _id: u.id || id, name: u.name || 'Unknown', avatar: u.avatar || '', isOnline: u.is_online || false };
      });
      return formatConversation(c);
    });

    res.json({ conversations: formatted });
  } catch (error) {
    next(error);
  }
};

/**
 * Get messages for a conversation
 * GET /api/conversations/:id/messages?page=1
 */
exports.getMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Verify user is a participant
    const { data: conv } = await supabase
      .from('conversations')
      .select('participant_ids')
      .eq('id', req.params.id)
      .filter('participant_ids', 'cs', JSON.stringify([req.userId]))
      .single();

    if (!conv) return res.status(404).json({ message: 'Conversation not found' });

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', req.params.id)
      .order('created_at', { ascending: true })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;

    // Get sender details
    const senderIds = [...new Set((messages || []).map(m => m.sender_id))];
    const { data: senders } = await supabase
      .from('users')
      .select('id, name, avatar')
      .in('id', senderIds);

    const senderMap = {};
    (senders || []).forEach(s => { senderMap[s.id] = { _id: s.id, name: s.name, avatar: s.avatar || '' }; });

    const formatted = (messages || []).map(m => ({
      _id: m.id,
      conversationId: m.conversation_id,
      senderId: senderMap[m.sender_id] || { _id: m.sender_id, name: 'Unknown' },
      content: m.content,
      type: m.type,
      fileUrl: m.file_url,
      readBy: m.read_by,
      createdAt: m.created_at,
    }));

    res.json({ messages: formatted });
  } catch (error) {
    next(error);
  }
};

function formatConversation(conv) {
  return {
    _id: conv.id,
    participants: conv.participants || [],
    lastMessage: {
      content: conv.last_message_content || '',
      senderId: conv.last_message_sender_id,
      createdAt: conv.last_message_at,
    },
    createdAt: conv.created_at,
    updatedAt: conv.updated_at,
  };
}
