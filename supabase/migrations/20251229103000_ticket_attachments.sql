-- 1. Create Storage Bucket for Ticket Attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS Policies
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'ticket-attachments' );

-- Allow public access to view attachments (simplifies displaying in chat)
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'ticket-attachments' );

-- 3. Update ticket_messages table
ALTER TABLE public.ticket_messages
ADD COLUMN IF NOT EXISTS attachments jsonb[] DEFAULT '{}';
