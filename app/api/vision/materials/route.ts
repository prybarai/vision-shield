import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import Anthropic from '@anthropic-ai/sdk';
import { type VisionAnalysis } from '../../../../lib/visionAnalysis';

const schema = z.object({
  project_id: z.string().uuid(),
  category: z.string(),
  style: z.string(),
  quality_tier: z.enum(['budget', 'mid', 'premium']),
  estimate_mid: z.number(),
  generated_image_url: z.string().optional(),
  analysis: z.unknown().optional(),
  notes: z.string().optional(),
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'placeholder' });

function getAnalysis(input: unknown): VisionAnalysis | undefined {
  if (!input || typeof input !== 'object') return undefined;
  return input as VisionAnalysis;
}

/* ── Build the AI prompt that demands REAL products ── */

function buildRealProductsPrompt(params: z.infer<typeof schema>, analysis?: VisionAnalysis, visualDescription?: string) {
  const tierGuide = params.quality_tier === 'budget'
    ? 'Focus on best-value products: store brands, builder-grade, and reliable budget picks from Home Depot, Lowe\'s, and Amazon.'
    : params.quality_tier === 'premium'
      ? 'Focus on premium products: designer brands, professional-grade, and high-end selections from specialty retailers, Build.com, Ferguson, and premium lines at Home Depot/Lowe\'s.'
      : 'Focus on solid mid-range products: well-reviewed name brands from Home Depot, Lowe\'s, and Amazon that balance quality and value.';

  const retailerGuide = `
RETAILER URL RULES (critical):
- Home Depot: https://www.homedepot.com/s/{product+name}
- Lowe's: https://www.lowes.com/search?searchTerm={product+name}
- Amazon: https://www.amazon.com/s?k={product+name}
- Build.com: https://www.build.com/search?term={product+name}
- Use SEARCH URLs, not direct product URLs, so the link always works.
- Every single line item MUST have a retailer and retailer_url.`;

  const analysisContext = analysis ? `
PHOTO ANALYSIS (use this to pick specific products that match):
- Space: ${analysis.space_type || 'unknown'}, ~${analysis.estimated_sqft || 'unknown'} sq ft
- Current materials: ${analysis.current_materials.join(', ') || 'none noted'}
- Current condition: ${analysis.current_condition || 'unknown'}
- Style: ${analysis.existing_style || 'unknown'}
- Features: ${analysis.architectural_features.join(', ') || 'none noted'}
- Scope: ${analysis.renovation_scope || 'unknown'}
- Challenges: ${analysis.key_challenges.join(', ') || 'none noted'}
- Observations: ${analysis.photo_observations || 'none noted'}
- Dimensions: ${JSON.stringify(analysis.estimated_dimensions)}
- Area signals: ${JSON.stringify(analysis.area_signals)}
- Scope signals: ${JSON.stringify(analysis.scope_signals)}` : '';

  return `You are a contractor and materials expert helping a homeowner build a REAL, shoppable materials list.

PROJECT:
- Category: ${params.category.replace(/_/g, ' ')}
- Style: ${params.style}
- Quality tier: ${params.quality_tier}
- Planning budget: $${params.estimate_mid.toLocaleString()}
${params.notes ? `- Homeowner notes: ${params.notes}` : ''}
${analysisContext}
${visualDescription ? `\nDESIGN CONCEPT shows: ${visualDescription}` : ''}

${tierGuide}

REQUIREMENTS:
1. Return 8-12 SPECIFIC, REAL products — not generic allowances or placeholders.
2. Every item must be a real product that exists and can be purchased:
   - REAL brand name (e.g., "Delta", "Behr", "LifeProof", "Pergo")
   - REAL product name (e.g., "Trinsic Single-Handle Pull-Down Faucet")
   - Specific color/finish (e.g., "Champagne Bronze", "Matte Black")
   - Real per-unit price
   - Real retailer name and search URL
3. Group items into these categories: "Primary Materials", "Fixtures & Hardware", "Finishes & Accessories", "Tools & Supplies"
4. For labor items, still include them but mark is_diy_friendly appropriately
5. Include a mix of materials AND the tools/supplies needed for DIY
6. install_note should be a 1-sentence DIY tip or pro recommendation
7. Make quantities realistic for the visible space size

${retailerGuide}

OUTPUT FORMAT — ONLY valid JSON, no markdown:
{
  "line_items": [
    {
      "category": "Primary Materials",
      "item": "LifeProof Sterling Oak Luxury Vinyl Plank",
      "brand": "LifeProof",
      "model": "Sterling Oak 8.7 in. W Waterproof LVP",
      "color_finish": "Sterling Oak",
      "quantity": 280,
      "unit": "sq ft",
      "unit_price": 3.69,
      "finish_tier": "${params.quality_tier}",
      "estimated_cost_low": 930,
      "estimated_cost_high": 1100,
      "retailer": "Home Depot",
      "retailer_url": "https://www.homedepot.com/s/LifeProof+Sterling+Oak+LVP",
      "is_diy_friendly": true,
      "install_note": "Click-lock install over existing subfloor — no glue needed.",
      "sourcing_notes": "Top-rated waterproof LVP. Order 10% extra for cuts and waste."
    }
  ],
  "sourcing_notes": "Complete shopping list for a mid-range bathroom refresh. All items available at Home Depot and Lowe's. Budget includes materials only — add $X–$Y for professional installation if not DIY."
}`;
}

/* ── Category-specific fallbacks with REAL products ── */

type LineItem = {
  category: string; item: string; brand: string; model: string; color_finish: string;
  quantity: number; unit: string; unit_price: number; finish_tier: string;
  estimated_cost_low: number; estimated_cost_high: number;
  retailer: string; retailer_url: string; is_diy_friendly: boolean;
  install_note: string; sourcing_notes: string;
};

