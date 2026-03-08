// fighter-base.ts — SF2-style pixel art sprite frames
// Each frame: 80 rows × 50 cols, palette-indexed (0 = transparent)
// Reference: SF2 Ryu idle stance + jab animation

export interface SpriteFrame {
  width: number
  height: number
  pixels: number[][]
}

// 16-color palette — SF2 Ryu inspired
export const FIGHTER_PALETTE: string[] = [
  'transparent',   // 0: transparent
  '#111118',       // 1: outline black
  '#3d2816',       // 2: hair dark
  '#5c3d24',       // 3: hair mid
  '#7a5633',       // 4: hair highlight
  '#b07848',       // 5: skin shadow
  '#d49868',       // 6: skin base
  '#e8b888',       // 7: skin light
  '#f5d4b0',       // 8: skin highlight
  '#e8e8e8',       // 9: gi white
  '#c0c0c0',       // 10: gi light shadow
  '#909090',       // 11: gi shadow
  '#686868',       // 12: gi deep shadow
  '#cc2222',       // 13: red (headband/gloves)
  '#881414',       // 14: dark red
  '#1a1a30',       // 15: belt/dark accent
]

const W = 50
const H = 80

// --- IDLE FRAME 1: Base fighting stance ---
// Orthodox stance facing right, weight centered, guard up
const IDLE_1_DATA: number[][] = [
  /* row  0 */ Array(W).fill(0),
  /* row  1 */ Array(W).fill(0),
  /* row  2 */ Array(W).fill(0),
  /* row  3 */ Array(W).fill(0),
  /* row  4 */ [...Array(19).fill(0),1,1,1,1,1,1,1,1,1,1,1,1,0,...Array(18).fill(0)],
  /* row  5 */ [...Array(17).fill(0),1,2,2,3,3,3,3,3,3,2,2,2,2,1,...Array(17).fill(0)],
  /* row  6 */ [...Array(16).fill(0),1,2,3,3,4,4,4,4,4,3,3,2,2,2,1,...Array(15).fill(0)],
  /* row  7 */ [...Array(15).fill(0),1,2,3,4,4,4,4,4,4,4,4,3,3,2,2,1,...Array(14).fill(0)],
  /* row  8 */ [...Array(15).fill(0),1,2,3,3,4,4,4,4,4,4,3,3,3,2,2,1,...Array(14).fill(0)],
  /* row  9 */ [...Array(14).fill(0),1,13,13,13,13,13,13,13,13,13,13,13,13,13,13,1,...Array(14).fill(0)],
  /* row 10 */ [...Array(14).fill(0),1,14,13,13,13,13,13,13,13,13,13,13,13,14,14,1,...Array(14).fill(0)],
  /* row 11 */ [...Array(14).fill(0),1,6,6,6,7,7,7,7,7,7,7,7,6,6,6,1,...Array(14).fill(0)],
  /* row 12 */ [...Array(14).fill(0),1,6,5,1,7,7,6,6,6,7,7,1,5,6,6,1,...Array(14).fill(0)],
  /* row 13 */ [...Array(14).fill(0),1,6,6,1,1,7,6,6,6,7,1,1,6,6,6,1,...Array(14).fill(0)],
  /* row 14 */ [...Array(15).fill(0),1,6,6,6,7,7,6,6,7,7,6,6,6,6,1,...Array(15).fill(0)],
  /* row 15 */ [...Array(15).fill(0),1,5,6,6,6,6,7,7,6,6,6,6,6,5,1,...Array(15).fill(0)],
  /* row 16 */ [...Array(15).fill(0),1,5,5,6,6,6,6,6,6,6,6,6,5,5,1,...Array(15).fill(0)],
  /* row 17 */ [...Array(16).fill(0),1,5,5,6,6,1,1,6,6,5,5,5,5,1,...Array(16).fill(0)],
  /* row 18 */ [...Array(17).fill(0),1,1,5,6,6,6,6,6,5,5,1,1,...Array(18).fill(0)],
  /* row 19 */ [...Array(18).fill(0),0,1,5,6,6,6,6,5,1,0,...Array(19).fill(0)],
  /* row 20 */ [...Array(19).fill(0),1,1,6,6,6,6,1,1,...Array(20).fill(0)],
  /* row 21 */ [...Array(19).fill(0),0,1,6,6,6,6,1,0,...Array(20).fill(0)],
  /* row 22 */ [...Array(19).fill(0),0,1,5,6,6,5,1,0,...Array(20).fill(0)],
  /* row 23 */ [...Array(15).fill(0),1,1,1,1,1,1,5,6,5,1,1,1,1,1,...Array(19).fill(0)],
  /* row 24 */ [...Array(13).fill(0),1,9,9,10,9,9,1,6,6,6,1,9,9,10,9,9,1,...Array(16).fill(0)],
  /* row 25 */ [...Array(12).fill(0),1,9,9,9,10,9,9,1,5,6,5,1,9,9,9,10,9,9,1,...Array(15).fill(0)],
  /* row 26 */ [...Array(11).fill(0),1,9,9,9,9,10,9,9,1,1,1,9,9,9,9,9,10,9,9,1,...Array(14).fill(0)],
  /* row 27 */ [...Array(10).fill(0),1,9,9,9,9,9,10,9,9,9,9,9,9,9,9,9,9,10,9,9,1,...Array(13).fill(0)],
  /* row 28 */ [...Array(9).fill(0),1,9,9,9,10,10,9,9,9,9,9,9,9,9,9,10,10,9,9,9,9,1,...Array(12).fill(0)],
  /* row 29 */ [...Array(8).fill(0),1,6,9,9,10,11,9,9,9,9,9,9,9,9,9,10,11,9,9,9,6,6,1,...Array(11).fill(0)],
  /* row 30 */ [...Array(7).fill(0),1,6,7,9,9,11,10,9,9,9,9,9,9,9,9,11,10,9,9,7,6,6,1,...Array(11).fill(0)],
  /* row 31 */ [...Array(7).fill(0),1,5,6,9,9,9,10,9,9,9,9,9,9,9,9,9,10,9,9,6,5,6,1,...Array(11).fill(0)],
  /* row 32 */ [...Array(7).fill(0),1,5,6,7,9,9,10,9,9,10,10,10,10,9,9,9,10,9,7,6,5,1,...Array(12).fill(0)],
  /* row 33 */ [...Array(8).fill(0),1,5,6,9,9,9,9,10,10,11,11,11,10,10,9,9,9,9,6,5,1,...Array(12).fill(0)],
  /* row 34 */ [...Array(8).fill(0),1,5,6,7,9,9,9,9,10,10,10,10,10,9,9,9,9,7,6,5,1,...Array(12).fill(0)],
  /* row 35 */ [...Array(9).fill(0),1,5,6,9,9,9,9,9,9,9,9,9,9,9,9,9,9,6,5,1,...Array(13).fill(0)],
  /* row 36 */ [...Array(9).fill(0),1,5,6,9,9,9,9,9,9,9,9,9,9,9,9,9,9,6,5,1,...Array(13).fill(0)],
  /* row 37 */ [...Array(10).fill(0),1,5,6,9,9,9,9,9,9,9,9,9,9,9,9,9,6,5,1,...Array(14).fill(0)],
  /* row 38 */ [...Array(10).fill(0),1,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,1,...Array(14).fill(0)],
  /* row 39 */ [...Array(10).fill(0),1,15,15,1,1,15,15,15,15,15,15,15,15,1,1,15,15,15,1,...Array(14).fill(0)],
  /* row 40 */ [...Array(10).fill(0),1,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,1,...Array(14).fill(0)],
  /* row 41 */ [...Array(10).fill(0),1,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,1,...Array(14).fill(0)],
  /* row 42 */ [...Array(10).fill(0),1,9,9,9,10,9,9,9,9,9,9,9,9,9,10,9,9,9,1,...Array(14).fill(0)],
  /* row 43 */ [...Array(10).fill(0),1,9,9,10,10,9,9,9,9,9,9,9,9,10,10,9,9,9,1,...Array(14).fill(0)],
  /* row 44 */ [...Array(10).fill(0),1,9,9,10,11,9,9,9,1,1,9,9,9,10,11,9,9,9,1,...Array(14).fill(0)],
  /* row 45 */ [...Array(10).fill(0),1,9,10,10,11,9,9,1,...Array(3).fill(0),1,9,10,10,11,9,9,1,...Array(14).fill(0)],
  /* row 46 */ [...Array(9).fill(0),1,9,9,10,11,9,9,1,...Array(5).fill(0),1,9,10,10,11,9,9,1,...Array(13).fill(0)],
  /* row 47 */ [...Array(8).fill(0),1,9,9,10,11,9,9,1,...Array(7).fill(0),1,9,10,11,9,9,1,...Array(13).fill(0)],
  /* row 48 */ [...Array(7).fill(0),1,9,9,10,11,10,1,...Array(9).fill(0),1,10,10,11,10,9,1,...Array(13).fill(0)],
  /* row 49 */ [...Array(6).fill(0),1,9,10,10,11,10,1,...Array(11).fill(0),1,10,11,10,9,1,...Array(13).fill(0)],
  /* row 50 */ [...Array(5).fill(0),1,9,10,11,11,10,1,...Array(13).fill(0),1,10,11,10,1,...Array(14).fill(0)],
  /* row 51 */ [...Array(5).fill(0),1,9,10,11,11,1,...Array(14).fill(0),1,10,11,10,1,...Array(14).fill(0)],
  /* row 52 */ [...Array(5).fill(0),1,9,10,11,11,1,...Array(14).fill(0),1,11,11,10,1,...Array(14).fill(0)],
  /* row 53 */ [...Array(5).fill(0),1,9,10,11,10,1,...Array(14).fill(0),1,11,11,10,1,...Array(14).fill(0)],
  /* row 54 */ [...Array(5).fill(0),1,9,10,11,10,1,...Array(14).fill(0),1,11,10,10,1,...Array(14).fill(0)],
  /* row 55 */ [...Array(5).fill(0),1,10,10,11,10,1,...Array(14).fill(0),1,11,10,9,1,...Array(14).fill(0)],
  /* row 56 */ [...Array(5).fill(0),1,10,11,11,10,1,...Array(14).fill(0),1,10,10,9,1,...Array(14).fill(0)],
  /* row 57 */ [...Array(5).fill(0),1,10,11,11,9,1,...Array(15).fill(0),1,10,9,1,...Array(15).fill(0)],
  /* row 58 */ [...Array(5).fill(0),1,10,11,10,9,1,...Array(15).fill(0),1,10,9,1,...Array(15).fill(0)],
  /* row 59 */ [...Array(5).fill(0),1,10,11,10,9,1,...Array(15).fill(0),1,9,9,1,...Array(15).fill(0)],
  /* row 60 */ [...Array(5).fill(0),1,11,11,10,9,1,...Array(15).fill(0),1,9,9,1,...Array(15).fill(0)],
  /* row 61 */ [...Array(5).fill(0),1,11,10,10,9,1,...Array(15).fill(0),1,9,9,1,...Array(15).fill(0)],
  /* row 62 */ [...Array(5).fill(0),1,11,10,9,9,1,...Array(15).fill(0),1,9,9,1,...Array(15).fill(0)],
  /* row 63 */ [...Array(5).fill(0),1,10,10,9,9,1,...Array(15).fill(0),1,9,9,1,...Array(15).fill(0)],
  /* row 64 */ [...Array(5).fill(0),1,10,9,9,9,1,...Array(15).fill(0),1,9,9,1,...Array(15).fill(0)],
  /* row 65 */ [...Array(5).fill(0),1,5,6,6,5,1,...Array(15).fill(0),1,5,6,1,...Array(15).fill(0)],
  /* row 66 */ [...Array(5).fill(0),1,5,6,7,6,1,...Array(15).fill(0),1,5,6,1,...Array(15).fill(0)],
  /* row 67 */ [...Array(5).fill(0),1,5,6,7,6,5,1,...Array(14).fill(0),1,5,6,5,1,...Array(14).fill(0)],
  /* row 68 */ [...Array(5).fill(0),1,5,6,7,6,5,1,...Array(14).fill(0),1,5,6,5,1,...Array(14).fill(0)],
  /* row 69 */ [...Array(4).fill(0),1,5,6,7,7,6,5,1,...Array(14).fill(0),1,5,6,6,5,1,...Array(13).fill(0)],
  /* row 70 */ [...Array(4).fill(0),1,5,6,7,7,6,5,1,...Array(14).fill(0),1,5,6,6,5,1,...Array(13).fill(0)],
  /* row 71 */ [...Array(3).fill(0),1,1,6,7,8,7,6,5,1,...Array(13).fill(0),1,1,6,7,6,5,1,...Array(13).fill(0)],
  /* row 72 */ [...Array(2).fill(0),1,6,6,7,8,8,7,6,1,1,...Array(12).fill(0),1,6,7,7,7,6,1,...Array(13).fill(0)],
  /* row 73 */ [...Array(2).fill(0),1,5,6,7,8,8,7,6,5,1,...Array(12).fill(0),1,5,6,7,7,6,5,1,...Array(12).fill(0)],
  /* row 74 */ [...Array(2).fill(0),1,1,1,1,1,1,1,1,1,1,...Array(12).fill(0),1,1,1,1,1,1,1,1,...Array(12).fill(0)],
  /* row 75 */ Array(W).fill(0),
  /* row 76 */ Array(W).fill(0),
  /* row 77 */ Array(W).fill(0),
  /* row 78 */ Array(W).fill(0),
  /* row 79 */ Array(W).fill(0),
]

