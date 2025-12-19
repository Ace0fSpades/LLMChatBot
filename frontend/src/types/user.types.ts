/**
 * User profile
 */
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  is_active: boolean;
}

/**
 * Update user profile request
 */
export interface UpdateUserProfileRequest {
  username?: string;
  email?: string;
}

