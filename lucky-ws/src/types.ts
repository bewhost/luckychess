export type Color = 'white' | 'black';
export type Phase = 'rolling' | 'moving' | 'finished';

export interface Room {
  id: string;
  created_at: string;
  creator_user_id: string;
  white_id: string | null;
  black_id: string | null;
  phase: Phase;
  current_turn: Color | null;
  dice_white: number | null;
  dice_black: number | null;
  moves: string[]; // UCI list
}