export const IDLE_1: SpriteFrame = { width: W, height: H, pixels: IDLE_1_DATA }

// --- IDLE FRAME 2: Slight inhale (torso rises ~1px, shoulders lift) ---
const IDLE_2_DATA: number[][] = [
  /* row  0 */ Array(W).fill(0),
  /* row  1 */ Array(W).fill(0),
  /* row  2 */ Array(W).fill(0),
  /* row  3 */ [...Array(19).fill(0),1,1,1,1,1,1,1,1,1,1,1,1,0,...Array(18).fill(0)],
  /* row  4 */ [...Array(17).fill(0),1,2,2,3,3,3,3,3,3,2,2,2,2,1,...Array(17).fill(0)],
  /* row  5 */ [...Array(16).fill(0),1,2,3,3,4,4,4,4,4,3,3,2,2,2,1,...Array(15).fill(0)],
  /* row  6 */ [...Array(15).fill(0),1,2,3,4,4,4,4,4,4,4,4,3,3,2,2,1,...Array(14).fill(0)],
  /* row  7 */ [...Array(15).fill(0),1,2,3,3,4,4,4,4,4,4,3,3,3,2,2,1,...Array(14).fill(0)],
  /* row  8 */ [...Array(14).fill(0),1,13,13,13,13,13,13,13,13,13,13,13,13,13,13,1,...Array(14).fill(0)],
  /* row  9 */ [...Array(14).fill(0),1,14,13,13,13,13,13,13,13,13,13,13,13,14,14,1,...Array(14).fill(0)],
  /* row 10 */ [...Array(14).fill(0),1,6,6,6,7,7,7,7,7,7,7,7,6,6,6,1,...Array(14).fill(0)],
  /* row 11 */ [...Array(14).fill(0),1,6,5,1,7,7,6,6,6,7,7,1,5,6,6,1,...Array(14).fill(0)],
  /* row 12 */ [...Array(14).fill(0),1,6,6,1,1,7,6,6,6,7,1,1,6,6,6,1,...Array(14).fill(0)],
  /* row 13 */ [...Array(15).fill(0),1,6,6,6,7,7,6,6,7,7,6,6,6,6,1,...Array(15).fill(0)],
  /* row 14 */ [...Array(15).fill(0),1,5,6,6,6,6,7,7,6,6,6,6,6,5,1,...Array(15).fill(0)],
  /* row 15 */ [...Array(15).fill(0),1,5,5,6,6,6,6,6,6,6,6,6,5,5,1,...Array(15).fill(0)],
  /* row 16 */ [...Array(16).fill(0),1,5,5,6,6,1,1,6,6,5,5,5,5,1,...Array(16).fill(0)],
  /* row 17 */ [...Array(17).fill(0),1,1,5,6,6,6,6,6,5,5,1,1,...Array(18).fill(0)],
  /* row 18 */ [...Array(18).fill(0),0,1,5,6,6,6,6,5,1,0,...Array(19).fill(0)],
  /* row 19 */ [...Array(19).fill(0),1,1,6,6,6,6,1,1,...Array(20).fill(0)],
  /* row 20 */ [...Array(19).fill(0),0,1,6,6,6,6,1,0,...Array(20).fill(0)],
  /* row 21 */ [...Array(19).fill(0),0,1,5,6,6,5,1,0,...Array(20).fill(0)],
  /* row 22 */ [...Array(15).fill(0),1,1,1,1,1,1,5,6,5,1,1,1,1,1,...Array(19).fill(0)],
  /* row 23 */ [...Array(13).fill(0),1,9,9,10,9,9,1,6,6,6,1,9,9,10,9,9,1,...Array(16).fill(0)],
  /* row 24 */ [...Array(12).fill(0),1,9,9,9,10,9,9,1,5,6,5,1,9,9,9,10,9,9,1,...Array(15).fill(0)],
  /* row 25 */ [...Array(11).fill(0),1,9,9,9,9,10,9,9,1,1,1,9,9,9,9,9,10,9,9,1,...Array(14).fill(0)],
  /* row 26 */ [...Array(10).fill(0),1,9,9,9,9,9,10,9,9,9,9,9,9,9,9,9,9,10,9,9,1,...Array(13).fill(0)],
  /* row 27 */ [...Array(9).fill(0),1,9,9,9,10,10,9,9,9,9,9,9,9,9,9,10,10,9,9,9,9,1,...Array(12).fill(0)],
  /* row 28 */ [...Array(8).fill(0),1,6,9,9,10,11,9,9,9,9,9,9,9,9,9,10,11,9,9,9,6,6,1,...Array(11).fill(0)],
  /* row 29 */ [...Array(7).fill(0),1,6,7,9,9,11,10,9,9,9,9,9,9,9,9,11,10,9,9,7,6,6,1,...Array(11).fill(0)],
  /* row 30 */ [...Array(7).fill(0),1,5,6,9,9,9,10,9,9,9,9,9,9,9,9,9,10,9,9,6,5,6,1,...Array(11).fill(0)],
  /* row 31 */ [...Array(7).fill(0),1,5,6,7,9,9,10,9,9,10,10,10,10,9,9,9,10,9,7,6,5,1,...Array(12).fill(0)],
  /* row 32 */ [...Array(8).fill(0),1,5,6,9,9,9,9,10,10,11,11,11,10,10,9,9,9,9,6,5,1,...Array(12).fill(0)],
  /* row 33 */ [...Array(8).fill(0),1,5,6,7,9,9,9,9,10,10,10,10,10,9,9,9,9,7,6,5,1,...Array(12).fill(0)],
  /* row 34 */ [...Array(9).fill(0),1,5,6,9,9,9,9,9,9,9,9,9,9,9,9,9,9,6,5,1,...Array(13).fill(0)],
  /* row 35 */ [...Array(9).fill(0),1,5,6,9,9,9,9,9,9,9,9,9,9,9,9,9,9,6,5,1,...Array(13).fill(0)],
  /* row 36 */ [...Array(10).fill(0),1,5,6,9,9,9,9,9,9,9,9,9,9,9,9,9,6,5,1,...Array(14).fill(0)],
  /* row 37 */ [...Array(10).fill(0),1,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,1,...Array(14).fill(0)],
  /* row 38 */ [...Array(10).fill(0),1,15,15,1,1,15,15,15,15,15,15,15,15,1,1,15,15,15,1,...Array(14).fill(0)],
  /* row 39 */ [...Array(10).fill(0),1,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,1,...Array(14).fill(0)],
  /* row 40 */ [...Array(10).fill(0),1,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,1,...Array(14).fill(0)],
  /* row 41 */ [...Array(10).fill(0),1,9,9,9,10,9,9,9,9,9,9,9,9,9,10,9,9,9,1,...Array(14).fill(0)],
  /* row 42 */ [...Array(10).fill(0),1,9,9,10,10,9,9,9,9,9,9,9,9,10,10,9,9,9,1,...Array(14).fill(0)],
  /* row 43 */ [...Array(10).fill(0),1,9,9,10,11,9,9,9,1,1,9,9,9,10,11,9,9,9,1,...Array(14).fill(0)],
  /* row 44 */ [...Array(10).fill(0),1,9,10,10,11,9,9,1,...Array(3).fill(0),1,9,10,10,11,9,9,1,...Array(14).fill(0)],
  /* row 45 */ [...Array(9).fill(0),1,9,9,10,11,9,9,1,...Array(5).fill(0),1,9,10,10,11,9,9,1,...Array(13).fill(0)],
  /* row 46 */ [...Array(8).fill(0),1,9,9,10,11,9,9,1,...Array(7).fill(0),1,9,10,11,9,9,1,...Array(13).fill(0)],
  /* row 47 */ [...Array(7).fill(0),1,9,9,10,11,10,1,...Array(9).fill(0),1,10,10,11,10,9,1,...Array(13).fill(0)],
  /* row 48 */ [...Array(6).fill(0),1,9,10,10,11,10,1,...Array(11).fill(0),1,10,11,10,9,1,...Array(13).fill(0)],
  /* row 49 */ [...Array(5).fill(0),1,9,10,11,11,10,1,...Array(13).fill(0),1,10,11,10,1,...Array(14).fill(0)],
  /* row 50 */ [...Array(5).fill(0),1,9,10,11,11,1,...Array(14).fill(0),1,10,11,10,1,...Array(14).fill(0)],
  /* row 51 */ [...Array(5).fill(0),1,9,10,11,11,1,...Array(14).fill(0),1,11,11,10,1,...Array(14).fill(0)],
  /* row 52 */ [...Array(5).fill(0),1,9,10,11,10,1,...Array(14).fill(0),1,11,11,10,1,...Array(14).fill(0)],
  /* row 53 */ [...Array(5).fill(0),1,9,10,11,10,1,...Array(14).fill(0),1,11,10,10,1,...Array(14).fill(0)],
  /* row 54 */ [...Array(5).fill(0),1,10,10,11,10,1,...Array(14).fill(0),1,11,10,9,1,...Array(14).fill(0)],
  /* row 55 */ [...Array(5).fill(0),1,10,11,11,10,1,...Array(14).fill(0),1,10,10,9,1,...Array(14).fill(0)],
  /* row 56 */ [...Array(5).fill(0),1,10,11,11,9,1,...Array(15).fill(0),1,10,9,1,...Array(15).fill(0)],
  /* row 57 */ [...Array(5).fill(0),1,10,11,10,9,1,...Array(15).fill(0),1,10,9,1,...Array(15).fill(0)],
  /* row 58 */ [...Array(5).fill(0),1,10,11,10,9,1,...Array(15).fill(0),1,9,9,1,...Array(15).fill(0)],
  /* row 59 */ [...Array(5).fill(0),1,11,11,10,9,1,...Array(15).fill(0),1,9,9,1,...Array(15).fill(0)],
  /* row 60 */ [...Array(5).fill(0),1,11,10,10,9,1,...Array(15).fill(0),1,9,9,1,...Array(15).fill(0)],
  /* row 61 */ [...Array(5).fill(0),1,11,10,9,9,1,...Array(15).fill(0),1,9,9,1,...Array(15).fill(0)],
  /* row 62 */ [...Array(5).fill(0),1,10,10,9,9,1,...Array(15).fill(0),1,9,9,1,...Array(15).fill(0)],
  /* row 63 */ [...Array(5).fill(0),1,10,9,9,9,1,...Array(15).fill(0),1,9,9,1,...Array(15).fill(0)],
  /* row 64 */ [...Array(5).fill(0),1,5,6,6,5,1,...Array(15).fill(0),1,5,6,1,...Array(15).fill(0)],
  /* row 65 */ [...Array(5).fill(0),1,5,6,7,6,1,...Array(15).fill(0),1,5,6,1,...Array(15).fill(0)],
  /* row 66 */ [...Array(5).fill(0),1,5,6,7,6,5,1,...Array(14).fill(0),1,5,6,5,1,...Array(14).fill(0)],
  /* row 67 */ [...Array(5).fill(0),1,5,6,7,6,5,1,...Array(14).fill(0),1,5,6,5,1,...Array(14).fill(0)],
  /* row 68 */ [...Array(4).fill(0),1,5,6,7,7,6,5,1,...Array(14).fill(0),1,5,6,6,5,1,...Array(13).fill(0)],
  /* row 69 */ [...Array(4).fill(0),1,5,6,7,7,6,5,1,...Array(14).fill(0),1,5,6,6,5,1,...Array(13).fill(0)],
  /* row 70 */ [...Array(3).fill(0),1,1,6,7,8,7,6,5,1,...Array(13).fill(0),1,1,6,7,6,5,1,...Array(13).fill(0)],
  /* row 71 */ [...Array(2).fill(0),1,6,6,7,8,8,7,6,1,1,...Array(12).fill(0),1,6,7,7,7,6,1,...Array(13).fill(0)],
  /* row 72 */ [...Array(2).fill(0),1,5,6,7,8,8,7,6,5,1,...Array(12).fill(0),1,5,6,7,7,6,5,1,...Array(12).fill(0)],
  /* row 73 */ [...Array(2).fill(0),1,1,1,1,1,1,1,1,1,1,...Array(12).fill(0),1,1,1,1,1,1,1,1,...Array(12).fill(0)],
  /* row 74 */ Array(W).fill(0),
  /* row 75 */ Array(W).fill(0),
  /* row 76 */ Array(W).fill(0),
  /* row 77 */ Array(W).fill(0),
  /* row 78 */ Array(W).fill(0),
  /* row 79 */ Array(W).fill(0),
]

