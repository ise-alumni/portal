import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Megaphone, Eye, Edit, Trash2 } from 'lucide-react';
import { Announcement } from '@/lib/types';
import { filterData, sortData, paginateData, type FilterOptions, type SortOption, type PaginationOptions } from '@/lib/utils/data';
import { isAnnouncementExpired, isAnnouncementActive } from '@/lib/domain';
import { formatDateShort } from '@/lib/utils/date';
import { useNavigate } from 'react-router-dom';

interface DashboardAnnouncementsTabProps {
  announcements: Announcement[];
  announcementsFilter: FilterOptions;
  announcementsSort: SortOption;
  announcementsPagination: PaginationOptions;
  setAnnouncementsFilter: (filter: FilterOptions) => void;
  setAnnouncementsSort: (sort: SortOption) => void;
  setAnnouncementsPagination: (pagination: PaginationOptions) => void;
  dataLoading: boolean;
}

export function DashboardAnnouncementsTab({
  announcements,
  announcementsFilter,
  announcementsSort,
  announcementsPagination,
  setAnnouncementsFilter,
  setAnnouncementsSort,
  setAnnouncementsPagination,
  dataLoading,
}: DashboardAnnouncementsTabProps) {
  const navigate = useNavigate();

  const filteredAnnouncements = filterData(announcements, announcementsFilter, ['title', 'content']);
  const sortedAnnouncements = sortData(filteredAnnouncements, announcementsSort);
  const paginatedAnnouncements = paginateData(sortedAnnouncements, announcementsPagination);
  const totalPages = Math.ceil(filteredAnnouncements.length / announcementsPagination.limit);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Announcement Management</CardTitle>
              <CardDescription>
                Create and manage announcements
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Input
                placeholder="Search announcements..."
                value={announcementsFilter.search || ''}
                onChange={(e) => setAnnouncementsFilter({ ...announcementsFilter, search: e.target.value })}
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
              {paginatedAnnouncements.data.map((announcement) => {
                const isExpired = isAnnouncementExpired(announcement);
                const isActive = isAnnouncementActive(announcement);
                
                return (
                  <div key={announcement.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Megaphone className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">{announcement.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {announcement.deadline ? `Deadline: ${formatDateShort(announcement.deadline)}` : 'No deadline'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={isExpired ? "destructive" : isActive ? "default" : "secondary"}>
                        {isExpired ? 'Expired' : isActive ? 'Active' : 'Draft'}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/announcements/${announcement.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/announcements/${announcement.id}?action=edit`)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/announcements/${announcement.id}?action=delete`)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {announcements.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No announcements to display</p>
                </div>
              )}
              
              {/* Pagination */}
              {filteredAnnouncements.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {announcementsPagination.page} of {totalPages} pages
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={announcementsPagination.page <= 1}
                      onClick={() => setAnnouncementsPagination({ ...announcementsPagination, page: Math.max(1, announcementsPagination.page - 1) })}
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={announcementsPagination.page >= totalPages}
                      onClick={() => setAnnouncementsPagination({ ...announcementsPagination, page: announcementsPagination.page + 1 })}
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

