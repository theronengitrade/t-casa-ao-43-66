-- Add missing DELETE policy for messages table
CREATE POLICY "Users can delete messages they sent" 
ON public.messages 
FOR DELETE 
USING (auth.uid() = sender_id);