export const IDLE_2: SpriteFrame = { width: W, height: H, pixels: IDLE_2_DATA }

// --- IDLE FRAME 3: Peak inhale (chest expanded, shoulders at highest) ---
// Same as IDLE_2 but with slight chest width increase
const IDLE_3_DATA: number[][] = IDLE_2_DATA.map((row, i) => {
  // Chest rows 26-34: widen by 1px each side
  if (i >= 26 && i <= 34) {
    const copy = [...row]
    // Find leftmost non-zero
    const left = copy.findIndex(v => v !== 0)
    if (left > 0) {
      copy[left - 1] = 1
      copy[left] = 9
    }
    return copy
  }
  return [...row]
})

export const IDLE_3: SpriteFrame = { width: W, height: H, pixels: IDLE_3_DATA }

// --- IDLE FRAME 4: Exhale (returning to neutral, slight forward lean) ---
// Blend between IDLE_2 and IDLE_1 with slight forward shift
const IDLE_4_DATA: number[][] = IDLE_1_DATA.map((row, i) => {
  // Torso rows shift 1px right for forward lean
  if (i >= 23 && i <= 40) {
    const copy = Array(W).fill(0)
    for (let c = 0; c < W - 1; c++) {
      if (row[c] !== 0) copy[c + 1] = row[c]
    }
    return copy
  }
  return [...row]
})

