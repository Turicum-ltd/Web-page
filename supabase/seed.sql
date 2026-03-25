insert into document_types (code, label, default_category) values ('term_sheet', 'Term Sheet', 'core_legal') on conflict (code) do update set label = excluded.label, default_category = excluded.default_category;

insert into document_types (code, label, default_category) values ('commercial_application', 'Commercial Application', 'core_legal') on conflict (code) do update set label = excluded.label, default_category = excluded.default_category;

insert into document_types (code, label, default_category) values ('borrower_authorization', 'Borrower Authorization', 'core_legal') on conflict (code) do update set label = excluded.label, default_category = excluded.default_category;

insert into document_types (code, label, default_category) values ('promissory_note', 'Promissory Note', 'core_legal') on conflict (code) do update set label = excluded.label, default_category = excluded.default_category;

insert into document_types (code, label, default_category) values ('mortgage', 'Mortgage', 'title_recorded') on conflict (code) do update set label = excluded.label, default_category = excluded.default_category;

insert into document_types (code, label, default_category) values ('mortgage_or_deed_of_trust', 'Mortgage or Deed of Trust', 'title_recorded') on conflict (code) do update set label = excluded.label, default_category = excluded.default_category;

insert into document_types (code, label, default_category) values ('mortgage_modification', 'Mortgage Modification', 'title_recorded') on conflict (code) do update set label = excluded.label, default_category = excluded.default_category;

insert into document_types (code, label, default_category) values ('purchase_agreement', 'Purchase Agreement', 'core_legal') on conflict (code) do update set label = excluded.label, default_category = excluded.default_category;

insert into document_types (code, label, default_category) values ('option_agreement', 'Option Agreement', 'core_legal') on conflict (code) do update set label = excluded.label, default_category = excluded.default_category;

insert into document_types (code, label, default_category) values ('lease_agreement', 'Lease Agreement', 'core_legal') on conflict (code) do update set label = excluded.label, default_category = excluded.default_category;

insert into document_types (code, label, default_category) values ('warranty_deed', 'Warranty Deed', 'title_recorded') on conflict (code) do update set label = excluded.label, default_category = excluded.default_category;

insert into document_types (code, label, default_category) values ('closing_statement', 'Closing Statement', 'closing_settlement') on conflict (code) do update set label = excluded.label, default_category = excluded.default_category;

insert into document_types (code, label, default_category) values ('closing_package', 'Closing Package', 'closing_settlement') on conflict (code) do update set label = excluded.label, default_category = excluded.default_category;

insert into document_types (code, label, default_category) values ('closing_instructions', 'Closing Instructions', 'funding_escrow') on conflict (code) do update set label = excluded.label, default_category = excluded.default_category;

insert into document_types (code, label, default_category) values ('title_commitment', 'Title Commitment', 'title_recorded') on conflict (code) do update set label = excluded.label, default_category = excluded.default_category;

insert into document_types (code, label, default_category) values ('title_policy', 'Title Policy', 'title_recorded') on conflict (code) do update set label = excluded.label, default_category = excluded.default_category;

insert into document_types (code, label, default_category) values ('marked_up_title', 'Marked-Up Title', 'title_recorded') on conflict (code) do update set label = excluded.label, default_category = excluded.default_category;

insert into document_types (code, label, default_category) values ('jv_agreement', 'JV Agreement', 'entity_jv') on conflict (code) do update set label = excluded.label, default_category = excluded.default_category;

insert into document_types (code, label, default_category) values ('disposition_agreement', 'Disposition Agreement', 'entity_jv') on conflict (code) do update set label = excluded.label, default_category = excluded.default_category;

insert into document_types (code, label, default_category) values ('operating_agreement', 'Operating Agreement', 'entity_jv') on conflict (code) do update set label = excluded.label, default_category = excluded.default_category;

insert into document_types (code, label, default_category) values ('articles_of_organization', 'Articles of Organization', 'entity_jv') on conflict (code) do update set label = excluded.label, default_category = excluded.default_category;

insert into document_types (code, label, default_category) values ('insurance_certificate', 'Insurance Certificate', 'insurance_support') on conflict (code) do update set label = excluded.label, default_category = excluded.default_category;

insert into document_types (code, label, default_category) values ('payment_authorization', 'Payment Authorization', 'funding_escrow') on conflict (code) do update set label = excluded.label, default_category = excluded.default_category;

insert into document_types (code, label, default_category) values ('wiring_instructions', 'Wiring Instructions', 'funding_escrow') on conflict (code) do update set label = excluded.label, default_category = excluded.default_category;

