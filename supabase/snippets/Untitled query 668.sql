
CREATE TABLE IF NOT EXISTS content_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id uuid REFERENCES content_items(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES auth.users(id),
  new_status text NOT NULL,
  comment text,
  created_at timestamptz DEFAULT now()
);

NOTIFY pgrst, 'reload schema';