function fallbackBathroom(tier: string): LineItem[] {
  const b = tier === 'budget', p = tier === 'premium';
  return [
    { category: 'Primary Materials', item: p ? 'Daltile RevoTile Marble Look Porcelain' : b ? 'MSI Carrara White 12x24 Ceramic Tile' : 'Marazzi Developed by Nature Calacatta Porcelain', brand: p ? 'Daltile' : b ? 'MSI' : 'Marazzi', model: p ? 'RevoTile 12x24 Marble Look' : b ? 'Carrara White 12x24' : 'Developed by Nature 12x24', color_finish: 'White / Marble Look', quantity: 80, unit: 'sq ft', unit_price: p ? 6.49 : b ? 1.99 : 3.49, finish_tier: tier, estimated_cost_low: Math.round(80 * (p ? 5.5 : b ? 1.7 : 2.9)), estimated_cost_high: Math.round(80 * (p ? 7.0 : b ? 2.3 : 3.8)), retailer: 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'Daltile RevoTile marble porcelain' : b ? 'MSI Carrara White ceramic tile' : 'Marazzi Calacatta porcelain tile')}`, is_diy_friendly: true, install_note: 'Use a 1/4" notched trowel and tile spacers for even grout lines.', sourcing_notes: 'Order 15% extra for cuts around fixtures. Check lot numbers match for consistent color.' },
    { category: 'Fixtures & Hardware', item: p ? 'Kohler Composed Single-Handle Faucet' : b ? 'Glacier Bay Constructor Centerset Faucet' : 'Delta Trinsic Single Hole Faucet', brand: p ? 'Kohler' : b ? 'Glacier Bay' : 'Delta', model: p ? 'Composed K-73167' : b ? 'Constructor HD67091W-6A01' : 'Trinsic 559LF', color_finish: p ? 'Vibrant Brushed Moderne Brass' : b ? 'Chrome' : 'Matte Black', quantity: 1, unit: 'each', unit_price: p ? 589 : b ? 49 : 229, finish_tier: tier, estimated_cost_low: p ? 520 : b ? 42 : 199, estimated_cost_high: p ? 620 : b ? 55 : 249, retailer: p ? 'Build.com' : 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'Kohler Composed faucet brass' : b ? 'Glacier Bay Constructor faucet chrome' : 'Delta Trinsic faucet matte black')}`, is_diy_friendly: true, install_note: 'Shut off water supply valves under the sink before removing the old faucet.', sourcing_notes: 'Includes supply lines. Confirm sink hole count matches before ordering.' },
    { category: 'Fixtures & Hardware', item: p ? 'Kohler Veil Intelligent Toilet' : b ? 'Glacier Bay 2-Piece Round Toilet' : 'TOTO Drake II Two-Piece Elongated Toilet', brand: p ? 'Kohler' : b ? 'Glacier Bay' : 'TOTO', model: p ? 'Veil K-5401' : b ? 'N2316' : 'Drake II CST454CEFG', color_finish: 'White', quantity: 1, unit: 'each', unit_price: p ? 2800 : b ? 139 : 389, finish_tier: tier, estimated_cost_low: p ? 2500 : b ? 119 : 349, estimated_cost_high: p ? 3100 : b ? 159 : 429, retailer: 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'Kohler Veil intelligent toilet' : b ? 'Glacier Bay round toilet' : 'TOTO Drake II elongated toilet')}`, is_diy_friendly: false, install_note: 'Hire a plumber for new rough-in work. DIY-able if replacing same-footprint toilet.', sourcing_notes: 'Measure rough-in distance (10" or 12") before ordering.' },
    { category: 'Fixtures & Hardware', item: p ? 'Kohler Verdera Lighted Medicine Cabinet' : b ? 'Glacier Bay 24 in. Frameless Mirror' : 'Home Decorators Sonoma 36 in. Vanity Mirror', brand: p ? 'Kohler' : b ? 'Glacier Bay' : 'Home Decorators', model: p ? 'Verdera 34" Lighted' : b ? '24 in. Beveled Frameless' : 'Sonoma 36 in.', color_finish: p ? 'Anodized Aluminum' : b ? 'Frameless' : 'Dark Charcoal', quantity: 1, unit: 'each', unit_price: p ? 899 : b ? 49 : 179, finish_tier: tier, estimated_cost_low: p ? 799 : b ? 39 : 149, estimated_cost_high: p ? 949 : b ? 55 : 199, retailer: 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'Kohler Verdera lighted medicine cabinet' : b ? 'Glacier Bay frameless mirror 24' : 'Home Decorators Sonoma vanity mirror')}`, is_diy_friendly: true, install_note: 'Use a stud finder and toggle bolts for secure wall mounting.', sourcing_notes: 'Measure vanity width first to ensure mirror proportions look right.' },
    { category: 'Finishes & Accessories', item: p ? 'Mapei Keracolor U Premium Unsanded Grout' : b ? 'Custom Building Products Polyblend Sanded Grout' : 'Mapei Keracolor S Sanded Grout', brand: p ? 'Mapei' : b ? 'Custom Building Products' : 'Mapei', model: p ? 'Keracolor U 10 lb.' : b ? 'Polyblend #381 Bright White' : 'Keracolor S 25 lb.', color_finish: 'White / Bright White', quantity: 2, unit: 'bags', unit_price: p ? 28 : b ? 12 : 18, finish_tier: tier, estimated_cost_low: p ? 48 : b ? 20 : 30, estimated_cost_high: p ? 62 : b ? 28 : 42, retailer: 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'Mapei Keracolor unsanded grout' : b ? 'Polyblend sanded grout bright white' : 'Mapei Keracolor sanded grout')}`, is_diy_friendly: true, install_note: 'Use unsanded for joints under 1/8", sanded for wider joints.', sourcing_notes: 'Seal grout after 72 hours for stain resistance.' },
    { category: 'Finishes & Accessories', item: p ? 'Schluter DITRA Uncoupling Membrane' : 'Custom Building Products RedGard Waterproofing', brand: p ? 'Schluter' : 'Custom Building Products', model: p ? 'DITRA 54 sq ft Roll' : 'RedGard 1 Gallon', color_finish: 'N/A', quantity: 1, unit: p ? 'roll' : 'gallon', unit_price: p ? 165 : 32, finish_tier: tier, estimated_cost_low: p ? 145 : 28, estimated_cost_high: p ? 185 : 38, retailer: 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'Schluter DITRA uncoupling membrane' : 'RedGard waterproofing membrane')}`, is_diy_friendly: true, install_note: 'Apply waterproofing to all wet areas before tiling — shower walls, floor, and curb.', sourcing_notes: 'Critical for preventing water damage. Do not skip this step.' },
    { category: 'Tools & Supplies', item: 'QEP 24 in. Tile Cutter', brand: 'QEP', model: '10630Q 24 in. Manual Tile Cutter', color_finish: 'N/A', quantity: 1, unit: 'each', unit_price: 59, finish_tier: tier, estimated_cost_low: 49, estimated_cost_high: 65, retailer: 'Home Depot', retailer_url: 'https://www.homedepot.com/s/QEP+24+inch+tile+cutter', is_diy_friendly: true, install_note: 'Score once firmly and snap — don\'t go back and forth on the same line.', sourcing_notes: 'Rent a wet saw from Home Depot ($50/day) for L-cuts and notches around pipes.' },
    { category: 'Tools & Supplies', item: 'DAP Kwik Seal Ultra Kitchen & Bath Caulk', brand: 'DAP', model: 'Kwik Seal Ultra 10.1 oz.', color_finish: 'White', quantity: 3, unit: 'tubes', unit_price: 7, finish_tier: tier, estimated_cost_low: 18, estimated_cost_high: 24, retailer: 'Home Depot', retailer_url: 'https://www.homedepot.com/s/DAP+Kwik+Seal+Ultra+caulk', is_diy_friendly: true, install_note: 'Cut the tip at 45 degrees and use painter\'s tape for clean lines.', sourcing_notes: 'Use silicone-based caulk in wet areas. Latex caulk for dry trim.' },
  ];
}

