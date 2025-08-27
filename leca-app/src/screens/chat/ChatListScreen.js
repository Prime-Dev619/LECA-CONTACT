import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchConversations } from '../../store/slices/chatSlice';

export default function ChatListScreen({ navigation }) {
  const dispatch = useDispatch();
  const items = useSelector((s) => s.chat.conversations);
  useEffect(() => { dispatch(fetchConversations()); }, [dispatch]);
  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }} onPress={() => navigation.navigate('ChatScreen', { conversationId: item.id })}>
            <Text>Conversation</Text>
            <Text numberOfLines={1} style={{ color: '#555' }}>{item.last_message || 'No messages yet'}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

