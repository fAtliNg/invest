import { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

const HANDLERS = {
  INITIALIZE: 'INITIALIZE',
  SIGN_IN: 'SIGN_IN',
  SIGN_OUT: 'SIGN_OUT'
};

const initialState = {
  isAuthenticated: false,
  isLoading: true,
  user: null
};

const handlers = {
  [HANDLERS.INITIALIZE]: (state, action) => {
    const user = action.payload;

    return {
      ...state,
      ...(
        user
          ? ({
            isAuthenticated: true,
            isLoading: false,
            user
          })
          : ({
            isLoading: false
          })
      )
    };
  },
  [HANDLERS.SIGN_IN]: (state, action) => {
    const user = action.payload;

    return {
      ...state,
      isAuthenticated: true,
      user
    };
  },
  [HANDLERS.SIGN_OUT]: (state) => {
    return {
      ...state,
      isAuthenticated: false,
      user: null
    };
  }
};

const reducer = (state, action) => (
  handlers[action.type] ? handlers[action.type](state, action) : state
);

// The role of this context is to propagate authentication state through the App tree.

export const AuthContext = createContext({ undefined });

export const AuthProvider = (props) => {
  const { children } = props;
  const [state, dispatch] = useReducer(reducer, initialState);
  const initialized = useRef(false);

  const initialize = async () => {
    // Prevent double initialization
    if (initialized.current) {
      return;
    }
    initialized.current = true;

    try {
      // Check if we have an active session
      const response = await axios.get('/api/auth/me');
      const { user } = response.data;

      dispatch({
        type: HANDLERS.INITIALIZE,
        payload: user
      });
    } catch (err) {
      // Don't log 401 errors as they are expected for unauthenticated users
      if (err.response?.status !== 401) {
        console.error('Auth initialization failed', err);
      }
      dispatch({
        type: HANDLERS.INITIALIZE
      });
    }
  };

  useEffect(() => {
    initialize();
  }, []);

  const signIn = async (email, password) => {
    await axios.post('/api/auth/login', {
      email,
      password
    });
    
    // After login, fetch user details
    const response = await axios.get('/api/auth/me');
    const { user } = response.data;

    dispatch({
      type: HANDLERS.SIGN_IN,
      payload: user
    });
  };
  
  const signUp = async (email, password, firstName, lastName) => {
    await axios.post('/api/auth/register', {
      email,
      password,
      firstName,
      lastName
    });
    
    // Auto login after register? Or redirect to login?
    // Requirement says "Create user", usually implies auto-login or redirect.
    // For now, let's assume we want to auto-login.
    const response = await axios.post('/api/auth/login', {
      email,
      password
    });
     // After login, fetch user details
    const meResponse = await axios.get('/api/auth/me');
    const { user } = meResponse.data;

    dispatch({
      type: HANDLERS.SIGN_IN,
      payload: user
    });
  };

  const signInWithGoogle = async (token) => {
    await axios.post('/api/auth/google', { token });
    
    const response = await axios.get('/api/auth/me');
    const { user } = response.data;

    dispatch({
      type: HANDLERS.SIGN_IN,
      payload: user
    });
  };

  const signOut = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout failed', err);
    }
    
    dispatch({
      type: HANDLERS.SIGN_OUT
    });
  };

  const updateProfile = async (data) => {
    const response = await axios.put('/api/auth/profile', data);
    const { user } = response.data;

    dispatch({
      type: HANDLERS.INITIALIZE, // Re-use initialize to set user
      payload: user
    });
  };

  const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await axios.post('/api/auth/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    const { user } = response.data;

    dispatch({
      type: HANDLERS.SIGN_IN,
      payload: user
    });
  };

  const deleteAvatar = async () => {
    const response = await axios.delete('/api/auth/avatar');
    const { user } = response.data;

    dispatch({
      type: HANDLERS.SIGN_IN,
      payload: user
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        updateProfile,
        uploadAvatar,
        deleteAvatar
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node
};

export const useAuthContext = () => useContext(AuthContext);
