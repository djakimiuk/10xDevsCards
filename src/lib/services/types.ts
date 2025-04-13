export type FlashcardCandidate = {
  front: string;
  back: string;
  explanation: string;
  confidence: number;
  id?: string;
  requestId?: string;
  createdAt?: string;
};
