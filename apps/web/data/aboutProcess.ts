export interface AboutProcessStep {
  id: string;
  number: string;
  title: string;
  description: string;
}

export const ABOUT_PROCESS_STEPS: AboutProcessStep[] = [
  {
    id: 'discover',
    number: '01',
    title: 'Discover',
    description: 'Browse verified listings tailored to your budget and lifestyle.',
  },
  {
    id: 'verify',
    number: '02',
    title: 'Verify',
    description: 'Every document and agent is independently confirmed by our team.',
  },
  {
    id: 'connect',
    number: '03',
    title: 'Connect',
    description: 'Speak directly with the agent or owner — no middlemen guesswork.',
  },
  {
    id: 'purchase',
    number: '04',
    title: 'Purchase',
    description: 'Close with confidence, backed by our in-house legal counsel.',
  },
  {
    id: 'support',
    number: '05',
    title: 'Support',
    description: "Our team stays on call long after you've picked up the keys.",
  },
];
