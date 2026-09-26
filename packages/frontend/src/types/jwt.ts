/** Local JWT payload shape (keeps frontend deploy self-contained). */
export interface JwtPayload {
  userId: string;
  role: string;
  adminId?: string;
  iat?: number;
  exp?: number;
}
