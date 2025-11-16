import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Github, Linkedin, Twitter, ExternalLink, Search } from "lucide-react";

type Profile = Tables<"profiles">;

const Directory = () => {
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Helper function to convert cohort number to readable label
  const getCohortLabel = (cohort: number | null) => {
    if (!cohort) return null;
    return `Cohort ${cohort}`;
  };

  // Load all profiles on mount
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("is_public", true)
          .order("user_type, cohort, graduation_year, full_name");

        if (error) throw error;

        setAllProfiles(data || []);
        setFilteredProfiles(data || []);
      } catch (err) {
        console.error("Error loading profiles:", err);
        setError("Failed to load alumni profiles. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadProfiles();
  }, []);

  // Filter profiles when search term changes
  useEffect(() => {
    const filtered = allProfiles.filter((profile) => {
      const searchLower = searchTerm.toLowerCase();

      return (
        profile.full_name?.toLowerCase().includes(searchLower) ||
        profile.company?.toLowerCase().includes(searchLower) ||
        getCohortLabel(profile.cohort)?.toLowerCase().includes(searchLower) ||
        profile.job_title?.toLowerCase().includes(searchLower) ||
        profile.city?.toLowerCase().includes(searchLower) ||
        profile.country?.toLowerCase().includes(searchLower)
      );
    });

    setFilteredProfiles(filtered);
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchTerm, allProfiles]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProfiles = filteredProfiles.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-[#0C314C]">
          Alumni Directory
        </h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading alumni profiles...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-[#0C314C]">
          Alumni Directory
        </h1>
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-0 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-[#0C314C]">
        Alumni Directory
      </h1>

      <p className="text-muted-foreground mb-6">
        Browse and search through our alumni community. Only public profiles are
        shown.
      </p>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search by name, company, cohort, job title, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Results count */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Showing {Math.min(itemsPerPage, filteredProfiles.length - startIndex + 1)} of {filteredProfiles.length} alumni {searchTerm && `matching "${searchTerm}"`}
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="ml-2 text-primary hover:underline"
            >
              Clear
            </button>
          )}
        </p>
      </div>

      {/* Profiles Grid */}
      {filteredProfiles.length > 0 ? (
        <>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paginatedProfiles.map((profile) => (
            <Card key={profile.id} className="h-full hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  {profile.avatar_url && (
                    <img
                      src={profile.avatar_url}
                      alt={`${profile.full_name || "User"} avatar`}
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base sm:text-lg mb-2 leading-tight">
                      {profile.full_name || "Anonymous"}
                    </CardTitle>

                    <div className="flex flex-wrap gap-1 mb-2">
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
                      {profile.cohort && (
                        <Badge variant="secondary" className="text-xs">
                          {getCohortLabel(profile.cohort)}
                        </Badge>
                      )}
                      {profile.msc ? (
                        <Badge variant="outline" className="text-xs">
                          MSc
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          BSc
                        </Badge>
                      )}
                      {profile.graduation_year && (
                        <Badge variant="secondary" className="text-xs">
                          {profile.graduation_year}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <CardDescription className="space-y-1">
                  {profile.job_title && (
                    <div className="font-medium">{profile.job_title}</div>
                  )}
                  {profile.company && <div>{profile.company}</div>}
                  {(profile.city || profile.country) && (
                    <div className="text-sm">
                      {[profile.city, profile.country]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  )}
                  {profile.email_visible && profile.email && (
                    <div className="text-sm">{profile.email}</div>
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                {profile.bio && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {profile.bio}
                  </p>
                )}

                {/* Social Links */}
                {(profile.github_url ||
                  profile.linkedin_url ||
                  profile.twitter_url ||
                  profile.website_url) && (
                  <div className="flex flex-wrap gap-3">
                    {profile.github_url && (
                      <a
                        href={profile.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Github className="h-4 w-4" />
                        <span>GitHub</span>
                      </a>
                    )}
                    {profile.linkedin_url && (
                      <a
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Linkedin className="h-4 w-4" />
                        <span>LinkedIn</span>
                      </a>
                    )}
                    {profile.twitter_url && (
                      <a
                        href={profile.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Twitter className="h-4 w-4" />
                        <span>Twitter</span>
                      </a>
                    )}
                    {profile.website_url && (
                      <a
                        href={profile.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Website</span>
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value={6}>6</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {searchTerm
              ? `No alumni found matching "${searchTerm}"`
              : "No public alumni profiles found"}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-primary hover:underline"
            >
              Clear search to see all alumni
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Directory;
