
export interface User {
  username: string;
  password: string; // In a real app, this would be a hash
  twoFactorEnabled?: boolean;
}
