import * as z from 'zod';
import type { PriceTier } from '@/constants/mock-api';

const TIER_LINE = /^\d+\s*[:x×]\s*\d+(\.\d+)?$/;

export const productSchema = z.object({
  brand: z.string().min(1, 'Brand is required.'),
  model: z.string().min(1, 'Model is required.'),
  puffs: z.number({ message: 'Puffs is required' }).int().nonnegative(),
  category: z.string().min(1, 'Please select a category'),
  description: z.string(),
  /** Flavors, comma or newline separated. */
  flavorsText: z.string().min(1, 'Enter at least one flavor (comma or newline separated).'),
  /** Wholesale tiers, one `MOQ:price` per line, e.g. `400:4.66`. */
  tiersText: z
    .string()
    .min(1, 'Enter at least one price tier.')
    .refine(
      (value) =>
        value
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .every((line) => TIER_LINE.test(line)),
      'Each line must be `MOQ:price`, e.g. `400:4.66`.'
    ),
  active: z.boolean()
});

export type ProductFormValues = {
  brand: string;
  model: string;
  puffs: number | undefined;
  category: string;
  description: string;
  flavorsText: string;
  tiersText: string;
  active: boolean;
};

export function parseFlavors(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseTiers(text: string): PriceTier[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [moq, price] = line.split(/[:x×]/);
      return { moq: Number(moq.trim()), price_eur: Number(price.trim()) };
    })
    .sort((a, b) => a.moq - b.moq);
}

export function formatTiers(tiers: PriceTier[]): string {
  return tiers.map((t) => `${t.moq}:${t.price_eur}`).join('\n');
}
