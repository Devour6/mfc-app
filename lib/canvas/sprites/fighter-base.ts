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


// ── KICK FRAMES ─────────────────────────────────────────────────────────────

// --- KICK FRAME 1 (WIND-UP): Front leg chambers up, weight on rear leg ---
// Rows 44-74: remove front (right) leg, add bent knee near waist
const KICK_WIND_DATA: number[][] = IDLE_1_DATA.map((row, i) => {
  const copy = [...row]
  // Remove the right leg entirely (cols 21-31 in leg rows)
  if (i >= 44 && i <= 74) {
    for (let c = 20; c < 32; c++) copy[c] = 0
  }
  // Draw chambered knee at hip height (rows 42-48, cols 24-29)
  if (i === 42) { copy[24] = 1; copy[25] = 9; copy[26] = 10; copy[27] = 9; copy[28] = 1 }
  if (i === 43) { copy[24] = 1; copy[25] = 10; copy[26] = 11; copy[27] = 10; copy[28] = 1 }
  if (i === 44) { copy[23] = 1; copy[24] = 9; copy[25] = 10; copy[26] = 11; copy[27] = 10; copy[28] = 9; copy[29] = 1 }
  if (i === 45) { copy[23] = 1; copy[24] = 9; copy[25] = 10; copy[26] = 10; copy[27] = 10; copy[28] = 9; copy[29] = 1 }
  if (i === 46) { copy[24] = 1; copy[25] = 5; copy[26] = 6; copy[27] = 5; copy[28] = 1 }
  if (i === 47) { copy[24] = 1; copy[25] = 5; copy[26] = 6; copy[27] = 6; copy[28] = 5; copy[29] = 1 }
  if (i === 48) { copy[23] = 1; copy[24] = 1; copy[25] = 1; copy[26] = 1; copy[27] = 1; copy[28] = 1; copy[29] = 1 }
  return copy
})

export const KICK_WIND: SpriteFrame = { width: W, height: H, pixels: KICK_WIND_DATA }

// --- KICK FRAME 2 (EXTEND): Front leg fully extended horizontally ---
const KICK_EXTEND_DATA: number[][] = KICK_WIND_DATA.map((row, i) => {
  const copy = [...row]
  // Clear the chambered knee
  if (i >= 42 && i <= 48) {
    for (let c = 23; c < 30; c++) copy[c] = 0
  }
  // Draw extended leg horizontally (rows 43-46, cols 24-39)
  if (i === 43) { for (let c = 24; c <= 38; c++) copy[c] = (c === 24 || c === 38) ? 1 : (c % 3 === 0 ? 10 : 9) }
  if (i === 44) { for (let c = 24; c <= 39; c++) copy[c] = (c === 24 || c === 39) ? 1 : (c % 3 === 0 ? 11 : 10) }
  if (i === 45) { for (let c = 24; c <= 39; c++) copy[c] = (c === 24 || c === 39) ? 1 : (c % 3 === 0 ? 10 : 9) }
  if (i === 46) { for (let c = 24; c <= 38; c++) copy[c] = (c === 24 || c === 38) ? 1 : (c % 3 === 0 ? 10 : 9) }
  // Foot at the end
  if (i === 43) { copy[39] = 1; copy[40] = 5; copy[41] = 6; copy[42] = 6; copy[43] = 1 }
  if (i === 44) { copy[40] = 1; copy[41] = 6; copy[42] = 7; copy[43] = 6; copy[44] = 1 }
  if (i === 45) { copy[40] = 1; copy[41] = 1; copy[42] = 1; copy[43] = 1; copy[44] = 1 }
  return copy
})

export const KICK_EXTEND: SpriteFrame = { width: W, height: H, pixels: KICK_EXTEND_DATA }

// --- KICK FRAME 3 (RETRACT): Leg pulling back = same as wind-up ---
export const KICK_RETRACT: SpriteFrame = KICK_WIND

// ── HIT FRAME ───────────────────────────────────────────────────────────────

// --- HIT: Recoil from impact — body shifts right 2px, head tilts ---
const HIT_DATA: number[][] = IDLE_1_DATA.map((row, i) => {
  if (i >= 4 && i <= 40) {
    const copy = Array(W).fill(0)
    for (let c = 0; c < W - 2; c++) {
      if (row[c] !== 0) copy[c + 2] = row[c]
    }
    return copy
  }
  return [...row]
})

export const HIT: SpriteFrame = { width: W, height: H, pixels: HIT_DATA }

// ── BLOCK FRAME ─────────────────────────────────────────────────────────────

// --- BLOCK: High guard — arms raised to protect face ---
const BLOCK_DATA: number[][] = IDLE_1_DATA.map((row, i) => {
  const copy = [...row]
  // Add glove guards flanking the face (rows 19-22)
  if (i >= 19 && i <= 22) {
    copy[13] = 1; copy[14] = 13; copy[15] = 13
    copy[29] = 13; copy[30] = 13; copy[31] = 1
  }
  // Gi sleeve connecting to gloves (rows 20-22)
  if (i >= 20 && i <= 22) {
    copy[12] = 1; copy[13] = 9; copy[14] = 10; copy[15] = 9
    copy[29] = 9; copy[30] = 10; copy[31] = 9; copy[32] = 1
  }
  return copy
})

export const BLOCK: SpriteFrame = { width: W, height: H, pixels: BLOCK_DATA }

// ── DOWN FRAME ──────────────────────────────────────────────────────────────

// --- DOWN: Knocked out — body collapsed, shifted down + right ---
const DOWN_DATA: number[][] = (() => {
  const out: number[][] = Array.from({ length: H }, () => Array(W).fill(0))
  for (let i = 0; i < H; i++) {
    const srcRow = i - 10
    if (srcRow >= 0 && srcRow < H) {
      const src = IDLE_1_DATA[srcRow]
      const copy = Array(W).fill(0)
      for (let c = 0; c < W - 3; c++) {
        if (src[c] !== 0) copy[c + 3] = src[c]
      }
      out[i] = copy
    }
  }
  return out
})()

export const DOWN: SpriteFrame = { width: W, height: H, pixels: DOWN_DATA }

// ── VICTORY FRAMES ──────────────────────────────────────────────────────────

// --- VICTORY 1: Arms raised triumphantly ---
const VICTORY_1_DATA: number[][] = IDLE_1_DATA.map((row, i) => {
  const copy = [...row]
  // Raised gloves above head (rows 2-3)
  if (i === 2) { copy[12] = 1; copy[13] = 13; copy[14] = 13; copy[15] = 1; copy[29] = 1; copy[30] = 13; copy[31] = 13; copy[32] = 1 }
  if (i === 3) { copy[12] = 1; copy[13] = 14; copy[14] = 13; copy[15] = 1; copy[29] = 1; copy[30] = 13; copy[31] = 14; copy[32] = 1 }
  // Gi sleeves reaching up (rows 4-5)
  if (i === 4) { copy[13] = 1; copy[14] = 9; copy[15] = 9; copy[29] = 9; copy[30] = 9; copy[31] = 1 }
  if (i === 5) { copy[14] = 1; copy[15] = 9; copy[16] = 9; copy[28] = 9; copy[29] = 9; copy[30] = 1 }
  // Remove old arm pixels from torso rows
  if (i >= 28 && i <= 34) {
    for (let c = 0; c < 13; c++) copy[c] = 0
  }
  return copy
})

export const VICTORY_1: SpriteFrame = { width: W, height: H, pixels: VICTORY_1_DATA }

// --- VICTORY 2: Bounce peak — upper body shifts up 2 rows ---
const VICTORY_2_DATA: number[][] = (() => {
  const out: number[][] = Array.from({ length: H }, () => Array(W).fill(0))
  for (let i = 0; i < H; i++) {
    const srcRow = i + 2
    if (i <= 42 && srcRow < H) {
      out[i] = [...VICTORY_1_DATA[srcRow]]
    } else {
      out[i] = [...VICTORY_1_DATA[Math.min(i, H - 1)]]
    }
  }
  return out
})()

export const VICTORY_2: SpriteFrame = { width: W, height: H, pixels: VICTORY_2_DATA }

// ── DEFEAT FRAME ────────────────────────────────────────────────────────────

// --- DEFEAT: Slumped posture — head drops, shoulders sag ---
const DEFEAT_DATA: number[][] = (() => {
  const out: number[][] = Array.from({ length: H }, () => Array(W).fill(0))
  // Shift head/upper body down by 3 rows
  for (let i = 0; i < H; i++) {
    const srcRow = i < 3 ? 0 : i - 3
    if (i <= 37 && srcRow >= 0 && srcRow < H) {
      out[i] = [...IDLE_1_DATA[srcRow]]
    } else if (i < H) {
      out[i] = [...IDLE_1_DATA[Math.min(i, H - 1)]]
    }
  }
  // Droop arms: shift rows 26-37 down by 1
  for (let i = 37; i >= 26; i--) {
    if (i + 1 < H) out[i + 1] = [...out[i]]
  }
  out[26] = Array(W).fill(0)
  return out
})()

export const DEFEAT: SpriteFrame = { width: W, height: H, pixels: DEFEAT_DATA }
