'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, ExternalLink, Package, Tag, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MaterialItem {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  link: string;
  store: 'home_depot' | 'lowes' | 'amazon';
  category: string;
}

interface MaterialsCartProps {
  projectDescription: string;
  className?: string;
}

export default function MaterialsCart({ projectDescription, className }: MaterialsCartProps) {
  const [cartItems, setCartItems] = useState<MaterialItem[]>([
    {
      id: '1',
      name: 'Premium Paint Brush Set',
      description: 'Professional-grade brushes for smooth finish',
      price: 24.99,
      quantity: 1,
      link: 'https://www.homedepot.com/p/Husky-2-in-Paint-Brush-Set-2-Piece-HD21002PS/322086142',
      store: 'home_depot',
      category: 'Tools',
    },
    {
      id: '2',
      name: 'Interior Paint (Gallon)',
      description: 'Eggshell finish, washable, low VOC',
      price: 42.99,
      quantity: 2,
      link: 'https://www.homedepot.com/p/BEHR-PREMIUM-PLUS-1-gal-430E-2C-Sail-Cloth-Eggshell-Interior-Paint-and-Primer-430E-2C/205451753',
      store: 'home_depot',
      category: 'Paint & Supplies',
    },
    {
      id: '3',
      name: 'Painters Tape',
      description: '2-inch width, clean removal',
      price: 8.49,
      quantity: 3,
      link: 'https://www.homedepot.com/p/ScotchBlue-2-in-x-60-yds-Original-Multi-Surface-Painters-Tape-2090-48/100087261',
      store: 'home_depot',
      category: 'Paint & Supplies',
    },
    {
      id: '4',
      name: 'Drop Cloths',
      description: 'Canvas, 9x12 feet, reusable',
      price: 29.99,
      quantity: 2,
      link: 'https://www.homedepot.com/p/Husky-9-ft-x-12-ft-Canvas-Drop-Cloth-HD912CC/205451968',
      store: 'home_depot',
      category: 'Protection',
    },
    {
      id: '5',
      name: 'Paint Tray Set',
      description: 'Includes tray, liner, and grid',
      price: 12.99,
      quantity: 1,
      link: 'https://www.homedepot.com/p/Husky-9-in-Paint-Tray-Set-HD9PTS/322086143',
      store: 'home_depot',
      category: 'Tools',
    },
    {
      id: '6',
      name: 'Sandpaper Assortment',
      description: 'Various grits for surface prep',
      price: 14.99,
      quantity: 1,
      link: 'https://www.homedepot.com/p/3M-Pro-Grade-Precision-120-150-220-Grit-Sandpaper-30-Sheet-Assortment-02551/205451854',
      store: 'home_depot',
      category: 'Prep Materials',
    },
    {
      id: '7',
      name: 'Paint Stirrers',
      description: 'Pack of 50, wooden',
      price: 4.99,
      quantity: 1,
      link: 'https://www.homedepot.com/p/Husky-50-Pack-Wood-Paint-Stirrers-HD50PS/322086144',
      store: 'home_depot',
      category: 'Paint & Supplies',
    },
    {
      id: '8',
      name: 'Safety Glasses',
      description: 'Anti-fog, comfortable fit',
      price: 9.99,
      quantity: 1,
      link: 'https://www.homedepot.com/p/3M-Safety-Glasses-Clear-Anti-Fog-Lens-Teardrop-Style-14362/205451932',
      store: 'home_depot',
      category: 'Safety',
    },
  ]);

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCartItems(items =>
      items.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax
  const estimatedShipping = 0; // Free shipping over $45
  const total = subtotal + tax + estimatedShipping;

  const storeLogos = {
    home_depot: 'HD',
    lowes: 'LOWES',
    amazon: 'AMZ',
  };

  const storeColors = {
    home_depot: 'bg-orange-100 text-orange-700',
    lowes: 'bg-blue-100 text-blue-700',
    amazon: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-white p-6 shadow-lg', className)}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-100 p-2.5">
            <ShoppingCart className="h-6 w-6 text-emerald-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Your DIY Shopping List</h2>
            <p className="text-sm text-slate-600">
              Naili-curated materials for: "{projectDescription.substring(0, 60)}..."
            </p>
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      <div className="mb-6 grid gap-4">
        {cartItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="rounded-xl border border-slate-200 p-4 hover:border-slate-300"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-slate-100 p-2">
                    <Package className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{item.name}</h3>
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        storeColors[item.store]
                      )}>
                        {storeLogos[item.store]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                    <div className="mt-2 flex items-center gap-4">
                      <span className="text-lg font-bold text-slate-900">
                        ${item.price.toFixed(2)}
                      </span>
                      <span className="text-sm text-slate-500">{item.category}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-slate-100"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-slate-100"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            {/* Item Total */}
            <div className="mt-3 border-t border-slate-100 pt-3 text-right">
              <span className="text-sm font-medium text-slate-700">
                Item total: <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Order Summary */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Order Summary</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-600">Subtotal ({cartItems.length} items)</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-slate-600">Estimated tax</span>
            <span className="font-medium">${tax.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-slate-500" />
              <span className="text-slate-600">Shipping</span>
            </div>
            <span className="font-medium text-emerald-600">
              {subtotal > 45 ? 'FREE' : '$9.99'}
            </span>
          </div>

          <div className="border-t border-slate-300 pt-3">
            <div className="flex justify-between">
              <span className="text-lg font-semibold text-slate-900">Total</span>
              <div>
                <div className="text-2xl font-bold text-slate-900">${total.toFixed(2)}</div>
                <p className="text-right text-sm text-slate-500">USD</p>
              </div>
            </div>
          </div>
        </div>

        {/* Savings Note */}
        <div className="mt-4 rounded-lg bg-emerald-50 p-3">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">
              You're saving ~${Math.round(total * 0.4).toLocaleString()} vs. professional installation
            </span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <a
            href="https://www.homedepot.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 font-semibold text-white transition-all hover:bg-orange-700 hover:shadow-lg"
          >
            <ShoppingCart className="h-5 w-5" />
            Checkout at Home Depot
          </a>
          
          <button
            onClick={() => {
              // In a real app, this would save the cart
              alert('Cart saved to your Naili Vision Board!');
            }}
            className="rounded-xl border-2 border-slate-300 bg-white py-3 font-semibold text-slate-800 transition-all hover:border-slate-400 hover:bg-slate-50"
          >
            Save Cart for Later
          </button>
        </div>

        {/* Disclaimer */}
        <p className="mt-4 text-xs text-slate-500">
          Prices are estimates and may vary by location. Naili earns affiliate commission on purchases made through these links, which helps keep the platform free for homeowners.
        </p>
      </div>

      {/* Additional Tips */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-[#f8fbff] p-5">
        <h4 className="mb-3 font-semibold text-slate-900">DIY Success Tips</h4>
        <ul className="space-y-2 text-sm text-slate-700">
          <li className="flex gap-2">
            <span className="text-[#1f7cf7]">•</span>
            <span>Watch tutorial videos for each step before starting</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#1f7cf7]">•</span>
            <span>Prep is 80% of a good paint job - don't rush surface cleaning</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#1f7cf7]">•</span>
            <span>Buy 10-15% more paint than calculated for touch-ups</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#1f7cf7]">•</span>
            <span>Work in natural light for best color accuracy</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
