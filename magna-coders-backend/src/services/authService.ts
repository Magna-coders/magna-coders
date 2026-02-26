import { register } from './authservice/register';
import { login } from './authservice/login';
import { logout } from './authservice/logout';
import { verifyToken, getUserFromToken, verifyUser } from './authservice/verify';

class AuthService {
  // Register new user
  async register(userData: {
    username: string;
    email: string;
    password: string;
    otp?: string;
  }): Promise<any> {
    return await register(userData);
  }

  // Login user
  async login(credentials: { identifier: string; password: string; otp?: string }): Promise<any> {
    // map common 'username' field if provided by callers
    const payload: any = { ...credentials };
    if ((credentials as any).username && !payload.identifier) {
      payload.identifier = (credentials as any).username;
    }
    return await login(payload);
  }

  // Logout user
  async logout(userId: string): Promise<any> {
    return await logout(userId);
  }

  // Verify token
  verifyToken(token: string): any {
    return verifyToken(token);
  }

  // Get user from token
  async getUserFromToken(token: string): Promise<any> {
    return await getUserFromToken(token);
  }

  // Verify user account
  async verifyUser(userId: string, badge?: string): Promise<any> {
    return await verifyUser({ userId, badge });
  }
}

export default AuthService;

// hizi zote maybe u can just add some things but maintain the same structure
// kama unajua jwt na hashing ya password nadhani utaweza kuimplement
// kwa urahisi zaidi ya hizi files zote