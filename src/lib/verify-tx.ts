// Verificación on-chain de transacciones cripto

interface TxVerification {
  valid: boolean
  confirmed: boolean
  amount?: number
  from?: string
  to?: string
  error?: string
}

// Verificar TX en TronGrid (USDT TRC20)
async function verifyTRC20(txHash: string, expectedAmount: number, walletTo: string): Promise<TxVerification> {
  try {
    const res = await fetch(`https://apilist.tronscanapi.com/api/transaction-info?hash=${txHash}`, {
      headers: { 'TRON-PRO-API-KEY': process.env.TRONGRID_API_KEY || '' }
    })
    const data = await res.json()

    if (!data || data.retCode !== 0) return { valid: false, confirmed: false, error: 'TX no encontrada en TronGrid' }
    if (data.confirmations < 20) return { valid: false, confirmed: false, error: `TX con solo ${data.confirmations} confirmaciones` }

    // Verificar token transfers
    const transfers = data.tokenTransferInfo || []
    const usdtTransfer = transfers.find((t: any) =>
      t.contract_address === 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' // USDT TRC20
    )
    if (!usdtTransfer) return { valid: false, confirmed: false, error: 'No se encontró transferencia USDT TRC20' }

    const amount = Number(usdtTransfer.amount_str) / 1e6
    const toAddress = usdtTransfer.to_address

    if (toAddress.toLowerCase() !== walletTo.toLowerCase()) {
      return { valid: false, confirmed: false, error: 'Wallet destino no coincide' }
    }
    if (amount < expectedAmount * 0.99) { // 1% tolerancia por fees
      return { valid: false, confirmed: false, error: `Monto insuficiente: ${amount} USDT (esperado: ${expectedAmount})` }
    }

    return { valid: true, confirmed: true, amount, from: usdtTransfer.from_address, to: toAddress }
  } catch (e) {
    return { valid: false, confirmed: false, error: 'Error verificando en TronGrid' }
  }
}

// Verificar TX en BSCScan (USDT BEP20)
async function verifyBEP20(txHash: string, expectedAmount: number, walletTo: string): Promise<TxVerification> {
  try {
    const apiKey = process.env.BSCSCAN_API_KEY || ''
    const USDT_CONTRACT = '0x55d398326f99059ff775485246999027b3197955'
    const url = `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${USDT_CONTRACT}&address=${walletTo}&apikey=${apiKey}`

    const res = await fetch(url)
    const data = await res.json()

    if (data.status !== '1') return { valid: false, confirmed: false, error: 'No se encontraron transacciones BEP20' }

    const tx = data.result?.find((t: any) => t.hash.toLowerCase() === txHash.toLowerCase())
    if (!tx) return { valid: false, confirmed: false, error: 'TX no encontrada en BSCScan' }

    const confirmations = Number(tx.confirmations)
    if (confirmations < 15) return { valid: false, confirmed: false, error: `Solo ${confirmations} confirmaciones` }

    const amount = Number(tx.value) / 1e18
    if (amount < expectedAmount * 0.99) {
      return { valid: false, confirmed: false, error: `Monto insuficiente: ${amount} USDT` }
    }

    return { valid: true, confirmed: true, amount, from: tx.from, to: tx.to }
  } catch (e) {
    return { valid: false, confirmed: false, error: 'Error verificando en BSCScan' }
  }
}

export async function verifyTransaction(
  txHash: string,
  network: string,
  expectedAmount: number,
  walletTo: string
): Promise<TxVerification> {
  if (!txHash || txHash.length < 10) return { valid: false, confirmed: false, error: 'Hash inválido' }

  const net = network.toLowerCase()
  if (net.includes('trc20') || net.includes('tron')) {
    return verifyTRC20(txHash, expectedAmount, walletTo)
  }
  if (net.includes('bep20') || net.includes('bsc') || net.includes('binance')) {
    return verifyBEP20(txHash, expectedAmount, walletTo)
  }

  // Fallback: verificación manual
  return { valid: true, confirmed: true, error: 'Red no soportada para verificación automática — verificar manualmente' }
}