export const IDLE_4: SpriteFrame = { width: W, height: H, pixels: IDLE_4_DATA }

// --- JAB FRAME 1: Wind-up (rear hand pulls back, weight shifts) ---
const JAB_1_DATA: number[][] = IDLE_1_DATA.map((row, i) => {
  const copy = [...row]
  // Arms rows: shift lead arm 2px left (winding up)
  if (i >= 28 && i <= 33) {
    // Lead arm is on the left side — shift left by 1
    for (let c = 1; c < W; c++) {
      if (copy[c] !== 0 && c < 15) {
        if (c - 1 >= 0) copy[c - 1] = copy[c]
        copy[c] = 0
      }
    }
  }
  return copy
})

export const JAB_1: SpriteFrame = { width: W, height: H, pixels: JAB_1_DATA }

// --- JAB FRAME 2: Extension start (lead arm extending forward) ---
const JAB_2_DATA: number[][] = [
  /* row  0 */ Array(W).fill(0),
  /* row  1 */ Array(W).fill(0),
  /* row  2 */ Array(W).fill(0),
  /* row  3 */ Array(W).fill(0),
  /* row  4 */ [...Array(19).fill(0),1,1,1,1,1,1,1,1,1,1,1,1,0,...Array(18).fill(0)],
  /* row  5 */ [...Array(17).fill(0),1,2,2,3,3,3,3,3,3,2,2,2,2,1,...Array(17).fill(0)],
  /* row  6 */ [...Array(16).fill(0),1,2,3,3,4,4,4,4,4,3,3,2,2,2,1,...Array(15).fill(0)],
  /* row  7 */ [...Array(15).fill(0),1,2,3,4,4,4,4,4,4,4,4,3,3,2,2,1,...Array(14).fill(0)],
  /* row  8 */ [...Array(15).fill(0),1,2,3,3,4,4,4,4,4,4,3,3,3,2,2,1,...Array(14).fill(0)],
  /* row  9 */ [...Array(14).fill(0),1,13,13,13,13,13,13,13,13,13,13,13,13,13,13,1,...Array(14).fill(0)],
  /* row 10 */ [...Array(14).fill(0),1,14,13,13,13,13,13,13,13,13,13,13,13,14,14,1,...Array(14).fill(0)],
  /* row 11 */ [...Array(14).fill(0),1,6,6,6,7,7,7,7,7,7,7,7,6,6,6,1,...Array(14).fill(0)],
  /* row 12 */ [...Array(14).fill(0),1,6,5,1,7,7,6,6,6,7,7,1,5,6,6,1,...Array(14).fill(0)],
  /* row 13 */ [...Array(14).fill(0),1,6,6,1,1,7,6,6,6,7,1,1,6,6,6,1,...Array(14).fill(0)],
  /* row 14 */ [...Array(15).fill(0),1,6,6,6,7,7,6,6,7,7,6,6,6,6,1,...Array(15).fill(0)],
  /* row 15 */ [...Array(15).fill(0),1,5,6,6,6,6,7,7,6,6,6,6,6,5,1,...Array(15).fill(0)],
  /* row 16 */ [...Array(15).fill(0),1,5,5,6,6,6,6,6,6,6,6,6,5,5,1,...Array(15).fill(0)],
  /* row 17 */ [...Array(16).fill(0),1,5,5,6,6,1,1,6,6,5,5,5,5,1,...Array(16).fill(0)],
  /* row 18 */ [...Array(17).fill(0),1,1,5,6,6,6,6,6,5,5,1,1,...Array(18).fill(0)],
  /* row 19 */ [...Array(18).fill(0),0,1,5,6,6,6,6,5,1,0,...Array(19).fill(0)],
  /* row 20 */ [...Array(19).fill(0),1,1,6,6,6,6,1,1,...Array(20).fill(0)],
  /* row 21 */ [...Array(19).fill(0),0,1,6,6,6,6,1,0,...Array(20).fill(0)],
  /* row 22 */ [...Array(19).fill(0),0,1,5,6,6,5,1,0,...Array(20).fill(0)],
  /* row 23 */ [...Array(15).fill(0),1,1,1,1,1,1,5,6,5,1,1,1,1,1,...Array(19).fill(0)],
  /* row 24 */ [...Array(13).fill(0),1,9,9,10,9,9,1,6,6,6,1,9,9,10,9,9,1,...Array(16).fill(0)],
  /* row 25 */ [...Array(12).fill(0),1,9,9,9,10,9,9,1,5,6,5,1,9,9,9,10,9,9,1,...Array(15).fill(0)],
  /* row 26 */ [...Array(11).fill(0),1,9,9,9,9,10,9,9,1,1,1,9,9,9,9,9,10,9,9,1,...Array(14).fill(0)],
  /* row 27 */ [...Array(10).fill(0),1,9,9,9,9,9,10,9,9,9,9,9,9,9,9,9,9,10,9,9,1,...Array(13).fill(0)],
  /* row 28 */ [...Array(9).fill(0),1,9,9,9,10,10,9,9,9,9,9,9,9,9,9,10,10,9,9,9,9,1,...Array(12).fill(0)],
  /* row 29 */ [...Array(8).fill(0),1,6,9,9,10,11,9,9,9,9,9,9,9,9,9,10,11,9,9,9,6,6,1,...Array(11).fill(0)],
  /* row 30 */ [...Array(5).fill(0),1,6,7,6,1,6,7,9,9,11,10,9,9,9,9,9,9,11,10,9,9,7,6,6,1,...Array(11).fill(0)],
  /* row 31 */ [...Array(3).fill(0),1,6,7,6,6,5,1,5,6,9,9,9,10,9,9,9,9,9,9,9,10,9,9,6,5,6,1,...Array(11).fill(0)],
  /* row 32 */ [...Array(2).fill(0),1,13,13,13,1,1,1,5,6,7,9,9,10,9,9,10,10,10,10,9,10,9,7,6,5,1,...Array(12).fill(0)],
  /* row 33 */ [...Array(2).fill(0),1,13,14,13,1,0,1,5,6,9,9,9,9,10,10,11,11,11,10,10,9,9,9,6,5,1,...Array(12).fill(0)],
  /* row 34 */ [...Array(3).fill(0),1,1,1,...Array(3).fill(0),1,5,6,7,9,9,9,9,10,10,10,10,10,9,9,9,7,6,5,1,...Array(12).fill(0)],
  /* row 35 */ [...Array(9).fill(0),1,5,6,9,9,9,9,9,9,9,9,9,9,9,9,9,9,6,5,1,...Array(13).fill(0)],
  /* row 36 */ [...Array(9).fill(0),1,5,6,9,9,9,9,9,9,9,9,9,9,9,9,9,9,6,5,1,...Array(13).fill(0)],
  /* row 37 */ [...Array(10).fill(0),1,5,6,9,9,9,9,9,9,9,9,9,9,9,9,9,6,5,1,...Array(14).fill(0)],
  /* row 38 */ [...Array(10).fill(0),1,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,1,...Array(14).fill(0)],
  /* row 39 */ [...Array(10).fill(0),1,15,15,1,1,15,15,15,15,15,15,15,15,1,1,15,15,15,1,...Array(14).fill(0)],
  /* row 40 */ [...Array(10).fill(0),1,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,1,...Array(14).fill(0)],
  /* row 41 */ [...Array(10).fill(0),1,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,1,...Array(14).fill(0)],
  /* row 42 */ [...Array(10).fill(0),1,9,9,9,10,9,9,9,9,9,9,9,9,9,10,9,9,9,1,...Array(14).fill(0)],
  /* row 43 */ [...Array(10).fill(0),1,9,9,10,10,9,9,9,9,9,9,9,9,10,10,9,9,9,1,...Array(14).fill(0)],
  /* row 44 */ [...Array(10).fill(0),1,9,9,10,11,9,9,9,1,1,9,9,9,10,11,9,9,9,1,...Array(14).fill(0)],
  /* row 45 */ [...Array(10).fill(0),1,9,10,10,11,9,9,1,...Array(3).fill(0),1,9,10,10,11,9,9,1,...Array(14).fill(0)],
  /* row 46 */ [...Array(9).fill(0),1,9,9,10,11,9,9,1,...Array(5).fill(0),1,9,10,10,11,9,9,1,...Array(13).fill(0)],
  /* row 47 */ [...Array(8).fill(0),1,9,9,10,11,9,9,1,...Array(7).fill(0),1,9,10,11,9,9,1,...Array(13).fill(0)],
  /* row 48 */ [...Array(7).fill(0),1,9,9,10,11,10,1,...Array(9).fill(0),1,10,10,11,10,9,1,...Array(13).fill(0)],
  /* row 49 */ [...Array(6).fill(0),1,9,10,10,11,10,1,...Array(11).fill(0),1,10,11,10,9,1,...Array(13).fill(0)],
  /* row 50 */ [...Array(5).fill(0),1,9,10,11,11,10,1,...Array(13).fill(0),1,10,11,10,1,...Array(14).fill(0)],
  /* row 51 */ [...Array(5).fill(0),1,9,10,11,11,1,...Array(14).fill(0),1,10,11,10,1,...Array(14).fill(0)],
  /* row 52 */ [...Array(5).fill(0),1,9,10,11,11,1,...Array(14).fill(0),1,11,11,10,1,...Array(14).fill(0)],
  /* row 53 */ [...Array(5).fill(0),1,9,10,11,10,1,...Array(14).fill(0),1,11,11,10,1,...Array(14).fill(0)],
  /* row 54 */ [...Array(5).fill(0),1,9,10,11,10,1,...Array(14).fill(0),1,11,10,10,1,...Array(14).fill(0)],
  /* row 55 */ [...Array(5).fill(0),1,10,10,11,10,1,...Array(14).fill(0),1,11,10,9,1,...Array(14).fill(0)],
  /* row 56 */ [...Array(5).fill(0),1,10,11,11,10,1,...Array(14).fill(0),1,10,10,9,1,...Array(14).fill(0)],
  /* row 57 */ [...Array(5).fill(0),1,10,11,11,9,1,...Array(15).fill(0),1,10,9,1,...Array(15).fill(0)],
  /* row 58 */ [...Array(5).fill(0),1,10,11,10,9,1,...Array(15).fill(0),1,10,9,1,...Array(15).fill(0)],
  /* row 59 */ [...Array(5).fill(0),1,10,11,10,9,1,...Array(15).fill(0),1,9,9,1,...Array(15).fill(0)],
  /* row 60 */ [...Array(5).fill(0),1,11,11,10,9,1,...Array(15).fill(0),1,9,9,1,...Array(15).fill(0)],
  /* row 61 */ [...Array(5).fill(0),1,11,10,10,9,1,...Array(15).fill(0),1,9,9,1,...Array(15).fill(0)],
  /* row 62 */ [...Array(5).fill(0),1,11,10,9,9,1,...Array(15).fill(0),1,9,9,1,...Array(15).fill(0)],
  /* row 63 */ [...Array(5).fill(0),1,10,10,9,9,1,...Array(15).fill(0),1,9,9,1,...Array(15).fill(0)],
  /* row 64 */ [...Array(5).fill(0),1,10,9,9,9,1,...Array(15).fill(0),1,9,9,1,...Array(15).fill(0)],
  /* row 65 */ [...Array(5).fill(0),1,5,6,6,5,1,...Array(15).fill(0),1,5,6,1,...Array(15).fill(0)],
  /* row 66 */ [...Array(5).fill(0),1,5,6,7,6,1,...Array(15).fill(0),1,5,6,1,...Array(15).fill(0)],
  /* row 67 */ [...Array(5).fill(0),1,5,6,7,6,5,1,...Array(14).fill(0),1,5,6,5,1,...Array(14).fill(0)],
  /* row 68 */ [...Array(5).fill(0),1,5,6,7,6,5,1,...Array(14).fill(0),1,5,6,5,1,...Array(14).fill(0)],
  /* row 69 */ [...Array(4).fill(0),1,5,6,7,7,6,5,1,...Array(14).fill(0),1,5,6,6,5,1,...Array(13).fill(0)],
  /* row 70 */ [...Array(4).fill(0),1,5,6,7,7,6,5,1,...Array(14).fill(0),1,5,6,6,5,1,...Array(13).fill(0)],
  /* row 71 */ [...Array(3).fill(0),1,1,6,7,8,7,6,5,1,...Array(13).fill(0),1,1,6,7,6,5,1,...Array(13).fill(0)],
  /* row 72 */ [...Array(2).fill(0),1,6,6,7,8,8,7,6,1,1,...Array(12).fill(0),1,6,7,7,7,6,1,...Array(13).fill(0)],
  /* row 73 */ [...Array(2).fill(0),1,5,6,7,8,8,7,6,5,1,...Array(12).fill(0),1,5,6,7,7,6,5,1,...Array(12).fill(0)],
  /* row 74 */ [...Array(2).fill(0),1,1,1,1,1,1,1,1,1,1,...Array(12).fill(0),1,1,1,1,1,1,1,1,...Array(12).fill(0)],
  /* row 75 */ Array(W).fill(0),
  /* row 76 */ Array(W).fill(0),
  /* row 77 */ Array(W).fill(0),
  /* row 78 */ Array(W).fill(0),
  /* row 79 */ Array(W).fill(0),
]

