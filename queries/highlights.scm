; Keywords
[
  "let"
  "use"
  "law"
  "preserves"
  "when"
  "always"
  "never"
  "decreases"
  "instance"
  "default"
  "with"
  "using"
] @keyword

[
  "as"
  "in"
  "move"
] @keyword.operator

[
  "panic"
  "todo"
] @keyword.exception

[
  "type"
  "trait"
] @keyword.type

; Function Keywords
"fn" @keyword.function

; Imports & Foreign Boundaries
[
  "import"
  "extern"
] @keyword.import

; Conditionals
[
  "case"
  "if"
  "else"
] @keyword.conditional

; Loops
[
  "for"
  "while"
] @keyword.repeat

; Return
"return" @keyword.return

; Concurrency & Views
[
  "view"
  "fork"
  "join"
] @keyword.coroutine

; Type & Ownership Qualifiers
[
  "const"
  "once"
  (opacity_modifier)
  (visibility_modifier)
  (mutable_modifier)
  (borrow_mode)
] @keyword.modifier

; Attributes (`@layout(aosoa(8))`, `@external(rust, ...)`)
(attribute
  "@" @attribute
  name: (_) @attribute)

(attribute
  arguments: (arguments
    (argument
      value: (identifier) @attribute.builtin)))

(attribute
  arguments: (arguments
    (argument
      value: (function_call
        function: (identifier) @attribute.builtin))))

; Punctuation
[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
  ".{"
] @punctuation.bracket

[
  ","
  "."
  ":"
  ";"
  "->"
  "=>"
  "<-"
] @punctuation.delimiter

[
  "@"
  "?"
] @punctuation.special

; Operators
[
  "%"
  "%="
  "&"
  "&&"
  "*"
  "*="
  "*%"
  "*|"
  "+"
  "+="
  "+%"
  "+|"
  "-"
  "-="
  "-%"
  "-|"
  ".."
  "..="
  "/"
  "/="
  "<"
  "<<"
  "<="
  "<>"
  "="
  "=="
  "!="
  "!"
  "~"
  "~>"
  ">"
  ">="
  ">>"
  "|"
  "|>"
  "||"
  "^"
] @operator

; Identifiers
(identifier) @variable

; Comments
(comment) @comment @spell

[
  (module_comment)
  (statement_comment)
] @comment.documentation @spell

; Unused Identifiers
[
  (discard)
  (hole)
] @comment

; Modules & Imports
(module) @module

(import_declaration
  alias: (_) @module)

(remote_type_identifier
  module: (identifier) @module)

(unqualified_import
  name: (_) @function)

; Strings & Escapes
(string) @string
(escape_sequence) @string.escape

; Numbers & Booleans
(integer) @number
(float) @number.float
(boolean) @boolean

; Constants
(constant
  name: (_) @constant)

((type_identifier) @constant
  (#match? @constant "^[A-Z][A-Z0-9_]+$"))

; Function Parameter Labels & Parameters
(function_call
  arguments: (arguments
    (argument
      label: (label) @label)))

(function_parameter
  label: (label)? @label
  name: (identifier) @variable.parameter)

(mutable_pattern
  name: (identifier) @variable)

; Records & Field Access
(record_field
  name: (label) @variable.member)

(record_field_init
  label: (label) @variable.member)

(record_pattern_argument
  label: (label) @variable.member)

(field_access
  field: (label) @variable.member)

(field_path
  (identifier) @variable.member)

(data_constructor_argument
  label: (label) @variable.member)

; Types & Traits
(primitive_type) @type.builtin

(int_range_type
  "Int" @type.builtin)

[
  (type_identifier)
  (type_parameter)
] @type

(type_var
  (identifier) @type)

(trait_parameter
  (identifier) @type)

(type_definition
  name: (type_identifier) @type.definition)

(trait_declaration
  name: (type_identifier) @type.definition)

([
  (type_identifier)
  (constructor_name)
] @type.builtin
  (#any-of? @type.builtin
    "Collection" "View" "Option" "Result" "String"
    "Vec" "Map" "Set" "Deque" "Ordering" "RustOwn"
    "Exclusive" "Shared" "Unit"))

; Tuples
(tuple_access
  index: (integer) @operator)

; Functions, Methods, Instances, & Laws
(function
  name: (identifier) @function)

(trait_method
  name: (identifier) @function.method)

(instance_declaration
  name: (identifier) @constant)

(using_expression
  (field_path
    (identifier) @constant))

(law_declaration
  name: (identifier) @function)

(function_call
  function: (identifier) @function.call)

((function_call
  function: (identifier) @function.builtin)
  (#any-of? @function.builtin
    "println" "print" "eprintln" "eprint"
    "min" "max" "map_in_place" "fold"))

((field_access
  record: (identifier) @module.builtin)
  (#any-of? @module.builtin
    "vec" "map" "set" "deque" "str" "io" "math" "cmp" "opt" "res" "traits"))

(function_call
  function: (field_access
    field: (label) @function.method.call))

(external_function
  name: (identifier) @function)

(extern_member_fn
  name: (identifier) @function)

(view_expression
  name: (identifier) @variable)

; Constructors
(constructor_name) @type @constructor

([
  (type_identifier)
  (constructor_name)
] @constant.builtin
  (#any-of? @constant.builtin "Ok" "Err" "Error" "Some" "None" "Lt" "Eq" "Gt"))

; Pipe Operator
(binary_expression
  operator: "|>"
  right: (identifier) @function.call)
