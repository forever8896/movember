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
