import { supabase } from '@/lib/supabase';
import { createNotification } from './notifications';

export interface Conversation {
  id: string;
  participantOne: string;
  participantTwo: string;
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
  otherParticipant?: {
    id: string;
    name: string;
    avatarUrl?: string;
    phone?: string;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export const getConversations = async (userId: string): Promise<Conversation[]> => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participant_one_profile:profiles!participant_one (id, name, avatar_url, phone),
        participant_two_profile:profiles!participant_two (id, name, avatar_url, phone)
      `)
      .or(`participant_one.eq.${userId},participant_two.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((conv: any) => {
      const isParticipantOne = conv.participant_one === userId;
      const otherProfile = isParticipantOne ? conv.participant_two_profile : conv.participant_one_profile;
      
      return {
        id: conv.id,
        participantOne: conv.participant_one,
        participantTwo: conv.participant_two,
        lastMessage: conv.last_message,
        lastMessageAt: conv.last_message_at,
        createdAt: conv.created_at,
        otherParticipant: otherProfile ? {
          id: otherProfile.id,
          name: otherProfile.name,
          avatarUrl: otherProfile.avatar_url,
          phone: otherProfile.phone
        } : undefined
      };
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
};

export const getMessages = async (conversationId: string): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map((m: any) => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      content: m.content,
      isRead: m.is_read,
      createdAt: m.created_at
    }));
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

export const sendMessage = async (conversationId: string, senderId: string, content: string) => {
  try {
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content
      })
      .select()
      .single();

    if (messageError) throw messageError;

    // Update last message in conversation
    const { error: convError } = await supabase
      .from('conversations')
      .update({
        last_message: content,
        last_message_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (convError) throw convError;

    // Send notification to the other participant
    const { data: conv } = await supabase
      .from('conversations')
      .select('participant_one, participant_two')
      .eq('id', conversationId)
      .single();

    if (conv) {
      const recipientId = conv.participant_one === senderId ? conv.participant_two : conv.participant_one;
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', senderId)
        .single();

      await createNotification(
        recipientId,
        "Pesan Baru",
        `${senderProfile?.name || 'Seseorang'} mengirimkan pesan: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
        "chat",
        "/dashboard/chat"
      );
    }

    return { success: true, data: messageData };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error };
  }
};

export const getOrCreateConversation = async (participantOne: string, participantTwo: string) => {
  try {
    // Sort IDs to ensure uniqueness in the unique constraint (participant_one, participant_two)
    const [p1, p2] = [participantOne, participantTwo].sort();

    // Check if exists
    const { data: existing, error: findError } = await supabase
      .from('conversations')
      .select('*')
      .eq('participant_one', p1)
      .eq('participant_two', p2)
      .maybeSingle();

    if (findError) throw findError;
    if (existing) return { success: true, data: existing };

    // Create new
    const { data: created, error: createError } = await supabase
      .from('conversations')
      .insert({
        participant_one: p1,
        participant_two: p2
      })
      .select()
      .single();

    if (createError) throw createError;
    return { success: true, data: created };
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    return { success: false, error };
  }
};

export const markMessagesAsRead = async (conversationId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return { success: false, error };
  }
};

export const getUnreadMessagesCount = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};