insert into document_types (code, label, default_category) values ('acknowledgment', 'Acknowledgment', 'core_legal') on conflict (code) do update set label = excluded.label, default_category = excluded.default_category;

insert into document_types (code, label, default_category) values ('affidavit', 'Affidavit', 'core_legal') on conflict (code) do update set label = excluded.label, default_category = excluded.default_category;

with pack_fl as (
  insert into state_packs (state_code, version, enabled, support_level, notes)
  values ('FL', 'v1', true, 'production', 'Strongest precedent library in extracted corpus, especially purchase and option-style closings.')
  on conflict (state_code, version) do update
    set enabled = excluded.enabled,
        support_level = excluded.support_level,
        notes = excluded.notes
  returning id
)
select id from pack_fl;

insert into state_pack_structures (state_pack_id, structure_type)
select id, 'loan'
from state_packs
where state_code = 'FL' and version = 'v1'
on conflict (state_pack_id, structure_type) do nothing;

insert into state_pack_structures (state_pack_id, structure_type)
select id, 'purchase'
from state_packs
where state_code = 'FL' and version = 'v1'
on conflict (state_pack_id, structure_type) do nothing;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'loan',
  'term_sheet',
  'core_legal',
  'term_sheet',
  'required',
  ''
from state_packs
where state_code = 'FL' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'loan',
  'commercial_application',
  'core_legal',
  'due_diligence',
  'required',
  ''
from state_packs
where state_code = 'FL' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'loan',
  'borrower_authorization',
  'core_legal',
  'due_diligence',
  'required',
  ''
from state_packs
where state_code = 'FL' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'loan',
  'promissory_note',
  'core_legal',
  'legal_review',
  'required',
  ''
from state_packs
where state_code = 'FL' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'loan',
  'mortgage',
  'title_recorded',
  'legal_review',
  'required',
  ''
from state_packs
where state_code = 'FL' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'loan',
  'closing_statement',
  'closing_settlement',
  'closing',
  'required',
  ''
from state_packs
where state_code = 'FL' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'purchase',
  'term_sheet',
  'core_legal',
  'term_sheet',
  'required',
  ''
from state_packs
where state_code = 'FL' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'purchase',
  'purchase_agreement',
  'core_legal',
  'legal_review',
  'required',
  ''
from state_packs
where state_code = 'FL' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'purchase',
  'option_agreement',
  'core_legal',
  'legal_review',
  'required',
  ''
from state_packs
where state_code = 'FL' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'purchase',
  'lease_agreement',
  'core_legal',
  'legal_review',
  'required',
  ''
from state_packs
where state_code = 'FL' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'purchase',
  'jv_agreement',
  'entity_jv',
  'legal_review',
  'required',
  ''
from state_packs
where state_code = 'FL' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'purchase',
  'warranty_deed',
  'title_recorded',
  'closing',
  'required',
  ''
from state_packs
where state_code = 'FL' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'purchase',
  'closing_statement',
  'closing_settlement',
  'closing',
  'required',
  ''
from state_packs
where state_code = 'FL' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_checklist_items (
  state_pack_id,
  code,
  label,
  stage,
  required_for
)
select
  id,
  'ids',
  'Collect IDs for guarantors and spouses if applicable',
  'due_diligence',
  '{"loan","purchase"}'
from state_packs
where state_code = 'FL' and version = 'v1'
on conflict (state_pack_id, code) do update
  set label = excluded.label,
      stage = excluded.stage,
      required_for = excluded.required_for;

insert into state_pack_checklist_items (
  state_pack_id,
  code,
  label,
  stage,
  required_for
)
select
  id,
  'entity_docs',
  'Collect entity formation and authority documents',
  'due_diligence',
  '{"loan","purchase"}'
from state_packs
where state_code = 'FL' and version = 'v1'
on conflict (state_pack_id, code) do update
  set label = excluded.label,
      stage = excluded.stage,
      required_for = excluded.required_for;

insert into state_pack_checklist_items (
  state_pack_id,
  code,
  label,
  stage,
  required_for
)
select
  id,
  'insurance',
  'Collect insurance certificate or declarations page',
  'due_diligence',
  '{"loan","purchase"}'
from state_packs
where state_code = 'FL' and version = 'v1'
on conflict (state_pack_id, code) do update
  set label = excluded.label,
      stage = excluded.stage,
      required_for = excluded.required_for;

insert into state_pack_checklist_items (
  state_pack_id,
  code,
  label,
  stage,
  required_for
)
select
  id,
  'title_order',
  'Order and review title',
  'packet_build',
  '{"loan","purchase"}'
