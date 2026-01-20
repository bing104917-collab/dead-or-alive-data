export const getAliveStatus = () => {
  return "此岸";
};

export const getDeadStatus = () => {
  return "彼岸";
};

export const calculateDaysBetween = (date1: string, date2: Date | string = new Date()) => {
  const start = new Date(date1);
  const end = typeof date2 === 'string' ? new Date(date2) : date2;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const getLegacyQuote = () => {
  const quotes = [
    "The goal isn't to live forever, the goal is to create something that will.",
    "Death is not the greatest loss in life. The greatest loss is what dies inside us while we live.",
    "A well-spent day brings happy sleep, so a life well spent brings happy death.",
    "To the well-organized mind, death is but the next great adventure.",
    "Our dead are never dead to us, until we have forgotten them.",
    "The boundaries which divide Life from Death are at best shadowy and vague. Who shall say where the one ends, and the other begins?"
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
};

export const getSurvivalLabel = (status: 'alive' | 'dead', birthDate: string, deathDate: string | null) => {
  if (status === 'alive') {
    const days = calculateDaysBetween(birthDate);
    return `Survival Streak: ${days.toLocaleString()} Days`;
  } else {
    const days = calculateDaysBetween(deathDate!);
    return `Offline for: ${days.toLocaleString()} Days`;
  }
};

export const calculateLifeProgress = (birthDate: string, deathDate: string | null = null) => {
  const DEFAULT_LIFESPAN_YEARS = 80;
  const DAYS_PER_YEAR = 365.25;
  const targetDays = DEFAULT_LIFESPAN_YEARS * DAYS_PER_YEAR;
  
  const endDate = deathDate ? new Date(deathDate) : new Date();
  const birth = new Date(birthDate);
  const livedDays = (endDate.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24);
  
  const percentage = (livedDays / targetDays) * 100;
  return Math.min(Math.max(percentage, 0), 200); // Cap at 200% for extreme longevity
};
