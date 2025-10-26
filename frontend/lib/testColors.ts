/**
 * Test Case Color Palette - Research-level visualization
 * 
 * Each test case gets a unique color from this palette that propagates
 * to all connected nodes during testing execution.
 */

export const TEST_CASE_COLORS = [
  {
    id: 0,
    name: 'Electric Blue',
    primary: '#3b82f6',
    light: '#93c5fd',
    dark: '#1e40af',
    glow: 'rgba(59, 130, 246, 0.5)',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500',
    ring: 'ring-blue-500/50',
    text: 'text-blue-700 dark:text-blue-300',
  },
  {
    id: 1,
    name: 'Vivid Purple',
    primary: '#a855f7',
    light: '#d8b4fe',
    dark: '#7c3aed',
    glow: 'rgba(168, 85, 247, 0.5)',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500',
    ring: 'ring-purple-500/50',
    text: 'text-purple-700 dark:text-purple-300',
  },
  {
    id: 2,
    name: 'Emerald Green',
    primary: '#10b981',
    light: '#6ee7b7',
    dark: '#047857',
    glow: 'rgba(16, 185, 129, 0.5)',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500',
    ring: 'ring-emerald-500/50',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    id: 3,
    name: 'Amber Orange',
    primary: '#f59e0b',
    light: '#fcd34d',
    dark: '#d97706',
    glow: 'rgba(245, 158, 11, 0.5)',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500',
    ring: 'ring-amber-500/50',
    text: 'text-amber-700 dark:text-amber-300',
  },
  {
    id: 4,
    name: 'Rose Pink',
    primary: '#ec4899',
    light: '#f9a8d4',
    dark: '#be185d',
    glow: 'rgba(236, 72, 153, 0.5)',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500',
    ring: 'ring-pink-500/50',
    text: 'text-pink-700 dark:text-pink-300',
  },
  {
    id: 5,
    name: 'Cyan Teal',
    primary: '#06b6d4',
    light: '#67e8f9',
    dark: '#0891b2',
    glow: 'rgba(6, 182, 212, 0.5)',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500',
    ring: 'ring-cyan-500/50',
    text: 'text-cyan-700 dark:text-cyan-300',
  },
  {
    id: 6,
    name: 'Indigo Violet',
    primary: '#6366f1',
    light: '#a5b4fc',
    dark: '#4338ca',
    glow: 'rgba(99, 102, 241, 0.5)',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500',
    ring: 'ring-indigo-500/50',
    text: 'text-indigo-700 dark:text-indigo-300',
  },
  {
    id: 7,
    name: 'Lime Green',
    primary: '#84cc16',
    light: '#bef264',
    dark: '#65a30d',
    glow: 'rgba(132, 204, 22, 0.5)',
    bg: 'bg-lime-500/10',
    border: 'border-lime-500',
    ring: 'ring-lime-500/50',
    text: 'text-lime-700 dark:text-lime-300',
  },
  {
    id: 8,
    name: 'Red Scarlet',
    primary: '#ef4444',
    light: '#fca5a5',
    dark: '#b91c1c',
    glow: 'rgba(239, 68, 68, 0.5)',
    bg: 'bg-red-500/10',
    border: 'border-red-500',
    ring: 'ring-red-500/50',
    text: 'text-red-700 dark:text-red-300',
  },
  {
    id: 9,
    name: 'Yellow Sun',
    primary: '#eab308',
    light: '#fde047',
    dark: '#a16207',
    glow: 'rgba(234, 179, 8, 0.5)',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500',
    ring: 'ring-yellow-500/50',
    text: 'text-yellow-700 dark:text-yellow-300',
  },
];

/**
 * Get color for a specific test case by index
 */
export function getTestCaseColor(index: number) {
  return TEST_CASE_COLORS[index % TEST_CASE_COLORS.length];
}

/**
 * Get color for a test case by test ID
 */
export function getTestCaseColorByTest(testCases: any[], testId: string) {
  const index = testCases.findIndex(tc => tc.id === testId);
  if (index === -1) return TEST_CASE_COLORS[0];
  return getTestCaseColor(index);
}
