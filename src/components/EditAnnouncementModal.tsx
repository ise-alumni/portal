import { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogHeader, DialogContent, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileTextIcon, EyeIcon, EditIcon, Loader2Icon, ImageIcon, ExternalLinkIcon, CalendarIcon, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { log } from '@/lib/utils/logger';
import { getEventTagOptions } from '@/lib/constants';
import type { Database } from '@/integrations/supabase/types';

/* eslint-disable @typescript-eslint/no-explicit-any */



interface Announcement {
  id: string;
  title: string;
  content: string | null;
  external_url: string | null;
  deadline: string | null;
  image_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  slug: string | null;
  tags?: Array<{ id: string; name: string; color: string }>;
}

interface EditAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    content: string | null;
    external_url: string | null;
    deadline: string | null;
    image_url: string | null;
    tag_ids: string[];
  }) => void;
  onDelete?: () => void;
  announcement: Announcement | null;
}

const EditAnnouncementModal = ({ isOpen, onClose, onSubmit, onDelete, announcement }: EditAnnouncementModalProps) => {
  const [content, setContent] = useState<string>("");
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [deadline, setDeadline] = useState<string>("");
  const [externalUrl, setExternalUrl] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const { user } = useAuth();

  // Initialize form with announcement data when modal opens
  useEffect(() => {
    if (announcement && isOpen) {
      setTitle(announcement.title);
      setContent(announcement.content || "");
      setSelectedTags(announcement.tags?.map(tag => tag.name) || []);
      setDeadline(announcement.deadline || "");
      setExternalUrl(announcement.external_url || "");
      setImageUrl(announcement.image_url || "");
    }
  }, [announcement, isOpen]);

  const handleUpdate = async () => {
    if (!announcement) return;

    if (!title) {
      setError("Please fill in announcement title");
      return;
    }

    if (!user) {
      setError("You must be logged in to update content");
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);

      // Convert selected tag names to UUIDs first
      const tagIds: string[] = [];
      
      for (const tagName of selectedTags) {
        // Find existing tag
        const { data: existingTag } = await supabase
          .from('tags')
          .select('id')
          .eq('name', tagName)
          .single();

        if (existingTag && (existingTag as { id: string }).id) {
          tagIds.push((existingTag as { id: string }).id);
        } else {
          log.error('Tag not found in database:', tagName);
        }
      }

      const data = {
        title: title,
        content: content || null,
        external_url: externalUrl || null,
        deadline: deadline || null,
        image_url: imageUrl || null,
        tag_ids: tagIds,
      };

      const { error: updateError } = await (supabase as any)
        .from('announcements')
        .update({
          title: title,
          content: content || null,
          external_url: externalUrl || null,
          deadline: deadline || null,
          image_url: imageUrl || null,
        })
        .eq('id', announcement.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }
      
      // Update tag associations
      if (tagIds.length > 0) {
        // First delete existing tag associations
        const { error: deleteError } = await (supabase as any)
          .from('announcement_tags')
          .delete()
          .eq('announcement_id', announcement.id);

        if (deleteError) {
          throw deleteError;
        }

        // Then insert new tag associations
        const tagRelations = tagIds.map(tagId => ({
          announcement_id: announcement.id,
          tag_id: tagId
        }));
        
        const { error: tagInsertError } = await (supabase as any)
          .from('announcement_tags')
          .insert(tagRelations);

        if (tagInsertError) {
          throw tagInsertError;
        }
      }
      
      onSubmit(data);
      onClose();
    } catch (err) {
      log.error("Error updating announcement:", err);
      setError(err instanceof Error ? err.message : "Failed to update announcement");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!announcement || !onDelete) return;

    if (!confirm("Are you sure you want to delete this announcement? This action cannot be undone.")) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);

      const { error: deleteError } = await (supabase
        .from('announcements') as any)
        .delete()
        .eq('id', announcement.id);

      if (deleteError) {
        throw deleteError;
      }
      
      onDelete();
      onClose();
    } catch (err) {
      log.error("Error deleting announcement:", err);
      setError(err instanceof Error ? err.message : "Failed to delete announcement");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Edit Announcement
          </DialogTitle>
          <DialogDescription>
            Update the announcement details below
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Title - Full Width */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">Announcement Title *</Label>
            <Input
              id="title"
              placeholder="e.g., New Job Opportunity"
              className="w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUpdating || isDeleting}
            />
          </div>

          {/* Tag Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              Tags
            </Label>
            <div className="space-y-2">
              {/* Available tags */}
              <div className="flex flex-wrap gap-2">
                {getEventTagOptions().map((tag) => {
                  const isSelected = selectedTags.includes(tag.value);
                  return (
                    <button
                      key={tag.value}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTags(selectedTags.filter(t => t !== tag.value));
                        } else {
                          setSelectedTags([...selectedTags, tag.value]);
                        }
                      }}
                      disabled={isUpdating || isDeleting}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        isSelected
                          ? 'text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      style={{
                        backgroundColor: isSelected ? tag.color : undefined,
                      }}
                    >
                      {tag.label}
                      {isSelected && (
                        <X className="w-3 h-3 ml-1 inline" />
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedTags.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Select tags to categorize this announcement
                </p>
              )}
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label htmlFor="deadline" className="text-sm font-medium flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Deadline (Optional)
            </Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              disabled={isUpdating || isDeleting}
            />
          </div>

          {/* External URL */}
          <div className="space-y-2">
            <Label htmlFor="external-url" className="text-sm font-medium flex items-center gap-2">
              <ExternalLinkIcon className="w-4 h-4" />
              External URL (Optional)
            </Label>
            <Input
              id="external-url"
              type="url"
              placeholder="https://example.com/more-info"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              disabled={isUpdating || isDeleting}
            />
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="image-url" className="text-sm font-medium flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Image URL (Optional)
            </Label>
            <Input
              id="image-url"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={isUpdating || isDeleting}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use a random placeholder image
            </p>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content" className="text-sm font-medium flex items-center gap-2">
                <FileTextIcon className="w-4 h-4" />
                Content (Markdown supported)
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2"
                disabled={isUpdating || isDeleting}
              >
                {showPreview ? (
                  <>
                    <EditIcon className="w-3 h-3" />
                    Edit
                  </>
                ) : (
                  <>
                    <EyeIcon className="w-3 h-3" />
                    Preview
                  </>
                )}
              </Button>
            </div>

            {showPreview ? (
              <div className="min-h-[100px] p-3 border rounded-md bg-muted/50">
                {content ? (
                  <div className="text-sm leading-relaxed prose prose-sm max-w-none">
                    <ReactMarkdown>{content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No content entered yet. Click "Edit" to add content.
                  </p>
                )}
              </div>
            ) : (
              <Textarea
                id="content"
                placeholder="Add announcement details... You can use Markdown formatting like **bold**, *italic*, [links](https://example.com), etc."
                className="min-h-[100px] resize-none"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isUpdating || isDeleting}
              />
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between gap-3 pt-4 border-t">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isUpdating || isDeleting}
            >
              Cancel
            </Button>
            {onDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isUpdating || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Announcement"
                )}
              </Button>
            )}
          </div>
          <Button
            className="bg-primary text-primary-foreground"
            onClick={handleUpdate}
            disabled={isUpdating || isDeleting}
          >
            {isUpdating ? (
              <>
                <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Announcement"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditAnnouncementModal;