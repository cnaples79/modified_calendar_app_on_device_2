import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import AIService from '../../services/AIService';
import ActionParser from '../../services/ActionParser';
import chatStorageService from '../../services/ChatStorageService';
import { Event } from '../../types/Event';

// The message content can be a string or an array of events for search results.
type Message = {
  role: 'user' | 'assistant';
  content: string | Event[];
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // On mount initialise the chat storage and load any persisted
  // messages into state. We ignore failures and fall back to an empty
  // conversation. This effect runs only once.
  React.useEffect(() => {
    let isMounted = true;
    // Initialise both the chat storage and the on‑device language model.
    // We ignore errors here and fall back to an empty conversation.
    Promise.all([chatStorageService.init(), AIService.init()])
      .then(() => chatStorageService.getAllMessages())
      .then(storedMessages => {
        if (isMounted) {
          setMessages(storedMessages);
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
        }
      })
      .catch(err => {
        console.error('Failed to initialise chat or load history:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);
  // Access the current theme colours from our context. These values
  // automatically update when the user toggles dark mode from the
  // settings screen.
  const { colors } = useTheme();

  const handleSend = async () => {
    if (inputText.trim() === '' || isSending) return;

    const userMessage: Message = {
      role: 'user',
      content: inputText,
    };

    const currentInput = inputText;
    setInputText('');
    
    setMessages(prev => {
        const newMessages = [...prev, userMessage];
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        return newMessages;
    });

    // Persist the user message
    chatStorageService.saveMessage('user', currentInput);

    setIsSending(true);

    try {
      const aiResponseText = await AIService.getAIResponse(currentInput);
      const action = ActionParser.parse(aiResponseText);

      let actionResult: string | Event[];
      if (action) {
        // The result could be a confirmation string or an array of events
        actionResult = await ActionParser.execute(action);
      } else {
        actionResult = aiResponseText; // No action found, just display the AI's text response
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: actionResult,
      };
      
      setMessages(prev => {
          const newMessages = [...prev, assistantMessage];
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
          return newMessages;
      });

      // Persist the assistant message
      chatStorageService.saveMessage('assistant', actionResult as any);

    } catch (error) {
      console.error('Failed to get AI response:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessageContent = (item: Message) => {
    const isUser = item.role === 'user';
    const isEventList = Array.isArray(item.content);

    if (isEventList) {
      const events = item.content as Event[];
      if (events.length === 0) {
        return (
          <Text style={{ color: colors.assistantMessageText, fontSize: 16 }}>
            I couldn't find any events matching that description.
          </Text>
        );
      }
      return (
        <View>
          <Text style={{ color: colors.assistantMessageText, fontSize: 16 }}>Here are the events I found:</Text>
          {events.map(event => (
            <View
              key={event.id}
              style={[styles.eventItem, { backgroundColor: colors.cardBackground }]}
            >
              <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>
              <Text style={[styles.eventTime, { color: colors.secondaryText }]}> 
                {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ))}
        </View>
      );
    }

    return (
      <Text
        style={{
          color: isUser ? colors.userMessageText : colors.assistantMessageText,
          fontSize: 16,
        }}
      >
        {item.content as string}
      </Text>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => `${item.role}-${index}`}
        renderItem={({ item }) => (
          <View
            style={[
              styles.message,
              {
                backgroundColor:
                  item.role === 'user' ? colors.userMessageBackground : colors.assistantMessageBackground,
                alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
              },
            ]}
          >
            {renderMessageContent(item)}
          </View>
        )}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <View
        style={[
          styles.inputContainer,
          {
            borderTopColor: colors.border,
            backgroundColor: colors.cardBackground,
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.inputBorder,
              backgroundColor: colors.inputBackground,
              color: colors.text,
            },
          ]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your command..."
          placeholderTextColor={colors.secondaryText}
          editable={!isSending}
        />
        {isSending ? (
          <ActivityIndicator style={styles.sendButton} />
        ) : (
          <Button title="Send" onPress={handleSend} disabled={!inputText.trim()} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesContainer: {
    padding: 10,
  },
  message: {
    marginVertical: 5,
    padding: 12,
    borderRadius: 15,
    maxWidth: '85%',
  },
  user: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  assistant: {
    backgroundColor: '#E5E5EA',
    alignSelf: 'flex-start',
  },
  userMessageText: {
    color: 'white',
    fontSize: 16,
  },
  assistantMessageText: {
    color: 'black',
    fontSize: 16,
  },
  eventItem: {
    marginTop: 8,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  eventTitle: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  eventTime: {
    marginTop: 4,
    fontSize: 14,
    color: '#555',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  sendButton: {
    marginHorizontal: 10,
  },
});
