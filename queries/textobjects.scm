(function
  body: (block) @function.inner) @function.outer

(trait_method) @function.outer

(anonymous_function
  body: (block) @function.inner) @function.outer

(type_definition) @class.outer
(record_definition_body) @class.inner
(data_constructors) @class.inner

(trait_declaration) @class.outer
(instance_declaration) @class.outer
(law_declaration) @class.outer

(if_expression
  consequence: (block) @conditional.inner) @conditional.outer

(case) @conditional.outer
(case_clause
  value: (_) @conditional.inner)

(for_statement
  body: (block) @loop.inner) @loop.outer

(while_statement
  body: (block) @loop.inner) @loop.outer

(function_parameter) @parameter.inner @parameter.outer
(argument) @parameter.inner @parameter.outer
