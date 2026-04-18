import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_placeholder', { apiVersion: '2025-04-30.basil' });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  const stripe = getStripe();

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err) {
    console.error('Stripe webhook error:', err);
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 });
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const status = subscription.status;
      const plan = status === 'active' ? 'pro' : 'free';

      await supabaseAdmin
        .from('homeowners')
        .update({ plan, updated_at: new Date().toISOString() })
        .eq('stripe_customer_id', customerId);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      await supabaseAdmin
        .from('homeowners')
        .update({ plan: 'free', updated_at: new Date().toISOString() })
        .eq('stripe_customer_id', customerId);
      break;
    }

    case 'checkout.session.completed': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const session = event.data.object as any;
      const customerId = session.customer as string;
      const customerEmail = session.customer_details?.email;

      if (customerEmail && customerId) {
        await supabaseAdmin
          .from('homeowners')
          .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
          .eq('email', customerEmail);
      }
      break;
    }

    default:
      console.log(`Unhandled Stripe event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
