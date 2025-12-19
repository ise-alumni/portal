import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Building, Plus, Edit, Trash2 } from 'lucide-react';
import { type ResidencyPartner, type ResidencyStats } from '@/lib/types/residency';
import { filterData, paginateData, type FilterOptions, type PaginationOptions } from '@/lib/utils/data';

interface DashboardResidencyTabProps {
  residencyPartners: ResidencyPartner[];
  residencyStats: ResidencyStats | null;
  residencyFilter: FilterOptions;
  residencyPagination: PaginationOptions;
  setResidencyFilter: (filter: FilterOptions) => void;
  setResidencyPagination: (pagination: PaginationOptions) => void;
  handleCreatePartner: () => Promise<void>;
  handleUpdatePartner: () => Promise<void>;
  handleDeletePartner: (partnerId: string) => Promise<void>;
  openEditModal: (partner: ResidencyPartner) => void;
  residencyLoading: boolean;
  isCreatePartnerModalOpen: boolean;
  setIsCreatePartnerModalOpen: (open: boolean) => void;
  isEditPartnerModalOpen: boolean;
  setIsEditPartnerModalOpen: (open: boolean) => void;
  selectedPartner: ResidencyPartner | null;
  partnerForm: {
    name: string;
    website: string;
    logo_url: string;
    description: string;
    is_active: boolean;
  };
  setPartnerForm: (form: DashboardResidencyTabProps['partnerForm']) => void;
}

export const DashboardResidencyTab = memo(function DashboardResidencyTab({
  residencyPartners,
  residencyStats,
  residencyFilter,
  residencyPagination,
  setResidencyFilter,
  setResidencyPagination,
  handleCreatePartner,
  handleUpdatePartner,
  handleDeletePartner,
  openEditModal,
  residencyLoading,
  isCreatePartnerModalOpen,
  setIsCreatePartnerModalOpen,
  isEditPartnerModalOpen,
  setIsEditPartnerModalOpen,
  selectedPartner,
  partnerForm,
  setPartnerForm,
}: DashboardResidencyTabProps) {
  // Get partner stats from residencyStats
  const partnersWithStats = residencyPartners.map(partner => {
    const partnerStat = residencyStats?.partners.find(p => p.name === partner.name);
    return {
      ...partner,
      bscCount: partnerStat?.bscCount || 0,
      mscCount: partnerStat?.mscCount || 0,
      totalCount: partnerStat?.count || 0
    };
  });
  
  const filteredPartners = filterData(partnersWithStats, residencyFilter, ['name', 'website', 'description']);
  const sortedPartners = filteredPartners.sort((a, b) => b.totalCount - a.totalCount);
  const paginatedPartners = paginateData(sortedPartners, residencyPagination);
  const totalPages = Math.ceil(filteredPartners.length / residencyPagination.limit);

  return (
    <div className="space-y-4">
      {/* Residency Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Residency Partner</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {residencyLoading ? '--' : residencyStats?.atResidencyPartner || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {residencyLoading ? 'Loading...' : `${residencyStats?.residencyPercentage || 0}% of total`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not at Partner</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {residencyLoading ? '--' : residencyStats?.notAtResidencyPartner || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {residencyLoading ? '--' : residencyPartners.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Residency partners
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Residency Partners Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Residency Partners</CardTitle>
              <CardDescription>
                Manage residency partner organizations
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Input
                placeholder="Search partners..."
                value={residencyFilter.search || ''}
                onChange={(e) => setResidencyFilter({ ...residencyFilter, search: e.target.value })}
                className="w-64"
              />
              <Dialog open={isCreatePartnerModalOpen} onOpenChange={setIsCreatePartnerModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Partner
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create Residency Partner</DialogTitle>
                    <DialogDescription>
                      Add a new residency partner organization to the system.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={partnerForm.name}
                        onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                        placeholder="Enter partner name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={partnerForm.website}
                        onChange={(e) => setPartnerForm({ ...partnerForm, website: e.target.value })}
                        placeholder="https://example.com"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="logo_url">Logo URL</Label>
                      <Input
                        id="logo_url"
                        type="url"
                        value={partnerForm.logo_url}
                        onChange={(e) => setPartnerForm({ ...partnerForm, logo_url: e.target.value })}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={partnerForm.description}
                        onChange={(e) => setPartnerForm({ ...partnerForm, description: e.target.value })}
                        placeholder="Brief description of the partner organization"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={partnerForm.is_active}
                        onCheckedChange={(checked) => setPartnerForm({ ...partnerForm, is_active: checked })}
                      />
                      <Label htmlFor="is_active">Active</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" onClick={handleCreatePartner}>
                      Create Partner
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {residencyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedPartners.data.map((partner) => (
                <div key={partner.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {partner.logo_url && (
                      <img 
                        src={partner.logo_url} 
                        alt={partner.name}
                        className="w-8 h-8 rounded"
                      />
                    )}
                    <div>
                      <p className="font-medium">{partner.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {partner.website ? (
                          <a 
                            href={partner.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {partner.website}
                          </a>
                        ) : (
                          'No website'
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {partner.bscCount > 0 && (
                      <Badge variant="outline" className="text-xs">
                        BSC: {partner.bscCount}
                      </Badge>
                    )}
                    {partner.mscCount > 0 && (
                      <Badge variant="outline" className="text-xs">
                        MSC: {partner.mscCount}
                      </Badge>
                    )}
                    <Badge variant={partner.is_active ? "default" : "secondary"}>
                      {partner.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openEditModal(partner)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeletePartner(partner.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {/* Pagination */}
              {filteredPartners.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {residencyPagination.page} of {totalPages} pages
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setResidencyPagination({ ...residencyPagination, page: Math.max(1, residencyPagination.page - 1) })}
                      disabled={residencyPagination.page <= 1}
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setResidencyPagination({ ...residencyPagination, page: residencyPagination.page + 1 })}
                      disabled={residencyPagination.page >= totalPages}
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

      {/* Edit Partner Modal */}
      <Dialog open={isEditPartnerModalOpen} onOpenChange={setIsEditPartnerModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Residency Partner</DialogTitle>
            <DialogDescription>
              Update the residency partner information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={partnerForm.name}
                onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                placeholder="Enter partner name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-website">Website</Label>
              <Input
                id="edit-website"
                type="url"
                value={partnerForm.website}
                onChange={(e) => setPartnerForm({ ...partnerForm, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-logo_url">Logo URL</Label>
              <Input
                id="edit-logo_url"
                type="url"
                value={partnerForm.logo_url}
                onChange={(e) => setPartnerForm({ ...partnerForm, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={partnerForm.description}
                onChange={(e) => setPartnerForm({ ...partnerForm, description: e.target.value })}
                placeholder="Brief description of the partner organization"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is_active"
                checked={partnerForm.is_active}
                onCheckedChange={(checked) => setPartnerForm({ ...partnerForm, is_active: checked })}
              />
              <Label htmlFor="edit-is_active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleUpdatePartner}>
              Update Partner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

