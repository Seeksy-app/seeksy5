-- Drop existing policies
DROP POLICY IF EXISTS tenant_edit_doc_signers ON doc_signers;
DROP POLICY IF EXISTS tenant_view_doc_signers ON doc_signers;

-- Create proper SELECT policy
CREATE POLICY "tenant_view_doc_signers" ON doc_signers
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM doc_instances di
    WHERE di.id = doc_signers.doc_instance_id 
    AND has_tenant_role(di.tenant_id, 'viewer'::tenant_role)
  ));

-- Create INSERT policy  
CREATE POLICY "tenant_insert_doc_signers" ON doc_signers
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM doc_instances di
    WHERE di.id = doc_signers.doc_instance_id 
    AND has_tenant_role(di.tenant_id, 'editor'::tenant_role)
  ));

-- Create UPDATE policy
CREATE POLICY "tenant_update_doc_signers" ON doc_signers
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM doc_instances di
    WHERE di.id = doc_signers.doc_instance_id 
    AND has_tenant_role(di.tenant_id, 'editor'::tenant_role)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM doc_instances di
    WHERE di.id = doc_signers.doc_instance_id 
    AND has_tenant_role(di.tenant_id, 'editor'::tenant_role)
  ));

-- Create DELETE policy
CREATE POLICY "tenant_delete_doc_signers" ON doc_signers
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM doc_instances di
    WHERE di.id = doc_signers.doc_instance_id 
    AND has_tenant_role(di.tenant_id, 'editor'::tenant_role)
  ));