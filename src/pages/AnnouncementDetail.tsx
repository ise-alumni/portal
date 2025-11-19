import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  CalendarIcon, 
  ClockIcon, 
  ArrowLeftIcon,
  ExternalLinkIcon,
  FileTextIcon,
  Loader2Icon,
  MegaphoneIcon,
  EditIcon,
  Trash2Icon
} from "lucide-react";
import EditAnnouncementModal from "@/components/EditAnnouncementModal";
// import { getAnnouncementById } from '@/lib/domain/announcements';
import { log } from '@/lib/utils/logger';
import type { ProfileRow, AnnouncementRow } from '@/integrations/supabase/types';

// Announcement data interface
interface AnnouncementData {
  id: string;
  title: string;
  content: string | null;
  type?: string;
  external_url: string | null;
  deadline: string | null;
  image_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  slug: string | null;
  organiser_profile_id: string | null;
  organiser?: {
    id: string;
    full_name: string | null;
    email: string | null;
    email_visible: boolean | null;
  } | null;
  tags?: Array<{ id: string; name: string; color: string }>;
  creator?: ProfileRow | null;
}

const AnnouncementDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [announcement, setAnnouncement] = useState<AnnouncementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAnnouncement = useCallback(async () => {
    if (!id) {
      setError("No announcement ID provided");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch announcement with organiser profile data and tags
      const { data, error: fetchError } = await supabase
        .from('announcements')
        .select(`
          *,
          organiser:organiser_profile_id (
            id,
            full_name,
            email
          ),
          announcement_tags!inner(
            tag_id,
              tags!inner(
                id,
                name,
                color
              )
            )
          )
        `)
        .eq('id', id)
        .single();

       if (fetchError) {
         throw fetchError;
       }

       if (!data) {
         throw new Error('Announcement not found');
       }

         // Transform data to match our interface
         const announcementData = data as AnnouncementRow & { 
           organiser?: { id: string; full_name: string | null; email: string | null; email_visible: boolean | null } | null;
           announcement_tags?: Array<{ 
             tag_id: string; 
               tags: { id: string; name: string; color: string } 
           }> 
         };
        
         const transformedData: AnnouncementData = {
         id: announcementData.id,
         title: announcementData.title,
         content: announcementData.content,
         external_url: announcementData.external_url,
         deadline: announcementData.deadline,
         image_url: announcementData.image_url || 'https://placehold.co/600x400',
         created_by: announcementData.created_by,
         created_at: announcementData.created_at,
         updated_at: announcementData.updated_at,
         slug: announcementData.slug,
         organiser_profile_id: announcementData.organiser_profile_id,
         organiser: announcementData.organiser,
         tags: announcementData.announcement_tags?.map((tagRelation) => ({
           id: tagRelation.tags.id,
           name: tagRelation.tags.name,
           color: tagRelation.tags.color
         })) || [],
           creator: announcementData.organiser as ProfileRow | null, // Use organiser as creator
         };

       setAnnouncement(transformedData);
    } catch (err) {
      log.error('Error fetching announcement:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch announcement');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAnnouncement();
  }, [id, fetchAnnouncement]);

  // Loading state
  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2Icon className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading announcement details...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-semibold mb-4">Error Loading Announcement</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => navigate('/announcements')}>
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Announcements
        </Button>
      </div>
    );
  }

  // Announcement not found
  if (!announcement) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-semibold mb-4">Announcement Not Found</h1>
        <p className="text-muted-foreground mb-6">The announcement you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/announcements')}>
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Announcements
        </Button>
      </div>
    );
  }

  const getStatus = (deadline: string | null) => {
    if (!deadline) return 'ongoing';
    const date = new Date(deadline);
    const today = new Date();
    return date > today ? 'active' : 'expired';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };



  const imageUrl = announcement.image_url || `https://placehold.co/600x400?text=Announcement+${announcement.id}`;

  // Check if current user can edit this announcement
  const canEdit = user && (announcement.created_by === user.id);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      const { error: deleteError } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcement.id);

      if (deleteError) throw deleteError;

      navigate('/announcements');
    } catch (err) {
      log.error('Error deleting announcement:', err);
      alert('Failed to delete announcement. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAnnouncementUpdated = () => {
    // Refetch the announcement data
    window.location.reload();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/announcements')}
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Announcements
        </Button>
      </div>
      
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{announcement.title}</h1>
          <p className="text-muted-foreground mt-1">Announcement Details</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatus(announcement.deadline) === 'active' ? 'default' : 'secondary'}>
            {getStatus(announcement.deadline)}
          </Badge>
          {canEdit && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
                <EditIcon className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={handleDelete} disabled={isDeleting}>
                <Trash2Icon className="w-4 h-4 mr-1" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Announcement Image */}
          <Card className="border-2 border-foreground shadow-none overflow-hidden">
            <div className="aspect-video w-full overflow-hidden">
              <img 
                src={imageUrl} 
                alt={announcement.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to another random image if first one fails
                  const target = e.target as HTMLImageElement;
                  const randomId = Math.floor(Math.random() * 1000);
                  target.src = `https://placehold.co/600x400?text=Announcement+${randomId}`;
                }}
              />
            </div>
          </Card>

          {/* Announcement Info Card */}
          <Card className="border-2 border-foreground shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MegaphoneIcon className="w-5 h-5" />
               Info 
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Posted Date</p>
                    <p className="text-sm text-muted-foreground">{formatDate(announcement.created_at)}</p>
                  </div>
                </div>
                
                {announcement.deadline && (
                  <div className="flex items-center gap-3">
                    <ClockIcon className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Deadline</p>
                      <p className="text-sm text-muted-foreground">{formatDate(announcement.deadline)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card className="border-2 border-foreground shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileTextIcon className="w-5 h-5" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm leading-relaxed prose prose-sm max-w-none">
                <ReactMarkdown>{announcement.content || 'No content available.'}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action Card */}
          <Card className="border-2 border-foreground shadow-none">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {announcement.external_url && (
                <Button className="w-full" size="lg" asChild>
                  <a href={announcement.external_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLinkIcon className="w-4 h-4 mr-2" />
                    Learn More
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Tags Section */}
          {announcement.tags && announcement.tags.length > 0 && (
            <Card className="border-2 border-foreground shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileTextIcon className="w-5 h-5" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {announcement.tags?.map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-xs"
                      style={{ 
                        backgroundColor: tag.color + '20',
                        borderColor: tag.color,
                        color: tag.color 
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Creator Info */}
          <Card className="border-2 border-foreground shadow-none">
            <CardHeader>
              <CardTitle>Posted By</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">
                  {announcement.creator?.full_name || 'Unknown'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {announcement.creator?.email_visible && announcement.creator?.email ? announcement.creator.email : 'Email hidden'}
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <EditAnnouncementModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleAnnouncementUpdated}
          onDelete={handleDelete}
          announcement={announcement}
        />
      )}
    </div>
  );
};

export default AnnouncementDetail;