export const JAB_2: SpriteFrame = { width: W, height: H, pixels: JAB_2_DATA }

// --- JAB FRAME 3: Full extension (lead arm straight, fist at max reach) ---
const JAB_3_DATA: number[][] = [
  /* row  0 */ Array(W).fill(0),
  /* row  1 */ Array(W).fill(0),
  /* row  2 */ Array(W).fill(0),
  /* row  3 */ Array(W).fill(0),
  /* row  4 */ [...Array(20).fill(0),1,1,1,1,1,1,1,1,1,1,1,1,0,...Array(17).fill(0)],
  /* row  5 */ [...Array(18).fill(0),1,2,2,3,3,3,3,3,3,2,2,2,2,1,...Array(17).fill(0)],
  /* row  6 */ [...Array(17).fill(0),1,2,3,3,4,4,4,4,4,3,3,2,2,2,1,...Array(15).fill(0)],
  /* row  7 */ [...Array(16).fill(0),1,2,3,4,4,4,4,4,4,4,4,3,3,2,2,1,...Array(13).fill(0)],
  /* row  8 */ [...Array(16).fill(0),1,2,3,3,4,4,4,4,4,4,3,3,3,2,2,1,...Array(13).fill(0)],
  /* row  9 */ [...Array(15).fill(0),1,13,13,13,13,13,13,13,13,13,13,13,13,13,13,1,...Array(13).fill(0)],
  /* row 10 */ [...Array(15).fill(0),1,14,13,13,13,13,13,13,13,13,13,13,13,14,14,1,...Array(13).fill(0)],
  /* row 11 */ [...Array(15).fill(0),1,6,6,6,7,7,7,7,7,7,7,7,6,6,6,1,...Array(13).fill(0)],
  /* row 12 */ [...Array(15).fill(0),1,6,5,1,7,7,6,6,6,7,7,1,5,6,6,1,...Array(13).fill(0)],
  /* row 13 */ [...Array(15).fill(0),1,6,6,1,1,7,6,6,6,7,1,1,6,6,6,1,...Array(13).fill(0)],
  /* row 14 */ [...Array(16).fill(0),1,6,6,6,7,7,6,6,7,7,6,6,6,6,1,...Array(14).fill(0)],
  /* row 15 */ [...Array(16).fill(0),1,5,6,6,6,6,7,7,6,6,6,6,6,5,1,...Array(14).fill(0)],
  /* row 16 */ [...Array(16).fill(0),1,5,5,6,6,6,6,6,6,6,6,6,5,5,1,...Array(14).fill(0)],
  /* row 17 */ [...Array(17).fill(0),1,5,5,6,6,1,1,6,6,5,5,5,5,1,...Array(15).fill(0)],
  /* row 18 */ [...Array(18).fill(0),1,1,5,6,6,6,6,6,5,5,1,1,...Array(17).fill(0)],
  /* row 19 */ [...Array(19).fill(0),0,1,5,6,6,6,6,5,1,0,...Array(18).fill(0)],
  /* row 20 */ [...Array(20).fill(0),1,1,6,6,6,6,1,1,...Array(19).fill(0)],
  /* row 21 */ [...Array(20).fill(0),0,1,6,6,6,6,1,0,...Array(19).fill(0)],
  /* row 22 */ [...Array(20).fill(0),0,1,5,6,6,5,1,0,...Array(19).fill(0)],
  /* row 23 */ [...Array(16).fill(0),1,1,1,1,1,1,5,6,5,1,1,1,1,1,...Array(18).fill(0)],
  /* row 24 */ [...Array(14).fill(0),1,9,9,10,9,9,1,6,6,6,1,9,9,10,9,9,1,...Array(15).fill(0)],
  /* row 25 */ [...Array(13).fill(0),1,9,9,9,10,9,9,1,5,6,5,1,9,9,9,10,9,9,1,...Array(14).fill(0)],
  /* row 26 */ [...Array(12).fill(0),1,9,9,9,9,10,9,9,1,1,1,9,9,9,9,9,10,9,9,1,...Array(13).fill(0)],
  /* row 27 */ [...Array(11).fill(0),1,9,9,9,9,9,10,9,9,9,9,9,9,9,9,9,9,10,9,9,1,...Array(12).fill(0)],
  /* row 28 */ [...Array(10).fill(0),1,9,9,9,10,10,9,9,9,9,9,9,9,9,9,10,10,9,9,9,9,1,...Array(11).fill(0)],
  /* row 29 */ [...Array(9).fill(0),1,6,9,9,10,11,9,9,9,9,9,9,9,9,9,10,11,9,9,9,6,6,1,...Array(10).fill(0)],
  /* row 30 */ [0,0,1,13,13,13,1,1,6,7,6,1,6,7,9,9,11,10,9,9,9,9,9,9,11,10,9,9,7,6,6,1,...Array(11).fill(0),0,0,0,0,0,0,0],
  /* row 31 */ [0,1,13,14,13,13,6,6,7,6,5,1,5,6,9,9,9,10,9,9,9,9,9,9,9,10,9,9,6,5,6,1,...Array(11).fill(0),0,0,0,0,0,0,0],
  /* row 32 */ [0,1,13,13,14,5,6,7,6,5,1,...Array(2).fill(0),1,6,7,9,9,10,9,9,10,10,10,10,10,9,7,6,5,1,...Array(12).fill(0),0,0,0,0,0,0],
  /* row 33 */ [0,0,1,1,1,5,6,6,5,1,...Array(4).fill(0),1,5,6,9,9,9,10,10,11,11,11,10,10,9,9,6,5,1,...Array(12).fill(0),0,0,0,0,0,0],
  /* row 34 */ [...Array(9).fill(0),0,...Array(4).fill(0),1,5,6,7,9,9,9,9,10,10,10,10,9,9,9,7,6,5,1,...Array(12).fill(0)],
  /* row 35 */ [...Array(10).fill(0),...Array(4).fill(0),1,5,6,9,9,9,9,9,9,9,9,9,9,9,9,6,5,1,...Array(13).fill(0)],
  /* row 36 */ [...Array(10).fill(0),...Array(4).fill(0),1,5,6,9,9,9,9,9,9,9,9,9,9,9,9,6,5,1,...Array(13).fill(0)],
  /* row 37 */ [...Array(11).fill(0),...Array(3).fill(0),1,5,6,9,9,9,9,9,9,9,9,9,9,9,9,6,5,1,...Array(13).fill(0)],
  /* row 38 */ [...Array(11).fill(0),...Array(3).fill(0),1,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,1,...Array(13).fill(0)],
  /* row 39 */ [...Array(11).fill(0),...Array(3).fill(0),1,15,15,1,1,15,15,15,15,15,15,15,15,1,1,15,15,1,...Array(13).fill(0)],
  /* row 40 */ [...Array(11).fill(0),...Array(3).fill(0),1,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,1,...Array(13).fill(0)],
  /* row 41 */ [...Array(11).fill(0),...Array(3).fill(0),1,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,1,...Array(13).fill(0)],
  /* row 42 */ [...Array(11).fill(0),...Array(3).fill(0),1,9,9,9,10,9,9,9,9,9,9,9,9,10,9,9,9,1,...Array(13).fill(0)],
  /* row 43 */ [...Array(11).fill(0),...Array(3).fill(0),1,9,9,10,10,9,9,9,9,9,9,9,10,10,9,9,9,1,...Array(13).fill(0)],
  /* row 44 */ [...Array(11).fill(0),...Array(3).fill(0),1,9,9,10,11,9,9,9,1,1,9,9,10,11,9,9,9,1,...Array(13).fill(0)],
  /* row 45 */ [...Array(11).fill(0),...Array(3).fill(0),1,9,10,10,11,9,9,1,...Array(3).fill(0),1,10,10,11,9,9,1,...Array(13).fill(0)],
  /* row 46 */ [...Array(10).fill(0),...Array(3).fill(0),1,9,9,10,11,9,9,1,...Array(5).fill(0),1,10,10,11,9,9,1,...Array(12).fill(0)],
  /* row 47 */ [...Array(9).fill(0),...Array(3).fill(0),1,9,9,10,11,9,9,1,...Array(7).fill(0),1,10,11,9,9,1,...Array(12).fill(0)],
  /* row 48 */ [...Array(8).fill(0),...Array(3).fill(0),1,9,9,10,11,10,1,...Array(9).fill(0),1,10,11,10,9,1,...Array(12).fill(0)],
  /* row 49 */ [...Array(7).fill(0),...Array(3).fill(0),1,9,10,10,11,10,1,...Array(11).fill(0),1,10,11,10,1,...Array(12).fill(0)],
  /* row 50 */ [...Array(6).fill(0),...Array(3).fill(0),1,9,10,11,11,10,1,...Array(13).fill(0),1,10,11,1,...Array(13).fill(0)],
  /* row 51 */ [...Array(6).fill(0),...Array(3).fill(0),1,9,10,11,11,1,...Array(14).fill(0),1,10,11,1,...Array(13).fill(0)],
  /* row 52 */ [...Array(6).fill(0),...Array(3).fill(0),1,9,10,11,11,1,...Array(14).fill(0),1,11,11,1,...Array(13).fill(0)],
  /* row 53 */ [...Array(6).fill(0),...Array(3).fill(0),1,9,10,11,10,1,...Array(14).fill(0),1,11,10,1,...Array(13).fill(0)],
  /* row 54 */ [...Array(6).fill(0),...Array(3).fill(0),1,9,10,11,10,1,...Array(14).fill(0),1,11,10,1,...Array(13).fill(0)],
  /* row 55 */ [...Array(6).fill(0),...Array(3).fill(0),1,10,10,11,10,1,...Array(14).fill(0),1,10,9,1,...Array(13).fill(0)],
  /* row 56 */ [...Array(6).fill(0),...Array(3).fill(0),1,10,11,11,10,1,...Array(14).fill(0),1,10,9,1,...Array(13).fill(0)],
  /* row 57 */ [...Array(6).fill(0),...Array(3).fill(0),1,10,11,11,9,1,...Array(15).fill(0),1,9,1,...Array(14).fill(0)],
  /* row 58 */ [...Array(6).fill(0),...Array(3).fill(0),1,10,11,10,9,1,...Array(15).fill(0),1,9,1,...Array(14).fill(0)],
  /* row 59 */ [...Array(6).fill(0),...Array(3).fill(0),1,10,11,10,9,1,...Array(15).fill(0),1,9,1,...Array(14).fill(0)],
  /* row 60 */ [...Array(6).fill(0),...Array(3).fill(0),1,11,11,10,9,1,...Array(15).fill(0),1,9,1,...Array(14).fill(0)],
  /* row 61 */ [...Array(6).fill(0),...Array(3).fill(0),1,11,10,10,9,1,...Array(15).fill(0),1,9,1,...Array(14).fill(0)],
  /* row 62 */ [...Array(6).fill(0),...Array(3).fill(0),1,11,10,9,9,1,...Array(15).fill(0),1,9,1,...Array(14).fill(0)],
  /* row 63 */ [...Array(6).fill(0),...Array(3).fill(0),1,10,10,9,9,1,...Array(15).fill(0),1,9,1,...Array(14).fill(0)],
  /* row 64 */ [...Array(6).fill(0),...Array(3).fill(0),1,10,9,9,9,1,...Array(15).fill(0),1,9,1,...Array(14).fill(0)],
  /* row 65 */ [...Array(6).fill(0),...Array(3).fill(0),1,5,6,6,5,1,...Array(15).fill(0),1,5,1,...Array(14).fill(0)],
  /* row 66 */ [...Array(6).fill(0),...Array(3).fill(0),1,5,6,7,6,1,...Array(15).fill(0),1,5,1,...Array(14).fill(0)],
  /* row 67 */ [...Array(6).fill(0),...Array(3).fill(0),1,5,6,7,6,5,1,...Array(14).fill(0),1,5,6,1,...Array(13).fill(0)],
  /* row 68 */ [...Array(6).fill(0),...Array(3).fill(0),1,5,6,7,6,5,1,...Array(14).fill(0),1,5,6,1,...Array(13).fill(0)],
  /* row 69 */ [...Array(5).fill(0),...Array(3).fill(0),1,5,6,7,7,6,5,1,...Array(14).fill(0),1,5,6,5,1,...Array(12).fill(0)],
  /* row 70 */ [...Array(5).fill(0),...Array(3).fill(0),1,5,6,7,7,6,5,1,...Array(14).fill(0),1,5,6,5,1,...Array(12).fill(0)],
  /* row 71 */ [...Array(4).fill(0),...Array(3).fill(0),1,1,6,7,8,7,6,5,1,...Array(13).fill(0),1,1,6,7,6,1,...Array(12).fill(0)],
  /* row 72 */ [...Array(3).fill(0),...Array(3).fill(0),1,6,6,7,8,8,7,6,1,1,...Array(12).fill(0),1,6,7,7,7,1,...Array(12).fill(0)],
  /* row 73 */ [...Array(3).fill(0),...Array(3).fill(0),1,5,6,7,8,8,7,6,5,1,...Array(12).fill(0),1,5,6,7,7,6,1,...Array(11).fill(0)],
  /* row 74 */ [...Array(3).fill(0),...Array(3).fill(0),1,1,1,1,1,1,1,1,1,1,...Array(12).fill(0),1,1,1,1,1,1,1,...Array(11).fill(0)],
  /* row 75 */ Array(W).fill(0),
  /* row 76 */ Array(W).fill(0),
  /* row 77 */ Array(W).fill(0),
  /* row 78 */ Array(W).fill(0),
  /* row 79 */ Array(W).fill(0),
]

export const JAB_3: SpriteFrame = { width: W, height: H, pixels: JAB_3_DATA }

// --- JAB FRAME 4: Retraction (arm pulling back to guard) ---
// Halfway between JAB_2 and IDLE_1 — arm partially retracted
const JAB_4_DATA: number[][] = JAB_2_DATA.map((row, i) => {
  // Pull the extended arm (rows 30-34) back toward center
  if (i >= 30 && i <= 34) {
    const copy = Array(W).fill(0)
    for (let c = 0; c < W; c++) {
      const src = c - 1 // shift right by 1 (retracting)
      if (src >= 0 && src < W && row[src] !== 0) {
        copy[c] = row[src]
      }
    }
    return copy
  }
  return [...row]
})

export const JAB_4: SpriteFrame = { width: W, height: H, pixels: JAB_4_DATA }

// --- KICK FRAME 1: Wind-up (rear leg chambers, knee lifts) ---
const KICK_1_DATA: number[][] = IDLE_1_DATA.map((row, i) => {
  // Rear leg (right side, cols ~27-35) lifts — remove lower rear leg rows
  if (i >= 65 && i <= 74) {
    const copy = [...row]
    // Zero out right leg pixels (cols 25+)
    for (let c = 25; c < W; c++) copy[c] = 0
    return copy
  }
  // Add chambered knee near torso (rows 48-52, right side)
  if (i >= 48 && i <= 52) {
    const copy = [...row]
    // Add knee pixels on right side
    if (i === 48) { copy[27] = 1; copy[28] = 9; copy[29] = 10; copy[30] = 9; copy[31] = 1 }
    if (i === 49) { copy[27] = 1; copy[28] = 10; copy[29] = 11; copy[30] = 10; copy[31] = 1 }
    if (i === 50) { copy[27] = 1; copy[28] = 10; copy[29] = 11; copy[30] = 10; copy[31] = 1 }
    if (i === 51) { copy[27] = 1; copy[28] = 9; copy[29] = 10; copy[30] = 9; copy[31] = 1 }
    if (i === 52) { copy[28] = 1; copy[29] = 5; copy[30] = 6; copy[31] = 1 }
    return copy
  }
  return [...row]
})