function fallbackKitchen(tier: string): LineItem[] {
  const b = tier === 'budget', p = tier === 'premium';
  return [
    { category: 'Primary Materials', item: p ? 'Cambria Brittanicca Quartz Countertop' : b ? 'Hampton Bay Laminate Countertop' : 'Allen + Roth Quartz Countertop', brand: p ? 'Cambria' : b ? 'Hampton Bay' : 'Allen + Roth', model: p ? 'Brittanicca 3cm Slab' : b ? 'VT Dimensions Formica 25.25 in.' : 'Titanium Swell 25.5 in.', color_finish: p ? 'Brittanicca White Marble Look' : b ? 'Carrara Bianco' : 'Titanium Swell', quantity: p ? 40 : 30, unit: 'sq ft', unit_price: p ? 95 : b ? 12 : 55, finish_tier: tier, estimated_cost_low: p ? 3400 : b ? 300 : 1400, estimated_cost_high: p ? 4200 : b ? 420 : 1800, retailer: p ? 'Build.com' : 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'Cambria quartz countertop' : b ? 'Hampton Bay laminate countertop' : 'Allen Roth quartz countertop')}`, is_diy_friendly: false, install_note: 'Quartz and stone require professional templating and install — do not DIY.', sourcing_notes: 'Get 3 fabricator quotes. Template after cabinets are set.' },
    { category: 'Primary Materials', item: p ? 'MSI Calacatta Gold Marble Backsplash Tile' : b ? 'Peel & Stick Subway Tile by Art3d' : 'Jeffrey Court Carrara Beveled Subway Tile', brand: p ? 'MSI' : b ? 'Art3d' : 'Jeffrey Court', model: p ? 'Calacatta Gold 3x6 Polished' : b ? 'Art3d Peel & Stick 12x12 Sheet' : 'Beveled 3x6 Ceramic', color_finish: p ? 'Calacatta Gold' : b ? 'White Subway' : 'Carrara White', quantity: p ? 30 : 25, unit: 'sq ft', unit_price: p ? 14.99 : b ? 5.99 : 3.49, finish_tier: tier, estimated_cost_low: p ? 380 : b ? 120 : 72, estimated_cost_high: p ? 500 : b ? 170 : 100, retailer: 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'MSI Calacatta Gold marble tile' : b ? 'Art3d peel stick subway tile' : 'Jeffrey Court Carrara subway tile')}`, is_diy_friendly: true, install_note: 'Start from the center of the wall and work outward for a balanced layout.', sourcing_notes: 'Order 15% extra for cuts. Peel-and-stick is great for renters.' },
    { category: 'Fixtures & Hardware', item: p ? 'Kohler Artifacts Single-Hole Kitchen Faucet' : b ? 'Glacier Bay Market Single-Handle Pull-Down Faucet' : 'Delta Leland Single-Handle Pull-Down Faucet', brand: p ? 'Kohler' : b ? 'Glacier Bay' : 'Delta', model: p ? 'Artifacts K-99259' : b ? 'Market 67551-0001' : 'Leland 9178-DST', color_finish: p ? 'Vibrant Stainless' : b ? 'Chrome' : 'SpotShield Stainless', quantity: 1, unit: 'each', unit_price: p ? 649 : b ? 79 : 249, finish_tier: tier, estimated_cost_low: p ? 580 : b ? 65 : 219, estimated_cost_high: p ? 699 : b ? 89 : 279, retailer: 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'Kohler Artifacts kitchen faucet' : b ? 'Glacier Bay Market pull down faucet' : 'Delta Leland pull down faucet')}`, is_diy_friendly: true, install_note: 'Turn off water supply under the sink. Most pull-down faucets install in under an hour.', sourcing_notes: 'Confirm sink hole count (1-hole vs 3-hole) before ordering.' },
    { category: 'Fixtures & Hardware', item: p ? 'Kraus Standart PRO 33 in. Undermount Sink' : b ? 'Glacier Bay Drop-In 33 in. Double Bowl Sink' : 'Kraus KGU-413B 31 in. Undermount Sink', brand: p ? 'Kraus' : b ? 'Glacier Bay' : 'Kraus', model: p ? 'KHU100-30 Standart PRO' : b ? 'VT3322A0 Drop-In' : 'KGU-413B 31 in.', color_finish: 'Stainless Steel', quantity: 1, unit: 'each', unit_price: p ? 349 : b ? 119 : 229, finish_tier: tier, estimated_cost_low: p ? 299 : b ? 99 : 199, estimated_cost_high: p ? 379 : b ? 139 : 259, retailer: 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'Kraus Standart PRO undermount sink' : b ? 'Glacier Bay drop in double bowl sink' : 'Kraus undermount kitchen sink')}`, is_diy_friendly: false, install_note: 'Undermount sinks require countertop cutout — install with countertop fabrication.', sourcing_notes: 'Drop-in sinks are DIY-friendly. Undermount needs professional install.' },
    { category: 'Fixtures & Hardware', item: p ? 'Amerock Mulholland Cabinet Pulls (10-Pack)' : b ? 'Everbilt 3 in. Satin Nickel Bar Pulls (10-Pack)' : 'Liberty Classic Edge 3-3/4 in. Pulls (10-Pack)', brand: p ? 'Amerock' : b ? 'Everbilt' : 'Liberty', model: p ? 'Mulholland BP53014-G10' : b ? 'Satin Nickel 3 in. Bar Pull' : 'Classic Edge P34930', color_finish: p ? 'Golden Champagne' : b ? 'Satin Nickel' : 'Matte Black', quantity: 3, unit: 'packs of 10', unit_price: p ? 49 : b ? 19 : 29, finish_tier: tier, estimated_cost_low: p ? 129 : b ? 49 : 75, estimated_cost_high: p ? 159 : b ? 65 : 99, retailer: 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'Amerock Mulholland cabinet pulls' : b ? 'Everbilt satin nickel bar pulls' : 'Liberty Classic Edge cabinet pulls')}`, is_diy_friendly: true, install_note: 'Use a cabinet hardware jig ($12) for perfectly aligned holes every time.', sourcing_notes: 'Count your doors and drawers first. Budget 1 pull per drawer, 1-2 per door.' },
    { category: 'Finishes & Accessories', item: p ? 'Kichler Barrington 3-Light Island Pendant' : b ? 'Hampton Bay Flaxmere 12 in. Flush Mount' : 'Kichler Avery 1-Light Mini Pendant', brand: p ? 'Kichler' : b ? 'Hampton Bay' : 'Kichler', model: p ? 'Barrington 32108' : b ? 'Flaxmere HB1023C-BN' : 'Avery 43850NI', color_finish: p ? 'Distressed Black and Wood' : b ? 'Brushed Nickel' : 'Brushed Nickel', quantity: p ? 1 : b ? 2 : 2, unit: 'each', unit_price: p ? 289 : b ? 39 : 89, finish_tier: tier, estimated_cost_low: p ? 259 : b ? 68 : 158, estimated_cost_high: p ? 319 : b ? 85 : 195, retailer: 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'Kichler Barrington island pendant' : b ? 'Hampton Bay Flaxmere flush mount' : 'Kichler Avery mini pendant')}`, is_diy_friendly: true, install_note: 'Turn off the breaker, not just the switch. Use a voltage tester before touching wires.', sourcing_notes: 'Island pendants should hang 30-36 in. above the counter surface.' },
    { category: 'Finishes & Accessories', item: p ? 'Rev-A-Shelf 5WB2 Two-Tier Pull-Out Basket' : b ? 'SimpleHouseware Stackable Cabinet Organizer' : 'Rev-A-Shelf 4WDB Single Pull-Out Basket', brand: p ? 'Rev-A-Shelf' : b ? 'SimpleHouseware' : 'Rev-A-Shelf', model: p ? '5WB2-1522CR-1' : b ? 'Stackable 2-Tier' : '4WDB-15 Single Basket', color_finish: 'Chrome / Silver', quantity: 2, unit: 'each', unit_price: p ? 119 : b ? 18 : 59, finish_tier: tier, estimated_cost_low: p ? 210 : b ? 30 : 100, estimated_cost_high: p ? 260 : b ? 42 : 130, retailer: p ? 'Amazon' : 'Home Depot', retailer_url: `https://www.amazon.com/s?k=${encodeURIComponent(p ? 'Rev-A-Shelf 5WB2 pull out basket' : b ? 'SimpleHouseware stackable cabinet organizer' : 'Rev-A-Shelf 4WDB pull out basket')}`, is_diy_friendly: true, install_note: 'Measure cabinet opening width and depth before ordering. Most install with 4 screws.', sourcing_notes: 'Great upgrade for base cabinets. Makes deep cabinets actually usable.' },
    { category: 'Tools & Supplies', item: 'DAP Alex Plus Acrylic Latex Caulk', brand: 'DAP', model: 'Alex Plus 10.1 oz.', color_finish: 'White', quantity: 2, unit: 'tubes', unit_price: 5, finish_tier: tier, estimated_cost_low: 8, estimated_cost_high: 12, retailer: 'Home Depot', retailer_url: 'https://www.homedepot.com/s/DAP+Alex+Plus+caulk', is_diy_friendly: true, install_note: 'Run a bead along the backsplash-to-countertop joint for a clean finish.', sourcing_notes: 'Use painter\'s tape on both sides of the joint for a perfect line.' },
  ];
}

