import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Mail, ArrowLeft, ExternalLink, MapPin, Briefcase, GraduationCap, Github, Linkedin, Twitter, Globe, Paperclip, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils/date';
import { log } from '@/lib/utils/logger';
import { Profile, ProfessionalStatus } from '@/lib/types';
import { EventData } from '@/lib/types/events';
import { getUserResidencies, type Residency, type ResidencyPartner } from '@/lib/domain/residency';
import { getCohortLabel } from '@/lib/utils/ui';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { TagBadge } from '@/components/ui/tag-badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

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
  const [userResidencies, setUserResidencies] = useState<Residency[]>([]);
  const [residencyPartners, setResidencyPartners] = useState<ResidencyPartner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileAndData = async () => {
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

        // Fetch user's residencies with company details
        const [residencies, partners] = await Promise.all([
          getUserResidencies(profileData?.user_id || ''),
          supabase.from('residency_partners').select('*').eq('is_active', true).order('name')
        ]);

        if (residencies) {
          setUserResidencies(residencies);
        }

        if (partners.data) {
          setResidencyPartners(partners.data);
        }
      } catch (err) {
        log.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndData();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner text="Loading profile..." size="lg" />
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
          <ArrowLeft className="w-4 h-4" />
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

      {/* Modern Profile Layout */}
      <div className="space-y-6">
        
        {/* Main Profile Section */}
        <Card className="border-2 border-foreground shadow-none">
          <CardHeader>
            <div className="flex items-start gap-4">
              <ProfileAvatar 
                src={profile.avatar_url}
                fullName={profile.full_name}
                size="xl"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold break-words">{profile.full_name || 'No Name'}</h1>
                  {profile.user_type && (
                    <Badge
                      variant={
                        profile.user_type === "Admin"
                          ? "destructive"
                          : profile.user_type === "Staff"
                          ? "secondary"
                          : "default"
                      }
                      className="text-sm"
                    >
                      {profile.user_type}
                    </Badge>
                  )}
                  
                  {/* Academic Badges */}
                  {profile.user_type !== 'Staff' && (
                    <div className="flex gap-2">
               {profile.cohort && (
                  <Badge variant="secondary" className="text-xs">
                    {getCohortLabel(profile.cohort)}
                  </Badge>
                )}
                
                {profile.graduation_year && (
                  <Badge variant="outline" className="text-xs">
                    {profile.graduation_year}
                  </Badge>
                )}
                
                {profile.msc !== undefined && (
                  <Badge variant="outline" className="text-xs">
                    {profile.msc ? 'MSc' : 'BSc'}
                  </Badge>
                )}                    </div>
                  )}
                </div>
                
                {/* Bio */}
                {profile.bio && (
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap mb-4">{profile.bio}</p>
                )}

                {/* Social Links */}
                <div className="flex flex-wrap gap-2">
                  {profile.github_url && (
                    <a 
                      href={profile.github_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 p-2 border rounded-lg hover:bg-accent transition-colors text-sm"
                    >
                      <Github className="w-4 h-4" />
                      <span>GitHub</span>
                    </a>
                  )}
                  
                  {profile.linkedin_url && (
                    <a 
                      href={profile.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 p-2 border rounded-lg hover:bg-accent transition-colors text-sm"
                    >
                      <Linkedin className="w-4 h-4" />
                      <span>LinkedIn</span>
                    </a>
                  )}
                  
                  {profile.twitter_url && (
                    <a 
                      href={profile.twitter_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 p-2 border rounded-lg hover:bg-accent transition-colors text-sm"
                    >
                      <Twitter className="w-4 h-4" />
                      <span>Twitter</span>
                    </a>
                  )}
                  
                  {profile.website_url && (
                    <a 
                      href={profile.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 p-2 border rounded-lg hover:bg-accent transition-colors text-sm"
                    >
                      <Globe className="w-4 h-4" />
                      <span>Website</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Information Grid */}
        <div className="grid grid-cols-1 gap-6">
          {/* Professional & Contact Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Professional 
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
<div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {profile.professional_status && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          profile.professional_status === 'employed' 
                            ? 'bg-gray-100 text-gray-800'
                            : profile.professional_status === 'entrepreneur'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {profile.professional_status === 'employed' && 'Employed'}
                          {profile.professional_status === 'entrepreneur' && 'Entrepreneur'}
                          {profile.professional_status === 'open_to_work' && 'Open to Work'}
                        </span>
                      )}
                      {profile.is_remote && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Remote
                        </span>
                      )}
                      {profile.is_ise_champion && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          ISE Champion
                        </span>
                      )}
                    </div>
                  </div>

              {/* Contact Section */}
              <div className="pb-4">
                <div className="space-y-3">
                  {profile.email_visible && profile.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
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
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">(email hidden)</span>
                    </div>
                  )}

                  {profile.city && profile.country && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{profile.city}, {profile.country}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Section */}
              <div>
                <div className="space-y-3">
                  {profile.company && (
                    <div>
                      <p className="font-medium text-foreground text-sm mb-1">Company: <span className="text-sm font-normal">{profile.company}</span></p>
                    </div>
                  )}
                  
                  {profile.job_title && (
                    <div>
                      <p className="font-medium text-foreground text-sm mb-1">Job Title: <span className="text-sm font-normal"> {profile.job_title}</span></p>
                    </div>
                  )}  

                                  </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Residencies Section */}
        {userResidencies.length > 0 && (
          <Card className="border-2 border-foreground shadow-none">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Building2 className="w-6 h-6" />
                Residencies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userResidencies.map((residency) => {
                  const company = residencyPartners.find(p => p.id === residency.company_id);
                  return (
                    <div key={residency.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="text-sm">
                            {residency.phase}
                          </Badge>
                          <h3 className="font-semibold text-lg">
                            {company?.name || 'Unknown Company'}
                          </h3>
                        </div>
                        {company?.website && (
                          <a 
                            href={company.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Visit
                          </a>
                        )}
                      </div>
                      
                      {residency.description && (
                        <div className="text-sm text-muted-foreground">
                          <p className="whitespace-pre-wrap leading-relaxed">
                            {residency.description}
                          </p>
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground pt-3 border-t">
                        Added: {new Date(residency.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* User's Announcements - Full Width */}
      {userAnnouncements.length > 0 && (
        <Card className="w-full mt-6 border-2 border-foreground shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5" />
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
                              <TagBadge 
                                key={tag.id}
                                name={tag.name}
                                color={tag.color}
                              />
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
                            <ExternalLink className="w-4 h-4" />
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
              <Calendar className="w-5 h-5" />
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
                              <TagBadge 
                                key={tagRelation.tag_id}
                                name={tagRelation.tags.name}
                                color={tagRelation.tags.color}
                              />
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
                              <ExternalLink className="w-4 h-4" />
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