from state_packs
where state_code = 'FL' and version = 'v1'
on conflict (state_pack_id, code) do update
  set label = excluded.label,
      stage = excluded.stage,
      required_for = excluded.required_for;

insert into state_pack_checklist_items (
  state_pack_id,
  code,
  label,
  stage,
  required_for
)
select
  id,
  'valuation',
  'Order valuation, BPO, appraisal, or desktop review',
  'packet_build',
  '{"loan","purchase"}'
from state_packs
where state_code = 'FL' and version = 'v1'
on conflict (state_pack_id, code) do update
  set label = excluded.label,
      stage = excluded.stage,
      required_for = excluded.required_for;

with pack_in as (
  insert into state_packs (state_code, version, enabled, support_level, notes)
  values ('IN', 'v1', true, 'provisional', 'Phase 1 enabled through the common workflow and checklist model. Legal templates should be attached after state review.')
  on conflict (state_code, version) do update
    set enabled = excluded.enabled,
        support_level = excluded.support_level,
        notes = excluded.notes
  returning id
)
select id from pack_in;

insert into state_pack_structures (state_pack_id, structure_type)
select id, 'loan'
from state_packs
where state_code = 'IN' and version = 'v1'
on conflict (state_pack_id, structure_type) do nothing;

insert into state_pack_structures (state_pack_id, structure_type)
select id, 'purchase'
from state_packs
where state_code = 'IN' and version = 'v1'
on conflict (state_pack_id, structure_type) do nothing;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'loan',
  'term_sheet',
  'core_legal',
  'term_sheet',
  'required',
  ''
from state_packs
where state_code = 'IN' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'loan',
  'commercial_application',
  'core_legal',
  'due_diligence',
  'required',
  ''
from state_packs
where state_code = 'IN' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'loan',
  'borrower_authorization',
  'core_legal',
  'due_diligence',
  'required',
  ''
from state_packs
where state_code = 'IN' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'loan',
  'promissory_note',
  'core_legal',
  'legal_review',
  'placeholder',
  'Needs Indiana-reviewed template.'
from state_packs
where state_code = 'IN' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'loan',
  'mortgage',
  'title_recorded',
  'legal_review',
  'placeholder',
  'Needs Indiana-reviewed recorded instrument template.'
from state_packs
where state_code = 'IN' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'purchase',
  'purchase_agreement',
  'core_legal',
  'legal_review',
  'placeholder',
  ''
from state_packs
where state_code = 'IN' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'purchase',
  'option_agreement',
  'core_legal',
  'legal_review',
  'placeholder',
  ''
from state_packs
where state_code = 'IN' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'purchase',
  'lease_agreement',
  'core_legal',
  'legal_review',
  'placeholder',
  ''
from state_packs
where state_code = 'IN' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'purchase',
  'warranty_deed',
  'title_recorded',
  'closing',
  'placeholder',
  ''
from state_packs
where state_code = 'IN' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'loan',
  'closing_statement',
  'closing_settlement',
  'closing',
  'required',
  ''
from state_packs
where state_code = 'IN' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'purchase',
  'closing_statement',
  'closing_settlement',
  'closing',
  'required',
  ''
from state_packs
where state_code = 'IN' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_checklist_items (
  state_pack_id,
  code,
  label,
  stage,
  required_for
)
select
  id,
  'ids',
  'Collect IDs for guarantors and spouses if applicable',
  'due_diligence',
  '{"loan","purchase"}'
from state_packs
where state_code = 'IN' and version = 'v1'
on conflict (state_pack_id, code) do update
  set label = excluded.label,
      stage = excluded.stage,
      required_for = excluded.required_for;

insert into state_pack_checklist_items (
  state_pack_id,
  code,
  label,
  stage,
  required_for
)
select
  id,
  'entity_docs',
  'Collect entity formation and authority documents',
  'due_diligence',
  '{"loan","purchase"}'
from state_packs
where state_code = 'IN' and version = 'v1'
on conflict (state_pack_id, code) do update
  set label = excluded.label,
      stage = excluded.stage,
      required_for = excluded.required_for;

insert into state_pack_checklist_items (
  state_pack_id,
  code,
  label,
  stage,
  required_for
)
select
  id,
  'title_order',
  'Order and review title',
  'packet_build',
  '{"loan","purchase"}'
from state_packs
where state_code = 'IN' and version = 'v1'
on conflict (state_pack_id, code) do update
  set label = excluded.label,
      stage = excluded.stage,
      required_for = excluded.required_for;

