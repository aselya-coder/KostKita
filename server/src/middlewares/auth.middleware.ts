import { Request, Response, NextFunction } from 'express';
import { UserRepository } from '../repositories/user.repository.js';

// Define Role as a string since SQLite doesn't support Enums in the same way as PostgreSQL
type Role = string;

// Extend the Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
      };
    }
  }
}

const userRepository = new UserRepository();

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  // For demonstration purposes, we'll use headers to simulate user authentication.
  // In a real application, this would involve JWT verification, session checks, etc.
  const userId = req.headers['x-user-id'] as string;
  const userRole = req.headers['x-user-role'] as Role; // Assuming 'USER' or 'ADMIN'

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized: User ID missing' });
  }

  try {
    console.log(`[AUTH] Authenticating user: ${userId}`);
    const user = await userRepository.findById(userId);

    if (!user) {
      console.log(`[AUTH] User not found, creating dummy: ${userId}`);
      // If user not found in DB, but ID is provided, create a dummy user for demo
      // In a real app, this would be an error or redirect to login/registration
      const newUser = await userRepository.createUser({ id: userId, email: `${userId}@example.com`, role: userRole || 'USER' });
      req.user = newUser;
      console.log(`[AUTH] Dummy user created: ${userId}`);
    } else {
      req.user = user;
    }
    
    next();
  } catch (error: any) {
    console.error(`[AUTH] Error:`, error);
    return res.status(500).json({ success: false, message: 'Authentication error', error: error.message });
  }
};

export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User not authenticated' });
    }

    const userRole = req.user.role.toUpperCase();
    const roles = allowedRoles.map(r => r.toUpperCase());

    if (!roles.includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};
