/**
 * Holiday Mode Configuration
 * Now managed via database app_settings table
 */

export type HolidaySettings = {
  holidayMode: boolean;
  holidaySnow: boolean;
};

export const DEFAULT_HOLIDAY_SETTINGS: HolidaySettings = {
  holidayMode: false,
  holidaySnow: false,
};

// Holiday season dates (can be adjusted)
export const HOLIDAY_START_DATE = new Date('2024-11-25');
export const HOLIDAY_END_DATE = new Date('2025-01-02');

/**
 * Check if current date is within holiday season
 */
export const isHolidaySeason = (): boolean => {
  const now = new Date();
  return now >= HOLIDAY_START_DATE && now <= HOLIDAY_END_DATE;
};
