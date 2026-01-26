import { useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Divider,
  Typography
} from '@mui/material';
import { useAuthContext } from '../../contexts/auth-context';
import { AvatarUploadModal } from './avatar-upload-modal';

export const AccountProfile = (props) => {
  const { user, uploadAvatar, deleteAvatar } = useAuthContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const handleUpload = async (file) => {
    try {
      await uploadAvatar(file);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAvatar();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card {...props}>
      <CardContent>
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Avatar
            src={user?.avatar}
            sx={{
              height: 64,
              mb: 2,
              width: 64
            }}
          >
            {getInitials(user?.firstName, user?.lastName)}
          </Avatar>
        </Box>
      </CardContent>
      <Divider />
      <CardActions>
        <Button
          color="primary"
          fullWidth
          variant="text"
          onClick={() => setIsModalOpen(true)}
        >
          Загрузить фото
        </Button>
        {user?.avatar && (
            <Button
                color="error"
                fullWidth
                variant="text"
                onClick={handleDelete}
            >
                Удалить фото
            </Button>
        )}
      </CardActions>
      <AvatarUploadModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpload={handleUpload}
      />
    </Card>
  );
};
