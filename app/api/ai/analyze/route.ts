import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, project_type, skill_level, description, zip_code } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Get project data
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get uploaded image URL
    const imageUrl = project.uploaded_image_urls?.[0];
    if (!imageUrl) {
      return NextResponse.json({ error: 'No image found for project' }, { status: 400 });
    }

    // AI Analysis based on project type
    let aiPrompt = '';
    let analysisType = '';

    switch (project_type) {
      case 'diagnose':
        aiPrompt = `Analyze this home issue image. Describe what you see, diagnose the likely problem, and suggest whether this is a DIY fix or requires a professional. Consider: ${description || 'No additional description provided'}.`;
        analysisType = 'diagnosis';
        break;
      case 'renovate':
        aiPrompt = `Analyze this space for renovation potential. Suggest improvements, layout changes, and design ideas. Consider the user's description: ${description || 'No specific goals mentioned'}.`;
        analysisType = 'renovation_plan';
        break;
      case 'landscape':
        aiPrompt = `Analyze this outdoor space. Suggest landscaping improvements, plant selections, hardscape ideas, and overall yard design. Consider: ${description || 'General yard improvement'}.`;
        analysisType = 'landscaping_plan';
        break;
      case 'repair':
        aiPrompt = `Analyze this repair need. Identify what's broken, suggest repair methods, estimate difficulty level for skill level: ${skill_level}. Consider: ${description || 'General repair needed'}.`;
        analysisType = 'repair_plan';
        break;
      case 'design':
        aiPrompt = `Analyze this space for design improvements. Suggest aesthetic changes, color schemes, furniture placement, and decor ideas. Consider: ${description || 'General design improvement'}.`;
        analysisType = 'design_plan';
        break;
      default:
        aiPrompt = `Analyze this home-related image. Based on the description "${description || 'No description provided'}", provide insights, suggestions, and next steps.`;
        analysisType = 'general_analysis';
    }

    // Call OpenAI Vision API for image analysis
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: aiPrompt },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high"
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const aiAnalysis = visionResponse.choices[0]?.message?.content || 'No analysis generated';

    // Generate materials list based on analysis
    const materialsPrompt = `Based on this analysis: "${aiAnalysis.substring(0, 500)}"... Generate a materials list for this project. Consider skill level: ${skill_level}. Format as JSON with items array containing name, quantity, estimated_cost, and where_to_buy.`;
    
    const materialsResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "user", content: materialsPrompt }
      ],
      response_format: { type: "json_object" },
    });

    const materialsData = JSON.parse(materialsResponse.choices[0]?.message?.content || '{"items": []}');

    // Generate cost estimate based on ZIP code and materials
    const estimatePrompt = `Based on materials: ${JSON.stringify(materialsData.items)} and project type: ${project_type}, generate a cost estimate for ZIP code: ${zip_code}. Consider skill level: ${skill_level}. Format as JSON with low_estimate, mid_estimate, high_estimate, and breakdown.`;
    
    const estimateResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "user", content: estimatePrompt }
      ],
      response_format: { type: "json_object" },
    });

    const estimateData = JSON.parse(estimateResponse.choices[0]?.message?.content || '{"low_estimate": 0, "mid_estimate": 0, "high_estimate": 0}');

    // Generate DIY vs Pro recommendation
    const recommendationPrompt = `For this project (type: ${project_type}, skill level: ${skill_level}), should the user attempt DIY or hire a pro? Consider: ${aiAnalysis.substring(0, 300)}. Provide detailed reasoning and steps for both options.`;
    
    const recommendationResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "user", content: recommendationPrompt }
      ],
    });

    const recommendation = recommendationResponse.choices[0]?.message?.content || 'No recommendation generated';

    // Save all analysis to database
    const { error: analysisError } = await supabaseAdmin
      .from('ai_analyses')
      .insert({
        project_id,
        analysis_type: analysisType,
        ai_analysis: aiAnalysis,
        materials_list: materialsData,
        cost_estimate: estimateData,
        diy_vs_pro: recommendation,
        skill_level,
        zip_code,
        created_at: new Date().toISOString(),
      });

    if (analysisError) {
      console.error('Error saving analysis:', analysisError);
    }

    // Update project status
    await supabaseAdmin
      .from('projects')
      .update({ 
        status: 'ai_analyzed',
        updated_at: new Date().toISOString()
      })
      .eq('id', project_id);

    return NextResponse.json({
      success: true,
      project_id,
      analysis: aiAnalysis,
      materials: materialsData,
      estimate: estimateData,
      recommendation: recommendation,
      next_steps: ['View complete analysis', 'Browse materials', 'Get pro quotes if needed']
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze project', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}