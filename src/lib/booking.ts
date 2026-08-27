import type { Service } from '@prisma/client';

export type BookingState = 'NOT_YET_OPEN' | 'OPEN' | 'CLOSED' | 'DISABLED';

export function bookingState(service: Pick<Service, 'isActive' | 'bookingMode' | 'manualOpen' | 'opensAt' | 'closesAt'>, now = new Date()): BookingState {
  if (!service.isActive) return 'DISABLED';
  if (service.bookingMode === 'MANUAL') return service.manualOpen ? 'OPEN' : 'CLOSED';
  if (!service.opensAt || !service.closesAt) return 'CLOSED';
  if (now < service.opensAt) return 'NOT_YET_OPEN';
  if (now > service.closesAt) return 'CLOSED';
  return 'OPEN';
}
