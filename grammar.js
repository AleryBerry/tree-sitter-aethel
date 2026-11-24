// Tree-sitter grammar for Aethel (based on tree-sitter-gleam node conventions,
// extended for Aethel's @layout(...) attributes, ~>.{...} path borrows, arbitrary-bit
// integers u1..u65535 / i1..i65535, Int(lo..=hi), records, views, fork/join, and laws).

const PREC = {
  PIPE: 1,
  RANGE: 2,
  OR: 3,
  AND: 4,
  CMP: 5,
  BIT_OR: 6,
  BIT_XOR: 7,
  BIT_AND: 8,
  SHIFT: 9,
  ADD: 10,
  MUL: 11,
  CAST: 12,
  UNARY: 13,
  POSTFIX: 14,
};

function sepBy1(sep, rule) {
  return seq(rule, repeat(seq(sep, rule)));
}

function sepBy(sep, rule) {
  return optional(sepBy1(sep, rule));
}

module.exports = grammar({
  name: "aethel",

  extras: ($) => [
    /\s/,
    $.module_comment,
    $.statement_comment,
    $.comment,
  ],

  word: ($) => $.identifier,

  conflicts: ($) => [
    [$.field_access, $.qualified_constructor],
  ],

  rules: {
    source_file: ($) => repeat($._definition),

    // Comments (Gleam-compatible node names)
    module_comment: (_) => token(seq("////", /.*/)),
    statement_comment: (_) => token(seq("///", /.*/)),
    comment: (_) => token(seq("//", /.*/)),

    // Attributes: `@layout(aosoa(8))`, `@layout(soa)`, `@simd`, etc.
    attribute: ($) =>
      prec.right(
        seq(
          "@",
          field("name", choice($.identifier, $.type_identifier)),
          optional(field("arguments", $.arguments)),
        ),
      ),

    visibility_modifier: (_) => "pub",
    opacity_modifier: (_) => "opaque",
    mutable_modifier: (_) => "mut",
    borrow_mode: (_) => choice("shared", "exclusive", "mut"),

    _definition: ($) =>
      choice(
        $.import_declaration,
        $.type_definition,
        $.trait_declaration,
        $.instance_declaration,
        $.function,
        $.constant,
        $.law_declaration,
        $.external_function,
        $.extern_block,
      ),

    // `import a/b/c.{x, y} as alias`
    import_declaration: ($) =>
      seq(
        repeat($.attribute),
        optional($.visibility_modifier),
        "import",
        field("module", $.module),
        optional($.unqualified_imports),
        optional(seq("as", field("alias", choice($.identifier, $.type_identifier)))),
      ),

    module: ($) =>
      prec.right(sepBy1(choice("/", "."), choice($.identifier, $.type_identifier))),

    unqualified_imports: ($) =>
      seq(
        ".{",
        sepBy(",", $.unqualified_import),
        optional(","),
        "}",
      ),

    unqualified_import: ($) =>
      field("name", choice($.identifier, $.type_identifier)),

    // `type Player { ... }` (record or ADT variants or alias or opaque)
    type_definition: ($) =>
      prec.right(
        seq(
          repeat($.attribute),
          optional($.visibility_modifier),
          optional($.opacity_modifier),
          "type",
          field("name", $.type_identifier),
          optional($.type_parameters),
          optional(seq("with", sepBy1(",", $.trait_constraint))),
          optional(
            choice(
              seq("=", field("value", $._type)),
              $.record_definition_body,
              $.data_constructors,
            ),
          ),
        ),
      ),

    type_parameters: ($) =>
      seq("(", sepBy1(",", $.type_parameter), optional(","), ")"),

    type_parameter: ($) => choice($.identifier, $.type_identifier),

    record_definition_body: ($) =>
      seq("{", repeat($.record_field), "}"),

    record_field: ($) =>
      seq(
        repeat($.attribute),
        optional($.visibility_modifier),
        optional($.mutable_modifier),
        field("name", $.label),
        ":",
        field("type", $._type),
        optional(","),
      ),

    data_constructors: ($) =>
      seq("{", repeat1($.data_constructor), "}"),

    data_constructor: ($) =>
      seq(
        repeat($.attribute),
        optional("|"),
        field("name", $.constructor_name),
        optional($.data_constructor_arguments),
        optional(","),
      ),

    data_constructor_arguments: ($) =>
      seq("(", sepBy1(",", $.data_constructor_argument), optional(","), ")"),

    data_constructor_argument: ($) =>
      seq(
        optional(seq(field("label", $.label), ":")),
        optional($.mutable_modifier),
        field("type", $._type),
      ),

    // `fn name(params) -> Ret with Trait(a) decreases expr { ... }`
    // or bodyless `@external(rust) pub fn name(params) -> Ret`
    function: ($) =>
      seq(
        repeat($.attribute),
        optional($.visibility_modifier),
        "fn",
        field("name", $.identifier),
        field("parameters", $.function_parameters),
        optional(seq("->", field("return_type", $._type))),
        repeat(
          choice(
            seq("with", sepBy1(",", $.trait_constraint)),
            seq("decreases", field("decreases", $._expression)),
          ),
        ),
        optional(field("body", $.block)),
      ),

    trait_declaration: ($) =>
      seq(
        repeat($.attribute),
        optional($.visibility_modifier),
        "trait",
        field("name", $.type_identifier),
        optional($.trait_parameters),
        optional(seq("<=", sepBy1(",", $.trait_constraint))),
        "{",
        repeat(choice($.trait_method, $.law_declaration)),
        "}",
      ),

    trait_parameters: ($) =>
      seq("(", sepBy1(",", $.trait_parameter), optional(","), ")"),

    trait_parameter: ($) =>
      seq(
        choice($.identifier, $.type_identifier),
        optional(seq("(", sepBy1(",", "_"), optional(","), ")")),
      ),

    trait_constraint: ($) =>
      prec.right(
        seq(
          choice($.type_identifier, $.remote_type_identifier),
          optional($.type_arguments),
        ),
      ),

    trait_method: ($) =>
      seq(
        repeat($.attribute),
        "fn",
        field("name", $.identifier),
        field("parameters", $.function_parameters),
        optional(seq("->", field("return_type", $._type))),
        repeat(seq("with", sepBy1(",", $.trait_constraint))),
        optional(field("body", $.block)),
        optional(";"),
      ),

    instance_declaration: ($) =>
      seq(
        repeat($.attribute),
        optional($.visibility_modifier),
        optional("default"),
        "instance",
        optional(seq(field("name", $.identifier), ":")),
        field("trait", $.trait_constraint),
        optional(seq("with", sepBy1(",", $.trait_constraint))),
        optional(seq("{", repeat($.function), "}")),
      ),

    function_parameters: ($) =>
      seq("(", sepBy(",", $.function_parameter), optional(","), ")"),

    function_parameter: ($) =>
      choice(
        seq(
          optional($.mutable_modifier),
          field("name", choice($.identifier, $.discard)),
          optional(seq(":", field("type", $._type))),
        ),
        seq(
          field("label", $.label),
          optional($.mutable_modifier),
          field("name", choice($.identifier, $.discard)),
          optional(seq(":", field("type", $._type))),
        ),
      ),

    // `const MAX_HP: u8 = 100`
    constant: ($) =>
      seq(
        repeat($.attribute),
        optional($.visibility_modifier),
        "const",
        field("name", choice($.identifier, $.type_identifier)),
        optional(seq(":", field("type", $._type))),
        "=",
        field("value", $._expression),
        optional(";"),
      ),

    // `law name(params) { preserves ... when ... always ... never ... }`
    law_declaration: ($) =>
      seq(
        repeat($.attribute),
        optional($.visibility_modifier),
        "law",
        field("name", $.identifier),
        field("parameters", $.function_parameters),
        "{",
        repeat($.law_clause),
        "}",
      ),

    law_clause: ($) =>
      choice(
        seq("preserves", sepBy1(",", $.field_path), optional(";")),
        seq("when", $._expression, optional(";")),
        seq("always", $._expression, optional(";")),
        seq("never", $._expression, optional(";")),
        seq($._expression, optional(";")),
      ),

    field_path: ($) =>
      prec.right(sepBy1(".", choice($.identifier, $.type_identifier, $.integer))),

    // `extern "rust" fn ...` or `extern "rust" { fn ... }`
    external_function: ($) =>
      seq(
        repeat($.attribute),
        optional($.visibility_modifier),
        "extern",
        field("abi", $.string),
        optional($.visibility_modifier),
        "fn",
        field("name", $.identifier),
        field("parameters", $.function_parameters),
        optional(seq("->", field("return_type", $._type))),
        optional(";"),
      ),

    extern_block: ($) =>
      seq(
        repeat($.attribute),
        optional($.visibility_modifier),
        "extern",
        field("abi", $.string),
        "{",
        repeat($.extern_member_fn),
        "}",
      ),

    extern_member_fn: ($) =>
      seq(
        repeat($.attribute),
        optional($.visibility_modifier),
        "fn",
        field("name", $.identifier),
        field("parameters", $.function_parameters),
        optional(seq("->", field("return_type", $._type))),
        optional(";"),
      ),

    // Types
    _type: ($) =>
      choice(
        $.primitive_type,
        $.int_range_type,
        $.path_borrow_type,
        $.function_type,
        $.slice_type,
        $.tuple_type,
        $.named_type,
        $.type_var,
        $.hole,
      ),

    primitive_type: (_) =>
      token(choice(/[ui][1-9][0-9]*/, "f32", "f64", "bool")),

    int_range_type: ($) =>
      prec(2, seq("Int", "(", field("range", $._expression), ")")),

    named_type: ($) =>
      prec.right(
        seq(
          choice($.type_identifier, $.remote_type_identifier),
          optional($.type_arguments),
        ),
      ),

    remote_type_identifier: ($) =>
      seq(
        field("module", $.identifier),
        ".",
        field("name", $.type_identifier),
      ),

    type_arguments: ($) =>
      seq("(", sepBy1(",", $._type), optional(","), ")"),

    path_borrow_type: ($) =>
      prec.left(
        1,
        seq(
          field("base", $._type),
          "~>",
          optional($.borrow_mode),
          ".",
          choice(
            $.field_path,
            seq("{", sepBy1(",", $.field_path), optional(","), "}"),
          ),
        ),
      ),

    slice_type: ($) =>
      seq("[", optional($.mutable_modifier), field("element", $._type), "]"),

    tuple_type: ($) =>
      seq("(", sepBy(",", $._type), optional(","), ")"),

    function_type: ($) =>
      seq(
        optional("once"),
        "fn",
        "(",
        sepBy(",", $._type),
        optional(","),
        ")",
        "->",
        field("return_type", $._type),
      ),

    type_var: ($) => prec.right(seq($.identifier, optional($.type_arguments))),
    hole: (_) => "_",

    // Blocks & Statements
    block: ($) =>
      seq("{", repeat($._statement), "}"),

    _statement: ($) =>
      choice(
        $.let,
        $.use,
        $.return_statement,
        $.while_statement,
        $.for_statement,
        $.assign_statement,
        $.expression_statement,
      ),

    let: ($) =>
      seq(
        repeat($.attribute),
        "let",
        field("pattern", $._pattern),
        optional(seq(":", field("type", $._type))),
        "=",
        field("value", $._expression),
        optional(";"),
      ),

    use: ($) =>
      seq(
        repeat($.attribute),
        "use",
        sepBy(",", $._pattern),
        "<-",
        field("value", $._expression),
        optional(";"),
      ),

    return_statement: ($) =>
      prec.right(seq("return", optional(field("value", $._expression)), optional(";"))),

    while_statement: ($) =>
      seq(
        "while",
        field("condition", $._expression),
        optional(seq("decreases", field("decreases", $._expression))),
        field("body", $.block),
        optional(";"),
      ),

    for_statement: ($) =>
      seq(
        "for",
        field("pattern", $._pattern),
        "in",
        field("iterable", $._expression),
        optional(seq("decreases", field("decreases", $._expression))),
        field("body", $.block),
        optional(";"),
      ),

    assign_statement: ($) =>
      prec.right(
        1,
        seq(
          field("target", $._expression),
          field("operator", choice("=", "+=", "-=", "*=", "/=", "%=")),
          field("value", $._expression),
          optional(";"),
        ),
      ),

    expression_statement: ($) =>
      seq(repeat($.attribute), $._expression, optional(";")),

    // Patterns
    _pattern: ($) =>
      choice(
        $.or_pattern,
        $.alias_pattern,
        $.range_pattern,
        $._single_pattern,
      ),

    or_pattern: ($) =>
      prec.left(1, seq($._pattern, "|", $._pattern)),

    alias_pattern: ($) =>
      prec.left(2, seq($._pattern, "as", field("alias", $.identifier))),

    range_pattern: ($) =>
      prec.left(3, seq($._single_pattern, choice("..", "..="), $._single_pattern)),

    _single_pattern: ($) =>
      choice(
        $.discard,
        $.hole,
        $.mutable_pattern,
        $.identifier,
        $.record_pattern,
        $.literal_pattern,
        $.tuple_pattern,
        $.list_pattern,
      ),

    mutable_pattern: ($) =>
      seq($.mutable_modifier, field("name", $.identifier)),

    record_pattern: ($) =>
      seq(
        field(
          "name",
          choice(
            $.constructor_name,
            seq(field("module", choice($.identifier, $.type_identifier)), ".", $.constructor_name),
            seq(field("module", $.identifier), ".", $.type_identifier, ".", $.constructor_name),
          ),
        ),
        optional(
          choice(
            seq("(", sepBy(",", $.record_pattern_argument), optional(","), ")"),
            seq("{", sepBy(",", $.record_pattern_argument), optional(","), "}"),
          ),
        ),
      ),

    record_pattern_argument: ($) =>
      choice(
        "..",
        seq(optional(seq(field("label", $.label), ":")), field("pattern", $._pattern)),
      ),

    literal_pattern: ($) =>
      choice(
        seq(optional("-"), $.integer),
        seq(optional("-"), $.float),
        $.string,
        $.boolean,
      ),

    tuple_pattern: ($) =>
      seq("(", sepBy(",", $._pattern), optional(","), ")"),

    list_pattern: ($) =>
      seq(
        "[",
        sepBy(",", $._pattern),
        optional(seq(optional(","), "..", optional(field("assign", choice($.identifier, $.discard))))),
        optional(","),
        "]",
      ),

    // Expressions
    _expression: ($) =>
      choice(
        $.binary_expression,
        $.unary_expression,
        $.cast_expression,
        $.using_expression,
        $.function_call,
        $.field_access,
        $.tuple_access,
        $.index_expression,
        $.try_expression,
        $.record,
        $.if_expression,
        $.case,
        $.view_expression,
        $.fork_expression,
        $.anonymous_function,
        $.block,
        $.tuple,
        $.list,
        $.todo,
        $.panic,
        $.integer,
        $.float,
        $.string,
        $.boolean,
        $.identifier,
        $.constructor_name,
        $.discard,
        $.hole,
      ),

    unary_expression: ($) =>
      prec(
        PREC.UNARY,
        seq(
          field("operator", choice("-", "!", "~", "move", "&")),
          field("value", $._expression),
        ),
      ),

    cast_expression: ($) =>
      prec.left(
        PREC.CAST,
        seq(
          field("value", $._expression),
          "as",
          field("type", $._type),
        ),
      ),

    using_expression: ($) =>
      prec.left(
        PREC.CAST,
        seq(
          field("value", $._expression),
          "using",
          choice(
            $.field_path,
            seq(".{", sepBy1(",", $.field_path), optional(","), "}"),
            seq("{", sepBy1(",", $.field_path), optional(","), "}"),
          ),
        ),
      ),

    binary_expression: ($) => {
      const table = [
        [PREC.PIPE, "|>"],
        [PREC.RANGE, choice("..", "..=")],
        [PREC.OR, "||"],
        [PREC.AND, "&&"],
        [PREC.CMP, choice("==", "!=", "<", "<=", ">", ">=")],
        [PREC.BIT_OR, "|"],
        [PREC.BIT_XOR, "^"],
        [PREC.BIT_AND, "&"],
        [PREC.SHIFT, choice("<<", ">>")],
        [PREC.ADD, choice("+", "-", "+%", "-%", "+|", "-|", "<>")],
        [PREC.MUL, choice("*", "/", "%", "*%", "*|")],
      ];
      return choice(
        ...table.map(([precedence, operator]) =>
          prec.left(
            precedence,
            seq(
              field("left", $._expression),
              field("operator", operator),
              field("right", $._expression),
            ),
          ),
        ),
      );
    },

    function_call: ($) =>
      prec(
        PREC.POSTFIX,
        seq(
          field("function", $._expression),
          field("arguments", $.arguments),
        ),
      ),

    arguments: ($) =>
      seq("(", sepBy(",", $.argument), optional(","), ")"),

    argument: ($) =>
      seq(
        optional(seq(field("label", $.label), ":")),
        field("value", $._expression),
      ),

    field_access: ($) =>
      prec.left(
        PREC.POSTFIX,
        seq(
          field("record", $._expression),
          ".",
          field("field", choice($.label, $.constructor_name)),
        ),
      ),

    tuple_access: ($) =>
      prec.left(
        PREC.POSTFIX,
        seq(
          field("tuple", $._expression),
          ".",
          field("index", $.integer),
        ),
      ),

    index_expression: ($) =>
      prec(
        PREC.POSTFIX,
        seq(
          field("target", $._expression),
          "[",
          field("index", $._expression),
          "]",
        ),
      ),

    try_expression: ($) =>
      prec(PREC.POSTFIX, seq(field("value", $._expression), "?")),

    qualified_constructor: ($) =>
      prec.left(
        PREC.POSTFIX,
        seq(field("module", $._expression), ".", field("name", $.constructor_name)),
      ),

    // Record literal: `Player { pos: 100, delta: -15 }` or `v2.Vec2 { x: 1, y: 2 }`
    record: ($) =>
      prec(
        PREC.POSTFIX,
        seq(
          field("name", choice($.constructor_name, $.qualified_constructor)),
          "{",
          sepBy(",", $.record_field_init),
          optional(","),
          "}",
        ),
      ),

    record_field_init: ($) =>
      seq(
        field("label", $.label),
        optional(seq(":", field("value", $._expression))),
      ),

    if_expression: ($) =>
      prec.right(
        seq(
          "if",
          field("condition", $._expression),
          field("consequence", $.block),
          optional(
            seq(
              "else",
              field("alternative", choice($.if_expression, $.block)),
            ),
          ),
        ),
      ),

    case: ($) =>
      seq(
        "case",
        field("subjects", sepBy1(",", $._expression)),
        "{",
        repeat($.case_clause),
        "}",
      ),

    case_clause: ($) =>
      seq(
        field("patterns", sepBy1("|", $.case_clause_patterns)),
        optional(seq("if", field("guard", $._expression))),
        choice("->", "=>"),
        field("value", $._expression),
        optional(choice(",", ";")),
      ),

    case_clause_patterns: ($) =>
      sepBy1(",", $._pattern),

    view_expression: ($) =>
      choice(
        seq(
          "view",
          optional($.borrow_mode),
          field("name", $.identifier),
          "=",
          field("target", $._expression),
          field("body", $.block),
        ),
        seq(
          "view",
          optional($.borrow_mode),
          field("target", $._expression),
          field("body", $.block),
        ),
      ),

    fork_expression: ($) =>
      prec.right(
        seq(
          "fork",
          "{",
          repeat($.block),
          "}",
          optional("join"),
        ),
      ),

    anonymous_function: ($) =>
      seq(
        optional("once"),
        "fn",
        field("parameters", $.function_parameters),
        optional(seq("->", field("return_type", $._type))),
        field("body", $.block),
      ),

    tuple: ($) =>
      seq("(", sepBy(",", $._expression), optional(","), ")"),

    list: ($) =>
      seq("[", sepBy(",", $._expression), optional(","), "]"),

    todo: ($) =>
      prec.right(
        seq(
          "todo",
          optional(choice(seq("as", $._expression), seq("(", optional($._expression), ")"))),
        ),
      ),

    panic: ($) =>
      prec.right(
        seq(
          "panic",
          optional(choice(seq("as", $._expression), seq("(", optional($._expression), ")"))),
        ),
      ),

    // Terminals & Lexemes
    integer: (_) =>
      token(
        choice(
          /0[xX][0-9a-fA-F_]+([ui][1-9][0-9]*)?/,
          /0[bB][01_]+([ui][1-9][0-9]*)?/,
          /0[oO][0-7_]+([ui][1-9][0-9]*)?/,
          /[0-9][0-9_]*(_?[ui][1-9][0-9]*)?/,
        ),
      ),

    float: (_) =>
      token(
        /[0-9][0-9_]*\.[0-9][0-9_]*([eE][+-]?[0-9_]+)?(_?f(32|64))?/,
      ),

    string: ($) =>
      seq(
        '"',
        repeat(choice($.string_content, $.escape_sequence)),
        '"',
      ),

    string_content: (_) => token.immediate(prec(1, /[^"\\]+/)),

    escape_sequence: (_) =>
      token.immediate(
        seq(
          "\\",
          choice(
            /[nrt0\\"']/,
            /x[0-9a-fA-F]{2}/,
            /u\{[0-9a-fA-F]{1,6}\}/,
            /./,
          ),
        ),
      ),

    boolean: (_) => choice("true", "false"),

    identifier: (_) => /[a-z][a-zA-Z0-9_]*/,
    label: ($) => $.identifier,
    discard: (_) => /_[a-zA-Z0-9_]+/,
    type_identifier: (_) => /[A-Z][a-zA-Z0-9_]*/,
    constructor_name: ($) => $.type_identifier,
  },
});
