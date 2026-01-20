-- Drop existing policies
DROP POLICY IF EXISTS tenant_edit_doc_instances ON doc_instances;
DROP POLICY IF EXISTS tenant_view_doc_instances ON doc_instances;

-- Create proper SELECT policy
CREATE POLICY "tenant_view_doc_instances" ON doc_instances
  FOR SELECT
  USING (has_tenant_role(tenant_id, 'viewer'::tenant_role));

-- Create INSERT policy  
CREATE POLICY "tenant_insert_doc_instances" ON doc_instances
  FOR INSERT
  WITH CHECK (has_tenant_role(tenant_id, 'editor'::tenant_role));

-- Create UPDATE policy
CREATE POLICY "tenant_update_doc_instances" ON doc_instances
  FOR UPDATE
  USING (has_tenant_role(tenant_id, 'editor'::tenant_role))
  WITH CHECK (has_tenant_role(tenant_id, 'editor'::tenant_role));

-- Create DELETE policy
CREATE POLICY "tenant_delete_doc_instances" ON doc_instances
  FOR DELETE
  USING (has_tenant_role(tenant_id, 'editor'::tenant_role));