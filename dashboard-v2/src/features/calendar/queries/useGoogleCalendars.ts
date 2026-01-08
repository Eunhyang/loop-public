import { useQuery } from '@tanstack/react-query';
import { getGoogleCalendars } from '../api/google';
import type { GoogleCalendarAccount } from '../types/google';

export const GOOGLE_CALENDARS_QUERY_KEY = ['googleCalendars'];

export function useGoogleCalendars() {
    return useQuery({
        queryKey: GOOGLE_CALENDARS_QUERY_KEY,
        queryFn: async () => {
            const response = await getGoogleCalendars();

            // Group flat list by account
            // Response items have account_id, account_email, and calendar fields
            const accountsMap = new Map<string, GoogleCalendarAccount>();

            // The API returns a flat list of calendars, each with account info
            response.calendars.forEach(cal => {
                const accountId = cal.account_id;
                const email = cal.account_email;

                if (!accountsMap.has(accountId)) {
                    accountsMap.set(accountId, {
                        accountId,
                        email,
                        calendars: []
                    });
                }

                const account = accountsMap.get(accountId)!;

                // Push calendar object (excluding account info from the object itself if preferred, but existing type is loose)
                account.calendars.push({
                    id: cal.id,
                    summary: cal.summary,
                    color: cal.color,
                    primary: cal.primary,
                    accessRole: cal.accessRole
                });
            });

            return Array.from(accountsMap.values());
        },
        staleTime: 1000 * 60 * 60, // 1 hour (Legacy Parity)
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
    });
}