insert into state_pack_checklist_items (
  state_pack_id,
  code,
  label,
  stage,
  required_for
)
select
  id,
  'valuation',
  'Order valuation, BPO, appraisal, or desktop review',
  'packet_build',
  '{"loan","purchase"}'
from state_packs
where state_code = 'IN' and version = 'v1'
on conflict (state_pack_id, code) do update
  set label = excluded.label,
      stage = excluded.stage,
      required_for = excluded.required_for;

with pack_oh as (
  insert into state_packs (state_code, version, enabled, support_level, notes)
  values ('OH', 'v1', true, 'provisional', 'Phase 1 enabled through the common workflow and checklist model. Legal templates should be attached after state review.')
  on conflict (state_code, version) do update
    set enabled = excluded.enabled,
        support_level = excluded.support_level,
        notes = excluded.notes
  returning id
)
select id from pack_oh;

insert into state_pack_structures (state_pack_id, structure_type)
select id, 'loan'
from state_packs
where state_code = 'OH' and version = 'v1'
on conflict (state_pack_id, structure_type) do nothing;

insert into state_pack_structures (state_pack_id, structure_type)
select id, 'purchase'
from state_packs
where state_code = 'OH' and version = 'v1'
on conflict (state_pack_id, structure_type) do nothing;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'loan',
  'term_sheet',
  'core_legal',
  'term_sheet',
  'required',
  ''
from state_packs
where state_code = 'OH' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'loan',
  'commercial_application',
  'core_legal',
  'due_diligence',
  'required',
  ''
from state_packs
where state_code = 'OH' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'loan',
  'borrower_authorization',
  'core_legal',
  'due_diligence',
  'required',
  ''
from state_packs
where state_code = 'OH' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'loan',
  'promissory_note',
  'core_legal',
  'legal_review',
  'placeholder',
  'Needs Ohio-reviewed template.'
from state_packs
where state_code = 'OH' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'loan',
  'mortgage',
  'title_recorded',
  'legal_review',
  'placeholder',
  'Needs Ohio-reviewed recorded instrument template.'
from state_packs
where state_code = 'OH' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'purchase',
  'purchase_agreement',
  'core_legal',
  'legal_review',
  'placeholder',
  ''
from state_packs
where state_code = 'OH' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'purchase',
  'option_agreement',
  'core_legal',
  'legal_review',
  'placeholder',
  ''
from state_packs
where state_code = 'OH' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'purchase',
  'lease_agreement',
  'core_legal',
  'legal_review',
  'placeholder',
  ''
from state_packs
where state_code = 'OH' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'purchase',
  'warranty_deed',
  'title_recorded',
  'closing',
  'placeholder',
  ''
from state_packs
where state_code = 'OH' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'loan',
  'closing_statement',
  'closing_settlement',
  'closing',
  'required',
  ''
from state_packs
where state_code = 'OH' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'purchase',
  'closing_statement',
  'closing_settlement',
  'closing',
  'required',
  ''
from state_packs
where state_code = 'OH' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_checklist_items (
  state_pack_id,
  code,
  label,
  stage,
  required_for
)
select
  id,
  'ids',
  'Collect IDs for guarantors and spouses if applicable',
  'due_diligence',
  '{"loan","purchase"}'
from state_packs
where state_code = 'OH' and version = 'v1'
on conflict (state_pack_id, code) do update
  set label = excluded.label,
      stage = excluded.stage,
      required_for = excluded.required_for;

insert into state_pack_checklist_items (
  state_pack_id,
  code,
  label,
  stage,
  required_for
)
select
  id,
  'entity_docs',
  'Collect entity formation and authority documents',
  'due_diligence',
  '{"loan","purchase"}'
from state_packs
where state_code = 'OH' and version = 'v1'
on conflict (state_pack_id, code) do update
  set label = excluded.label,
      stage = excluded.stage,
      required_for = excluded.required_for;

insert into state_pack_checklist_items (
  state_pack_id,
  code,
  label,
  stage,
  required_for
)
select
  id,
  'title_order',
  'Order and review title',
  'packet_build',
  '{"loan","purchase"}'
from state_packs
where state_code = 'OH' and version = 'v1'
on conflict (state_pack_id, code) do update
  set label = excluded.label,
      stage = excluded.stage,
      required_for = excluded.required_for;

insert into state_pack_checklist_items (
  state_pack_id,
  code,
  label,
  stage,
  required_for
)
select
  id,
  'valuation',
  'Order valuation, BPO, appraisal, or desktop review',
  'packet_build',
  '{"loan","purchase"}'
