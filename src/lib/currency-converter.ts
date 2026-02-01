import { SUPPORTED_CURRENCIES } from './web3-config'

/**
 * Currency conversion utility
 * Fetches real-time exchange rates and converts between fiat and USDC
 */

// Mock exchange rates for MVP
//In production, fetch from API like CoinGecko or Binance
const MOCK_RATES: Record<string, number> = {
    INR: 90.42, // 1 USDC = 90.42 INR
    USD: 1.00, // 1 USDC = 1 USD
    BRL: 5.62, // 1 USDC = 5.62 BRL
    EUR: 0.94, // 1 USDC  = 0.94 EUR
}

/**
 * Convert fiat amount to USDC
 */
export function fiatToUsdc(amount: number, currencyCode: string): number {
    const rate = MOCK_RATES[currencyCode] || MOCK_RATES.USD
    return amount / rate
}

/**
 * Convert USDC amount to fiat
 */
export function usdcToFiat(amount: number, currencyCode: string): number {
    const rate = MOCK_RATES[currencyCode] || MOCK_RATES.USD
    return amount * rate
}

/**
 * Get exchange rate for a currency
 */
export function getExchangeRate(currencyCode: string): number {
    return MOCK_RATES[currencyCode] || MOCK_RATES.USD
}

/**
 * Format amount with currency symbol
 */
export function formatCurrency(amount: number, currencyCode: string): string {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode)
    const symbol = currency?.symbol || '$'

    return `${symbol}${amount.toFixed(2)}`
}

/**
 * Format USDC amount
 */
export function formatUsdc(amount: number): string {
    return `${amount.toFixed(2)} USDC`
}
