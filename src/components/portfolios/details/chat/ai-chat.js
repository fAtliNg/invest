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
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';
import Head from 'next/head';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

const preprocessLaTeX = (content) => {
  if (!content) return '';
  // Replace block math \[ ... \] with $$ ... $$
  // Only match if \[ is at the start of the string or follows a newline (ignoring whitespace)
  const blockReplaced = content.replace(/(^|\n)(\s*)\\\[([\s\S]*?)\\\]/g, (_, prefix, whitespace, equation) => {
    return `${prefix}${whitespace}$$${equation}$$`;
  });
  // Replace inline math \( ... \) with $ ... $
  const inlineReplaced = blockReplaced.replace(/\\\(([\s\S]*?)\\\)/g, (_, equation) => `$${equation}$`);
  return inlineReplaced;
};

export const AIChat = ({ portfolioName, uuid }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const isNearBottomRef = useRef(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Track whether user is near bottom of scroll
  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const threshold = 5;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  };

  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom();
    }
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

  // Abort any in-flight request on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const t = setTimeout(() => {
        scrollToBottom();
      }, 0);
      return () => clearTimeout(t);
    }
  }, [isLoading]);

  const processLine = (line, assistantContentRef) => {
    if (!line.trim()) return;
    if (line === 'data: [DONE]') return 'DONE';
    if (line.startsWith('data: ')) {
      let data = line.slice(6);
      try {
        const parsed = JSON.parse(data);
        if (parsed === '[DONE]') return 'DONE';
        if (typeof parsed === 'string') {
          data = parsed;
        }
      } catch (e) {
        // Ignore parse error, treat as raw string
      }
      assistantContentRef.value += data;
      const content = assistantContentRef.value;
      setMessages(prev => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
          newMessages[lastIndex] = { ...newMessages[lastIndex], content };
        }
        return newMessages;
      });
    }
    return null;
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;

    const userMessage = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage, { role: 'assistant', content: '' }]);
    setMessage('');
    setIsSending(true);

    // Abort previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 90-second timeout
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      const response = await fetch(`/api/portfolios/${uuid}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userMessage.content }),
        signal: controller.signal
      });
      if (!response.ok || !response.body) {
        throw new Error('Streaming request failed');
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const assistantContentRef = { value: '' };
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        const parts = buffer.split('\n');
        buffer = parts.pop() || '';
        for (const line of parts) {
          if (processLine(line, assistantContentRef) === 'DONE') return;
        }
      }
      // Process any remaining data in buffer
      if (buffer.trim()) {
        processLine(buffer, assistantContentRef);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Chat request was aborted (timeout or navigation)');
      }
      setMessages(prev => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
          if (!newMessages[lastIndex].content) {
            newMessages[lastIndex].content = 'Произошла ошибка при получении ответа.';
          }
        } else {
          newMessages.push({ role: 'assistant', content: 'Произошла ошибка при получении ответа.' });
        }
        return newMessages;
      });
    } finally {
      clearTimeout(timeoutId);
      setIsSending(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const visibleMessages = messages.filter(msg => msg.role !== 'system');

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.paper', // System background
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        height: '100%'
      }}
    >
      <Head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.33/dist/katex.min.css"
        />
      </Head>

      {/* Messages Area */}
      <Box
        ref={messagesContainerRef}
        onScroll={handleScroll}
        sx={{
          overflowY: 'auto',
          minHeight: 0,
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          flex: '1 1 auto'
        }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : visibleMessages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <Typography variant="body1">
              История переписки пуста. Спросите что-нибудь у помощника!
            </Typography>
          </Box>
        ) : (
          visibleMessages.map((msg, index) => (
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
                  <Box
                    sx={{
                      '& p': { lineHeight: 1.6, color: 'text.primary', m: 0 },
                      '& ul, & ol': {
                        pl: 2,
                        ml: 0,
                        listStylePosition: 'outside',
                        mt: 1,
                        mb: 1,
                      },
                      '& li': { mb: 0.5, pl: 0.5 },
                      '& h1, & h2, & h3, & h4, & h5, & h6': {
                        mt: 2,
                        mb: 1,
                        lineHeight: 1.3,
                        color: 'text.primary',
                      },
                      '& table': {
                        width: '100%',
                        borderCollapse: 'collapse',
                        mt: 2,
                        mb: 2,
                      },
                      '& th': {
                        border: '1px solid',
                        borderColor: 'divider',
                        p: 1,
                        backgroundColor: 'neutral.100',
                        fontWeight: 'bold',
                        textAlign: 'left',
                      },
                      '& td': {
                        border: '1px solid',
                        borderColor: 'divider',
                        p: 1,
                      },
                      '& blockquote': {
                        borderLeft: '4px solid',
                        borderColor: 'primary.main',
                        pl: 2,
                        ml: 0,
                        my: 2,
                        color: 'text.secondary',
                        fontStyle: 'italic',
                      },
                      '& hr': {
                        border: 'none',
                        height: '1px',
                        backgroundColor: 'divider',
                        my: 2,
                      },
                    }}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
                      rehypePlugins={[[rehypeKatex, { output: 'html' }]]}
                      components={{
                        a: ({ href, children }) => (
                          <a href={href} target="_blank" rel="noopener noreferrer">
                            {children}
                          </a>
                        ),
                        img: ({ src, alt }) => (
                          <img
                            src={src}
                            alt={alt}
                            style={{
                              maxWidth: '100%',
                              height: 'auto',
                              borderRadius: '8px',
                              marginTop: '8px',
                              marginBottom: '8px',
                            }}
                          />
                        ),
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline ? (
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match ? match[1] : 'text'}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code
                              className={className}
                              {...props}
                              style={{
                                backgroundColor: 'rgba(0,0,0,0.05)',
                                padding: '2px 4px',
                                borderRadius: '4px',
                                fontFamily: 'monospace',
                                fontSize: '0.9em',
                              }}
                            >
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {preprocessLaTeX(msg.content || '')}
                    </ReactMarkdown>
                  </Box>
                </Box>
              )}
            </Box>
          ))
        )}
        {/* Loading indicator removed as we stream the response directly */}
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