function fallbackFlooring(tier: string): LineItem[] {
  const b = tier === 'budget', p = tier === 'premium';
  return [
    { category: 'Primary Materials', item: p ? 'Shaw Repel Hardwood Pebble Hill Hickory' : b ? 'TrafficMaster Lakeshore Pecan LVP' : 'LifeProof Sterling Oak Luxury Vinyl Plank', brand: p ? 'Shaw' : b ? 'TrafficMaster' : 'LifeProof', model: p ? 'Pebble Hill 5 in. Engineered Hardwood' : b ? 'Lakeshore Pecan 7.1 in. LVP' : 'Sterling Oak 8.7 in. Waterproof LVP', color_finish: p ? 'Hickory Natural' : b ? 'Lakeshore Pecan' : 'Sterling Oak', quantity: 250, unit: 'sq ft', unit_price: p ? 6.99 : b ? 1.49 : 3.69, finish_tier: tier, estimated_cost_low: p ? 1500 : b ? 320 : 790, estimated_cost_high: p ? 1900 : b ? 420 : 1010, retailer: 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'Shaw Repel Pebble Hill hickory hardwood' : b ? 'TrafficMaster Lakeshore Pecan LVP' : 'LifeProof Sterling Oak LVP')}`, is_diy_friendly: true, install_note: 'Click-lock planks install without glue. Start along the longest wall for the best look.', sourcing_notes: 'Order 10% extra for cuts and waste. Acclimate hardwood 48 hours before install.' },
    { category: 'Primary Materials', item: p ? 'Floor & Decor AquaGuard Performance Underlayment' : b ? 'TrafficMaster 2mm Foam Underlayment' : 'Roberts AirGuard 5-in-1 Underlayment', brand: p ? 'Floor & Decor' : b ? 'TrafficMaster' : 'Roberts', model: p ? 'AquaGuard 100 sq ft Roll' : b ? '2mm Basic Foam 100 sq ft' : 'AirGuard 70-025 100 sq ft', color_finish: 'N/A', quantity: 3, unit: 'rolls (100 sq ft each)', unit_price: p ? 49 : b ? 15 : 29, finish_tier: tier, estimated_cost_low: p ? 129 : b ? 38 : 75, estimated_cost_high: p ? 159 : b ? 52 : 99, retailer: 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'AquaGuard performance underlayment' : b ? 'TrafficMaster foam underlayment' : 'Roberts AirGuard underlayment')}`, is_diy_friendly: true, install_note: 'Tape seams with underlayment tape. Overlap edges by 2 inches.', sourcing_notes: 'Premium underlayment reduces noise and adds moisture protection.' },
    { category: 'Fixtures & Hardware', item: p ? 'Schluter RENO-T Transition Strip' : b ? 'M-D Building Products Carpet to Tile Transition' : 'M-D Building Products Multi-Floor Transition', brand: p ? 'Schluter' : 'M-D Building Products', model: p ? 'RENO-T Satin Anodized Aluminum' : b ? '36 in. Carpet Gripper' : 'Multi-Floor 36 in.', color_finish: p ? 'Satin Anodized' : 'Satin Nickel', quantity: 3, unit: 'each', unit_price: p ? 29 : b ? 8 : 14, finish_tier: tier, estimated_cost_low: p ? 75 : b ? 20 : 35, estimated_cost_high: p ? 99 : b ? 28 : 48, retailer: 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'Schluter RENO-T transition strip' : 'M-D Building Products floor transition strip')}`, is_diy_friendly: true, install_note: 'Measure doorway widths and cut transitions with a hacksaw for a clean fit.', sourcing_notes: 'You need one transition for every doorway or floor-type change.' },
    { category: 'Fixtures & Hardware', item: p ? 'Stainable Pine Quarter Round Molding' : b ? 'Oatey Quarter Round Shoe Molding' : 'EverTrue Primed MDF Quarter Round', brand: p ? 'Pine' : b ? 'Oatey' : 'EverTrue', model: p ? '3/4 in. x 8 ft Stainable Pine' : b ? '3/4 in. x 8 ft Primed' : '3/4 in. x 8 ft Primed MDF', color_finish: p ? 'Stainable Natural' : 'Primed White', quantity: 12, unit: 'pieces (8 ft each)', unit_price: p ? 6 : b ? 2 : 3.5, finish_tier: tier, estimated_cost_low: p ? 60 : b ? 20 : 35, estimated_cost_high: p ? 80 : b ? 28 : 48, retailer: 'Home Depot', retailer_url: 'https://www.homedepot.com/s/quarter+round+molding', is_diy_friendly: true, install_note: 'Use a brad nailer for fast, clean installation. Nail into the baseboard, not the floor.', sourcing_notes: 'Measure total linear feet of baseboard. Quarter round hides the expansion gap.' },
    { category: 'Tools & Supplies', item: 'DEWALT 12 in. Double-Bevel Compound Miter Saw', brand: 'DEWALT', model: 'DWS716XPS 12 in.', color_finish: 'Yellow / Black', quantity: 1, unit: 'each', unit_price: 349, finish_tier: tier, estimated_cost_low: 299, estimated_cost_high: 379, retailer: 'Home Depot', retailer_url: 'https://www.homedepot.com/s/DEWALT+12+inch+miter+saw', is_diy_friendly: true, install_note: 'Essential for clean 45-degree cuts on transitions and molding. Rent for $50/day if buying isn\'t worth it.', sourcing_notes: 'Rent from Home Depot Tool Rental if you don\'t want to buy.' },
    { category: 'Tools & Supplies', item: 'Roberts 10-26 Pro Pull Bar and Tapping Block Set', brand: 'Roberts', model: '10-26 Pro Flooring Kit', color_finish: 'N/A', quantity: 1, unit: 'kit', unit_price: 19, finish_tier: tier, estimated_cost_low: 15, estimated_cost_high: 22, retailer: 'Home Depot', retailer_url: 'https://www.homedepot.com/s/Roberts+flooring+installation+kit', is_diy_friendly: true, install_note: 'Use the pull bar for the last row against the wall where you can\'t swing a tapping block.', sourcing_notes: 'Essential kit for any click-lock flooring install.' },
    { category: 'Tools & Supplies', item: 'Roberts 1/4 in. Flooring Spacers (48-Pack)', brand: 'Roberts', model: '10-26-48 Spacers', color_finish: 'N/A', quantity: 1, unit: 'pack', unit_price: 6, finish_tier: tier, estimated_cost_low: 5, estimated_cost_high: 8, retailer: 'Home Depot', retailer_url: 'https://www.homedepot.com/s/Roberts+flooring+spacers', is_diy_friendly: true, install_note: 'Place spacers every 12 inches along walls to maintain the expansion gap.', sourcing_notes: 'Critical for floating floors — the expansion gap prevents buckling.' },
  ];
}

function fallbackRoofing(tier: string): LineItem[] {
  const b = tier === 'budget', p = tier === 'premium';
  return [
    { category: 'Primary Materials', item: p ? 'GAF Timberline HDZ Architectural Shingles' : b ? 'Owens Corning Supreme 3-Tab Shingles' : 'Owens Corning Duration Architectural Shingles', brand: p ? 'GAF' : 'Owens Corning', model: p ? 'Timberline HDZ Lifetime' : b ? 'Supreme 25-Year 3-Tab' : 'Duration Lifetime Architectural', color_finish: p ? 'Charcoal' : b ? 'Onyx Black' : 'Brownwood', quantity: 30, unit: 'bundles (covers ~100 sq ft each)', unit_price: p ? 42 : b ? 28 : 35, finish_tier: tier, estimated_cost_low: p ? 1100 : b ? 720 : 900, estimated_cost_high: p ? 1400 : b ? 950 : 1150, retailer: 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'GAF Timberline HDZ shingles' : b ? 'Owens Corning Supreme 3 tab shingles' : 'Owens Corning Duration architectural shingles')}`, is_diy_friendly: false, install_note: 'Roofing is dangerous — hire a licensed roofer. Falls are the #1 construction injury.', sourcing_notes: 'Typical home needs 25-35 bundles. Get an exact square count from your roofer.' },
    { category: 'Primary Materials', item: p ? 'GAF FeltBuster Synthetic Underlayment' : b ? 'GAF 15 lb. Felt Underlayment' : 'GAF Tiger Paw Synthetic Underlayment', brand: 'GAF', model: p ? 'FeltBuster 10 sq Roll' : b ? '15 lb. Felt 4 sq Roll' : 'Tiger Paw 10 sq Roll', color_finish: 'N/A', quantity: p ? 4 : b ? 8 : 4, unit: 'rolls', unit_price: p ? 89 : b ? 22 : 65, finish_tier: tier, estimated_cost_low: p ? 310 : b ? 150 : 220, estimated_cost_high: p ? 390 : b ? 200 : 290, retailer: 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'GAF FeltBuster synthetic underlayment' : b ? 'GAF 15 lb felt underlayment' : 'GAF Tiger Paw synthetic underlayment')}`, is_diy_friendly: false, install_note: 'Underlayment goes down before shingles — it\'s the waterproof barrier.', sourcing_notes: 'Synthetic is lighter, stronger, and lays flatter than felt. Worth the upgrade.' },
    { category: 'Primary Materials', item: 'GAF WeatherWatch Ice & Water Shield', brand: 'GAF', model: 'WeatherWatch 200 sq ft Roll', color_finish: 'N/A', quantity: 2, unit: 'rolls', unit_price: 75, finish_tier: tier, estimated_cost_low: 130, estimated_cost_high: 165, retailer: 'Home Depot', retailer_url: 'https://www.homedepot.com/s/GAF+WeatherWatch+ice+water+shield', is_diy_friendly: false, install_note: 'Required at eaves, valleys, and around penetrations in cold climates.', sourcing_notes: 'Code-required in most northern states. Prevents ice dam leaks.' },
    { category: 'Fixtures & Hardware', item: p ? 'Lomanco Whirlybird Turbine Vent' : b ? 'Master Flow 12 in. Aluminum Roof Vent' : 'GAF Cobra Snow Country Ridge Vent', brand: p ? 'Lomanco' : b ? 'Master Flow' : 'GAF', model: p ? 'BIB14 Whirlybird 14 in.' : b ? 'SSB960A 12 in. Slant Back' : 'Cobra Snow Country 4 ft', color_finish: p ? 'Mill Aluminum' : b ? 'Black' : 'Black', quantity: p ? 2 : b ? 4 : 8, unit: 'each', unit_price: p ? 45 : b ? 18 : 15, finish_tier: tier, estimated_cost_low: p ? 78 : b ? 60 : 100, estimated_cost_high: p ? 100 : b ? 80 : 132, retailer: 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'Lomanco Whirlybird turbine vent' : b ? 'Master Flow aluminum roof vent' : 'GAF Cobra ridge vent')}`, is_diy_friendly: false, install_note: 'Proper ventilation extends shingle life by 20%. Don\'t skip this.', sourcing_notes: 'Ridge vent is the modern standard. Turbines are good for low-slope roofs.' },
    { category: 'Fixtures & Hardware', item: 'Oatey No-Calk Roof Flashing', brand: 'Oatey', model: 'No-Calk 11.25 in. x 15 in.', color_finish: 'Galvanized', quantity: 4, unit: 'each', unit_price: 12, finish_tier: tier, estimated_cost_low: 40, estimated_cost_high: 55, retailer: 'Home Depot', retailer_url: 'https://www.homedepot.com/s/Oatey+No+Calk+roof+flashing', is_diy_friendly: false, install_note: 'Replace all pipe flashings during a re-roof — old rubber boots crack and leak.', sourcing_notes: 'Count your roof penetrations (vent pipes, exhaust fans) to determine quantity.' },
    { category: 'Finishes & Accessories', item: 'Grip-Rite 1-1/4 in. Galvanized Roofing Nails (5 lb.)', brand: 'Grip-Rite', model: '114HGRFG 5 lb. Box', color_finish: 'Galvanized', quantity: 4, unit: 'boxes', unit_price: 12, finish_tier: tier, estimated_cost_low: 40, estimated_cost_high: 55, retailer: 'Home Depot', retailer_url: 'https://www.homedepot.com/s/Grip+Rite+roofing+nails+galvanized', is_diy_friendly: false, install_note: 'Use 4 nails per shingle in normal wind zones, 6 in high-wind zones.', sourcing_notes: 'Galvanized nails resist rust. Never use smooth-shank nails for roofing.' },
    { category: 'Finishes & Accessories', item: p ? 'GAF TimberTex Premium Ridge Cap Shingles' : 'Owens Corning DecoRidge Ridge Cap Shingles', brand: p ? 'GAF' : 'Owens Corning', model: p ? 'TimberTex 20 lin. ft Bundle' : 'DecoRidge 20 lin. ft Bundle', color_finish: p ? 'Charcoal' : 'Brownwood', quantity: 4, unit: 'bundles', unit_price: p ? 65 : 45, finish_tier: tier, estimated_cost_low: p ? 220 : 150, estimated_cost_high: p ? 280 : 200, retailer: 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'GAF TimberTex ridge cap shingles' : 'Owens Corning DecoRidge ridge cap')}`, is_diy_friendly: false, install_note: 'Ridge caps are the finishing touch — they seal the peak and add curb appeal.', sourcing_notes: 'Match ridge cap color to your field shingles for a cohesive look.' },
  ];
}

function fallbackDeckPatio(tier: string): LineItem[] {
  const b = tier === 'budget', p = tier === 'premium';
  return [
    { category: 'Primary Materials', item: p ? 'Trex Transcend Composite Decking' : b ? 'WeatherShield 5/4 x 6 Pressure-Treated Decking' : 'Trex Select Composite Decking', brand: p ? 'Trex' : b ? 'WeatherShield' : 'Trex', model: p ? 'Transcend 1 in. x 5.5 in. x 16 ft' : b ? '5/4 x 6 x 12 ft PT Pine' : 'Select 1 in. x 5.5 in. x 16 ft', color_finish: p ? 'Spiced Rum' : b ? 'Natural Pine (stainable)' : 'Saddle', quantity: 40, unit: 'boards', unit_price: p ? 4.50 : b ? 0.95 : 2.80, finish_tier: tier, estimated_cost_low: p ? 2600 : b ? 550 : 1600, estimated_cost_high: p ? 3200 : b ? 720 : 2000, retailer: 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'Trex Transcend composite decking' : b ? 'WeatherShield pressure treated decking' : 'Trex Select composite decking')}`, is_diy_friendly: true, install_note: 'Pre-drill composite to prevent mushrooming. Use hidden fasteners for a clean look.', sourcing_notes: 'Composite costs more upfront but never needs staining. PT pine needs annual treatment.' },
    { category: 'Primary Materials', item: p ? 'Simpson Strong-Tie 6x6 Post Base' : b ? 'WeatherShield 4x4 x 8 ft PT Post' : 'Simpson Strong-Tie 4x4 Post Base', brand: p ? 'Simpson Strong-Tie' : b ? 'WeatherShield' : 'Simpson Strong-Tie', model: p ? 'ABU66Z 6x6 Adjustable Post Base' : b ? '4x4 x 8 ft #2 PT Pine' : 'ABA44Z 4x4 Adjustable Post Base', color_finish: p ? 'ZMAX Galvanized' : b ? 'Natural PT' : 'ZMAX Galvanized', quantity: p ? 8 : b ? 8 : 8, unit: 'each', unit_price: p ? 32 : b ? 12 : 22, finish_tier: tier, estimated_cost_low: p ? 220 : b ? 80 : 150, estimated_cost_high: p ? 280 : b ? 110 : 195, retailer: 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'Simpson Strong Tie 6x6 post base' : b ? 'WeatherShield 4x4 pressure treated post' : 'Simpson Strong Tie 4x4 post base')}`, is_diy_friendly: true, install_note: 'Set post bases in concrete footings. Check local frost depth requirements.', sourcing_notes: 'Post bases keep wood off concrete and prevent rot. Code-required in most areas.' },
    { category: 'Fixtures & Hardware', item: p ? 'Trex Transcend Composite Railing Kit' : b ? 'WeatherShield 6 ft Cedar-Tone PT Railing Kit' : 'Deckorators ALX Classic Aluminum Railing', brand: p ? 'Trex' : b ? 'WeatherShield' : 'Deckorators', model: p ? 'Transcend 6 ft Rail Kit' : b ? '6 ft Cedar-Tone PT Rail Kit' : 'ALX Classic 6 ft Kit', color_finish: p ? 'Classic White' : b ? 'Cedar Tone' : 'Textured Black', quantity: 6, unit: 'kits', unit_price: p ? 189 : b ? 45 : 99, finish_tier: tier, estimated_cost_low: p ? 990 : b ? 230 : 510, estimated_cost_high: p ? 1250 : b ? 300 : 650, retailer: 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'Trex Transcend railing kit' : b ? 'WeatherShield cedar tone railing kit' : 'Deckorators ALX aluminum railing')}`, is_diy_friendly: true, install_note: 'Railings are code-required for any deck 30+ inches above grade. Check local codes.', sourcing_notes: 'Measure total linear feet of railing needed. Don\'t forget stair sections.' },
    { category: 'Fixtures & Hardware', item: 'GRK RSS Structural Screws (100-Pack)', brand: 'GRK', model: 'RSS 5/16 x 3-1/8 in. 100-Pack', color_finish: 'Climatek Coated', quantity: 3, unit: 'boxes', unit_price: 42, finish_tier: tier, estimated_cost_low: 108, estimated_cost_high: 140, retailer: 'Home Depot', retailer_url: 'https://www.homedepot.com/s/GRK+RSS+structural+screws', is_diy_friendly: true, install_note: 'GRK RSS screws replace lag bolts in most deck connections. No pre-drilling needed.', sourcing_notes: 'The best deck screw on the market. Self-tapping and code-approved for structural use.' },
    { category: 'Finishes & Accessories', item: p ? 'DERA Deck Lighting LED Post Cap Lights (4-Pack)' : b ? 'Hampton Bay Solar LED Post Cap Light' : 'Malibu LED Deck Light (6-Pack)', brand: p ? 'DERA' : b ? 'Hampton Bay' : 'Malibu', model: p ? 'LED Post Cap 4x4 (4-Pack)' : b ? 'Solar LED 4x4 Post Cap' : 'LED Deck Light 6-Pack', color_finish: p ? 'Warm White' : 'Warm White', quantity: p ? 2 : b ? 4 : 1, unit: p ? 'packs of 4' : b ? 'each' : 'pack of 6', unit_price: p ? 89 : b ? 15 : 49, finish_tier: tier, estimated_cost_low: p ? 150 : b ? 50 : 42, estimated_cost_high: p ? 195 : b ? 68 : 55, retailer: 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'LED deck post cap lights' : b ? 'Hampton Bay solar post cap light' : 'Malibu LED deck light')}`, is_diy_friendly: true, install_note: 'Solar post caps need no wiring. Low-voltage LED kits need a transformer.', sourcing_notes: 'Deck lighting dramatically improves nighttime usability and curb appeal.' },
    { category: 'Tools & Supplies', item: 'DEWALT 20V MAX Impact Driver Kit', brand: 'DEWALT', model: 'DCF887D1 20V MAX XR', color_finish: 'Yellow / Black', quantity: 1, unit: 'kit', unit_price: 159, finish_tier: tier, estimated_cost_low: 139, estimated_cost_high: 179, retailer: 'Home Depot', retailer_url: 'https://www.homedepot.com/s/DEWALT+20V+impact+driver+kit', is_diy_friendly: true, install_note: 'An impact driver is essential for driving deck screws. Don\'t use a regular drill.', sourcing_notes: 'Worth owning for any DIY project. Rent from Home Depot if you prefer.' },
  ];
}

function fallbackInteriorPaint(tier: string): LineItem[] {
  const b = tier === 'budget', p = tier === 'premium';
  return [
    { category: 'Primary Materials', item: p ? 'Benjamin Moore Regal Select Interior Paint' : b ? 'Glidden Premium Interior Paint' : 'Behr Ultra Scuff Defense Interior Paint', brand: p ? 'Benjamin Moore' : b ? 'Glidden' : 'Behr', model: p ? 'Regal Select Eggshell 1 Gallon' : b ? 'Premium Eggshell 1 Gallon' : 'Ultra Scuff Defense Eggshell 1 Gallon', color_finish: p ? 'Custom Color Match' : b ? 'White / Off-White' : 'Ultra Pure White (tintable)', quantity: p ? 4 : b ? 3 : 3, unit: 'gallons', unit_price: p ? 79 : b ? 28 : 45, finish_tier: tier, estimated_cost_low: p ? 280 : b ? 72 : 115, estimated_cost_high: p ? 350 : b ? 95 : 150, retailer: p ? 'Benjamin Moore' : 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'Benjamin Moore Regal Select interior paint' : b ? 'Glidden Premium interior paint eggshell' : 'Behr Ultra Scuff Defense interior paint')}`, is_diy_friendly: true, install_note: 'Two coats minimum. Use eggshell for living areas, satin for kitchens and baths.', sourcing_notes: '1 gallon covers ~350 sq ft per coat. Measure your walls to calculate gallons needed.' },
    { category: 'Primary Materials', item: p ? 'Benjamin Moore Advance Interior Trim Paint' : b ? 'Glidden Premium Semi-Gloss Trim Paint' : 'Behr Ultra Semi-Gloss Trim & Door Paint', brand: p ? 'Benjamin Moore' : b ? 'Glidden' : 'Behr', model: p ? 'Advance Semi-Gloss 1 Quart' : b ? 'Premium Semi-Gloss 1 Quart' : 'Ultra Semi-Gloss 1 Quart', color_finish: 'White / Trim White', quantity: 2, unit: 'quarts', unit_price: p ? 32 : b ? 14 : 22, finish_tier: tier, estimated_cost_low: p ? 56 : b ? 24 : 38, estimated_cost_high: p ? 70 : b ? 32 : 48, retailer: p ? 'Benjamin Moore' : 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'Benjamin Moore Advance trim paint' : b ? 'Glidden Premium semi gloss trim paint' : 'Behr Ultra semi gloss trim paint')}`, is_diy_friendly: true, install_note: 'Use semi-gloss on trim for durability and easy cleaning. Sand lightly between coats.', sourcing_notes: 'Benjamin Moore Advance self-levels beautifully — worth the price for trim.' },
    { category: 'Primary Materials', item: p ? 'Zinsser Bulls Eye 1-2-3 Primer' : b ? 'Kilz 2 All-Purpose Primer' : 'Zinsser Bulls Eye 1-2-3 Primer', brand: p ? 'Zinsser' : b ? 'Kilz' : 'Zinsser', model: p ? 'Bulls Eye 1-2-3 1 Gallon' : b ? 'Kilz 2 1 Gallon' : 'Bulls Eye 1-2-3 1 Gallon', color_finish: 'White', quantity: 1, unit: 'gallon', unit_price: p ? 28 : b ? 18 : 28, finish_tier: tier, estimated_cost_low: p ? 24 : b ? 15 : 24, estimated_cost_high: p ? 32 : b ? 22 : 32, retailer: 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'Zinsser Bulls Eye 123 primer' : b ? 'Kilz 2 all purpose primer' : 'Zinsser Bulls Eye 123 primer')}`, is_diy_friendly: true, install_note: 'Always prime bare drywall, patches, and stains. Skip primer on previously painted walls in good condition.', sourcing_notes: 'Zinsser 1-2-3 sticks to almost anything and blocks stains.' },
    { category: 'Tools & Supplies', item: p ? 'Purdy White Dove 9 in. Roller Cover (3-Pack)' : b ? 'Wooster Pro/Doo-Z 9 in. Roller Cover (3-Pack)' : 'Wooster Pro/Doo-Z 9 in. Roller Cover (3-Pack)', brand: p ? 'Purdy' : 'Wooster', model: p ? 'White Dove 3/8 in. Nap 3-Pack' : 'Pro/Doo-Z 3/8 in. Nap 3-Pack', color_finish: 'N/A', quantity: 1, unit: 'pack of 3', unit_price: p ? 22 : b ? 12 : 12, finish_tier: tier, estimated_cost_low: p ? 19 : b ? 10 : 10, estimated_cost_high: p ? 25 : b ? 14 : 14, retailer: 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'Purdy White Dove roller cover' : 'Wooster Pro Doo-Z roller cover')}`, is_diy_friendly: true, install_note: 'Use 3/8" nap for smooth walls, 1/2" for textured. Replace covers between colors.', sourcing_notes: 'Good roller covers make a huge difference. Don\'t cheap out here.' },
    { category: 'Tools & Supplies', item: p ? 'Purdy Clearcut Elite 2.5 in. Angled Brush' : b ? 'Wooster Shortcut 2 in. Angled Brush' : 'Wooster Shortcut 2 in. Angled Brush', brand: p ? 'Purdy' : 'Wooster', model: p ? 'Clearcut Elite 2.5 in.' : 'Shortcut 2 in. Angled', color_finish: 'N/A', quantity: 2, unit: 'each', unit_price: p ? 16 : b ? 8 : 8, finish_tier: tier, estimated_cost_low: p ? 28 : b ? 14 : 14, estimated_cost_high: p ? 35 : b ? 18 : 18, retailer: 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'Purdy Clearcut Elite angled brush' : 'Wooster Shortcut angled brush')}`, is_diy_friendly: true, install_note: 'An angled brush is essential for cutting in along ceilings and trim.', sourcing_notes: 'Clean brushes immediately after use. A good brush lasts years if maintained.' },
    { category: 'Tools & Supplies', item: 'ScotchBlue Original Painter\'s Tape (3-Pack)', brand: 'ScotchBlue', model: 'Original 1.41 in. x 60 yd (3-Pack)', color_finish: 'Blue', quantity: 2, unit: 'packs of 3', unit_price: 15, finish_tier: tier, estimated_cost_low: 26, estimated_cost_high: 34, retailer: 'Home Depot', retailer_url: 'https://www.homedepot.com/s/ScotchBlue+painters+tape+3+pack', is_diy_friendly: true, install_note: 'Press tape edges firmly with a putty knife for sharp lines. Remove within 24 hours.', sourcing_notes: 'The single most important supply for clean paint lines.' },
    { category: 'Tools & Supplies', item: 'Trimaco SuperTuff Canvas Drop Cloth 4 ft x 15 ft', brand: 'Trimaco', model: 'SuperTuff 4 ft x 15 ft', color_finish: 'Natural Canvas', quantity: 2, unit: 'each', unit_price: 18, finish_tier: tier, estimated_cost_low: 30, estimated_cost_high: 40, retailer: 'Home Depot', retailer_url: 'https://www.homedepot.com/s/Trimaco+canvas+drop+cloth', is_diy_friendly: true, install_note: 'Canvas absorbs drips better than plastic. Tape edges to the baseboard.', sourcing_notes: 'Reusable for years. Worth the investment over disposable plastic.' },
    { category: 'Tools & Supplies', item: 'DAP DryDex Spackling with Indicator', brand: 'DAP', model: 'DryDex 16 oz.', color_finish: 'Pink → White (dry indicator)', quantity: 1, unit: 'tub', unit_price: 8, finish_tier: tier, estimated_cost_low: 7, estimated_cost_high: 10, retailer: 'Home Depot', retailer_url: 'https://www.homedepot.com/s/DAP+DryDex+spackling', is_diy_friendly: true, install_note: 'Fill nail holes and small cracks. It goes on pink and turns white when dry — then sand smooth.', sourcing_notes: 'The color-change indicator is genius for knowing when it\'s ready to sand.' },
  ];
}

