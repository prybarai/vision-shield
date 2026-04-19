import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { 
  CheckCircle, 
  Wrench, 
  Home, 
  TreePine, 
  Hammer, 
  Sparkles, 
  MessageSquare,
  Calculator,
  ShoppingCart,
  Users,
  ArrowRight,
  Download,
  Share2
} from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ project_id: string }>;
}

const PROJECT_TYPE_ICONS = {
  diagnose: Wrench,
  renovate: Home,
  landscape: TreePine,
  repair: Hammer,
  design: Sparkles,
  custom: MessageSquare,
};

const SKILL_LEVEL_LABELS = {
  beginner: 'Beginner',
  handy: 'Handy',
  experienced: 'Experienced',
  pro: 'Hire a Pro',
};

export default async function AIResultsPage({ params }: PageProps) {
  const { project_id } = await params;

  // Get project data
  const { data: project, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('id', project_id)
    .single();

  if (error || !project) {
    notFound();
  }

  // Get AI analysis if it exists
  const { data: aiAnalysis } = await supabaseAdmin
    .from('ai_analyses')
    .select('*')
    .eq('project_id', project_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const ProjectTypeIcon = PROJECT_TYPE_ICONS[project.project_type as keyof typeof PROJECT_TYPE_ICONS] || MessageSquare;
  const skillLabel = SKILL_LEVEL_LABELS[project.skill_level as keyof typeof SKILL_LEVEL_LABELS] || 'Handy';

  // Mock data for demo (remove when AI is fully working)
  const mockAnalysis: any = {
    ai_analysis: `Based on your ${project.project_type} project, I can see this is a ${project.skill_level}-level task. ${project.description ? `You mentioned: "${project.description}"` : ''}

For this type of project, here's what I recommend:

1. **Assessment**: This appears to be a standard home project that ${project.skill_level === 'pro' ? 'would benefit from professional expertise' : 'can be tackled with proper planning'}.

2. **Materials Needed**: Basic tools and materials for ${project.project_type} work.

3. **Timeline**: ${project.skill_level === 'beginner' ? '1-2 weekends' : project.skill_level === 'handy' ? 'A weekend' : project.skill_level === 'experienced' ? '2-3 days' : 'Professional timeline'}.

4. **Next Steps**: ${project.skill_level === 'pro' ? 'Contact local professionals for quotes' : 'Gather materials and plan your approach'}.`,
    
    materials_list: {
      items: [
        { name: 'Basic tool set', quantity: '1 set', estimated_cost: 50, where_to_buy: 'Home Depot, Lowe\'s' },
        { name: 'Safety equipment', quantity: 'As needed', estimated_cost: 30, where_to_buy: 'Any hardware store' },
        { name: 'Project-specific materials', quantity: 'Varies', estimated_cost: 200, where_to_buy: 'Local suppliers' },
      ]
    },
    
    cost_estimate: {
      low_estimate: 150,
      mid_estimate: 280,
      high_estimate: 500,
      breakdown: {
        materials: 200,
        labor: project.skill_level === 'pro' ? 300 : 0,
        tools: 50,
        contingency: 30
      }
    },
    
    diy_vs_pro: project.skill_level === 'pro' 
      ? `**Recommendation: Hire a Professional**
Given your preference to hire a pro, here's what to do:
1. Get 2-3 quotes from local contractors
2. Check licenses and references
3. Review the scope of work carefully
4. Ask about timeline and payment schedule`
      : `**Recommendation: DIY Approach**
As a ${skillLabel.toLowerCase()}, you can tackle this project:
1. Start with thorough planning
2. Gather all materials first
3. Work in stages
4. Don't rush - quality matters most`
  };

  const analysis: any = aiAnalysis || mockAnalysis;
  const isMock = !aiAnalysis;
  
  // Ensure analysis has required structure
  if (!analysis.cost_estimate?.breakdown) {
    analysis.cost_estimate = {
      ...analysis.cost_estimate,
      breakdown: {
        materials: 0,
        labor: 0,
        tools: 0,
        contingency: 0
      }
    };
  }

  return (
    <main className="min-h-screen bg-canvas">
      <Nav />
      
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="rounded-full bg-gradient-to-r from-sand/20 to-mint/20 p-2">
              <ProjectTypeIcon className="h-5 w-5 text-sand-dark" />
            </div>
            <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              AI-Powered Analysis
            </span>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Your {project.project_type.replace('_', ' ')} plan is ready
          </h1>
          
          <p className="text-lg text-gray-600">
            Tailored for {skillLabel} skill level • ZIP {project.zip_code}
          </p>
        </div>

        {isMock && (
          <div className="mb-8 rounded-xl bg-amber-50 border border-amber-200 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Demo Mode</p>
                <p className="text-sm text-amber-700 mt-1">
                  This is a preview of your AI analysis. The full AI system is being trained and will be available soon.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left column - Analysis */}
          <div className="lg:col-span-2 space-y-8">
            {/* AI Analysis */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-sand-dark" />
                AI Analysis
              </h2>
              <div className="prose prose-gray max-w-none">
                <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                  {analysis.ai_analysis}
                </div>
              </div>
            </div>

            {/* DIY vs Pro Recommendation */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                Recommendation
              </h2>
              <div className="prose prose-gray max-w-none">
                <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                  {analysis.diy_vs_pro}
                </div>
              </div>
            </div>

            {/* Materials List */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
                Materials List
              </h2>
              
              <div className="space-y-4">
                {analysis.materials_list.items.map((item: {name: string, quantity: string, estimated_cost: number, where_to_buy: string}, index: number) => (
                  <div key={index} className="flex items-start justify-between p-4 rounded-xl bg-gray-50">
                    <div>
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-600 mt-1">Quantity: {item.quantity}</div>
                      <div className="text-sm text-gray-600">Where to buy: {item.where_to_buy}</div>
                    </div>
                    <div className="font-bold text-gray-900">
                      ${item.estimated_cost}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total materials estimate:</span>
                  <span className="text-2xl font-bold text-gray-900">
                    ${analysis.materials_list.items.reduce((sum: number, item: {estimated_cost: number}) => sum + item.estimated_cost, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Summary & Actions */}
          <div className="space-y-6">
            {/* Cost Estimate */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-green-600" />
                Cost Estimate
              </h2>
              
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    ${analysis.cost_estimate.mid_estimate}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Most likely cost
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-lg bg-gray-50">
                    <div className="text-sm text-gray-600">Low end</div>
                    <div className="font-bold text-gray-900">${analysis.cost_estimate.low_estimate}</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gray-50">
                    <div className="text-sm text-gray-600">High end</div>
                    <div className="font-bold text-gray-900">${analysis.cost_estimate.high_estimate}</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-sm font-medium text-gray-900 mb-2">Cost breakdown:</div>
                  <div className="space-y-2">
                    {Object.entries(analysis.cost_estimate.breakdown).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-600 capitalize">{key}:</span>
                        <span className="font-medium text-gray-900">${value as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Next Steps</h2>
              
              <div className="space-y-3">
                {project.skill_level === 'pro' ? (
                  <>
                    <Link
                      href={`/pro?zip=${project.zip_code}&type=${project.project_type}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-sand-dark to-sand text-white hover:opacity-90 transition-opacity"
                    >
                      <span className="font-medium">Find Local Pros</span>
                      <Users className="h-5 w-5" />
                    </Link>
                    <button className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                      <span className="font-medium text-gray-700">Download Brief</span>
                      <Download className="h-5 w-5 text-gray-500" />
                    </button>
                  </>
                ) : (
                  <>
                    <button className="w-full flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-sand-dark to-sand text-white hover:opacity-90 transition-opacity">
                      <span className="font-medium">Start Shopping</span>
                      <ShoppingCart className="h-5 w-5" />
                    </button>
                    <button className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                      <span className="font-medium text-gray-700">Save Plan</span>
                      <Download className="h-5 w-5 text-gray-500" />
                    </button>
                  </>
                )}
                
                <button className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                  <span className="font-medium text-gray-700">Share</span>
                  <Share2 className="h-5 w-5 text-gray-500" />
                </button>
                
                <Link
                  href="/"
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-gray-700"
                >
                  <span>Start Another Project</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Project Info */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Project Details</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium text-gray-900 capitalize">{project.project_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Skill Level:</span>
                  <span className="font-medium text-gray-900">{skillLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium text-gray-900">ZIP {project.zip_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}