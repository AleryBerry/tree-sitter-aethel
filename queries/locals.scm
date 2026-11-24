(let
  pattern: (identifier) @local.definition)

(mutable_pattern
  name: (identifier) @local.definition)

(alias_pattern
  alias: (identifier) @local.definition)

(for_statement
  pattern: (identifier) @local.definition)

(view_expression
  name: (identifier) @local.definition)

(list_pattern
  (identifier) @local.definition)

(list_pattern
  assign: (identifier) @local.definition)

(tuple_pattern
  (identifier) @local.definition)

(record_pattern_argument
  pattern: (identifier) @local.definition)

(function_parameter
  name: (identifier) @local.definition)

(identifier) @local.reference

[
  (block)
  (function)
  (trait_method)
  (anonymous_function)
  (case_clause)
  (for_statement)
  (while_statement)
  (view_expression)
  (law_declaration)
] @local.scope
