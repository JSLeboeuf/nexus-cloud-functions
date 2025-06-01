// NEXUS Cloud API - Version complète
Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Import Supabase client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get path
    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    // Routes
    switch (path) {
      case 'enhance-prompt':
        return await handleEnhancePrompt(req, supabase)
      
      case 'capture':
        return await handleCapture(req, supabase)
      
      case 'test':
        return new Response(
          JSON.stringify({ 
            message: 'NEXUS Test OK',
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      
      default:
        return new Response(
          JSON.stringify({ 
            message: '🧠 NEXUS Cloud API',
            version: '2.0',
            status: 'active',
            endpoints: [
              '/test - Test endpoint',
              '/enhance-prompt - Enrichit un prompt',
              '/capture - Capture une information'
            ]
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function handleEnhancePrompt(req: Request, supabase: any) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  
  try {
    const { prompt, session_id, device_id } = await req.json()
    
    // Capture dans NEXUS
    await supabase.from('items').insert({
      type: 'conversation',
      content: prompt,
      source: 'jarvis_claude',
      session_id: session_id || 'default',
      importance_score: 0.6
    })
    
    // Recherche contexte
    const { data: context } = await supabase
      .from('items')
      .select('*')
      .ilike('content', `%${prompt.substring(0, 50)}%`)
      .limit(5)
    
    let enhanced = ''
    if (context && context.length > 0) {
      enhanced = '# CONTEXTE NEXUS:\n'
      context.forEach((item: any) => {
        enhanced += `- ${item.content.substring(0, 200)}...\n`
      })
      enhanced += '\n'
    }
    enhanced += '# QUESTION:\n' + prompt
    
    return new Response(
      JSON.stringify({ 
        enhanced_prompt: enhanced,
        context_count: context?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}

async function handleCapture(req: Request, supabase: any) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  
  try {
    const data = await req.json()
    
    const item = {
      type: data.type || 'I',
      content: data.content,
      source: data.source || 'api',
      importance_score: 0.5,
      metadata: data.metadata || {}
    }
    
    const { data: result, error } = await supabase
      .from('items')
      .insert(item)
      .select()
    
    if (error) throw error
    
    return new Response(
      JSON.stringify({ 
        success: true,
        item_id: result[0]?.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}
