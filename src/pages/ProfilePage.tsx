import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon, MailIcon, ArrowLeftIcon, ExternalLinkIcon, MapPinIcon, BriefcaseIcon, GraduationCapIcon, GithubIcon, LinkedinIcon, TwitterIcon, GlobeIcon, PaperclipIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils/date';
import { log } from '@/lib/utils/logger';
import { Profile } from '@/lib/types';
import { EventData } from '@/lib/types/events';
import { getCohortLabel } from '@/lib/utils/ui';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Announcement {
  id: string;
  title: string;
  content: string | null;
  external_url: string | null;
  deadline: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    full_name: string | null;
    email: string | null;
    email_visible: boolean | null;
  } | null;
  tags?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

interface AnnouncementQueryResult {
  id: string;
  title: string;
  content: string | null;
  external_url: string | null;
  deadline: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    full_name: string | null;
    email: string | null;
    email_visible: boolean | null;
  } | null;
  announcement_tags?: Array<{
    tag_id: string;
    tags: {
      id: string;
      name: string;
      color: string;
    };
  }>;
}

interface EventQueryResult {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  location_url: string | null;
  registration_url: string | null;
  start_at: string;
  end_at: string | null;
  organiser_profile_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  image_url: string | null;
  profiles?: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
  event_tags?: Array<{
    tag_id: string;
    tags: {
      id: string;
      name: string;
      color: string;
    };
  }>;
}

const ProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userAnnouncements, setUserAnnouncements] = useState<Announcement[]>([]);
  const [userEvents, setUserEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileAndAnnouncements = async () => {
      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }

        // Fetch announcements created by this user
        const { data: announcementsData } = await supabase
          .from('announcements')
          .select(`
            *,
            profiles!organiser_profile_id (
              id,
              full_name,
              email,
              email_visible
            ),
            announcement_tags!inner(
              tag_id,
              tags!inner(
                id,
                name,
                color
              )
            )
          `)
          .eq('created_by', id)
          .order('created_at', { ascending: false });

        if (announcementsData) {
          const transformedAnnouncements = (announcementsData as AnnouncementQueryResult[]).map((announcement) => ({
            id: announcement.id,
            title: announcement.title,
            content: announcement.content,
            external_url: announcement.external_url,
            deadline: announcement.deadline,
            image_url: announcement.image_url || 'https://placehold.co/600x400',
            created_at: announcement.created_at,
            updated_at: announcement.updated_at,
            creator: announcement.profiles,
            tags: announcement.announcement_tags?.map((tagRelation) => ({
              id: tagRelation.tags.id,
              name: tagRelation.tags.name,
              color: tagRelation.tags.color
            })) || []
          }));

          setUserAnnouncements(transformedAnnouncements);
        }

        // Fetch events created by this user
        const { data: eventsData } = await supabase
          .from('events')
          .select(`
            *,
            profiles!organiser_profile_id (
              id,
              full_name,
              email
            ),
            event_tags!inner(
              tag_id,
              tags!inner(
                id,
                name,
                color
              )
            )
          `)
          .eq('created_by', id)
          .order('start_at', { ascending: false });

        if (eventsData) {
          const transformedEvents = (eventsData as EventQueryResult[]).map((event) => ({
            id: event.id,
            title: event.title,
            description: event.description,
            location: event.location,
            location_url: event.location_url,
            registration_url: event.registration_url,
            start_at: event.start_at,
            end_at: event.end_at,
            organiser_profile_id: event.organiser_profile_id,
            created_by: event.created_by,
            created_at: event.created_at,
            updated_at: event.updated_at,
            image_url: event.image_url,
            event_tags: event.event_tags?.map((tagRelation) => ({
              tag_id: tagRelation.tag_id,
              tags: {
                id: tagRelation.tags.id,
                name: tagRelation.tags.name,
                color: tagRelation.tags.color
              }
            })) || [],
            organiser: event.profiles
          }));

          setUserEvents(transformedEvents);
        }
      } catch (err) {
        log.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndAnnouncements();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
        <p className="text-muted-foreground">The profile you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/directory')}>
          Back to Directory
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/directory')}
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Directory
        </Button>
        
        {user?.id === profile?.user_id && (
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            Edit Profile
          </Button>
        )}
      </div>

      {/* Bento Grid Layout */}
      <div className="grid-bento md:grid md:grid-cols-4 md:grid-rows-2 md:gap-6 space-y-6 md:space-y-0">
        
        {/* Profile Card - 2x2 */}
        <Card className="grid-profile md:col-span-2 md:row-span-2">
          <CardHeader>
            <CardTitle className="flex items-start gap-4">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={`${profile.full_name || "User"} avatar`}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium text-sm">
                  {profile.full_name ? profile.full_name.split(' ').map(word => word[0]).join('').toUpperCase() : 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold break-words">{profile.full_name || 'No Name'}</h2>
{profile.user_type && (
                        <Badge
                          variant={
                            profile.user_type === "Admin"
                              ? "destructive"
                              : profile.user_type === "Staff"
                              ? "secondary"
                              : "default"
                          }
                          className="text-xs"
                        >
                          {profile.user_type}
                        </Badge>
                      )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Bio */}
            {profile.bio && (
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Bio</h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Information - 1x1 */}
        <Card className="grid-contact">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
            <PaperclipIcon className="w-5 h-5" />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.email_visible && profile.email && (
              <div className="flex items-center gap-2">
                <MailIcon className="w-4 h-4 text-muted-foreground" />
                <a 
                  href={`mailto:${profile.email}`} 
                  className="text-blue-600 hover:text-blue-800 hover:underline text-sm break-all"
                >
                  {profile.email}
                </a>
              </div>
            )}

            {!profile.email_visible && (
              <div className="flex items-center gap-2">
                <MailIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">(email hidden)</span>
              </div>
            )}

            {profile.city && profile.country && (
              <div className="flex items-center gap-2">
                <MapPinIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{profile.city}, {profile.country}</span>
              </div>
            )}

            
          </CardContent>
        </Card>

        {/* Academic Information - 1x1 */}
        {profile.user_type !== 'Staff' && (
          <Card className="grid-academic">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCapIcon className="w-5 h-5" />
                Academic
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.cohort && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">Cohort:</span>
                  <span className="text-sm">#{getCohortLabel(profile.cohort).split("Cohort")[1].trim()}</span>
                </div>
              )}
              
              {profile.graduation_year && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">Graduation:</span>
                  <span className="text-sm">{profile.graduation_year}</span>
                </div>
              )}
              
              {profile.msc !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">Program:</span>
                  <span className="text-sm">{profile.msc ? 'MSc' : 'BSc'}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Professional Information - 1x1 */}
        <Card className="grid-professional">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BriefcaseIcon className="w-5 h-5" />
              Professional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.company && (
              <div className="">
                <p className="font-bold text-foreground text-sm">Company:</p>
                <p className="text-sm">{profile.company}</p>
              </div>
            )}
            
            {profile.job_title && (
              <div className="">
                <p className="font-bold text-foreground text-sm">Job Title:</p>
                <p className="text-sm">{profile.job_title}</p>
              </div>  

            )}

            <div className="space-y-2">
              <p className="font-bold text-foreground text-sm">Status:</p>
              <div className="flex flex-wrap gap-2">
                {profile.is_remote && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Remote
                  </span>
                )}
                {profile.is_entrepreneur && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Entrepreneur
                  </span>
                )}
                {profile.is_ise_champion && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    ISE Champion
                  </span>
                )}
                {profile.employed && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Employed
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Links - 1x1 */}
        <Card className="grid-social">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <GlobeIcon className="w-5 h-5" />
              Social
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.github_url && (
              <div className="flex items-center gap-2">
                <GithubIcon className="w-4 h-4 text-muted-foreground" />
                <a 
                  href={profile.github_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                >
                  GitHub
                </a>
              </div>
            )}
            
            {profile.linkedin_url && (
              <div className="flex items-center gap-2">
                <LinkedinIcon className="w-4 h-4 text-muted-foreground" />
                <a 
                  href={profile.linkedin_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                >
                  LinkedIn
                </a>
              </div>
            )}
            
            {profile.twitter_url && (
              <div className="flex items-center gap-2">
                <TwitterIcon className="w-4 h-4 text-muted-foreground" />
                <a 
                  href={profile.twitter_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                >
                  Twitter
                </a>
              </div>
            )}
            
            {profile.website_url && (
              <div className="flex items-center gap-2">
                <GlobeIcon className="w-4 h-4 text-muted-foreground" />
                <a 
                  href={profile.website_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                >
                  Website
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User's Announcements - Full Width */}
      {userAnnouncements.length > 0 && (
        <Card className="w-full mt-6 border-2 border-foreground shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="tracking-tight flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              ANNOUNCEMENTS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="border-b-2 border-foreground">TITLE</TableHead>
                  <TableHead className="border-b-2 border-foreground">DEADLINE</TableHead>
                  <TableHead className="border-b-2 border-foreground">DATE</TableHead>
                  <TableHead className="border-b-2 border-foreground">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userAnnouncements.map((announcement) => (
                  <TableRow key={announcement.id} className="border-b border-foreground">
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-bold">{announcement.title}</div>
                        {announcement.content && (
                          <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {announcement.content}
                          </div>
                        )}
                        {announcement.tags && announcement.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {announcement.tags.map((tag) => (
                              <Badge 
                                key={tag.id}
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
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {announcement.deadline ? (
                        <Badge variant="outline" className="text-xs">
                          {formatDate(announcement.deadline)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(announcement.created_at)}
                    </TableCell>
                    <TableCell>
                      {announcement.external_url && (
                        <Button variant="outline" size="sm" asChild className="border-2 border-foreground shadow-none">
                          <a href={announcement.external_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                            <ExternalLinkIcon className="w-4 h-4" />
                            LINK
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* User's Events - Full Width */}
      {userEvents.length > 0 && (
        <Card className="w-full mt-6 border-2 border-foreground shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="tracking-tight flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              EVENTS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="border-b-2 border-foreground">TITLE</TableHead>
                  <TableHead className="border-b-2 border-foreground">DATE</TableHead>
                  <TableHead className="border-b-2 border-foreground">LOCATION</TableHead>
                  <TableHead className="border-b-2 border-foreground">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userEvents.map((event) => (
                  <TableRow key={event.id} className="border-b border-foreground">
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-bold">{event.title}</div>
                        {event.description && (
                          <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {event.description}
                          </div>
                        )}
                        {event.event_tags && event.event_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {event.event_tags.map((tagRelation) => (
                              <Badge 
                                key={tagRelation.tag_id}
                                variant="secondary" 
                                className="text-xs"
                                style={{ 
                                  backgroundColor: tagRelation.tags.color + '20',
                                  borderColor: tagRelation.tags.color,
                                  color: tagRelation.tags.color 
                                }}
                              >
                                {tagRelation.tags.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{formatDate(event.start_at)}</div>
                        {event.end_at && (
                          <div className="text-muted-foreground">to {formatDate(event.end_at)}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {event.location ? (
                        <div className="text-sm">
                          <div>{event.location}</div>
                          {event.location_url && (
                            <Button variant="ghost" size="sm" asChild className="p-0 h-auto text-xs">
                              <a href={event.location_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline">
                                MAP
                              </a>
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {event.registration_url && (
                          <Button variant="outline" size="sm" asChild className="border-2 border-foreground shadow-none">
                            <a href={event.registration_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                              <ExternalLinkIcon className="w-4 h-4" />
                              REGISTER
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfilePage;