from state_packs
where state_code = 'OH' and version = 'v1'
on conflict (state_pack_id, code) do update
  set label = excluded.label,
      stage = excluded.stage,
      required_for = excluded.required_for;

with pack_tx as (
  insert into state_packs (state_code, version, enabled, support_level, notes)
  values ('TX', 'v1', true, 'production', 'Good purchase precedent set with option, JV, deed, closing package, title, and funding instructions.')
  on conflict (state_code, version) do update
    set enabled = excluded.enabled,
        support_level = excluded.support_level,
        notes = excluded.notes
  returning id
)
select id from pack_tx;

insert into state_pack_structures (state_pack_id, structure_type)
select id, 'loan'
from state_packs
where state_code = 'TX' and version = 'v1'
on conflict (state_pack_id, structure_type) do nothing;

insert into state_pack_structures (state_pack_id, structure_type)
select id, 'purchase'
from state_packs
where state_code = 'TX' and version = 'v1'
on conflict (state_pack_id, structure_type) do nothing;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'loan',
  'term_sheet',
  'core_legal',
  'term_sheet',
  'required',
  ''
from state_packs
where state_code = 'TX' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'loan',
  'commercial_application',
  'core_legal',
  'due_diligence',
  'required',
  ''
from state_packs
where state_code = 'TX' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'loan',
  'promissory_note',
  'core_legal',
  'legal_review',
  'required',
  ''
from state_packs
where state_code = 'TX' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'loan',
  'mortgage_or_deed_of_trust',
  'title_recorded',
  'legal_review',
  'required',
  ''
from state_packs
where state_code = 'TX' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'loan',
  'closing_statement',
  'closing_settlement',
  'closing',
  'required',
  ''
from state_packs
where state_code = 'TX' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'purchase',
  'term_sheet',
  'core_legal',
  'term_sheet',
  'required',
  ''
from state_packs
where state_code = 'TX' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'purchase',
  'purchase_agreement',
  'core_legal',
  'legal_review',
  'required',
  ''
from state_packs
where state_code = 'TX' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'purchase',
  'option_agreement',
  'core_legal',
  'legal_review',
  'required',
  ''
from state_packs
where state_code = 'TX' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'purchase',
  'jv_agreement',
  'entity_jv',
  'legal_review',
  'required',
  ''
from state_packs
where state_code = 'TX' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'purchase',
  'warranty_deed',
  'title_recorded',
  'closing',
  'required',
  ''
from state_packs
where state_code = 'TX' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'purchase',
  'closing_instructions',
  'funding_escrow',
  'legal_review',
  'optional',
  ''
from state_packs
where state_code = 'TX' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  'purchase',
  'closing_statement',
  'closing_settlement',
  'closing',
  'required',
  ''
from state_packs
where state_code = 'TX' and version = 'v1'
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;

insert into state_pack_checklist_items (
  state_pack_id,
  code,
  label,
  stage,
  required_for
)
select
  id,
  'ids',
  'Collect IDs for guarantors and spouses if applicable',
  'due_diligence',
  '{"loan","purchase"}'
from state_packs
where state_code = 'TX' and version = 'v1'
on conflict (state_pack_id, code) do update
  set label = excluded.label,
      stage = excluded.stage,
      required_for = excluded.required_for;

insert into state_pack_checklist_items (
  state_pack_id,
  code,
  label,
  stage,
  required_for
)
select
  id,
  'entity_docs',
  'Collect entity formation and authority documents',
  'due_diligence',
  '{"loan","purchase"}'
from state_packs
where state_code = 'TX' and version = 'v1'
on conflict (state_pack_id, code) do update
  set label = excluded.label,
      stage = excluded.stage,
      required_for = excluded.required_for;

insert into state_pack_checklist_items (
  state_pack_id,
  code,
  label,
  stage,
  required_for
)
select
  id,
  'title_order',
  'Order and review title',
  'packet_build',
  '{"loan","purchase"}'
from state_packs
where state_code = 'TX' and version = 'v1'
on conflict (state_pack_id, code) do update
  set label = excluded.label,
      stage = excluded.stage,
      required_for = excluded.required_for;

insert into state_pack_checklist_items (
  state_pack_id,
  code,
  label,
  stage,
  required_for
)
select
  id,
  'valuation',
  'Order valuation, BPO, appraisal, or desktop review',
  'packet_build',
  '{"loan","purchase"}'
from state_packs
where state_code = 'TX' and version = 'v1'
on conflict (state_pack_id, code) do update
  set label = excluded.label,
      stage = excluded.stage,
      required_for = excluded.required_for;
