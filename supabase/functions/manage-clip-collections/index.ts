import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Manage Clip Collections
 * 
 * Provides CRUD operations for organizing clips into collections/folders.
 * 
 * Operations:
 * - create_collection: Create new collection
 * - update_collection: Rename/update collection
 * - delete_collection: Remove collection (clips become unsorted)
 * - move_clip: Move clip to a collection
 * - list_collections: Get user's collections
 */

interface CreateCollectionRequest {
  operation: 'create_collection';
  name: string;
  description?: string;
}

interface UpdateCollectionRequest {
  operation: 'update_collection';
  collectionId: string;
  name?: string;
  description?: string;
}

interface DeleteCollectionRequest {
  operation: 'delete_collection';
  collectionId: string;
}

interface MoveClipRequest {
  operation: 'move_clip';
  clipId: string;
  collectionId: string | null; // null = move to unsorted
}

interface ListCollectionsRequest {
  operation: 'list_collections';
}

type RequestData = 
  | CreateCollectionRequest 
  | UpdateCollectionRequest 
  | DeleteCollectionRequest 
  | MoveClipRequest 
  | ListCollectionsRequest;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== MANAGE CLIP COLLECTIONS ===");

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Not authenticated");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("User authentication failed");
    }

    const requestData: RequestData = await req.json();
    const { operation } = requestData;

    console.log(`Operation: ${operation}`);

    // Route to appropriate handler
    switch (operation) {
      case 'create_collection': {
        const { name, description } = requestData;
        
        if (!name || name.trim().length === 0) {
          throw new Error("Collection name is required");
        }

        const { data: collection, error } = await supabase
          .from('clip_collections')
          .insert({
            user_id: user.id,
            name: name.trim(),
            description: description?.trim() || null,
          })
          .select()
          .single();

        if (error) throw error;

        console.log(`✓ Collection created: ${collection.id}`);

        return new Response(
          JSON.stringify({
            success: true,
            collection,
            message: "Collection created successfully",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'update_collection': {
        const { collectionId, name, description } = requestData;

        if (!collectionId) {
          throw new Error("Collection ID is required");
        }

        const updates: any = {};
        if (name !== undefined) updates.name = name.trim();
        if (description !== undefined) updates.description = description?.trim() || null;
        updates.updated_at = new Date().toISOString();

        const { data: collection, error } = await supabase
          .from('clip_collections')
          .update(updates)
          .eq('id', collectionId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        console.log(`✓ Collection updated: ${collectionId}`);

        return new Response(
          JSON.stringify({
            success: true,
            collection,
            message: "Collection updated successfully",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'delete_collection': {
        const { collectionId } = requestData;

        if (!collectionId) {
          throw new Error("Collection ID is required");
        }

        // First, set all clips in this collection to unsorted (collection_id = null)
        const { error: updateError } = await supabase
          .from('clips')
          .update({ collection_id: null })
          .eq('collection_id', collectionId)
          .eq('user_id', user.id);

        if (updateError) {
          console.error("Error unsetting clips:", updateError);
          throw updateError;
        }

        // Now delete the collection
        const { error: deleteError } = await supabase
          .from('clip_collections')
          .delete()
          .eq('id', collectionId)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;

        console.log(`✓ Collection deleted: ${collectionId}`);

        return new Response(
          JSON.stringify({
            success: true,
            message: "Collection deleted successfully (clips moved to unsorted)",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'move_clip': {
        const { clipId, collectionId } = requestData;

        if (!clipId) {
          throw new Error("Clip ID is required");
        }

        // Verify clip belongs to user
        const { data: clip, error: clipError } = await supabase
          .from('clips')
          .select('id')
          .eq('id', clipId)
          .eq('user_id', user.id)
          .single();

        if (clipError || !clip) {
          throw new Error("Clip not found or access denied");
        }

        // If collectionId provided, verify it belongs to user
        if (collectionId) {
          const { data: collection, error: collectionError } = await supabase
            .from('clip_collections')
            .select('id')
            .eq('id', collectionId)
            .eq('user_id', user.id)
            .single();

          if (collectionError || !collection) {
            throw new Error("Collection not found or access denied");
          }
        }

        // Move clip
        const { data: updatedClip, error: updateError } = await supabase
          .from('clips')
          .update({ collection_id: collectionId })
          .eq('id', clipId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (updateError) throw updateError;

        console.log(`✓ Clip moved: ${clipId} → ${collectionId || 'unsorted'}`);

        return new Response(
          JSON.stringify({
            success: true,
            clip: updatedClip,
            message: collectionId ? "Clip moved to collection" : "Clip moved to unsorted",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'list_collections': {
        const { data: collections, error } = await supabase
          .from('clip_collections')
          .select(`
            id,
            name,
            description,
            created_at,
            updated_at
          `)
          .eq('user_id', user.id)
          .order('name', { ascending: true });

        if (error) throw error;

        // Get clip counts for each collection
        const collectionsWithCounts = await Promise.all(
          collections.map(async (collection) => {
            const { count } = await supabase
              .from('clips')
              .select('id', { count: 'exact', head: true })
              .eq('collection_id', collection.id)
              .eq('user_id', user.id);

            return {
              ...collection,
              clip_count: count || 0,
            };
          })
        );

        // Get unsorted clip count
        const { count: unsortedCount } = await supabase
          .from('clips')
          .select('id', { count: 'exact', head: true })
          .is('collection_id', null)
          .eq('user_id', user.id);

        console.log(`✓ Listed ${collections.length} collections`);

        return new Response(
          JSON.stringify({
            success: true,
            collections: collectionsWithCounts,
            unsorted_count: unsortedCount || 0,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
