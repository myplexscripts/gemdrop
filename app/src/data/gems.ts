export type GemTier = {
  name: string;
  description: string;
  cut: string;
  radius: number;
  score: number;
  color: string;
  accent: string;
  dark: string;
};

export const GEMS: GemTier[] = [
  {name:'Quartz',description:'A pale crystal that catches even the faintest light.',cut:'rectangular',radius:48,score:1,color:'#D7EBF2',accent:'#EDF6F9',dark:'#859296'},
  {name:'Citrine',description:'A warm golden gem with the glow of bottled sunlight.',cut:'circular_starcut',radius:53,score:3,color:'#E9B11E',accent:'#F5DC9A',dark:'#906E13'},
  {name:'Sunstone',description:'A fiery stone that seems to hold a spark of dawn.',cut:'emerald_stepcut',radius:58,score:6,color:'#E67A45',accent:'#F4C3AB',dark:'#8F4C2B'},
  {name:'Amethyst',description:'Deep violet crystal with a calm, royal glow.',cut:'rectangular_brilliant',radius:63,score:10,color:'#A968E5',accent:'#D8BBF3',dark:'#69408E'},
  {name:'Peridot',description:'Fresh green brilliance made for bold beginnings.',cut:'heart',radius:69,score:15,color:'#99D64D',accent:'#D1EDAF',dark:'#5F8530'},
  {name:'Garnet',description:'A dark red jewel with the warmth of banked embers.',cut:'tanzanite',radius:75,score:22,color:'#B33149',accent:'#DDA2AD',dark:'#6F1E2D'},
  {name:'Topaz',description:'Honey-gold facets that flash with quiet richness.',cut:'rectangular',radius:81,score:30,color:'#D7902F',accent:'#EDCDA1',dark:'#85591D'},
  {name:'Moonstone',description:'Milky light drifts across it like a moonlit tide.',cut:'circular_starcut',radius:88,score:40,color:'#B9C9F2',accent:'#E0E7F9',dark:'#737D96'},
  {name:'Zircon',description:'Clear blue fire with a sharp, electric sparkle.',cut:'emerald_stepcut',radius:95,score:52,color:'#42C7E8',accent:'#AAE6F5',dark:'#297B90'},
  {name:'Morganite',description:'A blush-pink jewel with a soft romantic glow.',cut:'rectangular_brilliant',radius:102,score:66,color:'#F5B3C8',accent:'#FADDE6',dark:'#986F7C'},
  {name:'Aquamarine',description:'Sea-green clarity that feels cool even in the hand.',cut:'heart',radius:110,score:82,color:'#63E3C4',accent:'#B9F2E4',dark:'#3D8D7A'},
  {name:'Tourmaline',description:'Vivid violet colour with a restless inner shimmer.',cut:'tanzanite',radius:118,score:100,color:'#C447B6',accent:'#E4ACDE',dark:'#7A2C71'},
  {name:'Tanzanite',description:'Rare blue-violet fire drawn from the edge of night.',cut:'rectangular',radius:127,score:122,color:'#4F54D9',accent:'#B0B2EE',dark:'#313487'},
  {name:'Spinel',description:'A brilliant pink-red jewel with a lively inner spark.',cut:'circular_starcut',radius:136,score:148,color:'#FF4F87',accent:'#FFB0C9',dark:'#9E3154'},
  {name:'Sapphire',description:'Royal blue depth with a crisp, unwavering shine.',cut:'emerald_stepcut',radius:146,score:178,color:'#2D63D6',accent:'#A0B9ED',dark:'#1C3D85'},
  {name:'Emerald',description:'Lush green brilliance worthy of the finest vault.',cut:'rectangular_brilliant',radius:156,score:212,color:'#18B56A',accent:'#97DEBC',dark:'#0F7042'},
  {name:'Ruby',description:'A fierce red jewel that burns like captured flame.',cut:'heart',radius:167,score:250,color:'#E12F4F',accent:'#F2A1B0',dark:'#8C1D31'},
  {name:'Alexandrite',description:'A mysterious gem whose colour never seems quite still.',cut:'tanzanite',radius:179,score:292,color:'#47B38E',accent:'#ACDDCC',dark:'#2C6F58'},
  {name:'Starstone',description:'An uncanny violet jewel lit by a star-like glow.',cut:'rectangular',radius:192,score:340,color:'#9B6BFF',accent:'#D2BCFF',dark:'#60429E'},
  {name:'Crownstone',description:'The vault’s legendary prize, blazing with golden light.',cut:'circular_starcut',radius:206,score:400,color:'#FFD24A',accent:'#FFEBAE',dark:'#9E822E'}
];

export const W = 640;
export const H = 936;
export const WALL = 16;
export const FLOOR = 880;
export const FRAME_WALL = 24;
export const FRAME_FLOOR = 900;
export const DROP_Y = 104;
export const LIMIT_Y = 146;
export const DROP_DELAY = 300;
export const AUTO_FIRE_DELAY = 390;
export const COLLIDER_SCALE = .97;
export const POWER_START = { tumble:.44, merge:.16, upgrade:.28 };
export const POWER_PER_MERGE = { tumble:1/9, merge:1/18, upgrade:1/13 };
export const SPECIALS = {
  scatter: { label:'Scatter', color:'#FFCA58' },
  fusion: { label:'Fusion', color:'#C66BFF' },
  charge: { label:'Charge', color:'#63E3C4' }
} as const;
export type SpecialType = keyof typeof SPECIALS;
