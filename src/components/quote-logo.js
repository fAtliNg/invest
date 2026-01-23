import { useState, useEffect } from 'react';
import { Avatar } from '@mui/material';

export const getAvatarColor = (string) => {
  if (!string) return '#000000';
  let hash = 0;
  for (let i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
};

export const QuoteLogo = ({ row, debugMode, onIconLoaded, size = 40 }) => {
  const [src, setSrc] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [usedSecid, setUsedSecid] = useState(false);

  useEffect(() => {
    setHasError(false);
    setUsedSecid(false);

    if (row.type === 'currency' && row.secid) {
      setSrc(`/logos/${row.secid}`);
    } else if (row.isin) {
      setSrc(`/logos/${row.isin}`);
    } else if (row.type === 'future' && row.secid) {
      setSrc(`/logos/${row.secid}`);
      setUsedSecid(true);
    } else {
      setSrc(null);
    }
  }, [row.isin, row.secid, row.type]);

  const handleError = () => {
    // If we haven't tried secid yet and it's a future with a secid, try it as fallback
    if (row.type === 'future' && row.secid && !usedSecid) {
      setSrc(`/logos/${row.secid}`);
      setUsedSecid(true);
      setHasError(false);
    } else {
      setHasError(true);
    }
  };

  if (src && !hasError) {
    return (
      <Avatar
        src={src}
        variant={row.type === 'currency' ? 'square' : 'circular'}
        imgProps={{ 
          onError: handleError,
          onLoad: () => {
            if (debugMode && onIconLoaded) {
              onIconLoaded(row.secid);
            }
          },
          loading: 'lazy'
        }}
        sx={{
          mr: 2,
          width: size,
          height: size,
          bgcolor: 'transparent',
          '& img': {
            objectFit: 'contain'
          }
        }}
      />
    );
  }

  return (
    <Avatar
      variant={row.type === 'currency' ? 'square' : 'circular'}
      sx={{
        bgcolor: getAvatarColor(row.secid),
        mr: 2,
        width: size,
        height: size,
        fontSize: size * 0.4
      }}
    >
      {row.shortname ? row.shortname.substring(0, 2) : (row.secid ? row.secid.substring(0, 2) : '??')}
    </Avatar>
  );
};
