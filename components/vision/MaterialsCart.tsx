'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, ExternalLink, Package, Tag, Truck, Copy, Check, Home, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProject } from '@/lib/ProjectContext';

interface MaterialsCartProps {
  className?: string;
}

export default function MaterialsCart({ className }: MaterialsCartProps) {
  const { state } = useProject();
  const [cartItems, setCartItems] = useState(state.materialsList || []);
  const [copied, setCopied] = useState(false);

  // Store logos and colors
  const STORE_INFO = {
    home_depot: {
      name: 'Home Depot',
      color: 'bg-orange-500',
      icon: <Home className="h-3 w-3" />,
      favicon: '🟧',
    },
    lowes: {
      name: 'Lowe\'s',
      color: 'bg-blue-600',
      icon: <ShoppingBag className="h-3 w-3" />,
      favicon: '🟦',
    },
    amazon: {
      name: 'Amazon',
      color: 'bg-yellow-500',
      icon: <Package className="h-3 w-3" />,
      favicon: '📦',
    },
  };

  const updateQuantity = (id: string, change: number) => {
    setCartItems(items =>
      items.map(item =>
        item.name === id
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCartItems(items => items.filter(item => item.name !== id));
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const copyChecklist = async () => {
    const checklist = cartItems
      .map(item => `[ ] ${item.name} - $${item.price.toFixed(2)} x ${item.quantity}`)
      .join('\n');
    
    try {
      await navigator.clipboard.writeText(checklist);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const openAllLinks = () => {
    cartItems.forEach(item => {
      window.open(item.link, '_blank', 'noopener,noreferrer,sponsored');
    });
  };

  return (
    <div className={cn('', className)}>
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 px-4 py-2">
          <ShoppingCart className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-700">DIY SHOPPING LIST</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Your Materials Cart</h2>
        <p className="mt-2 text-slate-600">
          Curated items for your project. Prices updated daily from local retailers.
        </p>
      </div>

      {/* Action buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={copyChecklist}
          className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 transition-all hover:scale-[1.02] hover:bg-slate-50"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-500" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Copy as Checklist</span>
            </>
          )}
        </button>
        
        <button
          onClick={openAllLinks}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#FF6B35] px-4 py-2.5 font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-lg"
        >
          <ExternalLink className="h-4 w-4" />
          <span>Open All Retailer Links</span>
        </button>
      </div>

      {/* Materials list */}
      <div className="space-y-4">
        {cartItems.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {/* Left side: Item info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{item.name}</h3>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white ${STORE_INFO[item.retailer].color}`}
                      >
                        {STORE_INFO[item.retailer].favicon}
                        <span className="hidden sm:inline">{STORE_INFO[item.retailer].name}</span>
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      ${item.price.toFixed(2)} each
                    </p>
                  </div>
                  
                  {/* Price */}
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-900 tabular-nums">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                    <div className="text-sm text-slate-500">
                      {item.quantity} × ${item.price.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Quantity controls */}
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.name, -1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-slate-100"
                      aria-label={`Decrease quantity of ${item.name}`}
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.name, 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-slate-100"
                      aria-label={`Increase quantity of ${item.name}`}
                    >
                      +
                    </button>
                  </div>
                  
                  <button
                    onClick={() => removeItem(item.name)}
                    className="text-sm font-medium text-rose-600 hover:text-rose-700"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Right side: Action buttons */}
              <div className="flex flex-col gap-2 sm:w-48">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-white transition-all hover:scale-[1.02] hover:bg-slate-800"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>View on {STORE_INFO[item.retailer].name}</span>
                </a>
                
                <div className="text-center text-xs text-slate-500">
                  Affiliate link • Opens in new tab
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Total and summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-6"
      >
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Cart Summary</h3>
            <p className="text-sm text-slate-600">
              {cartItems.length} items • Estimated local pickup/delivery
            </p>
          </div>
          
          <div className="text-center sm:text-right">
            <div className="text-3xl font-bold text-slate-900 tabular-nums">
              ${totalPrice.toFixed(2)}
            </div>
            <div className="text-sm text-slate-600">Estimated total before tax</div>
          </div>
        </div>

        {/* Retailer breakdown */}
        <div className="mt-6">
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Retailer Breakdown
          </h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Object.entries(STORE_INFO).map(([storeKey, store]) => {
              const storeItems = cartItems.filter(item => item.retailer === storeKey);
              const storeTotal = storeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
              
              if (storeItems.length === 0) return null;
              
              return (
                <div key={storeKey} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2">
                    <div className={`rounded-lg p-1.5 ${store.color} text-white`}>
                      {store.icon}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{store.name}</div>
                      <div className="text-sm text-slate-600">
                        {storeItems.length} item{storeItems.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-right text-lg font-bold tabular-nums">
                    ${storeTotal.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 rounded-xl bg-slate-100 p-4">
          <div className="flex items-start gap-3">
            <Tag className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" />
            <div>
              <p className="text-sm text-slate-700">
                <strong>Note:</strong> Prices are estimates from local retailers and may vary.
                Naili earns a small commission on purchases made through these links, which helps
                keep the platform free for homeowners.
              </p>
              <p className="mt-2 text-sm text-slate-600">
                All links open in new tabs with proper affiliate disclosure.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Empty state */}
      {cartItems.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto max-w-sm">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <ShoppingCart className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-slate-900">Your cart is empty</h3>
            <p className="text-slate-600">
              Add materials to your cart from the project plan to get started with your DIY shopping.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
