import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [facebookConnected, setFacebookConnected] = useState(false);
  const [pageName, setPageName] = useState('');
  const [pageId, setPageId] = useState('');
  const [pageAccessToken, setPageAccessToken] = useState('');
  const [commentReplyEnabled, setCommentReplyEnabled] = useState(true);
  const [messengerReplyEnabled, setMessengerReplyEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleFacebookConnect = async () => {
    setLoading(true);
    try {
      // Simulate Facebook OAuth flow
      // In a real app, you would use the Facebook SDK or redirect to Facebook's OAuth dialog
      // For this simulation, we'll mock a successful connection after a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock response from Facebook
      const mockPageId = '1234567890';
      const mockPageName = 'Automorai Test Page';
      const mockAccessToken = 'EAACEdEose0cBA' + Math.random().toString(36).substr(2, 20);
      
      setPageId(mockPageId);
      setPageName(mockPageName);
      setPageAccessToken(mockAccessToken);
      setFacebookConnected(true);
      
      // Send webhook for new customer connection
      await sendWebhook({
        user_id: user.id,
        email: user.email,
        page_id: mockPageId,
        page_access_token: mockAccessToken,
        comment_reply_enabled: true,
        messenger_reply_enabled: true,
        timestamp: new Date().toISOString()
      });
      
      toast.success('Facebook Page connected successfully!');
    } catch (error) {
      toast.error('Failed to connect Facebook Page');
      console.error('Facebook connection error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChange = async (type: 'comment' | 'messenger', enabled: boolean) => {
    if (type === 'comment') {
      setCommentReplyEnabled(enabled);
    } else {
      setMessengerReplyEnabled(enabled);
    }
    
    try {
      await sendWebhook({
        user_id: user.id,
        comment_reply_enabled: commentReplyEnabled,
        messenger_reply_enabled: messengerReplyEnabled
      });
      
      toast.success(`Settings updated`);
    } catch (error) {
      toast.error('Failed to update settings');
      console.error('Webhook error:', error);
      // Revert toggle on error
      if (type === 'comment') {
        setCommentReplyEnabled(!enabled);
      } else {
        setMessengerReplyEnabled(!enabled);
      }
    }
  };

  const sendWebhook = async (data: any) => {
    // In a real app, you would make an actual POST request to the webhook URL
    // For this simulation, we'll just log the data and return a resolved promise
    console.log('Webhook data sent:', data);
    // Simulate network delay
    return new Promise(resolve => setTimeout(resolve, 800));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Welcome to Automorai
          </h1>
          <p className="text-lg text-muted-foreground">
            Hello, {user.email}! Manage your Facebook Page automation here.
          </p>
        </div>

        {!facebookConnected ? (
          <Button 
            onClick={handleFacebookConnect} 
            className="w-full px-8 py-3"
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Connect Facebook Page'}
          </Button>
        ) : (
          <div className="space-y-6">
            <div className="bg-card/50 p-6 rounded-lg border border-border/20">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <span className="text-primary text-2xl">📘</span>
                </div>
                <div>
                  <h2 className="font-semibold text-primary">{pageName}</h2>
                  <p className="text-sm text-muted-foreground">
                    Page ID: {pageId}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setFacebookConnected(false);
                    setPageName('');
                    setPageId('');
                    setPageAccessToken('');
                    setCommentReplyEnabled(true);
                    setMessengerReplyEnabled(true);
                  }}
                  className="w-full"
                >
                  Disconnect Page
                </Button>
              </div>
            </div>

            <div className="bg-card/50 p-6 rounded-lg border border-border/20">
              <h3 className="font-semibold text-primary mb-4">Automation Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="comment-toggle" className="text-muted-foreground">
                    Comment Auto-Reply
                  </Label>
                  <Checkbox 
                    id="comment-toggle"
                    checked={commentReplyEnabled} 
                    onCheckedChange={(checked) => handleToggleChange('comment', checked)}
                    aria-label="Comment auto-reply toggle"
                    className="h-4 w-4 text-primary border-gray-300"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="messenger-toggle" className="text-muted-foreground">
                    Messenger Auto-Reply
                  </Label>
                  <Checkbox 
                    id="messenger-toggle"
                    checked={messengerReplyEnabled} 
                    onCheckedChange={(checked) => handleToggleChange('messenger', checked)}
                    aria-label="Messenger auto-reply toggle"
                    className="h-4 w-4 text-primary border-gray-300"
                  />
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground mt-3">
                Changes are saved automatically to your automation workflows.
              </p>
            </div>
          </div>
        )}

        <div className="mt-8">
          <Button 
            onClick={handleLogout} 
            variant="outline"
            className="w-full"
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}