import { 
  Box, 
  Typography, 
  TextField, 
  IconButton, 
  Paper, 
  Stack,
  CircularProgress
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export const AIChat = ({ portfolioName, uuid }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!uuid) return;
      try {
        const response = await axios.get(`/api/portfolios/${uuid}/chat`);
        setMessages(response.data);
      } catch (err) {
        console.error('Failed to fetch chat history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatHistory();
  }, [uuid]);

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;

    const userMessage = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsSending(true);

    try {
      const response = await axios.post(`/api/portfolios/${uuid}/chat`, {
        content: userMessage.content
      });
      setMessages(prev => [...prev, response.data]);
    } catch (err) {
      console.error('Failed to send message:', err);
      // Fallback or error message could be added here
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box 
      sx={{ 
        height: 'calc(100vh - 212px)', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: 'background.paper', // System background
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Messages Area */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflowY: 'auto', 
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <Typography variant="body1">
              История переписки пуста. Спросите что-нибудь у помощника!
            </Typography>
          </Box>
        ) : (
          messages.map((msg, index) => (
            <Box 
              key={index} 
              sx={{ 
                maxWidth: '850px', 
                width: '100%', 
                mx: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              {/* User Message Bubble */}
              {msg.role === 'user' ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: '10px 20px',
                      backgroundColor: 'neutral.100',
                      borderRadius: '20px',
                      color: 'text.primary',
                      maxWidth: '100%'
                    }}
                  >
                    <Typography variant="body1">{msg.content}</Typography>
                  </Paper>
                </Box>
              ) : (
                /* Assistant Message */
                <Box sx={{ width: '100%' }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      color: 'text.primary',
                      lineHeight: 1.6
                    }}
                  >
                    {msg.content}
                  </Typography>
                </Box>
              )}
            </Box>
          ))
        )}
        {isSending && (
          <Box 
            sx={{ 
              maxWidth: '850px', 
              width: '100%', 
              mx: 'auto',
              display: 'flex',
              gap: 1,
              alignItems: 'center',
              color: 'text.secondary'
            }}
          >
            <CircularProgress size={16} color="inherit" />
            <Typography variant="caption">DeepSeek печатает...</Typography>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box 
        sx={{ 
          p: 3, 
          maxWidth: '850px', 
          width: '100%', 
          mx: 'auto'
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'neutral.50',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <TextField
            fullWidth
            multiline
            maxRows={5}
            placeholder="Сообщение"
            variant="standard"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isSending}
            InputProps={{
              disableUnderline: true,
              sx: { color: 'text.primary', fontSize: '1rem' }
            }}
            sx={{ mb: 1 }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <IconButton size="small" sx={{ color: 'text.secondary' }}>
              <AttachFileIcon />
            </IconButton>
            
            <IconButton 
              size="small" 
              onClick={handleSendMessage}
              sx={{ 
                backgroundColor: message.trim() && !isSending ? 'primary.main' : 'neutral.300', 
                color: '#fff',
                '&:hover': { 
                  backgroundColor: message.trim() && !isSending ? 'primary.dark' : 'neutral.400' 
                },
                transition: 'all 0.2s'
              }}
              disabled={!message.trim() || isSending}
            >
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
          </Box>
        </Paper>
        <Typography 
          variant="caption" 
          sx={{ 
            display: 'block', 
            textAlign: 'center', 
            mt: 1.5, 
            color: 'text.secondary' 
          }}
        >
          Сгенерировано ИИ, только для справки
        </Typography>
      </Box>
    </Box>
  );
};

