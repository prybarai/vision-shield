export type ProjectCategory = 'roofing' | 'exterior_paint' | 'deck_patio' | 'landscaping' | 'kitchen' | 'bathroom' | 'flooring' | 'interior_paint' | 'custom_project';
export type StylePreference = 'modern' | 'traditional' | 'minimal' | 'luxury' | 'warm_natural' | 'budget_refresh';
export type QualityTier = 'budget' | 'mid' | 'premium';
export type LocationType = 'interior' | 'exterior';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface Project {
  id: string;
  homeowner_id?: string;
  session_id?: string;
  location_type: LocationType;
  project_category: ProjectCategory;
  address?: string;
  zip_code: string;
  style_preference?: StylePreference;
  quality_tier: QualityTier;
  uploaded_image_urls: string[];
  generated_image_urls: string[];
  notes?: string;
  status: 'draft' | 'estimated' | 'brief_generated' | 'lead_submitted';
  share_token: string;
  created_at: string;
  updated_at: string;
}

export interface Estimate {
  id: string;
  project_id: string;
  low_estimate: number;
  mid_estimate: number;
  high_estimate: number;
  assumptions: string[];
  risk_notes: string[];
  estimate_basis: string;
  estimate_breakdown?: string;
  region_multiplier: number;
  created_at: string;
}

export interface MaterialLineItem {
  category: string;
  item: string;
  quantity: number;
  unit: string;
  finish_tier: string;
  estimated_cost_low: number;
  estimated_cost_high: number;
  sourcing_notes: string;
}

export interface MaterialList {
  id: string;
  project_id: string;
  line_items: MaterialLineItem[];
  sourcing_notes?: string;
  created_at: string;
}

export interface ProjectBrief {
  id: string;
  project_id: string;
  summary: string;
  homeowner_goals: string;
  contractor_notes: string;
  site_verification_questions: string[];
  likely_trades?: string[];
  unknowns_to_verify?: string[];
  created_at: string;
}

export interface Lead {
  id: string;
  project_id: string;
  homeowner_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  zip_code: string;
  preferred_timing: 'asap' | 'within_month' | 'planning_ahead';
  budget_range: 'under_5k' | '5k_15k' | '15k_50k' | '50k_plus';
  priority: 'budget' | 'speed' | 'quality';
  notes?: string;
  status: 'new' | 'sent' | 'claimed' | 'converted' | 'closed';
  created_at: string;
}

export interface ContractorScan {
  id: string;
  contractor_name?: string;
  contractor_business_name?: string;
  state: string;
  license_status: 'active' | 'expired' | 'not_found' | 'error';
  license_data?: Record<string, unknown>;
  risk_score: number;
  risk_level: RiskLevel;
  risk_flags: Array<{ flag: string; explanation: string; severity: string }>;
  questionnaire_answers?: Record<string, string>;
  created_at: string;
}

export interface QuoteScan {
  id: string;
  risk_score: number;
  risk_level: RiskLevel;
  red_flags: Array<{ flag: string; explanation: string; severity: string }>;
  missing_terms: Array<{ term: string; why_important: string }>;
  questions_to_ask: string[];
  plain_english_summary: string;
  payment_structure_analysis: string;
  created_at: string;
}

export const PROJECT_CATEGORIES: Record<ProjectCategory, { label: string; emoji: string; description: string; type: LocationType }> = {
  roofing: { label: 'Roofing', emoji: '🏠', description: 'Full replacement or major repair', type: 'exterior' },
  exterior_paint: { label: 'Exterior Paint', emoji: '🎨', description: 'Fresh coat for curb appeal', type: 'exterior' },
  deck_patio: { label: 'Deck & Patio', emoji: '🌿', description: 'Outdoor living space', type: 'exterior' },
  landscaping: { label: 'Landscaping', emoji: '🌳', description: 'Yard, garden & hardscape', type: 'exterior' },
  kitchen: { label: 'Kitchen Refresh', emoji: '🍳', description: 'Cabinets, counters, appliances', type: 'interior' },
  bathroom: { label: 'Bathroom Refresh', emoji: '🚿', description: 'Tile, vanity, fixtures', type: 'interior' },
  flooring: { label: 'Flooring', emoji: '▪️', description: 'Hardwood, tile, or LVP', type: 'interior' },
  interior_paint: { label: 'Interior Paint', emoji: '🖌️', description: 'Walls, trim & ceilings', type: 'interior' },
  custom_project: { label: 'Custom Project', emoji: '🛠️', description: 'Something more unique? Tell us what you want to change.', type: 'interior' },
};

export const STYLE_OPTIONS: Record<StylePreference, { label: string; description: string; color: string }> = {
  modern: { label: 'Modern', description: 'Clean lines, contemporary materials', color: '#1e293b' },
  traditional: { label: 'Traditional', description: 'Classic craftsmanship, warm tones', color: '#92400e' },
  minimal: { label: 'Minimal', description: 'Simple, uncluttered, neutral palette', color: '#94a3b8' },
  luxury: { label: 'Luxury', description: 'High-end materials, premium finishes', color: '#7c3aed' },
  warm_natural: { label: 'Warm & Natural', description: 'Wood tones, organic textures', color: '#d97706' },
  budget_refresh: { label: 'Budget Refresh', description: 'Clean, practical, cost-effective', color: '#16a34a' },
};

export const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' }, { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' }, { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' }, { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' }, { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' }, { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' }, { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' }, { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' }, { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' }, { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' }, { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' }, { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' }, { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' }, { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' }, { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' }, { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' }, { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
];
