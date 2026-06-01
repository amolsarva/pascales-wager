export type Advisor = {
  id: string
  name: string
  archetype: string
  monogram: string
  tone: string
  bestFor: string
  description: string
  accent: string
  shadow: string
  worldview: string
  lastAsked: string
}

export const advisors: Advisor[] = [
  {
    id: 'damon',
    name: 'Damon',
    archetype: 'The Greek Mentor',
    monogram: 'D',
    tone: 'Warm, elevated, demanding',
    bestFor: 'Character, courage, and self-command',
    description:
      'A formative advisor for ambition, moral clarity, judgment, and the long work of becoming.',
    accent: '#B98A57',
    shadow: '#34241C',
    worldview: 'Classical virtue ethics',
    lastAsked: 'Yesterday',
  },
  {
    id: 'mara',
    name: 'Mara',
    archetype: 'The Strategist',
    monogram: 'M',
    tone: 'Clear, concise, practical',
    bestFor: 'Decisions, leverage, and tradeoffs',
    description:
      'A pragmatic operator who separates signal from noise and turns uncertainty into a next move.',
    accent: '#769B94',
    shadow: '#172C2E',
    worldview: 'Pragmatic humanism',
    lastAsked: '3 days ago',
  },
  {
    id: 'elis',
    name: 'Elis',
    archetype: 'The Witness',
    monogram: 'E',
    tone: 'Gentle, precise, reflective',
    bestFor: 'Relationships, grief, and inner conflict',
    description:
      'A perceptive listener who helps you name what happened before deciding what it means.',
    accent: '#9E8EB5',
    shadow: '#282235',
    worldview: 'Reflective humanism',
    lastAsked: 'Last week',
  },
  {
    id: 'cassian',
    name: 'Cassian',
    archetype: 'The Skeptic',
    monogram: 'C',
    tone: 'Sharp, fair, unsentimental',
    bestFor: 'Assumptions, ego checks, and risk',
    description:
      'A careful challenger for the moments when the most expensive mistake would be self-deception.',
    accent: '#A36F63',
    shadow: '#38201E',
    worldview: 'Constructive skepticism',
    lastAsked: 'Never',
  },
  {
    id: 'future',
    name: 'August',
    archetype: 'The Future Self',
    monogram: 'A',
    tone: 'Intimate, calm, long-view',
    bestFor: 'Regret, identity, and life design',
    description:
      'A voice from the life you are building, attentive to what future-you will be grateful you protected.',
    accent: '#C5AA74',
    shadow: '#332B1C',
    worldview: 'Long-view discernment',
    lastAsked: '2 weeks ago',
  },
]

export const recentSessions = [
  {
    title: 'A clean exit or a brave beginning?',
    advisor: 'Damon',
    mode: 'Decision',
    date: 'Yesterday',
    summary: 'You are not afraid of the new work. You are afraid of leaving before the old work can validate you.',
  },
  {
    title: 'The conversation I keep postponing',
    advisor: 'Elis',
    mode: 'Conflict',
    date: 'May 27',
    summary: 'Clarity will be kinder than another week of carefully managed resentment.',
  },
  {
    title: 'What would make the next quarter count?',
    advisor: 'Mara',
    mode: 'Strategy',
    date: 'May 21',
    summary: 'The quarter needs one real bet, not a longer inventory of possible bets.',
  },
]

export const councilResponses = [
  {
    advisor: advisors[0],
    response:
      'Do not confuse staying with steadiness. A disciplined life is not a motionless life. The question is whether you have trained enough to carry the responsibility your freedom would create.',
  },
  {
    advisor: advisors[1],
    response:
      'Treat this as a staged decision, not a leap. Define your runway, set a validation threshold, and choose the date by which the evidence must change your mind.',
  },
  {
    advisor: advisors[2],
    response:
      'There is relief in the way you describe leaving, and grief in the way you describe staying. Before optimizing the decision, notice which part of you still wants permission.',
  },
]
