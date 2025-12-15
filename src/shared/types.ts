export type TokensType = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // in milliseconds
};

export type JwtPayloadType = {
  session: string;
  iat: number;
  exp: number;
};

export type VerificationTwilioType =
  | 'pending'
  | 'approved'
  | 'canceled'
  | 'max_attempts_reached'
  | 'deleted'
  | 'failed'
  | 'expired';

export type SyncRateData = {
  podcastId: string;
};

export type SyncCommentData = {
  podcastId: string;
};
