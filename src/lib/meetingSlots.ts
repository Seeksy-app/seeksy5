import { addDays, addMinutes, format, isBefore, isAfter, parseISO, setHours, setMinutes, startOfDay } from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  available: boolean;
}

export interface AvailabilityWindow {
  weekday: number;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  timezone: string;
}

export interface ExistingBooking {
  start_time_utc: string;
  end_time_utc: string;
}

/**
 * Generate available time slots for a meeting type over the next N days
 */
export function generateAvailableSlots(
  availability: AvailabilityWindow[],
  existingBookings: ExistingBooking[],
  durationMinutes: number,
  bufferBefore: number = 0,
  bufferAfter: number = 0,
  daysAhead: number = 30,
  guestTimezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
): Map<string, TimeSlot[]> {
  const slots = new Map<string, TimeSlot[]>();
  const now = new Date();
  const minBookingTime = addMinutes(now, 60); // At least 1 hour from now

  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
    const currentDay = addDays(startOfDay(now), dayOffset);
    const weekday = currentDay.getDay();
    const dateKey = format(currentDay, 'yyyy-MM-dd');
    const daySlots: TimeSlot[] = [];

    // Find availability windows for this weekday
    const windowsForDay = availability.filter(a => a.weekday === weekday);

    for (const window of windowsForDay) {
      const [startHour, startMin] = window.startTime.split(':').map(Number);
      const [endHour, endMin] = window.endTime.split(':').map(Number);

      // Create slot start/end times in the host's timezone
      let slotStart = fromZonedTime(
        setMinutes(setHours(currentDay, startHour), startMin),
        window.timezone
      );
      
      const windowEnd = fromZonedTime(
        setMinutes(setHours(currentDay, endHour), endMin),
        window.timezone
      );

      // Generate slots at 15-minute intervals
      while (isBefore(addMinutes(slotStart, durationMinutes), windowEnd) || 
             format(addMinutes(slotStart, durationMinutes), 'HH:mm') === format(windowEnd, 'HH:mm')) {
        const slotEnd = addMinutes(slotStart, durationMinutes);
        
        // Check if slot is in the future
        if (isAfter(slotStart, minBookingTime)) {
          // Check for conflicts with existing bookings (including buffers)
          const slotWithBufferStart = addMinutes(slotStart, -bufferBefore);
          const slotWithBufferEnd = addMinutes(slotEnd, bufferAfter);
          
          const hasConflict = existingBookings.some(booking => {
            const bookingStart = parseISO(booking.start_time_utc);
            const bookingEnd = parseISO(booking.end_time_utc);
            
            // Check if there's any overlap
            return isBefore(slotWithBufferStart, bookingEnd) && isAfter(slotWithBufferEnd, bookingStart);
          });

          daySlots.push({
            startTime: slotStart,
            endTime: slotEnd,
            available: !hasConflict
          });
        }

        slotStart = addMinutes(slotStart, 15); // Move to next potential slot
      }
    }

    if (daySlots.length > 0) {
      slots.set(dateKey, daySlots.filter(s => s.available));
    }
  }

  return slots;
}

/**
 * Check if a specific time slot is still available
 */
export function isSlotAvailable(
  slotStart: Date,
  slotEnd: Date,
  existingBookings: ExistingBooking[],
  bufferBefore: number = 0,
  bufferAfter: number = 0
): boolean {
  const slotWithBufferStart = addMinutes(slotStart, -bufferBefore);
  const slotWithBufferEnd = addMinutes(slotEnd, bufferAfter);

  return !existingBookings.some(booking => {
    const bookingStart = parseISO(booking.start_time_utc);
    const bookingEnd = parseISO(booking.end_time_utc);
    return isBefore(slotWithBufferStart, bookingEnd) && isAfter(slotWithBufferEnd, bookingStart);
  });
}

/**
 * Format time slot for display
 */
export function formatSlotTime(date: Date, timezone: string): string {
  try {
    return formatInTimeZone(date, timezone, 'h:mm a');
  } catch {
    return format(date, 'h:mm a');
  }
}

/**
 * Format date for display
 */
export function formatSlotDate(date: Date, timezone: string): string {
  try {
    return formatInTimeZone(date, timezone, 'EEEE, MMMM d, yyyy');
  } catch {
    return format(date, 'EEEE, MMMM d, yyyy');
  }
}
