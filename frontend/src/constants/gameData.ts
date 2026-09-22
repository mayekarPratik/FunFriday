export interface GameRoleData {
  id: string;
  name: string;
  emoji: string;
  team: 'villagers' | 'wolves' | 'neutral' | 'mafia' | 'citizens';
  tag: string;
  tagColor: string;
  tagBg: string;
  tagBorder: string;
  description: string;
}

export const WEREWOLF_ROLES: GameRoleData[] = [
  {
    id: 'werewolf',
    name: 'Werewolf',
    emoji: '🐺',
    team: 'wolves',
    tag: 'Evil',
    tagColor: 'text-red-400',
    tagBg: 'bg-red-500/10',
    tagBorder: 'border-red-500/30',
    description: 'Eliminate the village. Blend in during the day.'
  },
  {
    id: 'villager',
    name: 'Villager',
    emoji: '🧑‍🌾',
    team: 'villagers',
    tag: 'Village',
    tagColor: 'text-emerald-400',
    tagBg: 'bg-emerald-500/10',
    tagBorder: 'border-emerald-500/30',
    description: 'Deduce who the wolves are and vote them out.'
  },
  {
    id: 'seer',
    name: 'Seer',
    emoji: '👁️',
    team: 'villagers',
    tag: 'Special',
    tagColor: 'text-cyan-400',
    tagBg: 'bg-cyan-500/10',
    tagBorder: 'border-cyan-500/30',
    description: 'Inspect one player each night to reveal their true allegiance.'
  },
  {
    id: 'doctor',
    name: 'Doctor',
    emoji: '⚕️',
    team: 'villagers',
    tag: 'Special',
    tagColor: 'text-blue-400',
    tagBg: 'bg-blue-500/10',
    tagBorder: 'border-blue-500/30',
    description: 'Choose one player to protect from the wolves each night.'
  },
  {
    id: 'witch',
    name: 'Witch',
    emoji: '🧪',
    team: 'villagers',
    tag: 'Special',
    tagColor: 'text-fuchsia-400',
    tagBg: 'bg-fuchsia-500/10',
    tagBorder: 'border-fuchsia-500/30',
    description: 'Holds one poison potion and one revive potion to use at night.'
  },
  {
    id: 'sheriff',
    name: 'Sheriff',
    emoji: '⭐',
    team: 'villagers',
    tag: 'Village Leader',
    tagColor: 'text-amber-400',
    tagBg: 'bg-amber-500/10',
    tagBorder: 'border-amber-500/30',
    description: 'A trusted village leader whose daytime vote counts as two.'
  },
  {
    id: 'cupid',
    name: 'Cupid',
    emoji: '💘',
    team: 'villagers',
    tag: 'Special',
    tagColor: 'text-pink-400',
    tagBg: 'bg-pink-500/10',
    tagBorder: 'border-pink-500/30',
    description: 'Link two players together on the first night. If one dies, the other dies too.'
  },
  {
    id: 'jester',
    name: 'Jester',
    emoji: '🤡',
    team: 'neutral',
    tag: 'Neutral',
    tagColor: 'text-purple-400',
    tagBg: 'bg-purple-500/10',
    tagBorder: 'border-purple-500/30',
    description: 'A neutral chaotic player. Trick the village into voting you out to win.'
  },
  {
    id: 'executioner',
    name: 'Executioner',
    emoji: '🪓',
    team: 'neutral',
    tag: 'Neutral',
    tagColor: 'text-rose-400',
    tagBg: 'bg-rose-500/10',
    tagBorder: 'border-rose-500/30',
    description: 'Assigned a specific target. Trick the village into voting your target out to win.'
  }
];

export const MAFIA_ROLES: GameRoleData[] = [
  {
    id: 'mafia',
    name: 'Mafia',
    emoji: '🕴️',
    team: 'mafia',
    tag: 'Syndicate',
    tagColor: 'text-red-400',
    tagBg: 'bg-red-500/10',
    tagBorder: 'border-red-500/30',
    description: 'Coordinate at night to eliminate the citizens.'
  },
  {
    id: 'citizen',
    name: 'Citizen',
    emoji: '🏙️',
    team: 'citizens',
    tag: 'Town',
    tagColor: 'text-slate-300',
    tagBg: 'bg-slate-500/10',
    tagBorder: 'border-slate-500/30',
    description: 'Uncover the Mafia through daytime debate and voting.'
  },
  {
    id: 'detective',
    name: 'Detective',
    emoji: '🕵️',
    team: 'citizens',
    tag: 'Investigator',
    tagColor: 'text-blue-400',
    tagBg: 'bg-blue-500/10',
    tagBorder: 'border-blue-500/30',
    description: 'Investigate one player each night to see if they are Mafia.'
  },
  {
    id: 'doctor',
    name: 'Doctor',
    emoji: '🩺',
    team: 'citizens',
    tag: 'Support',
    tagColor: 'text-emerald-400',
    tagBg: 'bg-emerald-500/10',
    tagBorder: 'border-emerald-500/30',
    description: 'Save one player from assassination each night.'
  }
];
