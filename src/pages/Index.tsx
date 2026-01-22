import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Profile, ProfileFormData, ProfessionalStatus } from '@/lib/types';
import { getProfileByUserId, updateProfile, isProfileComplete, uploadAvatar, calculateProfileCompletionPercentage } from '@/lib/domain/profiles';
import { getUserResidencies, createResidency, updateResidency, deleteResidency, getResidencyPartners, getAvailablePhases, type Residency, type NewResidency, type ResidencyPhase } from '@/lib/domain/residency';
import { type ResidencyPartner } from '@/lib/types';
import { log } from '@/lib/utils/logger';
import { COUNTRIES } from '@/lib/constants/countries';

const Index = () => {
  const { user, session, loading, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isFetching = useRef(false);

  const [formData, setFormData] = useState({
    fullName: '',
    city: '',
    country: '',
    graduationYear: '',
    msc: false,
    jobTitle: '',
    company: '',
    bio: '',
    githubUrl: '',
    linkedinUrl: '',
    twitterUrl: '',
    websiteUrl: '',
    avatarUrl: '',
    isRemote: false,
    isEntrepreneur: false,
    isIseChampion: false,
    professionalStatus: null as ProfessionalStatus | null,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  // Residency state
  const [residencies, setResidencies] = useState<Residency[]>([]);
  const [residencyPartners, setResidencyPartners] = useState<ResidencyPartner[]>([]);
  const [residencyLoading, setResidencyLoading] = useState(true);
  const [newResidency, setNewResidency] = useState<NewResidency | null>(null);
  const [editingResidency, setEditingResidency] = useState<string | null>(null);

  // Reset form state when user changes
  useEffect(() => {
    if (!user?.id) {
      setFormData({
        fullName: '',
        city: '',
        country: '',
        graduationYear: '',
        msc: false,
        jobTitle: '',
        company: '',
        bio: '',
        githubUrl: '',
        linkedinUrl: '',
        twitterUrl: '',
        websiteUrl: '',
    avatarUrl: '',
    isRemote: false,
        isEntrepreneur: false,
        isIseChampion: false,
        professionalStatus: null,
      });
      setAvatarFile(null);
      setProfile(null);
      setProfileLoading(true);
      setResidencies([]);
      setResidencyPartners([]);
      setNewResidency(null);
      setEditingResidency(null);
      setResidencyLoading(true);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!loading && !user?.id) {
      navigate('/auth');
    }
  }, [user?.id, loading, navigate]);

    const fetchProfile = useCallback(async () => {
      if (!user || isFetching.current) return;
      isFetching.current = true;
      setProfileLoading(true);
      try {
        const data = await getProfileByUserId(user.id);
        setProfile(data);
        if (data) {
          setFormData({
            fullName: data.full_name ?? '',
            city: data.city ?? '',
            country: data.country ?? '',
            graduationYear: data.graduation_year?.toString() ?? '',
            msc: data.msc ?? false,
            jobTitle: data.job_title ?? '',
            company: data.company ?? '',
            bio: data.bio ?? '',
            githubUrl: data.github_url ?? '',
            linkedinUrl: data.linkedin_url ?? '',
            twitterUrl: data.twitter_url ?? '',
            websiteUrl: data.website_url ?? '',
            avatarUrl: data.avatar_url ?? '',
            isRemote: data.is_remote ?? false,
            isEntrepreneur: data.is_entrepreneur ?? false,
            isIseChampion: data.is_ise_champion ?? false,
            professionalStatus: data.professional_status ?? null,
          });
        }
      } catch (error) {
        log.error("Error fetching profile:", error);
      } finally {
        setProfileLoading(false);
        isFetching.current = false;
      }
    }, [user?.id]);

    useEffect(() => {
      fetchProfile();
    }, [fetchProfile]);

    // Fetch residency data
    const fetchResidencyData = useCallback(async () => {
      if (!user?.id) return;
      setResidencyLoading(true);
      try {
        const [userResidencies, partners] = await Promise.all([
          getUserResidencies(user.id),
          getResidencyPartners()
        ]);
        setResidencies(userResidencies);
        setResidencyPartners(partners);
      } catch (error) {
        log.error("Error fetching residency data:", error);
      } finally {
        setResidencyLoading(false);
      }
    }, [user?.id]);

    useEffect(() => {
      fetchResidencyData();
    }, [fetchResidencyData]);

   // Timeout to reset loading if stuck
   useEffect(() => {
     if (profileLoading) {
       const timer = setTimeout(() => {
         setProfileLoading(false);
       }, 5000);
       return () => clearTimeout(timer);
     }
   }, [profileLoading]);

  const handleAvatarUpload = useCallback(async (file: File) => {
    if (!user?.id) return null;

    const publicUrl = await uploadAvatar(user.id, file);
    if (publicUrl) {
      setFormData(prev => ({ ...prev, avatarUrl: publicUrl }));
    }
    return publicUrl;
  }, [user?.id]);

  const handleSaveProfile = useCallback(async () => {
    if (!user?.id) return;
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
          log.error("Avatar upload failed, keeping existing avatar");
        }
      }

      // Create form data with avatar URL
      const profileFormData: ProfileFormData = {
        ...formData,
        avatarUrl: avatarFile && avatarUrlToSave ? avatarUrlToSave : undefined,
      };

      const data = await updateProfile(user.id, profileFormData);
      if (data) {
        setProfile(data);
      }
    } finally {
      setSaving(false);
    }
  }, [user?.id, formData, avatarFile, handleAvatarUpload]);

  const handleForgotPassword = async () => {
    if (!user?.email) {
      alert('No email address found');
      return;
    }
    
    const result = await resetPassword(user.email);
    if (result.error) {
      alert(`Error sending password reset: ${result.error}`);
    } else {
      alert('Password reset email sent! Please check your inbox.');
    }
  };

  // Residency handling functions
  const handleAddResidency = () => {
    if (!user) return;
    setNewResidency({
      phase: 'R1',
      company_id: '',
      user_id: user.id,
      description: ''
    });
    setEditingResidency('new');
  };

  const handleSaveResidency = async (residency: NewResidency) => {
    if (!user) return;
    try {
      if (editingResidency === 'new') {
        const created = await createResidency(residency);
        if (created) {
          setResidencies(prev => [...prev, created]);
        }
      } else {
        const updated = await updateResidency(editingResidency, residency);
        if (updated) {
          setResidencies(prev => prev.map(r => r.id === editingResidency ? updated : r));
        }
      }
      setNewResidency(null);
      setEditingResidency(null);
    } catch (error) {
      log.error("Error saving residency:", error);
    }
  };

  const handleDeleteResidency = async (id: string) => {
    try {
      const success = await deleteResidency(id);
      if (success) {
        setResidencies(prev => prev.filter(r => r.id !== id));
      }
    } catch (error) {
      log.error("Error deleting residency:", error);
    }
  };

  const handleCancelResidency = () => {
    setNewResidency(null);
    setEditingResidency(null);
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

   const displayEmail = user?.email || profile?.email || '—';
   const lastSignedIn = user?.last_sign_in_at || '—';

   // Calculate profile completion using domain function
   const profileCompletion = calculateProfileCompletionPercentage(profile);
   const isComplete = profile ? isProfileComplete(profile) : false;

   return (
     <>
       <Card className="mb-6 border-2 border-foreground shadow-none">
         <CardHeader className="pb-2">
           <div className="flex items-center justify-between">
             <div>
               <CardTitle className="tracking-tight">Profile</CardTitle>
               <CardDescription className="mt-1"></CardDescription>
             </div>
             <div className="text-right">
               <div className="flex items-center space-x-2">
                 <span className="text-sm font-medium">Profile Completion</span>
                 <Badge variant={isComplete ? "default" : "secondary"} className="ml-2">
                   {profileCompletion}%
                 </Badge>
               </div>
               <p className="text-xs text-muted-foreground mt-1">
                 {isComplete ? 'Complete' : 'More fields needed'}
               </p>
             </div>
           </div>
         </CardHeader>
         <CardContent>
           {profileLoading ? (
             <div className="text-sm text-muted-foreground">Loading profile…</div>
           ) : (
             <div className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 text-sm">
                 <div><span className="opacity-70">Last signed in:</span> {lastSignedIn}</div>
                 <div>
                   <span className="opacity-70">Email:</span> {displayEmail}
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                 <div>
                   <label className="text-xs opacity-70">Full Name</label>
                   <Input value={formData.fullName} onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))} placeholder="Your full name" />
                   <div className="mt-2">
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
                 </div>
                 <div className="space-y-5">

               <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                     <div>
                       <label className="text-xs opacity-70">Graduation Year</label>
                       <Input value={formData.graduationYear} onChange={(e) => setFormData(prev => ({ ...prev, graduationYear: e.target.value }))} placeholder="2020" inputMode="numeric" />
                     </div>
                     <div>
                       <label className="text-xs opacity-70">Program</label>
                       <Select value={formData.msc ? 'msc' : 'bsc'} onValueChange={(value) => setFormData(prev => ({ ...prev, msc: value === 'msc' }))}>
                         <SelectTrigger className="w-full">
                           <SelectValue placeholder="Select program" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="bsc">BSc</SelectItem>
                           <SelectItem value="msc">MSc</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                     <div>
                       <label className="text-xs opacity-70">City</label>
                       <Input value={formData.city} onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))} placeholder="City" />
                     </div>
                    <div>
                      <label className="text-xs opacity-70">Country</label>
                      <Select 
                        value={formData.country} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {COUNTRIES.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                   </div>
                 </div>
                 <div>
                   <label className="text-xs opacity-70">Role</label>
                   <Input value={formData.jobTitle} onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))} placeholder="Job title" />
                 </div>
                 <div>
                   <label className="text-xs opacity-70">Company</label>
                   <Input value={formData.company} onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))} placeholder="Company" />
                 </div>
               </div>

               <div className="md:col-span-2 space-y-3">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                   <div>
                     <label className="text-xs opacity-70">Status</label>
                     <Select 
                       value={formData.professionalStatus || ''} 
                       onValueChange={(value) => setFormData(prev => ({ 
                         ...prev, 
                         professionalStatus: value as ProfessionalStatus || null 
                       }))}
                     >
                       <SelectTrigger className="w-full">
                         <SelectValue placeholder="Select professional status" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="employed">Employed</SelectItem>
                         <SelectItem value="entrepreneur">Entrepreneur</SelectItem>
                         <SelectItem value="open_to_work">Open to Work</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   <div className='flex flex-col justify-end'>
                   <div className="flex items-center space-x-2 ">
                     <input
                       type="checkbox"
                       id="isRemote"
                       checked={formData.isRemote}
                       onChange={(e) => setFormData(prev => ({ ...prev, isRemote: e.target.checked }))}
                       className="h-4 w-4 rounded border-foreground focus:ring-2 focus:ring-primary focus:ring-offset-2 accent-green-600"
                     />
                     <label htmlFor="isRemote" className="text-sm">Remote Worker</label>
                   </div>
                   <div className="flex items-center space-x-2">
                     <input
                       type="checkbox"
                       id="isIseChampion"
                       checked={formData.isIseChampion}
                       onChange={(e) => setFormData(prev => ({ ...prev, isIseChampion: e.target.checked }))}
                       className="h-4 w-4 rounded border-foreground focus:ring-2 focus:ring-primary focus:ring-offset-2 accent-green-600"
                     />
                     <label htmlFor="isIseChampion" className="text-sm">ISE Champion</label>
                   </div>
                 </div>
                 </div>
               </div>

               <div className="md:col-span-2">
                 <label className="text-xs opacity-70">Bio</label>
                 <Textarea value={formData.bio} onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))} placeholder="Short bio" rows={3} />
               </div>

               <Accordion type="single" collapsible className="w-full">
                 <AccordionItem value="socials">
                   <AccordionTrigger className="text-sm font-medium hover:no-underline">Socials</AccordionTrigger>
                   <AccordionContent>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
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
                   </AccordionContent>
                 </AccordionItem>
                </Accordion>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="residencies">
                    <AccordionTrigger className="text-sm font-medium hover:no-underline">Residencies</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        {residencyLoading ? (
                          <div className="text-sm text-muted-foreground">Loading residencies…</div>
                        ) : (
                          <>
                            {/* Existing residencies */}
                            {residencies.length > 0 && (
                              <div className="space-y-3">
                                {residencies.map((residency) => (
                                  <div key={residency.id} className="p-3 border rounded-lg">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Badge variant="secondary">{residency.phase}</Badge>
                                          <span className="text-sm font-medium">
                                            {residencyPartners.find(p => p.id === residency.company_id)?.name || 'Unknown Company'}
                                          </span>
                                        </div>
                                        {residency.description && (
                                          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {residency.description}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setNewResidency({
                                              phase: residency.phase,
                                              company_id: residency.company_id,
                                              user_id: residency.user_id,
                                              description: residency.description
                                            });
                                            setEditingResidency(residency.id);
                                          }}
                                        >
                                          Edit
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => handleDeleteResidency(residency.id)}
                                        >
                                          Delete
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add new residency form */}
                            {editingResidency && newResidency && (
                              <div className="p-3 border rounded-lg space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-xs opacity-70">Phase</label>
                                    <Select 
                                      value={newResidency.phase} 
                                      onValueChange={(value) => setNewResidency(prev => prev ? { ...prev, phase: value as ResidencyPhase } : null)}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select phase" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {getAvailablePhases(formData.msc).map((phase) => (
                                          <SelectItem key={phase} value={phase}>
                                            {phase}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <label className="text-xs opacity-70">Company</label>
                                    <Select 
                                      value={newResidency.company_id} 
                                      onValueChange={(value) => setNewResidency(prev => prev ? { ...prev, company_id: value } : null)}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select company" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {residencyPartners.map((partner) => (
                                          <SelectItem key={partner.id} value={partner.id}>
                                            {partner.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs opacity-70">Description (Markdown supported)</label>
                                  <Textarea 
                                    value={newResidency.description || ''} 
                                    onChange={(e) => setNewResidency(prev => prev ? { ...prev, description: e.target.value } : null)}
                                    placeholder="Describe your residency experience..."
                                    rows={4}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    onClick={() => newResidency && handleSaveResidency(newResidency)}
                                    disabled={!newResidency.company_id}
                                  >
                                    Save
                                  </Button>
                                  <Button variant="outline" onClick={handleCancelResidency}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Add new residency button */}
                            {!editingResidency && (
                              <Button 
                                onClick={handleAddResidency}
                                variant="outline"
                                className="w-full"
                              >
                                Add Residency
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="flex flex-col md:flex-row md:justify-end gap-2">
                <Button onClick={handleSaveProfile} disabled={saving} className="w-full md:w-auto border-2 border-foreground shadow-none">
                {saving ? 'Saving…' : 'Save Profile'}
                </Button>
                <Button 
                variant="outline" 
                onClick={handleForgotPassword}
                className="w-full md:w-auto border-2 border-orange-500 text-orange-500 hover:bg-orange-50 shadow-none"
                >
                Forgot Password
                </Button>
                {profile && (
                  <Button 
                      variant="outline" 
                      onClick={() => navigate(`/profile/${profile.id}`)}
                      className="w-full md:w-auto border-2 border-foreground shadow-none"
                    >
                      See Profile
                    </Button>
                  )}
                </div>
             </div>
           )}
         </CardContent>
       </Card>

       {/* Profile Completion Guide */}
       {!isComplete && profile && (
         <Card className="border-2 border-foreground shadow-none">
           <CardHeader>
             <CardTitle className="tracking-tight">Complete Your Profile</CardTitle>
             <CardDescription>
               Add these details to complete your profile ({profileCompletion}% complete)
             </CardDescription>
           </CardHeader>
           <CardContent>
             <div className="space-y-3">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                 <div className={`p-3 rounded-lg border ${profile.full_name ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                   <div className="flex items-center space-x-2">
                     <span className={`font-medium ${profile.full_name ? 'text-green-700' : 'text-red-700'}`}>
                       Full Name
                     </span>
                     {profile.full_name ? (
                       <span className="text-green-600">✓</span>
                     ) : (
                       <span className="text-red-600">✗</span>
                     )}
                   </div>
                 </div>
                 
                 <div className={`p-3 rounded-lg border ${profile.bio ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                   <div className="flex items-center space-x-2">
                     <span className={`font-medium ${profile.bio ? 'text-green-700' : 'text-red-700'}`}>
                       Bio
                     </span>
                     {profile.bio ? (
                       <span className="text-green-600">✓</span>
                     ) : (
                       <span className="text-red-600">✗</span>
                     )}
                   </div>
                 </div>
                 
                 <div className={`p-3 rounded-lg border ${profile.company ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                   <div className="flex items-center space-x-2">
                     <span className={`font-medium ${profile.company ? 'text-green-700' : 'text-red-700'}`}>
                       Company
                     </span>
                     {profile.company ? (
                       <span className="text-green-600">✓</span>
                     ) : (
                       <span className="text-red-600">✗</span>
                     )}
                   </div>
                 </div>
                 
                 <div className={`p-3 rounded-lg border ${profile.job_title ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                   <div className="flex items-center space-x-2">
                     <span className={`font-medium ${profile.job_title ? 'text-green-700' : 'text-red-700'}`}>
                       Job Title
                     </span>
                     {profile.job_title ? (
                       <span className="text-green-600">✓</span>
                     ) : (
                       <span className="text-red-600">✗</span>
                     )}
                   </div>
                 </div>
               </div>
               
               <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                 <p className="text-sm text-blue-700">
                   <strong>Why complete your profile?</strong>
                 </p>
                 <ul className="text-sm text-blue-600 mt-2 space-y-1 list-disc list-inside">
                   <li>Help other alumni find and connect with you</li>
                   <li>Show up in directory searches</li>
                   <li>Increase networking opportunities</li>
                   <li>Stay updated with ISE community news</li>
                 </ul>
               </div>
             </div>
           </CardContent>
         </Card>
       )}
     </>
   );
 };

export default Index;