function fallbackLandscaping(tier: string): LineItem[] {
  const b = tier === 'budget', p = tier === 'premium';
  return [
    { category: 'Primary Materials', item: p ? 'Belgard Mega-Arbel Paver' : b ? 'Pavestone Holland 60mm Paver' : 'Pavestone Rockton 7 in. Natural Concrete Paver', brand: p ? 'Belgard' : 'Pavestone', model: p ? 'Mega-Arbel 15.75 in.' : b ? 'Holland 4x8 60mm' : 'Rockton 7 in. Natural', color_finish: p ? 'Victorian' : b ? 'Charcoal' : 'Yukon', quantity: p ? 200 : 150, unit: 'sq ft', unit_price: p ? 6.50 : b ? 0.58 : 2.50, finish_tier: tier, estimated_cost_low: p ? 1100 : b ? 75 : 320, estimated_cost_high: p ? 1400 : b ? 100 : 420, retailer: 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'Belgard Mega Arbel paver' : b ? 'Pavestone Holland paver charcoal' : 'Pavestone Rockton natural paver')}`, is_diy_friendly: true, install_note: 'Compact the base in 2-inch lifts. Use a plate compactor (rent for $75/day).', sourcing_notes: 'Order 10% extra for cuts. Pavers are sold by the piece — calculate sq ft needed.' },
    { category: 'Primary Materials', item: 'Vigoro Premium Mulch (2 cu ft bags)', brand: 'Vigoro', model: 'Premium Brown Mulch 2 cu ft', color_finish: p ? 'Black' : b ? 'Natural' : 'Brown', quantity: 20, unit: 'bags', unit_price: 3.50, finish_tier: tier, estimated_cost_low: 60, estimated_cost_high: 80, retailer: 'Home Depot', retailer_url: 'https://www.homedepot.com/s/Vigoro+premium+mulch', is_diy_friendly: true, install_note: 'Spread 2-3 inches deep. Keep mulch 3 inches away from plant stems and tree trunks.', sourcing_notes: '1 cu yd covers ~100 sq ft at 3 in. deep. Bags are easier for small areas.' },
    { category: 'Primary Materials', item: p ? 'Proven Winners Supertunia Vista Bubblegum' : b ? 'Vigoro Annual Color Mix (18-Pack)' : 'Monrovia Knock Out Double Red Rose', brand: p ? 'Proven Winners' : b ? 'Vigoro' : 'Monrovia', model: p ? 'Supertunia Vista 4.25 in. pot' : b ? 'Annual Color Mix 18-Pack' : 'Knock Out Double Red 3 gal.', color_finish: p ? 'Bubblegum Pink' : b ? 'Mixed Colors' : 'Double Red', quantity: p ? 12 : b ? 2 : 6, unit: p ? 'pots' : b ? 'packs' : 'plants', unit_price: p ? 6 : b ? 18 : 25, finish_tier: tier, estimated_cost_low: p ? 60 : b ? 30 : 130, estimated_cost_high: p ? 80 : b ? 42 : 165, retailer: 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'Proven Winners Supertunia Vista' : b ? 'Vigoro annual color mix' : 'Knock Out Double Red rose')}`, is_diy_friendly: true, install_note: 'Dig the hole twice as wide as the root ball. Water deeply after planting.', sourcing_notes: 'Knock Out roses are nearly maintenance-free and bloom all season.' },
    { category: 'Fixtures & Hardware', item: p ? 'Rain Bird 32ETI Easy-to-Install Sprinkler System' : b ? 'Orbit 58092 Traveling Sprinkler' : 'Rain Bird 1800 Series Pop-Up Sprinkler (6-Pack)', brand: p ? 'Rain Bird' : b ? 'Orbit' : 'Rain Bird', model: p ? '32ETI In-Ground System' : b ? '58092 Traveling Tractor' : '1804 4 in. Pop-Up 6-Pack', color_finish: 'N/A', quantity: 1, unit: p ? 'system' : 'each', unit_price: p ? 189 : b ? 55 : 35, finish_tier: tier, estimated_cost_low: p ? 165 : b ? 48 : 30, estimated_cost_high: p ? 210 : b ? 62 : 40, retailer: 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'Rain Bird 32ETI sprinkler system' : b ? 'Orbit traveling sprinkler' : 'Rain Bird 1800 pop up sprinkler')}`, is_diy_friendly: true, install_note: 'The Rain Bird 32ETI is a complete DIY sprinkler system — no trenching required.', sourcing_notes: 'Automated watering saves time and keeps plants healthier.' },
    { category: 'Finishes & Accessories', item: p ? 'Kichler 12V LED Landscape Path Light (6-Pack)' : b ? 'Hampton Bay Solar LED Path Light (6-Pack)' : 'Hampton Bay Low-Voltage LED Path Light (6-Pack)', brand: p ? 'Kichler' : 'Hampton Bay', model: p ? '15820AZT 12V LED' : b ? 'Solar LED Pathway 6-Pack' : 'Low-Voltage LED 6-Pack', color_finish: 'Bronze / Warm White', quantity: 1, unit: 'pack of 6', unit_price: p ? 299 : b ? 35 : 79, finish_tier: tier, estimated_cost_low: p ? 260 : b ? 30 : 68, estimated_cost_high: p ? 330 : b ? 40 : 89, retailer: 'Home Depot', retailer_url: `https://www.homedepot.com/s/${encodeURIComponent(p ? 'Kichler LED landscape path light' : b ? 'Hampton Bay solar pathway light' : 'Hampton Bay low voltage LED path light')}`, is_diy_friendly: true, install_note: 'Space path lights 6-8 feet apart. Solar lights need 6+ hours of direct sun.', sourcing_notes: 'Landscape lighting adds safety and dramatic curb appeal at night.' },
    { category: 'Tools & Supplies', item: 'Fiskars 46 in. Steel D-Handle Square Garden Spade', brand: 'Fiskars', model: '46 in. Steel D-Handle Spade', color_finish: 'Black / Orange', quantity: 1, unit: 'each', unit_price: 32, finish_tier: tier, estimated_cost_low: 28, estimated_cost_high: 36, retailer: 'Home Depot', retailer_url: 'https://www.homedepot.com/s/Fiskars+garden+spade', is_diy_friendly: true, install_note: 'A flat-edge spade is essential for edging beds and cutting through sod.', sourcing_notes: 'Fiskars tools have a lifetime warranty.' },
    { category: 'Tools & Supplies', item: 'Vigoro Premium All-Purpose Garden Soil (1 cu ft)', brand: 'Vigoro', model: 'Premium All-Purpose 1 cu ft', color_finish: 'N/A', quantity: 10, unit: 'bags', unit_price: 4, finish_tier: tier, estimated_cost_low: 35, estimated_cost_high: 45, retailer: 'Home Depot', retailer_url: 'https://www.homedepot.com/s/Vigoro+premium+garden+soil', is_diy_friendly: true, install_note: 'Mix 50/50 with native soil when backfilling planting holes.', sourcing_notes: 'Good soil is the foundation of healthy plants. Don\'t skip this.' },
  ];
}