export const KICK_1: SpriteFrame = { width: W, height: H, pixels: KICK_1_DATA }

// --- KICK FRAME 2: Extension start (leg extending outward to the right) ---
const KICK_2_DATA: number[][] = IDLE_1_DATA.map((row, i) => {
  // Shift upper body left 1px for counterbalance (rows 4-22)
  if (i >= 4 && i <= 22) {
    const copy = Array(W).fill(0)
    for (let c = 0; c < W - 1; c++) {
      if (row[c + 1] !== 0) copy[c] = row[c + 1]
    }
    return copy
  }
  // Remove rear leg below row 48
  if (i >= 48 && i <= 74) {
    const copy = [...row]
    for (let c = 25; c < W; c++) copy[c] = 0
    // Add extending leg horizontally (rows 48-52)
    if (i === 48) { for (let c = 28; c <= 38; c++) copy[c] = c === 28 || c === 38 ? 1 : (c % 2 === 0 ? 9 : 10) }
    if (i === 49) { for (let c = 28; c <= 40; c++) copy[c] = c === 28 || c === 40 ? 1 : (c % 2 === 0 ? 10 : 11) }
    if (i === 50) { for (let c = 28; c <= 40; c++) copy[c] = c === 28 || c === 40 ? 1 : (c % 2 === 0 ? 10 : 9) }
    if (i === 51) { for (let c = 28; c <= 38; c++) copy[c] = c === 28 || c === 38 ? 1 : 9 }
    if (i === 52) { copy[38] = 1; copy[39] = 5; copy[40] = 6; copy[41] = 5; copy[42] = 1 }
    return copy
  }
  return [...row]
})

