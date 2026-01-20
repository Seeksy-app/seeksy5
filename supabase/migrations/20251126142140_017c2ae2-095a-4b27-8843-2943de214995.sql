-- Create legal_documents table for creator-managed legal content
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('privacy_policy', 'terms_conditions')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own legal documents"
ON public.legal_documents
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own legal documents"
ON public.legal_documents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own legal documents"
ON public.legal_documents
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own legal documents"
ON public.legal_documents
FOR DELETE
USING (auth.uid() = user_id);

-- Add legal document references to proposals and invoices
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS privacy_policy_id UUID REFERENCES public.legal_documents(id),
ADD COLUMN IF NOT EXISTS terms_conditions_id UUID REFERENCES public.legal_documents(id);

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS privacy_policy_id UUID REFERENCES public.legal_documents(id),
ADD COLUMN IF NOT EXISTS terms_conditions_id UUID REFERENCES public.legal_documents(id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_legal_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_legal_documents_updated_at
BEFORE UPDATE ON public.legal_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_legal_documents_updated_at();