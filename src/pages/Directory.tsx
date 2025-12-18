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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Github, Linkedin, Twitter, ExternalLink, Search, ChevronRight } from "lucide-react";
import { Profile, ProfessionalStatus } from "@/lib/types";
import { getProfiles, searchProfiles } from '@/lib/domain/profiles';
import { filterProfiles, sortProfiles, paginateData, type FilterOptions, type SortOption } from '@/lib/utils/data';
import { getCohortLabel, getCohortBadgeClass } from '@/lib/utils/ui';
import { log } from '@/lib/utils/logger';
import { getUserTypesSync } from '@/lib/constants';
import { useNavigate } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import { getResidencyPartners } from '@/lib/domain/residency';
import { buildCompanyLogoMap, getCompanyLogoUrl } from '@/lib/utils/companyLogo';
import { CompanyLogo } from '@/components/CompanyLogo';

const Directory = () => {
  const { user } = useAuth();
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [professionalStatusFilter, setProfessionalStatusFilter] = useState<ProfessionalStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyLogoMap, setCompanyLogoMap] = useState<ReturnType<typeof buildCompanyLogoMap> | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Load all profiles on mount
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        setLoading(true);
        setError(null);

        const [profilesData, partners] = await Promise.all([
          getProfiles(),
          getResidencyPartners(),
        ]);

        setAllProfiles(profilesData);
        setFilteredProfiles(profilesData);

        if (partners && partners.length > 0) {
          setCompanyLogoMap(buildCompanyLogoMap(partners));
        }
      } catch (err) {
        log.error("Error loading profiles:", err);
        setError("Failed to load alumni profiles. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadProfiles();
  }, []);

  // Filter profiles when search term or professional status filter changes
  useEffect(() => {
    const filters: FilterOptions = {};
    
    // Add search filter if there's a search term
    if (searchTerm) {
      filters.search = searchTerm;
    }
    
    // Add professional status filter if not "all"
    if (professionalStatusFilter !== "all") {
      filters.professionalStatus = professionalStatusFilter;
    }
    
    const sortOption: SortOption = { field: 'full_name', direction: 'asc' };
    
    const filtered = filterProfiles(allProfiles, filters);
    const sorted = sortProfiles(filtered, sortOption);
    
    setFilteredProfiles(sorted);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, professionalStatusFilter, allProfiles]);

  // Pagination calculations
  const paginationResult = paginateData(filteredProfiles, {
    page: currentPage,
    limit: itemsPerPage
  });
  const paginatedProfiles = paginationResult.data;
  const totalPages = paginationResult.totalPages;
  const navigate = useNavigate();

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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by name, company, cohort, job title, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select 
            value={professionalStatusFilter} 
            onValueChange={(value) => setProfessionalStatusFilter(value as ProfessionalStatus | "all")}
          >
            <SelectTrigger className="w-48 h-12">
              <SelectValue placeholder="Professional Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="employed">Employed</SelectItem>
              <SelectItem value="entrepreneur">Entrepreneur</SelectItem>
              <SelectItem value="open_to_work">Open to Work</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Showing {Math.min(itemsPerPage, (paginationResult.page - 1) * paginationResult.limit + paginationResult.data.length)} of {paginationResult.total} alumni
          {(searchTerm || professionalStatusFilter !== "all") && (
            <>
              {" "}matching
              {searchTerm && ` "${searchTerm}"`}
              {searchTerm && professionalStatusFilter !== "all" && " and "}
              {professionalStatusFilter !== "all" && `professional status: ${professionalStatusFilter.replace('_', ' ')}`}
              <button
                onClick={() => {
                  setSearchTerm("");
                  setProfessionalStatusFilter("all");
                }}
                className="ml-2 text-primary hover:underline"
              >
                Clear filters
              </button>
            </>
          )}
        </p>
      </div>

      {/* Profiles Grid */}
      {filteredProfiles.length > 0 ? (
        <>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paginatedProfiles.map((profile) => (
            <Card key={profile.id} className="h-full hover:shadow-md transition-shadow relative group cursor-pointer" onClick={() => navigate(`/profile/${profile.id}`)}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
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
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getCohortBadgeClass(profile.cohort)}`}
                        >
                          {getCohortLabel(profile.cohort)}
                        </Badge>
                      )}
                      {profile.user_type !== "Staff" && (
                        profile.msc ? (
                          <Badge variant="default" className="text-xs">
                            MSc
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-xs text-slate-900 border-slate-900"
                          >
                            BSc
                          </Badge>
                        )
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
                  {profile.company && (
                    <div className="flex items-center gap-2">
                      {companyLogoMap ? (
                        <CompanyLogo
                          name={profile.company}
                          logoUrl={getCompanyLogoUrl(profile.company, companyLogoMap)}
                          size="sm"
                        />
                      ) : (
                        <span>{profile.company}</span>
                      )}
                    </div>
                  )}
                  {(profile.city || profile.country) && (
                    <div className="text-sm">
                      {[profile.city, profile.country]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  )}
                  {profile.email_visible && profile.email ? (
                    <div className="text-sm">{profile.email}</div>
                  ) : (
                    <div className="text-sm text-muted-foreground">(email hidden)</div>
                  )}
                </CardDescription>
                {user && user.id === profile.id && (
                  <div className="px-6 pb-6 pt-0">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate('/')}
                      className="mt-2 w-full"
                    >
                      Edit Profile
                    </Button>
                  </div>
                )}
              </CardHeader>

              <CardContent className="pt-0">

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
                        onClick={(e) => e.stopPropagation()}
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
                        onClick={(e) => e.stopPropagation()}
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
                        onClick={(e) => e.stopPropagation()}
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
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Website</span>
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
              

<div className="group">
  <div
    className="
      absolute inset-y-0 right-0 w-[10%]
      bg-white
      group-hover:bg-foreground
      transition-colors duration-200
      flex items-center justify-center
      pointer-events-none
    "
  >
    <div
      className="
        p-1
        text-black
        group-hover:text-white
        transition-colors duration-200
      "
    >
      <ChevronRight className="h-4 w-4" />
    </div>
  </div>
</div>
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
