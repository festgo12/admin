import apiClient from '@/lib/api-client';

/** Shape of the /users/me response (subset the profile page uses). */
export interface MyProfile {
  id: string;
  email: string | null;
  role: 'ADMIN' | 'SUPER_ADMIN' | 'USER' | 'MODERATOR';
  status?: string;
  twoFactorEnabled?: boolean;
  profile?: {
    firstName?: string | null;
    lastName?: string | null;
    kycStatus?: string;
    avatarUrl?: string | null;
  } | null;
}

export const profileService = {
  /** Current user's profile (users.controller GET /users/me). */
  getMe: async (): Promise<MyProfile> => {
    const response = await apiClient.get('/users/me');
    return response.data;
  },

  /**
   * Update the logged-in user's profile (users.controller PATCH /users/profile).
   * Sends multipart/form-data when an avatar file is provided (field: `avatar`),
   * otherwise a plain JSON body.
   */
  updateProfile: async (
    input: { firstName?: string; lastName?: string },
    avatar?: File | null,
  ): Promise<MyProfile> => {
    let response;
    if (avatar) {
      const form = new FormData();
      if (input.firstName !== undefined) form.append('firstName', input.firstName);
      if (input.lastName !== undefined) form.append('lastName', input.lastName);
      form.append('avatar', avatar);
      response = await apiClient.patch('/users/profile', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } else {
      response = await apiClient.patch('/users/profile', input);
    }
    return response.data;
  },

  /**
   * Change password while logged in (auth.controller POST /auth/change-password).
   * Returns a message on success; throws with the backend message on failure
   * (e.g. wrong current password).
   */
  changePassword: async (
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message?: string }> => {
    const response = await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};
