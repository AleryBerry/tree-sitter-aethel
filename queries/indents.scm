[
  (anonymous_function)
  (block)
  (case)
  (case_clause)
  (constant)
  (data_constructors)
  (extern_block)
  (for_statement)
  (function)
  (if_expression)
  (instance_declaration)
  (law_declaration)
  (let)
  (list)
  (record)
  (record_definition_body)
  (trait_declaration)
  (tuple)
  (type_definition)
  (unqualified_imports)
  (view_expression)
  (fork_expression)
  (while_statement)
] @indent.begin

[
  ")"
  "]"
  "}"
] @indent.end @indent.branch

((binary_expression
  operator: _ @_operator) @indent.begin
  (#not-eq? @_operator "|>"))
