/**
 * Movember date and progress utilities
 */

export interface MovemberDay {
  day: number; // 1-30
  date: Date;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
}

export interface MovemberStatus {
  isNovember: boolean;
  currentDay: number | null; // 1-30, null if not November
  daysRemaining: number;
  isActive: boolean;
}

/**
 * Get the current Movember status
 */
export function getMovemberStatus(): MovemberStatus {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed, November = 10
  const date = now.getDate();

  const isNovember = month === 10; // November

  if (!isNovember) {
    return {
      isNovember: false,
      currentDay: null,
      daysRemaining: 0,
      isActive: false,
    };
  }

  const currentDay = date; // 1-30
  const daysRemaining = 30 - currentDay;

  return {
    isNovember: true,
    currentDay,
    daysRemaining,
    isActive: currentDay >= 1 && currentDay <= 30,
  };
}

/**
 * Get all Movember days for the calendar
 */
export function getMovemberDays(year: number = new Date().getFullYear()): MovemberDay[] {
  const days: MovemberDay[] = [];
  const now = new Date();
  const today = now.getDate();
  const isCurrentNovember = now.getMonth() === 10 && now.getFullYear() === year;

  for (let day = 1; day <= 30; day++) {
    const date = new Date(year, 10, day); // Month 10 = November

    days.push({
      day,
      date,
      isToday: isCurrentNovember && day === today,
      isPast: isCurrentNovember ? day < today : false,
      isFuture: isCurrentNovember ? day > today : true,
    });
  }

  return days;
}

/**
 * Generate Movember donation link
 */
export function getMovemberDonationLink(): string {
  return "https://movember.com/donate";
}

/**
 * Generate share text for a specific day
 */
export function getShareText(day: number): string {
  const messages = [
    `Day ${day} of Movember! Growing my mo and supporting mens health.`,
    `${day}/30 days complete! Join me in supporting Movember.`,
    `Day ${day} mustache check! Donate to mens health research.`,
    `Movember Day ${day}: Every mo matters for mens health.`,
  ];

  // Rotate through messages based on day
  return messages[(day - 1) % messages.length];
}

/**
 * Get completion message for finishing all 30 days
 */
export function getCompletionMessage(): string {
  return "30 days complete! Thank you for supporting mens health all month long. Claim your exclusive Movember 2025 NFT!";
}

/**
 * Check if we're in early bird period (before November)
 */
export function isEarlyBird(): boolean {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed, November = 10
  return month < 10; // Before November
}

/**
 * Get early bird share text
 */
export function getEarlyBirdShareText(taggedUser?: string): string {
  const baseText = "I will be participating in Based Movember, what about you?";

  if (taggedUser) {
    return `${baseText}\n\n@${taggedUser} - are you in?`;
  }

  return baseText;
}

/**
 * Get days until Movember starts
 */
export function getDaysUntilMovember(): number {
  const now = new Date();
  const year = now.getFullYear();
  const november1st = new Date(year, 10, 1); // November 1st

  // If we're past November, calculate for next year
  if (now > november1st) {
    november1st.setFullYear(year + 1);
  }

  const diffTime = november1st.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}
