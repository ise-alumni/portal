import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import { createTag, updateTag, deleteTag } from '@/lib/domain';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface DashboardTagsTabProps {
  tags: Tag[];
  tagsLoading: boolean;
  newTag: { name: string; color: string };
  setNewTag: (tag: { name: string; color: string }) => void;
  setTags: (tags: Tag[]) => void;
}

export const DashboardTagsTab = memo(function DashboardTagsTab({
  tags,
  tagsLoading,
  newTag,
  setNewTag,
  setTags,
}: DashboardTagsTabProps) {
  const handleCreateTag = async () => {
    if (!newTag.name.trim()) return;
    
    const createdTag = await createTag(newTag.name, newTag.color);
    if (createdTag) {
      setTags([...tags, createdTag]);
      setNewTag({ name: '', color: '#3B82F6' });
    }
  };

  const handleUpdateTag = async (tag: Tag) => {
    const newName = prompt('Edit tag name:', tag.name);
    if (newName && newName.trim()) {
      const updatedTag = await updateTag(tag.id, newName.trim(), tag.color);
      if (updatedTag) {
        setTags(tags.map(t => t.id === tag.id ? updatedTag : t));
      }
    }
  };

  const handleDeleteTag = async (tag: Tag) => {
    if (confirm(`Are you sure you want to delete tag "${tag.name}"?`)) {
      const deleted = await deleteTag(tag.id);
      if (deleted) {
        setTags(tags.filter(t => t.id !== tag.id));
      }
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tag Management</CardTitle>
              <CardDescription>
                Create and manage tags for events and announcements
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Input
                placeholder="New tag name..."
                value={newTag.name}
                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                className="w-48"
              />
              <Input
                type="color"
                value={newTag.color}
                onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                className="w-20 h-9"
              />
              <Button 
                size="sm" 
                onClick={handleCreateTag}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Tag
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tagsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Color</th>
                    <th className="text-left p-2 font-medium">Name</th>
                    <th className="text-left p-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tags.map((tag) => (
                    <tr key={tag.id} className="border-b">
                      <td className="p-2">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="text-sm font-mono">{tag.color}</span>
                        </div>
                      </td>
                      <td className="p-2">
                        <span className="font-medium">{tag.name}</span>
                      </td>
                      <td className="p-2">
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleUpdateTag(tag)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteTag(tag)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

