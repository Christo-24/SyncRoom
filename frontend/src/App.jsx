import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import Auth from './components/auth/Auth';
import Chat from './components/chat/Chat';

function AppContent() {
  const { token } = useAuth();

  return token ? <Chat /> : <Auth />;
}

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <AppContent />
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;