import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Eye, Edit, Trash2 } from 'lucide-react';
import { EventData } from '@/lib/types';
import { filterData, sortData, paginateData, type FilterOptions, type SortOption, type PaginationOptions } from '@/lib/utils/data';
import { isEventInPast, isEventUpcoming, isEventOngoing } from '@/lib/domain';
import { formatDateShort } from '@/lib/utils/date';
import { useNavigate } from 'react-router-dom';

interface DashboardEventsTabProps {
  events: EventData[];
  eventsFilter: FilterOptions;
  eventsSort: SortOption;
  eventsPagination: PaginationOptions;
  setEventsFilter: (filter: FilterOptions) => void;
  setEventsSort: (sort: SortOption) => void;
  setEventsPagination: (pagination: PaginationOptions) => void;
  dataLoading: boolean;
}

export function DashboardEventsTab({
  events,
  eventsFilter,
  eventsSort,
  eventsPagination,
  setEventsFilter,
  setEventsSort,
  setEventsPagination,
  dataLoading,
}: DashboardEventsTabProps) {
  const navigate = useNavigate();

  const filteredEvents = filterData(events, eventsFilter, ['title', 'description', 'location']);
  const sortedEvents = sortData(filteredEvents, eventsSort);
  const paginatedEvents = paginateData(sortedEvents, eventsPagination);
  const totalPages = Math.ceil(filteredEvents.length / eventsPagination.limit);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Event Management</CardTitle>
              <CardDescription>
                Create and manage events
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Input
                placeholder="Search events..."
                value={eventsFilter.search || ''}
                onChange={(e) => setEventsFilter({ ...eventsFilter, search: e.target.value })}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {dataLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedEvents.data.map((event) => {
                const isPast = isEventInPast(event);
                const isOngoing = isEventOngoing(event);
                
                return (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.location || 'No location'} • {formatDateShort(event.start_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={isPast ? "secondary" : isOngoing ? "default" : "outline"}>
                        {isPast ? 'Past' : isOngoing ? 'Ongoing' : 'Upcoming'}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/events/${event.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/events/${event.id}?action=edit`)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/events/${event.id}?action=delete`)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {events.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No events to display</p>
                </div>
              )}
              
              {/* Pagination */}
              {filteredEvents.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {eventsPagination.page} of {totalPages} pages
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={eventsPagination.page === 1}
                      onClick={() => setEventsPagination({ ...eventsPagination, page: Math.max(1, eventsPagination.page - 1) })}
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={eventsPagination.page >= totalPages}
                      onClick={() => setEventsPagination({ ...eventsPagination, page: eventsPagination.page + 1 })}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

