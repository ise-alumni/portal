import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Calendar, Newspaper } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

const Index = () => {
  const { user, session, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isFetching = useRef(false);

  const [formData, setFormData] = useState({
    fullName: '',
    city: '',
    country: '',
    graduationYear: '',
    jobTitle: '',
    company: '',
    bio: '',
    githubUrl: '',
    linkedinUrl: '',
    twitterUrl: '',
    websiteUrl: '',
    avatarUrl: '',
    emailVisible: true,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Reset form state when user changes
  useEffect(() => {
    if (!user) {
      setFormData({
        fullName: '',
        city: '',
        country: '',
        graduationYear: '',
        jobTitle: '',
        company: '',
        bio: '',
        githubUrl: '',
        linkedinUrl: '',
        twitterUrl: '',
        websiteUrl: '',
        avatarUrl: '',
        emailVisible: true,
      });
      setAvatarFile(null);
      setProfile(null);
      setProfileLoading(true);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

    useEffect(() => {
      const fetchProfile = async () => {
        if (!user || isFetching.current) return;
        isFetching.current = true;
        setProfileLoading(true);
        try {
          const { data } = await supabase
            .from('profiles')
            .select('id, created_at, updated_at, user_id, full_name, email, city, country, graduation_year, job_title, company, bio, github_url, linkedin_url, twitter_url, website_url, avatar_url, email_visible, msc, admin, is_public')
            .eq('user_id', user.id)
            .maybeSingle();
           setProfile(data as any ?? null);
           if (data) {
             setFormData({
               fullName: data.full_name ?? '',
               city: data.city ?? '',
               country: data.country ?? '',
               graduationYear: data.graduation_year?.toString() ?? '',
               jobTitle: data.job_title ?? '',
               company: data.company ?? '',
               bio: data.bio ?? '',
               githubUrl: (data as any).github_url ?? '',
               linkedinUrl: (data as any).linkedin_url ?? '',
               twitterUrl: (data as any).twitter_url ?? '',
               websiteUrl: (data as any).website_url ?? '',
               avatarUrl: data.avatar_url ?? '',
               emailVisible: data.email_visible ?? true,
             });
           }
        } catch (error) {
          console.error("Error fetching profile:", error);
        } finally {
          setProfileLoading(false);
          isFetching.current = false;
        }
      };
      fetchProfile();
    }, [user]);

   // Timeout to reset loading if stuck
   useEffect(() => {
     if (profileLoading) {
       const timer = setTimeout(() => {
         setProfileLoading(false);
       }, 5000);
       return () => clearTimeout(timer);
     }
   }, [profileLoading]);

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatarUrl: publicUrl }));
      return publicUrl;
    } catch (error) {
      console.error("Avatar upload error:", error);
      return null;
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let avatarUrlToSave = formData.avatarUrl;
      if (avatarFile) {
        const uploadedUrl = await handleAvatarUpload(avatarFile);
        if (uploadedUrl) {
          avatarUrlToSave = uploadedUrl;
          setAvatarFile(null);
        } else {
          // If upload fails, don't update avatar_url
          console.error("Avatar upload failed, keeping existing avatar");
        }
      }

      const payload: any = {
        user_id: user.id,
        full_name: formData.fullName || null,
        email: user.email ?? null,
        city: formData.city || null,
        country: formData.country || null,
        graduation_year: formData.graduationYear ? parseInt(formData.graduationYear, 10) : null,
        job_title: formData.jobTitle || null,
        company: formData.company || null,
        bio: formData.bio || null,
        github_url: formData.githubUrl || null,
        linkedin_url: formData.linkedinUrl || null,
        twitter_url: formData.twitterUrl || null,
        website_url: formData.websiteUrl || null,
        email_visible: formData.emailVisible,
      };

      // Only include avatar_url if an avatar was uploaded and upload succeeded
      if (avatarFile && avatarUrlToSave) {
        payload.avatar_url = avatarUrlToSave;
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'user_id' } as any)
        .select('*')
        .maybeSingle();
      if (!error) {
        setProfile(data as any);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div>

      <Card className="mb-6 border-2 border-foreground shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="tracking-tight">Profile</CardTitle>
          <CardDescription className="mt-1"></CardDescription>
        </CardHeader>
        <CardContent>
          {profileLoading ? (
            <div className="text-sm text-muted-foreground">Loading profile…</div>
          ) : profile ? (
            (() => {
               const displayFullName = profile.full_name || (user?.user_metadata as any)?.full_name || (user?.email?.split('@')[0] ?? '—');
               const displayEmail = user?.email || profile.email || '—';
               const lastSignedIn = user?.last_sign_in_at || '—';
               const anyData = profile as any;
               return (
                 <div className="space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 text-sm">
                     <div><span className="opacity-70">Name:</span> {displayFullName}</div>
                      <div><span className="opacity-70">Email:</span> {formData.emailVisible ? displayEmail : 'Hidden'}</div>
                     <div><span className="opacity-70">Last signed in:</span> {lastSignedIn}</div>
                   </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                      <div>
                        <label className="text-xs opacity-70">Full Name</label>
                        <Input value={formData.fullName} onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))} placeholder="Your full name" />
                      </div>
                      <div>
                        <label className="text-xs opacity-70">Avatar</label>
                        <div className="flex items-center gap-2">
                          {formData.avatarUrl && (
                            <img src={formData.avatarUrl} alt="Avatar preview" className="w-16 h-16 rounded-full object-cover" />
                          )}
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setAvatarFile(file);
                                setFormData(prev => ({ ...prev, avatarUrl: URL.createObjectURL(file) }));
                              }
                            }}
                          />
                        </div>
                      </div>
                       <div>
                         <label className="text-xs opacity-70">Graduation Year</label>
                         <Input value={formData.graduationYear} onChange={(e) => setFormData(prev => ({ ...prev, graduationYear: e.target.value }))} placeholder="2020" inputMode="numeric" />
                       </div>
                       <div className="md:col-span-2">
                         <Button onClick={() => setFormData(prev => ({ ...prev, emailVisible: !prev.emailVisible }))} className="w-full md:w-auto border-2 border-foreground shadow-none">
                           {formData.emailVisible ? 'Hide Email' : 'Make Email Public'}
                         </Button>
                       </div>
                       <div>
                         <label className="text-xs opacity-70">City</label>
                         <Input value={formData.city} onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))} placeholder="City" />
                       </div>
                       <div>
                         <label className="text-xs opacity-70">Country</label>
                         <Input value={formData.country} onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))} placeholder="Country" />
                       </div>
                       <div>
                         <label className="text-xs opacity-70">Role</label>
                         <Input value={formData.jobTitle} onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))} placeholder="Job title" />
                       </div>
                     <div>
                       <label className="text-xs opacity-70">Company</label>
                       <Input value={formData.company} onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))} placeholder="Company" />
                     </div>
                     <div className="md:col-span-2">
                       <label className="text-xs opacity-70">Bio</label>
                       <Textarea value={formData.bio} onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))} placeholder="Short bio" rows={3} />
                     </div>
                     <div>
                       <label className="text-xs opacity-70">GitHub</label>
                       <Input value={formData.githubUrl} onChange={(e) => setFormData(prev => ({ ...prev, githubUrl: e.target.value }))} placeholder="https://github.com/username" />
                     </div>
                     <div>
                       <label className="text-xs opacity-70">LinkedIn</label>
                       <Input value={formData.linkedinUrl} onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))} placeholder="https://www.linkedin.com/in/username" />
                     </div>
                     <div>
                       <label className="text-xs opacity-70">Twitter / X</label>
                       <Input value={formData.twitterUrl} onChange={(e) => setFormData(prev => ({ ...prev, twitterUrl: e.target.value }))} placeholder="https://twitter.com/username" />
                     </div>
           <div>
                       <label className="text-xs opacity-70">Website</label>
                       <Input value={formData.websiteUrl} onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))} placeholder="https://your-site.com" />
                     </div>
           </div>
                  <div className="flex flex-col md:flex-row md:justify-end">
                    <Button onClick={handleSaveProfile} disabled={saving} className="w-full md:w-auto border-2 border-foreground shadow-none">
                      {saving ? 'Saving…' : 'Save Profile'}
            </Button>
          </div>
                </div>
              );
            })()
          ) : (
            (() => {
              const displayFullName = (user?.user_metadata as any)?.full_name || (user?.email?.split('@')[0] ?? '—');
              const displayEmail = user?.email || '—';
               const lastSignedIn = user?.last_sign_in_at || '—';
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 text-sm">
                    <div><span className="opacity-70">Name:</span> {displayFullName}</div>
                    <div><span className="opacity-70">Email:</span> {displayEmail}</div>
                    <div><span className="opacity-70">Last signed in:</span> {lastSignedIn}</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                     <div>
                       <label className="text-xs opacity-70">Full Name</label>
                       <Input value={formData.fullName} onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))} placeholder="Your full name" />
                     </div>
                     <div>
                       <label className="text-xs opacity-70">Graduation Year</label>
                       <Input value={formData.graduationYear} onChange={(e) => setFormData(prev => ({ ...prev, graduationYear: e.target.value }))} placeholder="2020" inputMode="numeric" />
                     </div>
                     <div>
                       <label className="text-xs opacity-70">City</label>
                       <Input value={formData.city} onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))} placeholder="City" />
                     </div>
                     <div>
                       <label className="text-xs opacity-70">Country</label>
                       <Input value={formData.country} onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))} placeholder="Country" />
                     </div>
                     <div>
                       <label className="text-xs opacity-70">Role</label>
                       <Input value={formData.jobTitle} onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))} placeholder="Job title" />
                     </div>
                     <div>
                       <label className="text-xs opacity-70">Company</label>
                       <Input value={formData.company} onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))} placeholder="Company" />
                     </div>
                     <div className="md:col-span-2">
                       <label className="text-xs opacity-70">Bio</label>
                       <Textarea value={formData.bio} onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))} placeholder="Short bio" rows={3} />
                     </div>
                     <div>
                       <label className="text-xs opacity-70">GitHub</label>
                       <Input value={formData.githubUrl} onChange={(e) => setFormData(prev => ({ ...prev, githubUrl: e.target.value }))} placeholder="https://github.com/username" />
                     </div>
                     <div>
                       <label className="text-xs opacity-70">LinkedIn</label>
                       <Input value={formData.linkedinUrl} onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))} placeholder="https://www.linkedin.com/in/username" />
                     </div>
                     <div>
                       <label className="text-xs opacity-70">Twitter / X</label>
                       <Input value={formData.twitterUrl} onChange={(e) => setFormData(prev => ({ ...prev, twitterUrl: e.target.value }))} placeholder="https://twitter.com/username" />
                 </div>
                 <div>
                       <label className="text-xs opacity-70">Website</label>
                       <Input value={formData.websiteUrl} onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))} placeholder="https://your-site.com" />
                     </div>
                   </div>
                  <div className="flex flex-col md:flex-row md:justify-end">
                    <Button onClick={handleSaveProfile} disabled={saving} className="w-full md:w-auto border-2 border-foreground shadow-none">
                      {saving ? 'Saving…' : 'Save Profile'}
                    </Button>
                  </div>
                </div>
              );
            })()
          )}
        </CardContent>
      </Card>

   

    </div>
  );
};

export default Index;
