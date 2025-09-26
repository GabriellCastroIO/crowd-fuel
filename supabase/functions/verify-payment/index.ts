import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentVerificationRequest {
  handle: string;
  transaction_nsu: string;
  external_order_nsu: string;
  slug: string;
}

interface PaymentVerificationResponse {
  success: boolean;
  paid: boolean;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { handle, transaction_nsu, external_order_nsu, slug }: PaymentVerificationRequest = await req.json()

    // Validate required parameters
    if (!handle || !transaction_nsu || !external_order_nsu || !slug) {
      return new Response(
        JSON.stringify({
          error: 'Missing required parameters: handle, transaction_nsu, external_order_nsu, slug'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Build InfinitePay verification URL
    const url = `https://api.infinitepay.io/invoices/public/checkout/payment_check/${handle}`
    const params = new URLSearchParams({
      transaction_nsu,
      external_order_nsu,
      slug
    })

    console.log('Verifying payment with InfinitePay:', { handle, transaction_nsu, external_order_nsu, slug })

    // Make request to InfinitePay API
    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('InfinitePay API error:', response.status, response.statusText)
      return new Response(
        JSON.stringify({
          error: `Payment verification failed: ${response.status}`,
          success: false,
          paid: false
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const verificationResult: PaymentVerificationResponse = await response.json()
    console.log('Payment verification result:', verificationResult)

    return new Response(
      JSON.stringify(verificationResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error verifying payment:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        success: false,
        paid: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})