function fallbackMaterials(category: string, style: string, qualityTier: string, estimateMid: number, analysis?: VisionAnalysis) {
  const tier = qualityTier;
  let items: LineItem[];

  switch (category) {
    case 'bathroom': items = fallbackBathroom(tier); break;
    case 'kitchen': items = fallbackKitchen(tier); break;
    case 'flooring': items = fallbackFlooring(tier); break;
    case 'roofing': items = fallbackRoofing(tier); break;
    case 'deck_patio': items = fallbackDeckPatio(tier); break;
    case 'interior_paint': items = fallbackInteriorPaint(tier); break;
    case 'landscaping': items = fallbackLandscaping(tier); break;
    default:
      // For any unknown category, generate a useful generic list
      items = fallbackKitchen(tier); // Kitchen is the most comprehensive fallback
      break;
  }

  const friendlyCategory = category.replace(/_/g, ' ');
  return {
    line_items: items,
    sourcing_notes: `Complete shopping list for a ${tier}-tier ${friendlyCategory} project. All items are real products available at major retailers. Prices are approximate and may vary by location and availability. Add 10-15% for professional installation labor if not doing DIY.`,
  };
}

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = schema.parse(body);
    const analysis = getAnalysis(params.analysis);

    // Optional: describe the concept image for better product matching
    let visualDescription = '';
    if (params.generated_image_url && !params.generated_image_url.startsWith('data:')) {
      try {
        const visionResponse = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: `Describe the visible materials, finishes, colors, and fixtures in this ${params.category} design concept in 3 short sentences. Be specific about brands if recognizable.` },
              { type: 'image', source: { type: 'url', url: params.generated_image_url } },
            ],
          }],
        });
        const content = visionResponse.content[0];
        if (content.type === 'text') visualDescription = content.text;
      } catch (e) {
        console.error('Vision analysis for materials failed:', e);
      }
    }

    let materials: { line_items: unknown[]; sourcing_notes: string };
    try {
      const prompt = buildRealProductsPrompt(params, analysis, visualDescription);

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: 'You are a licensed contractor and materials expert. You know real products, real brands, real prices, and real retailers. Output ONLY valid JSON with no markdown fences.',
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') throw new Error('Unexpected response');
      const jsonStr = content.text.replace(/```(?:json)?\s*/g, '').replace(/```\s*$/g, '').trim();
      materials = JSON.parse(jsonStr) as { line_items: unknown[]; sourcing_notes: string };
    } catch (aiError) {
      console.error('materials ai fallback:', aiError);
      materials = fallbackMaterials(params.category, params.style, params.quality_tier, params.estimate_mid, analysis);
    }

    // Check if materials already exist for this project (for regeneration)
    const { data: existing } = await supabaseAdmin
      .from('material_lists')
      .select('id')
      .eq('project_id', params.project_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let data;
    if (existing) {
      // Update existing materials
      const { data: updated, error } = await supabaseAdmin
        .from('material_lists')
        .update({
          line_items: materials.line_items,
          sourcing_notes: materials.sourcing_notes,
        })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      data = updated;
    } else {
      // Insert new materials
      const { data: inserted, error } = await supabaseAdmin
        .from('material_lists')
        .insert({
          project_id: params.project_id,
          line_items: materials.line_items,
          sourcing_notes: materials.sourcing_notes,
        })
        .select()
        .single();
      if (error) throw error;
      data = inserted;
    }

    await supabaseAdmin.from('projects').update({ status: 'materials_generated' }).eq('id', params.project_id);

    return NextResponse.json({ materials: data });
  } catch (error) {
    console.error('materials error:', error);
    return NextResponse.json({ error: 'Failed to generate materials list' }, { status: 500 });
  }
}
