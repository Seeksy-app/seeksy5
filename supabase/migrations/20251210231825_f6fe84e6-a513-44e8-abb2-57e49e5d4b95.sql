-- Create function to auto-create notification when knowledge article is added
CREATE OR REPLACE FUNCTION public.notify_new_knowledge_article()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.board_notifications (title, message, type, related_entity_id, related_entity_type)
  VALUES (
    'New Knowledge Article',
    COALESCE(NEW.title, 'A new article') || ' has been published',
    'document',
    NEW.id,
    'knowledge_articles'
  );
  RETURN NEW;
END;
$$;

-- Trigger for new knowledge articles
CREATE TRIGGER on_knowledge_article_created
  AFTER INSERT ON public.knowledge_articles
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_knowledge_article();

-- Create function to auto-create notification when CFO pro forma version is saved
CREATE OR REPLACE FUNCTION public.notify_cfo_proforma_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.board_notifications (title, message, type, related_entity_id, related_entity_type)
  VALUES (
    'New Pro Forma Published',
    'CFO has published ' || COALESCE(NEW.version_name, 'updated projections'),
    'proforma_update',
    NEW.id,
    'cfo_proforma_versions'
  );
  RETURN NEW;
END;
$$;

-- Trigger for CFO pro forma updates
CREATE TRIGGER on_cfo_proforma_version_created
  AFTER INSERT ON public.cfo_proforma_versions
  FOR EACH ROW EXECUTE FUNCTION public.notify_cfo_proforma_update();