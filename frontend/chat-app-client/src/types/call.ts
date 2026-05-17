export enum CallStatus {
  Ringing = 1,
  Accepted = 2,
  Rejected = 3,
  Missed = 4,
  Ended = 5,
  Failed = 6,
}

export interface StartCallRequest {
  conversationId: string;
  receiverId: string;
}

export interface CallResponse {
  id: string;
  conversationId: string;
  callerId: string;
  callerUsername: string;
  receiverId?: string | null;
  receiverUsername?: string | null;
  status: CallStatus;
  createdAt: string;
  acceptedAt?: string | null;
  endedAt?: string | null;
  durationInSeconds?: number | null;
}

export interface WebRtcSignalRequest {
  callId: string;
  targetUserId: string;
  data: string;
}