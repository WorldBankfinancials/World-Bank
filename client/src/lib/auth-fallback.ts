// Fallback authentication system for when Supabase is unavailable
interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
  email_confirmed_at?: string;
}

interface AuthSession {
  access_token: string;
  user: User;
}

class FallbackAuth {
  private currentUser: User | null = null;
  private listeners: Array<(event: string, session: AuthSession | null) => void> = [];

  // Demo users for testing
  private demoUsers = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'bankmanagerworld5@gmail.com',
      user_metadata: { full_name: 'Liu Wei (刘娟)' },
      email_confirmed_at: new Date().toISOString(),
      password: 'test123'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002', 
      email: 'admin@worldbank.org',
      user_metadata: { full_name: 'World Bank Admin' },
      email_confirmed_at: new Date().toISOString(),
      password: 'admin123'
    }
  ];

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    console.log('🔐 Attempting fallback authentication for:', email);
    
    // Find user in demo users
    const user = this.demoUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
      this.currentUser = {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        email_confirmed_at: user.email_confirmed_at
      };
      
      const session: AuthSession = {
        access_token: 'fallback-token-' + Date.now(),
        user: this.currentUser
      };
      
      // Store in localStorage
      localStorage.setItem('fallback-auth-session', JSON.stringify(session));
      
      // Notify listeners
      this.listeners.forEach(callback => {
        callback('SIGNED_IN', session);
      });
      
      console.log('✅ Fallback authentication successful for:', email);
      return { data: session, error: null };
    }
    
    console.log('❌ Fallback authentication failed for:', email);
    return { 
      data: { user: null, session: null }, 
      error: { message: 'Invalid email or password' }
    };
  }

  async signUp({ email, password }: { email: string; password: string }) {
    // Using these parameters for the function signature
    console.log('📝 Attempting fallback registration for:', email, password);
    console.log('📝 Fallback registration not implemented - use demo accounts');
    return { 
      data: { user: null, session: null }, 
      error: { message: 'Registration not available in fallback mode. Use demo accounts.' }
    };
  }

  async signOut() {
    this.currentUser = null;
    localStorage.removeItem('fallback-auth-session');
    
    this.listeners.forEach(callback => {
      callback('SIGNED_OUT', null);
    });
    
    return { error: null };
  }

  async getSession() {
    const stored = localStorage.getItem('fallback-auth-session');
    if (stored) {
      const session = JSON.parse(stored);
      this.currentUser = session.user;
      return { data: { session }, error: null };
    }
    return { data: { session: null }, error: null };
  }

  async getUser() {
    const { data } = await this.getSession();
    return { 
      data: { user: data.session?.user || null }, 
      error: null 
    };
  }

  onAuthStateChange(callback: (event: string, session: AuthSession | null) => void) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
              this.listeners.splice(index, 1);
            }
          }
        }
      }
    };
  }
}

export const fallbackAuth = new FallbackAuth();