export const KICK_2: SpriteFrame = { width: W, height: H, pixels: KICK_2_DATA }

// --- KICK FRAME 3: Full extension (leg fully extended, foot at max reach) ---
const KICK_3_DATA: number[][] = IDLE_1_DATA.map((row, i) => {
  // Shift upper body left 2px for full counterbalance (rows 4-22)
  if (i >= 4 && i <= 22) {
    const copy = Array(W).fill(0)
    for (let c = 0; c < W - 2; c++) {
      if (row[c + 2] !== 0) copy[c] = row[c + 2]
    }
    return copy
  }
  // Shift torso left 1px (rows 23-40)
  if (i >= 23 && i <= 40) {
    const copy = Array(W).fill(0)
    for (let c = 0; c < W - 1; c++) {
      if (row[c + 1] !== 0) copy[c] = row[c + 1]
    }
    return copy
  }
  // Remove rear leg below row 46, add fully extended horizontal leg
  if (i >= 46 && i <= 74) {
    const copy = [...row]
    for (let c = 25; c < W; c++) copy[c] = 0
    // Fully extended horizontal leg with boot at end (rows 46-51)
    if (i === 46) { for (let c = 26; c <= 44; c++) copy[c] = c === 26 || c === 44 ? 1 : (c % 2 === 0 ? 9 : 10) }
    if (i === 47) { for (let c = 26; c <= 46; c++) copy[c] = c === 26 || c === 46 ? 1 : (c % 2 === 0 ? 10 : 11) }
    if (i === 48) { for (let c = 26; c <= 46; c++) copy[c] = c === 26 || c === 46 ? 1 : (c % 2 === 0 ? 10 : 9) }
    if (i === 49) { for (let c = 26; c <= 44; c++) copy[c] = c === 26 || c === 44 ? 1 : 9 }
    // Boot at the end
    if (i === 47) { copy[44] = 1; copy[45] = 5; copy[46] = 6; copy[47] = 7; copy[48] = 6; copy[49] = 1 }
    if (i === 48) { copy[44] = 1; copy[45] = 5; copy[46] = 6; copy[47] = 8; copy[48] = 7; copy[49] = 1 }
    if (i === 49) { copy[44] = 1; copy[45] = 1; copy[46] = 1; copy[47] = 1; copy[48] = 1; copy[49] = 1 }
    return copy
  }
  return [...row]
})

export const KICK_3: SpriteFrame = { width: W, height: H, pixels: KICK_3_DATA }

// --- KICK FRAME 4: Retraction (leg pulling back toward guard) ---
const KICK_4_DATA: number[][] = KICK_2_DATA.map((row, i) => {
  // Retract the kicking leg (rows 48-52) — shift pixels left by 4
  if (i >= 48 && i <= 52) {
    const copy = Array(W).fill(0)
    for (let c = 0; c < W; c++) {
      const src = c + 4
      if (src < W && row[src] !== 0) copy[c] = row[src]
    }
    return copy
  }
  // Upper body shifts back toward center (rows 4-22) — shift right by 1
  if (i >= 4 && i <= 22) {
    const copy = Array(W).fill(0)
    for (let c = W - 1; c > 0; c--) {
      if (row[c - 1] !== 0) copy[c] = row[c - 1]
    }
    return copy
  }
  return [...row]
})

export const KICK_4: SpriteFrame = { width: W, height: H, pixels: KICK_4_DATA }
