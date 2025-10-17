import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Github, Linkedin, Twitter, ExternalLink } from "lucide-react";

type Profile = Tables<"profiles">;

const Directory = () => {
  const [nameQuery, setNameQuery] = useState("");
  const [companyQuery, setCompanyQuery] = useState("");
  const [cohortQuery, setCohortQuery] = useState("");
  const [debouncedName, setDebouncedName] = useState("");
  const [debouncedCompany, setDebouncedCompany] = useState("");
  const [debouncedCohort, setDebouncedCohort] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSearching = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce the queries to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedName(nameQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [nameQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCompany(companyQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [companyQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCohort(cohortQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [cohortQuery]);

  // Perform search when any debounced query changes
  useEffect(() => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const performSearch = async () => {
      if (isSearching.current) return;
      isSearching.current = true;
      setLoading(true);
      setError(null);

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      try {
        let queryBuilder = supabase
          .from("profiles")
          .select("id, created_at, updated_at, user_id, full_name, email, city, country, graduation_year, job_title, company, bio, github_url, linkedin_url, twitter_url, website_url, avatar_url, email_visible, msc, admin, is_public, user_type")
          .eq("is_public", true)
          .limit(50)
          .abortSignal(signal);

        if (debouncedName.trim()) {
          queryBuilder = queryBuilder.ilike("full_name", `%${debouncedName}%`);
        }
        if (debouncedCompany.trim()) {
          queryBuilder = queryBuilder.ilike("company", `%${debouncedCompany}%`);
        }
        if (debouncedCohort.trim()) {
          queryBuilder = queryBuilder.ilike("cohort", `%${debouncedCohort}%`);
        }

        const { data, error } = await queryBuilder;

        if (signal.aborted) return; // Ignore if aborted

        if (error) throw error;
        setResults(data as any || []);
      } catch (err) {
        if (signal.aborted) return; // Ignore aborted requests
        console.error("Search error:", err);
        setError("Search failed. Please try again.");
        setResults([]);
      } finally {
        setLoading(false);
        isSearching.current = false;
      }
    };

    performSearch();

    // Cleanup on unmount or dependency change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedName, debouncedCompany, debouncedCohort]);



  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-[#0C314C]">Alumni Directory</h1>
      <p className="text-muted-foreground mb-8">
        Search for users by name, company, or cohort. Only public profiles are shown.
      </p>

       <div className="mb-6">
         <div className="grid gap-4 md:grid-cols-3">
           <Input
             placeholder="Search by name..."
             value={nameQuery}
             onChange={(e) => setNameQuery(e.target.value)}
           />
           <Input
             placeholder="Search by company..."
             value={companyQuery}
             onChange={(e) => setCompanyQuery(e.target.value)}
           />
           <Input
             placeholder="Search by cohort..."
             value={cohortQuery}
             onChange={(e) => setCohortQuery(e.target.value)}
           />
         </div>
       </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {results.map((profile) => (
          <Card key={profile.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                {profile.avatar_url && (
                  <img
                    src={profile.avatar_url}
                    alt={`${profile.full_name || "User"} avatar`}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div>
                   <CardTitle className="flex items-center gap-2">
                     {profile.full_name || "Anonymous"}
                     {profile.graduation_year && (
                       <Badge variant="secondary">{profile.graduation_year}</Badge>
                     )}
                     {profile.msc && (
                       <Badge variant="outline">MSc</Badge>
                     )}
                     {profile.user_type && profile.user_type !== 'Staff' && (
                       <Badge variant={profile.user_type === 'Admin' ? 'destructive' : 'default'}>{profile.user_type}</Badge>
                     )}
                   </CardTitle>
                </div>
              </div>
              <CardDescription>
                {profile.job_title && <div>{profile.job_title}</div>}
                {profile.company && <div>{profile.company}</div>}
                {(profile.city || profile.country) && (
                  <div>
                    {profile.city && `${profile.city}, `}
                    {profile.country}
                  </div>
                )}
                {profile.email_visible && profile.email && <div>{profile.email}</div>}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile.bio && <p className="text-sm mb-3">{profile.bio}</p>}
              {(profile.github_url || profile.linkedin_url || profile.twitter_url || profile.website_url) && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {profile.github_url && (
                    <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      <Github className="h-3 w-3" />
                      GitHub
                    </a>
                  )}
                  {profile.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      <Linkedin className="h-3 w-3" />
                      LinkedIn
                    </a>
                  )}
                  {profile.twitter_url && (
                    <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      <Twitter className="h-3 w-3" />
                      Twitter
                    </a>
                  )}
                  {profile.website_url && (
                    <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      <ExternalLink className="h-3 w-3" />
                      Website
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

       {loading && (
         <p className="text-center text-muted-foreground">Searching...</p>
       )}
       {error && (
         <p className="text-center text-red-500">{error}</p>
       )}
       {results.length === 0 && !loading && !error && (
         <p className="text-center text-muted-foreground">No alumni found.</p>
       )}
    </div>
  );
};

export default Directory;