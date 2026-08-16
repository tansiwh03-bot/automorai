import React, { createContext, useContext, useState, useEffect } from 'react';

type User = {
  id: string;
  email: string;
};

type FacebookPage = {
  id: string;
  name: string;
  access_token: string;
};

type AuthState = {
  user: User | null;
  facebookPage: FacebookPage | null;
  commentReplyEnabled: boolean;
  messengerReplyEnabled: boolean;
};

type AuthContextType = {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  connectFacebook: () => void;
  setFacebookPage: (page: FacebookPage) => void;
  setCommentReplyEnabled: (enabled: boolean) => void;
  setMessengerReplyEnabled: (enabled: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

type AuthProviderProps = {
  children: React.ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    facebookPage: null,
    commentReplyEnabled: false,
    messengerReplyEnabled: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem('authState');
    if (stored) {
      setState(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('authState', JSON.stringify(state));
  }, [state]);

  const login = async (email: string, password: string) => {
    // Mock API call
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const newUser: User = { id: Math.random().toString(36).substr(2, 9), email };
        setState(prev => ({
          ...prev,
          user: newUser,
          facebookPage: null,
          commentReplyEnabled: false,
          messengerReplyEnabled: false,
        }));
        resolve();
      }, 1000);
    });
  };

  const signup = async (email: string, password: string) => {
    // Mock API call
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const newUser: User = { id: Math.random().toString(36).substr(2, 9), email };
        setState(prev => ({
          ...prev,
          user: newUser,
          facebookPage: null,
          commentReplyEnabled: false,
          messengerReplyEnabled: false,
        }));
        resolve();
      }, 1000);
    });
  };

  const logout = () => {
    setState({
      user: null,
      facebookPage: null,
      commentReplyEnabled: false,
      messengerReplyEnabled: false,
    });
  };

  const connectFacebook = () => {
    // Facebook App ID - replace with your own
    const FACEBOOK_APP_ID = 'YOUR_FACEBOOK_APP_ID';
    if (!FACEBOOK_APP_ID || FACEBOOK_APP_ID === 'YOUR_FACEBOOK_APP_ID') {
      alert('Please set your Facebook App ID in the code');
      return;
    }

    // Generate a random state for security
    const state = Math.random().toString(36).substring(2, 15);
    // Store state in sessionStorage to verify callback
    sessionStorage.setItem('fb_oauth_state', state);

    const redirectUri = encodeURIComponent(window.location.origin);
    const scope = ['pages_show_list', 'pages_manage_metadata', 'pages_messaging', 'pages_read_engagement'].join(',');

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?
      client_id=${FACEBOOK_APP_ID}
      &redirect_uri=${redirectUri}
      &scope=${scope}
      &response_type=token
      &state=${state}
      &auth_type=rerequest`;

    // Open popup window
    const popupWidth = 500;
    const popupHeight = 600;
    const left = window.screenLeft + (window.outerWidth - popupWidth) / 2;
    const top = window.screenTop + (window.outerHeight - popupHeight) / 2.5;
    const popup = window.open(
      authUrl,
      'Facebook OAuth',
      `width=${popupWidth},height=${popupHeight},left=${left},top=${top}`
    );

    if (!popup) {
      alert('Please allow popups for this site');
      return;
    }

    // Listen for message from popup
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from the same origin
      if (event.origin !== window.location.origin) return;

      const data = event.data;
      if (data.type === 'FB_OAUTH_RESULT') {
        if (data.state !== state) {
          console.error('Invalid state');
          return;
        }

        if (data.error) {
          alert('Facebook authentication failed: ' + data.error);
          return;
        }

        if (data.accessToken) {
          // Exchange short-lived token for long-lived token (client-side)
          // In a real app, you would do this via your backend to hide the app secret
          // For simplicity, we'll use the short-lived token to get pages
          // Note: short-lived tokens are about 1 hour, but for demo we'll use it
          getUserAccounts(data.accessToken);
        }

        // Remove listener
        window.removeEventListener('message', handleMessage);
      }
    };

    window.addEventListener('message', handleMessage);

    // Function to get user's pages and their access tokens
    const getUserAccounts = (userAccessToken: string) => {
      fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${userAccessToken}`)
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            alert('Failed to fetch pages: ' + data.error.message);
            return;
          }

          if (!data.data || data.data.length === 0) {
            alert('No pages found for this user');
            return;
          }

          // For simplicity, we'll use the first page
          // In a real app, you'd let the user select a page
          const page = data.data[0];
          const facebookPage: FacebookPage = {
            id: page.id,
            name: page.name,
            access_token: page.access_token,
          };

          setState(prev => ({
            ...prev,
            facebookPage,
            commentReplyEnabled: true,
            messengerReplyEnabled: true,
          }));

          // Send webhook request for new customer
          const user = state.user;
          if (user) {
            fetch('https://n8n2.kingpurefood.com/webhook/automorai/new-customer', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                user_id: user.id,
                email: user.email,
                page_id: facebookPage.id,
                page_access_token: facebookPage.access_token,
                comment_reply_enabled: true,
                messenger_reply_enabled: true,
                timestamp: new Date().toISOString(),
              }),
            })
            .then(response => {
              if (!response.ok) {
                throw new Error('Webhook request failed');
              }
              console.log('New customer webhook sent successfully');
            })
            .catch(error => {
              console.error('Failed to send new customer webhook:', error);
              // Don't alert the user for webhook failures in this demo
            });
          }
        })
        .catch(error => {
          console.error('Error fetching pages:', error);
          alert('An error occurred while fetching your pages');
        });
    };
  };

  const setFacebookPage = (page: FacebookPage) => {
    setState(prev => ({
      ...prev,
      facebookPage: page,
    }));
  };

  const setCommentReplyEnabled = (enabled: boolean) => {
    setState(prev => ({
      ...prev,
      commentReplyEnabled: enabled,
    }));

    // Send webhook request for toggle change
    const user = state.user;
    if (user) {
      fetch('https://n8n2.kingpurefood.com/webhook/automorai/new-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          comment_reply_enabled: enabled,
          messenger_reply_enabled: state.messengerReplyEnabled,
        }),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Webhook request failed');
        }
        console.log('Toggle webhook sent successfully');
      })
      .catch(error => {
        console.error('Failed to send toggle webhook:', error);
      });
    }
  };

  const setMessengerReplyEnabled = (enabled: boolean) => {
    setState(prev => ({
      ...prev,
      messengerReplyEnabled: enabled,
    }));

    // Send webhook request for toggle change
    const user = state.user;
    if (user) {
      fetch('https://n8n2.kingpurefood.com/webhook/automorai/new-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          comment_reply_enabled: state.commentReplyEnabled,
          messenger_reply_enabled: enabled,
        }),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Webhook request failed');
        }
        console.log('Toggle webhook sent successfully');
      })
      .catch(error => {
        console.error('Failed to send toggle webhook:', error);
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      state,
      login,
      signup,
      logout,
      connectFacebook,
      setFacebookPage,
      setCommentReplyEnabled,
      setMessengerReplyEnabled,
    }}>
      {children}
    </AuthContext.Provider>
  );
};