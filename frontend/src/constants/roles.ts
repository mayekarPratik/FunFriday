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
    description: 'Hunts innocent villagers in secret with the wolf pack each night. Wins when wolves equal or outnumber living townspeople.',
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
    description: 'Awakens each night to inspect the secret identity and alignment of one living player.',
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
    description: 'Chooses one player to protect each night from death.',
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
    description: 'Wields two one-time potions: a healing potion to revive the wolves’ victim and a lethal poison potion.',
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
    description: 'Awakens on Night 1 to bind two players together in love. If one lover perishes, the other dies of a broken heart.',
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
    description: 'A humble resident with no special night abilities. Solves the mystery and eliminates wolves through daily trials.',
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
    description: 'A chaotic trickster whose sole victory condition is to convince the village to execute them during the day trial.',
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
    description: 'Assigned a secret innocent townsperson as their target. Wins immediately if their target is voted out during the day trial. Converts into a Jester if their target dies at night.',
    isPassiveAtNight: true
  }
};
