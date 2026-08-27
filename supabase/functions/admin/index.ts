import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminPassword = Deno.env.get("ADMIN_PASSWORD") || "pujwa";

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Parse JSON body for all requests
    let body: { action?: string; password?: string; video?: Record<string, unknown>; id?: string } = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is OK for GET-style requests
    }

    const { action, password, video, id } = body;

    // List videos — public, no auth needed
    if (action === "list" || req.method === "GET" || !action) {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // All other actions require admin authentication
    if (password !== adminPassword) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: invalid admin password" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify password
    if (action === "verify") {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create video
    if (action === "create" && video) {
      const { data, error } = await supabase
        .from("videos")
        .insert({
          title: video.title,
          description: video.description || "",
          thumbnail_url: video.thumbnail_url || "",
          video_url: video.video_url,
          duration: video.duration || "",
          category: video.category || "Movies",
          is_featured: Boolean(video.is_featured),
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update video
    if (action === "update" && video && id) {
      const { data, error } = await supabase
        .from("videos")
        .update({
          title: video.title,
          description: video.description || "",
          thumbnail_url: video.thumbnail_url || "",
          video_url: video.video_url,
          duration: video.duration || "",
          category: video.category || "Movies",
          is_featured: Boolean(video.is_featured),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete video
    if (action === "delete" && id) {
      const { error } = await supabase.from("videos").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
