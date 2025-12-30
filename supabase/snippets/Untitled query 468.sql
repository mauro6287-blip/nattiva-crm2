SELECT order_code, status, amount_expected, raw_proof 
FROM public.payment_orders 
WHERE order_code = 'TICKET-3589';