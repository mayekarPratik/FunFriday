export interface RoleDefinition {
  id: string;
  name: string;
  team: 'villagers' | 'wolves' | 'neutral';
  colorTheme: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  description: string;
  isPassiveAtNight: boolean;
}

export const ROLES: Record<string, RoleDefinition> = {
  wolf: {
    id: 'wolf',
    name: 'Werewolf',
    team: 'wolves',
    colorTheme: 'bg-red-600',
    badgeBg: 'bg-red-500/20',
    badgeText: 'text-red-400',
    badgeBorder: 'border-red-500/40',
    description: 'Eliminate the village. Blend in during the day.',
    isPassiveAtNight: false
  },
  seer: {
    id: 'seer',
    name: 'Seer',
    team: 'villagers',
    colorTheme: 'bg-blue-600',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-400',
    badgeBorder: 'border-blue-500/40',
    description: 'Inspect one player each night to reveal their true allegiance.',
    isPassiveAtNight: false
  },
  doctor: {
    id: 'doctor',
    name: 'Doctor',
    team: 'villagers',
    colorTheme: 'bg-emerald-600',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-400',
    badgeBorder: 'border-emerald-500/40',
    description: 'Choose one player to protect from the wolves each night.',
    isPassiveAtNight: false
  },
  witch: {
    id: 'witch',
    name: 'Witch',
    team: 'villagers',
    colorTheme: 'bg-purple-600',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-400',
    badgeBorder: 'border-purple-500/40',
    description: 'Holds one poison potion and one revive potion to use at night.',
    isPassiveAtNight: false
  },
  cupid: {
    id: 'cupid',
    name: 'Cupid',
    team: 'villagers',
    colorTheme: 'bg-pink-600',
    badgeBg: 'bg-pink-500/20',
    badgeText: 'text-pink-400',
    badgeBorder: 'border-pink-500/40',
    description: 'Link two players together on the first night. If one dies, the other dies too.',
    isPassiveAtNight: false
  },
  sheriff: {
    id: 'sheriff',
    name: 'Sheriff',
    team: 'villagers',
    colorTheme: 'bg-blue-600',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-400',
    badgeBorder: 'border-blue-500/40',
    description: 'A trusted village leader whose daytime vote counts as two.',
    isPassiveAtNight: false
  },
  villager: {
    id: 'villager',
    name: 'Villager',
    team: 'villagers',
    colorTheme: 'bg-slate-600',
    badgeBg: 'bg-slate-500/20',
    badgeText: 'text-slate-300',
    badgeBorder: 'border-slate-500/40',
    description: 'Deduce who the wolves are and vote them out.',
    isPassiveAtNight: true
  },
  jester: {
    id: 'jester',
    name: 'Jester',
    team: 'neutral',
    colorTheme: 'bg-purple-600',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-400',
    badgeBorder: 'border-purple-500/40',
    description: 'A neutral chaotic player. Trick the village into voting you out to win.',
    isPassiveAtNight: true
  },
  executioner: {
    id: 'executioner',
    name: 'Executioner',
    team: 'neutral',
    colorTheme: 'bg-purple-600',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-400',
    badgeBorder: 'border-purple-500/40',
    description: 'Assigned a specific target. Trick the village into voting your target out to win.',
    isPassiveAtNight: true
  }
};
