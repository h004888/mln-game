import { Question } from '../game/game.types';

export interface SecretMedia {
  keyword: string;
  imageUrl: string;
  hint?: string;
}

export interface QuestionBank {
  id: string;
  title: string;
  secretMedia: SecretMedia;
  questions: Question[];
}

export interface GameConfigPayload {
  secretMedia: SecretMedia;
  questions: Question[];
}

